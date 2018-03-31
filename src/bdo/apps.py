from django.apps import AppConfig


class BdoConfig(AppConfig):
    name = 'bdo'

    def ready(self):
        # Load signal handlers
        import bdo.signals      # noqa
