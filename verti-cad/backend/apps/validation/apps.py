from django.apps import AppConfig

class ValidationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.validation'
    verbose_name = 'Validation'

default_app_config = 'apps.validation.apps.ValidationConfig'
