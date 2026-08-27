"""High-level patient and send operations."""

from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Any, Sequence

from mailer.campaigns import Campaign, load_campaigns
from mailer.crypto import ConfigError, try_pii_key
from mailer.emailing import build_message, send_messages, smtp_settings
from mailer.store import (
    DEFAULT_CTA,
    DEFAULT_INTEREST,
    DEFAULT_PRODUCT,
    DENVER,
    PATIENTS_PATH,
    CampaignState,
    Patient,
    campaign_summary,
    enroll,
    load_patients,
    parse_time,
    plan_sends,
    record_send,
    save_patients,
    set_enrollment,
)

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def valid_email(value: str) -> bool:
    trimmed = value.strip()
    if not trimmed or ".." in trimmed or "%" in trimmed:
        return False
    return bool(EMAIL_RE.fullmatch(trimmed))


def serialize_patient(
    patient: Patient,
    campaigns: dict[str, Campaign],
    now: datetime,
    *,
    reveal: bool,
) -> dict[str, Any]:
    return {
        "id": patient.id,
        "first_name": patient.first_name if reveal else "***",
        "email": patient.email if reveal else "***",
        "interest": patient.interest if reveal else "***",
        "product": patient.product,
        "status": patient.status,
        "abandoned_at": patient.abandoned_at.isoformat() if patient.abandoned_at else None,
        "cta_url": patient.cta_url,
        "campaigns": [
            campaign_summary(patient, campaign, now)
            for campaign in campaigns.values()
        ],
    }


def add_patient(
    patients: list[Patient],
    *,
    first_name: str,
    email: str,
    interest: str,
    product: str,
    status: str,
    abandoned_at: str,
    campaign_ids: Sequence[str],
    key: bytes,
    now: datetime,
) -> Patient:
    if not valid_email(email):
        raise ConfigError("That email is not valid.")
    if not first_name.strip():
        raise ConfigError("First name is required.")
    digest = None
    from mailer.crypto import email_hmac

    digest = email_hmac(email, key)
    for existing in patients:
        if reveal_ok(existing) and email_hmac(existing.email, key) == digest:
            raise ConfigError("That email is already on the list.")
    when = parse_time(abandoned_at) if abandoned_at.strip() else None
    if status == "abandoned" and when is None:
        when = now
    campaigns = {cid: CampaignState() for cid in load_campaigns()}
    for campaign_id in campaign_ids:
        if campaign_id in campaigns:
            campaigns[campaign_id] = enroll(campaigns[campaign_id], now)
    if status == "abandoned" and "abandoned" in campaigns:
        campaigns["abandoned"] = enroll(campaigns["abandoned"], now)
        if campaigns["abandoned"].enrolled_at is None:
            campaigns["abandoned"].enrolled_at = when or now
    patient = Patient(
        id=uuid.uuid4().hex[:12],
        first_name=first_name.strip(),
        email=email.strip().lower(),
        interest=interest.strip() or DEFAULT_INTEREST,
        product=product or DEFAULT_PRODUCT,
        status=status,
        abandoned_at=when,
        cta_url=DEFAULT_CTA,
        campaigns=campaigns,
    )
    patients.append(patient)
    save_patients(PATIENTS_PATH, patients, key)
    return patient


def reveal_ok(patient: Patient) -> bool:
    return patient.email != "***"


def send_campaign(
    patients: list[Patient],
    campaign: Campaign,
    now: datetime,
    *,
    key: bytes,
    patient_ids: Sequence[str] | None,
    force_to: str,
    dry_run: bool,
) -> list[dict[str, Any]]:
    if patients and not dry_run and not reveal_ok(patients[0]):
        raise ConfigError("Unlock PII before sending.")
    planned = plan_sends(
        patients,
        campaign,
        now,
        patient_ids=patient_ids,
        force_to=force_to,
    )
    preview = [
        {
            "patient_id": item.patient.id,
            "name": item.patient.first_name if reveal_ok(item.patient) else "***",
            "email": item.envelope_to if force_to or reveal_ok(item.patient) else "***",
            "step": item.step.id,
            "subject": item.step.subject,
            "due_at": item.due_at.isoformat(),
        }
        for item in planned
    ]
    if dry_run or not planned:
        return preview
    settings = smtp_settings()
    year = now.year
    messages = [
        build_message(
            item.patient,
            item.step,
            item.envelope_to,
            campaign.cta_url or item.patient.cta_url,
            from_header=settings["from_header"],
            year=year,
        )
        for item in planned
    ]
    send_messages(messages, settings)
    by_id = {patient.id: patient for patient in patients}
    for item in planned:
        by_id[item.patient.id] = record_send(
            item.patient, campaign.id, item.step.id, now
        )
    save_patients(PATIENTS_PATH, list(by_id.values()), key)
    return preview
