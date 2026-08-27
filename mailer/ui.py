"""Local-only dashboard. PHI stays on this machine."""

from __future__ import annotations

import json
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from mailer.campaigns import load_campaigns
from mailer.crypto import ConfigError, default_env_path, ensure_pii_key, load_dotenv, try_pii_key
from mailer.engine import add_patient, send_campaign, serialize_patient
from mailer.store import (
    DENVER,
    PATIENTS_PATH,
    load_patients,
    save_patients,
    set_enrollment,
)

STATIC = Path(__file__).resolve().parent / "static" / "index.html"


def now() -> datetime:
    return datetime.now(tz=DENVER)


class Handler(BaseHTTPRequestHandler):
    env_path = default_env_path()

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

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            self._send(200, STATIC.read_text(encoding="utf-8"), "text/html; charset=utf-8")
            return
        if path == "/api/state":
            load_dotenv(self.env_path)
            key = self._key()
            campaigns = load_campaigns()
            patients = load_patients(PATIENTS_PATH, key)
            stamp = now()
            self._send(
                200,
                {
                    "unlocked": key is not None,
                    "campaigns": [
                        {"id": c.id, "label": c.label, "description": c.description}
                        for c in campaigns.values()
                    ],
                    "patients": [
                        serialize_patient(p, campaigns, stamp, reveal=key is not None)
                        for p in patients
                    ],
                },
            )
            return
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        load_dotenv(self.env_path)
        path = urlparse(self.path).path
        try:
            if path == "/api/patients":
                ensure_pii_key(self.env_path, interactive=False)
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before adding a patient.")
                patients = load_patients(PATIENTS_PATH, key)
                body = self._read_json()
                add_patient(
                    patients,
                    first_name=str(body.get("first_name") or ""),
                    email=str(body.get("email") or ""),
                    interest=str(body.get("interest") or "weight-loss care"),
                    product=str(body.get("product") or "weight-loss"),
                    status=str(body.get("status") or "abandoned"),
                    abandoned_at=str(body.get("abandoned_at") or ""),
                    campaign_ids=body.get("campaign_ids") or ["abandoned"],
                    key=key,
                    now=now(),
                )
                self._send(200, {"ok": True})
                return
            if path.startswith("/api/patients/") and path.endswith("/campaigns"):
                key = self._key()
                if key is None:
                    raise ConfigError("Unlock PII before editing campaigns.")
                patient_id = path.split("/")[3]
                body = self._read_json()
                flags = body.get("campaigns") or {}
                patients = load_patients(PATIENTS_PATH, key)
                stamp = now()
                updated = []
                for patient in patients:
                    current = patient
                    if patient.id == patient_id:
                        for campaign_id, enrolled in flags.items():
                            current = set_enrollment(current, campaign_id, bool(enrolled), stamp)
                    updated.append(current)
                save_patients(PATIENTS_PATH, updated, key)
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
                patients = load_patients(PATIENTS_PATH, key)
                preview = send_campaign(
                    patients,
                    campaign,
                    now(),
                    key=key,
                    patient_ids=body.get("patient_ids"),
                    force_to=str(body.get("force_to") or ""),
                    dry_run=bool(body.get("dry_run")),
                )
                self._send(
                    200,
                    {
                        "preview": preview,
                        "message": f"{len(preview)} email(s) {'planned' if body.get('dry_run') else 'sent'}.",
                    },
                )
                return
        except (ConfigError, ValueError, KeyError, json.JSONDecodeError) as exc:
            self._send(400, {"error": str(exc), "message": str(exc)})
            return
        self._send(404, {"error": "not found"})


def serve(host: str = "127.0.0.1", port: int = 8787) -> None:
    load_dotenv(Handler.env_path)
    server = ThreadingHTTPServer((host, port), Handler)
    url = f"http://{host}:{port}"
    print(f"Mailer dashboard: {url}")
    print("PHI stays on this computer. Do not expose this port.")
    webbrowser.open(url)
    server.serve_forever()
