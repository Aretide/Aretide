"""Load campaign JSON and compute the next due step."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
CAMPAIGNS_DIR = ROOT / "campaigns"
DENVER = ZoneInfo("America/Denver")


@dataclass(frozen=True)
class CampaignStep:
    id: str
    delay: timedelta
    subject: str
    body: str
    cta_label: str


@dataclass(frozen=True)
class Campaign:
    id: str
    label: str
    description: str
    anchor: str
    cta_url: str
    cta_label: str
    steps: tuple[CampaignStep, ...]

    def step_by_id(self, step_id: str) -> CampaignStep | None:
        for step in self.steps:
            if step.id == step_id:
                return step
        return None

    def next_after(self, step_id: str | None) -> CampaignStep | None:
        if not self.steps:
            return None
        if step_id is None:
            return self.steps[0]
        for index, step in enumerate(self.steps):
            if step.id == step_id:
                if index + 1 < len(self.steps):
                    return self.steps[index + 1]
                return None
        return None


def parse_delay(raw: str) -> timedelta:
    text = raw.strip().lower()
    if text.endswith("m") and text[:-1].isdigit():
        return timedelta(minutes=int(text[:-1]))
    if text.endswith("h") and text[:-1].isdigit():
        return timedelta(hours=int(text[:-1]))
    if text.endswith("d") and text[:-1].isdigit():
        return timedelta(days=int(text[:-1]))
    if text.isdigit():
        return timedelta(minutes=int(text))
    raise ValueError(f"Invalid delay: {raw}")


def load_campaigns(directory: Path = CAMPAIGNS_DIR) -> dict[str, Campaign]:
    loaded: dict[str, Campaign] = {}
    if not directory.is_dir():
        return loaded
    for path in sorted(directory.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        steps = tuple(
            CampaignStep(
                id=str(item["id"]),
                delay=parse_delay(str(item["delay"])),
                subject=str(item["subject"]),
                body=str(item["body"]),
                cta_label=str(item.get("cta_label") or payload.get("cta_label") or "Continue"),
            )
            for item in payload.get("steps") or []
        )
        campaign = Campaign(
            id=str(payload["id"]),
            label=str(payload.get("label") or payload["id"]),
            description=str(payload.get("description") or ""),
            anchor=str(payload.get("anchor") or "enrolled_at"),
            cta_url=str(payload.get("cta_url") or ""),
            cta_label=str(payload.get("cta_label") or "Continue"),
            steps=steps,
        )
        loaded[campaign.id] = campaign
    return loaded
