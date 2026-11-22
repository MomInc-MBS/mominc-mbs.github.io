"""LUNA task-generation and runner contract tests."""
import json
from hive.task_spec import CATEGORIES, load_tasks, request_view
from hive.experiment_runner import execute
from hive.verifier import verify


def test_splits_are_repeatable_distinct_and_answer_free_requests():
    all_tasks={s:load_tasks(s,seed=9,count_per_category=4) for s in ("development","validation","holdout")}
    assert all_tasks["development"]==load_tasks("development",seed=9,count_per_category=4)
    assert {t["category"] for t in all_tasks["holdout"]}==set(CATEGORIES)
    ids=[{t["id"] for t in ts} for ts in all_tasks.values()]
    assert not (ids[0]&ids[1] or ids[0]&ids[2] or ids[1]&ids[2])
    for tasks in all_tasks.values():
        for task in tasks:
            result=execute(task,"tool",{})
            assert "expected" not in json.dumps(result.get("request"))
            assert verify(task,result)["passed"]


def test_local_requests_hide_answer_and_handle_mock_transport():
    task=load_tasks("development",count_per_category=1)[0]
    seen={}
    class Adapter:
        def generate(self,model,prompt,**kwargs):
            seen.update(model=model,prompt=prompt,kwargs=kwargs)
            return json.dumps(task["expected"]),"mock:v1","sha256:test",7
    result=execute(task,"local_direct",{"model":"mock:v1","adapter":Adapter()})
    assert result["error"] is None and result["model_digest"]=="sha256:test" and result["tokens"]==7
    assert "expected" not in seen["prompt"] and str(task["expected"]["answer"]) not in seen["prompt"]
    assert verify(task,result)["passed"]
import json
from hive.adapters.ollama import OllamaAdapter
from hive.experiment_runner import execute
from hive.task_spec import load_tasks
from hive.verifier import verify


def test_ollama_adapter_payload_and_digest_resolution(monkeypatch):
    seen={}
    def transport(url,payload,timeout):
        seen.update(url=url,payload=payload,timeout=timeout)
        return {"model":"mock:v1","message":{"content":"{\"answer\":7}"},"eval_count":3}
    import hive.model_registry as registry
    monkeypatch.setattr(registry,"discover",lambda endpoint:{"available":True,"models":[{"id":"mock:v1","digest":"sha256:abc","available":True}]})
    adapter=OllamaAdapter(transport=transport)
    content,model,digest,tokens=adapter.generate("mock:v1","{}",seed=8,max_tokens=16)
    assert (content,model,digest,tokens)==('{"answer":7}',"mock:v1","sha256:abc",3)
    assert seen["payload"]["think"] is False and seen["payload"]["options"]["num_predict"]==16


def test_loopback_and_tool_allowlist_enforced():
    try:
        OllamaAdapter("http://example.com")
        assert False, "remote endpoint should be rejected"
    except ValueError:
        pass
    task=next(t for t in load_tasks("development") if t["category"]=="tool_routing")
    class Adapter:
        def generate(self,*args,**kwargs):
            return json.dumps({"tool":"delete_all","arguments":{}}),"mock:v1","sha256:abc",5
    result=execute(task,"local_tool",{"model":"mock:v1","adapter":Adapter()})
    assert result["error"] and result["failure_category"]=="MODEL"
    assert verify(task,result)["valid"] and not verify(task,result)["passed"]
import json
from hive.adapters.ollama import OllamaAdapter,make_payload
from hive.experiment_runner import execute
from hive.task_spec import CATEGORIES,load_tasks
from hive.verifier import verify


def test_all_six_allowlisted_local_tool_paths_execute_only_builtins():
    for task in load_tasks("development",seed=12,count_per_category=3):
        inp=task["input"]
        if task["category"]=="math": call={"tool":"multiply","arguments":{"a":inp["a"],"b":inp["b"]}}
        elif task["category"]=="code_repair": call={"tool":"run_patch_fixtures","arguments":{"patch":next(name for name,offset in inp["patches"].items() if all(x+offset==y for x,y in zip(inp["fixture_inputs"],inp["fixture_outputs"])))}}
        elif task["category"]=="tool_routing": call={"tool":"add","arguments":{"a":inp["a"],"b":inp["b"]}}
        elif task["category"]=="coordination": call={"tool":"partition_tasks","arguments":{"task_ids":inp["task_ids"],"group_size":2}}
        elif task["category"]=="hallucination": call={"tool":"lookup_record","arguments":{"key":inp["query"]}}
        else: call={"tool":"infer_constant","arguments":{"examples":inp["examples"]}}
        class Adapter:
            def generate(self,*args,**kwargs): return json.dumps(call),"mock:v1","sha256:test",4
        result=execute(task,"local_tool",{"model":"mock:v1","adapter":Adapter()})
        assert result["failure_category"] is None, (task["category"],result)
        assert json.loads(result["raw_model_output"])==call
        assert verify(task,result)["valid"] and verify(task,result)["passed"], (task["category"],result,verify(task,result))
        assert result["backend"]=="ollama" and result["tokens"]==4
        assert "expected" not in json.dumps(result["request"])
        assert "fixture_outputs" in json.dumps(result["request"]) if task["category"]=="code_repair" else True


def test_task_ids_and_instances_are_disjoint_across_seed_and_split():
    tasks=[load_tasks(s,seed=5,count_per_category=3) for s in ("development","validation","holdout")]
    ids=[{t["id"] for t in group} for group in tasks]
    assert not (ids[0]&ids[1] or ids[0]&ids[2] or ids[1]&ids[2])
    request_sets=[{json.dumps(request_view(t),sort_keys=True) for t in group} for group in tasks]
    assert not (request_sets[0]&request_sets[1] or request_sets[0]&request_sets[2] or request_sets[1]&request_sets[2])
    for category in CATEGORIES:
        contents=[json.dumps(next(t["input"] for t in group if t["category"]==category),sort_keys=True) for group in tasks]
        assert len(set(contents))==3, (category,contents)
    assert load_tasks("development",seed=5)[0]["id"] != load_tasks("development",seed=6)[0]["id"]


def test_model_failures_are_usable_zero_quality_and_environment_is_invalid():
    task=load_tasks("development",count_per_category=1)[0]
    class BadJSON:
        def generate(self,*args,**kwargs): return "not json","mock:v1","sha256:test",4
    result=execute(task,"local_direct",{"model":"mock:v1","adapter":BadJSON()})
    checked=verify(task,result)
    assert result["failure_category"]=="MODEL" and result["raw_model_output"]=="not json"
    assert checked["valid"] and not checked["passed"] and checked["quality"]==0
    env=verify(task,{"output":"","error":"timeout","failure_category":"ENVIRONMENT"})
    assert not env["valid"]


def test_request_is_exact_payload_and_runner_caps_tokens():
    task=load_tasks("development",count_per_category=1)[0]
    class Adapter:
        def generate(self,*args,**kwargs): return json.dumps(task["expected"]),"mock:v1","sha256:test",3
    result=execute(task,"local_direct",{"model":"mock:v1","adapter":Adapter(),"seed":22,"max_tokens":10})
    assert result["request"]==make_payload("mock:v1",result["request"]["messages"][1]["content"],seed=22,max_tokens=10)
    class OverCap:
        def generate(self,*args,**kwargs): return "{}","mock:v1","sha256:test",11
    over=execute(task,"local_direct",{"model":"mock:v1","adapter":OverCap(),"max_tokens":10})
    assert over["failure_category"]=="MODEL"


def test_baseline_backend_is_not_fixture():
    task=load_tasks("development",count_per_category=1)[0]
    result=execute(task,"tool",{})
    assert result["backend"]=="deterministic-tool" and result["failure_category"] is None


def test_only_adaptation_holdout_has_labeled_difficulty_shift():
    holdout=load_tasks("holdout",seed=15,count_per_category=1)
    task=next(t for t in holdout if t["category"]=="adaptation")
    assert task["adaptation_shift"]=="holdout-more-examples-v1"
    assert len(task["input"]["examples"])==5
    class Adapter:
        def generate(self,*args,**kwargs): return "{}","mock","sha256:test",1
    request=execute(task,"local_direct",{"model":"mock","adapter":Adapter()})["request"]
    assert "adaptation_shift" not in json.dumps(request)
    for split in ("development","validation"):
        t=next(t for t in load_tasks(split,seed=15,count_per_category=1) if t["category"]=="adaptation")
        assert len(t["input"]["examples"])==3 and "adaptation_shift" not in t
