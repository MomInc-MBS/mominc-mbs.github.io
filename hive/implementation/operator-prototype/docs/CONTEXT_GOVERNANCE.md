# HIVE Context Governance

Permanent context, memory, and token-cost governance for the HIVE local policy
adaptation system. Replaces unbounded chat-history-as-memory with a persistent,
centrally-enforced, auditable system that dispatches only the context each task
needs, checkpoints state, rolls over sessions, and enforces token/cost budgets
on every build loop.

## Source of truth

- `configs/agent_context_policy.yaml` — versioned central policy (policy_version 1)
- `src/hive/context_policy.py` — enforcement library: preflight gate, budgets,
  context windows, dry-run mode, emergency stop
- `src/hive/task_packet.py` — context compiler / task-packet generator
- `src/hive/memory_store.py` — durable verified memory / provenance store
- CLI: `hive context report`, `hive context emergency-stop`,
  `hive context clear-emergency-stop`

## Core principles

1. **Persistent centrally-enforced auditable context.** Every agent launcher and
   dispatch path calls the preflight gate before autonomous execution. The gate
   is fail-closed: a missing provider adapter, budget exhaustion, or an active
   emergency stop blocks dispatch and checkpoints safely rather than warning.
2. **Only-needed context per task.** Task packets are compiled from durable
   verified memory plus runtime inputs with deduplication, relevance filtering,
   tool-result spillover, and a hard token cap (`max_task_packet_tokens`).
   System policy is protected and never compacted away.
3. **Checkpointing and session rollover.** Durable checkpoints via the existing
   `hive.storage` Store / `hive.checkpoint_manager.Checkpoints`. Memory entries
   carry provenance (source, verified flag, timestamp, digest) and an append-only
   audit log. Unverified scratch is TTL'd.
4. **Token/cost budgets enforced on every build loop.** Budgets are cumulative
   across nested agents. Model-specific context windows, pricing tiers, and rate
   limits are resolved from the versioned policy. Provider usage is authoritative
   when available; estimates are flagged, never presented as exact billing.

## Preflight gate

`ContextPolicy.preflight(...)` returns a gate receipt with `eligible`, `reasons`,
and per-check results. A dispatch proceeds only when `eligible` is true. Checks:

- emergency stop not active
- context governance feature flag enabled
- model configured, available, and (optionally) verified
- context utilization within the hard dispatch ratio of the model's window
- nested dispatch depth within `max_nested_dispatch_depth`
- projected run cost within the run budget ceiling (cumulative across nested
  agents)
- remaining budget stays above the verification reserve

On failure the CLI raises `DispatchBlocked` and the task is not enqueued.

## Budgets

Default ceilings (overridable in the policy file):

- `default_task_usd: 1.00`
- `default_run_usd: 10.00`
- `default_daily_usd: 25.00`
- `verification_reserve_ratio: 0.20` (protects funds for verification)

Usage is recorded via `ContextPolicy.record_usage(...)` with actual input/output
token counts and cost. When `emergency_stop_on_exhaustion` is true, exhaustion
triggers an emergency stop that blocks all further dispatch until cleared.

## Context packet

`TaskPacketCompiler.compile(...)` builds a minimal packet:

1. System policy (protected, compiled first)
2. Verified memory ranked by relevance (above `min_relevance_threshold`)
3. Required user input (fail-closed if it cannot fit)
4. Tool results inlined up to `max_uncompressed_tool_result_tokens`; the rest
   spilled to durable memory by reference
5. Previous-output reserve

The packet never exceeds `max_task_packet_tokens`; lowest-relevance items are
dropped to enforce the hard cap.

## Memory

`MemoryStore` layers on the existing `hive.storage.Store`:

- `store_verified(...)` — persists a provenance-tagged entry (verified or not)
  plus an immutable audit-log entry
- `get(key)` / `get_verified(key)` — read with provenance metadata; unverified
  entries are invisible to `get_verified`
- `store_unverified_scratch(...)` — short-TTL scratch, not eligible for packets
- `sweep_expired(...)` — best-effort TTL sweep

## CLI

```
hive context report                          # policy snapshot + budget state
hive context emergency-stop --reason "..."   # activate runtime stop flag
hive context clear-emergency-stop            # clear the stop flag
hive run --task <id> --route tool            # preflight gate runs before enqueue
```

## Verification

45 unit tests cover the policy gate, packet compiler, memory store, and CLI
integration (`tests/unit/test_context_policy.py`,
`tests/unit/test_task_packet.py`, `tests/unit/test_memory_store.py`,
`tests/unit/test_cli_context.py`). The full existing unit suite (275 tests)
passes unchanged.
