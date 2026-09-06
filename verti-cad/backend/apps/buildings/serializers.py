from rest_framework import serializers
from .models import Building

class BuildingSerializer(serializers.ModelSerializer):
    parcel_number = serializers.CharField(source='parcel.parcel_number', read_only=True)
    floor_count = serializers.IntegerField(source='floors.count', read_only=True)

    class Meta:
        model = Building
        fields = [
            'id', 'parcel', 'parcel_number', 'building_code', 'name', 'building_type',
            'number_of_floors', 'number_of_basements', 'height', 'ground_elevation',
            'geometry_2d', 'geometry_3d', 'source', 'confidence_score', 'floor_count',
            'created_at', 'updated_at'
        ]
