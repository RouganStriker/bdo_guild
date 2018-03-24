import os

from main.settings.base import *  # NOQA (ignore all errors on this line)


DEBUG = False
TEMPLATE_DEBUG = DEBUG

PAGE_CACHE_SECONDS = 60

# TODO: n a real production server this should have a proper url
ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'bdo',
        'USER': 'bdo',
        'PASSWORD': os.environ.get('BDO_GUILD_DB_PASSWORD', None),
        'HOST': 'postgres',
        'PORT': 5432,
    }
}

# ####### Logging

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s '
                      '%(process)d %(thread)d %(message)s'
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/bdo/main.log',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        '': {
            'level': 'INFO',
            'handlers': ['file'],
            'propagate': False,
        },
    },
}
