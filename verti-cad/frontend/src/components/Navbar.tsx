import React, { useState } from 'react';
import { Search, Shield, User, Globe, AlertTriangle, Menu, X, Check } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onSearch: (query: string) => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  apiOnline: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  activeRole,
  onRoleChange,
  apiOnline,
  onToggleSidebar
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: { key: UserRole; label: string }[] = [
    { key: 'CITIZEN', label: 'Citizen (Public Registry)' },
    { key: 'SURVEYOR', label: 'Cadastral Surveyor' },
    { key: 'LAND_ADMIN', label: 'Land Revenue Officer' },
    { key: 'GIS_ADMIN', label: 'GIS Administrator' },
    { key: 'SYS_ADMIN', label: 'System Administrator' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleQuickSearch = (term: string) => {
    setSearchInput(term);
    onSearch(term);
  };

  return (
    <header className="navbar-container">
      {/* Left: Mobile Toggle & Brand Context */}
      <div className="navbar-left">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: '#0f172a',
            }}
            title="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              VERTI-CAD
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#0284c7',
                backgroundColor: '#e0f2fe',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
              }}
            >
              PROTOTYPE
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            3D ULPIN &bull; Haridwar Demonstration Cadastre
          </div>
        </div>
      </div>

      {/* Center: Global Cadastral Search Field (Section 13) */}
      <div className="navbar-center">
        <form onSubmit={handleSearchSubmit} className="search-input-group">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by ULPIN, Parcel (P-001245), Building (B07), or Unit (U503)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Quick Demo Search Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.7rem', color: '#64748b' }}>
          <span>Demo Queries:</span>
          {['U503', 'U504', 'B07', 'P-001245'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleQuickSearch(chip)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '0.1rem 0.35rem',
                fontSize: '0.68rem',
                color: chip.includes('50') ? '#dc2626' : '#0284c7',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Status and Role Control */}
      <div className="navbar-right">
        {/* Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            color: '#166534',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '0.3rem 0.6rem',
            borderRadius: '9999px',
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
            }}
          />
          <span>GIS Cadastre Online</span>
        </div>

        {/* User Role Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '9999px', padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
          >
            <Shield size={13} color="#0284c7" />
            <span>Role: {activeRole}</span>
          </button>

          {showRoleMenu && (
            <>
              {/* Invisible Click Catcher to close menu when clicking outside */}
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 999,
                }}
                onClick={() => setShowRoleMenu(false)}
              />

              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '240px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  padding: '0.5rem',
                  zIndex: 1000,
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', padding: '0.35rem 0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.35rem' }}>
                  SWITCH SIMULATED ROLE
                </div>
                {roles.map((r) => (
                  <div
                    key={r.key}
                    onClick={() => {
                      onRoleChange(r.key);
                      setShowRoleMenu(false);
                    }}
                    style={{
                      padding: '0.5rem 0.65rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      backgroundColor: activeRole === r.key ? '#e0f2fe' : 'transparent',
                      color: activeRole === r.key ? '#0369a1' : '#0f172a',
                      fontWeight: activeRole === r.key ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (activeRole !== r.key) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (activeRole !== r.key) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{r.label}</span>
                    {activeRole === r.key && <Check size={14} color="#0284c7" />}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
