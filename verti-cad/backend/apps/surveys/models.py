from django.db import models

class SurveyFormat(models.TextChoices):
    GEOJSON = 'GEOJSON', 'GeoJSON Vector Layer'
    CSV = 'CSV', 'CSV Point / Boundary Table'
    KML = 'KML', 'KML / KMZ Spatial File'
    LAS_LAZ = 'LAS_LAZ', 'LiDAR LAS / LAZ Point Cloud'
    DRONE_IMAGE = 'DRONE_IMAGE', 'Drone Orthomosaic Imagery'

class SurveyStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Processing'
    PROCESSED = 'PROCESSED', 'Processed & Converted'
    VERIFIED = 'VERIFIED', 'Field Survey Verified'
    REJECTED = 'REJECTED', 'Rejected (Geometry Invalid)'

class SurveyData(models.Model):
    title = models.CharField(max_length=128)
    surveyor_name = models.CharField(max_length=128, default='Authorized Surveyor')
    survey_format = models.CharField(max_length=32, choices=SurveyFormat.choices, default=SurveyFormat.GEOJSON)
    file = models.FileField(upload_to='surveys/', null=True, blank=True)
    raw_content = models.TextField(blank=True, default='', help_text='Raw text or JSON snippet')
    parsed_features_count = models.IntegerField(default=0)
    status = models.CharField(max_length=32, choices=SurveyStatus.choices, default=SurveyStatus.PROCESSED)
    survey_metadata = models.JSONField(null=True, blank=True, help_text='CRS, accuracy, CORS reference, elevation datum')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_survey_format_display()}) - {self.status}"
