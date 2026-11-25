"""C5: active qualified-model dispatch for the c3-proposal class. Stub server only; no real model."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_discovery import CORRECT, WRONGS, env, fake_runs, get, opened, stub  # noqa: E402,F401

from hive import discovery as D  # noqa: E402
from hive import m2_model as M  # noqa: E402
from hive import model_dispatch as MD  # noqa: E402

Q = {"openai/gpt-oss-20b": {"measured": True, "context": 32768, "evidence": ["test"]}}
UNMEASURED = "local/unmeasured-model"


def cfg(mode, limit=1, qualified=Q):
    return {"classes": {"c3-proposal": {"mode": mode, "canary_limit": limit}}, "qualified": qualified, "fallback": "P0"}


def go(env, exp, url, mode, req=UNMEASURED, **kw):
    return D.run_experiment(env[0], exp["exp_id"], stub_endpoint=url, private_dir=env[2], requested_model=req, dispatch_cfg=cfg(mode, **kw))


def rows(env, exp):
    p = env[0] / "discovery" / exp["exp_id"] / "model" / "model_dispatch.jsonl"
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines()] if p.exists() else []


def test_shadow_executes_requested_and_refuses_unqualified(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    done = go(env, exp, url, "shadow", req=UNMEASURED)  # unmeasured request is never executed, even in shadow
    assert done["state"] == "MODEL_UNAVAILABLE" and srv.counters["total"] == 0 and done["ledger"]["calls"] == 0
    assert rows(env, exp)[0]["executed_model"] is None and "EXECUTED_UNQUALIFIED_REFUSED" in rows(env, exp)[0]["reason_codes"]
    exp2 = opened(env)
    done = go(env, exp2, url, "shadow", req="openai/gpt-oss-20b")
    r = rows(env, exp2)[0]
    assert done["state"] == "CANDIDATE_PASSED" and r["executed_model"] == r["requested_model"] == r["reported_model"] and r["switch_executed"] is False and r["cost_usd"] == 0.0


def test_active_routes_unqualified_request_to_qualified(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    done = go(env, exp, url, "active")
    r = rows(env, exp)[0]
    assert done["state"] == "CANDIDATE_PASSED" and srv.counters["total"] == 1
    assert (r["requested_model"], r["routed_model"], r["executed_model"], r["reported_model"]) == (UNMEASURED, "openai/gpt-oss-20b", "openai/gpt-oss-20b", "openai/gpt-oss-20b")
    assert r["switch_executed"] is True and r["call_id"] == f"{exp['exp_id']}:1" and r["tokens_in"] and done["dispatches"][0]["call_id"] == r["call_id"]
    assert json.loads(srv_req(tmp_path)[0])["model"] == "openai/gpt-oss-20b"


def srv_req(tmp_path):
    return (tmp_path / "req.jsonl").read_text(encoding="utf-8").splitlines()


def test_canary_then_shadow_and_count_persists_across_reopen(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub(WRONGS, tmp_path)
    done = go(env, exp, url, "canary", limit=1)  # call 1 canary-routed; call 2 is shadow with an unqualified request -> refused
    rs = rows(env, exp)
    assert done["state"] == "MODEL_UNAVAILABLE" and rs[0]["switch_executed"] is True and "CANARY_ROUTED" in rs[0]["reason_codes"]
    assert "CANARY_SPENT" in rs[1]["reason_codes"] and rs[1]["executed_model"] is None and srv.counters["total"] == 1
    assert MD._count(env[0], "c3-proposal") == 1
    exp2 = opened(env)  # reopened: the persisted count is spent, so no canary dispatch
    go(env, exp2, url, "canary", limit=1)
    assert "CANARY_SPENT" in rows(env, exp2)[0]["reason_codes"] and srv.counters["total"] == 1


def test_endpoint_not_listing_model_falls_back_without_a_call(env, fake_runs, tmp_path, monkeypatch):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    monkeypatch.setattr(M.Model, "list_models", lambda self: (_ for _ in ()).throw(M.Invalidated("unexpected model ids []")))
    done = go(env, exp, url, "active")
    assert done["state"] == "MODEL_UNAVAILABLE" and srv.counters["total"] == 0 and done["ledger"]["calls"] == 0 and not done.get("proposals")
    assert "MODEL_NOT_LOADED" in rows(env, exp)[0]["error"] and get(env, exp["exp_id"])[0]["state"] == "MODEL_UNAVAILABLE" and get(env, exp["exp_id"])[1]["calls"] == 0


def test_timeout_or_transport_failure_falls_back_ledger_intact(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([{"http_status": 500}, CORRECT], tmp_path)
    done = go(env, exp, url, "active")
    assert done["state"] == "MODEL_UNAVAILABLE" and srv.counters["total"] == 1 and done["ledger"]["calls"] == 1 and done["ledger"]["container_runs"] == 1
    assert rows(env, exp)[0]["error"] == "transport_failure" and not done.get("candidate_sha256")


def test_stop_and_budget_exhausted_make_no_call(env, fake_runs, tmp_path):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    (env[0] / "STOP").write_text("x")
    assert go(env, exp, url, "active")["state"] == "STOPPED" and srv.counters["total"] == 0 and not rows(env, exp)
    (env[0] / "STOP").unlink()
    exp2 = opened(env)
    s = D.Store(env[0])
    try:
        e = s.get(D.KEY + exp2["exp_id"])
        e["ledger"]["calls"] = e["frozen"]["budget"]["calls"]  # this experiment's calls are spent
        s.set(D.KEY + exp2["exp_id"], e)
    finally:
        s.close()
    done = go(env, exp2, url, "active")
    assert done["state"] == "BUDGET_EXHAUSTED" and srv.counters["total"] == 0 and not rows(env, exp2)


def test_reported_model_id_mismatch_is_refused_and_recorded(env, fake_runs, tmp_path, monkeypatch):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    body = M.Model.body
    monkeypatch.setattr(M.Model, "body", lambda self, m, seed: dict(body(self, m, seed), model="other/model"))  # the stub echoes it back
    done = go(env, exp, url, "active")
    r = rows(env, exp)[0]
    assert done["state"] == "MODEL_UNAVAILABLE" and r["reported_model"] == "other/model" and "reply verification failed" in r["error"] and not done["proposals"]


def test_bad_config_is_fallback_not_a_crash():
    assert MD.plan("x", "c3-proposal", "a", {"nope": 1})["executed_model"] is None
    assert MD.plan("x", "c3-proposal", "a", cfg("active", qualified={"a": {"measured": False, "evidence": ["x"]}}))["executed_model"] is None


def test_listed_but_not_loaded_falls_back_without_a_call(env, fake_runs, tmp_path, monkeypatch):
    exp = opened(env)
    srv, url = stub([CORRECT], tmp_path)
    monkeypatch.setattr(MD, "loaded", lambda endpoint, model: False)  # LM Studio lists unloaded models and would JIT-load them on a call
    done = go(env, exp, url, "active")
    assert done["state"] == "MODEL_UNAVAILABLE" and srv.counters["total"] == 0 and "not loaded" in rows(env, exp)[0]["error"]
