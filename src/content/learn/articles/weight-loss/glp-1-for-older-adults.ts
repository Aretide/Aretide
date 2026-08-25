import type { LearnArticle } from "../../types";

export const article: LearnArticle = {
  vertical: "weight-loss",
  slug: "glp-1-for-older-adults",
  title: "GLP-1s for Older Adults: Label Data, Muscle, Falls",
  h1: "Older adults and GLP-1 medicines: what trial geriatric sections actually say",
  description:
    "Labels report no overall effectiveness gap at 65 and older, with extra caution at 75+, for dehydration, muscle loss, other medicines, and surgery.",
  keywords: [
    "GLP-1 for older adults",
    "semaglutide over 65",
    "Zepbound elderly",
    "Wegovy geriatric use",
    "GLP-1 sarcopenia",
    "GLP-1 falls older adults",
  ],
  cluster: "life-stage",
  relatedSlugs: [
    "glp-1-age-limit",
    "glp-1-and-thyroid",
    "glp-1-before-surgery",
    "glp-1-and-antidepressants",
    "glp-1-side-effects",
    "water-intake-on-glp-1",
    "exercise-on-glp-1",
    "glp-1-for-weight-loss",
  ],
  moneyPageHrefs: ["/weight-loss", "/glp-1"],
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  sources: [
    {
      label:
        "Wegovy (semaglutide) prescribing information. Novo Nordisk. Geriatric use, including cardiovascular-outcomes trial observations in ages 75 and older.",
      href: "https://www.novo-pi.com/wegovy.pdf",
    },
    {
      label:
        "Zepbound (tirzepatide) prescribing information. Eli Lilly. Geriatric use in weight-reduction trials.",
      href: "https://pi.lilly.com/us/zepbound-uspi.pdf",
    },
    {
      label:
        "Ozempic (semaglutide) prescribing information. Novo Nordisk. Geriatric use in type 2 diabetes.",
      href: "https://www.novo-pi.com/ozempic.pdf",
    },
    {
      label:
        "U.S. Department of Health and Human Services. Physical Activity Guidelines for Americans, 2nd edition. Older-adult balance and muscle-strengthening.",
      href: "https://odphp.health.gov/paguidelines/second-edition/",
    },
    {
      label:
        "American Geriatrics Society Health in Aging Foundation. Avoiding overmedication and harmful drug reactions in older adults.",
      href: "https://www.healthinaging.org/tools-and-tips/avoiding-overmedication-and-harmful-drug-reactions",
    },
    {
      label:
        "Wilding JPH, et al. Once-weekly semaglutide in adults with overweight or obesity (STEP 1). N Engl J Med. 2021. Lean-mass discussion in the context of substantial weight reduction.",
      href: "https://doi.org/10.1056/NEJMoa2032183",
    },
  ],
  faqs: [
    {
      question: "Are GLP-1 medicines safe after age 65?",
      answer:
        "“Safe” is individual. Zepbound’s weight-reduction trials included people 65 and older (about 9% of treated patients in a pooled analysis) and reported no overall differences in safety or effectiveness versus younger adults, with few patients 75 and older. Wegovy’s geriatric section similarly reports no overall effectiveness difference at 65+, while the cardiovascular-outcomes trial noted more serious adverse reactions in people 75+ (drug and placebo) and more hip and pelvis fractures on Wegovy than placebo in that oldest group. A clinician still has to review kidneys, falls, appetite, and other drugs.",
    },
    {
      question: "Will I lose too much muscle?",
      answer:
        "Any sizable weight loss includes some lean tissue. That matters more if you already have sarcopenia, use a cane, or have had falls. Resistance training and adequate protein are the usual lifestyle countermeasures (see exercise and diet articles). They are not a guarantee. Very low intake from nausea is a reason to slow titration, not a reason to “push through hunger.”",
    },
    {
      question: "Do I need a lower dose because I am older?",
      answer:
        "Labels describe standard titration schedules. They do not automatically cut the dose at 65. Clinicians often go slower if GI effects, dehydration, or frailty appear. Do not split pens or skip to a blog microdose. See dosing education on this site for how labeled schedules work, not for a homemade schedule.",
    },
    {
      question: "What about my other prescriptions?",
      answer:
        "Delayed gastric emptying can affect oral medicines. Diuretics, blood-pressure drugs, insulin, and sulfonylureas can become too strong if you eat and drink much less. That is a medication-reconciliation job. Bring an updated list to the prescriber and to any hospital admission.",
    },
    {
      question:
        "I have an upcoming joint replacement. Should I stop the GLP-1?",
      answer:
        "Do not stop on your own. Tell the surgeon and anesthesiologist. Multi-society guidance on GLP-1s and procedures has shifted toward risk-based planning rather than a single hold rule. See the surgery article. Aspiration risk is the issue, not a cosmetic timeline.",
    },
    {
      question: "Is there an upper age cutoff?",
      answer:
        "No labeled birthday cutoff. Very old, frail, or nursing-home patients were not the core of obesity registrational trials. Goals may shift toward function, diabetes control, or heart-risk reduction rather than a large percentage of body weight. That is a shared decision.",
    },
  ],
  sections: [
    {
      id: "what-geriatric-sections-say",
      heading: "What “geriatric use” in the PI actually reports",
      body: [
        "FDA labels include a Geriatric Use subsection because older adults are often under-represented in trials. For Zepbound weight-reduction studies, about 9% of treated patients were 65 or older and 0.5% were 75 or older. The PI states no overall differences in safety or effectiveness were observed between patients 65+ and younger adults. OSA trials did not include enough people 65+ to judge.",
        "Wegovy’s injection trials for weight reduction included about 9% aged 65 to under 75 and 1% aged 75+. In a cardiovascular-outcomes trial, a much larger share were 65+. No overall effectiveness gap at 65+ was described. Patients 75+ reported more serious adverse reactions overall (both arms) and, on Wegovy, more hip and pelvis fractures than placebo in that age band. That is a signal to talk about bone health and falls, not a universal ban.",
        "This article is educational. It does not start or stop your medicine.",
      ],
    },
    {
      id: "dehydration-kidneys",
      heading: "Dehydration, kidneys, and appetite that is “too good”",
      body: [
        "Thirst is a weaker alarm system with age. GLP-1 labels already warn that vomiting and diarrhea can lead to volume depletion and kidney injury. If an older adult cannot keep fluids down, that is a same-day clinical problem, especially on ACE inhibitors, ARBs, SGLT2 inhibitors, or diuretics.",
        "Profound appetite loss that leaves protein intake near zero is not a success. Clinicians may pause titration, screen for depression, and look at dentition, taste, and social support. See the water-intake article for labeled fluid counseling, not for a gallon challenge.",
      ],
    },
    {
      id: "muscle-falls",
      heading: "Muscle, bones, and falls",
      body: [
        "Physical Activity Guidelines for older adults emphasize muscle-strengthening and balance in addition to aerobic activity. Rapid weight loss without resistance work can make a previously compensated gait unstable. Home hazards (rugs, poor lighting) matter more when body mass and muscle change together.",
        "Wegovy’s fracture observation in ages 75+ is a reason to mention bone density, vitamin D, and fall history at a visit. It is not a reason to start unsupervised high-impact training.",
      ],
      bullets: [
        "Ask about sit-to-stand, stairs, and prior falls at each visit.",
        "Prioritize twice-weekly strength if the clinician agrees you are stable enough.",
        "Review blood-pressure medicines if you feel lightheaded.",
        "Do not interpret a fast-dropping scale as automatically better.",
      ],
    },
    {
      id: "polypharmacy",
      heading: "Polypharmacy and delayed emptying",
      body: [
        "Many older adults take a long oral list. GLP-1 delayed emptying can change absorption of some drugs. Narrow-index medicines (including some heart-rhythm and anti-seizure drugs) may need extra monitoring. Oral semaglutide has a documented levothyroxine exposure increase in a drug-interaction study; thyroid dosing is a clinician/lab task. See the thyroid article.",
        "Antidepressants are common in this age group. Do not stop them because appetite fell. See the antidepressants article. Alcohol plus a GLP-1 plus a sedating medicine is a fall risk.",
      ],
    },
    {
      id: "cognition-and-constipation",
      heading: "Constipation, confusion, and hospital admissions",
      body: [
        "Severe constipation plus opioid pain medicine after a fall is a common hospital story. GLP-1s already list constipation. Add a bowel plan before elective orthopedic surgery rather than after. See the surgery article for aspiration planning, which is a separate issue from bowels but often appears on the same pre-op list.",
        "New confusion in an older adult who is vomiting on a GLP-1 is dehydration, infection, or medication toxicity until a clinician says otherwise. Do not attribute it to “the shot making them lose weight fast.” Bring the pen, the other bottles, and a blood-pressure log if you have one.",
        "If home staff or family notice that the person has stopped eating protein and spends the day in a chair, that is a function emergency as much as a scale success. Resistance training and a dietitian, if available, belong in the plan. The exercise article’s sedentary-start notes apply here with extra balance caution.",
      ],
    },
    {
      id: "goals",
      heading: "Goals that are not a percentage on a chart",
      body: [
        "Some older adults use these medicines for diabetes or for labeled cardiovascular-risk reduction rather than for a clothing size. Those indications have their own benefit-risk stories. A marketing page cannot choose among them.",
        "If you are exploring adult telehealth weight management, the visit still has to cover MTC/MEN2 history, pancreatitis, gallbladder disease, retinopathy if you have diabetes, and surgery plans. Age is one line in that review, not the whole review.",
      ],
    },
  ],
};
