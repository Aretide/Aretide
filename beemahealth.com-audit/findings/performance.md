# Performance / Core Web Vitals Audit - beemahealth.com

**Method:** Lab-only (no Google API credentials configured, so PSI/CrUX field data was unavailable). Ran Lighthouse 13.4.1 via `npx lighthouse` against a locally-launched headless Chrome, mobile form factor, on 5 live pages. Ran each page twice: once with `--throttling-method=simulate` (Lantern network simulation) and once with `--throttling-method=devtools` (real CPU/network throttling applied via CDP). **The two methods disagreed sharply on LCP** (simulate reported 9.6-10.9s LCP on 4/5 pages; devtools reported 2.1-2.5s LCP on all 5 pages). This is flagged as a specific finding below because it matters for how this report should be read. All figures below are from the **devtools-throttled** runs unless noted, since the trace-observed LCP-breakdown subparts (TTFB + element render delay) agree with the devtools numbers and contradict the simulate numbers - the simulate run's Lantern network graph is being thrown off by early third-party fetches (`google.com/ccm/collect`, Meta CAPI pixel) it treats as blocking dependencies of the main JS bundle, which is a known Lantern modeling artifact, not a real user-facing 10-second LCP.

Raw Lighthouse JSON for all 10 runs retained at `/private/tmp/claude-501/-Users-mattaertker-Documents-Github-BeemaHealth/644b8272-4d84-4896-a01a-0d03fec1e108/scratchpad/lighthouse/` for this session (not part of the repo).

## Score summary (devtools throttling, mobile)

| Page | Perf score | LCP | FCP | Speed Index | TTI | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Homepage `/` | 86 | 2.5s | 2.5s | 6.0s | 11.5s | 170ms | 0 |
| `/semaglutide/` | 89 | 2.5s | 2.5s | 5.5s | 11.1s | 120ms | 0.001 |
| `/glp-1-houston/` | 90 | 2.4s | 2.4s | 5.2s | 10.4s | 120ms | 0 |
| `/learn/weight-loss/glp-1-side-effects/` | 90 | 2.5s | 2.5s | 5.1s | 10.3s | 120ms | 0 |
| `/recipes/` | 91 | 2.1s | 2.1s | 5.7s | 11.2s | 110ms | 0 |

**CWV pass/fail against 2026 thresholds (lab estimate, all pages):**
- **LCP: borderline-PASS.** All 5 pages land at 2.1-2.5s, right at the "Good" ceiling (≤2.5s). This is a lab single-run estimate at the 50th percentile equivalent, not a 75th-percentile field measurement - real-world p75 (slower devices, worse networks, cache-cold visits) is likely to push some visits into "Needs Improvement" (2.5-4.0s). Treat as "passing today, no margin."
- **INP: cannot be measured.** Lighthouse has no synthetic interaction to sample in a lab run; it reports Total Blocking Time (110-170ms) and Max Potential FID (100-120ms) as proxies. Both proxies suggest low interaction latency risk. This is **not** a substitute for real INP - flagging as not checked/not measurable rather than asserting a pass.
- **CLS: PASS.** 0-0.001 across all 5 pages. No action needed.

## Findings

### 1. [Medium] LCP element render delay (~2.0-2.4s) dominates LCP on every page, driven by render-blocking CSS + heavy parallel JS preloading, not by the hero image
LCP-breakdown-insight (trace-observed, devtools run) shows TTFB is fast everywhere (96-416ms) but "element render delay" eats nearly all remaining LCP budget: home 2416ms, semaglutide 2338ms, houston 2286ms, learn 2037ms, recipes 1922ms. The LCP element on the homepage is **not** the hero image - it's a text paragraph (`p.mt-5` in the hero section, "USA physicians, licensed and certified USA 503A pharmacies..."). Text-as-LCP is normally fast to paint, so a 2+ second render delay for plain text indicates the main thread/render path is busy, not that a resource is slow to fetch.

Contributing factors identified:
- One render-blocking stylesheet (`/assets/styles-CyFOEV89.css`, 26.5KB) - Lighthouse estimates ~200-305ms FCP/LCP savings from deferring or inlining critical CSS.
- The homepage document ships **27 `<link rel="modulepreload">` hints** (index, MarketingLayout, HowItWorksSteps, LegitScriptSeal, RecipeBlocks, several icon chunks, etc.) all firing as high-priority fetches immediately after the initial HTML parse, contending with the CSS and web fonts for bandwidth/priority before first paint.
- Total script transfer is ~1.15-1.18MB across all 5 pages (see Finding 4) - even though content is present in raw static HTML (`is_spa: false` confirmed per base context), the browser still fetches and begins executing the full TanStack Start JS shell before the page is interactive, and that JS activity appears to delay the paint pipeline.

**Recommendation:** Inline or defer non-critical CSS so the hero/above-fold text can paint before the full stylesheet loads; audit whether all 27 modulepreloaded chunks need to be eagerly preloaded on every route (route-level code splitting is good, but preloading chunks for below-fold interactive widgets like `RecipeBlocks` on the homepage delays paint-critical work). Re-measure LCP-breakdown after changes to confirm element render delay drops below ~1s.

### 2. [Medium] Hydration/main-thread cost is large relative to paint time - TTI is 4-5x LCP on every page
Time-to-Interactive lands at 10.3-11.5s on all 5 pages even though LCP/FCP land at ~2.1-2.5s - a roughly 8-9 second gap where the page is visually complete but the main thread is still busy. Lighthouse `diagnostics` on the homepage shows 7,154 main-thread tasks totaling 5.68s of task time, with 26 tasks over 10ms and 8 tasks over 50ms. Total Blocking Time stays low (110-170ms) because TBT only counts task time within the classic long-task window before TTI settles, but the underlying JS execution volume (hydration of the React tree plus GTM `gtag.js` x2, Meta `fbevents.js`, and the LegitScript seal script all executing in this window - see Finding 4) is real and would show up as sluggishness on low-end devices, which is exactly where INP tends to fail. This confirms hydration is not free even though the raw HTML already contains full content: the SPA shell still re-executes substantial JS on top of the static markup.

**Recommendation:** Profile the hydration path specifically (React DevTools Profiler or a Performance panel trace) to identify what's running in that 8-9s tail - candidates are the 27 route chunks being parsed/executed eagerly, and third-party scripts initializing synchronously. Consider deferring non-essential third-party script execution (Meta Pixel, GTM secondary container) until after `requestIdleCallback` or first interaction, and confirm route code-splitting isn't over-eagerly loading components not needed for the current view.

### 3. [Low] One oversized/non-responsive image: `compounded-semaglutide-vial-*.webp`
This image is already WebP (good) but is served at its full 1024x606 source resolution to a 372x372 display slot on the homepage, costing an estimated 62.9KB of the image's 81KB transfer size unnecessarily (Lighthouse `image-delivery-insight`). It is correctly `loading="lazy"` and below the fold, so it does not affect LCP, but it adds unnecessary weight to a page that's already borderline on total byte weight. The companion `compounded-tirzepatide-vial-*.webp` shows the same pattern. The preloaded hero image (`/assets/hero-BNY-NrJE.jpg`, 53KB) is correctly preloaded with `fetchPriority="high"` but is JPEG rather than WebP/AVIF - since it's not the LCP element and is already small, this is a minor byte-savings opportunity only, not a CWV blocker.

**Recommendation:** Generate and serve a properly-sized (e.g. 372x372 or 2x for retina, ~744x744) responsive variant of the vial images via `srcset`/`sizes` or a build-time resize step. Optionally convert the hero JPEG to WebP/AVIF for consistency with the rest of the image pipeline, though this is a "nice to have," not a priority.

### 4. [Medium] JS bundle weight is heavy for a statically-prerendered site (~1.15-1.18MB script transfer on every page, ~330-350KB estimated unused)
Every page tested ships roughly the same script payload regardless of page-specific content: 32-37 script requests totaling 1,153-1,179 KB. Lighthouse's `unused-javascript` audit estimates 328-348 KB of that is unused on first load per page (bytes that could be deferred/code-split further). `bootup-time` attributes meaningful scripting cost to:
- `MarketingLayout-*.js` and `index-*.js` (the app shell / route bundle) - 85-150ms scripting time each
- `googletagmanager.com/gtag/js` loaded **twice** on every page (once for `AW-18301765593` Google Ads, once for `G-03PMCCSD3R` GA4) - ~85-95ms scripting time each, consistent with `docs/features/analytics.md`'s note that `ad-conversions.ts` is supposed to share one `gtag.js` request across destinations. Two separate `gtag/js?id=...` script tags were observed loading (one per ID) rather than a single shared load, which is worth a source check against `src/lib/ad-conversions.ts` to confirm this matches the intended "avoid a duplicate script injection" design.
- `connect.facebook.net/en_US/fbevents.js` (Meta Pixel) - ~64-92ms scripting time on learn/recipes pages.

None of this is unexpected per `docs/features/analytics.md` (GA4 + GTM + Meta Pixel + Google Ads are all documented as intentionally loaded), and nothing was found blocking render that isn't accounted for in that doc. But the combined weight is a real contributor to the hydration/TTI gap in Finding 2.

**Recommendation:** Confirm in `src/lib/ad-conversions.ts` whether the two `gtag/js?id=...` requests are intentional (one shared loader per the doc, vs. two separate loads observed in the network trace) and consolidate if not. Beyond that, target the 330-350KB of unused JS per page via more aggressive route-level code splitting or dynamic `import()` for below-fold interactive components (pricing tables, recipe blocks, icon sets) so first-load JS more closely matches what's needed for the current route.

### 5. [Info] CLS is a non-issue
0-0.001 across every page tested, driven by the fact that this is prerendered static HTML with explicit image `width`/`height` attributes (confirmed on the vial images: `width="1024" height="1024"`) and no late-injected layout shifts observed. No action needed.

### 6. [Info] INP not measurable in this lab-only audit
No CrUX field data was available (no Google API credentials configured), and Lighthouse cannot synthesize real user interactions to produce an INP figure. Total Blocking Time (110-170ms) and Max Potential FID (100-120ms) are the closest lab proxies and both suggest low risk, but this should be verified with real CrUX field data (via PSI/CrUX API or Search Console's Core Web Vitals report) once credentials are available, especially given the hydration cost noted in Finding 2 - heavy post-paint JS execution is a classic cause of poor real-world INP even when lab TBT looks fine.

### 7. [Info] Lantern-simulated Lighthouse runs produced a false-positive-critical LCP reading (9.6-10.9s) that does not reflect the devtools-throttled or trace-observed data
Documenting this so it isn't mistaken for a hidden critical issue by anyone re-running Lighthouse with default settings (Lighthouse CLI defaults to `--throttling-method=simulate`). The simulate run's `largest-contentful-paint` audit scored 0 (10.4s) on the homepage, while the same run's own `lcp-breakdown-insight` (which uses observed trace data, not the Lantern simulation) showed only 238ms TTFB + 1,127ms element render delay = ~1.4s total - a direct internal contradiction within the same report. The devtools-throttled re-run corroborated the insight-level number (2.5s LCP, 2.4s element render delay). Root cause appears to be Lantern's network dependency graph mis-modeling early third-party beacon requests (`google.com/ccm/collect`, Meta CAPI) as blocking children of the main JS bundle request, inflating the simulated critical path. **Do not trust simulate-mode LCP scores from ad hoc Lighthouse runs on this site without cross-checking against `lcp-breakdown-insight` or a devtools-throttled run.**

## Third-party script check against `docs/features/analytics.md`

Confirmed present and none blocking render beyond the modest, expected scripting cost noted in Finding 4: GA4 (`gtag.js?id=G-03PMCCSD3R`), Google Ads (`gtag.js?id=AW-18301765593`), Meta Pixel (`connect.facebook.net/en_US/fbevents.js`), and the LegitScript seal script/image. No unexpected third-party origins were observed in the network traces across the 5 pages tested. `third-parties-insight` scored 1 (pass) on every devtools-throttled run - Lighthouse did not flag third-party impact as a bottleneck despite the individual script costs itemized above; the aggregate effect is within Lighthouse's own tolerance, it's just additive to the hydration-tail issue in Finding 2.

## Font loading

`font-display-insight` scored 1 (pass, no FOIT/FOUT issue detected) on every page. Fonts (Figtree, Outfit - 5-8 woff2 files, 62-86KB total depending on page) load via the render-blocking stylesheet chain (Finding 1) but are not independently causing a swap-related layout or paint problem per Lighthouse's insight audit.

## Not checked

- Real CrUX field data (p75 LCP/INP/CLS) - no Google API credentials configured, explicitly out of scope per base context.
- Real INP measurement - not producible from a lab tool; noted as Finding 6.
- Desktop performance - mobile-only was run given mobile is the stricter/default CWV evaluation surface; desktop was not profiled in this pass.
- Cross-page comparison beyond the 5 named pages (homepage, `/semaglutide/`, `/glp-1-houston/`, `/learn/weight-loss/glp-1-side-effects/`, `/recipes/`) - other learn/recipe/treatment pages were not sampled.
