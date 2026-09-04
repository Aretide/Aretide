"""Load campaign JSON and compute the next due step."""

from __future__ import annotations

import ast
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from zoneinfo import ZoneInfo

from mailer.richtext import sanitize_inline_html, strip_all_tags, validate_url

ROOT = Path(__file__).resolve().parent.parent
CAMPAIGNS_DIR = ROOT / "campaigns"
DENVER = ZoneInfo("America/Denver")
EM_DASH = "\u2014"
CAMPAIGN_ID_RE = re.compile(r"^[a-z0-9][a-z0-9\-]*$")
STEP_ID_RE = re.compile(r"^[a-z0-9][a-z0-9\-]*$")
PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")
_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
_TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")
ANCHORS = {"abandoned_at", "enrolled_at"}
SCHEDULE_KINDS = ("interval", "weekly")
WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
# every_minutes bounds: 1 minute (fast testing) to one week.
MIN_SCHEDULE_MINUTES = 1
MAX_SCHEDULE_MINUTES = 7 * 24 * 60
# Always available in every campaign, no declaration needed. first_name /
# interest / product / email are the recipient patient's own fields;
# support_email is always the Beema support inbox (see SUPPORT_EMAIL in
# emailing.py) and cannot be overridden per campaign.
BUILTIN_PLACEHOLDERS = {
    "first_name",
    "interest",
    "product",
    "email",
    "support_email",
}


@dataclass(frozen=True)
class CampaignStep:
    id: str
    delay: timedelta
    subject: str
    body: str
    cta_label: str
    greeting: str = "Hey {first_name},"
    closing: str = ""
    cta_url: str = ""
    delay_text: str = ""
    body_parts: tuple[str, ...] = ()
    buttons: tuple[dict, ...] = ()
    version: int = 1


@dataclass(frozen=True)
class Campaign:
    id: str
    label: str
    description: str
    anchor: str
    cta_url: str
    cta_label: str
    extras: dict[str, str]
    ready: bool
    steps: tuple[CampaignStep, ...]
    show_header: bool = True
    show_footer: bool = True
    version: int = 1
    schedule: dict | None = None

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

    def latest_step_by_elapsed(self, elapsed: timedelta) -> str | None:
        """The id of the last step whose `delay` has already passed, or None.

        Used to back-date an imported patient: set this as their `last_step` so
        the drip picks up at the step that matches how long ago they abandoned.
        """
        chosen: str | None = None
        for step in self.steps:
            if step.delay <= elapsed:
                chosen = step.id
        return chosen


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


def normalize_body(body: object) -> str:
    if isinstance(body, (list, tuple)):
        return _join_parts(body)
    text = str(body or "").strip()
    if text.startswith("[") and text.endswith("]"):
        try:
            parsed = ast.literal_eval(text)
        except (ValueError, SyntaxError, MemoryError):
            parsed = None
        if isinstance(parsed, (list, tuple)):
            return _join_parts(parsed)
    return str(body or "")


def _join_parts(parts: object) -> str:
    return "\n\n".join(str(part).strip() for part in parts if str(part).strip())


def body_parts_from(body: object) -> tuple[str, ...]:
    if isinstance(body, (list, tuple)):
        return tuple(str(part).strip() for part in body if str(part).strip())
    text = normalize_body(body)
    if "\n\n" in text:
        return tuple(
            part.strip() for part in text.split("\n\n") if part.strip()
        )
    return (text,) if text else ()


def step_body(item: dict) -> str:
    return normalize_body(item.get("body"))


def delay_to_text(delay: timedelta) -> str:
    seconds = int(delay.total_seconds())
    if seconds % 86400 == 0:
        return f"{seconds // 86400}d"
    if seconds % 3600 == 0:
        return f"{seconds // 3600}h"
    if seconds % 60 == 0:
        return f"{seconds // 60}m"
    raise ValueError(f"Cannot format delay {delay}.")


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
                body=step_body(item),
                cta_label=str(
                    item.get("cta_label")
                    or payload.get("cta_label")
                    or "Continue"
                ),
                greeting=str(item.get("greeting") or "Hey {first_name},"),
                closing=str(item.get("closing") or ""),
                cta_url=str(item.get("cta_url") or ""),
                delay_text=str(item["delay"]),
                body_parts=body_parts_from(item.get("body")),
                buttons=tuple(
                    {
                        "label": str(b.get("label") or ""),
                        "url": str(b.get("url") or ""),
                        **({"align": str(b["align"])} if b.get("align") else {}),
                        **({"bg": str(b["bg"])} if b.get("bg") else {}),
                        **({"color": str(b["color"])} if b.get("color") else {}),
                    }
                    for b in (item.get("buttons") or [])
                ),
                version=int(item.get("version") or 1),
            )
            for item in payload.get("steps") or []
        )
        extras_raw = payload.get("placeholders") or {}
        extras = {
            str(name): str(value)
            for name, value in extras_raw.items()
        } if isinstance(extras_raw, dict) else {}
        try:
            schedule = normalize_schedule(payload.get("schedule"))
        except ValueError:
            schedule = None  # a bad hand-edited schedule must not break loading
        campaign = Campaign(
            id=str(payload["id"]),
            label=str(payload.get("label") or payload["id"]),
            description=str(payload.get("description") or ""),
            anchor=str(payload.get("anchor") or "enrolled_at"),
            cta_url=str(payload.get("cta_url") or ""),
            cta_label=str(payload.get("cta_label") or "Continue"),
            extras=extras,
            ready=bool(payload.get("ready", False)),
            steps=steps,
            show_header=bool(payload.get("show_header", True)),
            show_footer=bool(payload.get("show_footer", True)),
            version=int(payload.get("version") or 1),
            schedule=schedule,
        )
        loaded[campaign.id] = campaign
    return loaded


def visible_campaigns(campaigns: dict[str, Campaign], mode: str) -> dict[str, Campaign]:
    if mode == "prod":
        return {cid: campaign for cid, campaign in campaigns.items() if campaign.ready}
    return campaigns


def set_campaign_ready(
    campaign_id: str,
    ready: bool,
    directory: Path = CAMPAIGNS_DIR,
) -> Campaign:
    path = directory / f"{campaign_id}.json"
    if not path.is_file():
        raise ValueError(f"No campaign file named {campaign_id}.json")
    payload = json.loads(path.read_text(encoding="utf-8"))
    payload["ready"] = bool(ready)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    campaigns = load_campaigns(directory)
    campaign = campaigns.get(campaign_id)
    if campaign is None:
        raise ValueError(f"Campaign {campaign_id} did not reload.")
    return campaign


def step_payload(step: CampaignStep) -> dict:
    parts = list(step.body_parts) if step.body_parts else (
        [part for part in step.body.split("\n\n") if part.strip()]
        or [step.body]
    )
    return {
        "id": step.id,
        "delay": step.delay_text or delay_to_text(step.delay),
        "subject": step.subject,
        "body": parts,
        "cta_label": step.cta_label,
        "cta_url": step.cta_url,
        "greeting": step.greeting,
        "closing": step.closing,
        "buttons": [dict(b) for b in step.buttons],
        "version": step.version,
    }


def campaign_payload(campaign: Campaign) -> dict:
    extras = dict(campaign.extras)
    return {
        "id": campaign.id,
        "label": campaign.label,
        "description": campaign.description,
        "anchor": campaign.anchor,
        "cta_url": campaign.cta_url,
        "cta_label": campaign.cta_label,
        "placeholders": extras,
        "ready": campaign.ready,
        "show_header": campaign.show_header,
        "show_footer": campaign.show_footer,
        "version": campaign.version,
        "schedule": campaign.schedule,
        "steps": [step_payload(step) for step in campaign.steps],
    }


def find_em_dash(obj: object, path: str = "") -> str | None:
    if isinstance(obj, str):
        if EM_DASH in obj:
            return path or "copy"
        return None
    if isinstance(obj, dict):
        for key, value in obj.items():
            found = find_em_dash(
                value, f"{path}.{key}" if path else str(key)
            )
            if found:
                return found
        return None
    if isinstance(obj, (list, tuple)):
        for index, value in enumerate(obj):
            found = find_em_dash(value, f"{path}[{index}]")
            if found:
                return found
    return None


def assert_no_em_dash(obj: object) -> None:
    found = find_em_dash(obj)
    if found:
        raise ValueError(
            f"Em dash is not allowed ({found}). Use a spaced hyphen - instead."
        )


def collect_placeholders(*texts: str) -> set[str]:
    names: set[str] = set()
    for text in texts:
        names.update(PLACEHOLDER_RE.findall(text or ""))
    return names


def assert_known_placeholders(payload: dict) -> None:
    extras = set((payload.get("placeholders") or {}).keys())
    known = BUILTIN_PLACEHOLDERS | extras
    texts = [
        str(payload.get("label") or ""),
        str(payload.get("description") or ""),
    ]
    for step in payload.get("steps") or []:
        texts.append(str(step.get("subject") or ""))
        texts.append(str(step.get("cta_label") or ""))
        body = step.get("body")
        if isinstance(body, list):
            texts.extend(str(part) for part in body)
        else:
            texts.append(str(body or ""))
    unknown = collect_placeholders(*texts) - known
    if unknown:
        names = ", ".join(sorted(unknown))
        raise ValueError(
            f"Unknown placeholder(s): {names}. Add them under placeholders, "
            "or use a built-in: first_name, interest, product, email, support_email."
        )


def with_utm_content(base_url: str, step_id: str) -> str:
    """`base_url` with `utm_content=<step_id>` in the query, replacing any
    existing utm_content. Returns "" when there is no base URL."""
    base_url = (base_url or "").strip()
    if not base_url or not step_id:
        return base_url
    parts = urlsplit(base_url)
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key != "utm_content"
    ]
    query.append(("utm_content", step_id))
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )


def normalize_step(
    item: dict, campaign_cta: str, campaign_cta_url: str = ""
) -> dict:
    if not isinstance(item, dict):
        raise ValueError("Each step must be an object.")
    raw_id = str(item.get("id") or "").strip().lower().replace(" ", "-")
    if not STEP_ID_RE.fullmatch(raw_id):
        raise ValueError(
            f"Step id '{item.get('id')}' must be lowercase letters, "
            "numbers, and hyphens."
        )
    delay = str(item.get("delay") or "").strip()
    parse_delay(delay)
    subject = strip_all_tags(str(item.get("subject") or "")).strip()
    if not subject:
        raise ValueError(f"Step {raw_id} needs a subject.")
    raw_body = item.get("body")
    if not isinstance(raw_body, list):
        raise ValueError(
            f"Step {raw_id} body must be a JSON array of paragraph strings."
        )
    parts = [
        sanitize_inline_html(part) for part in body_parts_from(raw_body)
    ]
    parts = [part for part in parts if part]
    if not parts:
        raise ValueError(f"Step {raw_id} needs a body.")
    greeting = (
        strip_all_tags(str(item.get("greeting") or "Hey {first_name},")).strip()
        or "Hey {first_name},"
    )
    closing = strip_all_tags(str(item.get("closing") or "")).strip()
    step = {
        "id": raw_id,
        "delay": delay,
        "subject": subject,
        "body": list(parts),
        "greeting": greeting,
    }
    if closing:
        step["closing"] = closing
    cta = strip_all_tags(str(item.get("cta_label") or "")).strip()
    if cta and cta != campaign_cta:
        step["cta_label"] = cta
    campaign_cta_url = (campaign_cta_url or "").strip()
    cta_url = str(item.get("cta_url") or "").strip()
    if cta_url:
        if not validate_url(cta_url):
            raise ValueError(
                f"Step {raw_id} CTA link must be a valid http(s) or mailto URL."
            )
        if cta_url != campaign_cta_url:
            step["cta_url"] = cta_url
    # Link a URL-less button in this step falls back to.
    default_button_url = cta_url or campaign_cta_url
    raw_buttons = item.get("buttons") or []
    if not isinstance(raw_buttons, list):
        raise ValueError(f"Step {raw_id} buttons must be a JSON array.")
    if len(raw_buttons) > 5:
        raise ValueError(f"Step {raw_id} can have at most 5 buttons.")
    buttons = []
    for entry in raw_buttons:
        if not isinstance(entry, dict):
            raise ValueError(f"Step {raw_id} has a button with no label.")
        label = strip_all_tags(str(entry.get("label") or "")).strip()
        url = str(entry.get("url") or "").strip()
        if not label and not url:
            continue
        if not label:
            raise ValueError(f"Step {raw_id} has a button with no label.")
        if url and not validate_url(url):
            raise ValueError(
                f"Step {raw_id} button '{label}' needs a valid http(s) or mailto URL."
            )
        if not url and not default_button_url:
            raise ValueError(
                f"Step {raw_id} button '{label}' has no link and there is no "
                "campaign CTA URL to fall back on. Set the campaign CTA URL on "
                "the Details tab, or give the button its own URL."
            )
        # "" means "ride the campaign CTA link"; render resolves it to
        # <link>&utm_content=<step id> so a link change updates every step.
        button = {"label": label, "url": url}
        align = str(entry.get("align") or "").strip()
        if align:
            if align not in ("left", "center", "right"):
                raise ValueError(
                    f"Step {raw_id} button '{label}' has an invalid alignment."
                )
            button["align"] = align
        for color_key in ("bg", "color"):
            color = str(entry.get(color_key) or "").strip()
            if color:
                if not _HEX_COLOR_RE.fullmatch(color):
                    raise ValueError(
                        f"Step {raw_id} button '{label}' needs a 6-digit hex "
                        "color like #E5B01A."
                    )
                button[color_key] = color
        buttons.append(button)
    if buttons:
        step["buttons"] = buttons
    return step


def normalize_schedule(raw: object) -> dict | None:
    """Validate a campaign automation schedule, or None if there is none.

    Shape:
      {"enabled": bool, "kind": "interval"|"weekly",
       "every_minutes": int,                 # kind == "interval"
       "days": ["mon", ...], "time": "HH:MM"} # kind == "weekly"

    The day/time config is kept even when disabled so toggling off does not
    lose it.
    """
    if not isinstance(raw, dict):
        return None
    kind = str(raw.get("kind") or "interval").strip().lower()
    if kind not in SCHEDULE_KINDS:
        raise ValueError("Schedule kind must be interval or weekly.")
    enabled = bool(raw.get("enabled"))

    every_minutes = raw.get("every_minutes", 60)
    try:
        every_minutes = int(every_minutes)
    except (TypeError, ValueError):
        raise ValueError("Schedule every_minutes must be a whole number of minutes.")
    if not MIN_SCHEDULE_MINUTES <= every_minutes <= MAX_SCHEDULE_MINUTES:
        raise ValueError(
            f"Schedule interval must be {MIN_SCHEDULE_MINUTES}-{MAX_SCHEDULE_MINUTES} minutes."
        )

    days_raw = raw.get("days") or []
    if not isinstance(days_raw, (list, tuple)):
        raise ValueError("Schedule days must be a list of weekday names.")
    days = [str(d).strip().lower()[:3] for d in days_raw]
    unknown = sorted(set(days) - set(WEEKDAYS))
    if unknown:
        raise ValueError(f"Unknown weekday(s): {', '.join(unknown)}.")
    days = [d for d in WEEKDAYS if d in days]  # dedupe + canonical order

    time_str = str(raw.get("time") or "09:00").strip()
    if not _TIME_RE.fullmatch(time_str):
        raise ValueError("Schedule time must be HH:MM in 24-hour form, e.g. 09:00.")

    if enabled and kind == "weekly" and not days:
        raise ValueError("A weekly schedule needs at least one day selected.")

    schedule = {"enabled": enabled, "kind": kind}
    if kind == "interval":
        schedule["every_minutes"] = every_minutes
    else:
        schedule["days"] = days
        schedule["time"] = time_str
    return schedule


def schedule_summary(schedule: dict | None) -> str:
    """One-line human description of a schedule, for the dashboard and status."""
    if not schedule:
        return "Off"
    if not schedule.get("enabled"):
        return "Off (saved settings kept)"
    if schedule.get("kind") == "weekly":
        days = schedule.get("days") or []
        pretty = ", ".join(d.capitalize() for d in days) or "no days"
        return f"Weekly on {pretty} at {schedule.get('time', '09:00')} (Denver)"
    minutes = int(schedule.get("every_minutes") or 60)
    if minutes % 60 == 0:
        hours = minutes // 60
        return f"Every {hours} hour{'s' if hours != 1 else ''}"
    return f"Every {minutes} minute{'s' if minutes != 1 else ''}"


def normalize_campaign(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("Campaign must be a JSON object.")
    cid = str(payload.get("id") or "").strip()
    if not CAMPAIGN_ID_RE.fullmatch(cid):
        raise ValueError(
            "Campaign id must be lowercase letters, numbers, and hyphens."
        )
    label = str(payload.get("label") or "").strip()
    if not label:
        raise ValueError("Campaign label is required.")
    anchor = str(payload.get("anchor") or "enrolled_at").strip()
    if anchor not in ANCHORS:
        raise ValueError("Anchor must be abandoned_at or enrolled_at.")
    cta_url = str(payload.get("cta_url") or "").strip()
    cta_label = str(payload.get("cta_label") or "Continue").strip() or "Continue"
    extras_raw = payload.get("placeholders") or {}
    if extras_raw is None:
        extras_raw = {}
    if not isinstance(extras_raw, dict):
        raise ValueError("placeholders must be an object of name/value strings.")
    placeholders = {
        str(name).strip(): str(value)
        for name, value in extras_raw.items()
        if str(name).strip() and str(name).strip() not in BUILTIN_PLACEHOLDERS
    }
    steps_raw = payload.get("steps")
    if not isinstance(steps_raw, list) or not steps_raw:
        raise ValueError("A campaign needs at least one step.")
    steps = [
        normalize_step(item, cta_label, cta_url) for item in steps_raw
    ]
    ids = [step["id"] for step in steps]
    if len(ids) != len(set(ids)):
        raise ValueError("Step ids must be unique.")
    out: dict = {
        "id": cid,
        "label": label,
        "description": str(payload.get("description") or "").strip(),
        "anchor": anchor,
        "cta_url": cta_url,
        "cta_label": cta_label,
        "ready": bool(payload.get("ready")),
        "show_header": bool(payload.get("show_header", True)),
        "show_footer": bool(payload.get("show_footer", True)),
        "steps": steps,
    }
    if placeholders:
        out["placeholders"] = placeholders
    schedule = normalize_schedule(payload.get("schedule"))
    if schedule is not None:
        out["schedule"] = schedule
    assert_no_em_dash(out)
    assert_known_placeholders(out)
    return out


def format_campaign_json(payload: dict) -> str:
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def campaign_from_payload(payload: dict) -> Campaign:
    normalized = normalize_campaign(payload)
    extras = {
        str(name): str(value)
        for name, value in (normalized.get("placeholders") or {}).items()
    }
    steps = tuple(
        CampaignStep(
            id=item["id"],
            delay=parse_delay(item["delay"]),
            subject=item["subject"],
            body=normalize_body(item["body"]),
            cta_label=str(
                item.get("cta_label") or normalized["cta_label"] or "Continue"
            ),
            greeting=item.get("greeting") or "Hey {first_name},",
            closing=item.get("closing") or "",
            cta_url=item.get("cta_url") or "",
            delay_text=item["delay"],
            body_parts=tuple(item["body"]),
            buttons=tuple(item.get("buttons") or []),
        )
        for item in normalized["steps"]
    )
    return Campaign(
        id=normalized["id"],
        label=normalized["label"],
        description=normalized["description"],
        anchor=normalized["anchor"],
        cta_url=normalized["cta_url"],
        cta_label=normalized["cta_label"],
        extras=extras,
        ready=normalized["ready"],
        steps=steps,
        show_header=normalized["show_header"],
        show_footer=normalized["show_footer"],
        schedule=normalized.get("schedule"),
    )


def unique_campaign_id(
    directory: Path = CAMPAIGNS_DIR,
    base: str = "new-campaign",
) -> str:
    existing = (
        {path.stem for path in directory.glob("*.json")}
        if directory.is_dir()
        else set()
    )
    if base not in existing:
        return base
    n = 2
    while f"{base}-{n}" in existing:
        n += 1
    return f"{base}-{n}"


def default_campaign_payload(campaign_id: str) -> dict:
    return {
        "id": campaign_id,
        "label": "New campaign",
        "description": "",
        "anchor": "enrolled_at",
        "cta_url": "https://hive.beemahealth.com",
        "cta_label": "Continue",
        "ready": False,
        "show_header": True,
        "show_footer": True,
        "placeholders": {},
        "steps": [
            {
                "id": "first",
                "delay": "0m",
                "subject": "Hello from Beema Health",
                "greeting": "Hey {first_name},",
                "body": ["Thanks for being here."],
            }
        ],
    }


def history_path(cid: str, directory: Path = CAMPAIGNS_DIR) -> Path:
    return directory / "_history" / f"{cid}.jsonl"


def _last_payload_snapshot(cid: str, directory: Path = CAMPAIGNS_DIR) -> dict | None:
    """The payload from the most recent history line that has one.

    A delete (or rename) appends an event line with no "payload" - skip past
    those so a deleted-then-recreated campaign still keeps counting versions
    upward instead of resetting to 1.
    """
    path = history_path(cid, directory)
    if not path.is_file():
        return None
    found: dict | None = None
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(entry.get("payload"), dict):
                found = entry["payload"]
    return found


def _previous_snapshot(cid: str, directory: Path = CAMPAIGNS_DIR) -> dict | None:
    """The last saved shape of a campaign, live file first, then history.

    Falls back to the history log so a deleted-then-recreated campaign keeps
    counting versions upward instead of resetting to 1.
    """
    path = directory / f"{cid}.json"
    if path.is_file():
        return json.loads(path.read_text(encoding="utf-8"))
    return _last_payload_snapshot(cid, directory)


def append_history(cid: str, entry: dict, directory: Path = CAMPAIGNS_DIR) -> None:
    """Append one JSON line. Never rewrites or truncates the file."""
    path = history_path(cid, directory)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


def campaign_history(cid: str, directory: Path = CAMPAIGNS_DIR) -> list[dict]:
    path = history_path(cid, directory)
    if not path.is_file():
        return []
    entries: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def _step_content_equal(a: dict, b: dict) -> bool:
    fields = ("delay", "subject", "body", "cta_label")
    return all(a.get(field) == b.get(field) for field in fields)


def _stamp_versions(normalized: dict, previous: dict | None) -> dict:
    prev_version = int((previous or {}).get("version") or 0)
    normalized["version"] = prev_version + 1
    prev_steps = {
        str(item.get("id")): item
        for item in (previous or {}).get("steps") or []
        if isinstance(item, dict)
    }
    for step in normalized["steps"]:
        prev_step = prev_steps.get(step["id"])
        if prev_step is None:
            step["version"] = 1
        elif _step_content_equal(step, prev_step):
            step["version"] = int(prev_step.get("version") or 1)
        else:
            step["version"] = int(prev_step.get("version") or 1) + 1
    return normalized


def save_campaign(
    payload: dict,
    directory: Path = CAMPAIGNS_DIR,
    *,
    previous_id: str | None = None,
) -> Campaign:
    normalized = normalize_campaign(payload)
    cid = normalized["id"]
    path = directory / f"{cid}.json"
    prev = (previous_id or "").strip()
    renaming = bool(prev and prev != cid)
    previous = _previous_snapshot(prev if renaming else cid, directory)
    normalized = _stamp_versions(normalized, previous)
    if renaming:
        prev_path = directory / f"{prev}.json"
        if not prev_path.is_file():
            raise ValueError(f"No campaign file named {prev}.json")
        if path.is_file():
            raise ValueError(f"Campaign {cid} already exists.")
        path.write_text(format_campaign_json(normalized), encoding="utf-8")
        prev_path.unlink()
        append_history(
            prev,
            {
                "renamed_at": datetime.now(tz=DENVER).isoformat(),
                "renamed_to": cid,
                "last_version": int((previous or {}).get("version") or 0),
            },
            directory,
        )
    else:
        path.write_text(format_campaign_json(normalized), encoding="utf-8")
    append_history(
        cid,
        {
            "saved_at": datetime.now(tz=DENVER).isoformat(),
            "version": normalized["version"],
            "payload": normalized,
        },
        directory,
    )
    campaigns = load_campaigns(directory)
    campaign = campaigns.get(cid)
    if campaign is None:
        raise ValueError(f"Campaign {cid} did not reload.")
    return campaign


def delete_campaign(
    campaign_id: str,
    directory: Path = CAMPAIGNS_DIR,
) -> None:
    cid = str(campaign_id or "").strip()
    if not CAMPAIGN_ID_RE.fullmatch(cid):
        raise ValueError(
            "Campaign id must be lowercase letters, numbers, and hyphens."
        )
    path = directory / f"{cid}.json"
    if not path.is_file():
        raise ValueError(f"No campaign file named {cid}.json")
    previous = _previous_snapshot(cid, directory)
    path.unlink()
    append_history(
        cid,
        {
            "deleted_at": datetime.now(tz=DENVER).isoformat(),
            "last_version": int((previous or {}).get("version") or 0),
        },
        directory,
    )
