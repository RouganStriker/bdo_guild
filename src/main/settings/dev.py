from main.settings.base import *  # NOQA (ignore all errors on this line)


ADMIN_MODE = True
LOCAL_DEVELOPMENT = True
DEBUG = True

PAGE_CACHE_SECONDS = 1
ALLOWED_HOSTS = ['192.168.56.102', 'localhost', '127.0.0.1', '[::1]', '0.0.0.0', 'localhost:8000']

DATABASES = {
    'default': {
        # For PostGres
        'ENGINE': "django.db.backends.postgresql_psycopg2",
        'NAME': "bdo",
        'USER': 'bdo',
        'PASSWORD': 'bdo',
        'HOST': 'localhost',
        'ATOMIC_REQUESTS': True,
    }
}

INTERNAL_IPS = ALLOWED_HOSTS

#REST_FRAMEWORK['EXCEPTION_HANDLER'] = 'django_rest_logger.handlers.rest_exception_handler'  # NOQA (ignore all errors on this line)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    # 'root': {
    #     'level': 'DEBUG',
    #     'handlers': ['django_rest_logger_handler'],
    # },
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s '
                      '%(process)d %(thread)d %(message)s'
        },
    },
    'handlers': {
        'django_rest_logger_handler': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'django.db.backends': {
            'level': 'ERROR',
            'handlers': ['django_rest_logger_handler'],
            'propagate': False,
        },
        'django_rest_logger': {
            'level': 'DEBUG',
            'handlers': ['django_rest_logger_handler'],
            'propagate': False,
        },
        'django.server': {
            'level': 'DEBUG',
            'handlers': ['django_rest_logger_handler'],
            'propagate': False,
        },
        'bdo': {
            'level': 'DEBUG',
            'handlers': ['django_rest_logger_handler'],
            'propagate': False,
        },
        'bdo.api': {
            'level': 'DEBUG',
            'handlers': ['django_rest_logger_handler'],
            'propagate': False,
        },
        'bdo.commands': {
            'level': 'DEBUG',
            'handlers': ['django_rest_logger_handler'],
            'propagate': False,
        }
    },
}

DEFAULT_LOGGER = 'django_rest_logger'

LOGGER_EXCEPTION = DEFAULT_LOGGER
LOGGER_ERROR = DEFAULT_LOGGER
LOGGER_WARNING = DEFAULT_LOGGER


# All Auth
DISCORD_CLIENT_ID = '336354195684851712'

# Chances are you won't be running the development server over
# SSL, so you should probably override the secure cookie flag
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Add local setting overrides
from main.settings.local_settings import *  # noqa

