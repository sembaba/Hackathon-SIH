import React, { useState } from 'react';
import { PropertyUnit } from '../types';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  Compass,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin
} from 'lucide-react';

interface PropertyDetailsDrawerProps {
  property: PropertyUnit | null;
  onClose: () => void;
  onFlyTo: (property: PropertyUnit) => void;
  onView2D?: (property: PropertyUnit) => void;
  onShowToast: (msg: string) => void;
}

export const PropertyDetailsDrawer: React.FC<PropertyDetailsDrawerProps> = ({
  property,
  onClose,
  onFlyTo,
  onView2D,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [showRelations, setShowRelations] = useState(false);
  const [showUlpinExplainer, setShowUlpinExplainer] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedStatus, setValidatedStatus] = useState<string | null>(null);

  if (!property) return null;

  const handleCopyULPIN = () => {
    const ulpinText = property.ulpin || `IN-UT-HW-001245-B07-F05-${property.unit_number}`;
    navigator.clipboard.writeText(ulpinText);
    setCopied(true);
    onShowToast('ULPIN copied successfully.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      if (property.status === 'CONFLICT_FLAGGED') {
        setValidatedStatus('Conflict Detected: Vertical spatial overlap with Unit 504 (17m–18m).');
        onShowToast('Validation Alert: Vertical overlap detected.');
      } else {
        setValidatedStatus('Validated: No volumetric spatial overlaps detected.');
        onShowToast('Validation Successful: Clean 3D parcel topology.');
      }
    }, 600);
  };

  const isConflict = property.status === 'CONFLICT_FLAGGED';
  const height = property.z_max - property.z_min;

  return (
    <div className="property-details-drawer">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          marginBottom: '0.85rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', letterSpacing: '0.04em' }}>
            PROPERTY DETAILS
          </span>
          <h2 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>
            Unit ID: {property.unit_number}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Close details"
        >
          <X size={18} />
        </button>
      </div>

      {/* Conflict Warning */}
      {isConflict && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.65rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <strong>⚠ TOPOLOGY CONFLICT:</strong> Vertical overlap of 1m detected (17m–18m).
          </div>
        </div>
      )}

      {/* Prototype 3D ULPIN Card (Section 12) */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.85rem',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
            PROTOTYPE 3D ULPIN
          </span>
          <button
            onClick={handleCopyULPIN}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
          >
            {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy ULPIN'}</span>
          </button>
        </div>

        <div
          className="mono-code"
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#0f172a',
            wordBreak: 'break-all',
            padding: '0.4rem 0.5rem',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
          }}
        >
          {property.ulpin || `IN-UT-HW-001245-B07-F05-${property.unit_number}`}
        </div>

        <button
          onClick={() => setShowUlpinExplainer(!showUlpinExplainer)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontSize: '0.725rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.45rem',
            padding: 0,
          }}
        >
          <Info size={12} />
          <span>{showUlpinExplainer ? 'Hide ULPIN format breakdown' : 'Explain ULPIN components'}</span>
          {showUlpinExplainer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showUlpinExplainer && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.725rem',
              color: '#334155',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#0284c7' }}>
              Prototype ULPIN Component Structure:
            </div>
            <div><strong>IN</strong> = Country (India)</div>
            <div><strong>UT</strong> = State (Uttarakhand)</div>
            <div><strong>HW</strong> = District/Region (Haridwar demo code)</div>
            <div><strong>001245</strong> = Cadastral Parcel ID</div>
            <div><strong>B07</strong> = Building Identifier</div>
            <div><strong>F05</strong> = Floor Level</div>
            <div><strong>{property.unit_number}</strong> = Property Unit ID</div>
            <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem' }}>
              *This is a PROTOTYPE identifier for demonstration purposes.
            </div>
          </div>
        )}
      </div>

      {/* Cadastral Attributes Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          marginBottom: '0.85rem',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Building</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{property.building_code} ({property.building_name})</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Floor</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{property.floor_label}</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Parcel</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{property.parcel_number}</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Status</div>
          <div>
            <span className={`badge ${isConflict ? 'badge-conflict' : 'badge-valid'}`}>
              {isConflict ? 'Conflict' : 'Validated'}
            </span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Horizontal Area</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{property.area} m²</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>3D Volume</div>
          <div style={{ fontWeight: 700, color: '#0284c7' }}>{property.volume} m³</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Z-Min Elevation</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{property.z_min} m</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Z-Max Elevation</div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{property.z_max} m</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Vertical Height (ΔZ)</div>
          <div style={{ fontWeight: 700, color: '#0284c7' }}>{height} meters</div>
        </div>
      </div>

      {/* Validation Result Toast if triggered */}
      {validatedStatus && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: isConflict ? '#fef2f2' : '#f0fdf4',
            border: isConflict ? '1px solid #fecaca' : '1px solid #bbf7d0',
            color: isConflict ? '#991b1b' : '#166534',
            borderRadius: '6px',
            fontSize: '0.75rem',
            marginBottom: '0.85rem',
          }}
        >
          {validatedStatus}
        </div>
      )}

      {/* Action Buttons (Section 24) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <button
          onClick={() => onFlyTo(property)}
          className="btn btn-primary btn-sm"
          style={{ width: '100%' }}
        >
          <Compass size={14} />
          <span>View in 3D</span>
        </button>

        <button
          onClick={handleValidate}
          disabled={isValidating}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%' }}
        >
          <ShieldCheck size={14} color="#0284c7" />
          <span>{isValidating ? 'Validating...' : 'Validate'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          onClick={() => setShowRelations(!showRelations)}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%' }}
        >
          <GitBranch size={14} color="#0284c7" />
          <span>{showRelations ? 'Hide Cadastral Hierarchy' : 'Show Relations (Hierarchy)'}</span>
        </button>

        {onView2D && (
          <button
            onClick={() => onView2D(property)}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
          >
            <MapPin size={14} />
            <span>Open in 2D Cadastre</span>
          </button>
        )}
      </div>

      {/* Hierarchical Relationship View (Section 25) */}
      {showRelations && (
        <div className="cadastral-hierarchy">
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>
            HIERARCHICAL CADASTRAL RELATIONSHIP
          </div>
          <div className="hierarchy-node">Country: <strong>IN (India)</strong></div>
          <div className="hierarchy-arrow">&darr;</div>
          <div className="hierarchy-node">State: <strong>UT (Uttarakhand)</strong></div>
          <div className="hierarchy-arrow">&darr;</div>
          <div className="hierarchy-node">District: <strong>HW (Haridwar)</strong></div>
          <div className="hierarchy-arrow">&darr;</div>
          <div className="hierarchy-node">Parcel: <strong>{property.parcel_number}</strong></div>
          <div className="hierarchy-arrow">&darr;</div>
          <div className="hierarchy-node">Building: <strong>{property.building_code}</strong></div>
          <div className="hierarchy-arrow">&darr;</div>
          <div className="hierarchy-node">Floor: <strong>{property.floor_label}</strong></div>
          <div className="hierarchy-arrow">&darr;</div>
          <div className="hierarchy-node" style={{ borderColor: '#0284c7', background: '#e0f2fe', color: '#0369a1' }}>
            Unit: <strong>{property.unit_number}</strong>
          </div>
        </div>
      )}
    </div>
  );
};
