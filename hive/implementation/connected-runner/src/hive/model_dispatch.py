"""C5 active dispatch for ONE task class (c3-proposal). The routing decision here is executed, not just logged.

Modes (configs/model_dispatch.json, default shadow): shadow = execute the requested model (if qualified); canary = execute
the routed model for the first ``canary_limit`` dispatches (count persisted in the store), then shadow; active = always the
routed model. Only models with MEASURED evidence in ``qualified`` are ever executed. Fallback P0 = no model: the caller
ends the experiment MODEL_UNAVAILABLE. Append-only record per dispatch: <model dir>/model_dispatch.jsonl."""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

CFG = Path(__file__).resolve().parents[2] / "configs" / "model_dispatch.json"
STATE = "model-dispatch-state.json"
MODES = ("shadow", "canary", "active")


def load(cfg=None):
    return cfg if isinstance(cfg, dict) else json.loads(Path(cfg or CFG).read_text(encoding="utf-8-sig"))


def _count(root, cls):
    try:
        return int(json.loads((Path(root) / STATE).read_text(encoding="utf-8")).get(cls, 0))
    except (OSError, ValueError):
        return 0


def _bump(root, cls):
    p, n = Path(root) / STATE, _count(root, cls) + 1
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps({cls: n}), encoding="utf-8", newline="\n")  # ponytail: single class; widen to a dict merge for more
    os.replace(tmp, p)
    return n


def plan(store_root, cls, requested, cfg=None):
    """Decide (and, for canary, count) one dispatch. executed None = fallback P0. Never raises on bad config: that is P0 too."""
    d = {"class": cls, "requested_model": requested, "routed_model": None, "executed_model": None, "mode": "shadow", "reason_codes": []}
    try:
        cfg = load(cfg)
        c = cfg["classes"][cls]
        mode = c.get("mode", "shadow")
        if mode not in MODES:
            d["reason_codes"].append("BAD_MODE")
            mode = "shadow"
        d["mode"] = mode
        ok = [m for m, e in cfg["qualified"].items() if isinstance(e, dict) and e.get("measured") is True and e.get("evidence")]
        d["context"] = {m: cfg["qualified"][m].get("context") for m in ok}
        d["routed_model"] = requested if requested in ok else (ok[0] if ok else None)
        if d["routed_model"] is None:
            d["reason_codes"].append("NO_QUALIFIED_MODEL")
        elif requested not in ok:
            d["reason_codes"].append("REQUESTED_UNQUALIFIED")
        use_routed = mode == "active" or (mode == "canary" and _count(store_root, cls) < int(c.get("canary_limit", 0)))
        if mode == "canary":
            d["reason_codes"].append("CANARY_ROUTED" if use_routed else "CANARY_SPENT")
            if use_routed and d["routed_model"]:
                _bump(store_root, cls)
        want = d["routed_model"] if use_routed else requested
        if want in ok:
            d["executed_model"] = want
        elif d["routed_model"]:
            d["reason_codes"].append("EXECUTED_UNQUALIFIED_REFUSED")  # shadow/spent canary with an unmeasured request: never run it
    except Exception as e:
        d["reason_codes"].append(f"CONFIG_ERROR:{type(e).__name__}")
    d["switch_executed"] = d["executed_model"] is not None and d["executed_model"] != requested
    return d


def record(model_dir, d, **extra):
    """Append one dispatch record (cost is 0.0: local models only). Returns the record."""
    rec = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "cost_usd": 0.0, **d, **extra}
    Path(model_dir).mkdir(parents=True, exist_ok=True)
    with open(Path(model_dir) / "model_dispatch.jsonl", "a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(rec, sort_keys=True) + "\n")
    return rec


def loaded(endpoint, model):
    """LM Studio lists every downloaded model on /v1/models (and JIT-loads on a call), so ask /api/v0 for the real state.
    True/False when the endpoint reports it; None when it cannot say (stub or other server): the /v1/models listing stands."""
    import urllib.request
    try:
        with urllib.request.urlopen(endpoint.rstrip("/").rsplit("/v1", 1)[0] + "/api/v0/models/" + model, timeout=15) as r:
            return json.loads(r.read()).get("state") == "loaded"
    except Exception:
        return None
