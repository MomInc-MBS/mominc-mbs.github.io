"""Deterministic extractor tool for the v0.4.x pinned-source experiment.

Its own small module so the experiment freeze can hash the FULL file bytes (not just the function source).
Pure: parses text it is given; never executes it; no I/O, no network, no model.
"""
from __future__ import annotations

import csv
import io


def csv_profile_v1(text: str) -> dict:
    rows = list(csv.reader(io.StringIO(text, newline="")))
    body = rows[1:]
    return {"header": rows[0] if rows else [], "rows": len(body), "widths": sorted({len(r) for r in body}), "chars": len(text)}
