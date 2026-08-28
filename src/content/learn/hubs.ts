import type { LearnFaq, LearnVertical } from "./types";
import {
  COMPOUNDED_DISCLOSURE,
  LEARN_FIFTY_STATE_SENTENCE,
  LEARN_USA_ONLY_SENTENCE,
  getGlp1OnlineWithBeemaFaq,
} from "@/lib/learn-trust-copy";

export const LEARN_INDEX_DATE_MODIFIED = "2026-08-25" as const;
export const LEARN_HUB_DATES = {
  "weight-loss": "2026-08-25",
  trt: "2026-08-25",
  hrt: "2026-08-25",
} as const satisfies Record<LearnVertical, string>;

export type LearnCluster = {
  id: string;
  heading: string;
  intro: string;
  slugs: readonly string[];
};

export const WEIGHT_LOSS_CLUSTERS: readonly LearnCluster[] = [
  {
    id: "side-effects",
    heading: "Side effects and how they feel",
    intro:
      "Gastrointestinal effects are the most common reasons people pause or stop a GLP-1 medicine. These guides explain nausea, constipation, fatigue, and related symptoms in plain language, with the reminder that a licensed provider should interpret what they mean for you.",
    slugs: [
      "glp-1-side-effects",
      "glp-1-nausea",
      "glp-1-constipation",
      "glp-1-fatigue",
      "glp-1-hair-loss",
      "glp-1-dizziness",
      "glp-1-acne",
      "glp-1-body-aches",
      "glp-1-injection-site-reactions",
      "glp-1-and-periods",
      "glp-1-urinary-changes",
      "glp-1-bloating",
    ],
  },
  {
    id: "troubleshooting",
    heading: "When weight loss stalls",
    intro:
      "A plateau is common on any weight-management plan. These pages cover what trials and clinics typically look at when the scale stops moving, including appetite that returns and differences people report on semaglutide versus tirzepatide. None of this replaces a clinical visit.",
    slugs: [
      "weight-loss-plateau-on-glp-1",
      "still-hungry-on-glp-1",
      "not-losing-weight-on-semaglutide",
      "not-losing-weight-on-tirzepatide",
    ],
  },
  {
    id: "dosing",
    heading: "Dosing, switching, and stopping",
    intro:
      "Labelled titration schedules exist for FDA-approved products. Compounded prescriptions, when they are used at all, follow a licensed provider's directions and are not interchangeable with branded pens. Use these overviews to understand the questions to ask, not to change a dose on your own.",
    slugs: [
      "glp-1-dosing",
      "wegovy-dosing",
      "zepbound-dosing",
      "microdosing-glp-1",
      "glp-1-maintenance-dose",
      "switching-glp-1-medications",
      "switching-from-zepbound-to-wegovy",
      "switching-from-wegovy-to-zepbound",
      "stopping-glp-1",
      "stopping-tirzepatide",
      "stopping-mounjaro",
      "rebound-weight-gain-after-glp-1",
    ],
  },
  {
    id: "branded",
    heading: "Branded GLP-1 medicines, explained",
    intro: `Ozempic, Wegovy, Mounjaro, Zepbound, Saxenda, and related products are FDA-approved medicines with their own labels. Beema does not sell those brands. If a clinician prescribes, the live offering is compounded semaglutide or compounded tirzepatide. ${COMPOUNDED_DISCLOSURE} These explainers exist so searchers can read labelled facts without mixing them up with compounded products.`,
    slugs: [
      "ozempic",
      "wegovy",
      "zepbound",
      "mounjaro",
      "saxenda",
      "wegovy-pill",
      "wegovy-low-dose",
    ],
  },
  {
    id: "lifestyle",
    heading: "Daily life, travel, diet, and special situations",
    intro:
      "Injection timing, travel with refrigerated pens, eating patterns, alcohol, surgery, and pregnancy-related questions come up constantly. The pages in this cluster collect publicly available guidance. They are not a travel clinic, a diet prescription, or clearance for surgery.",
    slugs: [
      "travel-with-glp-1",
      "travel-with-wegovy",
      "travel-with-zepbound",
      "glp-1-age-limit",
      "glp-1-for-older-adults",
      "glp-1-while-breastfeeding",
      "glp-1-postpartum",
      "wegovy-while-breastfeeding",
      "zepbound-while-breastfeeding",
      "glp-1-and-antidepressants",
      "glp-1-and-thyroid",
      "glp-1-before-surgery",
      "glp-1-diet",
      "foods-to-avoid-on-tirzepatide",
      "exercise-on-glp-1",
      "water-intake-on-glp-1",
      "sweating-and-weight-loss",
      "glp-1-and-alcohol",
    ],
  },
  {
    id: "pipeline",
    heading: "Pipeline medicines, peptides, and adjacent topics",
    intro:
      "Retatrutide and several other pipeline products are investigational. Orforglipron is FDA-approved as Foundayo but is not a Beema offering. Peptide marketing and supplement claims are often ahead of evidence. These pages separate what is in trials or on another company's label from what this US telehealth clinic can prescribe today.",
    slugs: [
      "retatrutide",
      "orforglipron",
      "mazdutide",
      "cagrisema",
      "tesamorelin",
      "sermorelin",
      "metformin-for-weight-loss",
      "retatrutide-vs-semaglutide",
      "orforglipron-vs-semaglutide",
      "retatrutide-vs-ozempic",
      "natural-appetite-suppressants",
      "ashwagandha-and-weight-loss",
      "berberine-and-semaglutide",
    ],
  },
  {
    id: "commercial-companions",
    heading: "Online GLP-1 care, cost, and how programs work",
    intro:
      "If you are comparing telehealth weight-loss programs, start with how intake, prescribing, and pharmacy fulfillment actually work. These companions sit next to Beema's commercial pages without copying their headlines. A prescription always requires a licensed provider. Completing an online form does not guarantee medication.",
    slugs: [
      "glp-1-for-weight-loss",
      "glp-1-weight-loss-program",
      "online-glp-1",
      "glp-1-doctor",
      "glp-1-in-texas",
      "glp-1-in-houston",
      "tirzepatide-online",
      "semaglutide-weight-loss",
      "semaglutide-in-texas",
      "semaglutide-in-houston",
      "tirzepatide-in-houston",
      "tirzepatide-in-texas",
      "glp-1-near-me",
      "best-glp-1-for-weight-loss",
      "glp-1-cost",
    ],
  },
];

export const LEARN_INDEX_META = {
  title: "Learn | Beema Health",
  h1: "Educational guides, organized by topic",
  description:
    "Cited educational hubs on GLP-1 weight-loss medicines, testosterone replacement, and menopausal hormone therapy. General information only, not medical advice.",
  ogDescription:
    "Free, unsigned educational guides on weight-loss medicines and hormone topics. Not medical advice, and not a substitute for a licensed clinician.",
} as const;

export const LEARN_INDEX_INTRO = [
  "This library is for people who want to read before they talk to a clinician. Articles are unsigned educational pieces with citations. They are not a diagnosis, a prescription, or a promise of results.",
  `Beema Health's live clinical offerings include telehealth medical weight loss, TRT (compounded enclomiphene), hairloss treatment, ED treatment, NAD+, and sermorelin care. ${LEARN_USA_ONLY_SENTENCE} ${LEARN_FIFTY_STATE_SENTENCE} Providers review intake and, when clinically appropriate and legally available, may prescribe compounded semaglutide or compounded tirzepatide for weight loss. ${COMPOUNDED_DISCLOSURE} Completing intake does not guarantee a prescription.`,
  "Testosterone replacement therapy (TRT) has its own educational hub describing the broader category of injectable, gel, and patch testosterone - Beema's own live TRT offering, compounded enclomiphene, works differently and has its own page. Menopausal hormone therapy (HRT) also has its own hub so that search topic has a home; that hub describes the medicine, not a Beema product you can start today.",
] as const;

export const WEIGHT_LOSS_HUB_META = {
  title: "GLP-1 Education for Weight Loss | Beema Health Learn",
  h1: "Understanding GLP-1 medications used for weight loss",
  eyebrow: "Weight-loss education",
  description:
    "Educational overview of GLP-1 medicines for weight loss, including online care, semaglutide, tirzepatide, and side effects. Not medical advice.",
  ogDescription:
    "A cited hub on how GLP-1 medicines work for weight loss, what online care involves, and how to read branded versus compounded products without mixing them up.",
} as const;

export const WEIGHT_LOSS_HUB_SECTIONS = [
  {
    id: "how-to-use-this-hub",
    heading: "How this hub is different from Beema's program pages",
    body: [
      "Beema's commercial pages explain the live telehealth program, pricing, and how to start an online visit. This hub is the educational layer: how glucagon-like peptide-1 (GLP-1) medicines work, what trials measured, and which questions are clinical rather than something a webpage can answer.",
      "If you already know you want to see whether treatment could be appropriate, the program overview, compounded semaglutide page, and compounded tirzepatide page are the right next clicks. Stay here when you want background first.",
    ],
  },
  {
    id: "how-glp1-works",
    heading: "How GLP-1 medicines affect appetite and weight",
    body: [
      "GLP-1 receptor agonists mimic a gut hormone that helps regulate insulin release, slow stomach emptying, and reduce appetite for many people. Dual agonists that also act on glucose-dependent insulinotropic polypeptide (GIP) receptors, such as tirzepatide, add a second incretin pathway. Those mechanisms are why labelled products are used for type 2 diabetes, chronic weight management, or both, depending on the specific approval.",
      "Trial averages are not a personal forecast. STEP-1 reported mean weight change with semaglutide 2.4 mg plus lifestyle intervention versus placebo plus lifestyle intervention. SURMOUNT-1 reported mean weight change with tirzepatide versus placebo. Individual results vary, people leave trials, and regain after stopping is well documented. No ethical clinic can guarantee how much weight a specific person will lose.",
    ],
  },
  {
    id: "online-glp1",
    heading: 'What "online GLP-1" care actually means',
    body: [
      "Yes, you can get GLP-1 care online in the United States. A legitimate program is telehealth: you complete a medical intake, a licensed provider reviews it, and a licensed pharmacy dispenses only if that provider says yes. Beema does that in all 50 states, for compounded semaglutide and compounded tirzepatide when they are legally available and clinically appropriate. Completing intake does not guarantee a prescription. You cannot lawfully add a GLP-1 to a cart like a vitamin, and Beema does not sell research peptides. Beema does not serve patients outside the United States.",
      "Beema's intake is hosted with our clinical partner. Geographic availability, compounding rules, and formulary options still depend on state law and clinical judgment. Cash-pay pricing is disclosed on the [compounded semaglutide](/semaglutide/) and [compounded tirzepatide](/tirzepatide/) pages. This site does not collect insurance information or promise that a plan will cover treatment.",
    ],
  },
  {
    id: "semaglutide-tirzepatide",
    heading: "Semaglutide and tirzepatide, in educational terms",
    body: [
      "Semaglutide is the active ingredient in more than one FDA-approved branded product, used at different doses and for different labelled indications. Tirzepatide is the active ingredient in other FDA-approved branded products. This hub will not treat those brand names as Beema products. Beema does not sell Wegovy, Zepbound, Ozempic, or Mounjaro.",
      "When a Beema provider prescribes, the live options are compounded semaglutide and compounded tirzepatide, only when legally available and clinically appropriate. Compounded medications are not FDA-approved and are not the same as those branded products. Lower price does not, by itself, establish medical necessity or therapeutic equivalence.",
    ],
  },
  {
    id: "safety",
    heading: "Safety facts this library will not skip",
    body: [
      "Common effects in trials include nausea, vomiting, diarrhea, constipation, and abdominal discomfort, especially while the dose is increasing. Labelled products carry a boxed warning about thyroid C-cell tumors based on rodent data, and they are contraindicated in people with a personal or family history of medullary thyroid carcinoma or multiple endocrine neoplasia syndrome type 2. Pancreatitis, gallbladder problems, and other serious risks appear in labelling. Read the safety page and talk with a clinician about your own history.",
      "Pregnancy, planned pregnancy, and breastfeeding change the risk-benefit picture. So do planned surgeries that require an empty stomach, because delayed gastric emptying can matter for anesthesia. Do not start, stop, or restack medicines based on a blog post.",
    ],
  },
] as const;

export const WEIGHT_LOSS_HUB_FAQS: readonly LearnFaq[] = [
  {
    question: "Is this the same as Beema's weight-loss program page?",
    answer:
      "No. The program page describes Beema's live telehealth service, cash-pay pricing, and how to start intake. This hub is educational: mechanisms, trial context, and topic clusters. Use both if you want background plus the actual offer.",
  },
  getGlp1OnlineWithBeemaFaq(),
  {
    question: "Can I get a GLP-1 prescription from this article?",
    answer:
      "No. Prescription medications require a licensed provider. Completing an online intake does not guarantee a prescription. This page cannot diagnose you or choose a medicine.",
  },
  {
    question:
      "Does Beema offer branded Wegovy, Zepbound, Ozempic, or Mounjaro?",
    answer:
      "No. Beema's live offering is compounded semaglutide and compounded tirzepatide when a licensed provider decides they are appropriate and they are legally available. " +
      COMPOUNDED_DISCLOSURE,
  },
  {
    question: "Will insurance cover online GLP-1 care through Beema?",
    answer:
      "Beema's marketing site describes cash-pay pricing. This library does not claim insurance coverage, prior authorization, or that a specific plan will pay for medication or visits.",
  },
];

export const WEIGHT_LOSS_HUB_SOURCES = [
  {
    label:
      "National Institute of Diabetes and Digestive and Kidney Diseases. Prescription medications to treat overweight and obesity.",
    href: "https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity",
  },
  {
    label:
      "Wilding JPH, et al. Once-Weekly Semaglutide in Adults with Overweight or Obesity. New England Journal of Medicine. 2021.",
    href: "https://www.nejm.org/doi/full/10.1056/NEJMoa2032183",
  },
  {
    label:
      "Jastreboff AM, et al. Tirzepatide Once Weekly for the Treatment of Obesity. New England Journal of Medicine. 2022.",
    href: "https://www.nejm.org/doi/full/10.1056/NEJMoa2206038",
  },
  {
    label:
      "U.S. Food and Drug Administration. Medications containing semaglutide marketed for type 2 diabetes or weight loss.",
    href: "https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/medications-containing-semaglutide-marketed-type-2-diabetes-or-weight-loss",
  },
  {
    label:
      "U.S. Food and Drug Administration. FDA intends to take action against unapproved GLP-1 drugs for weight loss (February 6, 2026).",
    href: "https://www.fda.gov/news-events/press-announcements/fda-intends-take-action-against-non-fda-approved-glp-1-drugs",
  },
] as const;

export const TRT_HUB_META = {
  title: "TRT Education | Beema Health Learn",
  h1: "Testosterone replacement therapy: an educational overview",
  eyebrow: "Educational overview",
  description:
    "Educational overview of testosterone replacement therapy, including who guidelines consider, how diagnosis works, and key risks. Beema's live TRT offering is compounded enclomiphene, a related but distinct treatment - see the TRT page for details.",
  ogDescription:
    "Unsigned education on TRT and hypogonadism. Beema's live TRT offering is compounded enclomiphene, which works differently than the injectable, gel, or patch testosterone described on this page.",
} as const;

export const TRT_HUB_SECTIONS = [
  {
    id: "status",
    heading: "What Beema actually offers",
    body: [
      "This hub is a general educational overview of testosterone replacement therapy as described in clinical guidelines - typically intramuscular injections, transdermal gels, or patches that replace testosterone directly. Beema Health's live TRT offering is different: compounded enclomiphene, an oral medication that encourages the body to produce more of its own testosterone rather than replacing it. See Beema's TRT page for enclomiphene-specific care, pricing, and eligibility. A licensed provider decides, case by case, whether enclomiphene or any treatment is appropriate; prescribing is never guaranteed.",
    ],
  },
  {
    id: "what-it-is",
    heading: "What testosterone replacement therapy is",
    body: [
      "Testosterone replacement therapy is prescription treatment for men with confirmed testosterone deficiency (hypogonadism) and compatible symptoms, after a clinician has ruled out other causes and documented low morning testosterone on repeat testing. It is not an over-the-counter wellness product, and it is not indicated as a general anti-aging routine.",
      'Formulations in US practice include intramuscular injections, transdermal gels or patches, and other licensed products. Dose, monitoring, and whether treatment should continue are clinical decisions. Online "optimization" marketing often skips the diagnostic steps professional guidelines require.',
    ],
  },
  {
    id: "who-guidelines",
    heading: "Who guidelines consider, and who they do not",
    body: [
      "The Endocrine Society recommends testosterone therapy for men with symptomatic hypogonadism when the diagnosis is confirmed. Guidelines generally advise against starting testosterone for age-related decline alone without a documented deficiency, and they flag conditions where treatment is contraindicated or requires extra caution, including prostate or breast cancer in many scenarios, unevaluated prostate nodules, elevated hematocrit, untreated severe sleep apnea, and desire for near-term fertility.",
      "The US Food and Drug Administration has cautioned against using testosterone products for low testosterone due solely to aging, and labelling includes cardiovascular and other safety information that a prescriber has to weigh. This paragraph is a pointer to those sources, not a personal screening.",
    ],
  },
  {
    id: "risks",
    heading: "Monitoring and risks readers should know exist",
    body: [
      "Clinicians who prescribe testosterone typically monitor hematocrit, prostate-specific antigen when appropriate, testosterone levels, and symptoms. Erythrocytosis, edema, acne, reduced sperm production, and untreated sleep apnea getting worse are among the issues discussed in guidelines. Fertility plans matter because exogenous testosterone can suppress spermatogenesis.",
      "If you think you might have hypogonadism, the next step is a clinician who can order the right tests, not a marketing quiz. Beema's learn library will not collect those results.",
    ],
  },
] as const;

export const TRT_HUB_FAQS: readonly LearnFaq[] = [
  {
    question: "Does Beema currently offer a TRT intake?",
    answer:
      "Beema offers compounded enclomiphene, a related but distinct treatment that encourages the body to produce more of its own testosterone rather than replacing it directly, unlike the injectable, gel, or patch testosterone described on this page. See Beema's TRT page for enclomiphene-specific care, pricing, and eligibility. A licensed provider decides, case by case, whether it's appropriate; prescribing is never guaranteed.",
  },
  {
    question: "Is TRT the same as a GLP-1 weight-loss program?",
    answer:
      "No. They are different medicines, different diagnoses, and different monitoring. Beema's compounded enclomiphene program is separate from its GLP-1 weight-loss care.",
  },
  {
    question: "Where should I go if I need testosterone evaluated?",
    answer:
      "Talk with a licensed clinician, often in endocrinology, urology, or primary care, who can interpret morning testosterone assays and your history. If you're specifically interested in Beema's compounded enclomiphene program, see Beema's TRT page - a licensed provider there reviews your intake and independently decides whether it may be appropriate.",
  },
];

export const TRT_HUB_SOURCES = [
  {
    label:
      "Bhasin S, et al. Testosterone Therapy in Men With Hypogonadism: An Endocrine Society Clinical Practice Guideline. Journal of Clinical Endocrinology & Metabolism. 2018.",
    href: "https://academic.oup.com/jcem/article/103/5/1715/4939465",
  },
  {
    label:
      "U.S. Food and Drug Administration. FDA cautions about using testosterone products for low testosterone due to aging.",
    href: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-fda-cautions-about-using-testosterone-products-low-testosterone-due",
  },
  {
    label:
      "American Urological Association. Evaluation and Management of Testosterone Deficiency.",
    href: "https://www.auanet.org/guidelines-and-quality/guidelines/testosterone-deficiency-guideline",
  },
] as const;

export const HRT_HUB_META = {
  title: "HRT Education | Beema Health Learn",
  h1: "Menopausal hormone therapy: an educational overview",
  eyebrow: "Educational only - not a Beema product",
  description:
    "Educational overview of menopausal hormone therapy, including benefits, risks, and guideline context. Beema does not offer HRT today.",
  ogDescription:
    "Unsigned education on menopausal hormone therapy. Beema's live clinical offering is medical weight-loss care, not HRT.",
} as const;

export const HRT_HUB_SECTIONS = [
  {
    id: "status",
    heading: "Beema does not offer HRT today",
    body: [
      "This hub is educational. Beema Health is not currently offering menopausal hormone therapy, estrogen or progesterone prescriptions for menopause, or an HRT intake. There is no HRT price list and no patient reviews of an HRT product here, because that product does not exist at Beema yet. Our live offering remains provider-reviewed medical weight-loss care.",
    ],
  },
  {
    id: "what-it-is",
    heading: "What menopausal hormone therapy is",
    body: [
      'Menopausal hormone therapy (often called HRT in public search) uses prescription estrogen, sometimes with a progestogen, to treat bothersome menopause symptoms such as vasomotor symptoms, and in selected cases to help prevent osteoporosis. It is not the same as testosterone replacement in men, and it is not a compounding-clinic "bioidentical" marketing package by default. FDA-approved products have labelling a clinician is expected to know.',
      "Route (oral, transdermal), dose, and whether a progestogen is required for people with a uterus are individualized. Self-directed hormone shopping, including unregulated pellets marketed online, is a different and often poorly evidenced path.",
    ],
  },
  {
    id: "evidence",
    heading: "How the evidence is usually framed",
    body: [
      "The Women's Health Initiative changed how clinicians talk about hormone therapy. Later analyses and The Menopause Society's 2022 position statement emphasize timing, age, formulation, and that for many healthy people under 60 or within 10 years of menopause, benefits may outweigh risks for bothersome vasomotor symptoms. That is a population-level statement, not a personal clearance.",
      "Breast cancer, cardiovascular disease, venous thromboembolism, and stroke risk vary with age, years since menopause, dose, and whether estrogen is combined with a progestogen. A learn page cannot compute your risk.",
    ],
  },
  {
    id: "not-weight-loss",
    heading: "Hormone therapy is not a GLP-1 weight-loss program",
    body: [
      "Weight can change around menopause for many reasons. Hormone therapy is not approved as a primary obesity drug the way some GLP-1 receptor agonists are for chronic weight management. Mixing those search intents is how people end up on the wrong page. If your question is about GLP-1 medicines, use the weight-loss learn hub and Beema's program pages.",
    ],
  },
] as const;

export const HRT_HUB_FAQS: readonly LearnFaq[] = [
  {
    question: "Can I start HRT with Beema?",
    answer:
      "No. Beema does not currently offer menopausal hormone therapy or an HRT intake.",
  },
  {
    question: "Is HRT the same as TRT?",
    answer:
      "No. In this library, HRT means menopausal hormone therapy. TRT means testosterone replacement for documented hypogonadism in men. They are different treatments with different evidence and monitoring.",
  },
  {
    question: "Does this page recommend compounded bioidentical hormones?",
    answer:
      'No. This hub does not sell hormones and does not claim that custom-compounded "bioidentical" products are equivalent to FDA-approved menopausal hormone therapy.',
  },
];

export const HRT_HUB_SOURCES = [
  {
    label: "The Menopause Society. 2022 Hormone Therapy Position Statement.",
    href: "https://menopause.org/wp-content/uploads/professional/nams-2022-hormone-therapy-position-statement.pdf",
  },
  {
    label:
      "U.S. Food and Drug Administration. Menopause: medicines to help you.",
    href: "https://www.fda.gov/consumers/womens-health-topics/menopause",
  },
  {
    label:
      "National Heart, Lung, and Blood Institute. Women's Health Initiative.",
    href: "https://www.nhlbi.nih.gov/science/womens-health-initiative-whi",
  },
  {
    label:
      "American College of Obstetricians and Gynecologists. Hormone therapy for menopause.",
    href: "https://www.acog.org/womens-health/faqs/hormone-therapy-for-menopause",
  },
] as const;

export type LearnHubCopy = {
  vertical: LearnVertical;
  meta: {
    title: string;
    h1: string;
    eyebrow: string;
    description: string;
    ogDescription: string;
  };
  sections: readonly { id: string; heading: string; body: readonly string[] }[];
  faqs: readonly LearnFaq[];
  sources: readonly { label: string; href: string }[];
  productLive: boolean;
};

export const LEARN_HUBS: Record<LearnVertical, LearnHubCopy> = {
  "weight-loss": {
    vertical: "weight-loss",
    meta: WEIGHT_LOSS_HUB_META,
    sections: WEIGHT_LOSS_HUB_SECTIONS,
    faqs: WEIGHT_LOSS_HUB_FAQS,
    sources: WEIGHT_LOSS_HUB_SOURCES,
    productLive: true,
  },
  trt: {
    vertical: "trt",
    meta: TRT_HUB_META,
    sections: TRT_HUB_SECTIONS,
    faqs: TRT_HUB_FAQS,
    sources: TRT_HUB_SOURCES,
    productLive: false,
  },
  hrt: {
    vertical: "hrt",
    meta: HRT_HUB_META,
    sections: HRT_HUB_SECTIONS,
    faqs: HRT_HUB_FAQS,
    sources: HRT_HUB_SOURCES,
    productLive: false,
  },
};
