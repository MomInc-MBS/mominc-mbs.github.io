"""Finite data and text task contracts; model text never becomes executable code."""
from __future__ import annotations


def task_ok(task):
    inp, expected = task["input"], task["expected"]
    if task["category"] == "structured_data":
        rows = inp.get("rows")
        return (task["evaluator"] == "grouped_inventory_v1" and
                isinstance(rows, list) and 0 < len(rows) <= 256 and
                all(isinstance(row, dict) and set(row) == {"id", "group", "bytes"} and
                    isinstance(row["id"], str) and row["id"] and
                    isinstance(row["group"], str) and row["group"] and
                    type(row["bytes"]) is int and 0 <= row["bytes"] <= 10**9
                    for row in rows) and len({row["id"] for row in rows}) == len(rows) and
                task["allowed_tools"] == ["summarize_inventory"] and
                task["tool_schemas"] == {"summarize_inventory": {"rows": "supplied rows"}} and
                set(expected) == {"groups"})
    if task["category"] == "text_classification":
        items, labels = inp.get("items"), inp.get("labels")
        return (task["evaluator"] == "independent_labels_v1" and
                isinstance(items, list) and 0 < len(items) <= 12 and
                all(isinstance(item, dict) and set(item) == {"id", "text"} and
                    isinstance(item["id"], str) and item["id"] and
                    isinstance(item["text"], str) and 0 < len(item["text"]) <= 2000
                    for item in items) and len({item["id"] for item in items}) == len(items) and
                isinstance(labels, dict) and 2 <= len(labels) <= 12 and
                all(isinstance(k, str) and k and isinstance(v, str) and v for k, v in labels.items()) and
                task["allowed_tools"] == [] and task["tool_schemas"] == {} and
                set(expected) == {"labels"} and isinstance(expected["labels"], dict) and
                set(expected["labels"]) == {item["id"] for item in items} and
                all(value in labels for value in expected["labels"].values()))
    return False


def summarize_inventory(rows):
    groups = {}
    for row in rows:
        group = groups.setdefault(row["group"], {"count": 0, "bytes": 0})
        group["count"] += 1
        group["bytes"] += row["bytes"]
    return {"groups": dict(sorted(groups.items()))}


def verify_output(task, parsed):
    if task["category"] == "text_classification":
        # Labels are independently authored development criteria, never put in request_view.
        return set(parsed) == {"labels"} and parsed == task["expected"]
    # Independent implementation: sort/group/sum, rather than the executor's accumulator.
    from itertools import groupby
    groups = {}
    for key, values in groupby(sorted(task["input"]["rows"], key=lambda row: row["group"]),
                               key=lambda row: row["group"]):
        rows = list(values)
        groups[key] = {"count": len(rows), "bytes": sum(row["bytes"] for row in rows)}
    actual = parsed.get("groups")
    return (set(parsed) == {"groups"} and isinstance(actual, dict) and
            all(isinstance(value, dict) and set(value) == {"count", "bytes"} and
                all(type(number) is int for number in value.values()) for value in actual.values()) and
            actual == groups and task["expected"] == {"groups": groups})
