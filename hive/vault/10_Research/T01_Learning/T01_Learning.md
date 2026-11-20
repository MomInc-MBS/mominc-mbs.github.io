---
id: "T01"
title: "Learning lifecycle"
type: "topic"
status: "active_research"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/topic
---

# Learning lifecycle

## Central question

Where, when, and by what mechanism should HIVE retain a new capability?

## Separate research paths

| Path | Question | Main experiment |
|---|---|---|
| [Wake memory](P01_Wake_memory.md) | What should survive a task before any training happens? | [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |
| [Sleep consolidation](P02_Sleep_consolidation.md) | Does offline consolidation create retained capability beyond equal-cost replay? | [Test sleep, replay order, expansion and distillation independently](../../40_Experiments/E04_Sleep_Factorial.md) · [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |
| [Dreaming and curriculum](P03_Dreaming_and_curriculum.md) | Can new combinations generate useful practice beyond recycling known examples? | [Test whether dreaming adds value beyond verified replay](../../40_Experiments/E05_Dreaming_vs_Replay.md) |
| [Learning and intentional forgetting](P04_Learning_and_intentional_forgetting.md) | Can HIVE acquire a correction while retaining unrelated skills? | [Test bounded memory, correction, retention and removal](../../40_Experiments/E08_Bounded_Growth_Corrections_Unlearning.md) |

## Adjacent research avenues

[Surprise and curriculum selection](F06_Surprise_and_curriculum_selection.md)

## Research contract

Apply the direct, competing, boundary, adjacent, implementation, and history lanes in [Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md). Retain alternatives on [Open design decisions](../../05_Open_Decisions.md) and distinguish evidence from proposed translation using [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md).
