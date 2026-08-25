import {
  COMPOUNDED_DISCLOSURE,
  COMPOUNDED_SEMA_REQUIRED,
  COMPOUNDED_TIRZ_REQUIRED,
} from "@/lib/compounded-disclosure";
import {
  COMPOUNDED_SEMAGLUTIDE_PRICING,
  COMPOUNDED_TIRZEPATIDE_PRICING,
  compoundedMonthlyPricingSentence,
  dualCompoundedFaqPricingParagraph,
  formatUsd,
  STARTER_PACK_INTAKE_HINT,
} from "@/lib/medication-pricing";

export function learnSemaCashPayFaqAnswer(): string {
  return `${compoundedMonthlyPricingSentence(
    "Compounded semaglutide",
    COMPOUNDED_SEMAGLUTIDE_PRICING,
  )} Confirm the lockup on /semaglutide. ${COMPOUNDED_SEMA_REQUIRED} Prescribing is never guaranteed.`;
}

export function learnTirzCashPayFaqAnswer(): string {
  return `${compoundedMonthlyPricingSentence(
    "Compounded tirzepatide",
    COMPOUNDED_TIRZEPATIDE_PRICING,
  )} Confirm the lockup on /tirzepatide. ${COMPOUNDED_TIRZ_REQUIRED} Prescribing is never guaranteed.`;
}

export function learnTirzStarterPackFaqAnswer(): string {
  const pack = COMPOUNDED_TIRZEPATIDE_PRICING.starterPack;
  if (!pack) {
    throw new Error(
      "Tirzepatide starter pack is required for learn pricing copy",
    );
  }
  return `New patients beginning compounded tirzepatide may be offered a ${pack.months}-month starter pack at ${formatUsd(pack.totalUsd)} total (${formatUsd(pack.monthlyEquivalentUsd)} per month) covering ${pack.dosePathLabel}. ${STARTER_PACK_INTAKE_HINT} The checkout coupon cannot combine with the starter pack. Maintenance plans have separate rates on /tirzepatide. ${COMPOUNDED_TIRZ_REQUIRED} Prescribing is never guaranteed.`;
}

export function learnDualMedTeaserSentence(): string {
  return `${dualCompoundedFaqPricingParagraph()} ${COMPOUNDED_DISCLOSURE}`;
}
