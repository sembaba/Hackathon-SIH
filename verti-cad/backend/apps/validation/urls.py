from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ValidationIssueViewSet,
    RunValidationView,
    AABBValidationEngineView,
    ValidationSummaryView
)

router = DefaultRouter()
router.register(r'issues', ValidationIssueViewSet, basename='validation_issue')

urlpatterns = [
    path('run/', RunValidationView.as_view(), name='run_validation'),
    path('aabb/', AABBValidationEngineView.as_view(), name='aabb_validation'),
    path('summary/', ValidationSummaryView.as_view(), name='validation_summary'),
    path('', include(router.urls)),
]
