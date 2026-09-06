from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyUnitViewSet

router = DefaultRouter()
router.register(r'', PropertyUnitViewSet, basename='property')

urlpatterns = [
    path('', include(router.urls)),
]
