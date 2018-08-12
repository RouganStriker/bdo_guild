from allauth.socialaccount.providers.discord.provider import DiscordProvider
from allauth.socialaccount.providers.base import ProviderException


class DiscordRPCScopeProvider(DiscordProvider):
    id = 'discord_auth'

    def extract_common_fields(self, data):
        if not data.get('verified', False):
            raise ProviderException("Login failed. Discord account is unverified.")

        name = '{0}#{1}'.format(data.get('username'), data.get('discriminator'))

        return dict(
            email=data.get('email'),
            username=data.get('id'),
            first_name=name,
            name=name
        )

    def get_default_scope(self):
        return ['identify', 'email']


provider_classes = [DiscordRPCScopeProvider]