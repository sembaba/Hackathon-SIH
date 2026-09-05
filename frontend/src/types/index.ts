export type UserRole = 'CITIZEN' | 'SURVEYOR' | 'LAND_ADMIN' | 'GIS_ADMIN' | 'SYS_ADMIN';

export interface Parcel {
  id: number;
  parcel_number: string;
  state: string;
  state_code: string;
  district: string;
  district_code: string;
  tehsil: string;
  village: string;
  area: number;
  ground_elevation: number;
  geometry: any;
  centroid: [number, number];
  building_count?: number;
  created_at: string;
}

export interface Building {
  id: number;
  parcel: number;
  parcel_number: string;
  building_code: string;
  name: string;
  building_type: string;
  number_of_floors: number;
  number_of_basements: number;
  height: number;
  ground_elevation: number;
  geometry_2d: any;
  geometry_3d?: any;
  source: string;
  confidence_score: number;
  floor_count?: number;
  created_at: string;
}

export interface Floor {
  id: number;
  building: number;
  building_code: string;
  building_name: string;
  floor_number: number;
  floor_label: string;
  level_code: string;
  z_min: number;
  z_max: number;
  floor_height: number;
  property_count?: number;
  geometry?: any;
}

export interface PropertyUnit {
  id: number;
  floor: number;
  floor_number: number;
  floor_label: string;
  building_code: string;
  building_name: string;
  parcel_number: string;
  unit_number: string;
  property_type: string;
  owner_name: string;
  area: number;
  x_min?: number;
  x_max?: number;
  y_min?: number;
  y_max?: number;
  z_min: number;
  z_max: number;
  volume: number;
  geometry: any;
  status: 'REGISTERED' | 'PROVISIONAL' | 'CONFLICT_FLAGGED' | 'DISPUTED';
  ulpin?: string;
  created_at: string;
}

export interface InfrastructureAsset {
  id: number;
  parcel: number;
  parcel_number: string;
  asset_id: string;
  name: string;
  asset_type: string;
  depth_min: number;
  depth_max: number;
  diameter_m: number;
  geometry: any;
  status: string;
  created_at: string;
}

export interface ValidationIssue {
  id: number;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  issue_type: string;
  message: string;
  affected_objects: string[];
  location?: any;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';
  created_at: string;
}

export interface GISLayer {
  id: number;
  layer_id: string;
  name: string;
  layer_type: string;
  is_visible: boolean;
  opacity: number;
  color_hex: string;
  feature_count: number;
}

export interface AnalyticsData {
  kpis: {
    total_parcels: number;
    total_buildings: number;
    total_floors: number;
    total_properties: number;
    total_ulpins: number;
    underground_assets: number;
    validation_issues: number;
    total_built_volume_m3: number;
    total_cadastral_area_m2: number;
  };
  charts: {
    issues_by_severity: Array<{ severity: string; count: number }>;
    properties_by_type: Array<{ property_type: string; count: number }>;
    properties_by_floor: Array<{ floor_number: number; floor_label: string; level_code: string; unit_count: number }>;
  };
  location_context: {
    region: string;
    state_code: string;
    district_code: string;
    status: string;
  };
}

export interface TopologyConflict {
  id: string;
  propertyA: string;
  propertyB: string;
  ulpinA: string;
  ulpinB: string;
  overlapStart: number;
  overlapEnd: number;
  overlapHeight: number;
  type: string;
  severity: 'WARNING' | 'ERROR';
  status: 'ACTIVE' | 'RESOLVED';
  description: string;
}

export interface SurveyRecord {
  id: string;
  surveyId: string;
  parcelId: string;
  coordinates: string;
  elevation: number;
  source: string;
  surveyor: string;
  date: string;
  status: 'VERIFIED' | 'PENDING' | 'FLAGGED';
}
