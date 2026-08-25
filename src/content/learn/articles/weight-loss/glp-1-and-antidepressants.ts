import type { LearnArticle } from "../../types";

export const article: LearnArticle = {
  vertical: "weight-loss",
  slug: "glp-1-and-antidepressants",
  title: "GLP-1s and Antidepressants: Absorption and Label Updates",
  h1: "Antidepressants and GLP-1s: delayed emptying, not a DIY mix-and-match",
  description:
    "GLP-1s can delay absorption of oral medicines. FDA has evaluated suicidality reports and some labels changed. Never stop an antidepressant alone.",
  keywords: [
    "GLP-1 and antidepressants",
    "semaglutide SSRI",
    "Ozempic depression",
    "tirzepatide antidepressant interaction",
    "GLP-1 suicidal thoughts FDA",
    "Wegovy mood",
  ],
  cluster: "medical-considerations",
  relatedSlugs: [
    "glp-1-and-thyroid",
    "glp-1-before-surgery",
    "glp-1-and-alcohol",
    "glp-1-side-effects",
    "glp-1-for-older-adults",
    "glp-1-for-weight-loss",
    "online-glp-1",
    "glp-1-nausea",
  ],
  moneyPageHrefs: ["/weight-loss", "/glp-1"],
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  sources: [
    {
      label:
        "Wegovy (semaglutide) prescribing information. Novo Nordisk. Delayed gastric emptying and oral medications; recent major changes including removal of the suicidal behavior warning in January 2026.",
      href: "https://www.novo-pi.com/wegovy.pdf",
    },
    {
      label:
        "Zepbound (tirzepatide) prescribing information. Eli Lilly. Oral medication absorption, including oral contraceptives; gastrointestinal warnings.",
      href: "https://pi.lilly.com/us/zepbound-uspi.pdf",
    },
    {
      label:
        "U.S. Food and Drug Administration. Drug Safety Communication: update on FDA's ongoing evaluation of reports of suicidal thoughts or actions in patients taking medicines approved for type 2 diabetes and obesity.",
      href: "https://www.fda.gov/safety/medical-product-safety-information/certain-type-medicines-approved-type-2-diabetes-and-obesity-drug-safety-communication-update-fdas",
    },
    {
      label:
        "Ozempic (semaglutide) prescribing information. Novo Nordisk. Drug interactions: oral medications and delayed gastric emptying.",
      href: "https://www.novo-pi.com/ozempic.pdf",
    },
    {
      label:
        "National Institute of Mental Health. Depression. Treatment should be supervised; do not stop antidepressants suddenly.",
      href: "https://www.nimh.nih.gov/health/topics/depression",
    },
  ],
  faqs: [
    {
      question: "Can I take semaglutide or tirzepatide with an SSRI or SNRI?",
      answer:
        "Many people take both under clinician supervision. U.S. GLP-1 labels do not typically list SSRIs as a contraindication. They do say delayed gastric emptying may affect oral medicines and that drugs with a narrow therapeutic index may need extra monitoring. Whether your pair is appropriate depends on the specific antidepressant, other medicines, and your history. This is not a combination permit.",
    },
    {
      question: "Do GLP-1s cause depression or suicidal thoughts?",
      answer:
        "FDA evaluated postmarketing reports of suicidal thoughts or actions with certain GLP-1 receptor agonists and, in its 2024 update, said preliminary evaluation did not find a causal link, while still encouraging reporting. Product labels can change. Wegovy’s highlights list a January 2026 removal of a suicidal behavior and ideation warning. That administrative change is not a promise about your mood. Tell a clinician about new or worsening depression, and seek emergency help for suicidal thoughts.",
    },
    {
      question: "Should I stop my antidepressant so the GLP-1 works better?",
      answer:
        "No. Abruptly stopping many antidepressants can cause withdrawal symptoms and relapse. Weight change is not a reason to unsupervised taper. NIMH materials emphasize that depression treatment should be clinician-guided. If appetite falls a lot, the mental-health prescriber may still want to adjust timing or formulation, but that is their call.",
    },
    {
      question: "Could a GLP-1 make my antidepressant too weak or too strong?",
      answer:
        "Theoretically, slower emptying could change how fast an oral tablet reaches the intestine. Clinical pharmacology studies with weekly injectable semaglutide have not shown large effects on several oral probe drugs, while oral semaglutide has more documented absorption interactions (including levothyroxine). Antidepressants vary. If your mood or side effects change after a GLP-1 start or dose increase, tell both prescribers rather than doubling a psychiatric dose yourself.",
    },
    {
      question: "What about bupropion, MAOIs, or tricyclics?",
      answer:
        "Those classes have their own interaction lists (including other serotonergic drugs, diet restrictions for MAOIs, and seizure risk for bupropion). A GLP-1 does not erase those rules. Seizure risk, eating-disorder history, and alcohol use need a specialist review. Do not combine internet “stack” advice.",
    },
    {
      question: "I drink to cope. Is that relevant?",
      answer:
        "Yes. Alcohol can worsen depression, interact with some antidepressants, and overlap with GLP-1 pancreatitis and hypoglycemia warnings. See the alcohol article. Be honest with clinicians. This site does not collect mental-health screening as PHI on a marketing quiz.",
    },
    {
      question:
        "If I feel better because I am losing weight, can I drop the antidepressant?",
      answer:
        "Feeling physically lighter is not the same as remitted major depression. Tapering, if appropriate, is slow and supervised. Relapse can occur months later. Do not use a scale as a psychiatric endpoint.",
    },
  ],
  sections: [
    {
      id: "not-a-mixology-guide",
      heading: "Two prescriptions, two clinicians, one medication list",
      body: [
        "People search “Ozempic and Zoloft” hoping for a green light. The honest version is: obesity and depression often coexist, both are treated with oral and injectable medicines, and GLP-1 labels mainly warn that delayed gastric emptying can change oral-drug absorption. They do not replace a psychiatrist’s plan.",
        "This article is educational. It is not a direction to start a GLP-1, stop an antidepressant, or change a dose. If you have thoughts of suicide or self-harm, call 988 in the United States or use local emergency services. Do not wait for a weight-loss visit.",
      ],
    },
    {
      id: "absorption",
      heading: "Delayed emptying is the main labeled interaction theme",
      body: [
        "Wegovy, Ozempic, Zepbound, and Mounjaro slow gastric emptying. Labels tell clinicians to consider extra monitoring for oral medicines that need careful levels. Weekly injectable semaglutide drug-interaction work has often shown little change for several oral probes, but that is not a blanket “all tablets are unaffected” statement. Oral semaglutide (SNAC) has more notable absorption findings.",
        "Extended-release psychiatric medicines and medicines taken on an empty stomach for a reason may need a pharmacist review when a GLP-1 starts. Bring the actual bottles, not memory.",
      ],
    },
    {
      id: "mood-and-fda",
      heading: "Mood, FDA’s review, and moving labels",
      body: [
        "After postmarketing reports, FDA publicly discussed suicidal thoughts or actions with certain GLP-1 receptor agonists. The January 2024 FDA update described a preliminary evaluation that did not find a causal association, while asking manufacturers and the public to keep reporting. Labels are living documents. Wegovy’s highlights note that a suicidal behavior and ideation warning was removed in January 2026. Always read the PI dated on your carton, not a screenshot from last year.",
        "Weight reduction, GI misery, sleep change, and life stress can all move mood in either direction. New anhedonia, hopelessness, or agitation deserves a prompt mental-health contact even if a boxed warning is absent.",
      ],
    },
    {
      id: "do-not-stop",
      heading: "Do not stop the antidepressant to “simplify”",
      body: [
        "Internet threads sometimes blame SSRIs for weight and suggest stopping them when a GLP-1 starts. That is a relapse risk. Some antidepressants are associated with weight change; that is a reason to review options with a psychiatrist, not to cold-turkey a medicine that is keeping someone well.",
        "If nausea makes swallowing pills hard, ask about timing with meals, alternative formulations, or a slower GLP-1 titration. Do not crush extended-release psychiatric tablets unless the label allows it.",
      ],
      bullets: [
        "Keep one shared medication list for every clinician and pharmacist.",
        "Report mood changes at GLP-1 follow-up and at mental-health follow-up.",
        "Avoid alcohol binges; see the alcohol article.",
        "Never use a marketing form to describe suicide risk in free text meant for ads.",
      ],
    },
    {
      id: "special-populations",
      heading: "Older adults, pregnancy, and surgery",
      body: [
        "Older adults may be more sensitive to anticholinergic or sedating antidepressants plus dehydration from GLP-1 GI effects. See the older-adults article. Pregnancy and lactation add separate rules for both drug classes; see breastfeeding and postpartum articles.",
        "Before surgery, anesthesia teams need both lists. Some antidepressants interact with certain pain or anesthesia medicines. GLP-1s add aspiration-risk planning. See the surgery article. Do not hold either class based on a packing list.",
      ],
    },
  ],
};
