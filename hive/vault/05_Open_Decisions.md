---
id: "DECISIONS"
title: "Open design decisions"
type: "index"
status: "proposed"
evidence_status: "navigation"
implementation_status: "generated"
created: "2026-11-20"
tags:
  - hive
  - hive/index
---

# Open design decisions

**A build needs provisional choices. Research needs the alternatives to remain visible.**

| Decision | Experiment |
|---|---|
| [Independent models or shared components](30_Decisions/D01_Independent_models_or_shared_components.md) | [Compare generalists, independent specialists, adapters and hybrids](40_Experiments/E03_Expert_Architecture_Comparison.md) |
| [Where learning should persist](30_Decisions/D02_Where_learning_should_persist.md) | [Test bounded memory, correction, retention and removal](40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |
| [When HIVE should sleep](30_Decisions/D03_When_HIVE_should_sleep.md) | [Compare whole-system and per-specialist sleep during real service](40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md) |
| [Replay or dreaming](30_Decisions/D04_Replay_or_dreaming.md) | [Test whether dreaming adds value beyond verified replay](40_Experiments/E05_Dreaming_vs_Replay.md) |
| [Central or distributed control](30_Decisions/D05_Central_or_distributed_control.md) | [Scale 100, 1,000 and 10,000 logical experts with measured active workers](40_Experiments/E10_Logical_Expert_Registry_Scaling.md) |
| [Language or native representation](30_Decisions/D06_Language_or_native_representation.md) | [Compare typed messages, precise prose and learned representations](40_Experiments/E07_Communication_Representations.md) |
| [How specialists should be grouped](30_Decisions/D07_How_specialists_should_be_grouped.md) | [Use measured interference to test regrouping and routing](40_Experiments/E06_Interference_Driven_Regrouping.md) |
| [Growth, compression, and scale](30_Decisions/D08_Growth_compression_and_scale.md) | [Scale 100, 1,000 and 10,000 logical experts with measured active workers](40_Experiments/E10_Logical_Expert_Registry_Scaling.md) |
| [How far self-improvement may reach](30_Decisions/D09_How_far_self_improvement_may_reach.md) | [Test bounded memory, correction, retention and removal](40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |
| [Knowledge and runtime storage](30_Decisions/D10_Knowledge_and_runtime_storage.md) | [Reproduce prior simulations and separate estimates from measurements](40_Experiments/E01_Reproduce_Prior_Work.md) |
| [What constitutes verification](30_Decisions/D11_What_constitutes_verification.md) | [Test whether dreaming adds value beyond verified replay](40_Experiments/E05_Dreaming_vs_Replay.md) |
| [How evidence changes a decision](30_Decisions/D12_How_evidence_changes_a_decision.md) | [Reproduce prior simulations and separate estimates from measurements](40_Experiments/E01_Reproduce_Prior_Work.md) |

## Decision rule

1. Define the workload and resource envelope.
2. Compare the retained alternatives using the named experiment.
3. Prefer a branch for those conditions, with uncertainty and tradeoffs visible.
4. Preserve the other branches and their strongest evidence.
5. Reopen after a relevant new result, implementation improvement, workload change, or resource change.

No branch is erased solely because the current prototype uses another one.
