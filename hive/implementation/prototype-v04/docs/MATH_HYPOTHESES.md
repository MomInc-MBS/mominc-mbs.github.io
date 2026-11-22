# Mathematical hypotheses and predeclared metrics v0.1

## v0.3 E1 sizing hypothesis

Source-family paired mean differences, four strong fixed controls, 0.02 superiority margin and simultaneous one-sided bounds are proposed in [the E1 draft](V03_EXPERIMENT_DESIGN.md). The 63/108/222-source sensitivity scenarios depend on unmeasured discordance and ICC; they are neither empirical power nor authorized budgets. No formula registry or compound-learning result is claimed.

## Implemented formulations

Utility version 1 is Q - E - .05 T/120 - .05 K/128 - .25 R.
Q, E and R lie in [0,1]; T is latency in seconds and K generated tokens.
References are fixed at the initial per-request ceilings, not observed maxima.
Weights are frozen defaults and must be recorded before comparisons; custom
weights require the complete named mapping. This is routing utility, not an
absolute intelligence score. Critical correctness overrides utility.

For each category and route, n counts valid development observations and s
verified binary passes. Beta(1,1) reliability mean is (s+1)/(n+2). Greedy chooses
its largest posterior mean; fixed picks its first feasible route; random uses
a seeded RNG. UCB chooses mean observed utility + sqrt(log(1+t)/(1+n)), lambda=1,
where t counts valid observations in that category. It samples unobserved routes
first, once each, in declared order. Category buckets assume comparable outcomes
within a category; they do not justify transfer across unrelated distributions.
No drift detector is implemented: new model/environment versions require fresh
policy state and must not silently reuse estimates.

Paired comparison uses the same task instances, mean difference, sample variance,
and 4,000 seeded percentile bootstrap resamples with a 95% interval. Effect size
is paired mean / sample standard deviation; zero variance returns null rather
than an infinite JSON number. A minimum of 24 pairs is an initial engineering
floor, not a power guarantee. Repeated peeking and synthetic task correlation
can invalidate nominal confidence. Locked holdouts must be used only at declared
checkpoints, refreshed after compromise, and never used to select tuning changes.

Promotion requires positive mean quality delta and CI lower > 0, independent
review, provenance, critical checks, no regression, budget adherence, fresh-process
reproduction and an ablation. Insufficient evidence quarantines. Equal or negative
improvement rejects; a high utility cannot rescue a failed gate.

## Predeclared next experiment

H1: Development-trained UCB routing improves verified held-out quality over fixed
local_direct under matched task/model/token ceilings. H0: no positive paired
quality improvement. Control: fixed local_direct; learning-off ablation: fixed
routing with the same tools available. Random and greedy are secondary baselines.
Train only on development, compare on restricted validation, then freeze candidate
before the locked holdout. Record negative results and costs. No result is claimed
by this document. Finite generated tasks and patch choices constrain generality.

Constrained optimization, lexicographic correctness-first ranking, Pareto fronts,
prior sensitivity and category-specific weights remain proposed experiments, not
implemented or proven improvements. Memory learning, workflow learning, specialist
training and verifier calibration need separate interventions and ablations.

## HIVE-011: descriptive alternative objectives (implemented)

`objective_analysis.compare_objectives` compares fixed utility, constrained
utility, correctness-first lexicographic ordering, and a Pareto frontier on valid
observations. Repeated observations are grouped by route; the four measurements
are arithmetic means. Invalid evaluations are excluded and counted. This analysis
neither updates policy nor grants promotion or statistical superiority.

Fixed descriptive constraints require every included observation to have zero
unsupported claims, latency <=120 seconds and tokens <=128. Among feasible routes,
select maximum default utility. These resource constraints alone do not guarantee
correctness; the independent promotion gate still governs acceptance. Lexicographic
ordering maximizes quality first, then minimizes unsupported rate, latency, tokens.
Pareto dominance maximizes quality and minimizes the other three measures, with
at least one strict improvement. Exact ties remain on the frontier; selected ties
resolve by sorted route ID. These definitions reveal tradeoffs without arbitrary
new gates. Means are only comparable when callers match task distributions and
budgets; different sample counts or missing evaluations can confound comparisons.

`prior_sensitivity` reports empirical pass fraction and Beta posterior means for
symmetric priors (.5,.5), (1,1), (2,2), given nonnegative verified binary counts.
With no observations the empirical fraction is null and each posterior mean .5.
These are observed pass reliability estimates under tested comparable conditions,
not probabilities that a particular unsupported claim is true. No heavy-tail claim
is made for binary quality, and identical evidence creates no requirement of
chance-level reviewer agreement. This module provides descriptive counterexamples;
real matched experiments remain necessary to claim a winning objective.
