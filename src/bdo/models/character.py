from logging import getLogger
from datetime import datetime

import pytz
from django.contrib.postgres.fields import JSONField
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from bdo.models.content import CharacterClass
from bdo.models.mixins import UserPermissionMixin
from bdo.models.stats import AggregatedGuildMemberWarStats


logger = getLogger("bdo")


class Profile(models.Model, UserPermissionMixin):
    DEFAULT_AVAILABILITY_STATUS = 2     # From WarAttendance.AttendanceStatus.UNDECIDED.value
    DEFAULT_AVAILABILITY = {
        "Sunday": DEFAULT_AVAILABILITY_STATUS,
        "Monday": DEFAULT_AVAILABILITY_STATUS,
        "Tuesday": DEFAULT_AVAILABILITY_STATUS,
        "Wednesday": DEFAULT_AVAILABILITY_STATUS,
        "Thursday": DEFAULT_AVAILABILITY_STATUS,
        "Friday": DEFAULT_AVAILABILITY_STATUS,
        "Saturday": DEFAULT_AVAILABILITY_STATUS
    }

    family_name = models.CharField(max_length=255, blank=True, null=True, unique=True)
    preferences = JSONField(default={}, null=True, blank=True)
    user = models.OneToOneField(get_user_model(), null=True, blank=True, on_delete=models.SET_NULL)
    discord_id = models.CharField(max_length=255, null=True, blank=True)
    preferred_roles = models.ManyToManyField('WarRole', blank=True)
    availability = JSONField(default=DEFAULT_AVAILABILITY)
    auto_sign_up = models.BooleanField(default=False)
    npc_renown = models.IntegerField(default=0, validators=(MinValueValidator(0), MaxValueValidator(5)))
    region = models.ForeignKey("Region", null=True)

    class Meta:
        ordering = ('id',)
        unique_together = ('user', 'region')

    def __str__(self):
        main = self.get_main()

        if main is None:
            return self.family_name

        return u'{0} ({1})'.format(self.family_name, main.name)

    def user_can_edit(self, user):
        # Only the owner or a superuser can edit the profile
        return user.is_superuser or user == self.user

    def clean(self):
        super(Profile, self).clean()

        self.family_name = self.family_name.strip()

        if Profile.objects.filter(family_name__iexact=self.family_name, region=self.region).exclude(id=self.id).exists():
            raise ValidationError({"family_name": "Family name '{0}' already exists.".format(self.family_name)})

        if self.discord_id and not self.user:
            self.discord_id = None
        elif not self.discord_id and self.user:
            discord_account = self.user.socialaccount_set.filter(provider='discord_auth')

            if discord_account:
                self.discord_id = discord_account[0].extra_data['id']

        # Ensure availability fields contain valid values
        self.availability = {
            day: value
            for day, value in self.availability.items()
            if day in self.DEFAULT_AVAILABILITY and value in [0, 1, 2]
        }

    def save(self, *args, **kwargs):
        self.full_clean()

        super(Profile, self).save(*args, **kwargs)

    def refresh_guilds(self):
        from bdo.models.guild import Guild, GuildMember, GuildRole

        if not self.discord_id:
            return

        guilds = Guild.objects.filter(discord_members__has_key=self.discord_id)

        # Delete old guilds
        # Don't ever delete GMs
        count, _ = GuildMember.objects.exclude(role=GuildRole.guild_master()).filter(user=self).exclude(guild__in=guilds).delete()

        if count:
            logger.info("Removed {} from {} guilds".format(self, count))

        # Update and create new membership
        membership_role_mapping = {membership.guild: membership for membership in self.membership.all()}
        guild_role_mapping = {str(role.id): role for role in GuildRole.objects.all()}
        new_membership = []

        for guild in guilds:
            guild_role = guild_role_mapping[guild.discord_members[self.discord_id]]

            if guild not in membership_role_mapping:
                new_membership.append(GuildMember(guild=guild, user=self, role=guild_role))
            elif membership_role_mapping[guild].role == GuildRole.guild_master():
                # Don't update role if user is the Guild Master
                pass
            elif guild_role != membership_role_mapping[guild].role:
                membership_role_mapping[guild].role = guild_role
                membership_role_mapping[guild].save()

                logger.info("Changed {}'s role in {} to {}".format(self, guild, guild_role))

        for membership in new_membership:
            # Manually save new membership to trigger signal handlers
            membership.save()

        if new_membership:
            logger.info("Added {} to {} guilds".format(self, len(new_membership)))

    def get_main(self):
        for character in self.character_set.all():
            if character.is_main:
                return character
        return None

    @property
    def has_main(self):
        return self.get_main() is not None

    @property
    def renege_rate(self):
        """
        Likelihood for user to flake out and not actually attend a war they signed up for.

        Percentage is a combination of historical flake out rate and recent flake out rate
        with a bigger skew towards recent flake outs.
        """
        stats = self.user_stats
        historical_wars_attended = stats.wars_attended + stats.wars_reneged

        if historical_wars_attended == 0:
            historical_renege_rate = 0.0
        else:
            historical_renege_rate = stats.wars_reneged * 1.0 / (stats.wars_attended + stats.wars_reneged)

        # Use up to last 5 wars
        if hasattr(self, '_prefetched_recent_wars'):
            recent_wars = self._prefetched_recent_wars[:5]
        else:
            recent_wars = self.attendance_set.filter(is_attending__in=[0, 4, 5]).order_by('-war__date')[:5]
        recent_attended = 0
        recent_reneged = 0

        for attendance in recent_wars:
            if attendance.is_attending == 5:
                recent_reneged += 1
            recent_attended += 1

        if recent_attended == 0:
            recent_renege_rate = 0.0
        else:
            recent_renege_rate = recent_reneged * 1.0 / recent_attended

        return (historical_renege_rate * 0.3) + (recent_renege_rate * 0.7)

    def guild_attendance_rate(self, guild):
        """
        Calculate player's attendance rate.
        """
        try:
            stats = self.aggregatedmemberstats.get(guild=guild)
        except AggregatedGuildMemberWarStats.DoesNotExist:
            return 0.0

        total_wars = stats.wars_attended + stats.wars_unavailable + stats.wars_missed
        attendance_score = stats.wars_attended + (stats.wars_unavailable * 0.5)

        if total_wars == 0:
            return 0.0

        return attendance_score / total_wars

    def get_availability(self, date):
        timezone = pytz.timezone(self.region.timezone)
        day = datetime.strftime(timezone.localize(date), '%A')

        if not self.has_main or not self.auto_sign_up:
            return self.DEFAULT_AVAILABILITY_STATUS

        return self.availability.get(day, self.DEFAULT_AVAILABILITY_STATUS)


class Character(models.Model, UserPermissionMixin):
    name = models.CharField(max_length=255)
    character_class = models.ForeignKey(CharacterClass)
    profile = models.ForeignKey(Profile)
    level = models.IntegerField()
    ap = models.IntegerField()
    aap = models.IntegerField()
    dp = models.IntegerField()
    is_main = models.BooleanField(default=False)

    class Meta:
        ordering = ('id',)

    def __str__(self):
        return self.name

    def user_can_edit(self, user):
        # Only the owner or a superuser can edit the profile
        return user.is_superuser or user == self.profile.user
