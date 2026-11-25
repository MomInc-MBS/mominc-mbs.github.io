"""M1 inventory: typed views over structured_verifier (protocol §3). Views add only type adaptation and input checks.
This whole file is inlined into the container candidate, so keep imports to stdlib + the one stripped line below."""
from __future__ import annotations
import base64, csv, hashlib, io, json
from .structured_verifier import StructuredMissionError, parse_source, _csv_rows, _json_bytes, _unique_object, inventory_result, INVENTORY_SCHEMA, MAX_SOURCE_BYTES  # inline-strip

# Types: Source={"format","bytes"}; Rows=List[Row]; Report=dict. Strings are canonical type names.
TYPES = {"identity": ("Source", "Source"), "parse_whole": ("Source", "List[Row]"),
         "split_rows": ("Source", "List[Source]"), "aggregate": ("List[Row]", "Report")}
HEADER = ["id", "group", "bytes"]


def make_source(fmt, data):
    return {"format": fmt, "bytes": data}


def _check_source(src):
    if not (isinstance(src, dict) and set(src) == {"format", "bytes"} and isinstance(src["bytes"], bytes)):
        raise TypeError("input must be a Source {format, bytes}")
    if src["format"] not in ("csv", "json"):
        raise StructuredMissionError("source_format must be csv or json")
    if len(src["bytes"]) > MAX_SOURCE_BYTES:
        raise StructuredMissionError("source exceeds the 2 MiB limit")


def identity(src):
    return src


def parse_whole(src):
    _check_source(src)
    return parse_source(src["bytes"], src["format"], INVENTORY_SCHEMA)


def split_rows(src):
    _check_source(src)
    if src["format"] == "csv":
        fields, rows = _csv_rows(src["bytes"])
        if fields != HEADER:
            raise StructuredMissionError("CSV columns must be exactly id,group,bytes in order")
        out = []
        for row in rows:
            buf = io.StringIO(newline="")
            w = csv.writer(buf, lineterminator="\n")
            w.writerow(fields)
            w.writerow([row[f] for f in fields])
            out.append(make_source("csv", buf.getvalue().encode("utf-8")))
        return out
    rows = _json_bytes(src["bytes"], "source")
    if not isinstance(rows, list):
        raise StructuredMissionError("JSON source must be an array of row objects")
    return [make_source("json", json.dumps([el], ensure_ascii=True).encode("utf-8")) for el in rows]


def aggregate(rows):
    return inventory_result(rows)


PRIMS = {"identity": identity, "parse_whole": parse_whole, "split_rows": split_rows, "aggregate": aggregate}


def is_list_type(t):
    return t.startswith("List[")


def each_type(p_name):
    """Type of each(p): List[X] -> List[Y], flattened when Y is a list type."""
    x, y = TYPES[p_name]
    return "List[" + x + "]", (y if is_list_type(y) else "List[" + y + "]")


def each(p):
    """each(p)(xs, errors): applies p per element; StructuredMissionError -> errors.append((i, str(e))); anything else propagates."""
    flat = is_list_type(TYPES[p.__name__][1])

    def run(xs, errors):
        out = []
        for i, x in enumerate(xs):
            try:
                y = p(x)
            except StructuredMissionError as e:
                errors.append((i, str(e)))
                continue
            if flat:
                out.extend(y)
            else:
                out.append(y)
        return out
    return run


def inventory():
    import inspect
    sha = lambda f: hashlib.sha256(inspect.getsource(f).encode()).hexdigest()
    wraps = {"identity": [], "parse_whole": [parse_source, _json_bytes, _csv_rows, _unique_object],
             "split_rows": [_csv_rows, _json_bytes, _unique_object], "aggregate": [inventory_result]}
    pins = {n: {"pin": sha(PRIMS[n]), "wraps": {f.__name__: sha(f) for f in wraps[n]}} for n in PRIMS}
    pins["each"] = {"pin": sha(each), "wraps": {}}
    return pins


def run_workflow(steps, src):
    """Execute a validated step list; returns (value, errors). Errors outside each propagate (whole-source failure)."""
    value, errors = src, []
    for s in steps:
        if s.startswith("each("):
            value = each(PRIMS[s[5:-1]])(value, errors)
        else:
            value = PRIMS[s](value)
    return value, errors


def canonical_output(steps, src):
    """§2 canonical output with the §3.1 error channel; any uncaptured failure -> source_rejected."""
    try:
        report, errors = run_workflow(steps, src)
        out = dict(report)
        out["quarantined"] = [{"index": i, "reason": r} for i, r in sorted(errors, key=lambda e: e[0])]
    except Exception:
        out = {"error": "source_rejected"}
    return json.dumps(out, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def container_apply(steps, text):
    env = json.loads(text)
    one = lambda e: canonical_output(steps, make_source(e["format"], base64.b64decode(e["source_b64"])))
    return json.dumps([one(e) for e in env]) if isinstance(env, list) else one(env)  # list envelope = batch: JSON list of canonical outputs
