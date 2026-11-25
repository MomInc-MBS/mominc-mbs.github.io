"""Subprocess worker for the at-most-once dispatch test: a fake Ollama transport that counts calls in a file.

usage: _amo_worker.py ROOT COUNTER MODE   (MODE: die = hard-exit after the request left, die_after_receipt = hard-exit after its receipt, ok = answer normally)
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from hive.orchestrator import DEFAULT_CONFIG, Executor  # noqa: E402

MODEL = "myr5-hold-local:latest"
CATALOG = {"available": True, "models": [{"id": MODEL, "digest": "sha256:pin"}]}


def main(root, counter, mode):
    ex = Executor(Path(root), dict(DEFAULT_CONFIG, routes=["local_direct"], max_retries=0))

    def transport(*args, **kwargs):
        with open(counter, "a", encoding="utf-8") as f:  # on disk before anything can kill us
            f.write("call\n")
        if mode == "die":
            os._exit(3)  # request sent, no response, no finish
        return {"model": MODEL, "message": {"content": '{"answer": 1}'}, "eval_count": 5}

    if mode == "die_after_receipt":  # the request completed and was receipted, then the worker died before finish
        receipt = ex.runs.effect_receipt
        def receipt_then_die(*args, **kwargs):
            receipt(*args, **kwargs)
            os._exit(4)
        ex.runs.effect_receipt = receipt_then_die

    ex.recover()
    with patch("hive.model_registry.discover", return_value=CATALOG), patch("hive.adapters.ollama.post_json", side_effect=transport):
        out = ex.run_one()
    job = out["id"] if out else None
    print(json.dumps({"out": out and {"passed": out["passed"], "failure": out.get("failure")}, "job": job}))
    ex.close()


if __name__ == "__main__":
    main(*sys.argv[1:4])
