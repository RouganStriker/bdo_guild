from collections import defaultdict, OrderedDict
from functools import reduce
from logging import getLogger

from django.core.management import BaseCommand, CommandError

from bdo.models.character import Profile

logger = getLogger()


class Command(BaseCommand):
    help = 'Migrating profiles'

    def add_arguments(self, parser):
        parser.add_argument('old_family_name')
        parser.add_argument('new_family_name')

    def handle(self, *args, **options):
        old_family_name = options.get('old_family_name')
        new_family_name = options.get('new_family_name')

        try:
            old_profile = Profile.objects.get(family_name__iexact=old_family_name)
        except Profile.DoesNotExist:
            raise CommandError("No profile with family name `{0}` exists".format(new_family_name))
        try:
            new_profile = Profile.objects.get(family_name__iexact=new_family_name)
        except Profile.DoesNotExist:
            raise CommandError("No profile with family name `{0}` exists".format(new_family_name))

        if new_profile.user is not None:
            raise CommandError("New Profile already has an attached user")
        if old_profile.user is None:
            raise CommandError("Old Profile does not have an attached user")

        new_profile.user = old_profile.user
        new_profile.discord_id = old_profile.discord_id
        new_profile.preferred_roles.set(old_profile.preferred_roles.all())
        new_profile.availability = old_profile.availability
        new_profile.auto_sign_up = old_profile.auto_sign_up

        old_profile.character_set.update(profile=new_profile)
        old_profile.attendance_set.update(user_profile=new_profile)
        old_profile.user = None

        old_profile.save()
        new_profile.save()

        logger.info("Migrated {0} to {1}".format(old_family_name, new_family_name))
