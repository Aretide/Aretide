"""Tests for mailer.engine - patient CRUD, duplication, bulk import, sends."""

from __future__ import annotations

import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

from mailer.campaigns import load_campaigns
from mailer.crypto import pii_key
from mailer.store import load_patients, plan_sends, save_patients, set_enrollment
from mailer.testing_support import make_patient


class EngineTests(unittest.TestCase):
    def test_ignore_due_rejected_in_prod(self) -> None:
        from mailer.engine import send_campaign
        from mailer.crypto import ConfigError
        from dataclasses import replace
        from mailer.store import DENVER

        campaign = replace(load_campaigns()["abandoned"], ready=True)
        with self.assertRaises(ConfigError):
            send_campaign(
                [],
                campaign,
                datetime(2026, 8, 26, 12, 0, tzinfo=DENVER),
                key=b"0" * 32,
                patient_ids=None,
                force_to="",
                dry_run=True,
                mode="prod",
                ignore_due=True,
            )


    def test_blank_last_step_starts_at_first(self) -> None:
        from mailer.engine import update_patient
        from mailer.store import DENVER

        key = pii_key()
        now = datetime(2026, 8, 26, 12, 0, tzinfo=DENVER)
        patient = make_patient()
        patient.campaigns["post-purchase-thank-you"].enrolled = True
        patient.campaigns["post-purchase-thank-you"].enrolled_at = now
        patient.campaigns["post-purchase-thank-you"].last_step = "thanks"
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            save_patients(path, [patient], key)
            loaded = load_patients(path, key)
            updated = update_patient(
                loaded,
                "alex",
                key=key,
                now=now,
                first_name="Alex",
                email="alex@example.com",
                interest="weight-loss care",
                product="weight-loss",
                status="abandoned",
                abandoned_at="2026-08-26 9:00",
                cta_url="https://hive.beemahealth.com",
                campaigns_update={
                    "post-purchase-thank-you": {
                        "enrolled": True,
                        "last_step": "",
                        "last_sent_at": "",
                    }
                },
                path=path,
            )
            self.assertIsNone(updated.campaigns["post-purchase-thank-you"].last_step)
            due = plan_sends(
                [updated],
                load_campaigns()["post-purchase-thank-you"],
                now,
            )
            self.assertEqual(due[0].step.id, "thanks")


    def test_add_patient_does_not_auto_enroll_abandoned(self) -> None:
        from mailer.engine import add_patient
        from mailer.store import DENVER

        key = pii_key()
        now = datetime(2026, 8, 26, 12, 0, tzinfo=DENVER)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            save_patients(path, [], key)
            patients = load_patients(path, key)
            added = add_patient(
                patients,
                first_name="Inno",
                email="inno@example.com",
                interest="weight-loss care",
                product="weight-loss",
                status="abandoned",
                abandoned_at="2026-08-26 9:37",
                campaign_ids=["post-purchase-thank-you"],
                key=key,
                now=now,
                path=path,
            )
            self.assertFalse(added.campaigns["abandoned"].enrolled)
            self.assertTrue(added.campaigns["post-purchase-thank-you"].enrolled)

    def test_update_patient_fields(self) -> None:
        from mailer.engine import update_patient
        from mailer.store import DENVER

        key = pii_key()
        patient = make_patient()
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            save_patients(path, [patient], key)
            loaded = load_patients(path, key)
            now = datetime(2026, 8, 26, 12, 0, tzinfo=DENVER)
            updated = update_patient(
                loaded,
                "alex",
                key=key,
                now=now,
                first_name="Stacy",
                email="stacy@example.com",
                interest="weight-loss care",
                product="weight-loss",
                status="active",
                abandoned_at="",
                cta_url="https://hive.beemahealth.com",
                campaigns_update={
                    "post-purchase-thank-you": {
                        "enrolled": True,
                        "last_step": "",
                        "last_sent_at": "",
                    }
                },
                path=path,
            )
            self.assertEqual(updated.first_name, "Stacy")
            self.assertEqual(updated.email, "stacy@example.com")
            self.assertTrue(updated.campaigns["post-purchase-thank-you"].enrolled)
            self.assertNotIn("alex@example.com", path.read_text(encoding="utf-8"))

    def test_delete_patient(self) -> None:
        from mailer.engine import delete_patient

        key = pii_key()
        patient = make_patient()
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            save_patients(path, [patient], key)
            loaded = load_patients(path, key)
            delete_patient(loaded, "alex", key=key, path=path)
            self.assertEqual(load_patients(path, key), [])



    def test_duplicate_patient_to_prod_carries_full_state(self) -> None:
        from mailer.crypto import ConfigError
        from mailer.engine import duplicate_patient_to_prod
        from mailer.mode import patients_path
        from mailer.store import DENVER, load_patients

        key = pii_key()
        start = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        dev = make_patient(first_name="Matt", email="matt@example.com", abandoned_at=start)
        dev.campaigns["abandoned"].enrolled = True
        dev.campaigns["abandoned"].enrolled_at = start
        dev.campaigns["abandoned"].last_step = "15m"
        dev.campaigns["abandoned"].last_sent_at = start + timedelta(minutes=16)
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            save_patients(patients_path("dev", data), [dev], key)
            save_patients(patients_path("prod", data), [], key)

            clone = duplicate_patient_to_prod(dev.id, key=key, data_dir=data)
            self.assertNotEqual(clone.id, dev.id)

            prod = load_patients(patients_path("prod", data), key)
            self.assertEqual(len(prod), 1)
            copied = prod[0]
            self.assertEqual(copied.email, "matt@example.com")
            self.assertEqual(copied.abandoned_at, start)
            state = copied.campaigns["abandoned"]
            self.assertTrue(state.enrolled)
            self.assertEqual(state.enrolled_at, start)
            self.assertEqual(state.last_step, "15m")
            self.assertEqual(state.last_sent_at, start + timedelta(minutes=16))
            # Dev copy is untouched and independent.
            still_dev = load_patients(patients_path("dev", data), key)
            self.assertEqual(len(still_dev), 1)
            self.assertEqual(still_dev[0].id, dev.id)
            # Duplicating the same Dev patient again is refused - the email is
            # already in Prod.
            with self.assertRaises(ConfigError):
                duplicate_patient_to_prod(dev.id, key=key, data_dir=data)

    def _bulk_campaign_dir(self, directory: Path) -> Path:
        from mailer.campaigns import save_campaign

        campaigns_dir = directory / "campaigns"
        campaigns_dir.mkdir(parents=True, exist_ok=True)
        save_campaign(
            {
                "id": "abandoned",
                "label": "Abandoned checkout",
                "anchor": "abandoned_at",
                "cta_url": "https://hive.beemahealth.com",
                "steps": [
                    {"id": "10m", "delay": "10m", "subject": "s", "body": ["x"]},
                    {"id": "72h", "delay": "72h", "subject": "s", "body": ["x"]},
                    {"id": "7d", "delay": "7d", "subject": "s", "body": ["x"]},
                    {"id": "14d", "delay": "14d", "subject": "s", "body": ["x"]},
                ],
            },
            campaigns_dir,
        )
        return campaigns_dir

    def test_bulk_add_patients_assigns_step_by_elapsed_time(self) -> None:
        from mailer.engine import bulk_add_patients
        from mailer.mode import patients_path
        from mailer.store import DENVER, load_patients

        key = pii_key()
        now = datetime(2026, 8, 27, 12, 0, tzinfo=DENVER)
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            campaigns_dir = self._bulk_campaign_dir(data)
            save_patients(patients_path("prod", data), [], key)
            rows = [
                {  # abandoned 13 days ago -> past 7d, not past 14d
                    "first_name": "Karen",
                    "email": "karen@example.com",
                    "abandoned_at": (now - timedelta(days=13)).isoformat(),
                },
                {  # abandoned 6 days ago -> past 72h, not past 7d
                    "first_name": "Sara",
                    "email": "sara@example.com",
                    "abandoned_at": (now - timedelta(days=6)).isoformat(),
                },
                {  # abandoned 2 minutes ago -> before the first step
                    "first_name": "New",
                    "email": "new@example.com",
                    "abandoned_at": (now - timedelta(minutes=2)).isoformat(),
                },
            ]
            report = bulk_add_patients(
                rows,
                key=key,
                mode="prod",
                default_campaign="abandoned",
                now=now,
                data_dir=data,
                campaigns_directory=campaigns_dir,
            )
            by_email = {row["email"]: row for row in report["added"]}
            self.assertEqual(by_email["karen@example.com"]["last_step"], "7d")
            self.assertEqual(by_email["karen@example.com"]["next_step"], "14d")
            self.assertEqual(by_email["sara@example.com"]["last_step"], "72h")
            self.assertEqual(by_email["sara@example.com"]["next_step"], "7d")
            self.assertIsNone(by_email["new@example.com"]["last_step"])
            self.assertEqual(by_email["new@example.com"]["next_step"], "10m")
            self.assertEqual(report["counts"], {"added": 3, "skipped": 0})

            prod = load_patients(patients_path("prod", data), key)
            self.assertEqual(len(prod), 3)
            karen = next(p for p in prod if p.email == "karen@example.com")
            state = karen.campaigns["abandoned"]
            self.assertTrue(state.enrolled)
            self.assertEqual(state.last_step, "7d")
            self.assertEqual(state.last_sent_at, now - timedelta(days=13))

    def test_bulk_add_patients_skips_existing_and_in_batch_duplicates(self) -> None:
        from mailer.engine import bulk_add_patients
        from mailer.mode import patients_path
        from mailer.store import DENVER

        key = pii_key()
        now = datetime(2026, 8, 27, 12, 0, tzinfo=DENVER)
        existing = make_patient(email="karen@example.com")
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            campaigns_dir = self._bulk_campaign_dir(data)
            save_patients(patients_path("prod", data), [existing], key)
            rows = [
                {"first_name": "Karen", "email": "karen@example.com", "abandoned_at": now.isoformat()},
                {"first_name": "Dup", "email": "dup@example.com", "abandoned_at": now.isoformat()},
                {"first_name": "Dup2", "email": "dup@example.com", "abandoned_at": now.isoformat()},
                {"first_name": "Bad", "email": "not-an-email", "abandoned_at": now.isoformat()},
            ]
            report = bulk_add_patients(
                rows,
                key=key,
                mode="prod",
                default_campaign="abandoned",
                now=now,
                data_dir=data,
                campaigns_directory=campaigns_dir,
            )
            self.assertEqual(report["counts"], {"added": 1, "skipped": 3})
            reasons = {row["email"]: row["reason"] for row in report["skipped"]}
            self.assertIn("already in prod", reasons["karen@example.com"])
            self.assertEqual(reasons["dup@example.com"], "duplicate row in this upload")
            self.assertEqual(reasons["not-an-email"], "invalid email")

    def test_bulk_add_patients_dry_run_does_not_persist(self) -> None:
        from mailer.engine import bulk_add_patients
        from mailer.mode import patients_path
        from mailer.store import DENVER, load_patients

        key = pii_key()
        now = datetime(2026, 8, 27, 12, 0, tzinfo=DENVER)
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp)
            campaigns_dir = self._bulk_campaign_dir(data)
            save_patients(patients_path("prod", data), [], key)
            report = bulk_add_patients(
                [{"first_name": "Karen", "email": "karen@example.com", "abandoned_at": now.isoformat()}],
                key=key,
                mode="prod",
                default_campaign="abandoned",
                dry_run=True,
                now=now,
                data_dir=data,
                campaigns_directory=campaigns_dir,
            )
            self.assertEqual(report["counts"], {"added": 1, "skipped": 0})
            self.assertEqual(load_patients(patients_path("prod", data), key), [])


    def test_prod_send_blocks_unready_campaign(self) -> None:
        from mailer.engine import send_campaign
        from mailer.crypto import ConfigError

        from dataclasses import replace

        campaign = replace(load_campaigns()["abandoned"], ready=False)
        with self.assertRaises(ConfigError):
            send_campaign(
                [],
                campaign,
                datetime(2026, 8, 26, 12, 0),
                key=b"0" * 32,
                patient_ids=None,
                force_to="",
                dry_run=True,
                mode="prod",
            )


    def test_reset_patient_progress_keeps_send_log(self) -> None:
        from mailer.store import (
            DENVER,
            append_send,
            load_send_log,
            record_send,
            reset_patient_progress,
            save_patients,
        )

        key = pii_key()
        now = datetime(2026, 8, 26, 12, 0, tzinfo=DENVER)
        campaign = load_campaigns()["abandoned"]
        patient = record_send(make_patient(), campaign.id, "10m", now)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            sends: list = []
            append_send(
                sends,
                patient=patient,
                campaign=campaign,
                step_id="10m",
                subject="Finish your Beema Health visit",
                now=now,
            )
            save_patients(path, [patient], key, sends=sends)

            reset = reset_patient_progress(path, [patient], key)
            self.assertIsNone(reset[0].campaigns[campaign.id].last_step)
            self.assertIsNone(reset[0].campaigns[campaign.id].last_sent_at)

            still_logged = load_send_log(path, key)
            self.assertEqual(len(still_logged), 1)
            self.assertEqual(still_logged[0].step_id, "10m")

    def test_clear_send_log_keeps_patient_progress(self) -> None:
        from mailer.store import (
            DENVER,
            append_send,
            clear_send_log,
            load_patients,
            load_send_log,
            record_send,
            save_patients,
        )

        key = pii_key()
        now = datetime(2026, 8, 26, 12, 0, tzinfo=DENVER)
        campaign = load_campaigns()["abandoned"]
        patient = record_send(make_patient(), campaign.id, "10m", now)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "patients.json"
            sends: list = []
            append_send(
                sends,
                patient=patient,
                campaign=campaign,
                step_id="10m",
                subject="Finish your Beema Health visit",
                now=now,
            )
            save_patients(path, [patient], key, sends=sends)

            clear_send_log(path, [patient], key)

            self.assertEqual(load_send_log(path, key), [])
            reloaded = load_patients(path, key)
            self.assertEqual(reloaded[0].campaigns[campaign.id].last_step, "10m")

    def test_render_historical_send_uses_pinned_version(self) -> None:
        from dataclasses import replace as data_replace

        from mailer.campaigns import save_campaign
        from mailer.engine import render_historical_send
        from mailer.store import DENVER, SendRecord

        payload = {
            "id": "trial-render",
            "label": "Trial",
            "cta_url": "https://hive.beemahealth.com",
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Old subject", "body": ["Hello."]},
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            v1 = save_campaign(payload, directory)
            self.assertEqual(v1.version, 1)

            payload["steps"][0]["subject"] = "New subject"
            v2 = save_campaign(payload, directory)
            self.assertEqual(v2.version, 2)

            patient = make_patient()
            record = SendRecord(
                id="send-1",
                patient_id=patient.id,
                first_name=patient.first_name,
                email=patient.email,
                campaign_id="trial-render",
                campaign_label="Trial",
                step_id="one",
                subject="Old subject",
                sent_at=datetime(2026, 8, 26, 12, 0, tzinfo=DENVER),
                campaign_version=1,
                step_version=1,
            )
            result = render_historical_send(record, [patient], directory=directory)
            self.assertEqual(result["subject"], "Old subject")
            self.assertIsNone(result["note"])

            # A campaign_version that no longer exists in history falls back
            # to the current live copy, with a note explaining the fallback.
            missing_version_record = data_replace(record, campaign_version=999)
            fallback = render_historical_send(
                missing_version_record, [patient], directory=directory
            )
            self.assertEqual(fallback["subject"], "New subject")
            self.assertIsNotNone(fallback["note"])


    def test_serialize_patient_includes_unready_campaigns_when_given_all(self) -> None:
        from dataclasses import replace
        from mailer.campaigns import visible_campaigns
        from mailer.engine import serialize_patient
        from mailer.store import DENVER

        now = datetime(2026, 8, 26, 9, 0, tzinfo=DENVER)
        ready = replace(load_campaigns()["abandoned"], ready=True)
        draft = replace(load_campaigns()["marketing"], id="draft", ready=False)
        all_campaigns = {ready.id: ready, draft.id: draft}
        patient = make_patient()
        patient = set_enrollment(patient, draft.id, True, now)

        full = serialize_patient(patient, all_campaigns, now, reveal=True)
        full_ids = {c["id"] for c in full["campaigns"]}
        self.assertIn(ready.id, full_ids)
        self.assertIn(draft.id, full_ids)

        prod_only = serialize_patient(
            patient, visible_campaigns(all_campaigns, "prod"), now, reveal=True
        )
        prod_ids = {c["id"] for c in prod_only["campaigns"]}
        self.assertIn(ready.id, prod_ids)
        self.assertNotIn(draft.id, prod_ids)


