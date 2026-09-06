from django.db import models

class IssueSeverity(models.TextChoices):
    INFO = 'INFO', 'Informational'
    WARNING = 'WARNING', 'Warning'
    ERROR = 'ERROR', 'Error'
    CRITICAL = 'CRITICAL', 'Critical Violation'

class IssueType(models.TextChoices):
    VERTICAL_OVERLAP = 'VERTICAL_OVERLAP', '3D Vertical Overlap Detected'
    HORIZONTAL_OVERLAP = 'HORIZONTAL_OVERLAP', '2D Spatial Encroachment'
    VOLUMETRIC_COLLISION = 'VOLUMETRIC_COLLISION', 'Full 3D Volumetric Collision'
    OUTSIDE_PARCEL = 'OUTSIDE_PARCEL', 'Property/Building Outside Parcel Boundary'
    FLOOR_GAP = 'FLOOR_GAP', 'Unregistered Floor Gap'
    INVALID_Z_RANGE = 'INVALID_Z_RANGE', 'Invalid Z-Range (Zmin >= Zmax)'
    DUPLICATE_ULPIN = 'DUPLICATE_ULPIN', 'Duplicate 3D ULPIN Conflict'
    INFRASTRUCTURE_COLLISION = 'INFRASTRUCTURE_COLLISION', 'Underground Utility Collision'
    GEOMETRY_INVALID = 'GEOMETRY_INVALID', 'Invalid Geometric Topology'

class IssueStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active / Unresolved'
    ACKNOWLEDGED = 'ACKNOWLEDGED', 'Acknowledged by Surveyor'
    RESOLVED = 'RESOLVED', 'Resolved / Rectified'
    IGNORED = 'IGNORED', 'Permitted Deviation'

class ValidationIssue(models.Model):
    severity = models.CharField(max_length=16, choices=IssueSeverity.choices, default=IssueSeverity.ERROR)
    issue_type = models.CharField(max_length=32, choices=IssueType.choices, default=IssueType.VERTICAL_OVERLAP)
    message = models.TextField()
    affected_objects = models.JSONField(help_text='List of identifiers or ULPINs involved e.g. ["503", "504"]')
    location = models.JSONField(null=True, blank=True, help_text='GeoJSON Point or Polygon of conflict')
    status = models.CharField(max_length=16, choices=IssueStatus.choices, default=IssueStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.issue_type}: {self.message[:60]}"
