from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GISLayerViewSet
from .views_3d import Spatial3DExtentView, PointCloudMetadataView, DEMTerrainMetadataView

router = DefaultRouter()
router.register(r'layers', GISLayerViewSet, basename='gis_layer')

urlpatterns = [
    path('3d-extent/', Spatial3DExtentView.as_view(), name='gis_3d_extent'),
    path('point-cloud-meta/', PointCloudMetadataView.as_view(), name='gis_point_cloud_meta'),
    path('dem-terrain/', DEMTerrainMetadataView.as_view(), name='gis_dem_terrain'),
    path('', include(router.urls)),
]
