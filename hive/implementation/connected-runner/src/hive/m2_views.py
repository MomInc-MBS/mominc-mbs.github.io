"""M2 inventory (protocol §3): M1's views and `each`, plus one declared-preparation view, `to_json`.
Inlined into the container candidate after m1_views, so imports from M1 carry the inline-strip marker and
rebinding TYPES/PRIMS in the flat namespace makes M1's `each` see `to_json`."""
from __future__ import annotations
import hashlib, itertools, json
from .m1_views import TYPES, PRIMS, make_source, each, is_list_type, inventory as _m1_inventory  # inline-strip

TYPES = dict(TYPES, to_json=("List[Row]", "Source"))


def to_json(rows):
    return {"format": "json", "bytes": json.dumps(rows, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")}


PRIMS = dict(PRIMS, to_json=to_json)


def each_type(p_name):
    """Type of each(p) over the M2 TYPES: List[X] -> List[Y], flattened when Y is a list type."""
    x, y = TYPES[p_name]
    return "List[" + x + "]", (y if is_list_type(y) else "List[" + y + "]")


def run_workflow(steps, src):
    """Execute a validated step list; returns (value, errors). Errors outside each propagate."""
    value, errors = src, []
    for s in steps:
        if s.startswith("each("):
            value = each(PRIMS[s[5:-1]])(value, errors)
        else:
            value = PRIMS[s](value)
    return value, errors


def inventory():
    import inspect
    from . import m1_views
    pins = m1_views.inventory()
    pins["to_json"] = {"pin": hashlib.sha256(inspect.getsource(to_json).encode()).hexdigest(), "wraps": {}}
    return pins


def symbols():
    return list(TYPES) + [f"each({n})" for n in TYPES]


def symbol_type(sym):
    """(in_type, out_type) of a symbol, or None when unknown / too deep."""
    if sym in TYPES:
        return TYPES[sym]
    if isinstance(sym, str) and sym.startswith("each(") and sym.endswith(")") and sym[5:-1] in TYPES:
        return each_type(sym[5:-1])
    return None


def type_check(steps, in_type, out_type):
    """None if `steps` is a legal 1..3 step list from in_type to out_type; else the refusal reason."""
    if not isinstance(steps, list) or not 1 <= len(steps) <= 3:
        return "steps must be a list of 1..3"
    cur = in_type
    for s in steps:
        t = symbol_type(s)
        if t is None:
            return f"unknown or too deep symbol {s!r}"
        if t[0] != cur:
            return f"type error at {s!r}: expected {t[0]}, have {cur}"
        cur = t[1]
    return None if cur == out_type else f"workflow ends in {cur}, must end in {out_type}"


def enumerate_legal(in_type, out_type):
    out = [list(t) for n in range(1, 4) for t in itertools.product(symbols(), repeat=n) if type_check(list(t), in_type, out_type) is None]
    return sorted(out, key=lambda s: (len(s), s))


def all_lists():
    return [list(t) for n in range(1, 4) for t in itertools.product(symbols(), repeat=n)]
