import type { LearnArticle } from "../../types";

/**
 * Unpublished glob probe. Slugs that start with "_" are indexed by the
 * registry for tests but are not routed, sitemapped, or listed on hubs.
 */
export const article: LearnArticle = {
  vertical: "weight-loss",
  slug: "_glob-fixture",
  title: "Registry glob fixture (unpublished)",
  h1: "Registry glob fixture (unpublished)",
  description:
    "Unpublished fixture used to prove import.meta.glob discovers article files without a manual import list.",
  keywords: ["learn registry fixture"],
  cluster: "fixture",
  relatedSlugs: ["not-landed-yet", "also-missing-sibling"],
  moneyPageHrefs: ["/weight-loss/", "/semaglutide/", "/retired-page"],
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  sources: [
    {
      label:
        "National Institute of Diabetes and Digestive and Kidney Diseases. Prescription medications to treat overweight and obesity.",
      href: "https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity",
    },
  ],
  faqs: [],
  sections: [
    {
      id: "fixture",
      heading: "Why this file exists",
      body: [
        "Sibling article files land under this folder without editing a registry import list. This unpublished fixture proves the glob and related-slug skipping behavior.",
      ],
    },
  ],
};
