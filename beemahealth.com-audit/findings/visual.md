# Visual / Mobile SEO Audit - beemahealth.com

Method: Playwright (Chromium) screenshots at desktop (1920x1080) and mobile
(375x812, DPR 2) for homepage, /semaglutide/, /glp-1-houston/, /faq/, and
/learn/weight-loss/best-glp-1-for-weight-loss/. Mobile viewport-only captures
(not full-page) were used to evaluate above-the-fold content exactly as a
user would see it with zero scroll. Tap-target and font-size measurements
taken via `getBoundingClientRect()` / `getComputedStyle()` in the same
viewport. Contrast ratios computed directly from the oklch values in
`src/styles.css` (WCAG 2.x relative-luminance formula).

Screenshots: `beemahealth.com-audit/screenshots/{page}-{desktop,mobile}.png`
and `{page}-{desktop,mobile}-full.png` (full-page variants) for homepage,
semaglutide, glp1-houston, faq, learn-article.

---

## Findings

### 1. [High] Primary CTA is cut off below the fold on /glp-1-houston/ mobile
On the Houston geo-landing page at 375x812 (iPhone-class viewport), the
"Get Started" button renders at `top: 776px` with `height: 56px`
(bottom edge = 832px), 20px past the 812px viewport - it is not fully
visible without scrolling. Confirmed both in the mobile screenshot
(`glp1-houston-mobile.png`, button visibly clipped at the bottom edge) and
via direct DOM measurement.

Root cause: this page centers a large LegitScript seal (measured 92x100 box
with generous margins, occupying roughly 165-265px of vertical space) above
the H1, in addition to a breadcrumb, an eyebrow pill, a two-line H1, and a
6-line body paragraph - all before the CTA. By contrast, the homepage places
the same seal beside the H1 (not stacked above it) and gets "Get Started"
visible at `top: 615px`, comfortably inside the fold, alongside a second
button and the start of a sticky bottom promo bar.

Recommendation: On /glp-1-houston/ (and any other geo/landing pages using
this centered-seal hero pattern), either (a) move the LegitScript seal
inline/beside the headline as the homepage already does, (b) shrink or
relocate the seal to a trust bar below the CTA, or (c) trim the mobile
hero paragraph and rely on the existing sticky bottom CTA bar pattern so a
CTA is guaranteed visible pre-scroll. This is a direct conversion-path
issue given marketing CTAs are the only route into the Bask intake funnel.

### 2. [Medium] Breadcrumb "Home" link tap target fails WCAG 2.2 minimum
On /glp-1-houston/ mobile, the "Home" breadcrumb link measures 38x20 CSS px
- below the WCAG 2.2 SC 2.5.8 (Target Size Minimum, Level AA) floor of
24x24 CSS px, and well below the 44x44 used elsewhere on the same page
(hamburger, phone icon). The breadcrumb component appears to be shared
across treatment/geo pages, FAQ, and learn articles (all captured pages show
a breadcrumb in the same style), so this is likely a sitewide pattern, not
isolated to Houston.

Recommendation: Increase the breadcrumb link's clickable area (padding, not
just visual size) to at least 24x24px, ideally 44x44px to match the header
icon buttons.

### 3. [Medium] Two semantic color tokens fail WCAG AA 4.5:1 for normal text
Computed from `src/styles.css` oklch values (WCAG relative-luminance
formula):

| Pairing | Contrast | WCAG AA normal text (4.5:1) |
|---|---|---|
| `text-destructive` on `background` | 4.19:1 | Fail |
| `--destructive-foreground` on solid `--destructive` fill | 4.11:1 | Fail |
| `text-success` on `background` | 3.68:1 | Fail |
| `--success-foreground` on solid `--success` fill | 3.66:1 | Fail |
| `--trust-foreground` on solid `--trust` fill | 4.63:1 | Pass (barely) |

All four failing pairs pass the AA large-text/UI-component threshold
(3:1) but not the 4.5:1 required for normal-size body/label text. Per
`design-tokens.ts`, most actual site surfaces use low-opacity tinted
backgrounds (e.g. `bg-destructive/8 text-destructive`, `bg-success/12
text-success`) rather than the solid foreground-on-solid-fill pairing, so
real-world impact depends on where `Button`/`Badge` variants use the solid
fill combination - not verified in this pass since it requires a full
component inventory, not just the five audited marketing pages, where these
tokens were not visibly in use as small text.

Recommendation: Audit shadcn `Button`/`Badge`/`Alert` variants for any
solid-fill destructive/success usage on normal-size text (error messages,
confirmation toasts, form validation) and either darken
`--success`/`--destructive` slightly or lighten their `-foreground` pairs to
clear 4.5:1. Flag for whoever owns `src/lib/design-tokens.ts` - not an
auto-fix, since colors are brand-defined.

### 4. [Medium] Outline/secondary button borders may fail WCAG 1.4.11 (non-text contrast)
`--border` (oklch 0.915 0.005 260) against `--background` (oklch 0.993
0.002 95) computes to 1.26:1. This token draws the outline on secondary
buttons visible in the mobile screenshots (e.g. "How it works",
"Tirzepatide pricing" pills on `/semaglutide/`, sitting on the cream hero
gradient). WCAG 1.4.11 requires 3:1 for UI component boundaries that are the
only indicator of an interactive control's extent. These buttons do appear
to carry `shadow-soft`/`shadow-lift` per `styles.css`, which may provide
sufficient non-color visual separation - not conclusively determined from
static screenshots alone.

Recommendation: Verify in-browser (not just static screenshot) whether the
shadow alone is sufficient to delineate the button boundary at low contrast
displays/brightness; if not, increase `--border` contrast for interactive
elements specifically (a separate token from the decorative-border use
case) rather than changing the global `--border` value.

### 5. [Low] Header icon buttons meet WCAG AAA but not Material's 48dp guidance
Hamburger menu and phone-call icon buttons both measure 44x44 CSS px on
mobile across all pages tested. This meets WCAG 2.1 SC 2.5.5 (AAA, 44x44)
and Apple HIG's 44pt minimum, but is under Google's Material Design 48dp
recommendation. Not a compliance gap, informational only.

### 6. [Low] No above-the-fold CTA on /faq/ and the learn article
Both `/faq/` and `/learn/weight-loss/best-glp-1-for-weight-loss/` show only
a page title/dek (and, on the learn article, an "Educational, not medical
advice" disclaimer box) within the mobile fold - no CTA is visible without
scrolling. This is a reasonable, expected pattern for content-first pages
(pushing a hard sell above an FAQ or educational article would hurt trust
and E-E-A-T), so this is not flagged as a defect. Given these are
top-of-funnel SEO pages, consider whether the sticky bottom promo bar
already built for the homepage (visible in `homepage-mobile.png`, "SEMAGLUTIDE
FROM $99/MO...") is also present further down these pages - not confirmed
in this pass since it requires scroll-triggered capture, which was out of
scope for the above-the-fold check. Flagged as an opportunity, not a defect.

### 7. [Info - positive] Layout-shift risk is low across all five pages
- LegitScript seal ships with `width="92" height="100"` explicitly set and
  is `<link rel="preload" as="image">`'d on both homepage and
  `/glp-1-houston/`, confirmed via `curl`. Reserves layout space, no CLS
  risk from this element.
- Hero image (`hero-BNY-NrJE.jpg`) has explicit `width`/`height` and
  `fetchPriority="high"`, appropriate LCP-image handling.
- Fonts (Outfit, Figtree) are self-hosted via `@fontsource` and bundled into
  the same-origin stylesheet per the comment at the top of `styles.css`,
  eliminating the cross-origin Google Fonts CSS -> font-file chain that a
  prior optimization round already fixed. No FOUT/FOIT swap risk from a
  third-party font host.
- No horizontal scroll detected on any of the five pages at 375px width
  (`scrollWidth === clientWidth === 375` on homepage, /glp-1-houston/, and
  the learn article; visually confirmed clean on /semaglutide/ and /faq/
  screenshots).

### 8. [Info - positive] Mobile body text sizing is accessible
Measured computed styles: H1 30-32px / line-height 35-36px; body paragraph
16-18px / line-height 26-29px across homepage, /glp-1-houston/, and the
learn article. This clears the commonly-cited 16px mobile-readability floor
without requiring user zoom.

### 9. [Info - positive] Core text/background contrast is strong
- Primary button text on primary fill: 8.94:1
- Foreground on background (body copy): 17.75:1
- Muted-foreground on background: 6.99:1
- Muted-foreground on primary-soft (hero subhead on the cream gradient
  band, the most-used "text on tinted surface" pairing on the audited
  pages): 6.36:1
- Accent-foreground on accent (eyebrow pills, e.g. "GLP-1 WEIGHT-LOSS
  CARE"): 6.90:1
- Warning-foreground on warning: 7.19:1
- Ink-foreground on ink (footer/dark bands): 17.70:1

All comfortably clear WCAG AA (4.5:1) and most clear AAA (7:1) for normal
text. The hero, body copy, and eyebrow-pill treatments used on every
audited page are not a contrast concern.

### 10. Not checked
- Tablet (768x1024) viewport was not captured (task specified desktop +
  mobile only).
- Scroll-triggered/sticky elements below the first viewport (e.g. whether a
  sticky CTA bar appears on /faq/ or the learn article after scrolling).
- Full component-level audit of every shadcn Button/Badge/Alert variant for
  the token pairs flagged in Finding 3 - flagged for follow-up, not
  exhaustively verified against rendered DOM.
- Desktop above-the-fold CTA visibility was not separately measured (visual
  inspection of desktop screenshots shows CTA comfortably visible on all
  five pages at 1920x1080; no desktop-specific issues observed).

