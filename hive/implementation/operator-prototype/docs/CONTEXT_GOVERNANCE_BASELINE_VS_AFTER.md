# Context Governance: Baseline vs After

## Before (baseline)

- Project memory was implicit, held in growing chat histories with no central
  policy, no budget enforcement, and no provenance.
- Every dispatch sent full or near-full history; no relevance filtering,
  deduplication, or token cap; context windows were not checked against model
  limits.
- Token and cost tracking was ad hoc per-route; no cumulative accounting across
  nested agents, no verification reserve, no emergency stop.
- No durable verified memory: scratch and tool results lived in context only,
  lost on session rollover, with no audit trail.
- CLI had no context inspection or runtime stop controls.

## After

| Area | Before | After |
|------|--------|-------|
| Memory source | Growing chat history | `configs/agent_context_policy.yaml` (versioned, policy_version 1) |
| Enforcement | None | Preflight gate in `src/hive/context_policy.py` (fail-closed) |
| Context per task | Full history | Compiled packet via `src/hive/task_packet.py`: dedup, relevance filter, spillover, hard cap |
| Token/cost budgets | Ad hoc per-route | Cumulative across nested agents; task/run/daily ceilings; verification reserve |
| Model context windows | Unchecked | Resolved per model; utilization checked against hard dispatch ratio |
| Emergency stop | None | Runtime stop flag; blocks all dispatch; `hive context emergency-stop / clear-emergency-stop` |
| Durable verified memory | None | `src/hive/memory_store.py`: verified writes only, append-only audit, provenance, TTL scratch |
| Session rollover | Context lost | Checkpoints via existing Store/Checkpoints; memory persists with provenance |
| CLI context controls | None | `hive context report`, `emergency-stop`, `clear-emergency-stop` |
| Provider billing | Assumed exact | Provider usage authoritative when available; estimates flagged |

## Observable evidence

- `hive context report` returns `schema_version: hive-context-governance-v1`,
  `mode: enforce`, model catalog, and budget state.
- A run whose projected cost would breach the run ceiling is rejected with
  `DispatchBlocked` and not enqueued.
- Task packets never exceed `max_task_packet_tokens`; lowest-relevance items are
  dropped first; required user input is always preserved (fail-closed).
- Emergency stop activates a persistent `STOP` file under the store root that
  blocks every subsequent dispatch until cleared.
- 45 new unit tests pass; the existing 275-test unit suite passes unchanged.
