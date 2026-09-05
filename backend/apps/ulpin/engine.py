"""
VERTI-CAD 3D ULPIN Engine.
Standardized Format: ULPIN-[PARCEL_ID]-[BUILDING_ID]-[FLOOR_ID]-[UNIT_ID]-[VOL_HASH]
Example: ULPIN-P001245-B07-F05-U503-VOL773
Legacy Format: IN-[STATE]-[DISTRICT]-[PARCEL]-[BUILDING]-[LEVEL]-[UNIT]
Example: IN-UT-HW-001245-B07-F05-U503

Disclaimer: Prototype 3D ULPIN / Demonstration Identifier for research & hackathon prototyping (SIH 2026).
"""
import re
from typing import Dict, Any, Tuple, Optional

# New Standard 3D ULPIN regex: ULPIN-P001245-B07-F05-U503-VOL773
ULPIN_3D_REGEX = re.compile(
    r'^ULPIN-(?P<parcel>P[0-9]{4,10})-(?P<building>[A-Z0-9]{2,8})-(?P<level>[BGF][0-9]{2})-(?P<unit>[A-Z0-9]{3,6})-(?P<vol_hash>VOL[0-9]{3})$'
)

# Legacy Administrative ULPIN regex: IN-UT-HW-001245-B07-F05-U503
ULPIN_LEGACY_REGEX = re.compile(
    r'^IN-(?P<state>[A-Z]{2})-(?P<district>[A-Z]{2})-(?P<parcel>[A-Z0-9]{4,12})-(?P<building>[A-Z0-9]{2,8})-(?P<level>[BGF][0-9]{2})-(?P<unit>[A-Z0-9]{3,6})$'
)

def djb2_hash(s: str) -> int:
    """Deterministic DJB2 string hash matching frontend implementation."""
    h = 5381
    for ch in s:
        h = (((h << 5) + h) ^ ord(ch)) & 0xFFFFFFFF
        if h & 0x80000000:
            h = -((~h & 0xFFFFFFFF) + 1)
    return abs(h)

def compute_volume_hash(
    parcel_id: str,
    building_id: str,
    floor_id: str,
    unit_id: str,
    volume: float = 375.0
) -> str:
    """Generate 3-digit volume hash: VOLxxx."""
    seed = f"{parcel_id}:{building_id}:{floor_id}:{unit_id}:{round(volume * 100)}"
    h = djb2_hash(seed)
    return f"VOL{h % 1000:03d}"

def format_level_code(floor_number: int) -> str:
    """Format floor integer into standard level code e.g. -2 -> B02, 0 -> G00, 5 -> F05."""
    if floor_number < 0:
        return f"B{abs(floor_number):02d}"
    elif floor_number == 0:
        return "G00"
    else:
        return f"F{floor_number:02d}"

def format_unit_code(unit_number: str) -> str:
    """Format unit identifier into standard padded code e.g. '503' -> 'U503'."""
    clean = str(unit_number).strip().upper()
    if clean.startswith('U'):
        clean = clean[1:]
    if clean.isdigit():
        return f"U{int(clean):03d}"
    return f"U{clean[:5]}"

def normalize_parcel_id(parcel_number: str) -> str:
    """Normalize parcel into standardized P001245 format."""
    digits = re.sub(r'[^0-9]', '', str(parcel_number))
    if digits:
        return f"P{int(digits):06d}"
    clean = re.sub(r'[^A-Z0-9]', '', str(parcel_number).upper())
    return f"P{clean[:6]}"

def generate_3d_ulpin(
    parcel_number: str,
    building_code: str,
    floor_number: int,
    unit_number: str,
    volume: float = 375.0
) -> str:
    """
    Generate new standardized 3D ULPIN format:
    ULPIN-[PARCEL_ID]-[BUILDING_ID]-[FLOOR_ID]-[UNIT_ID]-[VOL_HASH]
    """
    parcel_id = normalize_parcel_id(parcel_number)
    bld = re.sub(r'[^A-Z0-9]', '', str(building_code).upper())
    if not bld.startswith('B'):
        bld = f"B{bld}"
    level_id = format_level_code(floor_number)
    unit_id = format_unit_code(unit_number)
    vol_hash = compute_volume_hash(parcel_id, bld, level_id, unit_id, volume)
    return f"ULPIN-{parcel_id}-{bld}-{level_id}-{unit_id}-{vol_hash}"

def generate_ulpin(
    state_code: str = 'UT',
    district_code: str = 'HW',
    parcel_number: str = 'P-001245',
    building_code: str = 'B07',
    floor_number: int = 5,
    unit_number: str = 'U503',
    volume: float = 375.0
) -> str:
    """Default generator returns new standardized 3D ULPIN."""
    return generate_3d_ulpin(parcel_number, building_code, floor_number, unit_number, volume)

def validate_ulpin(ulpin_string: str) -> Tuple[bool, str]:
    """Validate either standard 3D ULPIN or legacy administrative syntax."""
    if not ulpin_string:
        return False, "ULPIN string is empty."
    
    cleaned = ulpin_string.strip().upper()
    if ULPIN_3D_REGEX.match(cleaned):
        return True, "Valid standard 3D ULPIN syntax with volumetric hash."
    if ULPIN_LEGACY_REGEX.match(cleaned):
        return True, "Valid legacy administrative 3D ULPIN syntax."
    
    return False, f"Invalid ULPIN '{cleaned}'. Expected ULPIN-PXXXXXX-BXX-FXX-UXXX-VOLXXX or IN-ST-DI-PARCEL-BLD-LVL-UNIT."

def decode_ulpin(ulpin_string: str) -> Dict[str, Any]:
    """Deconstruct any valid ULPIN string into its hierarchy components."""
    cleaned = ulpin_string.strip().upper()
    
    # Check 3D Standard
    m_3d = ULPIN_3D_REGEX.match(cleaned)
    if m_3d:
        gd = m_3d.groupdict()
        level_code = gd['level']
        if level_code.startswith('B'):
            floor_number = -int(level_code[1:])
            level_name = f"Basement -{int(level_code[1:])}"
        elif level_code.startswith('G'):
            floor_number = 0
            level_name = "Ground Floor"
        else:
            floor_number = int(level_code[1:])
            level_name = f"Floor {floor_number}"
            
        return {
            'ulpin': cleaned,
            'standard': '3D_ULPIN_V2',
            'parcel_code': gd['parcel'],
            'building_code': gd['building'],
            'level_code': level_code,
            'floor_number': floor_number,
            'level_name': level_name,
            'unit_code': gd['unit'],
            'raw_unit_number': gd['unit'].lstrip('U'),
            'volume_hash': gd['vol_hash'],
            'hierarchy': {
                'level_0_parcel': f"{gd['parcel']} (2D Surface Cadastral Parcel)",
                'level_1_building': f"{gd['building']} (3D Building Envelope)",
                'level_2_floor': f"{level_code} (3D Floor Slab)",
                'level_3_unit': f"{gd['unit']} (3D Volumetric Property Unit)",
                'level_4_volume': f"{gd['vol_hash']} (Spatial Volume Identifier)"
            },
            'is_prototype': True,
            'disclaimer': 'Prototype 3D ULPIN / Demonstration Identifier (SIH 2026)'
        }
    
    # Check Legacy
    m_leg = ULPIN_LEGACY_REGEX.match(cleaned)
    if m_leg:
        gd = m_leg.groupdict()
        level_code = gd['level']
        if level_code.startswith('B'):
            floor_number = -int(level_code[1:])
            level_name = f"Basement -{int(level_code[1:])}"
        elif level_code.startswith('G'):
            floor_number = 0
            level_name = "Ground Floor"
        else:
            floor_number = int(level_code[1:])
            level_name = f"Floor {floor_number}"
            
        return {
            'ulpin': cleaned,
            'standard': 'ADMIN_LEGACY_V1',
            'country': 'India',
            'state_code': gd['state'],
            'district_code': gd['district'],
            'parcel_code': gd['parcel'],
            'building_code': gd['building'],
            'level_code': level_code,
            'floor_number': floor_number,
            'level_name': level_name,
            'unit_code': gd['unit'],
            'raw_unit_number': gd['unit'].lstrip('U'),
            'is_prototype': True,
            'disclaimer': 'Prototype 3D ULPIN / Demonstration Identifier'
        }
        
    raise ValueError(f"Cannot decode invalid 3D ULPIN: '{ulpin_string}'")
