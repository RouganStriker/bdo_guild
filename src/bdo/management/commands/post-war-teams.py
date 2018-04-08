import time
from datetime import datetime
from logging import getLogger

import requests
from django.core.management import BaseCommand

from bdo.models.war import War

logger = getLogger('bdo.commands')


class Command(BaseCommand):
    help = 'Migrating profiles'

    @staticmethod
    def str_wargroup(group):
        return ", ".join([
            "{0} (<@{1}>)".format(member.user_profile.family_name,
                                  member.user_profile.discord_id)
            for member in group.members.all()
        ])

    def format_teams(self, war):
        return [
            ":triangular_flag_on_post: {0}\n{1}".format(team.name, self.str_wargroup(team))
            for team in war.warteam_set.all()
            if len(team.members.all()) > 0
        ]

    def format_callsigns(self, war):
        return [
            ":mega: {0}\n{1}\n".format(callsign.name, self.str_wargroup(callsign))
            for callsign in war.warcallsign_set.all()
            if len(callsign.members.all()) > 0
        ]

    def post_webhook(self, *args, **kwargs):
        """Handle potential rate limiting."""
        response = requests.post(*args, **kwargs)

        if response.status_code == 429:
            # Rate-limited, re-try after a bit
            delay = response.json().get("retry_after", 5000)
            is_global = response.json().get("global", "NA")
            logger.error("Hit Discord rate limiting (global={0}), retrying after {1}".format(is_global, delay))

            time.sleep(round(delay/1000))
            self.post_webhook(*args, **kwargs)

    def handle(self, *args, **options):
        count = 0
        wars = War.objects.filter(date=War.next_war()).prefetch_related('warteam_set__members', 'warcallsign_set__members')

        for war in wars:
            webhook = war.guild.discord_webhook
            pre_war_warning = war.guild.discord_notifications.get("war_start_warning", True)

            if webhook is None or not pre_war_warning:
                continue

            remaining_time = (War.next_war() - datetime.now()).total_seconds() / 60
            node = war.node
            node_name = "N/A" if node is None else node.name
            channel = "N/A" if node is None else "{0} {1}".format(node.area.get_region_display(), node.war_channel)
            data = {
                "content": "@everyone",
                "embeds": [
                    {
                        "title": ":information_source: Node War",
                        "color": "6591981",
                        "fields": [
                            {
                                "name": "T-Minus",
                                "value": "{0} minutes".format(round(remaining_time, 2))
                            },
                            {
                                "name": "War Channel",
                                "value": channel,
                            },
                            {
                                "name": "Node Name",
                                "value": node_name,
                            },
                        ]
                    },
                ]
            }

            self.post_webhook(webhook, json=data)

            for team in self.format_teams(war):
                self.post_webhook(webhook, {"content": team})
            for callsign in self.format_callsigns(war):
                self.post_webhook(webhook, {"content": callsign})

            count += 1

        logger.info("Posted {0} war notifications".format(count))
