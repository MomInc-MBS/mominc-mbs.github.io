from hive.learning_policy import Policy
from hive.orchestrator import DEFAULT_CONFIG, Executor, config_hash
from hive.task_spec import load_tasks


def config(**kwargs):
    return dict(DEFAULT_CONFIG, **kwargs)


def test_explicit_route_excluded_by_task_permissions_is_never_called(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr("hive.orchestrator.execute", lambda *args: calls.append(args) or {})
    task = load_tasks("development")[0]
    task["permissions"] = {"version": 1, "routes": ["tool"]}
    ex = Executor(tmp_path, config())
    job_id = ex.enqueue(task, "local_direct")
    result = ex.loop(1)[0]
    job = ex.store.get_job(job_id)
    receipt = ex.store.read_artifact(job["result"]["decision_ref"])
    assert not calls
    assert (ex.store.get("budget") or {}).get("requests", 0) == 0
    assert result["passed"] is False
    assert "excluded by task permissions" in next(x for x in receipt["alternatives"] if x["route"] == "local_direct")["reasons"]
    ex.close()


def test_exhausted_local_budget_leaves_tool_route_eligible(tmp_path):
    ex = Executor(tmp_path, config(routes=["local_direct", "tool"], max_requests=1))
    ex.store.set("budget", {"requests": 1, "tokens_reserved": 128, "tokens_actual": 0, "wall_s": 0.0, "cycles": 0})
    task = load_tasks("development")[0]
    job_id = ex.enqueue(task)
    result = ex.loop(1)[0]
    evidence = ex.store.read_artifact(ex.store.get_job(job_id)["result"]["evidence_ref"])
    assert result["route"] == "tool" and result["passed"] is True
    local = next(x for x in evidence["decision"]["alternatives"] if x["route"] == "local_direct")
    assert local["eligible"] is False
    assert "model request budget exhausted" in local["reasons"]
    ex.close()


def test_malformed_task_is_rejected_before_any_reservation(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr("hive.orchestrator.execute", lambda *args: calls.append(args) or {})
    task = load_tasks("development")[0]
    task["evaluator"] = "invented"
    ex = Executor(tmp_path, config())
    job_id = ex.enqueue(task, "tool")
    ex.loop(1)
    assert not calls
    assert (ex.store.get("budget") or {}).get("cycles", 0) == 0
    assert ex.store.get_job(job_id)["state"] == "BLOCKED"
    ex.close()


def test_feedback_updates_candidate_without_changing_governing_p0(tmp_path):
    ex = Executor(tmp_path, config())
    p0 = Policy(mode="fixed", seed=42).snapshot()
    task = load_tasks("development")[0]
    ex.enqueue(task, "tool")
    assert ex.loop(1)[0]["passed"] is True
    assert config_hash(ex.store.get("governing_policy")) == config_hash(p0)
    candidate = ex.store.get("policy")
    assert candidate["counts"][task["category"]]["tool"]["n"] == 1
    assert candidate != p0
    ex.close()


def test_retry_to_disallowed_route_is_blocked_before_enqueue(tmp_path, monkeypatch):
    def failed_model(task, route, cfg):
        return {"output": "", "raw_model_output": "", "latency_s": 0.01, "tokens": 1,
                "model": cfg["model"], "model_digest": "test-adapter:test", "backend": "test-adapter",
                "request": {}, "error": "MODEL: bad answer", "failure_category": "MODEL"}

    monkeypatch.setattr("hive.orchestrator.execute", failed_model)
    task = load_tasks("development")[0]
    task["permissions"] = {"version": 1, "routes": ["local_direct"]}
    ex = Executor(tmp_path, config(routes=["local_direct"], allow_fixtures=True, adapter=object()))
    job_id = ex.enqueue(task, "local_direct")
    result = ex.loop(1)[0]
    job = ex.store.get_job(job_id)
    assert result["passed"] is False
    assert job["result"]["failure"].get("retry_blocked")
    assert not any(item["state"] == "QUEUED" for item in ex.store.jobs())
    ex.close()
