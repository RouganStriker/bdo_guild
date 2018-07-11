from expander import ExpanderSerializerMixin
from rest_framework import serializers

from api.serializers import war as war_serializers
from api.serializers.profile import ExtendedProfileSerializer, SimpleProfileSerializer
from api.serializers.guild_content import NestedGuildSerializer, SimpleGuildRoleSerializer
from api.serializers.stat import AggregatedGuildWarStatsSerializer, AggregatedGuildMemberWarStatsSerializer
from api.serializers.mixin import BaseSerializerMixin
from bdo.models.guild import Guild, GuildMember


class GuildMemberSerializer(BaseSerializerMixin, ExpanderSerializerMixin, serializers.ModelSerializer):
    attendance = war_serializers.NestedWarAttendanceSerializer(many=True)
    attendance_rate = serializers.DecimalField(max_digits=19,
                                               decimal_places=2,
                                               coerce_to_string=False,
                                               read_only=True)
    family_name = serializers.CharField(source='user.family_name', read_only=True)
    name = serializers.StringRelatedField(source='user', read_only=True)
    main_character = serializers.DictField(read_only=True)
    stats = AggregatedGuildMemberWarStatsSerializer(read_only=True)

    class Meta:
        model = GuildMember
        fields = (
            'id',
            'user',
            'role',
            'attendance',
            'attendance_rate',
            'family_name',
            'name',
            'main_character',
            'stats'
        )
        expandable_fields = {
            'user': ExtendedProfileSerializer,
            'role': SimpleGuildRoleSerializer,
        }

    def __init__(self, *args, **kwargs):
        super(GuildMemberSerializer, self).__init__(*args, **kwargs)

        if 'attendance' not in self.context['include']:
            self.fields.pop('attendance')
        if 'stats' not in self.context['include']:
            self.fields.pop('stats')
            self.fields.pop('attendance_rate')
        if 'main_character' not in self.context['include']:
            self.fields.pop('main_character')


class SimpleGuildSerializer(NestedGuildSerializer):
    """
    Used to supply limited guild information like in a LIST call.
    """
    guild_master = SimpleProfileSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    average_level = serializers.IntegerField(read_only=True)
    average_renown = serializers.IntegerField(read_only=True)
    region = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Guild
        fields = (
            'id',
            'pending_war',
            'guild_master',
            'name',
            'logo_url',
            'description',
            'member_count',
            'region',
            'average_level',
            'average_renown',
        )

    def __init__(self, *args, **kwargs):
        super(SimpleGuildSerializer, self).__init__(*args, **kwargs)

        if 'stats' not in self.context['include']:
            self.fields.pop('average_level')
            self.fields.pop('average_renown')


class ExtendedGuildSerializer(SimpleGuildSerializer):
    # Extra stats fields
    class_distribution = serializers.DictField(read_only=True)
    stat_totals = AggregatedGuildWarStatsSerializer(source='guild_stats', read_only=True)

    class Meta(SimpleGuildSerializer.Meta):
        fields = SimpleGuildSerializer.Meta.fields + (
            'stat_totals',
            'class_distribution',
            'discord_id',
            'discord_roles',
            'discord_webhook',
            'discord_notifications',
        )

    def __init__(self, *args, **kwargs):
        super(ExtendedGuildSerializer, self).__init__(*args, **kwargs)

        view_integrations = False
        method = self.context['request'].method

        if self.instance:
            membership = self.instance.get_membership(self.context['request'].user.profile)
            view_integrations = membership is not None and membership.has_permission('change_guild_info')
        if 'stats' not in self.context['include']:
            self.fields.pop('class_distribution')
            self.fields.pop('stat_totals')
        if (method == 'GET' and 'integrations' not in self.context['include']) or not view_integrations:
            self.fields.pop('discord_id')
            self.fields.pop('discord_roles')
            self.fields.pop('discord_webhook')
            self.fields.pop('discord_notifications')
