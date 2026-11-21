# Integration contract — v0.1

Target: D:/Repos/hive-ai, build/autonomous-v0.1, base 2e14c0e. No remote or deployment.
Use Python 3.11+ standard library and pytest. All module imports are hive.*.
No nested agents. Each worker checks this directory and branch with explicit
exec_command workdir before edits. No edits to AR-Party-Horror. No git commits
by workers. Root integrates and commits. APIs below are the shared contract;
coordinate with root before changing signatures. Return JSON-serializable dicts.

## LUNA ownership
task_spec.py, model_registry.py, adapters/*, verifier.py, experiment_runner.py,
benchmarks/*, tests/unit/test_subjects.py, tests/adversarial/test_verifier.py.

Task dict: id, category, split (development|validation|holdout), prompt,
input (dict), expected (JSON), critical (bool), evaluator (string),
allowed_tools (list). NEVER send expected to model. No arbitrary model code execution.
`task_spec.load_tasks(split, seed=42, count_per_category=4) -> list[dict]`:
six categories math, code_repair, tool_routing, coordination, hallucination,
adaptation. Deterministic distinct seeds per split; generated holdout labels
are evaluator-only, never used by policy. Code repair uses finite patch choices
with independently tested fixtures, not arbitrary eval/exec. Document ceiling.
`model_registry.discover(endpoint='http://127.0.0.1:11434') -> dict`:
models array with exact IDs/digests and availability; endpoint loopback only.
`experiment_runner.execute(task, route, config) -> dict`: output (str),
latency_s (float), tokens (int), model (str), model_digest (str), backend (str),
request (dict, no answers), error (str|null), failure_category (str|null).
routes: local_direct, local_tool, tool, fixture_bad (tests only; config flag).
local_tool asks the real model for a tool route; performs only allowlisted
deterministic operations after schema validation. tool is deterministic baseline.
config: endpoint, model, timeout_s, max_tokens, seed, allow_fixtures=False.
`verifier.verify(task, result) -> dict`: valid (bool, evaluation usable),
passed (bool), quality (0 or 1), unsupported (0 or 1), reason (str),
evaluator (version string). A result's claimed success is never trusted.
Classified model-answer failures are valid zero-quality observations. Environment,
implementation and invalid-evaluator failures are excluded from ability updates.

## TERRA ownership
storage.py, checkpoint_manager.py, failure_triage.py,
tests/unit/test_storage.py, tests/integration/test_recovery.py.

`storage.Store(root: Path|str)`: SQLite + content-addressed JSON artifacts.
`.put_artifact(value) -> str` SHA256 relative ref; `.read_artifact(ref) -> dict`
verifies digest, refuses traversal. `.enqueue(spec: dict) -> str` job id.
`.claim(owner: str) -> dict|None`: atomic claim incl id,spec,lease generation.
`.transition(job_id, state, detail=None, owner=None, generation=None)`:
guard valid state transitions and ownership for claimed work. Store events.
states QUEUED,RUNNING,VERIFYING,REVIEWING,PROMOTED,REJECTED,RETRY_READY,BLOCKED.
`.finish(job_id, state, result: dict, owner, generation)` persisted terminal result.
`.recover() -> list[str]`: explicit single-worker invocation, detect dead PID only,
requeue abandoned active jobs without treating live jobs as dead.
`.jobs() -> list[dict]`, `.get_job(id) -> dict`, `.get(key, default=None)`,
`.set(key,value)`, `.close()`. Durable kv and jobs/history. Worker lock enforced
by root; stale generation writes refused. PID recorded at claim.
`checkpoint_manager.Checkpoints(store)`: `.save(policy, evidence, approved=False)
-> str`, `.promote(checkpoint_id)`, `.rollback(checkpoint_id)`, `.current() -> dict|None`.
Only approved checkpoints eligible; corruption/unknown ids rejected.
`failure_triage.triage(job, category, reason, evidence_paths=[]) -> dict`:
required report fields from brief; finite retry_count from job.spec; max 2 retries,
third occurrence alternate strategy, persistent failure BLOCKED. Include next_spec
or None; target repair/route change, never identical blind retry. No sleeping.

## SOL ownership
learning_policy.py, metric_engine.py, review_gate.py, candidate_generator.py,
docs/ARCHITECTURE.md, docs/MATH_HYPOTHESES.md, tests/unit/test_learning.py.

`learning_policy.Policy(mode='ucb', state=None, seed=42)` modes fixed,greedy,ucb,random.
`.choose(category, routes) -> str`, `.observe(category, route, quality, utility,
valid=True, split='development')` only valid development feedback allowed.
`.snapshot() -> dict` persists mode, counters, seed/RNG state; deterministic restart.
Beta reliability alpha=beta=1, means and UCB formula from brief; infeasible filtered.
`metric_engine.utility(quality, unsupported, latency_s, tokens, robustness=0,
weights=None) -> float` frozen default weights and documented references.
`metric_engine.paired_summary(candidate: list[float], baseline: list[float],
seed=42) -> dict`: n,delta,variance,ci_low,ci_high,effect_size; reject bad arrays,
seeded bootstrap, minimum sample policy handled review gate.
`review_gate.evaluate(evidence: dict) -> dict`: decision PROMOTE|REJECT|QUARANTINE,
reasons list. Fail-closed: requires valid provenance, critical passed, separate
reviewer, holdout locked/unused, no regression, within budget, fresh-process
reproduction, ablation, paired CI lower >0, n>=24; booleans missing fail. Required
keys document in module. No gate updates policy itself. Hard gates override utility.
`candidate_generator.propose(failure: dict|None, policy: dict) -> dict` bounded
candidate hypotheses, distinguishing fixed/learning ablation, no model weight claims.

## ASTRA ownership
orchestrator.py, cli.py, __main__.py, config, reports, README, remaining integration
tests, experiments, budget enforcement, subprocess recovery/reproduction evidence.
Other workers may read but must not edit these files.

Initial mission ceilings: one local inference at a time, 120 model requests,
128 generated tokens/request, 15,360 generated tokens total, 120 seconds/request,
45 minutes wall clock, 256 MiB artifacts, max two retries per failure family.
No cloud calls in product loop, no external actions or arbitrary model tools.
Worker consumes durable queue, stops on budget/kill file/no work. Background
execution only when explicitly launched. No claim of continued activity after exit.

Routing discovery: Ruflo keyword tester/reviewer and generic Sonnet recommendation;
weak advisory. Actual choices follow Ian's explicit Sol/Luna/Terra assignment.
