from expander import ExpanderSerializerMixin
from rest_framework import serializers

from api.serializers import war as war_serializers
from api.serializers.profile import ExtendedProfileSerializer, SimpleProfileSerializer
from api.serializers.guild_content import SimpleGuildRoleSerializer
from api.serializers.mixin import BaseSerializerMixin
from bdo.models.guild import Guild, GuildMember
from bdo.models.war import War


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

        if not self.query_include_attendance():
            self.fields.pop('attendance')
        if not self.query_include_stats():
            self.fields.pop('stats')
        if not self.query_include_main():
            self.fields.pop('main_character')

    def query_include_attendance(self):
        query = self.context['request'].query_params

        return 'include' in query and 'attendance' in query['include'].split(',')

    def query_include_stats(self):
        query = self.context['request'].query_params

        return 'include' in query and 'stats' in query['include'].split(',')

    def query_include_main(self):
        query = self.context['request'].query_params

        return 'include' in query and 'main_character' in query['include'].split(',')


class SimpleGuildSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    """
    Used to supply limited guild information like in a LIST call.
    """
    pending_war = serializers.SerializerMethodField()
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

    def get_pending_war(self, instance):
        membership = instance.get_membership(self.context['request'].user.profile)

        if membership is None or not membership.has_permission('view_war'):
            return None

        war = War.objects.filter(guild=instance).order_by('-date', '-id').first()

        if war and war.outcome is None:
            return war.id
        else:
            return None


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
        )

    def __init__(self, *args, **kwargs):
        super(ExtendedGuildSerializer, self).__init__(*args, **kwargs)

        if 'stats' not in self.context['include']:
            self.fields.pop('average_level')
            self.fields.pop('average_gearscore')
            self.fields.pop('class_distribution')
            self.fields.pop('stat_totals')
        if 'integrations' not in self.context['include']:
            self.fields.pop('discord_id')
            self.fields.pop('discord_roles')

    def query_include_stats(self):
        query = self.context['request'].query_params

        return 'include' in query and 'stats' in query['include'].split(',')

    def query_include_integrations(self):
        query = self.context['request'].query_params

        return 'include' in query and 'integrations' in query['include'].split(',')
