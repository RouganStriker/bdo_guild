from logging import getLogger

from django.core.management import BaseCommand
from django.db.models import OuterRef, Subquery

from bdo.models.character import Profile
from bdo.models.guild import GuildMember
from bdo.models.stats import AggregatedGuildMemberWarStats

logger = getLogger('bdo.commands')


class Command(BaseCommand):
    help = 'Import Node War stats from CSV files'
    _cached_profiles = {}

    def handle(self, *args, **options):
        missing_stats = []

        existing_aggregates = (AggregatedGuildMemberWarStats.objects.filter(guild_id=OuterRef('guild_id'),
                                                                            user_profile_id=OuterRef('user_id'))
                                                                    .values('id'))
        qs = GuildMember.objects.annotate(aggregate_id=Subquery(existing_aggregates)).filter(aggregate_id__isnull=True)

        for member in qs:
            missing_stats.append(AggregatedGuildMemberWarStats(user_profile=member.user, guild=member.guild))

        created = AggregatedGuildMemberWarStats.objects.bulk_create(missing_stats)

        logger.info("Create {0} AggregatedGuildMemberWarStats objects".format(created))
