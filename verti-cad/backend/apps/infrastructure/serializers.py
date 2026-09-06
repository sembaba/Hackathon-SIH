from rest_framework import serializers
from .models import Infrastructure

class InfrastructureSerializer(serializers.ModelSerializer):
    parcel_number = serializers.CharField(source='parcel.parcel_number', read_only=True)

    class Meta:
        model = Infrastructure
        fields = [
            'id', 'parcel', 'parcel_number', 'asset_id', 'name', 'asset_type',
            'depth_min', 'depth_max', 'diameter_m', 'geometry', 'status', 'created_at'
        ]
