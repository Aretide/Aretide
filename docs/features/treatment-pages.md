# Treatment pages

Each medication Beema offers gets its own indexable, SEO-focused landing page (`/tirzepatide`, `/semaglutide`, `/hairloss`, `/ed`) - this targets each drug's search terms without diluting them, and gives each page its own FAQPage/BreadcrumbList JSON-LD. Beema's patient-facing offering is **compounded only** across every product line. Do not add branded-medication pages (Wegovy, Zepbound, Ozempic, Mounjaro, or any branded ED/hairloss product) or describe those brands as Beema offerings. `/weight-loss` sits alongside the compounded GLP-1 pages as a broader overview targeting head-term searches ("medical weight loss," "GLP-1 weight loss program") - see below.

## The non-GLP-1 product lines (TRT, hairloss, ED, NAD+, sermorelin)

Added 2026-08-27, first pass, restructured 2026-08-28/29. These are **not** GLP-1 medications, so the §F1.1 compliance rules below (written specifically for compounded semaglutide/tirzepatide) do not apply to them verbatim - see `docs/marketing/SEO-AEO-GEO-PLAN.md` §F1.2 for their parallel, product-accurate compliance framing.

**Only Hairloss and ED are live.** TRT, NAD+, and sermorelin are **paused** (2026-08-28) - Beema is not selling them right now. Their routes (`/trt`, `/nad-plus`, `/sermorelin`) redirect home, matching the site's existing archived-route convention (see `docs/archived-marketing-pages.md` / `/the-comb`, `/pricing`), and are unlinked everywhere and disallowed in `robots.txt`. Full page content and pricing consts stay in git history / `simple-treatment-pricing.ts` (unused by any live route) so restoring them later is a revert, not a rebuild. **When TRT returns, do not market it as "TRT"** - enclomiphene is pharmacologically distinct from testosterone replacement therapy (it stimulates the body's own production rather than replacing testosterone directly). Write a "TRT vs enclomiphene" learn article before relaunching it, and name the route/nav something other than "TRT".

| Product | Route | Status | What Beema actually sells | Plans |
|---|---|---|---|---|
| Hairloss | `/hairloss` | **Live** | 6 compounded formulations, split For Men / For Women (oral minoxidil shared by both; finasteride, women's oral compound, and 2 distinct topical sprays) | Oral minoxidil and both topical sprays have Monthly + Quarterly; finasteride and the women's oral compound are Monthly only |
| ED | `/ed` | **Live** | 3 compounded formulations: single-ingredient tadalafil, single-ingredient sildenafil, and a tadalafil+sildenafil combo. A second combo SKU exists in the pharmacy catalog but has no pricing yet and is not sold | All three have Monthly + Quarterly |
| TRT | `/trt` | **Paused** | Compounded **enclomiphene** - an oral SERM that encourages the body to produce its own testosterone. Not injectable testosterone, not a controlled substance | Monthly only (no quarterly SKU in the cost sheet) |
| NAD+ | `/nad-plus` | **Paused** | Compounded NAD+ injections | Monthly only |
| Sermorelin | `/sermorelin` | **Paused** | Compounded sermorelin injections | Monthly only |

**Pricing model:** these products use `src/lib/simple-treatment-pricing.ts`, deliberately separate from `medication-pricing.ts` (see that file's docstring - the GLP-1 pricing shape has 1/3/6/12-month tiers, a promo code, and a starter pack, none of which these products have). First-pass prices were set at roughly 1.5x landed cost (pharmacy + dispense + shipping + doctor's fee) from an internal cost sheet, charm-rounded. **NAD+, sermorelin, and hairloss finasteride have no cost-sheet entry at all** - their prices are telehealth market-rate estimates, not cost-derived; revisit once real pharmacy costs exist. Tadalafil and sildenafil share a price (landed costs were materially identical in the cost sheet). `SimpleTreatmentPricingCard` in `TreatmentPageBlocks.tsx` renders these plans; it does not share code with `TreatmentPricingCard` (GLP-1-only) or `CompoundedPriceLockup` (GLP-1-only, hardcodes tirz/sema cross-references).

**Imagery:** no product photography exists for any of these lines. Rather than fabricate photorealistic pill/vial photos (a real risk of misrepresenting actual packaging, separate from LegitScript concerns), each page uses `TreatmentHeroArt` - a flat, on-brand illustration (hex badge + lucide icon + "Beema" wordmark) in place of a photo. Swap for real photography later by changing each route's hero, the same way `VIAL_IMAGERY_MODE` in `treatment-imagery.ts` works for sema/tirz.

**CTA URLs are unverified against Bask.** `CTA_OVERRIDES` in `cta-ids.ts` points each product's hero/footer CTA at `https://q.beemahealth.com/start-online-visit/{hairloss|ed|...}`, mirroring the only known-good pattern (`/start-online-visit/weightloss`). This is an assumption, not a confirmed Bask route - verify before relying on these in production.

**Nav:** see "Nav: category dropdowns" below for the current (2026-08-29) shape - sectioned dropdowns for Hair and Sexual Health, flat for Weight Loss, no dropdown for the paused Wellness category. All live medication pages are also in the footer Care column, grouped under their category's hub link.

**`/learn/trt` needs a rewrite** (not yet done as of this pause) - it currently explains the compounded-enclomiphene distinction and links to `/trt`, which now redirects home. Once rewritten, it should explain TRT vs. enclomiphene for education without pointing at a live commercial page, and a dedicated "TRT vs enclomiphene" article should be added. `/learn/hrt`'s "not currently offered" language is untouched - HRT is still not a Beema program.

Educational (not commercial) companions live at `/learn/`. Program pages pull those guides from `src/content/learn/money-page-guides.ts`. Learn copy is unsigned; do not treat it as clinician-reviewed. Spec: `docs/features/learn.md`.

## Category hub pages (`/sexual-health`, `/hair`; `/wellness` paused)

Added 2026-08-27, alongside the nav reorganization below. Mirrors the pre-existing `/weight-loss` pattern exactly: a broader, non-brand overview page targeting head-term searches ("hair loss treatment," "sexual health treatment online"), linking down into the category's specific medication pages, which stay the bottom-funnel conversion targets.

| Hub | Route | Status | Links to |
|---|---|---|---|
| Weight Loss | `/weight-loss` | Live (pre-existing) | `/semaglutide`, `/tirzepatide` |
| Sexual Health | `/sexual-health` | Live | `/ed` only for now (TRT paused - see above) |
| Hair | `/hair` | Live | `/hairloss` (designed to grow, see below) |
| Wellness | `/wellness` | **Paused** (redirects home) | Would link `/nad-plus`, `/sermorelin` - both paused |

**Why Hair gets a full hub despite having one product page today:** more hair-loss formulations are planned, so `/hair` and its nav dropdown (`HAIR_SECTIONS` in `SiteHeader.tsx`) exist now to grow into, rather than retrofitting a hub later once a second hair product ships. Add new hair-loss medication pages to `HAIR_SECTIONS`, the `/hair` route's `LINEUP` array, and the footer Care column.

**Compliance note (Sexual Health specifically):** when TRT returns, remember ED and TRT are different treatments for different concerns - the hub's copy should say so explicitly (it did, before the pause) so that bucketing them together for nav/audience reasons doesn't read as implying one is the other.

**Structured data:** each hub carries `BreadcrumbList` + `serviceJsonLd()` only, matching `/weight-loss` - no visible FAQ content on any hub, so no `FAQPage` (see the Structured data section below for why that pairing matters).

**Shared building block:** `SimpleCategoryLineup` in `TreatmentPageBlocks.tsx` renders each hub's card grid (icon art + name + price + link), deliberately separate from `TreatmentLineup.tsx` (the `/weight-loss`-only version hardcoded to GLP-1 photo imagery and `CompoundedPriceLockup`).

## Compliance (LegitScript + FDA)

Canonical long-form rules live in `docs/marketing/SEO-AEO-GEO-PLAN.md` **§F1.1**. Hard constraints for these pages and related marketing copy:

1. **Compounded-only offering.** Never list or imply Beema sells Wegovy, Zepbound, Ozempic, Mounjaro, or other FDA-approved branded GLP‑1s.
2. **FDA (Feb 6, 2026):** do not claim compounded products are generic / the same as FDA-approved drugs; do not state they use the same active ingredient; do not state they are clinically proven to produce results. https://www.fda.gov/news-events/press-announcements/fda-intends-take-action-against-non-fda-approved-glp-1-drugs
3. **Price ≠ medical necessity.** Lower price alone does not establish that a compounded drug is not essentially a copy of a commercial product.
4. **Required sentence** (reuse verbatim where the page explains compounded status): "Compounded {drug} is not FDA-approved and is considered only when legally available and clinically appropriate."
5. No outcome guarantees; prescribing is never guaranteed; provider decides case-by-case.
6. **No "medically reviewed" claims anywhere (2026-08-28).** Beema is LegitScript-certified - a separate, distinct claim from a content medical-review claim - and the two must never be conflated or implied either way. Do not show a "medically reviewed on [date]" line, and pass `reviewedByClinicalLead: false` on every `serviceJsonLd()`/`medicalWebPageJsonLd()` call sitewide (not just treatment pages - see `docs/features/learn.md`).

Product photography: the site defaults to branded Beema-wordmark vial imagery via `VIAL_IMAGERY_MODE` in `src/lib/treatment-imagery.ts` (`"branded"`). Unbranded colour vials (no wordmark) remain on the switchboard if product wants them back. See `docs/features/legitscript.md` and `docs/features/homepage.md`.

## Routes

| Route | File | Notes |
|-------|------|-------|
| `/tirzepatide` | `src/routes/tirzepatide.tsx` | Compounded tirzepatide landing page |
| `/semaglutide` | `src/routes/semaglutide.tsx` | Compounded semaglutide landing page |
| `/glp-1` | `src/routes/glp-1.tsx` | National cash-pay GLP-1 category page (not in primary nav/footer). Shares `Glp1LandingPage` with city landers. |
| `/glp-1-houston` | `src/routes/glp-1-houston.tsx` | Houston cash-pay GLP-1 ads landing. Future cities: `/glp-1-{city}` under the same template - see "City GLP-1 pages" below |
| `/weight-loss` | `src/routes/weight-loss.tsx` | Category hub - linked from footer, see below |
| `/hairloss` | `src/routes/hairloss.tsx` | Compounded hairloss landing page (6 SKUs, For Men / For Women sections) |
| `/ed` | `src/routes/ed.tsx` | Compounded ED landing page (tadalafil, sildenafil, combo) |
| `/sexual-health` | `src/routes/sexual-health.tsx` | Category hub for `/ed` (TRT paused, see above) - linked from footer, see "Category hub pages" above |
| `/hair` | `src/routes/hair.tsx` | Category hub for `/hairloss` (designed to grow) - linked from footer |
| `/trt` | `src/routes/trt.tsx` | **Paused** - redirect-to-home stub, see above |
| `/nad-plus` | `src/routes/nad-plus.tsx` | **Paused** - redirect-to-home stub, see above |
| `/sermorelin` | `src/routes/sermorelin.tsx` | **Paused** - redirect-to-home stub, see above |
| `/wellness` | `src/routes/wellness.tsx` | **Paused** - redirect-to-home stub, see above |

Shared building blocks (pricing card, comparison table, FAQ accordion, breadcrumb) live in `src/components/site/TreatmentPageBlocks.tsx`. Copy/data (steps, FAQ items, eligibility bullets) stays local to each route file - do not extract it into a shared data file, each page is meant to have genuinely distinct copy.

`faqPageJsonLd()` and `breadcrumbJsonLd()` (in `src/lib/seo.ts`) generate JSON-LD from the same arrays that render the visible FAQ/breadcrumb - keep them in sync if you edit either.

## First-visit splash and LCP prefetch

Google → Beema document loads show `SiteBootLoader` (hex draw + stacked Beema / Health wordmark) until the document, fonts, and **this URL's LCP photo** are ready. In-app client navigations do not remount it. Bask already shows a loader on the hop to intake.

`bootImagePreloadLinks(path)` is spread into each lander's `head()` links. `criticalBootImageUrls` in `src/lib/boot-assets.ts` must stay LCP-only - extra preloads delay Google LCP:

| URL | Waits / preloads (high) | Then warms (low) |
|-----|-------------------------|------------------|
| `/semaglutide`, `/tirzepatide` | That page's branded vial (hero `<img>` also has `fetchPriority="high"`) | The other vial |
| `/glp-1`, `/glp-1-houston` | None (headline is LCP) | LegitScript seal only. Do not fetch unused vial PNGs. |
| `/weight-loss` | None | Both vials for `TreatmentLineup` |

Kill switch: `SITE_BOOT_LOADER_ENABLED`. Homepage hero prefetch: `docs/features/homepage.md`. Shared lander table: `docs/features/landing-pages.md`.

## `/weight-loss` is a linked overview page

Previously `/weight-loss` was kept as a deliberate orphan (no internal links anywhere on the site) while still being sitemapped at priority 0.9, on the reasoning that it would be retired once the tirzepatide/semaglutide pages fully replaced it. That left it as a genuine orphan page at a high sitemap priority - a real inconsistency for an SEO-focused site, since Google's crawl/ranking signals come from internal link equity, not sitemap presence alone.

As of the 2026-07-30 SEO pass, that decision was reversed: `/weight-loss` is real, unique, non-duplicate content (its own hero, benefits, "who this is for" section, and CTA - not a stub) that targets broader, higher-volume, non-brand search intent than the drug pages can. It is now:

- Linked from the footer Care column (`COLUMNS[0].links` in `SiteFooter.tsx`), not from the header's Weight Loss dropdown
- Linked contextually from `/semaglutide` and `/tirzepatide` ("Learn about our weight-loss program")
- Down-ranked in `public/sitemap.xml` to priority `0.7` (below the two drug pages at `0.9`, which remain the primary conversion targets, and `/how-it-works` at `0.8`)

If a future change needs to re-orphan or retire this page, that's a deliberate call to make with the team, not a default to restore - update this doc and the `COLUMNS` comments together with the code.

## Nav: category dropdowns (Weight Loss / Sexual Health / Hair)

Reorganized 2026-08-27, Good Life Meds style, replacing the previous same-day flat "Treatments" dropdown (one list of all 7 medications). `SiteHeader.tsx` renders one medication dropdown per **live** category, each scoped to that category's *specific medication pages only* - the category's hub page stays out of the header (see below). Wellness is currently paused entirely (see below) so it has no dropdown right now.

| Dropdown | Const | Shape | Items |
|---|---|---|---|
| Weight Loss | `WEIGHT_LOSS_ITEMS` | flat `NavItem[]` | Compounded Tirzepatide, Compounded Semaglutide |
| Sexual Health | `SEXUAL_HEALTH_SECTIONS` | sectioned (2026-08-29) | **For Men**: Tadalafil, Sildenafil, Tadalafil + Sildenafil Combo. No "For Women" section yet - see below |
| Hair | `HAIR_SECTIONS` | sectioned (2026-08-28) | **For Men**: Oral Minoxidil, Finasteride, Topical Spray. **For Women**: Oral Minoxidil, Oral Hair Compound, Topical Spray |

**Sectioned dropdowns** (`NavSection = { heading, items }`, an optional `sections` prop alongside the flat `items` prop on both `DesktopNavDropdown` and `MobileNavDropdown`) render a For Men / For Women two-column grid instead of a flat list - `DesktopNavDropdown` collapses to one column when only one section has items (Sexual Health today). Add `sections` to a dropdown only when the category is genuinely split by sex; Weight Loss stays a flat list.

**Do not add an empty/coming-soon "For Women" section** to Sexual Health before a women's product actually ships - matches the sitewide "no coming-soon placeholders in live nav" rule (see the Resources/More section below). Add the second section (same shape as `HAIR_SECTIONS`) the day a women's sexual-health product goes live, not before.

Add a new medication page to the matching category's items/section array (and to that category's hub-page `LINEUP` array, and the footer Care column) rather than adding a new top-level nav entry or reviving the flat list. A genuinely new category (not Weight Loss/Sexual Health/Hair) is a deliberate call to make with the team, not a default - the header only has room for one more slot (see "Nav: 'More' dropdown" below) before it's crowded again.

Every category's hub page (`/weight-loss`, `/sexual-health`, `/hair`) stays **out of the header** - linked from the site footer Care column and from in-page copy only, matching the pre-existing `/weight-loss` decision. `/how-it-works` is in the **More** header dropdown and footer Resources column (care-process overview, not a medication page). On `/tirzepatide`, `/semaglutide`, `/glp-1`, and `/glp-1-houston`, the hero "How it works" / "How care works" button is an on-page jump (`hash="how-it-works"`) to `<HowItWorksSteps />` on that same page, not a navigation to `/how-it-works/`.

Hover/tap behavior is the same shared pair as the other menus:

- **Desktop** - `DesktopNav` / `DesktopNavDropdown`. Click a trigger to open, click it again (or outside / Escape) to close, hover another trigger to switch. The open panel fades and slides in (opacity + translate only - no Radix DropdownMenu; that Popper flicker is why these stay in-flow). Only one panel is open at a time; sibling labels dim while a menu is open.
- **Mobile** - `MobileNavDropdown`, a tap-to-expand disclosure inside the mobile menu (see `docs/features/homepage.md` for the `CircleRevealMenu` shell it lives in). Local `expanded` state collapses it back down every time the mobile menu reopens; the reveal/collapse is animated (Motion `AnimatePresence` + height/opacity), matching the site's other transitions.

Keep `/glp-1` in the footer Care column, not in the header - it's a national cash-pay category page distinct from the four medication-category hubs above. Do **not** add city/geo GLP-1 ads landers (`/glp-1-houston`, future `/glp-1-{city}`) to primary nav or footer - those stay ad/SEO entry points.

## Nav: "More" dropdown (merged from "Resources" + "About" 2026-08-27)

`SiteHeader.tsx` renders **More** - the free content library plus the care-process overview plus the company cluster, all in one dropdown (`MORE_ITEMS`). It uses the same `DesktopNavDropdown` / `MobileNavDropdown` pair as the category dropdowns. Keep the label literal ("More") so it does not compete with Hive (the patient portal at `hive.beemahealth.com`) and does not imply it's another product category.

This was two separate dropdowns (Resources: how it works, recipes, learn; About: about us, FAQ, contact us) until the 4 new category dropdowns (Weight Loss/Sexual Health/Hair/Wellness) pushed the header to 6 total - merging these two back down to keep the 4 treatment categories as the header's "main groups" without adding more utility dropdowns alongside them. Nothing was removed: every item is still one click away, just under one label instead of two. The **footer keeps its separate Resources and Trust columns** unchanged - this merge is a header-only consolidation.

Live items in `MORE_ITEMS` today: `/how-it-works/`, `/recipes/`, `/learn/`, `/about/`, `/faq/`, `/contact/`. Add workout videos, cooking videos, and other no-account resources here (and in the footer Resources column) when they ship - do not add coming-soon placeholders to the live nav. Add Safety or other trust pages here only if they need a persistent header slot; today Safety stays in the footer Trust column plus in-page treatment links. The footer Trust column also has an external "Leave a Google review" link (`GOOGLE_REVIEW_URL` in `src/lib/google-business.ts`) - the write-review URL, not the listing URL used in Organization `sameAs`.

`/the-comb/` is a retired branded overview that redirects home. Do not relink it.

The homepage `FreeResourcesSection` is the in-page spotlight for the same library (headline: "Free resources to help you get started").

## City GLP-1 pages

Google Ads can expand beyond Houston. Live shape:

| URL | Role |
|-----|------|
| `/glp-1` | National/category hub (`<Glp1LandingPage market="national" />`) |
| `/glp-1-houston` | Houston ads LP (`<Glp1LandingPage market="houston" />`) |
| `/glp-1-austin`, … | Future city LPs: add a market to `src/lib/glp-1-landing.ts` and a thin route file |

Keep city pages out of the category dropdowns so nav does not grow with every market. Ads land on the city URL. The national hub is linked from the footer Care column (`GLP-1 Care` → `/glp-1/`); city landers stay out of nav/footer. Shared sections live in `Glp1LandingPage`; only market copy, canonicals, and JSON-LD differ. Each page self-canonicalizes - never canonicalize a city page to `/glp-1/`.

## Medication cards

`TreatmentShowcase.tsx` (homepage) and `TreatmentLineup.tsx` (`/weight-loss` page) each render one card per GLP-1 medication only - not updated for the 5 new product lines or 3 new hubs, which is deliberate for now: the homepage stays focused on the flagship GLP-1 offering, and each new hub's own `SimpleCategoryLineup` (see "Category hub pages" above) is the equivalent for its category. Both GLP-1 cards are full-card `<Link>`s (not nested interactive elements) pointing at that medication's own page (`/tirzepatide/`, `/semaglutide/`) - never at `/weight-loss/` itself. CTA copy is `Explore {treatment.name}` (e.g. "Explore Compounded Tirzepatide"). These two files still duplicate their own local `TREATMENTS` array (pre-existing pattern) - add a new GLP-1 medication to both when it gets its own page. The homepage TreatmentShowcase also links to `/glp-1/` ("Explore GLP-1 care"). Whether the homepage should surface the other 3 categories too is an open homepage-design question, not answered by this change.

## Structured data

Every treatment-adjacent page carries page-specific JSON-LD alongside the sitewide `MedicalOrganization`/`WebSite` schema (`ORGANIZATION_JSONLD`/`WEBSITE_JSONLD` in `src/lib/seo.ts`, rendered in the root layout):

- `/tirzepatide`, `/semaglutide`, `/hairloss`, `/ed` — `BreadcrumbList` + `FAQPage` + `serviceJsonLd()` (each has a visible FAQ accordion that matches its JSON-LD). `/trt`, `/nad-plus`, `/sermorelin` carried the same shape before being paused - their JSON-LD is dormant along with the rest of the page (redirect stubs render nothing)
- `/glp-1` — `BreadcrumbList` + `FAQPage` + `serviceJsonLd()` (national cash-pay GLP-1 category page; visible FAQ matches JSON-LD; canonical `https://beemahealth.com/glp-1/`)
- `/glp-1-houston` — `BreadcrumbList` + `FAQPage` + `serviceJsonLd()` (Houston cash-pay GLP-1 ads + local SEO page; visible FAQ matches JSON-LD; canonical `https://beemahealth.com/glp-1-houston/`)
- `/weight-loss`, `/sexual-health`, `/hair` — `BreadcrumbList` + `serviceJsonLd()` (each a `Service` describing the category program itself; no visible FAQ content on any hub, so no `FAQPage`). `/wellness` carried the same shape before being paused
- `/how-it-works`, `/safety` — `BreadcrumbList` + `medicalWebPageJsonLd()` (a `MedicalWebPage` describing the informational content; no visible FAQ content, so no `FAQPage`)

`breadcrumbJsonLd()`, `faqPageJsonLd()`, `serviceJsonLd()`, and `medicalWebPageJsonLd()` all live in `src/lib/seo.ts`. Never add `FAQPage` JSON-LD without a matching visible FAQ accordion on the page — Google's structured-data guidelines require the two to match, and `faqPageJsonLd()`'s docstring says the same.

## Pricing model: flat monthly rate, with a 3-month-only promo code

`src/lib/medication-pricing.ts` models each medication as `{ monthlyUsd }` — a single flat, standard cash-pay rate with **no automatic discount**:

- **`monthlyUsd`** is the standard rate, billed monthly, from month 1 onward. A 1-month purchase always bills at this rate — it is never discounted.
- **The only discount** is a one-time, per-patient `$100` promo code (`PROMO_CODE_DISCOUNT_USD`), redeemable **only** when purchasing a `3`-month plan (`PROMO_CODE_MIN_MONTHS`). It reduces month 1 only — `promoFirstMonthUsd(pricing)` computes that discounted first-month price. It cannot be combined with a 1-month purchase, and cannot be reused.
- This promo code is the same incentive promoted via `FIRST_MONTH_PROMO_LINE` in `src/lib/marketing-copy.ts`.

`compoundedMonthlyPricingSentence(label, pricing)` is the shared long-form sentence used across FAQ answers and route copy (e.g. "Compounded semaglutide is $199/month, billed monthly with no long-term contract. A one-time $100 promo code brings your first month to $99 when you purchase a 3-month plan; it can't be combined with a 1-month purchase and can only be used once per patient."). `formatCompoundedPriceLine()` and `dualCompoundedHeroPricingLine()` are the shorter card/hero variants of the same structure. **Never hand-write a pricing or promo-code sentence — always route through one of these helpers** so the flat-rate-plus-3-month-promo framing stays consistent if the numbers or wording change again.

## CTA switchboard (live — Bask intake)

Beema is live: every marketing CTA sitewide sends visitors to Bask’s hosted **intake** questionnaire (`https://q.beemahealth.com/start-online-visit/weightloss`) — one long questionnaire (not a separate Beema “eligibility” then “intake” product). Checkout and the patient portal also run on Bask/Hive. Leftover in-repo `/waitlist/`, `/qualify/`, `/intake/`, `/consent/` routes are **legacy** and unlinked from primary CTAs — see `docs/BACKEND-DEFERRED.md`.

**`resolveCta(ctaId)` in `src/lib/cta-ids.ts` is the single place that decision is made.** Every CTA button/link in the app calls it instead of hardcoding a URL or a label:

```tsx
const cta = resolveCta(CTA_IDS.tirzepatide_hero);
<Link to={cta.to} search={cta.search}>{cta.label}</Link>
```

- All `CtaId`s default to `DEFAULT_CTA_TARGET` (`"Get Started"` → the Bask **intake** URL).
- To repoint one CTA (or a few) — e.g. a medication-specific intake URL — add an entry to `CTA_OVERRIDES` keyed by `CtaId`. `to` can be an internal path or a full external URL (Bask lives on a different domain).
- To repoint everything at once, change `DEFAULT_CTA_TARGET`.

**When adding any new CTA button anywhere on the site: add a `CtaId` to `CTA_IDS` and call `resolveCta()` — never hardcode a URL or label on a marketing CTA.** This is what keeps repointing the funnel a one-file change instead of a site-wide hunt.

**Login is separate from the CTA switchboard.** The header's "Log In" link goes straight to the Hive patient portal (`HIVE_LOGIN_URL` in `src/lib/cta-ids.ts`, currently `https://hive.beemahealth.com`) via a plain `<a>` — it's an account action on Bask’s portal, not a marketing-conversion click, so it doesn't go through `resolveCta`/`CTA_IDS`.

## Key files

| File | Role |
|------|------|
| `src/routes/tirzepatide.tsx`, `src/routes/semaglutide.tsx` | The two treatment pages |
| `src/routes/glp-1.tsx` | National cash-pay GLP-1 category page |
| `src/routes/glp-1-houston.tsx` | Houston cash-pay GLP-1 ads + local SEO page |
| `src/components/site/Glp1LandingPage.tsx` | Shared GLP-1 landing layout (`market="national" \| "houston"`) |
| `src/lib/glp-1-landing.ts` | Market copy, canonicals, JSON-LD head for both GLP-1 routes |
| `src/lib/boot-assets.ts` | LCP vs warmup photo lists for the first-visit splash |
| `src/components/brand/SiteBootLoader.tsx` | Branded overlay (root shell, first document load) |
| `src/components/site/TreatmentPageBlocks.tsx` | Shared breadcrumb, pricing card, comparison table, FAQ accordion |
| `src/lib/medication-pricing.ts` | Single source of truth for GLP-1 pricing — never hardcode `$` amounts elsewhere |
| `src/lib/simple-treatment-pricing.ts` | Single source of truth for the non-GLP-1 products' pricing (Monthly/Quarterly, no promo code). TRT/NAD+/sermorelin consts stay defined but unused while paused |
| `src/routes/hairloss.tsx`, `ed.tsx` | The 2 live non-GLP-1 treatment pages |
| `src/routes/trt.tsx`, `nad-plus.tsx`, `sermorelin.tsx`, `wellness.tsx` | Paused - redirect-to-home stubs, full content in git history |
| `src/routes/sexual-health.tsx`, `hair.tsx` | The 2 live category hub pages (`/weight-loss` is the pre-existing 3rd) |
| `src/lib/cta-ids.ts` | `CTA_IDS`, `resolveCta()` — the CTA switchboard |
| `src/lib/seo.ts` | `faqPageJsonLd()`, `breadcrumbJsonLd()`, `serviceJsonLd()`, `medicalWebPageJsonLd()`, `canonicalUrl()` |
| `src/components/site/SiteHeader.tsx`, `SiteFooter.tsx` | Weight Loss / Sexual Health / Hair / More dropdowns (`DesktopNavDropdown` / `MobileNavDropdown`, `sections` prop for For Men/Women); footer Care + Resources + Trust columns (Trust includes the Google review ask) |
| `src/lib/google-business.ts` | GBP listing URL (`sameAs`) vs write-review URL (footer + `/contact/`) |
| `src/lib/marketing-copy.ts` | `FIRST_MONTH_PROMO_LINE` — the one-time, 3-month-only promo code promoted alongside pricing |
| `src/components/home/TreatmentShowcase.tsx`, `src/components/site/TreatmentLineup.tsx` | Medication cards (home / `/weight-loss`) |
| `public/sitemap.xml`, `public/llms.txt`, `src/lib/__tests__/sitemap.test.ts` | Keep in sync when adding a page |
