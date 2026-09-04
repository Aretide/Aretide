# GEO (AI Search / Generative Engine Optimization) Audit - beemahealth.com

Scope: llms.txt accuracy/completeness, passage-level citability of homepage, /semaglutide/, /tirzepatide/, /glp-1/, and 4 /learn/weight-loss/ articles, structural readability for AI parsing, authority/citation signals, and brand entity clarity. robots.txt and llms.txt presence were pre-confirmed per base-context and not re-verified for basic existence; this audit goes deeper into content quality.

Method: fetched live HTML for homepage, /semaglutide/, /tirzepatide/, /glp-1/, and four /learn/weight-loss/ articles (glp-1-for-weight-loss, semaglutide-weight-loss, glp-1-cost, best-glp-1-for-weight-loss), extracted boilerplate-stripped text with trafilatura, parsed heading hierarchy and JSON-LD from raw HTML, and diffed live https://beemahealth.com/llms.txt against current page content.

---

## Findings

### 1. [Info/Low] llms.txt is current and byte-identical to the pre-fetched reference copy
`curl -s https://beemahealth.com/llms.txt` diffed against the pre-gathered `llms-txt-check.txt` snapshot produced zero differences - the file is live at HTTP 200 and not stale relative to whatever baseline the audit started from.

**Cross-check against actual page content:** the pricing summarized in llms.txt ("Compounded semaglutide is $199 per month at the 1-month rate... compounded tirzepatide is $297 per month at the 1-month rate... 3-month starter pack at $597 total, which is $199 per month") is directionally accurate and matches the `Service` JSON-LD `offers` block on /semaglutide/ (base price $199, first-month promo $99) and the tirzepatide starter-pack math (597/3 = 199). No factual pricing drift found between llms.txt and the live medication pages.

**Recommendation:** No fix needed on accuracy. Low-effort hardening: add a `dateModified`/"last verified" line at the top of llms.txt (it currently has no timestamp at all), so both AI crawlers and future audits can tell at a glance whether the pricing summary is fresh without diffing it against the live pages by hand. Effort: trivial (5 min).

### 2. [Medium] llms.txt "Primary pages for citation" list omits the /learn/weight-loss/ articles, which are actually the more citable pages for informational GLP-1 queries
llms.txt names `/semaglutide/`, `/tirzepatide/`, `/glp-1/`, and `/glp-1-houston/` as "Primary pages for citation." Those are correct for *transactional* / pricing queries ("how much does semaglutide cost at Beema"), but the "Common questions, and the page that answers each" section further down the same file already correctly routes 18 informational queries (e.g. "How GLP-1 medicines work for weight loss," "Semaglutide for weight loss," "Best GLP-1 for weight loss") to specific `/learn/weight-loss/` articles. This is internally inconsistent: the top-line "primary pages" framing undersells the learn library, which is where an LLM answering a generic "how does semaglutide work" or "what's the best GLP-1" question should actually be pointed, since those pages carry real citations (STEP/SELECT trial references, FDA, NIDDK) that the four "primary" commercial pages don't carry to the same depth.

**Recommendation:** Reframe the "Primary pages for citation" line to explicitly split by intent: commercial/pricing queries -> `/semaglutide/`, `/tirzepatide/`, `/glp-1/`; informational/mechanism/comparison queries -> point to the "Common questions" table below (which already exists and is well-built). This is a one-paragraph edit to `public/llms.txt`. Effort: trivial (10 min).

### 3. [High] Zero question-shaped H2/H3 headings on the four highest-intent commercial pages (homepage, /semaglutide/, /tirzepatide/, /glp-1/)
Full heading extraction from live HTML:

- Homepage: no H2s at all in the extracted structure beyond hero/feature labels ("Compassionate medical care," "Three simple steps," "GLP-1 weight-loss options") - none phrased as a question.
- /semaglutide/: H2s are "What is semaglutide?" (borderline-definitional but not a full natural question), "Check your BMI," "How Beema's semaglutide care works," "Safety and important information," "Semaglutide vs. tirzepatide," "Frequently asked questions." The actual FAQ questions ("What is compounded semaglutide?", "Is semaglutide right for me?", "How much does semaglutide cost through Beema?" etc.) exist and are excellent verbatim matches for how people prompt ChatGPT/Perplexity - but they are rendered as accordion labels with **no heading tag at all** (confirmed via regex scan of `<h1>`-`<h6>` - none of the 8 FAQ question strings appear as heading elements), so they only reach AI crawlers through the `FAQPage` JSON-LD, not through the visible DOM heading hierarchy that non-JSON-LD-aware extractors (and some AI Overview passage-rankers) weight heavily.
- /tirzepatide/: same pattern.
- /glp-1/: H2s are all descriptive labels ("Clear cash-pay rates for compounded options," "From online intake to ongoing care," "GLP-1 care, pricing, and getting started") - zero question phrasing despite this being the page llms.txt names as the nationwide GLP-1 overview.

This matters because AI Overviews and Perplexity disproportionately lift passages that sit directly under a heading phrased the way a user would type the query (e.g. "How much does semaglutide cost?" as an actual `<h3>`, not just FAQPage JSON-LD text with no visible heading wrapper).

**Recommendation:** On /semaglutide/ and /tirzepatide/, wrap each existing FAQ accordion question in a semantic heading element (e.g. `<h3>` inside the accordion trigger) so the question text that already exists in the DOM and in FAQPage JSON-LD also participates in the heading hierarchy. On /glp-1/ and the homepage, add 1-2 question-shaped H2s that don't currently exist anywhere on those pages, e.g. "How much does GLP-1 cost with Beema?" and "Is compounded GLP-1 legal and legitimate?" Effort: medium (accordion component change touches shared UI, needs a look at whether the accordion trigger is a `<button>` wrapping a `<div>` that could take an `<h3>` without breaking a11y/AXE tests).

### 4. [Medium] Commercial pages (/semaglutide/, /tirzepatide/, /glp-1/) open with brand/process copy, not a direct-answer sentence
The extracted first passage on /semaglutide/ is: "Beema Health connects eligible adults with independent licensed providers for individualized medical weight-management care. Completing intake does not guarantee a prescription." This is accurate and legally careful, but it is not a self-contained, quotable answer to "what is compounded semaglutide" or "how much does semaglutide cost" - the actual direct-answer content (pricing, mechanism) doesn't appear until several DOM sections later. Compare this to the /learn/ articles, which mostly open well (see Finding 6).

The homepage H1 + subhead ("Weight-loss care that's human and built for success... USA physicians, licensed and certified USA 503A pharmacies, transparent cash pricing, including a tirzepatide 3-month starter pack from $199/mo") is closer to a citable passage but still leads with brand voice before the concrete facts.

**Recommendation:** On /semaglutide/ and /tirzepatide/, add a 1-2 sentence definitional lede directly under the H1 and before the pricing widget - something in the 40-60 word range that self-contained-answers "what is compounded semaglutide" and states the current base price, so a passage extractor doesn't have to walk past marketing copy to reach the fact. The `What is semaglutide?` H2 section already has good raw material ("Semaglutide is a GLP-1 medication used in medical weight-management care...") - consider promoting a tightened version of that copy above the fold. Effort: low-medium (copy change, likely needs compliance review per treatment-pages.md compounded-copy rules).

### 5. [Info - confirmed intentional, not a gap] /learn/ articles use organization-level authorship and omit `reviewedBy`, per existing site policy
JSON-LD on all four sampled `/learn/weight-loss/` articles (`glp-1-for-weight-loss`, `semaglutide-weight-loss`, `glp-1-cost`, `best-glp-1-for-weight-loss`) shows `Article`/`MedicalWebPage` types with `author: {"@id": "https://beemahealth.com/#organization"}` and `reviewedBy: null`. This matches the base-context note that pages without a named medical reviewer intentionally omit `reviewedBy` and is guarded by tests - **not flagged as a gap.**

By contrast, /semaglutide/ and /tirzepatide/ (the transactional pages) *do* carry a named, credentialed reviewer in their `Service` schema: `"reviewedBy": {"@type": "Physician", "name": "Dr. Sean Arora", "honorificSuffix": "MD", "identifier": {"propertyID": "NPI", "value": "1841729449"}, "jobTitle": "Founder and CEO of Arora Health & Aesthetics"}`, plus a visible on-page line "Clinical oversight: Beema Health's clinical provider network is led by Dr. Sean Arora, MD... Medically reviewed on July 31, 2026." This is a strong, differentiated authority signal exactly where it matters most (prescribing decisions) - noted as a genuine strength, not a finding to change.

**No action needed.** Flagging for visibility only: this is real E-E-A-T material AI answer engines can surface ("Beema Health's semaglutide page is medically reviewed by Dr. Sean Arora, MD, NPI 1841729449") and is worth referencing when pitching press/backlinks, since it's a differentiator most compounded-GLP-1 competitors will not have structured.

### 6. [Low/Info] /learn/ articles have strong citability structure - numbered sourcing, trial-level specificity, consistent template
All four sampled learn articles follow a strong repeating template: H1 states the topic directly, first H2 gives a direct-answer opener, and every article ends with a numbered `Sources` section citing named peer-reviewed trials (STEP 1, STEP 5, SELECT) and regulatory bodies (FDA, NIDDK) with real citations, e.g. "[1] Wilding JPH, et al. Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1). N Engl J Med. 2021;384(11):989-1002." This is well above typical DTC-telehealth content quality and is a genuine citability strength - specific, attributable statistics are exactly what AI Overviews/Perplexity prefer to quote.

Example of a strong direct-answer opener (semaglutide-weight-loss article, first H2): "Semaglutide 2.4 mg produced about 14.9% mean weight change in STEP 1" - concrete statistic in the first sentence, ideal for extraction.

Weaker example (glp-1-cost article, first H2 "Cash-pay means the number on the page is the number"): opens with a framing metaphor rather than a number, and the actual price doesn't appear until the second paragraph ("Compounded semaglutide is $199/month billed monthly..."). Since llms.txt and this article both name it as the cost-answer page, this is the one place where leading with the number would meaningfully help.

**Recommendation:** For `glp-1-cost` specifically, move the concrete price statement into the first sentence of the article body (before the "cash-pay means the number is the number" framing). Leave the other three sampled articles as-is; their openers are already close to optimal. Effort: trivial per article (copy reorder only).

### 7. [Medium] Every learn article ends with an unprompted LegitScript disclosure - correctly framed, but not surfaced anywhere near the top-of-funnel commercial pages' citable text
All four sampled articles include, verbatim, in their closing "Beema's live offering" block: "Beema Health is a LegitScript-certified website. Certification means the certified site is monitored against LegitScript's healthcare merchant standards... Beema Health has obtained Google's healthcare certification for prescription-drug advertising in the United States." This is well-scoped (it correctly avoids over-claiming - no "endorsement" language, matches `docs/features/legitscript.md` guidance not to invent other credentials). It's a real trust signal AI engines can cite when answering "is Beema Health legitimate" or "is [compounded GLP-1 provider] safe" style queries, which are common follow-up prompts in this category given widespread awareness of unregulated research-chemical vendors.

However, this LegitScript language currently only lives at the very bottom of `/learn/` articles (after Sources, Related education, and Program pages sections) - it is unlikely to survive in the same extracted passage as the article's main citable answer, and it does not appear at all in the sampled text from /semaglutide/, /tirzepatide/, or /glp-1/ (the pages llms.txt names as primary for citation, and the pages most likely to be asked "is this legit").

**Recommendation:** Add a short, compliant LegitScript trust line (consistent with the wording already approved and used on the learn articles) near the top of /semaglutide/, /tirzepatide/, and /glp-1/ - not just as the visual seal graphic (which AI text-extraction can't read), but as actual extractable text, e.g. alongside the existing "USA 503A pharmacies" / "Licensed providers, verified per state" trust-badge row on the homepage. The seal image already exists on these pages per `docs/features/legitscript.md`; this is about giving crawlers a text equivalent, not adding a new credential claim. Effort: low (copy/component addition, reuse existing approved LegitScript copy).

### 8. [Medium] Brand entity signals are present in `sameAs` but skew toward weak-correlation platforms; no YouTube, no Wikipedia, no LinkedIn
`MedicalOrganization` JSON-LD `sameAs` array (confirmed present on /semaglutide/, presumably sitewide): Google Business Profile, Facebook, Instagram, TikTok, Reddit (`r/beemahealth`), X/Twitter. Per GEO research, YouTube presence correlates most strongly with AI citation likelihood (~0.737), with Reddit also high; Domain Rating/backlinks is comparatively weak (~0.266). Beema already has the highest-value Reddit signal (a branded subreddit) and moderate signal via TikTok, but:

- No YouTube channel referenced anywhere in `sameAs` or on-page - the single strongest citation-correlated platform is absent.
- No Wikipedia entity (expected for an early-stage company at this size, not a near-term fix, but worth noting as a gap versus larger competitors like Ro/Noom/Hims that do have Wikipedia entries AI models frequently draw entity facts from).
- No LinkedIn company page in `sameAs`, which is a common secondary trust signal for a healthcare/HIPAA-adjacent entity (used by AI models and users to verify a company is real and staffed).

**Recommendation:** Priority order by ROI: (1) if a YouTube channel exists or is planned, add it to `sameAs` and produce even minimal video content (explainer, FAQ read-throughs) since it is the single strongest brand-mention correlate with AI citation; (2) add a LinkedIn company page to `sameAs` if one exists but isn't linked; (3) Wikipedia is not realistic pre-scale and should not be chased artificially. Effort: low if a YouTube/LinkedIn presence already exists and just needs linking; medium-high if content needs to be produced from scratch.

### 9. [Info] Technical accessibility for AI crawlers is not a concern - confirmed static/SSR
Per base-context, `is_spa: false` and `mode_used: raw` were already confirmed on the homepage render, and all pages fetched for this audit (raw `curl`, no JS execution) returned full content-equivalent HTML with populated JSON-LD and body text - consistent with a fully static, prerendered site. No CSR/hydration gap exists that would hide content from AI crawlers that don't execute JavaScript (GPTBot, ClaudeBot, PerplexityBot, etc. are generally non-JS). No action needed; noting as a confirmed strength since it removes an entire class of GEO risk that many competitor telehealth SPAs have.

---

## Summary Scorecard (qualitative, no proprietary platform-visibility data available - see Method note)

| Dimension | Assessment |
|---|---|
| Citability | Strong on /learn/ (numbered sources, trial-level stats); weaker on /semaglutide/, /tirzepatide/, /glp-1/ (marketing lede before facts, FAQ questions not in visible headings) |
| Structural readability | Good hierarchy depth, but zero question-shaped H2/H3 on the four highest-commercial-intent pages |
| Multi-modal / brand entity | Reddit + social presence good; YouTube (strongest correlate) and LinkedIn absent from `sameAs` |
| Authority signals | Strong - named, NPI-verified physician reviewedBy on transactional pages; real peer-reviewed sourcing on learn articles; LegitScript certification real and correctly scoped, but only textually surfaced on learn articles, not commercial pages |
| Technical accessibility | Confirmed static/SSR, no JS-dependency risk for AI crawlers |

Note: no live ChatGPT/Perplexity/AI-Overview visibility data was available (no DataForSEO MCP tools were available in this session), so platform-specific citation-rate scores are not included - this audit is structural/content-based only.
