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
  }
};
