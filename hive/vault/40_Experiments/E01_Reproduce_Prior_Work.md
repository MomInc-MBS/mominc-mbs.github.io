---
id: "E01"
title: "Reproduce prior simulations and separate estimates from measurements"
type: "experiment"
status: "proposed_not_run"
evidence_status: "hypothesis"
implementation_status: "not_run"
created: "2026-11-20"
tags:
  - hive
  - hive/experiment
---

# Reproduce prior simulations and separate estimates from measurements

> **Status: prior artifacts recovered; the additional reproduction protocol below is proposed.** Recovered inventory: **32 matching manifests, 360 learning records, and 1,440 scheduler records**. Preserve these existing records; do not describe the entire history as unrun.

## Hypothesis

Recorded simulation conclusions survive exact reconstruction; their dependence on assumptions can be measured separately.

## Evidence classes

| Record type | What it can establish |
|---|---|
| Recovered manifests and numerical records | Recorded configuration/output provenance |
| Exact rerun of original NumPy/code | Reproducibility of the recorded simulation |
| Analytical estimate | Consequences of stated assumptions and equations |
| Executed model benchmark | Behavior of the identified real models and workload |
| Proposal without an execution artifact | A research idea; no invented trial result |

## Procedure

1. Start from the recovered originals and their hashes; link the 32-manifest/360-learning/1,440-scheduler inventory.
2. Rerun the original code, configuration, task order and seeds before changing anything.
3. Compare outputs using a declared numerical tolerance and the original measurement definitions.
4. Keep repairs in a new version with a change log; never overwrite the original record.
5. Run changed-assumption sensitivity trials as a separate experiment family.

## Outcomes, falsifier and revisit

| Outcome | Interpretation |
|---|---|
| `matched_original_configuration_reproduced` | Original conditions and outputs agree |
| `matched_original_configuration_failure` | Exact original conditions can run, but outputs disagree beyond tolerance |
| `changed_assumption_sensitivity` | Different assumptions change results; this is not a failed original reproduction |
| `blocked_reproduction` | Required code/data/environment is unavailable; no conclusion about reproducibility yet |

- **Falsifier:** a claimed robust ranking reverses under relevant plausible assumptions, or an exact rerun contradicts its recorded result.
- **Revisit:** missing artifacts arrive, a bug is found, or real measurements replace simulated costs.

## Runs and outputs

- Pilot: exact original seeds/order; deterministic calculations need no artificial seed replicates.
- Confirmation of sensitivity claims: three task orders × five seeds where stochastic, adjusted after variance/power assessment.
- Save original/corrected hashes, environment lock, commands, output comparisons, assumption tables and outcome labels.
- Simulation reproduction establishes simulation behavior; real-model capability needs its own evidence.

## Related research paths

[Obsidian and Graphify](../10_Research/T05_Memory/P18_Obsidian_and_Graphify.md) · [Branching literature discovery](../10_Research/T10_Research/P31_Branching_literature_discovery.md) · [Fair comparison and replication](../10_Research/T10_Research/P32_Fair_comparison_and_replication.md) · [Research-system improvement](../10_Research/T10_Research/P34_Research_system_improvement.md)

## Related decisions

[Knowledge and runtime storage](../30_Decisions/D10_Knowledge_and_runtime_storage.md) · [How evidence changes a decision](../30_Decisions/D12_How_evidence_changes_a_decision.md)
