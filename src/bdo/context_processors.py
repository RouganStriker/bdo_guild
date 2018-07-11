from bdo.models.guild import GuildRole
from bdo.models.region import Region


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
        "role_permissions": serialize_roles(),
        "regions": serialize_regions(),
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


def serialize_regions():
    return {
        region.id: {
            "name": region.name,
            "node_war_start_time": str(region.node_war_start_time),
            "node_war_end_time": str(region.node_war_end_time),
            "conquest_war_start_time": str(region.conquest_war_start_time),
            "conquest_war_end_time": str(region.conquest_war_end_time),
            "timezone": str(region.timezone),
        }
        for region in Region.objects.all()
    }


def serialize_roles():
    return {role.id: [p.codename for p in role.permissions.all()] for role in GuildRole.objects.all()}


def serialize_guild_membership(memberships):
    return [{
        "guild": {
            "id": membership.guild.id,
            "name": membership.guild.name,
            "logo_url": membership.guild.logo_url
        },
        "role": {
            "id": membership.role.id,
            "name": membership.role.name
        }
    } for membership in memberships]
