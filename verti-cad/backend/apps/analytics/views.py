from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum
from apps.parcels.models import Parcel
from apps.buildings.models import Building
from apps.floors.models import Floor
from apps.properties.models import PropertyUnit
from apps.infrastructure.models import Infrastructure
from apps.validation.models import ValidationIssue
from apps.ulpin.models import ULPINRecord

class AnalyticsDashboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total_parcels = Parcel.objects.count()
        total_buildings = Building.objects.count()
        total_floors = Floor.objects.count()
        total_properties = PropertyUnit.objects.count()
        total_ulpins = ULPINRecord.objects.count()
        underground_assets = Infrastructure.objects.count()
        validation_issues = ValidationIssue.objects.count()

        # Aggregated Volumes and Areas
        vol_agg = PropertyUnit.objects.aggregate(total_vol=Sum('volume'), total_area=Sum('area'))
        total_volume = round(vol_agg['total_vol'] or 0.0, 2)
        total_area = round(vol_agg['total_area'] or 0.0, 2)

        # Issues by severity
        issues_severity = list(
            ValidationIssue.objects.values('severity')
            .annotate(count=Count('id'))
            .order_by('severity')
        )

        # Properties by property_type
        props_by_type = list(
            PropertyUnit.objects.values('property_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Properties by floor level
        props_by_floor = list(
            Floor.objects.values('floor_number', 'floor_label', 'level_code')
            .annotate(unit_count=Count('properties'))
            .order_by('floor_number')
        )

        return Response({
            'kpis': {
                'total_parcels': total_parcels,
                'total_buildings': total_buildings,
                'total_floors': total_floors,
                'total_properties': total_properties,
                'total_ulpins': total_ulpins,
                'underground_assets': underground_assets,
                'validation_issues': validation_issues,
                'total_built_volume_m3': total_volume,
                'total_cadastral_area_m2': total_area,
            },
            'charts': {
                'issues_by_severity': issues_severity,
                'properties_by_type': props_by_type,
                'properties_by_floor': props_by_floor,
            },
            'location_context': {
                'region': 'Haridwar, Uttarakhand, India',
                'state_code': 'UT',
                'district_code': 'HW',
                'status': 'Demonstration / Synthetic Cadastre'
            }
        })
