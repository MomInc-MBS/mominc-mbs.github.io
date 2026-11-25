"""Independent deterministic verifier for the v0.4.x pinned-source experiment.

Deliberately shares no code with the driver's extractor: it takes only the raw
source bytes plus the frozen checks, recomputes everything itself and also
cross-checks the extractor's claimed profile. Pure; no I/O, no network, no model.
"""
from __future__ import annotations

import csv
import hashlib
import io
import re

VERIFIER_ID = "csv_profile_v1"


def check_csv_profile_v1(raw: bytes, checks: dict, claimed_profile: dict | None, expected: dict | None = None) -> dict:
    """Return {verdict: pass|fail, failures: [...], recomputed: {...}}. Never raises on bad data."""
    failures: list[str] = []
    rec: dict = {"sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}
    if expected is not None:  # frozen identity of the pinned source (None only for unapplied repair previews)
        if rec["sha256"] != expected["sha256"]:
            failures.append("sha256 differs from frozen expectation")
        if rec["bytes"] != expected["bytes"]:
            failures.append("byte length differs from frozen expectation")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return {"verifier": VERIFIER_ID, "verdict": "fail", "failures": ["not valid UTF-8 text"], "recomputed": rec}
    rows = list(csv.reader(io.StringIO(text, newline="")))
    header, body = (rows[0] if rows else []), rows[1:]
    rec.update(header=header, rows=len(body))
    if header != checks["header"]:
        failures.append(f"header {header} != frozen {checks['header']}")
    if len(body) != checks["rows"]:
        failures.append(f"row count {len(body)} != frozen {checks['rows']}")
    width = len(checks["header"])
    ragged = [i + 2 for i, r in enumerate(body) if len(r) != width]
    if ragged:
        failures.append(f"{len(ragged)} rows have != {width} columns (first at line {ragged[0]})")
    if not ragged and header == checks["header"]:
        col = header.index(checks["unique"])
        keys = [r[col] for r in body]
        bad = [k for k in keys if not re.fullmatch(checks["key_pattern"], k)]
        if bad:
            failures.append(f"{len(bad)} keys violate {checks['key_pattern']} (e.g. {bad[0]!r})")
        if len(set(keys)) != len(keys):
            failures.append("duplicate keys in column " + checks["unique"])
        names = [c for r in body for c in r]
        if any(not c.strip() for c in names):
            failures.append("empty cell")
        forbid = re.compile(checks["forbid_pattern"])
        hits = [c for c in names if forbid.search(c)]
        if hits:
            failures.append(f"{len(hits)} cells match forbidden style {checks['forbid_pattern']} (e.g. {hits[0]!r})")
    if claimed_profile is not None and (claimed_profile.get("rows") != rec["rows"]
                                        or claimed_profile.get("header") != rec["header"]):
        failures.append("extractor's claimed profile disagrees with recomputation")
    return {"verifier": VERIFIER_ID, "verdict": "fail" if failures else "pass",
            "failures": failures, "recomputed": rec}


VERIFIERS = {VERIFIER_ID: check_csv_profile_v1}
