"""C3: capability-gap discovery. Stub LLM only (scripts/m2_stub_server.py); container runs are faked except the one real-container test."""
import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

from hive import discovery as D
from hive import experiment_compare as EC
from hive import goal_runner as G
from hive import m2_model as M
from hive import operator_runtime as O
from hive.storage import Store

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import m2_stub_server as STUB  # noqa: E402

GOOD = b"id,group,bytes\na.txt,docs,10\nb.png,img,2048\nc.md,docs,5\n"
OTHER = b"id,group,bytes\nx,docs,1\ny,img,2\n"
CORRECT = "```python\n" + (ROOT / "evaluator" / "c3" / "baseline_script.py").read_text(encoding="utf-8") + "```"
WRONGS = [f"```python\nimport json\ndef run(env):\n    return json.dumps({{\"v\": {i}}})\n```" for i in range(3)]


def fake_container(src, text, checks=None, timeout=None, max_out=None, *, backend="container", operator_class="generated"):
    ns = {}
    exec(compile(src, "<cand>", "exec"), ns)
    return ns["apply"](text, checks)


@pytest.fixture
def fake_runs(monkeypatch):
    calls = []
    monkeypatch.setattr(EC, "run_isolated", lambda *a, **k: (calls.append(1), fake_container(*a, **k))[1])

    def launch(args):  # the evaluator, in-process, with the same fake container
        with D.c3_scope():
            D._load("evaluate").main(args, run_container=lambda src, text: (calls.append(1), fake_container(src, text))[1])
        return SimpleNamespace(returncode=0, stdout="", stderr="")
    monkeypatch.setattr(D, "_launch", launch)
    return calls


@pytest.fixture
def env(tmp_path):
    store = tmp_path / "s"
    s = Store(store)
    O.import_bundle(s)
    s.close()
    allowed = tmp_path / "allowed"
    allowed.mkdir()
    (allowed / "one.csv").write_bytes(GOOD)
    (allowed / "two.csv").write_bytes(OTHER)
    for d in "AB":
        (allowed / d).mkdir()
        (allowed / d / "f.txt").write_bytes(b"x" * 3)
    return store, allowed, tmp_path / "priv"


def submit(env, sources=("one.csv", "two.csv"), **kw):
    store, allowed, _ = env
    c, ins = G.prepare(store, allowed, "Compare the before and after inventories", list(sources), deliverable="inventory_diff", **kw)
    return G.run_goal(store, c, ins)


def opened(env, **kw):
    store, _, priv = env
    s = Store(store)
    try:
        return D.open_experiment(s, submit(env)["gap_ref"], private_dir=priv, seed=7, **kw)
    finally:
        s.close()


def stub(replies, tmp_path):
    srv, url = STUB.serve_thread({"R": replies}, log=str(tmp_path / "req.jsonl"))
    return srv, url


def run(env, exp, url, **kw):
    return D.run_experiment(env[0], exp["exp_id"], stub_endpoint=url, private_dir=env[2], **kw)


def get(env, exp_id):
    s = Store(env[0])
    try:
        return s.get(D.KEY + exp_id), s.get(D.LEDGER)
    finally:
        s.close()


# ---------------------------------------------------------------- planner gap
def test_minimal_missing_step_and_dedup(env):
    r = submit(env)
    assert r["state"] == "UNRESOLVED" and r["missing_step"] == {"in": "canonical_rows", "arity": 2, "ordered": True, "out": "inventory_diff"}
    assert [(x["op"], x["inputs"]) for x in r["partial_plan"]] == [("convert", ["input:0"]), ("convert", ["input:1"])]
    again = submit(env)
    assert again["gap_ref"] == r["gap_ref"]
    s = Store(env[0])
    assert s.get(r["gap_ref"])["count"] == 2 and s.get(r["gap_ref"])["missing_step"]["arity"] == 2
    s.close()
    f = submit(env, sources=("A", "B"))  # folders: snapshot then convert, per input
    assert [x["op"] for x in f["partial_plan"]] == ["convert", "convert"] or f["missing_step"]["in"] == "canonical_rows"


def test_plain_unresolved_without_permission(env):
    assert submit(env)["state"] == "UNRESOLVED"
    assert not D.experiments(Store(env[0]))


# ---------------------------------------------------------------- frozen protocol, goal link, retry depth
def test_open_dedup_retry_depth_and_goal_link(env):
    r = submit(env, allow_discovery=True)
    assert r["state"] == "DISCOVERY_QUEUED" and r["experiment_id"]
    s = Store(env[0])
    g = G.goals(s)[0]
    assert g["experiment_id"] == r["experiment_id"] and g["experiment_state"] == "OPEN"
    assert submit(env, allow_discovery=True)["state"] == "UNRESOLVED"  # one non-terminal experiment per gap
    exp = s.get(D.KEY + r["experiment_id"])
    exp["state"] = "NO_QUALIFYING_CANDIDATE"
    s.set(D.KEY + exp["exp_id"], exp)
    second = D.open_experiment(s, r["gap_ref"], private_dir=env[2], seed=1)
    assert second["frozen"]["attempt"] == 2
    second["state"] = "BUDGET_EXHAUSTED"
    s.set(D.KEY + second["exp_id"], second)
    with pytest.raises(O.Refused, match="at most 2"):
        D.open_experiment(s, r["gap_ref"], private_dir=env[2], seed=2)
    with pytest.raises(O.Refused):
        D.open_experiment(s, "operator/gap/none", private_dir=env[2])  # discovery never opens gaps
    s.close()


def test_approval_gate_and_caps():
    assert M.approval_problems(D.ROOT / D.APPROVAL, D.pol()) == []
    assert {k: D.BUDGET[k] for k in ("calls", "proposals", "container_runs", "in_tokens", "out_tokens")} == \
           {"calls": 6, "proposals": 3, "container_runs": 12, "in_tokens": 36000, "out_tokens": 6000}
    assert M.approval_problems(D.ROOT / "build" / "m2" / "operator_inference_approval.json", D.pol())  # the M2 approval does not satisfy C3 caps


# ---------------------------------------------------------------- run paths
def test_pass_path_frozen_unchanged_and_receipt(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    assert srv.counters["total"] == 0 and exp["state"] == "OPEN" and exp["frozen_sha"] == D._sha(D._json(exp["frozen"]))
    done = run(env, exp, url)
    assert done["state"] == "CANDIDATE_PASSED", done.get("reason")
    assert done["frozen"] == exp["frozen"] and done["frozen_sha"] == exp["frozen_sha"]
    assert done["receipt"]["pass_count"] == done["receipt"]["n"] >= 20 and done["receipt"]["candidate_sha256"] == done["candidate_sha256"]
    assert done["baselines"]["unchanged_hive"]["pass_count"] == 0 and done["baselines"]["scripted"]["pass_count"] == done["baselines"]["scripted"]["n"]
    assert "ties the hand-written scripted baseline" in done["report"]["note"] and "NOT a learning advantage" in done["report"]["note"]
    assert done["ledger"]["calls"] == 1 and done["ledger"]["container_runs"] == 3 and done["ledger"]["proposals"] == 1
    s = Store(env[0])
    assert s.get(done["gap_key"])["status"] == "OPEN" and s.get(done["gap_key"])["discovery"]["state"] == "CANDIDATE_PASSED"
    assert not [k for k in (r["key"] for r in s.db.execute("SELECT key FROM kv").fetchall()) if k.startswith("operator/registry/") and "inventory" in k]
    s.close()


def test_wrong_code_no_qualifying_and_budget_never_exceeded(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub(WRONGS, tmp_path)
    done = run(env, exp, url)
    assert done["state"] == "NO_QUALIFYING_CANDIDATE" and not done.get("candidate_sha256")
    assert done["ledger"]["proposals"] == 3 and all(p["dev"]["pass_count"] < p["dev"]["n"] for p in done["proposals"])
    assert all(p["acceptance"] is None for p in done["proposals"])  # nothing imperfect on dev reaches the evaluator


def test_repeated_candidate_exhausts_calls_and_global_ledger_is_not_reset(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([WRONGS[0]], tmp_path)
    done = run(env, exp, url)
    B = D.BUDGET
    assert done["state"] == "BUDGET_EXHAUSTED" and "calls" in done["reason"] and srv.counters["total"] == B["calls"] == done["ledger"]["calls"]
    assert done["ledger"]["proposals"] == 1  # duplicates are not distinct proposals
    s = Store(env[0])
    s2 = D.open_experiment(s, done["gap_key"], private_dir=env[2], seed=9)
    s.close()
    again = run(env, s2, url)
    _, g = get(env, s2["exp_id"])
    assert again["state"] == "BUDGET_EXHAUSTED" and srv.counters["total"] == B["calls"]  # no fresh allocation of calls
    assert g["calls"] == B["calls"] and all(g[k] <= B[k] for k in ("calls", "proposals", "container_runs", "in_tokens", "out_tokens", "wall_s"))
    assert all(done["ledger"][k] <= B[k] for k in ("calls", "proposals", "container_runs", "in_tokens", "out_tokens"))


def test_container_budget_is_checked_before_each_run(env, fake_runs, tmp_path, monkeypatch):
    exp = opened(env)
    monkeypatch.setitem(D.BUDGET, "container_runs", 2)  # global cap; the experiment's frozen copy is 12
    srv, url = stub(WRONGS, tmp_path)
    done = run(env, exp, url)
    assert done["state"] == "BUDGET_EXHAUSTED" and "container_runs" in done["reason"] and len(fake_runs) == 2 and done["ledger"]["container_runs"] == 2


def test_stop_before_call(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    (env[0] / "STOP").write_text("x")
    done = run(env, exp, url)
    assert done["state"] == "STOPPED" and srv.counters["total"] == 0 and not fake_runs and done["ledger"]["container_runs"] == 0
    assert get(env, exp["exp_id"])[0]["state"] == "STOPPED"


def test_restart_interrupted_then_resume_same_ledger(env, fake_runs, tmp_path, monkeypatch):
    class Crash(BaseException):
        pass
    exp = opened(env)
    srv, url = stub(WRONGS[:1] + [CORRECT], tmp_path)
    real, n = M.Model.call, []

    def crashy(self, *a, **k):
        n.append(1)
        if len(n) == 2:
            raise Crash()
        return real(self, *a, **k)
    monkeypatch.setattr(M.Model, "call", crashy)
    with pytest.raises(Crash):
        run(env, exp, url)
    assert get(env, exp["exp_id"])[0]["state"] == "RUNNING"
    assert D.recover(env[0]) == 1
    mid, g1 = get(env, exp["exp_id"])
    assert mid["state"] == "INTERRUPTED" and mid["ledger"]["calls"] == 2 and g1["calls"] == 2
    monkeypatch.setattr(M.Model, "call", real)
    done = run(env, exp, url)
    assert done["state"] == "CANDIDATE_PASSED" and done["frozen_sha"] == exp["frozen_sha"]
    assert done["ledger"]["calls"] == 3 and srv.counters["total"] == 2  # the interrupted call stays counted; nothing was re-allocated


def test_forbidden_code_static_check(env, fake_runs, tmp_path):
    h = D._load("harness")
    for bad in ("import os\ndef run(e): return ''", "def run(e): return open('x').read()", "def run(e): return eval('1')", "import json\ndef run(e): exec('x')",
                "import sys\ndef run(e): return ''", "import subprocess\ndef run(e): return ''", "import socket\ndef run(e): return ''",
                "def run(e): return __import__('os').name", "def run(e): return e.__class__.__name__", "x = 1"):
        assert h.static_problems(bad), bad
    assert h.static_problems("import json\ndef run(e):\n    return json.dumps(e)") == []
    exp = opened(env)
    srv, url = stub(["```python\nimport os\ndef run(env):\n    return os.name\n```", WRONGS[0]], tmp_path)
    done = run(env, exp, url)
    assert done["proposals"][0]["static"] and done["proposals"][0]["dev"] is None
    assert done["ledger"]["container_runs"] == 1 + 2 * 0 + (done["ledger"]["proposals"] - 1)  # baseline + one dev run per statically clean proposal


# ---------------------------------------------------------------- independence
def test_proposer_inputs_contain_no_private_bytes(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub(WRONGS, tmp_path)
    run(env, exp, url)
    cases = json.loads(next((env[2] / exp["frozen"]["acceptance"]["set_sha256"]).glob("cases.json")).read_text(encoding="utf-8"))
    sent = (tmp_path / "req.jsonl").read_text(encoding="utf-8") + "".join(p.read_text(encoding="utf-8") for p in (env[0] / "discovery").rglob("*") if p.is_file() and p.suffix != ".json" or p.name == "model_calls.jsonl")
    assert "empty-diff" in sent and "bytes-only-change" in sent  # the dev cases are what the model sees
    for c in cases:
        assert c["expected"] not in sent
        assert all(f["text"] not in sent for f in c["env"]["files"] if len(f["text"]) > 60)
    store_dump = json.dumps(get(env, exp["exp_id"])[0])
    assert all(c["expected"] not in store_dump for c in cases)
    src = (ROOT / "src" / "hive" / "discovery.py").read_text(encoding="utf-8")
    assert "cases.json" not in src and "gen_private\")" not in src and "oracle.expected" not in src and "read_text(PRIVATE" not in src


def test_discovery_cannot_forge_a_verdict(env, monkeypatch, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    good_launch = D._launch

    def forge(args):
        good_launch(args)
        out = Path(args[args.index("--out") + 1])
        r = json.loads(out.read_text(encoding="utf-8"))
        if r["label"] == "candidate":
            r.update(pass_count=0, verdict="PASS")  # a verdict that does not follow from the counts / hash
            out.write_text(json.dumps(r), encoding="utf-8")
        return SimpleNamespace(returncode=0, stdout="", stderr="")
    monkeypatch.setattr(D, "_launch", forge)
    done = run(env, exp, url)
    assert done["state"] == "INTERRUPTED" and "receipt rejected" in done["reason"] and not done.get("candidate_sha256")
    r = {"schema": D.RECEIPT_SCHEMA, "label": "candidate", "exp_id": exp["exp_id"], "frozen_sha": exp["frozen_sha"], "candidate_sha256": "a" * 64,
         "acceptance_set_sha256": exp["frozen"]["acceptance"]["set_sha256"], "n": exp["frozen"]["acceptance"]["n"], "pass_count": exp["frozen"]["acceptance"]["n"],
         "evaluator": {"pin": exp["frozen"]["evaluator"]["pin"]}, "verdict": "PASS"}
    assert D.receipt_problems(exp, r, "a" * 64, "candidate") == ["receipt_sha256"]  # only the evaluator can sign it
    assert "evaluator pin" in D.receipt_problems(exp, dict(r, evaluator={"pin": "0" * 64}), "a" * 64, "candidate")


def test_evaluator_scores_hash_and_crash(env, tmp_path):
    ev = D._load("evaluate")
    exp = opened(env)
    body = tmp_path / "c.py"
    body.write_text("import json\ndef run(env):\n    return json.dumps({})\n", encoding="utf-8", newline="\n")
    args = ["--exp", exp["exp_id"], "--frozen-sha", exp["frozen_sha"], "--candidate-file", str(body), "--candidate-sha", D._sha(body.read_text(encoding="utf-8")),
            "--private", str(env[2]), "--set", exp["frozen"]["acceptance"]["set_sha256"], "--out", str(tmp_path / "r.json"), "--label", "candidate"]
    with D.c3_scope():
        ev.main(args, run_container=lambda src, text: fake_container(src, text))
    r = json.loads((tmp_path / "r.json").read_text(encoding="utf-8"))
    assert r["verdict"] == "FAIL" and r["pass_count"] == 0 and r["n"] >= 20 and "expected" not in json.dumps(r)

    def boom(src, text):
        raise RuntimeError("candidate timed out")
    with D.c3_scope():
        ev.main(args, run_container=boom)
    r = json.loads((tmp_path / "r.json").read_text(encoding="utf-8"))
    assert r["verdict"] == "FAIL" and r["pass_count"] == 0 and "timed out" in r["run_error"]
    with pytest.raises(SystemExit), D.c3_scope():
        ev.main(args[:7] + ["0" * 64] + args[8:], run_container=boom)


def test_private_set_has_edge_cases_and_oracle_agrees_with_baseline():
    gp, gv, bl, o = D._load("gen_public"), D._load("gen_private"), D._load("baseline_script"), D._load("oracle")
    cases = gv.generate(3)
    names = {c["name"] for c in cases}
    assert len(cases) >= 20 and {"unicode-ids", "numeric-vs-text-ids", "256-rows-identical", "1-row-identical"} <= names
    for c in gp.cases() + cases:
        assert bl.run(c["env"]) == c["expected"] == o.expected(c["env"])
    assert [c["name"] for c in gp.cases()] == ["empty-diff", "all-added", "all-removed", "group-only-change", "bytes-only-change", "mixed"]


# ---------------------------------------------------------------- real container + real evaluator process
def _docker_ok():
    try:
        from hive.adapters.isolation import DockerIsolation, PINNED_IMAGE
        DockerIsolation().inspect(PINNED_IMAGE)
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _docker_ok(), reason="Docker/pinned image unavailable")
def test_real_container_and_separate_evaluator_process(env, tmp_path):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    done = run(env, exp, url)
    assert done["state"] == "CANDIDATE_PASSED", done.get("reason")
    assert done["receipt"]["pass_count"] == done["receipt"]["n"] and done["ledger"]["container_runs"] == 3
