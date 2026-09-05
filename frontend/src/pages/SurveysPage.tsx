import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Sparkles, FileCode, Check, ShieldCheck, Box } from 'lucide-react';
import { SurveyRecord } from '../types';
import { apiService } from '../services/api';
import { DEMO_SURVEYS } from '../data/mockData';

export const SurveysPage: React.FC = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyRecord[]>(DEMO_SURVEYS);
  const [validatingSurveyId, setValidatingSurveyId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleValidateSurvey = (id: string) => {
    setValidatingSurveyId(id);
    setTimeout(() => {
      setSurveys((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'VERIFIED' } : s))
      );
      setValidatingSurveyId(null);
      showToast(`Survey ${id} successfully verified against GTS benchmark datum.`);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const newRecord: SurveyRecord = {
        id: (surveys.length + 1).toString(),
        surveyId: `SRV-2026-${(surveys.length + 1).toString().padStart(3, '0')}`,
        parcelId: 'P-001245',
        coordinates: '29.94572° N, 78.16422° E',
        elevation: 280.05,
        source: file.name.endsWith('.csv') ? 'Field Total Station (CSV)' : 'GNSS / GeoJSON Ingestion',
        surveyor: 'Authorized Surveyor S. Rawat',
        date: new Date().toISOString().split('T')[0],
        status: 'VERIFIED'
      };

      setSurveys((prev) => [newRecord, ...prev]);
      setUploadFeedback(`Successfully parsed "${file.name}" — 1 survey benchmark record added.`);
      showToast('Survey file ingested successfully.');
    };

    reader.readAsText(file);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.2rem' }}>
            Survey Data Ingestion
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Ingest, parse, and validate ground station benchmarks, Total Station coordinates, and RTK elevations
          </p>
        </div>

        {/* Upload Survey File Action (Prompt Section 21) */}
        <div>
          <label
            htmlFor="survey-upload-input"
            className="btn btn-primary"
            style={{ cursor: 'pointer' }}
          >
            <UploadCloud size={16} />
            <span>Upload Survey File (CSV / JSON)</span>
          </label>
          <input
            id="survey-upload-input"
            type="file"
            accept=".csv,.json,.geojson,.kml"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Upload Feedback Notice */}
      {uploadFeedback && (
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: '6px',
            fontSize: '0.825rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>{uploadFeedback}</span>
          </div>
          <button
            onClick={() => setUploadFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Demo Surveys Table (Prompt Section 21) */}
      <div className="cadastre-table-wrapper">
        <table className="cadastre-table">
          <thead>
            <tr>
              <th>Survey ID</th>
              <th>Parcel</th>
              <th>Coordinates</th>
              <th>Elevation (MSL)</th>
              <th>Source</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((s) => {
              const isFlagged = s.status === 'FLAGGED';
              const isVerified = s.status === 'VERIFIED';

              return (
                <tr key={s.id}>
                  <td>
                    <span className="mono-code" style={{ fontWeight: 700, color: '#0284c7' }}>
                      {s.surveyId}
                    </span>
                  </td>
                  <td>
                    <span className="mono-code" style={{ fontWeight: 600, color: '#0f172a' }}>
                      {s.parcelId}
                    </span>
                  </td>
                  <td className="mono-code" style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {s.coordinates}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {s.elevation.toFixed(2)} m
                  </td>
                  <td style={{ fontSize: '0.825rem', color: '#475569' }}>
                    <div>{s.source}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.surveyor}</div>
                  </td>
                  <td>
                    <span className={`badge ${isVerified ? 'badge-valid' : (isFlagged ? 'badge-warning' : 'badge-info')}`}>
                      {isVerified ? '✓ Verified' : (isFlagged ? '⚠ Datum Offset' : 'Pending')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      {/* [Validate Survey] Action (Section 21) */}
                      <button
                        onClick={() => handleValidateSurvey(s.id)}
                        disabled={validatingSurveyId === s.id}
                        className="btn btn-secondary btn-sm"
                      >
                        <ShieldCheck size={13} color="#0284c7" />
                        <span>{validatingSurveyId === s.id ? 'Validating...' : 'Validate Survey'}</span>
                      </button>

                      <button
                        onClick={() => navigate(`/3d-map?query=${s.parcelId}`)}
                        className="btn btn-primary btn-sm"
                      >
                        <Box size={13} />
                        <span>View in 3D</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Geodetic Reference Card */}
      <div
        className="cadastre-card"
        style={{
          marginTop: '1.5rem',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 700, marginBottom: '0.5rem' }}>
          Geodetic Reference Frame &amp; CORS Station Alignment
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', color: '#475569' }}>
          <div><strong>Horizontal Datum:</strong> WGS84 / EPSG:4326</div>
          <div><strong>Projected Grid:</strong> UTM Zone 44N (Uttarakhand)</div>
          <div><strong>Vertical Elevation Datum:</strong> EGM96 Geoid / Mean Sea Level (MSL)</div>
          <div><strong>Ground CORS Station:</strong> HW-CORS-01 (Continuous GNSS Station)</div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner">
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
