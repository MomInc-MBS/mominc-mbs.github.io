# Bounded CC0 discovery export

Retrieved 2026-10-14 from Wikidata: **400 unique candidate entities / 400 dataset membership rows**.

| Dataset | Count | Method |
| --- | ---: | --- |
| Conspiracy theories | 200 | Bounded SPARQL instance/subclass query for Q159535 |
| Serial killers | 100 | API direct P106 occupation Q484188, filtered to P31 human Q5 |
| Massacres | 100 | API direct P31 instance Q3199915 |

Every candidate is **unreviewed discovery only** and ineligible for scored cards. No truth classification, iceberg tier, or answer rarity has been assigned. Imported classifications can contain errors or disputed allegations; none is a verified accusation by the game. Separate sources and review are needed before drafting a scored card. This export is not complete or a random population sample.

`manifest.json` records requests, retrieval times, hashes, license, query types, verified class labels, and endpoint failures. `*.raw.json` preserves source responses. `*.candidates.json` provides normalized discovery metadata. Missing English labels remain Wikidata IDs. [Structured Wikidata data is CC0](https://www.wikidata.org/wiki/Wikidata:Licensing); no external article prose or images are included.

WDQS returned HTTP 429 for two queries, stating an active-outage limit of one request per minute. The API fallback used narrower direct relationships; no WDQS retry was attempted. The final serial-killer file excludes fictional characters through its human-instance condition.

`fetch_candidates.py` preserves the initial bounded SPARQL approach; respect current service limits before rerunning it. `fetch_api_fallback.py` contains the fallback with optional `--dataset serial-killers` or `--dataset massacres`. These scripts issue requests only to official Wikidata endpoints and never execute fetched content.

From the parent data directory, run `python .\import_candidates.py` to import these files into the SQLite research starter. Discovery tables remain separate from claims and questions.
