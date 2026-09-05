from rest_framework import viewsets, permissions, filters
from .models import Infrastructure
from .serializers import InfrastructureSerializer

class InfrastructureViewSet(viewsets.ModelViewSet):
    queryset = Infrastructure.objects.all().select_related('parcel')
    serializer_class = InfrastructureSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['asset_id', 'name', 'asset_type', 'parcel__parcel_number']
    ordering_fields = ['depth_min', 'asset_type', 'created_at']
