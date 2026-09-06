import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Camera,
  Cpu,
  Mountain,
  Layers,
  Box,
  CheckCircle2,
  ArrowDown,
  Play,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Sparkles,
  Sliders,
  ChevronRight,
  Database,
  Building2,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';

export const PipelinePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'3d_model' | 'gnss' | 'drone' | 'lidar' | 'dem' | 'cadastral' | 'stages'>('3d_model');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeStageStep, setActiveStageStep] = useState<number>(6); // 1-6

  // Form parameters
  const [lat, setLat] = useState<number>(26.8467);
  const [lon, setLon] = useState<number>(80.9462);
  const [area, setArea] = useState<number>(2500);
  const [surveyNo, setSurveyNo] = useState<string>('124/3B');
  const [locationPreset, setLocationPreset] = useState<string>('LKO');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPipelineLatest();
      setPipelineData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPreset = (preset: string) => {
    setLocationPreset(preset);
    if (preset === 'LKO') {
      setLat(26.8467);
      setLon(80.9462);
      setSurveyNo('124/3B');
      setArea(2500);
    } else if (preset === 'VNS') {
      setLat(25.3176);
      setLon(82.9739);
      setSurveyNo('452/1A');
      setArea(3400);
    } else if (preset === 'AYD') {
      setLat(26.7922);
      setLon(82.1998);
      setSurveyNo('89/2C');
      setArea(4200);
    } else if (preset === 'DLH') {
      setLat(28.6139);
      setLon(77.2090);
      setSurveyNo('671/9');
      setArea(5100);
    }
  };

  const handleRunPipeline = async () => {
    setLoading(true);
    setActiveStageStep(1);
    try {
      // Simulate live stage stepper progression
      for (let i = 1; i <= 5; i++) {
        setActiveStageStep(i);
        await new Promise((r) => setTimeout(r, 220));
      }
      const res = await apiService.runPipeline({
        lat,
        lon,
        parcel_area_sqm: area,
        survey_number: surveyNo,
        state_code: locationPreset === 'DLH' ? 'DL' : 'UP',
        district_code: locationPreset === 'LKO' ? 'LKO' : locationPreset === 'VNS' ? 'VNS' : locationPreset === 'AYD' ? 'AYD' : 'DLH',
      });
      setActiveStageStep(6);
      setPipelineData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWKT = () => {
    if (pipelineData?.outputs?.model_3d?.geometry_3d_wkt) {
      navigator.clipboard.writeText(pipelineData.outputs.model_3d.geometry_3d_wkt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const model = pipelineData?.outputs?.model_3d;
  const parcel = pipelineData?.outputs?.parcel;
  const gnss = pipelineData?.outputs?.gnss_control_points || [];
  const drone = pipelineData?.outputs?.drone_result;
  const lidar = pipelineData?.outputs?.lidar_result;
  const dem = pipelineData?.outputs?.dem_result;
  const stages = pipelineData?.stages || [];

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ backgroundColor: '#0284c7', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
              VERTI-CAD PIPELINE
            </span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={14} /> ISO 19152 LADM / OGC 3D Cadastre
            </span>
            <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
              &bull; 14-Digit Bhu-Aadhaar 3D ULPIN
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0.4rem 0 0.2rem 0' }}>
            Geospatial Ingestion & 3D Property Reconstruction Pipeline
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Unified processing of GNSS/CORS, Drone Orthomosaics, LiDAR Point Clouds, DEM/DSM Datums, and Cadastral GIS into PostGIS PolyhedralSurface volumetric models.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleRunPipeline}
            disabled={loading}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
            {loading ? 'Running Ingestion Pipeline...' : 'Run End-to-End Pipeline'}
          </button>
        </div>
      </div>

      {/* Preset & Parameters Bar */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={16} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>Location Preset:</span>
          {[
            { id: 'LKO', label: 'Lucknow (Gomti Nagar)' },
            { id: 'VNS', label: 'Varanasi (Cantt)' },
            { id: 'AYD', label: 'Ayodhya (Smart City)' },
            { id: 'DLH', label: 'Delhi NCR (Central)' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLocationPreset(preset.id)}
              style={{
                backgroundColor: locationPreset === preset.id ? '#1e293b' : 'transparent',
                color: locationPreset === preset.id ? '#38bdf8' : '#94a3b8',
                border: locationPreset === preset.id ? '1px solid #0284c7' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Lat:</span>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              style={{ width: '90px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '3px 6px', borderRadius: '4px', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Lon:</span>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
              style={{ width: '90px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '3px 6px', borderRadius: '4px', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Area (sqm):</span>
            <input
              type="number"
              step="100"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value))}
              style={{ width: '80px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '3px 6px', borderRadius: '4px', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Survey No:</span>
            <input
              type="text"
              value={surveyNo}
              onChange={(e) => setSurveyNo(e.target.value)}
              style={{ width: '80px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '3px 6px', borderRadius: '4px', fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          INTERACTIVE ARCHITECTURE FLOWCHART
          Matching user's exact specification:
          GNSS/CORS -> Survey points -> Accurate coordinates
          Drone -> Drone imagery -> Orthomosaic -> Building footprint
          LiDAR -> Point cloud -> Building height -> 3D structure
          DEM/DSM -> Elevation -> Ground reference -> Building Z values
          Cadastral GIS -> Parcel boundary -> PostGIS
          Then: 2D Parcel + Building + Height + Floor plan + Elevation -> 3D Property Model
         ───────────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#0b1329',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PIPELINE ARCHITECTURE ENGINE
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', margin: '0.2rem 0 0 0' }}>
              5 Ingestion Streams &rarr; 3D Property Reconstruction Convergence
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: loading ? '#f59e0b' : '#10b981' }} />
            <span>{loading ? `Step ${activeStageStep}/6 Processing...` : 'Pipeline Operational &bull; 6 Stages Ready'}</span>
          </div>
        </div>

        {/* 5 Input Streams Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Stream 1: GNSS/CORS */}
          <div
            style={{
              backgroundColor: activeStageStep >= 1 ? '#0f172a' : '#0a0f1d',
              border: activeStageStep === 1 ? '2px solid #0284c7' : '1px solid #1e293b',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: activeStageStep === 1 ? '0 0 16px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', marginBottom: '0.5rem' }}>
              <Satellite size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>GNSS / CORS</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Survey Points</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#38bdf8' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#10b981', fontWeight: 700 }}>Accurate Coordinates</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                Dual-frequency RTK &bull; EGM2008 &bull; &plusmn;1.8cm Hz
              </div>
            </div>
          </div>

          {/* Stream 2: Drone */}
          <div
            style={{
              backgroundColor: activeStageStep >= 2 ? '#0f172a' : '#0a0f1d',
              border: activeStageStep === 2 ? '2px solid #0284c7' : '1px solid #1e293b',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: activeStageStep === 2 ? '0 0 16px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ec4899', marginBottom: '0.5rem' }}>
              <Camera size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Drone Photogrammetry</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Drone Imagery</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#ec4899' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Orthomosaic</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#ec4899' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#10b981', fontWeight: 700 }}>Building Footprint</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                SfM/MVS &bull; GSD &lt; 2.5cm &bull; Polygon GeoJSON
              </div>
            </div>
          </div>

          {/* Stream 3: LiDAR */}
          <div
            style={{
              backgroundColor: activeStageStep >= 3 ? '#0f172a' : '#0a0f1d',
              border: activeStageStep === 3 ? '2px solid #0284c7' : '1px solid #1e293b',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: activeStageStep === 3 ? '0 0 16px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', marginBottom: '0.5rem' }}>
              <Cpu size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>LiDAR Sensor Suite</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Point Cloud</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#8b5cf6' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Building Height</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#8b5cf6' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#10b981', fontWeight: 700 }}>3D Structure Height</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                CSF Classification &bull; &gt;40 pts/m&sup2; &bull; &plusmn;4cm Vt
              </div>
            </div>
          </div>

          {/* Stream 4: DEM/DSM */}
          <div
            style={{
              backgroundColor: activeStageStep >= 4 ? '#0f172a' : '#0a0f1d',
              border: activeStageStep === 4 ? '2px solid #0284c7' : '1px solid #1e293b',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: activeStageStep === 4 ? '0 0 16px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
              <Mountain size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>DEM / DSM Elevation</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Elevation Raster</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#f59e0b' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Ground Reference</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#f59e0b' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#10b981', fontWeight: 700 }}>Building Z Values</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                MSL Geoid &bull; Cartosat-3 + LiDAR &bull; 0.5m Res
              </div>
            </div>
          </div>

          {/* Stream 5: Cadastral GIS */}
          <div
            style={{
              backgroundColor: activeStageStep >= 5 ? '#0f172a' : '#0a0f1d',
              border: activeStageStep === 5 ? '2px solid #0284c7' : '1px solid #1e293b',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: activeStageStep === 5 ? '0 0 16px rgba(2, 132, 199, 0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
              <Layers size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Existing Cadastral GIS</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Parcel Boundary</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0', color: '#10b981' }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ color: '#10b981', fontWeight: 700 }}>PostGIS 2D Base</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                Khasra/Khata &bull; Revenue Records &bull; Spatial SRID:4326
              </div>
            </div>
          </div>
        </div>

        {/* Convergence Connector */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
          <div style={{ height: '1px', flex: 1, backgroundColor: '#334155' }} />
          <div
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} /> THEN &bull; MULTI-MODAL 3D RECONSTRUCTION FUSION
          </div>
          <div style={{ height: '1px', flex: 1, backgroundColor: '#334155' }} />
        </div>

        {/* Formula Box & Target Model */}
        <div
          style={{
            backgroundColor: '#02182b',
            border: '2px solid #0284c7',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
          }}
        >
          {/* Formula Elements */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
              2D Parcel
            </span>
            <span style={{ color: '#94a3b8', fontWeight: 800 }}>+</span>
            <span style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ec4899', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
              Building Footprint
            </span>
            <span style={{ color: '#94a3b8', fontWeight: 800 }}>+</span>
            <span style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#8b5cf6', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
              Height (LiDAR)
            </span>
            <span style={{ color: '#94a3b8', fontWeight: 800 }}>+</span>
            <span style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#10b981', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
              Floor Plan
            </span>
            <span style={{ color: '#94a3b8', fontWeight: 800 }}>+</span>
            <span style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f59e0b', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
              Elevation (DEM)
            </span>
            <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '1.2rem' }}>&rarr;</span>
          </div>

          {/* Output 3D Property Model Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <Box size={20} /> 3D Property Model
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                PostGIS PolyhedralSurface Z &bull; OGC Volumetric Solid
              </div>
            </div>
            <div
              style={{
                backgroundColor: '#10b981',
                color: '#0f172a',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}
            >
              GENERATED
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MAIN CONTENT AREA: 3D MODEL PREVIEW + DATA INSPECTOR TABS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Interactive 3D Model Building Isometric View */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                3D VOLUMETRIC CADASTRE
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0.2rem 0 0 0' }}>
                {model?.model_id || 'MDL-99824'}
              </h3>
            </div>
            <span
              style={{
                backgroundColor: '#1e293b',
                color: '#10b981',
                border: '1px solid #10b981',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {model?.accuracy_class || 'Class A (Survey Grade)'}
            </span>
          </div>

          {/* 3D Isometric Stack Visualizer */}
          <div
            style={{
              backgroundColor: '#030712',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              padding: '1.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Datum Gridlines */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '0.7rem', color: '#64748b' }}>
              Roof Z: <strong style={{ color: '#38bdf8' }}>{model?.roof_z || 109.6}m</strong> MSL
            </div>
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '0.7rem', color: '#64748b' }}>
              Ground Reference Z: <strong style={{ color: '#10b981' }}>{model?.ground_z || 91.2}m</strong> (EGM2008)
            </div>

            {/* Stacked 3D Isometric Floors */}
            <div style={{ width: '80%', maxWidth: '280px', display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}>
              {Array.from({ length: model?.num_floors || 6 }).map((_, idx) => {
                const floorNo = idx + 1;
                const isSelected = selectedFloor === floorNo;
                return (
                  <div
                    key={floorNo}
                    onClick={() => setSelectedFloor(isSelected ? null : floorNo)}
                    style={{
                      height: '34px',
                      backgroundColor: isSelected ? '#0284c7' : '#1e293b',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transform: 'perspective(400px) rotateX(15deg)',
                      boxShadow: isSelected ? '0 4px 16px rgba(2, 132, 199, 0.5)' : '0 2px 4px rgba(0,0,0,0.5)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>Floor {floorNo} {floorNo === (model?.num_floors || 6) ? '(Penthouse / Terrace)' : ''}</span>
                    <span style={{ fontSize: '0.7rem', color: isSelected ? '#ffffff' : '#94a3b8' }}>
                      +{(floorNo * (model?.floor_height_m || 3.07)).toFixed(1)}m
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Ground Plane */}
            <div
              style={{
                width: '95%',
                height: '8px',
                backgroundColor: '#334155',
                borderRadius: '4px',
                marginTop: '12px',
                transform: 'perspective(400px) rotateX(25deg)',
                border: '1px solid #475569',
              }}
            />
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
              Cadastral Base Extrusion Plane &bull; Area: {parcel?.area_sqm || 2500} m&sup2;
            </div>
          </div>

          {/* Model Summary Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Height</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{model?.total_height_m || 18.4}m</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Storeys / Floors</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>{model?.num_floors || 6} Lvl</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>3D Volume</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{(model?.volume_cum || 46000).toLocaleString()} m&sup3;</div>
            </div>
          </div>

          {/* Generated ULPIN Banner */}
          <div
            style={{
              backgroundColor: '#02203d',
              border: '1px solid #0284c7',
              borderRadius: '6px',
              padding: '0.75rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>14-DIGIT 3D BHU-AADHAAR ULPIN</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
                {model?.ulpin || 'INUPLKLMC8841B01F06U001R'}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(model?.ulpin || 'INUPLKLMC8841B01F06U001R');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Right Column: Multi-Source Data Stream Inspector */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', marginBottom: '1rem', overflowX: 'auto' }}>
            {[
              { id: '3d_model', label: '3D Geometry (WKT)' },
              { id: 'gnss', label: 'GNSS / CORS' },
              { id: 'drone', label: 'Drone Ortho' },
              { id: 'lidar', label: 'LiDAR Cloud' },
              { id: 'dem', label: 'DEM / DSM' },
              { id: 'cadastral', label: 'Cadastral GIS' },
              { id: 'stages', label: 'Execution Log' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  backgroundColor: activeTab === tab.id ? '#0284c7' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: 3D WKT & Model Metadata */}
          {activeTab === '3d_model' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  PostGIS ST_GeomFromText PolyhedralSurface Z:
                </span>
                <button
                  onClick={handleCopyWKT}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied WKT' : 'Copy Full WKT'}
                </button>
              </div>

              <textarea
                readOnly
                value={model?.geometry_3d_wkt || 'POLYHEDRALSURFACE Z (((80.94618 26.84672 91.200, 80.94638 26.84672 91.200, ...)))'}
                style={{
                  width: '100%',
                  height: '160px',
                  backgroundColor: '#030712',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '8px',
                  color: '#10b981',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  resize: 'none',
                }}
              />

              <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                  Fused Data Source Provenance:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(model?.data_sources || [
                    'GNSS Network (4 CORS control points)',
                    'Drone Imagery (148 images, GSD 2.15cm)',
                    'LiDAR Sensor (4.85M points)',
                    'DEM/DSM Surface (EGM2008 datum)',
                    'Cadastral GIS (124/3B)'
                  ]).map((ds: string, i: number) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                      <span>{ds}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: GNSS Control Points */}
          {activeTab === 'gnss' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                CORS Network Survey Control Points (Dual-Frequency RTK / PPP):
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: '#cbd5e1' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Point ID</th>
                      <th style={{ padding: '6px' }}>Latitude</th>
                      <th style={{ padding: '6px' }}>Longitude</th>
                      <th style={{ padding: '6px' }}>Orthometric H (m)</th>
                      <th style={{ padding: '6px' }}>Hz Acc (cm)</th>
                      <th style={{ padding: '6px' }}>CORS Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gnss.map((pt: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '6px', fontWeight: 700, color: '#38bdf8' }}>{pt.point_id}</td>
                        <td style={{ padding: '6px' }}>{pt.latitude?.toFixed(6)}</td>
                        <td style={{ padding: '6px' }}>{pt.longitude?.toFixed(6)}</td>
                        <td style={{ padding: '6px', color: '#10b981' }}>{pt.orthometric_height?.toFixed(2)}m</td>
                        <td style={{ padding: '6px' }}>{pt.accuracy_hz_cm} cm</td>
                        <td style={{ padding: '6px', color: '#f59e0b' }}>{pt.cors_station}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Drone Ortho */}
          {activeTab === 'drone' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>GSD Resolution</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ec4899' }}>{drone?.gsd_cm || 2.15} cm/px</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Imagery Frames</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{drone?.num_images || 148} imgs</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Reprojection Err</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{drone?.reprojection_error_px || 0.42} px</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                  Detected Building Footprint Polygon:
                </div>
                <pre style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', overflowX: 'auto', fontFamily: 'monospace' }}>
                  {JSON.stringify(drone?.building_footprints?.[0] || { footprint_id: 'FP-001', area_sqm: 1450, perimeter_m: 154 }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 4: LiDAR */}
          {activeTab === 'lidar' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Points</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#8b5cf6' }}>
                    {typeof lidar?.total_points === 'number' ? lidar.total_points.toLocaleString() : lidar?.total_points || '4,850,200'}
                  </div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Density</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{lidar?.point_density_per_sqm || 42.6} pts/m&sup2;</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Vertical Accuracy</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{lidar?.vertical_accuracy_cm || 4.2} cm</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                  Point Cloud Classification Distribution:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span>Ground Points (CSF Filtered)</span>
                      <span>{lidar?.ground_points_pct || 48}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#334155', borderRadius: '3px', marginTop: '3px' }}>
                      <div style={{ width: `${lidar?.ground_points_pct || 48}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span>Building Roof & Facade Points</span>
                      <span>{lidar?.building_points_pct || 36}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#334155', borderRadius: '3px', marginTop: '3px' }}>
                      <div style={{ width: `${lidar?.building_points_pct || 36}%`, height: '100%', backgroundColor: '#8b5cf6', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: DEM/DSM */}
          {activeTab === 'dem' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Elevation Datum</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>{dem?.datum || 'WGS84 + EGM2008'}</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Raster Grid Resolution</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>{dem?.resolution_m || 0.5} metre</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                  Derived Building Z Values (Ground vs Roof):
                </div>
                {dem?.building_z_values?.map((bz: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', padding: '4px 0', borderBottom: '1px solid #334155' }}>
                    <span>Footprint {bz.footprint_id}</span>
                    <span>Base Z: <strong style={{ color: '#10b981' }}>{bz.ground_z}m</strong> &rarr; Roof: <strong style={{ color: '#38bdf8' }}>{bz.roof_z}m</strong> ({bz.height_m}m)</span>
                  </div>
                )) || (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Base Z: 91.2m &rarr; Roof: 109.6m (18.4m height)</div>
                )}
              </div>
            </div>
          )}

          {/* Tab 6: Cadastral GIS */}
          {activeTab === 'cadastral' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Parcel ID:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{parcel?.parcel_id || 'PCL-LKO-2024-88'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Survey / Khasra No:</span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{parcel?.survey_number || '124/3B'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Khata Number:</span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{parcel?.khata_number || 'KHT-7842'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Land Use Classification:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{parcel?.land_use || 'Commercial'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Cadastral 2D Area:</span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{parcel?.area_sqm || 2500} m&sup2;</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Owner of Record:</span>
                  <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{parcel?.owner_name || 'Uttar Pradesh Housing Board'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Stages Execution Log */}
          {activeTab === 'stages' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stages.map((stg: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#1e293b',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: 700, color: '#f8fafc' }}>{stg.stage}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.75rem' }}>
                      <span>{stg.status}</span>
                      <span style={{ color: '#38bdf8' }}>{stg.elapsed_ms}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;
