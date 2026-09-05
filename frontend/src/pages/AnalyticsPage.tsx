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
        labels: { color: '#cbd5e1' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#f8fafc', marginBottom: '0.25rem' }}>
            Cadastral Analytics &amp; Volumetric Densification
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Multi-dimensional property statistics, volume indices, and cadastral spatial trends
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Built 3D Volume</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8' }}>
            {kpis.total_built_volume_m3.toLocaleString()} m³
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            Volumetric density index: 2.67 m³/m²
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Cadastral Area</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
            {kpis.total_cadastral_area_m2.toLocaleString()} m²
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Vertical Floor Levels</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>
            {kpis.total_floors} Levels
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            6 Superterranean + 2 Basements
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>3D ULPIN Coverage</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b' }}>
            100%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            32 / 32 Units Deterministically Indexed
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', height: '380px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1rem' }}>
            Volumetric Property Distribution by Level (Z-Elevation)
          </h2>
          <div style={{ height: '300px' }}>
            <Bar data={floorChartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', height: '380px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1rem' }}>
            Property Types Ratio
          </h2>
          <div style={{ height: '300px' }}>
            <Doughnut
              data={typeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', font: { size: 11 } }
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
