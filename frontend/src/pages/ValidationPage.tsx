import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCw,
  Box,
  Layers,
  Sparkles,
  ShieldCheck,
  Info
} from 'lucide-react';

interface ValidationItem {
  id: string;
  name: string;
  description: string;
  category: 'GEOMETRY' | 'ULPIN' | 'TOPOLOGY';
  status: 'VALID' | 'WARNING' | 'CONFLICT';
  details: string;
}

export const ValidationPage: React.FC = () => {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<string>('Just now');
  const [toast, setToast] = useState<string | null>(null);

  // Initial validation records matching Prompt Section 15
  const [items, setItems] = useState<ValidationItem[]>([
    // Geometry Validation
    {
      id: 'GEO-01',
      name: 'Parcel Geometry',
      description: 'WGS84 planar closure, vertex ordering, and 2D area consistency',
      category: 'GEOMETRY',
      status: 'VALID',
      details: 'All 1,248 parcel polygons closed with valid planar topology (0 self-intersections).'
    },
    {
      id: 'GEO-02',
      name: 'Building Geometry',
      description: 'Footprint enclosure, setbacks, and ground boundary alignment',
      category: 'GEOMETRY',
      status: 'VALID',
      details: 'Building B07 footprint aligns within Parcel P-001245 boundary with compliant 6m setbacks.'
    },
    {
      id: 'GEO-03',
      name: 'Floor Geometry',
      description: 'Slab thickness, vertical stacking, and inter-floor elevation offsets',
      category: 'GEOMETRY',
      status: 'VALID',
      details: '9 floors (B02 through F06) validated with continuous 3.0m structural intervals.'
    },
    {
      id: 'GEO-04',
      name: 'Property Volume',
      description: 'Extruded polyhedral 3D watertight volumetric closure',
      category: 'GEOMETRY',
      status: 'WARNING',
      details: 'Basement B02 parking stall boundary contains 1 non-manifold polygon vertex.'
    },

    // ULPIN Validation
    {
      id: 'ULP-01',
      name: 'Unique ULPIN',
      description: 'Uniqueness check across national, state, and district registers',
      category: 'ULPIN',
      status: 'VALID',
      details: '4,651 assigned 3D ULPINs are 100% distinct with zero duplicate identifiers.'
    },
    {
      id: 'ULP-02',
      name: 'Correct Hierarchy',
      description: 'Country -> State -> District -> Parcel -> Building -> Floor -> Unit hierarchy structure',
      category: 'ULPIN',
      status: 'VALID',
      details: 'IN-UT-HW hierarchical syntax conforms to standardized 3D cadastre specification.'
    },
    {
      id: 'ULP-03',
      name: 'Missing Attributes',
      description: 'Completeness of mandatory ownership, area, and Z-coordinates',
      category: 'ULPIN',
      status: 'WARNING',
      details: '4 units in Zone B pending updated land revenue registration stamps.'
    },

    // Topology Validation
    {
      id: 'TOP-01',
      name: 'Volumetric Overlap (Conflict)',
      description: 'Intersection testing between adjacent 3D spatial properties',
      category: 'TOPOLOGY',
      status: 'CONFLICT',
      details: 'Unit 503 (Z: 15–18m) and Unit 504 (Z: 17–20m) overlap vertically by 1.0 meter (17m–18m) in Building B07.'
    },
    {
      id: 'TOP-02',
      name: 'Cadastral Gap Detection',
      description: 'Unallocated spatial pockets between adjacent horizontal unit envelopes',
      category: 'TOPOLOGY',
      status: 'VALID',
      details: 'Interior party walls exhibit zero unmapped void gaps.'
    },
    {
      id: 'TOP-03',
      name: 'Duplicate Volume',
      description: 'Co-registered duplicate property volumes on identical elevation coordinates',
      category: 'TOPOLOGY',
      status: 'VALID',
      details: 'No 100% duplicate 3D bounding boxes detected across registry.'
    },
    {
      id: 'TOP-04',
      name: 'Invalid Vertical Relationship',
      description: 'Units registered above structural rooftop height or below basement foundation',
      category: 'TOPOLOGY',
      status: 'WARNING',
      details: 'Rooftop telecom unit U-ROOF elevation exceeds surveyed building cornice by +0.3m.'
    },
  ]);

  const handleRunValidation = () => {
    setRunning(true);
    setToast('Executing 3D geometric, ULPIN, and topology validation engines...');

    setTimeout(() => {
      setRunning(false);
      setLastRunTime('Just now');
      setToast('Validation completed: 1 critical vertical overlap identified in Floor F05.');
    }, 1200);
  };

  const renderStatusBadge = (status: 'VALID' | 'WARNING' | 'CONFLICT') => {
    switch (status) {
      case 'VALID':
        return <span className="badge badge-valid">✓ Valid</span>;
      case 'WARNING':
        return <span className="badge badge-warning">⚠ Warning</span>;
      case 'CONFLICT':
        return <span className="badge badge-conflict">✕ Conflict</span>;
    }
  };

  const renderSection = (category: 'GEOMETRY' | 'ULPIN' | 'TOPOLOGY', title: string, subtitle: string) => {
    const sectionItems = items.filter((i) => i.category === category);

    return (
      <div className="cadastre-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>{title}</h3>
          <p style={{ fontSize: '0.775rem', color: '#64748b' }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sectionItems.map((item) => {
            const isConflict = item.status === 'CONFLICT';
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '0.85rem',
                  backgroundColor: isConflict ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${isConflict ? '#fecaca' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isConflict ? '#991b1b' : '#0f172a' }}>
                      {item.name}
                    </span>
                    <span className="mono-code" style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      ({item.id})
                    </span>
                    {renderStatusBadge(item.status)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: isConflict ? '#7f1d1d' : '#334155', lineHeight: '1.4' }}>
                    {item.details}
                  </div>
                </div>

                {isConflict && (
                  <button
                    onClick={() => navigate('/3d-map?query=U503')}
                    className="btn btn-danger btn-sm"
                    style={{ alignSelf: 'center' }}
                  >
                    <Box size={14} />
                    <span>Isolate Conflict in 3D</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      {/* Header with Run Validation Button (Section 15) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.2rem' }}>
            Cadastral Quality &amp; Validation Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Automated spatial checking for geometry, unique ULPIN hierarchy, and 3D volumetric topology
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Run: {lastRunTime}</span>
          <button
            onClick={handleRunValidation}
            disabled={running}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            {running ? <RotateCw size={16} className="animate-spin" /> : <Play size={16} />}
            <span>{running ? 'Running Validation...' : 'Run Validation'}</span>
          </button>
        </div>
      </div>

      {/* Toast feedback */}
      {toast && (
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: '#e0f2fe',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            borderRadius: '6px',
            fontSize: '0.825rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#0284c7" />
          <span>{toast}</span>
        </div>
      )}

      {/* 3 Main Sections Specified in Section 15 */}
      {/* 1. Geometry Validation */}
      {renderSection(
        'GEOMETRY',
        '1. Geometry Validation',
        'Verifies parcel boundaries, building envelopes, floor slabs, and property volume enclosures'
      )}

      {/* 2. ULPIN Validation */}
      {renderSection(
        'ULPIN',
        '2. 3D ULPIN Validation',
        'Validates uniqueness of 3D ULPIN codes, correct hierarchical syntax, and complete cadastral attributes'
      )}

      {/* 3. Topology Validation */}
      {renderSection(
        'TOPOLOGY',
        '3. Topology Validation',
        'Checks for volumetric overlaps, gaps, duplicate co-allocated volumes, and invalid vertical relationships'
      )}
    </div>
  );
};
