from logging import getLogger

from django.core.management import BaseCommand, CommandError

from bdo.models.character import Profile
from bdo.models.guild import Guild, GuildMember, GuildRole

logger = getLogger('bdo.commands')


class Command(BaseCommand):
    help = 'Create a Guild'

    def add_arguments(self, parser):
        parser.add_argument('guild_name')
        parser.add_argument('gm_family_name')

    def handle(self, *args, **options):
        guild_name = options.get('guild_name')
        gm_family_name = options.get('gm_family_name')

        try:
            gm_profile = Profile.objects.get(family_name__iexact=gm_family_name)
        except Profile.DoesNotExist:
            raise CommandError("No profile with family name `{0}` exists".format(gm_family_name))

        if Guild.objects.filter(name__iexact=guild_name).exists():
            raise CommandError("Guild with name `{0}` already exists".format(guild_name))

        guild = Guild.objects.create(name=guild_name)
        gm = GuildRole.guild_master()

        GuildMember.objects.create(guild=guild, user=gm_profile, role=gm)

        logger.info("Successfully created new guild [{0}] for {1}".format(guild_name, gm_family_name))
