# Scope and truth lock

Target: `D:/Repos/hive-ai`, branch `build/working-prototype`, measured implementation commit `dc8cc2d9b421d680d1052ba4f510027ac5a391ad`. Public documentation and source are published through the existing `MomInc-MBS/mominc-mbs.github.io` main branch at https://mominc.online/hive/. The local console is not a public runtime.

The actual dev6 base was reproduced separately from the new implementation: 448 tests passed, two Windows symlink checks skipped; the serial CLI journey passed seven checks; twelve fixed objective tasks and twelve fresh-process budget-preserving replays passed with no new model calls. The earlier interrupted pytest and overlapping first CLI attempt are retained in `baseline/`. See `baseline/baseline.json` for source, model, Docker and acceptance-manifest digests.

The historical dev4 `CURRENT_RELEASE.json` readiness label and the dev6 latest engineering supplement were intentional distinct records. The new prototype is another dated engineering supplement. Navigation is updated to expose the new supplement while preserving the original baseline evidence.

| Requirement | Dev6 state | v0.4 action / remaining gate |
| --- | --- | --- |
| Executor, governor, Store, budgets, exact tools, checkpoints | Already working | Reused, with regression and replay checks |
| Restricted Docker Python protocol | Already working | Actual first-party data transformation and bound upstream input |
| Restricted real CSV/JSON family | Integration gap | Added typed parser, exact tool and separately approved local classifier |
| Independent semantic correctness | Requires real input and oracle | Prepared pinned public excerpts and independently reviewed development labels; no research acceptance claim |
| Data → Python → independent review → report | Integration gap | One shared configuration, store and budget; synthetic/pending/failed prerequisites block |
| Candidate feedback and distinct later task | Integration gap | Frozen plan, aliases for duplicate controls, strict rejection and explicit later procedure |
| Human operator workflow | Integration gap | Authenticated loopback console; submit, health, artifacts, learning, STOP, resume and approved restore |
| New HIVE local-model dispatch | Requires operator approval | Eight exact task fingerprints prepared in one unapproved allocation |
| Genuine Level A research | Requires unused independent inputs and approval | Six data plus six Python; at least ten of twelve independently accepted; attempted denominator preserved |
| Beneficial learning / Level B | Requires separate preregistration and proof | At least 24 held-out tasks and strict comparisons; P2 remains quarantined |

The prepared sources are first-party development material. Pairwise source-group names and distinct hashes are checked mechanically; those checks alone do not prove statistical independence. Original source bytes, provenance copies, host-only oracles and actual private runtime stores remain local. Public receipts expose aggregate results and reproducible engineering evidence.

The aggregate inventory demo and the inventory learning plan refer to some of the same public source files. The four learning slices are disjoint from each other, but they are not an untouched corpus relative to the earlier aggregate demo. The loop freezes its candidate using only its designated development observation and makes no generalization claim. The classification combined demo also deliberately reuses the classification development source; its two comparison sources and subsequent source remain distinct within that plan.

## Preserved development failures

The initial combined mission regression run had 34 passes and one runtime-identity mismatch while another worker was still editing source. The isolated rerun passed. The final campaign runs a frozen archive so this cannot be hidden by changing source between commands.

The export fixture was extended to include the schema and reviewed public evidence. An existing hard-coded expected file count still expected 19 instead of 21; that failed check and the corrected passing test receipt are retained in `development-checks/`.

Independent review identified five concrete issues in the new code: STOP output completion, unknown interrupted inference redispatch, zero-retry DAG resume, inaccurate subsequent-procedure reporting, and mutable cached-verdict trust. The fixes and tamper/recovery regressions are described in `independent-review.md`. Mocked inference in those tests is explicitly not a real model call.

The first frozen v0.4 candidate, `117e983e0ca3650c5cc70b9b2b46ce52f00d1215`, passed 483 tests with three explained skips, seven CLI journeys and twelve objective tasks. Its first actual-source learning run then failed: the evidence reader incorrectly expected an immutable evidence artifact to contain its own content-hash reference. Existing synthetic learning tests did not exercise that branch. The original full-suite receipts remain in `initial-verification/`, the failed actual run remains in `initial-engineering-demo/`, and its six-cycle zero-call store remains on disk.

The corrected freeze reads the evidence reference from the job result, retains artifact hash verification and independently recomputes the verifier. A new regression uses four distinct actual source files and a fresh process to check rejection, the subsequent task and unchanged budget. A separate engineering verification allocation was needed because source identity is immutable; the failed allocation was not reset. The two actual engineering attempts used fifteen cycles in total (six before the fix, nine after), zero requests and zero tokens. Neither allocation grants inference authority or extends the proposed live allocation. That successful actual run remains in `pre-recovery-engineering-demo/`.

The final release classification depends on the measured receipts in `release-decision.json`. Without a new authorized local-model execution it cannot be OPERATIONAL_PROTOTYPE_DEMONSTRATED. The prepared proposal is deliberately `approved:false` and the actual CLI rejection is retained.

The console then found a separate cached-replay recovery defect in freeze `83c91dd`: STOP during replay left the parent mission STOPPED after the file was cleared even though all four stages were VERIFIED. The first harness had also observed state before its asynchronous request settled; those attempt receipts and the independently diagnosed runtime defect are retained in `console/attempts/`. The final repair explicitly resumes the parent, honors late STOP/CANCEL at finalization and keeps cancellation durable even if its signal file is removed. Four regressions check unchanged stage receipts and budget, and refuse any new dispatch. The original nine-cycle interrupted store is preserved. Final actual execution uses its own immutable-source verification store: three engineering attempts total twenty-four cycles (6 + 9 + 9), zero model requests and zero tokens, below the original engineering cycle ceiling. No spent cap was bypassed. Final receipts in `final-verification/` and `engineering-demo/` identify `dc8cc2d`.
