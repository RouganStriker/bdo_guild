from collections import defaultdict, OrderedDict
from functools import reduce
from logging import getLogger

import requests
from django.conf import settings
from django.core.management import BaseCommand
from django.db.models import Case, OuterRef, Q, Subquery, When

from bdo.models.character import Profile
from bdo.models.guild import Guild, GuildMember, GuildRole
from bdo.models.stats import AggregatedGuildMemberWarStats

logger = getLogger('bdo.commands')


class Command(BaseCommand):
    help = 'Synchronize with Discord'

    def get_discord_resource(self, resource_link, params=None):
        if params is None:
            params = {}

        res = requests.get('https://discordapp.com/api/v6' + resource_link, headers={
            'Authorization': 'Bot {0}'.format(self.discord_token)
        }, params=params)
        res.raise_for_status()

        return res.json()

    def handle(self, *args, **options):
        self.discord_token = getattr(settings, 'DISCORD_BOT_TOKEN')

        discord_guilds = self.get_discord_resource('/users/@me/guilds')
        bdo_guild_mapping = {g.discord_id: g for g in Guild.objects.all() if g.discord_id}
        bdo_guild_role_mapping = {str(r.id): r for r in GuildRole.objects.all()}

        for guild in discord_guilds:
            if guild['id'] not in bdo_guild_mapping:
                continue

            # Only sync guilds in the mapping
            discord_roles = self.get_discord_resource('/guilds/{0}'.format(guild['id']))['roles']
            # Sort discord roles by hierarchical position
            discord_roles = sorted(discord_roles, key=lambda r: r['position'])
            # Sort bdo role by hierarchy, return tuple (GuildRole, Discord Role Name)
            mapped_roles = bdo_guild_mapping[guild['id']].discord_roles
            mapped_bdo_roles = [(guild_role_id, mapped_roles[guild_role_id])
                                for guild_role_id in sorted(bdo_guild_role_mapping.keys())
                                if guild_role_id in mapped_roles]

            # Convert the stored Discord role name to an id.
            # Take the first role matched. Role names can be duplicated but
            # this will take the highest ranking role.
            sync_roles = OrderedDict()

            for guild_role_id, discord_role_name in mapped_bdo_roles:
                for discord_role in discord_roles:
                    if discord_role['name'].lower() == discord_role_name.lower():
                        sync_roles[discord_role['id']] = guild_role_id
                        break

            discord_members = self.get_discord_resource('/guilds/{0}/members'.format(guild['id']),
                                                        params={'limit': 1000})

            cached_members = {}
            members_by_roles = defaultdict(list)

            for discord_member in discord_members:
                if not set(discord_member['roles']) & set(sync_roles.keys()):
                    continue

                for discord_role_id, guild_role_id in sync_roles.items():
                    if discord_role_id in discord_member['roles']:
                        cached_members[discord_member['user']['id']] = guild_role_id
                        members_by_roles[guild_role_id].append(discord_member['user']['id'])
                        break

            bdo_guild = bdo_guild_mapping[guild['id']]
            bdo_guild.discord_members = cached_members
            bdo_guild.save()

            # Prune old members
            existing_users = Profile.objects.filter(discord_id__in=cached_members.keys())
            deleted = (GuildMember.objects.filter(guild=bdo_guild)
                                          .exclude(role=1)  # Exclude GMs
                                          .exclude(user__in=existing_users).delete())
            # Update existing member's roles
            outdated_members_q = (Q(user__discord_id__in=discord_ids) & ~Q(role_id=role_id)
                                  for role_id, discord_ids in members_by_roles.items())
            members_qs = existing_users.filter(id=OuterRef('user_id'))
            updated = (GuildMember.objects.filter(guild=bdo_guild)
                                          .filter(reduce(lambda a,b: a | b, outdated_members_q))
                                          .annotate(discord_id=Subquery(members_qs.values('discord_id')[:1]))
                                          .update(role=Case(
                                              *[When(discord_id__in=discord_ids, then=bdo_guild_role_mapping[role_id].id)
                                                for role_id, discord_ids in members_by_roles.items()]
                                          ))
            )
            # Add new members
            new_member_profiles = existing_users.exclude(membership__guild=bdo_guild)
            new_members = [
                GuildMember(guild=bdo_guild,
                            user=profile,
                            role=bdo_guild_role_mapping[cached_members[profile.discord_id]])
                for profile in new_member_profiles
            ]

            new_stats = [
                AggregatedGuildMemberWarStats(guild=bdo_guild,
                                              user_profile=profile)
                for profile in new_member_profiles.exclude(aggregatedguildmemberwarstats__guild_id=bdo_guild.id)
            ]
            GuildMember.objects.bulk_create(new_members)
            AggregatedGuildMemberWarStats.objects.bulk_create(new_stats)

            logger.info("Synchronized Guild `{0}`, found {1} discord members, removed {2} members, "
                        "updated {3} members, added {4} members.".format(bdo_guild,
                                                                         len(cached_members),
                                                                         deleted[0],
                                                                         updated,
                                                                         len(new_members)))
