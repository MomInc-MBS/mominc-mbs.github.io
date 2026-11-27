# P1 model routing (model-route-v1)

## Order per goal
1. Retained capability first, zero calls: `acquire_gap` returns ALREADY_RETAINED before any routing (unchanged; test added).
2. Explicit `--model <id>` (not "auto") is authoritative: no router call, `model_choice=None`, frozen protocol identical to the pre-router call shape (test compares the frozen core; acceptance set hash is random per experiment so it is excluded, exp_id differs only by that).
3. Omitted `--model` -> auto. `g3_qualify.py --model` argparse default flipped to `auto` (done after tests passed). Library callers passing `model=None` keep legacy behaviour.
4. `hive operator discover run` (no `discovery run` command exists; it is `discover run`): `--model` omitted -> backend frozen in that experiment's `model_choice` (`model_choice.frozen_route`), else incumbent gpt-oss. Legacy experiments unchanged.

## Receipt (choose())
`policy_version: "model-route-v1"`, `backend`, `reason`, `rank[{backend,reason}]`, `evidence_sha256`, `rejected[{backend,reason}]` (not_qualified | approval_refused | unknown_pins; from `eligible(cfg, rejected)`), `store_id` (store_uuid, passed by g3_qualify, null if unavailable).

## Fallback (auto only; never pinned)
`classify_failure(state, reason)` in model_choice.py (`classify` also returns a code):
| end | class |
|---|---|
| MODEL_UNAVAILABLE: transport_failure, MODEL_NOT_LOADED (unreachable/URLError/timeout/not loaded/not listed), CONTEXT_DOES_NOT_FIT, NO_EXECUTABLE_MODEL | retryable |
| any Refused/DataRefused/BudgetRefused, reply verification failed, weight/sha/integrity/loopback/endpoint refused | stop |
| STOPPED, BUDGET_EXHAUSTED, CANDIDATE_PASSED, PUBLIC_CANDIDATE_FROZEN, NO_QUALIFYING_CANDIDATE, unknown, empty | stop |
In `acquire_gap` and `_sealed_campaign`: a retryable end gives the NEXT slot (<=3 experiments total) the next ranked backend, once per goal, budget calls=1 proposals=1, same campaign/ledgers. Its protocol freezes `model_choice` copy with `backend`=alternate and `fallback_of {backend, class, reason_code}`; the attempt records `fallback {from,to,reason_code}`. Auto mode: a stop-class MODEL_UNAVAILABLE ends dispatching (no re-trying the refusing backend); a second retryable failure ends it too. Pinned: legacy loop untouched.
`_escalate` hint skips the original and the fallback backend.

## Tests
tests/test_model_route_default.py (39 cases: classify table, receipt/rejected, retained zero-call, omitted->auto, pin identity, fallback once, no second, stop-class x4 x sealed/non-sealed, pinned, last-ranked, frozen alternate, discover default).
`python -m pytest tests/test_model_route_default.py tests/test_g3_planner.py tests/test_g3_gate.py tests/test_g3_suites.py tests/test_discovery.py tests/test_p_cli.py tests/test_model_choice.py tests/test_sealed_final.py -q -p no:cacheprovider --basetemp D:/tmp/w3` -> `126 passed in 282.09s`
`tests/test_p_demo.py` -> `17 passed in 1.86s`

## Not implemented / limits
- Unusable reply format: discovery exposes no per-experiment signal for it; not implemented.
- A local alternate other than gpt-oss would freeze gpt-oss (discovery.py only freezes hosted ids) and a sealed run would refuse requested!=frozen; today only gpt-oss is a qualified local backend so it cannot occur. Not guarded (discovery.py read-only).
- Fallback tests script open/run_experiment (exact end states); no live or stub-endpoint dead-port run.
- Real default flip is argparse-only; `store_uuid` writes its kv row on first use.
