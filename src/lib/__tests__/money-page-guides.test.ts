import { describe, expect, it } from "vitest";
import {
  MONEY_PAGE_GUIDES,
  guidesForMoneyPage,
  guideHeadingForMoneyPage,
} from "@/content/learn/money-page-guides";
import { listAllArticles } from "@/content/learn/registry";
import { resolveMoneyPageHrefs } from "@/content/learn/money-pages";

/**
 * The program pages are the highest-authority pages on the site. Before this
 * map existed they linked only to the /learn/ index, so every guide written to
 * answer a paid-search query sat three hops away with no internal support.
 */
describe("money page guides", () => {
  it("points every program page at published guides", () => {
    for (const set of MONEY_PAGE_GUIDES) {
      const resolved = guidesForMoneyPage(set.path);
      expect(
        resolved.length,
        `${set.path} resolved ${resolved.length} of ${set.articles.length} guides`,
      ).toBe(set.articles.length);
      expect(resolved.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("only maps program pages that actually exist", () => {
    for (const set of MONEY_PAGE_GUIDES) {
      expect(resolveMoneyPageHrefs([set.path]), set.path).toHaveLength(1);
    }
  });

  it("gives every set a heading and unique guides", () => {
    for (const set of MONEY_PAGE_GUIDES) {
      expect(guideHeadingForMoneyPage(set.path).length).toBeGreaterThan(10);
      const hrefs = guidesForMoneyPage(set.path).map((g) => g.href);
      expect(new Set(hrefs).size, `${set.path} has duplicate guides`).toBe(
        hrefs.length,
      );
    }
  });

  it("returns nothing for a page with no guide set", () => {
    expect(guidesForMoneyPage("/faq/")).toEqual([]);
    expect(guideHeadingForMoneyPage("/faq/")).toBe("");
  });

  it("covers every live Google Ads keyword with a linked guide", () => {
    // Source: Google Ads keyword report, 2026-08-23. A keyword with no guide
    // reachable from its program page has no organic landing page behind the
    // paid spend.
    const AD_KEYWORDS: Record<string, string> = {
      "semaglutide weight loss": "/semaglutide/",
      "semaglutide weight loss program": "/semaglutide/",
      "semaglutide texas": "/semaglutide/",
      "semaglutide houston": "/semaglutide/",
      "semaglutide doctor houston": "/semaglutide/",
      "semaglutide weight loss houston": "/semaglutide/",
      "semaglutide online houston": "/semaglutide/",
      "tirzepatide online": "/tirzepatide/",
      "tirzepatide texas": "/tirzepatide/",
      "tirzepatide houston": "/tirzepatide/",
      "tirzepatide doctor houston": "/tirzepatide/",
      "glp 1 weight loss": "/glp-1/",
      "glp 1 treatment": "/glp-1/",
      "glp 1 online": "/glp-1/",
      "glp1 online": "/glp-1/",
      "online glp1": "/glp-1/",
      "buy glp 1 online": "/glp-1/",
      "get glp 1 online": "/glp-1/",
      "glp 1 doctor": "/glp-1/",
      "glp 1 near me": "/glp-1/",
      "best glp 1 for weight loss": "/glp-1/",
      "glp 1 drugs for weight loss": "/glp-1/",
      "glp 1 peptide for weight loss": "/glp-1/",
      "glp 1 weight loss program": "/glp-1/",
      "glp 1 houston": "/glp-1-houston/",
      "glp 1 weight loss houston": "/glp-1-houston/",
      "glp 1 doctor houston": "/glp-1-houston/",
      "weight loss": "/weight-loss/",
    };
    const missing = Object.entries(AD_KEYWORDS)
      .filter(([, page]) => guidesForMoneyPage(page).length === 0)
      .map(([kw, page]) => `${kw} -> ${page}`);
    expect(missing).toEqual([]);
  });

  it("documents the ad keywords each set serves", () => {
    for (const set of MONEY_PAGE_GUIDES) {
      expect(set.adKeywords.length, set.path).toBeGreaterThan(0);
    }
  });

  it("keeps guide sets weight-loss only until the other verticals launch", () => {
    // Beema currently offers compounded semaglutide and compounded tirzepatide.
    // TRT, HRT, ED, hair loss and peptides are education-only until launch, so
    // a program page must not link to them as if they were purchasable.
    const nonWeightLoss = MONEY_PAGE_GUIDES.flatMap((set) =>
      set.articles.filter((a) => a.vertical !== "weight-loss"),
    );
    expect(nonWeightLoss).toEqual([]);
  });

  it("never links a program page to an unpublished article", () => {
    const published = new Set(
      listAllArticles().map((a) => `${a.vertical}/${a.slug}`),
    );
    const bad = MONEY_PAGE_GUIDES.flatMap((set) =>
      set.articles
        .filter((a) => !published.has(`${a.vertical}/${a.slug}`))
        .map((a) => `${set.path}: ${a.vertical}/${a.slug}`),
    );
    expect(bad).toEqual([]);
  });
});
