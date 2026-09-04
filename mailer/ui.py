"""Local-only dashboard. PHI stays on this machine."""

from __future__ import annotations

import json
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from urllib.parse import urlparse

from mailer.campaigns import (
    campaign_history,
    campaign_payload,
    default_campaign_payload,
    delete_campaign,
    load_campaigns,
    save_campaign,
    set_campaign_ready,
    unique_campaign_id,
    visible_campaigns,
)
from mailer.crypto import ROOT, ConfigError, default_env_path, ensure_pii_key, load_dotenv, try_pii_key
from mailer.emailing import resolve_logo
from mailer.engine import (
    add_patient,
    bulk_add_patients,
    clear_patient_progress,
    clear_send_history,
    clear_send_log_only,
    delete_patient,
    duplicate_patient_to_prod,
    dummy_preview_patient,
    preview_step,
    render_historical_send,
    send_campaign,
    send_specific_step,
    serialize_patient,
    update_patient,
)
from mailer import scheduler
from mailer.mode import migrate_legacy_patients, patients_path, read_mode, write_mode
from mailer.store import (
    DENVER,
    load_patients,
    load_send_log,
    save_patients,
    serialize_send,
    set_enrollment,
)

STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC = STATIC_DIR / "index.html"

# Static assets served as-is (name -> content type). Anything referenced by
# index.html via a plain <link>/<script src> needs an entry here.
STATIC_ASSETS = {
    "dashboard.css": "text/css; charset=utf-8",
    "dashboard.js": "text/javascript; charset=utf-8",
    "dashboard-editors.js": "text/javascript; charset=utf-8",
}


def now() -> datetime:
    return datetime.now(tz=DENVER)


class Handler(BaseHTTPRequestHandler):
    env_path = default_env_path()
    mode = "dev"

    def _store(self) -> Path:
        return patients_path(self.mode)

    def log_message(self, format: str, *args: object) -> None:
        return

    def _key(self):
        return try_pii_key()

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _send(self, code: int, payload: dict | str, content_type: str = "application/json") -> None:
        data = payload.encode("utf-8") if isinstance(payload, str) else json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _send_bytes(
        self, code: int, data: bytes, content_type: str
    ) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            self._send(200, STATIC.read_text(encoding="utf-8"), "text/html; charset=utf-8")
            return
        static_match = re.fullmatch(r"/static/([^/]+)", path)
        if static_match and static_match.group(1) in STATIC_ASSETS:
            name = static_match.group(1)
            self._send(
                200,
                (STATIC_DIR / name).read_text(encoding="utf-8"),
                STATIC_ASSETS[name],
            )
            return
        if path == "/api/logo":
            logo_path, logo_subtype = resolve_logo()
            if logo_path is None:
                self._send(404, {"error": "logo not found"})
                return
            self._send_bytes(
                200, logo_path.read_bytes(), f"image/{logo_subtype}"
            )
            return
        if path == "/api/state":
            try:
                load_dotenv(self.env_path)
                key = self._key()
                all_campaigns = load_campaigns()
                shown = visible_campaigns(all_campaigns, self.mode)
                patients = load_patients(self._store(), key)
                sends = load_send_log(self._store(), key)
                stamp = now()
                store = self._store()
                try:
                    patients_file = str(store.relative_to(ROOT))
                except ValueError:
                    patients_file = str(store)
                self._send(
                    200,
                    {
                        "unlocked": key is not None,
                        "mode": self.mode,
                        "patients_file": patients_file,
                        "all_campaigns": [
                            campaign_payload(c) for c in all_campaigns.values()
                        ],
                        "campaigns": [
                            campaign_payload(c) for c in shown.values()
                        ],
                        "patients": [
                            serialize_patient(
                                p, all_campaigns, stamp, reveal=key is not None
                            )
                            for p in patients
                        ],
                        "sends": [
                            serialize_send(
                                record, reveal=key is not None
                            )
                            for record in reversed(sends)
                        ],
                    },
                )
            except Exception as exc:
                self._send(
                    500,
                    {"error": str(exc), "message": str(exc)},
                )
            return
        history_match = re.fullmatch(r"/api/campaigns/([^/]+)/history", path)
        if history_match:
            entries = campaign_history(history_match.group(1))
            self._send(200, {"history": list(reversed(entries))})
            return
        send_render_match = re.fullmatch(r"/api/sends/([^/]+)/render", path)
        if send_render_match:
            try:
                key = self._key()
                sends = load_send_log(self._store(), key)
                record = next(
                    (s for s in sends if s.id == send_render_match.group(1)), None
                )
                if record is None:
                    raise ConfigError("Send record not found.")
                patients = load_patients(self._store(), key)
                self._send(200, render_historical_send(record, patients))
            except (ConfigError, ValueError, KeyError) as exc:
                self._send(400, {"error": str(exc), "message": str(exc)})
            return
        if path == "/api/campaigns/new":
            self._send(200, {"campaign": default_campaign_payload(unique_campaign_id())})
            return
        if path == "/api/scheduler":
            load_dotenv(self.env_path)
            self._send(200, scheduler.status())
            return
        if path == "/api/scheduler/preview":
            load_dotenv(self.env_path)
            try:
                self._send(200, scheduler.preview_next_run())
            except (ConfigError, ValueError, KeyError) as exc:
                self._send(400, {"error": str(exc), "message": str(exc)})
            return
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        load_dotenv(self.env_path)
        path = urlparse(self.path).path.rstrip("/")
        try:
            if path == "/api/mode":
                body = self._read_json()
                Handler.mode = write_mode(str(body.get("mode") or "dev"))
                self._send(200, {"ok": True, "mode": Handler.mode})
                return
            if path == "/api/campaigns/ready":
                body = self._read_json()
                campaign = set_campaign_ready(
                    str(body.get("campaign_id") or ""),
                    bool(body.get("ready")),
                )
                self._send(200, {"ok": True, "campaign_id": campaign.id, "ready": campaign.ready})
                return
            if path == "/api/campaigns":
                body = self._read_json()
                previous_id = body.get("previous_id")
                payload = {k: v for k, v in body.items() if k != "previous_id"}
                campaign = save_campaign(
                    payload,
                    previous_id=str(previous_id) if previous_id else None,
                )
                self._send(200, {"ok": True, "campaign": campaign_payload(campaign)})
                return
            preview_match = re.fullmatch(r"/api/campaigns/([^/]+)/preview", path)
            if preview_match:
                campaign_id = preview_match.group(1)
                campaigns = load_campaigns()
                campaign = campaigns.get(campaign_id)
                if campaign is None:
                    raise ConfigError("Unknown campaign.")
                body = self._read_json()
                step_id = str(body.get("step_id") or "")
                patient_id = str(body.get("patient_id") or "")
                key = self._key()
                patient = None
                if patient_id and key is not None:
                    patients = load_patients(self._store(), key)
                    patient = next((p for p in patients if p.id == patient_id), None)
                preview = preview_step(patient or dummy_preview_patient(), campaign, step_id)
                self._send(200, preview)
                return
            send_one_match = re.fullmatch(r"/api/campaigns/([^/]+)/send-one", path)
            if send_one_match:
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before sending.")
                campaign_id = send_one_match.group(1)
                campaigns = load_campaigns()
                campaign = campaigns.get(campaign_id)
                if campaign is None:
                    raise ConfigError("Unknown campaign.")
                body = self._read_json()
                patients = load_patients(self._store(), key)
                preview = send_specific_step(
                    patients,
                    campaign,
                    now(),
                    key=key,
                    patient_id=str(body.get("patient_id") or ""),
                    step_id=str(body.get("step_id") or ""),
                    force_to=str(body.get("force_to") or ""),
                    dry_run=bool(body.get("dry_run")),
                    path=self._store(),
                    mode=self.mode,
                )
                self._send(200, {"preview": preview, "message": f"{len(preview)} email(s) sent."})
                return
            if path == "/api/scheduler/pause":
                entry = scheduler.set_paused(True)
                self._send(200, {"ok": True, **entry})
                return
            if path == "/api/scheduler/resume":
                entry = scheduler.set_paused(False)
                self._send(200, {"ok": True, **entry})
                return
            if path == "/api/scheduler/run-all":
                self._send(200, {"ok": True, **scheduler.run_all_now()})
                return
            run_now_match = re.fullmatch(r"/api/campaigns/([^/]+)/run-now", path)
            if run_now_match:
                entry = scheduler.run_now(run_now_match.group(1))
                self._send(
                    200,
                    {
                        "ok": True,
                        "message": entry.get("last_result") or "Done.",
                        "entry": entry,
                    },
                )
                return
            if path == "/api/clear-history":
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before clearing send history.")
                patients = load_patients(self._store(), key)
                body = self._read_json()
                scope = str(body.get("scope") or "all")
                if scope == "patients":
                    clear_patient_progress(
                        patients,
                        key=key,
                        path=self._store(),
                        mode=self.mode,
                    )
                elif scope == "sends":
                    clear_send_log_only(
                        patients,
                        key=key,
                        path=self._store(),
                        mode=self.mode,
                    )
                else:
                    clear_send_history(
                        patients,
                        key=key,
                        path=self._store(),
                        mode=self.mode,
                    )
                self._send(200, {"ok": True})
                return
            if path == "/api/patients/bulk":
                ensure_pii_key(self.env_path, interactive=False)
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before importing patients.")
                body = self._read_json()
                target_mode = str(body.get("mode") or self.mode).strip().lower()
                if target_mode not in ("dev", "prod"):
                    raise ConfigError("mode must be dev or prod.")
                rows = body.get("patients")
                if not isinstance(rows, list) or not rows:
                    raise ConfigError("patients must be a non-empty list.")
                report = bulk_add_patients(
                    rows,
                    key=key,
                    mode=target_mode,
                    default_campaign=str(body.get("default_campaign") or "") or None,
                    dry_run=bool(body.get("dry_run")),
                    now=now(),
                )
                verb = "would add" if report["dry_run"] else "added"
                report["message"] = (
                    f"{verb} {report['counts']['added']} to {target_mode}, "
                    f"skipped {report['counts']['skipped']}."
                )
                self._send(200, report)
                return
            if path == "/api/patients":
                ensure_pii_key(self.env_path, interactive=False)
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before adding a patient.")
                patients = load_patients(self._store(), key)
                body = self._read_json()
                raw_ids = body.get("campaign_ids")
                campaign_ids = list(raw_ids) if isinstance(raw_ids, list) else []
                add_patient(
                    patients,
                    first_name=str(body.get("first_name") or ""),
                    email=str(body.get("email") or ""),
                    interest=str(body.get("interest") or "weight-loss care"),
                    product=str(body.get("product") or "weight-loss"),
                    status=str(body.get("status") or "abandoned"),
                    abandoned_at=str(body.get("abandoned_at") or ""),
                    campaign_ids=campaign_ids,
                    key=key,
                    now=now(),
                    path=self._store(),
                )
                self._send(200, {"ok": True})
                return
            dup_match = re.fullmatch(
                r"/api/patients/([^/]+)/duplicate-to-prod", path
            )
            if dup_match:
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before duplicating a patient.")
                if self.mode != "dev":
                    raise ConfigError(
                        "Duplicate to Prod only works from Dev - switch to Dev first."
                    )
                clone = duplicate_patient_to_prod(dup_match.group(1), key=key)
                self._send(
                    200,
                    {
                        "ok": True,
                        "message": (
                            f"{clone.first_name} copied to Prod with "
                            f"{sum(1 for s in clone.campaigns.values() if s.enrolled)} "
                            "campaign enrollment(s) and their progress."
                        ),
                    },
                )
                return
            patient_match = re.fullmatch(r"/api/patients/([^/]+)", path)
            if patient_match:
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before editing a patient.")
                patient_id = patient_match.group(1)
                body = self._read_json()
                patients = load_patients(self._store(), key)
                update_patient(
                    patients,
                    patient_id,
                    key=key,
                    now=now(),
                    first_name=str(body.get("first_name") or ""),
                    email=str(body.get("email") or ""),
                    interest=str(body.get("interest") or "weight-loss care"),
                    product=str(body.get("product") or "weight-loss"),
                    status=str(body.get("status") or "lead"),
                    abandoned_at=str(body.get("abandoned_at") or ""),
                    cta_url=str(body.get("cta_url") or ""),
                    campaigns_update=body.get("campaigns") or {},
                    path=self._store(),
                )
                self._send(200, {"ok": True})
                return
            if path.endswith("/campaigns") and path.startswith("/api/patients/"):
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before editing campaigns.")
                patient_id = path.split("/")[3]
                body = self._read_json()
                flags = body.get("campaigns") or {}
                patients = load_patients(self._store(), key)
                stamp = now()
                updated = []
                for patient in patients:
                    current = patient
                    if patient.id == patient_id:
                        for campaign_id, enrolled in flags.items():
                            current = set_enrollment(current, campaign_id, bool(enrolled), stamp)
                    updated.append(current)
                save_patients(self._store(), updated, key)
                self._send(200, {"ok": True})
                return
            if path == "/api/send":
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before sending.")
                body = self._read_json()
                campaign_id = str(body.get("campaign_id") or "abandoned")
                campaigns = load_campaigns()
                campaign = campaigns.get(campaign_id)
                if campaign is None:
                    raise ConfigError("Unknown campaign.")
                patients = load_patients(self._store(), key)
                preview = send_campaign(
                    patients,
                    campaign,
                    now(),
                    key=key,
                    patient_ids=body.get("patient_ids"),
                    force_to=str(body.get("force_to") or body.get("force_to") or ""),
                    dry_run=bool(body.get("dry_run") or body.get("dry_run")),
                    path=self._store(),
                    mode=self.mode,
                    ignore_due=bool(body.get("ignore_due")),
                )
                dry_run = bool(body.get("dry_run") or body.get("dry_run"))
                self._send(
                    200,
                    {
                        "preview": preview,
                        "message": f"{len(preview)} email(s) {'planned' if dry_run else 'sent'}.",
                    },
                )
                return
        except (ConfigError, ValueError, KeyError, json.JSONDecodeError) as exc:
            self._send(400, {"error": str(exc), "message": str(exc)})
            return
        self._send(404, {"error": f"No route for POST {path}", "message": f"No route for POST {path}"})

    def do_DELETE(self) -> None:
        load_dotenv(self.env_path)
        path = urlparse(self.path).path.rstrip("/")
        try:
            campaign_match = re.fullmatch(r"/api/campaigns/([^/]+)", path)
            if campaign_match:
                delete_campaign(campaign_match.group(1))
                self._send(200, {"ok": True})
                return
            patient_match = re.fullmatch(r"/api/patients/([^/]+)", path)
            if not patient_match:
                self._send(404, {"error": f"No route for DELETE {path}", "message": f"No route for DELETE {path}"})
                return
            key = self._key()
            if key is None:
                raise ConfigError("Unlock PII before deleting a patient.")
            patients = load_patients(self._store(), key)
            delete_patient(patients, patient_match.group(1), key=key, path=self._store())
            self._send(200, {"ok": True})
        except (ConfigError, ValueError, KeyError) as exc:
            self._send(400, {"error": str(exc), "message": str(exc)})


def serve(host: str = "127.0.0.1", port: int = 8787, mode: str | None = None) -> None:
    migrate_legacy_patients()
    Handler.mode = write_mode(mode) if mode else read_mode()
    load_dotenv(Handler.env_path)
    server = ThreadingHTTPServer((host, port), Handler)
    url = f"http://{host}:{port}"
    scheduler.start()
    print(f"Mailer dashboard: {url}")
    print(f"Mode: {Handler.mode}. Patients: {patients_path(Handler.mode)}")
    print(
        f"Campaign scheduler: on (checks every {scheduler.TICK_SECONDS}s while "
        "this stays running and the laptop is awake)."
    )
    print("PHI stays on this computer. Do not expose this port.")
    webbrowser.open(url)
    try:
        server.serve_forever()
    finally:
        scheduler.stop()
