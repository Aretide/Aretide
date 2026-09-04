# Action Plan - beemahealth.com SEO/GEO Audit

Generated 2026-08-26. Full evidence and detail in `FULL-AUDIT-REPORT.md` and `findings/*.md`. Every item below is PR input for the team to review and implement - nothing in this audit was auto-applied.

## Phase 1: Conversion and Trust Fixes (Week 1)

- [ ] **Fix `/glp-1-houston/` mobile hero layout** so the LegitScript seal doesn't push "Get Started" below the fold - move the seal beside the H1 (homepage pattern) instead of centered above it. *Visual, High. `findings/visual.md` #1.*
- [ ] **Add the LegitScript seal component to `/semaglutide/` and `/tirzepatide/`** near the pricing table or safety section - reuses the existing component already used on 5 other pages. *SXO, High. `findings/sxo.md` #1.*
- [ ] **Reconcile `robots.txt`'s stale comment** on retired stub paths (`/pricing`, `/clinicians`, `/insurance`, `/switch`, `/the-comb`) - either restore the documented 301-to-home redirects or update the comment to describe the current 404 behavior. *Technical, Medium, 5-minute fix. `findings/technical.md` #3.*

## Phase 2: On-Page and AI-Citability (Weeks 2-3)

- [ ] **Wrap existing FAQ accordion questions in `<h3>` tags on `/semaglutide/` and `/tirzepatide/`**; add 1-2 question-shaped H2s to `/glp-1/` and the homepage where none currently exist. *On-Page + GEO, High. `findings/geo.md` #3.*
- [ ] **Add a visible "Reviewed by Dr. Sean Arora, MD" byline** on the 7 pages that already carry it in JSON-LD (`/about/`, `/how-it-works/`, `/safety/`, `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, `/glp-1-houston/`). *Content, Medium. `findings/content.md` #1.*
- [ ] **Add a 1-2 sentence definitional lede** under the H1 on `/semaglutide/` and `/tirzepatide/` stating the mechanism and current base price before the existing brand-voice intro. *On-Page + GEO, Medium. `findings/geo.md` #4.*
- [ ] **Add extractable LegitScript trust text** (not just the seal image) to `/semaglutide/`, `/tirzepatide/`, and `/glp-1/`, reusing the wording already approved for Learn articles. *GEO, Medium. `findings/geo.md` #7.*
- [ ] **Retitle `/learn/weight-loss/glp-1-in-houston/`** away from the bare "GLP-1 Houston" exact-match phrase toward its real angle (telehealth vs. driving to a clinic), so it doesn't compete 1:1 with the `/glp-1-houston/` commercial pillar. *Content Architecture, High. `findings/cluster.md` #2.*
- [ ] **Reframe `llms.txt`'s "Primary pages for citation" line** to split by intent (commercial -> treatment pages; informational -> the existing "Common questions" table). *GEO, Medium, 10-minute copy edit. `findings/geo.md` #2.*

## Phase 3: Performance and Internal Linking (Month 2)

- [ ] **Inline or defer the render-blocking stylesheet**; audit whether all 27 eagerly-fired `modulepreload` chunks need to load on every route. *Performance, Medium. `findings/performance.md` #1.*
- [ ] **Profile the post-paint hydration tail** (TTI is 4-5x LCP); confirm whether GA4 and Google Ads `gtag.js` should share a single loader per `docs/features/analytics.md`, and consolidate if not. *Performance, Medium. `findings/performance.md` #2, #4.*
- [ ] **Link `/glp-1-for-weight-loss/` out to its 7 drug-comparison spokes** (ozempic, wegovy, mounjaro, zepbound, saxenda, semaglutide-weight-loss, tirzepatide-online). *On-Page, Medium. `findings/cluster.md` #4.*
- [ ] **Expand `glp-1-side-effects` to link all 14 symptom-specific spoke articles**, grouped by category (GI, systemic, interactions). *On-Page, Medium. `findings/cluster.md` #5.*
- [ ] **Resize the compounded-medication vial images** to match their display slot (currently full source resolution into a 372x372 slot, ~63KB wasted each). *Images, Low. `findings/performance.md` #3.*
- [ ] **Define "content-significant" concretely** in the sitemap header comment, then reconcile the 9 stale `lastmod` dates found. *Sitemap, Medium. `findings/sitemap.md` #1.*
- [ ] **Fix the breadcrumb "Home" link tap target** (38x20px, below the WCAG 24x24px floor) - likely a shared-component fix. *Visual, Medium. `findings/visual.md` #2.*
- [ ] **Add `sameAs` links for YouTube (if planned) and LinkedIn** to Organization schema. *GEO, Medium. `findings/geo.md` #8.*

## Phase 4: Monitoring and Iteration (Ongoing)

- [ ] Add a free Moz API key (2,500 rows/month, no cost) and compile a tracked list of known external mentions of beemahealth.com (LegitScript listing, press, directories, partners) to unlock real backlink data next cycle.
- [ ] Re-check Common Crawl domain presence quarterly.
- [ ] Once GA4/GSC/PSI credentials exist, replace this audit's lab-only Performance and structural GEO/SXO estimates with real field data.
- [ ] Spot-check `reviewedByClinicalLead` flag usage per call site and audit WCAG contrast on solid-fill Button/Badge/Alert variants using `text-destructive`/`success-foreground`.
- [ ] Consider running `drift_baseline.py` against this audit's results to seed a baseline for the next cycle's drift comparison.
- [ ] Add a lightweight decision-matrix block to `best-glp-1-for-weight-loss` without diluting its honest no-single-winner framing.

---

## Explicitly not recommended (confirmed intentional, do not "fix")

- Recipe pages' omission of `nutrition`/`aggregateRating`/`reviewedBy` schema - compliance decision, enforced by `src/lib/__tests__/recipes.test.ts`.
- Learn articles' omission of `reviewedBy` - unsigned educational content by design, per `docs/features/learn.md`.
- `glp-1-near-me` not competing for local-pack results - correct, telehealth has no physical clinic to fake a `LocalBusiness` for.
- `best-glp-1-for-weight-loss`'s refusal to crown a single winner - clinically honest and should not be changed for SEO alone (add a quick-answer block instead, see Phase 4).
- Modeling prescription pricing as `Service`/`Offer` rather than `Product` - required to stay compliant with Google Merchant policy for prescription-gated goods.
