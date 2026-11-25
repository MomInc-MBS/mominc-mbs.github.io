"""M2 evaluator tests: oracle vs fixtures, wrong outputs, partition counts/cross-tabs (protocol sections 5 and 7)."""
import base64
import hashlib
import json
import os
import re
import sys

import pytest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EV = os.path.join(ROOT, "evaluator", "m2")
sys.path.insert(0, EV)
# evaluator/m1 uses the same bare module names; load M2's copies fresh, then restore whatever was cached.
_NAMES = ("fixtures", "gen_private", "gen_public", "oracle")
_saved = {n: sys.modules.pop(n) for n in _NAMES if n in sys.modules}
import fixtures  # noqa: E402
import gen_private  # noqa: E402
import gen_public  # noqa: E402
import oracle  # noqa: E402
for _n in _NAMES:
    sys.modules.pop(_n, None)
sys.modules.update(_saved)
sys.path.remove(EV)

PUB = os.path.join(ROOT, "build", "m2", "data")
PRIV = os.path.join(ROOT, ".hive", "m2-private")
ENV = fixtures.c_envelope


# ---- oracle ------------------------------------------------------------------------------

def test_oracle_source_is_independent():
    src = open(os.path.join(EV, "oracle.py"), encoding="utf-8").read()
    imports = set(re.findall(r"^(?:import|from)\s+(\w+)", src, re.M))
    assert imports <= {"csv", "io", "json", "math"}, imports
    for name in ("parse_source", "_csv_rows", "_json_bytes", "inventory_result", "summarize_inventory"):
        assert name not in src, name


@pytest.mark.parametrize("name,fmt,data,exp", fixtures.R_FIXTURES, ids=[f[0] for f in fixtures.R_FIXTURES])
def test_r_fixture(name, fmt, data, exp):
    assert oracle.r_from_bytes(fmt, data) == exp
    assert oracle.accepts_r(fmt, data, exp)


@pytest.mark.parametrize("name,files,exp", fixtures.C_FIXTURES, ids=[f[0] for f in fixtures.C_FIXTURES])
def test_c_fixture(name, files, exp):
    assert oracle.c_from_envelope(ENV(files)) == exp
    assert oracle.accepts_c(ENV(files), exp)


def test_fixture_coverage():
    assert len(fixtures.R_FIXTURES) >= 12 and len(fixtures.C_FIXTURES) >= 12
    names = {f[0] for f in fixtures.R_FIXTURES}
    assert {"r_csv_valid", "r_json_ws_unsorted_cafe", "r_json_already_canonical", "r_csv_all_invalid"} <= names
    rblob = b"".join(f[2] for f in fixtures.R_FIXTURES)
    cblob = "".join(t for _, fs, _ in fixtures.C_FIXTURES for _, t in fs).encode()
    for blob in (rblob, cblob):
        for tok in (b",0\n", b"1000000000", b"1000000001", b",01\n", b"true", b"1.0", b"a" * 128, b"a" * 129):
            assert tok in blob, tok
    cmap = {f[0] for f in fixtures.C_FIXTURES}
    assert {"c_all_valid_csv", "c_invalid_first_file", "c_invalid_middle_file", "c_invalid_last_file",
            "c_all_invalid", "c_first_failing_row_order", "c_row_precedence"} <= cmap
    # every defect message appears in the C fixture expectations, every category in the R fixtures is exercised
    allc = "".join(f[2] for f in fixtures.C_FIXTURES)
    for r in oracle.REASON.values():
        assert r in allc
    # the canonical JSON fixture is canonical; every other JSON fixture file is not
    for n, fmt, data, _ in fixtures.R_FIXTURES:
        if fmt == "json":
            assert oracle.is_canonical_json(data) == (n == "r_json_already_canonical"), n


def test_r_wrong_outputs_rejected():
    by = {f[0]: f for f in fixtures.R_FIXTURES}
    wrong = fixtures.r_wrong_outputs()
    assert len(wrong) >= 4
    for name, out in wrong:
        _, fmt, data, exp = by[name]
        assert out != exp
        assert not oracle.accepts_r(fmt, data, out), (name, out)


def test_c_wrong_outputs_rejected():
    by = {f[0]: f for f in fixtures.C_FIXTURES}
    wrong = fixtures.c_wrong_outputs()
    assert len(wrong) >= 4
    for name, out in wrong:
        _, files, exp = by[name]
        assert out != exp
        assert not oracle.accepts_c(ENV(files), out), (name, out)


def test_oracle_record_vs_bytes_disagreement_is_caught():
    rec = [{"cat": 0, "id": "r1", "group": "a", "bytes": 5}]
    with pytest.raises(AssertionError):
        oracle.admit_r("csv", b"id,group,bytes\nr1,a,6\n", rec)
    with pytest.raises(AssertionError):
        oracle.admit_c(ENV([("csv", "id,group,bytes\nr1,a,6\n"), ("csv", "id,group,bytes\nr1,a,1\n")]),
                       [{"rows": rec}, {"rows": [{"cat": 0, "id": "r1", "group": "a", "bytes": 1}]}])


# ---- partitions --------------------------------------------------------------------------

def _file_sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


@pytest.fixture(scope="module")
def public():
    return gen_public.partitions()


@pytest.mark.parametrize("name", ["f_dev_R", "f_sel_R", "f_dev_C", "f_sel_C"])
def test_public_partition(public, name):
    cs, kw = public[name]
    assert len(cs) == (24 if "dev" in name else 20)
    stats = gen_public.check_partition(cs, **kw)
    assert stats["invalid_units"] >= 1
    # the committed file is exactly what the generator produces, and was written LF-only
    path = os.path.join(PUB, name + ".jsonl")
    blob = open(path, "rb").read()
    assert b"\r" not in blob
    assert hashlib.sha256(blob).hexdigest() == hashlib.sha256("".join(gen_public.to_line(c) for c in cs).encode()).hexdigest()


def test_public_data_not_in_private_seed_space():
    assert all(710003 <= s < 3_000_000_000 for s in gen_public.SEEDS.values())
    assert len(set(gen_public.SEEDS.values())) == 4


def _groups_of(cases):
    out = set()
    for c in cases:
        units = [(c["format"], c["data"])] if c["kind"] == "R" else oracle.decode_envelope(c["data"])
        for fmt, data in units:
            for r in oracle.raw_rows(fmt, data):
                cat, _, g, _ = oracle.classify(fmt, r)
                if cat == 0:
                    out.add(g)
    return out


def test_vocabularies_disjoint_from_m1_and_each_other(public):
    g7 = _groups_of(public["f_dev_R"][0] + public["f_dev_C"][0] + public["f_sel_R"][0] + public["f_sel_C"][0])
    assert g7 and not {x.rstrip("z") for x in g7} & set(gen_private.M1_VOCABS)


@pytest.mark.parametrize("seed", [1, 2, 3, 12345, 99991])
def test_g8_g9_generators_meet_section5(seed):
    seeds = {k: seed * 1000 + i for i, k in enumerate(gen_private.CHECK)}
    parts = gen_private.build(seeds)
    for name, cs in parts.items():
        assert len(cs) == (60 if "final" in name else 20)
        gen_public.check_partition(cs, **gen_private.CHECK[name])
        g = {x.rstrip("z") for x in _groups_of(cs)}
        assert g and not g & set(gen_private.M1_VOCABS) and not g & set(gen_public.VOCAB_G7)
        assert g <= set(gen_private.VOCAB_G8 + gen_private.VOCAB_G9)
        # JSON forms are recorded for every JSON R case and each form is exercised
        if name.endswith("_R"):
            forms = {c["counts"]["form"] for c in cs if c["format"] == "json"}
            assert forms == set(gen_public.FORMS)
    assert not {c["case_id"] for c in parts["f_final_R"]} & {c["case_id"] for c in parts["f_reuse_R"]}


def test_g9_shift_properties():
    parts = gen_private.build({k: 7 + i for i, k in enumerate(gen_private.CHECK)})
    for c in parts["f_reuse_R"]:
        assert 40 <= c["counts"]["rows"] <= 60
    json_c = [c for c in parts["f_reuse_R"] if c["format"] == "json"]
    assert all("unsorted" in c["forms"] or "nonascii" in c["forms"] or "whitespace" in c["forms"] for c in json_c)
    for c in parts["f_reuse_C"]:
        assert 5 <= c["counts"]["files"] <= 6 and all(20 <= n <= 30 for n in c["counts"]["rows"])


def test_partition_expected_survives_tampering(public):
    for name in ("f_dev_R", "f_dev_C"):
        c = public[name][0][0]
        bad = c["expected"].replace("1", "2", 1) if "1" in c["expected"] else c["expected"] + " "
        acc = oracle.accepts_r(c["format"], c["data"], bad) if c["kind"] == "R" else oracle.accepts_c(c["data"], bad)
        assert not acc


# ---- private partitions (skipped when the private area is absent, e.g. a fresh clone) -----

PRIVATE_FILES = {"f_final_R": (60, "R"), "f_reuse_R": (20, "R"), "f_final_C": (60, "C"), "f_reuse_C": (20, "C")}


def _load(path, kind):
    cases = []
    for line in open(path, encoding="utf-8"):
        rec = json.loads(line)
        cases.append({"kind": kind, "case_id": rec["case_id"], "format": rec["format"],
                      "data": base64.b64decode(rec["source"]), "expected": rec["expected"],
                      "defective": (rec["counts"]["defective"] > 0) if kind == "R" else rec["counts"]["invalid_files"] > 0,
                      "counts": rec["counts"]})
    return cases


@pytest.mark.skipif(not os.path.isdir(PRIV), reason="private area not present")
@pytest.mark.parametrize("name", sorted(PRIVATE_FILES))
def test_private_partition(name):
    n, kind = PRIVATE_FILES[name]
    path = os.path.join(PRIV, name + ".jsonl")
    assert b"\r" not in open(path, "rb").read()
    cs = _load(path, kind)
    assert len(cs) == n
    gen_public.check_partition(cs, **gen_private.CHECK[name])  # recomputes everything from the bytes


@pytest.mark.skipif(not os.path.isdir(PRIV), reason="private area not present")
def test_private_files_are_gitignored():
    import subprocess
    r = subprocess.run(["git", "check-ignore", "-q", ".hive/m2-private/f_final_R.jsonl"], cwd=ROOT)
    assert r.returncode == 0
