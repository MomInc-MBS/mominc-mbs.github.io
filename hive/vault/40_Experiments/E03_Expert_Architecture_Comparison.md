---
id: "E03"
title: "Compare generalists, independent specialists, adapters and hybrids"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Compare generalists, independent specialists, adapters and hybrids

> **Status: proposed; not run.** Treat architecture choices as competing branches.

## Hypothesis

Specialization and coordination can improve task success per resource, but their communication and loading costs may erase the gain.

## Arms

| Arm | Configuration |
|---|---|
| A | One generalist with the same deterministic tools |
| B | Independent specialist checkpoints and explicit router |
| C | Shared backbone with selected specialist adapters |
| D | Hybrid: shared specialists plus independent modules where needed |
| E | Deterministic software baseline for tasks it can solve exactly |

## Procedure

1. Use identical task definitions, allowed tools and chronological learning data.
2. Separate router mistakes from specialist mistakes; record tool results independently.
3. Run a common-resource comparison and a second frontier comparison using each arm's natural configuration.
4. Ablate routing, specialization and cross-checking separately.
5. Include unfamiliar tasks requiring abstention, escalation or composition.

## Measures and falsifier

- Verified task completion; false confident outputs; calibration; latency; total inference and training cost.
- Total stored parameters/artifacts, active parameters, model loading, context transfer and coordination overhead.
- **Falsifier:** gains disappear at matched resources, or specialists fail to transfer/combine beyond their narrow tasks.
- **Revisit:** new tasks, better routers or materially different backbone/adapter implementations.

## Runs and outputs

- Pilot: small, balanced samples from video workflows, call interaction and game simulation.
- Confirmation: three task orders × five seeds, subject to power analysis; keep a sealed final set and report intervals.
- Count unsuccessful calls, verifier calls and retries. Record exact checkpoint/adaptor hashes, prompts and tool versions.
- Save a Pareto table and failure taxonomy; do not collapse every tradeoff into one arbitrary score.

## Related research paths

[Independent specialists](../10_Research/T02_Specialists/P05_Independent_specialists.md) · [Shared backbone and adapters](../10_Research/T02_Specialists/P06_Shared_backbone_and_adapters.md) · [Internal experts and expandable memory](../10_Research/T02_Specialists/P07_Internal_experts_and_expandable_memory.md) · [Deterministic and nonlanguage experts](../10_Research/T02_Specialists/P08_Deterministic_and_nonlanguage_experts.md) · [Controller and routing](../10_Research/T03_Coordination/P09_Controller_and_routing.md) · [Executable verification](../10_Research/T06_Verification/P19_Executable_verification.md) · [Critics and calibrated uncertainty](../10_Research/T06_Verification/P20_Critics_and_calibrated_uncertainty.md) · [State estimation and world models](../10_Research/T08_Prediction/P25_State_estimation_and_world_models.md) · [Parallel candidates and recovery](../10_Research/T08_Prediction/P26_Parallel_candidates_and_recovery.md) · [NCM and dynamical specialists](../10_Research/T08_Prediction/P27_NCM_and_dynamical_specialists.md) · [Video production and posting](../10_Research/T09_Applications/P28_Video_production_and_posting.md) · [Horror haunt game](../10_Research/T09_Applications/P30_Horror_haunt_game.md) · [Fair comparison and replication](../10_Research/T10_Research/P32_Fair_comparison_and_replication.md)

## Related decisions

[Independent models or shared components](../30_Decisions/D01_Independent_models_or_shared_components.md)
