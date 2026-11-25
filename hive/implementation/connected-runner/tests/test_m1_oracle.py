import json, os, sys
import pytest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "evaluator", "m1"))
import fixtures, gen_public, oracle  # noqa: E402


@pytest.mark.parametrize("name,fmt,data,exp", fixtures.FIXTURES, ids=[f[0] for f in fixtures.FIXTURES])
def test_fixture_matches_hand_expected(name, fmt, data, exp):
    assert oracle.derive_from_bytes(fmt, data) == exp
    assert oracle.accepts(fmt, data, exp)


def test_fixture_coverage():
    assert len(fixtures.FIXTURES) >= 12
    blob = b"".join(f[2] for f in fixtures.FIXTURES)
    for tok in (b",0\n", b"1000000000", b"1000000001", b",01\n", b"true", b"1.0"):
        assert tok in blob or tok.replace(b"\n", b"") in blob, tok
    assert b"a" * 128 in blob and b"a" * 129 in blob


def test_wrong_outputs_rejected():
    wrong = fixtures.wrong_outputs()
    assert len(wrong) >= 3
    by = {f[0]: f for f in fixtures.FIXTURES}
    for name, out in wrong:
        _, fmt, data, exp = by[name]
        assert out != exp
        assert not oracle.accepts(fmt, data, out), name


@pytest.mark.parametrize("fn,n,nj", [(gen_public.f_dev, 24, 0), (gen_public.f_sel, 20, 20)])
def test_public_partitions(fn, n, nj):
    cs = fn()
    assert len(cs) == n and sum(c["format"] == "json" for c in cs) == nj
    assert sum(not c["defective"] for c in cs) == (6 if n == 24 else 4)
    gen_public.check_balance(cs)
    for c in cs:  # both derivations already agreed at admission; re-check
        assert oracle.derive_from_bytes(c["format"], c["data"]) == c["expected"]
        assert not c["data"].startswith(b"\xef\xbb\xbf") and b"\r" not in c["data"]


def test_f_dev_file_matches_generator():
    import base64
    p = os.path.join(ROOT, "build", "m1", "data", "f_dev.jsonl")
    lines = [json.loads(l) for l in open(p, encoding="utf-8")]
    for l, c in zip(lines, gen_public.f_dev()):
        assert base64.b64decode(l["source"]) == c["data"] and l["expected"] == c["expected"]
