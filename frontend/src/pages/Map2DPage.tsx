import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Plus,
  Minus,
  RotateCcw,
  Landmark,
  Building2,
  Home,
  AlertTriangle,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';
import { DEMO_PARCELS, DEMO_BUILDINGS, DEMO_PROPERTIES, DEMO_CONFLICT } from '../data/mockData';

export const Map2DPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedParcel, setSelectedParcel] = useState(DEMO_PARCELS[0]);
  const [selectedUnit, setSelectedUnit] = useState(
    DEMO_PROPERTIES.find((p) => p.unit_number === 'U503') || DEMO_PROPERTIES[0]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleOpenIn3D = () => {
    if (selectedUnit) {
      navigate(`/3d-map?query=${selectedUnit.unit_number}`);
    } else {
      navigate('/3d-map');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 60px)', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* 2D Schematic Cadastre SVG Canvas (Prompt Section 17) */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 700"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '500px 350px',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Background Grid */}
          <defs>
            <pattern id="cadastreGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1000" height="700" fill="url(#cadastreGrid)" />

          {/* Road Network (Front Cadastral Boulevard) */}
          <rect x="50" y="550" width="900" height="70" fill="#334155" rx="4" />
          <text x="70" y="590" fill="#cbd5e1" fontSize="14" fontWeight="600" fontFamily="sans-serif">
            SHIVALIK MARG (12m WIDE CADASTRAL ACCESS CORRIDOR)
          </text>
          {/* Dashed Road Centerline */}
          <line x1="50" y1="585" x2="950" y2="585" stroke="#ffffff" strokeWidth="2" strokeDasharray="16, 12" />

          {/* Adjacent Parcel West: P-001244 */}
          <g
            onClick={(e) => {
              e.stopPropagation();
              setSelectedParcel(DEMO_PARCELS[1]);
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="100"
              y="150"
              width="240"
              height="350"
              fill={selectedParcel.parcel_number === 'P-001244' ? '#e0f2fe' : '#ffffff'}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6, 4"
              rx="4"
            />
            <text x="120" y="180" fill="#64748b" fontSize="13" fontWeight="700">
              PARCEL P-001244
            </text>
            <text x="120" y="200" fill="#94a3b8" fontSize="11">
              Area: 1,820 m² &bull; West Sector
            </text>

            {/* Building Footprint B06 */}
            <rect x="150" y="230" width="140" height="180" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" rx="3" />
            <text x="165" y="325" fill="#475569" fontSize="12" fontWeight="600">
              B06 Arcade (G+3)
            </text>
          </g>

          {/* Primary Demo Parcel: P-001245 (Selected Building B07 VERTI Tower) */}
          <g
            onClick={(e) => {
              e.stopPropagation();
              setSelectedParcel(DEMO_PARCELS[0]);
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="380"
              y="120"
              width="320"
              height="390"
              fill={selectedParcel.parcel_number === 'P-001245' ? '#f0fdf4' : '#ffffff'}
              stroke="#0284c7"
              strokeWidth="3"
              rx="4"
            />
            <text x="400" y="150" fill="#0284c7" fontSize="14" fontWeight="800">
              PRIMARY PARCEL P-001245 (HARIDWAR)
            </text>
            <text x="400" y="170" fill="#64748b" fontSize="11">
              Area: 2,450 m² &bull; Lat: 29.9457° N, Lon: 78.1642° E &bull; Validated
            </text>

            {/* Building Footprint: B07 VERTI Tower Demo (30m x 20m) */}
            <rect
              x="420"
              y="200"
              width="240"
              height="260"
              fill="#ffffff"
              stroke="#0369a1"
              strokeWidth="2"
              rx="4"
            />
            <text x="435" y="225" fill="#0f172a" fontSize="13" fontWeight="800">
              BUILDING B07 &bull; VERTI TOWER DEMO
            </text>
            <text x="435" y="242" fill="#64748b" fontSize="10">
              Dimensions: 30m × 20m &bull; Height: 24m &bull; G + 6 + 2B (24 Units)
            </text>

            {/* Property Unit Quadrants on Floor F05 */}
            {/* Unit 503 (Conflict) */}
            <rect
              x="435"
              y="260"
              width="100"
              height="90"
              fill={selectedUnit.unit_number === 'U503' ? '#fee2e2' : '#fef2f2'}
              stroke="#dc2626"
              strokeWidth={selectedUnit.unit_number === 'U503' ? 3 : 2}
              rx="3"
              onClick={(e) => {
                e.stopPropagation();
                const u = DEMO_PROPERTIES.find((p) => p.unit_number === 'U503');
                if (u) setSelectedUnit(u);
              }}
            />
            <text x="445" y="295" fill="#dc2626" fontSize="12" fontWeight="700">
              Unit 503 ⚠
            </text>
            <text x="445" y="315" fill="#991b1b" fontSize="9">
              Z: 15–18m (125m²)
            </text>

            {/* Unit 504 (Overlapping conflict partner) */}
            <rect
              x="545"
              y="260"
              width="100"
              height="90"
              fill={selectedUnit.unit_number === 'U504' ? '#fee2e2' : '#fef2f2'}
              stroke="#dc2626"
              strokeWidth={selectedUnit.unit_number === 'U504' ? 3 : 2}
              rx="3"
              onClick={(e) => {
                e.stopPropagation();
                const u = DEMO_PROPERTIES.find((p) => p.unit_number === 'U504');
                if (u) setSelectedUnit(u);
              }}
            />
            <text x="555" y="295" fill="#dc2626" fontSize="12" fontWeight="700">
              Unit 504 ⚠
            </text>
            <text x="555" y="315" fill="#991b1b" fontSize="9">
              Z: 17–20m (Overlap)
            </text>

            {/* Unit 501 */}
            <rect
              x="435"
              y="360"
              width="100"
              height="85"
              fill={selectedUnit.unit_number === 'U501' ? '#e0f2fe' : '#f8fafc'}
              stroke="#0284c7"
              strokeWidth={selectedUnit.unit_number === 'U501' ? 2.5 : 1}
              rx="3"
              onClick={(e) => {
                e.stopPropagation();
                const u = DEMO_PROPERTIES.find((p) => p.unit_number === 'U501');
                if (u) setSelectedUnit(u);
              }}
            />
            <text x="445" y="395" fill="#0f172a" fontSize="11" fontWeight="600">
              Unit 501
            </text>
            <text x="445" y="415" fill="#64748b" fontSize="9">
              Z: 15–18m (Valid)
            </text>

            {/* Unit 502 */}
            <rect
              x="545"
              y="360"
              width="100"
              height="85"
              fill={selectedUnit.unit_number === 'U502' ? '#e0f2fe' : '#f8fafc'}
              stroke="#0284c7"
              strokeWidth={selectedUnit.unit_number === 'U502' ? 2.5 : 1}
              rx="3"
              onClick={(e) => {
                e.stopPropagation();
                const u = DEMO_PROPERTIES.find((p) => p.unit_number === 'U502');
                if (u) setSelectedUnit(u);
              }}
            />
            <text x="555" y="395" fill="#0f172a" fontSize="11" fontWeight="600">
              Unit 502
            </text>
            <text x="555" y="415" fill="#64748b" fontSize="9">
              Z: 15–18m (Valid)
            </text>
          </g>

          {/* Adjacent Parcel East: P-001246 */}
          <g
            onClick={(e) => {
              e.stopPropagation();
              setSelectedParcel(DEMO_PARCELS[2]);
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="740"
              y="150"
              width="220"
              height="350"
              fill={selectedParcel.parcel_number === 'P-001246' ? '#e0f2fe' : '#ffffff'}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6, 4"
              rx="4"
            />
            <text x="760" y="180" fill="#64748b" fontSize="13" fontWeight="700">
              PARCEL P-001246
            </text>
            <text x="760" y="200" fill="#94a3b8" fontSize="11">
              Area: 3,100 m² &bull; East Sector
            </text>
          </g>
        </svg>
      </div>

      {/* Floating 2D Controls Top-Left */}
      <div className="map-controls-corner">
        <button onClick={handleZoomIn} className="map-control-btn" title="Zoom In">
          <Plus size={18} />
        </button>
        <button onClick={handleZoomOut} className="map-control-btn" title="Zoom Out">
          <Minus size={18} />
        </button>
        <button onClick={handleReset} className="map-control-btn" title="Reset Pan/Zoom">
          <RotateCcw size={18} />
        </button>
        <button onClick={handleOpenIn3D} className="map-control-btn" style={{ backgroundColor: '#0284c7', color: '#fff' }} title="Open in 3D">
          <Box size={18} />
        </button>
      </div>

      {/* Top Banner Notice */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '70px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.45rem 0.85rem',
          boxShadow: 'var(--shadow-sm)',
          fontSize: '0.8rem',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Info size={16} color="#0284c7" />
        <span>
          2D Cadastral Footprint Viewer. Select a property unit or parcel, then click <strong>[Open in 3D]</strong> to inspect its vertical strata.
        </span>
      </div>

      {/* Selected Entity Details Panel on Right */}
      <div
        className="map-floating-panel"
        style={{
          top: '1rem',
          right: '1rem',
          width: '320px',
          padding: '1.25rem',
          zIndex: 25,
        }}
      >
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.2rem' }}>
          2D CADASTRAL SELECTION
        </div>
        <h2 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '0.5rem' }}>
          {selectedUnit ? `Unit ${selectedUnit.unit_number}` : selectedParcel.parcel_number}
        </h2>

        {selectedUnit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>ULPIN: </span>
              <strong className="mono-code" style={{ color: '#0f172a' }}>{selectedUnit.ulpin}</strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Building: </span>
              <strong>{selectedUnit.building_code} ({selectedUnit.building_name})</strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Floor Level: </span>
              <strong>{selectedUnit.floor_label} (Z: {selectedUnit.z_min}m to {selectedUnit.z_max}m)</strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Area / Volume: </span>
              <strong>{selectedUnit.area} m² / {selectedUnit.volume} m³</strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Status: </span>
              <span className={`badge ${selectedUnit.status === 'CONFLICT_FLAGGED' ? 'badge-conflict' : 'badge-valid'}`}>
                {selectedUnit.status === 'CONFLICT_FLAGGED' ? 'Vertical Overlap Detected' : 'Validated'}
              </span>
            </div>
          </div>
        )}

        {/* Action Button: [Open in 3D] (Section 17) */}
        <button
          onClick={handleOpenIn3D}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.65rem' }}
        >
          <Box size={16} />
          <span>Open in 3D Map</span>
        </button>
      </div>
    </div>
  );
};
