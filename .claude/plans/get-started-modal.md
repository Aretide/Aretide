# Get Started modal (homepage)

## Summary

Replace the homepage hero's "Get Started" `<Link>` (straight to Bask weight-loss intake) with a button that opens a full-screen-on-mobile / centered-on-desktop modal: step 1 picks a category (Weight Loss / Sexual Health / Hair), step 2 picks a product within that category, and picking a product routes straight to that product's existing Bask questionnaire via `resolveCta()` - no intermediate page. ED Mints reuses the existing `EdMintsPickerModal` in place of step 2's terminal action (extracted to a shared file so both `/ed-mints` and this new component can render it). Built as a reusable component (`GetStartedModal`), wired into `HomeHero.tsx` only for now.

Riskiest assumption: extracting `EdMintsPickerModal` out of `ed-mints.tsx` into a shared module doesn't change its behavior or props on `/ed-mints` itself - this needs a careful, mechanical extraction (same JSX, same exports), not a rewrite.

## Decisions you'll probably want to tweak

1. **Data source for step 1/2**: a new `GET_STARTED_CATEGORIES` config (not reusing `WEIGHT_LOSS_ITEMS`/`SEXUAL_HEALTH_SECTIONS`/`HAIR_SECTIONS` from `SiteHeader.tsx` directly), because this modal needs each product's `CtaId` (for `resolveCta()`) and nav items don't carry one. Shape:
   ```ts
   type GetStartedProduct = { label: string; ctaId: CtaId } | { label: string; kind: "ed-mints" };
   type GetStartedCategory = { id: string; label: string; products: GetStartedProduct[] };
   ```
   *Alternative*: add an optional `ctaId` field directly onto `NavItem` in `SiteHeader.tsx` and derive this modal's data from the existing nav consts, eliminating a second list to keep in sync with nav changes. *Cost of changing later*: low either way (one file, small config) - defaulting to the **separate config** because Sexual Health's "ED Mints" entry needs a `kind: "ed-mints"` branch that has no equivalent in `NavItem`, and bolting that onto the shared nav type would leak modal-specific concerts into `SiteHeader.tsx`.

2. **Hair category behavior**: generic rule - if a category has exactly 1 product, selecting that category skips step 2 and calls `resolveCta()` immediately (no hardcoded "hair is special" branch). This means Hair auto-advances today, and automatically starts showing step 2 the day a second hair product is added to `GET_STARTED_CATEGORIES` - no code change needed then, just a data change. Code comment on the Hair entry notes this explicitly per your request. *Alternative*: hardcode "always skip step 2 for Hair." *Cost of changing later*: the generic rule is strictly better here (self-updating), so no real alternative worth taking.

3. **Component boundary for ED Mints reuse**: extract `MintOption` type, `MINT_OPTIONS`, `EdMintsDialogContent`, and `EdMintsPickerModal` from `ed-mints.tsx` into `src/components/site/EdMintsPicker.tsx` (or fold into `TreatmentPageBlocks.tsx` - leaning toward a dedicated file since this component is asset-heavy with its own photos/copy, not a generic building block). `ed-mints.tsx` imports it back; `GetStartedModal` imports the same module. *Cost of changing later*: trivial - it's a pure move, TypeScript will catch any broken import immediately.

4. **Modal shell reuse**: extract `EdMintsDialogContent` (the full-screen-mobile/centered-desktop `DialogPrimitive.Content` variant) as the shared shell for step 1/2 of `GetStartedModal` too, rather than writing a second full-screen-mobile dialog variant. Matches your answer #3 (full screen mobile only, ed-mints-style modal on desktop) exactly, and keeps one full-screen-dialog pattern in the codebase instead of two near-duplicates.

5. **CTA ids**: reuse each product's existing `CtaId` (`tirzepatide_hero`, `semaglutide_hero`, `tadalafil_hero`, `sildenafil_hero`, `oral_finasteride_hero`, and ED Mints' own `ed_mints_rdt_hero`/`ed_mints_odt_hero` via the reused picker) - confirmed, you don't need new modal-scoped ids. UTM/handoff params are attached automatically by `resolveCta()` regardless of which `CtaId` is passed, so attribution granularity is the only thing being traded away here, and you said you don't care about that.

## Known unknowns & defaults

- **Step 1 category icons/art**: no existing icon set for "Weight Loss / Sexual Health / Hair" as a trio outside the nav dropdowns (which are text-only). Default: reuse `lucide-react` icons already used elsewhere for these concepts if any exist, otherwise simple text-forward cards matching the site's `SurfaceCard` styling - no new icon commissioning. Flag if you want custom art; cheap to swap later since it's presentational only.
- **Copy for step 1/2 headings**: defaulting to plain, direct copy ("What are you looking for?" / "Choose your treatment") - happy to adjust wording, low cost to change.
- **Homepage hero CTA label**: currently "Get Started with Weight Loss" (a `CTA_OVERRIDES.home_hero` override) - since the button no longer commits to weight-loss-only, default to reverting the label to plain "Get Started" (`DEFAULT_CTA_TARGET`'s label) since the modal now handles category choice. Flag if you want to keep "with Weight Loss" as a bias toward your flagship line even though the button opens the full picker.
- **Analytics on step selections**: no new GTM event for "category selected" / "product selected" mid-flow - matches the existing `EdMintsPickerModal` pattern, which only fires `trackIntakeHandoff` on the final Bask-bound click. Default: no new tracking beyond what `resolveCta()`'s `onClick` already does. Flag if you want funnel-drop-off visibility into which step people abandon at.

## Compliance & validation

- No PHI collected anywhere in this modal - category/product selection only, no health data, no free text. No new validators needed.
- Every terminal button in the modal must call `resolveCta()` - never a hardcoded Bask URL - so UTM passthrough (`getBaskHandoffParams()`) and the existing `isBaskIntakeUrl()`/`trackIntakeHandoff()` tracking keep working. This is the one hard rule for this feature per your priority on UTM correctness.
- New Vitest coverage: `GetStartedModal` renders step 1 → step 2 → resolves to the right product's Bask URL with `cta_id` + any UTMs present in `sessionStorage`/URL at test time (same assertion style as the existing `utm-attribution.test.ts` / `cta-bask-handoff.test.ts`), plus the Hair single-product auto-advance path, plus the ED Mints hand-off into the reused picker.

## Mechanical work (compressed)

- `src/components/site/EdMintsPicker.tsx` (new): extracted `MintOption`, `MINT_OPTIONS`, `EdMintsDialogContent`, `EdMintsPickerModal`. Update `ed-mints.tsx` imports; no behavior change on that route.
- `src/components/site/GetStartedModal.tsx` (new): `GET_STARTED_CATEGORIES` config, step-1 category grid, step-2 product grid (or auto-advance), renders `EdMintsPickerModal` for the ED Mints branch, uses `EdMintsDialogContent`-equivalent shell for its own steps.
- `src/components/home/HomeHero.tsx`: swap the hero `Get Started` `<Link>` for a `<Button>` that opens `GetStartedModal`; keep `MagneticButton` wrapper.
- `src/lib/cta-ids.ts`: revisit `home_hero`'s `CTA_OVERRIDES` label per the default above (plain "Get Started"); no new `CtaId`s needed.
- Tests per "Compliance & validation" above; run full `npm test` + `npx tsc --noEmit` + ESLint on changed files.
- No route, sitemap, robots.txt, or JSON-LD changes - this is a homepage-only interaction change.

## Out of scope

- Any other "Get Started" CTA sitewide (footer, treatment-page heroes, etc.) - homepage hero only, per your answer #5. `GetStartedModal` is built reusable so a future task can wire it elsewhere, but no other call site changes in this pass.
- Wellness/TRT/NAD+/sermorelin do not appear anywhere in this modal (matches "no coming-soon placeholders" rule) - already fully hidden from nav/footer/sitemap/robots.txt/llms.txt, verified during discovery, no changes needed here.
- New modal-scoped `CtaId`s / attribution granularity - explicitly waived by you.
- New GTM events for mid-flow step tracking - defaulted off above, flag if wanted.
- Female / "For Women" sections in Sexual Health or Hair - no live products, not in scope until one ships.

## Review request

1. OK with the separate `GET_STARTED_CATEGORIES` config (decision 1) rather than extending `SiteHeader.tsx`'s nav consts?
2. OK reverting `home_hero`'s CTA label to plain "Get Started" now that it opens a category picker, or keep "with Weight Loss"?
3. Any preference on step 1/2 copy or icons, or fine with plain/direct defaults for now?
4. OK with no new GTM event for mid-flow step selection (category/product chosen), matching the existing ED Mints picker's tracking scope?
