"""
VERTI-CAD Central URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.validation.views import RunValidationView
from apps.gis.ai_and_search_views import AIProcessView, UnifiedSearchView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core GIS and 3D Property API Endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/parcels/', include('apps.parcels.urls')),
    path('api/buildings/', include('apps.buildings.urls')),
    path('api/floors/', include('apps.floors.urls')),
    path('api/properties/', include('apps.properties.urls')),
    path('api/ulpin/', include('apps.ulpin.urls')),
    path('api/infrastructure/', include('apps.infrastructure.urls')),
    path('api/validation/', include('apps.validation.urls')),
    path('api/topology/validate/', RunValidationView.as_view(), name='topology_validate'),
    path('api/topology/', include('apps.validation.urls')),
    path('api/gis/', include('apps.gis.urls')),
    path('api/surveys/', include('apps.surveys.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/ai/process/', AIProcessView.as_view(), name='ai_process'),
    path('api/search/', UnifiedSearchView.as_view(), name='unified_search'),

    # Interactive API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
