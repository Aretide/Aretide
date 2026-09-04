"""Shared fixtures for the mailer test suite. Not a test module itself."""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

os.environ.setdefault("ABANDONED_PII_KEY", "unit-test-key")

from mailer.campaigns import load_campaigns
from mailer.store import CampaignState, Patient, enroll

STATIC_DIR = Path(__file__).resolve().parent / "static"


def dashboard_html() -> str:
    """The dashboard as a browser would see it: index.html with its
    linked dashboard.css/dashboard*.js inlined back in place, so markup
    tests can keep asserting against one combined document."""
    html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    css = (STATIC_DIR / "dashboard.css").read_text(encoding="utf-8")
    js = (STATIC_DIR / "dashboard.js").read_text(encoding="utf-8")
    js_editors = (STATIC_DIR / "dashboard-editors.js").read_text(encoding="utf-8")
    html = html.replace(
        '<link rel="stylesheet" href="/static/dashboard.css">',
        f"<style>\n{css}</style>",
    )
    html = html.replace(
        '<script src="/static/dashboard.js"></script>\n'
        '  <script src="/static/dashboard-editors.js"></script>',
        f"<script>\n{js}\n{js_editors}</script>",
    )
    return html


def make_patient(**overrides: object) -> Patient:
    now = datetime(2026, 8, 26, 9, 0, tzinfo=__import__("mailer.store", fromlist=["DENVER"]).DENVER)
    campaigns = {cid: CampaignState() for cid in load_campaigns()}
    campaigns["abandoned"] = enroll(CampaignState(), now)
    base = dict(
        id="alex",
        first_name="Alex",
        email="alex@example.com",
        interest="weight-loss care",
        product="weight-loss",
        status="abandoned",
        abandoned_at=now,
        cta_url="https://hive.beemahealth.com",
        campaigns=campaigns,
    )
    base.update(overrides)
    return Patient(**base)  # type: ignore[arg-type]
