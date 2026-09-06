import time
from typing import List, Dict, Any
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ValidationIssue, IssueSeverity, IssueType, IssueStatus
from .serializers import ValidationIssueSerializer
from .engine import TopologyValidationEngine
from apps.properties.models import PropertyUnit

class ValidationIssueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ValidationIssue.objects.all()
    serializer_class = ValidationIssueSerializer
    permission_classes = [permissions.AllowAny]

def compute_aabb_intersection(box_a: Dict[str, Any], box_b: Dict[str, Any]) -> Dict[str, Any] | None:
    """
    Compute Axis-Aligned Bounding Box (AABB) 3D Boolean intersection.
    Each box must specify: x_min, x_max, y_min, y_max, z_min, z_max
    """
    x_overlap = min(box_a['x_max'], box_b['x_max']) - max(box_a['x_min'], box_b['x_min'])
    y_overlap = min(box_a['y_max'], box_b['y_max']) - max(box_a['y_min'], box_b['y_min'])
    z_overlap = min(box_a['z_max'], box_b['z_max']) - max(box_a['z_min'], box_b['z_min'])

    if x_overlap > 0 and y_overlap > 0 and z_overlap > 0:
        vol = round(x_overlap * y_overlap * z_overlap, 3)
        ix_min = max(box_a['x_min'], box_b['x_min'])
        ix_max = min(box_a['x_max'], box_b['x_max'])
        iy_min = max(box_a['y_min'], box_b['y_min'])
        iy_max = min(box_a['y_max'], box_b['y_max'])
        iz_min = max(box_a['z_min'], box_b['z_min'])
        iz_max = min(box_a['z_max'], box_b['z_max'])

        # Determine severity based on volume
        if vol > 10.0:
            sev = 'CRITICAL'
        elif vol > 0.5:
            sev = 'ERROR'
        else:
            sev = 'WARNING'

        return {
            'unit_a': box_a.get('unit_number') or box_a.get('id', 'Unknown'),
            'unit_b': box_b.get('unit_number') or box_b.get('id', 'Unknown'),
            'ulpin_a': box_a.get('ulpin', ''),
            'ulpin_b': box_b.get('ulpin', ''),
            'overlap_volume_m3': vol,
            'overlap_depth_z': round(z_overlap, 2),
            'overlap_x': round(x_overlap, 2),
            'overlap_y': round(y_overlap, 2),
            'severity': sev,
            'overlap_zone': {
                'x_min': ix_min,
                'x_max': ix_max,
                'y_min': iy_min,
                'y_max': iy_max,
                'z_min': iz_min,
                'z_max': iz_max,
                'center': [
                    round((ix_min + ix_max) / 2, 2),
                    round((iy_min + iy_max) / 2, 2),
                    round((iz_min + iz_max) / 2, 2)
                ]
            },
            'description': (
                f"3D Volumetric Overlap of {vol} m³ detected between {box_a.get('unit_number', 'Unit A')} "
                f"and {box_b.get('unit_number', 'Unit B')} across elevation {iz_min}m–{iz_max}m."
            )
        }
    return None

class AABBValidationEngineView(APIView):
    """
    Dedicated 3D AABB Boolean Intersection Engine endpoint.
    Accepts arbitrary unit geometries or pulls from database.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return self.post(request)

    def post(self, request):
        t0 = time.time()
        client_units = request.data.get('units', None) if hasattr(request, 'data') and request.data else None
        boxes = []

        if client_units and isinstance(client_units, list):
            for u in client_units:
                boxes.append({
                    'id': u.get('id'),
                    'unit_number': u.get('unit_number', str(u.get('id'))),
                    'ulpin': u.get('ulpin', ''),
                    'x_min': float(u.get('x_min', -15)),
                    'x_max': float(u.get('x_max', 15)),
                    'y_min': float(u.get('y_min', -10)),
                    'y_max': float(u.get('y_max', 10)),
                    'z_min': float(u.get('z_min', 0)),
                    'z_max': float(u.get('z_max', 3)),
                })
        else:
            # Load from DB
            db_units = PropertyUnit.objects.select_related('floor', 'floor__building').all()
            for u in db_units:
                # Default coordinates for demo if not explicitly set
                boxes.append({
                    'id': u.id,
                    'unit_number': u.unit_number,
                    'ulpin': getattr(u, 'ulpin_record', None) and u.ulpin_record.ulpin_code or f"ULPIN-P001245-B07-F{u.floor.floor_number:02d}-{u.unit_number}",
                    'x_min': float(u.x_min) if u.x_min is not None else -15.0,
                    'x_max': float(u.x_max) if u.x_max is not None else 15.0,
                    'y_min': float(u.y_min) if u.y_min is not None else -10.0,
                    'y_max': float(u.y_max) if u.y_max is not None else 10.0,
                    'z_min': float(u.z_min) if u.z_min is not None else 0.0,
                    'z_max': float(u.z_max) if u.z_max is not None else 3.0,
                })

        conflicts = []
        n = len(boxes)
        for i in range(n):
            for j in range(i + 1, n):
                inter = compute_aabb_intersection(boxes[i], boxes[j])
                if inter:
                    conflicts.append(inter)

        total_vol = round(sum(c['overlap_volume_m3'] for c in conflicts), 3)
        t_ms = round((time.time() - t0) * 1000, 2)

        return Response({
            'status': 'SUCCESS',
            'algorithm': 'AABB 3D Boolean Intersection',
            'total_units_checked': n,
            'pairwise_tests_performed': (n * (n - 1)) // 2,
            'conflict_count': len(conflicts),
            'total_overlap_volume_m3': total_vol,
            'execution_time_ms': t_ms,
            'conflicts': conflicts
        }, status=status.HTTP_200_OK)

class RunValidationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        engine = TopologyValidationEngine()
        issues = engine.run_all_validations()
        serializer = ValidationIssueSerializer(issues, many=True)
        return Response({
            'message': f'Validation completed successfully. Found {len(issues)} issues.',
            'total_issues': len(issues),
            'issues': serializer.data
        }, status=status.HTTP_200_OK)

class ValidationSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        issues = ValidationIssue.objects.all()
        critical_count = issues.filter(severity=IssueSeverity.CRITICAL).count()
        error_count = issues.filter(severity=IssueSeverity.ERROR).count()
        warning_count = issues.filter(severity=IssueSeverity.WARNING).count()
        info_count = issues.filter(severity=IssueSeverity.INFO).count()

        return Response({
            'total_issues': issues.count(),
            'active_issues': issues.filter(status=IssueStatus.ACTIVE).count(),
            'by_severity': {
                'CRITICAL': critical_count,
                'ERROR': error_count,
                'WARNING': warning_count,
                'INFO': info_count
            },
            'has_blockers': (critical_count + error_count) > 0,
            'disclaimer': 'VERTI-CAD 3D Spatial Cadastre Quality Assurance'
        })
