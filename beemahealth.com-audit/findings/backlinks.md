# Backlink Profile Audit - beemahealth.com

**Data tier: Tier 0 (Basic - Common Crawl + Verify only).** Confirmed via `claude-seo run backlinks_auth.py --check --json`: no Moz API key, no Bing Webmaster API key, no DataForSEO configured. Only Common Crawl's public web graph and the local backlink-verification crawler are available.

**Backlink Health Score: INSUFFICIENT DATA (not scored).** Per this skill's own scoring rules, a numeric 0-100 score requires data covering enough of the seven weighted factors (referring domains, domain quality distribution, anchor text naturalness, toxic link ratio, link velocity, follow/nofollow ratio, geographic relevance). At Tier 0, with beemahealth.com absent from Common Crawl entirely, **zero of the seven factors have any data source**. Producing a numeric score here would be fabricated. This finding should be surfaced in the aggregate report as a coverage gap, not averaged into an overall SEO score as if it were a real "0" or "50."

Do not let the aggregate audit imply a backlink profile was measured and found weak - it was not measured at all. This section should be read as "no reliable backlink instrumentation available" rather than "backlink profile is poor."

---

## Findings

### 1. Domain is entirely absent from Common Crawl's web graph - Info
**Source:** Common Crawl Web Graph, release `cc-main-2026-jan-feb-mar` (source: https://commoncrawl.org/web-graphs, quarterly release cadence) - confidence: 0.50 (domain-level, and here the result is a negative/absence result, not a measurement)

```
claude-seo run commoncrawl_graph.py beemahealth.com --json
claude-seo run commoncrawl_graph.py www.beemahealth.com --json
```
Both returned identical results: `in_crawl: false`, `in_rankings: false`, `pagerank: null`, `pagerank_rank: null`, `harmonic_centrality: null`, `harmonic_centrality_rank: null`, `n_hosts: null`, with the note: *"Domain not found in Common Crawl data. It may be too new, too small, or not yet crawled."*

This is not a low score - it is a total absence from the dataset. Common Crawl's web graph is built from its own crawl of the open web; a domain only appears once CC's crawler has discovered and indexed inbound links to it in a sufficiently recent crawl. Given the domain's recent LegitScript certification (August 2026) and launch timeline, this is consistent with a newly-launched brand that has not yet accumulated enough external inbound links (or crawl-graph presence) for CC's most recent web-graph release to pick it up. It is not evidence of a penalty, spam signal, or technical block - CC coverage is a function of crawl scheduling and existing link discovery, not a quality judgment.

**Recommendation:** Re-run this check quarterly (CC web-graph releases are quarterly). No action needed on-site; this is purely a function of external link accumulation and time. Do not action this as a technical fix.

### 2. No referring-domain list, anchor text data, or toxic-link signal available at any confidence level - High (data-coverage gap, not a site defect)
**Source:** N/A - no Moz, Bing, or DataForSEO credentials configured; Common Crawl returned no data for this domain (see Finding 1)

None of the following exist in this audit at any confidence level: referring domain count, list of referring domains, domain-quality/spam-score distribution, anchor text distribution, follow/nofollow ratio, link velocity trend, or geographic distribution of links. This is a hard tooling gap, not a statement that these signals are bad - they are simply unmeasured.

**Recommendation:** To get real signal, either (a) add a free Moz API key (moz.com/products/api, 2,500 rows/month free tier) to unlock DA/PA, referring domains, and Moz Spam Score at confidence 0.85, or (b) if budget allows, enable the DataForSEO extension for confidence-1.00 referring-domain and toxicity data. Until then, treat "backlink profile" as an open question in every future audit, not a known-weak area.

### 3. No known/expected backlinks were available to verify - Medium (process gap)
**Source:** Manual repo search - confidence: n/a (absence check)

`verify_backlinks.py` requires a `--links` file of known source URLs (e.g., press mentions, directory listings, partner pages) to check whether they still carry a live link to beemahealth.com. A repo-wide search for any tracked list of press mentions, partnership links, guest posts, or directory submissions (`docs/`, audit folder) returned nothing. No such list exists in this codebase, so the verification crawler could not be run against anything.

This means: even the modest Tier-0 "verify known backlinks" capability was unused, not because it failed, but because there is no known-backlinks inventory to feed it. This is worth flagging to the site owner directly - if any of the following exist, they should be tracked so future audits can verify them: LegitScript's public directory/checker listing, any GLP-1/telehealth roundup or comparison articles, local press coverage, or partner/affiliate pages.

**Recommendation:** Beema Health's marketing/growth owner should compile even a short list of every place beemahealth.com is currently linked from (LegitScript listing, any press, any directories, any partner sites) so it can be tracked as a `--links` input for `verify_backlinks.py` in future audits. This turns an unmeasurable category into a trackable one at zero API cost.

### 4. LegitScript verification/checker page is not counted as a backlink - Info
**Source:** `render_page.py` fetch of `https://www.legitscript.com/websites/?checker_keywords=beemahealth.com` - confidence: n/a (excluded)

`docs/features/legitscript.md` documents this URL as the public verify link, and the seal (`src/lib/legitscript.ts`) links to it. Fetching it shows it is a client-side-rendered interactive checker tool driven by a query parameter (`checker_keywords=beemahealth.com`), not a static editorial page listing beemahealth.com with a stable inbound link. It returns generic search-tool markup regardless of the query string; there is no confirmed static anchor-text link to beemahealth.com discoverable by crawlers on that URL. It should not be counted as a referring domain/backlink in this profile, and no LegitScript-sourced backlink signal is being claimed here.

**Recommendation:** No action - this is a correct, expected trust-badge integration (covered under E-E-A-T/trust in the content/technical audit, not backlinks). Flagging only so the aggregate report does not mistakenly credit LegitScript as a counted referring domain.

---

## Summary for aggregate report

- **Category: Backlink Profile**
- **Score: INSUFFICIENT DATA - do not include a numeric backlink score in the overall SEO score.** If the aggregate report requires every category to have a number, mark this one explicitly as "not measured (Tier 0 tooling gap)" rather than defaulting to 0 or an assumed midpoint.
- **Tier: 0 (Common Crawl + Verify only).** No Moz, Bing Webmaster, or DataForSEO configured.
- **Common Crawl result: domain not found** in the current release (`cc-main-2026-jan-feb-mar`) - no PageRank, harmonic centrality, or crawl presence data of any kind for beemahealth.com or www.beemahealth.com.
- **No known-backlinks list existed to verify** with the local crawler.
- **Context:** this is consistent with a newly-launched, small brand (LegitScript certified August 2026) that has not yet accumulated a measurable inbound-link footprint - the absence of data should not be read as "the profile is weak," it should be read as "the profile is unmeasured and likely still thin given launch recency."
- **Top recommendation (process, not code):** compile a tracked list of every existing external mention/link to beemahealth.com (LegitScript, any press, directories, partners) and add a free Moz API key to unlock real DA/PA and referring-domain data in the next audit cycle.
