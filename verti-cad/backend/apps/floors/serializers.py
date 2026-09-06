from rest_framework import serializers
from .models import Floor

class FloorSerializer(serializers.ModelSerializer):
    building_code = serializers.CharField(source='building.building_code', read_only=True)
    building_name = serializers.CharField(source='building.name', read_only=True)
    property_count = serializers.IntegerField(source='properties.count', read_only=True)

    class Meta:
        model = Floor
        fields = [
            'id', 'building', 'building_code', 'building_name', 'floor_number',
            'floor_label', 'level_code', 'z_min', 'z_max', 'floor_height',
            'geometry', 'property_count', 'created_at'
        ]
