from django.db import models
from apps.buildings.models import Building

class Floor(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='floors')
    floor_number = models.IntegerField(help_text='Negative for basements, 0 for ground, positive for upper floors')
    floor_label = models.CharField(max_length=64, help_text='Display name e.g. Basement -2, Ground, Floor 5')
    level_code = models.CharField(max_length=16, help_text='Standardized level code e.g. B02, B01, G00, F05')
    z_min = models.FloatField(help_text='Bottom elevation in meters relative to ground')
    z_max = models.FloatField(help_text='Top elevation in meters relative to ground')
    floor_height = models.FloatField(help_text='Net vertical height of the floor in meters')
    geometry = models.JSONField(null=True, blank=True, help_text='GeoJSON 2D floor boundary polygon')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['building', 'floor_number']
        unique_together = ('building', 'floor_number')

    def save(self, *args, **kwargs):
        if not self.floor_height and self.z_max is not None and self.z_min is not None:
            self.floor_height = round(self.z_max - self.z_min, 2)
        if not self.level_code:
            if self.floor_number < 0:
                self.level_code = f"B{abs(self.floor_number):02d}"
            elif self.floor_number == 0:
                self.level_code = "G00"
            else:
                self.level_code = f"F{self.floor_number:02d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.building.building_code} - {self.floor_label} ({self.level_code})"
