# Misinformation Machine release

Release date: 2026-10-14. Target: the existing `MomInc-MBS/mominc-mbs.github.io` main branch, published by GitHub Pages at https://mominc.online/.

The MOM Inc. home at https://mominc.online/tv/?ch=mominc opens with an animated game preview. It links to the dedicated play menu at https://mominc.online/play/misinformation/.

The expanded release contains **155 distinct sourced answers, 184 broad questions, 8,088 accepted subject/question combinations, and eight altitude layers**. That is 3.30 times the original 47 answers. Sixteen topic families have ten authored prompts each; the original 24 IDs remain available for saved-flight compatibility. Every answer fits at least 17 broad prompts. Twenty-eight exact propositions are unsupported/contradicted claims; 127 are documented events, research programs, science, or cases. These categories describe exact statements, not blanket verdicts about every related allegation. The separate discovery queue contains 400 unreviewed candidates and is not automatically playable.

The player names an answer within 25 seconds, then classifies its exact proposition without a timer. Correct classifications earn 10/15/30/60/85/100 points and 50 km per point. Incorrect classifications deal one of three hits. Every naming answer must earn the highest tier to retain station clearance; a lower tier or pass makes the run practice-only. The station is 100,000 km away. Unlimited runs and continued practice are supported.

The question pools are deliberately broad, with at least 55% of each pool in the lowest score tier and exactly one 100-point discovery. Familiar answers outnumber every other tier. There are 51 different top discoveries, with none serving as the top answer in more than ten questions. The top discovery is an editorial choice for each question, alongside relative familiarity; it is not a mathematically measured popularity rank or a severity measure.

Fresh current-layer questions take priority, followed by other unused unlocked scopes before recycling. Rotation remembers the last 16 exact questions, eight accepted-answer scopes and two topic families where alternatives exist. Cosmetic rewordings of the same accepted-answer set share a cooldown. A separate browser-local deck retains recent questions across restarts and reloads. Small exhausted pools still allow unlimited replay.

Artwork uses a consistent paper-cut atlas, the repaired orange/gold player saucer with an obscured pilot, and the purple/gold one-eyed pursuer derived from the OBS SpaceTime reference. The scene grows from recognizable space to the science-fiction station. Every resolved answer or pass advances the visual chase, including a flyby at the practice cap. Misses and passes award no score or kilometers. The orange craft approaches the upper station; MOM closes through round pressure and hull damage, while earned distance opens space. A sticky compact chase remains visible while answering on a phone. Reload derives the same positions from saved score/round fields; reduced-motion preferences retain position updates and suppress animation.

The scoreboard stores up to 100 best flights **on this browser**, including escaped, recalled and abandoned runs. Best score and distance persist independently. There is no global leaderboard or server account sync in this release.

Preflight commands:

```text
node tools/build_misinformation_catalog.mjs
python tools/gen_game_packs.py
node --test tools/misinformation-tests/*.test.mjs
node --test tools/check_game_loading.test.mjs
python tools/check_misinformation_ui.py http://127.0.0.1:5190
```

The game/catalog/deck/score/scene suite checks source and alias integrity, broad memberships, common-answer majorities, semantic rotation, chase motion, strict escape rules and saved-score behavior. The shared loading suite checks existing games and exact asset manifests. The browser script follows the actual home preview and link, checks the expanded catalog, completes a win with 20 distinct questions, fails on three hits, reloads records, searches sources, inspects narrow layouts, expires saved deadlines, recovers malformed saves, restarts eight different opening scopes and checks low/missed/passed answers in the mobile chase. Artifacts are generated in ignored `.qa/misinformation/`. Physical-phone testing is not claimed.

Source review and link corrections are documented in [release-source-review.md](research/release-source-review.md) and [release-v2-source-review.md](research/release-v2-source-review.md). Version-two source records and the preserved original catalog are in research-data. Edit those reviewed records and the authored question definitions, then regenerate catalog.js with the command above. The original Krillion mechanics and REA evidence limitations are recorded in [RESEARCH.md](RESEARCH.md). All game code, prompt wording and artwork are original; the reference game's implementation and question bank were not copied.
