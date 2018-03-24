from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class DiscordAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        try:
            profile = sociallogin.user.profile
        except AttributeError:
            return

        profile.refresh_guilds()

    def save_user(self, request, sociallogin, form=None):
        user = super(DiscordAccountAdapter, self).save_user(request, sociallogin, form)

        # # Init a user profile
        # Profile.objects.get_or_create(user=user,
        #                               discord_id=sociallogin.account.extra_date['discord_id'])

        return user
