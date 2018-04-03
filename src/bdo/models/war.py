import re
from logging import getLogger

from dirtyfields import DirtyFieldsMixin
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import JSONField
from django.contrib.sites.models import Site
from django.db import models
from django.db.models import Count, F, Sum
from django.dispatch import Signal
import pytz
import requests

from bdo.models.character import Character, Profile
from bdo.models.content import WarNode
from bdo.models.guild import Guild, WarRole
from bdo.utils import ChoicesEnum
from bdo.bdo_stats import BDOStats

war_finish = Signal(providing_args=['war'])
logger = getLogger('bdo')


class War(models.Model):
    class Outcome(ChoicesEnum):
        WIN = 0
        LOSS = 1
        STALEMATE = 2

    node = models.ForeignKey(WarNode, blank=True, null=True)
    date = models.DateTimeField()
    note = models.CharField(max_length=1024, null=True, blank=True)
    outcome = models.IntegerField(choices=Outcome.choices(), null=True, blank=True)
    attendees = models.ManyToManyField(Profile, through='WarAttendance')
    guild = models.ForeignKey(Guild)

    class Meta:
        ordering = ('-date', 'id')

    def __str__(self):
        return u"[{0}] - {1}".format(self.guild.name, self.date.strftime("%b %d, %Y"))

    @property
    def stats(self):
        # Summary stats
        stats = (
            WarStat.objects.filter(attendance__war=self)
                           .annotate(fort_kills=F('command_post') + F('fort'),
                                     player_kills=F('guild_master') + F('officer') + F('member') + F('siege_weapons'))
                           .aggregate(attendance_count=Count('id'),
                                      total_forts_destroyed=Sum('fort_kills'),
                                      total_kills=Sum('player_kills'),
                                      total_deaths=Sum('death'),
                                      total_helps=Sum('help'))
        )

        return stats

    def generate_attendance(self):
        # Auto-generate attendance for existing members
        members = self.guild.members.all().prefetch_related('character_set')
        attendances = []

        for member in members:
            kwargs = {
                "user_profile": member,
                "war": self,
                "is_attending": member.get_availability(self.date)
            }

            if kwargs["is_attending"] == WarAttendance.AttendanceStatus.ATTENDING.value and member.has_main:
                # Include the character information
                kwargs['character'] = member.get_main()

            attendances.append(WarAttendance(**kwargs))

        WarAttendance.objects.bulk_create(attendances)

    def initialize_setup_from_previous(self):
        last_war = (War.objects.filter(guild=self.guild)
                               .order_by('-date', '-id')
                               .prefetch_related('warteam_set', 'warcallsign_set')
                               .first())
        war_teams = [
            WarTeam(
                war=self,
                name=team.name,
                default_role=team.default_role,
                type=team.type,
                slot_setup=team.slot_setup)
            for team in last_war.warteam_set.all()
        ]
        war_callsigns = [
            WarCallSign(
                war=self,
                name=callsign.name
            )
            for callsign in last_war.warcallsign_set.all()
        ]

        WarTeam.objects.bulk_create(war_teams)
        WarCallSign.objects.bulk_create(war_callsigns)

    def save(self, *args, **kwargs):
        dst_adjusted = getattr(settings, 'DST_ADJUSTED', False)

        if not self.id:
            # Apply time adjustments
            if dst_adjusted:
                self.date = self.date.replace(hour=1)
            else:
                self.date = self.date.replace(hour=2)

        super(War, self).save(*args, **kwargs)

    def get_display_date(self):
        return self.date.astimezone(pytz.timezone('US/Eastern')).strftime('%a, %d %b %Y %H:%M:%S %Z')

    def notify_war_start(self):
        if self.guild.discord_webhook is None or not self.guild.discord_notifications['war_create']:
            return

        site = Site.objects.get(id=settings.SITE_ID)

        logger.info("Sending war start notification for {0}".format(self))

        requests.post(self.guild.discord_webhook, json={
            "content": "@everyone",
            "embeds": [{
                "title": ":crossed_swords: Next Node War {0}".format(self.get_display_date()),
                "color": "13382400",
                "fields": [{
                    "name": "Sign Up",
                    "value": "https://{0}/guilds/{1}/war".format(site.domain, self.guild_id)
                }]
            }]
        })

    def notify_war_cancelled(self):
        if self.guild.discord_webhook is None or not self.guild.discord_notifications['war_cancel']:
            return

        logger.info("Sending war cancel notification for {0}".format(self))

        requests.post(self.guild.discord_webhook, json={
            "content": "@everyone",
            "embeds": [{
                "title": ":x: Node War on {0} is cancelled".format(self.get_display_date()),
                "color": "7039851",
            }]
        })

    def notify_war_finished(self):
        if self.guild.discord_webhook is None or not self.guild.discord_notifications['war_end']:
            return

        logger.info("Sending war end notification for {0}".format(self))

        stats = (WarStat.objects.filter(attendance__war=self)
                                .annotate(player=F('attendance__user_profile__family_name'))
                                .values_list(
                                    'player',
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
                                    'siege_weapons'
                                ))

        BDOStats().post_stats(self.guild.discord_webhook, list(stats), self)


class WarGroup(models.Model):
    name = models.CharField(max_length=255)
    war = models.ForeignKey(War)
    members = models.ManyToManyField('WarAttendance', blank=True)

    class Meta:
        abstract = True
        ordering = ('id',)

    def __str__(self):
        return self.name


class WarCallSign(WarGroup):
    pass


class WarTeam(WarGroup):
    class Type(ChoicesEnum):
        PLATOON = 0
        PARTY = 1

    default_role = models.ForeignKey(WarRole, on_delete=models.SET(WarRole.GET_DEFAULT_ROLE))
    type = models.IntegerField(choices=Type.choices())
    slot_setup = JSONField(default={}, null=True, blank=True)
    members = models.ManyToManyField('WarAttendance', through='WarTeamSlot')

    @property
    def max_slots(self):
        if self.type == self.Type.PLATOON.value:
            return 20

        return 5


class WarTeamSlot(models.Model):
    team = models.ForeignKey('WarTeam', related_name='slots')
    attendee = models.OneToOneField('WarAttendance', related_name='slot')
    slot = models.IntegerField()


class WarAttendance(DirtyFieldsMixin, models.Model):
    class AttendanceStatus(ChoicesEnum):
        ATTENDING = 0
        NOT_ATTENDING = 1
        UNDECIDED = 2
        NO_SHOW = 3
        LATE = 4

    character = models.ForeignKey(Character, on_delete=models.SET_NULL, null=True, blank=True)
    is_attending = models.IntegerField(choices=AttendanceStatus.choices(), default=2)
    note = models.CharField(max_length=512, null=True, blank=True)
    user_profile = models.ForeignKey(Profile, related_name="attendance_set", on_delete=models.PROTECT, null=True, blank=True)
    war = models.ForeignKey(War, related_name="attendance_set", on_delete=models.CASCADE)

    class Meta:
        ordering = ('id',)
        unique_together = ('user_profile', 'war')

    def __str__(self):
        return u"{0} : {1}".format(self.war, self.user_profile.family_name)

    def name(self):
        if self.is_attending != WarAttendance.AttendanceStatus.ATTENDING.value or not self.character:
            return self.user_profile.family_name

        return u"{0} ({1})".format(self.user_profile.family_name, self.character.name)

    def save(self, *args, **kwargs):
        if self.id:
            kwargs['update_fields'] = self.get_dirty_fields(check_relationship=True)

        return super(WarAttendance, self).save(*args, **kwargs)


class WarTemplate(models.Model):
    """
    JSON blob of platoon and party setups.
    """
    groups = JSONField(default={'platoon': {}, 'party': {}, 'call_signs': {}})
    roles = JSONField(default={})
    color_regex = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$", re.I)

    def _validate_role(self, role):
        if role not in self.roles:
            raise ValidationError(u"Invalid role id: {0}".format(role))

    def _validate_color(self, color):
        if not self.color_regex.match(color):
            raise ValidationError(u"Invalid color: {0}".format(color))

    def add_platoon(self, name, default_role, color):
        return self._add_group(name, default_role, color, 'platoon')

    def add_party(self, name, default_role, color):
        return self._add_group(name, default_role, color, 'party')

    def add_call_sign(self, name):
        if self.groups['call_signs']:
            next_id = max(self.groups[type].keys()) + 1
        else:
            next_id = 1

        self.groups['call_signs'][next_id] = name

    def _add_group(self, name, default_role, color, type):
        self._validate_role(default_role)
        self._validate_color(color)

        if self.groups[type]:
            next_id = max(self.groups[type].keys()) + 1
        else:
            next_id = 1

        self.groups[type][next_id] = {
            "name": name,
            "default_role": default_role,
            "color": color,
            "customizations": {}
        }

        return next_id

    def add_role(self, name):
        if self.roles:
            next_id = max(self.roles.keys()) + 1
        else:
            next_id = 1

        self.roles[next_id] = name

        return next_id


class WarStat(models.Model):
    command_post = models.IntegerField(default=0)
    fort = models.IntegerField(default=0)
    gate = models.IntegerField(default=0)
    help = models.IntegerField(default=0)
    mount = models.IntegerField(default=0)
    placed_objects = models.IntegerField(default=0)
    guild_master = models.IntegerField(default=0)
    officer = models.IntegerField(default=0)
    member = models.IntegerField(default=0)
    death = models.IntegerField(default=0)
    siege_weapons = models.IntegerField(default=0)
    attendance = models.OneToOneField('WarAttendance', related_name='stats', on_delete=models.CASCADE)

    @property
    def total_kills(self):
        return self.guild_master + self.officer + self.member + self.siege_weapons

    @property
    def kdr(self):
        if self.death == 0:
            return None
        else:
            return round(float(self.total_kills) / float(self.death), 2)
