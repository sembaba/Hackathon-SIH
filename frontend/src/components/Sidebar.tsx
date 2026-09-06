import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Map as MapIcon,
  Landmark,
  Building2,
  Home,
  CheckCircle2,
  Layers,
  UploadCloud,
  AlertTriangle,
  Satellite,
  X
} from 'lucide-react';

interface SidebarProps {
  conflictCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ conflictCount, isOpen, onClose }) => {
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pipeline', label: '3D Ingestion Pipeline', icon: Satellite, badge: 'New' },
    { to: '/3d-map', label: '3D Cadastral Map', icon: Box, hero: true },
    { to: '/2d-map', label: '2D Map', icon: MapIcon },
    { to: '/parcels', label: 'Parcels', icon: Landmark },
    { to: '/buildings', label: 'Buildings', icon: Building2 },
    { to: '/properties', label: 'Properties', icon: Home },
    {
      to: '/validation',
      label: 'Validation',
      icon: CheckCircle2,
      badge: conflictCount > 0 ? conflictCount : 8,
    },
    { to: '/gis-layers', label: 'GIS Layers', icon: Layers },
    { to: '/surveys', label: 'Surveys', icon: UploadCloud },
  ];

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            VC
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              VERTI-CAD
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              3D ULPIN &bull; Cadastre
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
            >
              <div className="sidebar-link-content">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="badge-counter">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Disclaimer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.2rem' }}>
          <AlertTriangle size={12} />
          <span>SIH PROTOTYPE DEMO</span>
        </div>
        <div>
          Vertical Cadastre &amp; 3D ULPIN Innovation Model. Synthetic Demonstration Data.
        </div>
      </div>
    </aside>
  );
};
