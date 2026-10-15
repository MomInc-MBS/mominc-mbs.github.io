# Krillion: shipped-client static findings

Historical thirteen-file snapshot. The [2026-10-15 REA interaction recheck](krillion-interaction-rea-2026-10-15.md) recovered the previously omitted daily controller and resolves this report's earlier unknowns about submit endpoints, retry/correction flow, timeout finalization, the daily pass control and continuation timing. Server matching rules and the private answer bank remain unknown. Preserve the evidence scope below when citing this older report.

Examined 2026-10-14. Scope: 13 JavaScript files under `D:/Research/moms-misinformation-machine/reference/`, provided by the parent research session. Read as text only; no third-party code executed, no bulk question bank copied. Offsets below are zero-based Unicode character offsets after UTF-8 decoding (not byte offsets). File paths are relative to that reference directory.

## Verified directly in the client

| Mechanic | Finding | Evidence file and offset |
|---|---|---|
| Answer tiers | Plankton = 10; Too Clever = 15; Schooler = 30; Rare = 60; Deep Cut = 85; One in a Krillion = 100. Too Clever is an explicit separate tier for a famous supposedly obscure answer. | `37llm8wvcl-uo.js` @831?1730, `TIERS` object |
| Daily length | 7 rounds; maximum daily score 700. | `37llm8wvcl-uo.js` @2204, exports `MAX_DAY_SCORE` and `ROUNDS_PER_DAY` |
| Final verdict bands | 0?150 Plankton; 151?250 Schooler; 251?350 Rare; 351?449 Deep Cut; 450+ One in a Krillion. These aggregate score bands differ from answer tiers. | `37llm8wvcl-uo.js` @1730?2204 |
| Time | Answer window constant = 25,000ms; preview constant = 3,000ms. | `13amf1x8mc9_f.js` @11914: `ANSWER_MS`, `PREVIEW_MS` |
| Input limit | Maximum answer length = 256. | `13amf1x8mc9_f.js` @11857 |
| Cumulative movement | Score is converted to ocean distance with factor 10. Restoring a run sums points and sets depth to ten times that sum. A valid answer lands at previous depth + ten times its tier score. Thus 60 points adds 600m, and a perfect seven-answer run is 7,000m. | `2gx7nk58jzx_n.js` @37470: `ex=eR=10*l`; @38592: `o=r+10*a.score` |
| Miss movement | Miss animation shifts the camera/card temporarily by 40 units but stores prior depth as the actual cumulative position. It increments completed-round count; it does not subtract prior score. | `2gx7nk58jzx_n.js` @38330?38520, notably @38438 |
| Scoring presentation | Different tier-dependent plunge durations: Plankton 3.4s, Too Clever 3s, Schooler 3s, Rare 3.4s, Deep Cut 4.3s, Krillion 4.6s. Krillion adds a gold mascot/celebration sequence. | `2gx7nk58jzx_n.js` @22074?22320 and @41100?42150 |
| Urgency | Edge danger styling is applied above urgency 0.8. Sound emits discrete ticks while urgency is between 0.8 and 1. The caller mapping elapsed time to urgency is not in these files. | `2gx7nk58jzx_n.js` @42499 |
| Correction UX | A correction has `from` and `to` fields, announced through an ARIA live status. UI tells player to submit a second time or edit. | `13amf1x8mc9_f.js` @15700?16565 |
| Correction preference | Answer corrections default on. Settings describe preview before scoring; turning the setting off accepts corrections immediately. Clear-rejected-entry defaults off and is independently configurable. | `37llm8wvcl-uo.js` @14368?14430; `01ujnqhhhqgcg.js` @12060?12650 |
| Menu timing | Menu copy explicitly warns that the timer keeps running while the menu is open. The open-menu handler stores current draft/correction/rejected values without setting a pause flag. | `01ujnqhhhqgcg.js` @10430?11040 and @27970 |
| Pause/resume capability | `resumeDive` supports a saved `pausedAt`: it clears the flag and shifts both preview and answer deadlines by elapsed paused duration. Whether/when this is called by the gameplay controller remains unknown. It must not be generalized into a menu-pause claim. | `01ujnqhhhqgcg.js` @9879?10120 |
| Daily reset | Day dates and next reset use America/New_York. Day numbering epoch is 2026-07-16; first game is index 1. | `37llm8wvcl-uo.js` @2481?3670 |
| Daily persistence | Current local game key `krillion:game:v1`, stats `krillion:stats:v1`, player identity `krillion:player:v1`. Loading a daily game checks matching date. Storage failures fall back to an in-memory map. | `37llm8wvcl-uo.js` @6652?7150 |
| Completion shape | A finished game is phase `done` with exactly 7 results. Saved result includes prompt id/text, raw answer, accepted/canonical answer, tier, score and optional quip. Completion validation recomputes points from tiers. | `37llm8wvcl-uo.js` @4000?5570 and @7412?7690 |
| Best-score retention | Recording an existing day/archive/pack completion returns prior history if its score is greater than or equal to the new completion; lower results do not replace a better result. | `37llm8wvcl-uo.js` @11320?12000 |
| Stats/streaks | History drives games played, cumulative score, best score and consecutive-calendar-day streak. Current streak only survives if last completed day is today or yesterday. | `37llm8wvcl-uo.js` @5571?6100 |
| Account scoping | Signed-in progress keys are prefixed with encoded account owner, separating guest and account progress. Google-linked account sync merges completed records by game identity, favoring higher scores. | `37llm8wvcl-uo.js` @6170?6550; merge @3670?4070; sync @31700 onward |
| Unlimited clues | Classic route `/unlimited/classic`, API base `/api/unlimited`, next-dive UI, per-game saves `krillion-unlimited-{game}` and completion map `krillion-unlimited-done`. Configuration currently advertises a $5 unlock. | `37llm8wvcl-uo.js` @7698?7900 and @18400?19430 |
| Unlimited round count | Persisted pack completions pass the same 7-result validation; renderer says round n of 7. Evidence supports unlimited successive seven-question dives, rather than one literally infinite question run. Exact product limits require route/server inspection. | `37llm8wvcl-uo.js` @4000?5570; `2gx7nk58jzx_n.js` @19562 |
| Next unstarted game | Helper walks game numbers until neither completion history nor an active non-intro saved game occupies the number. | `37llm8wvcl-uo.js` @11265?11360 |

## Observed by parent session / Ian, not independently operated here

- Quasar scored +60 and moved 600m. This agrees with the recovered Rare tier and distance multiplier.
- Invalid answer ?banana? allowed another attempt while the clock continued. Static configuration includes rejection copy encouraging retry, but the actual retry controller was not among these 13 chunks.

## APIs visible in these chunks

- `/api/unlimited` is the classic pack base; themed pack bases are `/api/packs/{movies,sports,geography,lexicon}`. Subroutes and grading payloads are not shown here.
- `/api/account/progress` is paginated GET (`after=` cursor) and batched POST (completed records). Client validates downloaded records before merging them.
- `/api/account/purchases`, `/api/unlock`, `/api/packs/{id}/unlock`, `/api/restore` cover account purchases and restore. No purchase calls were made for this investigation.
- `/api/announcements/current` and `/api/announcements/vote` implement a separate announcement system, not question generation or gameplay events.
- `/api/calibration` is a separate calibration feature. It is not evidence of the main answer-grading algorithm.

## Inferences and limits

**Strong inference:** scoring uses authored, categorical rarity tiers, not a visible continuous player-frequency calculation. The client renders fixed points by tier. Server tier assignment, answer dictionaries, and any telemetry-driven updates are unknown.

**Strong inference:** the core emotional loop is reveal/risk/reward through spatial movement: submit an obscure valid answer, see rarity markers on the journey, land much farther, then advance. Longer high-tier animations and a special gold celebration reinforce rarity.

**Unknown from supplied chunks:** actual daily controller; grading endpoint/payload; accepted-answer matching; typo distance algorithm; whether spelling correction costs time; exact behavior at timeout during a request; pass button handling; reveal endpoint and timing; live retry limits; question selection/repetition; whether unlimited has a finite corpus; replay restrictions; whether server recalibrates tiers from real answers.

There are no literal `answerEndsAt` or `previewEndsAt` occurrences outside the resume helper, nor `/api/grade` occurrences, in this supplied 13-file set. This is a coverage limit, not proof those behaviors are absent. Obtain the dynamically imported daily/unlimited route controller to resolve them.

## Transfer to Mom?s Misinformation Machine

Reuse mechanics as a design reference: six fixed rarity bands, 10/15/30/60/85/100 progression, an optional timed thinking window, invalid-answer retry, correction confirmation, tier-specific launch intensity, clear cumulative distance, and resumable runs. New mechanics must remain explicitly our design: damage/classification phase, three-hit failure, unlimited questions within one escape run, topic-depth gates, and Mother Solar Station victory. None of those were found in this original client.
