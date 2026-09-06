import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Landmark,
  Building2,
  Home,
  Box,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { AnalyticsData, ValidationIssue, TopologyConflict } from '../types';
import { apiService } from '../services/api';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [conflicts, setConflicts] = useState<TopologyConflict[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [aData, cData] = await Promise.all([
          apiService.getAnalytics(),
          apiService.getConflicts(),
        ]);
        setAnalytics(aData);
        setConflicts(cData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Exact KPIs specified in Prompt Section 7
  const kpis = {
    total_parcels: 1248,
    buildings: 326,
    property_units: 4872,
    ulpins_3d: 4651,
    validation_issues: 27,
    topology_conflicts: 8
  };

  // Property Distribution specified in Prompt Section 7:
  // Ground, Residential floors, Commercial floors, Basement
  const distribution = [
    { label: 'Residential Floors', count: 3248, percent: 66.7, color: '#0284c7' },
    { label: 'Commercial Floors', count: 896, percent: 18.4, color: '#10b981' },
    { label: 'Ground Floor Units', count: 384, percent: 7.9, color: '#f59e0b' },
    { label: 'Basement / Subsurface Units', count: 344, percent: 7.0, color: '#64748b' },
  ];

  // Recent Activity specified in Prompt Section 7:
  // ULPIN generated, Property validated, Survey imported, Topology conflict detected
  const recentActivities = [
    {
      id: 1,
      type: 'CONFLICT_DETECTED',
      title: 'Topology conflict detected',
      desc: 'Vertical spatial overlap (1.0m) identified between Unit 503 and Unit 504 in Building B07 (Floor F05).',
      time: '12 minutes ago',
      icon: AlertTriangle,
      color: '#dc2626',
      link: '/3d-map?query=U503',
      actionText: 'Isolate in 3D'
    },
    {
      id: 2,
      type: 'ULPIN_GENERATED',
      title: '3D ULPIN generated',
      desc: 'Assigned prototype identifier IN-UT-HW-001245-B07-F06-U601 for Penthouse Unit 601.',
      time: '45 minutes ago',
      icon: Box,
      color: '#0284c7',
      link: '/properties',
      actionText: 'View Property'
    },
    {
      id: 3,
      type: 'SURVEY_IMPORTED',
      title: 'Survey dataset imported',
      desc: 'Total Station & LiDAR point dataset SRV-2026-001 ingested for Parcel P-001245.',
      time: '2 hours ago',
      icon: Layers,
      color: '#10b981',
      link: '/surveys',
      actionText: 'Inspect Survey'
    },
    {
      id: 4,
      type: 'PROPERTY_VALIDATED',
      title: 'Property volume validated',
      desc: 'Unit 201 (Floor F02) geometry and hierarchy verified against state cadastral schema.',
      time: '3 hours ago',
      icon: CheckCircle2,
      color: '#16a34a',
      link: '/validation',
      actionText: 'View Validation'
    }
  ];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-tags">
            <span className="gov-badge-tag info">Bhu-Aadhaar 3D Pilot</span>
            <span className="gov-badge-tag success">OGC 3D Cadastre Standard</span>
          </div>
          <h1 className="page-title">
            Cadastral Overview Dashboard
          </h1>
          <p className="page-subtitle">
            Haridwar Municipal Division &bull; Tehsil Roorkee &bull; Demo Zone A &bull; State Cadastre Prototype
          </p>
        </div>

        <div className="page-header-actions">
          <Link to="/3d-map" className="btn btn-primary">
            <Box size={16} />
            <span>Launch 3D Cadastral Map</span>
          </Link>
          <Link to="/validation" className="btn btn-secondary">
            <AlertTriangle size={16} color="#dc2626" />
            <span>Review Active Conflicts ({kpis.topology_conflicts})</span>
          </Link>
        </div>
      </div>

      {/* 6 Top Cards (Prompt Section 7) */}
      <div className="stats-grid">
        {/* Total Parcels */}
        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>Total Parcels</span>
            <Landmark size={18} color="#0284c7" />
          </div>
          <div className="stat-kpi-value">{kpis.total_parcels.toLocaleString()}</div>
          <div className="stat-kpi-footer">
            <TrendingUp size={13} color="#16a34a" />
            <span>100% Georeferenced</span>
          </div>
        </div>

        {/* Buildings */}
        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>Buildings</span>
            <Building2 size={18} color="#0284c7" />
          </div>
          <div className="stat-kpi-value">{kpis.buildings.toLocaleString()}</div>
          <div className="stat-kpi-footer">
            <span style={{ color: '#0284c7', fontWeight: 600 }}>VERTI Tower B07 Demo</span>
          </div>
        </div>

        {/* Property Units */}
        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>Property Units</span>
            <Home size={18} color="#0284c7" />
          </div>
          <div className="stat-kpi-value">{kpis.property_units.toLocaleString()}</div>
          <div className="stat-kpi-footer">
            <span>Multi-level &amp; subterranean</span>
          </div>
        </div>

        {/* 3D ULPINs */}
        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>3D ULPINs</span>
            <Box size={18} color="#10b981" />
          </div>
          <div className="stat-kpi-value">{kpis.ulpins_3d.toLocaleString()}</div>
          <div className="stat-kpi-footer">
            <span style={{ color: '#16a34a', fontWeight: 600 }}>95.5% Assigned</span>
          </div>
        </div>

        {/* Validation Issues */}
        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>Validation Issues</span>
            <AlertTriangle size={18} color="#d97706" />
          </div>
          <div className="stat-kpi-value" style={{ color: '#d97706' }}>
            {kpis.validation_issues}
          </div>
          <div className="stat-kpi-footer">
            <span>Elevation &amp; datum offsets</span>
          </div>
        </div>

        {/* Topology Conflicts */}
        <div className="stat-kpi-card" style={{ borderColor: '#fca5a5', backgroundColor: '#fff' }}>
          <div className="stat-kpi-header">
            <span style={{ color: '#dc2626' }}>Topology Conflicts</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div className="stat-kpi-value" style={{ color: '#dc2626' }}>
            {kpis.topology_conflicts}
          </div>
          <div className="stat-kpi-footer">
            <span style={{ color: '#dc2626', fontWeight: 600 }}>Active Vertical Overlaps</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content: Property Distribution & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Property Distribution (Section 7) */}
        <div className="cadastre-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: '#0f172a' }}>Property Distribution</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Breakdown by vertical structural zone</p>
            </div>
            <span className="badge badge-info">{kpis.property_units} Total Units</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {distribution.map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
                  <span style={{ color: '#64748b' }}>
                    <strong>{item.count.toLocaleString()}</strong> units ({item.percent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '0.775rem',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Need to inspect a specific vertical stratum?</span>
            <Link to="/3d-map" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
              Explore Floors &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Activity (Section 7) */}
        <div className="cadastre-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: '#0f172a' }}>Recent Activity</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Audit log of cadastral operations</p>
            </div>
            <Clock size={16} color="#64748b" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: `${act.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Icon size={16} color={act.color} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {act.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{act.time}</span>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: '#475569', marginTop: '0.2rem', lineHeight: '1.4' }}>
                      {act.desc}
                    </p>
                    <div style={{ marginTop: '0.4rem' }}>
                      <Link
                        to={act.link}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: act.color,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <span>{act.actionText}</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hero Showcase Callout */}
      <div
        className="cadastre-card"
        style={{
          background: 'linear-gradient(90deg, #f0fdf4 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-valid">Smart India Hackathon Feature Ready</span>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>VERTI Tower Demo (B07)</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
            Vertical Spatial Conflict Detected: Unit 503 &harr; Unit 504
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '640px' }}>
            Experience the full 3D cadastral demonstration: inspect Floor F05, isolate the 1-meter vertical overlap (17m–18m), copy prototype 3D ULPINs, and run live topology validation.
          </p>
        </div>

        <button
          onClick={() => navigate('/3d-map?query=U503')}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <Box size={18} />
          <span>Launch 3D Demo Scenario</span>
        </button>
      </div>
    </div>
  );
};
