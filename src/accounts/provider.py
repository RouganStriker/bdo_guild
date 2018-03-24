from allauth.socialaccount.providers.discord.provider import DiscordProvider


class DiscordRPCScopeProvider(DiscordProvider):
    id = 'discord_auth'

    def extract_common_fields(self, data):
        return dict(
            email=data.get('email'),
            username=data.get('username'),
            name=data.get('username'),
        )

    def get_default_scope(self):
        return ['identify', 'guilds']


provider_classes = [DiscordRPCScopeProvider]