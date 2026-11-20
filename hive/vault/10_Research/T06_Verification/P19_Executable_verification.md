---
id: "P19"
title: "Executable verification"
type: "research_path"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/research_path
---

# Executable verification

**Parent topic:** [Verification and contamination](T06_Verification.md)  
**Status:** research path; implementation and outcomes remain to be tested.

## Question

Which outcomes can be checked independently?

## Retained branches

| Branch | Candidate mechanism | Current status |
|---|---|---|
| P19.A | Exact or invariant checks | Retained for comparison |
| P19.B | Simulator or measurement checks | Retained for comparison |
| P19.C | Evidence review for questions without a complete oracle | Retained for comparison |

## Prototype to build

Use parsers, test execution, media inspection, geometric constraints, and known-answer task generators where they fit. Version every checker and retain its limits.

## Measurement and failure condition

Insert plausible wrong outputs and valid unusual outputs. Report false acceptance and false rejection separately.

## Adjacent research avenues

Formal methods; metamorphic testing; property-based testing.

Create a new path when one of these changes the mechanism or test; otherwise link new evidence here.

## Experiments and decisions

[Compare generalists, independent specialists, adapters and hybrids](../../40_Experiments/E03_Expert_Architecture_Comparison.md) · [Test whether dreaming adds value beyond verified replay](../../40_Experiments/E05_Dreaming_vs_Replay.md)  
[What constitutes verification](../../30_Decisions/D11_What_constitutes_verification.md)

## Previous methods

[Typed messages, authority, and semantic errors](../../51_Prior_Methods/H07-Message-Boundaries.md) · [Inherited assumptions and disputed conclusions](../../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md)

## Biological or physical inspiration

[Immune discrimination and memory admission](../../20_Metaphors/M03-immune-admission.md)

## Sources to start from

Use the primary sources on the linked history and metaphor pages; add task-specific evidence before making a performance claim.

## Continue through the graph

[Topic-based research-agent workflow](../../70_Local_Build/B05_Research_Agent_Workflow.md) · [Evidence, disagreements, and research state](../../04_Evidence_and_Disagreement.md) · [Topic-first research map](../../03_Research_Map.md)

## Cross-topic connection

[Video production and posting](../T09_Applications/P28_Video_production_and_posting.md)
