from main.settings.dev import *  # NOQA (ignore all errors on this line)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'main_dev',
        'USER': 'main',
        'PASSWORD': 'password',
        'HOST': 'postgres',
        'PORT': 5432,
    }
}
