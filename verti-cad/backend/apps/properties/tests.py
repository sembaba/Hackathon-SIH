from django.test import TestCase
from rest_framework.test import APIClient
from apps.parcels.models import Parcel
from apps.buildings.models import Building
from apps.floors.models import Floor
from apps.properties.models import PropertyUnit

class PropertyAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.parcel = Parcel.objects.create(
            parcel_number='001245',
            area=2500.0,
            geometry={'type': 'Polygon', 'coordinates': [[[78.16, 29.94], [78.17, 29.94], [78.17, 29.95], [78.16, 29.95], [78.16, 29.94]]]}
        )
        self.building = Building.objects.create(
            parcel=self.parcel,
            building_code='B07',
            name='VERTI Tower',
            height=21.0,
            geometry_2d={'type': 'Polygon', 'coordinates': [[[78.162, 29.942], [78.168, 29.942], [78.168, 29.948], [78.162, 29.948], [78.162, 29.942]]]}
        )
        self.floor = Floor.objects.create(
            building=self.building,
            floor_number=5,
            floor_label='Floor 5',
            level_code='F05',
            z_min=15.0,
            z_max=18.0
        )
        self.unit = PropertyUnit.objects.create(
            floor=self.floor,
            unit_number='503',
            owner_name='Demo Owner',
            area=125.0,
            z_min=15.0,
            z_max=18.0,
            geometry={'type': 'Polygon', 'coordinates': [[[78.162, 29.942], [78.165, 29.942], [78.165, 29.945], [78.162, 29.945], [78.162, 29.942]]]}
        )

    def test_get_parcels_api(self):
        res = self.client.get('/api/parcels/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data.get('results', res.data)), 1)

    def test_get_properties_api(self):
        res = self.client.get('/api/properties/')
        self.assertEqual(res.status_code, 200)

    def test_analytics_api(self):
        res = self.client.get('/api/analytics/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('kpis', res.data)
        self.assertIn('total_parcels', res.data['kpis'])
