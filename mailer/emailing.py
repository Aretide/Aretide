"""Render and send campaign emails. PII is only used in memory."""

from __future__ import annotations

import ssl
import smtplib
from datetime import datetime
from email.message import EmailMessage
from html import escape as html_escape
from pathlib import Path
from typing import Mapping, Sequence

from mailer.campaigns import CampaignStep
from mailer.crypto import ConfigError, env_get
from mailer.store import Patient

ROOT = Path(__file__).resolve().parent.parent
LOGO_PATH = ROOT / "public" / "beema-lockup.jpg"
LOGO_CID = "beema-lockup"
LOGO_URL = f"cid:{LOGO_CID}"
SITE_URL = "https://beemahealth.com"
PRIVACY_URL = f"{SITE_URL}/legal/privacy/"
TERMS_URL = f"{SITE_URL}/legal/terms/"
TELEHEALTH_CONSENT_URL = f"{SITE_URL}/legal/telehealth-consent/"
CONTACT_URL = f"{SITE_URL}/contact/"
SUPPORT_EMAIL = "support@beemahealth.com"
SUPPORT_PHONE_DISPLAY = "+1 303-351-4505"
SUPPORT_PHONE_HREF = "tel:+13033514505"
BUSINESS_ADDRESS = "PO Box 15, Colorado Springs, CO 80901"
BRAND_YELLOW = "#E5B01A"
INK = "#1A1A1A"
MUTED = "#5C5C5C"
RULE = "#E6E6E6"
LINK_BLUE = "#1A73E8"
FOOTER_TAGLINE = (
    "Weight-loss care guided by independently licensed clinicians, "
    "transparent pricing, and support for the long run."
)
DISCLAIMER = (
    "Beema Health is a telehealth platform that connects patients with "
    "independently licensed clinicians. Completing intake does not "
    "guarantee a prescription. Clinicians make all medical decisions "
    "independently. If you are experiencing a medical emergency, "
    "call 911. This platform does not provide emergency care."
)


def fill(template: str, patient: Patient) -> str:
    return template.format(
        first_name=patient.first_name,
        interest=patient.interest,
        product=patient.product,
        email=patient.email,
    )


def render_plain(patient: Patient, step: CampaignStep, cta_url: str, *, year: int) -> str:
    body = fill(step.body, patient)
    return "\n".join(
        [
            f"Hi {patient.first_name},",
            "",
            body,
            "",
            f"{step.cta_label}: {cta_url}",
            "",
            "Beema Health",
            FOOTER_TAGLINE,
            f"{SUPPORT_PHONE_DISPLAY} | {SUPPORT_EMAIL} | {CONTACT_URL}",
            f"Privacy Policy: {PRIVACY_URL}",
            f"Terms of Service: {TERMS_URL}",
            f"Telehealth Consent: {TELEHEALTH_CONSENT_URL}",
            "",
            DISCLAIMER,
            BUSINESS_ADDRESS,
            f"© {year} Beema Health. All rights reserved.",
            "",
            f"To unsubscribe, email {SUPPORT_EMAIL} with subject Unsubscribe.",
        ]
    )


def render_html(patient: Patient, step: CampaignStep, cta_url: str, *, year: int) -> str:
    first_name = html_escape(patient.first_name)
    href = html_escape(cta_url, quote=True)
    body = html_escape(fill(step.body, patient))
    tagline = html_escape(FOOTER_TAGLINE)
    disclaimer = html_escape(DISCLAIMER)
    address = html_escape(BUSINESS_ADDRESS)
    phone = html_escape(SUPPORT_PHONE_DISPLAY)
    cta_label = html_escape(step.cta_label)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beema Health</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:{INK};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:0 0 28px 0;">
            <img src="{LOGO_URL}" alt="Beema Health" width="480" style="display:block;border:0;width:480px;max-width:100%;height:auto;">
          </td>
        </tr>
        <tr>
          <td style="font-size:16px;line-height:1.6;color:{INK};">
            <p style="margin:0 0 16px 0;font-weight:bold;">Hi {first_name},</p>
            <p style="margin:0 0 28px 0;">{body}</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 0 32px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" bgcolor="{BRAND_YELLOW}" style="border-radius:8px;">
                  <a href="{href}" target="_blank" style="display:inline-block;padding:14px 44px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:{INK};text-decoration:none;">
                    {cta_label}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid {RULE};padding:28px 8px 0 8px;text-align:center;font-size:13px;line-height:1.6;color:{MUTED};">
            <p style="margin:0 0 8px 0;font-weight:bold;color:{INK};">Beema Health</p>
            <p style="margin:0 0 16px 0;">{tagline}</p>
            <p style="margin:0 0 8px 0;">
              <a href="{SUPPORT_PHONE_HREF}" style="color:{LINK_BLUE};text-decoration:none;">{phone}</a>
              &nbsp;|&nbsp;
              <a href="mailto:{SUPPORT_EMAIL}" style="color:{LINK_BLUE};">{SUPPORT_EMAIL}</a>
              &nbsp;|&nbsp;
              <a href="{CONTACT_URL}" style="color:{LINK_BLUE};">Contact Us</a>
            </p>
            <p style="margin:0 0 16px 0;">
              <a href="{PRIVACY_URL}" style="color:{LINK_BLUE};">Privacy Policy</a>
              &nbsp;·&nbsp;
              <a href="{TERMS_URL}" style="color:{LINK_BLUE};">Terms of Service</a>
              &nbsp;·&nbsp;
              <a href="{TELEHEALTH_CONSENT_URL}" style="color:{LINK_BLUE};">Telehealth Consent</a>
            </p>
            <p style="margin:0 0 16px 0;font-size:12px;">{disclaimer}</p>
            <p style="margin:0 0 4px 0;font-size:12px;">{address}</p>
            <p style="margin:0;font-size:12px;">© {year} Beema Health. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
"""


def smtp_settings() -> dict[str, str]:
    host = env_get("SMTP_HOST") or env_get("EMAIL_HOST") or "smtp.gmail.com"
    port = env_get("SMTP_PORT") or env_get("EMAIL_PORT") or "587"
    user = env_get("SMTP_USER") or env_get("EMAIL_HOST_USER") or SUPPORT_EMAIL
    password = (
        env_get("SMTP_PASSWORD") or env_get("EMAIL_HOST_PASSWORD")
    ).replace(" ", "")
    from_header = env_get("SMTP_FROM") or (
        f"Beema Health <{env_get('DEFAULT_FROM_EMAIL') or SUPPORT_EMAIL}>"
    )
    if not password:
        raise ConfigError(
            "SMTP_PASSWORD is missing. Add SMTP_PASSWORD or EMAIL_HOST_PASSWORD."
        )
    if not port.isdigit():
        raise ConfigError("SMTP_PORT must be a number.")
    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from_header": from_header,
    }


def build_message(
    patient: Patient,
    step: CampaignStep,
    envelope_to: str,
    cta_url: str,
    *,
    from_header: str,
    year: int,
) -> EmailMessage:
    html = render_html(patient, step, cta_url, year=year)
    text = render_plain(patient, step, cta_url, year=year)
    message = EmailMessage()
    message["Subject"] = fill(step.subject, patient)
    message["From"] = from_header
    message["To"] = envelope_to
    message["Reply-To"] = SUPPORT_EMAIL
    message["List-Unsubscribe"] = f"<mailto:{SUPPORT_EMAIL}?subject=Unsubscribe>"
    message.set_content(text)
    message.add_alternative(html, subtype="html")
    if not LOGO_PATH.is_file():
        raise ConfigError(f"Missing email lockup image: {LOGO_PATH}")
    html_part = message.get_payload()[-1]
    html_part.add_related(
        LOGO_PATH.read_bytes(),
        maintype="image",
        subtype="jpeg",
        cid=LOGO_CID,
        filename="beema-lockup.jpg",
    )
    return message


def send_messages(
    messages: Sequence[EmailMessage],
    settings: Mapping[str, str],
) -> None:
    context = ssl.create_default_context()
    with smtplib.SMTP(settings["host"], int(settings["port"]), timeout=30) as client:
        client.ehlo()
        client.starttls(context=context)
        client.ehlo()
        client.login(settings["user"], settings["password"])
        for message in messages:
            client.send_message(message)
