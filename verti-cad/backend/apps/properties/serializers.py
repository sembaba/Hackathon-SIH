from rest_framework import serializers
from .models import PropertyUnit

class PropertyUnitSerializer(serializers.ModelSerializer):
    floor_number = serializers.IntegerField(source='floor.floor_number', read_only=True)
    floor_label = serializers.CharField(source='floor.floor_label', read_only=True)
    building_code = serializers.CharField(source='floor.building.building_code', read_only=True)
    building_name = serializers.CharField(source='floor.building.name', read_only=True)
    parcel_number = serializers.CharField(source='floor.building.parcel.parcel_number', read_only=True)
    ulpin = serializers.CharField(source='ulpin_record.ulpin_code', read_only=True, default=None)

    class Meta:
        model = PropertyUnit
        fields = [
            'id', 'floor', 'floor_number', 'floor_label', 'building_code', 'building_name',
            'parcel_number', 'unit_number', 'property_type', 'owner_name', 'area',
            'x_min', 'x_max', 'y_min', 'y_max', 'z_min', 'z_max', 'volume',
            'geometry', 'geometry_3d', 'status', 'ulpin', 'created_at', 'updated_at'
        ]
