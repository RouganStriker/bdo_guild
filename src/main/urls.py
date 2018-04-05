from allauth.account.views import login
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.http import Http404
from django.views.defaults import page_not_found


from base import views as base_views

urlpatterns = []

if getattr(settings, "ADMIN_MODE", False):
    # We developing locally or are we loading these URLS into a
    # remote admin: expose the admin related urls.
    admin.autodiscover()

    urlpatterns += [
        url(r'^admin/', include(admin.site.urls)),
    ]

if getattr(settings, "LOCAL_DEVELOPMENT", False):
    # serve media statically only if we are developing locally.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Disable un-needed all-auth URLs
disabled_account_url_data = [
    (r"^signup/$", "account_signup"),
    (r"^password/change/$", "account_change_password"),
    (r"^password/set/$", "account_set_password"),
    (r"^inactive/$", "account_inactive"),
    (r"^email/$", "account_email"),
    (r"^confirm-email/$", "account_email_verification_sent"),
    (r"^confirm-email/(?P<key>[-:\w]+)/$", "account_confirm_email"),
    (r"^password/reset/$", "account_reset_password"),
    (r"^password/reset/done/$", "account_reset_password_done"),
    (r"^password/reset/key/(?P<uidb36>[0-9A-Za-z]+)-(?P<key>.+)/$", "account_reset_password_from_key"),
    (r"^password/reset/key/done/$", "account_reset_password_from_key_done"),
]

disabled_account_urls = [
    url(pattern, page_not_found, {'exception': Http404()}, name)
    for pattern, name in disabled_account_url_data
]

# Override social urls
social_urls = [
    url(r'^login/cancelled/$', login, {}, name='socialaccount_login_cancelled'),
    url(r'^login/error/$', login, {}, name='socialaccount_login_error'),
    url(r'^signup/$', page_not_found, {'exception': Http404()}, name='socialaccount_signup'),
]

urlpatterns += [
    
    url(r'^accounts/', include(disabled_account_urls)),
    url(r'^accounts/social/', include(social_urls)),
    url(r'^accounts/', include('accounts.urls')),

    url(r'^api/', include('api.urls', namespace='api')),
    url(r'^api/v1/getdata/', include('base.urls', namespace='base')),

    url(r'', base_views.IndexView.as_view(), name='index'),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
