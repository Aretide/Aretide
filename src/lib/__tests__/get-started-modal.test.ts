import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET_STARTED_CATEGORIES,
  autoAdvanceCtaId,
} from "@/components/site/GetStartedModal";
import { MINT_OPTIONS } from "@/components/site/EdMintsPicker";
import { CTA_IDS, resolveCta } from "@/lib/cta-ids";
import { clearPendingUtms, storePendingUtms } from "@/lib/utm";

/**
 * GetStartedModal itself is a React component (no jsdom/RTL in this repo's
 * Vitest setup - environment: "node" in vitest.config.ts) - these tests
 * cover its data config and CTA wiring instead, the same level every other
 * CTA/UTM test in this suite operates at (cta-bask-handoff.test.ts,
 * utm-attribution.test.ts).
 */
describe("GetStartedModal category/product config", () => {
  it("gates Hair on sex instead of auto-advancing, even with exactly one live product", () => {
    const hair = GET_STARTED_CATEGORIES.find((c) => c.id === "hair")!;
    expect(hair.products).toHaveLength(1);
    expect(hair.sexGate).toBeDefined();
    expect(hair.sexGate?.male).toBe(CTA_IDS.oral_finasteride_hero);
    // sexGate takes precedence over the single-product auto-advance shortcut
    // - Hair needs its own Male/Female step, never a direct resolve from
    // step 1.
    expect(autoAdvanceCtaId(hair)).toBeNull();
  });

  it("resolves Hair's sexGate.male to a real Bask questionnaire URL", () => {
    const hair = GET_STARTED_CATEGORIES.find((c) => c.id === "hair")!;
    const cta = resolveCta(hair.sexGate!.male);
    expect(cta.to).toMatch(/^https:\/\/q\.beemahealth\.com\//);
  });

  it("auto-advances Weight Loss via directCtaId even though it lists 2 products", () => {
    const weightLoss = GET_STARTED_CATEGORIES.find(
      (c) => c.id === "weight-loss",
    )!;
    expect(weightLoss.products.length).toBeGreaterThan(1);
    expect(weightLoss.directCtaId).toBe(CTA_IDS.weight_loss_hero);
    expect(autoAdvanceCtaId(weightLoss)).toBe(CTA_IDS.weight_loss_hero);
  });

  it("shows step 2 for Sexual Health (multiple products, no shared destination)", () => {
    const sexualHealth = GET_STARTED_CATEGORIES.find(
      (c) => c.id === "sexual-health",
    )!;
    expect(sexualHealth.products.length).toBeGreaterThan(1);
    expect(sexualHealth.directCtaId).toBeUndefined();
    expect(autoAdvanceCtaId(sexualHealth)).toBeNull();
  });

  it("routes Sexual Health's ED Mints entry through the shared picker, not a direct CtaId", () => {
    const sexualHealth = GET_STARTED_CATEGORIES.find(
      (c) => c.id === "sexual-health",
    )!;
    const edMints = sexualHealth.products.find((p) => p.kind === "ed-mints");
    expect(edMints).toBeDefined();
    // Both MINT_OPTIONS entries (rdt/odt) resolve to their own real Bask URL -
    // guards that the reused EdMintsPickerModal still has somewhere to send
    // this branch once selected.
    for (const option of MINT_OPTIONS) {
      const cta = resolveCta(option.ctaId);
      expect(cta.to).toMatch(/^https:\/\/q\.beemahealth\.com\//);
    }
  });

  it("resolves every direct-CTA product, and every category's directCtaId, to a real Bask questionnaire URL", () => {
    for (const category of GET_STARTED_CATEGORIES) {
      if (category.directCtaId) {
        const cta = resolveCta(category.directCtaId);
        expect(cta.to, `${category.id} -> directCtaId`).toMatch(
          /^https:\/\/q\.beemahealth\.com\//,
        );
      }
      for (const product of category.products) {
        if (product.kind !== "cta") continue;
        const cta = resolveCta(product.ctaId);
        expect(cta.to, `${category.id} -> ${product.label}`).toMatch(
          /^https:\/\/q\.beemahealth\.com\//,
        );
      }
    }
  });
});

describe("GetStartedModal UTM passthrough", () => {
  beforeEach(() => clearPendingUtms());
  afterEach(() => {
    clearPendingUtms();
    vi.unstubAllGlobals();
  });

  it("carries session-captured UTMs onto every product's (and every directCtaId's) resolved Bask URL", () => {
    storePendingUtms({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "hair_launch",
    });

    const assertUtms = (to: string) => {
      const url = new URL(to);
      expect(url.searchParams.get("utm_source")).toBe("google");
      expect(url.searchParams.get("utm_medium")).toBe("cpc");
      expect(url.searchParams.get("utm_campaign")).toBe("hair_launch");
    };

    for (const category of GET_STARTED_CATEGORIES) {
      if (category.directCtaId) {
        assertUtms(resolveCta(category.directCtaId).to);
      }
      if (category.sexGate) {
        assertUtms(resolveCta(category.sexGate.male).to);
      }
      for (const product of category.products) {
        if (product.kind !== "cta") continue;
        assertUtms(resolveCta(product.ctaId).to);
      }
    }
  });
});
