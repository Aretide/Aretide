"""Campaign-copy chat. Never send patient names or emails to a model."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from typing import Any, Sequence

from mailer.campaigns import (
    ROOT,
    campaign_payload,
    campaign_from_payload,
    load_campaigns,
    normalize_campaign,
    normalize_step,
)
from mailer.crypto import ConfigError, env_get
from mailer.store import Patient

SKILL_PATH = (
    ROOT / ".claude" / "skills" / "mailer-campaign-steps" / "SKILL.md"
)
EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
)
FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```")


def load_skill() -> str:
    if not SKILL_PATH.is_file():
        raise ConfigError(
            "Campaign step skill is missing at "
            ".claude/skills/mailer-campaign-steps/SKILL.md"
        )
    return SKILL_PATH.read_text(encoding="utf-8")


def llm_status() -> dict[str, Any]:
    model = env_get("MAIL_LLM_MODEL")
    if env_get("ANTHROPIC_API_KEY"):
        return {
            "configured": True,
            "provider": "anthropic",
            "env_var": "ANTHROPIC_API_KEY",
            "model": model or "claude-3-5-haiku-latest",
            "message": "",
        }
    if env_get("OPENAI_API_KEY"):
        return {
            "configured": True,
            "provider": "openai",
            "env_var": "OPENAI_API_KEY",
            "model": model or "gpt-4o-mini",
            "message": "",
        }
    return {
        "configured": False,
        "provider": None,
        "env_var": "ANTHROPIC_API_KEY",
        "model": None,
        "message": (
            "No LLM key. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to "
            ".env.dev, then restart the mailer."
        ),
    }


def assert_chat_safe(user_text: str, patients: Sequence[Patient] | None) -> None:
    text = (user_text or "").strip()
    if not text:
        raise ConfigError(
            "Type a message about the campaign step you want."
        )
    if EMAIL_RE.search(text):
        raise ConfigError(
            "Chat cannot include email addresses. Use placeholders such as "
            "{support_email} instead."
        )
    hay = text.lower()
    for patient in patients or []:
        email = (patient.email or "").strip().lower()
        if email and email != "***" and email in hay:
            raise ConfigError("Chat cannot include patient emails.")
        name = (patient.first_name or "").strip()
        if name and name != "***" and len(name) >= 3 and name.lower() in hay:
            raise ConfigError("Chat cannot include patient names.")


def build_chat_prompt(
    user_text: str,
    campaign: dict,
    patients: Sequence[Patient] | None,
) -> dict[str, str]:
    assert_chat_safe(user_text, patients)
    skill = load_skill()
    user = (
        "Current campaign JSON (copy only, no patient data):\n\n"
        + json.dumps(campaign, indent=2)
        + "\n\nOperator request:\n"
        + user_text.strip()
        + "\n\nRespond with a single JSON object. Do not send email."
    )
    return {"system": skill, "user": user}


def parse_model_json(text: str) -> dict:
    blob = (text or "").strip()
    fence = FENCE_RE.search(blob)
    if fence:
        blob = fence.group(1).strip()
    try:
        data = json.loads(blob)
    except json.JSONDecodeError as exc:
        raise ConfigError("The model did not return valid JSON.") from exc
    if not isinstance(data, dict):
        raise ConfigError("The model did not return a JSON object.")
    return data


def _complete_anthropic(system: str, user: str, model: str, key: str) -> str:
    body = json.dumps(
        {
            "model": model,
            "max_tokens": 2048,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "content-type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))
    content = payload.get("content") or []
    if not content or not isinstance(content[0], dict):
        raise ConfigError("Anthropic returned an empty response.")
    return str(content[0].get("text") or "")


def _complete_openai(system: str, user: str, model: str, key: str) -> str:
    body = json.dumps(
        {
            "model": model,
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))
    choices = payload.get("choices") or []
    if not choices:
        raise ConfigError("OpenAI returned an empty response.")
    message = (choices[0].get("message") or {}).get("content")
    return str(message or "")


def complete_json(system: str, user: str) -> str:
    status = llm_status()
    if not status["configured"]:
        raise ConfigError(status["message"])
    try:
        if status["provider"] == "anthropic":
            return _complete_anthropic(
                system, user, status["model"], env_get("ANTHROPIC_API_KEY")
            )
        return _complete_openai(
            system, user, status["model"], env_get("OPENAI_API_KEY")
        )
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        raise ConfigError(
            f"LLM request failed ({exc.code}). {detail}"
        ) from exc
    except urllib.error.URLError as exc:
        raise ConfigError(f"Could not reach the LLM: {exc.reason}") from exc


def _validated_step(item: dict, campaign: dict) -> dict:
    cta = str(campaign.get("cta_label") or "Continue")
    cta_url = str(campaign.get("cta_url") or "")
    return normalize_step(item, cta, cta_url)


def run_campaign_chat(
    campaign_id: str,
    user_text: str,
    patients: Sequence[Patient] | None,
    *,
    directory=None,
) -> dict[str, Any]:
    status = llm_status()
    if not status["configured"]:
        raise ConfigError(status["message"])
    campaigns = load_campaigns(directory) if directory else load_campaigns()
    campaign = campaigns.get(campaign_id)
    if campaign is None:
        raise ConfigError("Unknown campaign.")
    payload = campaign_payload(campaign)
    prompt = build_chat_prompt(user_text, payload, patients)
    assembled = prompt["system"] + "\n" + prompt["user"]
    for patient in patients or []:
        email = (patient.email or "").strip().lower()
        if email and email != "***" and email in assembled.lower():
            raise ConfigError("Refusing to send patient email to the model.")
    raw = complete_json(prompt["system"], prompt["user"])
    data = parse_model_json(raw)
    message = str(data.get("message") or "Proposed a campaign step.")
    step = None
    steps = None
    insert_after = None
    if isinstance(data.get("step"), dict):
        step = _validated_step(data["step"], payload)
    if isinstance(data.get("steps"), list):
        normalized = normalize_campaign({**payload, "steps": data["steps"]})
        steps = normalized["steps"]
        campaign_from_payload({**payload, "steps": steps})
    after = data.get("insert_after")
    if after:
        insert_after = str(after)
    if step is None and steps is None:
        raise ConfigError(
            message + " The model did not return a usable step."
        )
    return {
        "message": message,
        "step": step,
        "insert_after": insert_after,
        "steps": steps,
        "provider": status["provider"],
        "model": status["model"],
    }
