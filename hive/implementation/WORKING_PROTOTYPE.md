# Video mission engineering alpha

**21 November 2026 UTC · v0.3.0.dev2 · experimental.** HIVE now reads a bounded local video/caption pair, normalizes captions, selects two source-backed cue proposals, verifies the results, saves development feedback and resumes from durable evidence. Outputs remain local. This is an engineering milestone; **Level A is not accepted and Level B has not run**.

## What ran

A 28.32-second excerpt from a 39:13.75 studio stream completed two objective jobs (captions and clip proposals) using one local-model call and 17 generated tokens. Fresh-process replay and STOP/resume used zero additional calls. The source had prior editing exposure; editorial acceptance is pending and it does not count toward unused A2 tasks.

The final runtime passed **235 tests**, with **2 Windows symlink skips**, and all **3 CLI end-to-end journeys**. Windows junction controls passed. Independent adversarial tests terminate actual worker processes before dispatch and after output rename, then check job identity, costs and output reconciliation. A clean extracted release ZIP passed execution, fresh-process replay, STOP and resume with unchanged output bytes and zero model requests.

The local adapter pins the selected model digest before transport, bounds output and context, and records actual generated tokens. Input-token measurement is unavailable. Caption normalization and clip timestamp/source verification are deterministic; they do not verify audio alignment or editorial quality. Clip proposals remain `needs_operator_review`.

## Download and reproduce

- [Complete source and public evidence ZIP](/hive/downloads/HIVE_Working_Prototype_dev2.zip)
- [Operator demo instructions](/hive/implementation/working-prototype-dev2/docs/PROTOTYPE_DEMO.md)
- [Full supplied build plan](/hive/implementation/working-prototype-dev2/docs/WORKING_PROTOTYPE_BUILD_PLAN.md)
- [Acceptance inventory and remaining gates](/hive/implementation/working-prototype-dev2/docs/PROTOTYPE_ACCEPTANCE.md)
- [Current evidence summary](/hive/implementation/working-prototype-dev2/experiments/results/prototype-dev2-summary.json)
- [Independent review decisions](/hive/implementation/working-prototype-dev2/docs/REVIEW_DECISIONS.md)
- [Final test report](/hive/implementation/working-prototype-dev2/experiments/results/prototype-dev2-tests.xml)
- [CLI journey report](/hive/implementation/working-prototype-dev2/experiments/results/prototype-root-final-e2e/report.json)
- [Clean final ZIP receipt](/hive/implementation/working-prototype-release-smoke.json)
- [Publication manifest](/hive/implementation/working-prototype-dev2-publication.json)
- [Exact file manifest](/hive/implementation/working-prototype-dev2/SNAPSHOT_MANIFEST.json)

Source commit: `2347e6add52542ef5516f680ac77b06e10f08ba2`. Runtime source SHA256: `e8dc974bf4e71f44879bd0a5dfe4194f09d97cd29c9c19c77be11a6be0a6631c`. Download SHA256: `7c312b15b598dcde87f548aa550d57c192ab9cac34635601a0fdb0c05ebadf96`.

## Learning and limits

The mission records the development policy before and after independently verified feedback, the route used, and the next proposed route. A proposal is not counted as a later executed task. No experimental policy has been promoted. Structural feedback cannot establish whether a clip is engaging or preserves a joke.

The complete Level A gate still requires a frozen inventory of at least 12 unused operator-approved tasks across video and isolated code/test, at least 10 accepted outputs, and the remaining operator/recovery evidence. Reusing cues from one stream does not create independent source families. The actual isolated repository workflow and three-family transfer study remain future work. Strong-baseline superiority and compounding improvement are unproven.

The separate WP0 audit used one real local-model call (8 generated tokens) on the previously published v0.3.0.dev1 code. It is not attributed to this changed video runtime. Earlier E0 and controller experiments retain their original source versions, budgets and limitations.

[Next bounded work](/hive/implementation/working-prototype-dev2/docs/NEXT_WORK_ITEM.md) · [Earlier v0.3 foundation](/hive/notes/V03/) · [Experiment registry](/hive/notes/RUNS/)
