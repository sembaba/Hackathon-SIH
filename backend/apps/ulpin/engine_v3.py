"""
===============================================================================
VERTI-CAD: 3D ULPIN Generation & Spatial Validation Engine (V3 Standard)
===============================================================================
Format: [Country(2)][State(2)][District(2)][LocalBody(3)][Parcel(4)][Building(3)][Floor(2)][Unit(3)][Type(1)][CheckDigit(1)]
Example: UP23GN0170456B1205503R7 (Total 23 Characters)

Property Type Codes:
  R: Residential Apartment
  C: Commercial Retail / Office
  I: Industrial
  U: Underground Infrastructure Vault / Storage
  P: Dedicated Multi-Level Parking Space
  A: Air Rights Development Corridor
  O: Others / Common Service Facility
===============================================================================
"""
import re
from typing import Dict, Any, Tuple, Optional, List

# Character set for alphanumeric Luhn Mod-36 calculation (Radix 36)
ALPHABET_36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
CHAR_TO_VAL = {ch: idx for idx, ch in enumerate(ALPHABET_36)}
VAL_TO_CHAR = {idx: ch for idx, ch in enumerate(ALPHABET_36)}

# 23-Character Canonical 3D ULPIN Regex
ULPIN_V3_REGEX = re.compile(
    r'^(?P<country>[A-Z]{2})'
    r'(?P<state>[A-Z0-9]{2})'
    r'(?P<district>[A-Z]{2})'
    r'(?P<local_body>[A-Z0-9]{3})'
    r'(?P<parcel>[0-9]{4})'
    r'(?P<building>[A-Z][0-9]{2})'
    r'(?P<floor>[A-Z0-9]{2})'
    r'(?P<unit>[0-9]{3})'
    r'(?P<type>[RCIUPAO])'
    r'(?P<check_digit>[A-Z0-9])$'
)

PROPERTY_TYPE_MAP = {
    'R': 'Residential Apartment Unit',
    'C': 'Commercial Retail / Office',
    'I': 'Industrial Facility',
    'U': 'Underground Infrastructure / Vault',
    'P': 'Dedicated Parking Space',
    'A': 'Air Rights Corridor',
    'O': 'Common Area / Utility Network'
}

def calculate_luhn_mod36(payload_22: str) -> str:
    """
    Calculate the Luhn Modulus-36 check character for a 22-character ULPIN payload.
    Algorithm:
      1. Process characters from right to left (1-indexed).
      2. For odd positions from right (first, third, etc.), weight = 2.
      3. For even positions, weight = 1.
      4. Double the value for weight 2; if result >= 36, add div 36 + mod 36.
      5. Sum all processed values.
      6. Check digit = (36 - (total_sum % 36)) % 36.
    """
    clean_str = payload_22.strip().upper()
    if len(clean_str) != 22:
        raise ValueError(f"Payload must be exactly 22 characters, received {len(clean_str)}.")

    total_sum = 0
    # Process right to left
    for i, ch in enumerate(reversed(clean_str)):
        val = CHAR_TO_VAL.get(ch)
        if val is None:
            raise ValueError(f"Invalid alphanumeric character '{ch}' in ULPIN payload.")

        # Weighting: 2 for odd steps from right (0th, 2nd in 0-indexed reversed), 1 for even
        if i % 2 == 0:
            doubled = val * 2
            # Factor sum for base 36
            term = (doubled // 36) + (doubled % 36)
        else:
            term = val

        total_sum += term

    remainder = total_sum % 36
    check_val = (36 - remainder) % 36
    return VAL_TO_CHAR[check_val]

def verify_luhn_mod36(full_ulpin_23: str) -> bool:
    """Validate full 23-character ULPIN against its Luhn Mod-36 check digit."""
    clean = full_ulpin_23.strip().upper()
    if len(clean) != 23:
        return False
    payload = clean[:22]
    expected_check = calculate_luhn_mod36(payload)
    return clean[22] == expected_check

def format_floor_code(floor_number: int) -> str:
    """
    Format vertical floor number to standard 2-character code:
      -2 -> B2 (Basement 2)
      -1 -> B1 (Basement 1)
       0 -> GF (Ground Floor)
       1 -> 01, 5 -> 05, 12 -> 12
    """
    if floor_number < 0:
        return f"B{abs(floor_number):01d}"[:2]
    if floor_number == 0:
        return "GF"
    return f"{floor_number:02d}"

def generate_3d_ulpin_v3(
    country_code: str = 'UP',
    state_code: str = '23',
    district_code: str = 'GN',
    local_body_code: str = '017',
    parcel_number: str = '0456',
    building_code: str = 'B12',
    floor_number: int = 5,
    unit_number: str = '503',
    property_type: str = 'R'
) -> str:
    """
    Generate the authoritative 23-character 3D ULPIN.
    Example: UP23GN0170456B1205503R7
    """
    # 1. Normalize Country (2 chars)
    country = country_code.strip().upper()[:2].ljust(2, 'X')

    # 2. Normalize State (2 chars)
    state = state_code.strip().upper()[:2].ljust(2, '0')

    # 3. Normalize District (2 chars)
    district = district_code.strip().upper()[:2].ljust(2, 'X')

    # 4. Normalize Local Body (3 chars)
    clean_lb = re.sub(r'[^A-Z0-9]', '', local_body_code.upper())
    local_body = clean_lb.zfill(3)[:3]

    # 5. Normalize Parcel (4 digits)
    parcel_digits = re.sub(r'[^0-9]', '', str(parcel_number))
    parcel = parcel_digits.zfill(4)[:4] if parcel_digits else "0001"

    # 6. Normalize Building (3 chars: B followed by 2 digits)
    clean_bld = re.sub(r'[^A-Z0-9]', '', building_code.upper())
    if not clean_bld.startswith('B'):
        clean_bld = f"B{clean_bld}"
    bld_num = re.sub(r'[^0-9]', '', clean_bld)
    building = f"B{bld_num.zfill(2)[:2]}"

    # 7. Normalize Floor (2 chars)
    floor = format_floor_code(floor_number)

    # 8. Normalize Unit (3 digits)
    unit_digits = re.sub(r'[^0-9]', '', str(unit_number))
    unit = unit_digits.zfill(3)[:3] if unit_digits else "001"

    # 9. Property Type (1 char)
    prop_type = property_type.strip().upper()[:1]
    if prop_type not in PROPERTY_TYPE_MAP:
        prop_type = 'R'

    # Assemble 22-character payload
    payload_22 = f"{country}{state}{district}{local_body}{parcel}{building}{floor}{unit}{prop_type}"

    # 10. Compute Check Digit
    check_digit = calculate_luhn_mod36(payload_22)

    return f"{payload_22}{check_digit}"

def decode_3d_ulpin_v3(ulpin_23: str) -> Dict[str, Any]:
    """Deconstruct and validate a 23-character 3D ULPIN string into hierarchical metadata."""
    cleaned = ulpin_23.strip().upper()
    match = ULPIN_V3_REGEX.match(cleaned)
    if not match:
        raise ValueError(
            f"Invalid 3D ULPIN string '{cleaned}'. Format must match: "
            "[Country(2)][State(2)][District(2)][LocalBody(3)][Parcel(4)][Building(3)][Floor(2)][Unit(3)][Type(1)][CheckDigit(1)]"
        )

    gd = match.groupdict()
    is_valid_check = verify_luhn_mod36(cleaned)
    floor_str = gd['floor']
    if floor_str.startswith('B'):
        floor_num = -int(floor_str[1:]) if floor_str[1:].isdigit() else -1
        floor_desc = f"Basement {floor_str}"
    elif floor_str == 'GF':
        floor_num = 0
        floor_desc = "Ground Floor"
    else:
        floor_num = int(floor_str) if floor_str.isdigit() else 1
        floor_desc = f"Floor {floor_num}"

    prop_type_code = gd['type']

    return {
        'ulpin': cleaned,
        'is_valid': is_valid_check,
        'country_code': gd['country'],
        'state_code': gd['state'],
        'district_code': gd['district'],
        'local_body_code': gd['local_body'],
        'parcel_number': gd['parcel'],
        'building_code': gd['building'],
        'floor_code': gd['floor'],
        'floor_number': floor_num,
        'floor_description': floor_desc,
        'unit_number': gd['unit'],
        'property_type_code': prop_type_code,
        'property_type_description': PROPERTY_TYPE_MAP.get(prop_type_code, 'Unknown'),
        'check_digit': gd['check_digit'],
        'hierarchy': {
            'level_0_administrative': f"{gd['country']}-{gd['state']}-{gd['district']}-{gd['local_body']}",
            'level_1_parcel': f"Parcel {gd['parcel']} (Surface Cadastre)",
            'level_2_building': f"Building {gd['building']} (3D Massing)",
            'level_3_floor': f"{floor_desc} (Vertical Slice)",
            'level_4_unit': f"Unit {gd['unit']} ({PROPERTY_TYPE_MAP.get(prop_type_code, 'Property')})"
        }
    }

# -----------------------------------------------------------------------------
# 3D Horizontal & Vertical Collision Detection Functions
# -----------------------------------------------------------------------------
def check_3d_property_collision(
    unit_a: Dict[str, Any],
    unit_b: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    3D AABB + Vertical Interval Collision Checker.
    Each unit must contain:
      - x_min, x_max, y_min, y_max (horizontal footprint)
      - z_min, z_max (vertical bounds in metres)
    """
    # 1. Check Vertical Interval Overlap
    z_min_overlap = max(unit_a['z_min'], unit_b['z_min'])
    z_max_overlap = min(unit_a['z_max'], unit_b['z_max'])
    z_overlap_depth = z_max_overlap - z_min_overlap

    if z_overlap_depth <= 0.001:
        return None  # No vertical overlap

    # 2. Check Horizontal Footprint Overlap
    x_min_overlap = max(unit_a['x_min'], unit_b['x_min'])
    x_max_overlap = min(unit_a['x_max'], unit_b['x_max'])
    x_overlap = x_max_overlap - x_min_overlap

    y_min_overlap = max(unit_a['y_min'], unit_b['y_min'])
    y_max_overlap = min(unit_a['y_max'], unit_b['y_max'])
    y_overlap = y_max_overlap - y_min_overlap

    if x_overlap > 0.001 and y_overlap > 0.001:
        vol_m3 = round(x_overlap * y_overlap * z_overlap_depth, 3)
        return {
            'collision': True,
            'unit_a_ulpin': unit_a.get('ulpin', 'Unit A'),
            'unit_b_ulpin': unit_b.get('ulpin', 'Unit B'),
            'overlap_volume_m3': vol_m3,
            'overlap_depth_m': round(z_overlap_depth, 2),
            'intersection_box': {
                'x_min': round(x_min_overlap, 3),
                'x_max': round(x_max_overlap, 3),
                'y_min': round(y_min_overlap, 3),
                'y_max': round(y_max_overlap, 3),
                'z_min': round(z_min_overlap, 3),
                'z_max': round(z_max_overlap, 3)
            },
            'severity': 'CRITICAL' if vol_m3 > 5.0 else 'WARNING'
        }

    return None
