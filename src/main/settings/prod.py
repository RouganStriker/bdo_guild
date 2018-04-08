import os

from main.settings.base import *  # NOQA (ignore all errors on this line)


PAGE_CACHE_SECONDS = 60

# TODO: n a real production server this should have a proper url
ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'bdo',
        'USER': 'bdo',
        'PASSWORD': os.environ.get('BDO_GUILD_DB_PASSWORD', None),
        'HOST': '127.0.0.1',
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
        'web_log': {
            'level': 'DEBUG',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'when': 'D',
            'interval': 1,
            'backupCount': 7,
            'filename': '/var/log/bdo/main.log',
            'formatter': 'verbose'
        },
        'command_log': {
            'level': 'DEBUG',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'when': 'D',
            'interval': 1,
            'backupCount': 7,
            'filename': '/var/log/bdo/command.log',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        '': {
            'level': 'INFO',
            'handlers': ['web_log'],
            'propagate': False,
        },
        'bdo': {
            'level': 'DEBUG',
            'handlers': ['web_log'],
            'propagate': False,
        },
        'bdo.commands': {
            'level': 'command_log',
            'handlers': ['file'],
            'propagate': False,
        },
    },
}

# Add local setting overrides
from main.settings.local_settings import *  # noqa
