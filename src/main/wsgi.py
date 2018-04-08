"""
WSGI config for django-react-redux-base project.

"""
import os
import site
import sys

site.addsitedir('app/env/lib/python3.5/dist-packages')
BASE_PATH = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

sys.path.append(BASE_PATH)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main.settings.prod")

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
