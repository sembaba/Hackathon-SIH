from rest_framework import viewsets, permissions, filters
from .models import Floor
from .serializers import FloorSerializer

class FloorViewSet(viewsets.ModelViewSet):
    queryset = Floor.objects.all().select_related('building').prefetch_related('properties')
    serializer_class = FloorSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['floor_label', 'level_code', 'building__building_code', 'building__name']
    ordering_fields = ['floor_number', 'z_min', 'building']
