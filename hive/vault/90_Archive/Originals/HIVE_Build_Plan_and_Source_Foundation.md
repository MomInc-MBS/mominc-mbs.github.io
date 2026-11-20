# HIVE Build Plan and Source Foundation

Research date: 18 November 2026  
Status: implementation specification and research foundation; the integrated system has not yet been built or benchmarked.


**Foundation collected:** 100 distinct code/model resources (96 code projects and 4 checkpoint candidates), plus 30 primary research papers.

## Contents

- Sections 1–4: hypothesis, existing resources, architecture, and selected stack.
- Sections 5–7: communication, memory, and targeted learning.
- Sections 8–10: task families, fair comparisons, metrics, and decision gates.
- Sections 11–14: biology experiments, build stages, work packages, and first backlog.
- Section 15 and Appendix A: the complete code and model catalog.
- Appendix B: primary research mapped to HIVE experiments.
- Appendix C: source status and implementation handoff requirements.

## 1. The hypothesis and the build decision

**Hypothesis:** Selectively communicating specialists, local adaptation, and multiple memory timescales can acquire and retain useful capability more efficiently than a comparable general model under the same resource constraints.

HIVE is a modular, persistent, self-improving cognitive system implemented first in software. Its defining research concerns are independently measurable specialization, selective communication, durable adaptation, and bounded resource use. Biological mechanisms supply testable design ideas. Existing code supplies runtimes, training primitives, memory indexes, simulators, and evaluators.

The first deliverable is a small experimental HIVE that learns successive model/tool communication tasks, retains earlier capabilities, and demonstrates transfer to unfamiliar combinations. It must contain actual learned specialists and an adaptation loop. A successful one-off answer, a collection of role prompts, or a growing transcript alone does not establish the hypothesis.

### The decisions this plan makes

1. Start with model/tool communication, matching the previously established first community. Use executable simulated tools and changing protocols so success can be checked.
2. Build independently parameterized specialists and a shared-backbone adapter configuration as separate experimental arms.
3. Give every specialist a LAYA-style decision interface. Initially serve a reusable classifier through that interface instead of duplicating an entire decision encoder for every role.
4. Use the same tools, evidence, memory allowance, feedback allowance, and hardware caps for competing systems.
5. Distinguish immediate experience storage, procedural skill acquisition, router updates, and parameter learning in both implementation and reporting.
6. Keep the initial runtime small: Python, one training stack, one memory backend, one inference backend, and explicit message contracts.
7. Run NCM, compact recurrent solvers, learned private codes, and biological connectivity as controlled research branches with their own budgets.
8. Expand toward the intended 50-plus roles and multiple domain communities only after the first community passes retention, composition, and resource gates.

The broad source catalog is a selection pool. Components marked as alternatives are substitutes to compare, not an instruction to install them all.

## 2. What carries forward and what changes

The earlier HIVE architecture supplies the nine conceptual layers, specialist communities, replaceable head, domain-native representations, and four channels: Control, Task, Evidence, and Teaching. These remain the conceptual foundation.

The earlier stack mapping is useful for discovering components. Its proposed latency, resource, and correctness claims become measurements in this plan. Schema validity does not establish semantic truth. A passing test suite establishes the behavior covered by those tests. Formal verification applies to a specific formal statement under explicit assumptions.

The earlier benchmark emphasized a small shared backbone against a 70B model on difficult mathematics and software engineering. That comparison can become a later capability reference. The primary experiment here uses a strong resource-matched generalist with the same supporting tools and learning opportunities. Shared-backbone adapters are an efficiency comparator; they do not stand in for the whole independent-specialist hypothesis.

The earlier 100-project report is a discovery source. Historical labels such as succeeded, failed, or abandoned are not treated as experimental evidence for HIVE. Current repository documentation and original papers govern the selections below.

### Existing local starting point

The 15 November 2026 software inventory reports the following. These are inventory observations, not fresh checks of the user's PC.

| Existing resource | Inventory readiness | Use in this plan |
|---|---|---|
| RTX 5070 Ti and 64 GB RAM | User-reported hardware | Local research target; measure actual available VRAM, RAM, storage, drivers, and competing workload |
| Ollama | Running when inventoried; model listing responded | Existing inference API for an initial integration smoke test and later deployment comparison |
| LM Studio | Installed; server offline when inventoried | Optional existing model inspection/server tool |
| Ruflo | Connected; routing tools responded | Inspect and reuse relevant coordination adapters |
| Laya | Prepared; cached model; service offline; deterministic fallback used | First routing/classification experiment after a local loading and calibration check |
| Python 3.11/3.12, Node.js, uv | Installed | Reuse isolated environments and the existing development toolchain |
| Docker Desktop | Installed; daemon not checked | Evaluate as a process/container option where needed |
| Soup | Prepared; GPU training not established | Inspect before introducing another training frontend |
| Existing Qwen and other model caches | Weight files or caches recorded, with differing readiness | Larger reference baselines only after load and resource checks |

Keep OBS, cameras, effects, and streaming workloads in the hardware accounting. Create two reproducible profiles: an isolated research session and a studio-sharing session. The plan does not assume the same training workload is feasible in both.

Source: Ian-AI-Generation-and-Game-Design-Software.pdf, inventory dated 15 November 2026; previously supplied hardware description.

## 3. Architecture of the first experimental HIVE

### 3.1 Components

| Component | Responsibility | Initial implementation |
|---|---|---|
| Intent interface | Holds the user's goal, constraints, interruption signal, and permitted actions | Small explicit task object; optional language interface outside the core experiment |
| Decision gate | Classifies inputs, chooses a skill, checks prerequisites, and requests help | LAYA plus deterministic prerequisite checks; compare against a small trained classifier |
| Specialist registry | Records competence, compatible representations, resource estimates, and versions | Local manifest and capability records |
| Specialist workers | Execute independently learned narrow functions | Two small separately adapted language models plus small classifiers and deterministic workers |
| Translator workers | Convert between domain representations while retaining meaning and uncertainty | Typed representations first; learned translators as a later controlled branch |
| Scheduler | Activates relevant workers, enforces resource budgets, and handles cancellation | Python asynchronous workers and bounded queues |
| Memory manager | Stores, retrieves, revises, consolidates, and expires records | SQLite with explicit provenance; one optional vector index |
| Verifiers | Check execution results, constraints, and task success | Simulated tool state, pytest/Hypothesis, and a solver where appropriate |
| Teaching controller | Builds verified correction batches and targets the responsible component | Explicit error taxonomy, bounded replay, and targeted training jobs |
| Promotion controller | Evaluates candidate updates and publishes compatible versions | Immutable artifacts, retained incumbent, measured regression gates |
| Resource recorder | Accounts for learning, execution, communication, memory, and latency | Local run records plus MLflow/OS/GPU measurements as needed |

### 3.2 Core feedback structure

~~~mermaid
flowchart TD
    I["User goal and constraints"] --> G["Decision gate and scheduler"]
    G --> S["Relevant specialist community"]
    S <--> T["Domain translators"]
    S <--> M["Working and persistent memory"]
    S --> V["Execution and verification"]
    V --> O["Result with evidence"]
    V --> L["Targeted learning controller"]
    L --> C["Candidate evaluation"]
    C -->|promote version| S
    C -->|retain incumbent| S
    V -->|verified experience| M
~~~

Workers exchange only the information needed for their current subproblem. Parallelism is used when separate candidates or independent checks can help. The scheduler measures whether that parallelism saves elapsed time after queueing, memory, and communication costs are included.

### 3.3 The first specialist community

The first domain is communication with models and tools. Begin with five functional roles, which need not correspond to five language-model copies:

1. **Requirement parser:** converts a request and supplied evidence into a precise task representation.
2. **Protocol translator:** maps that representation into a particular tool or model interface.
3. **Execution/repair specialist:** identifies failures and proposes a valid repair from available feedback.
4. **Decision specialist:** selects among supported workers, checks prerequisites, and escalates unfamiliar inputs.
5. **Verification/teaching controller:** checks outcomes and assigns corrections to the responsible component.

The parser and translator/repair workers receive independently versioned learned parameters in the independent-specialist arm. Routing can use a much smaller encoder or classifier. Verification should use executable task truth wherever possible. A teacher that selects exercises does not need a full copy of every subject expert.

For meaningful composition, include tasks that require more than one worker's competence: interpreting a novel instruction, translating it into a changed schema, executing multiple dependent calls, and repairing a failure without damaging unrelated behavior.

### 3.4 Independent and shared components

**Independent-specialist arm:** separate model parameter sets with actual independent backbone adaptation, or independently trained compact networks. Train one worker while keeping the others fixed; explicitly record any shared embeddings, encoders, or routers. Every arm records its base initialization, unique and shared parameter identities, trainable mask, and update owner. Two copied frozen backbones with separate LoRAs form a duplicated-backbone control, not evidence for independent representational learning.

**Shared-backbone arm:** one frozen base plus separately trained compatible adapters. Count the shared base once in stored capacity and once per actual resident copy. This arm tests whether adapter reuse provides a better efficiency tradeoff than full independence.

**Hybrid arm, later:** shared low-level components plus independently adaptable higher-level specialists. Any shared trainable component expands the regression scope to every dependent skill.

Pretrained comparisons measure the resulting systems; different checkpoint sizes and pretraining histories can confound architectural attribution. Add a small from-scratch experiment with matched total parameter budgets, task-training exposure, optimization allowances, and initialization procedures. Treat upstream pretraining as an inherited resource unless its actual cost is available; report post-pretraining adaptation claims separately from lifetime-training claims.

A renamed prompt is not recorded as a newly trained expert. Adapters cannot be moved between incompatible backbones without a validated conversion or retraining procedure. Hidden vectors from different models do not acquire common semantics merely because their dimensions match.

## 4. Initial technology selection

The following is the proposed starting stack. Repository capabilities are sourced in the catalog; the selection and integration choices are engineering proposals.

| Function | Initial choice | Why it is in the first build | Controlled alternative |
|---|---|---|---|
| Implementation | Python with isolated uv environment | Small integration surface and shared ML tooling | Existing Ruflo integration through a thin adapter |
| Trainable models | PyTorch + Transformers + PEFT | One explicit training path and inspectable parameter ownership | One of torchtune, LLaMA-Factory, Axolotl, or inspected Soup |
| First model scale | Qwen3-0.6B independent workers and Qwen3-1.7B generalist reference | Concrete text-only starting sizes; exact budget matching follows measured complete footprint | Qwen3.5-0.8B/2B compatibility and quality pilot |
| Decision interface | LAYA with held-out calibration and deterministic prerequisite checks | Preserves the intended yes/no, score, and choice layer | Small task-trained classifier; oracle routing only as a diagnostic |
| First inference experiment | Transformers for all neural comparison arms | Avoids confusing runtime differences with architecture differences | Existing Ollama/llama.cpp after model/export parity checks |
| Persistent state | SQLite records and artifact references | Transparent writes, revisions, namespace isolation, and restart behavior | One vector index; graph memory only when a graph task justifies it |
| Retrieval | Lexical/metadata baseline, then one embedding model and FAISS or Qdrant | Measures whether learned retrieval adds value | HippoRAG/Graphiti as separate memory experiments |
| Contracts | Pydantic and versioned domain payloads | Makes dependencies and error attribution explicit | Protobuf when transport volume warrants it |
| Work scheduling | Local asynchronous workers, bounded queues, cancellation | Fits one workstation and exposes actual overhead | NATS or Ray only after the local scaling bottleneck is measured |
| Checks | Simulated tools + pytest + Hypothesis | Reproducible feedback and generated edge cases | SymPy/Z3 for tasks with formal structure |
| Experiment records | JSONL/SQLite run records; MLflow when useful | Small initial footprint and reproducible resource accounting | OpenTelemetry for multi-process tracing |
| Continual learning | Bounded replay plus local supervised updates | Establishes a simple, inspectable learning baseline | EWC, continual-backprop mechanisms, or compact recurrent models in controlled tasks |

Model sizes here are candidate configurations, not a claim that two particular models exactly match a third's total budget. The final comparison must include the gate, memory, runtime copies, embeddings, translators, optimizer state, and all worker activity.

### Where LAYA, Ruflo, and NCM belong

**LAYA:** use its typed decision model as a trainable routing/classification component. Its own current documentation describes limitations in base zero-shot decision performance and confidence calibration. Fit and evaluate it on HIVE's task distribution. A yes/no output format does not make a prediction logically certain. Each specialist receives a decision interface; the implementation may share an encoder to avoid unnecessary duplication. [Official repository](https://github.com/NandhaKishorM/laya)

**Ruflo:** inspect the already available coordination integration and reuse useful scheduling, messaging, or memory interfaces. Keep it behind HIVE's contracts so an experiment can run with a minimal scheduler. Its presence alone does not establish independent specialist learning. Attribute any learning claim to the particular mechanism actually exercised. [Official repository](https://github.com/ruvnet/ruflo)

**NCM:** this name is resolved here to Hazy Research's Next-Concept Modeling. It provides a coarse-to-fine text-generation architecture with a learned multiscale tokenizer and generator. The released repository documents checkpoints and evaluation for particular tasks. Make reproduction of a released task the first milestone; inspect whether the full required training path is available before planning a new trained specialist. Its published speed comparisons do not predict HIVE's workstation performance. [Code](https://github.com/HazyResearch/ncm) · [Paper](https://arxiv.org/abs/2610.14162)

## 5. Communication contracts

Keep the common envelope small. It expresses transport, identity, versions, and accountability. It does not force every domain to use the same internal semantics.

| Envelope field | Purpose |
|---|---|
| message_id, task_id, parent_id | Reconstruct causal history and deduplicate retries |
| channel | Control, Task, Evidence, or Teaching |
| producer_id and version | Identify the exact worker producing the message |
| recipient/capability | Address a specific worker or request a capability |
| representation_id and version | Identify the payload language and compatible translators |
| evidence_refs | Attach the basis for claims |
| assumptions and validity scope | State conditions under which the payload applies |
| uncertainty_kind and value | Distinguish calibrated probability, unknown uncertainty, and solver status |
| resource_budget and deadline | Bound additional computation and waiting |
| payload or artifact_ref | Carry small data directly and refer to large immutable artifacts |

### Channel behavior

- **Control:** activate, pause, cancel, recruit, backpressure, and version negotiation.
- **Task:** problem descriptions, structured state, partial solutions, and constraints.
- **Evidence:** observations, execution results, counterexamples, provenance, and verification scope.
- **Teaching:** localized error records, training examples, replay requests, candidate updates, and promotion results.

### Translation evaluation

Start with explicit task schemas, ASTs, tool-call structures, and domain-specific arrays. Compare them against a natural-language channel with equivalent information. Then test learned compact codes between compatible workers.

Score translation by downstream semantics: executing the translated instruction must preserve the intended effect, units, constraints, and uncertainty. Round-trip reconstruction alone can conceal a shared error. Include missing fields, negation, unknown units, outdated schemas, and mutually inconsistent messages.

Private communication codes are versioned artifacts. A new encoder requires a compatible decoder or translator. Promote the pair together and measure the adaptation burden imposed on other workers.

## 6. Memory and forgetting

### 6.1 Memory types and ownership

| Memory | Contents | Update behavior |
|---|---|---|
| Working state | Current task, local hypotheses, active tool results | Bounded; released or summarized when task ends |
| Episodic records | Observations, decisions, failures, feedback, outcomes | Append with provenance; later compression or retirement |
| Semantic records | Accepted facts and rules with scope and temporal validity | Revision and contradiction handling |
| Procedural artifacts | Tested code, compatible adapters, policies, reusable procedures | Immutable versions with capability tests |
| Replay buffer | Selected training experiences and counterexamples | Fixed budget with explicit replacement policy |
| Collective knowledge | Findings useful across communities | Promote only with evidence and stated scope |

Every record should identify its source, owner, scope, creation time, validity interval if relevant, verification status, dependent artifacts, and replacement/deletion lineage. A generated suggestion enters as a proposal, not as an observed fact.

### 6.2 The first forgetting policies

Implement a transparent baseline before learning a sophisticated retention policy:

1. Enforce a byte budget per memory category and per specialist.
2. Prefer current authoritative records when older facts have been superseded.
3. Retain representative examples, surprising verified failures, and rare high-consequence exceptions.
4. Compare recency, reservoir sampling, stratified replay, and usefulness estimates under the same budget.
5. Record what was removed or compressed in bounded bookkeeping, without retaining the full discarded payload indirectly.
6. Test the effect of removal on future decisions and on retraining.

Moving an item out of retrieval does not erase its influence from trained parameters. If a corrected or withdrawn fact has already been consolidated into an adapter, invalidate the dependent artifact and evaluate repair or retraining. Do not claim exact machine unlearning from deletion of a database row.

### 6.3 Four different adaptation events

| Event | Immediate effect | Evidence needed |
|---|---|---|
| Memory write | Changes available evidence | Correct retrieval and use in a later episode |
| Procedure creation | Adds executable behavior | Success on hidden input variants |
| Router update | Changes expert selection | Improved allocation on held-out requests without collapse |
| Weight/adapter update | Changes a model's function | Generalization, retention, calibration, and resource tests |

Test these effects separately. A memory-only system can learn useful behavior at the system level, but a claim about improved specialist parameters requires a weight-learning experiment. After a parameter update, evaluate novel related cases with the original correction episode and equivalent answer-bearing records excluded from retrieval. Apply the same admissible-information restriction to every arm, including the memory-only control.

## 7. The targeted teaching loop

1. **Observe:** capture the request, versions, intermediate representations, execution, and outcome.
2. **Locate the error:** distinguish missing evidence, wrong retrieval, wrong routing, mistranslation, faulty domain reasoning, invalid execution, and incorrect verification.
3. **Check the diagnosis:** replay the failure with a controlled replacement or additional observation. Avoid assigning every failure to the final responder.
4. **Build feedback:** create the smallest verified correction with its applicable conditions and a counterexample to the old behavior.
5. **Respond immediately:** update the relevant memory or temporary procedure where justified.
6. **Accumulate bounded training data:** combine the new experience with replay from earlier capabilities.
7. **Train locally:** update only the responsible worker or explicit set of dependent components.
8. **Evaluate:** use development data, retained-skill probes, calibration checks, resource measurements, and adversarial interface cases.
9. **Promote atomically:** publish a versioned model/procedure and all compatible translators together.
10. **Monitor:** detect regression or drift; restore the retained incumbent when promotion conditions fail.

For every paired episode, the externally supplied feedback payload is identical across arms. The simulator's hidden answer keys, latent rules, future events, and final-test outcomes are inaccessible to the runtime. Additional error diagnosis performed by HIVE counts toward its compute budget. Oracle error localization, like oracle routing, is a labeled diagnostic only.

The sealed final test set never supplies training feedback. Use separate training feedback, development/calibration, and final evaluation partitions. Synthetic teacher outputs require checking against task truth; teacher agreement is not a substitute for it.

Retain a bounded number of rollback versions and account for them in storage. Large teachers may help generate training data, but their usage must be recorded separately and either shared across competing methods or excluded from the equal-budget claim.

## 8. Experimental tasks

### Task family A: Learning model and tool protocols

This is the first full build target.

Create a deterministic simulated service with several small APIs: document retrieval, record updates, structured calculations, and dependency-constrained actions. Provide interface documentation and examples in training. Introduce controlled changes over a sequence of tasks:

- Renamed fields and changed enum values.
- New argument constraints and unit conventions.
- Missing information that requires a clarification or retrieval step.
- New combinations of known tools.
- Recoverable failures and changed error messages.
- Irrelevant tools and near-duplicate capabilities.

Success means reaching the correct final service state with the correct arguments and respecting task constraints. Schema-valid JSON alone does not receive full credit. Include held-out combinations and later returns to earlier protocols.

Use BFCL as a source of task/evaluation ideas or an external check, while keeping the custom evolving protocol environment independently generated and exactly scored.

### Task family B: Selective memory under changing facts

Generate bounded synthetic histories with explicit truth and timestamps. Include updates, contradictions, rare important events, repeated irrelevant material, and unanswerable queries. Evaluate whether the system uses the current relevant evidence and declines unsupported claims.

Compare the same memory and retrieval budget across systems. Use LongMemEval or LoCoMo as external checks of memory behavior, with exact dataset and scoring versions pinned. These benchmarks do not by themselves establish weight learning.

### Task family C: Closed-loop planning and local correction

Use MiniGrid/BabyAI or another small controllable environment. Start with structured state to avoid conflating perception with learning. Introduce changed action effects, temporary obstacles, delayed consequences, and tasks requiring novel combinations of known skills.

Evaluate a short set of candidate actions or plans, execute one, observe the result, and adapt the responsible policy or model. Later add a perception branch if the learning result survives the structured-state setting.

This tests the user's earlier idea of predicting alternatives and learning locally from a failed action. A text-only protocol success is insufficient evidence for general sensorimotor intelligence.

### Task family D: Program repair and exact reasoning

After the first three families work, add short program-repair tasks with hidden tests, generated edge cases, and formal constraints. EvalPlus, SymPy, Z3, Lean, and associated datasets can support increasingly difficult tests.

Begin with tasks small enough to permit many controlled trials. Larger SWE-bench or Olympiad comparisons belong after the learning and accounting machinery is stable.

## 9. Baselines and ablations

### 9.1 Required comparison systems

| Arm | Configuration | Question it answers |
|---|---|---|
| Rules | Deterministic routing and executable tools where sufficient | Is the test too simple to require the proposed learned architecture? |
| Generalist frozen | One model plus the same tools, evidence, and bounded memory | What does the architecture add without weight adaptation? |
| Generalist learning | One model with the same feedback and comparable adaptation resources | Does specialization improve learning efficiency? |
| Role-prompt system | Several roles using an equivalent aggregate budget | What do role decomposition and orchestration alone contribute? |
| Shared-base specialists | One frozen base plus trained adapters | How much does shared representation reduce size and learning cost? |
| Independent HIVE | Independently parameterized specialists with controlled local learning | Does independent specialization improve retention and adaptation? |
| HIVE hybrid | Selective shared components and independent high-level workers | Where does sharing help, and where does it introduce interference? |

Every system receives the same task interface, admissible evidence, deterministic tools, feedback opportunity, and evaluation environment. Baselines may use memory, retrieval, and verification. Do not handicap a generalist by withholding supporting infrastructure.

### 9.2 Minimum mechanism ablations

Change one major mechanism at a time, then test important interactions:

- Selective communication versus broadcast or full-history sharing.
- Structured domain payloads versus equivalent natural-language messages.
- Local parameter updates versus global updates.
- Memory-only adaptation versus parameter-only adaptation versus both.
- Replay/consolidation versus no replay with equal update budgets.
- Learned routing versus simple rules; oracle routing as an upper-bound diagnostic.
- Independent workers versus shared adapters.
- Learned private codes versus explicit domain representations.
- Verifier-guided candidate search versus a single-trajectory baseline allowed to use its budget for reasoning and checking. Compare success-versus-compute and success-versus-latency curves under common caps; record actual consumption. Equal token counts across different models do not imply equal computation.

For the three central mechanisms, use a small factorial experiment where feasible: communication selectivity, local learning, and multiple memory timescales. This helps identify whether combined gains come from one strong component or from their interaction.

### 9.3 Budget accounting

Record at least:

- **Deployment storage:** all weights, adapters, tokenizers, embedding models, indexes, memory records, procedures, and retained rollback versions.
- **Peak active memory:** total process RAM and total GPU memory, including caches and concurrent workers.
- **Training peak:** optimizer state, gradients, activations, replay batches, and resident teacher resources.
- **Experience cost:** unique examples/episodes, repeated presentations, feedback events, and teacher-generated examples.
- **Compute cost:** training steps, tokens, calls, wall time, and supported hardware measurements; include failed candidates, retries, routing, translation, retrieval, and verification.
- **Latency:** cold start, warm p50/p95, model loading, queueing, cancellation, and end-to-end task completion.
- **Energy:** GPU energy where measurable; distinguish it from full-machine energy. Use a wall meter for a full-system claim.
- **Lifetime cost:** cost to learn plus cost to use the learned capability over a stated horizon.

Parameter count alone is insufficient. Active parameters in a sparse model do not equal total stored parameters. A small worker with a large external teacher or growing memory store is not automatically a small complete system.

When several resource dimensions cannot be matched exactly, apply hard caps and report a Pareto comparison. Make the tradeoffs visible rather than collapsing them into one arbitrary intelligence score.

### 9.4 Trial design

Suggested pilot configuration, adjustable before the confirmatory run:

- Ten sequential task blocks with three counterbalanced orderings.
- Five random seeds for confirmatory learning comparisons; a smaller pilot is acceptable for debugging.
- Fixed maximum budgets for examples, repeated presentations, update steps, memory bytes, and per-task inference; record learning curves within those ceilings.
- Comparable development/hyperparameter-search budgets for HIVE and baselines; record tuning cost separately from deployment adaptation.
- Tests immediately after learning, after several intervening tasks, and after process restart.
- Disjoint generators or templates for training and final generalization.
- Separate development and final seeds; freeze hyperparameters before the final run.
- Confidence intervals over independent seeds or task sequences, not thousands of correlated tokens.

Report failures and timeouts as outcomes. Do not drop tasks that the router could not handle.

## 10. Measures and proposed decision gates

These are proposed engineering acceptance criteria, not predictions or claims of established feasibility. Lock exact thresholds after the pilot and before the confirmatory experiment.

| Dimension | Measure | Proposed gate |
|---|---|---|
| New learning | Examples/feedback events to a fixed held-out success level | At least 25% fewer than the strongest matched learning baseline |
| Learning computation | Total adaptation time/compute to that same level | No hidden compensating increase; report any tradeoff separately |
| Retention | Earlier-task performance relative to each system's own acquired competence and the baseline | Proposed average forgetting cap of 5 percentage points, per-task cap of 10 points, and no more than 2 points below the matched baseline |
| Reliable answers | False claims/actions at matched answer coverage | No worse than the matched baseline, with uncertainty intervals |
| Composition | Held-out combinations against the learning generalist and the same experts using fixed/rule-based composition | Positive improvement under common resource caps; isolated-worker scores are additional diagnostics |
| Size | Complete deployment storage and peak active memory | Within the declared cap; superiority claims require a measured frontier improvement |
| Translation | Semantic preservation and correct downstream effects | Meet the task threshold; syntax validity alone cannot pass |
| Persistence | Bounded-state operation, restart recovery, correction durability | No unbounded memory growth; earlier verified corrections survive restart |
| Reproducibility | Exact configs, versions, data splits, seeds, and records | Independent rerun reproduces the qualitative result |

### Metric definitions

Let R(t,j) be held-out performance on task j after training block t. Keep the full task-by-time matrix. Define forgetting for an earlier task as its highest earlier measured score minus its current score, and report the mean and worst task. Evaluate old protocols under their explicit version so legitimate replacement of a current fact is not miscounted as skill loss.

For each task family, predefine a competence threshold tau. N_tau is the number of feedback events needed to attain that threshold on a prescheduled development probe, sustained across two probes, while satisfying the retention condition. Also report distinct examples, total repeated presentations, elapsed adaptation time, and compute to that point. A run that never reaches the criterion within its budget is nonattaining/censored; do not omit it or invent a finite speedup ratio. Keep final-test measurements separate.

Report answer coverage, incorrect assertions, unnecessary abstentions, current-fact accuracy, routing errors, and translation errors separately. An always-abstaining system cannot win the reliability comparison.

A second success route is equal learning/quality with substantially smaller total resource use. Keep the size and learning claims separate until both are demonstrated.

Reject or narrow the hypothesis if improvements disappear when the generalist gets the same tools and memory, if the advantage depends on an uncounted teacher, if old skills degrade, or if a simpler classifier/procedure achieves the same result.

## 11. Biological mechanisms as controlled experiments

| Biological idea | Software experiment | Matched comparison and readout |
|---|---|---|
| Fast and slow learning systems | Immediate episodic capture plus slower integration/replay | Memory-only, parameter-only, and combined systems; retention and generalization |
| Selective signaling | Send targeted messages only when relevant state changes | Broadcast with the same information; bytes, latency, task success |
| Local plasticity | Update the circuit implicated by a verified error | Global update with comparable compute; retention and new learning |
| Neuromodulatory gating | Use surprise, uncertainty, and outcomes to decide what to store or learn | Random/recency gates; information retained per byte and learning per example |
| Resource homeostasis | Bound worker activation, memory occupancy, and training queues | Ungated scheduling under the same global cap; overload and recovery behavior |
| Consolidation/replay | Interleave representative older experiences during adaptation | Equal-compute no-replay and random-replay controls |
| Sparse biological connectivity | Test a biologically informed connectivity pattern in a small task model | Random sparse and learned sparse graphs with equal nodes/edges/compute |
| Multiple prediction timescales | Compare short-horizon reflexes and longer-horizon planning | Single-timescale controller with equivalent capacity |

Connectome tools describe structure and help formulate experiments. A wiring map alone does not specify a complete learning rule, neuronal dynamics, sensory grounding, or a general intelligence. FlyVis and related task-trained models offer a more concrete experimental bridge than importing an entire connectome into an otherwise unspecified network.

## 12. Build stages and exit conditions

Progress is controlled by evidence, not a promised calendar. A short pilot determines realistic iteration time on the actual workstation.

### Stage 0: Reproducible local foundation

- Inspect the current software inventory against the machine: available GPU memory, driver/PyTorch support, Python environments, Ollama/Ruflo endpoints, Laya startup, existing model files, and OBS load.
- Create an isolated research environment and record its exact versions.
- Establish a source manifest with repository URL, revision, license scope, model revision, artifact hash, installation notes, and local smoke-test status.
- Define storage and active-memory caps for research and studio-sharing profiles.
- Create the task generator, separate data splits, resource recorder, and baseline evaluator.

**Exit:** one generalist and one minimal learned worker solve the same small executable task set with complete measurements. The local experiment can be recreated from the recorded environment.

### Stage 1: Nonlearning HIVE with accountable components

- Implement contracts, worker registry, bounded queues, cancellation, and error propagation.
- Connect two independent workers, the gate, one translator, and deterministic verifiers.
- Implement SQLite records, provenance, revisions, and restart recovery.
- Run the frozen generalist and frozen HIVE with identical tools and evidence.

**Exit:** every output has attributable evidence; the system handles timeouts, contradictory evidence, missing fields, and restart without silently accepting unsupported results. Coordination overhead is measured.

### Stage 2: Real local learning

- Add the teaching record, error localization, bounded replay, and candidate training.
- Train the responsible worker on verified failures.
- Add held-out generalization, retained-skill probes, and atomic promotion.
- Run both the independent-worker and shared-adapter arms.

**Exit:** a verified correction changes later behavior on unseen related tasks, persists after restart, and leaves unrelated skills within the accepted regression limit.

### Stage 3: Selective memory and forgetting

- Implement memory byte caps, supersession, rare-exception retention, and alternative replay policies.
- Add memory-only, weight-only, and combined adaptation controls.
- Evaluate changed facts, long distractor histories, and delayed reuse.
- Track dependencies from memory facts to consolidated artifacts.

**Exit:** the system remains within its memory cap, retrieves current relevant evidence, avoids reviving superseded facts, and distinguishes retrieval improvement from learned generalization.

### Stage 4: Confirmatory hypothesis test

- Freeze task generators, final test splits, thresholds, and hyperparameters.
- Run the required baselines and mechanism ablations.
- Use multiple seeds and sequence orders.
- Report resource/quality frontiers and all unsuccessful tasks.

**Exit:** a reproducible result supports a specifically scoped claim, or the hypothesis is narrowed with a clear failure diagnosis. No expansion is justified solely by a convincing demo.

### Stage 5: Compact-circuit and representation experiments

Run bounded parallel branches:

- NCM reproduction on a released task, followed by one narrow translator or solver experiment if the necessary training path is available.
- TRM/HRM-style recurrent solvers on structured tasks with total training effort counted.
- Learned private communication with compatible encoder/decoder promotion.
- Continual-backprop or other plasticity methods in an appropriate small controlled model.
- Biological connectivity motifs against matched random and learned sparse controls.

**Exit:** each branch earns integration through a measured benefit. Archive unsuccessful variants with their results so they do not re-enter as unsupported assumptions.

### Stage 6: Additional communities and assistant integration

- Add one new community at a time: code repair, formal reasoning, perception, or small-world planning.
- Require competence tests, representation contracts, update ownership, resource estimates, and failure behavior for each new worker.
- Add persistent user-facing intention and presentation layers.
- Expand toward the desired role library through measured need, shared services, and loadable compatible skills.
- Introduce larger scheduling systems only when one-workstation constraints or multi-machine use justify them.

**Exit:** adding a community improves useful capability without breaking earlier communities or exceeding the declared resource policy.

## 13. Implementation work packages

| Work package | Concrete outputs | Depends on |
|---|---|---|
| Environment and manifest | Reproducible environment, resource profiles, exact source/model lock records | Stage 0 audit |
| Benchmark generator | Executable protocol tasks, truth state, split generators, sequence definitions | Task specification |
| Generalist baselines | Frozen and learning baselines with identical tool/memory access | Environment and tasks |
| Contracts and registry | Four channels, versioned payloads, capability discovery | Task specification |
| Specialist workers | Independent trained workers and shared-adapter comparison | Baselines and contracts |
| Memory manager | Provenance, supersession, retrieval, bounded forgetting | Contracts |
| Teaching controller | Failure diagnosis, correction batches, replay, local updates | Workers and verifiers |
| Promotion and compatibility | Regression reports, rollback, translator compatibility | Teaching and retained-task suite |
| Resource accounting | Complete storage/RAM/VRAM/latency/training records | All runtime operations |
| Confirmatory evaluation | Frozen experimental matrix, intervals, frontier report | All earlier packages |
| Research branches | NCM, recurrent circuits, private codes, biological motifs | Stable small-task harness |

### Proposed repository boundaries

| Directory | Ownership |
|---|---|
| contracts/ | Envelopes, domain payload schemas, version compatibility |
| runtime/ | Registry, scheduler, cancellation, resource budgets |
| experts/ | Worker adapters and declared trainable parameter ownership |
| translators/ | Representation conversion and semantic tests |
| memory/ | Records, retrieval, revisions, forgetting, replay |
| learning/ | Feedback attribution, local training, consolidation, promotion |
| environments/ | Simulated tools and closed-loop task generators |
| baselines/ | Generalist, role-prompt, adapter, and deterministic controls |
| evaluation/ | Sequence runner, scoring, intervals, ablations |
| manifests/ | Exact source revisions, model hashes, licenses, environments |
| experiments/ | Immutable configurations and run references |
| docs/ | Decisions, results, operator notes, and failure analyses |

Do not let one orchestration framework own specialist identity, memory format, or training artifacts. Those should remain inspectable HIVE contracts.

## 14. First implementation backlog

1. Resolve local environment and free-resource measurements.
2. Reuse the available Laya/Ruflo/Ollama installations only where the audit confirms compatibility.
3. Pin one model family, one training runtime, and a common inference path.
4. Build a small deterministic tool service and disjoint task generators.
5. Implement the frozen and learning generalist baselines.
6. Define the four channel schemas and worker capability manifest.
7. Add two independent learned workers and a shared-adapter comparison.
8. Implement verifier-backed outcomes and an explicit error taxonomy.
9. Store episodes and current facts with provenance and revisions.
10. Add bounded replay and a local update to one worker.
11. Test unseen transfer, unrelated skill retention, and restart durability.
12. Freeze the first comparative experiment and report complete cost/quality results.

The first accepted milestone is a measured correction-to-generalization loop. This is the foundation on which the broader cognitive organism can be built.

## 15. Source catalog

The following appendices distinguish reusable code, pretrained model artifacts, experimental implementations, and research papers. Each entry links to a primary source. An available repository is not evidence that it is installed, compatible with the local workstation, or capable of satisfying the full HIVE hypothesis.

**Disposition legend:** Core candidate = selected or directly relevant to the first implementation; Alternative = compare against the selected component; Research reference = reproduce or borrow a mechanism in an isolated experiment; Later = useful after the initial learning result.

License labels describe only the scope checked in the linked source. Model weights, datasets, optional packages, and transitive dependencies may have separate terms. Pin and inspect the exact selected revisions before integration.


## Appendix A. Code and model catalog

| Category | Resources |
|---|---:|
| Named HIVE foundations and existing local tools | 5 |
| Learning libraries and model adaptation | 14 |
| Compact execution and neural architectures | 7 |
| Continual learning and recurrent specialists | 8 |
| Memory and retrieval | 15 |
| Communication and coordination | 8 |
| Verification and representations | 9 |
| Evaluation frameworks and datasets | 8 |
| Closed-loop environments and world models | 9 |
| Biological modeling and connectome tools | 9 |
| Measurement and reproducibility | 4 |
| Pretrained model checkpoint candidates | 4 |

### Named HIVE foundations and existing local tools

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C001 [LAYA](https://github.com/NandhaKishorM/laya) | Non-autoregressive typed choice, score, and yes/no decision models. | Train and calibrate a reusable decision gate for each specialist interface. **Boundary:** Task-specific accuracy and calibration require held-out tests; a typed decision is not a formal proof. Reuse encoders where appropriate instead of duplicating them by role. | Core candidate; Apache-2.0 repository label; check the chosen checkpoint. |
| C002 [Ruflo](https://github.com/ruvnet/ruflo) | Agent coordination harness with tool, memory, and scheduling integrations. | Inspect the existing local integration and adapt useful infrastructure behind HIVE contracts. **Boundary:** Attribute learning to the actual mechanism used. The harness and role definitions do not by themselves create independently trained experts. | Alternative; MIT |
| C003 [Next-Concept Modeling (NCM)](https://github.com/HazyResearch/ncm) | Multiscale discrete tokenizer and coarse-to-fine generator with released task checkpoints and evaluation code. | Reproduce a released task and test a narrow compact translator or solver branch. **Boundary:** Inspect the availability of the full required training path before custom training. Published diffusion-baseline results do not establish workstation speed or HIVE-wide learning. | Research reference; MIT repository code; check checkpoint/data terms. |
| C004 [Ollama](https://github.com/ollama/ollama) | Local model loading and inference service. | Reuse the inventoried local API for integration checks; compare deployment after training/export parity. **Boundary:** A running model server is not a weight-training loop; measure all resident models and model-switching costs. | Alternative; Not independently rechecked for this catalog; inspect selected revision. |
| C005 [Soup](https://github.com/MakazhanAlpamys/Soup) | Configuration-driven language-model fine-tuning with memory-oriented training methods. | Inspect the already prepared local environments before selecting another training frontend. **Boundary:** Inventory establishes preparation, not a working GPU run. Reproduce claimed memory/throughput behavior with the selected model and driver. | Alternative; Not independently verified; inspect selected revision. |

### Learning libraries and model adaptation

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C006 [PyTorch](https://github.com/pytorch/pytorch) | Tensor computation, automatic differentiation, neural modules, and CPU/GPU execution. | Implement tiny independent specialists, routers, local update rules, and matched dense baselines in one measurable training substrate. **Boundary:** Choose and pin a build compatible with the actual GPU and driver; no local hardware compatibility or throughput was tested here. | Core candidate; BSD-style license; inspect bundled third-party notices. |
| C007 [Transformers](https://github.com/huggingface/transformers) | Model definitions, pretrained-model loading, tokenization integration, training, and inference interfaces. | Common interface for the initial compact language specialist and comparable general-model baselines. **Boundary:** A shared library interface does not make different model representations or adapters interchangeable; model weights have their own licenses. | Core candidate; Apache-2.0 (repository code). |
| C008 [PEFT](https://github.com/huggingface/peft) | Parameter-efficient fine-tuning methods including LoRA, integrated with Transformers. | Train isolated specialist adapter deltas while holding a shared backbone fixed; compare against independently parameterized specialists. **Boundary:** Adapters sharing one frozen backbone are a distinct architecture from fully independent models. Compatibility requires the correct base architecture, shapes, target modules, and checkpoint. | Core candidate; Apache-2.0. |
| C009 [TRL](https://github.com/huggingface/trl) | Post-training trainers including supervised fine-tuning, preference optimization, and reward-based methods. | Add outcome-supervised or preference-supervised updates after reliable task rewards and retention evaluations exist. **Boundary:** Generated rewards and synthetic preferences require independent validation. This training toolkit does not itself solve continual learning or feedback quality. | Alternative; Apache-2.0. |
| C010 [torchtune](https://github.com/meta-pytorch/torchtune) | PyTorch-native post-training recipes and reusable training components. | Alternative transparent recipe layer for controlled fine-tuning experiments. **Boundary:** Select one main training recipe stack rather than combining several competing stacks. Validate model support and package versions before adoption. | Alternative; BSD-3-Clause. |
| C011 [Unsloth](https://github.com/unslothai/unsloth) | Optimized local model training and inference tooling; optional desktop/Studio interface. | Benchmark whether optimized adaptation reduces wall-clock training time and peak memory for the chosen specialist. **Boundary:** Measure against the same model, data, optimizer target, and quality. Core and UI components have different license scopes. | Alternative; Apache-2.0 for the core package; AGPL-3.0 for some optional components including Studio UI. |
| C012 [Axolotl](https://github.com/axolotl-ai-cloud/axolotl) | Configuration-driven fine-tuning and post-training pipelines covering multiple methods and model families. | Alternative repeatable experiment launcher for specialists and baseline training. **Boundary:** Its breadth adds dependencies; select only if it simplifies the actual chosen experiment. No claimed speedup or GPU support was validated here. | Alternative; Apache-2.0. |
| C013 [LlamaFactory](https://github.com/hiyouga/LlamaFactory) | CLI/UI fine-tuning framework supporting multiple model families and full, frozen, and adapter-based updates. | Alternative accessible specialist training front end and recipe source. **Boundary:** Use it as an alternative to the other fine-tuning harnesses, not an additional mandatory runtime layer. | Alternative; Apache-2.0. |
| C014 [bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes) | Low-bit linear operations and memory-saving optimizers for PyTorch, used by common QLoRA workflows. | Test quantized-base adapter training and reduced optimizer memory on the local machine. **Boundary:** Quantization effects on task quality, calibration, kernels, and actual end-to-end latency must be measured. Low-bit storage alone is not evidence of faster learning. | Alternative; MIT. |
| C015 [TorchAO](https://github.com/pytorch/ao) | PyTorch quantization primitives and training/inference workflows. | Reference and alternative for quantization experiments where a supported recipe benefits the selected specialist. **Boundary:** The current official README says new feature development is being minimized and consolidated into torch and consuming repositories. Avoid treating this as an unquestioned long-term core dependency. | Alternative; BSD-3-Clause-style license (three redistribution conditions inspected). |
| C016 [safetensors](https://github.com/safetensors/safetensors) | Serialization format and tools for storing and loading tensor weights. | Versioned specialist/adaptor checkpoints and reproducible rollback artifacts. **Boundary:** Tensor serialization does not include a complete semantic compatibility contract; record base checkpoint, architecture, tokenizer, schema, and evaluation metadata separately. | Core candidate; Apache-2.0. |
| C017 [Accelerate](https://github.com/huggingface/accelerate) | Device placement, mixed precision, and launch/distributed-training utilities for PyTorch workflows. | Use through the chosen training stack or for a minimal repeatable launcher. **Boundary:** It is execution infrastructure. It does not itself define a learning rule, memory policy, or independent expert boundary. | Alternative; Apache-2.0. |
| C018 [LoRA / loralib](https://github.com/microsoft/LoRA) | Original low-rank adaptation implementation and examples. | Reference for implementing low-rank updates in custom tiny specialist architectures that are not supported by higher-level tooling. **Boundary:** Prefer PEFT for supported standard models; the original reference package is not an additional mandatory stack component. | Research reference; MIT. |
| C019 [DSPy](https://github.com/stanfordnlp/dspy) | Composable LM programs with prompt and weight optimization methods. | Baseline and tooling for improving routing, retrieval, and translator prompts against measured objectives. **Boundary:** Distinguish prompt optimization, demonstration selection, and weight training; include optimizer/teacher search costs and held-out validation. | Alternative; MIT |

### Compact execution and neural architectures

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C020 [llama.cpp](https://github.com/ggml-org/llama.cpp) | C/C++ inference with GGUF models, multiple hardware backends, and an HTTP server; current server supports model routing/loading controls. | Candidate compact deployment backend after training experiments establish a useful model; measure warm/cold loading and CPU/GPU memory use. **Boundary:** It is primarily an inference backend. Training-to-GGUF and adapter export need compatibility checks; server documentation notes that different LoRA configurations cannot necessarily share the same inference batch. | Core candidate; MIT. |
| C021 [vLLM](https://github.com/vllm-project/vllm) | Inference/serving engine with KV-cache management, batching, structured output support, and multi-LoRA serving. | Alternative when concurrent adapter requests and GPU throughput become the bottleneck. **Boundary:** Throughput-oriented serving can have a larger resident footprint than a simple single-model process. Benchmark the actual model, adapter configuration, and shared-GPU workload. | Alternative; Apache-2.0. |
| C022 [SGLang](https://github.com/sgl-project/sglang) | Serving framework for language and multimodal models with inference optimizations. | Alternative serving backend for workloads with repeated prefixes or structured multi-step calls. **Boundary:** Adoption should follow workload measurements; adding a second serving engine before identifying a bottleneck complicates the initial experiment. | Alternative; Apache-2.0. |
| C023 [Mamba](https://github.com/state-spaces/mamba) | Selective state-space sequence-model components and reference models. | Compare a recurrent/state-space specialist against an attention-based specialist on streaming tasks with bounded recurrent state. **Boundary:** Compressed recurrent state does not preserve arbitrary history exactly and is not a full persistent-memory system. Kernel support and training behavior require validation. | Research reference; Apache-2.0. |
| C024 [RWKV-LM](https://github.com/BlinkDL/RWKV-LM) | Recurrent language-model implementations with fixed-size recurrent state during streaming inference. | Alternative streaming specialist and state-adaptation experiment under a bounded active-memory budget. **Boundary:** Repository claims of unbounded context describe continued processing, not exact unlimited recall. Verify the chosen version, checkpoint, trainer, and runtime together. | Research reference; Apache-2.0 (repository code). |
| C025 [BitNet](https://github.com/microsoft/BitNet) | Official inference framework for supported low-bit BitNet-family language models. | Investigate whether a compatible low-bit specialist reduces total deployment cost, including CPU options. **Boundary:** This is not a universal converter that makes any existing full-precision model a native low-bit model. Check model-card terms separately from repository code. | Research reference; MIT (framework code). |
| C026 [FlashAttention](https://github.com/Dao-AILab/flash-attention) | Memory-efficient exact attention implementations and optimized GPU kernels. | Optional kernel optimization after the initial model and training recipe work correctly. **Boundary:** Kernel-generation, GPU-generation, dtype, and build support differ. Execution speed improvements do not establish improved sample efficiency. | Alternative; BSD-3-Clause. |

### Continual learning and recurrent specialists

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C027 [mergekit](https://github.com/arcee-ai/mergekit) | Tools for merging compatible pretrained model weights. | Controlled experiment for compressing or combining learned specialist changes after retaining separate evaluated versions. **Boundary:** Merging can damage capabilities and does not generally transfer a skill between arbitrary independent architectures. Treat merging as an experiment with retention tests. | Research reference; LGPL-3.0 (current repository). |
| C028 [Avalanche](https://github.com/ContinualAI/avalanche) | PyTorch library for continual-learning streams, training strategies, benchmarks, and evaluation. | Initial controlled continual-learning baselines and retention measurements for small classifiers and specialists. **Boundary:** A continual-learning library does not automatically provide a drop-in lifelong-learning solution for language models; adapt streams, losses, and evaluation to the task. | Core candidate; MIT. |
| C029 [Mammoth](https://github.com/aimagelab/mammoth) | Continual-learning benchmark framework and official implementation lineage for Dark Experience Replay. | Independent reference for replay methods and fair comparison with straightforward rehearsal baselines. **Boundary:** Its benchmark configurations are not automatically representative of an open-ended HIVE deployment. Reuse methods with clearly defined task/data boundaries. | Alternative; MIT; repository also contains notices for included components. |
| C030 [Loss of Plasticity / Continual Backprop](https://github.com/shibhansh/loss-of-plasticity) | Author code reproducing loss-of-plasticity experiments and continual-backpropagation interventions. | Test whether selectively renewing underused units helps a tiny specialist keep learning through a long task stream. **Boundary:** Results are from specified supervised and reinforcement-learning experiments; resetting units is not a proven universal solution for pretrained language models. | Research reference; MIT. |
| C031 [FACIL](https://github.com/mmasana/FACIL) | Reference implementations and evaluation configurations for class-incremental learning. | Additional controlled comparison of task order, exemplars, and retention tradeoffs. **Boundary:** Primarily an image-classification research framework, so treat its code and methods as references rather than the assistant runtime. | Research reference; MIT. |
| C032 [Hierarchical Reasoning Model (HRM)](https://github.com/sapientinc/HRM) | Official recurrent reasoning implementation with coupled slow and fast modules for structured puzzle tasks. | Reference architecture for a small non-chat specialist that performs iterative latent computation with multiple timescales. **Boundary:** Task-specific puzzle results do not establish general language competence. Count augmentation, repeated training epochs, and recurrent computation rather than quoting source-example count alone. | Research reference; Apache-2.0. |
| C033 [Tiny Recursive Models (TRM)](https://github.com/SamsungSAILMontreal/TinyRecursiveModels) | Author implementation of recursive latent reasoning with a small network on structured reasoning benchmarks. | Compare a tiny recursive solver against a larger one-pass specialist under equal total training and inference budgets. **Boundary:** Official repository is archived/read-only as of the observed page (archived April 1, 2026). Treat as a reproducible research fork; reported puzzle performance is not general assistant capability. | Research reference; MIT. |
| C034 [Reverb](https://github.com/google-deepmind/reverb) | Replay data storage/transport with configurable sampling, removal, and rate limiting. | Reference/alternative for bounded replay buffers and selective teaching. **Boundary:** Official README warns it is not production hardened, supports Linux, and has TensorFlow-version compatibility constraints. A simple local buffer is enough initially. | Research reference; Apache-2.0 |

### Memory and retrieval

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C035 [Letta / MemGPT lineage](https://github.com/letta-ai/letta-code) | Stateful agent harness with persistent memory and editable skills/prompts. | Alternative implementation and comparison for hierarchical memory/control flow. **Boundary:** Current letta-ai/letta README redirects development to letta-code; retired V1 server is on archive branch. Memory rewriting is not evidence of neural skill learning. | Alternative; Apache-2.0 |
| C036 [Mem0](https://github.com/mem0ai/mem0) | Memory extraction, indexing, and retrieval infrastructure for agents. | Compare external-memory policies using the same local model and feedback stream. **Boundary:** Current headline managed-service benchmark scores include proprietary optimizations absent from the OSS SDK. Independently test add-only accumulation, agent-generated facts, correction, and forgetting. | Alternative; Apache-2.0 |
| C037 [Graphiti](https://github.com/getzep/graphiti) | Incremental temporal context graphs, provenance, and hybrid retrieval. | Strong candidate for facts with validity periods and explicit supersession. **Boundary:** Graph construction requires supplied backend/model components and application logic; extraction can be wrong. Zep service performance does not automatically transfer to local Graphiti. | Alternative; Apache-2.0 |
| C038 [Cognee](https://github.com/topoteretes/cognee) | Turns documents/conversations into searchable graph and vector context. | Alternative graph-based memory integration to compare against a transparent baseline. **Boundary:** Additional extraction, schema, and indexing machinery must earn its resource cost; treat generated relations as claims requiring provenance. | Alternative; Apache-2.0 |
| C039 [HippoRAG / HippoRAG 2](https://github.com/OSU-NLP-Group/HippoRAG) | Knowledge graphs plus Personalized PageRank and passage retrieval for associative memory. | Research comparison for multi-hop factual recall and non-parametric adaptation. **Boundary:** External knowledge acquisition is distinct from parameter learning. Count offline indexing/model cost and rebuild indexes when model identity changes. | Research reference; MIT |
| C040 [LightRAG](https://github.com/HKUDS/LightRAG) | Graph-enhanced retrieval-augmented generation with configurable model/storage components. | Alternative for graph retrieval and document-memory ingestion. **Boundary:** Do not install alongside every competing memory framework. Extraction and retrieval quality need identical-corpus comparisons. | Alternative; MIT |
| C041 [FAISS](https://github.com/facebookresearch/faiss) | Dense-vector similarity search and clustering, with CPU/GPU implementations. | Candidate baseline index for semantic episode retrieval; start with exact search at small scale. **Boundary:** Not a transactional memory database or evidence validator; preserve authoritative records separately and version the embedding space. | Core candidate; MIT |
| C042 [Qdrant](https://github.com/qdrant/qdrant) | Vector storage/search with payload filtering. | Alternative once richer filtering, service isolation, or scale warrants a database process. **Boundary:** Service overhead and memory must be counted; retrieval isolation does not isolate learned parameters. | Alternative; Apache-2.0 |
| C043 [LanceDB](https://github.com/lancedb/lancedb) | Embedded vector/multimodal retrieval built on the Lance data format. | Alternative for disk-backed retrieval and versioned datasets. **Boundary:** Evaluate its whole storage/index footprint against SQLite plus one index; select one initial retrieval backend. | Alternative; Apache-2.0 |
| C044 [sqlite-vec](https://github.com/asg017/sqlite-vec) | SQLite extension for vector storage/search, including float, int8, and binary vectors. | Low-infrastructure alternative to a separate vector index/service. **Boundary:** Official README marks it pre-v1 with possible breaking changes. Pin versions and measure recall/latency at the intended scale. | Alternative; MIT OR Apache-2.0 |
| C045 [Sentence Transformers](https://github.com/huggingface/sentence-transformers) | Embedding, reranking, and retrieval-model training/inference. | One small CPU-capable encoder for baseline retrieval; later train retrieval from task feedback. **Boundary:** Library license does not determine every model license. Pin encoder/version and do not mix incompatible embeddings. | Core candidate; Apache-2.0 |
| C046 [FlagEmbedding / BGE](https://github.com/FlagOpen/FlagEmbedding) | Retrieval embedding/reranking toolkit and model family. | Alternative encoder/reranker family for multilingual or specialized retrieval. **Boundary:** Check exact checkpoint license and size; a large reranker can erase the savings from a small answering specialist. | Alternative; MIT (code) |
| C047 [NetworkX](https://github.com/networkx/networkx) | Python graph representation and analysis algorithms. | Small transparent baseline for dependency, provenance, and memory-link graphs. **Boundary:** In-memory Python graphs add overhead and are not a persistent graph database; use only at measured scale. | Alternative; BSD-3-Clause |
| C048 [SQLite](https://sqlite.org/src) | Embedded transactional SQL storage in ordinary files. | Initial event/episode store, provenance, validity intervals, specialist namespace, and update registry. **Boundary:** Application must define retention, conflicting-claim semantics, concurrent-write policy, and evidence promotion; persistence alone is not learning. | Core candidate; Public domain |
| C049 [A-MEM](https://github.com/agiresearch/A-mem) | Agent-organized notes with attributes, links, and updates inspired by Zettelkasten. | Alternative for HIVE's interconnected memory organization and adaptive retrieval. **Boundary:** This repo is the memory library; paper-result reproduction uses WujiangXu/AgenticMemory. Generated links and revisions need evidence checks and bounded growth. | Research reference; MIT |

### Communication and coordination

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C050 [LangGraph](https://github.com/langchain-ai/langgraph) | Stateful workflow execution with checkpoints and durable execution abstractions. | Optional execution harness or orchestration baseline. **Boundary:** Workflow persistence provides infrastructure; it does not implement independent neural learning or validate HIVE's hypothesis. | Alternative; MIT |
| C051 [Ray](https://github.com/ray-project/ray) | Tasks, stateful actors, distributed training/serving libraries. | Later specialist worker isolation and multi-process/multi-machine scheduling. **Boundary:** Measure orchestration and serialization overhead first; multiple GPU actors do not create extra physical VRAM. | Alternative; Apache-2.0 |
| C052 [NATS / JetStream](https://github.com/nats-io/nats-server) | Publish/subscribe and request/reply messaging; JetStream adds durable streams. | Later transport for Control, Task, Evidence, and Teaching channels. **Boundary:** Core NATS is at-most-once; JetStream offers persistence and at-least-once delivery. Handle duplicates with idempotent task/update IDs. | Alternative; Apache-2.0 |
| C053 [ZeroMQ](https://github.com/zeromq/libzmq) | Asynchronous queues and messaging patterns over sockets. | Alternative local inter-process transport for specialist messages. **Boundary:** Delivery semantics, durable recovery, backpressure, and audit records remain application responsibilities. | Alternative; MPL-2.0 |
| C054 [Pydantic](https://github.com/pydantic/pydantic) | Python type-based data validation. | Validate shared transport envelopes and typed evidence/update records. **Boundary:** Schema validity does not establish semantic truth. Keep domain-native payloads and translator identities separate from transport fields. | Core candidate; MIT |
| C055 [Protocol Buffers](https://github.com/protocolbuffers/protobuf) | Language-neutral structured data serialization and generated bindings. | Later compact transport between heterogeneous specialist implementations. **Boundary:** Version schemas and field meaning; binary packing is not a learned private language or semantic translator. | Alternative; BSD-3-Clause |
| C056 [EGG](https://github.com/facebookresearch/EGG) | PyTorch toolkit for multi-agent games with learned discrete/continuous communication. | Controlled experiments on private codes, translator learning, message length, and cross-play. **Boundary:** Success on sender/receiver games does not establish general interoperable expert languages. Test unseen combinations and replacement peers. | Research reference; MIT |
| C057 [BenchMARL](https://github.com/facebookresearch/BenchMARL) | Standardized multi-agent reinforcement-learning training/benchmarking on TorchRL. | Controlled evaluation harness for selective communication and coordination policies. **Boundary:** Environment rewards and trained-agent budgets must match; full LLM-specialist integration is additional work. | Research reference; MIT |

### Verification and representations

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C058 [SymPy](https://github.com/sympy/sympy) | Python computer algebra and symbolic mathematics. | Exact transformations and checked targets for a narrow algebra or expression translator. **Boundary:** Correct symbolic manipulation assumes the original problem was represented correctly; preserve domain restrictions and units. | Later; Not independently verified in this pass; inspect LICENSE. |
| C059 [Z3](https://github.com/Z3Prover/z3) | Satisfiability-modulo-theories solving and constraint reasoning. | Check structured constraints, generate counterexamples, and verify narrow translated tasks. **Boundary:** A solver answer applies to the encoded assumptions; translation errors and unsupported theories remain separate failure modes. | Later; MIT per official Z3 documentation; inspect selected build notices. |
| C060 [cvc5](https://github.com/cvc5/cvc5) | Automated theorem proving for satisfiability-modulo-theories problems. | Alternative solver and cross-check source for selected constraint theories. **Boundary:** Choose supported theories and measure solve costs; a second solver is not needed for every initial task. | Alternative; Not independently verified; inspect COPYING and selected dependencies. |
| C061 [Lean 4](https://github.com/leanprover/lean4) | Programming language and theorem prover with kernel-checked proofs. | Later proof-specialist community and formal verification of precisely stated claims. **Boundary:** Formalizing the intended problem is part of the task. Proof checking is not a truth guarantee for an incorrectly formalized external claim. | Later; Apache-2.0 repository label; inspect component notices. |
| C062 [XGrammar](https://github.com/mlc-ai/xgrammar) | Constrained structured generation and grammar-engine integration. | Enforce supported output grammars for task, evidence, and translator payloads. **Boundary:** Grammar validity does not establish semantic correctness; integration must match the selected tokenizer and runtime. | Alternative; Apache-2.0 |
| C063 [Outlines](https://github.com/dottxt-ai/outlines) | Constrained structured output generation for model calls. | Produce valid routing decisions, evidence envelopes, and proposed update objects. **Boundary:** Grammar/schema compliance does not establish truth, calibration, or interoperability across private representations. | Alternative; Apache-2.0 |
| C064 [Hypothesis](https://github.com/HypothesisWorks/hypothesis) | Property-based test generation for Python. | Generate protocol edge cases, invariant violations, and counterexamples for teaching. **Boundary:** Properties must be specified correctly; generated examples do not establish universal correctness. | Core candidate; Not independently verified; inspect LICENSE.txt and component notices. |
| C065 [pytest](https://github.com/pytest-dev/pytest) | Python testing framework. | Executable task checks, regression suites, and candidate-update gates. **Boundary:** Keep final test cases inaccessible to training; passing visible tests alone is not sufficient. | Core candidate; MIT |
| C066 [Tree-sitter](https://github.com/tree-sitter/tree-sitter) | Incremental parsing infrastructure for programming tools. | Structured syntax representations for a later code/translation community. **Boundary:** A parsed tree says nothing by itself about program behavior; pair it with execution or semantic checks. | Later; MIT for core; grammars have separate terms. |

### Evaluation frameworks and datasets

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C067 [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) | Framework for few-shot language-model evaluations. | Measure baseline and post-update capability on fixed held-out tasks. **Boundary:** Static benchmark accuracy does not establish continual learning; task datasets have their own terms. | Core candidate; MIT |
| C068 [Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai) | Extensible evaluation framework with tools, multi-turn tasks, solvers and scorers. | Run identical evaluation procedures across HIVE and general-model baselines. **Boundary:** HIVE-specific learning sequences, budget meters and deterministic scorers still need implementation. | Core candidate; MIT |
| C069 [Lighteval](https://github.com/huggingface/lighteval) | LLM evaluation toolkit supporting multiple backends. | Alternative baseline evaluation runner where it matches the chosen serving stack. **Boundary:** Choose one main runner; avoid reconciling subtly different prompt/scoring defaults without need. | Alternative; MIT |
| C070 [EvalPlus](https://github.com/evalplus/evalplus) | Expanded tests for evaluating generated code. | Test a later coding specialist using executable correctness and repeated-error metrics. **Boundary:** Code-test success is domain-specific; run generated programs in a constrained evaluation environment. | Alternative; Apache-2.0 |
| C071 [Berkeley Function Calling Leaderboard / Gorilla](https://github.com/ShishirPatil/gorilla) | Code and datasets for evaluating function calls, including multi-turn and agentic task versions. | Evaluate routing to tools, argument correctness, state handling and recovery. **Boundary:** Pin the BFCL version and subset; a tool-calling score alone does not establish learning efficiency. | Alternative; Apache-2.0 repository label; inspect selected data and subcomponent terms |
| C072 [LongMemEval](https://github.com/xiaowu0162/LongMemEval) | Long-term interactive memory benchmark with information extraction, updates, temporal reasoning and abstention. | Evaluate retrieval and revision independently from durable parameter learning. **Boundary:** Official repo has cleaned histories and points to V2; pin dataset revision and scorer. Do not tune on final test answers. | Core candidate; MIT repository label; inspect chosen dataset terms |
| C073 [LoCoMo](https://github.com/snap-research/locomo) | Conversation data and evaluation code for long-term memory QA and related tasks. | Secondary test of long-range conversational retrieval and evidence tracking. **Boundary:** The public release has ten conversations; split by conversation and report all evaluated categories. License is noncommercial. | Research reference; CC-BY-NC-4.0 in repository LICENSE.txt |
| C074 [rliable](https://github.com/google-research/rliable) | Bootstrap intervals, performance profiles and robust aggregate benchmark metrics. | Report uncertainty and cross-task variation for repeated HIVE experiments. **Boundary:** Repository archived October 15, 2025; use as a pinned reference and verify dependencies. | Research reference; Apache-2.0 |

### Closed-loop environments and world models

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C075 [Gymnasium](https://github.com/Farama-Foundation/Gymnasium) | Standard interface and reference environments for single-agent reinforcement learning. | Define observation, action, reward, termination and reset contracts for closed-loop tests. **Boundary:** An interface supplies neither planning nor learning; select environments with known ground truth. | Core candidate; MIT |
| C076 [MiniGrid](https://github.com/Farama-Foundation/Minigrid) | Lightweight configurable grid-world environments using Gymnasium. | First closed-loop test of partial observation, reusable skills, changed conditions and local correction. **Boundary:** Grid-world success is an early mechanism test; it does not demonstrate general assistant or robot competence. | Core candidate; Apache-2.0 according to inspected LICENSE |
| C077 [PettingZoo](https://github.com/Farama-Foundation/PettingZoo) | API, environments and utilities for multi-agent reinforcement learning. | Test selective signaling, role specialization and coordination under message limits. **Boundary:** Multiple environment agents are not equivalent to cognitive specialists; the mapping must be explicit. | Alternative; MIT |
| C078 [Continual World](https://github.com/awarelab/continual_world) | Sequential robot-control tasks built on MetaWorld with baseline algorithms and result scripts. | Later tests of forward transfer, forgetting and recurring tasks. **Boundary:** README uses older MuJoCo/mujoco_py dependencies; reproduction and current compatibility need checking. | Research reference; Not verified; no repository license was established in this inspection |
| C079 [bsuite](https://github.com/google-deepmind/bsuite) | Small experiments for investigating reinforcement-learning capabilities. | Separate exploration, memory and learning behavior instead of relying on one aggregate score. **Boundary:** Designed for RL agents; adapting language interfaces changes the measured task and must be documented. | Alternative; Apache-2.0 |
| C080 [Crafter](https://github.com/danijar/crafter) | Survival-style benchmark spanning multiple agent capabilities. | Later test of reusable skill acquisition and long-horizon progress. **Boundary:** Success depends on exploration and environment training; it is substantially broader than an initial routing experiment. | Alternative; MIT |
| C081 [DreamerV3](https://github.com/danijar/dreamerv3) | Learns an environment model and improves behavior through imagined trajectories. | Reference for HIVE's parallel future prediction and reusable action-policy learning. **Boundary:** A separate control-learning research branch; training cost and model error must be measured, not assumed small. | Research reference; MIT |
| C082 [NeuroGym](https://github.com/neurogym/neurogym) | Curated neuroscience tasks under a common interface. | Controlled tests of working memory, context-dependent decisions and temporal integration. **Boundary:** Task similarity to a neuroscience experiment does not imply the resulting learner is biologically faithful. | Alternative; Apache-2.0 |
| C083 [CleanRL](https://github.com/vwxyzjn/cleanrl) | Readable single-file implementations of reinforcement-learning algorithms. | Build transparent baseline policies and inspect optimization details. **Boundary:** Treat it as reference implementations, not an interchangeable modular component framework. | Alternative; MIT for CleanRL developers; additional component notices in LICENSE |

### Biological modeling and connectome tools

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C084 [Brian2](https://github.com/brian-team/brian2) | Clock-driven simulator for spiking neural networks. | Small experiments in local plasticity, inhibition, timing and neuromodulatory rules. **Boundary:** Simulation cost is not biological energy cost; a spiking implementation is not automatically more efficient on a GPU. | Research reference; CeCILL-2.1 |
| C085 [Nengo](https://github.com/nengo/nengo) | Builds spiking and non-spiking neural models with extensible neuron types and learning rules. | Alternative for experiments in neural representation, recurrent dynamics and learned communication. **Boundary:** Large-scale neural modeling does not supply HIVE's language or lifelong-learning competence. | Research reference; GPL-v2 in inspected LICENSE.rst; component notices also present |
| C086 [Norse](https://github.com/norse/norse) | PyTorch components for deep learning with spiking neural networks. | Test event-driven specialist candidates in the same broader tensor ecosystem. **Boundary:** Event sparsity does not guarantee wall-clock or energy savings on the available hardware. | Research reference; LGPL-3.0 |
| C087 [snnTorch](https://github.com/jeshraghian/snntorch) | Python/PyTorch tooling for deep and online learning with spiking networks. | Alternative implementation for a small local-learning or temporal-classification specialist. **Boundary:** Training method, state size and accuracy must be compared with a conventional recurrent baseline. | Research reference; MIT |
| C088 [navis](https://github.com/navis-org/navis) | Analysis and visualization of neuroanatomical data. | Extract and analyze biological graph motifs before testing synthetic counterparts. **Boundary:** Morphology and connectivity analysis are not a working cognition or learning system. | Research reference; GPL-3.0 |
| C089 [fafbseg-py](https://github.com/navis-org/fafbseg-py) | Tools for working with the FlyWire connectome, interoperable with navis. | Retrieve circuit structure for topology and pathway experiments. **Boundary:** Use a pinned connectome release; anatomical edges omit much of the dynamics and learning rules needed for behavior. | Research reference; GPL-3.0 |
| C090 [CAVEclient](https://github.com/CAVEconnectome/CAVEclient) | Python client for Connectome Annotation Versioning Engine APIs. | Access versioned annotations and connectivity data reproducibly. **Boundary:** Data-service access and dataset permissions are separate from the client license; no cognition is supplied. | Research reference; MIT |
| C091 [FlyVis](https://github.com/TuragaLab/flyvis) | Official PyTorch implementation of a task-optimized model of the fly visual system. | Test whether biological connectivity constraints improve a narrow visual computation under matched budgets. **Boundary:** Evidence concerns fly visual-system modeling; it does not establish general intelligence or autonomous lifelong learning. | Research reference; MIT |
| C092 [Drosophila brain model](https://github.com/philshiu/Drosophila_brain_model) | Leaky integrate-and-fire brain model with neuronal activation and silencing experiments. | Reference for modular perturbation, signal propagation and sensorimotor circuit hypotheses. **Boundary:** The implemented experiment is a constrained neural simulation; it is not a complete freely learning digital fly. | Research reference; MIT |

### Measurement and reproducibility

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C093 [MLflow](https://github.com/mlflow/mlflow) | Experiment, model, evaluation, and trace management. | Track configurations, update candidates, model artifacts, and resource measurements. **Boundary:** Record HIVE's complete accounting explicitly. Optional system metrics require supporting packages and suitable sampling resolution. | Alternative; Apache-2.0 |
| C094 [OpenTelemetry Python](https://github.com/open-telemetry/opentelemetry-python) | APIs/SDK for tracing and metrics. | Trace specialist calls, message IDs, latency, and resource accounting. **Boundary:** Instrument causal/task IDs and budgets explicitly; traces by themselves do not prove evidence correctness. Logs API stability differs from traces/metrics. | Alternative; Apache-2.0 |
| C095 [psutil](https://github.com/giampaolo/psutil) | Process and system monitoring for Python. | Record CPU activity, process memory, and relevant system load. **Boundary:** GPU memory and energy require additional measurements. Full-machine and per-process metrics must remain distinct. | Core candidate; BSD-3-Clause |
| C096 [DVC](https://github.com/treeverse/dvc) | Git-associated data/model versioning, pipelines, and experiment tracking. | Track immutable training/replay snapshots and reproduce update candidates. **Boundary:** Original iterative/dvc URL currently redirects to treeverse/dvc. Historical data versions also consume disk and need explicit retention budgets. | Alternative; Apache-2.0 |

### Pretrained model checkpoint candidates

| ID and primary source | What the project supplies | Proposed HIVE use and boundary | Disposition and license scope |
|---|---|---|---|
| C097 [Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B) | Small pretrained text-generation checkpoint in Transformers format. | Concrete initial language-worker candidate for independent adaptation and adapter controls. **Boundary:** Checkpoint size does not establish task competence. Record training mask, complete footprint, tokenizer, quantization, and retained-skill results. | Core candidate; Apache-2.0 model-card label. |
| C098 [Qwen3-1.7B](https://huggingface.co/Qwen/Qwen3-1.7B) | Larger text checkpoint from the same named family. | Practical generalist reference with access to the same tools, memory, and updates. **Boundary:** Different pretraining histories confound architectural attribution. Match complete resource caps and include a controlled small-model experiment. | Core candidate; Apache-2.0 model-card label. |
| C099 [Qwen3.5-0.8B](https://huggingface.co/Qwen/Qwen3.5-0.8B) | Compact image/text checkpoint distributed in Transformers format. | Current alternative for a compact worker and later multimodal integration. **Boundary:** Evaluate text-only use and full architecture/runtime/adapter support. Do not silently omit unused vision components from storage accounting. | Alternative; Apache-2.0 model-card label. |
| C100 [Qwen3.5-2B](https://huggingface.co/Qwen/Qwen3.5-2B) | Larger compact image/text checkpoint in the same family. | Matched-family practical baseline for a Qwen3.5 worker configuration. **Boundary:** Actual deployment bytes, learning cost, and retained skill must decide selection; no local performance is asserted. | Alternative; Apache-2.0 model-card label. |

## Appendix B. Primary research foundation

These papers motivate specific experiments. Their reported results apply to their evaluated tasks and conditions; HIVE must establish its own gains.

| ID and paper | Finding or mechanism | HIVE experiment and scope |
|---|---|---|
| P01 [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) (2022) | Balancing parameter count and training data changes the capability achievable with a fixed training compute budget. | Compare complete resource allocations rather than treating parameter count as intelligence. **Scope:** A smaller deployed model trained on more data is not automatically more sample-efficient. |
| P02 [Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters](https://arxiv.org/abs/2408.03314) (2024) | Adaptive search and revision strategies can use inference computation more effectively in studied reasoning settings. | Test candidate generation and verification as a separate dimension from retained learning. **Scope:** Returns depend on prompt difficulty, initial competence, and the selection method. |
| P03 [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) (2022) | Reorganizing attention around memory traffic improves execution efficiency. | Optimize a proven specialist's implementation without confusing hardware efficiency with sample efficiency. **Scope:** Published speedups apply to particular models, kernels, hardware, and workloads. |
| P04 [DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://aclanthology.org/2024.acl-long.70/) (2024) | Fine-grained routed experts and shared experts address specialization and redundancy. | Reference a tested sparse-computation design and distinguish active compute from total stored capacity. **Scope:** Internal MoE experts do not automatically constitute independently learning semantic communities. |
| P05 [Evaluating large language models for accuracy incentivizes hallucinations](https://www.nature.com/articles/s41586-026-10549-w) (2026) | Accuracy-based evaluation can reward unwarranted guessing and conceal the value of calibrated abstention. | Measure false assertions at matched coverage and provide explicit uncertainty objectives. **Scope:** Changed incentives are one mechanism; evidence quality, reasoning, and verification still matter. |
| P06 [Next-Concept Modeling: Fast, Parallel Coarse-to-Fine Text Generation](https://arxiv.org/abs/2610.14162) (2026) | A learned hierarchy of discrete text codes enables coarse-to-fine parallel generation on evaluated tasks. | Reproduce a released task, then evaluate a narrowly scoped translator or solver with all tokenizer/generator costs counted. **Scope:** Generation gains against the paper's baselines do not establish lifelong learning or universal latent communication. |
| P07 [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) (2021) | Freezing a pretrained backbone and learning low-rank weight changes can reduce trainable parameters and adaptation storage in evaluated tasks. | Establish the shared-backbone adapter arm; measure total base-plus-adapter capacity and compare to independently trained specialists. **Scope:** A low-rank update is tied to compatible model weights and dimensions; low adaptation cost does not by itself show rapid continual learning or cross-architecture skill portability. |
| P08 [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) (2023) | Adapter training through a frozen quantized base reduces memory requirements using low-bit representations and other memory-saving mechanisms. | Candidate local adaptation route after full-precision correctness is established; measure retained accuracy and memory under the same training data. **Scope:** The paper's hardware and model results are task/configuration specific. Quantized base storage is separate from optimizer, activations, and inference state. |
| P09 [Loss of plasticity in deep continual learning](https://www.nature.com/articles/s41586-024-07711-7) (2024) | Continued training can reduce the ability to learn subsequent tasks; interventions including continual backpropagation can preserve plasticity in tested settings. | Measure time/examples to learn each successive task as well as retention of old tasks; test selective unit renewal in tiny experts. **Scope:** Evidence in the paper's supervised and reinforcement-learning settings does not establish a universal solution for continually adapting pretrained LLMs. |
| P10 [Progressive Neural Networks](https://arxiv.org/abs/1606.04671) (2016) | Freezing old network columns protects prior computations while new columns learn to reuse their features through lateral connections. | Isolation-and-transfer baseline; establish the benefit and resource cost of explicit specialist boundaries. **Scope:** Capacity grows with tasks, and choosing the appropriate component requires routing/task information. HIVE must control growth and account for routing errors. |
| P11 [Dark Experience for General Continual Learning: a Strong, Simple Baseline](https://arxiv.org/abs/2004.07211) (2020) | Combining rehearsal with stored output targets and regularization provides a strong baseline for sequential learning, including blurred task boundaries. | Require HIVE to beat a resource-matched replay baseline before attributing gains to elaborate specialist organization. **Scope:** Stored samples and targets consume memory and replay computation, which must be counted in the shared budget. |
| P12 [Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) (2023) | Input-dependent state-space dynamics permit selective propagation of information with efficient sequence processing. | Experiment with a bounded-state temporal specialist and compare with an attention-based specialist on the same stream. **Scope:** Sequence-state selection is not equivalent to explicit factual memory management or stable lifelong weight adaptation. |
| P13 [Hierarchical Reasoning Model](https://arxiv.org/abs/2506.21734) (2025) | Coupled recurrent modules operating at different timescales solve structured reasoning tasks with a comparatively small parameter count in the reported experiments. | Prototype a narrow planning or structured-reasoning specialist that performs iterative latent computation. **Scope:** The reported 27M-parameter model and small original dataset do not imply low total training cost or human-general reasoning; account for augmentation and repeated computation. |
| P14 [Less is More: Recursive Reasoning with Tiny Networks](https://arxiv.org/abs/2510.04871) (2025) | A small recursive model achieves strong results on selected structured puzzle tasks, challenging parameter count as the sole predictor of task competence. | Test recurrence and specialist size as independent experimental variables rather than assuming every specialist needs a billion-parameter language model. **Scope:** The paper's reported 7M-parameter result is domain-specific; recursion shifts work into repeated computation. Official reference code is archived. |
| P15 [Why There Are Complementary Learning Systems in the Hippocampus and Neocortex](https://stanford.edu/~jlmcc/papers/McCMcNaughtonOReilly95.pdf) (1995) | Computational account combines rapid storage of specific experiences with slower interleaved integration into structured knowledge. | Fast episode writes plus selective replay into slower specialist adaptation. **Scope:** A biological/computational hypothesis; a database and replay buffer do not reproduce a human memory system. |
| P16 [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) (2023) | Hierarchical memory management moves information between limited active context and external tiers. | Bound working context while testing exact recall, omission, rehydration, and restart behavior. **Scope:** External state and control-flow gains do not establish permanent neural skill acquisition. |
| P17 [From RAG to Memory: Non-Parametric Continual Learning for Large Language Models](https://arxiv.org/abs/2502.14802) (2025) | HippoRAG 2 combines graph retrieval/PageRank with passage integration for factual, associative, and sense-making tasks. | Compare graph-assisted multi-hop retrieval against exact/lexical/vector baselines on the same corpus and total indexing budget. **Scope:** Measure non-parametric knowledge adaptation separately from parametric generalization and count indexing cost. |
| P18 [Zep: A Temporal Knowledge Graph Architecture for Agent Memory](https://arxiv.org/abs/2501.13956) (2025) | Temporal graph design integrates conversational/structured facts while maintaining historical relationships. | Introduce contradictory and superseded facts; test time-aware retrieval and provenance. **Scope:** Reported Zep service results are not direct guarantees for a custom local Graphiti build. |
| P19 [TarMAC: Targeted Multi-Agent Communication](https://proceedings.mlr.press/v97/das19a.html) (2019) | Agents learn message content and recipients through downstream task reward in partially observable cooperative tasks. | Compare broadcast, fixed routing, learned targeted communication, and no communication at matched budgets. **Scope:** Task-specific multi-agent RL evidence does not establish learned translators for arbitrary pretrained LLM representations. |
| P20 [Learning to Communicate with Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1605.06676) (2016) | RIAL and DIAL learn communication protocols; DIAL passes learning signals through communication during centralized training. | Train small senders/receivers and adapters on controlled information-sharing tasks before scaling to heterogeneous experts. **Scope:** Centralized training assumptions and discrete execution mismatch must be accounted for; protocol interoperability is unproven outside training populations. |
| P21 [Prioritized Experience Replay](https://arxiv.org/abs/1511.05952) (2015) | Replaying selected important transitions more often improves learning efficiency in tested DQN settings. | Compare uniform, recency-based, and error/novelty-prioritized bounded replay for retained and new-task learning. **Scope:** RL priority definitions do not automatically transfer to text corrections; handle biased sampling and protect rare important cases. |
| P22 [A-MEM: Agentic Memory for LLM Agents](https://arxiv.org/abs/2502.12110) (2025) | Dynamically indexes, links, and revises structured memory notes using Zettelkasten-inspired organization. | Compare learned linking and contextual revision against fixed-schema notes at equal memory/write budgets. **Scope:** Memory reorganization needs factual validation; evaluate graph growth, stale links, and unsupported derived claims. |
| P23 [LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory](https://arxiv.org/abs/2410.10813) (2024) | Separates memory indexing, retrieval and reading, and tests extraction, updates, temporal reasoning, multi-session reasoning and abstention. | Use memory tests to identify where a failure occurred; a recall improvement cannot by itself establish a new learned skill. |
| P24 [Evaluating Very Long-Term Conversational Memory of LLM Agents](https://arxiv.org/abs/2402.17753) (2024) | Introduces LoCoMo with generated conversations checked by humans and tests long-term temporal and causal memory. | Use as a secondary conversational-memory test with conversation-level separation; retain the release and scoring definitions. |
| P25 [Continual World: A Robotic Benchmark For Continual Reinforcement Learning](https://arxiv.org/abs/2105.10919) (2021) | Emphasizes forward transfer alongside forgetting and resource constraints in sequential control tasks. | Measure whether later tasks become easier to learn, not only whether previous performance survives. |
| P26 [Deep Reinforcement Learning at the Edge of the Statistical Precipice](https://arxiv.org/abs/2108.13264) (2021) | Shows that conclusions from point estimates with few runs can be unreliable; develops interval estimates and performance profiles. | Use paired seeds/task orders, uncertainty intervals and per-task results; avoid declaring a win from one run. |
| P27 [Neuronal wiring diagram of an adult brain](https://www.nature.com/articles/s41586-024-07558-y) (2024) | Provides a whole adult fly brain chemical-synapse wiring map with annotations and programmatic access. | Use topology and pathway structure to formulate experiments; connectivity alone does not encode all dynamics, plasticity, or behavior. |
| P28 [A Drosophila computational brain model reveals sensorimotor processing](https://www.nature.com/articles/s41586-024-07763-9) (2024) | Combines connectome structure and neurotransmitter identity in a leaky-integrate-and-fire model and tests feeding/grooming circuit predictions. | Adopt the experimental pattern of perturbing a module and predicting effects; do not claim the model reproduces general intelligence. |
| P29 [Connectome-constrained networks predict neural activity across the fly visual system](https://www.nature.com/articles/s41586-024-07939-3) (2024) | Task-optimized networks constrained by connectome structure predict aspects of neural activity in the fly visual system. | Compare biological constraints with random and learned connectivity at equal edge, parameter and training budgets. |
| P30 [Mastering Diverse Domains through World Models](https://arxiv.org/abs/2301.04104) (2023) | DreamerV3 learns an environment model and trains behavior with imagined future scenarios across diverse control tasks. | Use as a reference for prospective simulation, while accounting for world-model training, rollout cost, and accumulated prediction error. |

## Appendix C. Source status and implementation handoff

### Current status findings that change integration choices

- LAYA requires task-specific decision training and held-out confidence calibration; preserve a deterministic prerequisite/fallback path.
- Letta's old repository directs current development to letta-code; identify whether the new harness or the archived server is being used.
- Mem0's managed-platform benchmark claims are distinct from the local OSS SDK.
- TorchAO's current source describes a consolidation of development; select a supported concrete recipe rather than making the package a permanent architectural dependency.
- Unsloth has component-specific licensing; the core and optional Studio components require separate review.
- TRM and rliable have archived reference repositories; preserve exact revisions for reproduction and do not assume ongoing support.
- LongMemEval has multiple history/data versions and a V2 path; freeze the dataset and scorer together.
- LoCoMo's inspected repository license is noncommercial; keep evaluation/reuse scope explicit.
- SQLite/vector indexes, graph memory, latent representations, adapters, and data-service clients have different responsibilities. They are not interchangeable forms of a solved memory system.

Each item is linked to its official source in Appendix A. No listed package has been installed, combined, or benchmarked as HIVE during preparation of this plan.

### Source and artifact manifest to create during Stage 0

For every selected component, record: official URL; exact commit/tag; retrieval date; code license; selected model/dataset license; artifact checksum; environment lock; hardware/driver profile; install result; smoke-test result; required inputs; outputs; resource observations; and the reason it is selected over its alternative.

All imports, caches, generated datasets, indexes, logs, replay buffers, and retained model versions belong in an explicit retention policy. Keep a bounded reproducibility record without quietly retaining every historical payload outside the declared budget.

### Review priorities for the implementer

1. Build the paired baseline and task truth before optimizing a specialist.
2. Give competing arms identical external feedback; keep oracle truth out of runtime access.
3. Preserve exact ownership of shared and independent parameters.
4. Verify unseen transfer without retrieving the original answer-bearing correction.
5. Require absolute retention as well as comparison with a baseline.
6. Count the full system, including diagnostic, teaching, and recovery work.
7. Promote representation-compatible artifacts atomically.
8. Expand only on a reproducible, specifically scoped result.

### Earlier project materials used as context

- HIVE_AI_Core_Architecture.md: conceptual layers, specialist communities, channels, and composable-intelligence goal.
- HIVE AI Open-Source Stack Mapping (1).md: earlier component candidates and interface ideas.
- HIVE AI Validation Benchmark & Harness (1).md: earlier experimental proposal, revised here for learning efficiency and fair whole-system comparisons.
- HIVE 100 similar projects report.md: discovery context only; its historical success/failure labels are not evidence for the present hypothesis.
- Ian-AI-Generation-and-Game-Design-Software.pdf: local inventory snapshot dated 15 November 2026, with readiness distinctions preserved.

The build is ready to begin with Stage 0 and the first protocol-learning environment. The research claim remains contingent on the comparative results.
