from rest_framework import serializers
from .models import SurveyData

class SurveyDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyData
        fields = [
            'id', 'title', 'surveyor_name', 'survey_format', 'file',
            'raw_content', 'parsed_features_count', 'status', 'survey_metadata', 'created_at'
        ]
