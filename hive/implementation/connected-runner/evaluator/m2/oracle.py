"""M2 oracle for effects R (row-convert-v1) and C (batch-merge-v1).

Written from docs/M2_PROTOCOL.md sections 2 and 7 only. Stdlib only: csv and json read bytes,
nothing from src/hive is imported or called.
"""
import csv
import io
import json
import math

R1 = "source row does not match the pinned schema"
R2 = "row IDs must be unique nonempty strings of at most 128 characters"
R3 = "inventory groups must be nonempty strings of at most 128 characters"
R4 = "bytes must be a canonical nonnegative decimal integer"
R5 = "bytes must be an integer between 0 and 1,000,000,000"
REASON = {1: R1, 2: R2, 3: R3, 4: R4, 5: R5}
LIMIT = 10**9
ERR = '{"error":"source_rejected"}'


def dumps(o):
    """The protocol's canonical JSON text."""
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _csv_canon(s):
    if s == "0":
        return True
    return 1 <= len(s) <= 10 and s[0] in "123456789" and all(c in "0123456789" for c in s)


def _name_ok(v):
    return isinstance(v, str) and 0 < len(v) <= 128


def classify(fmt, row):
    """Return (cat, id, group, bytes); cat 0 means the row is valid."""
    if fmt == "json":
        if not isinstance(row, dict) or set(row) != {"id", "group", "bytes"}:
            return 1, None, None, None
        i, g, b = row["id"], row["group"], row["bytes"]
    else:
        i, g, b = row
    if not _name_ok(i):
        return 2, None, None, None
    if not _name_ok(g):
        return 3, None, None, None
    if fmt == "csv":
        if not _csv_canon(b):
            return 4, None, None, None
        b = int(b)
    if type(b) is not int or not 0 <= b <= LIMIT:
        return 5, None, None, None
    return 0, i, g, b


def _finite(o):
    if isinstance(o, float):
        return math.isfinite(o)
    if isinstance(o, list):
        return all(_finite(x) for x in o)
    if isinstance(o, dict):
        return all(_finite(x) for x in o.values())
    return True


def _no_dups(pairs):
    d = {}
    for k, v in pairs:
        if k in d:
            raise ValueError("duplicate key")
        d[k] = v
    return d


def _bad_const(c):
    raise ValueError("non-finite constant")


def raw_rows(fmt, data):
    """Parse source bytes to raw rows (CSV: lists of fields after the header; JSON: array items)."""
    if data.startswith(b"\xef\xbb\xbf"):
        raise ValueError("BOM")
    text = data.decode("utf-8")
    if fmt == "csv":
        rows = list(csv.reader(io.StringIO(text, newline="")))
        if not rows or rows[0] != ["id", "group", "bytes"]:
            raise ValueError("header")
        return rows[1:]
    rows = json.loads(text, object_pairs_hook=_no_dups, parse_constant=_bad_const)
    if not isinstance(rows, list) or not _finite(rows):
        raise ValueError("not a finite array")
    return rows


def check_source_rules(fmt, data):
    """The generator guarantees of section 2; returns (rows, defective_rows). Raises on violation."""
    rows = raw_rows(fmt, data)
    if not 1 <= len(rows) <= 60:
        raise ValueError("row count")
    if fmt == "csv" and any(len(r) != 3 for r in rows):
        raise ValueError("csv field count")
    cls = [classify(fmt, r) for r in rows]
    bad = sum(1 for c in cls if c[0])
    if bad and len(rows) < 2:
        raise ValueError("defective file with fewer than 2 rows")
    ids = [(r[0] if fmt == "csv" else r["id"]) for r, c in zip(rows, cls) if c[0] != 1]
    ids = [i for i in ids if isinstance(i, str)]
    if len(set(ids)) != len(ids):
        raise ValueError("duplicate id")
    return len(rows), bad


# ---- JSON non-canonical rule (section 2) -------------------------------------------------

def is_canonical_json(data):
    return data == dumps(json.loads(data.decode("utf-8"), object_pairs_hook=_no_dups)).encode("utf-8")


def json_forms(data):
    """Which non-canonical forms a JSON file shows: nonascii, unsorted, whitespace."""
    text = data.decode("utf-8")
    seen = [False]

    def hook(pairs):
        keys = [k for k, _ in pairs]
        if keys != sorted(keys):
            seen[0] = True
        return _no_dups(pairs)

    rows = json.loads(text, object_pairs_hook=hook)
    forms = set()
    if any(ord(c) > 127 for c in text):
        forms.add("nonascii")
    if seen[0]:
        forms.add("unsorted")
    if text != json.dumps(rows, separators=(",", ":"), ensure_ascii=False):
        forms.add("whitespace")
    return forms


# ---- effect R ----------------------------------------------------------------------------

def r_from_bytes(fmt, data):
    """Independent derivation from the source bytes."""
    out = []
    for row in raw_rows(fmt, data):
        cat, i, g, b = classify(fmt, row)
        if cat:
            return ERR
        out.append({"bytes": b, "group": g, "id": i})
    return dumps({"converted": dumps(out), "quarantined": []})


def r_from_record(rows):
    """Generator record: list of {"cat", "id", "group", "bytes"} per data row."""
    if any(r["cat"] for r in rows):
        return ERR
    return dumps({"converted": dumps([{"bytes": r["bytes"], "group": r["group"], "id": r["id"]} for r in rows]),
                  "quarantined": []})


def admit_r(fmt, data, rows):
    check_source_rules(fmt, data)
    a, b = r_from_record(rows), r_from_bytes(fmt, data)
    if a != b:
        raise AssertionError("R record/bytes disagree:\n%s\n%s" % (a, b))
    return a


def accepts_r(fmt, data, output):
    return output == r_from_bytes(fmt, data)


# ---- effect C ----------------------------------------------------------------------------

def decode_envelope(env):
    obj = json.loads(env.decode("utf-8"), object_pairs_hook=_no_dups)
    if not isinstance(obj, dict) or set(obj) != {"files"} or not isinstance(obj["files"], list):
        raise ValueError("envelope")
    out = []
    for f in obj["files"]:
        if set(f) != {"format", "text"} or f["format"] not in ("csv", "json") or not isinstance(f["text"], str):
            raise ValueError("envelope file")
        out.append((f["format"], f["text"].encode("utf-8")))
    return out


def _merge(per_file):
    """per_file: list of ('ok', [(group, bytes)...]) or ('bad', cat)."""
    groups, quar = {}, []
    for idx, (st, val) in enumerate(per_file):
        if st == "bad":
            quar.append({"index": idx, "reason": REASON[val]})
            continue
        for g, b in val:
            e = groups.setdefault(g, {"bytes": 0, "count": 0})
            e["bytes"] += b
            e["count"] += 1
    return dumps({"groups": groups, "quarantined": quar})


def c_from_envelope(env):
    per = []
    for fmt, data in decode_envelope(env):
        pairs, bad = [], 0
        for row in raw_rows(fmt, data):
            cat, _, g, b = classify(fmt, row)
            if cat:
                bad = cat  # the first failing row decides the reason
                break
            pairs.append((g, b))
        per.append(("bad", bad) if bad else ("ok", pairs))
    return _merge(per)


def c_from_record(files):
    """Generator record: list of {"rows": [{"cat","group","bytes"}...]} per file."""
    per = []
    for f in files:
        first = next((r["cat"] for r in f["rows"] if r["cat"]), 0)
        per.append(("bad", first) if first else ("ok", [(r["group"], r["bytes"]) for r in f["rows"]]))
    return _merge(per)


def check_batch_rules(env):
    """Each file obeys the R source rules (here 1-30 rows); returns [(fmt, rows, defective_rows)]."""
    info = []
    for fmt, data in decode_envelope(env):
        n, bad = check_source_rules(fmt, data)
        if n > 30:
            raise ValueError("C file over 30 rows")
        info.append((fmt, n, bad))
    if not 2 <= len(info) <= 6:
        raise ValueError("file count")
    return info


def admit_c(env, files):
    check_batch_rules(env)
    a, b = c_from_record(files), c_from_envelope(env)
    if a != b:
        raise AssertionError("C record/envelope disagree:\n%s\n%s" % (a, b))
    return a


def accepts_c(env, output):
    return output == c_from_envelope(env)
