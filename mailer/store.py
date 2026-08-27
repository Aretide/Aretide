"""Encrypted patient store. Name, email, and interest never sit in plaintext on disk."""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass, field, replace
from datetime import datetime
from pathlib import Path
from typing import Any, Mapping, Sequence

from mailer.campaigns import Campaign, load_campaigns
from mailer.crypto import (
    ConfigError,
    ROOT,
    decrypt_text,
    email_hmac,
    encrypt_text,
)
from zoneinfo import ZoneInfo

PATIENTS_PATH = ROOT / "patients.json"
LEGACY_PATH = ROOT / "abandoned_checkout.json"
DENVER = ZoneInfo("America/Denver")
LOCKED = "***"
DEFAULT_PRODUCT = "weight-loss"
DEFAULT_INTEREST = "weight-loss care"
DEFAULT_CTA = "https://hive.beemahealth.com"
STATUSES = ("lead", "abandoned", "active", "paused")


@dataclass
class CampaignState:
    enrolled: bool = False
    enrolled_at: datetime | None = None
    last_step: str | None = None
    last_sent_at: datetime | None = None


@dataclass
class Patient:
    id: str
    first_name: str
    email: str
    interest: str
    product: str
    status: str
    abandoned_at: datetime | None
    cta_url: str
    campaigns: dict[str, CampaignState] = field(default_factory=dict)


@dataclass(frozen=True)
class PlannedSend:
    patient: Patient
    campaign: Campaign
    step: Any
    envelope_to: str
    due_at: datetime
    reason: str


def parse_time(raw: str | None, *, tz: ZoneInfo = DENVER) -> datetime | None:
    if not raw:
        return None
    text = " ".join(str(raw).strip().split())
    if not text:
        return None
    iso_text = text[:-1] + "+00:00" if text.endswith("Z") else text
    try:
        parsed = datetime.fromisoformat(iso_text)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=tz)
        return parsed
    except ValueError:
        pass
    import re

    match = re.fullmatch(
        r"(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?",
        text,
    )
    if not match:
        raise ValueError(
            "Use YYYY-MM-DD or YYYY-MM-DD HH:MM (Denver). Example: 2026-08-26 9:37"
        )
    hour = int(match.group(4) or 0)
    minute = int(match.group(5) or 0)
    second = int(match.group(6) or 0)
    return datetime(
        int(match.group(1)),
        int(match.group(2)),
        int(match.group(3)),
        hour,
        minute,
        second,
        tzinfo=tz,
    )


def atomic_write_json(path: Path, payload: Mapping[str, Any]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


def empty_campaigns(now: datetime | None = None) -> dict[str, CampaignState]:
    loaded = load_campaigns()
    return {campaign_id: CampaignState() for campaign_id in loaded}


def enroll(state: CampaignState, now: datetime) -> CampaignState:
    return replace(
        state,
        enrolled=True,
        enrolled_at=state.enrolled_at or now,
    )


def unenroll(state: CampaignState) -> CampaignState:
    return replace(state, enrolled=False)


def campaign_state_from_row(row: Mapping[str, Any] | None) -> CampaignState:
    if not isinstance(row, dict):
        return CampaignState()
    return CampaignState(
        enrolled=bool(row.get("enrolled")),
        enrolled_at=parse_time(row.get("enrolled_at")),
        last_step=(str(row["last_step"]) if row.get("last_step") else None),
        last_sent_at=parse_time(row.get("last_sent_at")),
    )


def campaign_state_to_row(state: CampaignState) -> dict[str, Any]:
    return {
        "enrolled": state.enrolled,
        "enrolled_at": state.enrolled_at.isoformat() if state.enrolled_at else None,
        "last_step": state.last_step,
        "last_sent_at": state.last_sent_at.isoformat() if state.last_sent_at else None,
    }


def patient_to_row(patient: Patient, key: bytes) -> dict[str, Any]:
    return {
        "id": patient.id,
        "name_enc": encrypt_text(patient.first_name, key),
        "email_enc": encrypt_text(patient.email, key),
        "interest_enc": encrypt_text(patient.interest, key),
        "email_hmac": email_hmac(patient.email, key),
        "product": patient.product,
        "status": patient.status,
        "abandoned_at": patient.abandoned_at.isoformat() if patient.abandoned_at else None,
        "cta_url": patient.cta_url,
        "campaigns": {
            campaign_id: campaign_state_to_row(state)
            for campaign_id, state in patient.campaigns.items()
        },
    }


def patient_from_row(
    row: Mapping[str, Any],
    index: int,
    key: bytes | None,
    campaign_ids: Sequence[str],
) -> Patient:
    patient_id = str(row.get("id") or uuid.uuid4().hex[:12])
    if key is None:
        first_name = LOCKED
        email = LOCKED
        interest = LOCKED
    else:
        if row.get("email_enc"):
            first_name = decrypt_text(str(row["name_enc"]), key)
            email = decrypt_text(str(row["email_enc"]), key)
            interest = decrypt_text(str(row["interest_enc"]), key)
        else:
            first_name = str(row.get("first_name") or "").strip()
            email = str(row.get("email") or "").strip()
            interest = str(row.get("interest") or DEFAULT_INTEREST).strip()
    campaigns_raw = row.get("campaigns") if isinstance(row.get("campaigns"), dict) else {}
    campaigns = {
        campaign_id: campaign_state_from_row(campaigns_raw.get(campaign_id))
        for campaign_id in campaign_ids
    }
    if (not campaigns_raw) and (row.get("last_step") is not None or row.get("abandoned_at")):
        if "abandoned" in campaigns:
            campaigns["abandoned"] = CampaignState(
                enrolled=True,
                enrolled_at=parse_time(row.get("abandoned_at")),
                last_step=(str(row["last_step"]) if row.get("last_step") else None),
                last_sent_at=parse_time(row.get("last_sent_at")),
            )
    status = str(row.get("status") or ("abandoned" if row.get("abandoned_at") else "lead"))
    if status not in STATUSES:
        status = "lead"
    return Patient(
        id=patient_id,
        first_name=first_name,
        email=email,
        interest=interest or DEFAULT_INTEREST,
        product=str(row.get("product") or DEFAULT_PRODUCT),
        status=status,
        abandoned_at=parse_time(row.get("abandoned_at")),
        cta_url=str(row.get("cta_url") or DEFAULT_CTA),
        campaigns=campaigns,
    )


def load_patients(path: Path, key: bytes | None) -> list[Patient]:
    target = path if path.is_file() else LEGACY_PATH
    if not target.is_file():
        return []
    payload = json.loads(target.read_text(encoding="utf-8"))
    rows = payload.get("contacts") or payload.get("patients")
    if not isinstance(rows, list):
        raise ConfigError(f"{target.name} must contain a patients or contacts array.")
    campaign_ids = list(load_campaigns().keys())
    patients = [
        patient_from_row(row, index, key, campaign_ids)
        for index, row in enumerate(rows)
        if isinstance(row, dict)
    ]
    if key is not None and target == LEGACY_PATH and path != LEGACY_PATH:
        save_patients(path, patients, key)
    return patients


def save_patients(path: Path, patients: Sequence[Patient], key: bytes) -> None:
    payload = {
        "version": 2,
        "patients": [patient_to_row(patient, key) for patient in patients],
    }
    atomic_write_json(path, payload)


def display_name(patient: Patient, *, reveal: bool) -> str:
    return patient.first_name if reveal else LOCKED


def display_email(patient: Patient, *, reveal: bool) -> str:
    return patient.email if reveal else LOCKED


def anchor_time(patient: Patient, campaign: Campaign, state: CampaignState) -> datetime | None:
    if campaign.anchor == "abandoned_at":
        return patient.abandoned_at or state.enrolled_at
    return state.enrolled_at


def due_at_for(
    patient: Patient,
    campaign: Campaign,
    step: Any,
    state: CampaignState,
) -> datetime | None:
    anchor = anchor_time(patient, campaign, state)
    if anchor is None:
        return None
    from_anchor = anchor + step.delay
    if state.last_sent_at is None or state.last_step is None:
        return from_anchor
    previous_step = campaign.step_by_id(state.last_step)
    if previous_step is None:
        return from_anchor
    from_last = state.last_sent_at + (step.delay - previous_step.delay)
    return max(from_anchor, from_last)


def next_due_step(
    patient: Patient,
    campaign: Campaign,
    now: datetime,
) -> tuple[Any, datetime] | None:
    state = patient.campaigns.get(campaign.id) or CampaignState()
    if not state.enrolled:
        return None
    step = campaign.next_after(state.last_step)
    if step is None:
        return None
    due = due_at_for(patient, campaign, step, state)
    if due is None or now < due:
        return None
    return step, due


def plan_sends(
    patients: Sequence[Patient],
    campaign: Campaign,
    now: datetime,
    *,
    patient_ids: Sequence[str] | None = None,
    force_to: str = "",
) -> list[PlannedSend]:
    wanted = set(patient_ids) if patient_ids else None
    planned: list[PlannedSend] = []
    for patient in patients:
        if wanted is not None and patient.id not in wanted:
            continue
        due = next_due_step(patient, campaign, now)
        if due is None:
            continue
        step, when = due
        planned.append(
            PlannedSend(
                patient=patient,
                campaign=campaign,
                step=step,
                envelope_to=force_to or patient.email,
                due_at=when,
                reason=f"{campaign.id}:{step.id}",
            )
        )
    return planned


def record_send(
    patient: Patient,
    campaign_id: str,
    step_id: str,
    now: datetime,
) -> Patient:
    campaigns = dict(patient.campaigns)
    state = campaigns.get(campaign_id) or CampaignState(enrolled=True, enrolled_at=now)
    campaigns[campaign_id] = replace(
        state,
        enrolled=True,
        last_step=step_id,
        last_sent_at=now,
    )
    return replace(patient, campaigns=campaigns)


def set_enrollment(
    patient: Patient,
    campaign_id: str,
    enrolled: bool,
    now: datetime,
) -> Patient:
    campaigns = dict(patient.campaigns)
    state = campaigns.get(campaign_id) or CampaignState()
    campaigns[campaign_id] = enroll(state, now) if enrolled else unenroll(state)
    return replace(patient, campaigns=campaigns)


def campaign_summary(patient: Patient, campaign: Campaign, now: datetime) -> dict[str, Any]:
    state = patient.campaigns.get(campaign.id) or CampaignState()
    nxt = campaign.next_after(state.last_step)
    due = due_at_for(patient, campaign, nxt, state) if nxt else None
    due_now = False
    wait_until = None
    if not state.enrolled:
        plan = "not enrolled"
    elif nxt is None:
        plan = "complete"
    elif due is None:
        plan = "waiting"
    elif now >= due:
        plan = f"SEND {nxt.id}"
        due_now = True
    else:
        plan = f"wait until {due.astimezone(DENVER).strftime('%Y-%m-%d %H:%M')}"
        wait_until = due.isoformat()
    if due is not None and now >= due:
        wait_until = None
    return {
        "id": campaign.id,
        "label": campaign.label,
        "enrolled": state.enrolled,
        "last_step": state.last_step,
        "last_sent_at": state.last_sent_at.isoformat() if state.last_sent_at else None,
        "next_step": nxt.id if nxt else None,
        "due_at": due.isoformat() if due else None,
        "due_now": due_now,
        "plan": plan,
        "wait_until": wait_until,
    }
