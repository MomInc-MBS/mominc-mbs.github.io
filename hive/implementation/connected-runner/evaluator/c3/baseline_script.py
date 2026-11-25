"""C3 scripted baseline: a straightforward HAND-WRITTEN inventory diff (not model output, not learned)."""
import json


def run(env):
    docs = [{r["id"]: r for r in json.loads(f["text"])} for f in env["files"]]
    b, a = docs
    out = {"added": [], "removed": [], "changed": [], "unchanged": 0}
    for i in sorted(set(a) | set(b)):
        if i not in b:
            out["added"].append({"bytes": a[i]["bytes"], "group": a[i]["group"], "id": i})
        elif i not in a:
            out["removed"].append({"bytes": b[i]["bytes"], "group": b[i]["group"], "id": i})
        elif (a[i]["group"], a[i]["bytes"]) != (b[i]["group"], b[i]["bytes"]):
            out["changed"].append({"id": i, "before": {"bytes": b[i]["bytes"], "group": b[i]["group"]},
                                   "after": {"bytes": a[i]["bytes"], "group": a[i]["group"]}})
        else:
            out["unchanged"] += 1
    return json.dumps(out, sort_keys=True, separators=(",", ":"))
