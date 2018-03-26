from rest_framework import serializers

from api.serializers.mixin import BaseSerializerMixin
from bdo.models.guild import Guild, GuildMember, GuildRole, WarRole


class SimpleGuildRoleSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = GuildRole
        fields = ('name', 'id')


class WarRoleSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = WarRole
        fields = ('id', 'name')


class SimpleGuildSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Guild
        fields = ('id', 'name')


class GuildMembershipSerializer(serializers.ModelSerializer):
    guild = SimpleGuildSerializer(read_only=True)
    role = SimpleGuildRoleSerializer(read_only=True)

    class Meta:
        model = GuildMember
        fields = ('guild', 'role')