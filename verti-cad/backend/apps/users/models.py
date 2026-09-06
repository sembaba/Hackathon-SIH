from django.db import models
from django.contrib.auth.models import User

class UserRole(models.TextChoices):
    CITIZEN = 'CITIZEN', 'Citizen'
    SURVEYOR = 'SURVEYOR', 'Surveyor'
    LAND_ADMIN = 'LAND_ADMIN', 'Land Administrator'
    GIS_ADMIN = 'GIS_ADMIN', 'GIS Administrator'
    SYS_ADMIN = 'SYS_ADMIN', 'System Administrator'

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.CITIZEN)
    department = models.CharField(max_length=128, blank=True, default='')
    phone = models.CharField(max_length=32, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"
