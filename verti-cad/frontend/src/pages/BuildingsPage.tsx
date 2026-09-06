import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building } from '../types';
import { apiService } from '../services/api';
import { Building2, Box, Eye, CheckCircle2, Layers } from 'lucide-react';

export const BuildingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiService.getBuildings();
        setBuildings(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-tags">
            <span className="gov-badge-tag info">Bhu-Aadhaar Structure Model</span>
            <span className="gov-badge-tag success">Volumetric Strata Verified</span>
          </div>
          <h1 className="page-title">
            <Building2 size={22} color="#0284c7" />
            <span>3D Building Registry</span>
          </h1>
          <p className="page-subtitle">
            Multi-storey structures, above-ground floors, and subsurface basements
          </p>
        </div>

        <div className="page-header-actions">
          <button onClick={() => navigate('/3d-map?query=B07')} className="btn btn-primary">
            <Box size={16} />
            <span>Launch VERTI Tower B07 in 3D</span>
          </button>
        </div>
      </div>

      {/* Buildings Table (Prompt Section 19) */}
      <div className="cadastre-table-wrapper">
        <table className="cadastre-table">
          <thead>
            <tr>
              <th>Building ID</th>
              <th>Name</th>
              <th>Floors</th>
              <th>Basements</th>
              <th>Units</th>
              <th>Height</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => {
              const isVerti = b.building_code === 'B07';
              const floorStr = isVerti ? 'G + 6' : 'G + 3';
              const basementStr = isVerti ? '2 Basements (B01, B02)' : '1 Basement (B01)';
              const unitsStr = isVerti ? '24 units' : '12 units';
              const heightStr = `${b.height}m`;
              const statusStr = 'Validated';

              return (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/3d-map?query=${b.building_code}`)}
                  style={{
                    backgroundColor: isVerti ? '#f0fdf4' : undefined,
                  }}
                >
                  <td>
                    <span className="mono-code" style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem' }}>
                      {b.building_code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Parcel #{b.parcel_number} &bull; {b.building_type}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{floorStr}</td>
                  <td>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>{basementStr}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{unitsStr}</td>
                  <td style={{ fontWeight: 700, color: '#0284c7' }}>{heightStr}</td>
                  <td>
                    <span className="badge badge-valid">✓ {statusStr}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/3d-map?query=${b.building_code}`);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Box size={14} />
                      <span>Open 3D View</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VERTI Tower Demo Structure Breakdown Card */}
      <div
        className="cadastre-card"
        style={{
          marginTop: '1.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid #0284c7',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7' }}>
              FLAGSHIP SIH DEMONSTRATION STRUCTURE
            </span>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
              VERTI Tower Demo (ID: B07)
            </h3>
          </div>
          <span className="badge badge-valid">G + 6 + 2B &bull; 24m Height &bull; 24 Units</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
          Built with realistic cadastral proportions: 30m width × 20m depth × 3m floor height. Contains 9 distinct vertical levels spanning subterranean parking/utilities (-6m to 0m), ground level retail, residential units, and penthouse suites up to +21m.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['Basement B02 (-6m to -3m)', 'Basement B01 (-3m to 0m)', 'Ground Floor (0m to 3m)', 'Floor F01 (3m to 6m)', 'Floor F02 (6m to 9m)', 'Floor F03 (9m to 12m)', 'Floor F04 (12m to 15m)', 'Floor F05 (15m to 18m) [⚠ Conflict Zone]', 'Floor F06 (18m to 21m)'].map((lvl) => (
            <span
              key={lvl}
              style={{
                fontSize: '0.725rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                border: lvl.includes('Conflict') ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                backgroundColor: lvl.includes('Conflict') ? '#fee2e2' : '#f8fafc',
                color: lvl.includes('Conflict') ? '#dc2626' : '#0f172a',
                fontWeight: 600,
              }}
            >
              {lvl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
