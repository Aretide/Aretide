# Semantic Content Cluster / Cannibalization Audit - beemahealth.com

Category: Content Architecture (semantic clustering, cannibalization, pillar/spoke, internal linking)
Scope: `/learn/weight-loss/` library (~90 URLs) plus the three top-level treatment pillars
(`/glp-1/`, `/semaglutide/`, `/tirzepatide/`) and the standalone `/glp-1-houston/` landing page.

## Method and limitations

- Fetched and parsed live HTML (title, meta description, H1, H2 structure, word count, internal
  link graph) for the 7-page geo cluster, a 10-page sample of the medication-family cluster, and
  ~20 additional pages flagged as slug-level overlap risks from a structural pass over the full
  `/learn/weight-loss/` URL list.
- Attempted WebSearch-based SERP overlap checks for the highest-risk head terms (`glp-1 houston`,
  `semaglutide houston`, `tirzepatide houston`, `glp-1 texas telehealth`, `semaglutide for weight
  loss`, `glp-1 for weight loss`, `best glp-1 for weight loss`, `glp-1 weight loss program`).
  **Beemahealth.com did not appear in any of these general web-index results** - the space is
  dominated by med-spa/local-clinic competitors and telehealth rivals with more authority. This
  means true top-10 Google SERP overlap could not be measured directly; this audit instead relies
  on structural signals (title/H1/meta distinctness, on-page angle, internal link graph) as the
  primary evidence, which is a reasonable proxy but not a substitute for GSC/rank-tracker data once
  available.
- No full pairwise SERP overlap matrix was run across the entire 90-page library per the assigned
  scope (reasonable WebSearch budget); the structural pass below is slug/title-based only.

---

## Finding 1 (Info/Low): Geo cluster is genuinely differentiated by scope and intent, not cannibalizing

**Severity: Low / Info**

The 7-page geo cluster is:
- `/glp-1-houston/` (top-level, commercial pillar - "Cash-Pay" pricing page)
- `/learn/weight-loss/glp-1-in-houston/`, `glp-1-in-texas/`, `semaglutide-in-houston/`,
  `semaglutide-in-texas/`, `tirzepatide-in-houston/`, `tirzepatide-in-texas/` (informational spokes)

Evidence of real differentiation:
- **Houston vs. Texas is a genuine scope split, not a synonym pair.** Houston pages address
  metro-specific friction (Medical Center traffic/commutes, Gulf Coast heat/humidity as a
  storage/GI variable, "cheapest Houston vial" price-shopping traps). Texas pages address
  statewide framing (Chapter 111 telemedicine law, rural access, "Metro Texas is not one
  market"). These map to distinct real search intents (a Houston resident searches "Houston,"
  a resident of Amarillo or Lubbock searches "Texas").
- **The content explicitly self-disambiguates.** Two H2s were found verbatim addressing
  cannibalization risk head-on: *"What a Houston search actually resolves to"*
  (semaglutide-in-houston, tirzepatide-in-houston) and *"Why semaglutide in Texas is not a
  duplicate of GLP-1 in Texas"* (semaglutide-in-texas). This indicates the content team was
  already aware of the overlap risk and wrote against it deliberately.
- **Drug-specificity is a legitimate third axis.** `glp-1-in-houston` (category-level),
  `semaglutide-in-houston` (molecule-level), `tirzepatide-in-houston` (molecule-level) target
  different medication-intent keywords layered on top of the same city.

**Recommendation:** No consolidation needed. This cluster is a good model for how to do
geo-content-marketing (not local/SAB) without cannibalizing - keep it as the reference pattern
for any future geo expansion (e.g. if Beema adds Dallas/Austin pages later).

---

## Finding 2 (High): Real, unresolved keyword overlap between `/glp-1-houston/` and `/learn/weight-loss/glp-1-in-houston/`

**Severity: High**

These are two separate URLs both primary-targeting the "GLP-1 Houston" keyword:

| URL | Title | Meta description | Intent |
|---|---|---|---|
| `/glp-1-houston/` | "GLP-1 Weight Loss Care in Houston \| Cash-Pay \| Beema Health" | "Houston GLP-1 weight-loss care online... Semaglutide from $99/mo · Tirzepatide from $199/mo." | Commercial/transactional pillar |
| `/learn/weight-loss/glp-1-in-houston/` | "GLP-1 Telehealth for Houston-Area Adults" | "Houston adults can use telehealth GLP-1 visits instead of driving to a clinic..." | Informational spoke |

This is the pillar + informational-spoke pattern used correctly for `/glp-1/`, `/semaglutide/`,
`/tirzepatide/` elsewhere on the site (a commercial hub with a "why/how" article feeding it), and
both pages do reciprocally link to each other and both are canonicalized to themselves (confirmed
- no accidental duplicate-canonical issue). So structurally this is defensible.

The risk is keyword-level, not structural: "glp-1 houston" and "glp-1 in houston" are near-identical
query strings with almost no differentiating modifier (unlike Houston-vs-Texas, or brand-vs-molecule
elsewhere on the site). A searcher typing either phrase has no obvious signal to Google about which
page they want, and Google may compress rankings to show only one of the two - most likely the
pillar, since it is the older/more-linked page, or oscillate between them (classic cannibalization
symptom). Because Beema does not currently rank in observable results for this term at all (see
Method note), the practical exposure today is low, but this is exactly the setup that produces
silent cannibalization once the domain gains authority for the term.

**Recommendation:**
1. Retitle the informational spoke's H1/title away from the bare "GLP-1 Houston" framing toward its
   actual differentiated angle, which is genuinely good ("telehealth vs. driving to a clinic,"
   commute/heat/logistics) - e.g. title "Do You Need to Drive for GLP-1 Care in Houston?" or similar,
   keeping "Houston" as a modifier rather than the lead keyword phrase, so it doesn't compete
   1:1 with the commercial pillar's primary keyword.
2. Confirm the target query for `/glp-1-houston/` (the commercial pillar) is the one that should own
   the exact-match "glp-1 houston" / "glp-1 in houston" head term, and treat the learn article purely
   as supporting/informational content that funnels into it (which the current internal links already
   do correctly).
3. Apply the same title-differentiation check to `semaglutide-in-houston`/`tirzepatide-in-houston`
   proactively, since they don't have a matching top-level commercial-pillar counterpart today, but
   would face the same risk if one is added later.

---

## Finding 3 (Info/Low): Medication-family sample cluster is well-differentiated by FDA indication and content angle

**Severity: Low / Info**

Sampled: `ozempic`, `wegovy`, `mounjaro`, `zepbound`, `saxenda`, `semaglutide-weight-loss`,
`tirzepatide-online`, `glp-1-for-weight-loss`, `best-glp-1-for-weight-loss`,
`glp-1-weight-loss-program`.

- The five brand-drug pages (`ozempic`, `wegovy`, `mounjaro`, `zepbound`, `saxenda`) are
  consistently framed as "what is [brand]: FDA-approved indication, dosing, safety" pages, and
  each **explicitly states its FDA-labeled indication** (Ozempic/Mounjaro = diabetes only,
  Wegovy/Zepbound = weight management, Saxenda = daily liraglutide) as the primary differentiator.
  Ozempic's own H2 ("Why people search Ozempic for weight - and what that does not change")
  proactively addresses the most common source of real-world confusion (people searching "Ozempic"
  when they mean weight loss generally) rather than trying to rank for it directly - this is the
  correct compliance-safe pattern for an off-label-adjacent term.
- The four "conceptual" pages target genuinely distinct query families, confirmed by independently
  distinct SERP landscapes on WebSearch (mechanism-explainer results for "semaglutide for weight
  loss," clinical/research results for "glp-1 for weight loss," comparison-article results for
  "best glp-1 for weight loss," and program-structure results for "glp-1 weight loss program" -
  four different result sets with no shared top links):
  - `semaglutide-weight-loss` = trial-data/mechanism angle (STEP/SELECT trials)
  - `glp-1-for-weight-loss` = category-level explainer/entry point
  - `best-glp-1-for-weight-loss` = comparison content, explicitly avoids crowning a winner
  - `glp-1-weight-loss-program` = what a *program* (follow-up, titration, supplies) includes,
    commercial/BOFU angle
  - `tirzepatide-online` = access/telehealth-legality angle, not a drug profile

**Recommendation:** No consolidation needed for the sampled pages. This is a legitimate,
compliance-aware cluster design (brand/indication as the primary differentiator is smart given
FDA labeling rules) and should be the template applied when auditing the rest of the drug-name
pages not sampled here (`cagrisema`, `mazdutide`, `orforglipron`, `retatrutide`, etc.).

---

## Finding 4 (Medium): `/glp-1-for-weight-loss/` is an under-built pillar for the drug-comparison spokes

**Severity: Medium**

`/glp-1-for-weight-loss/` reads as the natural category pillar for the medication-family
cluster (broadest scope, entry-point framing) and is linked from the top-level `/glp-1/` page.
However, its own outbound links only go to `best-glp-1-for-weight-loss` and
`glp-1-weight-loss-program` - it does **not** link out to `ozempic`, `wegovy`, `mounjaro`,
`zepbound`, `saxenda`, `semaglutide-weight-loss`, or `tirzepatide-online`, even though its H2
"Which medicines sit in the conversation" is the exact place readers would want those links.
Right now those brand pages instead link laterally to each other in a partial mesh
(e.g. `ozempic` -> `wegovy`, `mounjaro`, `saxenda`, `semaglutide-weight-loss`; but `mounjaro`
does not link to `saxenda` or `semaglutide-weight-loss`; `zepbound` does not link to `saxenda`).

**Recommendation:** Add the seven brand/molecule articles as outbound links from
`/glp-1-for-weight-loss/` under "Which medicines sit in the conversation," making it a true
hub-and-spoke pillar for the medication-family cluster instead of a two-link stub. This is a
low-effort, high-value internal-linking fix.

---

## Finding 5 (Medium): `glp-1-side-effects` hub under-links its own symptom-page spokes

**Severity: Medium**

`/learn/weight-loss/glp-1-side-effects/` is the natural topical hub for 14 symptom-specific
articles. It links to only 6 of them (`glp-1-constipation`, `glp-1-dizziness`, `glp-1-fatigue`,
`glp-1-hair-loss`, `glp-1-injection-site-reactions`, `glp-1-nausea`) and does **not** contextually
link to `glp-1-acne`, `glp-1-bloating`, `glp-1-body-aches`, `glp-1-urinary-changes`,
`glp-1-and-alcohol`, `glp-1-and-antidepressants`, `glp-1-and-periods`, or `glp-1-and-thyroid`.

These 8 pages are **not orphaned** - all 14 symptom pages are linked from the master
`/learn/weight-loss/` index (135 internal links total on that page), so crawlability is fine.
But relying solely on the flat category index instead of contextual topical links from the
side-effects hub is a missed relevance/PageRank-flow signal, and a weaker experience for a reader
who lands on `glp-1-side-effects` wanting the full symptom map.

**Recommendation:** Expand `glp-1-side-effects` to link all 14 symptom-specific spokes (ideally
grouped, e.g. "GI symptoms" vs. "systemic effects" vs. "interactions/comorbidities" sub-sections),
matching the pattern already used well elsewhere on the site (e.g. the geo cluster, the
stopping-mounjaro/stopping-tirzepatide pair).

---

## Finding 6 (Info/Low): Slug-overlap pairs flagged in structural pass - already well-differentiated, no action needed now

**Severity: Info**

A slug/title-level scan of the full `/learn/weight-loss/` list surfaced several pairs/groups that
look like cannibalization candidates from the slug alone. Spot-checking titles, meta descriptions,
and (for the highest-risk pairs) bidirectional internal links found **all of the following are
already deliberately differentiated and cross-linked**, and should be treated as a positive
pattern reference rather than a fix list:

- `stopping-glp-1` (general) / `stopping-mounjaro` (diabetes-indication framing) /
  `stopping-tirzepatide` (weight-loss/general framing, mentions both Zepbound and Mounjaro).
  Confirmed bidirectional link between `stopping-mounjaro` <-> `stopping-tirzepatide`.
- `switching-from-wegovy-to-zepbound` / `switching-from-zepbound-to-wegovy` /
  `switching-glp-1-medications` - directional pages target genuinely distinct search queries;
  general page is the hub.
- `not-losing-weight-on-semaglutide` / `not-losing-weight-on-tirzepatide` /
  `weight-loss-plateau-on-glp-1` / `still-hungry-on-glp-1` - split cleanly by drug specificity
  (semaglutide vs. tirzepatide) and by sub-symptom (no results at all vs. slowing progress vs.
  appetite specifically).
- `microdosing-glp-1` / `wegovy-low-dose` - `wegovy-low-dose`'s own meta description explicitly
  states "how that differs from microdosing," i.e. the pages disambiguate each other on-page.
- `retatrutide-vs-ozempic` / `retatrutide-vs-semaglutide` - same brand-vs-molecule pattern as the
  Ozempic/Wegovy split (diabetes brand vs. investigational-obesity-trial comparison). Confirmed
  bidirectional internal link between the two.
- `glp-1-near-me` / `online-glp-1` / `glp-1-doctor` - three distinct access-intent angles
  (location, delivery format, provider-vetting); all three are spokes off the `/glp-1/` top-level
  pillar alongside `glp-1-cost`, `glp-1-for-weight-loss`, `best-glp-1-for-weight-loss`,
  `glp-1-side-effects`, `glp-1-weight-loss-program` - this 8-page group is the site's clearest,
  best-executed hub-and-spoke cluster.
- `glp-1-postpartum` / `glp-1-while-breastfeeding` - postpartum page explicitly scopes
  breastfeeding as a subtopic and links to the breastfeeding page (confirmed) rather than
  duplicating its FDA-label detail.
- `travel-with-glp-1` / `travel-with-wegovy` / `travel-with-zepbound` - general + brand pattern
  with real product-specific data (28-day Wegovy vs. 21-day Zepbound room-temperature windows),
  consistent with the dosing and breastfeeding brand-spoke pattern used sitewide.

**No pairs in this structural pass require consolidation or canonicalization.** This should be
re-verified with actual SERP/GSC data once available, since title-level differentiation does not
guarantee Google won't still compress rankings for the tightest pairs (`stopping-mounjaro`/
`stopping-tirzepatide` and `retatrutide-vs-ozempic`/`retatrutide-vs-semaglutide` are the two worth
rechecking first if/when rank data exists, since "Mounjaro" and "tirzepatide," and "Ozempic" and
"semaglutide," are the two brand/molecule pairs most likely to be treated as synonyms by a
searcher rather than as a deliberate distinction).

---

## Summary table

| Cluster | Pages checked | Cannibalization risk | Internal linking | Action |
|---|---|---|---|---|
| Geo (Houston/Texas) | 7 | Low (Houston vs Texas is real scope split) except pillar/spoke pair | Good - full cross-linking, self-referencing canonicals | Retitle `glp-1-in-houston` spoke away from exact-match pillar keyword (Finding 2) |
| Medication family (sampled) | 10 | Low - brand/indication is a legitimate differentiator | Partial mesh; pillar (`glp-1-for-weight-loss`) under-linked | Build out pillar links (Finding 4) |
| Side-effects/symptom cluster | 15 (hub + 14 spokes) | Low | Hub links only 6/14 spokes; index page saves it from orphaning | Expand hub links (Finding 5) |
| Other slug-overlap candidates (structural pass) | ~20 | Low - already differentiated and cross-linked | Good | None now; recheck with GSC data later |

## Cannibalization check result

No two sampled or spot-checked posts share an identical primary keyword target, with one
exception: `/glp-1-houston/` and `/learn/weight-loss/glp-1-in-houston/` (Finding 2). No orphan
pages found among the ~35 pages directly checked (all are reachable from the `/learn/weight-loss/`
master index at minimum). No duplicate/incorrect canonical tags found among the pages checked.
