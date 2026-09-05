from django.apps import AppConfig

class ParcelsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.parcels'
    verbose_name = 'Parcels'

default_app_config = 'apps.parcels.apps.ParcelsConfig'
