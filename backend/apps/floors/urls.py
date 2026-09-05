from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FloorViewSet

router = DefaultRouter()
router.register(r'', FloorViewSet, basename='floor')

urlpatterns = [
    path('', include(router.urls)),
]
