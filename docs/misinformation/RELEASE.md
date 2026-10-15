# Misinformation Machine release

Release date: 2026-10-14. Target: the existing `MomInc-MBS/mominc-mbs.github.io` main branch, published by GitHub Pages at https://mominc.online/.

The MOM Inc. home at https://mominc.online/tv/?ch=mominc opens with an animated game preview. It links to the dedicated play menu at https://mominc.online/play/misinformation/.

The curated release contains **47 sourced subjects, 24 transmissions, 121 accepted subject/score combinations, and eight altitude layers**. Twelve exact propositions are unsupported/contradicted claims; 35 are documented events, research programs, science, or cases. These categories describe exact statements, not blanket verdicts about every related allegation. The separate discovery queue contains 400 unreviewed candidates and is not automatically playable.

The player names an answer within 25 seconds, then classifies its exact proposition without a timer. Correct classifications earn 10/15/30/60/85/100 points and 50 km per point. Incorrect classifications deal one of three hits. Every naming answer must earn the highest tier to retain station clearance; a lower tier or pass makes the run practice-only. The station is 100,000 km away. Unlimited runs and continued practice are supported.

Fresh questions from the current layer precede questions from the previous layer. Replay avoids the last three prompts where possible. Each deeper band introduces new subjects. Editorial answer familiarity and eight-band travel depth are independent; neither is an empirical rarity claim or a severity ranking.

Artwork uses a consistent paper-cut atlas, the repaired orange/gold player saucer with an obscured pilot, and the purple/gold one-eyed pursuer derived from the OBS SpaceTime reference. The scene grows from recognizable space to the science-fiction station. Reduced-motion settings are respected.

The scoreboard stores up to 100 best flights **on this browser**, including escaped, recalled and abandoned runs. Best score and distance persist independently. There is no global leaderboard or server account sync in this release.

Preflight commands:

```text
python tools/gen_game_packs.py
node --test tools/misinformation-tests/*.test.mjs
node --test tools/check_game_loading.test.mjs
python tools/check_misinformation_ui.py http://127.0.0.1:5190
```

The 36 game/catalog/score/scene checks and 23 shared loading checks pass. The browser script covers the real home preview and link, loading completion, invalid-answer retries, all eight layers and a station win, third-hit failure, scoreboard persistence/deduplication, archive search, narrow layouts, expired deadlines and malformed-save recovery. Browser artifacts are generated in ignored `.qa/misinformation/`. Physical-phone testing is not claimed.

Source review and link corrections are documented in [release-source-review.md](research/release-source-review.md). The original Krillion mechanics and REA evidence limitations are recorded in [RESEARCH.md](RESEARCH.md). All game code, prompt wording and artwork are original; the reference game's implementation and question bank were not copied.
