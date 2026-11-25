# Admission authority (Gate C4)

`scripts/hive_admission.py` is the only code that can mint, revoke or roll back an admitted capability. It re-checks a
CANDIDATE_PASSED discovery experiment read-only, re-runs the independent evaluator in its own `python -I` process, then signs a
`hive-capability-admission-v1` statement with OpenSSH (`ssh-keygen -Y sign -n hive-admission`) and writes statement + event in one
transaction to the chain `operator/capreg/<cap_id>`. Failed checks append an unsigned `rejected` event and exit non-zero.

The runtime (`src/hive/capability_registry.py`) holds only the public key (`configs/admission_signers`). On every use it re-verifies
the signature of every admit/revoke/rollback event, the hash links, the body hash, the harness hash, the evaluator pin and the pinned
image digest; any failure refuses the capability and nothing runs.

**What the key protects.** Candidate code, model output and the ordinary runtime writer cannot create an eligible capability: an
event written without the key (unsigned, wrong key, altered statement or signers file) fails verification. A crash between the
statement artifact and the event leaves no eligible version.

**What it does not protect.** The private key (default `%USERPROFILE%/.hive-admission/admission_ed25519`, never inside the repo or
store; `init` refuses a repo path) is an unencrypted file: anything running as the same Windows user can read it and sign. An
administrator controls the key, the repo (including `configs/admission_signers`) and the store. A forged chain makes the capability
unusable (fail-closed denial of service), not usable.
