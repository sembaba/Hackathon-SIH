import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ThreeDCadastreMap, CameraMode } from '../map/ThreeDCadastreMap';
import { FloorExplorer } from '../components/FloorExplorer';
import { PropertyDetailsDrawer } from '../components/PropertyDetailsDrawer';
import { ConflictModal } from '../components/ConflictModal';
import { Parcel, Building, Floor, PropertyUnit, TopologyConflict } from '../types';
import { apiService } from '../services/api';
import { runTopologyValidation, propertyToBBox, ConflictResult } from '../engine/TopologyEngine';
import { DEMO_ULPIN_TABLE } from '../engine/ULPINEngine';
import {
  Layers,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  AlertTriangle,
  Globe,
  ArrowDown,
  Plane,
  Cpu,
  Radio,
  Scissors,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Map3DPageProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const Map3DPage: React.FC<Map3DPageProps> = ({ searchQuery, onClearSearch }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Data State ──────────────────────────────────────────
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [building, setBuilding] = useState<Building | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [conflict, setConflict] = useState<TopologyConflict | null>(null);

  // ── Selection State ─────────────────────────────────────
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [isolatedFloorId, setIsolatedFloorId] = useState<number | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyUnit | null>(null);
  const [isConflictIsolated, setIsConflictIsolated] = useState<boolean>(false);
  const [showUnderground, setShowUnderground] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);

  // ── NEW: Camera & Render Controls ───────────────────────
  const [cameraMode, setCameraMode] = useState<CameraMode>('surface');
  const [clipFloorY, setClipFloorY] = useState<number | null>(null);
  const [clipEnabled, setClipEnabled] = useState<boolean>(false);
  const [clipValue, setClipValue] = useState<number>(12); // slider value in metres
  const [showPointCloud, setShowPointCloud] = useState<boolean>(false);

  // ── Layer Visibility ─────────────────────────────────────
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    parcels: true,
    buildings: true,
    properties: true,
    roads: true,
    survey_points: true,
    conflicts: true,
  });

  // ── AABB Topology Engine results ─────────────────────────
  const [topoResults, setTopoResults] = useState<ConflictResult[]>([]);
  const [topoRunning, setTopoRunning] = useState(false);

  // ── Toast ────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // ── Load Data ────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const [pData, bData, fData, propData, confData] = await Promise.all([
        apiService.getParcels(),
        apiService.getBuildings(),
        apiService.getFloors(),
        apiService.getProperties(),
        apiService.getConflicts(),
      ]);
      setParcels(pData);
      if (bData.length > 0) setBuilding(bData[0]);
      setFloors(fData);

      // Enrich ULPIN codes with new format
      const enriched = propData.map((p) => ({
        ...p,
        ulpin: DEMO_ULPIN_TABLE[p.unit_number] || p.ulpin,
      }));
      setProperties(enriched);

      if (confData.length > 0) setConflict(confData[0]);
    }
    loadData();
  }, []);

  // ── Search Query Handler ──────────────────────────────────
  useEffect(() => {
    const query = searchQuery || searchParams.get('ulpin') || searchParams.get('unit') || searchParams.get('query');
    if (!query || properties.length === 0) return;
    const clean = query.trim().toLowerCase();

    const match = properties.find(
      (p) =>
        p.ulpin?.toLowerCase().includes(clean) ||
        p.unit_number.toLowerCase() === clean ||
        p.unit_number.toLowerCase() === `u${clean}` ||
        `u${p.unit_number.toLowerCase()}` === clean ||
        p.parcel_number.toLowerCase() === clean ||
        p.building_code.toLowerCase() === clean
    );

    if (match) {
      setSelectedProperty(match);
      const f = floors.find((fl) => fl.floor_number === match.floor_number);
      if (f) setSelectedFloor(f);
      if (match.floor_number < 0) {
        setShowUnderground(true);
        setCameraMode('underground');
      }
      showToast(`Located: ${match.unit_number} — ${match.ulpin || match.unit_number}`);
      if (onClearSearch) onClearSearch();
    } else {
      showToast('⚠ No matching property found in cadastre.');
      if (onClearSearch) onClearSearch();
    }
  }, [searchQuery, searchParams, properties, floors]);

  // ── Handlers ─────────────────────────────────────────────
  const handleResetView = () => {
    setSelectedFloor(null);
    setIsolatedFloorId(null);
    setSelectedProperty(null);
    setIsConflictIsolated(false);
    setCameraMode('surface');
    setClipEnabled(false);
    setClipFloorY(null);
    showToast('View reset to default surface perspective.');
  };

  const handleIsolateFloor = (floorId: number | null) => {
    setIsolatedFloorId(floorId);
    if (floorId !== null) {
      const fl = floors.find((f) => f.id === floorId);
      if (fl) { setSelectedFloor(fl); showToast(`Isolated ${fl.level_code} — ${fl.floor_label}`); }
    } else {
      showToast('All floors visible.');
    }
  };

  const handleTriggerConflictFlow = () => setShowConflictModal(true);

  const handleIsolateConflict = () => {
    setIsConflictIsolated(!isConflictIsolated);
    if (!isConflictIsolated) {
      const f05 = floors.find((f) => f.floor_number === 5);
      if (f05) setSelectedFloor(f05);
      const u503 = properties.find((p) => p.unit_number === 'U503');
      if (u503) setSelectedProperty(u503);
      showToast('⚠ Conflict Zone Isolated: U503 ↔ U504 — 1.0m Overlap at 17m–18m (red zone)');
    } else {
      showToast('Conflict isolation cleared.');
    }
  };

  const handleViewUnit = (unitNumber: string) => {
    const u = properties.find((p) => p.unit_number === unitNumber || p.unit_number === `U${unitNumber}`);
    if (u) {
      setSelectedProperty(u);
      const f = floors.find((fl) => fl.floor_number === u.floor_number);
      if (f) setSelectedFloor(f);
      showToast(`Selected Unit ${u.unit_number}`);
    }
  };

  const toggleLayer = (key: string) =>
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Camera Mode Handler ───────────────────────────────────
  const handleCameraMode = (mode: CameraMode) => {
    setCameraMode(mode);
    if (mode === 'underground') setShowUnderground(true);
    else setShowUnderground(false);
    showToast(
      mode === 'surface'
        ? '📍 Surface Mode — Cadastral ground view'
        : mode === 'underground'
        ? '⛏ Underground Mode — Subsurface / Utility view'
        : '✈ Aerial Mode — Bird\'s eye orthographic view'
    );
  };

  // ── Clipping Plane Toggle ─────────────────────────────────
  const handleClipToggle = () => {
    const next = !clipEnabled;
    setClipEnabled(next);
    setClipFloorY(next ? clipValue : null);
    showToast(next ? `✂ Floor slicer active @ ${clipValue}m elevation` : 'Floor slicer off.');
  };

  const handleClipSlider = (val: number) => {
    setClipValue(val);
    if (clipEnabled) setClipFloorY(val);
  };

  // ── Run Client-Side Topology Engine ──────────────────────
  const handleRunTopology = async () => {
    setTopoRunning(true);
    showToast('Running AABB 3D topology validation…');
    await new Promise((r) => setTimeout(r, 900)); // simulate async
    const bboxes = properties.map(propertyToBBox);
    const report = runTopologyValidation(bboxes);
    setTopoResults(report.conflicts);
    setTopoRunning(false);
    showToast(
      report.validation_passed
        ? `✅ Topology OK — ${report.total_units_checked} units checked, no critical conflicts`
        : `⚠ ${report.total_conflicts} conflict(s) detected — ${report.conflicts_by_severity.ERROR} error(s)`
    );
  };

  return (
    <div className="map-page-container">
      {/* 3D Cadastre Engine */}
      <ThreeDCadastreMap
        parcels={parcels}
        building={building}
        floors={floors}
        properties={properties}
        conflict={conflict}
        selectedFloor={selectedFloor}
        selectedProperty={selectedProperty}
        isConflictIsolated={isConflictIsolated}
        isolatedFloorId={isolatedFloorId}
        showUnderground={showUnderground}
        activeLayers={activeLayers}
        cameraMode={cameraMode}
        clipFloorY={clipFloorY}
        showPointCloud={showPointCloud}
        onSelectFloor={setSelectedFloor}
        onSelectProperty={setSelectedProperty}
        onResetView={handleResetView}
        onCameraMode={handleCameraMode}
      />

      {/* ─── Top Action Bar ─────────────────────────────── */}
      <div className="map-top-bar">
        {/* Conflict button */}
        <button
          onClick={handleTriggerConflictFlow}
          className="btn btn-sm map-top-btn conflict-btn"
          title="Inspect Topology Conflict (U503 ↔ U504)"
        >
          <AlertTriangle size={14} color="#dc2626" />
          <span>⚠ Topology Conflict: U503 ↔ U504 (1m Overlap)</span>
        </button>

        {/* Isolate conflict */}
        <button
          onClick={handleIsolateConflict}
          className={`btn btn-sm map-top-btn ${isConflictIsolated ? 'btn-danger' : 'btn-secondary'}`}
          title="Isolate 3D Overlap Volume"
        >
          <Layers size={13} />
          <span>{isConflictIsolated ? 'Show All Floors' : 'Isolate Conflict'}</span>
        </button>

        {/* Layer toggle */}
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`btn btn-sm map-top-btn ${showLayerMenu ? 'btn-primary' : 'btn-secondary'}`}
          title="GIS Layers"
        >
          <Layers size={13} />
          <span>Layers</span>
        </button>

        {/* 2D Map */}
        <button
          onClick={() => navigate('/2d-map')}
          className="btn btn-secondary btn-sm map-top-btn"
          title="2D Cadastral Map"
        >
          <MapIcon size={13} />
          <span>2D Map</span>
        </button>

        {/* Reset */}
        <button onClick={handleResetView} className="btn btn-secondary btn-sm map-top-btn" title="Reset View">
          <RotateCcw size={13} />
        </button>
      </div>

      {/* ─── Camera Mode Panel (NEW) ─────────────────────── */}
      <div className="camera-mode-panel">
        <div className="camera-mode-label">CAMERA MODE</div>
        <div className="camera-mode-buttons">
          <button
            className={`camera-mode-btn ${cameraMode === 'surface' ? 'active' : ''}`}
            onClick={() => handleCameraMode('surface')}
            title="Surface — Cadastral Ground View"
          >
            <Globe size={14} />
            <span>Surface</span>
          </button>
          <button
            className={`camera-mode-btn ${cameraMode === 'underground' ? 'active underground' : ''}`}
            onClick={() => handleCameraMode('underground')}
            title="Underground — Subsurface / Utility View"
          >
            <ArrowDown size={14} />
            <span>Underground</span>
          </button>
          <button
            className={`camera-mode-btn ${cameraMode === 'aerial' ? 'active aerial' : ''}`}
            onClick={() => handleCameraMode('aerial')}
            title="Aerial — Bird's Eye View"
          >
            <Plane size={14} />
            <span>Aerial</span>
          </button>
        </div>

        <div className="camera-mode-divider" />

        {/* Point Cloud Toggle */}
        <button
          className={`camera-mode-btn full ${showPointCloud ? 'active lidar' : ''}`}
          onClick={() => { setShowPointCloud(!showPointCloud); showToast(showPointCloud ? 'LiDAR point cloud hidden.' : '⬥ LiDAR point cloud active — 35,000 pts'); }}
          title="Toggle LiDAR Point Cloud"
        >
          <Radio size={13} />
          <span>{showPointCloud ? 'Hide LiDAR' : 'Show LiDAR'}</span>
        </button>

        <div className="camera-mode-divider" />

        {/* Floor Slicer */}
        <div className="floor-slicer-panel">
          <div className="floor-slicer-header">
            <Scissors size={12} />
            <span>FLOOR SLICER</span>
            <button
              className={`floor-slicer-toggle ${clipEnabled ? 'active' : ''}`}
              onClick={handleClipToggle}
            >
              {clipEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {clipEnabled && (
            <>
              <div className="floor-slicer-value">{clipValue}m elevation</div>
              <input
                type="range"
                min={-6}
                max={24}
                step={0.5}
                value={clipValue}
                onChange={(e) => handleClipSlider(Number(e.target.value))}
                className="floor-slicer-range"
                title="Drag to slice at elevation"
              />
              <div className="floor-slicer-ticks">
                <span>B02</span>
                <span>G</span>
                <span>F04</span>
                <span>F06</span>
              </div>
            </>
          )}
        </div>

        <div className="camera-mode-divider" />

        {/* AABB Topology Engine Button */}
        <button
          className={`camera-mode-btn full ${topoRunning ? 'running' : ''}`}
          onClick={handleRunTopology}
          disabled={topoRunning}
          title="Run client-side AABB 3D topology validation"
        >
          <Cpu size={13} />
          <span>{topoRunning ? 'Running…' : 'Run AABB Validation'}</span>
        </button>

        {/* Topology Results Summary */}
        {topoResults.length > 0 && (
          <div className="topo-results">
            {topoResults.slice(0, 3).map((r) => (
              <div key={r.id} className={`topo-result-item ${r.severity.toLowerCase()}`}>
                {r.severity === 'ERROR' ? <XCircle size={11} /> : <AlertTriangle size={11} />}
                <span>{r.unit_a} ↔ {r.unit_b} ({r.overlap_height_m.toFixed(1)}m)</span>
              </div>
            ))}
            {topoResults.length === 0 && (
              <div className="topo-result-item ok">
                <CheckCircle2 size={11} />
                <span>No conflicts found</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── GIS Layer Menu ──────────────────────────────── */}
      {showLayerMenu && (
        <div className="map-floating-panel" style={{ top: '3.5rem', left: '70px', width: '235px', padding: '0.85rem', zIndex: 35 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            GIS LAYER VISIBILITY
          </div>
          {[
            { key: 'parcels', label: 'Cadastral Parcels' },
            { key: 'buildings', label: '3D Building Envelope' },
            { key: 'properties', label: '3D Property Volumes' },
            { key: 'roads', label: 'Road Networks' },
            { key: 'survey_points', label: 'Survey Benchmarks' },
            { key: 'conflicts', label: 'Conflict Highlight Zone' },
          ].map((l) => (
            <label key={l.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#0f172a', padding: '0.25rem 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={activeLayers[l.key] !== false} onChange={() => toggleLayer(l.key)} style={{ accentColor: '#0284c7' }} />
              <span>{l.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* ─── Vertical Floor Explorer ─────────────────────── */}
      <FloorExplorer
        floors={floors}
        properties={properties}
        selectedFloor={selectedFloor}
        isolatedFloorId={isolatedFloorId}
        onSelectFloor={setSelectedFloor}
        onIsolateFloor={handleIsolateFloor}
        onResetView={handleResetView}
        showUnderground={showUnderground}
        onToggleUnderground={() => {
          setShowUnderground(!showUnderground);
          if (!showUnderground) handleCameraMode('underground');
        }}
        onSelectProperty={setSelectedProperty}
      />

      {/* ─── Property Details Drawer ─────────────────────── */}
      <PropertyDetailsDrawer
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onFlyTo={(p) => {
          setSelectedProperty(p);
          const fl = floors.find((f) => f.floor_number === p.floor_number);
          if (fl) setSelectedFloor(fl);
          showToast(`Camera focused on Unit ${p.unit_number}`);
        }}
        onView2D={(p) => navigate(`/2d-map?unit=${p.unit_number}`)}
        onShowToast={showToast}
      />

      {/* ─── Topology Conflict Modal ─────────────────────── */}
      <ConflictModal
        conflict={conflict}
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onIsolateConflict={handleIsolateConflict}
        onViewUnit503={() => handleViewUnit('U503')}
        onViewUnit504={() => handleViewUnit('U504')}
        isConflictIsolated={isConflictIsolated}
      />

      {/* ─── Toast Notification ──────────────────────────── */}
      {toastMessage && (
        <div className="toast-banner">
          <Sparkles size={15} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
