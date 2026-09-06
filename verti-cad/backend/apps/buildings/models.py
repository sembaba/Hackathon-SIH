from django.db import models
from apps.parcels.models import Parcel

class BuildingType(models.TextChoices):
    RESIDENTIAL = 'RESIDENTIAL', 'Residential'
    COMMERCIAL = 'COMMERCIAL', 'Commercial'
    MIXED_USE = 'MIXED_USE', 'Mixed Use'
    INSTITUTIONAL = 'INSTITUTIONAL', 'Institutional'
    INDUSTRIAL = 'INDUSTRIAL', 'Industrial'

class DataSource(models.TextChoices):
    SURVEY = 'SURVEY', 'Field Survey'
    DRONE = 'DRONE', 'Drone Photogrammetry'
    LIDAR = 'LIDAR', 'LiDAR Point Cloud'
    AI_EXTRACTED = 'AI_EXTRACTED', 'AI Extraction'

class Building(models.Model):
    parcel = models.ForeignKey(Parcel, on_delete=models.CASCADE, related_name='buildings')
    building_code = models.CharField(max_length=32, db_index=True)
    name = models.CharField(max_length=128)
    building_type = models.CharField(max_length=32, choices=BuildingType.choices, default=BuildingType.MIXED_USE)
    number_of_floors = models.IntegerField(default=6)
    number_of_basements = models.IntegerField(default=2)
    height = models.FloatField(help_text='Building height in meters above ground')
    ground_elevation = models.FloatField(default=280.0, help_text='Base ground elevation in meters MSL')
    geometry_2d = models.JSONField(help_text='GeoJSON footprint polygon coordinates')
    geometry_3d = models.JSONField(null=True, blank=True, help_text='GeoJSON 3D coordinates or bounding specs')
    source = models.CharField(max_length=32, choices=DataSource.choices, default=DataSource.SURVEY)
    confidence_score = models.FloatField(default=1.0, help_text='0.0 to 1.0 confidence score')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['building_code']
        unique_together = ('parcel', 'building_code')

    def __str__(self):
        return f"{self.name} ({self.building_code}) - Parcel {self.parcel.parcel_number}"
