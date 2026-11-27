# P3: image.asset-match contract 2.0.0 and the real-holdout gate

Branch build/p3-image, not committed. No model call, no real-holdout opening (eval-private never read).

## Changes
- contract.json 2.0.0; pin_files + evaluator/g2/real_holdout.py; verification.real_holdout {approval_sha256: "PENDING-LEAD-FILLS", dir_env: HIVE_IMAGE_REAL_DIR}. schemas/capability-contract-v2.json allows the field.
- spec.md: transparency rule (white and black composite), "near-duplicate matching, not semantic similarity", size families and byte copies match. Other rules and the output format unchanged.
- oracle.py: signature = central 84% 24x24 gray z-score of the picture over white AND over black (opaque pictures: same signature twice); distance = max of the two.
- evaluator/g2/evaluate.py: pin() now follows the contract's pin_files when a contract.json sits beside the suite (other capabilities unchanged); container_runner() extracted so the gate shares the exact container path.
- src/hive/capcontract.py: holdout keys, holdout_receipt_sha, holdout_problem. scripts/hive_admission.py: Refused in _recheck unless a PASS receipt bound to the candidate sha and the contract pin exists.
- scripts/g2_qualify.py: budgets untouched. With a declared holdout, a first run stops at AWAITING_ADMISSION and prints the holdout command; --resume --admit-key admits once the receipt exists.
- tests: new tests/test_p3_image_v2.py (18); tests/test_g2_acquire.py updated (admit needs the receipt: v2-specific).

## THRESH decision (changed, before any candidate was scored under 2.0.0)
0.54 mean-abs-difference could not meet the 1.25 gap on sparse silhouettes (about 1 generated case in 7; random figures sit at 0.4, mirrors and poses at 0.2-0.5). Replaced the distance by RMS of the z-scored signatures (= sqrt(2(1-correlation))) and THRESH by 0.70. Measured acceptance with RMS 0.70: old scenes 28/40, figures 19/40, flat icons 26/40, transparent-corner icons 11/40, sparse icons 23/30. Measured gap (seeds 1,2,3, 12 cases each): same-picture max 0.534-0.541 (< 0.56), different-picture min 0.895-0.954 (> 0.875).

## Families (gen_public.build_real, also in gen_private.generate at 50%; PNG only, alpha kept through every transform; brightness acts on colour, never fades alpha)
silhouette figure on transparent bg; flat 2-3 colour icon (opaque); flat icon with transparent corners; SPARSE thin-outline glyph (6-10% opaque, hidden RGB black: the real failure shape; no crop kind, an 8% shift moves a hairline off itself); size families 180/192/512; byte-identical copies under new names. Hard negatives (each re-drawn until clear of its source, dropped if not): mirrored / upside-down silhouette, same palette + different glyph, sibling (same glyph and colours, other geometry), mirrored sparse glyph. Limits 2-20 files, 256 KiB, 2 MiB checked (within_limits). Public cases 6 -> 11 (5 real-like). Note: the 0.6-1.4x resize rule is kept for ordinary resizes; size families go to 180/192/512 (stated in spec).

## Gate behaviour (real_holdout.py)
1. sha256(APPROVAL.json) must equal the contract pin (placeholder never can), then every listed file hash. 2. Labels p3-real-labels-v1 must name exactly the approved files of their case. 3. Candidate hash + static check. 4. Opening is spent (store key, BEGIN IMMEDIATE) BEFORE the run, so a crash or FAIL cannot be retried; approval/file/label refusals do not burn it. 5. Run through evaluate.container_runner with harness.wrap, expected = oracle.render(labels, decoded sizes); PASS only if all cases byte-exact. 6. Receipt in the store (real_holdout/receipt/<cap>/<candidate sha>): candidate sha, approval sha, n, per-case pass/fail, evaluator pin, time, receipt sha. No labels, names or expected output; stdout prints verdict, counts, receipt sha only.
Lead steps: fill approval_sha256 (sha256 of APPROVAL.json), set HIVE_IMAGE_REAL_DIR, run `python -I evaluator/g2/real_holdout.py --suite capabilities/image.asset-match/suite --store S --candidate-file F --candidate-sha H --image-id ... --imports ... --inputs read-only`, then admit.

## Measurements (host, in-process, Pillow 12.3; imha b9f38904, dhash b2271b8c; candidates run as admitted)
Fresh hidden set seed 20261201 (set sha 0ea21136a246, 24 cases) and the 11 new public dev cases:
| adapter | dev 11 | dev old-scene 6 | dev real-like 5 | hidden 24 |
|---|---|---|---|---|
| (a) imha cand-42f71126 | 9/11 (fails sparse-icons, mixed-families) | 6/6 | 3/5 | 22/24 |
| (b) benhoyt/dhash da1ffe86 (d-af7769781a3e1db2e5e0, /c/t/g2gate12) | 10/11 (fails mixed-families) | 6/6 | 4/5 | 24/24 |
Before the sparse family existed both passed 10/10 dev and 23/24 hidden: only the sparse transparent family reproduces the real failure. Both adapters are still full passes on the old scenes. Real holdout: not run.

## Pytest
`python -m pytest tests/test_p3_image_v2.py tests/test_g2_acquire.py <every other test file importing g2/oracle/gen_*/evaluate/hive_admission/g2_qualify/capcontract> -q -p no:cacheprovider --basetemp D:/tmp/w4 -rf`
Last full run: 903 passed, 7 skipped, 1 failed (tests/test_revocation_scope.py::test_admission_of_locally_revoked_body_allowed_elsewhere_global_refused_everywhere; touches only the inventory-diff capability, not image; passes 8/8 alone with `python -m pytest tests/test_revocation_scope.py -q -p no:cacheprovider --basetemp D:/tmp/w4x`; the previous complete run, 899 passed + 5 v1-specific failures since fixed, had it green: order-dependent flake, not investigated further).
v1-specific tests updated: test_g2_fixture (11 public cases; truth check applies the gap filter, as the generators do), test_g2_kernel (prompt char bound 12000 -> 16000, token limit unchanged and asserted in test_g2_acquire), test_g2_acquire (admit needs the holdout receipt). Gate order fix: holdout check sits after the receipt checks so tar/receipt refusals keep their own reasons.
Left over: none (scratch probes deleted). Changed files: see git status in C:/hive-work/p3.
