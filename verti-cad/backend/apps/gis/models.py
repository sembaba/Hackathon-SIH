from django.db import models

class LayerType(models.TextChoices):
    VECTOR_POLYGON = 'VECTOR_POLYGON', 'Vector Polygon'
    VECTOR_LINE = 'VECTOR_LINE', 'Vector Line'
    VECTOR_POINT = 'VECTOR_POINT', 'Vector Point'
    VOLUME_3D = 'VOLUME_3D', '3D Volumetric Extrusions'
    RASTER_TERRAIN = 'RASTER_TERRAIN', 'DEM / Raster Terrain'
    AI_EXTRACTED = 'AI_EXTRACTED', 'AI Extracted Features'

class GISLayer(models.Model):
    layer_id = models.SlugField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    layer_type = models.CharField(max_length=32, choices=LayerType.choices, default=LayerType.VECTOR_POLYGON)
    is_visible = models.BooleanField(default=True)
    opacity = models.FloatField(default=1.0)
    color_hex = models.CharField(max_length=16, default='#38bdf8')
    style_json = models.JSONField(null=True, blank=True)
    geojson_data = models.JSONField(null=True, blank=True)
    feature_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.layer_id})"
