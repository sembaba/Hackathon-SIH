from django.test import TestCase
from .engine import generate_ulpin, generate_3d_ulpin, validate_ulpin, decode_ulpin

class ULPINEngineTests(TestCase):
    def test_ulpin_determinism(self):
        """Same property parameters must always produce identical ULPIN."""
        ulpin1 = generate_ulpin('UT', 'HW', '001245', 'B07', 5, '503', 375.0)
        ulpin2 = generate_ulpin('UT', 'HW', '001245', 'B07', 5, '503', 375.0)
        self.assertEqual(ulpin1, ulpin2)
        self.assertEqual(ulpin1, 'ULPIN-P001245-B07-F05-U503-VOL773')

    def test_different_units_produce_different_ulpins(self):
        """Different units must produce distinct ULPINs."""
        ulpin_a = generate_ulpin('UT', 'HW', '001245', 'B07', 5, '503')
        ulpin_b = generate_ulpin('UT', 'HW', '001245', 'B07', 5, '504')
        ulpin_c = generate_ulpin('UT', 'HW', '001245', 'B07', 4, '403')
        self.assertNotEqual(ulpin_a, ulpin_b)
        self.assertNotEqual(ulpin_a, ulpin_c)

    def test_basement_level_code(self):
        """Negative floor levels must produce 'Bxx' level codes and correct hash."""
        ulpin_b2 = generate_ulpin('UT', 'HW', '001245', 'B07', -2, '001', 900.0)
        self.assertTrue(ulpin_b2.startswith('ULPIN-P001245-B07-B02-U001-VOL'))

    def test_validate_ulpin(self):
        """Valid and invalid ULPIN formats must be accurately identified."""
        # Standard 3D
        valid_3d = 'ULPIN-P001245-B07-F05-U503-VOL773'
        is_val, msg = validate_ulpin(valid_3d)
        self.assertTrue(is_val)

        # Legacy format
        valid_legacy = 'IN-UT-HW-001245-B07-F05-U503'
        is_val_leg, _ = validate_ulpin(valid_legacy)
        self.assertTrue(is_val_leg)

        is_val_bad, msg_bad = validate_ulpin('INVALID-ULPIN-FORMAT')
        self.assertFalse(is_val_bad)

    def test_decode_3d_ulpin(self):
        """3D ULPIN decoding deconstructs into accurate hierarchy and volume hash."""
        decoded = decode_ulpin('ULPIN-P001245-B07-F05-U503-VOL773')
        self.assertEqual(decoded['parcel_code'], 'P001245')
        self.assertEqual(decoded['building_code'], 'B07')
        self.assertEqual(decoded['level_code'], 'F05')
        self.assertEqual(decoded['floor_number'], 5)
        self.assertEqual(decoded['unit_code'], 'U503')
        self.assertEqual(decoded['volume_hash'], 'VOL773')
        self.assertIn('hierarchy', decoded)

    def test_decode_legacy_ulpin(self):
        """Legacy ULPIN decoding preserves backward compatibility."""
        decoded = decode_ulpin('IN-UT-HW-001245-B07-F05-U503')
        self.assertEqual(decoded['state_code'], 'UT')
        self.assertEqual(decoded['district_code'], 'HW')
        self.assertEqual(decoded['parcel_code'], '001245')
        self.assertEqual(decoded['building_code'], 'B07')
        self.assertEqual(decoded['level_code'], 'F05')
        self.assertEqual(decoded['floor_number'], 5)
        self.assertEqual(decoded['unit_code'], 'U503')
