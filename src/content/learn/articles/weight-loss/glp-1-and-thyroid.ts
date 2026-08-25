import type { LearnArticle } from "../../types";

export const article: LearnArticle = {
  vertical: "weight-loss",
  slug: "glp-1-and-thyroid",
  title: "GLP-1s and Thyroid: Boxed MTC Warning vs Hypothyroidism",
  h1: "Thyroid and GLP-1 medicines: medullary carcinoma contraindications, not a TSH diet",
  description:
    "GLP-1 labels carry a boxed warning about rodent thyroid C-cell tumors and contraindicate MTC and MEN 2. That is not the same as Hashimoto's.",
  keywords: [
    "GLP-1 and thyroid",
    "semaglutide thyroid cancer",
    "MTC MEN2 Wegovy",
    "Ozempic hypothyroidism",
    "tirzepatide thyroid",
    "GLP-1 levothyroxine",
  ],
  cluster: "medical-considerations",
  relatedSlugs: [
    "glp-1-and-antidepressants",
    "glp-1-side-effects",
    "wegovy",
    "zepbound",
    "ozempic",
    "mounjaro",
    "glp-1-for-weight-loss",
    "glp-1-for-older-adults",
  ],
  moneyPageHrefs: ["/weight-loss", "/glp-1"],
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  sources: [
    {
      label:
        "Wegovy (semaglutide) prescribing information. Novo Nordisk. Boxed warning for thyroid C-cell tumors; contraindication in MTC and MEN 2; oral medication and levothyroxine interaction with tablets.",
      href: "https://www.novo-pi.com/wegovy.pdf",
    },
    {
      label:
        "Zepbound (tirzepatide) prescribing information. Eli Lilly. Boxed warning; MTC/MEN 2 contraindication; uncertain value of routine calcitonin screening.",
      href: "https://pi.lilly.com/us/zepbound-uspi.pdf",
    },
    {
      label:
        "Ozempic (semaglutide) prescribing information. Novo Nordisk. Boxed warning and thyroid-related counseling.",
      href: "https://www.novo-pi.com/ozempic.pdf",
    },
    {
      label:
        "Mounjaro (tirzepatide) prescribing information. Eli Lilly. Boxed warning and MTC/MEN 2 contraindication.",
      href: "https://pi.lilly.com/us/mounjaro-uspi.pdf",
    },
    {
      label:
        "American Thyroid Association. Patient information on medullary thyroid cancer and MEN 2 (for clinician-directed education).",
      href: "https://www.thyroid.org/medullary-thyroid-cancer/",
    },
  ],
  faqs: [
    {
      question: "Can I take a GLP-1 if I have hypothyroidism?",
      answer:
        "Hypothyroidism and Hashimoto’s thyroiditis are not the same as the labeled contraindication. The boxed warning and contraindication concern medullary thyroid carcinoma (MTC) and Multiple Endocrine Neoplasia syndrome type 2 (MEN 2), based on rodent C-cell tumors whose human relevance is unknown. Many people with treated hypothyroidism take GLP-1s under clinician care. That is still an individual decision. This FAQ is not clearance.",
    },
    {
      question: "What thyroid history is an absolute stop?",
      answer:
        "Personal or family history of MTC, or a diagnosis of MEN 2, is a labeled contraindication for Wegovy, Ozempic, Zepbound, Mounjaro, and other drugs in this boxed-warning group. If that history is in your family, tell the prescriber before any injection. Papillary or follicular thyroid cancer is a different biology; it still belongs on the problem list, but it is not the boxed C-cell story. A thyroid clinician should interpret nodules.",
    },
    {
      question: "Do I need calcitonin blood tests on a GLP-1?",
      answer:
        "Labels state that routine serum calcitonin monitoring or thyroid ultrasound for early MTC detection is of uncertain value, in part because of high background thyroid disease and imperfect test specificity. Significantly elevated calcitonin can still warrant evaluation. Do not order a stack of thyroid tests from a blog. Follow the clinician.",
    },
    {
      question: "What symptoms should I report?",
      answer:
        "Labels tell patients to report a lump in the neck, trouble swallowing, trouble breathing, or persistent hoarseness. Those symptoms have many causes. They are a reason to call a clinician, not a reason to self-diagnose MTC.",
    },
    {
      question: "Does a GLP-1 replace or interfere with levothyroxine?",
      answer:
        "It does not replace thyroid hormone. Delayed emptying can affect oral medicines. A drug-interaction study with oral semaglutide found about 33% higher levothyroxine exposure; monitoring of thyroid tests may need to change. Weekly injectable semaglutide interaction studies have not shown the same levothyroxine finding in the Wegovy oral-meds section, but clinicians may still recheck TSH after large weight changes because thyroid dose is weight-related for many people.",
    },
    {
      question: "Will a GLP-1 fix my “slow thyroid” weight?",
      answer:
        "No. Untreated hypothyroidism needs guideline-directed thyroid care. A GLP-1 is not a TSH treatment. Treating obesity and treating thyroid disease are parallel clinician tasks. There are no guaranteed weight-loss percentages on this page.",
    },
  ],
  sections: [
    {
      id: "two-different-thyroids",
      heading: "Two different “thyroid” conversations",
      body: [
        "Search results mash together three ideas: (1) the boxed warning about C-cell tumors in rodents, (2) everyday hypothyroidism or Hashimoto’s, and (3) thyroid nodules found on ultrasound. Only the first is the reason GLP-1 and tirzepatide labels contraindicate MTC and MEN 2. Mixing them scares people who take levothyroxine and under-warns people with MEN 2 family history.",
        "This article restates labeled language. It is not an oncology consult, not a nodule algorithm, and not medical advice. Beema Health does not diagnose thyroid cancer on a marketing site.",
      ],
    },
    {
      id: "boxed-warning",
      heading: "What the boxed warning actually says",
      body: [
        "In rodents, semaglutide and tirzepatide caused thyroid C-cell tumors at clinically relevant exposures. It is unknown whether the human medicines cause MTC. Human relevance of the rodent finding has not been determined. Cases of MTC have been reported with another GLP-1 (liraglutide) in postmarketing use; those data are insufficient to prove or exclude causation.",
        "The drugs are contraindicated in patients with a personal or family history of MTC or with MEN 2. Counsel patients about symptoms of thyroid tumors (neck mass, dysphagia, dyspnea, persistent hoarseness). That counseling is on the label whether the patient is 25 or 75.",
      ],
    },
    {
      id: "not-hashimotos",
      heading: "Hypothyroidism, Hashimoto’s, and nodules",
      body: [
        "Autoimmune hypothyroidism is common. It is not MEN 2. People with stable levothyroxine replacement are often still candidates for obesity pharmacotherapy if other contraindications are absent. The decision includes who manages TSH, who manages the GLP-1, and how often labs are drawn after weight changes.",
        "Thyroid nodules are also common. Labels note that if a nodule is found, the patient should be further evaluated. That evaluation is ultrasound and, when indicated, biopsy pathways from thyroid guidelines, not a calcitonin-only shortcut from a weight-loss clinic blog.",
      ],
      bullets: [
        "Contraindicated: personal or family MTC, or MEN 2.",
        "Not the same thing: typical hypothyroidism on levothyroxine.",
        "Uncertain value: routine calcitonin or screening ultrasound just because of the GLP-1.",
        "Do report: neck lump, persistent hoarseness, swallowing or breathing trouble.",
      ],
    },
    {
      id: "levothyroxine",
      heading: "Levothyroxine timing and oral semaglutide",
      body: [
        "Levothyroxine is usually taken on an empty stomach, away from calcium and iron. A slower stomach can still change absorption of oral drugs. Wegovy’s oral-medications section notes that in a drug-interaction study with the semaglutide tablet, levothyroxine exposure increased 33% (90% CI 1.25-1.42). Monitor effects of oral medicines given with Wegovy; consider extra clinical or laboratory monitoring for narrow-index drugs.",
        "If you use oral semaglutide (including some Wegovy tablet or Rybelsus regimens), thyroid labs and dose adjustments belong to the clinician who manages your TSH. Do not change levothyroxine yourself because a scale moved.",
      ],
    },
    {
      id: "papillary-versus-c-cell",
      heading: "Papillary cancer is not the boxed-warning tumor",
      body: [
        "Most thyroid cancers in adults are papillary or follicular, arising from follicular cells. Medullary thyroid carcinoma arises from C cells and is the tumor type in the rodent findings and in MEN 2. A history of treated papillary cancer is still important, because you may be on levothyroxine suppression or have neck-surgery anatomy, but it is not automatically the labeled MTC contraindication. Pathology reports matter. Guessing from a family story is how people either avoid needed care or skip a real stop sign.",
        "Ultrasounds done for other reasons often show incidental nodules. Labels note that if a nodule is found, further evaluation is appropriate. That evaluation is not “stop the GLP-1 forever without a plan,” and it is not “ignore it because the boxed warning is only rodents.” A thyroid clinician coordinates next steps.",
        "Do not use over-the-counter “thyroid support” supplements alongside levothyroxine and a GLP-1 without listing them. Biotin can interfere with some thyroid lab assays and lead to confusing TSH numbers.",
      ],
    },
    {
      id: "family-history",
      heading: "Family history you should not shrug off",
      body: [
        "MEN 2 and familial MTC are uncommon, but they are exactly the labeled stop signs. “My aunt had thyroid cancer” is a prompt to ask which type. Papillary cancer in a relative is not automatically MEN 2. If no one knows the histology, a clinician may need records rather than guessing.",
        "Do not hide this history to get a prescription. Standard 7 of ethical prescribing still applies: a licensed clinician has to review you. Online intake that skips family endocrine history is a red flag for you as a patient, not a loophole.",
      ],
    },
  ],
};
