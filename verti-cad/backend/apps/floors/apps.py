from django.apps import AppConfig

class FloorsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.floors'
    verbose_name = 'Floors'

default_app_config = 'apps.floors.apps.FloorsConfig'
