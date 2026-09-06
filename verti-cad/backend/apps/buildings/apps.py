from django.apps import AppConfig

class BuildingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.buildings'
    verbose_name = 'Buildings'

default_app_config = 'apps.buildings.apps.BuildingsConfig'
