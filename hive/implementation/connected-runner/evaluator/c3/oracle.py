"""C3 independent reference for inventory_diff. Stdlib only; nothing from src/hive."""
import json


def dumps(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"))


def expected(env):
    """env = {"files":[{"format":"json","text":BEFORE},{"format":"json","text":AFTER}]}, each text a JSON array of {id,group,bytes}."""
    docs = []
    for f in env["files"]:
        assert set(f) == {"format", "text"} and f["format"] == "json"
        rows = json.loads(f["text"])
        assert isinstance(rows, list) and len({r["id"] for r in rows}) == len(rows)
        docs.append({r["id"]: {"bytes": r["bytes"], "group": r["group"], "id": r["id"]} for r in rows})
    b, a = docs
    out = {"added": [a[i] for i in sorted(a) if i not in b], "removed": [b[i] for i in sorted(b) if i not in a], "changed": [], "unchanged": 0}
    for i in sorted(a):
        if i in b:
            if (a[i]["group"], a[i]["bytes"]) == (b[i]["group"], b[i]["bytes"]):
                out["unchanged"] += 1
            else:
                out["changed"].append({"id": i, "before": {"bytes": b[i]["bytes"], "group": b[i]["group"]},
                                       "after": {"bytes": a[i]["bytes"], "group": a[i]["group"]}})
    return dumps(out)
