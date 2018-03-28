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
    help = 'Import Node War attendance from CSV file'
    _cached_profiles = {}

    def add_arguments(self, parser):
        parser.add_argument('guild')
        parser.add_argument('attendance_csv')

    def get_profile(self, og_family_name):
        family_name = og_family_name.lower()

        if family_name in self._cached_profiles:
            return self._cached_profiles.get(family_name)

        profile = Profile.objects.get_or_create(defaults={"family_name": og_family_name},
                                                family_name__iexact=og_family_name)[0]

        self._cached_profiles[family_name] = profile

        return profile

    def parse_row(self, row, wars):
        family_name = row[0]
        profile = self.get_profile(family_name)
        attendance = []

        for index, column in enumerate(row[3:]):
            if column == "MISS":
                is_attending = WarAttendance.AttendanceStatus.NOT_ATTENDING.value
            elif column == "FALSE":
                is_attending = WarAttendance.AttendanceStatus.NO_SHOW.value
            else:
                continue

            attendance.append(WarAttendance(is_attending=is_attending,
                                            user_profile=profile,
                                            war=wars[index]))

        return attendance

    def parse_date_row(self, row, guild):
        """Convert dates to War objects"""
        wars = []

        # Dates start after 3rd column
        for datestring in row[3:]:
            month, day, year = datestring.split('/')
            date = datetime(
                year=int(year),
                month=int(month),
                day=int(day),
                hour=21,
                minute=0,
                second=0,
                tzinfo=timezone('US/Eastern')
            )

            wars.append(War.objects.get_or_create(guild=guild, date=date)[0])

        return wars

    def handle(self, *args, **options):
        try:
            guild = Guild.objects.get(name=options.get('guild'))
        except Guild.DoesNotExist:
            raise CommandError("Invalid guild '{0}'".format(options.get('guild')))

        csv_file = options.get('attendance_csv')
        attendance = []

        with open(csv_file) as f, atomic():
            reader = csv.reader(f)

            # First row contains dates
            wars = self.parse_date_row(next(reader, None), guild)

            # Skip header row
            next(reader, None)

            for row in reader:
                if not row or not row[0]:
                    # Empty row or row doesn't have a family name
                    continue

                attendance.extend(self.parse_row(row, wars))

        WarAttendance.objects.bulk_create(attendance)

        print("Created {0} attendance entries".format(len(attendance)))
