"""Bounded experiment execution with allowlisted built-in tools only."""
from __future__ import annotations
import json,time
from hive.task_spec import request_view
from hive.adapters.ollama import OllamaAdapter, make_payload


def _json(obj): return json.dumps(obj,separators=(",",":"),ensure_ascii=False)


def _execute_builtin(task, call):
    if not isinstance(call,dict) or set(call)!={"tool","arguments"}: raise ValueError("malformed tool call")
    name,args=call["tool"],call["arguments"]
    if name not in task["allowed_tools"]: raise PermissionError("tool not allowlisted")
    schemas=task["tool_schemas"]
    if name not in schemas or not isinstance(args,dict): raise ValueError("tool schema missing or arguments malformed")
    category=task["category"]; inp=task["input"]
    if name=="multiply":
        if set(args)!={"a","b"} or any(type(args[k]) is not int for k in args) or args!={"a":inp["a"],"b":inp["b"]}: raise ValueError("multiply arguments invalid")
        return {"answer":args["a"]*args["b"]}
    if name=="run_patch_fixtures":
        if set(args)!={"patch"} or args["patch"] not in inp["patches"]: raise ValueError("patch choice invalid")
        offset=inp["patches"][args["patch"]]
        if type(offset) is not int: raise ValueError("patch registry malformed")
        results=[x+offset for x in inp["fixture_inputs"]]
        return {"patch":args["patch"],"fixture_results":results}
    if name=="add":
        if set(args)!={"a","b"} or any(type(args[k]) is not int for k in args) or args!={"a":inp["a"],"b":inp["b"]}: raise ValueError("add arguments invalid")
        return {"tool":"add","arguments":args,"result":args["a"]+args["b"]}
    if name=="partition_tasks":
        if set(args)!={"task_ids","group_size"} or args["task_ids"]!=inp["task_ids"] or type(args["group_size"]) is not int or args["group_size"]!=2: raise ValueError("partition arguments invalid")
        ids=inp["task_ids"]; return {"groups":[ids[:2],ids[2:]]}
    if name=="lookup_record":
        if set(args)!={"key"} or type(args["key"]) is not str or args["key"]!=inp["query"]: raise ValueError("lookup arguments invalid")
        key=args["key"]; present=key in inp["records"]; value=inp["records"].get(key); conflict=isinstance(value,list)
        if not present or conflict: return {"answer":None,"supported":False,"ambiguous":conflict}
        return {"answer":value,"supported":True,"ambiguous":False}
    if name=="infer_constant":
        if set(args)!={"examples"} or args["examples"]!=inp["examples"]: raise ValueError("adaptation arguments invalid")
        vals=[e.get("output") for e in args["examples"]]
        if not vals or any(type(v) is not int for v in vals) or len(set(vals))!=1: raise ValueError("examples do not establish a constant")
        return {"rule":vals[0]}
    raise PermissionError("tool has no built-in implementation")


def _tool_baseline(task):
    """Choose a deterministic baseline call from public task input only."""
    cat=task["category"]; inp=task["input"]
    if cat=="math": call={"tool":"multiply","arguments":{"a":inp["a"],"b":inp["b"]}}
    elif cat=="code_repair":
        patch=next((name for name,offset in inp["patches"].items() if all(x+offset==y for x,y in zip(inp["fixture_inputs"],inp["fixture_outputs"]))),None)
        call={"tool":"run_patch_fixtures","arguments":{"patch":patch}}
    elif cat=="tool_routing": call={"tool":"add","arguments":{"a":inp["a"],"b":inp["b"]}}
    elif cat=="coordination": call={"tool":"partition_tasks","arguments":{"task_ids":inp["task_ids"],"group_size":2}}
    elif cat=="hallucination": call={"tool":"lookup_record","arguments":{"key":inp["query"]}}
    elif cat=="adaptation": call={"tool":"infer_constant","arguments":{"examples":inp["examples"]}}
    else: raise ValueError(f"unsupported category: {cat}")
    return _execute_builtin(task,call)


def execute(task:dict,route:str,config:dict)->dict:
    start=time.monotonic(); model=config.get("model",""); digest=None; tokens=0; backend="deterministic-tool" if route=="tool" else "fixture"; request=None; output=""; raw_model_output=None; error=None; failure=None
    try:
        max_tokens=int(config.get("max_tokens",128))
        if route in ("local_direct","local_tool") and not 1<=max_tokens<=128: raise ValueError("max_tokens must be between 1 and 128")
        if route=="tool":
            output=_json(_tool_baseline(task)); model="deterministic-tool"; digest="builtin-v1"
        elif route=="fixture_bad":
            if not config.get("allow_fixtures",False): raise ValueError("fixture_bad requires allow_fixtures=True")
            output='{"answer":"deliberately-wrong"}'; model="fixture-bad"; digest="fixture-v1"
        elif route in ("local_direct","local_tool"):
            visible=request_view(task)
            if route=="local_tool": visible={**visible,"instruction":"Return only a JSON tool call with exactly tool and arguments, following one listed tool schema."}
            user_prompt=_json(visible)
            request=make_payload(model,user_prompt,seed=int(config.get("seed",42)),max_tokens=max_tokens)
            adapter=config.get("adapter") or OllamaAdapter(config.get("endpoint","http://127.0.0.1:11434"),float(config.get("timeout_s",120)))
            try: generated=adapter.generate(model,user_prompt,seed=int(config.get("seed",42)),max_tokens=max_tokens)
            except Exception as exc: raise _EnvironmentError(str(exc)) from exc
            if len(generated)!=4: raise RuntimeError("adapter omitted manifest digest or generated token count")
            raw_model_output,actual_model,digest,tokens=generated
            if actual_model!=model: raise RuntimeError("Ollama returned a different model ID than requested")
            if not digest: raise RuntimeError("model manifest digest unavailable")
            tokens=int(tokens)
            if tokens<0 or tokens>max_tokens: raise _ModelOutputError("generated token count exceeded configured cap")
            if not isinstance(raw_model_output,str) or len(raw_model_output.encode("utf-8"))>1_000_000: raise RuntimeError("model output exceeded response size cap")
            backend="ollama"
            try: parsed=json.loads(raw_model_output)
            except (json.JSONDecodeError,TypeError) as exc: raise _ModelOutputError("model output is not valid JSON") from exc
            if not isinstance(parsed,dict): raise _ModelOutputError("model output must be one JSON object")
            if route=="local_tool":
                try: computed=_execute_builtin(task,parsed)
                except (ValueError,PermissionError,KeyError,TypeError) as exc: raise _ModelOutputError(str(exc)) from exc
                output=_json(computed)
            else: output=raw_model_output
        else: raise ValueError(f"unknown route: {route}")
    except _ModelOutputError as exc:
        error=f"MODEL: {exc}"; failure="MODEL"; output=""
    except _EnvironmentError as exc:
        error=f"ENVIRONMENT: {exc}"; failure="ENVIRONMENT"; output=""
    except Exception as exc:
        error=f"{type(exc).__name__}: {exc}"
        failure="IMPLEMENTATION"
        output=""
    return {"output":output,"raw_model_output":raw_model_output,"latency_s":max(0.0,time.monotonic()-start),"tokens":int(tokens),"model":model,"model_digest":digest,"backend":backend,"request":request,"error":error,"failure_category":failure}


class _ModelOutputError(Exception): pass
class _EnvironmentError(Exception): pass
