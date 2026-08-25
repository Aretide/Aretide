import { describe, expect, it } from "vitest";
import {
  learnDualMedTeaserSentence,
  learnSemaCashPayFaqAnswer,
  learnTirzCashPayFaqAnswer,
  learnTirzStarterPackFaqAnswer,
} from "@/lib/learn-pricing-copy";
import {
  COMPOUNDED_SEMAGLUTIDE_PRICING,
  COMPOUNDED_TIRZEPATIDE_PRICING,
  formatUsd,
  promoFirstMonthUsd,
  semaThreeMonthPromoTotalUsd,
} from "@/lib/medication-pricing";

describe("learn-pricing-copy", () => {
  it("builds semaglutide cash-pay FAQs from the pricing module", () => {
    const answer = learnSemaCashPayFaqAnswer();
    expect(answer).toContain(
      formatUsd(COMPOUNDED_SEMAGLUTIDE_PRICING.monthlyUsd),
    );
    expect(answer).toContain(
      formatUsd(promoFirstMonthUsd(COMPOUNDED_SEMAGLUTIDE_PRICING)),
    );
    expect(answer).toContain(formatUsd(semaThreeMonthPromoTotalUsd()));
    expect(answer).toMatch(/never guaranteed/i);
  });

  it("builds tirzepatide cash-pay and starter-pack FAQs from the pricing module", () => {
    const pack = COMPOUNDED_TIRZEPATIDE_PRICING.starterPack!;
    expect(learnTirzCashPayFaqAnswer()).toContain(
      formatUsd(COMPOUNDED_TIRZEPATIDE_PRICING.monthlyUsd),
    );
    const starter = learnTirzStarterPackFaqAnswer();
    expect(starter).toContain(formatUsd(pack.totalUsd));
    expect(starter).toContain(formatUsd(pack.monthlyEquivalentUsd));
    expect(starter).toMatch(/never guaranteed/i);
  });

  it("keeps the dual-med teaser on the same lockup", () => {
    expect(learnDualMedTeaserSentence()).toContain("Compounded semaglutide");
    expect(learnDualMedTeaserSentence()).toContain("Compounded tirzepatide");
  });
});
