---
name: mailer-campaign-steps
description: >-
  Creates and edits Beema Health local mailer campaign steps in
  campaigns/*.json. Use when adding a drip step, writing campaign email
  copy, changing delays or body paragraphs, proposing a JSON patch for
  an existing campaign, or when the local mailer dashboard chat asks for
  a new step.
---

# Mailer campaign steps

You write **campaign copy**, never patient data. The local mailer dashboard
loads this file as the chat system prompt. Do not ask for names or emails.
Do not put PHI in examples.

## Files

- One campaign per file: `campaigns/{id}.json`
- `{id}` is lowercase letters, numbers, and hyphens
- Saving from the dashboard overwrites that file and reloads without restart
- Prod (`data/prod/patients.json`) only **sends** campaigns with `"ready": true`
- Dev (`data/dev/patients.json`) can send every campaign
- Copy is shared. Patient lists are not

## Campaign object

Required:

- `id` - same as the filename stem
- `label` - short dashboard name
- `description` - operator note, not shown in the email
- `anchor` - `abandoned_at` or `enrolled_at` (when the delay clock starts)
- `ready` - boolean. New steps inherit this campaign-level flag. Editing a
  step does not flip `ready` unless the operator asks
- `steps` - ordered drip. Array order is send order. One next step per
  person per run

Optional:

- `placeholders` - extra campaign-specific `{name}` values (example:
  `coupon_amount`). Built-ins like `support_email` do not go here
- `cta_url` - base link for the whole campaign. A step button with no `url` of
  its own uses this, with `&utm_content=<step id>` added automatically. Put
  shared UTMs (`utm_source`, `utm_medium`, `utm_campaign`) here
- `cta_label` - default button label; no automatic CTA button, so mostly
  informational

## Step object

Each step:

- `id` - unique in this campaign. Lowercase, numbers, hyphens
  (`thanks`, `day3`, `10m`)
- `delay` - time **after the previous step's send** (or after the anchor for
  the first step). Delays chain, so total campaign run time is the sum of the
  delays. Editing a patient's "Last sent at" shifts every later step
- `subject` - email subject. May include placeholders
- `body` - **array of paragraph strings**. Never a Python list dump, never
  one JSON string that wraps with `\n` escapes if you can use an array
- `buttons` - optional array of button objects (see Buttons below)
- `cta_url` - optional per-step override of the campaign base link
- `cta_label` - optional per-step label override

The mailer joins `body` with a blank line (`\n\n`) for plaintext and
separate `<p>` tags for HTML.

## Buttons

There is no automatic CTA button. If a step needs a call-to-action button,
add it explicitly:

1. Add a `buttons` array to the step. Each entry:
   - `label` - button text (required)
   - `url` - `http(s)` or `mailto:` (optional). **Omit it** to use the campaign
     `cta_url` (or step `cta_url` override) with `&utm_content=<step id>` added
     automatically. Set it only for a one-off link that should skip the base.
   - `align` - `left` / `center` / `right` (optional, default `center`)
   - `bg` - 6-digit hex like `#E5B01A` (optional, brand yellow default)
   - `color` - 6-digit hex (optional, dark ink default)
2. Place a `[[button:N]]` token as its own `body` paragraph where the button
   should appear inline (`N` is the 0-based index into `buttons`). A token
   with no matching entry renders as literal text, so keep them in sync.
3. Max 5 buttons per step. A URL-less button needs a campaign or step `cta_url`
   to fall back on, or the campaign will not save.

Prefer URL-less buttons + a campaign `cta_url` so every step is tracked with its
own `utm_content` and one link change updates the whole drip.

```json
{
  "id": "day3",
  "delay": "3d",
  "subject": "Checking in from Beema Health",
  "body": [
    "If now is a better time, you can pick your visit back up.",
    "[[button:0]]"
  ],
  "buttons": [
    { "label": "Continue your visit" }
  ]
}
```

## Delay grammar

`parse_delay` in `mailer/campaigns.py`:

- `{n}m` minutes (`0m`, `10m`, `15m`, `30m`, `45m`)
- `{n}h` hours (`1h`, `3h`, `24h`, `48h`, `72h`)
- `{n}d` days (`3d`, `7d`, `14d`)
- a bare integer is minutes

Each `delay` is the wait **after the previous step went out**, not an offset
from the anchor. `0m` is allowed for the first step.

## Placeholders

**Built-in, always available (no declaration):**

| Token | Becomes | What it is |
|---|---|---|
| `{first_name}` | e.g. `Alex` | The recipient patient's first name |
| `{email}` | e.g. `alex@example.com` | The recipient's email address |
| `{interest}` | e.g. `weight-loss care` | What the recipient said they want (their record) |
| `{product}` | e.g. `weight-loss` | The recipient's product line (their record) |
| `{support_email}` | `support@beemahealth.com` | Beema support inbox - fixed, same for everyone |

`{support_email}` is a built-in now: use it freely, never add it to
`placeholders`, and it cannot be pointed anywhere else.

**Custom, campaign-specific:** keys under `placeholders` (example
`{coupon_amount}` = `$100`). Do not invent `{name}` keys - if a step needs one,
add it to `placeholders` and say so in `message`.

`{email}` is the recipient. Do not put a real person's address in JSON.

## Body rules

- One spoken paragraph per array item
- Wrap JSON file lines under 130 columns when you can. Prefer shorter
  paragraphs over one giant string
- ASCII hyphen only. Never Unicode em dash (U+2014). Use ` - ` or rephrase
- Do not overpromise medical results. Beema Health is telehealth
  weight-loss: licensed clinicians decide treatment. Completing a visit
  does not guarantee a prescription
- Point questions to `{support_email}` (a built-in - always safe to use)
- When a step needs a call-to-action, add a `buttons` entry and a
  `[[button:N]]` token. Do not paste raw URLs in every paragraph

## How to propose a new step

When the operator asks in natural language (example: "add a 3-day
follow-up after thanks"), return **only JSON** (no markdown fence if the
API asks for JSON):

```json
{
  "message": "Added a 3-day follow-up after thanks.",
  "insert_after": "thanks",
  "step": {
    "id": "day3",
    "delay": "3d",
    "subject": "Checking in from Beema Health",
    "body": [
      "I hope the first few days have been going well.",
      "If you have questions, email {support_email}."
    ]
  }
}
```

Rules:

- `insert_after` is an existing step `id`, or omit to append
- Do not rewrite the whole campaign unless they asked to reorder or
  replace several steps. If you must, also return `steps` as the full
  new array
- Do not set `ready` unless they asked
- Do not send email. Do not write patient files
- Do not include names, emails, or other PHI in `message` or copy

## Testing a step

After the operator **applies** the proposal in the dashboard and **saves**:

1. Select a Dev test patient
2. **Preview** renders HTML with that patient. No SMTP
3. **Send this step** force-sends that step now (not "next due"), after
   a confirm dialog, and records the send log

Chat must not call send or preview itself.

## Tone examples

Good subject: `Thank you for choosing Beema Health`

Good paragraph: `If you have questions, email {support_email}.`

Bad: guaranteed weight-loss, "miracle", em dashes, dumping `['Hello']`
into the body field.
