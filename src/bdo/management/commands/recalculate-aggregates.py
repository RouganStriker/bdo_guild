from django.core.management import BaseCommand

from bdo.models.stats import (AggregatedGuildMemberWarStats,
                              AggregatedGuildWarStats,
                              AggregatedUserWarStats)


class Command(BaseCommand):
    help = 'Re-calculate aggregate tables'

    def handle(self, *args, **options):
        for stat in AggregatedGuildMemberWarStats.objects.all():
            stat.recalculate()
        for stat in AggregatedGuildWarStats.objects.all():
            stat.recalculate()
        for stat in AggregatedUserWarStats.objects.all():
            stat.recalculate()

        print("Re-calculated all aggregate tables")
