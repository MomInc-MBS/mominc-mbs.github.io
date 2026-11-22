# Prototype acceptance inventory

## Current test-readiness campaign extension

The 21 November one-shot directive adds a distinct R1–R8 engineering readiness
gate. See `TEST_READINESS_DIRECTIVE.md` and the reproducible
`../build/readiness-report.json`; historical counts below retain their original
scope. Synthetic executable pressure fixtures establish neither Level A nor B.

Level A now explicitly requires six independent approved unused video sources
and six independent code repository snapshots (12 tasks, at least 10 independently
accepted). Operator-pending media remains unaccepted. The unapproved inventory
shell is `../experiments/plans/readiness-level-a.json`; it contains no fabricated
tasks or acceptance total. The B shell is `../experiments/plans/readiness-level-b.json`.
No new inference budget, model-weight training or production promotion is granted.

The code mission's narrow objective protocol must keep expected answers outside
the isolated worker and independently check returned values. A container exit
code or printed claim that tests passed cannot certify correctness. Arbitrary
repository test execution without an independent objective protocol is unconfirmed.

## Historical inventory

Decision dated 2026-11-21: **engineering alpha; Level A and Level B not accepted**.
Audit target: `D:\Repos\hive-ai`, branch `build/working-prototype`, starting
commit `caf9ace`. Current release identity and executed checks belong in
`CURRENT_STATE.md`; this inventory is not a test receipt or operator sign-off.
The supplied Working Prototype Build Plan defines the gates below. No private
holdout was read or consumed in preparing this inventory.

## Evidence boundaries

`V03_FOUNDATION.md` records 217 passed / one skipped at its historical checkpoint.
E0 used pinned v0.2.1 source, 30 calls and historical synthetic families; its
status observability defect remains recorded. Neither result certifies new code.
The fixed deterministic tool won E0 (6/6); retain it as the strongest applicable
control. No adaptive advantage, broad learning or deployed policy is established.
New checks and real-task receipts must name the frozen runtime source hash,
model digest, configuration, verifier, policy and artifact hashes.

The overseer's baseline rerun reports **217 passed / one skipped in 84.82s**
at `experiments/results/prototype-wp0-baseline-tests.xml`. The live manifest was
verified at `caf9ace`, runtime source SHA-256
`024e33a80265718014a42d2a8d4609663ed74f327a36043b18285810d67c2731`.
This receipt precedes the new video edits. WP0 inference uses the pinned archive;
changed video source needs its own frozen receipt and operator-selected input.

Current engineering candidate: **234 passed / 2 Windows symlink skips; 3 CLI journeys passed**. The video transport and media inputs in those checks are synthetic. Neither is a qualifying genuine A2 task.

## Level A: all six gates required

| Gate | Existing foundation | Missing acceptance evidence |
|---|---|---|
| A1 fresh offline launch and doctor | Documented CLI, local adapter and doctor | Current clean-checkout launch; exact source/model/tool/permissions report |
| A2 genuine tasks | Historical finite synthetic tasks only | **12 genuine previously unused operator-approved tasks, >=2 types including video and isolated code/test; >=10 objectively correct/accepted outputs** through one controller. Report attempted, verified, failed, abstained and blocked separately |
| A3 meaningful routing | Tool/model routes and policy selection exist | Current real model and deterministic tool traces; at least one choice changes because of an actual observed outcome |
| A4 faults | Synthetic recovery, STOP/budget, evidence and checkpoint controls | Current integrated matrix: two clean restarts, STOP/budget, wrong tool output, failed candidate; zero duplicate irreversible effects, unauthorized actions or false-passed corruption |
| A5 verified learning | Development-only `Policy.observe`, snapshots, approved checkpoint restore and fail-closed review gate | Real development observation changes version/preference; persisted second-process reload and restore; source/split attached to every update |
| A6 operator reproduction | Existing CLI and evidence exports | New operator follows demo without reading source; sees output, failures, costs, hashes, restore and next work |

A2 tasks require a frozen inventory with operator approval, source group,
input digest, unused/exposure state, task type, split, predeclared success
criteria and reviewer. Repackaging one recording into many cues does not create
independent sources. Synthetic fixtures and the WP0 smoke do not automatically
count. Until the inventory is frozen, no qualifying A2 total is asserted here.

## Work packages and exit inventory

| Package | Status at this audit | Concrete remaining exit evidence |
|---|---|---|
| WP0 audit | Passed | Current public/local source matched; 217 passed/1 skipped; fresh pinned-source smoke passed (1 call, 8 generated tokens), STOP prevented dispatch and new-process review used zero calls. See `prototype-wp0-smoke.json` |
| WP1 real vertical slice | Real excerpt objectively verified; editorial acceptance pending | One real batch/two objective jobs and zero-call replay recorded; operator must still accept usefulness |
| WP2 recovery | Synthetic faults and real STOP/resume/replay pass; full A matrix pending | Fault matrix and reconciled usage on current mission, including unknown-effect reconciliation |
| WP3 feedback | Real development feedback and reload pass; actual later-route/restore demonstration pending | Development-only verified route change, candidate parent/hash, restart persistence, rejected regressor and restore evidence |
| WP4 multi-family | Not accepted | Video, isolated code/test and retrieval/source-validation through the same controller; actual sandbox boundary and independent objective checks |
| WP5 research | Not run | Frozen independent source inventory, strongest fixed controls, paired uncertainty/costs, learning-off and second chronological wave |
| WP6 release | Not accepted | Clean candidate archive demo passes; operator editorial acceptance/full A gates pending; final publication manifest records package |

## Clip feedback and the cheapest meaningful learning demonstration

Independent checks of cue IDs, source timestamps, bounds, evidence text and
artifact hashes can support a **structural-validity** development reward. They
cannot establish an engaging clip, a preserved joke, or a useful edit. Record
`structural_verification` and `editorial_review` separately. A clip-selection task
whose declared objective includes editorial usefulness remains pending until
the operator accepts it; structural success alone must not pass that criterion.

Use an isolated experimental policy/store for the smallest WP3 demonstration:
snapshot the parent; execute a genuine approved development caption/tool task;
derive binary feedback from the independent checker; record source/split and
policy hash; update an eligible greedy routing bucket so its next preference
changes from the measured outcome; reload the saved version in a fresh process;
restore the parent and confirm its hash/preference. Two routes must actually be
eligible; do not invent a failed model observation or hard-code the next route.
If no observed outcome changes the preference, report that and collect another
authorized development example rather than fabricating a learning event.

Inject a deliberately bad **development-only** candidate and show quarantine or
rejection with the incumbent unchanged. Restore experimental snapshots without
marking them production-approved. `Checkpoints` accepts only explicitly approved
checkpoints for promotion/rollback; `review_gate.evaluate` additionally requires
independent evidence and >=24 matched holdout tasks with strict quality gain.
Do not set its flags to true as a demo shortcut. Synthetic approved-checkpoint
tests prove mechanics, not a real production promotion or Level B result.

## Level B: pending separately

B1 requires frozen immutable sources, one-use holdout, an independent evaluator
and negative controls. B2 requires the strongest applicable fixed baseline,
source-family paired uncertainty, actual costs and the preregistered gain.
B3 requires two chronologically new waves plus retention/learning-off evidence.
B4 requires actual Grok and Nemotron reviews or documented independent
replacements. B5 requires tested candidate/incumbent restore paths and explicit
operator default-policy approval. None is waived by Level A.

The existing gate implements strict quality improvement; the plan's alternative
efficiency-under-quality-noninferiority estimand would need a separately reviewed
gate change before that claim is evaluated. Do not silently reinterpret it.
If tools remain strongest, keep them and record adaptive benefit as failed or
inconclusive. No production policy promotion is authorized by this document.
