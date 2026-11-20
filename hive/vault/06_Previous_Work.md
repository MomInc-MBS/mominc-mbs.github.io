---
id: "HISTORY"
title: "Previous research and attempted methods"
type: "index"
status: "proposed"
evidence_status: "navigation"
implementation_status: "generated"
created: "2026-11-20"
tags:
  - hive
  - hive/index
---

# Previous research and attempted methods

## What was recovered

The package preserves 19 original project artifacts, a linked history page for each source document, 12 method-history pages, and navigable entries from the prior 100-project catalog. See [Recovered original documents](90_Archive/00_Archive_Index.md) and [Prior 100-project research catalog](55_Legacy_Catalog/00_Catalog_Index.md).

## What the artifact audit establishes

- 32 archived experiment manifest entries matched recorded file hashes and byte counts.
- Raw records document 360 small NumPy learning runs and 1,440 scheduling simulations.
- Central statistics were recalculated from the recorded JSON.
- The experiment training scripts were not rerun during this preparation.
- These artifacts do not document real-model tests on the user's RTX 5070 Ti.

## Findings that affect the new plan

| Prior result | Implication | Follow-up |
|---|---|---|
| Conflicting tasks: mixed two-expert grouping 66.11%, compatible grouping 83.88% | Organization deserves direct testing | [Specialist grouping, sharing, and interference](51_Prior_Methods/H02-Specialist-Grouping.md) → [Use measured interference to test regrouping and routing](40_Experiments/E06_Interference_Driven_Regrouping.md) |
| Mostly shared tasks: generalist 91.03%, isolated experts 87.00% | Sharing can help; isolation is not a universal winner | [Specialist grouping, sharing, and interference](51_Prior_Methods/H02-Specialist-Grouping.md) → [Independent models or shared components](30_Decisions/D01_Independent_models_or_shared_components.md) |
| Conflicting generalist: interleaved replay 74.47%, blocked replay 62.64% | Keep the negative scheduling result within its tested scope | [Replay ordering and the reopened sleep branch](51_Prior_Methods/H03-Replay-and-Sleep.md) → [Test sleep, replay order, expansion and distillation independently](40_Experiments/E04_Sleep_Factorial.md) |
| Precise prose and precise numerical formats preserved all tested geometric labels | Precision and representation are separate variables | [Representation precision and communication cost](51_Prior_Methods/H05-Representation-Precision.md) → [Compare typed messages, precise prose and learned representations](40_Experiments/E07_Communication_Representations.md) |
| A stale translator lost accuracy after encoder drift | Version bridges and test consumers together | [Private representations and translator drift](51_Prior_Methods/H06-Translator-Drift.md) → [Learned codes and translators](10_Research/T04_Communication/P15_Learned_codes_and_translators.md) |
| Well-formed semantic errors passed typed gates | Syntax and authority checks do not establish truth | [Typed messages, authority, and semantic errors](51_Prior_Methods/H07-Message-Boundaries.md) → [Executable verification](10_Research/T06_Verification/P19_Executable_verification.md) |
| Scheduler studies used 4/8/16 workers | Larger registry scales remain new experiments | [Model size, resource budgets, and larger hive scales](51_Prior_Methods/H12-Capacity-and-Scale.md) → [Scale 100, 1,000 and 10,000 logical experts with measured active workers](40_Experiments/E10_Logical_Expert_Registry_Scaling.md) |

All percentages are historical synthetic-task outcomes. Conditions and limitations are on the linked pages and in the original report.

## Method pages

- [Prior HIVE corpus and evidence lineage](51_Prior_Methods/H01-Corpus-Lineage.md)
- [Specialist grouping, sharing, and interference](51_Prior_Methods/H02-Specialist-Grouping.md)
- [Replay ordering and the reopened sleep branch](51_Prior_Methods/H03-Replay-and-Sleep.md)
- [Scheduling, selective activation, and graph topology](51_Prior_Methods/H04-Scheduling-and-Graphs.md)
- [Representation precision and communication cost](51_Prior_Methods/H05-Representation-Precision.md)
- [Private representations and translator drift](51_Prior_Methods/H06-Translator-Drift.md)
- [Typed messages, authority, and semantic errors](51_Prior_Methods/H07-Message-Boundaries.md)
- [Earlier architecture choices and open alternatives](51_Prior_Methods/H08-Architecture-Proposals.md)
- [SOL, Grok, and Nemotron implementation workflow](51_Prior_Methods/H09-SOL-Coding-Handoff.md)
- [Video, studio interaction, and horror testbeds](51_Prior_Methods/H10-Application-Testbeds.md)
- [Inherited assumptions and disputed conclusions](51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md)
- [Model size, resource budgets, and larger hive scales](51_Prior_Methods/H12-Capacity-and-Scale.md)

## Preserve the research lineage

**Initial concept → architecture → source foundation → synthetic experiments → v0.1 build/training plan → SOL handoff → this revision.**

A newer page can narrow or revise a conclusion while retaining the earlier page and the reason for the change.
