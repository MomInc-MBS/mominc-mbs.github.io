---
id: "GLOSSARY"
title: "Terms and measurements"
type: "framework"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/framework
---

# Terms and measurements

## Terms that must stay distinct

| Term | Meaning in this framework |
|---|---|
| Expert | A bounded capability with a contract; may be neural or non-neural |
| Agent | A process that chooses or carries out actions |
| Internal MoE expert | A neural module inside a model |
| Adapter | A compatible parameter update attached to a base model |
| Weight update | A numerical change to trained parameters |
| Memory update | A change to external stored information |
| Sleep | A named consolidation phase with specified operations |
| Dream | A marked synthetic training candidate |
| Graphify index | Derived relationships used for discovery/retrieval |
| Obsidian graph | Navigation among linked notes |
| Evidence | A sourced observation or result, with conditions |
| Metaphor | Inspiration for a mechanism; not proof |
| Reproduction | Running a specified implementation and evaluation |
| Artifact audit | Inspecting preserved code/data and recalculating records |

## Four expert counts

$$
N_{registered},\quad N_{resident},\quad N_{active},\quad N_{trainable}
$$

Measure each independently. A large registry and a small active set can coexist.

## Measure learning, retention, and lifetime cost

For a protected task i:

$$
F_i=A_{before,i}-A_{after,i}
$$

Positive F means forgetting in this comparison. Also report each domain, the worst protected domain, and gains on the new task.

For a new task:

$$
\Delta A_{new}=A_{after,new}-A_{before,new}
$$

Report total examples, repeated presentations, teacher calls, synthetic candidates, discarded generations, updates, wall time, peak memory, and retained storage.

## Resource envelope

$$
V_{peak}=V_{other\ apps}+V_{weights}+V_{cache}+V_{activations}+V_{runtime}+V_{margin}
$$

All terms must be measured or explicitly labeled estimates. Training fit cannot be inferred from inference fit.

## Decision objective

Compare the Pareto tradeoff between quality, retention, latency, learning cost, storage, and human intervention. Set application-specific constraints before confirmatory runs:

$$
Q\ge Q_{min},\quad F\le F_{max},\quad L_{95}\le L_{max},\quad V_{peak}\le V_{budget}
$$

Pilot gates may begin with the earlier plan's proposed quality/forgetting targets, but they are not achieved results. Lock them before the confirmatory test and retain nonattaining runs.
