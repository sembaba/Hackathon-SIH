from rest_framework import serializers
from .models import GISLayer

class GISLayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GISLayer
        fields = [
            'id', 'layer_id', 'name', 'layer_type', 'is_visible',
            'opacity', 'color_hex', 'style_json', 'geojson_data',
            'feature_count', 'created_at', 'updated_at'
        ]
