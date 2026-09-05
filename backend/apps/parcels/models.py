from django.db import models

class Parcel(models.Model):
    parcel_number = models.CharField(max_length=64, unique=True, db_index=True)
    state = models.CharField(max_length=64, default='Uttarakhand')
    state_code = models.CharField(max_length=8, default='UT')
    district = models.CharField(max_length=64, default='Haridwar')
    district_code = models.CharField(max_length=8, default='HW')
    tehsil = models.CharField(max_length=64, default='Haridwar')
    village = models.CharField(max_length=64, default='Shivalik Nagar')
    area = models.FloatField(help_text='Area in square meters')
    ground_elevation = models.FloatField(default=280.0, help_text='Ground elevation in meters MSL')
    geometry = models.JSONField(help_text='GeoJSON Polygon footprint coordinates [[lon, lat], ...]')
    centroid = models.JSONField(null=True, blank=True, help_text='GeoJSON Point [lon, lat]')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['parcel_number']

    def __str__(self):
        return f"Parcel {self.parcel_number} ({self.district}, {self.state})"
