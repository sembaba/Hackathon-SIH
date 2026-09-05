from django.db import models
from apps.floors.models import Floor

class PropertyType(models.TextChoices):
    APARTMENT = 'APARTMENT', 'Apartment'
    OFFICE = 'OFFICE', 'Commercial Office'
    SHOP = 'SHOP', 'Retail Shop'
    PARKING = 'PARKING', 'Underground/Covered Parking'
    UTILITY = 'UTILITY', 'Utility / Plant Room'
    INFRASTRUCTURE = 'INFRASTRUCTURE', 'Subsurface Infrastructure'
    AIR_RIGHT = 'AIR_RIGHT', 'Air Right'
    OTHER = 'OTHER', 'Other'

class PropertyStatus(models.TextChoices):
    REGISTERED = 'REGISTERED', 'Registered & Verified'
    PROVISIONAL = 'PROVISIONAL', 'Provisional Draft'
    CONFLICT_FLAGGED = 'CONFLICT_FLAGGED', 'Conflict Flagged'
    DISPUTED = 'DISPUTED', 'Disputed Ownership'

class PropertyUnit(models.Model):
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='properties')
    unit_number = models.CharField(max_length=32, db_index=True)
    property_type = models.CharField(max_length=32, choices=PropertyType.choices, default=PropertyType.APARTMENT)
    owner_name = models.CharField(max_length=128, default='Public Allotment')
    owner_id_hash = models.CharField(max_length=64, blank=True, default='')
    area = models.FloatField(help_text='Carpet/Built area in square meters')
    
    # 3D Spatial Boundaries
    x_min = models.FloatField(null=True, blank=True, help_text='Metric offset Xmin')
    x_max = models.FloatField(null=True, blank=True, help_text='Metric offset Xmax')
    y_min = models.FloatField(null=True, blank=True, help_text='Metric offset Ymin')
    y_max = models.FloatField(null=True, blank=True, help_text='Metric offset Ymax')
    z_min = models.FloatField(help_text='Bottom elevation (Zmin) in meters')
    z_max = models.FloatField(help_text='Top elevation (Zmax) in meters')
    volume = models.FloatField(null=True, blank=True, help_text='3D Volume in cubic meters')

    geometry = models.JSONField(help_text='GeoJSON 2D boundary polygon coordinates')
    geometry_3d = models.JSONField(null=True, blank=True, help_text='GeoJSON 3D coordinates or volumetric prism')

    status = models.CharField(max_length=32, choices=PropertyStatus.choices, default=PropertyStatus.REGISTERED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['floor__floor_number', 'unit_number']
        unique_together = ('floor', 'unit_number')

    def save(self, *args, **kwargs):
        if self.z_max is not None and self.z_min is not None and self.area is not None:
            height = max(0.0, self.z_max - self.z_min)
            self.volume = round(self.area * height, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Unit {self.unit_number} ({self.floor.floor_label}) - {self.owner_name}"
