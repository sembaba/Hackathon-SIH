import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyUnit, Floor } from '../types';
import { apiService } from '../services/api';
import { Home, Box, Search, AlertTriangle, CheckCircle2, Filter, Copy, Check } from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedUlpin, setCopiedUlpin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [props, fls] = await Promise.all([
          apiService.getProperties(),
          apiService.getFloors(),
        ]);
        setProperties(props);
        setFloors(fls);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = (e: React.MouseEvent, ulpin: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ulpin);
    setCopiedUlpin(ulpin);
    setTimeout(() => setCopiedUlpin(null), 2000);
  };

  const filteredProperties = properties.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.unit_number.toLowerCase().includes(term) ||
      (p.ulpin && p.ulpin.toLowerCase().includes(term)) ||
      p.parcel_number.toLowerCase().includes(term) ||
      p.building_code.toLowerCase().includes(term) ||
      p.floor_label.toLowerCase().includes(term);

    const matchesFloor = floorFilter === 'ALL' || p.floor_number.toString() === floorFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CONFLICT' && p.status === 'CONFLICT_FLAGGED') ||
      (statusFilter === 'VALIDATED' && p.status !== 'CONFLICT_FLAGGED');

    return matchesSearch && matchesFloor && matchesStatus;
  });

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.2rem' }}>
            Vertical Property Unit Registry
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Volumetrically mapped units with prototype 3D ULPIN identifiers and elevation bounds
          </p>
        </div>

        <button onClick={() => navigate('/3d-map')} className="btn btn-primary">
          <Box size={16} />
          <span>Explore All Units in 3D</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search Unit, ULPIN, Floor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Floor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={15} color="#64748b" />
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              color: '#0f172a',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.825rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Floors ({properties.length} Units)</option>
            {floors.map((f) => (
              <option key={f.id} value={f.floor_number.toString()}>
                {f.level_code} ({f.floor_label})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            color: '#0f172a',
            padding: '0.45rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.825rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="VALIDATED">Validated Units Only</option>
          <option value="CONFLICT">Conflicts Only (⚠ 2)</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{filteredProperties.length}</strong> matching records
        </div>
      </div>

      {/* Exact Table (Prompt Section 20) */}
      <div className="cadastre-table-wrapper">
        <table className="cadastre-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Prototype 3D ULPIN</th>
              <th>Parcel</th>
              <th>Building</th>
              <th>Floor</th>
              <th>Area</th>
              <th>Z-Min</th>
              <th>Z-Max</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((p) => {
              const isConflict = p.status === 'CONFLICT_FLAGGED';

              return (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/3d-map?query=${p.unit_number}`)}
                  style={{
                    backgroundColor: isConflict ? '#fef2f2' : undefined,
                  }}
                >
                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        color: isConflict ? '#dc2626' : '#0284c7',
                        fontSize: '0.9rem',
                      }}
                    >
                      {p.unit_number} {isConflict && '⚠'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="mono-code" style={{ fontSize: '0.78rem', color: isConflict ? '#991b1b' : '#0f172a', fontWeight: 600 }}>
                        {p.ulpin}
                      </span>
                      <button
                        onClick={(e) => handleCopy(e, p.ulpin || '')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="Copy ULPIN"
                      >
                        {copiedUlpin === p.ulpin ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td className="mono-code" style={{ fontWeight: 600, color: '#475569' }}>
                    {p.parcel_number}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.building_code}</span>
                  </td>
                  <td>
                    <span className="badge badge-info">{p.floor_label}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.area} m²</td>
                  <td style={{ fontWeight: 600, color: isConflict ? '#dc2626' : '#0f172a' }}>
                    {p.z_min} m
                  </td>
                  <td style={{ fontWeight: 600, color: isConflict ? '#dc2626' : '#0f172a' }}>
                    {p.z_max} m
                  </td>
                  <td>
                    <span className={`badge ${isConflict ? 'badge-conflict' : 'badge-valid'}`}>
                      {isConflict ? '⚠ Conflict' : '✓ Validated'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/3d-map?query=${p.unit_number}`);
                      }}
                      className={`btn btn-sm ${isConflict ? 'btn-danger' : 'btn-primary'}`}
                    >
                      <Box size={13} />
                      <span>Open in 3D</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
