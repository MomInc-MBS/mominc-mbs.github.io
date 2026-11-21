# Learning Progress

**The first cycle completed with a rejected proposal. Compounding learning has not been demonstrated.**

1. The unchanged `probe` configuration produced repeated development false accepts.
2. The proposer used those episode IDs to select a bounded procedure: check timing and structure before conditionally invoking ffprobe.
3. Candidate source/configuration, rubric and fixture hashes were frozen for evaluation; the worker received one input path and a fixed configuration, never reference labels.
4. The independent evaluator compared all configurations against unchanged reference labels. Existing correctly solved tasks had no observed regressions.
5. The benefit gate rejected the candidate against the strongest simple control. Production remained unchanged.
6. Separate test-only staging and rollback restored the prior configuration and executed it successfully. No production approval is implied by that test.

| Configuration | Development | Held-out | Mean held-out latency | False accepts / rejects |
|---|---:|---:|---:|---:|
| rules | 48/48 | 24/24 | 63.5 ms | 0 / 0 |
| probe | 16/48 | 8/24 | 100.3 ms | 16 / 0 |
| combined | 48/48 | 24/24 | 96.1 ms | 0 / 0 |
| probe-guard | 48/48 | 24/24 | 73.3 ms | 0 / 0 |


The candidate improves the insufficient probe-only workflow, but does not improve upon `rules`. Its correction is a useful procedure experiment, not evidence of increased best-system capability. The initial diagnostic run proposed an already-existing composition; review caught that duplication. The final bounded procedure has a distinct fail-fast execution order and tool-call counts. Both outcomes are retained; the final comparison uses the same exposed regression fixtures and cannot establish fresh generalization.

## Curves, retention and sample efficiency

![Accuracy by synthetic source group; not a sample-efficiency claim](/hive/evidence/caption-pilot-1/learning-curves.svg)

[Per-source curves](/hive/evidence/caption-pilot-1/learning-curves.json) records accuracy for every source group. [Repeated execution](/hive/evidence/caption-pilot-1/replay.json) checks deterministic output retention. Learning-speed indicator is **not estimated**: there has been no equal-budget, successive-distribution trials-to-threshold study. No neural training, forgetting study, transfer study or real-world performance claim is supported.

## Independent gates

- benefit: **FAIL**
- retention: **PASS**
- safety: **PASS**
- memory: **PASS**
- budgets: **PASS**
- reproducibility: **PASS**
- holdout integrity: **PASS**
- rollback: **PASS**

Here, holdout integrity means frozen bytes, disjoint groups and development-only proposal lineage; it does not mean the fixture labels remain secret from a local operator. Safety and memory gates refer to the 13 recorded regression tests, not a security audit. These trusted-process checks are not a hostile-code sandbox.

[Test and rollback evidence](/hive/evidence/caption-pilot-1/test-results.json) · [Candidate lineage](/hive/evidence/caption-pilot-1/candidate.json) · [Validated development-only dataset](/hive/evidence/caption-pilot-1/curated-dev.json)

Next smallest deciding experiment: freeze an independently labeled, source-disjoint set of real SRT/video tasks before designing the next candidate. Compare rule-only, retrieval/procedure and an already available model under the same budgets. A fresh holdout and real-task gain are prerequisites for any improvement claim.


Last verified: **2026-11-21T04:27:34.3337389Z**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.
