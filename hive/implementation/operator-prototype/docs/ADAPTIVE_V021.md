# Adaptive controller v0.2.1 — review fixes

The v0.2.0 real experiment and its source snapshot remain unchanged. The measured
30-call result belongs to runtime commit `3d5522a`, not this later revision.

Grok's independent code review found two restart defects. This revision checks
route-specific budgets before claiming work, so repeated request/token exhaustion
retains the exact PAUSED reason. It verifies each development result immediately;
model identity drift stops before the third call and records a persistent ERROR,
including failed environment observations with a known changed digest.

Additional fixes keep the worker lock through pause/error cleanup, disable
operational-policy feedback for experimental jobs even on process death, and
atomically record wall usage with clearing the in-flight reservation. The adaptive
router still trains separately from verified development artifacts.

The full suite passed **136 tests**, with one Windows symlink test skipped.
The 23 targeted synthetic recovery/adversarial tests and both CLI journeys passed.
Machine-readable full-suite results are in
`experiments/results/adaptive-v021-tests.xml`. No further model calls were used
for these fixes. The finite research result remains three direct-model passes,
five learned-router passes, a rejected four-pass alternative and six tool passes,
all out of six repeated validation tasks.

Resuming an old store under changed source fails closed. To verify the original
experiment, use its preserved v0.2.0 snapshot. New experiments use this revision
and a separately recorded aggregate budget. Resource exhaustion is allowed to
stop a schedule: tool results alone cannot replace missing paired local evidence.

The full Grok review and dispositions are recorded in
`experiments/results/adaptive-grok-review.json`; NVIDIA's earlier mathematical
review is also retained. Neither review is counted as an executed experiment.
