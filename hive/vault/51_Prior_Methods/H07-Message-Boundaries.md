---
id: "H07"
title: "Typed messages, authority, and semantic errors"
type: "prior_method"
status: "prior_artifact_reviewed"
evidence_status: "prior_artifact_reviewed"
implementation_status: "historical_record"
created: "2026-11-20"
tags:
  - hive
  - hive/prior_method
---

# Typed messages, authority, and semantic errors

## Actually tried

The archive evaluated 30,000 generated messages under four deterministic gate policies. Each seed included 3,000 messages and simulated authenticated identities.

| Gate | Invalid messages accepted | Unauthorized writes accepted/seed | Well-formed false semantics accepted |
|---|---:|---:|---:|
| Shape only | 100% | 500/500 | 100% |
| Typed contract | 40% | 500/500 | 100% |
| Types + capabilities | 20% | 0/500 | 100% |
| Types + capabilities + range | 20% | 0/500 | 100% |

## What this establishes

Types, versions, units, recipients, and scoped authority can reject the injected interface and permission errors. Range checks offered no additional benefit for this particular mixture.

## What remains

Every well-formed semantic error passed. No real database write, cryptographic authentication, OS sandbox, or model-weight update occurred. The artificial error mixture does not estimate deployment failure rates.

## New path

Enforce authority in the runtime and storage service. Test provenance, independent truth checks, contradiction handling, and update ownership separately. Preserve the four Control/Task/Evidence/Teaching channels, with explicit transitions between them. A successfully delivered Task message must not automatically become trusted Teaching data.

See [translation](H06-Translator-Drift.md) and [SOL implementation](H09-SOL-Coding-Handoff.md).

## Recovered source documents

[HIVE_Simulation_Findings_and_Starting_Plan](../50_Source_History/R15_HIVE_Simulation_Findings_and_Starting_Plan.md) · [HIVE_Reproducible_Experiments](../50_Source_History/R14_HIVE_Reproducible_Experiments.md) · [HIVE_AI_Core_Architecture](../50_Source_History/R08_HIVE_AI_Core_Architecture.md) · [HIVE_v0_1_Training_and_Build_Plan](../50_Source_History/R17_HIVE_v0_1_Training_and_Build_Plan.md)

## Current research connections

[Representations and communication](../10_Research/T04_Communication/T04_Communication.md) · [Verification and contamination](../10_Research/T06_Verification/T06_Verification.md) · [Previous research and attempted methods](../06_Previous_Work.md)
