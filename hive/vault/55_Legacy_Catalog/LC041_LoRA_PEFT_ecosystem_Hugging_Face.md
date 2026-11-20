---
id: "LC041"
title: "LoRA / PEFT ecosystem (Hugging Face)"
type: "legacy_catalog_entry"
status: "historical_import_not_reverified"
evidence_status: "historical_import_not_reverified"
implementation_status: "not_assessed"
created: "2026-11-20"
tags:
  - hive
  - hive/legacy_catalog_entry
---

# LoRA / PEFT ecosystem (Hugging Face)

**Status:** historical import; current project condition and numerical claims are not reverified here.  
**Original catalog category:** Specialist/Adapter  
**Original catalog label:** Succeeded — a prior classification, not this plan's experimental verdict.

## Prior description

LoRA freezes a pretrained model's weights and trains only small low-rank adapter matrices, and Hugging Face PEFT is the standard open-source library implementing LoRA, QLoRA, DoRA and many other parameter-efficient fine-tuning methods.

## Research lead carried forward

Copy the adapter model: keep one shared base and swap tiny, versioned specialist adapters per agent/task instead of full-model copies, with hot-swapping and merging at deploy time.

This is a historical suggestion to investigate. Adoption requires current primary evidence, a working interface, and a workload comparison.

## Original source trail

- [Original report source 1](https://github.com/huggingface/peft)
- [Original report source 2](https://huggingface.co/docs/peft/en/index)
- [Original report source 3](https://research.modelcitizendeveloper.com/survey/1-208/)
- [Original report source 4](https://temperature2.com/p/2026-10-03-did-you-know-lora-qlora-fine-tuning/)

## Recheck before use

- Current maintainer/release state and exact source revision.
- Model, code, data, and downstream license terms.
- Local setup and supported invocation.
- Mechanism relevant to HIVE, with a competing approach.
- Reproducible evidence for the task rather than popularity or funding.

## Links

[HIVE 100 similar projects report](../50_Source_History/R05_HIVE_100_similar_projects_report.md) · [Specialist structure](../10_Research/T02_Specialists/T02_Specialists.md) · [Inherited assumptions and disputed conclusions](../51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) · [Prior 100-project research catalog](00_Catalog_Index.md)
