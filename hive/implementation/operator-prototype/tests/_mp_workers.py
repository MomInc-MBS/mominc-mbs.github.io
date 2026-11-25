"""Subprocess entry points for the cross-process adversarial tests (real OS processes, no mocks of locking)."""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from hive.context_policy import DispatchBlocked  # noqa: E402
from hive.dispatch_gate import DispatchGate  # noqa: E402
from hive.storage import Store  # noqa: E402
from hive.usage_ledger import UsageLedger, UsageRecord  # noqa: E402

PRICING = {"m": {"fresh_input": 2.0, "cached_read": 0.0, "cache_write": 0.0, "output": 2.0}}


def wait_for(path, timeout=60):
    end = time.time() + timeout
    while not os.path.exists(path):
        if time.time() > end:
            sys.exit("barrier timeout")
        time.sleep(0.002)


def main(argv):
    cmd, barrier, out = argv[0], argv[1], argv[2]
    rest = argv[3:]
    wait_for(barrier)
    if cmd == "ledger":
        ledger = UsageLedger(rest[0], PRICING)
        for i in range(int(rest[1])):
            ledger.record(UsageRecord("r", None, f"t{os.getpid()}-{i}", "m", 10, 0, 0, 0, 0.0, True, "x"))
        result = "ok"
    elif cmd == "gate":  # dispatch until blocked; the fake request is just a counter
        gate = DispatchGate(rest[0], policy_path=rest[1], run_id="run-" + str(os.getpid()))
        n = 0
        while n < 50:
            try:
                ticket = gate.begin(task_id="t", model=rest[2], endpoint="http://127.0.0.1:11434",
                                    prompt="x" * 4000, max_tokens=16)
            except DispatchBlocked:
                break
            gate.finish(ticket, {"eval_count": 5, "prompt_eval_count": 1000})
            n += 1
        result = n
    elif cmd == "store_claim":  # recover then claim; stay alive so the claim stays live
        store = Store(rest[0])
        store.recover()
        job = store.claim("w" + str(os.getpid()))
        Path(out).write_text(json.dumps(job["id"] if job else None))
        wait_for(rest[1])
        store.close()
        return
    elif cmd == "hold":  # take the ledger lock, announce, hold until killed
        ledger = UsageLedger(rest[0], PRICING)
        ledger._acquire_lock()
        Path(out).write_text("held")
        time.sleep(120)
        return
    elif cmd == "die_claim":  # claim a job + reserve inflight, then die without cleanup
        store = Store(rest[0])
        job = store.claim("doomed")
        store.set("inflight", {"job": job["id"], "reserved_wall_s": 30})
        os._exit(0)
    else:
        sys.exit("unknown cmd " + cmd)
    Path(out).write_text(json.dumps(result))


if __name__ == "__main__":
    main(sys.argv[1:])
