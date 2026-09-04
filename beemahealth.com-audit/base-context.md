# Shared audit context - read this first

You are doing ONE category of a full SEO/GEO audit of the live marketing site https://beemahealth.com for Beema Health, a HIPAA-aligned telehealth medical weight-loss company operating in all 50 US states with **no physical clinic**. Do not treat this as a local/brick-and-mortar or SAB business - there is no NAP, no GBP, no service-area-business signal to evaluate. Houston/Texas pages are geo-targeted content marketing for a telehealth service, not location pages.

## Local repo access (ground truth)

You are running inside the actual site's git repo at `/Users/mattaertker/Documents/Github/BeemaHealth` - a React 19 / TanStack Start marketing site, statically exported to GitHub Pages (confirmed: `is_spa: false`, `mode_used: raw` on homepage render - pages are fully static prerendered HTML, so plain HTTP fetches are sufficient, no headless rendering required for content/HTML checks).

Useful source locations:
- Routes: `src/routes/` (file-based routing, see `src/routes/README.md`)
- SEO helpers / canonical URL logic: `src/lib/seo.ts`
- Design tokens: `src/lib/design-tokens.ts`, raw palette in `src/styles.css`
- Sitemap generation + its test: `src/lib/__tests__/sitemap.test.ts`, source sitemap at `public/sitemap.xml`
- robots.txt source: `public/robots.txt`, llms.txt source: `public/llms.txt`
- Feature docs (read what's relevant to your category): `docs/features/legitscript.md`, `docs/features/analytics.md`, `docs/features/landing-pages.md`, `docs/features/treatment-pages.md`, `docs/features/learn.md`, `docs/features/bmi-calculator.md`, `docs/features/homepage.md`
- `AGENTS.md` - authoritative engineering guide
- `docs/HIPAA.md` - compliance rules (no PHI in storage/logs/pixels)

**Known deliberate schema omissions - do NOT recommend "fixing" these, they are compliance decisions guarded by tests:** recipe pages intentionally omit `nutrition`/`rating` schema, and pages without a named medical reviewer intentionally omit `reviewedBy` in JSON-LD. If you notice these absent, note it as confirmed-intentional, not a gap, unless your investigation of the actual test files shows otherwise.

## claude-seo CLI

Binary: `/Users/mattaertker/.claude/plugins/cache/agricidaniel-claude-seo/claude-seo/2.2.4/bin/claude-seo`
Run scripts via `claude-seo run <script>.py ...`. Key script: `render_page.py <url> --mode auto --json` (note: `--json` truncates content fields to short previews; use `--output <file>` for full HTML, `--json-ld-output <file>` for full untruncated JSON-LD, `--a11y-tree` for accessibility tree).

No Google API credentials are configured (no PSI/CrUX/GSC/GA4 - lab data and Common-Crawl-only backlink data are all that's available). No Moz/Bing keys either.

## Site inventory (already gathered - do not re-crawl)

Full sitemap URL list (123 URLs): `/Users/mattaertker/Documents/Github/BeemaHealth/beemahealth.com-audit/url-list.txt`

`robots.txt` (confirmed live, matches `public/robots.txt` intent): allows all major search/AI crawlers (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Applebot, Amazonbot, meta-externalagent, etc.) on `Allow: /`, and disallows only the external Bask-adjacent funnel/portal paths (`/qualify`, `/waitlist`, `/intake`, `/consent`, `/submitted`, `/eligibility`, `/dashboard`, `/login`, `/verify-email`, `/staff`, `/admin`, `/lp/`, `/legal/intake-acknowledgments`) plus retired 301-stub paths (`/pricing`, `/clinicians`, `/insurance`, `/switch`, `/the-comb`). Sitemap directive points to `https://beemahealth.com/sitemap.xml`.

`llms.txt` is present at `https://beemahealth.com/llms.txt` (HTTP 200) with a clear service summary, pricing, service-area, and primary-citation-page guidance.

## Scope limits (hard rules from this repo's CLAUDE.md)

- Only analyze public marketing routes that are actually in the sitemap/site. Never target Bask/Hive (the external checkout/intake/patient-portal platform) or any of the disallowed funnel paths above.
- The product is **launched**. Do not describe an in-house `/qualify` -> `/intake` -> `/consent` -> `/dashboard` funnel as the live product - that code is legacy/deferred and irrelevant to a live-site SEO audit.
- **No em dashes** anywhere in your output (project convention - use a spaced hyphen ` - ` or rephrase).
- Treat your findings as **PR input, not something to auto-apply** - do not edit any source files in this repo.

## Output

Write your findings to `/Users/mattaertker/Documents/Github/BeemaHealth/beemahealth.com-audit/findings/<yourname>.md` using your normal specialist format: evidence-backed findings with severity (Critical/High/Medium/Low/Info) and a specific recommendation for each. Then return a concise final report (under 300 words): your category score/grade if you produce one, top 3-5 findings, and the single best quick win.
