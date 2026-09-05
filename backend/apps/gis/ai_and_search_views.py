"""
VERTI-CAD: AI Processing & Unified Spatial Search API Views
"""
import sys
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Q

# Add root directory to path to import ai/pipeline.py
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from ai.pipeline import AIProcessingPipeline
except ImportError:
    AIProcessingPipeline = None

from apps.parcels.models import Parcel
from apps.buildings.models import Building
from apps.properties.models import PropertyUnit
from apps.ulpin.models import ULPINRecord

class AIProcessView(APIView):
    """
    POST /api/ai/process/
    Triggers the AI/ML pipeline for Building Footprint Extraction,
    Height Estimation, and 3D Vertical Property Slicing.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        center_lon = float(data.get('center_lon', 78.1642))
        center_lat = float(data.get('center_lat', 29.9457))
        dsm_elev = float(data.get('dsm_elevation_m', 304.0))
        dem_elev = float(data.get('dem_elevation_m', 280.0))

        if AIProcessingPipeline:
            pipeline = AIProcessingPipeline()
            result = pipeline.run_full_pipeline({
                'center_lon': center_lon,
                'center_lat': center_lat
            })
        else:
            # Fallback mock pipeline
            height_m = round(dsm_elev - dem_elev, 2)
            floors = max(1, int(round(height_m / 3.0)))
            result = {
                'status': 'SUCCESS',
                'pipeline_version': '1.0.0-PROTOTYPE',
                'summary': {
                    'total_units_delineated': floors * 4,
                    'building_height_m': height_m,
                    'floor_count': floors,
                    'average_confidence': 0.925
                },
                'footprint': {
                    'estimated_footprint_area_m2': 625.0,
                    'confidence_score': 0.94
                },
                'height': {
                    'net_height_m': height_m,
                    'estimated_floor_count': floors
                },
                'delineated_units': []
            }

        return Response(result, status=status.HTTP_200_OK)

class UnifiedSearchView(APIView):
    """
    GET /api/search/?q=...
    Unified spatial search querying by:
      - ULPIN (e.g., IN-UT-HW-001245-B07-F05-U503 or UP23GN...)
      - Parcel Number (e.g., P-001245)
      - Building ID / Name (e.g., B07, VERTI Tower)
      - Unit Number (e.g., U503, 503)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': [], 'count': 0, 'query': query})

        results = []

        # 1. Search ULPIN Records
        ulpins = ULPINRecord.objects.filter(
            Q(ulpin_code__icontains=query)
        ).select_related('property_unit', 'property_unit__floor', 'property_unit__floor__building')[:5]

        for u in ulpins:
            results.append({
                'type': 'ULPIN',
                'id': u.id,
                'code': u.ulpin_code,
                'title': f"ULPIN {u.ulpin_code}",
                'subtitle': f"Unit {u.unit_code} in {u.building_code} (Floor {u.level_code})",
                'property_id': u.property_unit_id,
                'coordinates': [78.1642, 29.9457]
            })

        # 2. Search Property Units
        units = PropertyUnit.objects.filter(
            Q(unit_number__icontains=query) |
            Q(owner_name__icontains=query) |
            Q(property_type__icontains=query)
        ).select_related('floor', 'floor__building', 'floor__building__parcel')[:5]

        for unit in units:
            bld = unit.floor.building
            results.append({
                'type': 'PROPERTY_UNIT',
                'id': unit.id,
                'unit_number': unit.unit_number,
                'title': f"Apartment / Unit {unit.unit_number}",
                'subtitle': f"{bld.name} ({bld.building_code}) - {unit.floor.floor_label}",
                'building_id': bld.id,
                'parcel_number': bld.parcel.parcel_number,
                'elevation_range': f"{unit.z_min}m - {unit.z_max}m",
                'owner': unit.owner_name,
                'coordinates': bld.parcel.centroid or [78.1642, 29.9457]
            })

        # 3. Search Buildings
        buildings = Building.objects.filter(
            Q(building_code__icontains=query) |
            Q(name__icontains=query)
        ).select_related('parcel')[:5]

        for b in buildings:
            results.append({
                'type': 'BUILDING',
                'id': b.id,
                'building_code': b.building_code,
                'title': f"{b.name} ({b.building_code})",
                'subtitle': f"Parcel {b.parcel.parcel_number} - {b.number_of_floors} Floors, {b.height}m Height",
                'coordinates': b.parcel.centroid or [78.1642, 29.9457]
            })

        # 4. Search Parcels
        parcels = Parcel.objects.filter(
            Q(parcel_number__icontains=query) |
            Q(village__icontains=query) |
            Q(district__icontains=query)
        )[:5]

        for p in parcels:
            results.append({
                'type': 'PARCEL',
                'id': p.id,
                'parcel_number': p.parcel_number,
                'title': f"Parcel {p.parcel_number}",
                'subtitle': f"{p.village}, {p.tehsil}, {p.district} ({p.area} m²)",
                'coordinates': p.centroid or [78.1642, 29.9457]
            })

        return Response({
            'query': query,
            'count': len(results),
            'results': results
        }, status=status.HTTP_200_OK)
