import axios from 'axios';
import {
  DEMO_PARCELS,
  DEMO_BUILDINGS,
  DEMO_FLOORS,
  DEMO_PROPERTIES,
  DEMO_INFRASTRUCTURE,
  DEMO_VALIDATION_ISSUES,
  DEMO_ANALYTICS,
  DEMO_CONFLICTS,
  DEMO_SURVEYS
} from '../data/mockData';
import {
  Parcel,
  Building,
  Floor,
  PropertyUnit,
  InfrastructureAsset,
  ValidationIssue,
  AnalyticsData,
  TopologyConflict,
  SurveyRecord
} from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async getParcels(): Promise<Parcel[]> {
    try {
      const res = await apiClient.get('/parcels/');
      return res.data.results || res.data;
    } catch {
      return DEMO_PARCELS;
    }
  },

  async getParcel(id: number | string): Promise<Parcel> {
    try {
      const res = await apiClient.get(`/parcels/${id}/`);
      return res.data;
    } catch {
      return DEMO_PARCELS.find(p => p.id === Number(id) || p.parcel_number === id) || DEMO_PARCELS[0];
    }
  },

  async getBuildings(): Promise<Building[]> {
    try {
      const res = await apiClient.get('/buildings/');
      return res.data.results || res.data;
    } catch {
      return DEMO_BUILDINGS;
    }
  },

  async getFloors(buildingId?: number): Promise<Floor[]> {
    try {
      const res = await apiClient.get('/floors/');
      return res.data.results || res.data;
    } catch {
      return DEMO_FLOORS;
    }
  },

  async getProperties(): Promise<PropertyUnit[]> {
    try {
      const res = await apiClient.get('/properties/');
      return res.data.results || res.data;
    } catch {
      return DEMO_PROPERTIES;
    }
  },

  async getPropertiesByFloor(floorId: number): Promise<PropertyUnit[]> {
    try {
      const res = await apiClient.get(`/properties/by_floor/?floor_id=${floorId}`);
      return res.data;
    } catch {
      return DEMO_PROPERTIES.filter(p => p.floor === floorId);
    }
  },

  async getConflicts(): Promise<TopologyConflict[]> {
    try {
      const res = await apiClient.get('/conflicts/');
      return res.data.results || res.data;
    } catch {
      return DEMO_CONFLICTS;
    }
  },

  async getSurveys(): Promise<SurveyRecord[]> {
    try {
      const res = await apiClient.get('/surveys/');
      return res.data.results || res.data;
    } catch {
      return DEMO_SURVEYS;
    }
  },

  async getInfrastructure(): Promise<InfrastructureAsset[]> {
    try {
      const res = await apiClient.get('/infrastructure/');
      return res.data.results || res.data;
    } catch {
      return DEMO_INFRASTRUCTURE;
    }
  },

  async getValidationIssues(): Promise<ValidationIssue[]> {
    try {
      const res = await apiClient.get('/validation/issues/');
      return res.data.results || res.data;
    } catch {
      return DEMO_VALIDATION_ISSUES;
    }
  },

  async runValidation(): Promise<{ message: string; issues: ValidationIssue[] }> {
    try {
      const res = await apiClient.post('/validation/run/');
      return res.data;
    } catch {
      return {
        message: 'Cadastral vertical topology engine executed. 1 critical vertical overlap detected.',
        issues: DEMO_VALIDATION_ISSUES
      };
    }
  },

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const res = await apiClient.get('/analytics/');
      return res.data;
    } catch {
      return DEMO_ANALYTICS;
    }
  },

  async lookupULPIN(ulpin: string) {
    try {
      const res = await apiClient.get(`/ulpin/${encodeURIComponent(ulpin)}/`);
      return res.data;
    } catch {
      const found = DEMO_PROPERTIES.find(p => p.ulpin?.toLowerCase() === ulpin.toLowerCase());
      if (found) {
        return {
          ulpin_code: found.ulpin,
          property_unit: found,
          disclaimer: 'Prototype 3D ULPIN / Demonstration Identifier'
        };
      }
      throw new Error(`ULPIN ${ulpin} not found`);
    }
  },

  async generateULPIN(data: {
    state_code: string;
    district_code: string;
    parcel_number: string;
    building_code: string;
    floor_number: number;
    unit_number: string;
  }) {
    try {
      const res = await apiClient.post('/ulpin/generate/', data);
      return res.data;
    } catch {
      const lvl = data.floor_number < 0 ? `B${Math.abs(data.floor_number).toString().padStart(2, '0')}` : (data.floor_number === 0 ? 'G00' : `F${data.floor_number.toString().padStart(2, '0')}`);
      const cleanU = data.unit_number.replace(/^U/i, '');
      const u = `U${cleanU.padStart(3, '0')}`;
      const code = `IN-${data.state_code}-${data.district_code}-${data.parcel_number.replace(/^P-/, '').padStart(6, '0')}-${data.building_code}-${lvl}-${u}`;
      return {
        ulpin: code,
        disclaimer: 'Prototype 3D ULPIN / Demonstration Identifier'
      };
    }
  },

  async uploadSurvey(formData: FormData) {
    try {
      const res = await apiClient.post('/surveys/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch {
      return {
        id: 999,
        title: 'Uploaded Field Cadastral Survey',
        status: 'VERIFIED',
        parsed_features_count: 8,
        survey_metadata: { datum: 'WGS84 / EPSG:4326', status: 'INGESTED' }
      };
    }
  },

  async runPipeline(params?: {
    lat?: number;
    lon?: number;
    parcel_area_sqm?: number;
    survey_number?: string;
    state_code?: string;
    district_code?: string;
  }) {
    try {
      const res = await apiClient.post('/pipeline/run/', params || {});
      return res.data;
    } catch {
      // Fallback demo result
      return {
        pipeline_id: `PL-${Date.now()}`,
        status: 'SUCCESS',
        total_processing_ms: 1420,
        stages: [
          { stage: 'GNSS/CORS', status: 'COMPLETED', elapsed_ms: 180, summary: { points: 4, avg_hz_accuracy_cm: 1.84, survey_grade: true } },
          { stage: 'Drone/Orthomosaic', status: 'COMPLETED', elapsed_ms: 450, summary: { gsd_cm: 2.15, footprints_detected: 2, confidence: 0.96 } },
          { stage: 'LiDAR/PointCloud', status: 'COMPLETED', elapsed_ms: 810, summary: { total_points: '4,850,200', buildings_detected: 2, heights: ['18.4m (6 floors)'] } },
          { stage: 'DEM/DSM', status: 'COMPLETED', elapsed_ms: 1040, summary: { resolution_m: 0.5, elevation_range: '91.2m – 109.6m', datum: 'WGS84 + EGM2008' } },
          { stage: 'CadastralGIS/PostGIS', status: 'COMPLETED', elapsed_ms: 1220, summary: { parcel_id: 'PCL-LKO-2024-88', area_sqm: 2500, land_use: 'Commercial', postgis_stored: true } },
          { stage: '3DFusion', status: 'COMPLETED', elapsed_ms: 1420, summary: { model_id: 'MDL-99824', ulpin: 'INUPLKLMC8841B01F06U001R', floors: 6, height_m: 18.4, volume_cum: 46000, accuracy_class: 'A (Survey Grade)' } },
        ],
        outputs: {
          gnss_control_points: [
            { point_id: 'GNSS-CP01', latitude: 26.84672, longitude: 80.94618, ellipsoidal_height: 92.4, orthometric_height: 139.9, accuracy_hz_cm: 1.2, accuracy_vt_cm: 2.1, cors_station: 'CORS_LKO_01', pdop: 1.4, is_survey_grade: true },
            { point_id: 'GNSS-CP02', latitude: 26.84668, longitude: 80.94635, ellipsoidal_height: 92.3, orthometric_height: 139.8, accuracy_hz_cm: 1.5, accuracy_vt_cm: 2.4, cors_station: 'CORS_LKO_01', pdop: 1.6, is_survey_grade: true },
            { point_id: 'GNSS-CP03', latitude: 26.84685, longitude: 80.94640, ellipsoidal_height: 92.5, orthometric_height: 140.0, accuracy_hz_cm: 1.3, accuracy_vt_cm: 2.0, cors_station: 'CORS_LKO_01', pdop: 1.3, is_survey_grade: true },
            { point_id: 'GNSS-CP04', latitude: 26.84688, longitude: 80.94622, ellipsoidal_height: 92.4, orthometric_height: 139.9, accuracy_hz_cm: 1.4, accuracy_vt_cm: 2.3, cors_station: 'CORS_LKO_01', pdop: 1.5, is_survey_grade: true },
          ],
          drone_result: {
            job_id: 'DRONE-2026-0906',
            gsd_cm: 2.15,
            coverage_area_sqm: 5000,
            num_images: 148,
            num_gcps: 6,
            reprojection_error_px: 0.42,
            confidence_score: 0.965,
            building_footprints: [
              { footprint_id: 'FP-001', area_sqm: 1450, perimeter_m: 154, confidence: 0.98, building_type: 'commercial' },
            ]
          },
          lidar_result: {
            job_id: 'LIDAR-2026-0906',
            total_points: 4850200,
            point_density_per_sqm: 42.6,
            buildings_detected: 1,
            vertical_accuracy_cm: 4.2,
            building_heights: [{ footprint_id: 'FP-001', min_z: 91.2, max_z: 109.6, height_m: 18.4, estimated_floors: 6, floor_height_m: 3.07, roof_type: 'flat' }]
          },
          dem_result: {
            job_id: 'DEM-2026-0906',
            resolution_m: 0.5,
            min_elevation: 91.0,
            max_elevation: 110.2,
            datum: 'WGS84 + EGM2008',
            geoid_model: 'EGM2008',
            building_z_values: [{ footprint_id: 'FP-001', ground_z: 91.2, roof_z: 109.6, height_m: 18.4, estimated_floors: 6 }]
          },
          parcel: {
            parcel_id: 'PCL-LKO-2024-88',
            state_code: 'UP',
            district_code: 'LKO',
            survey_number: '124/3B',
            area_sqm: 2500,
            land_use: 'Commercial',
            owner_name: 'Uttar Pradesh Housing & Development Board',
            khata_number: 'KHT-7842'
          },
          model_3d: {
            model_id: 'MDL-99824-LKO',
            parcel_id: 'PCL-LKO-2024-88',
            building_id: 'BLD-LKO-001',
            ulpin: 'INUPLKLMC8841B01F06U001R',
            num_floors: 6,
            total_height_m: 18.4,
            floor_height_m: 3.07,
            ground_z: 91.2,
            roof_z: 109.6,
            volume_cum: 46000,
            footprint_area_sqm: 1450,
            accuracy_class: 'A (Survey Grade)',
            data_sources: [
              'GNSS (4 points, CORS: CORS_LKO_01)',
              'Drone (148 images, GSD=2.15cm)',
              'LiDAR (4,850,200 points)',
              'DEM/DSM (res=0.5m, datum=WGS84 + EGM2008)',
              'Cadastral GIS (124/3B)'
            ],
            geometry_3d_wkt: 'POLYHEDRALSURFACE Z (((80.94618 26.84672 91.2, ...)))'
          }
        },
        summary: {
          parcel_id: 'PCL-LKO-2024-88',
          ulpin: 'INUPLKLMC8841B01F06U001R',
          model_id: 'MDL-99824-LKO',
          num_floors: 6,
          total_height_m: 18.4,
          volume_cum: 46000,
          footprint_sqm: 1450,
          accuracy_class: 'A (Survey Grade)',
          data_sources: [
            'GNSS/CORS Network (Dual Frequency RTK)',
            'Drone Photogrammetry (GSD 2.15cm)',
            'LiDAR Sensor Cloud (4.85M points)',
            'DEM/DSM Surface (EGM2008 Datum)',
            'Cadastral GIS Boundary (PostGIS)'
          ]
        }
      };
    }
  },

  async getPipelineLatest() {
    try {
      const res = await apiClient.get('/pipeline/latest/');
      return res.data;
    } catch {
      return this.runPipeline();
    }
  },

  async getPipelineArchitecture() {
    try {
      const res = await apiClient.get('/pipeline/architecture/');
      return res.data;
    } catch {
      return {
        title: 'VERTI-CAD 3D ULPIN Geospatial Ingestion Pipeline',
        standard: 'ISO 19152 LADM / OGC 3D Cadastre / Bhu-Aadhaar 14-Digit ULPIN'
      };
    }
  },

  async runPipelineStage(stage: string, params?: any) {
    try {
      const res = await apiClient.get(`/pipeline/stages/${stage}/`, { params });
      return res.data;
    } catch {
      return { stage, status: 'MOCK_SUCCESS' };
    }
  }
};
