# Final independent P2 provenance check — Sol, 2026-11-21

Target: D:/Repos/hive-ai, build/working-prototype, dev5 working tree. Bounded final check of downgrade repair and legacy compatibility only. No source edits, inference, Docker, subagents, private stores, commits or publishing.

**Verdict: the demonstrated downgrade bypass is closed. No remaining blocker found in this bounded review.** Parent can freeze source and run the final regression; this is not a full-suite or acceptance verdict.

Executed independently:

- Focused P2 replay/unit/governed integration tests: **19 passed in 7.48 s**.
- Independent fresh stores for policy v1, v2 and v3: normal saved-output replay passed for all. v1/v2 VERIFYING event detail remained null, preserving the legacy journal shape and legacy output replay contract.
- In a fresh v3 store, stripped every attribution/version marker, minted replacement decision/evidence artifacts and rebound the job evidence pointer. Replay rejected it with ValueError because persisted VERIFYING provenance still binds the original decision receipt. This independently re-executed the prior bypass instead of relying only on parent tests.
- Repeated source-level comparison against original `1e1bf94` policy/governor: **144 v1/v2 decision and snapshot comparisons matched** across four modes, six categories and three requested routes. Fresh legacy output replay remained unchanged after decision artifact corruption, as intended by its historical contract.

Evidence: `sol-p2-final-review.json`; scratch probe `.hive/p2-recheck/final2.py`. Initial final probe reused a Python global name while running the historical probe and overwrote its own summary object; corrected probe uses a separate namespace and new scratch stores. Only corrected machine-readable final artifact is retained.

Limits: provenance journal and artifact integrity are trusted against the tested evidence-pointer rebinding attack; unrestricted rewriting of all database events is outside that claim. Static source-group labels still do not attest freshness or independence. P2 stays quarantined, v2-equivalent in route choices, and does not establish improved quality or beneficial learning. No actual historical private mission store replayed; historical compatibility evidence is original-source decision/snapshot equality plus fresh legacy stores. Full frozen-source suite remains parent responsibility.
