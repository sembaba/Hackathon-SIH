from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Building
from .serializers import BuildingSerializer
from apps.floors.serializers import FloorSerializer

class BuildingViewSet(viewsets.ModelViewSet):
    queryset = Building.objects.all().select_related('parcel').prefetch_related('floors')
    serializer_class = BuildingSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['building_code', 'name', 'building_type', 'parcel__parcel_number']
    ordering_fields = ['building_code', 'height', 'number_of_floors', 'created_at']

    @action(detail=True, methods=['get'])
    def floors(self, request, pk=None):
        building = self.get_object()
        floors = building.floors.all().order_by('floor_number')
        serializer = FloorSerializer(floors, many=True)
        return Response(serializer.data)
