---
id: "E07"
title: "Compare typed messages, precise prose and learned representations"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Compare typed messages, precise prose and learned representations

> **Status: proposed; not run.** A representation is evaluated by information preserved and actions enabled.

## Hypothesis

Typed or learned inter-expert messages can reduce communication cost while retaining task-relevant meaning; translation and drift may offset the saving.

## Arms

| Arm | Message format |
|---|---|
| A | Precise natural language with an agreed vocabulary |
| B | Typed schemas, units, enums and explicit evidence identifiers |
| C | Domain-native objects: graphs, equations, timelines or spatial state |
| D | Learned latent messages plus a trained/versioned translator |
| E | Hybrid typed envelope with a domain-native or latent payload |

## Procedure

1. Reuse identical source tasks and downstream decisions across arms.
2. Test missing fields, unit changes, contradictions, unseen tasks and upgraded specialists.
3. Measure end-to-end results, not compression alone.
4. For learned messages, version both encoder and decoder; test old/new combinations and round-trip meaning preservation.
5. Keep control authority and evidence provenance explicit regardless of payload format.

## Measures and falsifier

- Task success; lost constraints; semantic/unit errors; decode cost; bandwidth; latency; cross-version failures.
- Independent auditability and leakage of unrelated domain information into decisions.
- **Falsifier:** compressed messages save tokens but increase consequential errors or fail after routine component updates.
- **Revisit:** better translators, schema revisions or a new domain with different native structure.

## Runs and outputs

- Pilot: constrained messages with known target meaning.
- Confirmation: three task orders × five seeds; include unseen schemas/tasks and version-transition cases.
- Save schemas, encoder/decoder hashes, source/decoded examples, decision traces and compatibility results.
- Different representations alone do not guarantee isolation or prevent cross-contamination.

## Related research paths

[Deterministic and nonlanguage experts](../10_Research/T02_Specialists/P08_Deterministic_and_nonlanguage_experts.md) · [Typed channels](../10_Research/T04_Communication/P13_Typed_channels.md) · [Domain-native representations](../10_Research/T04_Communication/P14_Domain_native_representations.md) · [Learned codes and translators](../10_Research/T04_Communication/P15_Learned_codes_and_translators.md) · [Contamination and boundaries](../10_Research/T06_Verification/P21_Contamination_and_boundaries.md) · [NCM and dynamical specialists](../10_Research/T08_Prediction/P27_NCM_and_dynamical_specialists.md) · [Horror haunt game](../10_Research/T09_Applications/P30_Horror_haunt_game.md) · [Biology and physical translation](../10_Research/T10_Research/P33_Biology_and_physical_translation.md)

## Related decisions

[Language or native representation](../30_Decisions/D06_Language_or_native_representation.md)
