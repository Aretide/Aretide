"""High-level patient and send operations."""

from __future__ import annotations

import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Sequence

from mailer.campaigns import (
    CAMPAIGNS_DIR,
    Campaign,
    campaign_from_payload,
    campaign_history,
    load_campaigns,
)
from mailer.crypto import ConfigError, try_pii_key
from mailer.emailing import (
    LOGO_CID,
    build_message,
    fill,
    render_html,
    render_plain,
    resolve_logo,
    send_messages,
    smtp_settings,
)
from mailer.mode import patients_path, read_mode
from mailer.store import (
    DEFAULT_CTA,
    DEFAULT_INTEREST,
    DEFAULT_PRODUCT,
    DENVER,
    CampaignState,
    Patient,
    PlannedSend,
    SendRecord,
    append_send,
    campaign_summary,
    clear_send_log,
    enroll,
    load_patients,
    load_send_log,
    parse_time,
    plan_sends,
    record_send,
    remap_campaign_id,
    reset_patient_progress,
    reset_send_history,
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
    path: Path | None = None,
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
    save_patients(path or patients_path(read_mode()), patients, key)
    return patient


def reveal_ok(patient: Patient) -> bool:
    return patient.email != "***"


def update_patient(
    patients: list[Patient],
    patient_id: str,
    *,
    key: bytes,
    now: datetime,
    first_name: str,
    email: str,
    interest: str,
    product: str,
    status: str,
    abandoned_at: str,
    cta_url: str,
    campaigns_update: dict[str, Any] | None = None,
    path: Path | None = None,
) -> Patient:
    from dataclasses import replace as data_replace
    from mailer.crypto import email_hmac

    if not valid_email(email):
        raise ConfigError("That email is not valid.")
    if not first_name.strip():
        raise ConfigError("First name is required.")
    digest = email_hmac(email, key)
    index = None
    current = None
    for i, existing in enumerate(patients):
        if existing.id == patient_id:
            index = i
            current = existing
            continue
        if reveal_ok(existing) and email_hmac(existing.email, key) == digest:
            raise ConfigError("That email is already on the list.")
    if current is None or index is None:
        raise ConfigError("Patient was not found.")
    when = parse_time(abandoned_at) if str(abandoned_at).strip() else None
    campaigns = dict(current.campaigns)
    for campaign_id in load_campaigns():
        campaigns.setdefault(campaign_id, CampaignState())
    for campaign_id, payload in (campaigns_update or {}).items():
        if campaign_id not in load_campaigns():
            continue
        if not isinstance(payload, dict):
            continue
        state = campaigns.get(campaign_id) or CampaignState()
        enrolled = bool(payload.get("enrolled", state.enrolled))
        last_step = payload.get("last_step", state.last_step)
        if last_step == "":
            last_step = None
        last_sent_raw = payload.get("last_sent_at")
        if "last_sent_at" in payload:
            last_sent = parse_time(str(last_sent_raw) if last_sent_raw else None)
        else:
            last_sent = state.last_sent_at
        enrolled_at = state.enrolled_at
        if enrolled and enrolled_at is None:
            enrolled_at = now
        campaigns[campaign_id] = CampaignState(
            enrolled=enrolled,
            enrolled_at=enrolled_at,
            last_step=str(last_step) if last_step else None,
            last_sent_at=last_sent,
        )
    updated = data_replace(
        current,
        first_name=first_name.strip(),
        email=email.strip().lower(),
        interest=interest.strip() or DEFAULT_INTEREST,
        product=product.strip() or DEFAULT_PRODUCT,
        status=status if status in {"lead", "abandoned", "active", "paused"} else current.status,
        abandoned_at=when,
        cta_url=cta_url.strip() or DEFAULT_CTA,
        campaigns=campaigns,
    )
    patients[index] = updated
    save_patients(path or patients_path(read_mode()), patients, key)
    return updated


def delete_patient(
    patients: list[Patient],
    patient_id: str,
    *,
    key: bytes,
    path: Path | None = None,
) -> Patient:
    remaining = [patient for patient in patients if patient.id != patient_id]
    if len(remaining) == len(patients):
        raise ConfigError("Patient was not found.")
    removed = next(patient for patient in patients if patient.id == patient_id)
    save_patients(path or patients_path(read_mode()), remaining, key)
    patients[:] = remaining
    return removed


def duplicate_patient_to_prod(
    patient_id: str,
    *,
    key: bytes,
    data_dir: Path | None = None,
) -> Patient:
    """Copy a Dev patient into the Prod list, campaign state and all.

    A fresh id is minted; every other field - status, abandoned_at, cta_url, and
    the full per-campaign enrolled / enrolled_at / last_step / last_sent_at map -
    is carried over exactly, so the Prod copy resumes wherever the Dev test left
    off. Refuses if that email is already in Prod.
    """
    import copy

    from mailer.crypto import email_hmac

    dev_path = (
        patients_path("dev", data_dir) if data_dir else patients_path("dev")
    )
    prod_path = (
        patients_path("prod", data_dir) if data_dir else patients_path("prod")
    )
    source = next(
        (p for p in load_patients(dev_path, key) if p.id == patient_id), None
    )
    if source is None:
        raise ConfigError("That patient was not found in Dev.")
    if not reveal_ok(source):
        raise ConfigError("Unlock PII before duplicating a patient.")
    prod_patients = load_patients(prod_path, key)
    digest = email_hmac(source.email, key)
    for existing in prod_patients:
        if reveal_ok(existing) and email_hmac(existing.email, key) == digest:
            raise ConfigError(
                f"{source.email} is already in the Prod patient list."
            )
    clone = copy.deepcopy(source)
    clone.id = uuid.uuid4().hex[:12]
    prod_patients.append(clone)
    save_patients(prod_path, prod_patients, key)
    return clone


def bulk_add_patients(
    rows: Sequence[dict[str, Any]],
    *,
    key: bytes,
    mode: str,
    default_campaign: str | None = None,
    dry_run: bool = False,
    now: datetime,
    data_dir: Path | None = None,
    campaigns_directory: Path | None = None,
) -> dict[str, Any]:
    """Add many patients at once, skipping any whose email is already present.

    Each row: {first_name, email, abandoned_at, interest?, product?, cta_url?}.
    When `default_campaign` is given, everyone is enrolled in it with
    `enrolled_at` = `last_sent_at` = their abandoned time and `last_step` set to
    the latest step whose delay has already elapsed - so the drip resumes where
    each person is in their timeline. Dedup is by email, against both the target
    list and the rest of this batch.
    """
    from mailer.crypto import email_hmac

    store = patients_path(mode, data_dir) if data_dir else patients_path(mode)
    patients = load_patients(store, key)
    all_campaigns = (
        load_campaigns(campaigns_directory) if campaigns_directory else load_campaigns()
    )
    camp = all_campaigns.get(default_campaign) if default_campaign else None
    if default_campaign and camp is None:
        raise ConfigError(f"Unknown campaign: {default_campaign}.")

    existing = {
        email_hmac(p.email, key) for p in patients if reveal_ok(p)
    }
    seen: set[bytes] = set()
    added: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for raw in rows:
        email = str(raw.get("email") or "").strip().lower()
        name = str(raw.get("first_name") or "").strip()
        if not valid_email(email):
            skipped.append(
                {"email": email or "(blank)", "name": name, "reason": "invalid email"}
            )
            continue
        digest = email_hmac(email, key)
        if digest in existing:
            skipped.append(
                {"email": email, "name": name, "reason": f"already in {mode}"}
            )
            continue
        if digest in seen:
            skipped.append(
                {"email": email, "name": name, "reason": "duplicate row in this upload"}
            )
            continue

        when = parse_time(str(raw.get("abandoned_at") or "")) or now
        state_campaigns = {cid: CampaignState() for cid in all_campaigns}
        assigned: str | None = None
        next_step: str | None = None
        if camp is not None:
            elapsed = now - when
            assigned = (
                camp.latest_step_by_elapsed(elapsed)
                if elapsed.total_seconds() > 0
                else None
            )
            nxt = camp.next_after(assigned)
            next_step = nxt.id if nxt else None
            state_campaigns[camp.id] = CampaignState(
                enrolled=True,
                enrolled_at=when,
                last_step=assigned,
                last_sent_at=when if assigned else None,
            )

        patient = Patient(
            id=uuid.uuid4().hex[:12],
            first_name=name or "there",
            email=email,
            interest=str(raw.get("interest") or DEFAULT_INTEREST),
            product=str(raw.get("product") or DEFAULT_PRODUCT),
            status="abandoned",
            abandoned_at=when,
            cta_url=str(raw.get("cta_url") or DEFAULT_CTA),
            campaigns=state_campaigns,
        )
        seen.add(digest)
        if not dry_run:
            patients.append(patient)
        added.append(
            {
                "email": email,
                "name": name,
                "abandoned_at": when.isoformat(),
                "campaign": camp.id if camp else None,
                "last_step": assigned,
                "next_step": next_step,
            }
        )

    if not dry_run and added:
        save_patients(store, patients, key)

    return {
        "mode": mode,
        "dry_run": dry_run,
        "counts": {"added": len(added), "skipped": len(skipped)},
        "added": added,
        "skipped": skipped,
    }


def dummy_preview_patient() -> Patient:
    return Patient(
        id="preview",
        first_name="there",
        email="preview@example.com",
        interest="weight-loss care",
        product="weight-loss",
        status="lead",
        abandoned_at=None,
        cta_url=DEFAULT_CTA,
        campaigns={},
    )


def clear_send_history(
    patients: list[Patient],
    *,
    key: bytes,
    path: Path,
    mode: str,
) -> list[Patient]:
    if mode == "prod":
        raise ConfigError("Clear send history is only available in Dev.")
    reset = reset_send_history(path, patients, key)
    patients[:] = reset
    return reset


def clear_patient_progress(
    patients: list[Patient],
    *,
    key: bytes,
    path: Path,
    mode: str,
) -> list[Patient]:
    if mode == "prod":
        raise ConfigError("Clearing data is only available in Dev.")
    reset = reset_patient_progress(path, patients, key)
    patients[:] = reset
    return reset


def clear_send_log_only(
    patients: list[Patient],
    *,
    key: bytes,
    path: Path,
    mode: str,
) -> None:
    if mode == "prod":
        raise ConfigError("Clearing data is only available in Dev.")
    clear_send_log(path, patients, key)


def remap_campaign_id_on_disk(
    old_id: str,
    new_id: str,
    key: bytes | None,
) -> None:
    if key is None or not old_id or old_id == new_id:
        return
    for mode in ("dev", "prod"):
        path = patients_path(mode)
        if not path.is_file():
            continue
        people = load_patients(path, key)
        save_patients(path, remap_campaign_id(people, old_id, new_id), key)


def preview_step(
    patient: Patient,
    campaign: Campaign,
    step_id: str,
    *,
    year: int | None = None,
) -> dict[str, Any]:
    step = campaign.step_by_id(step_id)
    if step is None:
        raise ConfigError(f"Unknown step {step_id}.")
    year = year or datetime.now(tz=DENVER).year
    cta = campaign.cta_url or patient.cta_url
    logo_path, _logo_subtype = resolve_logo()
    try:
        html = render_html(
            patient,
            step,
            cta,
            year=year,
            extras=campaign.extras,
            show_header=campaign.show_header,
            show_footer=campaign.show_footer,
            show_logo=logo_path is not None,
        )
        text = render_plain(
            patient,
            step,
            cta,
            year=year,
            extras=campaign.extras,
            show_header=campaign.show_header,
            show_footer=campaign.show_footer,
        )
        subject = fill(step.subject, patient, campaign.extras)
    except KeyError as exc:
        raise ConfigError(f"Missing placeholder {exc}.") from exc
    html = html.replace(f"cid:{LOGO_CID}", "/api/logo")
    return {
        "patient_id": patient.id,
        "step": step.id,
        "subject": subject,
        "html": html,
        "text": text,
    }


def render_historical_send(
    record: SendRecord,
    patients: list[Patient],
    *,
    directory: Path = CAMPAIGNS_DIR,
) -> dict[str, Any]:
    patient = next(
        (p for p in patients if p.id == record.patient_id), None
    ) or dummy_preview_patient()
    entries = campaign_history(record.campaign_id, directory)
    campaign: Campaign | None = None
    for entry in reversed(entries):
        payload = entry.get("payload")
        if not payload or int(payload.get("version") or 0) != record.campaign_version:
            continue
        candidate = campaign_from_payload(payload)
        if candidate.step_by_id(record.step_id) is not None:
            campaign = candidate
        break
    note = None
    if campaign is None:
        campaign = load_campaigns(directory).get(record.campaign_id)
        if campaign is None or campaign.step_by_id(record.step_id) is None:
            raise ConfigError("This campaign or step no longer exists.")
        note = "Historical version not found - showing the current copy."
    result = preview_step(patient, campaign, record.step_id)
    result["note"] = note
    return result


def _preview_rows(
    planned: Sequence[PlannedSend],
    force_to: str,
) -> list[dict[str, Any]]:
    return [
        {
            "patient_id": item.patient.id,
            "name": (
                item.patient.first_name if reveal_ok(item.patient) else "***"
            ),
            "email": (
                item.envelope_to
                if force_to or reveal_ok(item.patient)
                else "***"
            ),
            "step": item.step.id,
            "subject": item.step.subject,
            "due_at": item.due_at.isoformat(),
        }
        for item in planned
    ]


def _deliver(
    patients: list[Patient],
    campaign: Campaign,
    planned: Sequence[PlannedSend],
    now: datetime,
    *,
    key: bytes,
    force_to: str,
    dry_run: bool,
    path: Path | None,
    mode: str,
) -> list[dict[str, Any]]:
    preview = _preview_rows(planned, force_to)
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
            extras=campaign.extras,
            show_header=campaign.show_header,
            show_footer=campaign.show_footer,
        )
        for item in planned
    ]
    send_messages(messages, settings)
    store_path = path or patients_path(mode)
    sends = load_send_log(store_path, key)
    by_id = {patient.id: patient for patient in patients}
    for item in planned:
        by_id[item.patient.id] = record_send(
            item.patient, campaign.id, item.step.id, now
        )
        append_send(
            sends,
            patient=item.patient,
            campaign=campaign,
            step_id=item.step.id,
            subject=fill(item.step.subject, item.patient, campaign.extras),
            now=now,
            campaign_version=campaign.version,
            step_version=item.step.version,
        )
    save_patients(store_path, list(by_id.values()), key, sends=sends)
    return preview


def send_campaign(
    patients: list[Patient],
    campaign: Campaign,
    now: datetime,
    *,
    key: bytes,
    patient_ids: Sequence[str] | None,
    force_to: str,
    dry_run: bool,
    path: Path | None = None,
    mode: str | None = None,
    ignore_due: bool = False,
) -> list[dict[str, Any]]:
    mode = mode or read_mode()
    if mode == "prod" and not campaign.ready:
        raise ConfigError(
            f"{campaign.label} is not marked ready for prod. "
            "Test it in Dev, then mark it ready."
        )
    if mode == "prod" and ignore_due:
        raise ConfigError("Overriding the time delay is only available in Dev.")
    if patients and not dry_run and not reveal_ok(patients[0]):
        raise ConfigError("Unlock PII before sending.")
    planned = plan_sends(
        patients,
        campaign,
        now,
        patient_ids=patient_ids,
        force_to=force_to,
        ignore_due=ignore_due,
    )
    return _deliver(
        patients,
        campaign,
        planned,
        now,
        key=key,
        force_to=force_to,
        dry_run=dry_run,
        path=path,
        mode=mode,
    )


def send_specific_step(
    patients: list[Patient],
    campaign: Campaign,
    now: datetime,
    *,
    key: bytes,
    patient_id: str,
    step_id: str,
    force_to: str = "",
    dry_run: bool = False,
    path: Path | None = None,
    mode: str | None = None,
) -> list[dict[str, Any]]:
    mode = mode or read_mode()
    if mode == "prod" and not campaign.ready:
        raise ConfigError(
            f"{campaign.label} is not marked ready for prod. "
            "Test it in Dev, then mark it ready."
        )
    step = campaign.step_by_id(step_id)
    if step is None:
        raise ConfigError(f"Unknown step {step_id}.")
    patient = next((item for item in patients if item.id == patient_id), None)
    if patient is None:
        raise ConfigError("Patient was not found.")
    if not dry_run and not reveal_ok(patient):
        raise ConfigError("Unlock PII before sending.")
    planned = [
        PlannedSend(
            patient=patient,
            campaign=campaign,
            step=step,
            envelope_to=force_to or patient.email,
            due_at=now,
            reason=f"forced:{campaign.id}:{step.id}",
        )
    ]
    return _deliver(
        patients,
        campaign,
        planned,
        now,
        key=key,
        force_to=force_to,
        dry_run=dry_run,
        path=path,
        mode=mode,
    )
