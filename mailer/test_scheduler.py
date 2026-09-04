"""Tests for mailer.scheduler - the in-process campaign automation thread."""

from __future__ import annotations

import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

from mailer.crypto import pii_key
from mailer.testing_support import make_patient


class SchedulerTests(unittest.TestCase):
    def test_normalize_interval_and_weekly(self) -> None:
        from mailer.campaigns import normalize_schedule, schedule_summary

        i = normalize_schedule(
            {"enabled": True, "kind": "interval", "every_minutes": 90}
        )
        self.assertEqual(i, {"enabled": True, "kind": "interval", "every_minutes": 90})
        self.assertEqual(schedule_summary(i), "Every 90 minutes")

        with self.assertRaises(ValueError):
            normalize_schedule(
                {"enabled": True, "kind": "weekly", "days": ["mon"], "time": "8:00"}
            )
        w = normalize_schedule(
            {"enabled": True, "kind": "weekly", "days": ["fri", "mon", "mon"], "time": "08:00"}
        )
        self.assertEqual(w["days"], ["mon", "fri"])  # canonical order, deduped
        self.assertEqual(schedule_summary(w), "Weekly on Mon, Fri at 08:00 (Denver)")

    def test_normalize_rejects_bad_and_keeps_disabled_config(self) -> None:
        from mailer.campaigns import normalize_schedule

        with self.assertRaises(ValueError):
            normalize_schedule({"enabled": True, "kind": "interval", "every_minutes": 0})
        with self.assertRaises(ValueError):
            normalize_schedule({"enabled": True, "kind": "weekly", "days": []})
        with self.assertRaises(ValueError):
            normalize_schedule({"enabled": True, "kind": "nope"})
        # Disabled weekly with days set is allowed and kept.
        off = normalize_schedule(
            {"enabled": False, "kind": "weekly", "days": ["tue"], "time": "07:30"}
        )
        self.assertEqual(off, {"enabled": False, "kind": "weekly", "days": ["tue"], "time": "07:30"})

    def test_is_due_interval(self) -> None:
        from mailer.scheduler import is_due
        from mailer.store import DENVER

        now = datetime(2026, 8, 27, 15, 0, tzinfo=DENVER)
        s = {"enabled": True, "kind": "interval", "every_minutes": 60}
        self.assertFalse(is_due(s, None, now))  # first sight: arm, do not fire
        self.assertFalse(is_due(s, now - timedelta(minutes=45), now))
        self.assertTrue(is_due(s, now - timedelta(minutes=61), now))
        self.assertFalse(is_due({**s, "enabled": False}, now - timedelta(hours=5), now))

    def test_is_due_weekly(self) -> None:
        from mailer.scheduler import is_due, last_scheduled_instant
        from mailer.store import DENVER

        # 2026-08-27 is a Thursday.
        now = datetime(2026, 8, 27, 15, 0, tzinfo=DENVER)
        s = {"enabled": True, "kind": "weekly", "days": ["mon", "wed", "fri"], "time": "09:00"}
        instant = last_scheduled_instant(s["days"], s["time"], now)
        self.assertEqual(instant, datetime(2026, 8, 26, 9, 0, tzinfo=DENVER))  # Wed 9am
        self.assertTrue(is_due(s, datetime(2026, 8, 24, 0, 0, tzinfo=DENVER), now))
        self.assertFalse(is_due(s, datetime(2026, 8, 26, 10, 0, tzinfo=DENVER), now))

    def test_schedule_round_trips_through_save(self) -> None:
        from mailer.campaigns import load_campaigns, save_campaign

        payload = {
            "id": "sched-trip",
            "label": "Sched trip",
            "cta_url": "https://hive.beemahealth.com",
            "schedule": {"enabled": True, "kind": "interval", "every_minutes": 120},
            "steps": [
                {"id": "one", "delay": "0m", "subject": "Hi", "body": ["Hello."]}
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            campaign = save_campaign(payload, Path(tmp))
            self.assertEqual(campaign.schedule["every_minutes"], 120)
            reloaded = load_campaigns(Path(tmp))["sched-trip"]
            self.assertEqual(reloaded.schedule, {"enabled": True, "kind": "interval", "every_minutes": 120})

    def test_tick_arms_first_seen_schedule_without_sending(self) -> None:
        from mailer.scheduler import tick

        with tempfile.TemporaryDirectory() as tmp:
            state_path = Path(tmp) / "scheduler.json"
            tick(state_path=state_path)
            import json as _json

            if state_path.is_file():
                state = _json.loads(state_path.read_text())
                for entry in state.values():
                    # Armed, never "sent" on the very first pass.
                    self.assertNotIn("sent", str(entry.get("last_result") or ""))

    def test_set_paused_stops_tick_and_resume_resets_every_enabled_clock(self) -> None:
        import json
        from unittest.mock import patch

        from mailer import scheduler
        from mailer.campaigns import campaign_from_payload
        from mailer.store import DENVER

        now = datetime(2026, 8, 27, 12, 0, tzinfo=DENVER)
        campaign = campaign_from_payload(
            {
                "id": "abandoned",
                "label": "Abandoned checkout",
                "anchor": "abandoned_at",
                "cta_url": "https://hive.beemahealth.com",
                "schedule": {"enabled": True, "kind": "interval", "every_minutes": 60},
                "steps": [{"id": "10m", "delay": "10m", "subject": "s", "body": ["x"]}],
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            state_path = Path(tmp) / "scheduler.json"
            # Seeded as badly overdue - due to fire the moment a tick runs.
            state_path.write_text(
                json.dumps({"abandoned": {"last_run": (now - timedelta(hours=2)).isoformat()}})
            )
            with patch("mailer.scheduler.load_campaigns", return_value={"abandoned": campaign}):
                self.assertFalse(scheduler.is_paused(state_path=state_path))

                scheduler.set_paused(True, state_path=state_path, now=now)
                self.assertTrue(scheduler.is_paused(state_path=state_path))

                # Paused: tick is a total no-op, even though overdue.
                result = scheduler.tick(now=now + timedelta(minutes=1), state_path=state_path)
                self.assertEqual(
                    result,
                    {"ran": [], "at": (now + timedelta(minutes=1)).isoformat(), "paused": True},
                )
                unchanged = scheduler.load_state(state_path)
                self.assertEqual(
                    unchanged["abandoned"]["last_run"], (now - timedelta(hours=2)).isoformat()
                )

                # Resume: the clock resets to a fresh full interval from right
                # now, not from wherever the old overdue last_run left it -
                # so it does not immediately fire a catch-up send.
                resume_at = now + timedelta(minutes=5)
                scheduler.set_paused(False, state_path=state_path, now=resume_at)
                self.assertFalse(scheduler.is_paused(state_path=state_path))
                resumed_state = scheduler.load_state(state_path)
                self.assertEqual(resumed_state["abandoned"]["last_run"], resume_at.isoformat())
                self.assertFalse(
                    scheduler.is_due(campaign.schedule, resume_at, resume_at + timedelta(minutes=1))
                )

    def test_preview_next_run_dry_runs_without_sending_or_touching_state(self) -> None:
        from unittest.mock import patch

        from mailer import scheduler
        from mailer.campaigns import campaign_from_payload
        from mailer.store import DENVER, load_patients, save_patients

        key = pii_key()
        now = datetime(2026, 8, 27, 12, 0, tzinfo=DENVER)
        patient = make_patient(abandoned_at=now - timedelta(hours=2))
        patient.campaigns["abandoned"].enrolled = True
        patient.campaigns["abandoned"].enrolled_at = now - timedelta(hours=2)
        campaign = campaign_from_payload(
            {
                "id": "abandoned",
                "label": "Abandoned checkout",
                "anchor": "abandoned_at",
                "cta_url": "https://hive.beemahealth.com",
                "schedule": {"enabled": True, "kind": "interval", "every_minutes": 60},
                "steps": [{"id": "10m", "delay": "10m", "subject": "s", "body": ["x"]}],
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            store = Path(tmp) / "patients.json"
            save_patients(store, [patient], key)
            state_path = Path(tmp) / "scheduler.json"
            with (
                patch("mailer.scheduler.load_campaigns", return_value={"abandoned": campaign}),
                patch("mailer.scheduler.try_pii_key", return_value=key),
                patch("mailer.scheduler.read_mode", return_value="dev"),
                patch("mailer.scheduler.patients_path", return_value=store),
            ):
                result = scheduler.preview_next_run(state_path=state_path)
            self.assertEqual(result["mode"], "dev")
            self.assertFalse(result["paused"])
            self.assertEqual(result["skipped"], [])
            self.assertEqual(len(result["items"]), 1)
            self.assertEqual(result["items"][0]["campaign_id"], "abandoned")
            self.assertEqual(result["items"][0]["step"], "10m")
            # Dry run - nothing was actually recorded as sent.
            reloaded = load_patients(store, key)
            self.assertIsNone(reloaded[0].campaigns["abandoned"].last_step)

    def test_run_all_now_sends_due_campaigns_and_skips_unready(self) -> None:
        from unittest.mock import patch

        from mailer import scheduler
        from mailer.campaigns import campaign_from_payload

        key = pii_key()
        due_campaign = campaign_from_payload(
            {
                "id": "abandoned",
                "label": "Abandoned checkout",
                "anchor": "abandoned_at",
                "cta_url": "https://hive.beemahealth.com",
                "ready": True,
                "schedule": {"enabled": True, "kind": "interval", "every_minutes": 60},
                "steps": [{"id": "10m", "delay": "10m", "subject": "s", "body": ["x"]}],
            }
        )
        unready_campaign = campaign_from_payload(
            {
                "id": "checkin",
                "label": "Check-in",
                "anchor": "enrolled_at",
                "cta_url": "https://hive.beemahealth.com",
                "ready": False,
                "schedule": {"enabled": True, "kind": "interval", "every_minutes": 60},
                "steps": [{"id": "10m", "delay": "10m", "subject": "s", "body": ["x"]}],
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            state_path = Path(tmp) / "scheduler.json"
            with (
                patch(
                    "mailer.scheduler.load_campaigns",
                    return_value={"abandoned": due_campaign, "checkin": unready_campaign},
                ),
                patch("mailer.scheduler.try_pii_key", return_value=key),
                patch("mailer.scheduler.read_mode", return_value="prod"),
                patch("mailer.scheduler.patients_path", return_value=Path(tmp) / "patients.json"),
                patch("mailer.scheduler.load_patients", return_value=[]),
                # Faked, real SMTP is never exercised by this test suite -
                # only that run_all_now asks for a real (non-dry-run) send.
                patch("mailer.scheduler.send_campaign", return_value=[{"patient_id": "p1"}]) as mock_send,
            ):
                result = scheduler.run_all_now(state_path=state_path)
            self.assertEqual(result["mode"], "prod")
            self.assertEqual(len(result["results"]), 1)
            self.assertEqual(result["results"][0]["campaign_id"], "abandoned")
            self.assertEqual(result["results"][0]["sent"], "1 email(s) sent")
            self.assertEqual(len(result["skipped"]), 1)
            self.assertEqual(result["skipped"][0]["campaign_id"], "checkin")
            self.assertFalse(mock_send.call_args.kwargs["dry_run"])
            # State stamped so the schedule does not immediately fire again.
            state = scheduler.load_state(state_path)
            self.assertIn("last_run", state["abandoned"])
            self.assertNotIn("checkin", state)

    def test_preview_next_run_skips_unready_campaigns_in_prod(self) -> None:
        from unittest.mock import patch

        from mailer import scheduler
        from mailer.campaigns import campaign_from_payload
        from mailer.store import DENVER, save_patients

        key = pii_key()
        now = datetime(2026, 8, 27, 12, 0, tzinfo=DENVER)
        patient = make_patient(abandoned_at=now - timedelta(hours=2))
        campaign = campaign_from_payload(
            {
                "id": "abandoned",
                "label": "Abandoned checkout",
                "anchor": "abandoned_at",
                "cta_url": "https://hive.beemahealth.com",
                "ready": False,
                "schedule": {"enabled": True, "kind": "interval", "every_minutes": 60},
                "steps": [{"id": "10m", "delay": "10m", "subject": "s", "body": ["x"]}],
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            store = Path(tmp) / "patients.json"
            save_patients(store, [patient], key)
            state_path = Path(tmp) / "scheduler.json"
            with (
                patch("mailer.scheduler.load_campaigns", return_value={"abandoned": campaign}),
                patch("mailer.scheduler.try_pii_key", return_value=key),
                patch("mailer.scheduler.read_mode", return_value="prod"),
                patch("mailer.scheduler.patients_path", return_value=store),
            ):
                result = scheduler.preview_next_run(state_path=state_path)
        self.assertEqual(result["items"], [])
        self.assertEqual(len(result["skipped"]), 1)
        self.assertEqual(result["skipped"][0]["campaign_id"], "abandoned")


