"""In-process campaign automation.

A background thread inside the running mailer UI. Every TICK_SECONDS it checks
each campaign that has an enabled schedule, and if that schedule's window has
come due it sends that campaign's due steps (one next step per patient, exactly
like clicking "Send due emails").

In-process only: nothing runs while the laptop is asleep or `./mailer.sh` is
closed. On wake the loop resumes and the very next tick catches up any window it
slept through, because "due" is computed from the clock and a persisted
last-run timestamp, not from a live timer.

A global pause switch (`is_paused`/`set_paused`) stops every campaign at
once - the Patients tab's "Pause automation" button. Resuming resets every
enabled campaign's clock to a fresh full interval from that moment, so
turning automation back on never immediately fires a backlog of catch-up
sends from however long it was paused.

State lives in data/scheduler.json - campaign ids, timestamps, a short result
string, and the last error. No PHI. Gitignored per machine.
"""

from __future__ import annotations

import json
import threading
import traceback
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from zoneinfo import ZoneInfo

from mailer.campaigns import WEEKDAYS, load_campaigns, schedule_summary
from mailer.crypto import try_pii_key
from mailer.engine import send_campaign
from mailer.mode import DATA_DIR, patients_path, read_mode
from mailer.store import load_patients

DENVER = ZoneInfo("America/Denver")
TICK_SECONDS = 30
STATE_PATH = DATA_DIR / "scheduler.json"

# Reserved state-dict key for the global pause switch, alongside the
# per-campaign entries. Campaign ids can only be lowercase letters, numbers,
# and hyphens (see CAMPAIGN_ID_RE in campaigns.py), so this can never
# collide with a real campaign.
GLOBAL_KEY = "__global__"


def _now() -> datetime:
    return datetime.now(tz=DENVER)


def _parse_dt(value: object) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def load_state(path: Path = STATE_PATH) -> dict[str, dict[str, Any]]:
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    return data if isinstance(data, dict) else {}


def save_state(state: dict[str, dict[str, Any]], path: Path = STATE_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def last_scheduled_instant(
    days: list[str], time_str: str, now: datetime
) -> datetime | None:
    """The most recent datetime on one of `days` at `time_str` that is <= now."""
    try:
        hour, minute = (int(part) for part in time_str.split(":"))
    except ValueError:
        return None
    best: datetime | None = None
    for back in range(0, 8):
        day = (now - timedelta(days=back)).date()
        if WEEKDAYS[day.weekday()] not in days:
            continue
        candidate = datetime(
            day.year, day.month, day.day, hour, minute, tzinfo=DENVER
        )
        if candidate <= now and (best is None or candidate > best):
            best = candidate
    return best


def is_due(schedule: dict | None, last_run: datetime | None, now: datetime) -> bool:
    """True if this schedule should fire now, given when it last fired."""
    if not schedule or not schedule.get("enabled"):
        return False
    if last_run is None:
        # First time we have seen this enabled schedule - arm it, do not fire.
        return False
    kind = schedule.get("kind") or "interval"
    if kind == "interval":
        minutes = max(1, int(schedule.get("every_minutes") or 60))
        return (now - last_run) >= timedelta(minutes=minutes)
    if kind == "weekly":
        instant = last_scheduled_instant(
            schedule.get("days") or [], schedule.get("time") or "09:00", now
        )
        return instant is not None and last_run < instant
    return False


def next_due(schedule: dict | None, last_run: datetime | None, now: datetime) -> datetime | None:
    """Best-effort estimate of the next fire time, for display only."""
    if not schedule or not schedule.get("enabled"):
        return None
    kind = schedule.get("kind") or "interval"
    if kind == "interval":
        minutes = max(1, int(schedule.get("every_minutes") or 60))
        base = last_run or now
        nxt = base + timedelta(minutes=minutes)
        return nxt if nxt > now else now
    if kind == "weekly":
        try:
            hour, minute = (int(p) for p in str(schedule.get("time") or "09:00").split(":"))
        except ValueError:
            return None
        days = schedule.get("days") or []
        for ahead in range(0, 8):
            day = (now + timedelta(days=ahead)).date()
            if WEEKDAYS[day.weekday()] not in days:
                continue
            candidate = datetime(day.year, day.month, day.day, hour, minute, tzinfo=DENVER)
            if candidate > now:
                return candidate
    return None


def _run_campaign(campaign, *, key: bytes, mode: str, now: datetime) -> dict[str, Any]:
    store = patients_path(mode)
    patients = load_patients(store, key)
    preview = send_campaign(
        patients,
        campaign,
        now,
        key=key,
        patient_ids=None,
        force_to="",
        dry_run=False,
        path=store,
        mode=mode,
    )
    return {
        "last_run": now.isoformat(),
        "last_result": f"{len(preview)} email(s) sent",
        "last_error": None,
    }


def run_now(campaign_id: str, *, state_path: Path = STATE_PATH) -> dict[str, Any]:
    """Fire one campaign's due sends immediately (the "Run now" button).

    Behaves exactly like a scheduled tick for that campaign, including stamping
    last_run so the schedule does not immediately fire again.
    """
    campaign = load_campaigns().get(campaign_id)
    if campaign is None:
        raise ValueError("Unknown campaign.")
    key = try_pii_key()
    if key is None:
        raise ValueError("Unlock PII (names and emails) before running a campaign.")
    mode = read_mode()
    now = _now()
    state = load_state(state_path)
    entry = dict(state.get(campaign_id) or {})
    try:
        entry.update(_run_campaign(campaign, key=key, mode=mode, now=now))
    except Exception as exc:  # noqa: BLE001 - surface any send failure to the UI
        entry["last_attempt"] = now.isoformat()
        entry["last_error"] = str(exc)[:300]
        state[campaign_id] = entry
        save_state(state, state_path)
        raise ValueError(str(exc)) from exc
    state[campaign_id] = entry
    save_state(state, state_path)
    return entry


def is_paused(state_path: Path = STATE_PATH) -> bool:
    state = load_state(state_path)
    return bool((state.get(GLOBAL_KEY) or {}).get("paused"))


def set_paused(
    value: bool, *, state_path: Path = STATE_PATH, now: datetime | None = None
) -> dict[str, Any]:
    """Global automation kill switch for every campaign at once.

    Pausing stops the very next tick from running anything, immediately.
    Resuming resets every enabled campaign's clock to a fresh full interval
    starting now, rather than picking back up from wherever the old last_run
    left it - which could fire right away if the pause outlasted the
    interval. "Turn it back on" should feel like starting the wait over, not
    like catching up on lost time.
    """
    now = now or _now()
    state = load_state(state_path)
    state[GLOBAL_KEY] = {"paused": value, "changed_at": now.isoformat()}
    if not value:
        for cid, campaign in load_campaigns().items():
            schedule = campaign.schedule
            if not schedule or not schedule.get("enabled"):
                continue
            entry = dict(state.get(cid) or {})
            entry["last_run"] = now.isoformat()
            state[cid] = entry
    save_state(state, state_path)
    return state[GLOBAL_KEY]


def preview_next_run(*, state_path: Path = STATE_PATH) -> dict[str, Any]:
    """Dry-run every automation-enabled campaign to see who is currently due -
    exactly what the next successful tick would send, without sending
    anything or changing any state. For the Patients tab "Preview
    automation" button.
    """
    key = try_pii_key()
    if key is None:
        raise ValueError("Unlock PII (names and emails) before previewing.")
    mode = read_mode()
    now = _now()
    store = patients_path(mode)
    patients = load_patients(store, key)
    items: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    for cid, campaign in load_campaigns().items():
        schedule = campaign.schedule
        if not schedule or not schedule.get("enabled"):
            continue
        if mode == "prod" and not campaign.ready:
            skipped.append(
                {"campaign_id": cid, "label": campaign.label, "reason": "not ready for prod"}
            )
            continue
        preview = send_campaign(
            patients,
            campaign,
            now,
            key=key,
            patient_ids=None,
            force_to="",
            dry_run=True,
            path=store,
            mode=mode,
        )
        for row in preview:
            items.append({**row, "campaign_id": cid, "campaign_label": campaign.label})
    return {
        "now": now.isoformat(),
        "mode": mode,
        "paused": is_paused(state_path),
        "items": items,
        "skipped": skipped,
    }


def run_all_now(*, state_path: Path = STATE_PATH) -> dict[str, Any]:
    """Fire every automation-enabled campaign's due sends right now - the
    "Run automation now" button. Behaves like clicking the single-campaign
    "Run now" button on each enabled campaign in turn: a manual click is an
    explicit override, so this ignores both is_due()'s check-interval gate
    and the global pause switch (same as run_now() already does for one
    campaign). Stamps last_run for each campaign it touches, same as a real
    tick, so the schedule does not immediately fire again on top of this.
    """
    key = try_pii_key()
    if key is None:
        raise ValueError("Unlock PII (names and emails) before running automation.")
    mode = read_mode()
    now = _now()
    state = load_state(state_path)
    results: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    for cid, campaign in load_campaigns().items():
        schedule = campaign.schedule
        if not schedule or not schedule.get("enabled"):
            continue
        if mode == "prod" and not campaign.ready:
            skipped.append(
                {"campaign_id": cid, "label": campaign.label, "reason": "not ready for prod"}
            )
            continue
        entry = dict(state.get(cid) or {})
        try:
            outcome = _run_campaign(campaign, key=key, mode=mode, now=now)
            entry.update(outcome)
            results.append(
                {"campaign_id": cid, "campaign_label": campaign.label, "sent": outcome["last_result"]}
            )
        except Exception as exc:  # noqa: BLE001 - surface each campaign's own failure
            entry["last_attempt"] = now.isoformat()
            entry["last_error"] = str(exc)[:300]
            results.append(
                {"campaign_id": cid, "campaign_label": campaign.label, "error": str(exc)[:300]}
            )
        state[cid] = entry
    save_state(state, state_path)
    return {"now": now.isoformat(), "mode": mode, "results": results, "skipped": skipped}


def tick(now: datetime | None = None, *, state_path: Path = STATE_PATH) -> dict[str, Any]:
    """One scheduler pass over every campaign. Returns a small summary."""
    now = now or _now()
    state = load_state(state_path)
    if bool((state.get(GLOBAL_KEY) or {}).get("paused")):
        return {"ran": [], "at": now.isoformat(), "paused": True}
    key = try_pii_key()
    mode = read_mode()
    campaigns = load_campaigns()
    ran: list[str] = []
    for cid, campaign in campaigns.items():
        schedule = campaign.schedule
        if not schedule or not schedule.get("enabled"):
            continue
        entry = dict(state.get(cid) or {})
        last_run = _parse_dt(entry.get("last_run"))
        if last_run is None:
            # First sight of this enabled schedule: arm it now, fire next window.
            entry["armed_at"] = now.isoformat()
            entry["last_run"] = now.isoformat()
            state[cid] = entry
            continue
        if not is_due(schedule, last_run, now):
            continue
        if key is None:
            entry["last_attempt"] = now.isoformat()
            entry["last_error"] = "PII locked - unlock the mailer to send"
            state[cid] = entry
            continue
        try:
            entry.update(_run_campaign(campaign, key=key, mode=mode, now=now))
            ran.append(cid)
        except Exception as exc:  # noqa: BLE001
            entry["last_attempt"] = now.isoformat()
            entry["last_error"] = str(exc)[:300]
        state[cid] = entry
    save_state(state, state_path)
    return {"ran": ran, "at": now.isoformat()}


def status(state_path: Path = STATE_PATH) -> dict[str, Any]:
    """Everything the Automation tab needs to render."""
    state = load_state(state_path)
    now = _now()
    key_locked = try_pii_key() is None
    mode = read_mode()
    campaigns = load_campaigns()
    out: dict[str, Any] = {}
    for cid, campaign in campaigns.items():
        schedule = campaign.schedule
        entry = state.get(cid) or {}
        last_run = _parse_dt(entry.get("last_run"))
        out[cid] = {
            "enabled": bool(schedule and schedule.get("enabled")),
            "summary": schedule_summary(schedule),
            "ready": campaign.ready,
            "last_run": entry.get("last_run"),
            "last_result": entry.get("last_result"),
            "last_error": entry.get("last_error"),
            "last_attempt": entry.get("last_attempt"),
            "next_run": (
                nxt.isoformat()
                if (nxt := next_due(schedule, last_run, now)) is not None
                else None
            ),
        }
    return {
        "running": _SCHEDULER.is_running(),
        "paused": bool((state.get(GLOBAL_KEY) or {}).get("paused")),
        "mode": mode,
        "pii_locked": key_locked,
        "tick_seconds": TICK_SECONDS,
        "now": now.isoformat(),
        "campaigns": out,
    }


class Scheduler:
    def __init__(self) -> None:
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.is_running():
            return
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._loop, name="mailer-scheduler", daemon=True
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _loop(self) -> None:
        # Wait one tick before the first pass so startup settles.
        while not self._stop.wait(TICK_SECONDS):
            try:
                tick()
            except Exception:  # noqa: BLE001 - never let the loop die
                traceback.print_exc()


_SCHEDULER = Scheduler()


def start() -> None:
    _SCHEDULER.start()


def stop() -> None:
    _SCHEDULER.stop()
