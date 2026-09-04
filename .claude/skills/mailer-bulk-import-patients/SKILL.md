---
name: mailer-bulk-import-patients
description: >-
  Bulk-imports patients into the local Beema Health mailer from a pasted
  table (e.g. a copy-paste out of Bask/Hive's patient list). Filters to
  abandoned patients, computes each one's abandoned-at time and how far into
  the abandoned-checkout drip they already are, and adds them via the
  mailer's dedup-safe bulk endpoint. Use when Matt pastes a patient table and
  asks to add/import/upload them, bulk-add patients, or sync abandoned
  patients into Dev or (usually) Prod.
---

# Bulk-import patients into the mailer

Matt pastes a table exported from the patient dashboard (Name, Start Date,
Email, Phone, Orders, Location, Custom Status, Patient Status, Visit Status,
Last Order, Next Refill, Follow Up, Digital product status, Digital product
price - column order can vary slightly). You turn the **Abandoned** rows into
mailer patients and add them through `POST /api/patients/bulk`, which is the
only supported way to do this - it dedupes by email against the target list
and against the rest of the paste, every time.

## 0. Preconditions

1. The mailer must be running: `curl -s http://127.0.0.1:8787/api/state`.
   - If the request fails, tell Matt to run `./mailer.sh` first. Do not start
     it yourself.
   - If the response has `"unlocked": false`, PII is locked - tell Matt to
     unlock it in the dashboard (or via YubiKey) first. Do not proceed.
2. Default target is **Prod** (`data/prod/patients.json`) unless Matt says
   Dev. Say which mode you're targeting before you write anything.

## 1. Parse the paste

Each patient is one logical record, but the source table wraps it across
several lines when pasted as plain text. A record looks like:

```
<Name>\t<MM/DD/YYYY>\t<email>\t<phone>\t<orders>\t<location>\t
<Custom Status line, e.g. "No Custom Status">
<Patient Status line, e.g. "Abandoned" / "Shipped" / "Delivered: 08/27/2026">
<Visit Status line, e.g. "Approved" / "-">
<Last Order>\t<Next Refill>\t<Follow Up>\t<Digital product status>\t<Digital product price>
```

Detect the start of a new record by a line containing an email address
(the first line). Everything up to the next such line (or end of input)
belongs to that record. Within a record, the **Patient Status** line is the
one right after the Custom Status line - match it by position, not by
content, since its value varies ("Abandoned", "Shipped", "Delivered: ...",
etc.).

If the paste doesn't match this shape (different column order, a real CSV,
a spreadsheet paste with different spacing), parse it sensibly instead of
forcing this template - the goal is Name / Start Date / Email / Patient
Status per row, however they're delimited. If you can't confidently find
those four fields for a row, drop it and say so; never guess an email.

## 2. Filter to Abandoned

Keep only rows whose **Patient Status** is exactly `Abandoned` (case
sensitive as shown, no colon/date suffix). Drop everything else - `Shipped`,
`Approved`, `Delivered: <date>`, `-`, blank - and tell Matt how many you
dropped and why, briefly (e.g. "6 abandoned, 3 shipped/delivered skipped").

Do not ask Matt whether to include non-abandoned rows unless he asked for
something other than "the abandoned ones."

## 3. Build each row

For every kept record:

- `first_name` - the **first word** of the Name column, e.g. `"Karen"` from
  `"Karen Ramirez"`, `"inno"` from `"inno wave"`. Don't title-case-mangle it,
  just take the first token.
- `email` - the Email column, lowercased, trimmed.
- `abandoned_at` - the Start Date column reformatted as
  `YYYY-MM-DD 09:00` (24-hour, no seconds). `08/26/2026` -> `2026-08-26 09:00`.
  09:00 America/Denver is the fixed convention here - do not ask Matt for a
  time unless he gives one explicitly with the date.

Do not invent `interest`, `product`, or `cta_url` - leave them out of the
row and the endpoint's defaults apply.

## 4. Dry run first, always

POST to `http://127.0.0.1:8787/api/patients/bulk`:

```json
{
  "mode": "prod",
  "default_campaign": "abandoned",
  "dry_run": true,
  "patients": [
    {"first_name": "Karen", "email": "kajeann@gmail.com", "abandoned_at": "2026-08-26 09:00"}
  ]
}
```

`default_campaign: "abandoned"` is what makes the server compute, per
patient, the latest abandoned-checkout step whose delay has already elapsed
since `abandoned_at` and set that as `last_step` (so the next step in the
sequence is the one due next) - e.g. abandoned 13 days ago lands on
`last_step: "7d"`, next step `"14d"`; abandoned 6 days ago lands on
`last_step: "72h"`, next step `"7d"`. You do not compute this yourself -
just pass `abandoned_at` and the endpoint does it, reading the campaign's
actual current steps.

The response has `added` (with each patient's computed `last_step` /
`next_step`) and `skipped` (with a `reason` per row: `invalid email`,
`already in <mode>`, or `duplicate row in this upload`). Show Matt a short
summary table from this - do not just say "done."

## 5. Confirm, then commit

Show the dry-run summary and ask Matt to confirm before the real write -
this is a Prod patient-data change and it is not reversible from the UI
(only a manual delete per patient). Once confirmed, repeat the same request
with `"dry_run": false`. Report the final counts using the response's
`message` field and list who was added.

Never send `dry_run: false` without having shown Matt a `dry_run: true`
result first in this same conversation.

## Notes

- Dedup is by email and is handled entirely by the endpoint - never dedupe
  yourself or skip rows you think are duplicates without letting the
  endpoint confirm it. It checks both the existing target list and the rest
  of the current paste.
- This only ever enrolls people in the campaign you name via
  `default_campaign` (normally `abandoned`). It does not touch any other
  campaign enrollment.
- No PHI in your chat commentary beyond what Matt already pasted - don't
  echo full email addresses back if a short label ("Karen's row") reads
  fine, though quoting them from Matt's own paste in a summary table is
  fine since he provided them.
