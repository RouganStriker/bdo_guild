from expander import ExpanderSerializerMixin
from rest_framework import serializers

from api.serializers import war as war_serializers
from api.serializers.profile import ExtendedProfileSerializer, SimpleProfileSerializer
from api.serializers.guild_content import NestedGuildSerializer, SimpleGuildRoleSerializer
from api.serializers.mixin import BaseSerializerMixin
from bdo.models.guild import Guild, GuildMember


class GuildMemberSerializer(BaseSerializerMixin, ExpanderSerializerMixin, serializers.ModelSerializer):
    attendance = war_serializers.NestedWarAttendanceSerializer(many=True)
    name = serializers.StringRelatedField(source='user', read_only=True)
    main_character = serializers.DictField(read_only=True)
    stats = serializers.DictField(read_only=True)

    class Meta:
        model = GuildMember
        fields = ('id', 'user', 'role', 'attendance', 'name', 'main_character', 'stats')
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
        if 'main_character' not in self.context['include']:
            self.fields.pop('main_character')


class SimpleGuildSerializer(NestedGuildSerializer):
    """
    Used to supply limited guild information like in a LIST call.
    """
    guild_master = SimpleProfileSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)

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
        )


class ExtendedGuildSerializer(SimpleGuildSerializer):
    # Extra stats fields
    average_level = serializers.IntegerField(read_only=True)
    average_gearscore = serializers.IntegerField(read_only=True)
    class_distribution = serializers.DictField(read_only=True)
    stat_totals = serializers.DictField(read_only=True)

    class Meta(SimpleGuildSerializer.Meta):
        fields = SimpleGuildSerializer.Meta.fields + (
            'stat_totals',
            'class_distribution',
            'average_level',
            'average_gearscore',
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
            self.fields.pop('average_level')
            self.fields.pop('average_gearscore')
            self.fields.pop('class_distribution')
            self.fields.pop('stat_totals')
        if (method == 'GET' and 'integrations' not in self.context['include']) or not view_integrations:
            self.fields.pop('discord_id')
            self.fields.pop('discord_roles')
            self.fields.pop('discord_webhook')
            self.fields.pop('discord_notifications')
