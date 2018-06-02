from rest_framework import serializers

from api.serializers.mixin import BaseSerializerMixin
from bdo.models.guild import Guild, GuildMember, GuildRole
from bdo.models.war import WarRole


class SimpleGuildRoleSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = GuildRole
        fields = ('name', 'id')


class WarRoleSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = WarRole
        fields = ('id', 'name')


class NestedGuildSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    pending_war = serializers.SerializerMethodField()

    class Meta:
        model = Guild
        fields = ('id', 'logo_url', 'name', 'pending_war')

    def get_pending_war(self, instance):
        membership = instance.get_membership(self.context['request'].user.profile)

        if membership is None or not membership.has_permission('view_war'):
            return None

        return instance.pending_war()


class GuildMembershipSerializer(serializers.ModelSerializer):
    guild = NestedGuildSerializer(read_only=True)
    role = SimpleGuildRoleSerializer(read_only=True)

    class Meta:
        model = GuildMember
        fields = ('guild', 'role')
