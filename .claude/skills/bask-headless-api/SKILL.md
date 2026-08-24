---
name: bask-headless-api
description: Bask Headless API for Beema Health - JWT patient auth, GET /patients/me, portal magic links, swapping the marketing-site Login button for Go to patient portal, and calling Bask from a Beema backend. Use when Matt or Charlie ask about Bask Headless, Bask JWT, already logged in, Hive SSO, magic link, /patients/me, x-api-key, headless-api.bask.ninja, or tying beemahealth.com auth to Bask/Hive.
---

# Bask Headless API (Beema)

Local docs: [`docs/bask/README.md`](../../../docs/bask/README.md). HIPAA: [`docs/HIPAA.md`](../../../docs/HIPAA.md).

This marketing repo does **not** call Headless today. CTAs use `resolveCta()` to Bask-hosted intake. Hive login is `HIVE_LOGIN_URL` (`https://hive.beemahealth.com`) in `src/lib/cta-ids.ts`. Headless is a **paid Bask entitlement** - confirm the store has it before writing integration code.

## What Bask told Beema (2026-08-23)

Bask's docs AI, asked whether the marketing frontend can detect a signed-in patient and send them to Hive, and whether the same JWT can be used from Beema's own backend:

**Frontend auth-state detection**

Store the JWT Bask returns after login/signup (`POST /auth/login-password` or `POST /auth/login`). On page load, call `GET /api/headless/v1/patients/me` with that JWT. If it returns a patient profile, they are logged in. Swap the button to "Go to patient portal".

**Sending them to the portal**

`POST /api/headless/v1/patients/me/magic-link` with their JWT. That returns a one-time portal URL (valid 1 hour). Redirect there - no password prompt.

**Beema backend**

The same JWT is a standard Bearer token. Send `Authorization: Bearer {jwt}` on any Bask patient-scoped endpoint from a backend. That backend can validate the session and fetch patient data the same way.

That description is accurate **for an app that already performed Headless login on its own origin**. It is **not** something you can drop onto today's marketing site without extra work. Apply the constraints below.

## Constraints (do not skip)

1. **Cross-origin:** a JWT issued on Hive or Bask intake is **not** visible to `beemahealth.com`. Browsers will not send it. `GET /patients/me` from the marketing SPA with no JWT always 401s. Detecting "already logged in" requires Headless login on this origin, or a Beema BFF that holds the session in **HttpOnly** cookies.
2. **`GET /patients/me` is PHI.** The body includes name, DOB, email, phone, address, conditions, medications, allergies. Do **not** call it from the marketing SPA. Do **not** log it. Do **not** put it in `localStorage` / `sessionStorage` / GTM / ads pixels.
3. **JWT storage (Bask + HIPAA):** memory only on the client, or HttpOnly + Secure + SameSite cookies on a server. Never `localStorage` or `sessionStorage`.
4. **Magic-link redirect** belongs on a Beema **backend**. Do not mint portal URLs in browser JS. Do not log `magicLink` or `code`.
5. **`GET /patients/basic` is not a session check.** It only answers "does this email/id exist?" using the API key. It does not prove the current browser is logged in. Do not use it to personalize the header, and do not send emails there from the marketing site (enumeration + PHI-adjacent).
6. **Keys:** `x-api-key` public `pk_*` may be used from a client. Secret `sk_*` is server-only (`POST /internal/coupons` and similar). HTTPS required.
7. **Do not implement this on the marketing SPA** unless Matt explicitly asks to start a Headless entitlement project. Default CTA remains `resolveCta()` / `HIVE_LOGIN_URL`.

## HIPAA-safe pattern (if Matt asks to build it)

```
Marketing SPA                    Beema BFF                         Bask Headless
     |  GET /api/session/status        |                                  |
     |------------------------------->|  (HttpOnly cookie, no PHI)        |
     |  { loggedIn: true|false }      |                                  |
     |<-------------------------------|                                  |
     |                                |  GET /patients/me  (optional)     |
     |                                |---------------------------------->|
     |                                |  never forward profile to SPA     |
     |  POST /api/portal-link         |                                  |
     |------------------------------->|  POST /patients/me/magic-link     |
     |  302 to magicLink              |---------------------------------->|
```

- SPA learns **only** a boolean (maybe a first name if product insists - still PHI; prefer boolean).
- BFF stores refresh token in HttpOnly cookie; access token in memory or short-lived cookie.
- BFF sends `x-api-key` + `Authorization: Bearer`.
- On 401 from Bask, clear cookie and treat as logged out.
- Refresh via `POST /api/headless/v1/auth/refresh` before access token expiry.

Headers on patient-scoped calls:

```
x-api-key: pk_live_...
Authorization: Bearer {jwt}
```

Base URL: `https://headless-api.bask.ninja/api/headless/v1`

Optional: `x-client-correlation-id` (UUID) to tie questionnaire → checkout → payment.

## Auth endpoints (login on Beema origin)

| Action | Endpoint |
| --- | --- |
| Password login | `POST /auth/login-password` |
| Request OTP | `POST /auth/send-otp` |
| OTP login | `POST /auth/login` |
| Signup | `POST /auth/signup` |
| Email magic link | `POST /auth/send-magic-link` |
| Verify magic code | `POST /auth/verify-magic-code` |
| Refresh JWT | `POST /auth/refresh` |
| Session probe (PHI) | `GET /patients/me` |
| Portal URL | `POST /patients/me/magic-link` |

Rate limits (auth): check-email 60/min/IP; login/signup 10/min/IP; send magic link 5/min/email. Back off on 429.

## Local doc map

| Topic | File |
| --- | --- |
| Index | `docs/bask/README.md` |
| Security, keys, JWT storage, limits | `docs/bask/Reference/Security.md` |
| Full profile (PHI) | `docs/bask/API reference/Patient Management/get-full-authenticated-patient-profile.md` |
| Portal magic link | `docs/bask/API reference/Patient Management/generate-patient-portal-magic-link.md` |
| OpenAPI snapshots | `docs/bask/_raw/openapi-v1.json`, `openapi-v2.json` |

Read those files instead of guessing request/response shapes.

## Official Bask URLs

- Index: https://docs.bask.health/llms.txt
- OpenAPI v1: https://headless-api.bask.ninja/api/headless/v1/openapi
- OpenAPI v2: https://headless-api.bask.ninja/api/headless/v2/openapi
- Interactive reference (entitlement-gated): https://headless-api.bask.ninja
