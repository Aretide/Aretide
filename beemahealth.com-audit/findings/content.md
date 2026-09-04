# Content Quality & E-E-A-T Audit - beemahealth.com

Specialist: Content Quality (Sept 2025 QRG)
Sample: homepage, /semaglutide/, /tirzepatide/, /glp-1/, /glp-1-houston/, /how-it-works/, /safety/, /faq/, /about/, /learn/, /learn/weight-loss/, 8 symptom-cluster articles (glp-1-nausea, -bloating, -fatigue, -dizziness, -body-aches, -constipation, -hair-loss, -acne), 1 comparison article (retatrutide-vs-semaglutide), 1 geo article (semaglutide-in-houston), 2 recipes, 1 legal page (telehealth-consent), plus several extra learn articles (ozempic, wegovy, zepbound, mounjaro, saxenda, tirzepatide/semaglutide-in-houston/texas, tirzepatide-online, glp-1-for-weight-loss, glp-1-weight-loss-program, glp-1-in-houston/texas, best-glp-1-for-weight-loss, glp-1-side-effects, glp-1-postpartum, retatrutide-vs-ozempic, stopping-mounjaro, stopping-tirzepatide). Text/JSON-LD extracted from raw HTML fetches (site is fully static/prerendered per base-context, so raw fetch is representative of what crawlers see).

**Not checked in this pass (partial sampling, noted per coordinator instruction to stop and write up):** Flesch-Kincaid/readability formula scoring was not computed numerically. Only 8 of the roughly 40 symptom/side-effect style articles were read in full. Only 2 of 12 recipes and 1 of 7 legal pages were read. Homepage/about pages were not specifically checked for patient testimonials or case-study content. Full cross-comparison of all Houston/Texas geo variants (glp-1-in-houston vs semaglutide-in-houston vs tirzepatide-in-houston) for text-level overlap was not done - only titles/meta/H1 were compared and looked distinct.

## Content Quality Score: 80/100 (Good)

## E-E-A-T Breakdown

| Factor | Weight | Score | Notes |
|---|---|---|---|
| Experience | 20% | 14/20 | No first-hand patient narrative/testimonial content confirmed in the sample; content reads as clinically-informed but not experiential. Not a specific gap finding since testimonials weren't fully checked - see Finding 8. |
| Expertise | 25% | 20/25 | Named physician (Dr. Sean Arora, MD, NPI-verified) in `reviewedBy` schema on trust/treatment pages; real citations to FDA labels (DailyMed) and peer-reviewed trials (e.g. NEJM SURMOUNT-1). Docked for schema-only visibility (Finding 1). |
| Authoritativeness | 25% | 18/25 | `sameAs` links to real, active social profiles (Facebook, Instagram, TikTok, Reddit, X, Google Business Profile); numbered Sources sections citing FDA/DailyMed and peer-reviewed journals. No independent third-party citations/backlinks evaluated in this pass (out of scope for this specialist). |
| Trustworthiness | 30% | 25/30 | Support email, phone, and `/contact/` present in Organization schema; full legal page set exists (privacy, terms, refund, shipping, physician code of conduct, HIPAA, telehealth consent); compliance/compounded-drug disclaimers are consistent, accurate, and match required verbatim language. Docked slightly for the reviewer-visibility gap and unverified on-page freshness dates. |

**Weighted total: 77/100** (feeds into the 80/100 overall score alongside duplication/AI-citation/compliance findings below).

## AI Citation Readiness Score: 82/100

Strong signals: visible FAQ accordions matched by `FAQPage` JSON-LD (confirmed on every sampled article, treatment page, and hub - matches the site's own docstring rule that FAQPage schema must match visible FAQ); numbered "Sources" sections with real, attributable citations (FDA drug labels via DailyMed, peer-reviewed trials); consistent H1/H2 hierarchy with clear, specific subheads; `BreadcrumbList` on every content page. Weaknesses: `datePublished`/`dateModified` exist in schema but were not found as visible on-page text near the article title in the one article checked closely (Finding 6); did not verify presence of scannable data tables/callout stat boxes across the sample.

## Findings

### Finding 1 - Named medical reviewer exists only in JSON-LD, never visible on the page
**Severity: Medium**
`reviewedBy: {"@type":"Physician","name":"Dr. Sean Arora","honorificSuffix":"MD","identifier":{"propertyID":"NPI","value":"1841..."}}` appears in the structured data on `/about/`, `/how-it-works/`, `/safety/`, `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, and `/glp-1-houston/`. A text search of the rendered body content on all seven pages found zero occurrences of "Sean Arora" or "medically reviewed" anywhere in visible copy - the credential only exists for crawlers, not for human readers.
**Recommendation:** Add a small, visible attribution line (e.g. "Reviewed by Dr. Sean Arora, MD" with a short credentials link) near the top of these pages, matching what the schema already asserts. This is a real E-E-A-T improvement (visible expert bylines build human trust; invisible schema does not) and closes the gap between structured data and visible content that Google's guidelines expect to match.

### Finding 2 - Learn article `reviewedBy` omission is confirmed intentional, not a gap
**Severity: Info (confirmed as designed)**
None of the 20+ `/learn/weight-loss/` articles sampled carry `reviewedBy` or `reviewedByClinicalLead: true` in JSON-LD, and none show a visible clinician byline or review date. This matches `docs/features/learn.md`'s explicit design: the Learn library is unsigned educational content until a licensed clinician actually reviews a given article, and the visible `LEARN_DISCLAIMER_BODY` covers this instead of a fabricated reviewer.
**Recommendation:** None - do not add `reviewedBy` here per project policy. Consider prioritizing real clinical review + `reviewedBy` rollout for the highest-traffic symptom/dosing articles first once that program exists.

### Finding 3 - Symptom-cluster articles are genuinely differentiated, not templated/thin
**Severity: Info (positive finding)**
The 8 sampled symptom articles (glp-1-nausea, glp-1-bloating, glp-1-fatigue, glp-1-dizziness, glp-1-body-aches, glp-1-constipation, glp-1-hair-loss, glp-1-acne) share a consistent structural shell (mechanism -> trial/label data -> contributing factors -> red flags -> FAQ -> Sources -> Related education -> Program pages -> compliance footer), but the substantive content within that shell is specific and non-generic per article: distinct mechanisms are named and explained (e.g. "Bloating is not leftover belly fat" / delayed gastric emptying, "Telogen effluvium after rapid change," "One receptor versus three" for the tirzepatide-vs-semaglutide comparison), each cites its own labeled trial data. Titles, meta descriptions, and H1s are all unique and topic-specific (verified via extraction, not just spot-read). Cannibalization/duplicate-content risk within this cluster reads as low.
**Recommendation:** No action needed. As new symptom articles are added, hold them to this same differentiation bar (specific mechanism + specific trial citation + specific red-flag criteria) rather than letting the shared shell become the majority of the page.

### Finding 4 - Strong, attributable sourcing throughout sampled Learn content
**Severity: Info (positive finding)**
Every sampled article's "Sources" section cites real, checkable sources - FDA prescribing information via DailyMed (Wegovy/semaglutide, Zepbound/tirzepatide) and peer-reviewed trial publications (e.g., Wharton et al., Diabetes, Obesity and Metabolism 2021; Jastreboff et al., SURMOUNT-1, NEJM), numbered and specific rather than vague "studies show" language.
**Recommendation:** None - this is a genuine strength for both E-E-A-T and AI-citation readiness (quotable, attributable facts). Keep this sourcing bar as a hard requirement for new articles.

### Finding 5 - Compliance/compounded-drug disclosure copy is consistent and accurate
**Severity: Info (positive finding)**
The required verbatim sentence pattern ("compounded [drug] is not FDA-approved and is considered only when legally available and clinically appropriate") and "prescribing/completing intake does not guarantee a prescription" language were both found, consistently worded, on `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, `/glp-1-houston/`, `/faq/`, the homepage, and sampled Learn articles/hub. No instance in the sample implied Beema sells or offers Wegovy, Ozempic, Mounjaro, or Zepbound as its own product.
**Recommendation:** None - matches `docs/features/treatment-pages.md` §Compliance and the FDA Feb 6, 2026 guidance referenced there.

### Finding 6 - CTAs correctly route to external Bask intake on every sampled page
**Severity: Info (positive finding / confirms no false "in-house funnel" claim)**
Every CTA href extracted from every sampled page points to `https://q.beemahealth.com/start-online-visit/weightloss?cta_id=...` (Bask's hosted intake, external domain) with a distinct `cta_id` per placement (e.g. `semaglutide_hero`, `glp1_footer`, `how_it_works`). Zero links to internal `/qualify`, `/intake`, `/consent`, `/dashboard`, or `/waitlist` paths were found in the visible content of any sampled page.
**Recommendation:** None - this correctly reflects the "launched, Bask-owns-intake" state per CLAUDE.md; no page in the sample implies an in-house funnel.

### Finding 7 - Freshness dates exist in schema but were not confirmed visible on the page
**Severity: Low**
Sampled article JSON-LD carries `datePublished`/`dateModified` values dated 2026-08-24 (two days before this audit), which is a good freshness signal for crawlers. Checking one article (`glp-1-nausea`) closely, no human-readable "Updated [date]" text was found near the H1/byline area in visible copy.
**Recommendation:** Consider surfacing a small visible "Updated: [date]" near the article title on Learn articles. This is a minor trust/freshness signal for human readers and for AI systems that weight visible recency cues, and is low-cost since the data already exists in the CMS/schema layer. Verify across more articles before treating this as a site-wide gap (only one article was checked for this specific signal).

### Finding 8 - Word counts vs QRG topical-coverage floors (informational, not a ranking directive)
**Severity: Low / Info**
Sampled pages against this skill's minimums table: homepage 903 words (floor 500, passes); `/about/` 719, `/how-it-works/` 722, `/safety/` 1,039 (informational pages, no strict floor in the table but reasonable depth); `/faq/` 3,618 (very comprehensive); `/learn/` hub 755; `/learn/weight-loss/` hub 5,189 (comprehensive); `/semaglutide/` 2,780 and `/tirzepatide/` 2,804 (service-page floor 800, well above); `/glp-1/` 2,107 and `/glp-1-houston/` 2,089 (well above); sampled Learn articles (blog-post floor 1,500) ranged roughly 1,452-2,323 words, with all but one comfortably above the floor - `stopping-mounjaro` came in slightly under at approximately 1,452 words in this sample. Recipes ran 912-974 words; the one legal page sampled (`telehealth-consent`) ran 1,276 words.
**Recommendation:** Treat these as topical-coverage floors, not ranking targets, per this skill's own guidance - do not pad word count. If `stopping-mounjaro` (and any other under-floor article, not otherwise verified in this sample) is missing genuine subtopics that peer articles in the cluster cover (e.g. rebound-weight-gain timing, switching options, red-flag criteria), close that specific gap; otherwise leave as-is.

## Top takeaway

The Learn library and treatment pages both clear a materially higher content-quality bar than typical templated GLP-1 SEO content: real, attributable citations; genuinely differentiated symptom-cluster articles rather than spun duplicates; and compliance copy that matches the required legal/FDA language verbatim. The one concrete, fixable gap is that the site's strongest individual E-E-A-T asset - a named, NPI-verified physician reviewer - is invisible to human visitors on every page that has it (Finding 1). That is also the single best quick win: a one-line visible "Reviewed by Dr. Sean Arora, MD" byline on `/about/`, `/how-it-works/`, `/safety/`, `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, and `/glp-1-houston/` would convert an already-existing schema asset into a real, human-visible trust signal at very low implementation cost.
