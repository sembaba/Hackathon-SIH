from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PropertyUnit
from .serializers import PropertyUnitSerializer

class PropertyUnitViewSet(viewsets.ModelViewSet):
    queryset = PropertyUnit.objects.all().select_related(
        'floor', 'floor__building', 'floor__building__parcel', 'ulpin_record'
    )
    serializer_class = PropertyUnitSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'unit_number', 'owner_name', 'property_type',
        'floor__building__building_code', 'floor__building__name',
        'floor__building__parcel__parcel_number', 'ulpin_record__ulpin_code'
    ]
    ordering_fields = ['floor__floor_number', 'unit_number', 'area', 'volume', 'z_min']

    @action(detail=False, methods=['get'])
    def by_floor(self, request):
        floor_id = request.query_params.get('floor_id')
        if not floor_id:
            return Response({'error': 'floor_id query param is required'}, status=400)
        units = self.queryset.filter(floor_id=floor_id)
        serializer = self.get_serializer(units, many=True)
        return Response(serializer.data)
