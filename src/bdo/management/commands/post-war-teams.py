import time
from datetime import datetime, timedelta
from logging import getLogger

import requests
from django.core.management import BaseCommand, CommandError

from bdo.models.guild import WAR_REMINDER_CHOICES
from bdo.models.war import War

logger = getLogger('bdo.commands')


class Command(BaseCommand):
    help = 'Post war teams and reminder to Discord'

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

    def add_arguments(self, parser):
        parser.add_argument('reminder_interval')

    def handle(self, *args, **options):
        count = 0
        now = datetime.utcnow()
        reminder_interval = int(options.get('reminder_interval'))

        if not any(reminder_interval == interval for interval, _ in WAR_REMINDER_CHOICES):
            raise CommandError("Invalid reminder_interval {0}, "
                               "expected one of {1}".format(reminder_interval,
                                                            [interval for interval, _ in WAR_REMINDER_CHOICES]))

        next_war_time = now + timedelta(minutes=reminder_interval)
        # Between the time the script is executed till it gets here,
        # it is possible that a significant amount of time has passed
        # so we will for wars within a small time frame.
        next_war_time_range = [next_war_time - timedelta(minutes=5), next_war_time - timedelta(minutes=5)]

        wars = (War.objects.filter(date__range=next_war_time_range,
                                   guild__discord_war_reminder=reminder_interval,
                                   guild__discord_webhook__isnull=False)
                           .prefetch_related('warteam_set__members',
                                             'warcallsign_set__members'))

        if not wars:
            logger.debug("No wars in the next {0} minutes, skipping post".format(reminder_interval))
            return

        for war in wars:
            webhook = war.guild.discord_webhook
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
                                "value": "{0} minutes".format(reminder_interval)
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
