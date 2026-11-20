# HIVE: simulation findings and the first build configuration

**Research and experiments completed: November 18, 2026.**

## Decision

Build the first HIVE community around **four functional modules, two small language-learning compartments, a compact visual encoder, and a deterministic scheduler**. Let modules exchange typed numerical representations directly when the task supports them. Keep a broader language model available as a measured reference or optional fallback. Start with interleaved verified replay and test additional consolidation during idle periods.

The experiments support a narrower and more useful claim than “more specialists are always smarter”: **the right sharing boundaries can improve retention and reduce active computation, while the wrong boundaries can damage both transfer and accuracy.** The strongest result was a 17.76 percentage-point change produced by regrouping the same two experts, with the same total capacity and training budget, on a deliberately conflicting synthetic workload.

This is a **provisional engineering starting point**, not a mathematically optimal architecture or a validated billion-parameter size. The tests were actual CPU computations and neural-network training; they did not run pretrained LLMs, real image recognition, or the user's RTX 5070 Ti. They establish mechanisms worth testing and expose failures that the build must handle.

The earlier HIVE Build Plan and Source Foundation remains the larger code and literature catalog. This report adds executable evidence, a concrete candidate configuration, and the next experiment needed to select real model sizes.

## 1. What was actually run

| Study | Execution | Main question | Evidence boundary |
|---|---|---|---|
| Continual neural learning | 360 NumPy MLP training runs; five seeds; three capacities; four organizations; three schedules; two rule regimes | When do sharing, isolation, grouping and replay help? | Real optimization on synthetic labeled tasks; not LLM intelligence |
| Representation preservation | 50,000 held-out geometric scenes; three decisions per scene; five representations | Which information survives serialization and compression? | Actual numerical reconstruction; not visual perception |
| Learned translation | Ten seeds; private eight-dimensional spaces; paired training sets from 4 to 256 examples | Can private representations communicate, and what happens after drift? | Actual fitted linear translators in an intentionally simple setting |
| Message boundaries | 30,000 generated messages evaluated under four gate policies | Which mistakes do types, versions and permissions block? | Deterministic gate validation; not a security proof or neural corruption test |
| Communication and scheduling | 1,440 discrete-event runs; 345,600 simulated end-to-end task requests | How do graph topology, activation policy and shared hardware interact? | Synthetic workload with assumed normalized service costs; not measured GPU time |

The learning grid used exactly **360 optimizer updates and 11,520 sample presentations per run**, for 4,147,200 presentations across the grid. The measured training-grid runtime was 14.32 seconds in this CPU environment. The representation run took about 2.73 seconds; the corrected scheduling grid took 61.87 seconds. These runtimes describe these small programs, including their particular evaluation overhead. They are not forecasts for training or serving language models.

All source code, seeds, raw records, summary statistics, plots and reproduction commands are included in the accompanying experiment bundle.

## 2. Organization: the clearest positive result

### Design

Each learning run presented four domains sequentially. All models received the same 16 numerical input features and the same explicit domain tag. Each domain had 512 available training examples and a separate 512-example held-out evaluation set.

Two rule regimes created a useful contrast:

- **Mostly shared rules:** the domains depended mainly on the same underlying function, with small private differences.
- **Conflicting rules:** part of that common function changed sign between domains, with stronger private differences.

These were constructed situations, not estimates of how often real HIVE workloads will share or conflict. A domain tag made routing correct by construction, while a separate routing-error sensitivity examined wrong expert selection.

The tested organizations were one generalist, two experts with mixed conflicting rules, two experts with compatible rules, and four independent experts. Total parameters were approximately matched at 1,024, 4,096 and 8,192; the actual counts are in the raw data. At the middle budget, the generalist had 4,096 parameters, each two-expert system had 4,052, and the four-expert system had 4,056.

“Compatible” grouping was known from the task generator. This was a control for the importance of grouping, not a demonstration that a router or clustering algorithm discovered the right organization.

### Results with the same interleaved replay schedule

Final accuracy averages all four domains equally, then averages across five seeds.

| Organization at approximately 4,096 total parameters | Mostly shared rules | Conflicting rules |
|---|---:|---:|
| One generalist | 91.03% | 74.47% |
| Two experts, mixed-rule pairs | 89.59% | 66.11% |
| Two experts, compatible-rule pairs | 89.80% | 83.88% |
| Four independent experts | 87.00% | 88.98% |

Regrouping the same two experts improved the conflicting-task score from **66.11% to 83.88%**: a paired difference of **17.76 percentage points**, with a descriptive 95% t interval of ±6.75 points across the five seeds. The interval is not adjusted for searching multiple configurations and should not be treated as a prediction interval for a real application.

The organization mattered more than simply adding capacity to the poorly grouped configuration. Under interleaved replay, doubling that mixed-pair system from roughly 4,096 to 8,192 total parameters changed its conflicting-task accuracy only from 66.11% to 66.27%.

The other regime constrains the interpretation. When rules were mostly shared, the generalist performed better than the isolated specialists. Before training on a new shared-rule domain, the middle-sized generalist already averaged 88.76% accuracy; the independent specialists averaged 49.32%. Shared learning transferred useful structure. Isolation removed that transfer path.

### What HIVE should learn from this

Choose a specialist boundary by measuring **which learning updates help or harm other tasks**. Topic names alone do not reveal that relationship.

A practical procedure is to maintain a transfer matrix. After training a candidate on task family A, evaluate changes on held-out families B, C and D. Positive effects suggest useful sharing; repeated negative effects suggest separate update ownership. Also record how much information families exchange, how costly their shared encoder is, and whether they need different output contracts.

This favors modules that own coherent representations and learning objectives, such as geometry/state estimation, tool selection, or evidence evaluation. It does not require a separate full language model for each label, document type or tiny action.

The present experiment did not include a shared frozen encoder with private heads, a soft mixture of experts, or a learned grouping algorithm. Those are follow-up candidates, not measured winners.

## 3. Size: what the experiment can and cannot select

At the three tested capacities, the following results used **interleaved replay throughout**.

| Approximate total parameter target | Shared-rule generalist | Conflicting-rule generalist | Conflicting compatible pair | Conflicting four experts |
|---:|---:|---:|---:|---:|
| 1,024 | 90.75% | 70.03% | 82.44% | 86.75% |
| 4,096 | 91.03% | 74.47% | 83.88% | 88.98% |
| 8,192 | 90.46% | 75.53% | 83.97% | 89.69% |

Capacity helped some conditions, but the gains became modest under this fixed training schedule. The slight decline in the shared generalist is not evidence that larger models are generally worse: the optimizer, number of updates and data were fixed, and the differences have uncertainty.

**There is no justified conversion from a 4,096-parameter synthetic MLP to a 0.6B, 1.7B or 4B language model.** Pretraining, tokenizer, architecture, quantization, task complexity, sequence length and hardware all change the comparison.

The useful size rule is operational: select the **smallest complete system that meets the required accuracy, retention and latency**, then retain a larger candidate only where it measurably improves difficult cases. Track stored parameters and active parameters separately.

At the middle budget:

| Quantity | One generalist | Four experts |
|---|---:|---:|
| Total stored trainable parameters | 4,096 | 4,056 |
| Active parameters per example | 4,096 | 1,014 |
| Training presentations | 11,520 | 11,520 |
| Estimated training matrix MACs | 94.3 million | 23.3 million |

MACs are multiply-accumulates estimated from the executed matrix shapes. The estimate excludes routing, biases, activations, optimizer operations, evaluation and memory transfers. Known-domain routing had no learned parameters. These numbers demonstrate sparse activation in this program; they do not establish four times faster real-world learning or four times as many tokens per second.

The experiment also records an 80% acquisition marker requiring two consecutive evaluation probes. Nonattaining runs are retained as censored values. The probes were coarse, and evaluations did not control training. We therefore do not claim a general multiplier in examples required to learn.

## 4. Replay and “sleep”: a useful negative result

The learning schedules had equal presentation counts. Interleaved and blocked replay used **exactly the same minibatches in a different order**.

- Current-data-only training spent all 90 minibatches in a stage on its current domain.
- Interleaved replay used two current-domain minibatches followed by one old-domain minibatch.
- Blocked replay used all 60 current-domain minibatches, then all 30 old-domain minibatches.

The first stage had no old tasks and used identical current training in every schedule. Replay used a bounded store of 64 previously observed examples per domain, with a total capacity of 256 records. It received no extra update budget.

For the conflicting-task generalist at approximately 4,096 parameters:

| Schedule | Final accuracy |
|---|---:|
| Current data only | 54.31% |
| Interleaved replay | 74.47% |
| Blocked replay | 62.64% |

Interleaving exceeded blocked replay by **11.84 percentage points**, with a paired descriptive 95% t interval of ±5.78 points. The final old-task block could overwrite recent conflicting learning.

Four isolated experts reached 90.42% with current-only training and 88.98% with either replay ordering. With completely separate parameters, updates to another expert cannot alter an expert's weights; interleaved and blocked schedules therefore gave exactly identical final outputs for that arm. Replay still displaced learning from fresh current examples and repeatedly sampled a much smaller store.

This supplies an important requirement for HIVE: **a consolidation cycle must earn its compute by improving retention, generalization, compression or availability.** Calling it sleep supplies no benefit by itself. This experiment did not simulate REM, dreaming, synaptic downscaling, a learned sleep controller, or generative replay.

## 5. Graph: selective activation matters before elaborate topology

The scheduler study compared four connection graphs independently of the activation policy:

1. A direct mesh.
2. A central forwarding hub.
3. A community tree with local and global routers.
4. Local communities with direct internal links and bridges between community leaders.

Each graph was tested with selective activation and with broadcast-to-all activation. A mesh is a set of available connections; it does not require all nodes to converse.

Every run shared **one serial accelerator** and **four CPU message-service lanes**. Extra modules did not receive imaginary extra GPUs. A task first executed at its source and then requested one, two or three other workers, with probabilities 0.6, 0.3 and 0.1. Each useful worker execution averaged one normalized work unit. All graphs received the same task trace and worker durations within each paired comparison.

The sweep covered 4, 8 and 16 workers; two within-community selection preferences; two offered useful loads; three message-service costs; and five seeds. Node CPU service and link traversal each cost 0.001, 0.03 or 0.3 times the mean worker service. These are explicitly assumed sensitivity values.

### Work performed

Under one representative workload selection, mean accelerator work per task was:

| Available workers | Selective activation | Broadcast activation |
|---:|---:|---:|
| 4 | 2.50 units | 4.01 units |
| 8 | 2.47 units | 8.00 units |
| 16 | 2.50 units | 16.00 units |

Broadcast was defined to run and await every peer. No extra answer-quality benefit was assigned to those redundant executions. The larger cost is a consequence of that workload definition. It is useful for exposing unnecessary work, but it is not an independently discovered intelligence advantage.

The arrivals were normalized to useful work. Expected broadcast load is useful load multiplied by workers/2.5. Thus 16-worker broadcast at useful load 0.8 has expected actual accelerator load 5.12 and would not reach a stable queue under continuing arrivals. All reported runs contain 240 arrivals followed by a full drain. Their latency and throughput are **finite-run outcomes**, not steady-state capacity estimates.

### Topology at four workers

For selective activation, locality preference 0.8 and useful offered load 0.8:

| Topology | Available directed links | Mean latency when a message step costs 0.001 | Mean latency when it costs 0.3 |
|---|---:|---:|---:|
| Direct mesh | 12 | 7.40 | 9.13 |
| Community bridges | 6 | 7.40 | 9.72 |
| Central hub | 8 | 7.40 | 10.29 |
| Community tree | 12 | 7.41 | 11.33 |

Units are normalized to a mean worker execution of one. At cheap communication, topology barely changed latency because the common accelerator dominated. At expensive communication, extra forwarding increased delay.

The mesh did not pay an edge-maintenance, authentication, discovery or translator-training cost in this simulator. Accordingly, the study does not establish it as globally optimal. At larger scale, those costs and ownership constraints can justify communities.

**Starting graph:** a small deterministic control scheduler, with direct allowlisted data exchanges among the first modules. Let the scheduler choose who runs; allow approved tensor payloads to travel directly between producer and consumer. Introduce deeper communities when observed traffic, interference or operational ownership makes them useful. A central control plane need not sit inside every numerical data path.

## 6. Native representations: preserve information, then compress deliberately

The representation study generated four 2D points per scene and tested three decisions: nearest point, orientation and segment crossing. The source coordinates already contained all necessary information. No camera image had to be recognized.

| Representation | Original task labels preserved | Mean payload bytes |
|---|---:|---:|
| Float32 binary | 100.00% | 32.00 |
| Full-precision numerical JSON | 100.00% | 155.02 |
| Precise coordinate prose | 100.00% | 171.00 |
| Five-bin coarse words | 86.97% | 82.49 |
| Identical five-bin numerical codes | 86.97% | 8.00 |

Precise prose retained every tested label. The two coarse encodings lost exactly the same information for every seed. The demonstrated loss came from quantization, not from the mere existence of English.

Binary float32 used approximately **4.84 times fewer payload bytes than JSON** and **5.34 times fewer than the tested prose format**, while retaining every tested label. These ratios exclude message headers, provenance and transport overhead; they are not token-speed ratios. Near a sufficiently sensitive decision boundary, finite-precision numbers can also change outcomes.

The design implication is to keep domain-native information available whenever a downstream consumer can use it. A visual path can be image → encoder features → tracking/state estimation → planner, with text generated for the user or when a language-based decision is genuinely needed.

This is technically well grounded in existing research code. DINOv3 exposes visual features and compact encoders; CLIP provides image and text feature APIs in an explicitly aligned space; V-JEPA supplies video representation and latent-prediction research. These precedents do not make arbitrary hidden vectors compatible. [C1–C3]

Dense features can also be larger than prose. For example, 256 tokens × 384 values × 2 bytes is 196,608 bytes, while one pooled 384-value float16 vector is 768 bytes. These are arithmetic examples. The relevant question is which representation preserves enough information for the actual downstream task at an acceptable compute, storage and communication cost.

## 7. Private languages need versioned translation

In the translation experiment, producer and consumer represented the same scene in different random eight-dimensional coordinate systems. A fitted 8 × 8 linear translator connected them. Evaluation scenes were held out from fitting.

| Condition | Task labels preserved |
|---|---:|
| Different private spaces without translation | 49.91% |
| Translator fitted from 16 noisy paired examples | 94.87% |
| Translator fitted from 64 noisy paired examples | 97.84% |
| Translator fitted from 256 noisy paired examples | 98.95% |
| Producer representation changes; old 64-pair translator remains | 50.26% |

Training noise had standard deviation 0.02 independently on both sides of a pair. Test coordinates were noise-free. The task mix has different class balances, so the near-50% results are not a universal chance baseline.

These linear spaces are much easier to align than unrelated pretrained encoders. The paired-example counts should not be extrapolated. The durable finding is architectural: **same shape does not imply same meaning**, and an encoder update can invalidate its consumers.

HIVE should identify each representation by its producer model, checkpoint/version, preprocessing, shape, units and coordinate conventions. A translator belongs to a specific source–destination version pair. Validate and promote the encoder, translator and consumer together; keep older embeddings tagged so they can be migrated, re-encoded or rejected.

Where modules can use the same stable encoder, a shared representation may remove the translator entirely. Where they need private spaces, train translators on paired observations and evaluate downstream decisions, not just reconstruction error. Unnecessary translators are another source of latency and failure.

## 8. Contamination: separate the mechanisms

The gate study generated 30,000 messages: valid messages and equal numbers with a wrong recipient, stale representation, wrong units, an unauthorized writer, or a valid-looking payload for the wrong scene.

| Gate | Invalid messages accepted | Unauthorized write cases accepted | Well-formed wrong-semantic cases accepted |
|---|---:|---:|---:|
| Shape and finite-number checks | 100% | 100% | 100% |
| Add recipient, representation version and units | 40% | 100% | 100% |
| Add writer and namespace capability checks | 20% | 0% | 100% |
| Add numerical range checks | 20% | 0% | 100% |

All valid messages were accepted. The remaining 20% of the artificially balanced invalid set were the well-formed semantic errors. Authentication identities were supplied by the harness; it did not implement cryptographic authentication, process sandboxing, a live memory database or model weight writes.

This validates specific rules under specified injections. It does not establish zero contamination, real deployment failure rates or a security proof.

HIVE needs distinct controls for distinct failure paths:

| Failure mechanism | Proposed control | What remains possible |
|---|---|---|
| Updating one skill damages another | Independent update owners where measured interference is harmful; retention evaluation for shared weights | Within-module forgetting; harmful shared-encoder changes |
| Wrong representation or units | Typed/versioned envelopes and tested translators | Correctly typed but wrong values |
| Wrong memory recipient or writer | Enforced namespaces and capability checks outside the model | Mistakes by an authorized writer |
| False evidence becomes durable belief | Provenance, source checks, quarantined candidates, corroboration where available | Uncertain or false external sources |
| Bad synthetic examples reinforce themselves | Mark synthetic origin; require external checks before factual promotion | Simulator errors and incomplete validators |
| Bad routing propagates an error | Measured router calibration, abstention/escalation, bounded fanout | Ambiguous tasks and correlated errors |

Different alphabets or latent spaces can make accidental interpretation less likely, but **they are not an authorization boundary**. Permissions must be enforced by the runtime. A model's instruction to “write only to its own memory” is weaker than a memory service that cannot accept a write without the appropriate capability.

Use the existing four HIVE channels with distinct authority:

- **Control:** scheduling, budgets, cancellation and capability decisions.
- **Task:** tensors, structured state, tool requests and results.
- **Evidence:** observations, source identity, timestamps and uncertainty.
- **Teaching:** proposed training examples or parameter changes, admitted through a validation process.

A Task message must not automatically acquire Teaching authority. Successful transport, valid syntax and high model confidence do not establish truth.

## 9. Biology translated into an engineered lifecycle

Biological systems suggest useful experiments, but the translation must identify the mechanism being borrowed.

Experiments suppressing post-learning hippocampal sharp-wave ripples impaired a rat spatial-memory task. A separate causal mouse study disrupted REM-associated theta activity and impaired particular forms of memory. These support studying complementary consolidation processes, not equating all learning or cleanup with REM. [B1–B2]

Mouse cortical microscopy found selective sleep-associated synaptic scaling, with some larger stable synapses relatively spared. That motivates testing selective maintenance and retention policies, not uniformly shrinking every model weight. [B3]

The waste-clearance literature is more complicated than a single slogan: primary studies using different measurements have reported increased sleep-linked transport/clearance mechanisms and reduced tracer clearance during sleep. Software garbage collection should be justified by measured memory, latency and data-quality costs regardless of that biological dispute. [B4–B5]

The digestive, immune, endocrine and nervous systems share signals. For example, microbial fermentation metabolites affect immune-cell regulation through specific receptors, and neural stimulation can alter inflammatory responses. Their specificity depends on receptors, location and context rather than completely incompatible languages. The software inference is controlled reception and scoped influence. [B6–B7]

### Proposed HIVE cycles

| Phase | Trigger | Operation | Product | Control |
|---|---|---|---|---|
| Active operation | Incoming work | Perceive, route, retrieve, act, record outcomes | Task results and bounded recent experience | Latency and resource budgets |
| Brief maintenance | Low queue pressure or buffer thresholds | Deduplicate records, validate contracts, expire temporary state | Cleaner buffers and available cache | Preserve evidence links and protected records |
| Verified rehearsal | Enough new checked examples | Mix new, old, rare and failure examples | Candidate skill update | Compare with equal-budget interleaved replay |
| Consolidation | Idle compute and a validated update need | Train/compact a candidate; migrate compatible state | Smaller or better-retaining skill | Held-out retention and interface tests |
| Counterfactual rehearsal | A measurable coverage gap | Generate alternative task states in a simulator | Marked synthetic examples | Simulator checks; no automatic factual promotion |
| Resource recovery | Memory or model-version pressure | Release caches, compact indices, retire obsolete versions | Recovered storage/VRAM and simpler state | Keep rollback and required provenance |
| Promotion | Candidate passes gates | Switch model, translator and interface versions together | Updated active module | Atomic deployment and rollback |

“Production” in this system means producing useful state estimates, actions, evidence, memories and candidate skills. “Waste” means duplicate records, obsolete embeddings, abandoned contexts, unsupported candidates and idle cached state. Maintain a ledger so the value of cleanup can be measured.

Do not copy a fixed human 90-minute schedule. Use workload, learning backlog, drift and memory pressure. On a shared GPU, consolidation has an opportunity cost even during apparent idle time; charge its accelerator time, replay storage and energy to the system.

### What to remember and what to forget

Use distinct storage timescales:

1. Short-lived working state for the current task.
2. A bounded episodic buffer with provenance, timestamps and outcomes.
3. A smaller validated semantic store for stable facts and procedures.
4. Model parameters for skills that have demonstrated transfer beyond their original examples.
5. A bounded audit/rollback history with explicit retention rules.

Choose replay records using a mixture of recent, representative, rare and high-consequence cases. Avoid a pure “least recently used” knowledge policy, because rare information can be valuable. A concrete first ablation can compare a balanced reservoir against a mixture with a protected rare-case quota; the quota is a tunable proposal, not a result of these experiments.

Use replacement/supersession markers for changed facts, so an old fact is not silently treated as current. Deleting a source record or retrieval entry does not by itself remove information already learned in model weights. That is a separate unlearning problem.

## 10. Concrete model and module starting point

### Functional layout

| Functional module | Initial implementation | Learning boundary |
|---|---|---|
| Perception and state | Compact frozen visual encoder; numerical geometry/tracking state; small task heads | Private heads first; encoder updates only with consumer/translator regression checks |
| Tool selection and execution | A small language core for selection/schema repair plus deterministic executors | Own examples, updates and outcome feedback |
| Evidence and memory | Retrieval, provenance and contradiction checks; second small language core where needed | Own memory namespace and update candidate |
| Language and integration | Human-facing explanations and composition; broader model available for difficult cases | Broad model changes evaluated separately |

The four functions do not require four full language-model copies. A visual head, deterministic executor and memory index can provide much of the work. A LAYA-style typed decision interface can be attached to a functional owner without creating another full backbone.

### First candidate sizes

Use **two independently owned 0.6B language cores** as the first local specialization candidate, with a **1.7B reference/fallback** evaluated separately. Qwen3's official 0.6B, 1.7B and 4B checkpoints provide a convenient same-family pilot ladder; they are starting candidates, not winners established by this simulation. [M1–M3]

For vision, DINOv3's official ViT-S/16 is 21M parameters. Begin with a frozen encoder and task-specific heads; verify the custom DINOv3 terms before adoption. V-JEPA 2.1 offers an 80M ViT-B/16 encoder as a later temporal-representation experiment, but that encoder alone is not an entire action-conditioned world model. [C1–C2]

If both 0.6B copies and the 1.7B fallback are included, the language backbones total approximately **2.9B parameters**, regardless of how often the fallback is used. Count it in stored capacity and include its runtime whenever called. Every baseline should receive the same fallback access, with usage reported.

The reported RTX 5070 Ti has 16 GB of GDDR7 and nominal memory bandwidth of 896 GB/s according to NVIDIA. That is a hardware specification, not an LLM benchmark. OBS, camera effects, cache, activations, backend allocations and optimizer states must be measured on the actual machine. [H1]

For intuition only, raw weight storage follows parameters × bits/8:

| Parameters | Raw 4-bit weights | Raw 16-bit weights |
|---:|---:|---:|
| 0.6B | 0.30 GB | 1.20 GB |
| 1.7B | 0.85 GB | 3.40 GB |
| 4.0B | 2.00 GB | 8.00 GB |
| Two 0.6B cores plus 1.7B fallback | 1.45 GB | 5.80 GB |

These are decimal GB arithmetic lower bounds, excluding quantization metadata, caches, vision, memory services and all training state. They are not residency recommendations. Full training can require much more memory than inference. Train a candidate in an isolated maintenance window and measure its peak; do not infer that an inference fit implies a training fit.

### Keep two learning claims distinct

A frozen backbone with private LoRA adapters is a practical comparison arm. It does not demonstrate independently adapting the backbone. The stronger hypothesis arm must update independent small networks or independent backbone parameters, with separate ownership and retention tests. The CPU learning study did the former: each expert was a separately trained complete MLP.

For a real pilot, start with independent trainable visual/task heads and a manageable local adaptation procedure. Benchmark shared-base adapters as their own control. Only increase the amount of independently trained backbone when the task gain justifies its memory and update cost.

## 11. How to select the real starting size on the user's machine

The next experiment should use a small but real HIVE workload with verifiable outcomes: tool selection, typed schema repair, retrieval-backed evidence decisions and visual state decisions. Separate training, development and sealed evaluation sets, and hold out new task compositions.

### Run sequence

| Step | Work | Decision produced |
|---|---|---|
| Hardware baseline | Measure free/peak VRAM, first-result latency and completed-task rate with normal OBS/camera workload | Real serving and maintenance budgets |
| Size ladder | Evaluate 0.6B, 1.7B and 4B within one family and consistent decoding conditions | Smallest single-model candidate meeting the task gates |
| Organization | Compare generalist, shared-base adapters, two independent compartments and four compartments | Whether measured interference justifies each split |
| Representation path | Compare direct numerical/latent transfer, precise structured text and caption-mediated transfer | Which path preserves task quality at lowest end-to-end cost |
| Learning cycle | Compare current-only, interleaved replay and mixed-data consolidation at matched budgets | Whether the maintenance cycle earns its cost |
| Drift and faults | Change facts, schemas and encoder versions; inject invalid and valid-looking false messages | What gets contained and what needs evidence checks |
| Long run | Run bounded memory through many sequential tasks and repeated updates | Retention, resource stability and maintenance overhead |

The comparison should match evidence, tools, external feedback, decoder settings and escalation opportunities. Report all stored models, active computation, translators, retrieval, replay, retries and maintenance. If the configurations have different total capacity, treat them as a measured quality–resource tradeoff rather than an exact parameter-controlled causal comparison.

### Initial acceptance gates

These are **proposed engineering gates**, not achieved outcomes:

- Meet the application's task-quality requirement and remain within two percentage points of the chosen reference where noninferiority is the goal.
- Report worst-domain and average retention, including rare tasks; a candidate first target is at most five percentage points average forgetting and ten for any protected task family.
- Prefer fewer corrected examples to reach a fixed retained-quality threshold; keep nonattainers visible.
- Measure completed correct tasks per second, p50/p95 end-to-end latency and total accelerator time, with the same error and abstention policy.
- Report memory growth, maintenance time, actual peak VRAM and storage over the long run.
- Admit a new module only when its gain exceeds routing, translation, storage, maintenance and evaluation cost.
- Reject a promoted encoder/translator pair if held-out downstream behavior regresses beyond its gate.
- Keep authorization-violation rejection separate from semantic-truth accuracy.

Use development results to choose the configuration, then estimate the final tradeoff on fresh data and new task orders. The small experiment's descriptive intervals are insufficient for selecting a production architecture by tiny score differences.

## 12. What local speed could realistically improve

HIVE can improve time to a useful answer by avoiding unnecessary generations, retaining reusable state, activating only needed workers, performing direct numerical decisions, reducing repeated prefill, and reusing encoded inputs. Those are testable system improvements.

They do not automatically increase a decoder's raw tokens per second. A system that removes two intermediate text generations may finish much sooner while its final language model generates at exactly the same token rate. Vision heads and numerical planners may produce no language tokens at all.

Consequently, use **correct completed tasks per second, latency at fixed quality, retained competence per feedback example, and total resource cost** as primary measures. Record decoder tokens per second as one component, with tokenizer, prefill, output length, batch size and hardware conditions stated.

Local/cloud comparisons also need matched tasks, tools, reasoning budget and quality. Network latency, cloud batching and model architecture differ. The present evidence does not show HIVE matching frontier models on general reasoning, nor does it show a cloud-equivalent token rate. It gives a concrete route to finding narrower workloads where organization and direct computation deliver a better local result.

## 13. Reproducibility and limitations

The bundle contains all three experiment directories and a root reproduction script. Python, NumPy and Matplotlib are sufficient; no network, GPU or model download is needed for these studies. The scripts regenerate raw data and figures. Plot rendering and minor floating-point details can vary by environment; timing is inherently machine dependent.

Validation included finite differences for handwritten neural gradients, checks on all presentation/update counts and parameter budgets, exact replay-order invariance for isolated experts, matched coarse-word/coarse-code information loss, and complete scheduler work accounting. An independently reviewed CPU scheduler issue was corrected before reporting graph outcomes: packets waiting on busy nodes no longer reserve otherwise idle CPU lanes in advance.

Material limitations remain:

- Tasks and labels are synthetic; the prevalence and difficulty of real conflicts are unknown.
- Routing and compatible grouping are optimistic known-structure controls.
- The learning study uses a fixed optimizer and update budget, not per-architecture tuning.
- Shared encoders, adapters, attention, recurrent memory and very long sequences are not simulated.
- The representation study tests coordinate preservation, not perception.
- Translation is linear and low-dimensional; arbitrary learned spaces can be much harder.
- Boundary validation uses simulated authenticated identities and a specified corruption mixture.
- The graph study omits model loading, batching, KV caches, graph maintenance and accuracy benefits from collaboration.
- Biological mechanisms motivate experiments but do not validate software analogies.
- No model-size optimum, endless learning, zero contamination or frontier-level performance has been established.

## Primary sources

### Biological mechanisms

- **B1.** Girardeau et al. (2009), *Selective suppression of hippocampal ripples impairs spatial memory*. [Author-hosted paper](https://buzsakilab.com/content/PDFs/Girardeau2009NatNeurosci.pdf).
- **B2.** Boyce et al. (2016), *Causal evidence for the role of REM sleep theta rhythm in contextual memory consolidation*. [PubMed / Science](https://pubmed.ncbi.nlm.nih.gov/27174984/).
- **B3.** de Vivo et al. (2017), *Ultrastructural evidence for synaptic scaling across the wake/sleep cycle*. [PubMed / Science](https://pubmed.ncbi.nlm.nih.gov/28154076/).
- **B4.** Hauglund et al. (2025), *Norepinephrine-mediated slow vasomotion drives glymphatic clearance during sleep*. [PubMed / Cell](https://pubmed.ncbi.nlm.nih.gov/39788123/).
- **B5.** Miao et al. (2024), *Brain clearance is reduced during sleep and anesthesia*. [PubMed / Nature Neuroscience](https://pubmed.ncbi.nlm.nih.gov/38741022/).
- **B6.** Borovikova et al. (2000), *Vagus nerve stimulation attenuates the systemic inflammatory response to endotoxin*. [Nature](https://www.nature.com/articles/35013070).
- **B7.** Smith et al. (2013), *The microbial metabolites, short chain fatty acids, regulate colonic Treg cell homeostasis*. [Author manuscript](https://pmc.ncbi.nlm.nih.gov/articles/PMC3807819/).

### Numerical and learned communication

- **C1.** Meta, [DINOv3 official code and checkpoints](https://github.com/facebookresearch/dinov3). ViT-S/16 is listed at 21M parameters; custom DINOv3 terms apply.
- **C2.** Meta, [V-JEPA 2 / 2.1 official code and checkpoints](https://github.com/facebookresearch/vjepa2). The V-JEPA 2.1 ViT-B/16 encoder is listed at 80M.
- **C3.** OpenAI, [CLIP official research code](https://github.com/openai/CLIP). Explicit image and text feature interfaces.
- **C4.** Meta, [SONAR](https://github.com/facebookresearch/SONAR). Matched speech/text embedding and decoding research; not a universal protocol.
- **C5.** Meta, [EGG](https://github.com/facebookresearch/EGG). Learned discrete/continuous communication games; archived August 10, 2026, so use as research scaffolding.

### Candidate model family and hardware

- **M1.** Qwen, [Qwen3-0.6B official model card](https://huggingface.co/Qwen/Qwen3-0.6B).
- **M2.** Qwen, [Qwen3-1.7B official model card](https://huggingface.co/Qwen/Qwen3-1.7B).
- **M3.** Qwen, [Qwen3-4B official model card](https://huggingface.co/Qwen/Qwen3-4B).
- **H1.** NVIDIA, [GeForce RTX 5070 family specifications](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/).

Repository availability and these source statements were checked for this research. Research code, pretrained weights, and downstream use can carry different licenses. The experiment bundle contains our simulation code and source links; it does not redistribute third-party model weights.

