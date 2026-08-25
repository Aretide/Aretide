import type { LearnArticle } from "../../types";

export const article: LearnArticle = {
  vertical: "weight-loss",
  slug: "glp-1-dizziness",
  title: "GLP-1 Dizziness: Lightheadedness, Fluids, and Care",
  h1: "Dizziness and lightheadedness on GLP-1s",
  description:
    "Why dizziness appears in GLP-1 labels, how dehydration and blood pressure can contribute, hypoglycemia risks, and when lightheadedness needs urgent care.",
  keywords: [
    "glp-1 dizziness",
    "semaglutide dizziness",
    "tirzepatide dizziness",
    "wegovy dizziness",
    "glp 1 side effects",
    "glp 1 treatment",
    "glp 1 weight loss",
  ],
  cluster: "side-effects",
  relatedSlugs: [
    "glp-1-side-effects",
    "glp-1-fatigue",
    "glp-1-nausea",
    "glp-1-urinary-changes",
    "water-intake-on-glp-1",
    "glp-1-dosing",
    "stopping-glp-1",
  ],
  moneyPageHrefs: ["/weight-loss", "/semaglutide", "/tirzepatide", "/glp-1"],
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  ctaId: "learn_weight_loss",
  sources: [
    {
      label:
        "Wegovy (semaglutide) injection Prescribing Information. Novo Nordisk. DailyMed.",
      href: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ee06186f-2aa3-4990-a760-757579d8f77b",
    },
    {
      label:
        "Zepbound (tirzepatide) injection Prescribing Information. Eli Lilly. DailyMed.",
      href: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=487cd7e7-434c-4925-99fa-aa80b1cc776b",
    },
    {
      label: "MedlinePlus. Dizziness.",
      href: "https://medlineplus.gov/ency/article/003093.htm",
    },
    {
      label: "NIDDK. Prescription Medications to Treat Overweight & Obesity.",
      href: "https://www.niddk.nih.gov/health-information/weight-management/prescription-medications-treat-overweight-obesity",
    },
    {
      label:
        "Wharton S, Calanna S, Davies M, et al. Gastrointestinal tolerability of once-weekly semaglutide 2.4 mg in adults with overweight or obesity. Diabetes, Obesity and Metabolism. 2021.",
      href: "https://doi.org/10.1111/dom.14551",
    },
  ],
  faqs: [
    {
      question: "Is dizziness a common GLP-1 side effect?",
      answer:
        "Yes, it is listed among common reactions. Wegovy adult trials reported dizziness in 8% of treated patients versus 4% on placebo. Zepbound tables report dizziness in about 4% to 5% versus 2% on placebo. Hypotension-related reactions and syncope were also more frequent with Wegovy than placebo in adult weight-reduction trials (hypotension 1.3% versus 0.4%; syncope 0.8% versus 0.2%).",
    },
    {
      question: "What causes dizziness on a GLP-1?",
      answer:
        "Volume depletion from nausea, vomiting, or diarrhea is a labeled pathway to both dizziness and acute kidney injury. Lower food intake, standing quickly, and blood-pressure medicines that are not adjusted as weight falls can contribute. In people using insulin or a sulfonylurea, hypoglycemia is another labeled risk that can present as lightheadedness. Inner-ear problems and anemia remain possible unrelated causes.",
    },
    {
      question: "When is GLP-1 dizziness an emergency?",
      answer:
        "Fainting, chest pain, a sudden severe headache, one-sided weakness, trouble speaking, irregular heartbeat, or dizziness with black stools or vomiting blood needs emergency care. Repeated falls are also urgent. Mild lightheadedness after standing that resolves quickly still deserves a clinician message if it is new after a dose change.",
    },
    {
      question: "Can blood-pressure medicines interact with GLP-1 dizziness?",
      answer:
        "Wegovy labeling notes that hypotension and orthostatic hypotension were seen more often in people on concomitant antihypertensive therapy. Weight loss and lower fluid intake can make a previously stable blood-pressure regimen too strong. Only the prescribing clinicians should adjust those medicines. Do not skip blood-pressure pills based on this article.",
    },
    {
      question: "Does drinking more water fix GLP-1 dizziness?",
      answer:
        "Replacing fluids is important when GI losses are the driver, and labels warn patients to avoid fluid depletion. Water is not a complete plan if the person cannot keep fluids down, if bleeding is present, or if glucose is low. Those situations need medical care, not a larger water bottle alone.",
    },
  ],
  sections: [
    {
      id: "dizziness-in-labels",
      heading: "Dizziness in GLP-1 prescribing information",
      body: [
        'Dizziness is easy to dismiss as "standing up too fast," but it is a labeled common reaction for Wegovy and appears in Zepbound trial tables above placebo. Lightheadedness can be orthostatic (worse on standing), metabolic (low glucose), or a sign of dehydration after days of poor intake.',
        "This page is educational. MedlinePlus lists many dizziness causes, from inner-ear conditions to heart rhythm problems. A GLP-1 start does not cancel those other diagnoses.",
      ],
    },
    {
      id: "volume-and-blood-pressure",
      heading: "Volume loss, blood pressure, and syncope",
      body: [
        "Wegovy labeling reports hypotension-related reactions in 1.3% of treated adults versus 0.4% on placebo, and syncope in 0.8% versus 0.2%. Some events were linked to GI fluid loss. People already on antihypertensives were more likely to have low-blood-pressure reactions. Zepbound tables include hypotension as an uncommon but higher-than-placebo event at some doses.",
        "As body weight falls, the same milligram of a diuretic or ACE inhibitor may have a larger effect. That is a reason clinicians monitor vitals during medical weight management. It is not a reason to self-discontinue heart or kidney medicines.",
      ],
    },
    {
      id: "glucose-and-other-drugs",
      heading: "Low blood sugar and other medicines",
      body: [
        "GLP-1 medicines lower glucose. The hypoglycemia risk rises when they are combined with insulin or a sulfonylurea, which both Wegovy and Zepbound labels emphasize. Shakiness, sweating, confusion, and dizziness can be low glucose until a check proves otherwise in people on those combinations.",
        'Alcohol, skipped meals, and extra activity without fuel can add to the problem. People without diabetes still should not assume dizziness is "just the shot" if they are vomiting and barely eating. Dehydration and electrolyte shifts can cause the same spinning sensation.',
      ],
    },
    {
      id: "kidney-overlap",
      heading: "Overlap with kidney warning signs",
      body: [
        "Acute kidney injury related to volume depletion is a labeled warning. Dizziness plus very little urine, confusion, or inability to drink is not a hydration-tip situation. It is a reason to seek care the same day. Older adults and people with existing kidney disease have less reserve.",
        "Persistent vomiting is the usual setup. Treating only the dizziness with rest, while GI losses continue, misses the cause. See the related urinary-changes article for more on kidney-risk counseling in labels.",
      ],
    },
    {
      id: "when-to-seek-care",
      heading: "When to seek care",
      body: [
        "Call emergency services for fainting with injury, chest pain, neurologic deficits, or severe shortness of breath. Contact a clinician promptly for new dizziness after a dose increase, repeated near-falls, or dizziness with palpitations. Bring a home blood-pressure log if you have one. This site does not collect those readings.",
        'Clinicians may hold a GLP-1 dose, evaluate labs, or coordinate with the clinician who manages blood-pressure or diabetes medicines. Do not increase the GLP-1 dose to "get used to" fainting. Titration is meant to improve GI tolerability, not to train the nervous system to ignore syncope.',
      ],
      bullets: [
        "Emergency: fainting, stroke symptoms, chest pain, severe breathlessness, vomiting blood.",
        "Same-day: cannot keep fluids down, very little urine, confusion, repeated near-falls.",
        "Diabetes on insulin or a sulfonylurea: check glucose when dizzy.",
      ],
    },
    {
      id: "practical-context",
      heading: "Practical context while waiting for a visit",
      body: [
        "Until a clinician advises otherwise, many people are told to rise slowly from sitting, avoid driving if they feel faint, and sip fluids if they can tolerate them. Those are general safety ideas, not a cure. If symptoms started after an injection-site reaction with rash and swelling, think allergic reaction and seek urgent care.",
        "Prescription GLP-1 treatment requires a licensed provider. Dizziness that interferes with work or walking is a valid reason to message that provider rather than waiting for the next refill date.",
      ],
    },
  ],
};
