"""Strict parsers and independent checks for the restricted data mission."""
from __future__ import annotations

import csv
import hashlib
import io
import json
import re

SCHEMA_VERSION = "hive-structured-task-v1"
INVENTORY_SCHEMA = "grouped_inventory_v1"
CLASSIFICATION_SCHEMA = "independent_labels_v1"
MAX_SOURCE_BYTES = 2 * 1024 * 1024
MAX_INVENTORY_ROWS = 256
MAX_CLASSIFICATION_ROWS = 12
MAX_TEXT_BYTES = 2000
MAX_INTEGER = 10**9
_SHA256 = re.compile(r"^[0-9a-f]{64}$")


class StructuredMissionError(ValueError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _json_bytes(data: bytes, label: str):
    try:
        return json.loads(data.decode("utf-8-sig"), object_pairs_hook=_unique_object,
                          parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise StructuredMissionError(f"{label} must be UTF-8 JSON") from exc


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON object key")
        result[key] = value
    return result


def parse_output(output):
    if not isinstance(output, str):
        return None
    try:
        value = json.loads(output, object_pairs_hook=_unique_object,
                           parse_constant=lambda item: (_ for _ in ()).throw(ValueError(item)))
    except (json.JSONDecodeError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _csv_rows(data: bytes):
    try:
        text = data.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
        if not reader.fieldnames or len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise StructuredMissionError("CSV must have unique named columns")
        rows = list(reader)
    except (UnicodeDecodeError, csv.Error) as exc:
        raise StructuredMissionError("source must be valid UTF-8 CSV") from exc
    if any(None in row or any(value is None for value in row.values()) for row in rows):
        raise StructuredMissionError("CSV rows must have exactly the declared number of fields")
    return list(reader.fieldnames), rows


def parse_source(data: bytes, source_format: str, schema_id: str):
    if not isinstance(data, bytes) or len(data) > MAX_SOURCE_BYTES:
        raise StructuredMissionError("source exceeds the 2 MiB limit")
    if source_format not in {"csv", "json"}:
        raise StructuredMissionError("source_format must be csv or json")
    if schema_id not in {INVENTORY_SCHEMA, CLASSIFICATION_SCHEMA}:
        raise StructuredMissionError("unsupported structured-data schema")
    if source_format == "csv":
        fields, rows = _csv_rows(data)
        expected = ["id", "group", "bytes"] if schema_id == INVENTORY_SCHEMA else ["id", "text"]
        if fields != expected:
            raise StructuredMissionError(f"CSV columns must be exactly {','.join(expected)} in order")
    else:
        rows = _json_bytes(data, "source")
        if not isinstance(rows, list):
            raise StructuredMissionError("JSON source must be an array of row objects")
    limit = MAX_INVENTORY_ROWS if schema_id == INVENTORY_SCHEMA else MAX_CLASSIFICATION_ROWS
    if not isinstance(rows, list) or not 0 < len(rows) <= limit:
        raise StructuredMissionError(f"source must contain 1 to {limit} rows")
    seen = set()
    checked = []
    for row in rows:
        expected = {"id", "group", "bytes"} if schema_id == INVENTORY_SCHEMA else {"id", "text"}
        if not isinstance(row, dict) or set(row) != expected:
            raise StructuredMissionError("source row does not match the pinned schema")
        row_id = row["id"]
        if not isinstance(row_id, str) or not row_id or len(row_id) > 128 or row_id in seen:
            raise StructuredMissionError("row IDs must be unique nonempty strings of at most 128 characters")
        seen.add(row_id)
        if schema_id == INVENTORY_SCHEMA:
            group = row["group"]
            raw_bytes = row["bytes"]
            if not isinstance(group, str) or not group or len(group) > 128:
                raise StructuredMissionError("inventory groups must be nonempty strings of at most 128 characters")
            if source_format == "csv":
                if not isinstance(raw_bytes, str) or not re.fullmatch(r"(?:0|[1-9][0-9]{0,9})", raw_bytes):
                    raise StructuredMissionError("bytes must be a canonical nonnegative decimal integer")
                raw_bytes = int(raw_bytes)
            if type(raw_bytes) is not int or not 0 <= raw_bytes <= MAX_INTEGER:
                raise StructuredMissionError("bytes must be an integer between 0 and 1,000,000,000")
            checked.append({"id": row_id, "group": group, "bytes": raw_bytes})
        else:
            text = row["text"]
            if not isinstance(text, str) or not 0 < len(text) <= MAX_TEXT_BYTES:
                raise StructuredMissionError("classification text must contain 1 to 2,000 characters")
            checked.append({"id": row_id, "text": text})
    return checked


def inventory_result(rows):
    groups = {}
    for row in rows:
        current = groups.setdefault(row["group"], {"count": 0, "bytes": 0})
        current["count"] += 1
        current["bytes"] += row["bytes"]
    return {"groups": dict(sorted(groups.items()))}


def validate_labels(labels, rows):
    if (not isinstance(labels, list) or not 2 <= len(labels) <= 12
            or any(not isinstance(label, str) or not label or len(label) > 128 for label in labels)
            or len(set(labels)) != len(labels)):
        raise StructuredMissionError("labels must be 2 to 12 unique nonempty strings")
    return labels


def parse_oracle(data: bytes, schema_id: str, rows: list[dict], labels=None):
    if len(data) > 64 * 1024:
        raise StructuredMissionError("oracle exceeds the 64 KiB limit")
    value = _json_bytes(data, "oracle")
    if schema_id == INVENTORY_SCHEMA:
        if not isinstance(value, dict) or set(value) != {"groups"} or value != inventory_result(rows):
            raise StructuredMissionError("inventory oracle must exactly reproduce source counts and byte sums")
        return value
    allowed = set(validate_labels(labels, rows))
    expected_ids = {row["id"] for row in rows}
    if (not isinstance(value, dict) or set(value) != {"labels"} or not isinstance(value["labels"], dict)
            or set(value["labels"]) != expected_ids
            or any(not isinstance(label, str) or label not in allowed for label in value["labels"].values())):
        raise StructuredMissionError("classification oracle must label every source row with an allowed label")
    return value


def field_verdicts(schema_id: str, rows: list[dict], expected: dict, actual: dict | None):
    if schema_id == INVENTORY_SCHEMA:
        verdicts = {"source_schema": True, "groups": {}}
        expected_groups = expected.get("groups", {})
        actual_groups = actual.get("groups", {}) if isinstance(actual, dict) else {}
        for group, record in expected_groups.items():
            observed = actual_groups.get(group)
            if not isinstance(observed, dict):
                observed = {}
            verdicts["groups"][group] = {
                "count": observed.get("count") == record["count"],
                "bytes": observed.get("bytes") == record["bytes"],
            }
        return verdicts
    expected_labels = expected.get("labels", {})
    actual_labels = actual.get("labels", {}) if isinstance(actual, dict) else {}
    return {"source_schema": True, "labels": {
        row["id"]: actual_labels.get(row["id"]) == expected_labels.get(row["id"])
        for row in rows}}


def output_matches(schema_id: str, rows: list[dict], expected: dict, actual: dict):
    verdicts = field_verdicts(schema_id, rows, expected, actual)
    if schema_id == INVENTORY_SCHEMA:
        return bool(verdicts["source_schema"] and all(
            all(fields.values()) for fields in verdicts["groups"].values())) and actual == expected
    return bool(verdicts["source_schema"] and all(verdicts["labels"].values())) and actual == expected
