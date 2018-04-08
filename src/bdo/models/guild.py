from dirtyfields import DirtyFieldsMixin
from django.db import models
from django.db.models import Q, Avg, F, Case, Count, When, Sum
from django.contrib.auth.models import Group
from django.contrib.postgres.fields import JSONField

from bdo.models.character import Character, Profile


class Guild(DirtyFieldsMixin, models.Model):
    name = models.CharField(max_length=255)
    logo_url = models.URLField()
    members = models.ManyToManyField(Profile, through='GuildMember', related_name='guilds')
    description = models.TextField(default='')

    # Discord fields
    discord_id = models.CharField(max_length=75)
    discord_roles = JSONField()
    discord_webhook = models.URLField(null=True, blank=True)
    discord_notifications = JSONField(default={
        "war_create": True,
        "war_cancel": True,
        "war_end": True,
        "war_start_warning": True
    })

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

    def __str__(self):
        return self.name

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
    def average_gearscore(self):
        guild_characters = Character.objects.filter(is_main=True, profile__membership__guild=self)
        gearscore_expression = Case(
            When(ap__lt=F('aap'), then=F('aap') + F('dp')),
            default=F('ap') + F('dp')
        )

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
    def stat_totals(self):
        from bdo.models.war import WarStat

        stats = (
            WarStat.objects.filter(attendance__war__guild=self)
                           .values('attendance__war__guild')
                           .aggregate(
                                total_guild_master=Sum('guild_master'),
                                total_officer=Sum('officer'),
                                total_member=Sum('member'),
                                total_siege_weapons=Sum('siege_weapons'),
                                total_death=Sum('death'))
        )

        return stats

    @property
    def member_count(self):
        return self.members.count()

    def get_membership(self, profile):
        try:
            return self.membership.get(user=profile)
        except GuildMember.DoesNotExist:
            return None

    def save(self, *args, **kwargs):
        dirty_fields = self.get_dirty_fields()

        return super(Guild, self).save(update_fields=dirty_fields, *args, **kwargs)


class GuildRole(Group):
    icon = models.ImageField(null=True, blank=True)
    custom_for = models.ForeignKey(Guild, null=True, blank=True, related_name='custom_guild_roles')

    class Meta:
        ordering = ('id',)

    @staticmethod
    def guild_master():
        return GuildRole.objects.get(id=1)


class GuildMember(models.Model):
    guild = models.ForeignKey(Guild, related_name="membership")
    user = models.ForeignKey(Profile, related_name="membership")
    role = models.ForeignKey(GuildRole)

    class Meta:
        ordering = ('id',)
        unique_together = ('guild', 'user')

    def __str__(self):
        return u"[{0}]({1}) {2}".format(self.guild, self.role, self.user)

    @property
    def attendance(self):
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
            "gearscore": max(main.ap, main.aap) + main.dp,
            "class": main.character_class.name,
            "name": main.name
        }

    def has_permission(self, permission):
        return self.role.permissions.filter(codename=permission).exists()

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

        return self.user.attendance_set.filter(war__guild=self.guild, war__outcome__isnull=False).values('user_profile').aggregate(
            total_attended=Count(Case(When(is_attending__in=[0, 4], then=1))),
            total_unavailable=Count(Case(When(is_attending=1, then=1))),
            total_missed=Count(Case(When(is_attending__in=[2, 3], then=1))),
            **{'total_{0}'.format(field): Sum('stats__{0}'.format(field)) for field in fields}
        )


class WarRole(models.Model):
    name = models.CharField(max_length=255)
    custom_for = models.ForeignKey(Guild, blank=True, null=True, related_name='custom_war_roles')

    class Meta:
        unique_together = ('name', 'custom_for')
        ordering = ('id',)

    def __str__(self):
        return self.name

    @staticmethod
    def GET_DEFAULT_ROLE():
        return WarRole.objects.get(id=-1)
