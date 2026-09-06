"""
API Views for VERTI-CAD Geospatial Ingestion Pipeline
"""
import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .engine import (
    PipelineOrchestrator,
    GNSSProcessor,
    DroneProcessor,
    LiDARProcessor,
    DEMProcessor,
    CadastralImporter,
    PropertyModel3DFusion,
)


class PipelineRunView(APIView):
    """
    Run the end-to-end Geospatial Ingestion Pipeline:
    1. GNSS/CORS -> Survey points -> Accurate coordinates
    2. Drone imagery -> Orthomosaic -> Building footprint
    3. LiDAR point cloud -> Building height -> 3D structure
    4. DEM/DSM -> Elevation -> Ground reference -> Building Z values
    5. Cadastral GIS -> Parcel boundary -> PostGIS
    => Fusion: 2D Parcel + Building + Height + Floor plan + Elevation -> 3D Property Model
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Run pipeline with default Lucknow/Ayodhya demo coordinates."""
        orchestrator = PipelineOrchestrator()
        result = orchestrator.run(
            center_lat=float(request.query_params.get("lat", 26.8467)),
            center_lon=float(request.query_params.get("lon", 80.9462)),
            parcel_area_sqm=float(request.query_params.get("area", 2500.0)),
            survey_number=str(request.query_params.get("survey_no", "124/3B")),
            state_code=str(request.query_params.get("state", "UP")),
            district_code=str(request.query_params.get("district", "LKO")),
        )
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request):
        """Execute pipeline with custom parameters."""
        data = request.data or {}
        orchestrator = PipelineOrchestrator()
        result = orchestrator.run(
            center_lat=float(data.get("lat", 26.8467)),
            center_lon=float(data.get("lon", 80.9462)),
            parcel_area_sqm=float(data.get("parcel_area_sqm", 2500.0)),
            state_code=str(data.get("state_code", "UP")),
            district_code=str(data.get("district_code", "LKO")),
            local_body_code=str(data.get("local_body_code", "LMC")),
            survey_number=str(data.get("survey_number", "124/3B")),
            flight_altitude_m=float(data.get("flight_altitude_m", 100.0)),
        )
        return Response(result, status=status.HTTP_200_OK)


class PipelineStageView(APIView):
    """
    Execute individual stages of the pipeline independently.
    Stage options: 'gnss', 'drone', 'lidar', 'dem', 'cadastral', 'fusion'
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, stage):
        return self.handle_stage(stage, request.query_params)

    def post(self, request, stage):
        return self.handle_stage(stage, request.data)

    def handle_stage(self, stage: str, params: dict):
        lat = float(params.get("lat", 26.8467))
        lon = float(params.get("lon", 80.9462))

        if stage == "gnss":
            processor = GNSSProcessor()
            points = processor.process_control_network(lat, lon)
            return Response({
                "stage": "GNSS/CORS",
                "description": "Survey points -> Accurate coordinates",
                "points_count": len(points),
                "points": [
                    {
                        "point_id": p.point_id,
                        "lat": p.latitude,
                        "lon": p.longitude,
                        "ellipsoidal_height_m": p.ellipsoidal_height,
                        "orthometric_height_m": p.orthometric_height,
                        "hz_accuracy_cm": p.accuracy_hz_cm,
                        "vt_accuracy_cm": p.accuracy_vt_cm,
                        "cors_station": p.cors_station,
                        "pdop": p.pdop,
                        "is_survey_grade": p.is_survey_grade,
                        "wkt": p.to_wkt_point_z(),
                    }
                    for p in points
                ],
            })

        elif stage == "drone":
            processor = DroneProcessor()
            result = processor.process_imagery(lat, lon)
            return Response({
                "stage": "Drone",
                "description": "Drone imagery -> Orthomosaic -> Building footprint",
                "job_id": result.job_id,
                "gsd_cm": result.gsd_cm,
                "reprojection_error_px": result.reprojection_error_px,
                "confidence_score": result.confidence_score,
                "footprints_count": len(result.building_footprints),
                "footprints": result.building_footprints,
            })

        elif stage == "lidar":
            drone_proc = DroneProcessor()
            drone_res = drone_proc.process_imagery(lat, lon)
            lidar_proc = LiDARProcessor()
            result = lidar_proc.process_point_cloud(drone_res.building_footprints)
            return Response({
                "stage": "LiDAR",
                "description": "Point cloud -> Building height -> 3D structure",
                "job_id": result.job_id,
                "total_points": result.total_points,
                "point_density_per_sqm": result.point_density_per_sqm,
                "buildings_detected": result.buildings_detected,
                "vertical_accuracy_cm": result.vertical_accuracy_cm,
                "building_heights": result.building_heights,
            })

        elif stage == "dem":
            drone_proc = DroneProcessor()
            drone_res = drone_proc.process_imagery(lat, lon)
            lidar_proc = LiDARProcessor()
            lidar_res = lidar_proc.process_point_cloud(drone_res.building_footprints)
            dem_proc = DEMProcessor()
            result = dem_proc.process_elevation(lat, lon, lidar_res)
            return Response({
                "stage": "DEM/DSM",
                "description": "Elevation -> Ground reference -> Building Z values",
                "job_id": result.job_id,
                "resolution_m": result.resolution_m,
                "datum": result.datum,
                "geoid_model": result.geoid_model,
                "min_elevation": result.min_elevation,
                "max_elevation": result.max_elevation,
                "building_z_values": result.building_z_values,
            })

        elif stage == "cadastral":
            cad_proc = CadastralImporter()
            parcel = cad_proc.import_parcel(lat, lon)
            return Response({
                "stage": "Existing cadastral GIS",
                "description": "Parcel boundary -> PostGIS",
                "parcel_id": parcel.parcel_id,
                "survey_number": parcel.survey_number,
                "area_sqm": parcel.area_sqm,
                "land_use": parcel.land_use,
                "owner_name": parcel.owner_name,
                "boundary_wkt": parcel.boundary_wkt,
                "postgis_status": "STORED",
            })

        return Response({"error": f"Unknown stage: {stage}"}, status=status.HTTP_400_BAD_REQUEST)


class PipelineLatestView(APIView):
    """Get latest cached or newly generated pipeline run."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        orchestrator = PipelineOrchestrator()
        result = orchestrator.run(
            center_lat=26.8467,
            center_lon=80.9462,
            parcel_area_sqm=3200.0,
            survey_number="124/3B",
            state_code="UP",
            district_code="LKO",
        )
        return Response(result, status=status.HTTP_200_OK)


class PipelineArchitectureView(APIView):
    """Returns the structural architecture metadata matching the SIH problem statement."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "title": "VERTI-CAD 3D ULPIN Geospatial Ingestion Pipeline",
            "standard": "ISO 19152 LADM / OGC 3D Cadastre / Bhu-Aadhaar 14-Digit ULPIN",
            "flowchart": {
                "inputs": [
                    {
                        "source": "GNSS/CORS",
                        "intermediate": "Survey points",
                        "output": "Accurate coordinates (sub-3cm RTK)",
                        "standard": "EGM2008 / WGS84"
                    },
                    {
                        "source": "Drone",
                        "intermediate": "Drone imagery",
                        "output": "Orthomosaic -> Building footprint",
                        "sensor": "High-res photogrammetry (GSD < 5cm)"
                    },
                    {
                        "source": "LiDAR",
                        "intermediate": "Point cloud",
                        "output": "Building height -> 3D structure",
                        "metric": "Density > 30 pts/m2"
                    },
                    {
                        "source": "DEM/DSM",
                        "intermediate": "Elevation",
                        "output": "Ground reference -> Building Z values",
                        "datum": "MSL / Orthometric Height"
                    },
                    {
                        "source": "Existing cadastral GIS",
                        "intermediate": "Parcel boundary",
                        "output": "PostGIS (2D Cadastral Base)",
                        "format": "SHP / GeoJSON / Land Records"
                    }
                ],
                "fusion": {
                    "components": [
                        "2D Parcel Boundary",
                        "Building Footprint",
                        "Building Height (LiDAR)",
                        "Floor Plan Subdivision",
                        "Ground & Roof Elevation (DEM/DSM)"
                    ],
                    "target": "3D Property Model",
                    "geometry": "PostGIS PolyhedralSurface Z",
                    "identifier": "14-digit 3D ULPIN + Vertical Sub-Code"
                }
            }
        })
