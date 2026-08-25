# Learn library

**Live:** `/learn/` is the educational (not commercial) library on the marketing site. Hubs: `/learn/weight-loss/`, `/learn/trt/`, `/learn/hrt/`. Weight-loss CTAs go to Bask **intake** via `resolveCta()`. Compounded-medication rules: `docs/features/treatment-pages.md` and `docs/features/legitscript.md`.

This library is **unsigned educational copy**. MedicalWebPage JSON-LD sets `reviewedByClinicalLead: false`. Articles do not show a clinician byline, "medically reviewed by," or a review date. That is intentional: do not attach `reviewedBy` or a named reviewer until a licensed clinician has actually reviewed that page.

Visible disclaimer (`LEARN_DISCLAIMER_BODY` in `src/lib/learn-trust-copy.ts`, rendered by `LearnDisclaimer`): the content is general information only, not medical advice, not a diagnosis, and not a treatment plan. Completing intake does not guarantee a prescription.

Ro (ro.co/health-guide) does **not** use an unsigned disclaimer. Health Guide articles carry a named "Reviewed by" byline, a [medical review process](https://ro.co/health-guide/medical-review-process/) page that says every article is doctor-reviewed, and a separate "not a substitute for professional medical advice" footer. Beema's honest counterpart, until we have real reviews, is unsigned plus the educational disclaimer - not a fake reviewer.

Inventory (locked by `learn-registry.test.ts`): 81 published weight-loss articles, 1 TRT, 1 HRT (83 total). Learn sitemap entries: 91 (index + 3 hubs + 83 articles + 4 legacy guides).

## Routes

| URL | File | Notes |
|-----|------|-------|
| `/learn/` | `src/routes/learn.index.tsx` | Index of hubs |
| `/learn/{vertical}/` | `src/routes/learn/$vertical.index.tsx` | Hub: weight-loss, trt, or hrt |
| `/learn/{vertical}/{slug}/` | `src/routes/learn/$vertical.$slug.tsx` | Published article |
| `/learn/initial-research/`, `/learn/resistance-training/`, `/learn/rest-intervals/`, `/learn/semaglutide-vs-tirzepatide/` | matching files in `src/routes/` | Legacy long-form guides, still canonical |

Canonicals use trailing slashes (`learnPath()` in `src/content/learn/types.ts`). GitHub Pages 301s the bare path.

## Content model

Articles live in `src/content/learn/articles/{vertical}/{slug}.ts` and export `article`. `src/content/learn/registry.ts` globs them at build time.

- Published: any slug that does **not** start with `_`.
- Unpublished fixtures: `_glob-fixture.ts` and similar. They stay in the glob so registry tests can exercise dangling-link behavior. They never appear in the sitemap or `llms.txt`.

Hub copy: `src/content/learn/hubs.ts`. Clusters on the weight-loss hub must list every published weight-loss slug.

## Funnel + legal copy (weight-loss)

Buy/get/near-me pages answer **Yes** first: adults in the United States can start an online visit with Beema. Then:

- Licensed providers in **all 50 US states**.
- **USA only** - not international.
- If a clinician prescribes, the live offering is **compounded semaglutide** and **compounded tirzepatide** when legally available and clinically appropriate.
- Required sentences live in `src/lib/compounded-disclosure.ts` and `src/lib/learn-trust-copy.ts`. Reuse them; do not rewrite. `LEARN_DISCLAIMER_BODY` and `LEARN_CTA_TRUST_BODY` compose those helpers.
- Completing intake **never** guarantees a prescription.
- Beema does **not** sell Wegovy, Ozempic, Mounjaro, or Zepbound.
- Trial percentages belong to **FDA-approved branded** studies. Attribute them. Do not treat them as compounded-product results.
- Do not YES-wash pipeline products (orforglipron, retatrutide, peptides). Those stay "not a Beema offering."

Shared FAQ builders: `buyGlp1OnlineFaq()`, `getGlp1OnlineWithBeemaFaq()`. Hub FAQs must say **get**, not **buy** (hub copy test).

Cash-pay numbers come from `src/lib/medication-pricing.ts` via `src/lib/learn-pricing-copy.ts`. Do not hardcode `$199` / `$297` / `$99` in learn prose.

## CTAs, seal, and ads

Weight-loss articles may set `ctaId` (must be a `CTA_IDS` value). TRT and HRT articles never CTA to intake.

`LearnWeightLossCta` states 50-state + USA-only coverage, the compounded disclosure, LegitScript **certified website** status (not an endorsement), and Google's healthcare/prescription-drug advertising certification. The LegitScript seal may appear on-site in multiple places. **Never put the seal in ads.**

## Internal linking

- `relatedSlugs`: same-vertical siblings. `getRelatedArticles()` keeps the **first 6** that resolve. Put campaign siblings first.
- `moneyPageHrefs`: commercial pages (`/weight-loss`, `/semaglutide`, `/tirzepatide`, `/glp-1`, `/glp-1-houston`). Resolved by `src/content/learn/money-pages.ts`.
- Program pages pull guides from `src/content/learn/money-page-guides.ts`.
- In-body links use markdown `[anchor](/path/)`. `LearnRichText` turns internal paths into TanStack `Link`s and applies `citationRel()` to outbound URLs. FAQ JSON-LD strips markdown (`learnFaqsToJsonLd`).

Do not follow-link telehealth competitors. Citation policy: `src/lib/outbound-links.ts`.

## Sitemap and llms.txt

`getLearnSitemapEntries()` feeds `public/sitemap.xml` (exact loc order). `public/llms.txt` must list **every** published learn article URL. Inventory counts are locked in `src/lib/__tests__/learn-registry.test.ts`.

## Tests that catch regressions

| File | What it locks |
|------|----------------|
| `learn-registry.test.ts` | counts, clusters, no em dashes, no TRT/HRT product |
| `learn-content-quality.test.ts` | title/description length, unique SERP fields, compounded FAQ clause, YES funnel, 50-state + USA-only, pricing whitelist, citation hosts |
| `learn-pricing-copy.test.ts` / `learn-trust-copy.test.ts` | shared copy helpers |
| `llms-txt.test.ts` | every published URL + pricing bound to the module |
| `sitemap.test.ts` | loc order vs `EXPECTED_PATHS` |
| `money-page-guides.test.ts` | paid-keyword coverage |
| `outbound-links.test.ts` | competitor denylist |

After adding an article: land the file, add it to a hub cluster, put campaign siblings in the first 6 `relatedSlugs`, wire money-page guides if it answers an ad keyword, add the loc to `sitemap.xml` in generator order, add the URL to `llms.txt`, bump the inventory counts, then run `npm test`.
