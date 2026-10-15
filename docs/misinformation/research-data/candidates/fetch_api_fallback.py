"""Bounded relation-search fallback for WDQS outage; CC0 unreviewed discovery.

Fetches at most 100 direct occupation/instance matches per category, then labels.
This is not equivalent to subclass-expanding SPARQL queries; coverage is narrower.
"""
import argparse
import datetime
import hashlib
import json
import urllib.parse
from pathlib import Path
from fetch_candidates import get_json

BASE = Path(__file__).resolve().parent


def request(parameters, filename):
    url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({"format": "json", **parameters})
    parsed, body, _ = get_json(url)
    if "error" in parsed:
        raise RuntimeError(json.dumps(parsed["error"]))
    (BASE / filename).write_bytes(body)
    return parsed, {"request_url": url, "raw_file": filename, "sha256": hashlib.sha256(body).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", choices=("serial-killers", "massacres"))
    args = parser.parse_args()
    manifest_path = BASE / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for name, search in (("serial-killers", "haswbstatement:P106=Q484188 haswbstatement:P31=Q5"),
                         ("massacres", "haswbstatement:P31=Q3199915")):
        if args.dataset and name != args.dataset:
            continue
        original = next(row for row in manifest["exports"] if row["dataset"] == name)
        record = {"dataset": name, "class_id": original["class_id"], "class_url": original["class_url"],
                  "retrieved_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  "method": "Wikidata API CirrusSearch direct haswbstatement relation and wbgetentities labels",
                  "search": search, "limit": 100, "license": "CC0-1.0",
                  "license_url": "https://www.wikidata.org/wiki/Wikidata:Licensing",
                  "review_state": "unreviewed_discovery_only", "scored_eligible": False,
                  "coverage_note": "Direct relation only; no subclass traversal. Search results may lag entity edits.",
                  "attempted_sparql": original, "requests": []}
        try:
            result, provenance = request({"action": "query", "list": "search", "srsearch": search,
                                          "srnamespace": "0", "srlimit": "100", "srprop": ""},
                                         name + ".api-search.raw.json")
            record["requests"].append(provenance)
            ids = [row["title"] for row in result["query"]["search"]]
            record["search_reported_total_hits"] = result["query"].get("searchinfo", {}).get("totalhits")
            entities = {}
            for start in range(0, len(ids), 50):
                chunk = ids[start:start+50]
                payload, provenance = request({"action": "wbgetentities", "ids": "|".join(chunk),
                                               "props": "labels", "languages": "en"},
                                              name + ".labels-" + str(start//50+1) + ".raw.json")
                record["requests"].append(provenance)
                entities.update(payload["entities"])
            candidates = [{"wikidata_id": entity_id,
                           "wikidata_url": "https://www.wikidata.org/wiki/" + entity_id,
                           "label": entities.get(entity_id, {}).get("labels", {}).get("en", {}).get("value", entity_id),
                           "review_state": "unreviewed_discovery_only", "classification": None,
                           "iceberg_tier": None, "rarity": None, "scored_eligible": False}
                          for entity_id in ids]
            (BASE / (name + ".candidates.json")).write_text(json.dumps(candidates, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
            record.update(status="success", count=len(candidates))
        except Exception as exc:
            record.update(status="failed", count=0, error_type=type(exc).__name__, error=str(exc))
        manifest["exports"][manifest["exports"].index(original)] = record
    manifest["total_candidate_rows"] = sum(row["count"] for row in manifest["exports"])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"exports": [{key: row[key] for key in ("dataset", "status", "count", "error") if key in row}
                                  for row in manifest["exports"]],
                      "total_candidate_rows": manifest["total_candidate_rows"]}, indent=2))


if __name__ == "__main__":
    main()
