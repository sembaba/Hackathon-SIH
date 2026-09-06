"""
VERTI-CAD 3D GIS & Spatial Data Views.
Provides endpoints for:
 - 3D spatial extent and volumetric bounding boxes (ST_3DExtent / AABB)
 - LiDAR Point Cloud metadata & survey benchmark classification
 - Digital Elevation Model (DEM) terrain grid parameters
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.parcels.models import Parcel
from apps.buildings.models import Building
from apps.properties.models import PropertyUnit

class Spatial3DExtentView(APIView):
    """
    Returns 3D spatial extents (bounding boxes, volumes, and vertical intervals)
    for all cadastral parcels, buildings, and vertical property units.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        parcels = Parcel.objects.all()
        buildings = Building.objects.select_related('parcel').all()
        units = PropertyUnit.objects.select_related('floor', 'floor__building').all()

        parcel_extents = []
        for p in parcels:
            parcel_extents.append({
                'parcel_number': p.parcel_number,
                'area_m2': p.area,
                'ground_elevation': p.ground_elevation,
                'centroid': p.centroid,
                'geometry': p.geometry
            })

        building_extents = []
        for b in buildings:
            building_extents.append({
                'building_code': b.building_code,
                'name': b.name,
                'height_m': b.height,
                'ground_elevation': b.ground_elevation,
                'total_elevation_max': b.ground_elevation + b.height,
                'floors': b.number_of_floors,
                'basements': b.number_of_basements,
                'geometry_2d': b.geometry_2d
            })

        unit_extents = []
        total_volume = 0.0
        for u in units:
            vol = float(u.volume) if u.volume else 0.0
            total_volume += vol
            unit_extents.append({
                'unit_number': u.unit_number,
                'floor': u.floor.floor_label,
                'z_min': float(u.z_min) if u.z_min is not None else 0.0,
                'z_max': float(u.z_max) if u.z_max is not None else 3.0,
                'height_m': round((float(u.z_max) - float(u.z_min)), 2) if u.z_min is not None and u.z_max is not None else 3.0,
                'volume_m3': vol,
                'status': u.status
            })

        return Response({
            'status': 'SUCCESS',
            'crs': 'EPSG:4326 (WGS84) + Orthometric Elevation (m)',
            'datum': 'Great Trigonometrical Survey of India (GTS Benchmark Haridwar)',
            'summary': {
                'parcels_count': len(parcel_extents),
                'buildings_count': len(building_extents),
                'units_count': len(unit_extents),
                'total_cadastral_volume_m3': round(total_volume, 2),
            },
            'parcels': parcel_extents,
            'buildings': building_extents,
            'units': unit_extents
        })

class PointCloudMetadataView(APIView):
    """
    Returns metadata for LiDAR point cloud acquisition, point classifications,
    and coordinate spatial reference system.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'dataset_id': 'LIDAR-2026-HW-ROORKEE-ZONE-A',
            'acquisition_date': '2026-03-01T06:30:00Z',
            'sensor': 'Airborne Topographic LiDAR + Terrestrial Mobile Scanner (SLAM)',
            'spatial_reference': 'EPSG:32644 (UTM Zone 44N) / EPSG:4326',
            'datum': 'WGS84 / EGM2008 Geoid',
            'point_count': 35000,
            'density_pts_per_m2': 42.5,
            'bounding_box': {
                'min_x': 78.1632,
                'max_x': 78.1656,
                'min_y': 29.9453,
                'max_y': 29.9461,
                'min_z_m': -6.0,
                'max_z_m': 32.5
            },
            'classifications': [
                {'code': 2, 'name': 'Ground / Bare Earth', 'color': '#64748b', 'percentage': 45.2},
                {'code': 5, 'name': 'High Vegetation / Canopy', 'color': '#22c55e', 'percentage': 18.6},
                {'code': 6, 'name': 'Building Facade & Walls', 'color': '#0ea5e9', 'percentage': 26.4},
                {'code': 13, 'name': 'Building Roof Surface', 'color': '#f59e0b', 'percentage': 9.8}
            ],
            'confidence_score': 0.994
        })

class DEMTerrainMetadataView(APIView):
    """
    Returns Digital Elevation Model (DEM) parameters for terrain mesh generation.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'dem_id': 'DEM-280M-HARIDWAR-ROORKEE',
            'ground_datum_elevation_m': 280.0,
            'elevation_min_m': 278.4,
            'elevation_max_m': 282.1,
            'mesh_resolution_m': 2.0,
            'grid_dimensions': {'width': 50, 'depth': 50},
            'topographic_slope_deg': 1.2,
            'hydro_flow_direction': 'South-East towards Ganga Canal'
        })
