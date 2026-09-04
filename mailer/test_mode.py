"""Tests for mailer.mode - dev/prod patient-file separation."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from mailer.testing_support import make_patient  # noqa: F401  (sets env var)


class ModeTests(unittest.TestCase):
    def test_dev_and_prod_use_separate_patient_files(self) -> None:
        from mailer.mode import patients_path

        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            self.assertNotEqual(patients_path("dev", data), patients_path("prod", data))
            self.assertIn("dev", str(patients_path("dev", data)))
            self.assertIn("prod", str(patients_path("prod", data)))

    def test_legacy_patients_copy_into_dev_only(self) -> None:
        from mailer.mode import migrate_legacy_patients

        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            legacy = data / "legacy.json"
            legacy.write_text('{"patients":[]}\n', encoding="utf-8")
            migrate_legacy_patients(data, legacy)
            self.assertTrue((data / "dev" / "patients.json").is_file())
            self.assertFalse((data / "prod" / "patients.json").is_file())

