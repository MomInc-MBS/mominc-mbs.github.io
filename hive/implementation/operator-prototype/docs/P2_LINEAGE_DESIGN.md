# P2 Genome and Lineage Store — one-page design (no code)

Status: PROPOSAL, 23 Nov 2026. D5 is decided: build on `Store` + `RunStates` + artifacts. No new database, no new registry.
D7–D11 are UNRESOLVED; anything that needs them is marked BLOCKED(owner). Nothing here is promotion authority.

## 1. Genome record
A candidate is one immutable JSON artifact, stored with `Store.put_artifact` (sha256-addressed, so its id IS its hash). Fields:
- `candidate_hash`: the artifact digest. Reuses the existing `experiment_compare` rule `sha({rule, provenance, parent})`, extended with the fields below.
- `parent_hashes`: list (empty for P0 root; more than one only if a multi-parent operator exists, per §5 tests). Today's single `parent_hash` becomes the first entry.
- `body_ref`: artifact ref to the rule/code/config text. Large prompts and logs stay out of the record.
- `operator`: `{class, improver_version, settings_ref}`. The class must be on a versioned allow-list. Allow-list contents: BLOCKED(Ian: D7–D11 define mutation scope).
- `evaluator_sha256`: the frozen evaluator hash it was scored under (same value as `evaluator_sha256` in the compare receipt).
- `provenance`: task family, diagnosis hash, budget, run_id.
Scores, safety result and lifecycle state are NOT in the genome. They are evidence and events (§2), because the genome must never change.

## 2. Lineage edges on existing tables
- Genome = artifact file. Edge = one small artifact `{child, parent, operator}`. Ancestry is just the `parent_hashes` list, so edges need no new table.
- Index: `Store.kv` keys `lineage/genome/<hash>` -> artifact ref, and `lineage/children/<parent>` -> sorted child hashes (rebuildable; the artifacts are the truth).
- Lifecycle: one `RunStates` run per candidate, `run_id = candidate_hash`. Existing states map: ADMITTED=archived, RUNNING/CHECKPOINTED/VERIFYING=under evaluation, ACCEPTED=eligible, REJECTED/FAILED=retained evidence. Payloads carry `evidence_refs` and the score vector.
- Quarantined and promoted are two states the machine lacks. The first slice adds `quarantined` as a payload flag on ADMITTED (default true). `promoted` is deliberately not created (§4).
- Evaluation jobs use `jobs`/`claim` (owner, generation) so a stale worker cannot write a result.

## 3. Immutability and replay
- Writes are append-only: `put_artifact` never overwrites, and `read_artifact` re-hashes on read.
- `run_events` is hash-chained per run and gapless.
- `verify_lineage(hash)` walks parents to the root and checks: every artifact re-hashes; every `candidate_hash` recomputes from its fields; each child's parents exist; the root is P0; each run's event chain verifies; and the recorded `evaluator_sha256` matches a known frozen evaluator.
- Replay: re-run the candidate with the same body/seed under the recorded evaluator and compare `result_sha256`. Exact match where deterministic; otherwise a stated tolerance (§6 requires nondeterminism to be documented). Rebuilding the kv index from artifacts must give the same index.

## 4. Isolation and quarantine
- FR-2 is lifted: candidates run via `run_isolated` (a separate `python -I` process). The score is computed in the parent.
- FR-8 is OPEN (same user, full filesystem and network, job assigned after `Popen`). It must be lifted before any generated or code candidate runs. Owner: Ian to approve a sandbox approach (restricted token or container, suspended start). Until then the store accepts only data-rule candidates, like the existing `scrub_lowercase`.
- No code path in this module sets production state. "Promoted" exists only as an owner-written review record outside the mutable boundary. P0 stays incumbent. Failed candidates are kept, never auto-reused.
- Candidates and the improver cannot write the store: the parent process owns all writes.

## 5. What P3 and P4 need
- P3: lookup by task family and operator class; `children_of`, `ancestors_of`; evidence refs it can attach discoveries to; retrieval returns hashes, not blobs.
- P4: the preregistered arm config (control = frozen P0, evolutionary arm) as a stored artifact; the score vector per candidate; the evaluator hash; the "never promoted from one positive result" rule. The stricter promotion contract is BLOCKED(Ian).
- D2 (DGM + MAP-Elites) niche or behaviour descriptors are not in the slice. Add them as an optional field later, with no schema change.

## 6. First code slice
New: `src/hive/lineage.py` (about 120 lines: `register`, `get`, `children_of`, `ancestors_of`, `record_result`, `verify_lineage`). New: `tests/test_lineage.py`.
Touch: `src/hive/experiment_compare.py` only to call `register` for the candidates it already builds (one small hook; extending `candidate_hash` inputs is a hash-schema change, so record why). Do not modify `storage.py` or `run_state.py`.
Tests:
- persistence across a Store reopen
- failed candidate retained and queryable
- multi-parent provenance
- forbidden operator class rejected
- a tampered artifact makes `verify_lineage` fail
- kv index rebuild equals the original
- no promoted state reachable
- compare receipt unchanged for the existing candidate (migration compatibility)
Budget: tool-only, 0 model calls.

## 7. Open questions for Ian
1. D7–D11 definitions: the master doc is authoritative. Which mutation classes does D7–D11 allow? BLOCKED(Ian).


Conductor decisions (23 Nov, technical, not owner questions):
- One candidate = one run (`run_id = candidate_hash`); a campaign is a tag in provenance.
- FR-8 sandbox: try the smallest stdlib route first (Windows restricted token + low-integrity level + suspended-start job assignment); fall back to a container only if that can't block writes outside the temp dir and network. Decided at FR-8 time, before any generated/code candidate.
