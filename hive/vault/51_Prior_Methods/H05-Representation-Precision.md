---
id: "H05"
title: "Representation precision and communication cost"
type: "prior_method"
status: "prior_artifact_reviewed"
evidence_status: "prior_artifact_reviewed"
implementation_status: "historical_record"
created: "2026-11-20"
tags:
  - hive
  - hive/prior_method
---

# Representation precision and communication cost

## Actually tried

Across 50,000 synthetic geometric scenes, each representation preserved or discarded coordinates used for three deterministic decisions. No images were recognized.

| Representation | Labels retained | Mean payload |
|---|---:|---:|
| Float32 binary | 100.00% | 32 bytes |
| Numerical JSON | 100.00% | 155.02 bytes |
| Precise coordinate prose | 100.00% | 171 bytes |
| Five-bin words | 86.97% | 82.49 bytes |
| Same five-bin numeric codes | 86.97% | 8 bytes |

## Retain both interpretations

- Compact native values can avoid textual serialization overhead.
- Precise prose preserved all tested labels. The demonstrated loss came from quantization, not from English itself.

The binary payload was approximately 4.84 times smaller than JSON. This is a payload-byte comparison, excluding headers and transport; it is not an inference-speed or token-speed measurement. Finite-sample perfect retention is not a guarantee for every numerical decision boundary.

## New path

Compare precise typed text, tensors, ASTs, event streams, and captions on actual application tasks. Measure downstream correctness, reconstruction error, total bytes, encoder/translator cost, and latency. Keep user explanations readable while retaining native data where downstream consumers benefit.

See [translation](H06-Translator-Drift.md) for incompatible learned spaces.

## Recovered source documents

[HIVE_Simulation_Findings_and_Starting_Plan](../50_Source_History/R15_HIVE_Simulation_Findings_and_Starting_Plan.md) · [HIVE_Reproducible_Experiments](../50_Source_History/R14_HIVE_Reproducible_Experiments.md)

## Current research connections

[Representations and communication](../10_Research/T04_Communication/T04_Communication.md) · [Previous research and attempted methods](../06_Previous_Work.md)
