from logging import getLogger

from django.core.management import BaseCommand, CommandError

from bdo.models.character import Profile
from bdo.models.guild import Guild, GuildMember, GuildRole

logger = getLogger('bdo.commands')


class Command(BaseCommand):
    help = 'Change Guild Master'

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

        try:
            guild = Guild.objects.get(name__iexact=guild_name)
        except Guild.DoesNotExist:
            raise CommandError("Guild with name `{0}` does not exist".format(guild_name))

        gm = GuildRole.guild_master()
        member = GuildRole.objects.get(name="Member")

        GuildMember.objects.filter(guild=guild, role=gm).update(role=member)
        GuildMember.objects.update_or_create(guild=guild, user=gm_profile, defaults={"role": gm})

        logger.info("Successfully changed the guild master of {0} to {1}".format(guild_name, gm_family_name))
