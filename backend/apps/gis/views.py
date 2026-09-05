from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import GISLayer
from .serializers import GISLayerSerializer

class GISLayerViewSet(viewsets.ModelViewSet):
    queryset = GISLayer.objects.all()
    serializer_class = GISLayerSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'layer_id', 'layer_type']
    ordering_fields = ['name', 'layer_type']

    @action(detail=True, methods=['post'])
    def toggle_visibility(self, request, pk=None):
        layer = self.get_object()
        layer.is_visible = not layer.is_visible
        layer.save()
        return Response({'id': layer.id, 'layer_id': layer.layer_id, 'is_visible': layer.is_visible})
