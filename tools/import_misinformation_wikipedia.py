#!/usr/bin/env python3
"""Build a bounded, source-backed Wikipedia index for Misinformation Machine.

The category crawl, metadata, and pageview lookups are cached in the system temp
directory so an interrupted run resumes without repeating completed requests.
Only main-namespace articles are exported. Run with --help for crawl bounds.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import tempfile
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote

import requests


API = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "MYR5MisinformationResearch/1.0 (https://mominc.online/; public encyclopedia index)"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "docs/misinformation/research-data/wikipedia-index.json"
DEFAULT_CACHE = Path(tempfile.gettempdir()) / "myr5-misinformation-wikipedia-cache.json"

# Each root names a useful subject area, never a blanket claim that every member
# is itself a conspiracy theory. The first four are theory-focused.
ROOTS = [
    "Conspiracy theories",
    "Urban legends",
    "Pseudoscience",
    "Hoaxes",
    "Political scandals",
    "Intelligence operations",
    "False flag operations",
    "Human subject research",
    "Unethical human experimentation",
    "Assassinations",
    "Apollo program",
]
SKIP_CATEGORY = re.compile(
    r"\b(?:people|theorists|proponents|advocates|critics|deniers|writers|authors|"
    r"journalists|activists|politicians|filmmakers|actors|characters|fictional|"
    r"novels|books|films|television|tv series|video games|podcasts|music|songs|"
    r"albums|comics|fiction|popular culture|media|works|websites|magazines|"
    r"publishers|organizations|organisations|companies|institutes|journals|"
    r"hoaxers|pranksters|"
    r"documentaries|museums|memorials|lists|templates|stubs|articles needing|"
    r"births|deaths|living people)\b",
    re.IGNORECASE,
)
SKIP_TITLE = re.compile(
    r"^(?:List of |Lists of |Timeline of |Outline of |Index of |Glossary of |"
    r"Bibliography of |Category:)|\b(?:in popular culture|in fiction)\b",
    re.IGNORECASE,
)
TOPIC_PATTERNS = {
    "conspiracy theory": re.compile(r"\b(?:conspiracy theor(?:y|ies)|conspiracist (?:theor(?:y|ies)|belief)|conspiracy claim)\b", re.I),
    "urban legend": re.compile(r"\b(?:urban legend|urban myth|folklore|contemporary legend)\b", re.I),
    "hoax": re.compile(r"\b(?:hoax|fabricated story|fabricated claim)\b", re.I),
    "pseudoscience": re.compile(r"\b(?:pseudoscien(?:ce|tific)|fringe theor(?:y|ies)|scientifically unsupported belief)\b", re.I),
}
SECOND_LEAD_CANDIDATE = re.compile(r"\b(?:theor(?:y|ies)|legend|hoax|myth|conspiracy)\b", re.I)
CONSPIRACY_SUBJECT = re.compile(
    r"\b(?:is|was|originally conceived as|began as|originated as|started as)\s+"
    r"(?:a|an)\s+conspiracy theor(?:y|ies)\b", re.I,
)


def atomic_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")
    tmp.replace(path)


def request_json(url: str, params: dict | None = None) -> dict:
    for attempt in range(5):
        try:
            response = requests.get(
                url,
                params=params,
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
                timeout=(8, 30),
            )
            if response.status_code in (429, 500, 502, 503, 504):
                wait = min(2 ** attempt, 20)
                if response.headers.get("Retry-After", "").isdigit():
                    wait = min(int(response.headers["Retry-After"]), 30)
                time.sleep(wait)
                continue
            if response.status_code == 404:
                raise RuntimeError(f"HTTP 404: {url}")
            response.raise_for_status()
            payload = response.json()
            if "error" in payload:
                raise RuntimeError(f"MediaWiki API: {payload['error']}")
            return payload
        except (requests.RequestException, ValueError) as error:
            if attempt == 4:
                raise RuntimeError(f"Request failed: {url}: {error}") from error
            time.sleep(min(2 ** attempt, 20))
    raise RuntimeError(f"Request exhausted: {url}")


def initial_state() -> dict:
    return {
        "queue": [{"title": root, "root": root, "depth": 0, "path": [root]} for root in ROOTS],
        "visited": [],
        "pages": {},
        "metadataDone": [],
        "viewsDone": [],
        "started": dt.datetime.now(dt.timezone.utc).isoformat(),
    }


def add_page(pages: dict, member: dict, path: list[str]) -> None:
    if member.get("ns") != 0 or SKIP_TITLE.search(member["title"]):
        return
    key = str(member["pageid"])
    page = pages.setdefault(key, {"id": f"wiki-{key}", "name": member["title"], "paths": []})
    if path not in page["paths"]:
        page["paths"].append(path)


def crawl(state: dict, cache: Path, max_categories: int, max_depth: int) -> None:
    visited = set(state["visited"])
    while state["queue"] and len(visited) < max_categories:
        # Give the topical conspiracy subtree room to reach its useful deeper
        # categories before the wider historical context consumes the bound.
        state["queue"].sort(key=lambda node: (ROOTS.index(node["root"]), node["depth"]))
        node = state["queue"][0]
        title = node["title"]
        if title in visited or node["depth"] > max_depth or SKIP_CATEGORY.search(title):
            state["queue"].pop(0)
            atomic_json(cache, state)
            continue
        params = {
            "action": "query", "list": "categorymembers", "cmtitle": "Category:" + title,
            "cmtype": "page|subcat", "cmlimit": "max", "format": "json", "formatversion": 2,
        }
        if node.get("continue"):
            params.update(node["continue"])
        result = request_json(API, params)
        for member in result.get("query", {}).get("categorymembers", []):
            if member["ns"] == 0:
                add_page(state["pages"], member, node["path"])
            elif member["ns"] == 14 and node["depth"] < max_depth:
                child = member["title"].removeprefix("Category:")
                if not SKIP_CATEGORY.search(child) and child not in visited and not any(q["title"] == child for q in state["queue"]):
                    state["queue"].append({"title": child, "root": node["root"], "depth": node["depth"] + 1, "path": node["path"] + [child]})
        if "continue" in result:
            node["continue"] = result["continue"]
        else:
            visited.add(title)
            state["visited"] = sorted(visited)
            state["queue"].pop(0)
        atomic_json(cache, state)
        if len(visited) % 25 == 0 and "continue" not in result:
            print(f"categories={len(visited)} articles={len(state['pages'])} queued={len(state['queue'])}", flush=True)


def short_description(extract: str) -> str:
    # Limit *verbatim* Wikipedia text to 25 words per article.
    clean = re.sub(r"\s+", " ", extract or "").strip()
    return " ".join(clean.split()[:25]).rstrip(" ,;:")


def fetch_metadata(state: dict, cache: Path) -> None:
    done = set(state["metadataDone"])
    keys = [key for key in state["pages"] if key not in done]
    for offset in range(0, len(keys), 20):
        batch = keys[offset:offset + 20]
        params = {
            "action": "query", "pageids": "|".join(batch), "prop": "extracts|revisions|redirects",
            "exintro": 1, "explaintext": 1, "exchars": 260, "exlimit": "max",
            "rvprop": "timestamp|ids",
            "rdlimit": "max", "rdnamespace": 0,
            "format": "json", "formatversion": 2,
        }
        combined: dict[str, dict] = {}
        while True:
            result = request_json(API, params)
            for page in result.get("query", {}).get("pages", []):
                key = str(page.get("pageid"))
                item = combined.setdefault(key, {"redirects": []})
                if "extract" in page:
                    item["extract"] = page["extract"]
                if "revisions" in page:
                    item["revisions"] = page["revisions"]
                item["redirects"].extend(page.get("redirects", []))
            if "continue" not in result:
                break
            params.update(result["continue"])
        for key in batch:
            page = state["pages"][key]
            meta = combined.get(key, {})
            page["description"] = short_description(meta.get("extract", ""))
            revision = (meta.get("revisions") or [{}])[0]
            page["revisionId"] = revision.get("revid")
            page["revisionAt"] = revision.get("timestamp")
            aliases = {r["title"] for r in meta.get("redirects", []) if "title" in r and not SKIP_TITLE.search(r["title"])}
            aliases.discard(page["name"])
            page["aliases"] = sorted(aliases, key=str.casefold)
            done.add(key)
        state["metadataDone"] = sorted(done)
        atomic_json(cache, state)
        if offset % 400 == 0:
            print(f"metadata={len(done)}/{len(state['pages'])}", flush=True)


def enrich_topic_hints(state: dict, cache: Path) -> None:
    # A 25-word card excerpt can end before the article's own classification.
    # Check a longer intro for just the small set of plausible named subjects;
    # store only the derived label and evidence metadata, never the full text.
    done = set(state.get("topicHintsDone", []))
    keys = [
        key for key, page in state["pages"].items()
        if key not in done and page.get("description") and not classify(page)
        and SECOND_LEAD_CANDIDATE.search(page["name"])
    ]
    for offset in range(0, len(keys), 20):
        batch = keys[offset:offset + 20]
        result = request_json(API, {
            "action": "query", "pageids": "|".join(batch), "prop": "extracts",
            "exintro": 1, "explaintext": 1, "exchars": 900, "exlimit": "max",
            "format": "json", "formatversion": 2,
        })
        for article in result.get("query", {}).get("pages", []):
            key = str(article.get("pageid"))
            page = state["pages"].get(key)
            if page and re.search(r"\btheor(?:y|ies)\b", page["name"], re.I) and CONSPIRACY_SUBJECT.search(article.get("extract", "")):
                page["topicHints"] = ["conspiracy theory"]
                page["topicEvidence"] = {
                    "basis": "Wikipedia lead identifies the article subject as a conspiracy theory",
                    "revisionId": page.get("revisionId"),
                    "checkedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
                }
        done.update(batch)
        state["topicHintsDone"] = sorted(done)
        atomic_json(cache, state)


def views_window() -> str:
    end = dt.datetime.now(dt.timezone.utc).date() - dt.timedelta(days=1)
    start = end - dt.timedelta(days=29)
    return f"{start.isoformat()}/{end.isoformat()}"


def fetch_view_batch(batch: list[str]) -> dict[str, int | None]:
    params = {
        "action": "query", "pageids": "|".join(batch), "prop": "pageviews",
        "pvipdays": 30, "format": "json", "formatversion": 2,
    }
    observed: dict[str, int] = {}
    while True:
        result = request_json(API, params)
        for page in result.get("query", {}).get("pages", []):
            counts = page.get("pageviews", {})
            numeric = [value for value in counts.values() if isinstance(value, int)]
            if numeric:
                observed[str(page["pageid"])] = sum(numeric)
        if "continue" not in result:
            break
        params.update(result["continue"])
    return {key: observed.get(key) for key in batch}


def fetch_views(state: dict, cache: Path) -> str:
    # PageViewInfo's prop=pageviews is backed by Wikimedia pageview data and
    # accepts many page IDs per request. Its 30 daily observations are a direct
    # measured popularity proxy, far cheaper than one Analytics call per page.
    label = views_window()
    if state.get("viewsWindow") != label:
        state["viewsWindow"] = label
        state["viewsDone"] = []
        for page in state["pages"].values():
            page.pop("views", None)
        atomic_json(cache, state)
    done = set(state["viewsDone"])
    outstanding = [key for key in state["pages"] if key not in done]
    batches = [outstanding[start:start + 10] for start in range(0, len(outstanding), 10)]
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = {pool.submit(fetch_view_batch, batch): batch for batch in batches}
        for index, future in enumerate(as_completed(futures), 1):
            observed = future.result()
            for key, views in observed.items():
                state["pages"][key]["views"] = views
                done.add(key)
            state["viewsDone"] = sorted(done)
            atomic_json(cache, state)
            if index % 25 == 0 or index == len(batches):
                print(f"pageviews={len(done)}/{len(state['pages'])}", flush=True)
    return label


def classify(page: dict) -> list[str]:
    # Classify only when the article itself says so. Category ancestry supplies
    # search context, not a factual assertion about every member.
    text = page["name"] + " " + page.get("description", "")
    labels = [name for name, pattern in TOPIC_PATTERNS.items() if pattern.search(text)]
    return sorted(set(labels + page.get("topicHints", [])))


def export(state: dict, output: Path, views_window: str) -> None:
    records = []
    for page in state["pages"].values():
        if not page.get("description"):
            continue
        topics = classify(page)
        paths = [path for path in page["paths"] if not any(SKIP_CATEGORY.search(category) for category in path)]
        if not paths:
            continue
        roots = sorted({path[0] for path in paths})
        records.append({
            "id": page["id"], "name": page["name"], "aliases": page.get("aliases", []),
            "description": page["description"],
            "source": "https://en.wikipedia.org/wiki/" + quote(page["name"].replace(" ", "_"), safe="()"),
            "publisher": "Wikipedia contributors (CC BY-SA 4.0)",
            "license": "https://creativecommons.org/licenses/by-sa/4.0/",
            "categories": sorted({category for path in paths for category in path}),
            "categoryPaths": paths, "roots": roots, "topics": topics,
            **({"topicEvidence": page["topicEvidence"]} if page.get("topicEvidence") else {}),
            "views": page.get("views"), "viewsWindow": views_window,
            "revisionId": page.get("revisionId"), "revisionAt": page.get("revisionAt"),
        })
    records.sort(key=lambda p: (-(p["views"] or 0), p["name"].casefold()))
    topic_counts = dict(Counter(topic for record in records for topic in record["topics"]))
    payload = {
        "source": "English Wikipedia MediaWiki Action API (TextExtracts, redirects, revisions, PageViewInfo)",
        "importedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "viewsWindow": views_window,
        "viewsMeaning": "Observed Wikipedia daily pageviews summed over the prior 30 complete UTC days; a rough public familiarity proxy, not game answer frequency. Null means unmeasured.",
        "scope": "Bounded category traversal of named conspiracy, legend, pseudoscience, hoax, and related historical subjects; category membership alone does not assert a claim is false.",
        "categoryDepth": max((len(p) - 1 for r in records for p in r["categoryPaths"]), default=0),
        "categoryCount": len(state["visited"]),
        "articleCount": len(records),
        "topicCounts": topic_counts,
        "measuredViewsCount": sum(r["views"] is not None for r in records),
        "articles": records,
    }
    atomic_json(output, payload)
    print(json.dumps({key: payload[key] for key in ("categoryCount", "articleCount", "topicCounts", "measuredViewsCount", "viewsWindow")}, ensure_ascii=False), flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--max-categories", type=int, default=300)
    parser.add_argument("--max-depth", type=int, default=5)
    parser.add_argument("--no-views", action="store_true", help="Useful for checking category scope during development")
    args = parser.parse_args()
    if args.cache.exists():
        state = json.loads(args.cache.read_text(encoding="utf-8"))
    else:
        state = initial_state()
    crawl(state, args.cache, args.max_categories, args.max_depth)
    fetch_metadata(state, args.cache)
    enrich_topic_hints(state, args.cache)
    window = None
    if not args.no_views:
        window = fetch_views(state, args.cache)
    export(state, args.output, window)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted; re-run to resume from cache.", file=sys.stderr)
        raise SystemExit(130)
