from dirtyfields import DirtyFieldsMixin
from django.contrib.auth.models import Group
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.db.models import Q, Avg, F, Case, Count, When

from bdo.models.character import Character
from bdo.models.war import War, WarRole


WAR_REMINDER_CHOICES = (
    (60, '60min before'),
    (30, '30min before'),
    (15, '15min before'),
    (-1, 'Disabled'),
)


class Guild(DirtyFieldsMixin, models.Model):
    name = models.CharField(max_length=255)
    logo_url = models.URLField()
    members = models.ManyToManyField("Profile", through='GuildMember', related_name='guilds')
    description = models.TextField(default='')
    region = models.ForeignKey("Region")

    # Discord fields
    discord_id = models.CharField(max_length=75)
    discord_roles = JSONField(default={
        "officer": None,
        "quartermaster": None,
        "member": None,
        "mercenary": None
    })
    discord_webhook = models.URLField(null=True, blank=True)
    discord_notifications = JSONField(default={
        "war_create": True,
        "war_cancel": True,
        "war_end": True,
    })
    discord_war_reminder = models.IntegerField(default=-1, choices=WAR_REMINDER_CHOICES)

    # Cached discord membership info
    discord_members = JSONField(default={})

    # Custom QuerySet
    # objects = models.Manager.from_queryset(GuildQuerySet)()

    class Meta:
        ordering = ('id',)
        permissions = (
            ("view_overview", "Can see overview page"),
            ("view_members", "Can see members page"),
            ("view_history", "Can see history page"),
            ("view_war", "Can see war page"),
            ("view_activity_log", "Can see guild activity log"),
            ("change_guild_info", "Can edit basic guild information"),
            ("change_guild_integration", "Can edit guild Discord integration"),
            ("change_member_attendance", "Can edit member's attendance"),
            ("change_my_attendance", "Can edit own attendance"),
            ("change_war", "Can modify war setup"),
            ("add_war", "Can start a pending war"),
            ("delete_war", "Can delete a pending war"),
            ("manage_team", "Can create, edit or delete teams"),
            ("manage_call_sign", "Can create, edit or delete call signs"),
        )
        unique_together = ('name', 'region')

    def __str__(self):
        return self.name

    def pending_war(self):
        war = War.objects.filter(guild=self).order_by('-date', '-id').first()

        if war is not None and war.outcome is None:
            return war.id
        else:
            return None

    @property
    def war_roles(self):
        return WarRole.objects.filter(Q(custom_for__isnull=True) | Q(custom_for=self))

    @property
    def guild_master(self):
            return self.membership.get(role__name="Guild Master").user

    @property
    def average_level(self):
        guild_characters = Character.objects.filter(is_main=True, profile__membership__guild=self)

        return guild_characters.aggregate(Avg('level'))['level__avg']

    @property
    def average_renown(self):
        guild_characters = Character.objects.filter(is_main=True, profile__membership__guild=self)
        gearscore_expression = (F('aap') + F('ap'))/2 + F('dp') + F('profile__npc_renown')

        return (guild_characters.annotate(gearscore=gearscore_expression)
                                .aggregate(Avg('gearscore'))['gearscore__avg'])

    @property
    def class_distribution(self):
        guild_characters = Character.objects.filter(is_main=True, profile__membership__guild=self)
        distributions = (guild_characters.values('character_class__name')
                                         .annotate(total=Count('character_class__name'))
                                         .order_by('total'))

        return {
            distribution['character_class__name'].lower(): distribution['total']
            for distribution in distributions
        }

    @property
    def member_count(self):
        return self.members.count()

    def get_membership(self, profile):
        try:
            return self.membership.get(user=profile)
        except GuildMember.DoesNotExist:
            return None

    def save(self, *args, **kwargs):
        if self.id:
            kwargs['update_fields'] = self.get_dirty_fields(check_relationship=True)

        return super(Guild, self).save(*args, **kwargs)


class GuildRole(Group):
    icon = models.ImageField(null=True, blank=True)
    custom_for = models.ForeignKey("Guild", null=True, blank=True, related_name='custom_guild_roles')

    class Meta:
        ordering = ('id',)

    @staticmethod
    def guild_master():
        return GuildRole.objects.get(id=1)


class GuildMember(models.Model):
    guild = models.ForeignKey("Guild", related_name="membership")
    user = models.ForeignKey("Profile", related_name="membership")
    role = models.ForeignKey("GuildRole")

    class Meta:
        ordering = ('id',)
        unique_together = ('guild', 'user')

    def __str__(self):
        return u"[{0}]({1}) {2}".format(self.guild, self.role, self.user)

    @property
    def attendance(self):
        if hasattr(self.user, '_prefetched_attendance'):
            return self.user._prefetched_attendance[:6]

        return self.get_attendance()

    def get_attendance(self, limit=6):
        return (self.user.attendance_set.filter(war__guild=self.guild, war__outcome__isnull=False)
                                        .order_by('-war__date')
                                        .select_related('war')[:limit])

    @property
    def main_character(self):
        main = self.user.get_main()

        if main is None:
            return {}

        return {
            "level": main.level,
            "gearscore": (main.ap + main.aap)/2 + main.dp + self.user.npc_renown,
            "class": main.character_class.name,
            "name": main.name
        }

    def has_permission(self, permission):
        return self.role.permissions.filter(codename=permission).exists()

    @property
    def stats(self):
        # Return the AggregatedGuildMemberWarStats
        profile = self.user

        if hasattr(profile, 'member_stats'):
            # Use prefetched value
            return profile.member_stats[0]

        return profile.aggregatedguildmemberwarstats.get(guild=self.guild_id)

    @property
    def attendance_rate(self):
        if hasattr(self, '_prefetched_attendance_rate'):
            return self._prefetched_attendance_rate

        return self.user.guild_attendance_rate(self.guild_id)
