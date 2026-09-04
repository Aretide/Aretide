# Sitemap Architecture Audit - beemahealth.com/sitemap.xml

Scope: `public/sitemap.xml` (123 URLs), cross-referenced against `src/routes/`, `src/content/learn/`, `public/robots.txt`, `public/llms.txt`, `src/lib/__tests__/sitemap.test.ts`, and `git log` for a lastmod plausibility spot check. No live HTTP fetch of all 123 URLs was performed in this pass (see "Not checked" below) - the coordinator called an early stop on further investigation, so this report is based on static/repo analysis plus the URL inventory already gathered in `url-list.txt`.

## What CI already enforces (do not re-flag these)

`src/lib/__tests__/sitemap.test.ts` is unusually thorough and already guards:
- Sitemap `<loc>` list matches an exact expected-paths list (home, treatment pages, recipes, legal, learn hub/article entries pulled live from the content registry) - so route-drift and missing/orphaned learn entries are caught automatically.
- Trailing-slash canonical form and same-origin (`SITE_URL`) for every `<loc>`.
- Every URL has a `<lastmod>` present and in `YYYY-MM-DD` form.
- Learn hub and article `<lastmod>` values are byte-equal to each article's `dateModified` in the registry (so registry/sitemap drift for the 91-URL learn cluster is impossible without a failing test).
- Recipe hub + all recipe detail pages are present, and recipe priorities are strictly below treatment-page priorities.
- No funnel/portal/staff/admin/lp/`the-comb` path ever appears in the sitemap.
- `robots.txt` declares the sitemap, allows the named AI/search crawlers, blocks the correct disallow list (including in the named-agent group, not just `*`), and explicitly allows `/learn`, `/glp-1`, `/glp-1-houston`, `/recipes`.
- `llms.txt` only links URLs that exist in the sitemap (no dead/redirecting links) and stays on-origin.
- Router `trailingSlash: "preserve"` and header/footer nav links all use trailing-slash hrefs.

Given this, I did not re-flag: URL form, funnel-path leakage, robots.txt sync, or learn-registry/sitemap drift - all are regression-tested. My findings below are things the test suite structurally cannot catch (git-history lastmod plausibility, priority/changefreq value judgment, live reachability, and IA/crawl-budget architecture).

## Findings

### 1. [Medium] Several high-value commercial/legal page lastmods are stale relative to their last edited commit, and the "significant change" line is undocumented in practice
The sitemap comment states lastmod should track each route file's "last content-significant commit," hand-maintained. Spot-checking 18 route files' `git log` against their sitemap lastmod:

| Path | Sitemap lastmod | Last commit touching route file |
|---|---|---|
| `/` | 2026-08-20 | 2026-08-25 (`6e443c52`) |
| `/tirzepatide/` | 2026-07-30 | 2026-08-25 (`6e443c52`) |
| `/semaglutide/` | 2026-07-30 | 2026-08-25 (`6e443c52`) |
| `/how-it-works/` | 2026-08-20 | 2026-08-25 (`6e443c52`) |
| `/weight-loss/` | 2026-08-20 | 2026-08-25 (`6e443c52`) |
| `/about/` | 2026-07-30 | 2026-08-25 (`6e443c52`) |
| `/recipes/` | 2026-08-20 | 2026-08-25 (`6e443c52`) |
| `/legal/hipaa/` | 2026-07-29 | 2026-08-25 (`6e443c52`) |
| `/legal/telehealth-consent/` | 2026-07-26 | 2026-08-25 (`6e443c52`) |
| `/safety/`, `/faq/` | 2026-07-30 | 2026-08-12 (em-dash cleanup) |
| `/contact/` | 2026-07-25 | 2026-08-16 (loading-animation commit) |

`/glp-1/` and `/glp-1-houston/` are the control case and are accurate: sitemap says 2026-08-16, git log confirms 2026-08-16 exactly.

I diffed three of the stale-looking ones (`index.tsx`, `legal.hipaa.tsx`, `legal.telehealth-consent.tsx`) from the 2026-08-25 commit: all three changes were meta-description-text-only edits (search-snippet copy, not visible page body). That is a defensible reason to *not* bump lastmod under a strict "content the user reads" reading of the rule, but it is genuinely ambiguous under a "content-significant" reading, since meta descriptions are indexable, crawled text. The other six rows sharing that commit (`tirzepatide.tsx`, `semaglutide.tsx`, `how-it-works.tsx`, `weight-loss.tsx`, `about.tsx`, `recipes/index.tsx`) were not individually diffed in this pass, so treat those as unconfirmed pending the same check. Separately, `/safety/`, `/faq/`, `/contact/` are stale against commits that were arguably non-content (punctuation cleanup, a loading-animation UX change) - those are more likely correctly excluded, but the file's rule doesn't currently define the line, so the two-day-old bulk-links commit and this uncertainty compound each other.

**Recommendation:** Add one or two sentences to the sitemap header comment (or `docs/features/`) defining "content-significant" concretely - e.g. "visible body copy, structured data, or meta description/title changes count; UI/animation/tracking-only commits do not." Then do a one-time pass reconciling the 9 stale rows above against that definition, bumping the ones that qualify (meta-description edits are a reasonable candidate to count, since they're crawled/indexed text) and leaving the rest as-is.

### 2. [Info] Bulk lastmod clustering (78 URLs on 2026-08-24) is legitimate, not staleness padding
78 of 123 sitemap entries share `lastmod` = 2026-08-24, and the `/learn/weight-loss/` cluster is otherwise clustered on 2026-08-24/2026-08-25. This looks at first glance like the "all identical lastmod" anti-pattern (Low severity per the standard checklist), but `git log --diff-filter=A` on the weight-loss article directory confirms all 84 weight-loss learn articles were genuinely added as new files in a single commit (`6e443c52`, 2026-08-25, "improving SEO with links to more learn guides"). The dates are one calendar day earlier than the commit date, consistent with content being authored the day before commit/deploy. No action needed - this is an accurate reflection of a real bulk-publish event, not hand-waved dates. Documenting this reasoning in the sitemap comment (or as a commit-adjacent note) would save a future auditor the same investigation.

### 3. [Info] priority/changefreq are present on all 123 URLs but are both ignored by Google
Every entry carries `<changefreq>` (115 monthly / 7 yearly / 1 weekly) and `<priority>` (1.0 → 0.3 across 8 distinct values). Google has publicly and repeatedly stated both tags are ignored for crawling/ranking; Bing gives them minimal weight. This isn't harmful, just unnecessary sitemap weight (roughly 40% of the file's bytes at 123 URLs, though nowhere near size limits so it costs nothing today).

**Recommendation:** No urgent action - keep or drop at the team's discretion. If the tags stay, treat `priority` purely as an internal-authoring signal (see Finding 4), not an SEO lever.

### 4. [Low] Legacy `/learn/{slug}/` guides carry a higher hand-set priority (0.7) than the entire current weight-loss learn cluster (0.5) and its own hub (0.6)
`getLearnSitemapEntries()` (`src/content/learn/sitemap.ts`) hardcodes `priority: "0.7"` for the four pre-vertical legacy guides (`/learn/initial-research/`, `/learn/resistance-training/`, `/learn/rest-intervals/`, `/learn/semaglutide-vs-tirzepatide/`) - the same tier as the recipes hub and above the `/learn/weight-loss/` hub (0.6) and all 84 newer weight-loss articles (0.5) they logically belong under. Since Google ignores `priority` this has no real ranking effect, but it is an internal inconsistency: these four pages are not more important than the hub they sit adjacent to.

**Recommendation:** Either lower legacy guide priority to align with the rest of the learn cluster (0.5-0.6), or - better, see Finding 5 - fold them into the vertical URL structure so the inconsistency disappears entirely.

### 5. [Low] Legacy learn guides break the vertical URL taxonomy (architecture note, not a crawl-budget risk at this scale)
91 of 123 sitemap URLs (74%) live under `/learn/`, and the pattern is consistently `/learn/{vertical}/{slug}/` for 87 of those 91. The remaining 4 (`initial-research`, `resistance-training`, `rest-intervals`, `semaglutide-vs-tirzepatide`) sit at `/learn/{slug}/` with no vertical segment - a leftover from before the vertical taxonomy existed (confirmed intentional via the code comment in `src/content/learn/legacy-guides.ts`: kept unredirected "so they are not orphaned"). At 4 URLs this is not a crawl-budget problem, but it is a taxonomy inconsistency: the same content type (an educational guide) resolves under two different URL shapes depending on when it was written, which slightly muddies topical-cluster signals to crawlers and is one more thing a future contributor has to remember when adding new guides.

**Recommendation:** Low priority. If/when these four guides are next touched for content reasons, consider migrating them into `/learn/weight-loss/{slug}/` with a 301 and updating the sitemap/registry together, rather than leaving the two-pattern split indefinitely. Not urgent.

### 6. [Info] Learn cluster is safe-at-scale content, not doorway/location pages - the location-page quality gates in my brief do not apply here
Per `base-context.md`, Beema has no physical clinics and the Houston/Texas learn pages (`glp-1-in-houston`, `glp-1-in-texas`, `semaglutide-in-houston`, `semaglutide-in-texas`, `tirzepatide-in-houston`, `tirzepatide-in-texas`, plus the `/glp-1-houston/` commercial lander - 7 pages total) are geo-targeted content marketing for a nationwide telehealth service, not NAP/service-area doorway pages. They are well under any location-page volume threshold (7, not 30+) and are not evaluated against the 60%-unique-content warning or 50+ hard-stop gates in this framework. No quality-gate warning triggered.

### 7. [Pass] robots.txt / sitemap parity - no disallowed or legacy funnel paths leaked
Cross-checked all 123 sitemap paths against the `robots.txt` disallow list (`/qualify`, `/waitlist`, `/intake`, `/consent`, `/submitted`, `/eligibility`, `/dashboard`, `/login`, `/verify-email`, `/staff`, `/admin`, `/lp/`, `/legal/intake-acknowledgments`, `/pricing`, `/clinicians`, `/insurance`, `/switch`, `/the-comb`) - zero matches. This is also CI-enforced (see above), independently confirmed here.

### 8. [Pass] Route-to-sitemap coverage is 1:1 for all indexable marketing routes - no missing or orphaned entries found
Compared every file in `src/routes/` against the sitemap:
- All non-dynamic marketing routes (`about`, `safety`, `faq`, `contact`, `how-it-works`, `weight-loss`, `tirzepatide`, `semaglutide`, `glp-1`, `glp-1-houston`, all 7 `legal.*` routes, `recipes/index`, `recipes/$slug`, `learn.tsx`/`learn.index.tsx`, `learn/$vertical.tsx`/`$vertical.index.tsx`/`$vertical.$slug.tsx`, plus the 4 legacy `learn.*` guide routes) have a matching sitemap entry.
- Every route file that's absent from the sitemap is legitimately excluded: `admin.*`, `clinicians.tsx`, `consent.tsx`, `dashboard.*`, `eligibility.tsx`, `insurance.tsx`, `intake.tsx`, `login.tsx`, `lp.$slug.tsx`, `pricing.tsx`, `qualify.tsx`, `staff.*`, `submitted.tsx`, `switch.tsx`, `the-comb.tsx`, `verify-email.*`, `waitlist.tsx`, `legal.intake-acknowledgments.tsx` - all funnel/portal/legacy/retired-stub routes matching robots.txt intent, consistent with the repo's "launched, Bask owns intake" framing. Two disabled files (`admin.$patientId.tsx.disabled`, `admin.tsx.disabled`) are inert and correctly excluded.
- No orphaned sitemap entries (every `<loc>` maps to a real, live route).

### 9. [Pass] Scale limits
123 URLs, ~751 lines, well under the 50,000-URL / 50MB single-file cap. No `news:` namespace present (not applicable to this site). No sitemap index needed at this volume.

## Not checked (stopped before completion per coordinator instruction)
- Live HTTP status/redirect check across all 123 sitemap URLs (200 vs 3xx/4xx). `url-list.txt` gives the URL inventory but this pass did not fetch each one.
- Full XML-schema validation via a real XML parser (regex-based extraction via the test suite succeeded cleanly across all 123 entries with no malformed matches surfacing; a manual structural read of the file found no obvious tag mismatches, but this is not a substitute for `xmllint --noout`).
- Individual diffs for 6 of the 9 rows in Finding 1 (`tirzepatide.tsx`, `semaglutide.tsx`, `how-it-works.tsx`, `weight-loss.tsx`, `about.tsx`, `recipes/index.tsx`) to confirm whether their 2026-08-25 edits were meta-only (like the 3 confirmed) or included body-copy changes.

## Summary table

| Check | Result |
|---|---|
| XML well-formed (regex/manual) | Pass (not independently xmllint-validated) |
| URL count / size limits | Pass (123 / ~751 lines, far under caps) |
| priority/changefreq | Present but ignored by Google - Info, no action required |
| Deprecated-tag removal | Optional cleanup, not required |
| lastmod format | Pass (CI-enforced) |
| lastmod accuracy vs git history | 9 of 18 spot-checked rows stale or ambiguous - Medium |
| robots.txt / sitemap parity | Pass (CI-enforced + independently confirmed) |
| Route coverage (missing pages) | Pass - none missing |
| Orphaned sitemap entries | Pass - none found |
| Location-page quality gates | Not applicable (7 geo pages, legitimate content marketing per base-context) |
| Learn cluster IA | Mostly consistent; 4 legacy URLs break the vertical taxonomy pattern - Low |
