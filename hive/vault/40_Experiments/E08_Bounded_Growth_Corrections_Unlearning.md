---
id: "E08"
title: "Test bounded memory, correction, retention and removal"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Test bounded memory, correction, retention and removal

> **Status: proposed; not run.** Separate bounded total storage from bounded live serving memory. External archives are never off-ledger.

## Hypothesis

Selective consolidation can preserve useful learning and correction behavior under a declared resource regime.

## Two distinct resource regimes

| Regime | What is bounded | Required report |
|---|---|---|
| Total-system persistent cap | All weights, adapters, replay data, indexes, archives, provenance, checkpoints and rollback copies | Total bytes by category; quota use; temporary write headroom; behavior at saturation |
| Bounded serving footprint | Live RAM/VRAM; persistent disk may grow | Peak/resident serving memory **and** cumulative total persistent bytes/growth rate |

For the strict cap, reserve write/rollback headroom inside the quota. If provenance or rollback retention prevents further learning, report the resulting stop/degradation rather than silently exceeding the cap.

## Arms within each applicable regime

- Add modules until the cap, then stop growth.
- Merge/distill modules with measured consolidation costs.
- Evict by a declared utility rule.
- External archive plus retrieval, charged to total persistent storage.
- Hybrid archive plus compact learned modules.

Mark an arm **NA** when it cannot meet the specified regime. Do not compare an unbounded archive against bounded storage as if capacities matched.

## Procedure

1. Introduce dated synthetic facts, unrelated skills and contradictory claims.
2. Replace selected facts; test current answers and explicitly historical queries separately.
3. Remove designated synthetic canary facts from affected serving/training artifacts; record which copies remain.
4. Probe direct, paraphrased and compositional access after updates and restarts.
5. Continue beyond repeated saturation/correction cycles; log every store and temporary peak.

## Measures and falsifier

- Total persistent bytes, live RAM/VRAM, archive growth, update/retrieval costs and new/old performance.
- Correction uptake, obsolete-answer rate, canary recovery and provenance completeness.
- Distinguish retrieval deletion from reducing information's influence in model parameters.
- **Falsifier:** claimed bounded learning relies on off-ledger growth, stalls at saturation, or only hides obvious removal queries.
- **Revisit:** new management methods, a changed cap or stronger removal tests.

## Runs and outputs

- Pilot: synthetic facts with small explicit quotas.
- Confirmation: three task orders × five seeds through repeated saturation, adjusted using variance/power and trend uncertainty.
- Save category-level capacity ledger, checkpoint ancestry, correction/removal manifests, raw probes and trajectories.
- Report observed removal behavior; limited tests do not establish universal unlearning.

## Related research paths

[Wake memory](../10_Research/T01_Learning/P01_Wake_memory.md) · [Sleep consolidation](../10_Research/T01_Learning/P02_Sleep_consolidation.md) · [Learning and intentional forgetting](../10_Research/T01_Learning/P04_Learning_and_intentional_forgetting.md) · [Shared backbone and adapters](../10_Research/T02_Specialists/P06_Shared_backbone_and_adapters.md) · [Internal experts and expandable memory](../10_Research/T02_Specialists/P07_Internal_experts_and_expandable_memory.md) · [Memory compartments and promotion](../10_Research/T05_Memory/P16_Memory_compartments_and_promotion.md) · [Evidence and contradictions](../10_Research/T05_Memory/P17_Evidence_and_contradictions.md) · [Contamination and boundaries](../10_Research/T06_Verification/P21_Contamination_and_boundaries.md) · [Video production and posting](../10_Research/T09_Applications/P28_Video_production_and_posting.md)

## Related decisions

[Where learning should persist](../30_Decisions/D02_Where_learning_should_persist.md) · [How far self-improvement may reach](../30_Decisions/D09_How_far_self_improvement_may_reach.md)
