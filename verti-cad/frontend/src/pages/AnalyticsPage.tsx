import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AnalyticsData } from '../types';
import { apiService } from '../services/api';
import { BarChart3, TrendingUp, Box, Layers, Landmark } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiService.getAnalytics();
        setAnalytics(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpis = analytics?.kpis || {
    total_parcels: 1,
    total_buildings: 1,
    total_floors: 9,
    total_properties: 32,
    total_ulpins: 32,
    underground_assets: 4,
    validation_issues: 1,
    total_built_volume_m3: 9600.0,
    total_cadastral_area_m2: 3600.0,
  };

  // Chart 1: Properties per Floor
  const floorLabels = analytics?.charts.properties_by_floor.map((f) => f.level_code) || [
    'B02', 'B01', 'G00', 'F01', 'F02', 'F03', 'F04', 'F05', 'F06'
  ];
  const floorCounts = analytics?.charts.properties_by_floor.map((f) => f.unit_count) || [
    2, 2, 4, 4, 4, 4, 4, 4, 4
  ];

  const floorChartData = {
    labels: floorLabels,
    datasets: [
      {
        label: 'Property Units',
        data: floorCounts,
        backgroundColor: '#0284c7',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Chart 2: Properties by Type
  const typeData = {
    labels: ['Apartments', 'Commercial Shops', 'Offices', 'Underground Parking', 'Utility Plants'],
    datasets: [
      {
        data: [24, 2, 2, 2, 2],
        backgroundColor: ['#0284c7', '#f59e0b', '#10b981', '#64748b', '#ec4899'],
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#334155', font: { family: 'Inter', size: 12, weight: 'bold' as const } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#e0f2fe',
        borderColor: '#38bdf8',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { color: '#f1f5f9' }
      },
      y: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { color: '#f1f5f9' }
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-tags">
            <span className="gov-badge-tag info">Bhu-Aadhaar Spatial Intelligence</span>
            <span className="gov-badge-tag success">Live PostGIS Feed</span>
          </div>
          <h1 className="page-title">
            Cadastral Analytics &amp; Volumetric Densification
          </h1>
          <p className="page-subtitle">
            Multi-dimensional property statistics, volume indices, and cadastral spatial trends
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>Total Built 3D Volume</span>
            <Box size={18} color="#0284c7" />
          </div>
          <div className="stat-kpi-value" style={{ color: '#0284c7' }}>
            {kpis.total_built_volume_m3.toLocaleString()} m³
          </div>
          <div className="stat-kpi-footer">
            <span>Volumetric density: <strong>2.67 m³/m²</strong></span>
          </div>
        </div>

        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>Total Cadastral Area</span>
            <Landmark size={18} color="#0284c7" />
          </div>
          <div className="stat-kpi-value">
            {kpis.total_cadastral_area_m2.toLocaleString()} m²
          </div>
          <div className="stat-kpi-footer">
            <TrendingUp size={13} color="#16a34a" />
            <span>100% Georeferenced</span>
          </div>
        </div>

        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>Vertical Floor Levels</span>
            <Layers size={18} color="#10b981" />
          </div>
          <div className="stat-kpi-value" style={{ color: '#10b981' }}>
            {kpis.total_floors} Levels
          </div>
          <div className="stat-kpi-footer">
            <span>6 Superterranean + 2 Basements</span>
          </div>
        </div>

        <div className="stat-kpi-card">
          <div className="stat-kpi-header">
            <span>3D ULPIN Coverage</span>
            <BarChart3 size={18} color="#f59e0b" />
          </div>
          <div className="stat-kpi-value" style={{ color: '#d97706' }}>
            100%
          </div>
          <div className="stat-kpi-footer">
            <span style={{ color: '#16a34a', fontWeight: 600 }}>32 / 32 Units Deterministically Indexed</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        <div className="cadastre-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title">Volumetric Property Distribution by Level (Z-Elevation)</h2>
              <p className="card-subtitle">Units distribution across vertical strata (B02 to F06)</p>
            </div>
            <span className="badge badge-info">Z-Axis Analysis</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Bar data={floorChartData} options={chartOptions} />
          </div>
        </div>

        <div className="cadastre-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title">Property Types Ratio</h2>
              <p className="card-subtitle">Volumetric zoning breakdown by property category</p>
            </div>
            <span className="badge badge-valid">Categorized</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Doughnut
              data={typeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#334155', font: { family: 'Inter', size: 11, weight: 'bold' as const } }
                  },
                  tooltip: {
                    backgroundColor: '#0f172a',
                    titleColor: '#ffffff',
                    bodyColor: '#e0f2fe',
                    borderColor: '#38bdf8',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 6,
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
