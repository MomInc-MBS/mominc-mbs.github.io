"""Multi-process adversarial proof for the shared usage ledger / budget / run store.

Real subprocesses released together by a barrier file. Each property is tested against the mechanism that
claims it: ledger hash chain + seq, finite budget (DispatchGate reserve under the ledger lock), the Store
claim/recover single-writer path, RunStates sequence numbers, lock recovery and fail-closed lock errors.
Zero model inference: the "request" is a counter.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

import pytest

from hive.context_policy import DispatchBlocked
from hive.dispatch_gate import LEDGER_NAME, DispatchGate
from hive.run_state import RunStates
from hive.storage import Store
from hive.usage_ledger import UsageLedger, UsageRecord
from test_dispatch_gate import LOCAL, _paid_policy

WORKER = str(Path(__file__).with_name("_mp_workers.py"))
SRC = str(Path(__file__).resolve().parents[1] / "src")
PRICING = {"m": {"fresh_input": 2.0, "cached_read": 0.0, "cache_write": 0.0, "output": 2.0}}
ENDPOINT = "http://127.0.0.1:11434"


def _spawn(tmp, cmd, n, *args, tag=""):
    barrier = tmp / f"go{tag}{cmd}"
    outs = [tmp / f"out{tag}{cmd}{i}" for i in range(n)]
    procs = [subprocess.Popen([sys.executable, WORKER, cmd, str(barrier), str(o), *map(str, args)]) for o in outs]
    return barrier, outs, procs


def _run(tmp, cmd, n, *args, tag=""):
    barrier, outs, procs = _spawn(tmp, cmd, n, *args, tag=tag)
    time.sleep(0.5)  # let every interpreter reach the barrier, then release all at once
    barrier.write_text("go")
    for p in procs:
        assert p.wait(timeout=120) == 0
    return [json.loads(o.read_text()) for o in outs]


def _wait_file(path, timeout=30):
    end = time.time() + timeout
    while not path.exists():
        assert time.time() < end, f"timeout waiting for {path}"
        time.sleep(0.01)


def _lines(path):
    return [json.loads(x) for x in Path(path).read_text(encoding="utf-8").splitlines()]


def test_simultaneous_writers_keep_one_gapless_chain(tmp_path):
    ledger_path = tmp_path / "l.jsonl"
    _run(tmp_path, "ledger", 6, ledger_path, 30)
    rows = _lines(ledger_path)
    assert len(rows) == 180
    assert [r["seq"] for r in rows] == list(range(180))  # no skipped / duplicated sequence number
    assert len({r["prev_sha256"] for r in rows}) == 180  # no two lines share a parent: the chain never forked
    assert UsageLedger(ledger_path, PRICING).verify_chain()


def test_verify_chain_rejects_a_skipped_sequence_number(tmp_path):
    ledger = UsageLedger(tmp_path / "l.jsonl", PRICING)
    for i in range(3):
        ledger.record(UsageRecord("r", None, f"t{i}", "m", 1, 0, 0, 0, 0.0, True, "x"))
    assert ledger.verify_chain()
    lines = ledger.path.read_bytes().split(b"\n")
    tampered = lines[0].replace(b'"seq":0', b'"seq":5')
    assert tampered != lines[0]
    ledger.path.write_bytes(b"\n".join([tampered] + lines[1:]))
    assert not ledger.verify_chain()


def test_concurrent_dispatchers_cannot_overdraw_a_finite_budget(tmp_path):
    policy = _paid_policy(tmp_path, run_usd=0.01)  # each call: est $0.002, so only a few fit
    (allowed,) = _run(tmp_path, "gate", 1, tmp_path / "solo", policy, LOCAL, tag="solo")
    assert 1 <= allowed < 50  # the ceiling, not the loop bound, stopped it
    shared = tmp_path / "shared"
    counts = _run(tmp_path, "gate", 4, shared, policy, LOCAL, tag="many")
    assert sum(counts) == allowed, counts  # four racing writers get exactly the one-writer allowance
    rows = _lines(shared / LEDGER_NAME)
    usage = [r for r in rows if r.get("kind") not in ("reservation", "release")]
    assert len(usage) == allowed and sum(r["cost_usd"] for r in usage) <= 0.01
    assert [r["seq"] for r in rows] == list(range(len(rows)))
    assert all(r.get("reservation_id") for r in usage)  # every spend settles its own allocation
    assert UsageLedger(shared / LEDGER_NAME, PRICING).verify_chain()


def test_interrupted_reservation_is_never_refunded(tmp_path):
    policy = _paid_policy(tmp_path, run_usd=0.01)
    gate = DispatchGate(tmp_path / "s", policy_path=policy)
    held = 0
    while True:  # begin() without finish(): requests whose process died mid-flight
        try:
            gate.begin(task_id="t", model=LOCAL, endpoint=ENDPOINT, prompt="x" * 4000, max_tokens=16)
        except DispatchBlocked:
            break
        held += 1
        assert held < 50
    assert held >= 1
    restarted = DispatchGate(tmp_path / "s", policy_path=policy)  # a fresh process sees the same holds
    with pytest.raises(DispatchBlocked):
        restarted.begin(task_id="t", model=LOCAL, endpoint=ENDPOINT, prompt="x" * 4000, max_tokens=16)


def test_recover_and_claim_race_dispatches_an_interrupted_job_once(tmp_path):
    root = tmp_path / "store"
    store = Store(root)
    store.set("budget", {"requests": 1, "tokens_reserved": 128, "tokens_actual": 0, "wall_s": 0.0, "cycles": 1})
    job = store.enqueue({"task": "t"})
    (tmp_path / "x").write_text("go")
    subprocess.run([sys.executable, WORKER, "die_claim", str(tmp_path / "x"), str(tmp_path / "y"), str(root)],
                   check=True, timeout=60)  # claimed by a process that then died holding the reservation
    barrier, outs, procs = _spawn(tmp_path, "store_claim", 4, root, tmp_path / "release")
    time.sleep(0.5)
    barrier.write_text("go")
    for o in outs:
        _wait_file(o)
    claims = [json.loads(o.read_text()) for o in outs]
    (tmp_path / "release").write_text("done")  # winners stay alive until every racer has finished
    for p in procs:
        assert p.wait(timeout=60) == 0
    assert claims.count(job) == 1 and claims.count(None) == 3
    assert store.get("budget")["wall_s"] == 30  # the interrupted reservation was debited exactly once
    assert store.get("inflight") is None
    assert store.get_job(job)["generation"] == 3  # claim, recover, claim: never two live owners
    store.close()


RS_WORKER = (
    "import sys, time, os\n"
    f"sys.path.insert(0, {SRC!r})\n"
    "from hive.storage import Store\n"
    "from hive.run_state import RunStates, IllegalTransition\n"
    "while not os.path.exists(sys.argv[2]): time.sleep(0.002)\n"
    "rs = RunStates(Store(sys.argv[1])); me = os.getpid(); won = 0\n"
    "for i, st in enumerate(['ADMITTED', 'RUNNING', 'CHECKPOINTED', 'RUNNING', 'CHECKPOINTED']):\n"
    "    rs.transition('own%s' % me, st, 'e%d' % i)\n"
    "try:\n"
    "    rs.transition('shared', 'RUNNING', 'race-%s' % me); won = 1\n"
    "except IllegalTransition:\n"
    "    pass\n"
    "rs.effect_begin('shared', 'effect-1')\n"
    "print(won)\n"
)


def test_run_state_sequence_is_gapless_under_racing_writers(tmp_path):
    root = tmp_path / "rs"
    store = Store(root)
    runs = RunStates(store)
    runs.transition("shared", "ADMITTED", "seed")
    go = tmp_path / "go"
    procs = [subprocess.Popen([sys.executable, "-c", RS_WORKER, str(root), str(go)], stdout=subprocess.PIPE, text=True)
             for _ in range(5)]
    time.sleep(0.5)
    go.write_text("go")
    outs = [p.communicate(timeout=120)[0] for p in procs]
    assert all(p.returncode == 0 for p in procs)
    assert sum(int(o) for o in outs) == 1  # exactly one racer won ADMITTED -> RUNNING; the rest were refused
    info = runs.resume("shared")  # full chain verify: seq 1..n, no gaps, digests link
    assert info["cursor"] == 2 and info["state"] == "RUNNING"
    assert info["effects_unknown"] == ["effect-1"]  # five concurrent effect_begin calls produced one row
    assert store.db.execute("SELECT COUNT(*) FROM run_effects WHERE run_id='shared'").fetchone()[0] == 1
    for run in {r["run_id"] for r in store.db.execute("SELECT run_id FROM run_events")} - {"shared"}:
        assert runs.resume(run)["cursor"] == 5  # every private run is gapless too
    store.close()


def _hold_lock(tmp_path, ledger_path):
    out = tmp_path / "held"
    proc = subprocess.Popen([sys.executable, WORKER, "hold", str(tmp_path / "go-hold"), str(out), str(ledger_path)])
    (tmp_path / "go-hold").write_text("go")
    _wait_file(out)
    return proc


def test_lock_recovers_after_the_holder_is_killed(tmp_path):
    path = tmp_path / "l.jsonl"
    holder = _hold_lock(tmp_path, path)
    ledger = UsageLedger(path, PRICING)
    ledger.lock_timeout_s = 0.3
    rec = UsageRecord("r", None, "t", "m", 1, 0, 0, 0, 0.0, True, "x")
    with pytest.raises(TimeoutError):
        ledger.record(rec)  # live holder: fail closed, nothing appended
    assert not path.exists() or path.read_text() == ""
    holder.kill()
    holder.wait(timeout=30)
    ledger.lock_timeout_s = 10
    ledger.record(rec)  # the OS released the dead holder's lock: no stale-lock wedge
    assert [r["seq"] for r in _lines(path)] == [0] and ledger.verify_chain()


def test_lock_error_fails_closed_and_blocks_dispatch(tmp_path):
    policy = _paid_policy(tmp_path, run_usd=1.0)
    root = tmp_path / "s"
    root.mkdir()
    (root / (LEDGER_NAME + ".lock")).mkdir()  # the lock path is unusable: os.open raises
    ledger = UsageLedger(root / LEDGER_NAME, PRICING)
    with pytest.raises(OSError):
        ledger.record(UsageRecord("r", None, "t", "m", 1, 0, 0, 0, 0.0, True, "x"))
    with pytest.raises(DispatchBlocked, match="usage ledger unavailable"):
        DispatchGate(root, policy_path=policy).begin(task_id="t", model=LOCAL, endpoint=ENDPOINT,
                                                     prompt="{}", max_tokens=16)
    assert not (root / LEDGER_NAME).exists()  # no unaccounted usage, no reservation
