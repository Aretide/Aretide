import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import verified from "./fixtures/verified-citations.json";

/**
 * Citation integrity for every /learn/ page, new registry and legacy guides.
 *
 * A hand-audit found citations whose DOI resolved to an entirely different
 * paper (a mouse-mitophagy study cited as a GLP-1 review, an almond-snacking
 * trial cited as a resistance-training meta-analysis) plus several labels
 * crediting the wrong first author. Those are the exact failures that destroy
 * trust on YMYL pages, and nothing in the build caught them.
 *
 * `fixtures/verified-citations.json` is a frozen snapshot of CrossRef metadata
 * for every DOI the library cites. These tests run offline against that
 * snapshot, so swapping a DOI or rewriting a label without re-verifying fails
 * the build. Regenerate the snapshot only after confirming a DOI against
 * CrossRef by hand.
 */
const ROOT = resolve(__dirname, "../../..");
const MANIFEST = verified as Record<
  string,
  { firstAuthor: string | null; year: number | null; title: string }
>;

type Citation = { file: string; label: string; href: string };

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

function collectCitations(): Citation[] {
  const files = [
    ...walk(resolve(ROOT, "src/content/learn/articles")),
    ...walk(resolve(ROOT, "src/lib/learn")),
  ];
  const pattern =
    /label:\s*\n?\s*"((?:[^"\\]|\\.)*)",\s*\n?\s*href:\s*"([^"]+)"/g;
  const out: Citation[] = [];
  for (const file of files) {
    const source = readFileSync(file, "utf-8");
    for (const m of source.matchAll(pattern)) {
      out.push({
        file: file.replace(`${ROOT}/`, ""),
        label: m[1] ?? "",
        href: m[2] ?? "",
      });
    }
  }
  return out;
}

function doiOf(href: string): string | null {
  const m =
    href.match(/doi\.org\/(10\.[^\s?#]+)/) ??
    href.match(/nejm\.org\/doi\/full\/(10\.[^\s?#]+)/) ??
    href.match(/onlinelibrary\.wiley\.com\/doi\/(10\.[^\s?#]+)/);
  return m ? (m[1] ?? null) : null;
}

const citations = collectCitations();

describe("learn citations", () => {
  it("finds citations to check", () => {
    expect(citations.length).toBeGreaterThan(120);
  });

  it("has a verified snapshot entry for every DOI cited", () => {
    const unknown = citations
      .map((c) => doiOf(c.href))
      .filter((d): d is string => Boolean(d))
      .filter((d) => !(d in MANIFEST));
    expect(
      unknown,
      "new DOI added without re-verifying against CrossRef; regenerate fixtures/verified-citations.json",
    ).toEqual([]);
  });

  it("credits the real first author of every cited paper", () => {
    const wrong: string[] = [];
    for (const c of citations) {
      const doi = doiOf(c.href);
      if (!doi) continue;
      const entry = MANIFEST[doi];
      const author = entry?.firstAuthor;
      if (!author) continue;
      // CrossRef occasionally stores a full given name in the family field.
      const surname = author.split(/\s+/).pop() ?? author;
      const normalize = (s: string) =>
        s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      if (!normalize(c.label).includes(normalize(surname))) {
        wrong.push(`${c.file}: ${doi} label omits first author "${author}"`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("never cites a DOI whose paper is unrelated to the label", () => {
    // Guards the specific failure mode found in the audit: a plausible label
    // attached to a DOI for a different paper. Requires a meaningful overlap
    // between the label text and the real title.
    const STOP = new Set([
      "the",
      "a",
      "an",
      "of",
      "and",
      "or",
      "in",
      "on",
      "for",
      "with",
      "to",
      "from",
      "by",
      "as",
      "at",
      "effects",
      "effect",
      "study",
      "trial",
      "trials",
      "review",
      "analysis",
      "systematic",
      "meta",
      "randomized",
      "controlled",
      "adults",
      "patients",
      "versus",
      "vs",
      "et",
      "al",
    ]);
    const words = (s: string) =>
      new Set(
        s
          .toLowerCase()
          .replace(/<[^>]*>/g, " ")
          .split(/[^a-z0-9-]+/)
          .filter((w) => w.length > 3 && !STOP.has(w)),
      );
    const suspicious: string[] = [];
    for (const c of citations) {
      const doi = doiOf(c.href);
      if (!doi) continue;
      const title = MANIFEST[doi]?.title;
      if (!title || title === "UNRESOLVED") continue;
      const t = words(title);
      if (t.size === 0) continue;
      const l = words(c.label);
      // Labels legitimately use trial shorthand ("SURMOUNT-1", "STEP 1") rather
      // than restating the full title, so a low overlap is normal. What is not
      // normal is ZERO overlap: every mismatched DOI the audit found shared no
      // significant word with the paper it actually pointed at.
      const overlap = [...t].filter((w) => l.has(w)).length;
      if (overlap === 0) {
        suspicious.push(
          `${c.file}: ${doi}\n    label: ${c.label.slice(0, 90)}\n    actual: ${title.slice(0, 90)}`,
        );
      }
    }
    expect(suspicious).toEqual([]);
  });

  it("never links to a host known to have served dead citations", () => {
    // These exact paths 404'd in the audit. Pin them so they cannot come back.
    const RETIRED = [
      "fda.gov/drugs/human-drug-compounding/status-compounded-glp-1-drugs",
      "fda.gov/drugs/drug-safety-and-availability/fda-updates-labeling-glp-1-receptor-agonists",
      "fda.gov/drugs/drug-safety-and-availability/update-fdas-evaluation-reports-suicidal",
      "fda.gov/news-events/press-announcements/fda-approves-weight-management-drug-saxenda",
      "fda.gov/news-events/press-announcements/fda-approves-novel-dual-targeted-treatment-type-2-diabetes",
      'fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers"',
      'nccih.nih.gov/health/berberine"',
      "niddk.nih.gov/health-information/kidney-disease/acute-kidney-injury",
      "americangeriatrics.org/publications-tools/patient-resources",
      "tmb.state.tx.us/page/telemedicine",
      "dshs.texas.gov/disaster-preparedness/heat-related-illness",
      "cancer.gov/about-cancer/treatment/cam/patient/detox-pdq",
      "doi.org/10.1111/dom.14683",
      "doi.org/10.1016/j.cmet.2017.12.008",
      "doi.org/10.3390/nu10080960",
      "healthline.com",
      "goodrx.com/healthcare-access/health-technology",
    ];
    const found = citations
      .filter((c) => RETIRED.some((r) => `${c.href}"`.includes(r)))
      .map((c) => `${c.file}: ${c.href}`);
    expect(found).toEqual([]);
  });

  it("uses https for every citation", () => {
    const insecure = citations
      .filter((c) => !c.href.startsWith("https://"))
      .map((c) => `${c.file}: ${c.href}`);
    expect(insecure).toEqual([]);
  });
});
