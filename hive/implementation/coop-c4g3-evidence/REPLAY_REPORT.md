# Coop selector replay report (development evidence)

selections.json sha256 `70d4fc10209ab92e519dc654f67d3ee35dbb11a214a1118c49360e841359c7c8`; 142 coop pools (23 incumbent experiments not applicable); container runs 0 (cap 600); HIVE model calls 0.

| variant | pools | correct | loss_pools | recovered | unresolved | regressions | no_correct_candidate | ineligible_winners | known 2 losses recovered | repair gate |
|---|---|---|---|---|---|---|---|---|---|---|
| S0 (S0-v1) | 142 | 12 | 3 | 0 | 3 | 0 | 127 | 0 | False | no |
| S1 (S1-v1) | 142 | 12 | 3 | 0 | 3 | 0 | 127 | 0 | False | no |
| S2 (S2-v1) | 142 | 13 | 3 | 1 | 2 | 0 | 127 | 0 | False | no |
| S3 (S3-v1) | 142 | 13 | 3 | 1 | 2 | 0 | 127 | 0 | False | no |

Known losses (loss pools in that campaign / recovered), per variant:
- 57f6a94/site.ref-resolve.diverse3.r3: S0 1/0, S1 1/0, S2 1/1, S3 1/1
- c3x-fbc2ddb/site.ref-check.maskrand3.r6: S0 2/0, S1 2/0, S2 2/0, S3 2/0

Campaigns with an S0 loss pool: 57f6a94/site.ref-resolve.diverse3.r3, c3x-fbc2ddb/site.ref-check.maskrand3.r6

Minimal passing variant: **none: keep S0**

Note (conductor, 26 Nov): first pass ran 67 container runs (receipts in runs.json); this regenerated pass reused them (0 new runs). After review, S2/S3 rank a candidate without a valid check receipt below any valid one (was: neutral); no receipt was invalid, and no selection changed (diffed against the first pass).
