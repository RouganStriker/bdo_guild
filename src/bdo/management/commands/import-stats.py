import csv
import os
from datetime import datetime
from pytz import timezone

from django.core.management import BaseCommand, CommandError
from django.db.transaction import atomic

from bdo.models.character import Profile
from bdo.models.guild import Guild
from bdo.models.war import War, WarAttendance, WarStat


class Command(BaseCommand):
    help = 'Import Node War stats from CSV files'
    _cached_profiles = {}

    def add_arguments(self, parser):
        parser.add_argument('guild')
        parser.add_argument('stats_csv', nargs='+')

    def get_profile(self, og_family_name):
        family_name = og_family_name.lower()

        if family_name in self._cached_profiles:
            return self._cached_profiles.get(family_name)

        profile = Profile.objects.get_or_create(defaults={"family_name": og_family_name},
                                                family_name__iexact=og_family_name)[0]

        self._cached_profiles[family_name] = profile

        return profile

    def parse_row(self, name, command_post, fort, gate, help, mount, placed_objects,
                  guild_master, officer, member, deaths, siege_weapons, *args, war=None):
        if war is None:
            raise CommandError("War not specified")

        family_name = name.split()[0]
        profile = self.get_profile(family_name)
        attendance = WarAttendance.objects.create(is_attending=WarAttendance.AttendanceStatus.ATTENDING.value,
                                                  user_profile=profile,
                                                  war=war)
        return WarStat(
            command_post=int(command_post),
            fort=int(fort),
            gate=int(gate),
            help=int(help),
            mount=int(mount),
            placed_objects=int(placed_objects),
            guild_master=int(guild_master),
            officer=int(officer),
            member=int(member),
            death=int(deaths),
            siege_weapons=int(siege_weapons),
            attendance=attendance,
        )

    def get_date_from_file(self, path):
        month, day, year = os.path.basename(path).split('.', 1)[0].split('_')

        return datetime(
            year=int(year),
            month=int(month),
            day=int(day),
            hour=21,
            minute=0,
            second=0,
            tzinfo=timezone('US/Eastern')
        )

    def handle(self, *args, **options):
        try:
            guild = Guild.objects.get(name=options.get('guild'))
        except Guild.DoesNotExist:
            raise CommandError("Invalid guild '{0}'".format(options.get('guild')))

        for csv_file in options.get('stats_csv'):
            stats = []

            with open(csv_file) as f, atomic():
                reader = csv.reader(f)
                # Skip header
                next(reader, None)

                war_obj, created = War.objects.get_or_create(guild=guild, date=self.get_date_from_file(csv_file))

                if not created:
                    print("War on {0} already exists, skipping...".format(self.get_date_from_file(csv_file)))
                    continue

                print("Processing '{0}'...".format(csv_file))

                for row in reader:
                    if not row or not row[0]:
                        # Empty row or row doesn't have a name
                        continue
                    stats.append(self.parse_row(*row, war=war_obj))

                WarStat.objects.bulk_create(stats)

                print("Recorded {0} stats for war on {1}".format(len(stats), self.get_date_from_file(csv_file)))
