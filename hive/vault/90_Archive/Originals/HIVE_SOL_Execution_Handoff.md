# HIVE v0.1 — SOL Execution Handoff

**Date:** 2026-11-19  
**Mission:** Build a reliable local HIVE software foundation using SOL as lead orchestrator, Grok as integration coder/reviewer, and NVIDIA Nemotron as support coder/problem solver. Do not enable autonomous weight updates or unreviewed self-modification during foundation construction.

## 1. Operating contract

SOL owns architecture, sequencing, task decomposition, integration decisions, acceptance, and the current project state. Grok owns connector implementations, software interfaces, API smoke tests, and cross-review of Nemotron work. Nemotron owns typed contracts, capability manifests, memory schema, diagnostic workers, failure classification, watchdogs, and independent tests. Reassign work based on actual measured model/tool capability rather than assumed strengths. Each agent has a distinct Git worktree and cannot write to another agent's worktree. Merge only through SOL after executable checks.

**Do not assume SOL, Grok, or Nemotron is reachable as a configured endpoint.** First discover their exact runtime, model IDs, authorization, invocation interface, rate limits, context limits, and whether they support tools and file operations. If any endpoint is unavailable, log the blocker and continue independent foundation work; do not silently substitute a different model or claim that a task was executed.

## 2. Environment and resource assumptions

Target Windows workstation: RTX 5070 Ti (reported 16 GB VRAM), 64 GB RAM. Existing inventory dated November 15, 2026 lists Python 3.11/3.12, uv, Node.js, Ollama running at inventory time, Ruflo connected at inventory time, LAYA prepared with service offline, LM Studio installed with server offline, Docker Desktop installed with daemon unverified, and local coding CLIs. Reverify all statuses at execution time. Account for OBS, camera, filter and video workloads. Run two profiles: isolated research and studio-sharing. Initial GPU lease count: 1. Initial HIVE VRAM ceiling: 12 GiB when the GPU is otherwise idle; dynamically lower it based on observed availability. Never start training while streaming without an explicitly tested resource profile.

## 3. Initial architecture

- **Task runtime**: owns immutable task IDs, dependency DAG, task journal, state transitions, leases, deadlines, cancellation, resource caps, and idempotency keys.
- **Capability registry**: stores capabilities, executable endpoints, versions, tool schemas, costs, permissions, health and test status, compatible representations and specialist owner.
- **Workers**: Python tool workers, inference wrappers, Ruflo adapter (optional), and narrow specialists. Each is replaceable behind a typed interface.
- **Channels**: Control, Task, Evidence, Teaching; Pydantic versioned envelopes with source, destination, parent IDs, schema version, evidence references, provenance, uncertainty and resource budget.
- **Memory**: SQLite with migrations and bounded working, episodic, semantic, procedural, replay and collective namespaces; no unverified proposal promoted to fact.
- **Local supervisors**: deterministic progress watchdog, timeout controller, resource monitor, retry policy and escalation packet builder. They must not require the lead controller to poll every operation.
- **Verifier**: evaluates actual tool state, tests, constraints and provenance; independent of the proposing worker.
- **Learning staging**: collects verified traces, replay data, candidate procedures and adapters, immutable versions, regression evaluations and rollback pointers. Parameter-training jobs remain disabled until the foundation release gate.

Register 20 capabilities across five groups (control, protocol/repair, execution, memory/evidence, maintenance/learning), with a registry and load policies that can scale to 50 and 100 entries without requiring simultaneous GPU residency. Track registered, trained, loaded, and executing counts separately.

## 4. Repository layout

```text
hive/
  README.md
  pyproject.toml
  uv.lock
  .env.example
  configs/{research.yaml,studio.yaml,permissions.yaml}
  docs/{architecture.md,adr/,inventory.md,runbook.md}
  contracts/{control.py,task.py,evidence.py,teaching.py,capability.py}
  core/{scheduler.py,journal.py,leases.py,registry.py,resources.py,permissions.py}
  adapters/{ollama.py,ruflo.py,laya.py,model_provider.py,tools.py}
  workers/{calculator.py,sqlite_worker.py,retrieval.py,python_sandbox.py,model_worker.py}
  supervisors/{watchdog.py,retry.py,resource_monitor.py,incident.py}
  memory/{db.py,migrations/,retention.py,provenance.py}
  verification/{outcome.py,schemas.py,checks.py}
  learning/{trace_store.py,training_queue.py,candidates.py,promotion.py,rollback.py}
  arena/{operations.py,simulator.py,generator.py,truth.py,splits.py}
  experiments/{baselines.py,metrics.py,compare.py}
  tests/{unit/,integration/,failure_injection/,regression/,acceptance/}
  scripts/{doctor.py,smoke.py,run_demo.py,export_manifest.py}
  artifacts/  # ignored, bounded and versioned
```

## 5. Execution phases and work tickets

### Phase 0 — Discovery and contracts (must complete first)

- **GROK-001** Inspect software and endpoints read-only: Python, uv, GPU/driver, Ollama models, Ruflo, LAYA, LM Studio, available Grok/Nemotron/SOL invocation. Write `docs/inventory.md` and machine-readable `artifacts/capabilities-discovered.json`. Include observed evidence, failures, readiness and versions. No blind installs.
- **NEM-001** Define Pydantic channel envelopes, capability manifest, error taxonomy, version compatibility and JSON Schema export. Write contract tests including malformed fields, missing provenance and incompatible versions.
- **SOL-001** Review architecture decisions and publish `docs/architecture.md`, permissions and resource policy. Assign independent worktrees and record ticket acceptance criteria.
- **Gate 0** Reproducible environment; verified model endpoint or explicit blocker; contracts pass unit tests; no undocumented system changes.

### Phase 1 — Runtime and connections

- **GROK-002** Implement Ollama model wrapper with model discovery, bounded request, cancellation, timeout, response parsing and resource telemetry. Add a Ruflo adapter behind the same capability interface; do not make Ruflo a required dependency for the minimal runtime. Add LAYA integration only after a verified local startup, with a deterministic routing fallback clearly labeled.
- **NEM-002** Implement SQLite migrations, event journal, provenance and bounded retention; enforce ownership and no duplicate task effects.
- **SOL-002** Implement task scheduler, capability registry, leases, idempotent task state machine, budgets and worker health. No model controls execution status directly.
- **Gate 1** Two workers communicate through contracts, one model and one deterministic tool can run, every output has an attributable source, task interruption/restart is safe.

### Phase 2 — Local oversight and verification

- **NEM-003** Implement watchdog: heartbeat plus meaningful progress markers; stalled/failed/cancelled distinctions; bounded retries, backoff, quarantine and escalation. Supervisor handles known operational failures without lead-model polling.
- **GROK-003** Build deterministic verifier, outcome checker, tool schema tests and failure injection tests. Cross-review watchdog and memory changes.
- **SOL-003** Integrate incident packets and escalation; only head controller handles unresolved or cross-group incidents.
- **Gate 2** Forced stall, stale result, invalid payload, retry exhaustion, restart and duplicate-write tests pass. No silent false-success reports.

### Phase 3 — Arena and training preparation

- **GROK-004** Implement ten sandboxed operations: calculate, query records, search docs, read doc, transform, validate, run tests, get job status, write artifact, invoke model. Build API changes (renamed fields, units, enum changes, missing arguments), faults and chained workflows.
- **NEM-004** Build independent truth engine, task generators, source/task-family split, training trace collector and baseline metrics. Start with 300–500 hand-checked seed episodes; proposed total 12,000 episodes: 8,000 train, 1,000 dev, 500 calibration, 500 promotion, 2,000 sealed release. Never expose sealed truth to runtime or candidate generator.
- **SOL-004** Establish deterministic, generalist-with-tools and fixed-role HIVE baselines with identical tools and feedback; record accuracy, cost, p50/p95 latency, RAM/VRAM, interventions and failures.
- **Gate 3** Independent rerun recreates results; held-out task families do not leak through paraphrases or common templates.

### Phase 4 — Controlled learning staging, NOT autonomous training

- **NEM-005** Implement verified incident-to-teaching example conversion and bounded replay stores. Separate memory, procedure, routing and parameter-change events.
- **GROK-005** Implement model/adapter registry, compatibility check, candidate artifact loader, atomic promotion and rollback; training remains disabled by default. Compare native Transformers/PEFT worker with deployed inference parity only after test coverage.
- **SOL-005** Define promotion gate and prepare next-phase controller training tickets. No live self-training without explicit authorization and frozen benchmark.
- **Gate 4** Candidate procedure update can be tested, accepted/rejected and rolled back; incumbent is retained; no unverified learning result is deployed.

## 6. Required task state machine

`CREATED -> VALIDATED -> QUEUED -> LEASED -> RUNNING -> VERIFYING -> {SUCCEEDED, FAILED, BLOCKED, CANCELLED}`. `RUNNING -> RECOVERING -> RUNNING` only under bounded retry policy. Persist every transition with timestamp, actor, version, idempotency key, and evidence reference. Worker output alone cannot transition a task to SUCCEEDED.

## 7. Agent handoff packet

Each SOL assignment to Grok or Nemotron MUST include:

```yaml
ticket_id: GROK-002
objective: "Implement Ollama capability adapter"
allowed_paths: ["adapters/ollama.py", "tests/integration/test_ollama.py"]
inputs: ["contracts/capability.py", "configs/research.yaml"]
interfaces: ["CapabilityManifest v1", "TaskEnvelope v1", "EvidenceEnvelope v1"]
acceptance_tests: ["model discovery", "timeout", "cancel", "schema validation", "failure report"]
resource_limits: {gpu_leases: 1, max_attempts: 2}
permissions: ["read repository", "edit assigned worktree", "run local tests"]
forbidden: ["modify hidden test fixtures", "install unapproved packages", "write outside repo"]
reviewer: "NVIDIA Nemotron"
report_format: ["commit", "files changed", "tests", "evidence", "risks", "blockers"]
```

Grok and Nemotron report completed work only with a commit hash, actual test command/output and observed endpoint status. SOL independently executes or verifies the tests before merge. Reviewers cannot edit protected benchmark or promotion criteria.

## 8. Model-team workflow

1. SOL selects next ready ticket based on dependencies and resource budgets.
2. SOL sends independent tickets to Grok and Nemotron; shared interfaces are frozen for that sprint.
3. Each coder works in its own worktree and commits changes.
4. Peer reviewer inspects diff, test quality, contract compliance, failure handling and resource assumptions.
5. Automated tests execute in a controlled environment. Test failure returns a bounded repair packet to the responsible coder.
6. SOL merges only after acceptance; integration suite runs after merge.
7. Journal records merged revision, capability changes, unresolved risks and next tickets.
8. Repeated manual interventions become incident patterns and proposed local monitors/procedures, not automatic live weight edits.

Do not let the reviewer be the sole oracle. All claims of success require executable evidence. If a model endpoint is unavailable, mark its ticket BLOCKED and continue independent tasks without pretending the role ran.

## 9. Permission boundaries

Allowed without additional user approval: inspect local project files, create/edit in assigned HIVE worktrees, run approved tests, build manifests, write local documentation and non-destructive sandbox artifacts. Require explicit approval for: installs outside approved lockfiles, changing unrelated projects, deleting user data, external publishing, paid model/API usage, credential access beyond already authorized services, network exposure, training live model weights, and deployment of self-modifying code. Preserve secrets in environment variables; redact logs.

## 10. Foundation acceptance demonstration

Run one structured task that: selects a capability; invokes a local model; calls a deterministic tool; exchanges typed messages between two workers; encounters an injected stall; watchdog recovers or escalates; independent verifier checks final state; provenance is persisted; process restarts without duplicating side effects. Record a single command to rerun the demonstration plus test and telemetry reports.

**Foundation release gate:** all required behaviors pass, no critical unverified success, permission tests pass, restart/idempotency pass, complete task history survives restart, rollback works, and resource caps are respected. At that point enable the *next phase* (controller and specialist training) through a separate explicit decision, not by automatic recursion.

## 11. Initial SOL instruction (paste into SOL)

> You are SOL, the lead development orchestrator for HIVE v0.1. Your task is to construct the reliable local software foundation described in this handoff using Grok as integration coder/reviewer and NVIDIA Nemotron as support coder/problem solver. First inspect the repository and verify whether each model and service is reachable. Do not invent successful tool calls, installations, training, or test results. Create an execution board of Phase 0–4 tickets and dependency gates. Assign separate worktrees and explicit allowed paths. Start Phase 0 immediately: request a read-only inventory from Grok, typed interface contracts from Nemotron, and produce the architecture decision record yourself. Merge only after independent executable tests. Preserve all changes and decisions in versioned artifacts. Never enable autonomous weight updates, modify unrelated projects, expose secrets, or spend API credits without approval. Your final output after each phase must include completed tickets, commits, test evidence, blockers, measured resource usage, and the next unblocked tasks. If Grok or Nemotron is unavailable, mark the endpoint unavailable and proceed with only the tasks that can be truthfully completed.

## 12. Transition to training

Only after the foundation gate, start the separately controlled curriculum: train router and protocol translator; train bounded planner/operator; train checker and repairer; learn workflow selection; compare independent and shared adapters; evaluate unseen changed protocols, forgetting, intervention reduction, resource use, restart and rollback. Every candidate update is evaluated against frozen tests and promoted atomically; human-approved enablement is required for any automated parameter-learning cycle.
