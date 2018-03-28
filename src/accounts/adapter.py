from allauth.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib import messages
from django.http import HttpResponseRedirect


class DiscordAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        try:
            profile = sociallogin.user.profile
        except AttributeError:
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
