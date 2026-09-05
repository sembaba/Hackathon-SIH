/**
 * VERTI-CAD — 3D ULPIN Generation Engine
 * Deterministic algorithm to generate standardized 3D ULPIN identifiers.
 *
 * Format: ULPIN-[PARCEL_ID]-[BUILDING_ID]-[FLOOR_ID]-[UNIT_ID]-[VOL_HASH]
 * Example: ULPIN-P001245-B07-F03-U503-VOL847
 *
 * Hierarchy:
 *   2D Surface Parcel → 3D Building Envelope → 3D Floor Slab → 3D Volumetric Unit
 */

export interface ULPINComponents {
  parcel_id: string;     // e.g. P001245
  building_id: string;  // e.g. B07
  floor_id: string;     // e.g. F03, B01, G00
  unit_id: string;      // e.g. U503
  vol_hash: string;     // e.g. VOL847
}

export interface ULPINGenerationInput {
  parcel_number: string;   // P-001245 or P001245
  building_code: string;   // B07
  floor_number: number;    // -2=B02, -1=B01, 0=G00, 1=F01 ...
  unit_number: string;     // U503 or 503
  volume: number;          // volumetric area m³
  x_min?: number;
  x_max?: number;
  y_min?: number;
  y_max?: number;
  z_min?: number;
  z_max?: number;
}

export interface ULPINResult {
  ulpin: string;            // Full ULPIN string
  components: ULPINComponents;
  hierarchy: ULPINHierarchy;
  disclaimer: string;
}

export interface ULPINHierarchy {
  level_0_parcel: string;
  level_1_building: string;
  level_2_floor: string;
  level_3_unit: string;
  level_4_volume: string;
}

// ─────────────────────────────────────────────────────────────
// DJB2 Hash Function (deterministic string → integer)
// ─────────────────────────────────────────────────────────────
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) ^ char; // hash * 33 XOR char
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────
// Compute Volume Hash (3-digit numeric suffix)
// ─────────────────────────────────────────────────────────────
export function computeVolumeHash(
  parcel: string,
  building: string,
  floor: string,
  unit: string,
  volume: number
): string {
  const seed = `${parcel}:${building}:${floor}:${unit}:${Math.round(volume * 100)}`;
  const hash = djb2Hash(seed);
  const digits = (hash % 1000).toString().padStart(3, '0');
  return `VOL${digits}`;
}

// ─────────────────────────────────────────────────────────────
// Normalize Floor ID
// ─────────────────────────────────────────────────────────────
export function normalizeFloorId(floor_number: number): string {
  if (floor_number < 0) {
    return `B${Math.abs(floor_number).toString().padStart(2, '0')}`;
  }
  if (floor_number === 0) return 'G00';
  return `F${floor_number.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Normalize Parcel ID
// ─────────────────────────────────────────────────────────────
export function normalizeParcelId(parcel_number: string): string {
  // Strip hyphen prefix, standardize to 6-digit zero-padded
  const digits = parcel_number.replace(/^P-?/i, '').replace(/\D/g, '');
  return `P${digits.padStart(6, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Normalize Unit ID
// ─────────────────────────────────────────────────────────────
export function normalizeUnitId(unit_number: string): string {
  // Strip leading 'U' if present, then pad and re-add
  const stripped = unit_number.replace(/^U/i, '');
  if (/^\d+$/.test(stripped)) {
    return `U${stripped.padStart(3, '0')}`;
  }
  return unit_number.toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// Main ULPIN Generator
// ─────────────────────────────────────────────────────────────
export function generateULPIN(input: ULPINGenerationInput): ULPINResult {
  const parcel_id = normalizeParcelId(input.parcel_number);
  const building_id = input.building_code.toUpperCase();
  const floor_id = normalizeFloorId(input.floor_number);
  const unit_id = normalizeUnitId(input.unit_number);
  const vol_hash = computeVolumeHash(
    parcel_id,
    building_id,
    floor_id,
    unit_id,
    input.volume
  );

  const components: ULPINComponents = {
    parcel_id,
    building_id,
    floor_id,
    unit_id,
    vol_hash,
  };

  const ulpin = `ULPIN-${parcel_id}-${building_id}-${floor_id}-${unit_id}-${vol_hash}`;

  const hierarchy: ULPINHierarchy = {
    level_0_parcel: `${parcel_id} (2D Surface Cadastral Parcel)`,
    level_1_building: `${building_id} (3D Building Envelope)`,
    level_2_floor: `${floor_id} (3D Floor Slab)`,
    level_3_unit: `${unit_id} (3D Volumetric Property Unit)`,
    level_4_volume: `${vol_hash} (Spatial Volume Identifier)`,
  };

  return {
    ulpin,
    components,
    hierarchy,
    disclaimer: 'Prototype 3D ULPIN — VERTI-CAD Demonstration Identifier (SIH 2026)',
  };
}

// ─────────────────────────────────────────────────────────────
// Batch ULPIN Generator for an array of properties
// ─────────────────────────────────────────────────────────────
export function generateBatchULPINs(
  properties: ULPINGenerationInput[]
): ULPINResult[] {
  return properties.map((p) => generateULPIN(p));
}

// ─────────────────────────────────────────────────────────────
// Parse existing ULPIN string back into components
// ─────────────────────────────────────────────────────────────
export function parseULPIN(ulpin: string): ULPINComponents | null {
  const match = ulpin.match(
    /^ULPIN-([A-Z]\d+)-([A-Z]\d+)-([A-Z0-9]+)-([A-Z0-9]+)-(VOL\d+)$/i
  );
  if (!match) return null;
  return {
    parcel_id: match[1].toUpperCase(),
    building_id: match[2].toUpperCase(),
    floor_id: match[3].toUpperCase(),
    unit_id: match[4].toUpperCase(),
    vol_hash: match[5].toUpperCase(),
  };
}

// ─────────────────────────────────────────────────────────────
// Validate ULPIN Format
// ─────────────────────────────────────────────────────────────
export function validateULPINFormat(ulpin: string): {
  valid: boolean;
  error?: string;
} {
  if (!ulpin.startsWith('ULPIN-')) {
    return { valid: false, error: 'Must begin with ULPIN- prefix' };
  }
  const parts = ulpin.split('-');
  if (parts.length !== 6) {
    return {
      valid: false,
      error: `Expected 6 components (got ${parts.length}): ULPIN-[PARCEL]-[BLDG]-[FLOOR]-[UNIT]-[VOLHASH]`,
    };
  }
  if (!parts[5].startsWith('VOL')) {
    return { valid: false, error: 'Volume hash must start with VOL' };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// Pre-computed ULPIN lookup table for demo properties
// ─────────────────────────────────────────────────────────────
export const DEMO_ULPIN_TABLE: Record<string, string> = {
  U503: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 5, unit_number: 'U503', volume: 375 }).ulpin,
  U504: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 5, unit_number: 'U504', volume: 375 }).ulpin,
  U501: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 5, unit_number: 'U501', volume: 375 }).ulpin,
  U502: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 5, unit_number: 'U502', volume: 375 }).ulpin,
  U101: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 1, unit_number: 'U101', volume: 450 }).ulpin,
  U201: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 2, unit_number: 'U201', volume: 450 }).ulpin,
  U301: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 3, unit_number: 'U301', volume: 450 }).ulpin,
  U401: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 4, unit_number: 'U401', volume: 450 }).ulpin,
  U601: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 6, unit_number: 'U601', volume: 900 }).ulpin,
  UG01: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 0, unit_number: 'UG01', volume: 450 }).ulpin,
  UG02: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: 0, unit_number: 'UG02', volume: 450 }).ulpin,
  UB101: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: -1, unit_number: 'UB101', volume: 900 }).ulpin,
  UB201: generateULPIN({ parcel_number: 'P-001245', building_code: 'B07', floor_number: -2, unit_number: 'UB201', volume: 900 }).ulpin,
};

// ─────────────────────────────────────────────────────────────
// Canonical 23-Character ULPIN Engine (Diagram 4 Architecture)
// Format: [Country(2)][State(2)][District(2)][LocalBody(3)][Parcel(4)][Building(3)][Floor(2)][Unit(3)][Type(1)][CheckDigit(1)]
// Example: UP23GN0170456B1205503R7
// ─────────────────────────────────────────────────────────────
const ALPHABET_36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function calculateLuhnMod36(payload22: string): string {
  let totalSum = 0;
  const chars = payload22.toUpperCase().split('').reverse();
  for (let i = 0; i < chars.length; i++) {
    const val = ALPHABET_36.indexOf(chars[i]);
    if (val === -1) throw new Error(`Invalid alphanumeric char ${chars[i]}`);
    if (i % 2 === 0) {
      const doubled = val * 2;
      totalSum += Math.floor(doubled / 36) + (doubled % 36);
    } else {
      totalSum += val;
    }
  }
  const checkVal = (36 - (totalSum % 36)) % 36;
  return ALPHABET_36[checkVal];
}

export function generateCanonical23ULPIN(input: {
  country?: string;
  state?: string;
  district?: string;
  localBody?: string;
  parcel: string;
  building: string;
  floor: number;
  unit: string;
  propertyType?: string;
}): string {
  const country = (input.country || 'UP').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const state = (input.state || '23').padStart(2, '0').substring(0, 2).toUpperCase();
  const district = (input.district || 'GN').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const localBody = (input.localBody || '017').padStart(3, '0').substring(0, 3).toUpperCase();
  
  const parcelDigits = input.parcel.replace(/\D/g, '');
  const parcel = (parcelDigits || '0001').padStart(4, '0').substring(0, 4);
  
  const bldDigits = input.building.replace(/\D/g, '');
  const building = `B${(bldDigits || '01').padStart(2, '0').substring(0, 2)}`;
  
  let floor = 'GF';
  if (input.floor < 0) {
    floor = `B${Math.abs(input.floor).toString().substring(0, 1)}`;
  } else if (input.floor > 0) {
    floor = input.floor.toString().padStart(2, '0').substring(0, 2);
  }
  
  const unitDigits = input.unit.replace(/\D/g, '');
  const unit = (unitDigits || '001').padStart(3, '0').substring(0, 3);
  const pType = (input.propertyType || 'R').substring(0, 1).toUpperCase();
  
  const payload22 = `${country}${state}${district}${localBody}${parcel}${building}${floor}${unit}${pType}`;
  const checkDigit = calculateLuhnMod36(payload22);
  return `${payload22}${checkDigit}`;
}

