---
id: "EVIDENCE"
title: "Evidence, disagreements, and research state"
type: "framework"
status: "proposed"
evidence_status: "design_proposal"
implementation_status: "not_implemented"
created: "2026-11-20"
tags:
  - hive
  - hive/framework
---

# Evidence, disagreements, and research state

## Two independent status fields

| Evidence status | Implementation status |
|---|---|
| Primary-source statement | Not implemented |
| Author-reported measurement | Specified |
| Independent replication report | Prototype |
| Prior artifact audited | Reproduced locally |
| Current local measurement | Evaluated |
| Hypothesis or metaphor | Serving candidate |
| Unresolved or historical import | In use under named conditions |

A repository can be installed without having a valid benchmark. A paper can be credible without fitting this PC.

## Preserve alternatives without assigning equal evidence

Each decision page records:

- The precise question and scope.
- All retained alternatives.
- Evidence supporting and challenging each alternative.
- A provisional implementation default.
- The experiment that could change the default.
- Conditions for reopening a dormant path.
- A dated log explaining every change.

Use statuses: **unexplored, specified, testing, supported under conditions, challenged under conditions, inconclusive, dormant**. Keep dormant pages linked.

## Claim and result records

| Record | Required fields |
|---|---|
| Source | Canonical URL or original file hash, authors/project, date, version, access date |
| Claim | Exact proposition, scope, source locator, observed versus inferred |
| Experiment | Hypothesis, arms, data split, budgets, seeds/orders, acceptance criteria |
| Run | Code/config/model/data hashes, hardware, timestamps, raw outputs, failures |
| Result | Metrics, variability, limitations, supported scope, counterexamples |
| Decision | Alternatives, provisional choice, rationale, reopening condition |

Model confidence is not a substitute for any of these fields.

## Disagreement example

[Replay ordering and the reopened sleep branch](51_Prior_Methods/H03-Replay-and-Sleep.md) and [Language Models Need Sleep: Learning to Self-Modify and Consolidate Memories](60_Sources/S02_Language_Models_Need_Sleep_Learning_to_Self_Modify_and_Consolidate_Memories.md) differ in architecture and learning procedure. Link them with **different_scope**, not automatically **contradicts**.

[Sleep clearance: preserve a live disagreement](20_Metaphors/M12-clearance-disagreement.md) preserves a biological disagreement. Compare methods and endpoints before choosing whether the findings conflict.

## Relationship vocabulary

| Relation | Meaning |
|---|---|
| subtopic_of | Research hierarchy |
| motivated_by | Analogy or inspiration |
| supported_by | Evidence supports a specific scoped claim |
| challenged_by | Evidence challenges the same relevant claim |
| different_scope | Apparently opposing results test different conditions |
| tested_by | Experiment evaluates a path or decision |
| derived_from | Historical lineage |
| depends_on | Implementation dependency |
| adjacent_to | Promising connection awaiting investigation |
| related_to | Navigation only; no evidential force |

The included graph uses these labels. Ordinary hyperlinks remain navigational and must not be silently interpreted as support.

## Import policy

Historical catalogs are retained and linked. Their “succeeded,” “failed,” or similar labels remain historical classifications, not fresh HIVE measurements or current project-health judgments. Use [Inherited assumptions and disputed conclusions](51_Prior_Methods/H11-Inherited-Claims-to-Recheck.md) before adopting an old recommendation.
