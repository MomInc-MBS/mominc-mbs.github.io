# M1 evaluation protocol: DRAFT (Gate D), not frozen

- **Status:** draft, 23 Nov 2026.
- **Freeze rule:** the final version is committed with its sha256 **before** any M1 candidate runs (FR-4 lesson).
- **Milestone (D7=B):** M1 means one verified new effect.
- **Basis:** `docs/DECISIONS_D1_D11.md`; supplement §3 Gates D and E.

## 1. Inventory audit: what exists and what is absent
- **Exists (frozen starting inventory):**
  - `structured_verifier.parse_source`: strict CSV (exact columns `id,group,bytes` in order) or a JSON array. **Any** bad row rejects the **whole** source.
  - `inventory_result` / `data_tasks.summarize_inventory`: group count and byte sum.
  - `experiment_tool.csv_profile_v1`: profile only.
  - Text scrubs `identity`, `scrub_lowercase`, `scrub_delete`.
- **Absent effect (candidate M1 target): row-level reconciliation into the canonical `grouped_inventory_v1` report.** It must work across supported layout variance (column order, header case/whitespace, CSV vs JSON). It must also give correct per-row treatment:
  - aggregate the valid rows;
  - list missing or invalid rows (id, reason) in a `quarantined` section;
  - **abstain** on ambiguous rows (the same id with conflicting values) instead of guessing.
- **Why the effect is absent today:** the incumbent either rejects the whole source or needs exact layout. It never produces a partial, correctly abstaining report.
- **Open condition (conductor decides before freezing):**
  - The search grammar needs typed sub-steps such as `parse_rows`, `normalize_header`, `validate_row`, `dedupe_conflicts` and `aggregate`.
  - If these can be exposed as thin views of the existing functions above, the family qualifies.
  - If they would be new tool logic, this family is **dropped** and replaced by the closest real development failure. The winning workflow is never hand-coded (supplement §3 Gate E).

## 2. Data partitions, split by source family before any example is generated
| Role | Family | Use | Access |
|---|---|---|---|
| Development | F-dev: generator families G1–G2 (CSV layout variants) | The proposer sees examples and per-case feedback. | The candidate worker. |
| Selection | F-sel: generator family G3 (JSON + mixed headers) | Chooses among at least 2 variants. Every use is counted. | Score only, no per-case labels. |
| Final held-out | F-final: generator families G4–G5, authored by a **separate** evaluator session from a different seed space and different group vocabularies | Scores the frozen finalist only, once. | Evaluator only. Not readable by candidate workers. |

- **Data source default:** evaluator-authored synthetic families. These are $0 and need no network.
- **No Level A sources.** The old 7 country-list items are diagnostic history only (FR-3).
- **Real pinned public sources:** optional later confirmation. Adding one to the allowlist is an owner step.
- **Exposure log:** every read of selection or final data is appended to `build/m1/exposure.jsonl`.

## 3. Oracles
- **Who writes them:** independently authored, deterministic, exact-output oracles that check the **whole** contract:
  - group totals over exactly the valid rows;
  - quarantined ids and reasons;
  - abstention ids;
  - no silent drops: every input id appears exactly once across the aggregated, quarantined and abstained sets.
- **What does not count:** a second model's approval is not oracle independence.

## 4. Arms (fixed primitives, permissions, resources, task distribution)
1. The incumbent P0.
2. The learning-disabled control.
3. The strongest fixed workflow from the existing inventory (strict parse plus aggregate, with whole-source reject).
4. A matched simple-search control: random or enumerated legal workflows at the same proposal budget.
5. The bounded-search finalist.

Report every arm, every exclusion and every denominator.

## 5. Decision rule (to freeze)
- **Unit:** one generated source file. Each case passes only on an exact full-contract match.
- **Useful gain:** finalist pass rate on F-final ≥ (strongest of arms 1–4) + **Δ**. Δ and the case count **n** are fixed at freeze. Proposal: n ≥ 40 and Δ = 20 points.
- **Regression tolerance:** 0 on the M0 tasks T1/T2 and on the existing structured-mission tests.
- **Not enough data:** below n, or with an exact-binomial p ≥ 0.05 against the strongest arm, the result is **INCONCLUSIVE**, not a win.
- **Ties:** a quality tie with lower cost is reported as an efficiency result only. It is never a capability claim.
- **Stopping:** at most 20 proposals, depth ≤ 3, at most 2 repairs. One final evaluation. If the finalist fails, the holdout is retired; a new claim needs a fresh family.
- **M1 exit additionally needs:**
  - durable registration, then restart, then a run on a distinct later task (M0 machinery);
  - rollback;
  - full cost accounting, with discovery cost separate from execution cost.

## 6. Who builds what
- **Conductor:** the search grammar and the policy file `configs/m1_campaign_policy.json`.
- **Separate evaluator worker:** the F-final generator and oracles (a disjoint path, unreadable by proposer workers).
- **Nemotron/Haiku:** fixtures for F-dev/F-sel only.
