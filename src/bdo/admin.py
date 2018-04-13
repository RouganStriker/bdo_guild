from django.contrib import admin

from bdo.models.character import Character, Profile
from bdo.models.content import CharacterClass, WarArea, WarNode
from bdo.models.guild import Guild, GuildRole, GuildMember, WarRole
from bdo.models.stats import AggregatedGuildMemberWarStats, AggregatedGuildWarStats, AggregatedUserWarStats
from bdo.models.war import War, WarAttendance, WarCallSign, WarStat, WarTeam


# User
@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    pass


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    search_fields = ('family_name',)
    list_display = ('id', 'family_name', 'user')


# Content
@admin.register(CharacterClass)
class CharacterClassAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    ordering = ('id',)


@admin.register(WarArea)
class WarAreaAdmin(admin.ModelAdmin):
    list_display = ('id', 'region', 'name')


@admin.register(WarNode)
class WarNodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


# Guild
@admin.register(Guild)
class GuildAdmin(admin.ModelAdmin):
    pass


@admin.register(GuildRole)
class GuildRoleAdmin(admin.ModelAdmin):
    pass


@admin.register(GuildMember)
class GuildMemberAdmin(admin.ModelAdmin):
    pass


@admin.register(WarRole)
class WarRoleAdmin(admin.ModelAdmin):
    pass


# War
@admin.register(War)
class WarAdmin(admin.ModelAdmin):
    list_display = ('date', 'guild', 'node', 'outcome',)
    ordering = ('-date',)


@admin.register(WarAttendance)
class WarAttendanceAdmin(admin.ModelAdmin):
    pass


@admin.register(WarCallSign)
class WarCallSignAdmin(admin.ModelAdmin):
    pass


@admin.register(WarStat)
class WarStatAdmin(admin.ModelAdmin):
    pass


@admin.register(WarTeam)
class WarTeamAdmin(admin.ModelAdmin):
    pass


# Stats
@admin.register(AggregatedGuildMemberWarStats)
class AggregatedGuildMemberWarStatsAdmin(admin.ModelAdmin):
    pass


@admin.register(AggregatedGuildWarStats)
class AggregatedGuildWarStatsAdmin(admin.ModelAdmin):
    pass


@admin.register(AggregatedUserWarStats)
class AggregatedUserWarStatsAdmin(admin.ModelAdmin):
    pass
