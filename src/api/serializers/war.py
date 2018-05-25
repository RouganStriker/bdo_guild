from collections import defaultdict
from logging import getLogger

from expander import ExpanderSerializerMixin
from rest_framework import serializers
from rest_framework.compat import unicode_to_repr

from api.serializers.content import WarNodeSerializer
from api.serializers.mixin import BaseSerializerMixin
from api.serializers.profile import ExtendedProfileSerializer
from bdo.models.character import Profile
from bdo.models.content import WarNode
from bdo.models.guild import Guild
from bdo.models.stats import (AggregatedGuildMemberWarStats,
                              AggregatedGuildWarStats,
                              AggregatedUserWarStats)
from bdo.models.war import (war_finish,
                            War,
                            WarAttendance,
                            WarCallSign,
                            WarStat,
                            WarTeam,
                            WarTemplate)

logger = getLogger('bdo.api')


class CurrentGuildDefault(object):
    def set_context(self, serializer_field):
        self.guild = Guild.objects.get(pk=serializer_field.context['guild_pk'])

    def __call__(self):
        return self.guild

    def __repr__(self):
        return unicode_to_repr('%s()' % self.__class__.__name__)


class CurrentWarDefault(object):
    def set_context(self, serializer_field):
        self.war = War.objects.get(pk=serializer_field.context['war_pk'])

    def __call__(self):
        return self.war

    def __repr__(self):
        return unicode_to_repr('%s()' % self.__class__.__name__)


class CurrentUserProfileDefault(object):
    def set_context(self, serializer_field):
        self.profile = serializer_field.context['profile']

    def __call__(self):
        return self.profile

    def __repr__(self):
        return unicode_to_repr('%s()' % self.__class__.__name__)


class WarAttendanceSerializer(BaseSerializerMixin, ExpanderSerializerMixin, serializers.ModelSerializer):
    war = serializers.PrimaryKeyRelatedField(read_only=True, default=CurrentWarDefault())
    user_profile = serializers.PrimaryKeyRelatedField(read_only=True, default=CurrentUserProfileDefault())
    name = serializers.CharField(read_only=True)
    team = serializers.SerializerMethodField(read_only=True)
    call_sign = serializers.SerializerMethodField(read_only=True)
    renege_rate = serializers.DecimalField(source='user_profile.renege_rate',
                                           max_digits=19,
                                           decimal_places=2,
                                           coerce_to_string=False,
                                           read_only=True)

    class Meta:
        model = WarAttendance
        fields = (
            'war',
            'user_profile',
            'name',
            'team',
            'call_sign',
            'character',
            'id',
            'is_attending',
            'note',
            'renege_rate'
        )
        expandable_fields = {
            'user_profile': ExtendedProfileSerializer,
        }

    def get_team(self, attendee):
        if not getattr(attendee, 'slot', None):
            return None

        return attendee.slot.team.name

    def get_call_sign(self, attendee):
        callsign = attendee.warcallsign_set.first()
        if not callsign:
            return None

        return callsign.name

    def validate_character(self, character):
        # The character exists, check if it is owned by the current user
        if self.instance is None or character.profile == self.instance.user_profile:
            return character

        raise serializers.ValidationError("The character specified does not belong to the user.")


class NestedWarAttendanceSerializer(WarAttendanceSerializer):
    date = serializers.DateTimeField(source='war.date')

    class Meta(WarAttendanceSerializer.Meta):
        fields = ('id', 'is_attending', 'date')


class SimpleNestedWarAttendanceSerializer(WarAttendanceSerializer):
    class Meta(WarAttendanceSerializer.Meta):
        fields = ('id', 'is_attending', 'name', 'war', 'user_profile')


class WarTemplateSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = WarTemplate
        fields = '__all__'


class WarCallSignSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    war = serializers.PrimaryKeyRelatedField(read_only=True, default=CurrentWarDefault())

    class Meta:
        model = WarCallSign
        read_only = ('id', 'war', 'members')
        fields = '__all__'


class NestedWarCallSignSerializer(WarCallSignSerializer):
    class Meta(WarCallSignSerializer.Meta):
        fields = ('id', 'name')


class WarTeamSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    war = serializers.PrimaryKeyRelatedField(read_only=True, default=CurrentWarDefault())
    slots = serializers.SerializerMethodField()

    class Meta:
        model = WarTeam
        read_only = ('slots', 'id', 'war', 'members')
        fields = '__all__'

    def get_slots(self, instance):
        members = instance.members.values('id', 'slot__slot')

        def find_member(slot_id):
            for member in members:
                if member['slot__slot'] == slot_id:
                    return member['id']
            return None

        return [
            {
                "id": index,
                "role_id": instance.slot_setup.get(str(index), instance.default_role.id),
                "attendee_id": find_member(index)
            }
            for index in range(1, instance.max_slots + 1)
        ]


class NestedWarTeamSerializer(WarTeamSerializer):
    class Meta(WarTeamSerializer.Meta):
        fields = ('id', 'name', 'type', 'slot_setup', 'default_role', 'display_slots')


class WarSerializer(BaseSerializerMixin, ExpanderSerializerMixin, serializers.ModelSerializer):
    guild = serializers.HiddenField(default=CurrentGuildDefault())
    stats = serializers.DictField(read_only=True)
    use_last_setup = serializers.BooleanField(default=True, required=False)

    class Meta:
        model = War
        fields = (
            'id',
            'guild',
            'date',
            'note',
            'outcome',
            'node',
            'stats',
            'use_last_setup',
        )
        expandable_fields = {
            'node': WarNodeSerializer,
        }

    def __init__(self, *args, **kwargs):
        super(WarSerializer, self).__init__(*args, **kwargs)

        if 'stats' not in self.context['include']:
            self.fields.pop('stats')
        if self.context['request'].method != 'POST':
            self.fields.pop('use_last_setup')

    def create(self, validated_data):
        use_last_setup = validated_data.pop('use_last_setup')

        war = super(WarSerializer, self).create(validated_data)
        war.generate_attendance()

        if use_last_setup:
            war.initialize_setup_from_previous()

        return war


class WarStatSerializer(BaseSerializerMixin,
                        ExpanderSerializerMixin,
                        serializers.ModelSerializer):
    total_kills = serializers.IntegerField(read_only=True)
    kdr = serializers.FloatField(read_only=True)

    class Meta:
        model = WarStat
        fields = '__all__'
        expandable_fields = {
            'attendance': SimpleNestedWarAttendanceSerializer,
        }


class NestedWarStatSerializer(WarStatSerializer):
    attended = serializers.BooleanField()
    attendance = serializers.PrimaryKeyRelatedField(queryset=WarAttendance.objects.all(),
                                                    required=False,
                                                    allow_null=True)
    user_profile = serializers.PrimaryKeyRelatedField(queryset=Profile.objects.all())

    class Meta(WarStatSerializer.Meta):
        fields = (
            'attended',
            'attendance',
            'user_profile',
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
        )


class UpdateNestedWarStatSerializer(NestedWarStatSerializer):
    id = serializers.IntegerField(required=False, allow_null=True)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    class Meta(NestedWarStatSerializer.Meta):
        fields = (
            'id',
            'name',
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
        )


class WarUpdateSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    stats = UpdateNestedWarStatSerializer(many=True)

    class Meta:
        model = War
        fields = ('node', 'note', 'outcome', 'stats')

    def create(self, validated_data):
        war = self.context['war']

        # Update War
        war.outcome = validated_data.pop('outcome')
        war.node = validated_data.pop('node')
        war.note = validated_data.pop('note')

        if war.is_dirty():
            war.save()

        # Build stat lookup
        existing_stats = {stat.id: stat for stat in WarStat.objects.filter(attendance__war=war)}
        seen_stats = []
        errors = {
            'stats': []
        }
        hasErrors = False
        updatedCount = 0
        createdCount = 0
        deletedCount = 0

        for stat in validated_data['stats']:
            id = stat.pop('id')
            name = stat.pop('name')

            if id is not None and id not in existing_stats:
                errors['stats'].append({
                    '__nonfield__': "Invalid stat ID {0}".format(id)
                })
                hasErrors = True
                continue
            elif id:
                war_stat = existing_stats[id]
                war_stat.update_fields(**stat)

                if war_stat.is_dirty():
                    war_stat.save()
                    updatedCount += 1

                seen_stats.append(id)
            elif name:
                # New stat entry
                try:
                    user = Profile.objects.get(family_name__iexact=name)
                except (Profile.DoesNotExist, Profile.MultipleObjectsReturned):
                    errors['stats'].append({
                        '__nonfield__': u"User with family name {0} does not exist.".format(name)
                    })
                    hasErrors = True
                    continue

                attendance, _ = WarAttendance.objects.update_or_create(war=war,
                                                                       user_profile=user,
                                                                       defaults={'is_attending': 0})
                stat, created = WarStat.objects.update_or_create(attendance=attendance, defaults=stat)

                if not created:
                    seen_stats.append(stat.id)
                    updatedCount += 1
                else:
                    createdCount += 1
            else:
                errors['stats'].append({
                    '__nonfield__': "Missing a player identifier for stat entry."
                })
                hasErrors = True
                continue

            # Placeholder
            errors['stats'].append({})

        # Existing stats not included in the payload are considered removed
        for stat in WarStat.objects.filter(id__in=existing_stats.keys()).exclude(id__in=seen_stats):
            # Manually delete stats in order to trigger signal handlers
            stat.attendance.is_attending = 3
            stat.attendance.save()
            stat.delete()
            deletedCount += 1

        logger.debug("Updated War and stats. {0} updated, {1} created, {2} deleted".format(updatedCount,
                                                                                           createdCount,
                                                                                           deletedCount))

        if hasErrors:
            raise serializers.ValidationError(errors)

        return war


class WarSubmitSerializer(BaseSerializerMixin, serializers.Serializer):
    outcome = serializers.ChoiceField(choices=list(War.Outcome.choices()))
    stats = NestedWarStatSerializer(many=True)

    def create(self, validated_data):
        war = self.context['war']
        war_stats = {}
        no_shows = {}
        flaked_out = {}
        no_sign_ups = {}
        guild_totals = defaultdict(int)
        # In case the submission is out of sync with actual attendance
        attendance_mapping = {
            attendance.user_profile_id: attendance
            for attendance in war.attendance_set.all()
        }

        for stat in validated_data['stats']:
            attended = stat.pop('attended')
            user_profile = stat.pop('user_profile')
            stat.pop('attendance')
            attendance = attendance_mapping.get(user_profile.id, None)

            if attendance is None:
                attendance = WarAttendance.objects.create(war=war, user_profile=user_profile)
            if attended:
                war_stats[user_profile.id] = WarStat(attendance_id=attendance.id, **stat)

                for stat_field, stat_value in stat.items():
                    guild_totals[stat_field] += stat_value

            # Check for mismatch
            if attended != (attendance.is_attending == WarAttendance.AttendanceStatus.ATTENDING.value):
                if not attended:
                    # Marked attending but no show
                    flaked_out[user_profile.id] = attendance.id
                else:
                    # Marked undecided or unavailable but made it
                    no_sign_ups[user_profile.id] = attendance.id
            elif attendance.is_attending == WarAttendance.AttendanceStatus.UNDECIDED.value:
                # Marked undecided and no show
                no_shows[user_profile.id] = attendance.id

        if war_stats:
            WarStat.objects.bulk_create(war_stats.values())
        if flaked_out:
            (WarAttendance.objects.filter(id__in=flaked_out.values())
             .update(is_attending=WarAttendance.AttendanceStatus.RENEGED.value))
        if no_shows:
            (WarAttendance.objects.filter(id__in=no_shows.values())
                                  .update(is_attending=WarAttendance.AttendanceStatus.NO_SHOW.value))
        if no_sign_ups:
            (WarAttendance.objects.filter(id__in=no_sign_ups.values())
                                  .update(is_attending=WarAttendance.AttendanceStatus.LATE.value))

        # Update aggregated stats
        AggregatedGuildWarStats.update(war.guild, guild_totals)

        # Refresh aggregated stats
        def get_attending(profile_id):
            if profile_id in war_stats:
                return 0
            elif profile_id in no_shows:
                return 3
            else:
                return 1

        # Update member stats
        old_member_stats = AggregatedGuildMemberWarStats.objects.filter(guild=war.guild,
                                                                        user_profile__in=war.attendees.all())
        new_member_stats = [
            old_stat.clone_and_increment(war_stat=war_stats.get(old_stat.user_profile_id, None),
                                         is_attending=get_attending(old_stat.user_profile_id))
            for old_stat in old_member_stats
            ]
        old_member_stats.delete()
        AggregatedGuildMemberWarStats.objects.bulk_create(new_member_stats)

        # Update user stats
        old_user_stats = AggregatedUserWarStats.objects.filter(user_profile__in=war.attendees.all())
        new_user_stats = [
            old_stat.clone_and_increment(war_stat=war_stats.get(old_stat.user_profile_id, None),
                                         is_attending=get_attending(old_stat.user_profile_id))
            for old_stat in old_user_stats
            ]
        old_user_stats.delete()
        AggregatedUserWarStats.objects.bulk_create(new_user_stats)

        war.outcome = validated_data['outcome']
        war.save()

        war_finish.send(War, instance=war)

        return war


class SimpleWarSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    date = serializers.DateTimeField()
    guild = serializers.CharField(source='guild.name')

    class Meta:
        model = War
        fields = ('date', 'guild')


class PlayerStatSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    war = SimpleWarSerializer(source='attendance.war')

    class Meta:
        model = WarStat
        fields = (
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
            'war',
        )


class PlayerWarSerializer(SimpleWarSerializer):
    attendance = serializers.SerializerMethodField()
    node = serializers.SerializerMethodField()
    guild_id = serializers.IntegerField(source='guild.id')

    class Meta(SimpleWarSerializer.Meta):
        fields = SimpleWarSerializer.Meta.fields + (
            'guild_id',
            'attendance',
            'node',
        )

    def get_attendance(self, instance):
        attendance = getattr(instance, 'my_attendance', None)

        if not attendance:
            return None

        team = attendance[0].warteam_set.all()
        call_sign = attendance[0].warcallsign_set.all()

        return {
            'is_attending': attendance[0].is_attending,
            'team': str(team[0]) if team else None,
            'call_sign': str(call_sign[0]) if call_sign else None
        }

    def get_node(self, instance):
        if instance.node is None:
            return None

        return str(instance.node)
