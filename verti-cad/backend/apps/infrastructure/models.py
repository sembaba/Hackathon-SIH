from django.db import models
from apps.parcels.models import Parcel

class AssetType(models.TextChoices):
    WATER_SUPPLY = 'WATER_SUPPLY', 'Potable Water Pipeline'
    SEWERAGE = 'SEWERAGE', 'Sewer / Storm Drainage'
    ELECTRICITY = 'ELECTRICITY', 'High-Voltage Power Duct'
    METRO_TUNNEL = 'METRO_TUNNEL', 'Subway / Metro Tunnel'
    GAS_PIPELINE = 'GAS_PIPELINE', 'Natural Gas Pipeline'
    TELECOM = 'TELECOM', 'Fiber Optic Telecom Duct'

class AssetStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active & Operational'
    MAINTENANCE = 'MAINTENANCE', 'Under Maintenance'
    PLANNED = 'PLANNED', 'Proposed / Planned'
    DECOMMISSIONED = 'DECOMMISSIONED', 'Decommissioned'

class Infrastructure(models.Model):
    parcel = models.ForeignKey(Parcel, on_delete=models.CASCADE, related_name='infrastructure_assets')
    asset_id = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    asset_type = models.CharField(max_length=32, choices=AssetType.choices, default=AssetType.WATER_SUPPLY)
    depth_min = models.FloatField(help_text='Top depth in meters (negative Z or distance below ground e.g. -2.0)')
    depth_max = models.FloatField(help_text='Bottom depth in meters (negative Z e.g. -4.5)')
    diameter_m = models.FloatField(default=0.5, help_text='Diameter/thickness in meters')
    geometry = models.JSONField(help_text='GeoJSON LineString or Polygon coordinates')
    status = models.CharField(max_length=32, choices=AssetStatus.choices, default=AssetStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['depth_min', 'asset_id']

    def __str__(self):
        return f"{self.name} ({self.asset_id}) [{self.get_asset_type_display()}]"
