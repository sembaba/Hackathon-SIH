-- ============================================================================
-- VERTI-CAD: 3D ULPIN & Vertical Property Mapping System
-- Comprehensive PostgreSQL + PostGIS 3D Spatial Database Schema
-- Standards Compliance: OGC 3D Features, LADM (ISO 19152), EPSG:4326 / EPSG:32644
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_raster";
CREATE EXTENSION IF NOT EXISTS "postgis_sfcgal";

-- ----------------------------------------------------------------------------
-- 1. SPATIAL REFERENCE & VERTICAL DATUM DEFINITIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spatial_reference_system (
    srid INTEGER PRIMARY KEY,
    auth_name VARCHAR(64) NOT NULL DEFAULT 'EPSG',
    description VARCHAR(255) NOT NULL,
    proj4text TEXT NOT NULL,
    vertical_datum VARCHAR(128) NOT NULL DEFAULT 'EGM2008 / GTS Benchmark Haridwar',
    unit_of_measure VARCHAR(32) NOT NULL DEFAULT 'metre',
    is_compound_3d BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO spatial_reference_system (srid, auth_name, description, proj4text, vertical_datum)
VALUES 
    (4326, 'EPSG', 'WGS 84 (Geographic 2D)', '+proj=longlat +datum=WGS84 +no_defs', 'Ellipsoidal'),
    (4979, 'EPSG', 'WGS 84 (3D Geographic)', '+proj=longlat +datum=WGS84 +no_defs', 'WGS84 Ellipsoid Height'),
    (32644, 'EPSG', 'WGS 84 / UTM Zone 44N (Projected 3D)', '+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs', 'EGM2008 Geoid')
ON CONFLICT (srid) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. ADMINISTRATIVE HIERARCHY (Matches 23-char ULPIN Specification)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS administrative_country (
    country_code VARCHAR(2) PRIMARY KEY, -- e.g., 'UP' (or 'IN')
    country_name VARCHAR(128) NOT NULL,
    iso_alpha3 VARCHAR(3) NOT NULL DEFAULT 'IND',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS administrative_state (
    state_code VARCHAR(2) NOT NULL,       -- e.g., '23'
    country_code VARCHAR(2) NOT NULL REFERENCES administrative_country(country_code) ON DELETE RESTRICT,
    state_name VARCHAR(128) NOT NULL,
    boundary_2d GEOMETRY(MultiPolygon, 4326),
    PRIMARY KEY (country_code, state_code)
);

CREATE TABLE IF NOT EXISTS administrative_district (
    district_code VARCHAR(2) NOT NULL,    -- e.g., 'GN' (Gautam Buddha Nagar / Haridwar)
    country_code VARCHAR(2) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    district_name VARCHAR(128) NOT NULL,
    boundary_2d GEOMETRY(MultiPolygon, 4326),
    PRIMARY KEY (country_code, state_code, district_code),
    FOREIGN KEY (country_code, state_code) REFERENCES administrative_state(country_code, state_code) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS administrative_local_body (
    local_body_code VARCHAR(3) NOT NULL,  -- e.g., '017'
    country_code VARCHAR(2) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    district_code VARCHAR(2) NOT NULL,
    local_body_name VARCHAR(128) NOT NULL,
    body_type VARCHAR(64) NOT NULL DEFAULT 'MUNICIPAL_CORPORATION', -- Nagar Nigam / Development Authority
    boundary_2d GEOMETRY(MultiPolygon, 4326),
    PRIMARY KEY (country_code, state_code, district_code, local_body_code),
    FOREIGN KEY (country_code, state_code, district_code) 
        REFERENCES administrative_district(country_code, state_code, district_code) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 3. CADASTRAL PARCEL (2D Surface Land Tenure - Base Registration Layer)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cadastral_parcel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2) NOT NULL DEFAULT 'UP',
    state_code VARCHAR(2) NOT NULL DEFAULT '23',
    district_code VARCHAR(2) NOT NULL DEFAULT 'GN',
    local_body_code VARCHAR(3) NOT NULL DEFAULT '017',
    parcel_number VARCHAR(4) NOT NULL, -- 4-digit standardized e.g., '0456'
    khasra_survey_number VARCHAR(64),
    area_sq_m NUMERIC(12, 3) NOT NULL,
    ground_datum_elevation_m NUMERIC(8, 3) NOT NULL DEFAULT 280.000,
    geometry_2d GEOMETRY(Polygon, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_Centroid(geometry_2d)) STORED,
    land_use_type VARCHAR(64) NOT NULL DEFAULT 'MIXED_URBAN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_parcel_hierarchy UNIQUE (country_code, state_code, district_code, local_body_code, parcel_number)
);

CREATE INDEX idx_parcel_geom_2d ON cadastral_parcel USING GIST (geometry_2d);

-- ----------------------------------------------------------------------------
-- 4. 3D BUILDING ENVELOPE (Extruded Volumetric Massing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS building_envelope (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES cadastral_parcel(id) ON DELETE CASCADE,
    building_code VARCHAR(3) NOT NULL, -- e.g., 'B12'
    building_name VARCHAR(128) NOT NULL,
    building_use VARCHAR(64) NOT NULL DEFAULT 'RESIDENTIAL_COMMERCIAL',
    number_of_floors INTEGER NOT NULL DEFAULT 6,
    number_of_basements INTEGER NOT NULL DEFAULT 2,
    base_elevation_m NUMERIC(8, 3) NOT NULL,
    height_m NUMERIC(8, 3) NOT NULL,
    footprint_2d GEOMETRY(Polygon, 4326) NOT NULL,
    -- 3D Solid PolyhedralSurface representing full building boundary
    geometry_3d GEOMETRY(PolyhedralSurfaceZ, 4326),
    structural_lod VARCHAR(16) NOT NULL DEFAULT 'LoD2', -- LoD1 (Block), LoD2 (Roof Form), LoD3 (Architectural)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_building_code UNIQUE (parcel_id, building_code)
);

CREATE INDEX idx_building_footprint ON building_envelope USING GIST (footprint_2d);
CREATE INDEX idx_building_geom_3d ON building_envelope USING GIST (geometry_3d);

-- ----------------------------------------------------------------------------
-- 5. VERTICAL FLOOR SLAB SEGMENTATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS building_floor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES building_envelope(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,      -- -2=B02, -1=B01, 0=Ground, 1=F01, etc.
    floor_code VARCHAR(2) NOT NULL,     -- '05', 'B1', 'G0', etc.
    floor_label VARCHAR(64) NOT NULL,
    z_min_m NUMERIC(8, 3) NOT NULL,
    z_max_m NUMERIC(8, 3) NOT NULL,
    slab_thickness_m NUMERIC(4, 2) NOT NULL DEFAULT 0.25,
    floor_boundary_2d GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_building_floor UNIQUE (building_id, floor_code),
    CONSTRAINT chk_z_order CHECK (z_min_m < z_max_m)
);

CREATE INDEX idx_floor_boundary_2d ON building_floor USING GIST (floor_boundary_2d);

-- ----------------------------------------------------------------------------
-- 6. 3D VOLUMETRIC PROPERTY UNITS (The Core 3D Cadastral Unit)
-- ----------------------------------------------------------------------------
-- Property Type Codes:
--   R = Residential Apartment
--   C = Commercial / Retail
--   I = Industrial
--   U = Underground Infrastructure Vault / Storage
--   P = Dedicated Multi-level Parking Space
--   A = Air Rights Corridor
--   O = Others / Common Utility Area
CREATE TABLE IF NOT EXISTS property_unit_3d (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID NOT NULL REFERENCES building_floor(id) ON DELETE CASCADE,
    unit_number VARCHAR(3) NOT NULL,     -- 3-digit standardized e.g., '503'
    property_type_code CHAR(1) NOT NULL DEFAULT 'R',
    ulpin_code VARCHAR(24) UNIQUE NOT NULL, -- Exact 23-char ULPIN e.g. UP23GN0170456B1205503R7
    check_digit CHAR(1) NOT NULL,
    
    -- Spatial Extents
    geometry_2d GEOMETRY(Polygon, 4326) NOT NULL,
    z_min_m NUMERIC(8, 3) NOT NULL,
    z_max_m NUMERIC(8, 3) NOT NULL,
    volume_m3 NUMERIC(10, 3) NOT NULL,
    carpet_area_sq_m NUMERIC(10, 2) NOT NULL,
    built_up_area_sq_m NUMERIC(10, 2) NOT NULL,
    geometry_3d GEOMETRY(PolyhedralSurfaceZ, 4326),

    -- Legal & Ownership Registry Attributes
    owner_primary_name VARCHAR(255) NOT NULL,
    owner_id_hash VARCHAR(64) NOT NULL, -- Pseudonymized Aadhaar/PAN cryptographic hash
    co_owner_names TEXT[],
    tenure_type VARCHAR(64) NOT NULL DEFAULT 'FREEHOLD_CONDOMINIUM',
    registration_status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED', -- DRAFT, REGISTERED, DISPUTED, CANCELLED
    has_active_conflict BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_unit_z CHECK (z_min_m < z_max_m)
);

CREATE INDEX idx_unit_geom_2d ON property_unit_3d USING GIST (geometry_2d);
CREATE INDEX idx_unit_geom_3d ON property_unit_3d USING GIST (geometry_3d);
CREATE INDEX idx_unit_ulpin ON property_unit_3d (ulpin_code);

-- ----------------------------------------------------------------------------
-- 7. 3D PROPERTY & INFRASTRUCTURE CATEGORY EXTENSIONS
-- ----------------------------------------------------------------------------

-- Category 1: Multi-Storey Apartment Units
CREATE TABLE IF NOT EXISTS multi_storey_apartment (
    unit_id UUID PRIMARY KEY REFERENCES property_unit_3d(id) ON DELETE CASCADE,
    balcony_area_sq_m NUMERIC(6, 2) DEFAULT 0.0,
    undivided_land_share_pct NUMERIC(6, 4) NOT NULL,
    number_of_bedrooms INTEGER DEFAULT 2,
    hvac_air_shaft_access BOOLEAN DEFAULT TRUE,
    fire_escape_clearance_m NUMERIC(4, 2) DEFAULT 1.50
);

-- Category 2: Underground Infrastructure (Deep Metro Stations, Pedestrian Subways)
CREATE TABLE IF NOT EXISTS underground_infrastructure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    infra_code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'TRANSIT_STATION', -- PEDESTRIAN_CONCOURSE, WATER_VAULT
    subsurface_depth_top_m NUMERIC(6, 2) NOT NULL,    -- Distance below ground level (negative Z)
    subsurface_depth_bottom_m NUMERIC(6, 2) NOT NULL,
    structural_envelope_3d GEOMETRY(PolyhedralSurfaceZ, 4326) NOT NULL,
    ventilation_exhaust_datum NUMERIC(6, 2),
    concessionaire_agency VARCHAR(128) NOT NULL
);

-- Category 3: Elevated Transport Corridor (Metro Viaducts, Flyovers, Skywalks)
CREATE TABLE IF NOT EXISTS elevated_transport_corridor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corridor_id VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    vertical_clearance_ground_m NUMERIC(6, 2) NOT NULL, -- Safe height above road
    corridor_elevation_top_m NUMERIC(6, 2) NOT NULL,
    alignment_centerline_3d GEOMETRY(LineStringZ, 4326) NOT NULL,
    swept_volume_3d GEOMETRY(PolyhedralSurfaceZ, 4326) NOT NULL,
    managing_authority VARCHAR(128) NOT NULL DEFAULT 'National Highway / State Metro Rail'
);

-- Category 4: Dedicated 3D Parking Spaces (Mechanized & Basement Bays)
CREATE TABLE IF NOT EXISTS parking_space (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES property_unit_3d(id) ON DELETE SET NULL,
    building_id UUID NOT NULL REFERENCES building_envelope(id) ON DELETE CASCADE,
    bay_number VARCHAR(16) NOT NULL,
    bay_type VARCHAR(32) NOT NULL DEFAULT 'BASEMENT_STANDARD', -- STACK_PARKER, EV_CHARGING_BAY
    z_min_m NUMERIC(6, 2) NOT NULL,
    z_max_m NUMERIC(6, 2) NOT NULL,
    geometry_3d GEOMETRY(PolyhedralSurfaceZ, 4326) NOT NULL
);

-- Category 5: Air Rights (Volumetric Development Rights above Road/Transit)
CREATE TABLE IF NOT EXISTS air_rights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_deed_number VARCHAR(64) UNIQUE NOT NULL,
    parcel_id UUID NOT NULL REFERENCES cadastral_parcel(id) ON DELETE RESTRICT,
    z_clearance_min_m NUMERIC(8, 2) NOT NULL,
    z_ceiling_max_m NUMERIC(8, 2) NOT NULL,
    allowed_fsi_fsi_ratio NUMERIC(5, 2) NOT NULL,
    permitted_use_type VARCHAR(64) NOT NULL DEFAULT 'COMMERCIAL_OVERBUILD',
    boundary_3d GEOMETRY(PolyhedralSurfaceZ, 4326) NOT NULL
);

-- Category 6: Subsurface Utility Network (Gas, Power, Water, Fiber Optic Ducts)
CREATE TABLE IF NOT EXISTS subsurface_utility_network (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id VARCHAR(64) UNIQUE NOT NULL,
    utility_type VARCHAR(32) NOT NULL, -- ELECTRIC_HV, POTABLE_WATER, SEWAGE, GAS, FIBER
    diameter_outer_mm NUMERIC(6, 1) NOT NULL,
    operating_pressure_bar NUMERIC(6, 2),
    material VARCHAR(64) NOT NULL DEFAULT 'HDPE',
    centerline_3d GEOMETRY(LineStringZ, 4326) NOT NULL,
    safety_buffer_radius_m NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    owner_utility_company VARCHAR(128) NOT NULL
);

CREATE INDEX idx_subsurface_util_geom ON subsurface_utility_network USING GIST (centerline_3d);

-- ----------------------------------------------------------------------------
-- 8. SURVEY PROVENANCE, LIDAR & REMOTE SENSING DATASETS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lidar_scan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_mission_code VARCHAR(64) UNIQUE NOT NULL,
    acquisition_date TIMESTAMPTZ NOT NULL,
    scanner_type VARCHAR(128) NOT NULL DEFAULT 'Airborne Riegl VUX-120 + Mobile SLAM',
    point_count BIGINT NOT NULL,
    point_density_pts_sq_m NUMERIC(6, 2) NOT NULL,
    raw_las_url TEXT NOT NULL,
    dsm_geotiff_url TEXT,
    dtm_geotiff_url TEXT,
    boundary_extent_2d GEOMETRY(Polygon, 4326) NOT NULL,
    vertical_datum_offset_m NUMERIC(6, 3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drone_image (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id VARCHAR(64) NOT NULL,
    gsd_cm_per_pixel NUMERIC(5, 2) NOT NULL DEFAULT 2.5,
    flight_altitude_agl_m NUMERIC(6, 2) NOT NULL DEFAULT 120.0,
    camera_model VARCHAR(128) NOT NULL,
    orthophoto_geotiff_url TEXT NOT NULL,
    footprint_2d GEOMETRY(Polygon, 4326) NOT NULL,
    photogrammetry_dense_mesh_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. LEGAL DOCUMENTS & PROPERTY TITLE ATTACHMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES property_unit_3d(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL, -- TITLE_DEED, SANCTIONED_BIM_PLAN, COMPLETION_CERTIFICATE, ENCUMBRANCE
    title VARCHAR(255) NOT NULL,
    file_uri TEXT NOT NULL,
    sha256_checksum CHAR(64) NOT NULL,
    ipfs_cid VARCHAR(128),
    uploaded_by VARCHAR(128) NOT NULL,
    verified_by_officer VARCHAR(128),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. COMPREHENSIVE AUDIT LOG (Immutable Event Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_user_id VARCHAR(128) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL, -- ULPIN_GENERATED, 3D_BOUNDARY_EDITED, CONFLICT_DETECTED, TITLE_APPROVED
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    changes_delta JSONB,
    payload_hash CHAR(64) NOT NULL,
    previous_log_hash CHAR(64) -- Tamper-evident cryptographic chaining
);

CREATE INDEX idx_audit_timestamp ON audit_log (event_timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_log (resource_type, resource_id);

-- ----------------------------------------------------------------------------
-- 11. SPATIAL TOPOLOGY STORED PROCEDURES (Gap & Overlap Engine)
-- ----------------------------------------------------------------------------

-- Function: Detect 3D Collision between two property units
CREATE OR REPLACE FUNCTION check_3d_property_overlap(
    unit_id_a UUID,
    unit_id_b UUID
) RETURNS TABLE (
    has_collision BOOLEAN,
    overlap_type VARCHAR(64),
    overlap_volume_m3 NUMERIC,
    overlap_z_depth_m NUMERIC
) AS $$
DECLARE
    u_a RECORD;
    u_b RECORD;
    z_overlap_min NUMERIC;
    z_overlap_max NUMERIC;
    geom_2d_intersect GEOMETRY;
    intersect_area NUMERIC;
BEGIN
    SELECT * INTO u_a FROM property_unit_3d WHERE id = unit_id_a;
    SELECT * INTO u_b FROM property_unit_3d WHERE id = unit_id_b;

    IF u_a.id IS NULL OR u_b.id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'ONE_OR_BOTH_UNITS_NOT_FOUND'::VARCHAR, 0.0::NUMERIC, 0.0::NUMERIC;
        RETURN;
    END IF;

    -- 1. Check Vertical Interval Overlap
    z_overlap_min := GREATEST(u_a.z_min_m, u_b.z_min_m);
    z_overlap_max := LEAST(u_a.z_max_m, u_b.z_max_m);

    IF z_overlap_min >= z_overlap_max THEN
        -- No vertical overlap
        RETURN QUERY SELECT FALSE, 'NONE'::VARCHAR, 0.0::NUMERIC, 0.0::NUMERIC;
        RETURN;
    END IF;

    -- 2. Check 2D Horizontal Footprint Intersection
    IF NOT ST_Intersects(u_a.geometry_2d, u_b.geometry_2d) THEN
        RETURN QUERY SELECT FALSE, 'NONE'::VARCHAR, 0.0::NUMERIC, 0.0::NUMERIC;
        RETURN;
    END IF;

    geom_2d_intersect := ST_Intersection(u_a.geometry_2d, u_b.geometry_2d);
    intersect_area := ST_Area(geom_2d_intersect);

    IF intersect_area > 0.01 THEN
        -- Real volumetric overlap detected
        RETURN QUERY SELECT 
            TRUE, 
            'VOLUMETRIC_INTERSECTION'::VARCHAR,
            ROUND((intersect_area * (z_overlap_max - z_overlap_min))::numeric, 3),
            ROUND((z_overlap_max - z_overlap_min)::numeric, 3);
        RETURN;
    END IF;

    RETURN QUERY SELECT FALSE, 'NONE'::VARCHAR, 0.0::NUMERIC, 0.0::NUMERIC;
END;
$$ LANGUAGE plpgsql;
