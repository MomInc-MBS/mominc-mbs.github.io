# Misinformation Machine release

Release target: the existing MomInc-MBS/mominc-mbs.github.io main branch and https://mominc.online/play/misinformation/. The animated first home preview remains at https://mominc.online/tv/?ch=mominc. Worktree D:/site-work/misinformation-main, branch codex/misinformation-machine. Preserve shared main changes and the dirty original checkout.

The October 15 expansion has 5,305 distinct sourced answers, 194 broad prompts, and 23,037 accepted subject/question combinations. Seventeen topic families have ten prompts each, plus 24 legacy IDs for save compatibility. The bounded Wikipedia category import contributes thousands of historical/reference topics and hundreds of explicitly identified conspiracy theories, legends, hoaxes, and fringe beliefs. This is a large searchable archive, not an exhaustive inventory of every conspiracy. Provenance, article revisions, redirects, category paths, measured readership, and license attribution are retained in research-data/wikipedia-index.json. See research/wikipedia-answer-index-2026-10-15.md for collection scope.

Reviewed cards retain their established familiarity scores, including Stanford and Milgram at 15 points. Imported familiarity uses global Wikipedia readership ranks over the recorded 30-day window: the most read 30% receive 10 points, the next 25% 15, then 20% 30, 15% 60, and 10% 85. Equal readership ties stay equal. Each prompt promotes one rated answer to a 100-point gem. Unmeasured answers receive explicit 15-point Discovery credit and cannot become the 100-point gem. Readership is a familiarity proxy, not player answer frequency or a severity ranking. Opening question bands contain documented subjects; conspiracy-focused prompts begin deeper in the run.

A Wikipedia category is search context, not evidence that every member is false. Explicitly identified belief/legend/hoax/fringe topics use a topic classification card: 'Documented subject' versus 'Theory / legend / hoax'. Other imported reference cards ask about their attributed description. Original reviewed cards still grade exact documented or unsupported statements. Article excerpts are at most 25 words; article links credit contributors under CC BY-SA 4.0. No source-game implementation, artwork, or private answer bank is copied.

On phones the entire flight occupies one viewport: question and tap-to-type field at the top, flying chase and winding 20-stop map in the middle, hull/score and flight actions at the bottom. The bottom Flight Menu opens scoreboard, ad-lib, archive, sound, and restart. Native keyboard changes resize the cockpit through visualViewport; mobile inputs never auto-focus on question arrival. The terminal scrolls internally when a longer fact card needs room. Desktop keeps the wider scene and terminal composition. The archive searches every entry while rendering at most 100 results at a time.

Correct answers widen the chase gap by tier; wrong classifications close it sharply, and passes also bring MOM closer. Gap changes apply chronologically, including after a capped winning streak and across saved runs. Third-hit death catches the player. Both ship positions and the winding minimap use the same chase state. After a failed or passed question, a highest-tier alternative from that completed prompt appears above the result details. Upcoming prompts expose no free answer example.

The original paper/PBS world art, orange/gold saucer, purple/gold OBS-reference MOM ship, speed lines, blur/zoom launches, beacons, sound opt-in, and reduced-motion treatment remain. Twenty dimensions run from the Office desk through space and The Fold to MOM's Mothership Desk. Each question has a three-second reading preview and full 35-second naming window. Flights end after at most five resolved questions, including passes and timeouts. Correct answers travel 2,000/3,000/6,000/12,000/17,000/20,000 km by tier. Only five correctly classified extra rare Motherlode (100-point) answers reach 100,000 km. Three wrong classifications still end a flight early. Passes have no hull penalty. Older flights restart under the new rules to prevent unlimited-question progress bypassing the limit; score records remain intact.

Unlisted answers still use the hosted Cloudflare Clef Flash answer desk with a bounded timer pause. Only the answer and server-owned prompt ID are sent. Evidence supplies the card; the model judges category fit. Errors do not damage the hull. Newly verified references receive 15-point Discovery credit. Topic classification metadata survives both backend responses and saved dynamic answers. Redeploy backend/misinformation-judge whenever the catalog changes.

The scoreboard retains up to 100 best flights on this browser; it is not a global leaderboard. Twelve explicitly fictional ad-lib templates use actual flight answers in compatible word roles, with editable missing words, remix, copy, and save/reload.

Verification receipts are retained in ignored .qa/misinformation artifacts. Release checks include catalog/source/alias and Wikipedia-adapter invariants, chase-gap saturation and failures, learning examples, loading/Armie download ordering, hosted judge tests, Wrangler dry run, phone and desktop browser paths, a complete escape, and public committed-byte checks. No physical-phone keyboard or speaker-audibility test is claimed.

Preflight:

```text
node tools/build_misinformation_catalog.mjs
python tools/gen_game_packs.py
node --test tools/misinformation-tests/*.test.mjs
node --test tools/check_game_loading.test.mjs
cd backend/misinformation-judge
npm test
npm run check
npm run deploy
```

Publish to main only after checks pass, then verify the canonical public route and exact committed runtime bytes. Do not give Ian a preview/trial link.
