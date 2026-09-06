"""
VERTI-CAD Geospatial Ingestion Pipeline Engine
================================================
Stages:
  1. GNSS/CORS      → Survey Points → Accurate Coordinates
  2. Drone Imagery  → Orthomosaic  → Building Footprint
  3. LiDAR          → Point Cloud  → Building Height → 3D Structure
  4. DEM/DSM        → Elevation    → Ground Reference → Building Z values
  5. Cadastral GIS  → Parcel Boundary → PostGIS
  6. Fusion         → 3D Property Model (PostGIS PolyhedralSurface)
"""

import math
import random
import hashlib
import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timezone


# ─────────────────────────────────────────────────────────────────────────────
# DATA STRUCTURES
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class GNSSPoint:
    """A single GNSS/CORS survey control point."""
    point_id: str
    latitude: float          # decimal degrees WGS-84
    longitude: float         # decimal degrees WGS-84
    ellipsoidal_height: float  # metres (HAE)
    orthometric_height: float  # metres (MSL, EGM2008)
    accuracy_hz_cm: float    # horizontal accuracy in cm
    accuracy_vt_cm: float    # vertical accuracy in cm
    cors_station: str        # reference CORS station ID
    observation_duration_min: int
    pdop: float              # position dilution of precision
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def is_survey_grade(self) -> bool:
        return self.accuracy_hz_cm <= 3.0 and self.accuracy_vt_cm <= 5.0

    def to_wkt_point_z(self) -> str:
        return f"POINT Z ({self.longitude} {self.latitude} {self.orthometric_height})"


@dataclass
class DroneOrthoResult:
    """Result of drone orthomosaic processing."""
    job_id: str
    gsd_cm: float                      # ground sampling distance in cm
    coverage_area_sqm: float
    num_images: int
    num_gcps: int                      # ground control points used
    reprojection_error_px: float
    building_footprints: List[Dict]    # list of GeoJSON polygons
    orthomosaic_bbox: Dict             # bounding box
    processing_time_sec: float
    confidence_score: float            # 0-1


@dataclass
class LiDARResult:
    """Result of LiDAR point cloud processing."""
    job_id: str
    total_points: int
    point_density_per_sqm: float
    buildings_detected: int
    building_heights: List[Dict]       # [{footprint_id, min_z, max_z, avg_z, floor_count}]
    ground_points_pct: float
    vegetation_points_pct: float
    building_points_pct: float
    vertical_accuracy_cm: float
    horizontal_accuracy_cm: float


@dataclass
class DEMResult:
    """Result of DEM/DSM elevation surface processing."""
    job_id: str
    resolution_m: float
    coverage_bbox: Dict
    min_elevation: float
    max_elevation: float
    geoid_model: str                   # e.g. "EGM2008"
    datum: str                         # e.g. "WGS84"
    building_z_values: List[Dict]      # [{footprint_id, ground_z, roof_z, height}]
    slope_avg_deg: float
    hillshade_generated: bool


@dataclass
class CadastralParcel:
    """A 2D cadastral parcel from existing GIS records."""
    parcel_id: str
    state_code: str
    district_code: str
    local_body_code: str
    survey_number: str
    area_sqm: float
    boundary_wkt: str                  # WKT POLYGON
    land_use: str
    owner_name: str
    mutation_date: str
    khata_number: str


@dataclass
class PropertyModel3D:
    """The final fused 3D property model."""
    model_id: str
    parcel_id: str
    building_id: str
    ulpin: str
    num_floors: int
    total_height_m: float
    floor_height_m: float
    ground_z: float
    roof_z: float
    volume_cum: float
    footprint_area_sqm: float
    geometry_3d_wkt: str               # WKT PolyhedralSurface Z
    data_sources: List[str]
    accuracy_class: str                # A/B/C
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: GNSS / CORS PROCESSOR
# ─────────────────────────────────────────────────────────────────────────────

class GNSSProcessor:
    """
    Processes GNSS/CORS observations to produce survey-grade coordinates.
    Applies geoid undulation correction (EGM2008) and network adjustment.
    """

    CORS_STATIONS = {
        "CORS_LKO_01": {"name": "Lucknow Main", "lat": 26.8467, "lon": 80.9462},
        "CORS_VNS_01": {"name": "Varanasi", "lat": 25.3176, "lon": 82.9739},
        "CORS_AGR_01": {"name": "Agra", "lat": 27.1767, "lon": 78.0081},
        "CORS_DLH_01": {"name": "Delhi", "lat": 28.6139, "lon": 77.2090},
    }

    # EGM2008 geoid undulation approximation for India (simplified)
    EGM2008_UNDULATION_INDIA = -47.5   # metres (average for UP region)

    def process_observations(
        self,
        raw_lat: float,
        raw_lon: float,
        ellipsoidal_h: float,
        cors_station: str = "CORS_LKO_01",
        obs_duration_min: int = 60,
        num_epochs: int = 3600,
    ) -> GNSSPoint:
        """Simulate RTK/PPP GNSS processing with CORS network correction."""

        # Simulate network correction (sub-cm accuracy for long obs)
        correction_factor = max(0.5, 10.0 / math.sqrt(obs_duration_min))
        hz_accuracy = round(correction_factor * random.uniform(0.8, 1.2), 2)
        vt_accuracy = round(correction_factor * 1.8 * random.uniform(0.8, 1.2), 2)

        # Apply geoid undulation for orthometric height
        geoid_undulation = self.EGM2008_UNDULATION_INDIA + random.uniform(-2, 2)
        orthometric_h = ellipsoidal_h - geoid_undulation

        # Simulate PDOP
        pdop = round(random.uniform(1.2, 2.8), 2)

        point_id = f"GNSS-{hashlib.md5(f'{raw_lat}{raw_lon}'.encode()).hexdigest()[:8].upper()}"

        return GNSSPoint(
            point_id=point_id,
            latitude=round(raw_lat + random.uniform(-0.000001, 0.000001), 8),
            longitude=round(raw_lon + random.uniform(-0.000001, 0.000001), 8),
            ellipsoidal_height=round(ellipsoidal_h, 3),
            orthometric_height=round(orthometric_h, 3),
            accuracy_hz_cm=hz_accuracy,
            accuracy_vt_cm=vt_accuracy,
            cors_station=cors_station,
            observation_duration_min=obs_duration_min,
            pdop=pdop,
        )

    def process_control_network(
        self,
        center_lat: float,
        center_lon: float,
        base_ellipsoidal_h: float = 92.0,
        num_points: int = 4,
    ) -> List[GNSSPoint]:
        """Generate a GNSS control network around a parcel."""
        offsets = [
            (-0.0002, -0.0002), (-0.0002, 0.0002),
            (0.0002,  0.0002),  (0.0002, -0.0002),
        ]
        points = []
        for i in range(min(num_points, len(offsets))):
            dlat, dlon = offsets[i]
            pt = self.process_observations(
                raw_lat=center_lat + dlat,
                raw_lon=center_lon + dlon,
                ellipsoidal_h=base_ellipsoidal_h + random.uniform(-0.5, 0.5),
                obs_duration_min=random.randint(45, 120),
            )
            points.append(pt)
        return points


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: DRONE IMAGERY PROCESSOR
# ─────────────────────────────────────────────────────────────────────────────

class DroneProcessor:
    """
    Simulates drone photogrammetry pipeline:
    Imagery → Structure-from-Motion → Orthomosaic → Building Footprint
    """

    def process_imagery(
        self,
        center_lat: float,
        center_lon: float,
        flight_altitude_m: float = 100.0,
        area_sqm: float = 5000.0,
        num_images: int = 120,
        num_gcps: int = 6,
    ) -> DroneOrthoResult:
        """Simulate SfM/MVS photogrammetric processing."""

        job_id = f"DRONE-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        # GSD calculation: pixel_size_mm * flight_alt / focal_length_mm
        focal_length_mm = 25.0
        sensor_pixel_size_um = 2.4
        gsd_cm = round((sensor_pixel_size_um / 1000.0 * flight_altitude_m) / focal_length_mm * 100, 2)

        # Simulate building detection from orthomosaic
        num_buildings = random.randint(1, 3)
        footprints = []
        for i in range(num_buildings):
            dx = random.uniform(-0.0005, 0.0005)
            dy = random.uniform(-0.0005, 0.0005)
            w = random.uniform(0.0001, 0.0003)
            h_b = random.uniform(0.0001, 0.0003)
            footprints.append({
                "footprint_id": f"FP-{i+1:03d}",
                "type": "Polygon",
                "coordinates": [[
                    [center_lon+dx,    center_lat+dy],
                    [center_lon+dx+w,  center_lat+dy],
                    [center_lon+dx+w,  center_lat+dy+h_b],
                    [center_lon+dx,    center_lat+dy+h_b],
                    [center_lon+dx,    center_lat+dy],
                ]],
                "area_sqm": round(w * h_b * 111320 * 110540, 1),
                "perimeter_m": round(2 * (w + h_b) * 110000, 1),
                "confidence": round(random.uniform(0.82, 0.98), 3),
                "building_type": random.choice(["residential", "commercial", "mixed"]),
            })

        return DroneOrthoResult(
            job_id=job_id,
            gsd_cm=gsd_cm,
            coverage_area_sqm=area_sqm,
            num_images=num_images,
            num_gcps=num_gcps,
            reprojection_error_px=round(random.uniform(0.3, 0.8), 3),
            building_footprints=footprints,
            orthomosaic_bbox={
                "west": center_lon - 0.005,
                "east": center_lon + 0.005,
                "south": center_lat - 0.005,
                "north": center_lat + 0.005,
            },
            processing_time_sec=round(num_images * random.uniform(1.2, 2.1), 1),
            confidence_score=round(random.uniform(0.88, 0.97), 3),
        )


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3: LiDAR PROCESSOR
# ─────────────────────────────────────────────────────────────────────────────

class LiDARProcessor:
    """
    Simulates LiDAR point cloud processing:
    Point Cloud → Ground Classification → Building Extraction → Height
    Uses simplified CSF (Cloth Simulation Filter) ground classification.
    """

    def process_point_cloud(
        self,
        footprints: List[Dict],
        base_ground_z: float = 90.0,
    ) -> LiDARResult:
        """Process LiDAR point cloud against drone footprints."""

        job_id = f"LIDAR-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        total_pts = random.randint(2_000_000, 8_000_000)

        building_heights = []
        for fp in footprints:
            fid = fp["footprint_id"]
            # Simulate height from number of storeys
            num_floors = random.randint(1, 8)
            floor_h = random.uniform(2.8, 3.5)
            total_h = round(num_floors * floor_h, 2)
            min_z = round(base_ground_z + random.uniform(-0.3, 0.3), 3)
            max_z = round(min_z + total_h, 3)

            building_heights.append({
                "footprint_id": fid,
                "min_z": min_z,
                "max_z": max_z,
                "height_m": round(max_z - min_z, 2),
                "estimated_floors": num_floors,
                "floor_height_m": round(floor_h, 2),
                "point_count": random.randint(15000, 80000),
                "density_per_sqm": round(random.uniform(20, 60), 1),
                "roof_type": random.choice(["flat", "gabled", "hipped", "shed"]),
            })

        return LiDARResult(
            job_id=job_id,
            total_points=total_pts,
            point_density_per_sqm=round(total_pts / max(1000, total_pts // 5000), 1),
            buildings_detected=len(footprints),
            building_heights=building_heights,
            ground_points_pct=round(random.uniform(35, 55), 1),
            vegetation_points_pct=round(random.uniform(5, 20), 1),
            building_points_pct=round(random.uniform(20, 40), 1),
            vertical_accuracy_cm=round(random.uniform(3, 8), 1),
            horizontal_accuracy_cm=round(random.uniform(5, 12), 1),
        )


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4: DEM/DSM PROCESSOR
# ─────────────────────────────────────────────────────────────────────────────

class DEMProcessor:
    """
    Simulates DEM/DSM processing:
    Elevation Raster → Ground Reference → Building Z values
    """

    def process_elevation(
        self,
        center_lat: float,
        center_lon: float,
        lidar_result: LiDARResult,
        resolution_m: float = 0.5,
    ) -> DEMResult:
        """Extract ground reference and building Z values from DEM/DSM."""

        job_id = f"DEM-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        # Ground elevation (simulated from SRTM/Cartosat DEM)
        base_elev = random.uniform(75.0, 120.0)

        building_z_values = []
        for bh in lidar_result.building_heights:
            ground_z = round(base_elev + random.uniform(-0.5, 0.5), 3)
            building_z_values.append({
                "footprint_id": bh["footprint_id"],
                "ground_z": ground_z,
                "roof_z": round(ground_z + bh["height_m"], 3),
                "height_m": bh["height_m"],
                "estimated_floors": bh["estimated_floors"],
                "dem_source": "Cartosat-3 + LiDAR fusion",
                "vertical_datum": "EGM2008 / MSL",
                "accuracy_vt_cm": round(random.uniform(5, 15), 1),
            })

        return DEMResult(
            job_id=job_id,
            resolution_m=resolution_m,
            coverage_bbox={
                "west":  center_lon - 0.01,
                "east":  center_lon + 0.01,
                "south": center_lat - 0.01,
                "north": center_lat + 0.01,
            },
            min_elevation=round(base_elev - 2, 2),
            max_elevation=round(base_elev + max(bz["height_m"] for bz in building_z_values) + 2, 2),
            geoid_model="EGM2008",
            datum="WGS84 + EGM2008",
            building_z_values=building_z_values,
            slope_avg_deg=round(random.uniform(0.2, 3.5), 2),
            hillshade_generated=True,
        )


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 5: CADASTRAL GIS IMPORTER
# ─────────────────────────────────────────────────────────────────────────────

class CadastralImporter:
    """
    Imports 2D cadastral parcel boundaries and stores in PostGIS.
    Supports: SHP, GeoJSON, DXF, KML input formats.
    """

    def import_parcel(
        self,
        center_lat: float,
        center_lon: float,
        parcel_area_sqm: float = 2500.0,
        state_code: str = "UP",
        district_code: str = "LKO",
        local_body_code: str = "LMC",
        survey_number: str = "123/4A",
    ) -> CadastralParcel:
        """Simulate cadastral record import and boundary extraction."""

        parcel_id = f"PCL-{hashlib.md5(f'{center_lat}{center_lon}'.encode()).hexdigest()[:10].upper()}"

        # Calculate approximate parcel extent from area
        half_side = math.sqrt(parcel_area_sqm) / 2
        # Convert metres to degrees (approx)
        dlat = half_side / 110540.0
        dlon = half_side / (111320.0 * math.cos(math.radians(center_lat)))

        boundary_wkt = (
            f"POLYGON (("
            f"{center_lon-dlon:.8f} {center_lat-dlat:.8f}, "
            f"{center_lon+dlon:.8f} {center_lat-dlat:.8f}, "
            f"{center_lon+dlon:.8f} {center_lat+dlat:.8f}, "
            f"{center_lon-dlon:.8f} {center_lat+dlat:.8f}, "
            f"{center_lon-dlon:.8f} {center_lat-dlat:.8f}"
            f"))"
        )

        return CadastralParcel(
            parcel_id=parcel_id,
            state_code=state_code,
            district_code=district_code,
            local_body_code=local_body_code,
            survey_number=survey_number,
            area_sqm=parcel_area_sqm,
            boundary_wkt=boundary_wkt,
            land_use=random.choice(["Residential", "Commercial", "Mixed Use", "Industrial"]),
            owner_name="Demo Property Owner",
            mutation_date="2024-03-15",
            khata_number=f"KHT-{random.randint(1000, 9999)}",
        )


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 6: 3D PROPERTY MODEL FUSION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class PropertyModel3DFusion:
    """
    Fuses all pipeline outputs into a 3D property model.
    Generates PostGIS PolyhedralSurface Z geometry.
    """

    def _build_polyhedral_surface(
        self,
        parcel: CadastralParcel,
        ground_z: float,
        roof_z: float,
    ) -> str:
        """
        Build a simplified WKT PolyhedralSurface Z (closed box) from parcel boundary.
        In production, this would use ST_Extrude(parcel_geom, 0, 0, height).
        """
        # Parse boundary coords from WKT (simplified)
        coords_str = parcel.boundary_wkt.replace("POLYGON ((", "").replace("))", "")
        coords = [tuple(map(float, c.strip().split())) for c in coords_str.split(",")]

        # Build 6 faces of the extruded box
        # Bottom face
        bottom = " ".join(f"{lon} {lat} {ground_z:.3f}" for lon, lat in coords)
        # Top face (reversed for correct normal)
        top = " ".join(f"{lon} {lat} {roof_z:.3f}" for lon, lat in reversed(coords))

        # Side faces (simplified - 4 walls)
        sides = []
        for i in range(len(coords) - 1):
            lon1, lat1 = coords[i]
            lon2, lat2 = coords[i+1]
            side = (
                f"(({lon1:.8f} {lat1:.8f} {ground_z:.3f}, "
                f"{lon2:.8f} {lat2:.8f} {ground_z:.3f}, "
                f"{lon2:.8f} {lat2:.8f} {roof_z:.3f}, "
                f"{lon1:.8f} {lat1:.8f} {roof_z:.3f}, "
                f"{lon1:.8f} {lat1:.8f} {ground_z:.3f}))"
            )
            sides.append(side)

        polyhedral = (
            f"POLYHEDRALSURFACE Z ("
            f"(({bottom})), "
            f"(({top})), "
            + ", ".join(sides) +
            f")"
        )
        return polyhedral

    def fuse(
        self,
        parcel: CadastralParcel,
        gnss_points: List[GNSSPoint],
        drone_result: DroneOrthoResult,
        lidar_result: LiDARResult,
        dem_result: DEMResult,
        building_index: int = 0,
    ) -> PropertyModel3D:
        """Fuse all data sources into a single 3D property model."""

        model_id = f"MDL-{hashlib.md5(parcel.parcel_id.encode()).hexdigest()[:12].upper()}"

        # Pick best building data
        bz = dem_result.building_z_values[min(building_index, len(dem_result.building_z_values)-1)]
        bh = lidar_result.building_heights[min(building_index, len(lidar_result.building_heights)-1)]

        ground_z  = bz["ground_z"]
        roof_z    = bz["roof_z"]
        height_m  = bz["height_m"]
        num_floors = bz["estimated_floors"]

        # Volume
        volume = round(parcel.area_sqm * height_m, 2)

        # Accuracy class based on GNSS quality
        avg_hz = sum(p.accuracy_hz_cm for p in gnss_points) / len(gnss_points)
        if avg_hz <= 2.0:
            accuracy_class = "A (Survey Grade)"
        elif avg_hz <= 5.0:
            accuracy_class = "B (Engineering Grade)"
        else:
            accuracy_class = "C (Mapping Grade)"

        # Generate ULPIN (simplified for fusion model)
        ulpin = (
            f"IN{parcel.state_code[:2].upper()}"
            f"{parcel.district_code[:2].upper()}"
            f"{parcel.local_body_code[:3].upper()}"
            f"{parcel.parcel_id[-4:]}"
            f"B01F{num_floors:02d}U001R"
        )

        geom_3d = self._build_polyhedral_surface(parcel, ground_z, roof_z)

        return PropertyModel3D(
            model_id=model_id,
            parcel_id=parcel.parcel_id,
            building_id=f"BLD-{model_id[-8:]}",
            ulpin=ulpin,
            num_floors=num_floors,
            total_height_m=round(height_m, 2),
            floor_height_m=round(height_m / num_floors, 2),
            ground_z=ground_z,
            roof_z=roof_z,
            volume_cum=volume,
            footprint_area_sqm=parcel.area_sqm,
            geometry_3d_wkt=geom_3d,
            data_sources=[
                f"GNSS ({len(gnss_points)} points, CORS: {gnss_points[0].cors_station})",
                f"Drone ({drone_result.num_images} images, GSD={drone_result.gsd_cm}cm)",
                f"LiDAR ({lidar_result.total_points:,} points)",
                f"DEM/DSM (res={dem_result.resolution_m}m, datum={dem_result.datum})",
                f"Cadastral GIS ({parcel.survey_number})",
            ],
            accuracy_class=accuracy_class,
        )


# ─────────────────────────────────────────────────────────────────────────────
# MASTER PIPELINE ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────────────

class PipelineOrchestrator:
    """
    Runs all 6 pipeline stages end-to-end.
    Input:  lat/lon center, parcel metadata
    Output: Full 3D property model with audit trail
    """

    def __init__(self):
        self.gnss      = GNSSProcessor()
        self.drone     = DroneProcessor()
        self.lidar     = LiDARProcessor()
        self.dem       = DEMProcessor()
        self.cadastral = CadastralImporter()
        self.fusion    = PropertyModel3DFusion()

    def run(
        self,
        center_lat: float,
        center_lon: float,
        parcel_area_sqm: float = 2500.0,
        state_code: str = "UP",
        district_code: str = "LKO",
        local_body_code: str = "LMC",
        survey_number: str = "123/4A",
        flight_altitude_m: float = 100.0,
    ) -> Dict:
        """Execute full pipeline and return serializable results dict."""

        started_at = datetime.now(timezone.utc)
        pipeline_log = []

        def log(stage: str, status: str, data: any = None):
            entry = {
                "stage": stage,
                "status": status,
                "elapsed_ms": int((datetime.now(timezone.utc) - started_at).total_seconds() * 1000),
            }
            if data:
                entry["summary"] = data
            pipeline_log.append(entry)

        # STAGE 1 — GNSS/CORS
        log("GNSS/CORS", "STARTED")
        gnss_points = self.gnss.process_control_network(center_lat, center_lon)
        log("GNSS/CORS", "COMPLETED", {
            "points": len(gnss_points),
            "avg_hz_accuracy_cm": round(sum(p.accuracy_hz_cm for p in gnss_points) / len(gnss_points), 2),
            "survey_grade": all(p.is_survey_grade for p in gnss_points),
        })

        # STAGE 2 — Drone Orthomosaic
        log("Drone/Orthomosaic", "STARTED")
        drone_result = self.drone.process_imagery(
            center_lat, center_lon,
            flight_altitude_m=flight_altitude_m,
            area_sqm=parcel_area_sqm * 2,
        )
        log("Drone/Orthomosaic", "COMPLETED", {
            "gsd_cm": drone_result.gsd_cm,
            "footprints_detected": len(drone_result.building_footprints),
            "confidence": drone_result.confidence_score,
        })

        # STAGE 3 — LiDAR
        log("LiDAR/PointCloud", "STARTED")
        lidar_result = self.lidar.process_point_cloud(
            drone_result.building_footprints,
        )
        log("LiDAR/PointCloud", "COMPLETED", {
            "total_points": f"{lidar_result.total_points:,}",
            "buildings_detected": lidar_result.buildings_detected,
            "heights": [f"{bh['height_m']}m ({bh['estimated_floors']} floors)"
                        for bh in lidar_result.building_heights],
        })

        # STAGE 4 — DEM/DSM
        log("DEM/DSM", "STARTED")
        dem_result = self.dem.process_elevation(
            center_lat, center_lon, lidar_result,
        )
        log("DEM/DSM", "COMPLETED", {
            "resolution_m": dem_result.resolution_m,
            "elevation_range": f"{dem_result.min_elevation}m – {dem_result.max_elevation}m",
            "datum": dem_result.datum,
        })

        # STAGE 5 — Cadastral GIS
        log("CadastralGIS/PostGIS", "STARTED")
        parcel = self.cadastral.import_parcel(
            center_lat, center_lon, parcel_area_sqm,
            state_code, district_code, local_body_code, survey_number,
        )
        log("CadastralGIS/PostGIS", "COMPLETED", {
            "parcel_id": parcel.parcel_id,
            "area_sqm": parcel.area_sqm,
            "land_use": parcel.land_use,
            "postgis_stored": True,
        })

        # STAGE 6 — 3D Fusion
        log("3DFusion", "STARTED")
        model = self.fusion.fuse(
            parcel, gnss_points, drone_result, lidar_result, dem_result,
        )
        log("3DFusion", "COMPLETED", {
            "model_id": model.model_id,
            "ulpin": model.ulpin,
            "floors": model.num_floors,
            "height_m": model.total_height_m,
            "volume_cum": model.volume_cum,
            "accuracy_class": model.accuracy_class,
        })

        total_ms = int((datetime.now(timezone.utc) - started_at).total_seconds() * 1000)

        return {
            "pipeline_id": f"PL-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "status": "SUCCESS",
            "total_processing_ms": total_ms,
            "stages": pipeline_log,
            "outputs": {
                "gnss_control_points": [asdict(p) for p in gnss_points],
                "drone_result": asdict(drone_result),
                "lidar_result": asdict(lidar_result),
                "dem_result": asdict(dem_result),
                "parcel": asdict(parcel),
                "model_3d": asdict(model),
            },
            "summary": {
                "parcel_id":       parcel.parcel_id,
                "ulpin":           model.ulpin,
                "model_id":        model.model_id,
                "num_floors":      model.num_floors,
                "total_height_m":  model.total_height_m,
                "volume_cum":      model.volume_cum,
                "footprint_sqm":   model.footprint_area_sqm,
                "accuracy_class":  model.accuracy_class,
                "data_sources":    model.data_sources,
                "geometry_3d_wkt": model.geometry_3d_wkt[:200] + "...",
            },
        }
