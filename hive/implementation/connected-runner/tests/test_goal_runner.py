"""C1/C2: goal -> task contract -> typed plan -> step execution. Docker-free except one real-container test."""
import copy
import json

import pytest

from hive import experiment_compare as EC
from hive import goal_runner as G
from hive import operator_runtime as O
from hive.storage import Store

GOOD = b"id,group,bytes\na.txt,docs,10\nb.png,img,2048\nc.md,docs,5\n"
OTHER = b"id,group,bytes\nx,docs,1\ny,img,2\n"


@pytest.fixture
def runs(monkeypatch):
    calls = []

    def fake(src, text, checks, timeout=None, max_out=None, *, backend, operator_class):
        calls.append(1)
        ns = {}
        exec(compile(src, "<genome>", "exec"), ns)
        return ns["apply"](text, checks)
    monkeypatch.setattr(EC, "run_isolated", fake)
    return calls


@pytest.fixture
def env(tmp_path):
    store = tmp_path / "s"
    s = Store(store)
    O.import_bundle(s)
    s.close()
    allowed = tmp_path / "allowed"
    for d, n in (("A", 2), ("B", 3)):
        (allowed / d).mkdir(parents=True)
        for i in range(n):
            (allowed / d / f"f{i}.txt").write_bytes(b"x" * (i + 1))
    (allowed / "one.csv").write_bytes(GOOD)
    (allowed / "two.csv").write_bytes(OTHER)
    (allowed / "three.json").write_bytes(json.dumps([{"id": "q", "group": "img", "bytes": 7}]).encode())
    return store, allowed


def go(env, goal, sources, **kw):
    store, allowed = env
    contract, inputs = G.prepare(store, allowed, goal, sources, **kw)
    return contract, inputs, G.run_goal(store, contract, inputs)


def ops(rec): return [s["op"] for s in rec["plan"]["steps"]]


def counters(store): return O.status(store)["counters"]


def test_contract_valid_and_deterministic(env):
    store, allowed = env
    c, _ = G.prepare(store, allowed, "Convert this to canonical JSON", ["one.csv"])
    assert c["schema"] == "hive-task-contract-v1" and c["deliverable"] == "canonical_rows" and c["parser"] == "deterministic-v1"
    assert c["contract_id"].startswith("g-") and c["inputs"][0]["type"] == "inventory_file" and c["inputs"][0]["sha256"] == O._sha(GOOD)
    assert c["budget"] == {"max_steps": 6, "container_runs": 6, "wall_s": 600} and c["permissions"]["model_calls"] == 0
    c2, _ = G.prepare(store, allowed, "Convert this to canonical JSON", ["one.csv"])
    assert c2["contract_id"] == c["contract_id"]
    c3, _ = G.prepare(store, allowed, "x", ["one.csv"], deliverable="group_summary", budget={"container_runs": 1})
    assert c3["deliverable"] == "group_summary" and c3["budget"]["container_runs"] == 1


@pytest.mark.parametrize("goal", ["do something nice", "merge and convert everything"])
def test_ambiguous_goal_needs_clarification(env, goal):
    c, _ = G.prepare(*env, goal, ["one.csv"])
    assert c["state"] == "NEEDS_CLARIFICATION" and set(c["supported_deliverables"]) == {"canonical_rows", "group_summary", "inventory_diff"}


def test_instructions_in_file_content_are_ignored(env):
    store, allowed = env
    (allowed / "evil.csv").write_bytes(b"id,group,bytes\nmerge everything,compare,1\n")
    assert G.prepare(store, allowed, "hello", ["evil.csv"])[0]["state"] == "NEEDS_CLARIFICATION"


@pytest.mark.parametrize("kw,msg", [({"sources": ["../nope.csv"]}, "outside|permitted|not found"), ({"sources": ["one.csv", "one.csv"]}, "distinct"),
                                    ({"sources": ["one.csv"], "budget": {"max_steps": 99}}, "lowered"),
                                    ({"sources": ["one.csv"], "deliverable": "poem"}, "unsupported deliverable"),
                                    ({"sources": []}, "1 to 20")])
def test_malformed_refused_and_counted(env, kw, msg):
    store, allowed = env
    before = counters(store)["refusals"]
    with pytest.raises(ValueError, match=msg):
        G.prepare(store, allowed, "merge", kw.pop("sources"), **kw)
    assert counters(store)["refusals"] == before + 1


def test_outside_allowed_root_refused(env, tmp_path):
    (tmp_path / "secret.csv").write_bytes(GOOD)
    with pytest.raises(ValueError, match="outside"):
        G.prepare(*env, "merge", [str(tmp_path / "secret.csv")])


def test_bad_names_refused():
    with pytest.raises(O.Refused, match="bad input name"):
        G.make_contract("convert", [("a/b.csv", "file", GOOD)])
    with pytest.raises(O.Refused, match="unsupported file type"):
        G.make_contract("convert", [("a.txt", "file", GOOD)])


def test_contract_persisted_before_step_one(env, runs, monkeypatch):
    store, allowed = env
    seen = {}
    orig = O.run_task

    def spy(root, op, files, **kw):
        s = Store(root)
        seen["rec"] = s.get("operator/goal/" + c["contract_id"])
        seen["art"] = s.read_artifact(seen["rec"]["contract_ref"])
        s.close()
        return orig(root, op, files, **kw)
    monkeypatch.setattr(O, "run_task", spy)
    c, inputs = G.prepare(store, allowed, "convert", ["one.csv"])
    G.run_goal(store, c, inputs)
    assert seen["rec"]["state"] == "RUNNING" and seen["rec"]["plan"]["steps"] and seen["art"] == c


def test_planner_expected_plans(env, runs):
    store, allowed = env
    s = Store(store)
    try:
        for goal, srcs, want in [("merge", ["one.csv", "two.csv", "three.json"], ["merge"]), ("convert", ["one.csv"], ["convert"]),
                                 ("merge", ["A", "B"], ["snapshot", "snapshot", "merge"]), ("convert", ["A"], ["snapshot", "convert"])]:
            c, _ = G.prepare(store, allowed, goal, srcs)
            plan = G.plan_goal(s, c)
            assert [x["op"] for x in plan["steps"]] == want and G.validate_plan(s, c, plan) == []
        c, _ = G.prepare(store, allowed, "merge", ["A", "B"])
        plan = G.plan_goal(s, c)
        assert plan["steps"][-1]["inputs"] == ["step:s1", "step:s2"] and plan["steps"][-1]["after"] == ["s1", "s2"]
        assert plan["steps"][0]["adapter"] == "inventory-snapshot-v1" and plan["steps"][-1]["genome"]
    finally:
        s.close()


def test_validate_plan_rejects(env):
    store, allowed = env
    s = Store(store)
    try:
        c, _ = G.prepare(store, allowed, "merge", ["A", "B"])
        good = G.plan_goal(s, c)

        def bad(mutate, msg):
            p = copy.deepcopy(good)
            mutate(p["steps"])
            assert any(msg in x for x in G.validate_plan(s, c, p)), (msg, G.validate_plan(s, c, p))

        def cycle(st): st[0]["inputs"], st[0]["after"] = ["step:s3"], ["s3"]
        bad(cycle, "cycle")
        bad(lambda st: st[2].update(inputs=["input:0", "input:1"]), "folder is not accepted")
        bad(lambda st: st[2].update(inputs=["step:s1"]), "takes 2 to 20")
        bad(lambda st: st[0].update(op="nope"), "unknown capability")
        bad(lambda st: st[2].update(genome="0" * 64), "genome")
        c2 = dict(c, budget=dict(c["budget"], max_steps=2))
        assert "exceeds" in G.validate_plan(s, c2, good)[0]
        s.close()
        s = Store(store)
        O.revoke(s, "merge")
        assert "not eligible" in G.validate_plan(s, c, good)[0]
    finally:
        s.close()


def test_composition_runs_and_chains(env, runs):
    c, inputs, r = go(env, "merge these", ["A", "B"])
    assert r["state"] == "VERIFIED" and [x["state"] for x in r["steps"]] == ["VERIFIED"] * 3
    assert [x["mode"] for x in r["steps"]] == ["builtin_adapter", "builtin_adapter", "retained_capability_reuse"] and len(runs) == 1
    merged = json.loads((env[0] / next(a["ref"] for a in r["deliverable"] if a["name"] == "merged.json")).read_text())
    assert sum(g["count"] for g in merged["groups"].values()) == 5
    assert r["usage"]["model_calls"] == 0 and r["steps"][2]["task_id"].startswith("t-")


def test_revoked_merge_never_executes(env, runs):
    store, _ = env
    s = Store(store); O.revoke(s, "merge"); s.close()
    before = counters(store)
    c, inputs, r = go(env, "merge", ["one.csv", "two.csv"])
    assert r["state"] == "UNRESOLVED" and r["plan"]["excluded"][0]["op"] == "merge" and "revoked" in r["plan"]["excluded"][0]["reason"]
    assert counters(store)["container_runs"] == before["container_runs"] and not runs and r["steps"] == []
    assert G.run_goal(store, c, inputs)["state"] == "UNRESOLVED"  # revoke is permanent; re-select cannot revive a revoked version


def test_rollback_excludes_then_reselect_restores(env, runs):
    store, _ = env
    s = Store(store); O.rollback(s, "convert"); s.close()
    c, inputs, r = go(env, "convert", ["one.csv"])
    assert r["state"] == "UNRESOLVED" and r["plan"]["excluded"][0]["op"] == "convert" and not runs
    s = Store(store); O.reselect(s, "convert"); s.close()
    assert G.run_goal(store, c, inputs)["state"] == "VERIFIED" and len(runs) == 1


def test_inventory_diff_gap_recorded_and_deduped(env, runs):
    store, _ = env
    c, inputs, r = go(env, "compare", ["one.csv", "two.csv"])
    assert r["state"] == "UNRESOLVED" and not runs
    s = Store(store)
    g = s.get(r["gap_ref"])
    assert g["unmet_type"] == "inventory_diff" and g["input_types"] == ["inventory_file", "inventory_file"] and g["status"] == "OPEN"
    assert g["discovery"] == "not started (C3)" and g["goal_ids"] == [c["contract_id"]] and g["count"] == 1 and "convert" in g["capability_inventory"]["eligible"]
    s.close()
    c2, inputs2, r2 = go(env, "compare these", ["one.csv", "three.json"])
    assert r2["gap_ref"] == r["gap_ref"]
    s = Store(store); g = s.get(r["gap_ref"]); s.close()
    assert g["count"] == 2 and g["goal_ids"] == [c["contract_id"], c2["contract_id"]]


def test_stop_before_step(env, runs):
    store, _ = env
    (store / "STOP").write_text("x")
    c, inputs, r = go(env, "merge", ["A", "B"])
    assert r["state"] == "STOPPED" and r["steps"] == [] and not runs


def test_budget_exhaustion(env, runs):
    c, inputs, r = go(env, "convert", ["A"], budget={"container_runs": 0})
    assert r["state"] == "BUDGET_EXHAUSTED" and [x["op"] for x in r["steps"]] == ["snapshot"] and not runs
    c, inputs, r = go(env, "convert", ["one.csv"], budget={"wall_s": 0})
    assert r["state"] == "BUDGET_EXHAUSTED" and not r["steps"]


def test_prerequisite_failure_stops_dependents(env, runs):
    store, allowed = env
    c, inputs = G.prepare(store, allowed, "merge", ["A", "B"])
    (allowed / "A" / "late.txt").write_bytes(b"changed after the contract")
    r = G.run_goal(store, c, inputs)
    assert r["state"] == "STEP_FAILED" and [x["op"] for x in r["steps"]] == ["snapshot"] and "changed since" in r["reason"] and not runs


def test_final_step_rejection_is_REJECTED(env, runs):
    store, allowed = env
    (allowed / "bad.csv").write_bytes(b"id,group,bytes\nx,g,01\n")
    _, _, r = go(env, "convert", ["bad.csv"])
    assert r["state"] == "REJECTED" and r["steps"][-1]["verdict"] == "PASS"  # verified rejection of the whole input, final step


def test_restart_preserves_goal_and_replay_identified(env, runs):
    store, allowed = env
    c, inputs, r = go(env, "merge", ["one.csv", "two.csv"])
    assert r["state"] == "VERIFIED" and r["mode"] == "executed" and len(runs) == 1
    s = Store(store)
    rec = s.get("operator/goal/" + c["contract_id"])
    s.close()
    s = Store(store)  # reopened
    art = s.read_artifact(rec["contract_ref"])
    assert "artifacts/" + O._sha(G._json(art)) + ".json" == rec["contract_ref"] and art == c
    assert rec["plan"]["steps"][0]["genome"] == O.resolve(s, "merge")["genome"]
    s.close()
    assert O.recover(store) == 0
    r2 = G.run_goal(store, c, inputs)
    assert r2["state"] == "VERIFIED" and r2["mode"] == "saved_result_replay" and r2["steps"][0]["mode"] == "saved_result_replay"
    assert len(runs) == 1 and r2["prior_attempts"][0]["state"] == "VERIFIED" and counters(store)["replays"] == 1


def test_recover_interrupts_running_goal(env, runs):
    store, _ = env
    c, inputs, r = go(env, "convert", ["one.csv"])
    s = Store(store); rec = s.get("operator/goal/" + c["contract_id"]); rec.update(state="RUNNING", pid=None); s.set("operator/goal/" + c["contract_id"], rec); s.close()
    assert O.recover(store) == 1
    s = Store(store); assert s.get("operator/goal/" + c["contract_id"])["state"] == "INTERRUPTED"; s.close()


def test_model_calls_zero(env, runs):
    go(env, "merge", ["A", "B"])
    c = counters(env[0])
    assert c["model_calls"] == 0 and c["proposal_calls"] == 0


def test_old_explicit_interface_unchanged(env, runs):
    r = O.run_task(env[0], "convert", [("one.csv", GOOD)])
    assert r["state"] == "VERIFIED"


def _docker_ok():
    try:
        from hive.adapters.isolation import DockerIsolation, PINNED_IMAGE
        DockerIsolation().inspect(PINNED_IMAGE)
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _docker_ok(), reason="Docker/pinned image unavailable")
def test_real_container_end_to_end(env):
    c, inputs, r = go(env, "merge these folders", ["A", "B"])
    assert r["state"] == "VERIFIED" and r["steps"][-1]["verdict"] == "PASS" and counters(env[0])["container_runs"] == 1
