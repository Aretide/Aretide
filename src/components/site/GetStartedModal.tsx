import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  HeartPulse,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FullScreenMobileDialogContent } from "@/components/site/FullScreenMobileDialog";
import { EdMintsPickerModal } from "@/components/site/EdMintsPicker";
import { CTA_IDS, resolveCta, type CtaId } from "@/lib/cta-ids";
import { cn } from "@/lib/utils";

/**
 * Reusable "Get Started" category -> product picker (2026-09-04). Wired
 * into the homepage hero today only - see docs/features/homepage.md - but
 * built generically so another CTA can open the same component later.
 *
 * Step 1 asks which of the site's 3 live nav categories (Weight Loss /
 * Sexual Health / Hair - matches SiteHeader.tsx's dropdowns, no Wellness,
 * see docs/features/treatment-pages.md) the visitor wants. Step 2 asks
 * which product within that category, then routes straight to that
 * product's existing Bask questionnaire via resolveCta() - no intermediate
 * page. A category resolves straight from step 1, skipping step 2, when
 * either: it has exactly one live product (Hair's Male branch, today), or
 * every product it lists shares one questionnaire already (Weight Loss,
 * today, via `directCtaId` - see `autoAdvanceCtaId` below). Both are
 * per-category, not hardcoded, so each stops applying the moment that
 * category's products actually diverge.
 *
 * Hair additionally gates on sex first (`sexGate`, 2026-09-04): Male goes
 * straight to Oral Finasteride (the only live product), Female is a
 * deliberate dead end today since there's no live women's hair product yet
 * - Beema expects to launch one soon, so this asks now rather than silently
 * assuming every visitor is male. This is intentionally NOT the sitewide
 * "no coming-soon placeholders" pattern (docs/features/treatment-pages.md) -
 * that rule is about the persistent header nav; this is a funnel question
 * with an honest "not yet, but soon" answer, not a fake nav entry.
 *
 * Sexual Health's "ED Mints" entry isn't a single Bask URL - it's 2
 * formulations picked on /ed-mints today via `EdMintsPickerModal`. Rather
 * than re-implement that choice, selecting "ED Mints" here closes this
 * modal's step-2 view and opens the exact same `EdMintsPickerModal`
 * component (imported from EdMintsPicker.tsx, not duplicated), with its own
 * "Back" wired to return here to Sexual Health's product step rather than
 * just closing (see `EdMintsPickerModal`'s `onBack` prop and
 * `backFromEdMints` below).
 */

export type GetStartedProduct =
  | { kind: "cta"; label: string; ctaId: CtaId }
  | { kind: "ed-mints"; label: string };

export type GetStartedCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  products: GetStartedProduct[];
  /**
   * When set, selecting this category resolves straight to this CtaId's
   * Bask questionnaire instead of advancing to step 2 - use when every
   * product listed under `products` already lands on the same
   * questionnaire, so making the visitor pick one first is pointless
   * friction. `products` stays populated either way (documents what's in
   * the category, and step 2 is ready to show the moment this is removed).
   * Ignored when `sexGate` is set (sexGate takes precedence).
   */
  directCtaId?: CtaId;
  /**
   * When set, selecting this category shows a Male/Female step before
   * resolving anything, instead of `directCtaId` or the single-product
   * shortcut. `male` is the CtaId to resolve straight to (today's Hair
   * pattern: exactly one live product, so Male itself is a direct link, the
   * same way a 1-product category would normally auto-advance). Female has
   * no CtaId - there's no live women's product yet, so selecting it shows a
   * short "not yet, but soon" message instead of navigating anywhere. Add
   * this the day a category's men-only products stay men-only with a
   * women's line genuinely coming; remove it (or add a `female` CtaId) once
   * that product actually ships.
   */
  sexGate?: { male: CtaId };
};

export const GET_STARTED_CATEGORIES: GetStartedCategory[] = [
  {
    id: "weight-loss",
    label: "Weight Loss",
    icon: Scale,
    // Tirzepatide and semaglutide both resolve to the same Bask weight-loss
    // questionnaire today (2026-09-04, see the money-page architecture note
    // in docs/features/treatment-pages.md - neither has its own
    // CTA_OVERRIDES entry, so both fall through to DEFAULT_CTA_TARGET).
    // Asking which one first is pointless friction, so this skips step 2
    // via weight_loss_hero - a category-level CtaId already defined in
    // cta-ids.ts for exactly this, kept separate from either product's own
    // id so attribution doesn't misreport "tirzepatide" for a visitor who
    // never actually chose it. If tirzepatide/semaglutide ever get distinct
    // questionnaires, delete directCtaId below and step 2 starts showing
    // automatically.
    directCtaId: CTA_IDS.weight_loss_hero,
    products: [
      {
        kind: "cta",
        label: "Compounded Tirzepatide",
        ctaId: CTA_IDS.tirzepatide_hero,
      },
      {
        kind: "cta",
        label: "Compounded Semaglutide",
        ctaId: CTA_IDS.semaglutide_hero,
      },
    ],
  },
  {
    id: "sexual-health",
    label: "Sexual Health",
    icon: HeartPulse,
    products: [
      { kind: "cta", label: "Tadalafil", ctaId: CTA_IDS.tadalafil_hero },
      { kind: "cta", label: "Sildenafil", ctaId: CTA_IDS.sildenafil_hero },
      { kind: "ed-mints", label: "ED Mints" },
    ],
  },
  {
    id: "hair",
    label: "Hair Loss",
    icon: Sparkles,
    // Only Oral Finasteride is live, men only (2026-09-03, see
    // docs/features/treatment-pages.md). A women's hair line is expected to
    // launch soon, so this asks Male/Female up front (`sexGate` below)
    // rather than silently routing everyone to the men's product. Male
    // still auto-resolves straight to Oral Finasteride (only one live
    // product); add the next hair product to `products` when it launches -
    // once a men's product step actually shows multiple choices, `sexGate`
    // needs a matching update (today it only carries a single `male`
    // CtaId). Add `female: CtaId` to sexGate the day a women's product
    // ships, and the Female branch resolves instead of showing the
    // not-yet message.
    sexGate: { male: CTA_IDS.oral_finasteride_hero },
    products: [
      {
        kind: "cta",
        label: "Oral Finasteride",
        ctaId: CTA_IDS.oral_finasteride_hero,
      },
    ],
  },
];

/**
 * The CtaId to resolve straight to when a category is selected, skipping
 * step 2 - either because `directCtaId` says every product already shares
 * one questionnaire, or because there's only one live product to begin
 * with. `sexGate` always takes precedence (it needs its own Male/Female
 * step, never a direct resolve). Returns null when step 2 - or the sex gate
 * - should show instead.
 */
export function autoAdvanceCtaId(category: GetStartedCategory): CtaId | null {
  if (category.sexGate) return null;
  if (category.directCtaId) return category.directCtaId;
  if (category.products.length === 1) {
    const only = category.products[0];
    if (only.kind === "cta") return only.ctaId;
  }
  return null;
}

const cardClassName =
  "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-border p-6 text-center text-sm font-semibold text-foreground outline-none transition-colors hover:border-primary/40 hover:bg-accent focus-visible:border-primary/40 focus-visible:bg-accent";

type Step = "category" | "sex" | "product";

export function GetStartedModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("category");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [femaleSelected, setFemaleSelected] = useState(false);
  const [edMintsOpen, setEdMintsOpen] = useState(false);
  // Set right before re-opening this modal from EdMintsPickerModal's Back
  // button, so the reset-on-open effect below leaves step/categoryId alone
  // instead of snapping back to step 1 - see backFromEdMints.
  const skipResetOnOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (skipResetOnOpenRef.current) {
      skipResetOnOpenRef.current = false;
      return;
    }
    setStep("category");
    setCategoryId(null);
    setFemaleSelected(false);
  }, [open]);

  const activeCategory = GET_STARTED_CATEGORIES.find(
    (c) => c.id === categoryId,
  );

  function selectCategory(category: GetStartedCategory) {
    if (autoAdvanceCtaId(category)) return; // rendered as a direct Link below, not clickable via JS
    setCategoryId(category.id);
    setFemaleSelected(false);
    setStep(category.sexGate ? "sex" : "product");
  }

  function backToCategory() {
    setStep("category");
    setCategoryId(null);
    setFemaleSelected(false);
  }

  function selectEdMints() {
    onOpenChange(false);
    setEdMintsOpen(true);
  }

  function backFromEdMints() {
    setEdMintsOpen(false);
    skipResetOnOpenRef.current = true;
    onOpenChange(true); // step/categoryId are still "product"/"sexual-health"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <FullScreenMobileDialogContent>
          {step === "category" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl sm:text-3xl">
                  What are you looking for?
                </DialogTitle>
                <DialogDescription className="text-center">
                  Choose a category to get started.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-3">
                {GET_STARTED_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const autoCtaId = autoAdvanceCtaId(category);

                  if (autoCtaId) {
                    const cta = resolveCta(autoCtaId);
                    return (
                      <Link
                        key={category.id}
                        to={cta.to}
                        search={cta.search}
                        onClick={cta.onClick}
                        className={cardClassName}
                      >
                        <Icon
                          className="size-8 text-accent-foreground"
                          aria-hidden
                        />
                        {category.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => selectCategory(category)}
                      className={cardClassName}
                    >
                      <Icon
                        className="size-8 text-accent-foreground"
                        aria-hidden
                      />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : step === "sex" && activeCategory?.sexGate ? (
            (() => {
              const maleCta = resolveCta(activeCategory.sexGate.male);
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl sm:text-3xl">
                      Who is this for?
                    </DialogTitle>
                    <DialogDescription className="text-center">
                      {activeCategory.label} care today is available for men.
                    </DialogDescription>
                  </DialogHeader>

                  {femaleSelected ? (
                    <p className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
                      We don&apos;t have a women&apos;s{" "}
                      {activeCategory.label.toLowerCase()} option to select yet,
                      but you&apos;ll be able to soon.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Link
                        to={maleCta.to}
                        search={maleCta.search}
                        onClick={maleCta.onClick}
                        className={cardClassName}
                      >
                        Male
                      </Link>
                      <button
                        type="button"
                        onClick={() => setFemaleSelected(true)}
                        className={cardClassName}
                      >
                        Female
                      </button>
                    </div>
                  )}

                  <DialogFooter className="sm:justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={backToCategory}
                    >
                      <ArrowLeft /> Back
                    </Button>
                  </DialogFooter>
                </>
              );
            })()
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl sm:text-3xl">
                  Choose your treatment
                </DialogTitle>
                <DialogDescription className="text-center">
                  Select a {activeCategory?.label.toLowerCase()} treatment to
                  continue to your questionnaire.
                </DialogDescription>
              </DialogHeader>

              <div
                className={cn(
                  "grid gap-4",
                  (activeCategory?.products.length ?? 0) > 1
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-1",
                )}
              >
                {activeCategory?.products.map((product) => {
                  if (product.kind === "ed-mints") {
                    return (
                      <button
                        key="ed-mints"
                        type="button"
                        onClick={selectEdMints}
                        className={cardClassName}
                      >
                        {product.label}
                      </button>
                    );
                  }

                  const cta = resolveCta(product.ctaId);
                  return (
                    <Link
                      key={product.ctaId}
                      to={cta.to}
                      search={cta.search}
                      onClick={cta.onClick}
                      className={cardClassName}
                    >
                      {product.label}
                    </Link>
                  );
                })}
              </div>

              <DialogFooter className="sm:justify-center">
                <Button type="button" variant="ghost" onClick={backToCategory}>
                  <ArrowLeft /> Back
                </Button>
              </DialogFooter>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Completing intake does not guarantee a prescription.
          </p>
        </FullScreenMobileDialogContent>
      </Dialog>

      <EdMintsPickerModal
        open={edMintsOpen}
        onOpenChange={setEdMintsOpen}
        initialSelected="rdt"
        onBack={backFromEdMints}
      />
    </>
  );
}
