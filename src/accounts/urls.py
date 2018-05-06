from allauth.socialaccount.providers.oauth2.urls import default_urlpatterns

from accounts.provider import DiscordRPCScopeProvider
from django.contrib.auth.views import LogoutView

from django.conf.urls import url
from accounts.views import ReactLoginView

urlpatterns = default_urlpatterns(DiscordRPCScopeProvider)

urlpatterns += [
    url(r'^login', ReactLoginView.as_view(), name='accounts-login'),
    url(r'^logout', LogoutView.as_view(), name='accounts-logout'),
]
