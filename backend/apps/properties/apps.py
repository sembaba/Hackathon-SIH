from django.apps import AppConfig

class PropertiesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.properties'
    verbose_name = 'Properties'

default_app_config = 'apps.properties.apps.PropertiesConfig'
