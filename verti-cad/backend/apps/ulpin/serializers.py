from rest_framework import serializers
from .models import ULPINRecord
from apps.properties.serializers import PropertyUnitSerializer

class ULPINRecordSerializer(serializers.ModelSerializer):
    property_unit = PropertyUnitSerializer(read_only=True)

    class Meta:
        model = ULPINRecord
        fields = [
            'id', 'ulpin_code', 'state_code', 'district_code', 'parcel_code',
            'building_code', 'level_code', 'unit_code', 'is_valid', 'disclaimer',
            'property_unit', 'generated_at', 'updated_at'
        ]

class ULPINGenerateRequestSerializer(serializers.Serializer):
    state_code = serializers.CharField(max_length=8, required=False, default='UT')
    district_code = serializers.CharField(max_length=8, required=False, default='HW')
    parcel_number = serializers.CharField(max_length=32)
    building_code = serializers.CharField(max_length=32)
    floor_number = serializers.IntegerField()
    unit_number = serializers.CharField(max_length=32)
    volume = serializers.FloatField(required=False, default=375.0)

class ULPINValidateRequestSerializer(serializers.Serializer):
    ulpin = serializers.CharField(max_length=128)
