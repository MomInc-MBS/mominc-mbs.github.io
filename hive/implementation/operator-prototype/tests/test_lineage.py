import pytest
from hive import lineage as L
from hive.run_state import RunStates, STATES
from hive.storage import Store

EV = "e" * 64
ROOT = {"root": "P0"}
OP = {"class": "data_rule", "improver_version": "1"}


def root(s): return L.register(s, "identity", [], {}, EV, ROOT)
def child(s, parents, body="strip"): return L.register(s, body, parents, OP, EV, {"family": "csv"})
def snap(s): return {k: s.get(k) for (k,) in s.db.execute("SELECT key FROM kv WHERE key LIKE 'lineage/%'").fetchall()}


def test_persistence_across_reopen(tmp_path):
    s = Store(tmp_path); r = root(s); c = child(s, [r]); s.close()
    s = Store(tmp_path)
    assert L.get(s, c)["parent_hashes"] == [r] and L.children_of(s, r) == [c] and L.ancestors_of(s, c) == [r]
    assert L.verify_lineage(s, c) == []


def test_failed_candidate_retained(tmp_path):
    s = Store(tmp_path); r = root(s); c = child(s, [r])
    L.record_result(s, c, "FAILED", {"x": 0}, ["artifacts/" + "a" * 64 + ".json"])
    assert c in L.children_of(s, r) and RunStates(s).resume(c)["state"] == "FAILED" and L.verify_lineage(s, c) == []


def test_multi_parent(tmp_path):
    s = Store(tmp_path); r = root(s); a = child(s, [r], "a"); b = child(s, [r], "b"); m = child(s, [a, b], "m")
    assert L.get(s, m)["parent_hashes"] == sorted([a, b]) and set(L.ancestors_of(s, m)) == {a, b, r}
    assert L.children_of(s, a) == [m] and L.verify_lineage(s, m) == []


@pytest.mark.parametrize("cls", ["generated", "code", "anything"])
def test_forbidden_operator(tmp_path, cls):
    s = Store(tmp_path); r = root(s)
    with pytest.raises(ValueError, match="FR-8"):
        L.register(s, "x", [r], {"class": cls}, EV, {})


def test_tamper_fails_verify(tmp_path):
    s = Store(tmp_path); r = root(s); c = child(s, [r])
    (s.root / L._ref(r)).write_text("{}")
    assert any(r in p for p in L.verify_lineage(s, c))


def test_index_rebuild_equal(tmp_path):
    s = Store(tmp_path); r = root(s); child(s, [r], "a"); child(s, [r], "b")
    before = snap(s)
    assert L.rebuild_index(s) == before and snap(s) == before


def test_no_promoted_state(tmp_path):
    s = Store(tmp_path); r = root(s); c = child(s, [r])
    assert "PROMOTED" not in STATES
    with pytest.raises(ValueError):
        L.record_result(s, c, "PROMOTED")
    assert RunStates(s).resume(c)["state"] == "ADMITTED"
    assert RunStates(s).events(c)[0]["payload"] == {"quarantined": True}


def test_hash_recomputes_from_fields(tmp_path):
    s = Store(tmp_path); r = root(s); c = child(s, [r])
    rec = s.read_artifact(L._ref(c))
    assert L._hash(rec) == c
    assert L.register(s, "strip", [r], OP, EV, {"family": "csv"}) == c  # same fields, same hash, idempotent


def test_root_must_be_p0(tmp_path):
    s = Store(tmp_path)
    with pytest.raises(ValueError, match="P0"):
        L.register(s, "x", [], {}, EV, {})
