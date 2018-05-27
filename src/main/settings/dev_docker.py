from main.settings.dev import *  # NOQA (ignore all errors on this line)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "bdo",
        'USER': 'bdo',
        'PASSWORD': 'bdo',
        'HOST': 'postgres',
        'PORT': 5432,
        'ATOMIC_REQUESTS': True,
    }
}
