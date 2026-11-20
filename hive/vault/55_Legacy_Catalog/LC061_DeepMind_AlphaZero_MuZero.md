---
id: "LC061"
title: "DeepMind AlphaZero / MuZero"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# DeepMind AlphaZero / MuZero

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Cognitive architecture/AGI  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

A pair of DeepMind general reinforcement-learning systems that master games by self-play plus Monte Carlo tree search, with MuZero planning using a learned model of the environment instead of being given the rules.

## Research lead carried forward

Copy the core lesson — learn a compact model of only what matters for decisions (value, policy, reward) and plan/search over it, rather than reconstructing the full world or hard-coding rules — and avoid treating any single game-style benchmark as the product; the value came from transferring the planning recipe to real optimization tasks.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://deepmind.google/research/alphazero-and-muzero/)
- [Original report source 2](https://deepmind.google/blog/muzero-alphazero-and-alphadev-optimizing-computer-systems/)
- [Original report source 3](https://github.com/google-deepmind/mctx)
- [Original report source 4](https://www.nature.com/articles/s41586-020-03051-4)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Coordination and supervision](../10_Research/T03_Coordination/T03_Coordination.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
