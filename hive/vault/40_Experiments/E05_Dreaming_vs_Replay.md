---
id: "E05"
title: "Test whether dreaming adds value beyond verified replay"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Test whether dreaming adds value beyond verified replay

> **Status: proposed; not run.** Keep synthetic examples, external evidence and newly acquired labels distinguishable.

## Hypothesis

Diverse, selected synthetic exercises improve transfer beyond verified replay when compute and external feedback are controlled.

## Arms

| Arm | Learning material |
|---|---|
| A | Replay of the same verified examples already available |
| B | Random model-generated examples |
| C | Examples from unusual expert combinations |
| D | Unusual combinations plus declared selection |
| E | Newly acquired verified examples, with acquisition cost reported |

Arm E is a practical resource-allocation comparison. Its extra ground truth cannot support a causal claim that dreaming alone helps or harms.

## Two complementary controls

| Comparison | Match and report |
|---|---|
| Equal compute | Generation, rejection, scoring, training and verifier compute; disclose unequal external feedback |
| Equal external feedback | Same evidence/label pool and access budget; count new labels, annotation time, verifier calls and outcomes exposed to learners |

A verifier answer can provide new task information even when no human labels it. Record answer quality and reuse rules, not only call count. Include a combined compute/feedback-matched contrast where feasible.

## Procedure

1. Separate training/selection-development evidence from the sealed final test set.
2. Use executable, symbolic or independently adjudicated outcomes where possible.
3. Test familiar tasks and novel combinations of learned skills.
4. Charge discarded candidates, failed trials and per-dream updates to their generating arm.
5. Track evidence-backed, inferred and unsupported content across successive cycles.

## Measures and falsifier

- Held-out transfer, retained skills, invalid-example rate and error amplification.
- Benefit per total compute, external feedback unit and acquisition cost; diversity after selection.
- **Falsifier:** gains vanish under equal feedback, improve only the selection metric, or amplify false claims.
- **Revisit:** stronger verification or a different information/acquisition budget.

## Runs and outputs

- Pilot: one verifier-grounded domain with small batches.
- Confirmation: three task orders × five seeds, adjusted using variance/power; final test items never train or select.
- Save candidate provenance, accept/reject reasons, feedback ledger, acquisition costs, checkpoint ancestry and raw held-out scores.
- Model agreement is a signal, not ground truth.

## Related research paths

[Dreaming and curriculum](../10_Research/T01_Learning/P03_Dreaming_and_curriculum.md) · [Executable verification](../10_Research/T06_Verification/P19_Executable_verification.md) · [Critics and calibrated uncertainty](../10_Research/T06_Verification/P20_Critics_and_calibrated_uncertainty.md) · [Parallel candidates and recovery](../10_Research/T08_Prediction/P26_Parallel_candidates_and_recovery.md)

## Related decisions

[Replay or dreaming](../30_Decisions/D04_Replay_or_dreaming.md) · [What constitutes verification](../30_Decisions/D11_What_constitutes_verification.md)
