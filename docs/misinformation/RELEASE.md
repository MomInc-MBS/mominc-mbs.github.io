# Misinformation Machine release

Release date: 2026-10-15. Target: the existing `MomInc-MBS/mominc-mbs.github.io` main branch, published by GitHub Pages at https://mominc.online/. Integration worktree: `D:/site-work/misinformation-main`, branch `codex/misinformation-machine`. The dirty original checkout is preserved.

The MOM Inc. home at https://mominc.online/tv/?ch=mominc opens with an animated game preview. It links to the dedicated play menu at https://mominc.online/play/misinformation/.

The expanded release contains **204 sourced answers, 184 broad questions, 10,193 accepted subject/question combinations, and twenty illustrated levels**. Sixteen topic families have ten authored prompts each; the original 24 IDs remain for saved-flight compatibility. Every answer fits at least 17 prompts. Thirty-four exact propositions are unsupported/contradicted; 170 are documented events, programs, science, or cases. Labels describe exact statements, not blanket verdicts about related allegations. The separate 400-candidate discovery queue remains unreviewed research.

Players have **35 seconds** to name an answer; classification is untimed. Scores remain 10/15/30/60/85/100. Correct answers travel 5,000/5,500/6,000/6,500/7,000/7,500 route kilometers by tier. Ordinary answers can win in 20 correct checks; all-rarest answers in 14. There is no permanent practice-only lock. Two classification errors are survivable; the third ends the run. Passes award no points or distance and do not prevent escape. Old saves retain progress and an active old naming deadline receives the extra ten seconds once.

The question pools are deliberately broad, with at least 55% of each pool in the lowest score tier and exactly one 100-point discovery. Familiar answers outnumber every other tier. There are 51 different top discoveries, with none serving as the top answer in more than ten questions. The top discovery is an editorial choice for each question, alongside relative familiarity; it is not a mathematically measured popularity rank or a severity measure.

Fresh current-layer questions take priority, followed by other unused unlocked scopes before recycling. Rotation remembers the last 16 exact questions, eight accepted-answer scopes and two topic families where alternatives exist. Cosmetic rewordings of the same accepted-answer set share a cooldown. A separate browser-local deck retains recent questions across restarts and reloads. Small exhausted pools still allow unlimited replay.

Twenty original SVG scenes share cut-paper materials with the repaired orange/gold obscured-pilot saucer and purple/gold OBS-reference pursuer. The itinerary is Office (pyramid on desk), Ceiling Vents, Propaganda Stairwell, Rooftop and Billboards, Sky of Paper Clouds, Space Elevator, Satellite Junkyard (first tears), MOM Port 18, Moon Cafeteria Colony, The Fold (mirror/inversion/upward fall), Origami, Asteroid Gym Belt, Wormhole Highway, Flatland, Mirror Office, Quilt Dimension, Data Cable, Nebula Nursery, Edge of the Page (drawing hand), and MOM's Mothership Desk. The existing eight question-difficulty bands remain separate from the twenty visual stops. Every resolved answer or pass moves the chase. A sticky illustrated phone chase remains visible above questions. Reduced motion preserves scenes and positions without crossing animations. Regenerate original scenery with `python tools/build_misinformation_journey.py`.

Unlisted names go to a separate hosted **Cloudflare Clef Flash** typed-decision model, using the Jev/Laya System One format. This is not Laya's local checkpoint or a public exposure of Ian's PC/private agents. Only the answer and server-owned question ID are sent. The model judges identity and prompt fit using reviewed cards or retrieved encyclopedia records; it does not invent facts. New records receive common-tier points and a short attributed description. Classification concerns that documented record, not endorsement of associated theories. The timer pauses during lookup, failures allow a retry without hull damage, and accepted evidence survives reload. The reviewed bank remains playable when offline. See [hosted judge](../../backend/misinformation-judge/README.md) for quotas and deployment. Redeploy the judge when its imported catalog changes.

An original ready-made ad-lib template library turns run answers into explicitly fictional MOM incident reports. Matching noun/person/place/event/theory blanks use actual answers; players can edit words and supply missing verbs/adjectives/adverbs, then remix and copy the report. Reports and flight data stay in this browser. Real source cards remain separate from fictional wordplay.

The scoreboard stores up to 100 best flights **on this browser**, including escaped, recalled and abandoned runs. Best score and distance persist independently. Old perfect wins and new ordinary-answer wins coexist. There is no global leaderboard or server account sync.

Preflight commands:

```text
node tools/build_misinformation_catalog.mjs
python tools/gen_game_packs.py
node --test tools/misinformation-tests/*.test.mjs
node --test tools/check_game_loading.test.mjs
cd backend/misinformation-judge
npm ci
npm test
npm run check
```

The game suites cover bank/alias integrity, broad memberships, common-answer majorities, semantic rotation, 20 scenes, accessible escape, old saves, scores, dynamic evidence cards and stories. Shared loading tests preserve existing games and exact asset manifests. Prefer the collaborative T3 browser for home/menu/tap/reload/phone/escape/recall/ad-lib and real hosted checks. `tools/check_misinformation_ui.py` is a fallback only when that browser is unavailable. Check actual positive, negative and previously unlisted names on the deployed judge, and compare public asset bytes to the release commit after GitHub Pages reports built. Physical-phone testing is not claimed.

Source review and link corrections are documented in [release-source-review.md](research/release-source-review.md) and [release-v2-source-review.md](research/release-v2-source-review.md). Version-two source records and the preserved original catalog are in research-data. Edit those reviewed records and the authored question definitions, then regenerate catalog.js with the command above. The original Krillion mechanics and REA evidence limitations are recorded in [RESEARCH.md](RESEARCH.md). All game code, prompt wording and artwork are original; the reference game's implementation and question bank were not copied.
