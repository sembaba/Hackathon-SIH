from rest_framework import serializers
from .models import ValidationIssue

class ValidationIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationIssue
        fields = [
            'id', 'severity', 'issue_type', 'message', 'affected_objects',
            'location', 'status', 'created_at', 'updated_at'
        ]
