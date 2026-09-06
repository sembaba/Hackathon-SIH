from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SurveyDataViewSet, SurveyUploadView

router = DefaultRouter()
router.register(r'', SurveyDataViewSet, basename='survey')

urlpatterns = [
    path('upload/', SurveyUploadView.as_view(), name='survey_upload'),
    path('', include(router.urls)),
]
