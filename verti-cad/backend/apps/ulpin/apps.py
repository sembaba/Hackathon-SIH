from django.apps import AppConfig

class UlpinConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ulpin'
    verbose_name = 'ULPIN'

default_app_config = 'apps.ulpin.apps.UlpinConfig'
