import json
import pytest
from hive import m1_views as V, m1_workflow as W, structured_verifier as SV
from hive.structured_verifier import StructuredMissionError as SME

S = V.make_source
W3 = [["parse_whole", "aggregate"], ["identity", "parse_whole", "aggregate"], ["split_rows", "each(parse_whole)", "aggregate"]]
CSV_OK = b'id,group,bytes\na,g1,5\n"b,1","g ""q""",7\nc,g1,0\n'
JSON_OK = json.dumps([{"id": "a", "group": "g1", "bytes": 5}, {"id": "b", "group": "g2", "bytes": 7}]).encode()
CSV_BAD = b"id,group,bytes\na,g1,5\nb,g1,07\nc,g2,9\n"  # row 1 non-canonical
JSON_BAD = (b'[{"id":"a","group":"g","bytes":1},{"id":"b","group":"g","bytes":1.0},{"id":"c","group":"g","bytes":true},'
            b'{"id":"' + b"x" * 129 + b'","group":"g","bytes":1},{"id":"' + b"y" * 128 + b'","group":"g","bytes":2}]')
M_ID = "row IDs must be unique nonempty strings of at most 128 characters"
M_INT = "bytes must be an integer between 0 and 1,000,000,000"


def row_outcome(src):
    try:
        return V.parse_whole(src)
    except SME as e:
        return str(e)


def test_parse_whole_and_aggregate_equivalent():
    for fmt, data in (("csv", CSV_OK), ("json", JSON_OK)):
        assert V.parse_whole(S(fmt, data)) == SV.parse_source(data, fmt, "grouped_inventory_v1")
        rows = V.parse_whole(S(fmt, data))
        assert V.aggregate(rows) == SV.inventory_result(rows)
    for fmt, data in (("csv", CSV_BAD), ("json", JSON_BAD)):
        with pytest.raises(SME) as a:
            V.parse_whole(S(fmt, data))
        with pytest.raises(SME) as b:
            SV.parse_source(data, fmt, "grouped_inventory_v1")
        assert str(a.value) == str(b.value)
    assert V.identity("x") == "x"


def test_split_rows_per_row_outcomes():
    parts = V.split_rows(S("csv", CSV_BAD))
    assert [row_outcome(p) for p in parts] == [[{"id": "a", "group": "g1", "bytes": 5}],
        "bytes must be a canonical nonnegative decimal integer", [{"id": "c", "group": "g2", "bytes": 9}]]
    parts = V.split_rows(S("json", JSON_BAD))
    res = [row_outcome(p) for p in parts]
    assert res[0] == [{"id": "a", "group": "g", "bytes": 1}]
    assert res[1:3] == [M_INT, M_INT] and res[3] == M_ID
    assert res[4] == [{"id": "y" * 128, "group": "g", "bytes": 2}]
    # float bytes survive the re-emit as float (still rejected), bool as bool
    assert b"1.0" in parts[1]["bytes"] and b"true" in parts[2]["bytes"]
    # valid files: rows re-joined equal the whole parse (quotes in fields survive)
    for fmt, data in (("csv", CSV_OK), ("json", JSON_OK)):
        joined = [r for p in V.split_rows(S(fmt, data)) for r in V.parse_whole(p)]
        assert joined == V.parse_whole(S(fmt, data))
    assert V.split_rows(S("csv", CSV_OK))[1]["bytes"] == b'id,group,bytes\n"b,1","g ""q""",7\n'


def test_split_rows_source_level_errors():
    with pytest.raises(SME, match="columns"):
        V.split_rows(S("csv", b"id,bytes,group\na,1,g\n"))
    with pytest.raises(SME, match="array"):
        V.split_rows(S("json", b'{"a":1}'))
    with pytest.raises(TypeError):
        V.parse_whole(b"raw")


def test_each_captures_only_structured_error():
    def boom(x):
        if x == 1: raise SME("bad one")
        if x == 3: raise KeyError("other")
        return [x, x]
    V.TYPES["boom"] = ("Source", "List[Row]")
    try:
        boom.__name__ = "boom"
        errs = []
        assert V.each(boom)([0, 1, 2], errs) == [0, 0, 2, 2] and errs == [(1, "bad one")]
        with pytest.raises(KeyError):
            V.each(boom)([0, 3], [])
    finally:
        del V.TYPES["boom"]


def test_type_checker():
    legal = W.enumerate_legal()
    assert legal == W3 and len(list(__import__("itertools").product(W.symbols(), repeat=3))) + 64 + 8 == 584
    assert len(W.symbols()) == 8
    for bad in (["aggregate"], ["parse_whole"], ["each(parse_whole)", "aggregate"], ["rm"], ["each(each(parse_whole))", "aggregate"],
                ["identity"] * 4, [], ["split_rows", "parse_whole", "aggregate"], "parse_whole"):
        with pytest.raises(W.PolicyViolation):
            W.validate(bad)
    assert [W.canonical_digest(s) for s in W3] == [W.canonical_digest(s) for s in legal]
    assert len({W.canonical_digest(s) for s in W3}) == 3


def test_pins():
    inv = W.inventory()
    assert set(inv) == {"identity", "parse_whole", "split_rows", "aggregate", "each"}
    assert inv == V.inventory() and "parse_source" in inv["parse_whole"]["wraps"]


def test_propose_refusals_before_execution(tmp_path):
    from hive.storage import Store
    s = Store(tmp_path)
    runs0 = W.STATS["docker_runs"]  # process-global counter; other tests in the same run may have executed
    try:
        p = W.register_w_strict(s)
        assert W.propose(s, p, ["identity"])[0] == "refused"
        assert W.propose(s, p, ["rm_rf"])[0] == "refused"
        assert W.propose(s, p, W3[1])[0] == "registered"
        assert W.propose(s, p, W3[1])[0] == "refused"  # duplicate digest
        assert W.STATS["docker_runs"] == runs0
    finally:
        s.close()


def test_local_canonical_output():
    for steps in W3:
        o = V.canonical_output(steps, S("csv", CSV_OK))
        assert json.loads(o)["quarantined"] == [] and json.loads(o)["groups"]["g1"] == {"bytes": 5, "count": 2}
    assert V.canonical_output(W3[0], S("csv", CSV_BAD)) == '{"error":"source_rejected"}'
    r = json.loads(V.canonical_output(W3[2], S("csv", CSV_BAD)))
    assert r["quarantined"] == [{"index": 1, "reason": "bytes must be a canonical nonnegative decimal integer"}]
    assert r["groups"] == {"g1": {"bytes": 5, "count": 1}, "g2": {"bytes": 9, "count": 1}}


def _docker_ok():
    try:
        from hive.adapters.isolation import DockerIsolation, PINNED_IMAGE
        DockerIsolation().inspect(PINNED_IMAGE)
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _docker_ok(), reason="Docker/pinned image unavailable")
@pytest.mark.parametrize("steps", W3, ids=lambda s: ",".join(s))
def test_container_smoke(steps):
    from hive import experiment_compare as EC
    src = W.compile_source(steps)
    out = EC.run_isolated(src, W.envelope("csv", CSV_OK), {}, backend="container", operator_class="generated")
    assert out == V.canonical_output(steps, S("csv", CSV_OK))
    assert json.loads(EC.run_isolated(src, W.envelope("csv", b"id,group\n"), {}, backend="container",
                                      operator_class="generated")) in ({"error": "source_rejected"}, {"groups": {}, "quarantined": []})
