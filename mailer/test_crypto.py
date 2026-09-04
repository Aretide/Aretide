"""Tests for mailer.crypto - PII encryption at rest."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from mailer.crypto import decrypt_text, encrypt_text, pii_key
from mailer.store import load_patients, save_patients
from mailer.testing_support import make_patient


class CryptoTests(unittest.TestCase):
    def test_round_trip(self) -> None:
        key = pii_key()
        token = encrypt_text("Alex", key)
        self.assertNotIn("Alex", token)
        self.assertEqual(decrypt_text(token, key), "Alex")

    def test_store_hides_plaintext(self) -> None:
        key = pii_key()
        patient = make_patient()
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            save_patients(path, [patient], key)
            raw = path.read_text(encoding="utf-8")
            self.assertNotIn("alex@example.com", raw)
            self.assertNotIn("Alex", raw)
            loaded = load_patients(path, key)
            self.assertEqual(loaded[0].email, "alex@example.com")
            locked = load_patients(path, None)
            self.assertEqual(locked[0].email, "***")


