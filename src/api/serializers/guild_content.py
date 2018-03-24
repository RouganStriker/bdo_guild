from rest_framework import serializers

from bdo.models.guild import Guild, GuildMember, GuildRole, WarRole


class SimpleGuildRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuildRole
        fields = ('name', 'id')


class WarRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WarRole
        fields = ('id', 'name')


class SimpleGuildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guild
        fields = ('id', 'name')


class GuildMembershipSerializer(serializers.ModelSerializer):
    guild = SimpleGuildSerializer(read_only=True)
    role = SimpleGuildRoleSerializer(read_only=True)

    class Meta:
        model = GuildMember
        fields = ('guild', 'role')