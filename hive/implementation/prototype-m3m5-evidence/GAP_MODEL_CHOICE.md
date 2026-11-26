# Open gap: HIVE should choose its own proposer model (owner note, 26 Nov 2026)

Owner (the owner), 26 Nov 2026: "Make a note that model choosing should be in hives capabilities and this gap needs to be filled".

## What happened
During the prototype demo the conductor picked proposer backends by hand:
- local `openai/gpt-oss-20b` failed `site.ref-extract` and `site.ref-resolve`;
- local `qwen/qwen3.8-27b` was too slow on this GPU (over 10 min per answer);
- hosted `moonshotai/kimi-k3.1-pro` timed out at 240 s per call;
- hosted `nvidia/nemotron-3.5-super-vl-120b-a12b` (thinking off) answered in about 15 s.

HIVE has the pieces but does not make this decision itself:
- a backend list and qualification;
- the spend gate;
- per-capability history (`cap_history`);
- receipts with latency and calls.

## Gap to fill (next milestone)
- Model selection becomes a HIVE capability. For each gap or acquisition, rank the qualified backends from measured outcomes:
  - success per contract class;
  - dev/hidden pass rates;
  - latency and timeouts;
  - cost per admitted capability;
  - remaining budget.
- Escalate along that ranking within the owner's approvals, for example local first, then hosted when local fails or stalls.
- Record the choice and the reason in the experiment's frozen protocol.
- Rules:
  - outcomes stay numbers and enums, never instructions;
  - only qualified backends with active owner approvals are eligible;
  - the spend gate and caps are unchanged;
  - the choice is evaluated on the same frozen fixtures, so it cannot weaken admission.
- Evidence to reuse: demo stores `local-demo/s1`-`s6` (per-call latency, finish reasons, dev/hidden pass counts by model).
