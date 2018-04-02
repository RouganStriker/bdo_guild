"""Django settings for main project."""

import os

ATOMIC_REQUESTS = True

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # remove /sswmain/settings to get base folder

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("BDO_GUILD_SECRET_KEY")

DEBUG = True

ALLOWED_HOSTS = ['localhost']

# Application definition

SITE_ID = 1

LOGIN_REDIRECT_URL = '/'

APPEND_SLASH = True

AUTHENTICATION_BACKENDS = (
    # Uncomment following if you want to access the admin
    'django.contrib.auth.backends.ModelBackend',
    #'allauth.account.auth_backends.AuthenticationBackend',
)

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'django.contrib.messages',
    'django.contrib.sessions',
    'django.contrib.admin',
    'django.contrib.sites',

    'rest_framework',
    'knox',
    'django_extensions',

    'accounts',
    'base',
    'bdo',

    # 3rd party
    
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'security',
]

MIDDLEWARE_CLASSES = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 3rd party
    'security.middleware.SessionExpiryPolicyMiddleware',
    'security.middleware.LoginRequiredMiddleware',
    'security.middleware.NoConfidentialCachingMiddleware',
    'security.middleware.ContentSecurityPolicyMiddleware',
    'security.middleware.StrictTransportSecurityMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'bdo.context_processors.get_user_data',
            ],
        },
    },
]

ROOT_URLCONF = 'main.urls'

WSGI_APPLICATION = 'main.wsgi.application'

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

ACCOUNT_ACTIVATION_DAYS = 7  # days

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static_root')
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'static_dist'),
)

# store static files locally and serve with whitenoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    },
}
# ############# REST FRAMEWORK ###################

REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'api.exceptions.custom_exception_handler',
    'DEFAULT_PERMISSION_CLASSES': (),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'api.pagination.Pagination',
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    )
}

# ############ REST KNOX ########################
REST_KNOX = {
    'SECURE_HASH_ALGORITHM': 'cryptography.hazmat.primitives.hashes.SHA512',
    'AUTH_TOKEN_CHARACTER_LENGTH': 64,
    'USER_SERIALIZER': 'knox.serializers.UserSerializer'
}


# Django Security
LOGIN_URL = '/login/'

LOGIN_EXEMPT_URLS = [
    'api/',
    STATIC_URL.lstrip('/'),
    MEDIA_URL.lstrip('/'),
    'login/',
    'accounts',
    'admin/',
]

CSP_DICT = {
    "default-src": ["self"],
    "img-src": ["self", "data:", "blob:"],
    "script-src": ["self", "unsafe-eval", "unsafe-inline"],
    "style-src": ["self", "unsafe-inline"]
}

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

X_FRAME_OPTIONS = 'SAMEORIGIN'

SESSION_COOKIE_HTTPONLY = True

MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'
SESSION_SERIALIZER = 'django.contrib.sessions.serializers.PickleSerializer'

# Use cookies in-memory instead of on persistent storage
CSRF_COOKIE_AGE = None

# Don't change this or frontend code will break.
CSRF_COOKIE_NAME = 'bdo-csrftoken'

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Session expires in 2 day
SESSION_COOKIE_AGE = 172800

# Inactive timeout is 2 hours
SESSION_INACTIVITY_TIMEOUT = 7200

# TODO: Should move to JSON serializer: need to move datetime out of session.
#SESSION_SERIALIZER = 'django.contrib.sessions.serializers.PickleSerializer'

# Session Cookies should expire on browser close.
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

CSP_DICT = {
    "img-src": ["self", "https://cdn.discordapp.com"]
}


# All Auth
ACCOUNT_EMAIL_VERIFICATION = "none"
SOCIALACCOUNT_ADAPTER = 'accounts.adapter.DiscordAccountAdapter'
ACCOUNT_LOGOUT_ON_GET = True
SOCIALACCOUNT_STORE_TOKENS = False

DISCORD_BOT_TOKEN = os.environ.get('BDO_GUILD_BOT_TOKEN', None)

# App Settings
## Bump times by an hour if True
DST_ADJUSTED = False
