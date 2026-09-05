import { Parcel, Building, Floor, PropertyUnit, InfrastructureAsset, ValidationIssue, AnalyticsData, TopologyConflict, SurveyRecord } from '../types';

export const DEMO_PARCELS: Parcel[] = [
  {
    id: 1,
    parcel_number: 'P-001245',
    state: 'Uttarakhand',
    state_code: 'UT',
    district: 'Haridwar',
    district_code: 'HW',
    tehsil: 'Roorkee',
    village: 'Demo Zone A',
    area: 2450.0,
    ground_elevation: 280.0,
    centroid: [78.1642, 29.9457],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [78.16390, 29.94540],
        [78.16450, 29.94540],
        [78.16450, 29.94600],
        [78.16390, 29.94600],
        [78.16390, 29.94540]
      ]]
    },
    building_count: 1,
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 2,
    parcel_number: 'P-001244',
    state: 'Uttarakhand',
    state_code: 'UT',
    district: 'Haridwar',
    district_code: 'HW',
    tehsil: 'Roorkee',
    village: 'Demo Zone A (West Sector)',
    area: 1820.0,
    ground_elevation: 280.0,
    centroid: [78.1633, 29.9457],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [78.16320, 29.94540],
        [78.16380, 29.94540],
        [78.16380, 29.94600],
        [78.16320, 29.94600],
        [78.16320, 29.94540]
      ]]
    },
    building_count: 1,
    created_at: '2026-02-15T11:30:00Z'
  },
  {
    id: 3,
    parcel_number: 'P-001246',
    state: 'Uttarakhand',
    state_code: 'UT',
    district: 'Haridwar',
    district_code: 'HW',
    tehsil: 'Roorkee',
    village: 'Demo Zone A (East Sector)',
    area: 3100.0,
    ground_elevation: 280.0,
    centroid: [78.1651, 29.9457],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [78.16460, 29.94540],
        [78.16560, 29.94540],
        [78.16560, 29.94600],
        [78.16460, 29.94600],
        [78.16460, 29.94540]
      ]]
    },
    building_count: 2,
    created_at: '2026-01-20T09:15:00Z'
  }
];

export const DEMO_PARCEL = DEMO_PARCELS[0];

export const DEMO_BUILDINGS: Building[] = [
  {
    id: 1,
    parcel: 1,
    parcel_number: 'P-001245',
    building_code: 'B07',
    name: 'VERTI Tower Demo',
    building_type: 'Mixed Use Commercial / Residential',
    number_of_floors: 6,
    number_of_basements: 2,
    height: 24.0,
    ground_elevation: 280.0,
    geometry_2d: {
      type: 'Polygon',
      coordinates: [[
        [78.16405, 29.94555],
        [78.16435, 29.94555],
        [78.16435, 29.94585],
        [78.16405, 29.94585],
        [78.16405, 29.94555]
      ]]
    },
    source: 'Total Station & LiDAR Cadastral Survey',
    confidence_score: 0.99,
    floor_count: 9,
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 2,
    parcel: 2,
    parcel_number: 'P-001244',
    building_code: 'B06',
    name: 'Shivalik Commercial Arcade',
    building_type: 'Commercial Retail',
    number_of_floors: 3,
    number_of_basements: 1,
    height: 12.0,
    ground_elevation: 280.0,
    geometry_2d: {
      type: 'Polygon',
      coordinates: [[
        [78.16335, 29.94555],
        [78.16365, 29.94555],
        [78.16365, 29.94585],
        [78.16335, 29.94585],
        [78.16335, 29.94555]
      ]]
    },
    source: 'Cadastral Survey 2025',
    confidence_score: 0.95,
    floor_count: 4,
    created_at: '2026-02-15T11:30:00Z'
  }
];

export const DEMO_BUILDING = DEMO_BUILDINGS[0];

export const DEMO_FLOORS: Floor[] = [
  { id: 1, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: -2, floor_label: 'Basement B02', level_code: 'B02', z_min: -6.0, z_max: -3.0, floor_height: 3.0, property_count: 2 },
  { id: 2, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: -1, floor_label: 'Basement B01', level_code: 'B01', z_min: -3.0, z_max: 0.0,  floor_height: 3.0, property_count: 2 },
  { id: 3, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: 0,  floor_label: 'Ground Floor', level_code: 'GROUND', z_min: 0.0,  z_max: 3.0,  floor_height: 3.0, property_count: 2 },
  { id: 4, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: 1,  floor_label: 'Floor F01',      level_code: 'F01', z_min: 3.0,  z_max: 6.0,  floor_height: 3.0, property_count: 2 },
  { id: 5, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: 2,  floor_label: 'Floor F02',      level_code: 'F02', z_min: 6.0,  z_max: 9.0,  floor_height: 3.0, property_count: 2 },
  { id: 6, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: 3,  floor_label: 'Floor F03',      level_code: 'F03', z_min: 9.0,  z_max: 12.0, floor_height: 3.0, property_count: 2 },
  { id: 7, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: 4,  floor_label: 'Floor F04',      level_code: 'F04', z_min: 12.0, z_max: 15.0, floor_height: 3.0, property_count: 2 },
  { id: 8, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: 5,  floor_label: 'Floor F05',      level_code: 'F05', z_min: 15.0, z_max: 18.0, floor_height: 3.0, property_count: 4 },
  { id: 9, building: 1, building_code: 'B07', building_name: 'VERTI Tower Demo', floor_number: 6,  floor_label: 'Floor F06',      level_code: 'F06', z_min: 18.0, z_max: 21.0, floor_height: 3.0, property_count: 2 }
];

export const DEMO_PROPERTIES: PropertyUnit[] = [
  // F05 - Primary Conflict Floor
  {
    id: 1,
    floor: 8,
    floor_number: 5,
    floor_label: 'Floor F05',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U503',
    property_type: 'Residential Unit',
    owner_name: 'Devendra Negi',
    area: 125.0,
    z_min: 15.0,
    z_max: 18.0,
    volume: 375.0,
    x_min: -15,
    x_max: 0,
    y_min: 0,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94570], [78.16420, 29.94570], [78.16420, 29.94585], [78.16405, 29.94585], [78.16405, 29.94570]]]
    },
    status: 'CONFLICT_FLAGGED',
    ulpin: 'ULPIN-P001245-B07-F05-U503-VOL773',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 2,
    floor: 8,
    floor_number: 5,
    floor_label: 'Floor F05',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U504',
    property_type: 'Residential Unit',
    owner_name: 'Kiran Pal Singh',
    area: 125.0,
    z_min: 17.0, // Overlaps vertically with Unit 503 by 1m (17m - 18m)
    z_max: 20.0,
    volume: 375.0,
    x_min: -15,
    x_max: 0,
    y_min: 0,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16420, 29.94570], [78.16435, 29.94570], [78.16435, 29.94585], [78.16420, 29.94585], [78.16420, 29.94570]]]
    },
    status: 'CONFLICT_FLAGGED',
    ulpin: 'ULPIN-P001245-B07-F05-U504-VOL852',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 3,
    floor: 8,
    floor_number: 5,
    floor_label: 'Floor F05',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U501',
    property_type: 'Residential Unit',
    owner_name: 'Aarav Sharma',
    area: 125.0,
    z_min: 15.0,
    z_max: 18.0,
    volume: 375.0,
    x_min: 0,
    x_max: 15,
    y_min: -10,
    y_max: 0,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16420, 29.94555], [78.16420, 29.94570], [78.16405, 29.94570], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-F05-U501-VOL529',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 4,
    floor: 8,
    floor_number: 5,
    floor_label: 'Floor F05',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U502',
    property_type: 'Residential Unit',
    owner_name: 'Pooja Verma',
    area: 125.0,
    z_min: 15.0,
    z_max: 18.0,
    volume: 375.0,
    x_min: 0,
    x_max: 15,
    y_min: 0,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16420, 29.94555], [78.16435, 29.94555], [78.16435, 29.94570], [78.16420, 29.94570], [78.16420, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-F05-U502-VOL246',
    created_at: '2026-03-01T10:00:00Z'
  },

  // Other Floors (Units 101, 201, 301, 401, 601)
  {
    id: 5,
    floor: 4,
    floor_number: 1,
    floor_label: 'Floor F01',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U101',
    property_type: 'Residential Unit',
    owner_name: 'Vikramaditya Roy',
    area: 150.0,
    z_min: 3.0,
    z_max: 6.0,
    volume: 450.0,
    x_min: -15,
    x_max: 0,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16420, 29.94555], [78.16420, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-F01-U101-VOL087',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 6,
    floor: 5,
    floor_number: 2,
    floor_label: 'Floor F02',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U201',
    property_type: 'Residential Unit',
    owner_name: 'Meenakshi Sundaram',
    area: 150.0,
    z_min: 6.0,
    z_max: 9.0,
    volume: 450.0,
    x_min: -15,
    x_max: 0,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16420, 29.94555], [78.16420, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-F02-U201-VOL311',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 7,
    floor: 6,
    floor_number: 3,
    floor_label: 'Floor F03',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U301',
    property_type: 'Residential Unit',
    owner_name: 'Harish Chandra Joshi',
    area: 150.0,
    z_min: 9.0,
    z_max: 12.0,
    volume: 450.0,
    x_min: -15,
    x_max: 0,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16420, 29.94555], [78.16420, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-F03-U301-VOL385',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 8,
    floor: 7,
    floor_number: 4,
    floor_label: 'Floor F04',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U401',
    property_type: 'Residential Unit',
    owner_name: 'Suresh Raina',
    area: 150.0,
    z_min: 12.0,
    z_max: 15.0,
    volume: 450.0,
    x_min: -15,
    x_max: 0,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16420, 29.94555], [78.16420, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-F04-U401-VOL241',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 9,
    floor: 9,
    floor_number: 6,
    floor_label: 'Floor F06',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'U601',
    property_type: 'Penthouse Apartment',
    owner_name: 'Ananya Singhania',
    area: 300.0,
    z_min: 18.0,
    z_max: 21.0,
    volume: 900.0,
    x_min: -15,
    x_max: 15,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16435, 29.94555], [78.16435, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-F06-U601-VOL969',
    created_at: '2026-03-01T10:00:00Z'
  },

  // Ground Floor Commercial Units
  {
    id: 10,
    floor: 3,
    floor_number: 0,
    floor_label: 'Ground Floor',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'UG01',
    property_type: 'Commercial Retail Store',
    owner_name: 'State Bank Cadastral Branch',
    area: 150.0,
    z_min: 0.0,
    z_max: 3.0,
    volume: 450.0,
    x_min: -15,
    x_max: 0,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16420, 29.94555], [78.16420, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-G00-UG01-VOL471',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 11,
    floor: 3,
    floor_number: 0,
    floor_label: 'Ground Floor',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'UG02',
    property_type: 'Commercial Retail Store',
    owner_name: 'Apollo Pharmacy & Diagnostic',
    area: 150.0,
    z_min: 0.0,
    z_max: 3.0,
    volume: 450.0,
    x_min: 0,
    x_max: 15,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16420, 29.94555], [78.16435, 29.94555], [78.16435, 29.94585], [78.16420, 29.94585], [78.16420, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-G00-UG02-VOL428',
    created_at: '2026-03-01T10:00:00Z'
  },

  // Subsurface / Basement Units
  {
    id: 12,
    floor: 2,
    floor_number: -1,
    floor_label: 'Basement B01',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'UB101',
    property_type: 'Subsurface Utility / Storage',
    owner_name: 'Haridwar Jal Sansthan & Power Hub',
    area: 300.0,
    z_min: -3.0,
    z_max: 0.0,
    volume: 900.0,
    x_min: -15,
    x_max: 15,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16435, 29.94555], [78.16435, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-B01-UB101-VOL785',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 13,
    floor: 1,
    floor_number: -2,
    floor_label: 'Basement B02',
    building_code: 'B07',
    building_name: 'VERTI Tower Demo',
    parcel_number: 'P-001245',
    unit_number: 'UB201',
    property_type: 'Subsurface Multi-Level Parking',
    owner_name: 'VERTI Residents Welfare Association',
    area: 300.0,
    z_min: -6.0,
    z_max: -3.0,
    volume: 900.0,
    x_min: -15,
    x_max: 15,
    y_min: -10,
    y_max: 10,
    geometry: {
      type: 'Polygon',
      coordinates: [[[78.16405, 29.94555], [78.16435, 29.94555], [78.16435, 29.94585], [78.16405, 29.94585], [78.16405, 29.94555]]]
    },
    status: 'REGISTERED',
    ulpin: 'ULPIN-P001245-B07-B02-UB201-VOL679',
    created_at: '2026-03-01T10:00:00Z'
  }
];

export const DEMO_CONFLICT: TopologyConflict = {
  id: 'CONF-001',
  propertyA: 'U503',
  propertyB: 'U504',
  ulpinA: 'ULPIN-P001245-B07-F05-U503-VOL773',
  ulpinB: 'ULPIN-P001245-B07-F05-U504-VOL852',
  overlapStart: 17.0,
  overlapEnd: 18.0,
  overlapHeight: 1.0,
  type: 'Vertical Volumetric Overlap',
  severity: 'ERROR',
  status: 'ACTIVE',
  description: 'Potential vertical spatial overlap detected between Unit 503 (Z-Min: 15m, Z-Max: 18m) and Unit 504 (Z-Min: 17m, Z-Max: 20m). Spatial conflict depth: 1.0 meter across elevation 17.0m–18.0m.'
};

export const DEMO_CONFLICTS: TopologyConflict[] = [
  DEMO_CONFLICT,
  {
    id: 'CONF-002',
    propertyA: 'U301',
    propertyB: 'U302',
    ulpinA: 'ULPIN-P001245-B07-F03-U301-VOL385',
    ulpinB: 'ULPIN-P001245-B07-F03-U302-VOL498',
    overlapStart: 11.8,
    overlapEnd: 12.0,
    overlapHeight: 0.2,
    type: 'Boundary Sliver Intersection',
    severity: 'WARNING',
    status: 'ACTIVE',
    description: 'Minor horizontal boundary intersection along interior partition wall.'
  }
];

export const DEMO_INFRASTRUCTURE: InfrastructureAsset[] = [
  {
    id: 1,
    parcel: 1,
    parcel_number: 'P-001245',
    asset_id: 'INF-WTR-01',
    name: 'Municipal Potable Water Main',
    asset_type: 'WATER_SUPPLY',
    depth_min: -3.5,
    depth_max: -4.2,
    diameter_m: 0.6,
    geometry: {
      type: 'LineString',
      coordinates: [[78.16385, 29.94550], [78.16455, 29.94550]]
    },
    status: 'ACTIVE',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 2,
    parcel: 1,
    parcel_number: 'P-001245',
    asset_id: 'INF-SWR-01',
    name: 'Subsurface Drainage & Sewer Conduit',
    asset_type: 'SEWERAGE',
    depth_min: -5.0,
    depth_max: -6.2,
    diameter_m: 1.2,
    geometry: {
      type: 'LineString',
      coordinates: [[78.16385, 29.94595], [78.16455, 29.94595]]
    },
    status: 'ACTIVE',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 3,
    parcel: 1,
    parcel_number: 'P-001245',
    asset_id: 'INF-PWR-01',
    name: 'High-Voltage 33kV Underground Power Duct',
    asset_type: 'ELECTRICITY',
    depth_min: -2.0,
    depth_max: -2.8,
    diameter_m: 0.4,
    geometry: {
      type: 'LineString',
      coordinates: [[78.16395, 29.94535], [78.16395, 29.94605]]
    },
    status: 'ACTIVE',
    created_at: '2026-03-01T10:00:00Z'
  }
];

export const DEMO_VALIDATION_ISSUES: ValidationIssue[] = [
  {
    id: 1,
    severity: 'ERROR',
    issue_type: 'VERTICAL_OVERLAP',
    message: 'Potential vertical spatial overlap detected between Unit 503 (Z: 15.0m–18.0m) and Unit 504 (Z: 17.0m–20.0m). Overlap depth: 1.0m (17.0m to 18.0m).',
    affected_objects: ['U503', 'U504', 'ULPIN-P001245-B07-F05-U503-VOL773', 'ULPIN-P001245-B07-F05-U504-VOL852'],
    status: 'ACTIVE',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 2,
    severity: 'WARNING',
    issue_type: 'ELEVATION_DATUM_DEVIATION',
    message: 'Survey station benchmark elevation datum offset by +0.08m against Haridwar GTS reference point.',
    affected_objects: ['SV-2026-HW-002'],
    status: 'ACTIVE',
    created_at: '2026-03-02T14:20:00Z'
  },
  {
    id: 3,
    severity: 'INFO',
    issue_type: 'ULPIN_HIERARCHY_VERIFIED',
    message: 'Standard ULPIN structure syntax verified for all 24 units in Building B07.',
    affected_objects: ['B07'],
    status: 'RESOLVED',
    created_at: '2026-03-03T09:00:00Z'
  }
];

export const DEMO_SURVEYS: SurveyRecord[] = [
  {
    id: '1',
    surveyId: 'SRV-2026-001',
    parcelId: 'P-001245',
    coordinates: '29.94570° N, 78.16420° E',
    elevation: 280.0,
    source: 'Total Station & RTK-DGPS',
    surveyor: 'R. K. Rawat, Cadastral Officer',
    date: '2026-02-28',
    status: 'VERIFIED'
  },
  {
    id: '2',
    surveyId: 'SRV-2026-002',
    parcelId: 'P-001245',
    coordinates: '29.94585° N, 78.16435° E',
    elevation: 298.0,
    source: 'Terrestrial LiDAR Scanner',
    surveyor: 'Geospatial Surveys Pvt Ltd',
    date: '2026-03-01',
    status: 'FLAGGED'
  },
  {
    id: '3',
    surveyId: 'SRV-2026-003',
    parcelId: 'P-001244',
    coordinates: '29.94555° N, 78.16350° E',
    elevation: 280.0,
    source: 'Total Station',
    surveyor: 'M. S. Negi, Land Surveyor',
    date: '2026-02-14',
    status: 'VERIFIED'
  },
  {
    id: '4',
    surveyId: 'SRV-2026-004',
    parcelId: 'P-001246',
    coordinates: '29.94570° N, 78.16510° E',
    elevation: 280.0,
    source: 'Drone Photogrammetry & GCP',
    surveyor: 'Survey of India Collaboration',
    date: '2026-01-18',
    status: 'VERIFIED'
  }
];

export const DEMO_ANALYTICS: AnalyticsData = {
  kpis: {
    total_parcels: 1248,
    total_buildings: 326,
    total_floors: 1420,
    total_properties: 4872,
    total_ulpins: 4651,
    underground_assets: 412,
    validation_issues: 27,
    total_built_volume_m3: 1845000.0,
    total_cadastral_area_m2: 3840000.0
  },
  charts: {
    issues_by_severity: [
      { severity: 'CRITICAL', count: 8 },
      { severity: 'WARNING', count: 12 },
      { severity: 'INFO', count: 7 }
    ],
    properties_by_type: [
      { property_type: 'Residential Unit', count: 3248 },
      { property_type: 'Commercial Retail / Office', count: 896 },
      { property_type: 'Ground Level Unit', count: 384 },
      { property_type: 'Basement Storage / Parking', count: 344 }
    ],
    properties_by_floor: [
      { floor_number: -2, floor_label: 'Basement B02', level_code: 'B02', unit_count: 172 },
      { floor_number: -1, floor_label: 'Basement B01', level_code: 'B01', unit_count: 172 },
      { floor_number: 0,  floor_label: 'Ground Floor', level_code: 'GROUND', unit_count: 384 },
      { floor_number: 1,  floor_label: 'Floor F01',      level_code: 'F01', unit_count: 650 },
      { floor_number: 2,  floor_label: 'Floor F02',      level_code: 'F02', unit_count: 650 },
      { floor_number: 3,  floor_label: 'Floor F03',      level_code: 'F03', unit_count: 650 },
      { floor_number: 4,  floor_label: 'Floor F04',      level_code: 'F04', unit_count: 650 },
      { floor_number: 5,  floor_label: 'Floor F05',      level_code: 'F05', unit_count: 650 },
      { floor_number: 6,  floor_label: 'Floor F06',      level_code: 'F06', unit_count: 444 }
    ]
  },
  location_context: {
    region: 'Haridwar Division, Uttarakhand, India',
    state_code: 'UT',
    district_code: 'HW',
    status: 'State Cadastre Prototype'
  }
};
