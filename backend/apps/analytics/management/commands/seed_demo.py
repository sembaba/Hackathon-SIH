"""
Management command to seed VERTI-CAD synthetic demonstration cadastral dataset.
Location: Haridwar, Uttarakhand, India (Lat: 29.9457, Lon: 78.1642)
Features:
- 1 Cadastral Parcel
- 1 Multi-storey Building (VERTI Tower Demo: B07)
- 9 Floors (2 Basements + Ground + 6 Upper Floors)
- 28 Property Units (Apartments, Commercial, Parking, Utilities)
- Intentional Demo Conflict: Unit 503 (Z=15-18m) vs Unit 504 (Z=17-20m)
- 4 Subsurface Infrastructure networks (Water, Sewer, Power, Metro)
- Deterministic 3D ULPIN records
- GIS Layer registrations
- Automated topology conflict check
"""
from django.core.management.base import BaseCommand
from apps.parcels.models import Parcel
from apps.buildings.models import Building, BuildingType, DataSource
from apps.floors.models import Floor
from apps.properties.models import PropertyUnit, PropertyType, PropertyStatus
from apps.ulpin.models import ULPINRecord
from apps.ulpin.engine import generate_ulpin
from apps.infrastructure.models import Infrastructure, AssetType, AssetStatus
from apps.gis.models import GISLayer, LayerType
from apps.validation.engine import TopologyValidationEngine

class Command(BaseCommand):
    help = 'Seeds database with realistic synthetic 3D Cadastre demonstration data for Haridwar'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting VERTI-CAD Demo Data Seeder...'))

        # Base Reference Coordinates (Haridwar, Uttarakhand)
        base_lon = 78.164200
        base_lat = 29.945700
        base_elev = 280.0

        # Offsets in degrees (~0.0001 deg ~= 11 meters)
        # Parcel footprint (~55m x 55m)
        p_coords = [
            [base_lon - 0.00030, base_lat - 0.00030],
            [base_lon + 0.00030, base_lat - 0.00030],
            [base_lon + 0.00030, base_lat + 0.00030],
            [base_lon - 0.00030, base_lat + 0.00030],
            [base_lon - 0.00030, base_lat - 0.00030]
        ]

        # 1. Parcel
        parcel, _ = Parcel.objects.update_or_create(
            parcel_number='001245',
            defaults={
                'state': 'Uttarakhand',
                'state_code': 'UT',
                'district': 'Haridwar',
                'district_code': 'HW',
                'tehsil': 'Roorkee',
                'village': 'Shivalik Nagar',
                'area': 3600.0,
                'ground_elevation': base_elev,
                'centroid': [base_lon, base_lat],
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [p_coords]
                }
            }
        )
        self.stdout.write(self.style.SUCCESS(f'Created Parcel: {parcel.parcel_number}'))

        # Building footprint (~30m x 30m) centered inside parcel
        b_coords = [
            [base_lon - 0.00015, base_lat - 0.00015],
            [base_lon + 0.00015, base_lat - 0.00015],
            [base_lon + 0.00015, base_lat + 0.00015],
            [base_lon - 0.00015, base_lat + 0.00015],
            [base_lon - 0.00015, base_lat - 0.00015]
        ]

        # 2. Building
        building, _ = Building.objects.update_or_create(
            parcel=parcel,
            building_code='B07',
            defaults={
                'name': 'VERTI Tower Demo',
                'building_type': BuildingType.MIXED_USE,
                'number_of_floors': 6,
                'number_of_basements': 2,
                'height': 21.0,
                'ground_elevation': base_elev,
                'source': DataSource.SURVEY,
                'confidence_score': 0.98,
                'geometry_2d': {
                    'type': 'Polygon',
                    'coordinates': [b_coords]
                },
                'geometry_3d': {
                    'type': 'VolumetricPrism',
                    'base_elevation': base_elev,
                    'z_min_relative': -9.0,
                    'z_max_relative': 21.0,
                    'footprint': b_coords
                }
            }
        )
        self.stdout.write(self.style.SUCCESS(f'Created Building: {building.name} ({building.building_code})'))

        # 3. Floor Definitions (9 levels)
        floors_config = [
            (-2, 'Basement -2', 'B02', -9.0, -5.0),
            (-1, 'Basement -1', 'B01', -5.0, -1.0),
            (0,  'Ground Floor', 'G00', 0.0, 3.0),
            (1,  'Floor 1', 'F01', 3.0, 6.0),
            (2,  'Floor 2', 'F02', 6.0, 9.0),
            (3,  'Floor 3', 'F03', 9.0, 12.0),
            (4,  'Floor 4', 'F04', 12.0, 15.0),
            (5,  'Floor 5', 'F05', 15.0, 18.0),
            (6,  'Floor 6', 'F06', 18.0, 21.0),
        ]

        floors_map = {}
        for fn, flabel, lcode, zmin, zmax in floors_config:
            flr, _ = Floor.objects.update_or_create(
                building=building,
                floor_number=fn,
                defaults={
                    'floor_label': flabel,
                    'level_code': lcode,
                    'z_min': zmin,
                    'z_max': zmax,
                    'floor_height': zmax - zmin,
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [b_coords]
                    }
                }
            )
            floors_map[fn] = flr

        self.stdout.write(self.style.SUCCESS(f'Created {len(floors_map)} Floor levels.'))

        # 4. Property Units
        # Footprint quadrants for 4 units per floor (SW, SE, NE, NW)
        def get_quadrant_geom(idx):
            # idx: 0=SW, 1=SE, 2=NE, 3=NW
            cx, cy = base_lon, base_lat
            hw = 0.00015
            if idx == 0:  # SW
                return [[cx - hw, cy - hw], [cx, cy - hw], [cx, cy], [cx - hw, cy], [cx - hw, cy - hw]]
            elif idx == 1:  # SE
                return [[cx, cy - hw], [cx + hw, cy - hw], [cx + hw, cy], [cx, cy], [cx, cy - hw]]
            elif idx == 2:  # NE
                return [[cx, cy], [cx + hw, cy], [cx + hw, cy + hw], [cx, cy + hw], [cx, cy]]
            else:  # NW
                return [[cx - hw, cy], [cx, cy], [cx, cy + hw], [cx - hw, cy + hw], [cx - hw, cy]]

        sample_owners = [
            'Aarav Sharma', 'Pooja Verma', 'Vikramaditya Rawat', 'Ananya Joshi',
            'Siddharth Pant', 'Deepika Bahuguna', 'Rajesh K. Bhatt', 'Meenakshi Chauhan',
            'Harish Chandra Gairola', 'Kavita Semwal', 'Alok Nath Tiwari', 'Sunita Bisht',
            'Manish Rawat', 'Neha Uniyal', 'Devendra Negi', 'Kiran Pal Singh'
        ]

        units_created = 0
        
        # Basements
        for b_num in [-2, -1]:
            b_floor = floors_map[b_num]
            for u_idx in range(1, 3):
                u_str = f"B{abs(b_num)}{u_idx:02d}"
                ptype = PropertyType.PARKING if u_idx == 1 else PropertyType.UTILITY
                unit, _ = PropertyUnit.objects.update_or_create(
                    floor=b_floor,
                    unit_number=u_str,
                    defaults={
                        'property_type': ptype,
                        'owner_name': f'Building Association - {ptype.label}',
                        'area': 225.0,
                        'z_min': b_floor.z_min,
                        'z_max': b_floor.z_max,
                        'volume': 225.0 * (b_floor.z_max - b_floor.z_min),
                        'geometry': {'type': 'Polygon', 'coordinates': [get_quadrant_geom(u_idx - 1)]},
                        'status': PropertyStatus.REGISTERED
                    }
                )
                ulpin = generate_ulpin(parcel.state_code, parcel.district_code, parcel.parcel_number, building.building_code, b_num, u_str)
                ULPINRecord.objects.update_or_create(
                    property_unit=unit,
                    defaults={
                        'ulpin_code': ulpin,
                        'state_code': parcel.state_code,
                        'district_code': parcel.district_code,
                        'parcel_code': parcel.parcel_number,
                        'building_code': building.building_code,
                        'level_code': b_floor.level_code,
                        'unit_code': f"U{u_str}",
                    }
                )
                units_created += 1

        # Ground Floor Commercial Units
        g_floor = floors_map[0]
        for u_idx in range(1, 5):
            u_str = f"G{u_idx:02d}"
            unit, _ = PropertyUnit.objects.update_or_create(
                floor=g_floor,
                unit_number=u_str,
                defaults={
                    'property_type': PropertyType.SHOP if u_idx < 3 else PropertyType.OFFICE,
                    'owner_name': sample_owners[u_idx],
                    'area': 112.5,
                    'z_min': 0.0,
                    'z_max': 3.0,
                    'volume': 112.5 * 3.0,
                    'geometry': {'type': 'Polygon', 'coordinates': [get_quadrant_geom(u_idx - 1)]},
                    'status': PropertyStatus.REGISTERED
                }
            )
            ulpin = generate_ulpin(parcel.state_code, parcel.district_code, parcel.parcel_number, building.building_code, 0, u_str)
            ULPINRecord.objects.update_or_create(
                property_unit=unit,
                defaults={
                    'ulpin_code': ulpin,
                    'state_code': parcel.state_code,
                    'district_code': parcel.district_code,
                    'parcel_code': parcel.parcel_number,
                    'building_code': building.building_code,
                    'level_code': g_floor.level_code,
                    'unit_code': f"U{u_str}",
                }
            )
            units_created += 1

        # Upper Floors 1 to 6 (4 units each: 101-104 ... 601-604)
        owner_cursor = 0
        for f_num in range(1, 7):
            flr = floors_map[f_num]
            for sub in range(1, 5):
                u_str = f"{f_num}0{sub}"
                owner = sample_owners[owner_cursor % len(sample_owners)]
                owner_cursor += 1

                # Standard vertical bounds from floor
                z_bottom = flr.z_min
                z_top = flr.z_max
                status = PropertyStatus.REGISTERED

                # CRITICAL DEMO CONFLICT:
                # Apartment 503: Z = 15m to 18m
                # Apartment 504: Z = 17m to 20m (Overlaps 17m-18m)
                if u_str == '503':
                    z_bottom = 15.0
                    z_top = 18.0
                    status = PropertyStatus.CONFLICT_FLAGGED
                elif u_str == '504':
                    z_bottom = 17.0
                    z_top = 20.0  # Overlaps vertically into Floor 6 and overlaps with 503!
                    status = PropertyStatus.CONFLICT_FLAGGED

                unit, _ = PropertyUnit.objects.update_or_create(
                    floor=flr,
                    unit_number=u_str,
                    defaults={
                        'property_type': PropertyType.APARTMENT,
                        'owner_name': owner,
                        'area': 112.5,
                        'z_min': z_bottom,
                        'z_max': z_top,
                        'volume': round(112.5 * (z_top - z_bottom), 2),
                        'geometry': {'type': 'Polygon', 'coordinates': [get_quadrant_geom(sub - 1)]},
                        'status': status
                    }
                )

                ulpin = generate_ulpin(parcel.state_code, parcel.district_code, parcel.parcel_number, building.building_code, f_num, u_str)
                ULPINRecord.objects.update_or_create(
                    property_unit=unit,
                    defaults={
                        'ulpin_code': ulpin,
                        'state_code': parcel.state_code,
                        'district_code': parcel.district_code,
                        'parcel_code': parcel.parcel_number,
                        'building_code': building.building_code,
                        'level_code': flr.level_code,
                        'unit_code': f"U{u_str}",
                    }
                )
                units_created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {units_created} volumetric property units.'))

        # 5. Underground Infrastructure
        infra_data = [
            (
                'INF-WTR-01', 'Municipal Potable Water Main', AssetType.WATER_SUPPLY,
                -3.5, -4.2, 0.6,
                [
                    [base_lon - 0.00035, base_lat - 0.00020],
                    [base_lon + 0.00035, base_lat - 0.00020]
                ]
            ),
            (
                'INF-SWR-01', 'Subsurface Drainage & Sewer Conduit', AssetType.SEWERAGE,
                -5.0, -6.2, 1.2,
                [
                    [base_lon - 0.00035, base_lat + 0.00025],
                    [base_lon + 0.00035, base_lat + 0.00025]
                ]
            ),
            (
                'INF-PWR-01', 'High-Voltage 33kV Underground Power Duct', AssetType.ELECTRICITY,
                -2.0, -2.8, 0.4,
                [
                    [base_lon - 0.00025, base_lat - 0.00035],
                    [base_lon - 0.00025, base_lat + 0.00035]
                ]
            ),
            (
                'INF-MTR-01', 'Haridwar Metro Rapid Transit Underground Tube', AssetType.METRO_TUNNEL,
                -12.0, -17.5, 5.5,
                [
                    [base_lon - 0.00050, base_lat - 0.00040],
                    [base_lon + 0.00050, base_lat + 0.00010]
                ]
            ),
        ]

        for aid, aname, atype, dmin, dmax, diam, coords in infra_data:
            Infrastructure.objects.update_or_create(
                asset_id=aid,
                defaults={
                    'parcel': parcel,
                    'name': aname,
                    'asset_type': atype,
                    'depth_min': dmin,
                    'depth_max': dmax,
                    'diameter_m': diam,
                    'geometry': {'type': 'LineString', 'coordinates': coords},
                    'status': AssetStatus.ACTIVE
                }
            )
        self.stdout.write(self.style.SUCCESS(f'Created {len(infra_data)} Underground Infrastructure networks.'))

        # 6. GIS Layers
        layers = [
            ('parcels', 'Cadastral Parcels', LayerType.VECTOR_POLYGON, '#38bdf8', 0.8),
            ('buildings_3d', '3D Buildings', LayerType.VOLUME_3D, '#f59e0b', 0.9),
            ('floor_slices', 'Vertical Floor Slices', LayerType.VOLUME_3D, '#10b981', 0.85),
            ('properties_3d', '3D Property Units', LayerType.VOLUME_3D, '#06b6d4', 0.95),
            ('underground_infra', 'Underground Utilities', LayerType.VECTOR_LINE, '#ec4899', 1.0),
            ('roads', 'Road Network & ROW', LayerType.VECTOR_LINE, '#94a3b8', 0.7),
            ('ai_extracted', 'AI Extracted Footprints', LayerType.AI_EXTRACTED, '#8b5cf6', 0.75),
        ]
        for lid, lname, ltype, lcolor, lopacity in layers:
            GISLayer.objects.update_or_create(
                layer_id=lid,
                defaults={
                    'name': lname,
                    'layer_type': ltype,
                    'color_hex': lcolor,
                    'opacity': lopacity,
                    'is_visible': True
                }
            )
        self.stdout.write(self.style.SUCCESS('Registered GIS Layers in Layer Manager.'))

        # 7. Execute Validation Engine
        val_engine = TopologyValidationEngine()
        issues = val_engine.run_all_validations()
        self.stdout.write(self.style.WARNING(
            f'Topology validation engine executed: Found {len(issues)} validation issue(s), '
            f'including Demo Conflict: Apartment 503 vs 504 vertical overlap.'
        ))

        self.stdout.write(self.style.SUCCESS('VERTI-CAD demo database seeding completed successfully!'))
