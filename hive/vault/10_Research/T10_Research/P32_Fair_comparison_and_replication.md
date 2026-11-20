---
id: "P32"
title: "Fair comparison and replication"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Fair comparison and replication

**Parent topic:** [Research method and discovery](T10_Research.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

How can a gain be attributed to the changed mechanism?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P32.A | Equal evidence and update budget | Retained for comparison |
| P32.B | Equal peak resource envelope | Retained for comparison |
| P32.C | Natural scaling curve with all growth visible | Retained for comparison |

## Prototype to build

Preregister outcome, task order, seed, stopping rule, and held-out split. Give strong baselines equivalent tools, retrieval, feedback, and fallback opportunities.

## Measurement and failure condition

Keep unsuccessful runs and timeouts. Separate exploratory tuning from confirmatory runs; report task-level and worst-domain outcomes.

## Adjacent research avenues

Causal inference; ablations; uncertainty estimation; measurement science.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Reproduce prior simulations and separate estimates from measurements](../../40_Experiments/E01_Reproduce_Prior_Work.md) · [Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test sleep, replay order, expansion and distillation independently](../../40_Experiments/E04_Sleep_Factorial.md)  
[How evidence changes a decision](../../30_Decisions/D12_How_evidence_changes_a_decision.md)

## Previous methods

[Prior HIVE corpus and evidence lineage](../../51_Prior_Methods/H01-Corpus-Lineage.md) · [Inherited assumptions and disputed conclusions](../../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md)

## Biological or physical inspiration

[Sleep clearance: preserve a live disagreement](../../20_Metaphors/M12-clearance-disagreement.md) · [Printed pneumatic robots and structure doing computation](../../20_Metaphors/M10-fluidic-structure.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Evidence and contradictions](../T05_Memory/P17_Evidence_and_contradictions.md)
