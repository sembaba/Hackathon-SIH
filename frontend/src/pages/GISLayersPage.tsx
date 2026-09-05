import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Eye, EyeOff, Box, Check, Sliders } from 'lucide-react';

interface LayerControlItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  opacity: number;
  color: string;
  description: string;
}

export const GISLayersPage: React.FC = () => {
  const navigate = useNavigate();

  // Layers specified in Prompt Section 16:
  // Cadastral Parcels, Buildings, Property Units, Roads, Survey Points, ULPIN Labels, Conflict Areas
  const [layers, setLayers] = useState<LayerControlItem[]>([
    {
      id: 'parcels',
      name: 'Cadastral Parcels',
      type: 'Boundary Polyline / Area',
      visible: true,
      opacity: 1.0,
      color: '#0284c7',
      description: 'Authoritative land parcel boundaries, survey vertices, and WGS84 coordinates'
    },
    {
      id: 'buildings',
      name: 'Buildings',
      type: '3D Extrusion',
      visible: true,
      opacity: 0.9,
      color: '#475569',
      description: 'Building footprints, perimeter walls, structural columns, and multi-storey floor slabs'
    },
    {
      id: 'properties',
      name: 'Property Units',
      type: '3D Volumetric Prisms',
      visible: true,
      opacity: 0.85,
      color: '#38bdf8',
      description: 'Individual vertical property units with Z-min and Z-max elevation extents'
    },
    {
      id: 'roads',
      name: 'Roads',
      type: 'Transportation Corridor',
      visible: true,
      opacity: 1.0,
      color: '#334155',
      description: 'Public rights-of-way, road access centerlines, and curb offsets'
    },
    {
      id: 'survey_points',
      name: 'Survey Points',
      type: 'Geodetic Markers',
      visible: true,
      opacity: 1.0,
      color: '#d97706',
      description: 'Total Station control points, GTS benchmarks, and ground control pins'
    },
    {
      id: 'ulpin_labels',
      name: 'ULPIN Labels',
      type: '3D Billboard Annotations',
      visible: true,
      opacity: 0.9,
      color: '#0f172a',
      description: 'Prototype 3D ULPIN callouts rendered at volumetric centroids'
    },
    {
      id: 'conflicts',
      name: 'Conflict Areas',
      type: 'Volumetric Overlap Zone',
      visible: true,
      opacity: 0.95,
      color: '#dc2626',
      description: 'Red volumetric overlap bounding boxes (e.g. Unit 503 ↔ Unit 504 1m vertical overlap)'
    },
  ]);

  const toggleLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const updateOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.2rem' }}>
            GIS Layer Control
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Manage spatial layer visibility, transparency, and rendering order across 2D &amp; 3D maps
          </p>
        </div>

        <button onClick={() => navigate('/3d-map')} className="btn btn-primary">
          <Box size={16} />
          <span>Preview Active Layers in 3D</span>
        </button>
      </div>

      {/* Layer Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="cadastre-card"
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: `5px solid ${layer.color}`,
              opacity: layer.visible ? 1 : 0.6,
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            {/* Left: Checkbox & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px' }}>
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => toggleLayer(layer.id)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#0284c7',
                  cursor: 'pointer',
                }}
              />

              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  {layer.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {layer.description}
                </div>
              </div>
            </div>

            {/* Middle: Opacity Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '220px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '50px' }}>Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={layer.opacity}
                disabled={!layer.visible}
                onChange={(e) => updateOpacity(layer.id, parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: layer.color, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600, minWidth: '35px' }}>
                {Math.round(layer.opacity * 100)}%
              </span>
            </div>

            {/* Right: Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  backgroundColor: layer.color,
                }}
              />
              <span className={`badge ${layer.visible ? 'badge-valid' : 'badge-warning'}`}>
                {layer.visible ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
