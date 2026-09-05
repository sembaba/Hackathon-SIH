import React from 'react';
import { AlertTriangle, Eye, Layers, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TopologyConflict, PropertyUnit } from '../types';

interface ConflictModalProps {
  conflict: TopologyConflict | null;
  isOpen: boolean;
  onClose: () => void;
  onIsolateConflict: () => void;
  onViewUnit503: () => void;
  onViewUnit504: () => void;
  isConflictIsolated: boolean;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflict,
  isOpen,
  onClose,
  onIsolateConflict,
  onViewUnit503,
  onViewUnit504,
  isConflictIsolated
}) => {
  if (!isOpen || !conflict) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={22} color="#dc2626" />
            <div>
              <h3 style={{ fontSize: '1rem', color: '#991b1b', fontWeight: 700 }}>
                TOPOLOGY CONFLICT DETECTED
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                Spatial Quality Engine &bull; SIH Prototype Benchmark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem' }}>
          {/* Main Conflict Callout */}
          <div
            style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#fff',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.25rem' }}>
              ⚠ TOPOLOGY CONFLICT
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Unit 503 &harr; Unit 504
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.825rem',
                fontWeight: 700,
              }}
            >
              Vertical Overlap: {conflict.overlapHeight.toFixed(1)} meter
            </div>
          </div>

          {/* Conflict Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            {/* Unit 503 Card */}
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                PROPERTY A
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Unit 503 (Floor F05)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                Z-Min: <strong>15.0 m</strong> &bull; Z-Max: <strong>18.0 m</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Height: 3.0 m &bull; Vol: 375 m³
              </div>
            </div>

            {/* Unit 504 Card */}
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>
                PROPERTY B
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Unit 504 (Floor F05)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                Z-Min: <strong>17.0 m</strong> &bull; Z-Max: <strong>20.0 m</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Height: 3.0 m &bull; Vol: 375 m³
              </div>
            </div>
          </div>

          {/* Validation Notice Message */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              fontSize: '0.825rem',
              color: '#92400e',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldAlert size={18} color="#d97706" style={{ flexShrink: 0 }} />
            <span>
              <strong>Validation Rule Violated:</strong> Potential vertical spatial overlap detected in 3D cadastre. Elevation range 17.0m–18.0m is co-allocated.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => {
                onIsolateConflict();
                onClose();
              }}
              className="btn btn-danger"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              <Layers size={16} />
              <span>{isConflictIsolated ? 'Exit Isolated Conflict View' : 'Isolate Conflict (Focus 3D Overlap)'}</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  onViewUnit503();
                  onClose();
                }}
                className="btn btn-secondary"
              >
                <Eye size={15} />
                <span>View Unit 503</span>
              </button>

              <button
                onClick={() => {
                  onViewUnit504();
                  onClose();
                }}
                className="btn btn-secondary"
              >
                <Eye size={15} />
                <span>View Unit 504</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
