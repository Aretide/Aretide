import type { LearnArticle } from "../../types";

export const article: LearnArticle = {
  vertical: "trt",
  slug: "what-is-trt",
  title: "What is testosterone replacement therapy (TRT)?",
  h1: "What is testosterone replacement therapy?",
  description:
    "An educational explainer of testosterone replacement therapy: who guidelines consider, and why diagnosis needs repeated morning labs. Not a Beema product.",
  keywords: [
    "what is TRT",
    "testosterone replacement therapy",
    "hypogonadism",
    "testosterone deficiency",
  ],
  cluster: "foundations",
  relatedSlugs: [],
  moneyPageHrefs: ["/weight-loss/"],
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  sources: [
    {
      label:
        "Bhasin S, et al. Testosterone Therapy in Men With Hypogonadism: An Endocrine Society Clinical Practice Guideline. JCEM. 2018.",
      href: "https://doi.org/10.1210/jc.2018-00229",
    },
    {
      label:
        "U.S. Food and Drug Administration. Testosterone Information: labeling and safety communications for testosterone products.",
      href: "https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/testosterone-information",
    },
  ],
  faqs: [
    {
      question: "Does Beema Health prescribe TRT?",
      answer:
        "No. Beema's live offering is telehealth medical weight-loss. This article is educational only.",
    },
    {
      question: "Can I diagnose low testosterone from symptoms alone?",
      answer:
        "Guidelines expect compatible symptoms plus confirmed low morning testosterone, usually on more than one test, after considering other causes. A webpage cannot run those labs.",
    },
    {
      question: "Is TRT a weight-loss drug?",
      answer:
        "No. Some people with hypogonadism notice body-composition changes on treatment, but TRT is not a GLP-1 weight-management medicine and is not Beema's program.",
    },
  ],
  sections: [
    {
      id: "definition",
      heading: "A working definition",
      body: [
        "Testosterone replacement therapy is prescription treatment intended to restore testosterone in men with documented hypogonadism. It is regulated as a drug, not as a supplement. Online clinics that skip laboratory confirmation are not following the diagnostic approach in major endocrine and urology guidelines.",
      ],
    },
    {
      id: "diagnosis",
      heading: "How diagnosis is usually approached",
      body: [
        "Clinicians typically measure morning total testosterone, repeat a low result, and interpret it with sex hormone-binding globulin, symptoms, and medicines that can suppress testosterone. Free testosterone assays vary in quality. The point for readers is that a single afternoon number from a wellness booth is not a complete workup.",
      ],
      bullets: [
        "Repeat morning testing is standard when the first result is low.",
        "Fertility goals can change whether testosterone itself is even a reasonable option.",
        "Hematocrit, prostate evaluation when indicated, and sleep apnea history belong in the same conversation.",
      ],
    },
    {
      id: "not-beema",
      heading: "Why this article lives on a weight-loss company's site",
      body: [
        "People searching TRT still land on health brands. We would rather say clearly that Beema does not offer this therapy today than invent a fake intake. If you need evaluation, see a licensed clinician who does this work. If you came here for GLP-1 weight-loss education, the weight-loss learn hub is the right shelf.",
      ],
    },
  ],
};
