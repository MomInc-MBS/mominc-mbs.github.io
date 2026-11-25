"""Unit tests for HIVE task packet compiler."""
from __future__ import annotations

from pathlib import Path

import pytest

from hive.context_policy import ContextPolicy
from hive.task_packet import PacketItem, TaskPacketCompiler


def _policy():
    return ContextPolicy(policy_path="configs/agent_context_policy.yaml",
                         store_root=Path(".hive"))


def test_compiler_ranks_and_drops_below_threshold():
    pol = _policy()
    comp = TaskPacketCompiler(pol)
    memory = [
        PacketItem(id="m1", source="memory", content="billing invoice details", tokens=50, relevance=0.9, verified=True, timestamp=1.0),
        PacketItem(id="m2", source="memory", content="unrelated xyz topic", tokens=50, relevance=0.1, verified=True, timestamp=2.0),
        PacketItem(id="m3", source="memory", content="billing refund process", tokens=50, relevance=0.8, verified=True, timestamp=3.0),
    ]
    packet = comp.compile(task_id="t1", user_input="billing question",
                          relevant_memory=memory, max_tokens=500)
    ids = [it.id for it in packet.items]
    assert "m1" in ids and "m3" in ids
    assert "m2" not in ids  # below threshold
    assert packet.total_tokens <= 500


def test_user_input_always_fits_fail_closed():
    pol = _policy()
    comp = TaskPacketCompiler(pol)
    # cap too small for required user input
    with pytest.raises(RuntimeError):
        comp.compile(task_id="t1", user_input="a" * 10000, max_tokens=10)


def test_tool_results_spill_over_beyond_reserve():
    pol = _policy()
    comp = TaskPacketCompiler(pol)
    big = "tool output " * 1000  # ~4000 tokens, over reserve of 2000
    tool_results = [
        PacketItem(id="tr1", source="tool-result", content="small result", tokens=20, relevance=0.5, verified=True, timestamp=1.0),
        PacketItem(id="tr2", source="tool-result", content=big, tokens=1600, relevance=0.5, verified=True, timestamp=2.0),
    ]
    packet = comp.compile(task_id="t1", user_input="run tool", tool_results=tool_results, max_tokens=6000)
    assert packet.spillover_count >= 1
    assert packet.spillover_tokens > 0


def test_hard_cap_is_never_exceeded():
    pol = _policy()
    comp = TaskPacketCompiler(pol)
    # 100 items of 6 tokens = 600 tokens; cap 500 -> only 83 fit, rest dropped.
    # Required user input must still fit (fail-closed if it can't).
    memory = [PacketItem(id=f"m{i}", source="memory", content="x" * 24, tokens=6, relevance=0.9, verified=True, timestamp=float(i)) for i in range(100)]
    packet = comp.compile(task_id="t1", user_input="q", relevant_memory=memory, max_tokens=500)
    assert packet.total_tokens <= 500
    assert packet.dropped_count > 0
    assert any(it.source == "user-input" for it in packet.items)


def test_rank_memory_returns_top_k():
    pol = _policy()
    cands = [
        PacketItem(id="a", source="memory", content="billing invoice refund", tokens=20, relevance=0.0, verified=True, timestamp=1.0),
        PacketItem(id="b", source="memory", content="shipping delivery tracking", tokens=20, relevance=0.0, verified=True, timestamp=2.0),
        PacketItem(id="c", source="memory", content="billing payment receipt", tokens=20, relevance=0.0, verified=True, timestamp=3.0),
    ]
    ranked = TaskPacketCompiler.rank_memory("billing payment", cands, top_k=2)
    assert len(ranked) == 2
    assert ranked[0].id in ("a", "c")


def test_packet_as_dict_roundtrip():
    pol = _policy()
    comp = TaskPacketCompiler(pol)
    packet = comp.compile(task_id="t1", user_input="hello", max_tokens=1000)
    d = packet.as_dict()
    assert d["task_id"] == "t1"
    assert d["total_tokens"] <= 1000
    assert d["hard_cap_tokens"] == 1000
    assert "schema_version" in d
