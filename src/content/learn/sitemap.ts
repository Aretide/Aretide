import { LEARN_HUB_DATES, LEARN_INDEX_DATE_MODIFIED } from "./hubs";
import { LEGACY_LEARN_GUIDES } from "./legacy-guides";
import { listAllArticles } from "./registry";
import { LEARN_INDEX_PATH, LEARN_VERTICALS, learnPath } from "./types";

export type LearnSitemapEntry = {
  path: string;
  lastmod: string;
  priority: string;
};

/**
 * Indexable learn URLs for public/sitemap.xml.
 * Hub lastmod is the hub copy date. Article lastmod is dateModified.
 * Legacy /learn/{slug} guides stay listed so they are not dropped.
 */
export function getLearnSitemapEntries(): LearnSitemapEntry[] {
  const entries: LearnSitemapEntry[] = [
    {
      path: LEARN_INDEX_PATH,
      lastmod: LEARN_INDEX_DATE_MODIFIED,
      priority: "0.6",
    },
    ...LEARN_VERTICALS.map((vertical) => ({
      path: learnPath(vertical),
      lastmod: LEARN_HUB_DATES[vertical],
      priority: vertical === "weight-loss" ? "0.6" : "0.5",
    })),
    ...listAllArticles().map((article) => ({
      path: learnPath(article.vertical, article.slug),
      lastmod: article.dateModified,
      priority: "0.5",
    })),
    ...LEGACY_LEARN_GUIDES.map((guide) => ({
      path: guide.path.endsWith("/") ? guide.path : `${guide.path}/`,
      lastmod: guide.lastmod,
      priority: "0.7",
    })),
  ];

  return entries;
}

export function getLearnSitemapPaths(): string[] {
  return getLearnSitemapEntries().map((entry) => entry.path);
}
