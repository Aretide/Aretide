# New treatment money pages: TRT, Hairloss, ED, NAD+, Sermorelin

## Summary

Build 5 new compounded-treatment landing pages (`/trt`, `/hairloss`, `/ed`, `/nad-plus`, `/sermorelin`) following the existing `/semaglutide` + `/tirzepatide` template, on branch `feature/new-treatment-pages`. Pricing comes from the "Beema Pricing" cost sheet at ~50% markup over landed cost, charm-rounded. Riskiest assumption: **Bask's per-product intake URLs are guessed** (`https://q.beemahealth.com/start-online-visit/{slug}`), not confirmed against Bask's actual routing — wrong guesses here silently misroute every conversion for that product.

## Pricing (derived from your cost sheet, 50% markup, charm-rounded)

Methodology: `price = landed_cost × 1.5`, then rounded to a charm ending (…9, …99). Landed cost = pharmacy + dispense + shipping + doctor's fee, as your sheet already totals it in the COST column.

| Product | Plan | Landed cost | ×1.5 | Charm price |
|---|---|---|---|---|
| **TRT (Enclomiphene)** | Monthly (flat, any of the 3 doses — no quarterly SKU exists in your sheet) | $112.99 (25mg, ceiling dose) | $169.49 | **$169/mo** |
| **Hairloss — Oral** (Minoxidil, GoGoMeds) | Monthly | $65.99 | $98.99 | **$99/mo** |
| | Quarterly (bundled — fixed costs amortize over 3mo) | $71.99 total | $107.99 | **$109 total (~$36/mo)** |
| **Hairloss — Topical** (compounded spray, Pharmacy Hub) | Monthly | ~$85.00 | $127.50 | **$129/mo** |
| | Quarterly | ~$147.99 total | $221.99 | **$219 total (~$73/mo)** |
| **ED — Standard** (sildenafil or tadalafil, single ingredient) | Monthly | ~$66.50 | $99.75 | **$99/mo** |
| | Quarterly | ~$69.50 total | $104.25 | **$89 total (~$30/mo)** — priced slightly under raw math to keep the "Save $208 vs monthly" story clean |
| **ED — Combo** (tadalafil + sildenafil RDT) | Monthly | $85.39 | $128.09 | **$129/mo** |
| | Quarterly | ~$107.79 total | $161.69 | **$159 total (~$53/mo)** |
| **NAD+** | Monthly | **no cost data in your sheet** | — | **$149/mo** — market-rate estimate only (telehealth NAD+ subscriptions typically run $99–$249/mo), *not* derived from your costs |
| **Sermorelin** | Monthly | **no cost data in your sheet** | — | **$199/mo** — market-rate estimate only (telehealth sermorelin typically $150–$300/mo), *not* derived from your costs |

Dose does not change price within a plan — matches the existing sema/tirz convention. Flag any of these for a different number; they're a first pass, not final.

## Decisions you'll probably want to tweak

1. **Route slugs.** Chose `/trt` (highest-search-volume consumer term) over `/enclomiphene` (the actual drug name, but near-zero search volume) — page copy will state the active ingredient clearly. Alternative: costs nothing to rename before launch, expensive to rename after indexing.
2. **Bask intake URLs — ASSUMED, needs verification before push:**
   - `https://q.beemahealth.com/start-online-visit/trt`
   - `https://q.beemahealth.com/start-online-visit/hairloss`
   - `https://q.beemahealth.com/start-online-visit/ed`
   - `https://q.beemahealth.com/start-online-visit/nad`
   - `https://q.beemahealth.com/start-online-visit/sermorelin`
   Wired into `CTA_OVERRIDES` in `src/lib/cta-ids.ts`, same pattern as the weight-loss default. If these paths don't exist on Bask, every new CTA 404s or falls through to the weight-loss questionnaire. **Verify with Bask before merging.**
3. **New pricing model shape.** Existing `medication-pricing.ts` is hard-built around GLP-1's 1/3/6/12-month tiers + promo code + starter pack. These 5 products only have Monthly/Quarterly (per your sheet), no promo code. I'll add a parallel, simpler type (`SimpleCompoundedPricing`) and a `SimpleTreatmentPricingCard` component rather than force-fitting the GLP-1 shape — keeps the GLP-1 promo-code logic untouched. Alternative (rejected): overload the existing type with optional fields — would make every GLP-1 helper function need new branches for products that don't have promo codes.
4. **Imagery: branded SVG illustrations, not photos.** No product photography exists for any of these 5 lines, and generating fake "photorealistic" pill/vial photos would risk misrepresenting real packaging (a genuine deceptive-imagery problem, separate from LegitScript). I'll build simple flat-illustration SVGs in Beema's brand palette (`design-tokens.ts`) — an injectable-vial style for TRT/NAD+/Sermorelin, a tablet/blister style for ED, a bottle/spray style for Hairloss — extending `treatment-imagery.ts`'s `MedicationId` union. Cheap to swap for real photography later; expensive to un-publish a misleading stock photo.
5. **Hairloss and ED each ship as two plans on one page** (Oral vs Topical; Standard vs Combo) rather than two separate routes — matches how the Bask catalog groups them and avoids doubling compliance-review surface area for a thin second page.

## Known unknowns & defaults

- **NAD+/Sermorelin pricing has no cost backing** — default is market-rate, called out inline on both pages' internal pricing-methodology notes are *not* shown to patients (that's an internal doc thing), but I will flag it to you again at hand-off before anything ships. Signal to revisit: real pharmacy cost sheet for these two arrives.
- **Bask URL slugs unverified** — default as listed above. Signal to revisit: any 404 or Bask support ticket.
- **Exact per-dose SKU-to-consumer-plan mapping** (e.g. which specific hairloss topical formulation of the 2 catalog variants becomes "the" topical plan) — default: pick the cheaper/simpler variant as the flagship, mention "your provider selects the specific formulation" in copy so we're not overcommitting to one SKU. Signal to revisit: pharmacy fulfillment constraints.

## Compliance & validation

`docs/features/treatment-pages.md` §Compliance and `SEO-AEO-GEO-PLAN.md` §F1.1 are GLP-1-specific and do not cover these 5 products. I'll write parallel, product-accurate framing (not a find-replace of the GLP-1 language) for each:

- **TRT/Enclomiphene:** not FDA-approved; not testosterone itself and not a controlled substance; considered only when legally available and clinically appropriate; never implies Beema offers injectable testosterone.
- **Hairloss:** compounded, individualized, multi-ingredient formulations not sold as a single commercial product; not FDA-approved; never claims equivalence to Rogaine/Propecia brand names.
- **ED:** compounded sildenafil/tadalafil (including personalized doses/combinations not sold commercially); not FDA-approved; never claims to be "generic Viagra/Cialis" or equivalent to the branded product.
- **NAD+ / Sermorelin:** not FDA-approved; considered only when legally available and clinically appropriate; sermorelin copy notes the prior branded product (Geref) was discontinued, which is the actual compounding rationale — not price.

Universal, carried over from the GLP-1 rules because they're general FDA/FTC compounding-marketing principles, not GLP-1-specific: no "generic"/"same as"/"equivalent to"/"clinically proven" language against any branded product; price never framed as the clinical justification; provider decides case-by-case; prescribing never guaranteed; no outcome guarantees. I'll add a `§F1.2` section to `SEO-AEO-GEO-PLAN.md` codifying this for these 5 products, parallel to §F1.1.

Before shipping, I will load the `legitscript-compliance` skill and check every FAQ answer / hero claim / required-sentence on all 5 pages against LegitScript's 9 standards — this is the "verify all our claims fall within legitscript" step you asked for. I'll report anything that doesn't clear it rather than silently softening it.

Also required: rewrite the TRT disclaimer content in `src/content/learn/hubs.ts` (currently states "Beema does not currently offer testosterone replacement therapy... no TRT pricing, no TRT reviews") and the corresponding line in `public/llms.txt` ("Education about testosterone replacement... exists on the site, but those are not purchasable Beema programs today") — both need to flip to reflect that enclomiphene-based TRT is now live, and the learn hub should cross-link to `/trt`.

No PHI touches these pages — same as existing treatment pages (public marketing content only).

## Mechanical work (compressed)

- `src/lib/medication-pricing.ts`: add `SimpleCompoundedPricing` type + builder/format helpers; 6 new pricing consts (TRT, Hairloss×2, ED×2, NAD+, Sermorelin).
- `src/components/site/TreatmentPageBlocks.tsx`: add `SimpleTreatmentPricingCard` (no promo/starter-pack copy branches).
- `src/lib/treatment-imagery.ts`: extend `MedicationId` union to 7 values; add 5 new SVG assets under `src/assets/treatments/`.
- `src/lib/cta-ids.ts`: add 10 new `CtaId`s (`{product}_hero`/`{product}_footer` × 5) + `CTA_OVERRIDES` entries.
- `src/routes/trt.tsx`, `hairloss.tsx`, `ed.tsx`, `nad-plus.tsx`, `sermorelin.tsx`: new route files, each with hero/what-is-it/how-it-works/pricing/safety/FAQ/closing-CTA + JSON-LD (`BreadcrumbList` + `FAQPage` + `serviceJsonLd`), mirroring `semaglutide.tsx` structure.
- `src/components/site/SiteHeader.tsx`: add 5 items to `WEIGHT_LOSS_ITEMS`.
- `src/components/site/SiteFooter.tsx`: add 5 links to the Care column.
- `src/content/learn/hubs.ts`: rewrite the TRT hub's "not offered" copy; cross-link to `/trt`.
- `public/llms.txt`, `public/sitemap.xml`: add the 5 new URLs; fix the TRT "not purchasable" line.
- `docs/marketing/SEO-AEO-GEO-PLAN.md`: add §F1.2 (non-GLP-1 compounded marketing rules).
- `docs/features/treatment-pages.md`: document the 5 new routes, pricing model, and imagery approach (feature-doc update — will ask before creating if it doesn't already cover this, per CLAUDE.md).
- Tests: extend `src/lib/__tests__/medication-pricing.test.ts`-equivalent coverage for new pricing helpers; extend `sitemap.test.ts` for new URLs; `npx tsc --noEmit` + changed-file ESLint per CLAUDE.md gate.

## Out of scope

- HRT/menopausal hormone therapy page — not requested, and `hubs.ts` disclaimer for it stays as-is (untouched).
- Real product photography — SVG illustrations only, this pass.
- Multi-month (6/12mo) plans or promo codes for these 5 products — not present in your cost sheet or Bask catalog; Monthly/Quarterly only.
- Ads-specific landing pages (`lp.*`) for these products — money pages only, per your request.
- Any change to Bask/Hive itself — this repo is marketing-site only.

## Review request

1. OK to proceed with the pricing table above as a first pass (including the two market-rate guesses for NAD+/Sermorelin)?
2. OK with route slugs `/trt`, `/hairloss`, `/ed`, `/nad-plus`, `/sermorelin`?
3. OK with SVG-illustration imagery (no photos) for this pass?
4. OK to rewrite the `hubs.ts` TRT disclaimer content as part of this same branch (it's directly contradicted by the new page)?
