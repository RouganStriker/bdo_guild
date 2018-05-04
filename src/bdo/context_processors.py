from bdo.models.guild import GuildRole


def get_user_data(request):
    if not request.user.is_authenticated:
        return {}

    data = {
        "id": request.user.id,
        "is_superuser": request.user.is_superuser,
        "guilds": [],
        "profile_id": None,
        "email": request.user.email,
        "discord_id": request.user.first_name,
        "role_permissions": serialize_roles()
    }

    try:
        profile = request.user.profile
    except AttributeError:
        profile = None

    if profile is not None:
        data["profile_id"] = profile.id
        data["guilds"] = serialize_guild_membership(profile.membership.all())

    return {
        "USER_DATA": data
    }


def serialize_roles():
    return {role.id: [p.codename for p in role.permissions.all()] for role in GuildRole.objects.all()}


def serialize_guild_membership(memberships):
    return [{
        "guild": {
            "id": membership.guild.id,
            "name": membership.guild.name
        },
        "role": {
            "id": membership.role.id,
            "name": membership.role.name
        }
    } for membership in memberships]
