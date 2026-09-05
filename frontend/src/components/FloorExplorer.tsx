import React from 'react';
import { Floor, PropertyUnit } from '../types';
import { Layers, Eye, EyeOff, RotateCcw, Filter, Check } from 'lucide-react';

interface FloorExplorerProps {
  floors: Floor[];
  properties: PropertyUnit[];
  selectedFloor: Floor | null;
  isolatedFloorId: number | null;
  onSelectFloor: (floor: Floor | null) => void;
  onIsolateFloor: (floorId: number | null) => void;
  onResetView: () => void;
  showUnderground: boolean;
  onToggleUnderground: () => void;
  onSelectProperty: (property: PropertyUnit | null) => void;
}

export const FloorExplorer: React.FC<FloorExplorerProps> = ({
  floors,
  properties,
  selectedFloor,
  isolatedFloorId,
  onSelectFloor,
  onIsolateFloor,
  onResetView,
  showUnderground,
  onToggleUnderground,
  onSelectProperty
}) => {
  // Sort floors descending: F06 down to B02
  const sortedFloors = [...floors].sort((a, b) => b.floor_number - a.floor_number);

  // Get units for selected floor
  const floorUnits = selectedFloor
    ? properties.filter((p) => p.floor_number === selectedFloor.floor_number)
    : [];

  return (
    <div className="floor-explorer-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7' }}>
          <Layers size={16} />
          <span>VERTICAL EXPLORER</span>
        </div>
        <button
          onClick={onToggleUnderground}
          className={`btn btn-sm ${showUnderground ? 'btn-primary' : 'btn-secondary'}`}
          title="Toggle subsurface basement display"
          style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
        >
          {showUnderground ? <Eye size={12} /> : <EyeOff size={12} />}
          <span>{showUnderground ? 'Subsurface ON' : 'Subsurface OFF'}</span>
        </button>
      </div>

      {/* Global Floor Action Buttons (Section 10) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.65rem' }}>
        <button
          onClick={() => {
            onSelectFloor(null);
            onIsolateFloor(null);
          }}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.725rem', padding: '0.25rem 0.4rem' }}
        >
          Show All Floors
        </button>

        <button
          onClick={() => {
            if (selectedFloor) {
              onIsolateFloor(isolatedFloorId === selectedFloor.id ? null : selectedFloor.id);
            }
          }}
          disabled={!selectedFloor}
          className={`btn btn-sm ${isolatedFloorId ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.725rem', padding: '0.25rem 0.4rem' }}
        >
          <Filter size={12} />
          <span>{isolatedFloorId ? 'Show All' : 'Isolate Floor'}</span>
        </button>
      </div>

      {/* Floor Stack List */}
      <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '0.2rem' }}>
        {sortedFloors.map((floor) => {
          const isSelected = selectedFloor?.id === floor.id;
          const isBasement = floor.floor_number < 0;
          const isIsolated = isolatedFloorId === floor.id;

          return (
            <button
              key={floor.id}
              onClick={() => {
                if (isSelected) {
                  onSelectFloor(null);
                  if (isIsolated) onIsolateFloor(null);
                } else {
                  onSelectFloor(floor);
                }
              }}
              className={`floor-item-btn ${isBasement ? 'basement' : ''} ${isSelected ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: isSelected ? '#ffffff' : (isBasement ? '#64748b' : '#0284c7'),
                    minWidth: '38px',
                  }}
                >
                  {floor.level_code}
                </span>
                <span style={{ fontSize: '0.775rem' }}>{floor.floor_label}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: isSelected ? '#ffffff' : '#64748b' }}>
                  {floor.z_min}m–{floor.z_max}m
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floor Units Expansion */}
      {selectedFloor && (
        <div
          style={{
            marginTop: '0.65rem',
            paddingTop: '0.65rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#64748b', marginBottom: '0.35rem' }}>
            <span>UNITS ON {selectedFloor.level_code} ({floorUnits.length}):</span>
            <span>Height: {selectedFloor.floor_height}m</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {floorUnits.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelectProperty(u)}
                style={{
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: u.status === 'CONFLICT_FLAGGED' ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                  background: u.status === 'CONFLICT_FLAGGED' ? '#fee2e2' : '#ffffff',
                  color: u.status === 'CONFLICT_FLAGGED' ? '#dc2626' : '#0f172a',
                  cursor: 'pointer',
                }}
              >
                {u.unit_number} {u.status === 'CONFLICT_FLAGGED' && '⚠'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset View Button */}
      <div style={{ marginTop: '0.65rem' }}>
        <button
          onClick={onResetView}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', fontSize: '0.75rem' }}
        >
          <RotateCcw size={12} />
          <span>Reset Camera View</span>
        </button>
      </div>
    </div>
  );
};
