"""Context compiler and task-packet generator.

Compiles the only-needed context for a single task from durable verified
memory plus runtime inputs. Applies relevance filtering, deduplication,
tool-result spillover, and a hard token cap so dispatch never exceeds the
configured max_task_packet_tokens. Fail-closed: if the packet cannot be
compiled within the cap, dispatch is blocked rather than overloaded.
"""
from __future__ import annotations

import hashlib
import math
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .context_policy import ContextPolicy


@dataclass
class PacketItem:
    """One addressable context entry with provenance and relevance."""
    id: str
    source: str  # memory | system-policy | tool-result | user-input | spillover
    content: str
    tokens: int
    relevance: float
    verified: bool
    timestamp: float
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class TaskPacket:
    """Compiled context packet plus spillover ledger and receipt."""
    task_id: str
    items: list[PacketItem] = field(default_factory=list)
    total_tokens: int = 0
    hard_cap_tokens: int = 0
    dropped_count: int = 0
    dropped_tokens: int = 0
    spillover_count: int = 0
    spillover_tokens: int = 0
    schema_version: str = "hive-task-packet-v1"
    compiled_at: float = field(default_factory=time.time)

    def as_dict(self) -> dict[str, Any]:
        return {
            "task_id": self.task_id,
            "items": [
                {
                    "id": it.id,
                    "source": it.source,
                    "content": it.content,
                    "tokens": it.tokens,
                    "relevance": it.relevance,
                    "verified": it.verified,
                    "timestamp": it.timestamp,
                    "metadata": it.metadata,
                }
                for it in self.items
            ],
            "total_tokens": self.total_tokens,
            "hard_cap_tokens": self.hard_cap_tokens,
            "dropped_count": self.dropped_count,
            "dropped_tokens": self.dropped_tokens,
            "spillover_count": self.spillover_count,
            "spillover_tokens": self.spillover_tokens,
            "schema_version": self.schema_version,
            "compiled_at": self.compiled_at,
        }

    def content_text(self) -> str:
        return "\n\n".join(it.content for it in self.items)


def _count_tokens(text: str) -> int:
    """Deterministic token approximation (4 chars/token). Keep dependency-free."""
    if not text:
        return 0
    return max(1, math.ceil(len(text) / 4.0))


def _item_id(source: str, content: str) -> str:
    return hashlib.sha256(f"{source}:{content}".encode("utf-8")).hexdigest()[:16]


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


class TaskPacketCompiler:
    """Builds a minimal, relevant, deduplicated context packet for a task."""

    def __init__(self, policy: ContextPolicy, memory_store=None):
        self.policy = policy
        self.memory_store = memory_store
        self.cfg = policy.context_cfg

    def compile(self, *, task_id: str, user_input: str,
                system_policy_text: str | None = None,
                relevant_memory: list[PacketItem] | None = None,
                tool_results: list[PacketItem] | None = None,
                previous_output: str | None = None,
                max_tokens: int | None = None,
                relevance_threshold: float | None = None,
                protect_system_policy: bool | None = None) -> TaskPacket:
        """Compile the only-needed packet for `task_id`.

        Order: system policy (protected) -> verified memory (ranked by
        relevance) -> user input -> tool results -> previous output reserve.
        Tool results beyond the reserve are spilled over to durable memory
        with a reference pointer rather than inlined.
        """
        cap = int(max_tokens if max_tokens is not None else
                  self.cfg.get("max_task_packet_tokens", 6000))
        threshold = float(relevance_threshold if relevance_threshold is not None else
                          self.cfg.get("min_relevance_threshold", 0.30))
        protect = self.cfg.get("protect_system_policy_from_compaction", True)
        if protect_system_policy is not None:
            protect = protect_system_policy

        reserve = int(self.cfg.get("max_uncompressed_tool_result_tokens", 2000))

        packet = TaskPacket(task_id=task_id, hard_cap_tokens=cap)
        used = 0

        def _add(item: PacketItem) -> bool:
            nonlocal used
            if used + item.tokens > cap:
                return False
            packet.items.append(item)
            used += item.tokens
            packet.total_tokens = used
            return True

        # 1. System policy is protected and compiled first (never compacted away).
        if system_policy_text:
            clean = _clean_text(system_policy_text)
            if clean:
                policy_item = PacketItem(
                    id=_item_id("system-policy", clean),
                    source="system-policy",
                    content=clean,
                    tokens=_count_tokens(clean),
                    relevance=1.0,
                    verified=True,
                    timestamp=time.time(),
                )
                _add(policy_item)

        # 2. Verified memory, ranked by relevance descending.
        memory_items = list(relevant_memory or [])
        memory_items.sort(key=lambda it: it.relevance, reverse=True)
        for item in memory_items:
            if item.relevance < threshold:
                packet.dropped_count += 1
                packet.dropped_tokens += item.tokens
                continue
            if not _add(item):
                packet.dropped_count += 1
                packet.dropped_tokens += item.tokens

        # 3. User input (required context).
        clean_input = _clean_text(user_input)
        if clean_input:
            input_item = PacketItem(
                id=_item_id("user-input", clean_input),
                source="user-input",
                content=clean_input,
                tokens=_count_tokens(clean_input),
                relevance=1.0,
                verified=True,
                timestamp=time.time(),
            )
            if not _add(input_item):
                # Cannot fit required user input: fail-closed.
                packet.dropped_count += 1
                packet.dropped_tokens += input_item.tokens
                raise RuntimeError(
                    f"task packet cannot fit required user input "
                    f"({input_item.tokens} tokens) within cap {cap}")

        # 4. Tool results: inline up to reserve, spill the rest to durable memory.
        tool_results = list(tool_results or [])
        tool_inline_budget = reserve
        tool_inline_used = 0
        for item in tool_results:
            clean = _clean_text(item.content)
            if not clean:
                continue
            tokens = _count_tokens(clean)
            if tool_inline_used + tokens <= tool_inline_budget:
                spill_item = PacketItem(
                    id=item.id or _item_id("tool-result", clean),
                    source="tool-result",
                    content=clean,
                    tokens=tokens,
                    relevance=item.relevance,
                    verified=item.verified,
                    timestamp=item.timestamp,
                    metadata=dict(item.metadata),
                )
                if _add(spill_item):
                    tool_inline_used += tokens
                else:
                    packet.spillover_count += 1
                    packet.spillover_tokens += tokens
                    self._spill_to_memory(item)
            else:
                packet.spillover_count += 1
                packet.spillover_tokens += tokens
                self._spill_to_memory(item)

        # 5. Previous output reserve (always attempt; protected remainder).
        if previous_output:
            clean = _clean_text(previous_output)
            if clean:
                tokens = _count_tokens(clean)
                if used + tokens <= cap:
                    _add(PacketItem(
                        id=_item_id("previous-output", clean),
                        source="previous-output",
                        content=clean,
                        tokens=tokens,
                        relevance=0.9,
                        verified=True,
                        timestamp=time.time(),
                    ))
                else:
                    packet.dropped_count += 1
                    packet.dropped_tokens += tokens

        # 6. Final relevance filter pass: drop lowest-relevance items over cap.
        packet.items.sort(key=lambda it: it.relevance)
        while packet.total_tokens > cap and packet.items:
            removed = packet.items.pop(0)
            packet.total_tokens -= removed.tokens
            packet.dropped_count += 1
            packet.dropped_tokens += removed.tokens
        packet.items.sort(key=lambda it: (-it.relevance, it.timestamp))

        return packet

    def _spill_to_memory(self, item: PacketItem) -> None:
        """Persist an oversized tool result to durable verified memory by reference."""
        if self.memory_store is None:
            return
        try:
            self.memory_store.store_verified(
                key=f"spillover:{item.id}",
                value=item.content,
                source=item.source,
                verified=item.verified,
                metadata={"spillover_tokens": item.tokens, **item.metadata},
            )
        except Exception:
            # Spillover failure must not block packet compilation.
            pass

    @staticmethod
    def rank_memory(query: str, candidates: list[PacketItem], top_k: int = 6) -> list[PacketItem]:
        """Simple lexical relevance ranking over candidate memory entries."""
        query_terms = set(re.findall(r"\w+", query.lower()))
        scored = []
        for item in candidates:
            terms = set(re.findall(r"\w+", item.content.lower()))
            if not terms:
                continue
            overlap = len(query_terms & terms) / max(1, len(query_terms | terms))
            scored.append((overlap, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored[:top_k]]
