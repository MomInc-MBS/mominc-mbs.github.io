# Independent review: Operator Prototype (24 Nov 2026)

Reviewer: separate read-only Opus agent, given the code (commit 7fca25e) and the requirements, not the author's conclusions.
Verdict: **ACCEPT WITH FIXES**, no blockers.

Sound on inspection: trust anchor (policy pins genome hash covering body_ref and the self-hashed receipt; resolve() re-checks
every use; production_approved hard-coded false), oracle independence (stdlib only, python -I, pin checked first), path
handling (_under, reparse points refused), artifact download (output/ only, digest compared), PASS-only export, replay never
executes, constant-time token check, no innerHTML in the UI.

Should-fix findings, all fixed in f65d950:
1. Replay ignored revocation / pin / evaluator changes -> replay only while the saved capability is still eligible and the evaluator pin unchanged.
2. Failed verifications cached forever -> only VERIFIED/REJECTED replay.
3. Same genome with a new receipt could not be re-imported -> idempotency keyed on (genome, receipt_sha); resolve picks the pinned receipt.
4. Unverified output parsed before the verdict -> non-PASS builds a neutral "output withheld" summary, no parsing.
5. Verifier timeout uncaught -> UNVERIFIABLE.
6. No compare-and-swap on registry/counters/log -> BEGIN IMMEDIATE.
7. Readiness spawned git/docker on every poll -> cached 30 s.
8. STOP ignored during execution -> output discarded, nothing exported.
Nits fixed: download allowlist by task id (not newest 50), console refusals counted, CLI bounded read, bundle validated
before writes, rollback never rolls forward, recover() skips tasks owned by a live process, prior attempts kept on resubmission.
Evidence fixes: session tokens redacted, crash check requires INTERRUPTED, unsupported cases widened, end-to-end revoke journey added.
Stated, not changed: batch task identity includes file order (it fixes quarantine indexes); rollback here can only reach the
M2 baseline, so it acts as a disable; stale-pin/tamper/scope refusals are unit-tested, not live journeys.
