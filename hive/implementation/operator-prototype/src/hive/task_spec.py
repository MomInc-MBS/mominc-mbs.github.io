"""Deterministic benchmark tasks with evaluator-only answer keys."""
from __future__ import annotations
import hashlib
import random
from typing import Any

CATEGORIES = ("math", "code_repair", "tool_routing", "coordination", "hallucination", "adaptation")
SPLITS = ("development", "validation", "holdout")
EVALUATOR_VERSION = "hive-evaluator-v1"
_SALTS = {"development":"dev-v1", "validation":"val-v1", "holdout":"hold-v1"}
_PATCH_OFFSETS = {-2:-2,-1:-1,1:1,2:2}


def _stable_rng(split: str, category: str, seed: int, index: int) -> random.Random:
    material=f"{seed}:{_SALTS[split]}:{category}:{index}".encode()
    return random.Random(int.from_bytes(hashlib.sha256(material).digest()[:8],"big"))


def _task(split: str, category: str, i: int, seed: int) -> dict[str,Any]:
    rng=_stable_rng(split,category,seed,i); critical=i==0
    if category=="math":
        a,b=rng.randint(4,97),rng.randint(3,31); args={"a":a,"b":b}
        allowed=["multiply"]
        prompt=f"Multiply {a} by {b}. Return JSON {{\"answer\": integer}}."
        inp={**args,"allowed_tools":allowed,"tool_schemas":{"multiply":{"a":"integer","b":"integer"}}}
        expected={"answer":a*b}; evaluator="math_exact"
    elif category=="code_repair":
        offset=rng.choice(tuple(_PATCH_OFFSETS)); n=100+rng.randrange(100000); xs=[n-7,n,n+11]
        patch=f"offset_{offset:+d}"; patches={f"offset_{k:+d}":k for k in _PATCH_OFFSETS}
        ys=[x+offset for x in xs]
        inp={"fixture_inputs":xs,"fixture_outputs":ys,"patches":patches,"allowed_tools":["run_patch_fixtures"],"tool_schemas":{"run_patch_fixtures":{"patch":"one of the finite patch IDs"}}}
        prompt=f"Repair transform(n) to return n {offset:+d}. Choose a finite patch and return JSON with patch and fixture_results for the supplied fixture inputs."
        expected={"patch":patch,"fixture_results":ys}; evaluator="finite_patch_fixtures"
    elif category=="tool_routing":
        a,b=rng.randint(2,30),rng.randint(2,30); args={"a":a,"b":b}
        inp={"request":f"Add {a} and {b}.",**args,"allowed_tools":["add"],"tool_schemas":{"add":{"a":"integer","b":"integer"}}}
        prompt="Select the allowed tool and exact arguments for the request. Return JSON {\"tool\":\"add\",\"arguments\":{\"a\":integer,\"b\":integer}}."
        expected={"tool":"add","arguments":args,"result":a+b}; evaluator="tool_route_exact"
    elif category=="coordination":
        ids=[f"task-{rng.randrange(10**12)}" for _ in range(4)]
        inp={"task_ids":ids,"group_count":2,"max_group_size":2,"allowed_tools":["partition_tasks"],"tool_schemas":{"partition_tasks":{"task_ids":"exact supplied task IDs","group_size":"integer"}}}
        prompt="Partition every task ID exactly once into two balanced groups. Return JSON {\"groups\":[[ID,ID],[ID,ID]]}."
        expected={"groups":[ids[:2],ids[2:]]}; evaluator="coordination_partition"
    elif category=="hallucination":
        mode=i%3; records={"present":f"value-{rng.randrange(10**12)}"}; query="present"
        if mode==1: query="absent"
        elif mode==2: query="conflict"; records[query]=[f"left-{rng.randrange(1000)}",f"right-{rng.randrange(1000)}"]
        inp={"records":records,"query":query,"allowed_tools":["lookup_record"],"tool_schemas":{"lookup_record":{"key":"string"}}}
        prompt=f"Use only the supplied records for key {query}. Return JSON with answer, supported, and ambiguous when values conflict."
        if mode==0: expected={"answer":records[query],"supported":True,"ambiguous":False}
        else: expected={"answer":None,"supported":False,"ambiguous":mode==2}
        evaluator="unsupported_claim"
    else:
        target=rng.randint(2,8); example_count=5 if split=="holdout" else 3; vals=[target]*example_count
        base=rng.randrange(10**9); examples=[{"input":base+j,"output":v} for j,v in enumerate(vals)]
        inp={"examples":examples,"allowed_tools":["infer_constant"],"tool_schemas":{"infer_constant":{"examples":"array of supplied input/output pairs"}}}
        prompt="Infer the constant output rule from these examples. Return JSON {\"rule\": integer}."
        expected={"rule":target}; evaluator="adaptation_rule"
    public_prompt=prompt
    id_material=f"bench-v1:{seed}:{_SALTS[split]}:{category}:{i}:{public_prompt}:{inp}".encode()
    task_id=f"bench-v1-{seed}-{split}-{category}-{i:03d}-{hashlib.sha256(id_material).hexdigest()[:10]}"
    task={"id":task_id,"category":category,"split":split,"prompt":prompt,"input":inp,"expected":expected,"critical":critical,"evaluator":evaluator,"allowed_tools":list(inp["allowed_tools"]),"tool_schemas":inp["tool_schemas"]}
    if category=="adaptation":
        task["adaptation_protocol"]="infer-constant-from-examples-v1"
        if split=="holdout": task["adaptation_shift"]="holdout-more-examples-v1"
    return task


def load_tasks(split: str, seed: int=42, count_per_category: int=4) -> list[dict[str,Any]]:
    if split not in SPLITS: raise ValueError(f"split must be one of {SPLITS}")
    if count_per_category<1: raise ValueError("count_per_category must be positive")
    return [_task(split,cat,i,seed) for cat in CATEGORIES for i in range(count_per_category)]


def request_view(task: dict[str,Any]) -> dict[str,Any]:
    """Policy-visible payload. Excludes ID, split, expected, and evaluator oracle."""
    if task["category"] == "code_mission":
        return {"category": "code_mission", "prompt": "Repository code execution is restricted to the manifest-pinned deterministic sandbox route.",
                "input": {"manifest_id": task["input"]["manifest"]["id"],
                          "source_sha256": task["input"]["manifest"]["repo"]["source_sha256"],
                          "patch_id": task["input"]["patch_id"]},
                "allowed_tools": list(task["allowed_tools"]), "tool_schemas": task["tool_schemas"]}
    return {"category":task["category"],"prompt":task["prompt"],"input":task["input"],"allowed_tools":list(task["allowed_tools"]),"tool_schemas":task["tool_schemas"]}
