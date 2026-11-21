"""Independent deterministic evaluation; outputs are never trusted as claims."""
from __future__ import annotations
import json
import re
from hive.task_spec import EVALUATOR_VERSION, CATEGORIES


def _parse(output):
    if not isinstance(output,str): return None
    try:
        value=json.loads(output)
        return value if isinstance(value,dict) else None
    except (json.JSONDecodeError,TypeError): return None


_SRT_TIME = re.compile(r"^(\d{2}):(\d{2}):(\d{2}),(\d{3})$")


def _srt_records(text: str, *, canonical=False):
    if not isinstance(text, str): return None
    blocks = re.split(r"\r?\n\s*\r?\n", text.strip()) if text.strip() else []
    result = []
    for block in blocks:
        lines = block.splitlines()
        if len(lines) < 3: return None
        ti = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if ti is None or ti == 0 or ti + 1 >= len(lines): return None
        if canonical and (ti != 1 or lines[0] != str(len(result) + 1)): return None
        pair = lines[ti].split("-->", 1)
        if len(pair) != 2: return None
        values = []
        for raw in pair:
            m = _SRT_TIME.fullmatch(raw.strip())
            if not m: return None
            h, minute, second, millis = map(int, m.groups())
            if minute > 59 or second > 59: return None
            values.append(((h * 60 + minute) * 60 + second) * 1000 + millis)
        if values[1] <= values[0]: return None
        content = "\n".join(lines[ti + 1:]).strip()
        if not content: return None
        result.append((values[0], values[1], content))
    return result if result else None


def _task_ok(task):
    try:
        if (task["category"] not in (*CATEGORIES, "video_captions", "video_clips") or task["split"] not in ("development","validation","holdout")
            or not isinstance(task["id"],str) or not isinstance(task["prompt"],str)
            or not isinstance(task["input"],dict) or not isinstance(task["expected"],dict)
            or type(task["critical"]) is not bool or not isinstance(task["allowed_tools"],list)
            or not all(isinstance(x,str) for x in task["allowed_tools"])
            or not isinstance(task["tool_schemas"],dict)):
            return False
        cat=task["category"]; ev=task["evaluator"]; inp=task["input"]; exp=task["expected"]
        if cat == "video_captions":
            return ev == "video_captions_v1" and task["split"] == "development" and isinstance(inp.get("source_srt"), str) and set(exp)=={"srt"} and task["allowed_tools"] == ["normalize_srt"] and task["tool_schemas"] == {"normalize_srt": {"srt": "string"}}
        if cat == "video_clips":
            cues = inp.get("cues")
            if ev != "video_clips_v1" or task["split"] != "development" or not isinstance(cues, list) or len(cues) < 2 or type(inp.get("duration_ms")) is not int or task["allowed_tools"] or task["tool_schemas"] or exp != {}:
                return False
            ids = set()
            for cue in cues:
                if (not isinstance(cue, dict) or set(cue) != {"id", "start_ms", "end_ms", "text"} or
                    not isinstance(cue["id"], str) or cue["id"] in ids or type(cue["start_ms"]) is not int or
                    type(cue["end_ms"]) is not int or not 0 <= cue["start_ms"] < cue["end_ms"] <= inp["duration_ms"] or
                    not isinstance(cue["text"], str)):
                    return False
                ids.add(cue["id"])
            return True
        mapping={"math":"math_exact","code_repair":"finite_patch_fixtures","tool_routing":"tool_route_exact","coordination":"coordination_partition","hallucination":"unsupported_claim","adaptation":"adaptation_rule"}
        if ev!=mapping[cat] or inp.get("allowed_tools")!=task["allowed_tools"] or inp.get("tool_schemas")!=task["tool_schemas"]: return False
        expected_keys={"math":{"answer"},"code_repair":{"patch","fixture_results"},"tool_routing":{"tool","arguments","result"},"coordination":{"groups"},"hallucination":{"answer","supported","ambiguous"},"adaptation":{"rule"}}
        if set(exp)!=expected_keys[cat]: return False
        if cat=="math": return type(inp.get("a")) is int and type(inp.get("b")) is int and type(exp["answer"]) is int
        if cat=="code_repair": return isinstance(inp.get("fixture_inputs"),list) and isinstance(inp.get("fixture_outputs"),list) and len(inp["fixture_inputs"])==len(inp["fixture_outputs"])>0 and isinstance(inp.get("patches"),dict) and isinstance(exp["patch"],str) and isinstance(exp["fixture_results"],list)
        if cat=="tool_routing": return type(inp.get("a")) is int and type(inp.get("b")) is int and isinstance(exp["arguments"],dict)
        if cat=="coordination": return isinstance(inp.get("task_ids"),list) and len(inp["task_ids"])==4 and isinstance(exp["groups"],list)
        if cat=="hallucination": return isinstance(inp.get("records"),dict) and isinstance(inp.get("query"),str) and type(exp["supported"]) is bool and type(exp["ambiguous"]) is bool
        if cat=="adaptation": return isinstance(inp.get("examples"),list) and len(inp["examples"])>=3 and type(exp["rule"]) is int
        if cat=="video_captions": return ev == "video_captions_v1" and set(exp)=={"srt"}
        if cat=="video_clips": return ev == "video_clips_v1" and exp == {}
    except (KeyError,TypeError,AttributeError):
        return False
    return False


def verify(task: dict, result: dict) -> dict:
    if not _task_ok(task): return {"valid":False,"passed":False,"quality":0,"unsupported":0,"reason":"malformed_task_or_missing_evidence","evaluator":EVALUATOR_VERSION}
    category=task["category"]; expected=task["expected"]; inp=task["input"]
    output=result.get("output"); parsed=_parse(output); failure=result.get("failure_category")
    if failure and failure!="MODEL":
        return {"valid":False,"passed":False,"quality":0,"unsupported":0,"reason":"execution_failure","evaluator":EVALUATOR_VERSION}
    if result.get("error") and failure!="MODEL":
        return {"valid":False,"passed":False,"quality":0,"unsupported":0,"reason":"execution_failure","evaluator":EVALUATOR_VERSION}
    # A model-classified failure is usable zero-quality feedback, never a pass.
    if failure=="MODEL":
        return {"valid":True,"passed":False,"quality":0,"unsupported":0,"reason":"model_output_invalid","evaluator":EVALUATOR_VERSION}
    if parsed is None:
        return {"valid":False,"passed":False,"quality":0,"unsupported":0,"reason":"invalid_json","evaluator":EVALUATOR_VERSION}
    passed=False; unsupported=0
    try:
        if category=="math":
            passed=set(parsed)=={"answer"} and type(parsed["answer"]) is int and parsed["answer"]==expected["answer"]
        elif category=="code_repair":
            name=parsed.get("patch"); allowed=inp["patches"]
            fixtures=inp["fixture_inputs"]
            # Independently run finite, predefined integer offset functions.
            observed=[x+allowed[name] for x in fixtures] if type(name) is str and name in allowed and type(allowed[name]) is int else None
            outputs=parsed.get("fixture_results")
            passed=set(parsed)=={"patch","fixture_results"} and observed==inp["fixture_outputs"] and type(outputs) is list and all(type(v) is int for v in outputs) and outputs==observed
        elif category=="tool_routing":
            args=parsed.get("arguments")
            passed=set(parsed)=={"tool","arguments","result"} and parsed.get("tool")=="add" and isinstance(args,dict) and set(args)=={"a","b"} and type(args["a"]) is int and type(args["b"]) is int and args=={"a":inp["a"],"b":inp["b"]} and type(parsed.get("result")) is int and parsed["result"]==inp["a"]+inp["b"]
        elif category=="coordination":
            groups=parsed.get("groups")
            passed=set(parsed)=={"groups"} and isinstance(groups,list) and len(groups)==2 and all(isinstance(g,list) and len(g)==2 for g in groups) and all(isinstance(x,str) for g in groups for x in g) and sorted(x for g in groups for x in g)==sorted(inp["task_ids"]) and len({x for g in groups for x in g})==len(inp["task_ids"])
        elif category=="hallucination":
            key=inp["query"]; record=inp["records"].get(key)
            conflict=isinstance(record,list)
            if key in inp["records"] and not conflict: want={"answer":record,"supported":True,"ambiguous":False}
            else: want={"answer":None,"supported":False,"ambiguous":conflict}
            unsupported=int(parsed.get("supported") is True and (key not in inp["records"] or conflict or parsed.get("answer")!=record))
            passed=(set(parsed)==set(want) and type(parsed.get("supported")) is bool and type(parsed.get("ambiguous")) is bool and (parsed.get("answer") is None or type(parsed.get("answer")) is str) and parsed==want and parsed==expected)
        elif category=="adaptation":
            vals=[item["output"] for item in inp["examples"]]
            passed=set(parsed)=={"rule"} and all(type(v) is int for v in vals) and len(set(vals))==1 and type(parsed.get("rule")) is int and parsed["rule"]==vals[0] and parsed==expected
        elif category=="video_captions":
            actual = parsed.get("srt")
            original_records = _srt_records(inp["source_srt"])
            actual_records = _srt_records(actual, canonical=True)
            normalized = []
            previous_end = 0
            if original_records:
                for start, end, text in sorted(original_records, key=lambda cue: (cue[0], cue[1])):
                    start = max(start, previous_end)
                    if end <= start:
                        normalized = []
                        break
                    normalized.append((start, end, text))
                    previous_end = end
            passed=(set(parsed)=={"srt"} and type(actual) is str and actual==expected["srt"] and
                    bool(original_records) and actual_records == normalized)
        elif category=="video_clips":
            ids=parsed.get("cue_ids")
            allowed={cue["id"]: cue for cue in inp["cues"]}
            passed=(set(parsed)=={"cue_ids"} and isinstance(ids,list) and len(ids)==2 and
                    all(isinstance(i,str) and i in allowed for i in ids) and len(set(ids))==2)
    except (KeyError,TypeError,ValueError):
        return {"valid":False,"passed":False,"quality":0,"unsupported":unsupported,"reason":"malformed_task_or_missing_evidence","evaluator":EVALUATOR_VERSION}
    # JSON of any shape is an observed model attempt. Exact key sets stop extra claims.
    return {"valid":True,"passed":bool(passed),"quality":int(bool(passed)),"unsupported":int(unsupported),"reason":"passed" if passed else "check_failed","evaluator":EVALUATOR_VERSION}
