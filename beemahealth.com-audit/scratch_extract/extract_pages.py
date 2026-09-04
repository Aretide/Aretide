import sys, json, urllib.request
import trafilatura

urls = [
    ("home", "https://beemahealth.com/"),
    ("semaglutide", "https://beemahealth.com/semaglutide/"),
    ("tirzepatide", "https://beemahealth.com/tirzepatide/"),
    ("glp-1", "https://beemahealth.com/glp-1/"),
    ("learn_glp1_for_weight_loss", "https://beemahealth.com/learn/weight-loss/glp-1-for-weight-loss/"),
    ("learn_semaglutide_weight_loss", "https://beemahealth.com/learn/weight-loss/semaglutide-weight-loss/"),
    ("learn_glp1_cost", "https://beemahealth.com/learn/weight-loss/glp-1-cost/"),
    ("learn_best_glp1", "https://beemahealth.com/learn/weight-loss/best-glp-1-for-weight-loss/"),
]

for name, url in urls:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 GEO-audit"})
    with urllib.request.urlopen(req, timeout=20) as r:
        html = r.read().decode("utf-8", errors="replace")
    with open(f"scratch_extract/{name}.html", "w") as f:
        f.write(html)
    text = trafilatura.extract(html, include_tables=True, favor_recall=True) or ""
    with open(f"scratch_extract/{name}.txt", "w") as f:
        f.write(text)
    print(name, "html_len", len(html), "text_len", len(text))
