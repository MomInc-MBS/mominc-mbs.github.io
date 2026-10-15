"""Fetch bounded CC0 discovery candidates from Wikidata; never approve scored cards.

No returned entity is independently verified by this export. Class/occupation
membership can be wrong, disputed, fictional, or incomplete. Review every record.
"""
import concurrent.futures
import datetime
import hashlib
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent
HEADERS = {"User-Agent": "MomsMisinformationMachineResearch/0.1 (bounded local research export)",
           "Accept": "application/sparql-results+json, application/json"}
PREFIX = """PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
"""
SPECS = {
    "conspiracy-theories": ("Q159535", "?item wdt:P31/wdt:P279* wd:Q159535 ."),
    "serial-killers": ("Q484188", "?item wdt:P31 wd:Q5 . { { ?item wdt:P106/wdt:P279* wd:Q484188 . } UNION { ?item wdt:P31/wdt:P279* wd:Q484188 . } }"),
    "massacres": ("Q3199915", "?item wdt:P31/wdt:P279* wd:Q3199915 ."),
}


def get_json(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=35) as response:
        body = response.read()
        return json.loads(body), body, dict(response.headers)


def fetch(name, class_id, pattern):
    query = PREFIX + """SELECT ?item ?itemLabel WHERE {
  { SELECT DISTINCT ?item WHERE { """ + pattern + """ } ORDER BY ?item LIMIT 200 }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY ?item
"""
    (BASE / (name + ".sparql")).write_text(query, encoding="utf-8")
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": query, "format": "json"})
    record = {"dataset": name, "class_id": class_id,
              "class_url": "https://www.wikidata.org/wiki/" + class_id,
              "query_file": name + ".sparql", "request_url": url,
              "retrieved_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "limit": 200, "license": "CC0-1.0",
              "license_url": "https://www.wikidata.org/wiki/Wikidata:Licensing",
              "review_state": "unreviewed_discovery_only", "scored_eligible": False}
    try:
        parsed, body, headers = get_json(url)
        (BASE / (name + ".raw.json")).write_bytes(body)
        bindings = parsed["results"]["bindings"]
        candidates = [{"wikidata_id": row["item"]["value"].rsplit("/", 1)[-1],
                       "wikidata_url": row["item"]["value"],
                       "label": row.get("itemLabel", row["item"])["value"],
                       "review_state": "unreviewed_discovery_only",
                       "classification": None, "iceberg_tier": None,
                       "rarity": None, "scored_eligible": False} for row in bindings]
        (BASE / (name + ".candidates.json")).write_text(json.dumps(candidates, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        record.update(status="success", count=len(candidates), sha256=hashlib.sha256(body).hexdigest(),
                      content_type=headers.get("Content-Type"), raw_file=name + ".raw.json")
    except Exception as exc:
        record.update(status="failed", count=0, error_type=type(exc).__name__, error=str(exc))
        if isinstance(exc, urllib.error.HTTPError):
            record["http_status"] = exc.code
            record["response_excerpt"] = exc.read(1200).decode("utf-8", errors="replace")
    return record


def main():
    class_ids = "|".join(spec[0] for spec in SPECS.values())
    verification_url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({
        "action": "wbgetentities", "ids": class_ids, "props": "labels|descriptions",
        "languages": "en", "format": "json"})
    verification = {"request_url": verification_url}
    try:
        parsed, body, _ = get_json(verification_url)
        (BASE / "class-entities.raw.json").write_bytes(body)
        verification["labels"] = {key: value.get("labels", {}).get("en", {}).get("value")
                                  for key, value in parsed["entities"].items()}
        verification["status"] = "success"
    except Exception as exc:
        verification.update(status="failed", error=str(exc))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(fetch, name, *spec) for name, spec in SPECS.items()]
        results = [future.result() for future in futures]
    manifest = {"scope": "Bounded Wikidata discovery export, not a verified or complete game database",
                "class_verification": verification, "exports": results,
                "total_candidate_rows": sum(result["count"] for result in results),
                "all_candidates_require_primary_source_review": True}
    (BASE / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"class_verification": verification,
                      "results": [{k: r[k] for k in ("dataset", "status", "count", "error", "http_status") if k in r} for r in results],
                      "total_candidate_rows": manifest["total_candidate_rows"]}, indent=2))


if __name__ == "__main__":
    main()
