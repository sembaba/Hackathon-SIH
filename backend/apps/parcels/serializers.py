from rest_framework import serializers
from .models import Parcel

class ParcelSerializer(serializers.ModelSerializer):
    building_count = serializers.IntegerField(source='buildings.count', read_only=True)

    class Meta:
        model = Parcel
        fields = [
            'id', 'parcel_number', 'state', 'state_code', 'district', 'district_code',
            'tehsil', 'village', 'area', 'ground_elevation', 'geometry', 'centroid',
            'building_count', 'created_at', 'updated_at'
        ]
