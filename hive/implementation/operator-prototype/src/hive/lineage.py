"""P2 lineage store: genomes are immutable sha-addressed artifacts; lifecycle = one RunStates run per candidate.
No new tables. kv index is rebuildable from artifacts. No promoted state exists here (P0 stays incumbent)."""
from __future__ import annotations
import hashlib
from .run_state import RunStates, STATES
from .storage import _json

# D7-D11 (mutation scope) are BLOCKED(owner). generated/code operators need backend="container" (FR-8 sandbox).
OPERATORS = frozenset({"data_rule"})
CONTAINER_OPERATORS = frozenset({"generated", "code"})  # FR-8 lifted: allowed only when the caller declares backend="container"
RESULTS = frozenset({"ACCEPTED", "REJECTED", "FAILED"})  # evidence only; no PROMOTED
_PRE = {"ACCEPTED": ("RUNNING", "CHECKPOINTED", "VERIFYING"), "REJECTED": ("RUNNING", "CHECKPOINTED", "VERIFYING"), "FAILED": ()}


def _hash(rec): return hashlib.sha256(_json(rec).encode()).hexdigest()
def _ref(h): return f"artifacts/{h}.json"


def register(store, body, parent_hashes, operator, evaluator_sha256, provenance, backend="process"):
    parents = sorted(set(parent_hashes))
    if not parents:
        if provenance.get("root") != "P0": raise ValueError("lineage root must be P0 (provenance.root == 'P0')")
        operator = {"class": "P0"}
    else:
        if backend == "container" and operator.get("class") in CONTAINER_OPERATORS:
            from .adapters.isolation import DockerIsolation, PINNED_IMAGE
            DockerIsolation().inspect(PINNED_IMAGE)  # fail closed (SandboxUnavailable) if Docker/image digest cannot be proved
        elif operator.get("class") not in OPERATORS:
            raise ValueError(f"operator class {operator.get('class')!r} refused: only {sorted(OPERATORS)} until FR-8 sandbox is lifted and D7-D11 define scope")
        for p in parents:
            if store.get("lineage/genome/" + p) is None: raise ValueError(f"unknown parent {p}")
    rec = {"kind": "genome", "parent_hashes": parents, "body_ref": store.put_artifact({"text": body}),
           "operator": operator, "backend": backend, "evaluator_sha256": evaluator_sha256, "provenance": provenance}
    h = _hash(rec)
    assert store.put_artifact(rec) == _ref(h)
    store.set("lineage/genome/" + h, _ref(h))
    for p in parents:
        store.set("lineage/children/" + p, sorted(set(store.get("lineage/children/" + p, [])) | {h}))
    RunStates(store).transition(h, "ADMITTED", "admit", {"quarantined": True})
    return h


def get(store, h):
    ref = store.get("lineage/genome/" + h)
    if ref is None: raise KeyError(h)
    return store.read_artifact(ref)


def children_of(store, h): return store.get("lineage/children/" + h, [])


def ancestors_of(store, h):
    seen, todo = [], list(get(store, h)["parent_hashes"])
    while todo:
        p = todo.pop(0)
        if p not in seen: seen.append(p); todo += get(store, p)["parent_hashes"]
    return seen


def record_result(store, h, outcome, score=None, evidence_refs=()):
    if outcome not in RESULTS or outcome not in STATES: raise ValueError(f"result must be one of {sorted(RESULTS)}; promotion is owner-only, outside this store")
    rs = RunStates(store)
    for s in _PRE[outcome]: rs.transition(h, s, "pre-" + s.lower())
    return rs.transition(h, outcome, "result", {"score": score, "evidence_refs": list(evidence_refs)})


def verify_lineage(store, h):
    """Returns a list of problems; empty = verified."""
    bad, todo, seen = [], [h], set()
    while todo:
        c = todo.pop()
        if c in seen: continue
        seen.add(c)
        try:
            rec = store.read_artifact(_ref(c))  # re-hashes the file
            if _hash(rec) != c: bad.append(f"{c}: hash does not recompute from fields")
            store.read_artifact(rec["body_ref"])
            if not rec["parent_hashes"] and rec["provenance"].get("root") != "P0": bad.append(f"{c}: root is not P0")
            RunStates(store).resume(c)
        except Exception as e:
            bad.append(f"{c}: {type(e).__name__}: {e}"); continue
        todo += rec["parent_hashes"]
    return bad


def rebuild_index(store):
    """Drop and rebuild lineage/* kv keys from genome artifacts; returns the index."""
    idx = {}
    for f in sorted(store.artifacts.glob("*.json")):
        try: rec = store.read_artifact("artifacts/" + f.name)
        except ValueError: continue
        if isinstance(rec, dict) and rec.get("kind") == "genome":
            idx["lineage/genome/" + f.stem] = "artifacts/" + f.name
            for p in rec["parent_hashes"]:
                idx.setdefault("lineage/children/" + p, []).append(f.stem)
    store.db.execute("DELETE FROM kv WHERE key LIKE 'lineage/%'")
    for k, v in idx.items(): store.set(k, sorted(v) if isinstance(v, list) else v)
    return {k: sorted(v) if isinstance(v, list) else v for k, v in idx.items()}
