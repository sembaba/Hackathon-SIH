/**
 * VERTI-CAD — 3D Topology Conflict Detection Engine
 * AABB (Axis-Aligned Bounding Box) 3D Boolean Intersection Algorithm
 * for Cadastral Vertical Property Boundary Validation.
 *
 * Detects:
 *   - 3D Volumetric Overlaps between adjacent vertical units
 *   - Slab penetrations (floor slab intersecting unit above/below)
 *   - Boundary sliver intersections (tiny gaps or overlaps on partition walls)
 */

export interface BBox3D {
  unit_number: string;
  ulpin?: string;
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  z_min: number;
  z_max: number;
  volume: number;
  floor_number: number;
  building_code: string;
  parcel_number: string;
  owner_name?: string;
  property_type?: string;
}

export interface OverlapZone {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  z_min: number;
  z_max: number;
  width: number;
  depth: number;
  height: number;
  volume_m3: number;
  center: { x: number; y: number; z: number };
}

export type ConflictSeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
export type ConflictType =
  | 'VERTICAL_VOLUMETRIC_OVERLAP'
  | 'HORIZONTAL_BOUNDARY_INTERSECTION'
  | 'SLAB_PENETRATION'
  | 'BOUNDARY_SLIVER';

export interface ConflictResult {
  id: string;
  conflict_type: ConflictType;
  severity: ConflictSeverity;
  unit_a: string;
  unit_b: string;
  ulpin_a?: string;
  ulpin_b?: string;
  owner_a?: string;
  owner_b?: string;
  overlap_zone: OverlapZone;
  overlap_volume_m3: number;
  overlap_height_m: number;
  description: string;
  detection_method: 'AABB_3D_INTERSECTION';
  detected_at: string;
}

export interface TopologyValidationReport {
  total_units_checked: number;
  total_pairs_tested: number;
  total_conflicts: number;
  conflicts_by_severity: Record<ConflictSeverity, number>;
  conflicts: ConflictResult[];
  validation_passed: boolean;
  validated_at: string;
  engine_version: string;
}

// ─────────────────────────────────────────────────────────────
// AABB 3D Intersection Test
// Two boxes intersect if and only if they overlap on ALL 3 axes
// ─────────────────────────────────────────────────────────────
export function aabbIntersects3D(a: BBox3D, b: BBox3D): boolean {
  return (
    a.x_min < b.x_max &&
    a.x_max > b.x_min &&
    a.y_min < b.y_max &&
    a.y_max > b.y_min &&
    a.z_min < b.z_max &&
    a.z_max > b.z_min
  );
}

// ─────────────────────────────────────────────────────────────
// Compute Exact Overlap Zone
// Returns null if no intersection exists
// ─────────────────────────────────────────────────────────────
export function computeOverlapZone(a: BBox3D, b: BBox3D): OverlapZone | null {
  const ox_min = Math.max(a.x_min, b.x_min);
  const ox_max = Math.min(a.x_max, b.x_max);
  const oy_min = Math.max(a.y_min, b.y_min);
  const oy_max = Math.min(a.y_max, b.y_max);
  const oz_min = Math.max(a.z_min, b.z_min);
  const oz_max = Math.min(a.z_max, b.z_max);

  const width = ox_max - ox_min;
  const depth = oy_max - oy_min;
  const height = oz_max - oz_min;

  if (width <= 0 || depth <= 0 || height <= 0) return null;

  const volume_m3 = width * depth * height;

  return {
    x_min: ox_min,
    x_max: ox_max,
    y_min: oy_min,
    y_max: oy_max,
    z_min: oz_min,
    z_max: oz_max,
    width,
    depth,
    height,
    volume_m3,
    center: {
      x: (ox_min + ox_max) / 2,
      y: (oy_min + oy_max) / 2,
      z: (oz_min + oz_max) / 2,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Classify Conflict Type
// ─────────────────────────────────────────────────────────────
function classifyConflict(
  a: BBox3D,
  b: BBox3D,
  overlap: OverlapZone
): ConflictType {
  // Same-floor units: horizontal boundary intersection
  if (a.floor_number === b.floor_number) {
    if (overlap.height < 0.05) return 'BOUNDARY_SLIVER';
    return 'HORIZONTAL_BOUNDARY_INTERSECTION';
  }
  // Different floors: vertical overlap
  if (Math.abs(a.floor_number - b.floor_number) === 1) {
    if (overlap.height < 0.1) return 'SLAB_PENETRATION';
  }
  return 'VERTICAL_VOLUMETRIC_OVERLAP';
}

// ─────────────────────────────────────────────────────────────
// Classify Severity
// ─────────────────────────────────────────────────────────────
function classifySeverity(
  conflictType: ConflictType,
  overlapVolume: number,
  overlapHeight: number
): ConflictSeverity {
  if (conflictType === 'VERTICAL_VOLUMETRIC_OVERLAP') {
    if (overlapHeight >= 1.0 || overlapVolume >= 100) return 'ERROR';
    if (overlapHeight >= 0.3) return 'WARNING';
    return 'INFO';
  }
  if (conflictType === 'HORIZONTAL_BOUNDARY_INTERSECTION') {
    if (overlapVolume >= 10) return 'ERROR';
    return 'WARNING';
  }
  if (conflictType === 'SLAB_PENETRATION') return 'WARNING';
  return 'INFO'; // BOUNDARY_SLIVER
}

// ─────────────────────────────────────────────────────────────
// Generate Conflict Description
// ─────────────────────────────────────────────────────────────
function buildConflictDescription(
  a: BBox3D,
  b: BBox3D,
  overlap: OverlapZone,
  conflictType: ConflictType
): string {
  const zRange = `${overlap.z_min.toFixed(1)}m–${overlap.z_max.toFixed(1)}m`;
  const vol = overlap.volume_m3.toFixed(2);

  switch (conflictType) {
    case 'VERTICAL_VOLUMETRIC_OVERLAP':
      return (
        `Vertical volumetric overlap detected between ${a.unit_number} ` +
        `(Z: ${a.z_min.toFixed(1)}m–${a.z_max.toFixed(1)}m) and ${b.unit_number} ` +
        `(Z: ${b.z_min.toFixed(1)}m–${b.z_max.toFixed(1)}m). ` +
        `Overlap zone: ${zRange}, depth: ${overlap.height.toFixed(2)}m, volume: ${vol}m³.`
      );
    case 'HORIZONTAL_BOUNDARY_INTERSECTION':
      return (
        `Horizontal boundary intersection on Floor ${a.floor_number} between ` +
        `${a.unit_number} and ${b.unit_number}. ` +
        `Shared boundary overlap: ${overlap.width.toFixed(2)}m × ${overlap.depth.toFixed(2)}m.`
      );
    case 'SLAB_PENETRATION':
      return (
        `Slab penetration detected: ${a.unit_number} Z-max (${a.z_max.toFixed(2)}m) ` +
        `exceeds ${b.unit_number} Z-min (${b.z_min.toFixed(2)}m) by ${overlap.height.toFixed(3)}m.`
      );
    case 'BOUNDARY_SLIVER':
      return (
        `Boundary sliver intersection between ${a.unit_number} and ${b.unit_number}. ` +
        `Overlap: ${overlap.volume_m3.toFixed(3)}m³ (possible survey precision error).`
      );
  }
}

// ─────────────────────────────────────────────────────────────
// Main: Detect All Conflicts (O(n²) pairwise AABB test)
// ─────────────────────────────────────────────────────────────
export function detectAllConflicts(units: BBox3D[]): ConflictResult[] {
  const conflicts: ConflictResult[] = [];
  let conflictIndex = 1;

  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const a = units[i];
      const b = units[j];

      // Skip if not in same building
      if (
        a.building_code !== b.building_code ||
        a.parcel_number !== b.parcel_number
      ) {
        continue;
      }

      if (!aabbIntersects3D(a, b)) continue;

      const overlap = computeOverlapZone(a, b);
      if (!overlap) continue;

      // Tolerance: ignore < 1mm overlaps (floating point noise)
      if (overlap.volume_m3 < 0.000001) continue;

      const conflictType = classifyConflict(a, b, overlap);
      const severity = classifySeverity(
        conflictType,
        overlap.volume_m3,
        overlap.height
      );

      conflicts.push({
        id: `CONF-${conflictIndex.toString().padStart(3, '0')}`,
        conflict_type: conflictType,
        severity,
        unit_a: a.unit_number,
        unit_b: b.unit_number,
        ulpin_a: a.ulpin,
        ulpin_b: b.ulpin,
        owner_a: a.owner_name,
        owner_b: b.owner_name,
        overlap_zone: overlap,
        overlap_volume_m3: overlap.volume_m3,
        overlap_height_m: overlap.height,
        description: buildConflictDescription(a, b, overlap, conflictType),
        detection_method: 'AABB_3D_INTERSECTION',
        detected_at: new Date().toISOString(),
      });

      conflictIndex++;
    }
  }

  return conflicts;
}

// ─────────────────────────────────────────────────────────────
// Full Topology Validation Report
// ─────────────────────────────────────────────────────────────
export function runTopologyValidation(
  units: BBox3D[]
): TopologyValidationReport {
  const conflicts = detectAllConflicts(units);
  const totalPairs = (units.length * (units.length - 1)) / 2;

  const bySeverity: Record<ConflictSeverity, number> = {
    CRITICAL: 0,
    ERROR: 0,
    WARNING: 0,
    INFO: 0,
  };
  conflicts.forEach((c) => {
    bySeverity[c.severity]++;
  });

  return {
    total_units_checked: units.length,
    total_pairs_tested: totalPairs,
    total_conflicts: conflicts.length,
    conflicts_by_severity: bySeverity,
    conflicts,
    validation_passed:
      bySeverity['CRITICAL'] === 0 && bySeverity['ERROR'] === 0,
    validated_at: new Date().toISOString(),
    engine_version: 'VERTI-CAD Topology Engine v2.0 (AABB)',
  };
}

// ─────────────────────────────────────────────────────────────
// Helper: Convert PropertyUnit to BBox3D (for integration with mockData)
// ─────────────────────────────────────────────────────────────
export function propertyToBBox(p: {
  unit_number: string;
  ulpin?: string;
  x_min?: number;
  x_max?: number;
  y_min?: number;
  y_max?: number;
  z_min: number;
  z_max: number;
  volume: number;
  floor_number: number;
  building_code: string;
  parcel_number: string;
  owner_name: string;
  property_type: string;
}): BBox3D {
  return {
    unit_number: p.unit_number,
    ulpin: p.ulpin,
    x_min: p.x_min ?? -15,
    x_max: p.x_max ?? 15,
    y_min: p.y_min ?? -10,
    y_max: p.y_max ?? 10,
    z_min: p.z_min,
    z_max: p.z_max,
    volume: p.volume,
    floor_number: p.floor_number,
    building_code: p.building_code,
    parcel_number: p.parcel_number,
    owner_name: p.owner_name,
    property_type: p.property_type,
  };
}
