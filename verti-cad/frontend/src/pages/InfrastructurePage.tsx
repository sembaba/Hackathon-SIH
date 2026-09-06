import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InfrastructureAsset } from '../types';
import { apiService } from '../services/api';
import { Pipette, Box, Eye, Layers, ShieldCheck } from 'lucide-react';

export const InfrastructurePage: React.FC = () => {
  const navigate = useNavigate();
  const [infrastructure, setInfrastructure] = useState<InfrastructureAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiService.getInfrastructure();
        setInfrastructure(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-tags">
            <span className="gov-badge-tag info">Subsurface Cadastre Layer</span>
            <span className="gov-badge-tag success">Negative Elevation Verified</span>
          </div>
          <h1 className="page-title">
            <Pipette size={22} color="#0284c7" />
            <span>Subsurface Infrastructure &amp; Utility Assets</span>
          </h1>
          <p className="page-subtitle">
            Underground public utility conduits, pipelines, and rapid transit tunnels with negative elevation profiles
          </p>
        </div>

        <div className="page-header-actions">
          <button onClick={() => navigate('/3d-map')} className="btn btn-primary">
            <Box size={16} />
            <span>View Underground in 3D</span>
          </button>
        </div>
      </div>

      <div className="cadastre-table-wrapper">
        <table className="cadastre-table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Network Name</th>
              <th>Utility Type</th>
              <th>Subsurface Depth Range (MSL Rel)</th>
              <th>Conduit Diameter</th>
              <th>Cadastral Parcel</th>
              <th>Operational Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {infrastructure.map((asset) => {
              let badgeColor = '#06b6d4';
              if (asset.asset_type === 'SEWERAGE') badgeColor = '#10b981';
              if (asset.asset_type === 'ELECTRICITY') badgeColor = '#f59e0b';
              if (asset.asset_type === 'METRO_TUNNEL') badgeColor = '#a855f7';

              return (
                <tr key={asset.id}>
                  <td>
                    <span className="mono-code" style={{ color: badgeColor, fontWeight: 700 }}>
                      {asset.asset_id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{asset.name}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${badgeColor}22`,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}44`,
                      }}
                    >
                      {asset.asset_type}
                    </span>
                  </td>
                  <td>
                    <span className="mono-code" style={{ color: '#ec4899', fontWeight: 600 }}>
                      {asset.depth_min}m <span style={{ color: '#64748b' }}>to</span> {asset.depth_max}m
                    </span>
                  </td>
                  <td>{asset.diameter_m} m</td>
                  <td className="mono-code" style={{ color: '#94a3b8' }}>#{asset.parcel_number}</td>
                  <td>
                    <span className="badge badge-valid">{asset.status}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate('/3d-map')}
                      className="btn btn-primary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      <Box size={14} />
                      <span>View Underground</span>
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
