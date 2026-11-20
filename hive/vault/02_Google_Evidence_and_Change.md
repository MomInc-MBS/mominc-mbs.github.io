---
id: "GOOGLE"
title: "Google evidence and the change to HIVE"
type: "framework"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/framework
---

# Google evidence and the change to HIVE

## Exact source

The relevant work is [The sleep framework: A new way for LLMs to retain knowledge in continual learning](60_Sources/S01_The_sleep_framework_A_new_way_for_LLMs_to_retain_knowledge_in_continual_learning.md), linked to [Language Models Need Sleep: Learning to Self-Modify and Consolidate Memories](60_Sources/S02_Language_Models_Need_Sleep_Learning_to_Self_Modify_and_Consolidate_Memories.md). Related paths such as [Introducing Nested Learning: A new ML paradigm for continual learning](60_Sources/S03_Introducing_Nested_Learning_A_new_ML_paradigm_for_continual_learning.md), [Titans + MIRAS: Helping AI have long-term memory](60_Sources/S04_Titans_MIRAS_Helping_AI_have_long_term_memory.md), [Sleep-time Compute: Beyond Inference Scaling at Test-time](60_Sources/S05_Sleep_time_Compute_Beyond_Inference_Scaling_at_Test_time.md), [Self-Adapting Language Models](60_Sources/S06_Self_Adapting_Language_Models.md), and [Do Language Models Need Sleep? Offline Recurrence for Improved Online Inference](60_Sources/S08_Do_Language_Models_Need_Sleep_Offline_Recurrence_for_Improved_Online_Inference.md) remain separate.

**Source interpretation:** the evidence supports testing offline parametric consolidation and selected synthetic practice. It does not establish the whole HIVE architecture.

## The correction to our earlier interpretation

| Earlier method | What was tested | What it can decide |
|---|---|---|
| [Replay ordering and the reopened sleep branch](51_Prior_Methods/H03-Replay-and-Sleep.md) | Identical minibatches in interleaved versus blocked order | Replay scheduling in the recorded small synthetic models |
| [Language Models Need Sleep: Learning to Self-Modify and Consolidate Memories](60_Sources/S02_Language_Models_Need_Sleep_Learning_to_Self_Modify_and_Consolidate_Memories.md) | A different learning architecture and consolidation procedure | Authors' results under their reported conditions |
| [Test sleep, replay order, expansion and distillation independently](40_Experiments/E04_Sleep_Factorial.md) | New controlled comparisons of the constituent mechanisms | What transfers to a local HIVE workload |

The earlier blocked-replay result remains useful. Extending it into a rejection of sleep, expansion, distillation, or dreaming would be unsupported.

## New framework work

| Component | Candidate behavior to implement | Required comparison |
|---|---|---|
| Learning journal | Preserve verified experience and corrections | Raw retrieval and current-data baseline |
| Consolidation worker | Produce a new stable memory or skill artifact | Interleaved replay and equal-capacity controls |
| Dream worker | Propose unusual but checkable training tasks | Verified real replay and random synthetic examples |
| Capacity manager | Track additions, compression, and retirement | Fixed-capacity and declared-growth curves |
| Release gate | Check retained quality and compatibility | No-change serving baseline |
| Sleep scheduler | Allocate learning time under live workload | Whole-system, staggered, and idle-only operation |

These are HIVE engineering proposals: [Sleep consolidation](10_Research/T01_Learning/P02_Sleep_consolidation.md), [Dreaming and curriculum](10_Research/T01_Learning/P03_Dreaming_and_curriculum.md), [Sleep without interrupting service](10_Research/T07_Resources/P24_Sleep_without_interrupting_service.md), and [Test sleep, replay order, expansion and distillation independently](40_Experiments/E04_Sleep_Factorial.md)–[Compare whole-system and per-specialist sleep during real service](40_Experiments/E09_Sleep_Scheduling_With_Live_Workloads.md).

## Keep contrary evidence visible

[Independent implementation: everrete/llm-sleep](60_Sources/S07_Independent_implementation_everrete_llm_sleep.md) records an independent implementation with a reported negative comparison and implementation gaps. Preserve it as a replication lead; inspect its choices before interpreting a failure as a verdict on the paper.

## Paper fidelity versus an engineering analogue

| Label | Requirement |
|---|---|
| Exact reproduction attempt | Pinned paper version, resolved algorithm, matching architecture/data/evaluation, deviations enumerated |
| Partial reproduction | Reproduces a specified component or result only |
| Sleep-inspired HIVE prototype | Tests an adapted mechanism on HIVE tasks and hardware |
| New HIVE extension | Adds per-specialist scheduling, graph changes, or other mechanisms outside that source claim |

All four are useful. Record the correct label. The first local prototype should be described as an analogue until fidelity is established.

[Experiment index](40_Experiments/00_Experiment_Index.md) · [Replay ordering and the reopened sleep branch](51_Prior_Methods/H03-Replay-and-Sleep.md) · [Primary sources and source trail](60_Sources/00_Source_Index.md)
