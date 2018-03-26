from datetime import datetime, timedelta

from django.contrib.postgres.fields import JSONField
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models

from bdo.models.content import CharacterClass
from bdo.models.mixins import UserPermissionMixin


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
    user = models.OneToOneField(get_user_model(), null=True, blank=True)
    discord_id = models.CharField(max_length=255, null=True, blank=True)
    preferred_roles = models.ManyToManyField('WarRole', blank=True)
    availability = JSONField(default=DEFAULT_AVAILABILITY)
    auto_sign_up = models.BooleanField(default=False)

    class Meta:
        ordering = ('id',)
        unique_together = ('id', 'user')

    def __str__(self):
        try:
            main = self.character_set.get(is_main=True)
        except Character.DoesNotExist:
            return self.family_name

        return u'{0} ({1})'.format(self.family_name, main.name)

    @property
    def stats(self):
        fields = [
            'command_post',
            'fort',
            'gate',
            'help',
            'mount',
            'placed_objects',
            'guild_master',
            'officer',
            'member',
            'death',
            'siege_weapons',
        ]

        return self.attendance_set.aggregate(
            total_wars=models.Count('id'),
            **{'total_{0}'.format(field): models.Sum('stats__{0}'.format(field)) for field in fields}
        )

    def user_can_edit(self, user):
        # Only the owner or a superuser can edit the profile
        return user.is_superuser or user == self.user

    def clean(self):
        super(Profile, self).clean()

        if Profile.objects.filter(family_name__iexact=self.family_name).exclude(id=self.id).exists():
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
        GuildMember.objects.filter(user=self).exclude(guild__in=guilds).delete()

        # Update and create new membership
        membership_role_mapping = {membership.guild: membership for membership in self.membership.all()}
        guild_role_mapping = {str(role.id): role for role in GuildRole.objects.all()}
        new_membership = []

        for guild in guilds:
            guild_role = guild_role_mapping[guild.discord_members[self.discord_id]]

            if guild not in membership_role_mapping:
                new_membership.append(GuildMember(guild=guild, profile=self, role=guild_role))
            elif guild_role != membership_role_mapping[guild].role.id:
                membership_role_mapping[guild].role = guild_role
                membership_role_mapping[guild].save()

        GuildMember.objects.bulk_create(new_membership)

    def get_main(self):
        for character in self.character_set.all():
            if character.is_main:
                return character
        return None

    @property
    def has_main(self):
        return self.get_main() is not None

    def get_availability(self, date):
        day = datetime.strftime(date - timedelta(1), '%A')

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
