---
id: "H06"
title: "Private representations and translator drift"
type: "prior_method"
status: "prior_artifact_reviewed"
evidence_status: "prior_artifact_reviewed"
implementation_status: "historical_record"
created: "2026-11-20"
tags:
  - hive
  - hive/prior_method
---

# Private representations and translator drift

## Actually tried

Two modules encoded identical eight-dimensional geometry using different random orthogonal coordinate systems. A 64-coefficient linear translator learned their relationship from paired examples. Ten seeds and held-out scenes were used.

| Condition | Labels retained |
|---|---:|
| No translator | 49.91% |
| 16 noiseless paired examples | 100.00% |
| 64 pairs with noise SD 0.02 | 97.84% |
| Stale translator after encoder changed | 50.26% |

## Interpretation

Equal shape and numerical type do not establish shared meaning. Good translation can restore useful information, while changing an encoder can break an otherwise working pipeline.

## Boundary

This was fitted linear algebra in an intentionally easy low-dimensional setting. It did not test arbitrary pretrained LLM hidden states, learned private language, adversarial translation, or a universal embedding space. The training and evaluation conditions were synthetic.

## New path

Maintain a versioned bundle of encoder, representation, translator, consumer, and stored embeddings. Compare explicit shared schemas, aligned embeddings, learned translators, and no translation. Require held-out downstream tests before activating a replacement; measure alignment-data cost and drift repair.

Retain private-language research as an experimental branch. Do not use private encodings as an authorization mechanism; see [message boundaries](H07-Message-Boundaries.md).

## Recovered source documents

[HIVE_Simulation_Findings_and_Starting_Plan](../50_Source_History/R15_HIVE_Simulation_Findings_and_Starting_Plan.md) · [HIVE_Reproducible_Experiments](../50_Source_History/R14_HIVE_Reproducible_Experiments.md)

## Current research connections

[Representations and communication](../10_Research/T04_Communication/T04_Communication.md) · [Previous research and attempted methods](../06_Previous_Work.md)
