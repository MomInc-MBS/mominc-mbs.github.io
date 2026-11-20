---
id: "E06"
title: "Use measured interference to test regrouping and routing"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Use measured interference to test regrouping and routing

> **Status: proposed; not run.** Communities and expert assignments are variables, not permanent assumptions.

## Hypothesis

Regrouping experts based on observed interference and transfer outperforms fixed topic groups at equal coordination cost.

## Arms

| Arm | Grouping/routing rule |
|---|---|
| A | Fixed human-defined topic communities |
| B | Fixed similarity-based communities |
| C | Adaptive routing with fixed communities |
| D | Adaptive routing and regrouping using measured transfer/interference |
| E | Random changes at the same frequency and budget |

## Procedure

1. Build a task-by-task transfer matrix using designated development probes.
2. Separate representational interference, router errors and shared-resource contention.
3. Trigger changes using predeclared thresholds and minimum evidence counts.
4. Charge migration, retraining, adapter loading and context translation to the changing arm.
5. Run the sealed evaluation only after freezing the candidate routing/grouping version.

## Measures and falsifier

- Cross-task interference; positive transfer; route regret; success rate; switching/migration cost.
- Group churn, oscillation, missed deadlines and recovery after a specialist fails.
- **Falsifier:** gains vanish after charging reorganization, or regrouping oscillates without durable held-out benefit.
- **Revisit:** task distribution changes or sufficient new evidence invalidates an earlier grouping.

## Runs and outputs

- Pilot: a small set of overlapping and conflicting tasks.
- Confirmation: three task orders × five seeds; keep task families separated across development and final evaluation.
- Save graph snapshots, edge evidence, change triggers, routing traces and rollback checkpoints.
- Preserve superseded groupings as versioned alternatives with reasons for revisiting them.

## Related research paths

[Independent specialists](../10_Research/T02_Specialists/P05_Independent_specialists.md) · [Controller and routing](../10_Research/T03_Coordination/P09_Controller_and_routing.md) · [Adaptive graph and grouping](../10_Research/T03_Coordination/P11_Adaptive_graph_and_grouping.md)

## Related decisions

[How specialists should be grouped](../30_Decisions/D07_How_specialists_should_be_grouped.md)
