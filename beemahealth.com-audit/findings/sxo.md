# Search Experience Optimization (SXO) Audit - beemahealth.com

Category: Search Experience (page-type/intent match, trust and anxiety-reduction for a HIPAA-sensitive medical purchase, informational-to-commercial path, persona fit).
Scope: homepage (`/`), the two medication pillars (`/semaglutide/`, `/tirzepatide/`), the two GLP-1 program hubs (`/glp-1/`, `/glp-1-houston/`), and three high-intent `/learn/weight-loss/` articles (`glp-1-cost`, `best-glp-1-for-weight-loss`, `glp-1-near-me`). All 8 URLs fetched live via `render_page.py --mode auto` (all resolved `mode=raw`, `is_spa=False` - confirms static prerendered HTML, consistent with base-context) and parsed via `parse_html.py`.

**SXO Gap Score (separate from SEO Health Score): 75/100 - Good, one High-severity trust gap.** This is a persona-weighted average (see Persona Scoring below), not a technical SEO score.

## Limitations (read before acting on this report)

- **No live SERP pull was performed for the target queries in this pass.** A prior finding in this same audit (`findings/cluster.md`) already established via WebSearch that beemahealth.com does not currently surface in general web-index results for the core head terms (`glp-1 houston`, `semaglutide for weight loss`, `best glp-1 for weight loss`, etc.) - the brand is new and not yet ranking. Page-type-match judgments below are therefore made against the standard taxonomy/SERP-archetype expectations for each query pattern (documented in `skills/seo-sxo/references/page-type-taxonomy.md`), not against a freshly observed top-10. Treat mismatch calls as directional, not measured.
- Only 3 of the ~85 `/learn/weight-loss/` articles were fetched (`glp-1-cost`, `best-glp-1-for-weight-loss`, `glp-1-near-me`). The "current GLP-1 user hunting for side-effect info" persona score is extrapolated from the shared template these three pages use (FAQ block, Sources, Related education, Program pages) applied to the ~30 symptom/troubleshooting titles visible in `llms.txt` and the sitemap (e.g. `glp-1-nausea`, `glp-1-bloating`, `stopping-glp-1`, `switching-glp-1-medications`) - those were not individually fetched, so this persona's score carries lower confidence.
- No PSI/CrUX/GA4 access - could not verify actual bounce/engagement behavior, only structural/on-page signals.
- Wireframes were not generated (not requested).

---

## Finding 1: LegitScript trust seal is present on the homepage and program hubs but missing from the two actual medication purchase-decision pages - High
**Pages:** `/semaglutide/` and `/tirzepatide/` (missing) vs. `/`, `/glp-1/`, `/glp-1-houston/`, and all three sampled `/learn/` articles (present)
**Source:** `<img src="https://static.legitscript.com/seals/51697885.png" alt="Verify Approval for www.beemahealth.com">` plus a matching `<link rel="preload">` verified present in the parsed HTML/image list for `home.html`, `glp-1.html`, `glp-1-houston.html`, and all three learn articles; verified **absent** (zero matches for any `legitscript`-sourced `<img>` or preload link) in both `semaglutide.html` and `tirzepatide.html`.

This is backwards for a HIPAA-sensitive, compounded-medication purchase. `/semaglutide/` and `/tirzepatide/` are the pages where a first-time visitor is actively deciding whether to hand over medical history and payment for a **compounded (not FDA-approved)** drug - exactly the moment the LegitScript third-party licensing/legitimacy seal (Beema's own stated brand differentiator per `llms.txt` and `docs/features/legitscript.md`) does the most anxiety-reduction work. Instead it appears on pages with lower purchase intent (homepage, program hubs, blog articles) and is missing on the two pages with the actual pricing tables and "Get Started" checkout CTA.

**Recommendation:** Add the same LegitScript seal component (whatever renders it on `/`, `/glp-1/`, `/glp-1-houston/`, and the learn template) to `/semaglutide/` and `/tirzepatide/`, ideally near the pricing table or FAQ/"Safety and important information" section, not buried below the fold. This is likely a component-inclusion gap (the two medication pages may use a different layout template than the hub pages) rather than a deliberate omission - worth a quick check of `src/lib/legitscript.ts` usage across `src/routes/` to confirm it isn't intentionally scoped away from these two routes.

---

## Finding 2: Commercial pages front-load pricing transparency and a no-guarantee disclaimer - correctly reduces bait-and-switch anxiety - Info (positive)
**Pages:** `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, `/glp-1-houston/`

All four commercial pages surface "Completing intake does not guarantee a prescription" in the hero, before any pricing table, and `/glp-1/` and `/glp-1-houston/` additionally surface "Compounded [drug] is not FDA-approved and is considered only when legally available and clinically appropriate" in the same above-the-fold block. Pricing plan toggles (1/3/6/12-month, "Save $X") render directly in the hero rather than being gated behind the intake flow. This is exactly what a skeptical first-time GLP-1 researcher or price-sensitive shopper needs to see before committing to a long questionnaire, and it matches the brand differentiators `llms.txt` calls out (transparent cash pricing, no guaranteed prescription). No action needed - flagging as a pattern worth preserving when the site is redesigned or new medication pages are added.

**Minor inconsistency worth a look:** the "not FDA-approved / compounded" disclaimer appears inline with pricing in the `/glp-1/` and `/glp-1-houston/` hero text, but was not visible in the first ~1,000 characters of `/semaglutide/` and `/tirzepatide/` hero text (it likely appears later, in the "Safety and important information" H2 section on those two pages - not independently confirmed in this pass given the stop-investigation cutoff). If the compounded/non-FDA-approved status is meaningfully later on the two medication-specific pages than on the hub pages, consider surfacing it at the same hero-level prominence there too, since those are the pages most likely to be the actual purchase-decision moment.

---

## Finding 3: "Best GLP-1 for weight loss" uses honest clinical framing that may format-mismatch typical "best X" SERP consensus - Medium (directional, not SERP-verified)
**Page:** `/learn/weight-loss/best-glp-1-for-weight-loss/`

Title: "Best GLP-1 for Weight Loss: How Clinicians Compare Options." Meta description explicitly states "There is no universal best GLP-1... without crowning a winner." H2 structure: "There is no single best GLP-1 for every adult" > "A map of trial-average effect sizes" > "Dimensions a clinician actually weighs" > "Pipeline drugs are not secretly the current best" > "Take a list, not a brand winner, to your visit."

Per the page-type taxonomy, "best [X] for [use case]" queries typically pull a **Comparison Page** SERP archetype - listicle-style titles, a feature/effect matrix, and a clear "best for X segment" verdict. This page is clinically the more honest and defensible answer (a real clinician would not crown a universal winner, and doing so could read as promotional for a company selling two of the compared drugs), and it does include a comparative data section ("map of trial-average effect sizes"). But the explicit "no winner" framing in the title/meta may under-match what searchers scanning a results page expect from a "best X" query, and could underperform against competitor listicles that do commit to a ranked pick. This was not verified against a live SERP in this pass (see Limitations) - flagging as a hypothesis worth testing, not a confirmed defect.

**Recommendation:** Keep the honest "no single winner" content (this is a real trust asset for a medical decision and should not be changed for SEO alone), but consider adding a lightweight decision-matrix or "if you're prioritizing X, most clinicians lean toward Y" quick-answer block near the top, so the page can still win a featured-snippet/AI-Overview slot for the literal "best GLP-1" query without contradicting the clinically honest thesis. This is a format addition, not a message change.

---

## Finding 4: "GLP-1 near me" cannot win the literal local-pack SERP by design, and the page correctly avoids faking local signals - Info/Low (structural, already well-mitigated)
**Page:** `/learn/weight-loss/glp-1-near-me/`

Per base-context, Beema Health has no physical clinic and is telehealth-only in all 50 states - so it structurally cannot compete for the local-pack / map / NAP-driven SERP that "near me" queries typically surface (per the taxonomy's Local Page SERP indicators). The page handles this the right way: it does not fake a `LocalBusiness` schema or invent an address, and it reframes the query directly in copy ("Near me is a useful search. Licensure is the constraint.") with an H2 on "the parts that genuinely stay local" (labs) and "when a nearby clinic is genuinely the better choice." No `LocalBusiness`/NAP schema was found on this page or any commercial page in this sample, which is correct per the audit's scope rules, not a gap.

**Recommendation:** No content change needed. Set expectations: this query will likely never produce a top local-pack placement for Beema, and effort is better spent on the "online"/"telehealth"/"[state]" phrasing variants the site already targets elsewhere (`glp-1-in-texas`, `online-glp-1`, `tirzepatide-online`) rather than chasing the literal "near me" local intent. Flagging for the local-intent skill owner: no `/seo local` GBP work applies here - this is telehealth, not SAB, consistent with base-context.

---

## Finding 5: Informational-to-commercial internal linking is contextual, not aggressive - Info (positive)
**Pages:** all three sampled `/learn/` articles

Each sampled learn article ends with a consistent, clearly-labeled template: "Where to go next" / "Related education" (links to other symptom/topic articles) followed by a separate "Program pages" section (links to `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, `/weight-loss/`) under the honest framing "Beema's live offering is medical weight-loss care." Pricing claims inside the articles are hedged and pushed to the authoritative pages rather than restated ("Beema Health live cash-pay rates are maintained in medication pricing on /semaglutide and /tirzepatide"). There is no mid-paragraph CTA-stuffing or premature "Get Started" interruption inside the educational body content in the samples checked. This is the correct pattern for a first-time researcher who is not yet ready to buy and would bounce from an overly salesy informational page.

**Recommendation:** No action - preserve this pattern. Worth spot-checking the higher-anxiety symptom articles (`glp-1-nausea`, `stopping-glp-1`, `not-losing-weight-on-semaglutide`) in a future pass to confirm the same restraint holds there, since those weren't fetched in this audit.

---

## Finding 6: Homepage is comparatively thin relative to the pages it links to - Low
**Page:** `/`
**Source:** parsed `word_count`: home = 742 vs. semaglutide = 2,679, tirzepatide = 2,706, glp-1 = 2,014, glp-1-houston = 1,985, and the three learn articles = 1,387-1,860.

The homepage's job is orientation/navigation more than ranking depth, so this is not automatically a defect, but for a first-time researcher landing on `/` from a branded or category search, 742 words leaves relatively little room to establish trust signals beyond what's already there (HIPAA/licensing H3 badges, "Three simple steps," medication cards). This is Low severity because the homepage already links out to the deeper trust content (safety, pricing, FAQ) rather than trying to be the trust page itself - flagging for awareness, not urging a rewrite.

**Recommendation:** No structural change needed; if homepage conversion data (once GA4/GSC access exists) shows high bounce from paid/organic homepage landings specifically, consider pulling 1-2 of the strongest trust signals (e.g., the LegitScript seal, which is already present here) higher in the fold.

---

## Persona Scoring

Personas derived per the assignment brief and cross-checked against observed page structure (FAQ blocks, pricing-table placement, comparison sections, symptom-article catalog).

| Persona | Journey Stage | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|---|
| First-time GLP-1 researcher comparing options | Awareness/Consideration | 22/25 | 20/25 | 18/25 | 20/25 | 80/100 | Good |
| Price-sensitive shopper | Consideration/Decision | 24/25 | 23/25 | 14/25 | 15/25 | 76/100 | Good |
| Current GLP-1 user hunting side-effect/troubleshooting info | Decision/Retention (lower confidence - see Limitations) | 18/25 | 17/25 | 17/25 | 18/25 | 70/100 | Good |

**Weakest dimension across personas: Trust for the price-sensitive shopper (14/25)** - directly caused by Finding 1 (LegitScript seal absent on `/semaglutide/` and `/tirzepatide/`, the exact pages this persona is reading pricing tables on right before deciding).

**Weakest dimension #2: Action for the price-sensitive shopper (15/25)** - the single "Get Started" CTA on all four commercial pages routes straight to the full Bask intake questionnaire (per `CLAUDE.md`, one long questionnaire, not a split eligibility/intake flow). A shopper who is still price-comparing and not ready for a full medical intake has no lighter-weight next step (no "email me this pricing," no short eligibility pre-check, no "talk to someone" alternative) visible in the parsed CTA/link data - every commercial-intent link on these four pages points to the same `q.beemahealth.com/start-online-visit/weightloss` intake URL (differentiated only by `cta_id`). This is a known, deliberate product decision (Bask owns the single intake flow, not this repo) and should not be "fixed" by adding a second in-house funnel - but it is worth flagging as the honest reason Action scores are capped at "Good" rather than "Excellent" for this persona.

### Priority Actions (weakest persona first)
1. **Add the LegitScript seal to `/semaglutide/` and `/tirzepatide/`** (Finding 1) - directly raises the price-sensitive shopper's Trust score and is the single highest-leverage, lowest-effort fix in this report.
2. **Confirm the compounded/non-FDA-approved disclaimer is equally prominent in the hero** on `/semaglutide/` and `/tirzepatide/` as it is on `/glp-1/` and `/glp-1-houston/`** (Finding 2 minor inconsistency).
3. **Consider a lightweight "if you're prioritizing X..." quick-answer block** near the top of `/learn/weight-loss/best-glp-1-for-weight-loss/` (Finding 3) without diluting the honest no-single-winner thesis.

---

## Page-Type Mismatch Summary

| Page | Likely query intent | Classified type | Mismatch severity |
|---|---|---|---|
| `/` | Branded/navigational | Landing Page | ALIGNED |
| `/semaglutide/` | Commercial ("compounded semaglutide," "semaglutide cost/online") | Hybrid (Service + Content) | ALIGNED |
| `/tirzepatide/` | Commercial (same pattern) | Hybrid (Service + Content) | ALIGNED |
| `/glp-1/` | Commercial ("GLP-1 online," "GLP-1 weight loss program") | Hybrid (Service + Content) | ALIGNED |
| `/glp-1-houston/` | Geo-commercial ("GLP-1 Houston") - telehealth, not SAB | Hybrid (Service + Content), correctly no LocalBusiness schema | ALIGNED |
| `/learn/weight-loss/glp-1-cost/` | Informational ("GLP-1 cost") | Blog Post / Article | ALIGNED |
| `/learn/weight-loss/best-glp-1-for-weight-loss/` | Informational, format-expects Comparison Page | Blog Post with comparison elements | MEDIUM (format, not topic, mismatch - see Finding 3) |
| `/learn/weight-loss/glp-1-near-me/` | Local intent structurally unwinnable for a telehealth-only brand | Blog Post, correctly reframes rather than faking local | LOW (structural, well-mitigated - see Finding 4) |

No CRITICAL mismatches found. This is a well-executed page-type strategy for a telehealth-only brand with no physical clinic - none of the commercial pages fake a false page type (no fake shopping/product-schema "buy now" for a prescription-only drug, no fake LocalBusiness for a state-licensed telehealth service).

---

## Cross-skill references
- Finding 1 (LegitScript placement) may be worth a quick `docs/features/legitscript.md` discrepancy check against actual `src/lib/legitscript.ts` usage in `src/routes/semaglutide` and `src/routes/tirzepatide` (or equivalent route files) to confirm whether the omission is a template gap vs. an intentional choice this audit isn't aware of.
- No schema gaps found that need `/seo schema` - FAQPage, BreadcrumbList, and MedicalOrganization/Service schema are consistently present on all 8 pages sampled; MedicalWebPage/Article schema on learn pages lacks a named `reviewedBy`, which per base-context is a confirmed-intentional compliance decision, not flagged here as a gap.
- `/seo local` is not applicable to `/glp-1-houston/` or the Texas learn articles - confirmed telehealth-only, no NAP/GBP signal to evaluate, consistent with base-context scope rules.
- Symptom/troubleshooting learn articles (`glp-1-nausea`, `stopping-glp-1`, etc.) were not individually audited here - worth a `/seo page` pass on a sample of those in a future cycle to firm up the "current GLP-1 user" persona score above its current lower-confidence estimate.
