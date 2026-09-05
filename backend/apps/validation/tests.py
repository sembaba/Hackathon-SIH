from django.test import TestCase
from apps.parcels.models import Parcel
from apps.buildings.models import Building, BuildingType
from apps.floors.models import Floor
from apps.properties.models import PropertyUnit, PropertyType
from apps.validation.engine import TopologyValidationEngine
from apps.validation.models import ValidationIssue, IssueType

class ValidationEngineTests(TestCase):
    def setUp(self):
        self.parcel = Parcel.objects.create(
            parcel_number='TEST-001',
            area=2000.0,
            ground_elevation=280.0,
            geometry={
                'type': 'Polygon',
                'coordinates': [[[78.1, 29.9], [78.2, 29.9], [78.2, 30.0], [78.1, 30.0], [78.1, 29.9]]]
            }
        )
        self.building = Building.objects.create(
            parcel=self.parcel,
            building_code='B01',
            name='Test Building',
            height=20.0,
            geometry_2d={
                'type': 'Polygon',
                'coordinates': [[[78.12, 29.92], [78.18, 29.92], [78.18, 29.98], [78.12, 29.98], [78.12, 29.92]]]
            }
        )
        self.floor5 = Floor.objects.create(
            building=self.building,
            floor_number=5,
            floor_label='Floor 5',
            level_code='F05',
            z_min=15.0,
            z_max=18.0
        )

    def test_vertical_overlap_detection(self):
        """Overlapping vertical ranges on same footprint must trigger VERTICAL_OVERLAP."""
        quad_geom = {
            'type': 'Polygon',
            'coordinates': [[[78.12, 29.92], [78.15, 29.92], [78.15, 29.95], [78.12, 29.95], [78.12, 29.92]]]
        }
        # Unit 503: 15m to 18m
        u503 = PropertyUnit.objects.create(
            floor=self.floor5,
            unit_number='503',
            area=100.0,
            z_min=15.0,
            z_max=18.0,
            geometry=quad_geom
        )
        # Unit 504: 17m to 20m (overlaps vertically 17m-18m)
        u504 = PropertyUnit.objects.create(
            floor=self.floor5,
            unit_number='504',
            area=100.0,
            z_min=17.0,
            z_max=20.0,
            geometry=quad_geom
        )

        engine = TopologyValidationEngine()
        issues = engine.run_all_validations()

        vert_overlaps = [i for i in issues if i.issue_type == IssueType.VERTICAL_OVERLAP]
        self.assertGreaterEqual(len(vert_overlaps), 1)
        self.assertIn('503', vert_overlaps[0].message)
        self.assertIn('504', vert_overlaps[0].message)

    def test_non_overlapping_vertical_properties(self):
        """Properties on different floors with disjoint Z ranges must not trigger vertical overlap."""
        quad_geom = {
            'type': 'Polygon',
            'coordinates': [[[78.12, 29.92], [78.15, 29.92], [78.15, 29.95], [78.12, 29.95], [78.12, 29.92]]]
        }
        floor4 = Floor.objects.create(
            building=self.building,
            floor_number=4,
            floor_label='Floor 4',
            level_code='F04',
            z_min=12.0,
            z_max=15.0
        )
        # Unit 401: 12m to 15m
        PropertyUnit.objects.create(
            floor=floor4,
            unit_number='401',
            area=100.0,
            z_min=12.0,
            z_max=15.0,
            geometry=quad_geom
        )
        # Unit 501: 15m to 18m
        PropertyUnit.objects.create(
            floor=self.floor5,
            unit_number='501',
            area=100.0,
            z_min=15.0,
            z_max=18.0,
            geometry=quad_geom
        )

        engine = TopologyValidationEngine()
        issues = engine.run_all_validations()
        vert_overlaps = [i for i in issues if i.issue_type == IssueType.VERTICAL_OVERLAP]
        self.assertEqual(len(vert_overlaps), 0)
