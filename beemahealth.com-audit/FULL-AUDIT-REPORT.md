# Full SEO/GEO Audit - beemahealth.com

Date: 2026-08-26
Business: Beema Health - HIPAA-aligned telehealth medical weight-loss, all 50 US states, no physical clinic, LegitScript certified (August 2026)
Scope: 123 public marketing URLs (full sitemap). Bask/Hive (external intake, checkout, patient portal) and all robots.txt-disallowed funnel paths were explicitly out of scope per this repo's CLAUDE.md.

## SEO Health Score: 84/100

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 86 |
| Content Quality | 23% | 79 |
| On-Page SEO | 20% | 78 |
| Schema / Structured Data | 10% | 91 |
| Performance (CWV, lab-only) | 10% | 88 |
| AI Search Readiness (GEO) | 10% | 76 |
| Images | 5% | 82 |

Supplementary categories, not part of the weighted score but reported in full: **Visual/Mobile/Accessibility (78)**, **Search Experience/SXO (75)**, **Content Architecture/Cannibalization (80)**, **Backlinks (unmeasured - see below)**.

**No Critical-severity findings** (nothing blocking indexing or triggering a penalty) were found anywhere in this audit. The highest-severity items are four High-severity findings, all fixable without infrastructure changes.

## Method

Ten specialist passes ran in parallel against the live site (`claude-seo` toolkit: `render_page.py`, Lighthouse, Playwright, Common Crawl) cross-referenced against this repo's actual source (`src/lib/seo.ts`, `src/routes/`, `src/lib/__tests__/*`, `docs/features/*`), since this audit was run from inside the marketing site's own git repository. No source files were edited - every finding below is PR input, not an applied change. No Google API (PSI/CrUX/GSC/GA4), Moz, Bing, or DataForSEO credentials were configured for this run; Performance and AI Search Readiness are lab/structural estimates, and Backlinks could not be measured at all (see that section).

Categories intentionally not spawned: `seo-local`/`seo-maps` (no physical clinic - not a local/SAB business), `seo-google` (no API credentials), `seo-ecommerce` (checkout happens externally at Bask, not on this site), `seo-drift` (no stored baseline exists yet - this audit can seed one for next cycle).

---

## Top 5 findings (highest severity, most leverage)

1. **[High]** Primary CTA is cut off below the fold on `/glp-1-houston/` mobile - a centered LegitScript seal pushes "Get Started" 20px past the 812px viewport, on the only route into the Bask intake funnel.
2. **[High]** LegitScript trust seal is missing from `/semaglutide/` and `/tirzepatide/` - the two pages where a first-time visitor actually decides whether to trust a compounded, non-FDA-approved medication purchase. It's present everywhere else (home, hubs, Learn articles) except here.
3. **[High]** Zero question-shaped H2/H3 headings on the four highest commercial-intent pages (home, `/semaglutide/`, `/tirzepatide/`, `/glp-1/`). Existing FAQ answers sit only in `FAQPage` JSON-LD and unlabeled accordion `<div>`s, invisible to the heading hierarchy AI Overview/Perplexity passage-rankers weight heavily.
4. **[High]** `/glp-1-houston/` and `/learn/weight-loss/glp-1-in-houston/` target near-identical "GLP-1 Houston" phrasing with no differentiating modifier - unlike the rest of the geo-cluster, which splits cleanly by city/state/molecule. Low exposure today (the domain doesn't yet rank for the term), but this is exactly the setup that produces silent cannibalization once it does.
5. **[Medium, but the single best trust fix]** A named, NPI-verified physician reviewer (Dr. Sean Arora, MD) exists in JSON-LD on 7 pages but appears in zero visible body text anywhere on the site - the strongest E-E-A-T asset on the site is invisible to human readers.

## Top 5 quick wins

1. Add the existing LegitScript seal component to `/semaglutide/` and `/tirzepatide/` - reuses an already-built component, directly closes findings #2 above.
2. Wrap the existing FAQ accordion questions in `<h3>` tags on `/semaglutide/` and `/tirzepatide/` - the citable text already exists in the DOM and in JSON-LD, it just isn't in the heading hierarchy.
3. Add a one-line visible "Reviewed by Dr. Sean Arora, MD" byline on the 7 pages that already carry it in schema.
4. Fix the `robots.txt` comment that still describes retired stub paths (`/pricing`, `/clinicians`, `/insurance`, `/switch`, `/the-comb`) as 301-redirecting to home - live behavior is a bare 404. Five-minute fix either way.
5. Retitle `/learn/weight-loss/glp-1-in-houston/` away from the bare "GLP-1 Houston" phrase toward its real differentiated angle (telehealth vs. driving to a clinic).

---

## Technical SEO - 86/100

**What works:** Valid, CI-guarded sitemap (123 URLs, exact route-parity enforced by `src/lib/__tests__/sitemap.test.ts`); clean self-referencing canonicals on every sampled page including the full Houston/Texas geo-cluster; single-hop redirects everywhere with no chains; correct mobile viewport/lang meta; real 404s on disallowed/retired paths; robots.txt correctly allows all major search and AI crawlers.

**Findings:**
- **[Medium]** `robots.txt` comment says retired stub paths (`/pricing`, `/clinicians`, `/insurance`, `/switch`, `/the-comb`) 301-redirect to home; live behavior is a bare 404 on all five. Reconcile the comment with reality, or restore the redirects if any of these paths still carry inbound link equity.
- **[Medium]** No HSTS is possible on GitHub Pages custom-domain hosting - a user's very first `http://` request is unencrypted until the 301 lands. Only fixable by fronting the domain with a header-capable CDN/proxy; backlog infra item, not urgent since no PHI crosses this boundary.
- **[Medium]** 9 of 18 spot-checked sitemap `lastmod` dates are stale relative to their route file's last commit (homepage, both treatment pages, how-it-works, weight-loss, about, recipes, two legal pages). Three confirmed diffs were meta-description-only edits - an ambiguous case under the site's own "content-significant" rule. Define the rule concretely, then reconcile.
- **[Low]** Broader security headers (X-Content-Type-Options, X-Frame-Options, Permissions-Policy) are architecturally unavailable on this hosting tier, already best-effort mitigated via meta-tag CSP and documented in `src/routes/__root.tsx`. No action needed now.
- **[Info, positive]** The Houston/Texas geo-cluster (7 pages) is genuinely differentiated content with a deliberate self-disambiguation FAQ, not doorway pages - a good pattern to preserve for future city/state expansion.

Full detail: `findings/technical.md`, `findings/sitemap.md`.

## Content Quality - 79/100

**What works:** The Learn library and treatment pages clear a materially higher bar than typical templated GLP-1 SEO content - real, attributable citations (FDA labels via DailyMed, peer-reviewed trials like SURMOUNT-1/STEP); genuinely differentiated symptom-cluster articles (nausea, bloating, fatigue, dizziness, body aches, constipation, hair loss, acne), each with distinct mechanisms and trial citations rather than spun duplicates; compliance/compounded-drug copy is consistent and matches required verbatim language across every sampled page; every CTA correctly routes externally to Bask intake with zero internal-funnel implication found.

**Findings:**
- **[Medium]** Named medical reviewer (Dr. Sean Arora, MD, NPI-verified) exists only in JSON-LD on `/about/`, `/how-it-works/`, `/safety/`, `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, `/glp-1-houston/` - zero occurrences in visible body copy on any of the 7 pages. Add a visible attribution line matching the schema claim.
- **[Low]** Freshness dates exist in schema but weren't confirmed visible on the page in the one article checked closely - consider a small "Updated: [date]" near article titles.
- **[Low]** One sampled article (`stopping-mounjaro`) runs slightly under the site's blog-post topical-coverage floor (~1,452 vs. 1,500 words) - close the gap only if genuine subtopics are missing, don't pad.
- **[Info, confirmed intentional]** Learn articles correctly omit `reviewedBy` per `docs/features/learn.md` (unsigned educational content) - not a gap.

Full detail: `findings/content.md`.

## On-Page SEO - 78/100

**What works:** Titles and meta descriptions are unique and specific across every sample, including the geo-cluster (not templated find-replace); consistent H1/H2 hierarchy; `BreadcrumbList` on every content page checked; internal linking from informational to commercial pages is contextual, not aggressive.

**Findings:**
- **[High]** Zero question-shaped H2/H3 headings on home, `/semaglutide/`, `/tirzepatide/`, `/glp-1/` - see GEO section for detail and recommendation (same underlying fix).
- **[Medium]** Commercial pages open with brand/process copy before the concrete, citable fact (price, mechanism) - add a short definitional lede under the H1.
- **[Medium]** `/glp-1-for-weight-loss/` pillar doesn't link out to any of its 7 natural drug-comparison spokes (ozempic, wegovy, mounjaro, zepbound, saxenda, semaglutide-weight-loss, tirzepatide-online) despite having the exact section for it.
- **[Medium]** `glp-1-side-effects` hub links only 6 of its 14 natural symptom-article spokes - not orphaned (all reachable via the flat learn index), but a missed relevance-signal opportunity.

Full detail: `findings/content.md`, `findings/geo.md`, `findings/cluster.md`.

## Schema / Structured Data - 91/100

**What works:** Homepage `MedicalOrganization` + `WebSite` JSON-LD is well-built and live-verified. **During report aggregation, two Medium findings from the initial source-code-only pass were live-verified and resolved as non-issues**: `/glp-1/`, `/glp-1-houston/`, and a sampled `/learn/weight-loss/` article all carry full, correct schema (`Service` + `BreadcrumbList` + `FAQPage` with a named `Physician` reviewedBy on the commercial pages; `MedicalWebPage` + `BreadcrumbList` + `FAQPage` on the learn article). Prescription pricing is correctly modeled as `Service`/`Offer`, not a shoppable `Product` (avoids a Merchant Center policy violation). Recipe schema's omission of `nutrition`/`aggregateRating`/`reviewedBy` is confirmed current and enforced by a live test - correctly not a gap.

**Findings:**
- **[Info]** `FAQPage` schema no longer produces a Google SERP feature (retired May 2026) - harmless, but not a growth lever going forward.
- **[Low]** The seven legal pages appear to carry no JSON-LD - low priority, minimal upside for policy pages.
- **[Info]** `reviewedByClinicalLead` flag usage per call site wasn't exhaustively verified - spot-check that it's only `true` where a named reviewer is visibly disclosed.

Full detail: `findings/schema.md` (note: two findings in that file were superseded by the live verification above).

## Performance (Core Web Vitals, lab-only) - 88/100

**Method note:** No Google API credentials configured, so this is lab-only (Lighthouse, 5 pages, mobile). Default `simulate`-throttled Lighthouse runs produced a false-positive 9.6-10.9s LCP that directly contradicted the same report's own trace-observed data - a known Lantern network-simulation artifact from early third-party beacon requests. All figures below use the credible `devtools`-throttled + trace-observed readings.

**What works:** CLS is a non-issue (0-0.001 everywhere); LCP passes on all 5 pages at 2.1-2.5s; clean font loading with no FOIT/FOUT; no unexpected third-party origins beyond documented GA4/Google Ads/Meta Pixel/LegitScript.

**Findings:**
- **[Medium]** LCP element render delay (2.0-2.4s) dominates LCP on every page - the LCP element is hero text, not the hero image, and the delay is driven by a render-blocking stylesheet plus 27 eagerly-fired route-chunk preloads. Inline/defer non-critical CSS; audit whether all 27 preloads need to be eager.
- **[Medium]** Hydration cost is large: TTI (10.3-11.5s) is 4-5x LCP on every page - real content is in raw HTML, but the SPA shell still re-executes substantial JS post-paint, which is exactly the profile that tends to hurt real-world INP even though lab TBT looks fine.
- **[Medium]** ~1.15-1.18MB of JS ships on every page regardless of content, ~330-350KB estimated unused. GA4 and Google Ads `gtag.js` appear to load as two separate script tags rather than the single shared loader `docs/features/analytics.md` describes - worth a source check against `src/lib/ad-conversions.ts`.
- **[Low]** The compounded-medication vial images are served at full source resolution into a much smaller display slot, wasting ~63KB each.

Full detail: `findings/performance.md`.

## AI Search Readiness (GEO) - 76/100

**What works:** Fully static/prerendered site removes an entire class of GEO risk (no JS-dependency gap for non-JS AI crawlers); `llms.txt` is live, accurate, and its pricing matches the live Service schema with zero drift found; Learn articles have strong citability (direct-answer openers with concrete statistics, numbered Sources citing real trials); the named, NPI-verified physician reviewer on transactional pages is a genuine, differentiated authority signal most compounded-GLP-1 competitors won't have structured.

**Findings:**
- **[High]** Zero question-shaped headings on the four highest-intent commercial pages (same as On-Page finding above) - AI passage-rankers weight visible headings phrased like the query, not just JSON-LD.
- **[Medium]** LegitScript certification is only extractable-text on Learn articles, not on `/semaglutide/`, `/tirzepatide/`, or `/glp-1/` - the seal image exists there but AI text-extraction can't read an image.
- **[Medium]** `llms.txt`'s "Primary pages for citation" line only names the 4 commercial pages, undercutting its own well-built "Common questions" table that already routes 18 informational queries to specific Learn articles.
- **[Medium]** Commercial pages lead with brand copy before the concrete fact (same underlying issue as the On-Page finding).
- **[Medium]** Organization `sameAs` omits YouTube (the single strongest brand-mention correlate with AI citation) and LinkedIn.

Full detail: `findings/geo.md`.

## Images - 82/100

**What works:** LegitScript seal and hero images ship explicit width/height and are preload/priority-hinted (zero CLS risk); most product imagery is already WebP with correct lazy-loading.

**Findings:**
- **[Low]** Compounded-medication vial images oversized for their display slot (~63KB wasted each) - generate a properly-sized responsive variant.
- **[Low]** Preloaded hero image is JPEG, not WebP/AVIF - minor byte-savings opportunity only, not a priority.

---

## Supplementary: Visual / Mobile / Accessibility - 78/100

- **[High]** Primary CTA cut off below the fold on `/glp-1-houston/` mobile (see Top 5 finding #1).
- **[Medium]** Breadcrumb "Home" link tap target fails WCAG 2.2 minimum (38x20px vs. 24x24px floor) - likely a sitewide shared-component issue.
- **[Medium]** Two color tokens (`text-destructive`, `success-foreground`) fail WCAG AA 4.5:1 at solid-fill contrast, though most real usage is lower-opacity tinted surfaces that likely pass - worth a component-level audit.
- **[Medium]** Outline/secondary button borders may fail WCAG 1.4.11 non-text contrast (1.26:1 vs. 3:1) - shadow may compensate, not conclusively verified.
- **[Info, positive]** Core text/background contrast is strong throughout (17.75:1 body copy, 8.94:1 primary buttons); mobile body text sizing (16-18px) is accessible without zoom.

Full detail: `findings/visual.md`. Screenshots: `screenshots/` (desktop + mobile, 5 pages, 20 files).

## Supplementary: Search Experience (SXO) - 75/100

Persona-weighted score (first-time GLP-1 researcher: 80/100, price-sensitive shopper: 76/100, current GLP-1 user: 70/100, lower confidence). No Critical page-type mismatches - the site correctly avoids faking page types it can't back up (no fake shopping schema for a prescription drug, no fake LocalBusiness/NAP for a telehealth-only brand).

- **[High]** LegitScript seal missing from `/semaglutide/` and `/tirzepatide/` (see Top 5 finding #2) - the single biggest driver of the price-sensitive shopper persona's low Trust score (14/25).
- **[Medium]** `best-glp-1-for-weight-loss`'s honest no-single-winner framing may format-mismatch the "Comparison Page" SERP archetype - directional, not SERP-verified; keep the honest framing, consider adding a lightweight decision-matrix block.
- **[Info, positive]** `glp-1-near-me` correctly reframes rather than faking local signals for a telehealth-only brand with no physical clinic.

Full detail: `findings/sxo.md`.

## Supplementary: Content Architecture / Cannibalization - 80/100

- **[High]** `/glp-1-houston/` vs. `/learn/weight-loss/glp-1-in-houston/` near-identical keyword targeting (see Top 5 finding #4).
- **[Info, positive]** The rest of the geo-cluster (Houston vs. Texas, molecule-specific pages) is genuinely differentiated with deliberate self-disambiguation FAQs - a good pattern for future expansion.
- **[Info, positive]** The medication-family cluster (Ozempic, Wegovy, Mounjaro, Zepbound, Saxenda, etc.) is well-differentiated by FDA-labeled indication, a compliance-aware and correct pattern.
- A broader structural pass over ~20 additional slug-overlap candidates (stopping-glp-1/mounjaro/tirzepatide, switching-from-wegovy-to-zepbound, retatrutide-vs-ozempic/semaglutide, etc.) found all already deliberately differentiated and cross-linked - no consolidation needed now, worth rechecking once real GSC rank data exists.

Full detail: `findings/cluster.md`.

## Backlinks - Not scored (insufficient data)

No Moz, Bing Webmaster, or DataForSEO credentials are configured. Common Crawl's web graph returned **zero data** for beemahealth.com in the current release - the domain is absent from the dataset entirely (no PageRank, no crawl presence at any confidence level). This is consistent with a newly-launched, LegitScript-certified-in-August-2026 brand that hasn't yet accumulated a measurable inbound-link footprint. **This should not be read as a weak backlink profile - it is genuinely unmeasured.**

- **[Medium]** No known-backlinks inventory exists in the repo to feed the verification crawler, so even the free tier's "verify known links" capability had nothing to check.

**Recommendation:** Compile a short list of every existing external mention of beemahealth.com (LegitScript listing, any press, directories, partners) and add a free Moz API key (2,500 rows/month, no cost) to unlock real DA/PA and referring-domain data for the next audit cycle.

Full detail: `findings/backlinks.md`.

---

## What was not checked this cycle

- Real CrUX/PSI field data (p75 LCP/INP/CLS), GSC indexation status, GA4 organic traffic - no Google API credentials configured.
- Real Moz/Bing/DataForSEO backlink data - no credentials configured.
- Full pairwise SERP-overlap matrix across the entire ~90-page Learn library (a structural title/slug pass and a targeted SERP check on the highest-risk pairs were done instead).
- Live HTTP status check of all 123 sitemap URLs (only ~15 were spot-checked; all passed).
- Full component-level WCAG audit of every Button/Badge/Alert variant (2 specific token pairs flagged for follow-up).
- No drift baseline existed before this audit - this run can seed one for the next cycle via `drift_baseline.py`.

See individual `findings/*.md` files for complete detail, evidence, and full severity breakdowns behind every summary above.
