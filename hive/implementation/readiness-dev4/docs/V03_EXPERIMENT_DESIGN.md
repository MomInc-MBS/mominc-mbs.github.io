# HIVE v0.3 E1 experimental design — draft

Current readiness integration: the executable pressure fixtures and real
development adapter are infrastructure, not execution of this E1/E2 study.
`../experiments/plans/readiness-level-b.json` records the unapproved handoff.
The source inventory, final sample size, independent evaluator, aggregate model
allocation and chronological waves still need their own freeze and authorization.
The mathematical gates below remain unchanged; Level B is UNTESTED.

Prepared 2026-11-21 by Sol against `D:/Repos/hive-ai`, branch `build/v0.3`,
parent `eeec514` (v0.2.1). The executable source identity must be pinned again
after implementation. Companion machine-readable plan:
`experiments/plans/v03-e1-design.json`. No gold was authored or inspected, no
holdout was consumed, and no model inference was used to prepare this design.

**Status: draft, not a frozen preregistration and not an authorized mission.**
Independent sourcing, evaluator calibration, E0, mathematical/adversarial review,
and explicit new caps remain prerequisites. The existing six synthetic families
and past v0.2.0 measurements are regression/history only. E1 cannot establish E2
chronological compounding, weight learning, or production eligibility.

## Question and bounded intervention

Can a router trained only on independently verified development outcomes improve
family-balanced quality over **every** applicable strong fixed control on new
source families, while rejecting a known incorrect tool result? Change routing
alone. Freeze the model digest, weights, prompts, tool implementations, checker,
resource access, and learner version. A positive result supports this scoped
router intervention; it does not establish broad intelligence or repeated learning.

Use one development-trained greedy router, not a tournament selected on holdout.
Its features must be public task properties that work on unfamiliar sources.
Unseen family IDs cannot become answer lookups. A fallback for unsupported public
contexts must be fixed before evaluation. Record development collection and
training costs as well as evaluation costs. Frozen B4 controls for the same
capabilities without feedback-driven updating; beating B1 alone is insufficient.

## Workload and independent source families

Start with three bounded, read-only domains that can fit the current 2,048-token
context and 128-token structured answer limit. These are proposed workloads,
not a claim that sourced fixtures or suitable evaluators already exist.

| Domain | Candidate authentic unit | Strong fixed workflows reviewers must challenge |
| --- | --- | --- |
| Caption/metadata diagnosis | Independently produced short caption segment plus permitted reference transcript and metadata; output finite edit/diagnosis IDs | SRT parser, timestamp/metadata checks, deterministic transcript alignment, fixed model plus cross-check |
| Evidence conflict/absence | Bounded archived source packet with dated, conflicting, missing, or paraphrased claims; output cited source IDs or supported abstention | Deterministic extraction/date/provenance rules, retrieval and independent comparison, fixed model plus evidence checker |
| Dependency constraints | Independently sourced small workflow/configuration with executable finite constraints; output valid action/ordering or abstention | Exact graph/constraint solver, fixed tools plus model interpretation |

No benchmark may be made impossible for B0 to manufacture a model advantage.
Include cases tools solve and cases with authentic contextual judgment; record
which tool capability is absent on the latter. If exact solvers saturate the
third domain, retain that result. Video perception and arbitrary patch execution
are excluded here. Real-repository repair requires an independently verified
sandbox before a later mission; new-rule generators and specialist coordination
remain separately justified subsequent hypotheses, not six relabeled constants.

`family_id` means an independently sourced process cluster, not one example or a
broad domain label. Shared repository ancestry, publisher/corpus, creator/series,
generation process, or duplicated templates force cases into the same cluster.
If two nominal families share a material ancestor, merge them before counting
sample size. One source supplying hundreds of files still supplies one independent
cluster. Split whole source clusters, not tasks, and deduplicate genealogy across
development, validation, diagnostic pilot, confirmatory holdout, and future waves.
The independent curator must attest source independence; a schema cannot prove it.

For the powered proposal, each source contributes four tasks: two factual issues,
each with a clean tool result and a predeclared false/stale-result variant. Thus
half the evaluation is an intentionally adverse tool condition. This is a **50%
incorrect-tool stress population**, not an estimate of ordinary deployment error
frequency. Related clean/corrupt variants stay in the same cluster and split.
Do not count variants as new sources. Report clean/corrupt results separately;
their differences are descriptive unless separately powered and preregistered.

The independent evaluator defines the acceptable answers, supported abstentions,
critical faults, ambiguity handling, and verifier version before freeze. For
semantic evidence/edits, two independent labels and a predeclared adjudicator
must establish rubric validity without candidate assistance. Ambiguous items
are excluded or assigned accepted-answer sets **before** seeing arm outputs.
If trustworthy reference judgments are unavailable, omit the lane before freeze
and redo the target population and sizing; do not silently award a guessed gold.

## Controls and fair execution

| Arm | Definition | Per-task model-call cap |
| --- | --- | ---: |
| B0 | Strongest applicable deterministic-only workflow, with independently challenged domain-specific rules and cross-checks | 0 |
| B1 | Direct frozen local model given admissible task evidence, without tools | 1 |
| B2 | Strongest fixed single-model-plus-tools pipeline; preserve reliable fallback/verification instead of making it naively trust tools | 1 |
| B4 | No-learning fixed selector over the same B0/B1/B2 capability menu and public features as C1 | 0–1 |
| C1 | Greedy development-trained selector over that same menu, frozen before evaluation | 0–1 |

B0/B2/B4 are specified and challenged on development; B4 may be a strong fixed
per-domain heuristic rather than a deliberately poor constant. Freeze all
artifacts before validation. Validation may diagnose/select a final version, but
then is acknowledged as selection data, never heldout proof. Any revised candidate
gets a new immutable hash before the untouched confirmatory panel opens. Pilot
uses one candidate without a validation selection round. B3 is deferred because
this experiment changes routing alone and the tasks have no established need for
multiple specialists. If reviewers identify such a need, design a separately
capped B3 study rather than dropping a relevant strong control mid-experiment.

The minimal campaign materializes B0, B1, B2 once on every task. Before any route
outputs are exposed, C1 and B4 commit their route choice using only admissible
public input. Their result is the selected route's immutable outcome. This is
paired **counterfactual route replay**, not five independently executed agents.
Common route outputs reduce duplicate inference without inventing five sets of
independent observations. Development route outcomes can train C1; evaluation
outcomes remain private. Prohibit output-aware rerouting, cross-arm messages,
shared learned caches, updates during evaluation, or cherry-picked route outputs.

Use the same fixed seed per task/route, one repeat, temperature zero, same model
digest, and randomized balanced primitive-route execution order. A deterministic
seed is not proof of backend determinism. One repeat cannot establish stochastic
stability; do not multiply n by token samples, route calls, or replayed arms.

All arms see the same task, permitted reference packet, and planted tool-result
condition. B0/B2 may obtain the same reliable independent cross-check provided in
their declared workflow; C1 gains no exclusive tool. B1's lack of tool use is its
declared comparison condition. Check source packet lengths before freeze; no
silent truncation or larger context/output cap for an arm. No external side effects.

Report actual total research calls/tokens/active time and per-primitive measured
costs. Report selected-route cost sums as **counterfactual execution cost**, with
common setup charged consistently. Replay does not measure standalone B4/C1 end
to end latency or a live-policy speedup; that requires a separately capped fresh
execution study on new tasks. No hidden reruns/retries for attractive answers.

## Smallest honest pilot

First do a zero-inference registry/verifier/accounting dry run using clearly
labeled synthetic integration fixtures. Those tests are not independently sourced
research observations. Then, only after authorization, collect **three development
source families and three separate diagnostic families**, one of each per domain.
Each supplies two within-family clean/incorrect-tool variants: 12 tasks total.
The diagnostic panel is one-use and is never recycled into confirmatory evidence.

At most 24 model requests, 3,072 reserved generated tokens, one inference at once,
zero retries, 60 seconds/request, 1,512 active seconds, 1,800 elapsed seconds, and
64 MiB artifacts. Active bound is `24*60 + 12*6`; six non-inference seconds/task
cover bounded common preprocessing, deterministic route and tool cross-check.
These are proposed numeric caps, **not inherited authority**. Runtime accounting
must include all active overhead, or the calculation/caps must be revised before
authorization. Estimated typical time is 132 seconds only under the unmeasured
assumption of five seconds/model request plus one other second/task.

Pilot checks: source disjointness, irreversible exposure, gold/view separation,
digest/source pinning, valid paired joins, correct actual/reserved cost accounting,
STOP/restart without duplicate consumption, known-good verifier accept and
known-false verifier reject, and C1/B2/B0 behavior on incorrect tool results.
Any C1 false acceptance is a critical candidate failure. Repair only using exposed
development/diagnostic material; use new independent sources for subsequent proof.
Three diagnostic clusters provide **no precision or superiority claim** and no
credible ICC estimate. The pilot may find infeasibility, not validate 15-point gains.

## Confirmatory estimand, uncertainty and decisions

For source family f, task i, fixed control j:

`d_fij = pass(C1,f,i) - pass(j,f,i)`; `dbar_fj = mean_i(d_fij)`.

Primary `Delta_j = mean_f(dbar_fj)` with equal source-family weight. Three domains
have equal numbers of independently sampled source families. Report all four
paired differences, source-level and per-domain win/loss/tie counts, all raw pass
denominators, supported abstentions, critical failures, reliability/calibration,
and costs. The strongest-control target is `min_j Delta_j`, equivalently C1 mean
quality minus the largest fixed-arm mean on this target distribution. There is no
posthoc choice of a weak comparator and no per-task oracle baseline.

For each of B0/B1/B2/B4 use the one-sided bound
`L_j = Delta_hat_j - t(.9875,F-1)*sd(dbar_fj)/sqrt(F)`.
Bonferroni controls four comparisons at familywise alpha .05 under the approximate
family-mean t analysis. All four bounds must exceed the preregistered **.02 absolute
quality margin**. The t bound is an independent-cluster large-sample approximation,
not an exact distribution-free guarantee for bounded cluster means. Source
independence and enough clusters matter; extra templates cannot repair its failure.
Report seeded 10,000-resample source-cluster bootstrap sensitivity within domain,
resampling complete task/arm blocks. That secondary interval cannot rescue a failed
primary gate. No task-level bootstrap and no candidate-selection peeking on holdout.

Missing model outputs, timeout, malformed JSON, and bounded route failures count
as zero pass, with their costs and causes, for every scheduled pair; do not exclude
hard tasks. Evaluator corruption or ambiguous gold invalidates affected evidence
and triggers quarantine, rather than coding evaluator failure as model failure.
A budget stop before the full panel finishes is incomplete/inconclusive; never
make an early superiority claim. No optional sample-size extension after outcomes.

* **PASS (experimental):** valid complete panel, all four L_j > .02, zero C1
  critical false accepts/regressions, intact ledger/identity and all caps respected.
* **REJECT:** valid complete panel with any Delta_hat_j <= 0, or any verified C1
  critical regression/acceptance of known false tool output. Retain fixed incumbent.
* **INCONCLUSIVE:** positive point estimates without all bounds > .02, insufficient
  independent sources, inadequate headroom or a budget-stopped panel.
* **INVALID:** integrity/evaluator/provenance failure; quarantine affected scores
  and preregister a new valid study. This is not evidence of quality inferiority.

Wrong-tool acceptance includes presenting a planted false/stale tool answer as
supported or following instructions embedded in tool output. Predeclare cases
where correct behavior is repair vs abstention. False accepts and false rejects
are reported separately. Zero observed critical events is a gate, not zero risk:
report source-level uncertainty because multiple corrupt variants are correlated.
If no source has a failure in F independent clusters, the one-sided 95% upper
bound on probability of a failing source is `1-.05**(1/F)` (under exchangeable
independent-source assumptions), not a per-task risk bound.

## Sizing calculation and limits

The numbers below are **planning scenarios**, not empirical estimates. Assume
paired task difference variance `q-delta^2`, where q is probability of discordant
C1/control outcomes; paired-difference intracluster correlation rho; m=4 tasks/source.
Then `V_cluster = (q-delta^2)*(rho+(1-rho)/m)`. This is ICC of the **difference**,
not each arm's raw accuracy. Plan effect delta=.15 against **each** control and
margin=.02. A 15-point improvement is impossible if the strongest baseline is
above .85; pilot/development feasibility must challenge this assumption. In that
case do not run this powered proposal under a fictional effect; commission a
new effect/margin calculation or different question before opening new holdout.

Use approximate .95 power for each of four comparisons, so the union bound gives
at least .80 joint power without assuming comparison independence. Solve:

`(.15-.02)*sqrt(F/V_cluster) >= t(.9875,F-1) + NormalQuantile(.95)`.

This uses a normal alternative with Student-t critical value; it is an approximate
prospective calculation. Independent math review must assess distribution shape,
heterogeneity, the assumed effect and ICC, and whether simulation or a conservative
design is necessary. Cluster counts are rounded up to multiples of three domains.

| Assumed discordance q | Assumed paired ICC | V_cluster | Independent holdout sources F | Holdout tasks | Approx. simultaneous bound half-width | Approx. marginal power | Approx. joint lower bound |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| .25 | .05 | .06540625 | 63 | 252 | .07402 | .95885 | .83540 |
| .35 | .15 | .11871875 | 108 | 432 | .07537 | .95028 | .80113 |
| .50 | .35 | .24471875 | 222 | 888 | .07493 | .95141 | .80565 |

These source counts may be impractical: a collection of 108 files from three
generators does not meet the central proposal. Until an independently reviewed
inventory exists, **there is no final sample size or confirmatory authorization**.
Do not cut F to fit an existing cap and retain a powered label. A smaller budget
can fund another explicitly diagnostic study. The pilot is too small to estimate
rho reliably. Sizing may use development/calibration only, never exposed holdout.

### Review disposition — mathematical objections relayed by Astra

Astra relayed Nemotron's initial critique during design review. The following is
Sol's independently derived disposition, not a claim that the reviewer approved
the plan. Three mathematical objections do not justify changing this calculation:

1. **Joint power:** let A_j be failure to reject comparison j. If each comparison
   truly has power at least .95, `P(any A_j) <= sum_j P(A_j) <= 4*.05 = .20`.
   Therefore `P(all four succeed) >= .80`, without independence. The inequality is
   exact; the assumed marginal power is only a planning approximation here.
   Dependence cannot invalidate the union bound. It can affect how conservative
   the bound is and whether our approximate marginal-power assumptions hold.
2. **Paired variance:** for binary pass indicators, `D = Q_C1-Q_B` belongs to
   {-1,0,1}. Hence `D^2 = 1` exactly on discordant pairs, so `E[D^2]=q` and
   `Var(D)=q-(E[D])^2=q-delta^2`. This identity is exact. The uncertain quantities
   are the planning q, delta, within-source covariance and source sampling model;
   they must not be treated as empirical estimates.
3. **The superiority margin matters:** rejection requires a lower bound above
   .02, so planning signal is `.15-.02=.13`, not .15. Using `.15^2` in the
   denominator instead of `.13^2` understates required F by roughly the ratio
   `.15^2/.13^2 = 1.33136` before the t-critical correction. The executable
   calculation below solves the margin-aware equation and yields 108 clusters
   in the central scenario; a roughly 80-cluster calculation that drops the
   margin is for a different hypothesis.

The critique's **valid blockers remain open**: no independent source inventory
has been demonstrated; source genealogy and the fixed three-domain strata need
review; the paired ICC, discordance and 15-point effect are hypothetical; B0/B2
may leave insufficient improvement headroom; and the approximate power/t-bound
needs distributional and heterogeneity review. Reviewer disagreement is preserved
rather than treated as a vote. Nemotron mathematical review/disposition and
independent sourcing are still required before final preregistration or any
confirmatory mission. No large hypothetical budget is part of authorized scope.

This executable standard-library calculation produced the table (Python 3.11;
Simpson integration with 1,024 panels and 45 bisections; a numerical approximation):

```python
import math
from statistics import NormalDist

def tq(p, df):
    c = math.exp(math.lgamma((df + 1) / 2) - math.lgamma(df / 2)) / math.sqrt(df * math.pi)
    def cdf(x):
        n = 1024
        h = x / n
        def f(v):
            return c * (1 + v * v / df) ** (-(df + 1) / 2)
        return .5 + h / 3 * (f(0) + f(x) + sum(
            (4 if i % 2 else 2) * f(i * h) for i in range(1, n)))
    lo, hi = 0., 12.
    for _ in range(45):
        mid = (lo + hi) / 2
        if cdf(mid) < p:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

for q, rho in ((.25, .05), (.35, .15), (.50, .35)):
    v = (q - .15**2) * (rho + (1 - rho) / 4)
    lo, hi = 3, 1000
    while lo < hi:
        f = (lo + hi) // 2
        if .13 * math.sqrt(f / v) >= tq(.9875, f - 1) + NormalDist().inv_cdf(.95):
            hi = f
        else:
            lo = f + 1
    f = 3 * math.ceil(lo / 3)
    critical = tq(.9875, f - 1)
    power = NormalDist().cdf(.13 * math.sqrt(f / v) - critical)
    print(q, rho, f, 4*f, critical*math.sqrt(v/f), power, 1-4*(1-power))
```

## Explicit request, output-token and wall matrix

Powered proposal adds 12 development sources × 4 tasks = 48 tasks, and six separate
validation sources × 4 = 24. Each domain has four development and two validation
sources; these modest training counts do not guarantee a viable learner. Holdout
is 36 independent sources/domain in the central scenario. One repeat throughout.
All pilot sources are excluded. B0/B1/B2 are each materialized once per task;
B4/C1 replay those outcomes, so the maximum is **two**, not four, model calls/task.

| Stage/scenario | Tasks | Model calls cap | Reserved generated tokens (128/call) | Active seconds cap (126/task) | Typical seconds estimate (11/task) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pilot development | 6 | 12 | 1,536 | 756 | 66 |
| Pilot diagnostic | 6 | 12 | 1,536 | 756 | 66 |
| Powered development | 48 | 96 | 12,288 | 6,048 | 528 |
| Powered validation | 24 | 48 | 6,144 | 3,024 | 264 |
| Central holdout | 432 | 864 | 110,592 | 54,432 | 4,752 |
| Central whole study | 504 | 1,008 | 129,024 | 63,504 | 5,544 |
| Optimistic whole study | 324 | 648 | 82,944 | 40,824 | 3,564 |
| Conservative whole study | 960 | 1,920 | 245,760 | 120,960 | 10,560 |

`126/task = 2*60 model timeout seconds + 6 bounded non-model active seconds`.
Model response generation reserve is an upper bound, not observed tokens.
Record prompt tokens separately if available; the token cap above covers generated
tokens only. Typical time assumes five seconds/request and one other second/task,
**not a hardware measurement**. E0/pilot timing can revise estimates before freeze.
The central study proposes 72,000 elapsed seconds and 256 MiB artifacts, concurrency
one, zero retries. Its 63,504 active seconds are about 17.64 hours; the typical
estimate is about 92.4 minutes. No background inference is authorized by this draft.

If both pilot and central study are newly authorized, their combined ceiling is
1,032 requests / 132,096 reserved generated tokens / 65,016 active seconds,
**plus E0's separately authorized and reconciled spending**. Every store must debit
the same aggregate mission ledger. Separate dev/validation/holdout stores do not
reset caps. Alternative sensitivity rows are separate proposed envelopes, not
permission to increase the central one. All caps, source/config/model/evaluator
hashes, actual/requested repeats and run schedule must be frozen and approved.

## One-use provenance and release boundary

Required registry fields: `task_id`, `family_id`, `generator_or_source_id`, `split`,
`creation_time`, `fixture_hash`, `gold_verifier_version`, `exposure_status`, `consumed_at`.
Retain private genealogy and curator attestations. `creation_time` is the canonical
registry field, matching the directive.
The public worker view contains only task instructions, bounded source inputs,
allowed tools/schemas and admissible features. It excludes gold, labels, split,
critical flags, private source identifiers, and per-case evaluator diagnostics.
The independent evaluator owns gold and accepted-answer sets. Registry logic is a
trusted-process boundary, not a sandbox against host/Python/OS-owner access.

The current registry API returns a curator envelope containing metadata and a
nested `public` payload. The future campaign adapter must pass only that payload
to candidate workers. That adapter and a private evaluator execution service are
not yet integrated; this design states requirements, not completed interfaces.

Atomically reserve the entire declared panel and commit consumption **before** any
holdout task reaches a worker or route choice/output is exposed. Persist consumption
across crashes and stores. A failed/partial run burns exposed material; do not
replace hard tasks, reset IDs, delete ledgers, or call it fresh. Exact mission
recovery may reuse immutable cached outcomes under matching hashes and the same
reservation, but never obtains additional inference outside the cap. Deliberate
re-execution is repetition, not independent reproduction. Reuse only opaque
evaluator references in development-facing logs. Publish aggregate denominators,
provenance attestations, caps and artifact hashes, never sealed case answers or
per-case hints. Freeze a hash of the final plan before any confirmatory exposure.

No E1 PASS directly stages production. Independent review, later retention and
chronological E2 waves, rollback verification and explicit operator promotion
remain separate. E1's frozen B4 is a no-learning control, but a single train/test
comparison does not demonstrate accumulating learning across future waves.

## If the strongest deterministic baseline wins

Retain B0 as incumbent and publish every arm, including C1's losses and costs.
Do not call improvement over direct B1 a learning capability if B0/B2 is better.
Use already exposed development/diagnostic evidence to identify an authentic
unmet capability. The next hypothesis must be either (a) a genuinely new,
independently sourced contextual workload, or (b) lower cost with a predeclared
quality noninferiority margin against B0, separately powered and funded. A model
route cannot be presumed cheaper than zero-model deterministic work. Do not
modify, re-seal, or tune to the consumed holdout or add a larger model by default.

Every rejection/inconclusive result leaves `what_failed`, `reproduction`,
`suspected_cause`, an evaluator-private counterexample reference, `new_hypothesis`,
`owner`, `next_test`, finite `required_budget`, and `rollback_ref`. Owner Astra
queues the next authorized mission; exhausted caps stop execution, not the research
backlog. All claims remain version-specific and candidate state stays experimental
or quarantined until the independent gates are met.
