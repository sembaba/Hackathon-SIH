import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Parcel } from '../types';
import { apiService } from '../services/api';
import { Landmark, Box, MapPin, Eye, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';

export const ParcelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiService.getParcels();
        setParcels(data);
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
            <span className="gov-badge-tag info">Land Revenue Department</span>
            <span className="gov-badge-tag success">WGS84 Georeferenced</span>
          </div>
          <h1 className="page-title">
            <Landmark size={22} color="#0284c7" />
            <span>Cadastral Land Parcels</span>
          </h1>
          <p className="page-subtitle">
            Authoritative 2D base parcels and vertical air-rights demarcation boundaries
          </p>
        </div>

        <div className="page-header-actions">
          <button onClick={() => navigate('/3d-map')} className="btn btn-primary">
            <Box size={16} />
            <span>Open 3D Cadastre</span>
          </button>
        </div>
      </div>

      {/* Clean Table (Prompt Section 18) */}
      <div className="cadastre-table-wrapper">
        <table className="cadastre-table">
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Location</th>
              <th>Area</th>
              <th>Building Count</th>
              <th>Property Units</th>
              <th>Status</th>
              <th>3D Mapping</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((p) => {
              const unitCount = p.parcel_number === 'P-001245' ? 24 : (p.parcel_number === 'P-001244' ? 8 : 16);
              const status = p.parcel_number === 'P-001245' ? 'Validated' : 'Provisional';
              const mappingStatus = 'Available';

              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedParcel(p)}
                  style={{
                    backgroundColor: selectedParcel?.id === p.id ? '#f0fdf4' : undefined,
                  }}
                >
                  <td>
                    <span className="mono-code" style={{ fontWeight: 700, color: '#0284c7' }}>
                      {p.parcel_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.village}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {p.tehsil}, {p.district} ({p.state_code})
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.area.toLocaleString()} m²</td>
                  <td>{p.building_count || 1}</td>
                  <td style={{ fontWeight: 600 }}>{unitCount} units</td>
                  <td>
                    <span className={`badge ${status === 'Validated' ? 'badge-valid' : 'badge-warning'}`}>
                      {status === 'Validated' ? '✓ Validated' : '⚠ Provisional'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info">{mappingStatus}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/3d-map?query=${p.parcel_number}`);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Box size={14} />
                      <span>View in 3D</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Parcel Details Drawer Modal */}
      {selectedParcel && (
        <div
          className="cadastre-card"
          style={{
            marginTop: '1.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #0284c7',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={20} color="#0284c7" />
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                Parcel Details: {selectedParcel.parcel_number}
              </h3>
            </div>
            <button
              onClick={() => setSelectedParcel(null)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cadastral Boundary Area</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{selectedParcel.area} m²</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ground Elevation (MSL Datum)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{selectedParcel.ground_elevation} m</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>WGS84 Centroid</div>
              <div className="mono-code" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0284c7' }}>
                {selectedParcel.centroid ? `${selectedParcel.centroid[1].toFixed(4)}°N, ${selectedParcel.centroid[0].toFixed(4)}°E` : '29.9457°N, 78.1642°E'}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Primary 3D Structure</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>VERTI Tower B07</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate(`/3d-map?query=${selectedParcel.parcel_number}`)}
              className="btn btn-primary"
            >
              <Box size={16} />
              <span>Explore Parcel in 3D Cadastre</span>
            </button>
            <button
              onClick={() => navigate('/2d-map')}
              className="btn btn-secondary"
            >
              <Eye size={16} />
              <span>View in 2D Cadastral Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
