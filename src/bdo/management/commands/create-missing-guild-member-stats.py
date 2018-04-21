from logging import getLogger

from django.core.management import BaseCommand, CommandError
from django.db.models import F

from bdo.models.character import Profile
from bdo.models.guild import GuildMember
from bdo.models.stats import AggregatedGuildMemberWarStats

logger = getLogger('bdo.commands')


class Command(BaseCommand):
    help = 'Import Node War stats from CSV files'
    _cached_profiles = {}

    def handle(self, *args, **options):
        missing_stats = []

        profiles = Profile.objects.filter(aggregatedguildmemberwarstats__isnull=True)
        qs = GuildMember.objects.filter(user__in=profiles)

        for member in qs:
            missing_stats.append(AggregatedGuildMemberWarStats(user_profile=member.user, guild=member.guild))

        created = AggregatedGuildMemberWarStats.objects.bulk_create(missing_stats)

        logger.info("Create {0} AggregatedGuildMemberWarStats objects".format(created))
