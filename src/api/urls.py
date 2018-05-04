from django.conf.urls import url

from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from api.views import (CharacterViewSet,
                       CharacterClassViewSet,
                       ContactViewSet,
                       CurrentUserViewSet,
                       GuildActivityViewSet,
                       GuildViewSet,
                       GuildMemberViewSet,
                       GuildRoleViewSet,
                       UserLoginViewSet,
                       UserLogoutViewSet,
                       PlayerStatViewSet,
                       PlayerWarViewSet,
                       ProfileViewSet,
                       WarViewSet,
                       WarAttendanceViewSet,
                       WarCallSignViewSet,
                       WarRoleViewSet,
                       WarStatViewSet,
                       WarTeamViewSet,
                       WarTemplateViewSet,
                       WarNodeViewSet)


router = DefaultRouter()

router.register(r'users/characters', CharacterViewSet, base_name='character')
router.register(r'users/profile', ProfileViewSet, base_name='profile')

# Profile
profile_router = routers.NestedSimpleRouter(router, r'users/profile', lookup='profile')
profile_router.register(r'stats', PlayerStatViewSet, base_name='stats')
profile_router.register(r'wars', PlayerWarViewSet, base_name='user-wars')

# Contact
router.register(r'contact', ContactViewSet, base_name='contact-us')

# Content
router.register(r'content/classes', CharacterClassViewSet, base_name='character-class')
router.register(r'content/nodes', WarNodeViewSet, base_name='nodes')

# Guild
router.register(r'guilds', GuildViewSet, base_name='guilds')

guild_router = routers.NestedSimpleRouter(router, r'guilds', lookup='guild')
guild_router.register(r'wars/templates', WarTemplateViewSet, base_name='war-template')
guild_router.register(r'wars', WarViewSet, base_name='wars')
guild_router.register(r'guild-roles', GuildRoleViewSet, base_name='guild-roles')
guild_router.register(r'war-roles', WarRoleViewSet, base_name='war-roles')
guild_router.register(r'members', GuildMemberViewSet, base_name='members')
guild_router.register(r'activity', GuildActivityViewSet, base_name='guild-activity')

war_router = routers.NestedSimpleRouter(guild_router, r'wars', lookup='war')
war_router.register(r'attendance', WarAttendanceViewSet, base_name='war-attendance')
war_router.register(r'teams', WarTeamViewSet, base_name='war-team')
war_router.register(r'call-signs', WarCallSignViewSet, base_name='war-call-sign')
war_router.register(r'stats', WarStatViewSet, base_name='war-stat')

urlpatterns = router.urls + guild_router.urls + profile_router.urls + war_router.urls
urlpatterns += (url(r'^users/me/$', CurrentUserViewSet.as_view(), name='current-user'),)
