#!/usr/bin/env python3
"""Tests for the patient mailer. No live SMTP."""

from __future__ import annotations

import os
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

os.environ["ABANDONED_PII_KEY"] = "unit-test-key"

from mailer.campaigns import load_campaigns
from mailer.crypto import data_key_from_secret, decrypt_text, encrypt_text, pii_key
from mailer.store import (
    CampaignState,
    Patient,
    campaign_summary,
    enroll,
    load_patients,
    parse_time,
    plan_sends,
    save_patients,
    set_enrollment,
)


def make_patient(**overrides: object) -> Patient:
    now = datetime(2026, 8, 26, 9, 0, tzinfo=__import__("mailer.store", fromlist=["DENVER"]).DENVER)
    campaigns = {cid: CampaignState() for cid in load_campaigns()}
    campaigns["abandoned"] = enroll(CampaignState(), now)
    base = dict(
        id="alex",
        first_name="Alex",
        email="alex@example.com",
        interest="weight-loss care",
        product="weight-loss",
        status="abandoned",
        abandoned_at=now,
        cta_url="https://hive.beemahealth.com",
        campaigns=campaigns,
    )
    base.update(overrides)
    return Patient(**base)  # type: ignore[arg-type]


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


class CampaignTests(unittest.TestCase):
    def test_loads_json_campaigns(self) -> None:
        campaigns = load_campaigns()
        self.assertIn("abandoned", campaigns)
        self.assertIn("marketing", campaigns)
        self.assertIn("checkin", campaigns)

    def test_abandoned_due_after_10m(self) -> None:
        from mailer.store import DENVER

        start = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        patient = make_patient(abandoned_at=start)
        patient.campaigns["abandoned"].enrolled_at = start
        campaign = load_campaigns()["abandoned"]
        early = plan_sends([patient], campaign, start + timedelta(minutes=5))
        self.assertEqual(early, [])
        due = plan_sends([patient], campaign, start + timedelta(minutes=12))
        self.assertEqual(due[0].step.id, "10m")

    def test_can_enroll_in_two_campaigns(self) -> None:
        from mailer.store import DENVER

        now = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        patient = make_patient()
        patient = set_enrollment(patient, "marketing", True, now)
        patient = set_enrollment(patient, "abandoned", True, now)
        self.assertTrue(patient.campaigns["abandoned"].enrolled)
        self.assertTrue(patient.campaigns["marketing"].enrolled)
        summary = campaign_summary(patient, load_campaigns()["marketing"], now)
        self.assertTrue(summary["enrolled"])

    def test_parse_human_time(self) -> None:
        parsed = parse_time("2026-08-26 9:37")
        assert parsed is not None
        self.assertEqual(parsed.hour, 9)
        self.assertEqual(parsed.minute, 37)

    def test_parse_iso_microseconds(self) -> None:
        parsed = parse_time("2026-08-26T12:06:16.580981-06:00")
        assert parsed is not None
        self.assertEqual(parsed.second, 16)

    def test_html_uses_lockup_and_name(self) -> None:
        from mailer.emailing import render_html

        patient = make_patient()
        step = load_campaigns()["abandoned"].steps[0]
        html = render_html(patient, step, "https://hive.beemahealth.com", year=2026)
        self.assertIn("Hi Alex,", html)
        self.assertIn("cid:beema-lockup", html)
        self.assertNotIn("\u2014", html)


if __name__ == "__main__":
    unittest.main()
