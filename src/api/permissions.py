from rest_framework import exceptions, permissions

from bdo.models.guild import Guild, GuildMember


class CharacterPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, character):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        return character.profile.user == request.user


class UserPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, user):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        return user == request.user


class RestrictedUserPermission(UserPermission):
    def has_permission(self, request, view):
        # Only the user can access this section
        return getattr(request.user.profile, 'id', None) == int(request.parser_context['kwargs']['profile_pk'])


class ProfilePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method in ['PUT', 'PATCH']:
            # Let the object permission handle that
            return True
        if request.method == 'POST' and getattr(request.user, 'profile', None) is None:
            # Only allow creation of profile if one does not exist already
            return True

        return False

    def has_object_permission(self, request, view, profile):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        return profile == request.user.profile


class BaseGuildObjectPermission(permissions.DjangoObjectPermissions):
    def get_guild(self, request, instance=None):
        raise NotImplementedError()

    def get_membership(self, request, instance=None):
        # Get guild membership
        try:
            return GuildMember.objects.get(user=request.user.profile, guild=self.get_guild(request, instance))
        except GuildMember.DoesNotExist:
            return None

    def has_permission(self, request, view):
        if request.method not in self.perms_map:
            raise exceptions.MethodNotAllowed(request.method)

        required_permissions = self.perms_map[request.method]

        if not required_permissions:
            return True

        membership = self.get_membership(request)

        return membership and set(required_permissions).issubset(set(membership.role.permissions.values_list('codename', flat=True)))

    def has_object_permission(self, request, view, obj):
        if request.method not in self.perms_map:
            raise exceptions.MethodNotAllowed(request.method)

        membership = self.get_membership(request, obj)
        required_permissions = self.perms_map[request.method]

        if not membership:
            return False

        member_permissions = membership.role.permissions.values_list('codename', flat=True)

        return set(required_permissions).issubset(set(member_permissions))


class GuildPermission(BaseGuildObjectPermission):
    perms_map = {
        'GET': [],
        'OPTIONS': [],
        'HEAD': [],
        'PUT': ['change_guild_info'],
        'PATCH': ['change_guild_info'],
    }

    def has_permission(self, request, view):
        """
        Allow all methods. Object level permissions will be restricted.
        """
        if request.method not in self.perms_map:
            raise exceptions.MethodNotAllowed(request.method)

        return True

    def get_guild(self, request, instance=None):
        if instance is not None:
            return instance

        # Can't create guilds
        return None


class WarAttendancePermission(BaseGuildObjectPermission):
    perms_map = {
        'GET': ['view_war'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['change_my_attendance'],
        'PUT': ['change_my_attendance'],
        'PATCH': ['change_my_attendance'],
        'DELETE': ['change_my_attendance'],
    }

    def get_guild(self, request, instance=None):
        if instance is not None:
            return instance.war.guild

        return Guild.objects.get(id=request.parser_context['kwargs']['guild_pk'])

    def has_object_permission(self, request, view, obj):
        try:
            guild_member = GuildMember.objects.get(user=request.user.profile, guild=obj)
        except GuildMember.DoesNotExist:
            return False

        if request.method not in self.perms_map:
            raise exceptions.MethodNotAllowed(request.method)

        required_permissions = self.perms_map[request.method]

        if not required_permissions:
            return True

        can_edit = set(required_permissions).issubset(set(guild_member.role.permissions.values_list('codename', flat=True)))

        return can_edit and obj.user_profile == request.user.profile


class WarPermission(BaseGuildObjectPermission):
    perms_map = {
        'GET': ['view_war'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['add_war'],
        'PUT': ['change_war'],
        'PATCH': ['change_war'],
        'DELETE': ['delete_war'],
    }

    def get_guild(self, request, instance=None):
        if instance is not None:
            return instance.guild

        return Guild.objects.get(id=request.parser_context['kwargs']['guild_pk'])


class WarTeamPermission(BaseGuildObjectPermission):
    perms_map = {
        'GET': ['view_war'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['manage_team'],
        'PUT': ['manage_team'],
        'PATCH': ['manage_team'],
        'DELETE': ['manage_team'],
    }

    def get_guild(self, request, instance=None):
        if instance is not None:
            return instance.war.guild

        return Guild.objects.get(id=request.parser_context['kwargs']['guild_pk'])


class WarCallSignPermission(BaseGuildObjectPermission):
    perms_map = {
        'GET': ['view_war'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['manage_call_sign'],
        'PUT': ['manage_call_sign'],
        'PATCH': ['manage_call_sign'],
        'DELETE': ['manage_call_sign'],
    }

    def get_guild(self, request, instance=None):
        if instance is not None:
            return instance.war.guild

        return Guild.objects.get(id=request.parser_context['kwargs']['guild_pk'])
