from django.urls import path
from .views import (
    PipelineRunView,
    PipelineStageView,
    PipelineLatestView,
    PipelineArchitectureView,
)

urlpatterns = [
    path('run/', PipelineRunView.as_view(), name='pipeline_run'),
    path('stages/<str:stage>/', PipelineStageView.as_view(), name='pipeline_stage'),
    path('latest/', PipelineLatestView.as_view(), name='pipeline_latest'),
    path('architecture/', PipelineArchitectureView.as_view(), name='pipeline_architecture'),
]
