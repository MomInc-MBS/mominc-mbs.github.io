"""Tests for the cache-aware usage + cost accounting ledger."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from hive.usage_ledger import UsageLedger, UsageRecord


PRICING = {
    "gpt-4": {
        "fresh_input": 30.0,
        "cached_read": 2.5,
        "cache_write": 4.0,
        "output": 60.0,
    },
    "ollama-local": {
        "fresh_input": 0.0,
        "cached_read": 0.0,
        "cache_write": 0.0,
        "output": 0.0,
    },
}


def _rec(
    run_id: str = "run-1",
    parent_run_id: str | None = None,
    task_id: str = "task-1",
    model: str = "gpt-4",
    fresh_input_tokens: int = 1_000_000,
    cached_read_tokens: int = 0,
    cache_write_tokens: int = 0,
    output_tokens: int = 0,
    wall_seconds: float = 1.0,
    measured: bool = True,
    source: str = "provider_receipt",
) -> UsageRecord:
    return UsageRecord(
        run_id=run_id,
        parent_run_id=parent_run_id,
        task_id=task_id,
        model=model,
        fresh_input_tokens=fresh_input_tokens,
        cached_read_tokens=cached_read_tokens,
        cache_write_tokens=cache_write_tokens,
        output_tokens=output_tokens,
        wall_seconds=wall_seconds,
        measured=measured,
        source=source,
    )


def test_per_class_math(tmp_path: Path) -> None:
    ledger = UsageLedger(tmp_path / "ledger.jsonl", PRICING)
    # fresh_input 1M @ 30 = 30.0; output 500k @ 60 = 30.0; total 60.0
    ledger.record(_rec(fresh_input_tokens=1_000_000, output_tokens=500_000, measured=True))
    totals = ledger.totals()
    assert totals["fresh_input_tokens"] == 1_000_000
    assert totals["output_tokens"] == 500_000
    assert totals["usd_measured"] == pytest.approx(60.0)
    assert totals["usd_estimated"] == pytest.approx(0.0)


def test_cached_tokens_charged(tmp_path: Path) -> None:
    ledger = UsageLedger(tmp_path / "ledger.jsonl", PRICING)
    # cached_read 1M @ 2.5 = 2.5; cache_write 1M @ 4.0 = 4.0; total 6.5
    ledger.record(
        _rec(fresh_input_tokens=0, cached_read_tokens=1_000_000, cache_write_tokens=1_000_000, measured=True)
    )
    totals = ledger.totals()
    assert totals["cached_read_tokens"] == 1_000_000
    assert totals["cache_write_tokens"] == 1_000_000
    assert totals["usd_measured"] == pytest.approx(6.5)


def test_measured_vs_estimated_separated(tmp_path: Path) -> None:
    ledger = UsageLedger(tmp_path / "ledger.jsonl", PRICING)
    ledger.record(_rec(fresh_input_tokens=1_000_000, measured=True))
    ledger.record(_rec(fresh_input_tokens=1_000_000, measured=False, source="estimate"))
    totals = ledger.totals()
    assert totals["usd_measured"] == pytest.approx(30.0)
    assert totals["usd_estimated"] == pytest.approx(30.0)


def test_unknown_model_raises(tmp_path: Path) -> None:
    ledger = UsageLedger(tmp_path / "ledger.jsonl", PRICING)
    with pytest.raises(KeyError):
        ledger.record(_rec(model="no-such-model"))


def test_editing_middle_line_breaks_chain(tmp_path: Path) -> None:
    ledger = UsageLedger(tmp_path / "ledger.jsonl", PRICING)
    ledger.record(_rec(run_id="run-a"))
    ledger.record(_rec(run_id="run-b"))
    ledger.record(_rec(run_id="run-c"))
    assert ledger.verify_chain() is True

    lines = (tmp_path / "ledger.jsonl").read_text(encoding="utf-8").splitlines()
    # Flip a token count in the middle line.
    middle = json.loads(lines[1])
    middle["fresh_input_tokens"] = 999
    lines[1] = json.dumps(middle, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    (tmp_path / "ledger.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")

    assert ledger.verify_chain() is False


def test_parent_child_grandchild_rollup(tmp_path: Path) -> None:
    ledger = UsageLedger(tmp_path / "ledger.jsonl", PRICING)
    ledger.record(_rec(run_id="parent", parent_run_id=None, fresh_input_tokens=1_000_000, measured=True))
    ledger.record(_rec(run_id="child", parent_run_id="parent", fresh_input_tokens=500_000, measured=True))
    ledger.record(_rec(run_id="grandchild", parent_run_id="child", fresh_input_tokens=250_000, measured=True))

    totals = ledger.totals(run_id="parent", include_children=True)
    assert totals["fresh_input_tokens"] == 1_750_000
    assert totals["usd_measured"] == pytest.approx(30.0 + 15.0 + 7.5)

    totals = ledger.totals(run_id="child", include_children=True)
    assert totals["fresh_input_tokens"] == 750_000

    totals = ledger.totals(run_id="parent", include_children=False)
    assert totals["fresh_input_tokens"] == 1_000_000


def test_empty_ledger_zeros(tmp_path: Path) -> None:
    ledger = UsageLedger(tmp_path / "ledger.jsonl", PRICING)
    totals = ledger.totals()
    assert totals["fresh_input_tokens"] == 0
    assert totals["cached_read_tokens"] == 0
    assert totals["cache_write_tokens"] == 0
    assert totals["output_tokens"] == 0
    assert totals["usd_measured"] == pytest.approx(0.0)
    assert totals["usd_estimated"] == pytest.approx(0.0)
    assert ledger.verify_chain() is True


def test_concurrent_processes_chain(tmp_path: Path) -> None:
    ledger_path = tmp_path / "ledger.jsonl"
    src_root = Path(__file__).resolve().parents[1] / "src"

    code = (
        "import sys, os\n"
        "sys.path.insert(0, os.environ['PYTHONPATH'])\n"
        "from hive.usage_ledger import UsageLedger, UsageRecord\n"
        "pricing = {'gpt-4': {'fresh_input': 30.0, 'cached_read': 2.5, 'cache_write': 4.0, 'output': 60.0}}\n"
        "ledger = UsageLedger(os.environ['LEDGER_PATH'], pricing)\n"
        "for i in range(25):\n"
        "    ledger.record(UsageRecord(run_id='r', parent_run_id=None, task_id='t', model='gpt-4',\n"
        "      fresh_input_tokens=1000, cached_read_tokens=0, cache_write_tokens=0, output_tokens=0,\n"
        "      wall_seconds=0.0, measured=True, source='x'))\n"
    )
    env = dict(os.environ)
    env["PYTHONPATH"] = str(src_root)
    env["LEDGER_PATH"] = str(ledger_path)

    procs = [subprocess.Popen([sys.executable, "-c", code], env=env) for _ in range(4)]
    for proc in procs:
        proc.wait()

    lines = ledger_path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 100

    ledger = UsageLedger(ledger_path, PRICING)
    assert ledger.verify_chain() is True
