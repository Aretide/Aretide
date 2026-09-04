"""Terminal menu for the patient mailer."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

from mailer.campaigns import load_campaigns, visible_campaigns
from mailer.crypto import (
    ConfigError,
    default_env_path,
    ensure_pii_key,
    load_dotenv,
    try_pii_key,
    wrap_data_key_with_yubikey,
)
from mailer.engine import add_patient, send_campaign, serialize_patient
from mailer.mode import migrate_legacy_patients, patients_path, read_mode, write_mode
from mailer.store import (
    DENVER,
    campaign_summary,
    display_email,
    display_name,
    load_patients,
    set_enrollment,
    save_patients,
)
from mailer.ui import serve


def ask(prompt: str) -> str:
    return input(prompt).strip()


def choose(title: str, options: list[str]) -> int:
    print()
    print(title)
    for index, option in enumerate(options, 1):
        print(f"  {index}) {option}")
    while True:
        raw = ask("Choice: ")
        if raw.isdigit() and 1 <= int(raw) <= len(options):
            return int(raw) - 1
        print("Pick a number from the list.")


def now() -> datetime:
    return datetime.now(tz=DENVER)


def print_patients(patients, campaigns, reveal: bool) -> None:
    stamp = now()
    print()
    print(f"{'Name':20} {'Email':32} {'Status':10} Campaigns")
    print("-" * 88)
    for patient in patients:
        bits = []
        for campaign in campaigns.values():
            summary = campaign_summary(patient, campaign, stamp)
            if summary["enrolled"]:
                bits.append(f"{campaign.id}:{summary['plan']}")
        print(
            f"{display_name(patient, reveal=reveal)[:20]:20} "
            f"{display_email(patient, reveal=reveal)[:32]:32} "
            f"{patient.status:10} "
            f"{', '.join(bits) or '-'}"
        )


def run_menu(env_path: Path, mode: str | None = None) -> int:
    load_dotenv(env_path)
    migrate_legacy_patients()
    mode = write_mode(mode) if mode else read_mode()
    store = patients_path(mode)
    key = try_pii_key()
    reveal = key is not None
    print("PII unlocked." if reveal else "PII locked. Names and emails show as ***.")
    print(f"Mode: {mode}. Patients: {store}")
    patients = load_patients(store, key)
    campaigns = visible_campaigns(load_campaigns(), mode)
    while True:
        choice = choose(
            "Beema Health mailer",
            [
                "Open dashboard",
                "Send a campaign",
                "Add a patient",
                "List patients",
                "Assign campaigns",
                "Lock with YubiKey (later)",
                "Quit",
            ],
        )
        if choice == 0:
            serve(mode=mode)
        elif choice == 1:
            if key is None:
                ensure_pii_key(env_path, interactive=True)
                key = try_pii_key()
                patients = load_patients(store, key)
                reveal = key is not None
            if key is None:
                print("Need ABANDONED_PII_KEY to send.")
                continue
            campaign_ids = list(campaigns.keys())
            labels = [campaigns[cid].label for cid in campaign_ids]
            campaign = campaigns[campaign_ids[choose("Campaign?", labels)]]
            send_how = choose("How?", ["Dry run", "Send to patients", "Send to my inbox"])
            force_to = ""
            if send_how == 2:
                force_to = ask("Inbox (Enter for matt.aertker@beemahealth.com): ") or "matt.aertker@beemahealth.com"
            preview = send_campaign(
                patients,
                campaign,
                now(),
                key=key,
                patient_ids=None,
                force_to=force_to,
                dry_run=send_how == 0,
                path=store,
                mode=mode,
            )
            if not preview:
                print("Nobody is due.")
            else:
                for item in preview:
                    print(f"  {item['name']} {item['email']} step={item['step']}")
            patients = load_patients(store, key)
        elif choice == 2:
            ensure_pii_key(env_path, interactive=True)
            key = try_pii_key()
            if key is None:
                print("Need ABANDONED_PII_KEY to add a patient.")
                continue
            patients = load_patients(store, key)
            name = ask("First name: ")
            email = ask("Email: ")
            status = ["abandoned", "lead", "active"][choose("Status?", ["Abandoned", "Lead", "Active"])]
            abandoned_at = ask("Abandoned at (Enter for now if abandoned, or 2026-08-26 9:37): ")
            enrolled = []
            for campaign in campaigns.values():
                if ask(f"Enroll in {campaign.label}? [y/N]: ").lower() == "y":
                    enrolled.append(campaign.id)
            try:
                add_patient(
                    patients,
                    first_name=name,
                    email=email,
                    interest="weight-loss care",
                    product="weight-loss",
                    status=status,
                    abandoned_at=abandoned_at,
                    campaign_ids=enrolled,
                    key=key,
                    now=now(),
                    path=store,
                )
            except ConfigError as exc:
                print(str(exc))
            patients = load_patients(store, key)
        elif choice == 3:
            print_patients(patients, campaigns, reveal)
        elif choice == 4:
            if key is None:
                print("Need ABANDONED_PII_KEY to assign campaigns.")
                continue
            print_patients(patients, campaigns, True)
            raw = ask("Patient number starting at 1: ")
            if not raw.isdigit() or not (1 <= int(raw) <= len(patients)):
                print("Invalid number.")
                continue
            patient = patients[int(raw) - 1]
            stamp = now()
            current = patient
            for campaign in campaigns.values():
                on = ask(f"{campaign.label} enrolled? [y/N]: ").lower() == "y"
                current = set_enrollment(current, campaign.id, on, stamp)
            patients = [current if p.id == patient.id else p for p in patients]
            save_patients(store, patients, key)
            print("Saved campaign assignments.")
        elif choice == 5:
            print("Plug in the YubiKey adapter first. This wraps the data key; it does not re-encrypt patients.")
            if ask("Continue? [y/N]: ").lower() == "y":
                wrap_data_key_with_yubikey(env_path)
        else:
            return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Beema Health patient mailer")
    parser.add_argument("--env", type=Path, default=None)
    parser.add_argument("--ui", action="store_true", help="Open the local dashboard")
    parser.add_argument(
        "--mode",
        choices=["dev", "prod"],
        default=None,
        help="Patient list: dev (test) or prod (real). Campaigns are shared.",
    )
    args = parser.parse_args(argv)
    env_path = args.env if args.env is not None else default_env_path()
    load_dotenv(env_path)
    if args.mode:
        write_mode(args.mode)
    if args.ui:
        serve(mode=args.mode)
        return 0
    try:
        return run_menu(env_path, mode=args.mode)
    except (KeyboardInterrupt, EOFError):
        print()
        return 0
    except ConfigError as exc:
        print(str(exc), file=sys.stderr)
        return 2
