import { CTA_IDS, type CtaId } from "@/lib/cta-ids";
import { resolveMoneyPageHrefs } from "./money-pages";
import {
  LEARN_VERTICALS,
  isLearnVertical,
  learnArticleKey,
  type LearnArticle,
  type LearnFaq,
  type LearnSection,
  type LearnVertical,
} from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CTA_ID_VALUES = new Set<string>(Object.values(CTA_IDS));

const articleModules = import.meta.glob<{ article: LearnArticle }>(
  "./articles/**/*.ts",
  { eager: true },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertString(value: unknown, label: string, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `Learn article ${path}: ${label} must be a non-empty string`,
    );
  }
  return value;
}

function assertStringArray(
  value: unknown,
  label: string,
  path: string,
): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Learn article ${path}: ${label} must be a string array`);
  }
  return value as string[];
}

function parseSections(value: unknown, path: string): LearnSection[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      `Learn article ${path}: sections must be a non-empty array`,
    );
  }
  return value.map((raw, index) => {
    if (!isRecord(raw)) {
      throw new Error(`Learn article ${path}: sections[${index}] is invalid`);
    }
    const bullets = raw.bullets;
    if (bullets !== undefined && !Array.isArray(bullets)) {
      throw new Error(
        `Learn article ${path}: sections[${index}].bullets must be a string array`,
      );
    }
    return {
      id: assertString(raw.id, `sections[${index}].id`, path),
      heading: assertString(raw.heading, `sections[${index}].heading`, path),
      body: assertStringArray(raw.body, `sections[${index}].body`, path),
      ...(Array.isArray(bullets)
        ? {
            bullets: assertStringArray(
              bullets,
              `sections[${index}].bullets`,
              path,
            ),
          }
        : {}),
    };
  });
}

function parseFaqs(value: unknown, path: string): LearnFaq[] {
  if (!Array.isArray(value)) {
    throw new Error(`Learn article ${path}: faqs must be an array`);
  }
  return value.map((raw, index) => {
    if (!isRecord(raw)) {
      throw new Error(`Learn article ${path}: faqs[${index}] is invalid`);
    }
    return {
      question: assertString(raw.question, `faqs[${index}].question`, path),
      answer: assertString(raw.answer, `faqs[${index}].answer`, path),
    };
  });
}

function parseSources(value: unknown, path: string): LearnArticle["sources"] {
  if (!Array.isArray(value)) {
    throw new Error(`Learn article ${path}: sources must be an array`);
  }
  return value.map((raw, index) => {
    if (!isRecord(raw)) {
      throw new Error(`Learn article ${path}: sources[${index}] is invalid`);
    }
    const href = assertString(raw.href, `sources[${index}].href`, path);
    if (!href.startsWith("https://")) {
      throw new Error(
        `Learn article ${path}: sources[${index}].href must be an https URL`,
      );
    }
    return {
      label: assertString(raw.label, `sources[${index}].label`, path),
      href,
    };
  });
}

function parseArticlePath(modulePath: string): {
  vertical: LearnVertical;
  slug: string;
} {
  const match = modulePath.match(/\/articles\/([^/]+)\/([^/]+)\.ts$/);
  if (!match) {
    throw new Error(`Learn article path is not vertical/slug: ${modulePath}`);
  }
  const [, folder, slug] = match;
  if (!isLearnVertical(folder)) {
    throw new Error(
      `Learn article ${modulePath}: folder "${folder}" is not a known vertical`,
    );
  }
  return { vertical: folder, slug };
}

function parseArticle(modulePath: string, mod: unknown): LearnArticle {
  if (!isRecord(mod) || !isRecord(mod.article)) {
    throw new Error(`Learn article ${modulePath} must export const article`);
  }
  const raw = mod.article;
  const { vertical: folderVertical, slug: fileSlug } =
    parseArticlePath(modulePath);
  const verticalRaw = assertString(raw.vertical, "vertical", modulePath);
  if (!isLearnVertical(verticalRaw)) {
    throw new Error(`Learn article ${modulePath}: unknown vertical`);
  }
  if (verticalRaw !== folderVertical) {
    throw new Error(
      `Learn article ${modulePath}: vertical "${verticalRaw}" does not match folder "${folderVertical}"`,
    );
  }
  const slug = assertString(raw.slug, "slug", modulePath);
  if (slug !== fileSlug) {
    throw new Error(
      `Learn article ${modulePath}: slug "${slug}" does not match filename`,
    );
  }
  const datePublished = assertString(
    raw.datePublished,
    "datePublished",
    modulePath,
  );
  const dateModified = assertString(
    raw.dateModified,
    "dateModified",
    modulePath,
  );
  if (!ISO_DATE.test(datePublished) || !ISO_DATE.test(dateModified)) {
    throw new Error(`Learn article ${modulePath}: dates must be YYYY-MM-DD`);
  }

  let ctaId: string | undefined;
  if (raw.ctaId !== undefined) {
    ctaId = assertString(raw.ctaId, "ctaId", modulePath);
    if (!CTA_ID_VALUES.has(ctaId)) {
      throw new Error(
        `Learn article ${modulePath}: ctaId "${ctaId}" is not a CTA_IDS value`,
      );
    }
    if (verticalRaw !== "weight-loss") {
      throw new Error(
        `Learn article ${modulePath}: only the weight-loss vertical may set ctaId`,
      );
    }
  }

  return {
    vertical: verticalRaw,
    slug,
    title: assertString(raw.title, "title", modulePath),
    h1: assertString(raw.h1, "h1", modulePath),
    description: assertString(raw.description, "description", modulePath),
    keywords: assertStringArray(raw.keywords, "keywords", modulePath),
    cluster: assertString(raw.cluster, "cluster", modulePath),
    relatedSlugs: assertStringArray(
      raw.relatedSlugs,
      "relatedSlugs",
      modulePath,
    ),
    moneyPageHrefs: assertStringArray(
      raw.moneyPageHrefs,
      "moneyPageHrefs",
      modulePath,
    ),
    datePublished,
    dateModified,
    sources: parseSources(raw.sources, modulePath),
    faqs: parseFaqs(raw.faqs, modulePath),
    sections: parseSections(raw.sections, modulePath),
    ...(ctaId ? { ctaId } : {}),
  };
}

function isPublished(article: LearnArticle): boolean {
  return !article.slug.startsWith("_");
}

const registry = new Map<string, LearnArticle>();
for (const [modulePath, mod] of Object.entries(articleModules)) {
  const article = parseArticle(modulePath, mod);
  const key = learnArticleKey(article.vertical, article.slug);
  if (registry.has(key)) {
    throw new Error(`Duplicate learn article key: ${key}`);
  }
  registry.set(key, article);
}

export function listDiscoveredKeys(): string[] {
  return [...registry.keys()].sort();
}

export function peekArticle(
  vertical: string,
  slug: string,
): LearnArticle | undefined {
  if (!isLearnVertical(vertical)) return undefined;
  return registry.get(learnArticleKey(vertical, slug));
}

export function getArticle(
  vertical: string,
  slug: string,
): LearnArticle | undefined {
  const article = peekArticle(vertical, slug);
  if (!article || !isPublished(article)) return undefined;
  return article;
}

export function listArticles(vertical: LearnVertical): LearnArticle[] {
  return [...registry.values()]
    .filter((article) => article.vertical === vertical && isPublished(article))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function listAllArticles(): LearnArticle[] {
  return [...registry.values()]
    .filter(isPublished)
    .sort((a, b) =>
      learnArticleKey(a.vertical, a.slug).localeCompare(
        learnArticleKey(b.vertical, b.slug),
      ),
    );
}

/**
 * Resolve relatedSlugs against the registry. Missing slugs (siblings not
 * landed yet) are skipped. Slugs are same-vertical first; `vertical/slug`
 * keys are also accepted.
 */
export function getRelatedArticles(
  article: LearnArticle,
  limit = 6,
): LearnArticle[] {
  const related: LearnArticle[] = [];
  const seen = new Set([learnArticleKey(article.vertical, article.slug)]);

  for (const raw of article.relatedSlugs) {
    if (related.length >= limit) break;
    const slash = raw.indexOf("/");
    const candidate =
      slash === -1
        ? getArticle(article.vertical, raw)
        : getArticle(raw.slice(0, slash), raw.slice(slash + 1));
    if (!candidate) continue;
    const key = learnArticleKey(candidate.vertical, candidate.slug);
    if (seen.has(key)) continue;
    seen.add(key);
    related.push(candidate);
  }

  return related;
}

export function articleMoneyPages(article: LearnArticle) {
  return resolveMoneyPageHrefs(article.moneyPageHrefs);
}

export function isKnownCtaId(value: string): value is CtaId {
  return CTA_ID_VALUES.has(value);
}

/** Weight-loss articles may CTA to Bask intake. TRT/HRT never do. */
export function resolveLearnArticleCtaId(
  article: LearnArticle,
): CtaId | undefined {
  if (article.vertical !== "weight-loss") return undefined;
  if (article.ctaId && isKnownCtaId(article.ctaId)) return article.ctaId;
  return CTA_IDS.learn_weight_loss;
}

export { LEARN_VERTICALS };
