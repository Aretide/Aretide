# Technical SEO Audit - beemahealth.com

Scope: crawlability, sitemap validity, canonical tags (representative sample + Houston/Texas geo-cluster), HTTP security headers, redirects, trailing-slash consistency, mobile viewport, lang attribute, 404 handling, URL structure. Investigation was stopped mid-checklist per coordinator instruction; unchecked items are marked "Not checked" rather than assumed.

**Technical score: 87/100** - strong foundation (valid sitemap, clean canonicals, no redirect chains, genuinely differentiated geo-cluster content, correct mobile/lang meta, real 404s), held back by unavoidable GitHub Pages HTTP-header limitations, one robots.txt comment/behavior mismatch, and several categories not reached before the stop instruction (Core Web Vitals lab data, deep structured-data validation, IndexNow).

## Category pass/fail

| Category | Status | Notes |
|---|---|---|
| Crawlability (robots.txt, sitemap) | Pass | `sitemap_discovery.py` confirms the robots.txt-declared sitemap is `valid: true`, `kind: urlset`, HTTP 200. Common fallback paths (`sitemap_index.xml`, `sitemap-index.xml`, `wp-sitemap.xml`) correctly 404 - no stale/duplicate sitemap declarations. |
| Indexability (canonicals, duplicates) | Pass | All 12 sampled pages (8 representative + 6 geo-cluster + 1 spot recheck) have correct, self-referencing, trailing-slash canonicals. No `noindex` robots meta found on any indexable sample page. |
| Security (headers) | Partial / Architecturally limited | No real HTTP security headers possible on GitHub Pages custom-domain hosting (confirmed live and in code comments). Best-effort CSP delivered via `<meta http-equiv>`. |
| URL structure / redirects | Pass | Single-hop 301s for bare-path -> trailing-slash, `www` -> apex, and `http` -> `https`. No chains observed. |
| Mobile | Pass | Correct `viewport` meta on live HTML. |
| Core Web Vitals | Not checked | Stopped before running lab/CWV tooling (`pagespeed_check.py` / `unlighthouse_run.py` were available but not executed). Base-context already confirms pages are fully static/prerendered (`is_spa: false`, `mode_used: raw`), which is structurally favorable for LCP, but no numeric LCP/INP/CLS estimate was captured this session. |
| Structured Data | Not deeply checked | Confirmed JSON-LD is generated programmatically via `src/lib/seo.ts` (Organization, WebSite, Service, MedicalWebPage, FAQPage, BreadcrumbList helpers) and geo-cluster pages wire through them, but did not run schema validation on rendered output. |
| JavaScript rendering | Pass | Confirmed static, prerendered HTML per base-context (no CSR dependency for content/crawlability). |
| IndexNow | Not checked | No investigation performed this session. |

## Findings

### 1. [Low] No real HTTP security headers are achievable on this hosting tier - inherent GitHub Pages limitation, already documented and mitigated best-effort
**Evidence:** `curl -sD - https://beemahealth.com/` returns only GitHub Pages/Fastly infrastructure headers (`server: GitHub.com`, `via: 1.1 varnish`, `x-fastly-request-id`, etc.) - no `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, or `Permissions-Policy`. `src/routes/__root.tsx` lines 96-121 already document this precisely: `<meta http-equiv>` is the only lever on static GitHub Pages custom-domain hosting, and it explicitly cannot express HSTS or X-Frame-Options at all (browsers ignore both via `<meta>` per spec). A CSP is delivered via `<meta http-equiv="Content-Security-Policy">` as the best available substitute, verified live in the rendered `<head>`.
**Recommendation:** No code fix needed here - this is correctly understood and already mitigated with the meta-tag CSP. If/when the security posture needs to improve further (e.g., before a compliance review), the only lever is fronting the custom domain with a proxy/CDN that can inject real response headers (e.g., Cloudflare in proxy mode, still free tier) - that is an infrastructure decision, not a content change, and should be scoped separately.

### 2. [Medium] Missing HSTS means the very first visit over `http://` is a real (if narrow) MITM/SSL-stripping window
**Evidence:** `curl -sD - http://beemahealth.com/` returns a normal `301 -> https://beemahealth.com/` with no `Strict-Transport-Security` header (confirmed impossible to set via `<meta>`, see Finding 1). Without HSTS (and without HSTS-preload-list inclusion, which requires the header to ever have been sent), a user's very first request to `http://beemahealth.com` in a fresh browser/network context is unencrypted until the 301 lands, and is the one scenario HSTS exists to close.
**Recommendation:** This can only be fixed by adding a CDN/proxy in front of GitHub Pages that can send a real `Strict-Transport-Security` header (and then submitting to hstspreload.org). Flagging as Medium rather than Critical because it is a narrow, first-visit-only exposure and the domain already redirects immediately to HTTPS on every subsequent request; treat as a backlog infra item, not urgent given no PHI is exchanged pre-redirect on this marketing site.

### 3. [Medium] robots.txt comment says retired stub paths "301 → home"; live behavior is a bare 404, not a redirect
**Evidence:** `public/robots.txt` comments the block `Disallow: /pricing`, `/clinicians`, `/insurance`, `/switch`, `/the-comb` as "Retired marketing stubs that only 301 → home (save crawl budget)." Live `curl -o /dev/null -w "%{http_code}"` against all five (plus `/qualify`, `/dashboard`, `/lp/test`) returned `404`, not `301`. Only `/waitlist` behaves as documented elsewhere (trailing-slash 301, then presumably a live external funnel page - out of scope here).
**Recommendation:** Reconcile the comment with reality: either (a) the 301-to-home redirects for these five stub paths were removed at some point and the comment is stale - update the comment to describe them as retired 404s, or (b) if any of these paths still carry inbound backlink equity (check Search Console/analytics, not available this session), restore actual 301 redirects to `/` so that equity consolidates instead of evaporating into a 404. Low actual traffic risk either way since they're disallowed from crawling, but the doc/behavior mismatch should not persist since it will mislead the next engineer who reads the comment.

### 4. [Info] Houston/Texas geo-cluster shows low duplicate-content risk - verified, not just assumed
**Evidence:** Checked all 7 geo-cluster URLs: `/glp-1-houston/` (commercial landing page) plus six `/learn/weight-loss/` articles (`glp-1-in-houston`, `glp-1-in-texas`, `semaglutide-in-houston`, `semaglutide-in-texas`, `tirzepatide-in-houston`, `tirzepatide-in-texas`).
- Canonicals are self-referencing and correct on every page (verified via live HTML fetch), generated programmatically through `canonicalUrl()` in `src/lib/seo.ts` - structurally hard to get wrong since every page passes its own `path`.
- Titles and meta descriptions are unique per page (verified live), not templated find-replace: e.g. `glp-1-in-houston.ts` leads with Texas Medical Center/humidity/commute framing and Harris County Public Health citations, while `glp-1-in-texas.ts` leads with Chapter 111 telemedicine law, rural access, and CDC heat citations. `diff` between the two content files shows the large majority of lines differ (only shared boilerplate FAQ scaffolding matches).
- The Houston learn article even contains an explicit self-disambiguation FAQ: "Is this the same as Beema's /glp-1-houston page? No. /glp-1-houston is a commercial cash-pay landing page... This learn article is educational..." - a deliberate, well-executed cannibalization mitigation.
**Recommendation:** No action needed; this is a positive finding, not a gap. Worth preserving as a pattern for any future city/state expansion: keep the commercial-landing-vs-educational-article split and the explicit self-disambiguation FAQ.

### 5. [Info] Redirect and trailing-slash architecture is clean, single-hop, and centrally enforced
**Evidence:** `src/lib/seo.ts`'s `canonicalUrl()` is the single source of truth appending trailing slashes, matching GitHub Pages' own bare-path -> trailing-slash 301 behavior (confirmed live: `/glp-1` -> `301` -> `https://beemahealth.com/glp-1/`, no chain). `www.beemahealth.com` and `http://beemahealth.com` both resolve in exactly one hop to the canonical `https://beemahealth.com/` origin form (confirmed live).
**Recommendation:** No action - flagging as a confirmed strength, since redirect chains and trailing-slash inconsistency are common failure modes on migrated/static sites and neither is present here.

### 6. [Info] Mobile viewport, lang attribute, and CSP breadth are all correctly configured
**Evidence:** `<meta name="viewport" content="width=device-width, initial-scale=1"/>` and `<html lang="en">` both confirmed on live homepage HTML. The meta-tag CSP (verified live, matches `src/routes/__root.tsx`) is intentionally permissive (`'unsafe-inline'` for script/style, `img-src ... https:`) with an extensive in-code rationale (static SPA, no per-request nonce minting, GTM/Meta Pixel/Google Ads/Formspree/Nominatim are the only external origins allowed) - this is a documented, deliberate trade-off, not an oversight.
**Recommendation:** No action needed now. If the team later adopts a build step capable of minting per-request nonces or moves to a host that supports real headers, tightening `script-src`/`style-src` to drop `unsafe-inline` would be the natural next step - not urgent.

### 7. [Info] Retired-path and funnel-path disallow rules are functioning correctly, distinct 404 vs redirect behavior confirmed
**Evidence:** All robots.txt-disallowed funnel paths spot-checked (`/qualify`, `/dashboard`, `/lp/test`) return real `404` status codes rather than soft-404s (200 with error copy), which is the correct signal to search engines. `/waitlist` returns a normal trailing-slash 301 (page is live, just crawl-blocked) - expected since it is presumably an external Bask-adjacent entry point, not a dead path.
**Recommendation:** No action - noted as confirmed-correct crawl-budget hygiene, consistent with the "Not Checked" items below rather than a gap.

## Not checked this session (stopped before reaching)

- **Core Web Vitals lab data**: `pagespeed_check.py` and `unlighthouse_run.py` are available in the claude-seo toolkit but were not run. Only the structural signal (fully static/prerendered HTML, confirmed in base-context) is known; no LCP/INP/CLS numbers were captured.
- **Full sitemap URL sweep**: only ~15 of 123 sitemap URLs were spot-checked for 200 status and route match (all passed); the remaining ~108 were not individually verified this session.
- **Structured Data deep validation**: confirmed JSON-LD helpers exist and are wired into the geo-cluster/representative pages via `src/lib/seo.ts` and `src/lib/learn-seo.ts`, but did not run schema validation against rendered JSON-LD output.
- **IndexNow protocol**: not investigated this session.
- **404 page markup** (custom `404.html` content, its own meta/robots tags): confirmed status codes only, not page content.

## Quick win

Fix the robots.txt comment/behavior mismatch on the retired stub paths (Finding 3) - either restore the documented 301-to-home redirects for `/pricing`, `/clinicians`, `/insurance`, `/switch`, `/the-comb` if they still receive any inbound links, or update the stale comment to match the current 404 behavior. This is a five-minute fix either way and removes a documentation trap for the next engineer.
