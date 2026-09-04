export const LEARN_VERTICALS = [
  "weight-loss",
  "trt",
  "hrt",
  "ed",
  "hairloss",
] as const;
export type LearnVertical = (typeof LEARN_VERTICALS)[number];

export type LearnSection = {
  id: string;
  heading: string;
  body: string[];
  bullets?: string[];
};

export type LearnFaq = { question: string; answer: string };

export type LearnArticle = {
  vertical: LearnVertical;
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  cluster: string;
  relatedSlugs: string[];
  moneyPageHrefs: string[];
  datePublished: string;
  dateModified: string;
  sources: { label: string; href: string }[];
  faqs: LearnFaq[];
  sections: LearnSection[];
  ctaId?: string;
};

export const LEARN_INDEX_PATH = "/learn/" as const;

export function isLearnVertical(value: string): value is LearnVertical {
  return (LEARN_VERTICALS as readonly string[]).includes(value);
}

/** Trailing-slash hub or article path, matching GitHub Pages canonicals. */
export function learnPath(vertical: LearnVertical, slug?: string): string {
  const hub = `/learn/${vertical}/`;
  if (!slug) return hub;
  return `/learn/${vertical}/${slug}/`;
}

export function learnArticleKey(vertical: LearnVertical, slug: string): string {
  return `${vertical}/${slug}`;
}

export const LEARN_VERTICAL_LABELS: Record<LearnVertical, string> = {
  "weight-loss": "Weight loss",
  trt: "TRT",
  hrt: "HRT",
  ed: "ED",
  hairloss: "Hair loss",
};

export const LEARN_VERTICAL_H1_LABELS: Record<LearnVertical, string> = {
  "weight-loss": "Weight loss",
  trt: "Testosterone replacement",
  hrt: "Hormone replacement",
  ed: "Erectile dysfunction",
  hairloss: "Hair loss",
};
