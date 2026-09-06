from rest_framework import viewsets, permissions, filters
from .models import Parcel
from .serializers import ParcelSerializer

class ParcelViewSet(viewsets.ModelViewSet):
    queryset = Parcel.objects.all().prefetch_related('buildings')
    serializer_class = ParcelSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['parcel_number', 'state', 'district', 'village']
    ordering_fields = ['parcel_number', 'area', 'created_at']
