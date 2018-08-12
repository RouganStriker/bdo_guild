from logging import getLogger

from allauth.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib import messages
from django.http import HttpResponseRedirect

logger = getLogger('bdo')


class DiscordAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        if sociallogin.user.pk is not None:
            # Ensure updates are saved
            common_fields = sociallogin.account.get_provider().extract_common_fields(sociallogin.account.extra_data)
            user = sociallogin.user
            user.email = common_fields['email']
            user.first_name = common_fields['first_name']
            user.save()

        try:
            profile = sociallogin.user.profile
        except AttributeError:
            logger.warning("New user {0} has no profile".format(sociallogin))
            return

        profile.refresh_guilds()

    def authentication_error(self,
                             request,
                             provider_id,
                             error=None,
                             exception=None,
                             extra_context=None):
        messages.error(request, exception)

        raise ImmediateHttpResponse(HttpResponseRedirect('/login/'))
