import requests
from allauth.socialaccount.providers.discord.views import DiscordOAuth2Adapter
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2CallbackView,
    OAuth2LoginView,
)
from django.contrib import messages
from django.contrib.auth.views import LoginView
from django.http import HttpResponseRedirect

from accounts.provider import DiscordRPCScopeProvider


class ReactLoginView(LoginView):
    def __init__(self, **kwargs):
        super(ReactLoginView, self).__init__(**kwargs)

        self.http_method_names = ['post']

    def form_invalid(self, form):
        messages.add_message(self.request, messages.ERROR, 'Hello world.')

        return HttpResponseRedirect('/')

    def post(self, request, *args, **kwargs):
        return super(ReactLoginView, self).post(request, *args, **kwargs)


class DiscordRPCScopeOAuth2Adapter(DiscordOAuth2Adapter):
    provider_id = DiscordRPCScopeProvider.id


oauth2_login = OAuth2LoginView.adapter_view(DiscordRPCScopeOAuth2Adapter)
oauth2_callback = OAuth2CallbackView.adapter_view(DiscordRPCScopeOAuth2Adapter)
