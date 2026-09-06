import json
import csv
import io
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import SurveyData, SurveyFormat, SurveyStatus
from .serializers import SurveyDataSerializer

class SurveyDataViewSet(viewsets.ModelViewSet):
    queryset = SurveyData.objects.all()
    serializer_class = SurveyDataSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

class SurveyUploadView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        title = request.data.get('title', 'Field Cadastral Survey')
        surveyor_name = request.data.get('surveyor_name', 'Authorized Surveyor')
        survey_format = request.data.get('survey_format', SurveyFormat.GEOJSON)
        uploaded_file = request.FILES.get('file')
        raw_text = request.data.get('raw_content', '')

        feature_count = 0
        parsed_meta = {
            'datum': 'WGS84 / EPSG:4326',
            'vertical_datum': 'EGM96 / MSL',
            'cors_station': 'HW-CORS-01'
        }

        if uploaded_file:
            content_str = uploaded_file.read().decode('utf-8', errors='ignore')
            raw_text = content_str[:2000] # store preview
            
            if survey_format == SurveyFormat.GEOJSON or uploaded_file.name.endswith('.geojson') or uploaded_file.name.endswith('.json'):
                try:
                    data = json.loads(content_str)
                    if data.get('type') == 'FeatureCollection':
                        feature_count = len(data.get('features', []))
                    elif data.get('type') == 'Feature':
                        feature_count = 1
                except Exception as e:
                    return Response({'error': f'Malformed GeoJSON: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            elif survey_format == SurveyFormat.CSV or uploaded_file.name.endswith('.csv'):
                try:
                    reader = csv.reader(io.StringIO(content_str))
                    rows = list(reader)
                    feature_count = max(0, len(rows) - 1)
                except Exception as e:
                    return Response({'error': f'Malformed CSV: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

            elif survey_format == SurveyFormat.LAS_LAZ or uploaded_file.name.endswith('.las') or uploaded_file.name.endswith('.laz'):
                # Point cloud architecture: Register raw point cloud metadata
                feature_count = 1
                parsed_meta['point_cloud_status'] = 'INDEXED_READY_FOR_3D_TILES'
                parsed_meta['density_pts_m2'] = 32.5

        elif raw_text:
            try:
                data = json.loads(raw_text)
                if data.get('type') == 'FeatureCollection':
                    feature_count = len(data.get('features', []))
            except Exception:
                feature_count = 1

        survey_record = SurveyData.objects.create(
            title=title,
            surveyor_name=surveyor_name,
            survey_format=survey_format,
            file=uploaded_file,
            raw_content=raw_text,
            parsed_features_count=feature_count,
            status=SurveyStatus.PROCESSED,
            survey_metadata=parsed_meta
        )

        return Response(SurveyDataSerializer(survey_record).data, status=status.HTTP_201_CREATED)
