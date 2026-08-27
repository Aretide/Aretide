import { describe, expect, it } from "vitest";
import {
  ED_COMBO_PRICING,
  ED_STANDARD_PRICING,
  HAIRLOSS_ORAL_PRICING,
  HAIRLOSS_TOPICAL_PRICING,
  NAD_PRICING,
  SERMORELIN_PRICING,
  TRT_PRICING,
  formatSimpleStartingAt,
  simplePricingSentence,
} from "../simple-treatment-pricing";

const ALL_PRICINGS = [
  ["TRT", TRT_PRICING],
  ["Hairloss oral", HAIRLOSS_ORAL_PRICING],
  ["Hairloss topical", HAIRLOSS_TOPICAL_PRICING],
  ["ED standard", ED_STANDARD_PRICING],
  ["ED combo", ED_COMBO_PRICING],
  ["NAD+", NAD_PRICING],
  ["Sermorelin", SERMORELIN_PRICING],
] as const;

describe("simple-treatment-pricing", () => {
  it("has a positive monthly rate for every product", () => {
    for (const [label, pricing] of ALL_PRICINGS) {
      expect(pricing.monthlyUsd, label).toBeGreaterThan(0);
    }
  });

  it("computes quarterly monthlyEquivalentUsd and savingsUsd correctly", () => {
    for (const [label, pricing] of ALL_PRICINGS) {
      if (!pricing.quarterly) continue;
      const q = pricing.quarterly;
      expect(q.monthlyEquivalentUsd, label).toBeCloseTo(q.totalUsd / 3, 2);
      expect(q.savingsUsd, label).toBeCloseTo(
        pricing.monthlyUsd * 3 - q.totalUsd,
        2,
      );
      // Quarterly should always beat paying monthly for 3 months - that's
      // the entire incentive to prepay.
      expect(q.savingsUsd, label).toBeGreaterThan(0);
    }
  });

  it("TRT has no quarterly plan - not a SKU in the cost sheet", () => {
    expect(TRT_PRICING.quarterly).toBeUndefined();
  });

  it("formatSimpleStartingAt renders whole-dollar monthly rates without cents", () => {
    expect(formatSimpleStartingAt(TRT_PRICING)).toBe("$169/mo");
    expect(formatSimpleStartingAt(NAD_PRICING)).toBe("$149/mo");
    expect(formatSimpleStartingAt(SERMORELIN_PRICING)).toBe("$199/mo");
  });

  it("simplePricingSentence never mentions a promo code or starter pack", () => {
    for (const [label, pricing] of ALL_PRICINGS) {
      const sentence = simplePricingSentence(label, pricing);
      expect(sentence, label).not.toMatch(/promo code/i);
      expect(sentence, label).not.toMatch(/starter pack/i);
      expect(sentence, label).toContain("billed monthly");
    }
  });

  it("simplePricingSentence mentions the quarterly plan only when one exists", () => {
    expect(simplePricingSentence("TRT", TRT_PRICING)).not.toMatch(/quarterly/i);
    expect(simplePricingSentence("Hairloss", HAIRLOSS_ORAL_PRICING)).toMatch(
      /quarterly/i,
    );
  });
});
