"""Tests for mailer.store - timing, enrollment, send log."""

from __future__ import annotations

import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

from mailer.campaigns import load_campaigns
from mailer.crypto import pii_key
from mailer.store import (
    campaign_summary,
    parse_time,
    plan_sends,
    save_patients,
    set_enrollment,
)
from mailer.testing_support import make_patient


class CampaignTests(unittest.TestCase):
    def _abandoned_like(self):
        # A fixed abandoned-style campaign so these timing tests do not depend
        # on whatever steps campaigns/abandoned.json currently has.
        from mailer.campaigns import campaign_from_payload

        return campaign_from_payload(
            {
                "id": "abandoned",
                "label": "Abandoned checkout",
                "anchor": "abandoned_at",
                "cta_url": "https://hive.beemahealth.com",
                "steps": [
                    {"id": "10m", "delay": "10m", "subject": "Finish", "body": ["Come back."]},
                    {"id": "1h", "delay": "1h", "subject": "Still open", "body": ["Come back."]},
                ],
            }
        )


    def test_abandoned_due_after_10m(self) -> None:
        from mailer.store import DENVER

        start = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        patient = make_patient(abandoned_at=start)
        patient.campaigns["abandoned"].enrolled_at = start
        campaign = self._abandoned_like()
        early = plan_sends([patient], campaign, start + timedelta(minutes=5))
        self.assertEqual(early, [])
        due = plan_sends([patient], campaign, start + timedelta(minutes=12))
        self.assertEqual(due[0].step.id, "10m")


    def test_ignore_due_forces_next_step_early(self) -> None:
        from mailer.store import DENVER

        start = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        patient = make_patient(abandoned_at=start)
        patient.campaigns["abandoned"].enrolled_at = start
        campaign = self._abandoned_like()
        # Not due yet under the normal time constraint.
        early = plan_sends([patient], campaign, start + timedelta(minutes=1))
        self.assertEqual(early, [])
        # Forced: still respects step order (next after last_step), just skips the wait.
        forced = plan_sends(
            [patient], campaign, start + timedelta(minutes=1), ignore_due=True
        )
        self.assertEqual(forced[0].step.id, "10m")
        # The real time constraint is untouched for a normal (non-forced) call.
        still_early = plan_sends([patient], campaign, start + timedelta(minutes=1))
        self.assertEqual(still_early, [])


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



class SendLogTests(unittest.TestCase):
    def test_send_log_round_trip(self) -> None:
        from mailer.store import append_send, load_send_log, save_patients

        key = pii_key()
        patient = make_patient()
        campaign = load_campaigns()["abandoned"]
        now = datetime(2026, 8, 26, 12, 0, tzinfo=__import__("mailer.store", fromlist=["DENVER"]).DENVER)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            save_patients(path, [patient], key, sends=[])
            sends = []
            append_send(
                sends,
                patient=patient,
                campaign=campaign,
                step_id="10m",
                subject="Finish your Beema Health visit",
                now=now,
            )
            save_patients(path, [patient], key, sends=sends)
            loaded = load_send_log(path, key)
            self.assertEqual(len(loaded), 1)
            self.assertEqual(loaded[0].email, "alex@example.com")
            self.assertEqual(loaded[0].step_id, "10m")
            raw = path.read_text(encoding="utf-8")
            self.assertNotIn("alex@example.com", raw)

    def test_send_record_carries_versions(self) -> None:
        from dataclasses import replace as data_replace

        from mailer.store import DENVER, append_send, load_send_log, save_patients

        key = pii_key()
        patient = make_patient()
        campaign = data_replace(load_campaigns()["abandoned"], version=3)
        step = data_replace(campaign.steps[0], version=2)
        now = datetime(2026, 8, 26, 12, 0, tzinfo=DENVER)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            save_patients(path, [patient], key, sends=[])
            sends = []
            append_send(
                sends,
                patient=patient,
                campaign=campaign,
                step_id=step.id,
                subject="Finish your Beema Health visit",
                now=now,
                campaign_version=campaign.version,
                step_version=step.version,
            )
            save_patients(path, [patient], key, sends=sends)
            loaded = load_send_log(path, key)
            self.assertEqual(loaded[0].campaign_version, 3)
            self.assertEqual(loaded[0].step_version, 2)

    def test_old_send_rows_default_to_version_one(self) -> None:
        from mailer.store import send_from_row

        record = send_from_row(
            {
                "id": "abc123",
                "patient_id": "alex",
                "campaign_id": "abandoned",
                "campaign_label": "Abandoned checkout",
                "step_id": "10m",
                "sent_at": "2026-08-26T12:00:00-06:00",
            },
            None,
        )
        self.assertEqual(record.campaign_version, 1)
        self.assertEqual(record.step_version, 1)

    def test_clear_history_rejected_in_prod(self) -> None:
        from mailer.engine import clear_send_history
        from mailer.crypto import ConfigError

        with self.assertRaises(ConfigError):
            clear_send_history(
                [],
                key=b"0" * 32,
                path=Path("/tmp/unused-patients.json"),
                mode="prod",
            )


class SummaryTests(unittest.TestCase):
    def test_campaign_summary_includes_ready(self) -> None:
        from dataclasses import replace
        from mailer.store import DENVER

        now = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        patient = make_patient()
        ready = replace(load_campaigns()["abandoned"], ready=True)
        draft = replace(ready, id="draft", ready=False)
        self.assertEqual(campaign_summary(patient, ready, now)["ready"], True)
        self.assertEqual(campaign_summary(patient, draft, now)["ready"], False)

