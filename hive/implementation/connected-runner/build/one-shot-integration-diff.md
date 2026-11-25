# Readiness integration delta

Baseline: `6a044bb7adb5f8a082a5d298148461031fd9b506`, the actual published
dev3 checkpoint. The old dev2 and research packet descriptions were audited
against this newer source; no reset or replacement framework was used.

| Area | Preserved implementation | Readiness change |
|---|---|---|
| Execution | Executor, durable Store, verifier, policy/review/checkpoint APIs | Public `mission run` dependency graph routes both video and isolated code through the same ledger and budget. |
| Code work | Finite benchmark repair remains supported | Separate `code_mission` adapter: pinned Git archive, explicit files and patch allowlist, host-only pure-function evaluator, digest-pinned Docker Linux isolation, bounded resources, named evidence outputs. |
| Video | Existing captions and clip-plan workflow | Exact job/task/evidence identity checks on replay; existing editorial review requirement preserved. |
| Recovery | Reservation, claim, recovery and feedback transactions | Family replay checks, bounded container watchdog independent of host lifetime, STOP/cancellation, corrupt-output rejection, shared-stage restart reconciliation. |
| Routing | Version 1 policy and historical evidence | Optional version 2 exact-tool preference; development feedback/route/reload/restore tests. No production promotion. |
| Experiments | Benchmark registry, independent objective verifier, integration controls | Eleven finite fixture schedules, scenario-specific mechanisms, positive/negative controls, replay and grouping checks; approval-gated development comparison controls. |
| Operator workflow | Existing CLI and source exporter | Read-only doctor, common mission entry point, pressure commands, persistent engineering queue, one-command real Docker/video demo and portable evidence replay. |
| Release | Existing HIVE static evidence site and allowlisted snapshots | Separate dev4 note, source ZIP, readiness matrix and receipts; old evidence/releases retained. |

Implementation owners were Luna (execution/isolation), Sol (pressure and
experimental controls), Terra (independent tests/verifier), and Astra (integration,
operator workflow, release). Named subscription models were used as directed;
there was no new Grok/Nemotron review or local inference run in this campaign.
The exact model-routing fallback and initial resource state are recorded in
`readiness-baseline.json`.

The failure register retains discovered counterexamples and their fixes. Final
test counts, measured source/config/verifier identities, independent assessment,
clean-package evidence and R1–R8 dispositions are in `readiness-report.json`.

The code adapter is a narrow Python function protocol, not a universal repository
test runner. H01–H11 fixture results are synthetic engineering observations.
Fixed specialist/team fixture arms are explicit proxies; testing an approved
real dispatch adapter with a fake model does not measure a model. Level A has
zero fresh acceptance attempts and Level B remains UNTESTED. Historical budget
allocations stay spent, and no candidate policy or model weights are promoted.
