from django.db import models
from apps.properties.models import PropertyUnit

class ULPINRecord(models.Model):
    property_unit = models.OneToOneField(PropertyUnit, on_delete=models.CASCADE, related_name='ulpin_record')
    ulpin_code = models.CharField(max_length=64, unique=True, db_index=True)
    state_code = models.CharField(max_length=8, default='UT')
    district_code = models.CharField(max_length=8, default='HW')
    parcel_code = models.CharField(max_length=32)
    building_code = models.CharField(max_length=32)
    level_code = models.CharField(max_length=16)
    unit_code = models.CharField(max_length=16)
    is_valid = models.BooleanField(default=True)
    disclaimer = models.CharField(
        max_length=256,
        default='Prototype 3D ULPIN / Demonstration Identifier (Research Model)'
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ulpin_code']

    def __str__(self):
        return f"{self.ulpin_code} -> Unit {self.property_unit.unit_number}"
