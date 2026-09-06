from django.urls import path
from .views import ULPINDetailView, ULPINGenerateView, ULPINValidateView

urlpatterns = [
    path('generate/', ULPINGenerateView.as_view(), name='ulpin_generate'),
    path('validate/', ULPINValidateView.as_view(), name='ulpin_validate'),
    path('<str:ulpin>/', ULPINDetailView.as_view(), name='ulpin_detail'),
]
