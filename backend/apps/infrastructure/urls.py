from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InfrastructureViewSet

router = DefaultRouter()
router.register(r'', InfrastructureViewSet, basename='infrastructure')

urlpatterns = [
    path('', include(router.urls)),
]
