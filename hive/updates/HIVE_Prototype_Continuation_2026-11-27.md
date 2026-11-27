---
id: HIVE-PROTOTYPE-CONTINUATION-2026-11-27
schema_version: "1.0"
title: "Prototype continuation: routing, revocation scope, real-image gate and package, 27 November 2026"
date: 2026-11-27
status: "packaged prototype; product gate NOT met (7 of 12 goals); image workflow blocked; improvement and rollback not demonstrated; trusted local scope; not production-approved"
project: HIVE
artifact_type: evidence_report
priority: high
---

# Prototype continuation (27 Nov 2026)

This follows [cooperative inference and G3 routing](/hive/notes/C4G3/). The owner approved three decisions: automatic model choice as the default, at most one alternate-provider retry, and revocations scoped to one store. The goal was to finish and package a working operator prototype.

## Verdict

- **Packaged:** `HIVE_Prototype_ee175b5.zip` (sha256 `ce13bb46baff0d8d8dfd7bf5dc287608a160b1af479916fb5e9547775327a0f0`). It is the tracked tree of commit `ee175b5` with no stores and no keys. A clean folder ran a real site goal: VERIFIED, byte-identical to the sealed answer, 0 model calls.
- **Product gate not met:** 7 of 12 frozen goals were accepted. The gate needs 10, with a fresh success in every workflow.
- **Website integrity (A):** 3 of 4 VERIFIED, with 0 model calls, and each output byte-identical to the sealed evaluator answer. On the newest release (`fd6d09b`) the learned link extractor failed its independent check, so HIVE withheld the output. Cause: it reads `url(#...)` fragments inside CSS `data:` SVG URLs as references (3 extra of 674).
- **Release change audit (B):** 4 of 4 VERIFIED, with 0 model calls. Two raw releases go through two pack steps, then the learned release diff. The planner needed a 2-line fix to give each release its own scope.
- **Image audit (C):** blocked. The image contract now counts transparency (2.0.0). It also has a sealed, owner-approved answer key of 47 fresh site pictures, labelled by an independent agent. Two bounded acquisition campaigns, one with local gpt-oss and one with hosted Nemotron, found no open-source matcher that passed. The sealed key was never opened.
- **Improvement and rollback:** not demonstrated. No capability had a valid earlier version with a real weakness and a qualifying improvement.

## What was built

- **Automatic model choice** is now the default (`model-route-v1`). It uses an already admitted capability first, with 0 calls, and an explicit model choice still wins. Every choice records which backends it selected and rejected, with reasons.
- **One bounded fallback.** A temporary provider failure (transport, not loaded, context too small) may use one alternate backend inside an existing attempt slot. A refusal, policy block, identity or integrity failure, stop, budget limit, sealed result or unknown failure never switches provider.
- **Store-scoped revocation.**
  - Each store has a stable id.
  - A normal revoke affects only its own store; `--global` blocks a capability everywhere.
  - Old unscoped entries keep their global meaning.
  - A copied store keeps its restrictions.
  - Demonstrated live: a revoke invalidated a stored plan in one store while an independent store kept running the same goal.
- **Ledger fix.** The concurrent usage-ledger failure was lock starvation, not lost money. One writer kept the lock; the others timed out. The lock now queues fairly, and a new test fails on the old code.

## Gates and spending

- Full test suite on `94558c2`: 2055 passed, 1 failed (a revocation test's timing, fixed in `ee175b5`), 7 skipped.
- **Model calls:** 537 to 557 of 576.
- **Hosted NIM:** $2.64 to $2.77 of $5.
- **Coding agents:** about $385 of $400.
- One mistake was caught and fixed: an evaluator edit invalidated two learned capabilities, and that file was restored byte-for-byte.

Evidence: [final report](/hive/implementation/proto-final-evidence/PROTOTYPE_FINAL_REPORT.md) · [acceptance manifest](/hive/implementation/proto-final-evidence/ACCEPTANCE_MANIFEST.json) · [launch notes](/hive/implementation/proto-final-evidence/LAUNCH.md) · [publication manifest](/hive/implementation/proto-final-publication.json) · [download](/hive/downloads/HIVE_Prototype_ee175b5.zip)
