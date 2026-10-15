# Mom's Misinformation Machine - mechanics research and release scope

Research date: 2026-10-14. This document distinguishes recovered Krillion behavior, proposed adaptations, and our original implementation. The public release has a curated playable catalog; it does not claim an exhaustive database of every conspiracy.

## Evidence and method

The reference is **Krillion**, the browser game at [krillion.io](https://krillion.io/). Public shipped JavaScript was downloaded and inspected as text. Third-party JavaScript was not executed locally, and the source game's question bank, artwork, branding, and implementation were not copied into the prototype. Our implementation uses original code, names, prompts, and presentation.

The detailed evidence ledger is [krillion-static-findings.md](research/krillion-static-findings.md). It records zero-based Unicode character offsets, individual reference filenames, and limitations. The parent research session also operated the original live game: **Quasar earned 60 points and 600m**; **banana was rejected and another attempt remained available while the timer continued**. Those are runtime observations, separately supported where possible by static evidence.

REA static analysis succeeded with evidence ID `ev_d2909848b2fe1c929a324c2e6d54b1c9ac40a1a6faf12ed24743efe9ac82b649` and root digest `b9edcac359e7228f103457e62c7b71a7356f8d9a36fd53b04a39b6ee91a58f5b`. It inertly parsed 13 JavaScript files; its graph is incomplete because dynamically loaded controller code was missing. Its raw UTF-16 application record (approximately 386 MB) is retained as [`rea-application.json`](research/rea-summary.json), with environment checks in [`rea-doctor.json`](research/rea-summary.json). Those are evidence artifacts, not imported sources or gameplay dependencies. Detailed conclusions below rely on the readable static ledger and observed runtime behavior.

## What the original actually does

Krillion rewards a valid but less familiar answer to an open-ended category prompt. It has six authored answer tiers:

| Original answer tier | Points | Additional ocean distance |
| --- | ---: | ---: |
| Plankton | 10 | 100m |
| Too Clever | 15 | 150m |
| Schooler | 30 | 300m |
| Rare | 60 | 600m |
| Deep Cut | 85 | 850m |
| One in a Krillion | 100 | 1,000m |

The fixed scoring vector appears in `37llm8wvcl-uo.js` at character 831 onward. Seven daily answers produce at most 700 points and 7,000m. The `25,000ms` answer window and `3,000ms` preview are explicit constants in `13amf1x8mc9_f.js` at 11914. Depth is cumulative score multiplied by ten, confirmed by both the renderer and Quasar observation. A miss advances the completed-round count without removing previously earned distance.

"Too Clever" is especially useful: an answer can feel obscure while still being a familiar choice among players. The visible client does **not** establish that tiers are automatically calculated from current population frequencies. It renders fixed points assigned to categorical tiers. The [official FAQ](https://krillion.io/faq) says the author curates and cleans answer sets from reference datasets. Some prompts use word/name familiarity measures; others combine model assistance with manual review. The designated highest-tier answer also considers how satisfying it is to discover, so it need not be the mathematically least familiar answer. The exact server assignment, thresholds, and recalibration remain unknown. These are the original creator's descriptions, separate from our code inspection.

Feedback turns the score into a physical journey. Tier markers appear along a plunge; answer-dependent animations take roughly three to 4.6 seconds; the highest tier adds a gold character and celebration. Aggregate daily verdicts use separate bands: 0-150, 151-250, 251-350, 351-449, and 450+. Answer rarity and final-run labels should not be confused.

The same [official FAQ](https://krillion.io/faq) explains that typo correction checks aliases as well as canonical names, which can create unexpected matches. Corrections default on. A corrected answer is shown before scoring, with a second submission to confirm or an opportunity to edit; switching the preference off accepts corrections immediately. Clearing rejected entries is a separate preference, default off. The menu explicitly says its timer keeps running. A generic resume helper can shift saved deadlines after a pause, but the inspected files do not establish when the gameplay controller invokes it.

Daily dates/reset use America/New_York. Local game/stat keys, result records, account-scoped storage, and completed-record synchronization are visible. A finished game has seven results. Higher-scoring completions supersede lower ones. Classic Unlimited has `/unlimited/classic`, an `/api/unlimited` base, numbered saved dives, next-dive navigation, and an advertised unlock. Evidence supports **successive seven-question dives**, rather than proving one endless run.

Unknowns include exact answer-matching rules, typo thresholds, grading payloads, pass handling, timeout races, reveal API behavior, question selection, corpus size, and live rarity calibration. The supplied 13 chunks omit the daily controller. Do not fill those gaps by claiming fidelity. The [official home page](https://krillion.io/) states one daily dive with no replay; an invalid-answer retry within that dive is a different mechanism. Other similarly named domains describe separate games and are not mechanics sources for this investigation.

## Our primary game rule

The new premise is escaping MOM Inc. through space toward **Mother Solar Station**. [dist/engine.js](../../play/misinformation/engine.js) preserves the six point values, adds three-hit failure, and separates naming from evidence classification. A question requests a subject; after a valid answer, the player classifies an exact statement as a conspiracy claim or documented event/person. A correct classification banks points and propulsion; an incorrect one banks neither and adds one hit. The third hit ends the run. Unlimited fresh runs and recycled questions make continued play possible.

The primary rule follows "highest-level answers for all questions" literally: every committed naming answer must be tier six. A lower tier or skip permanently removes station eligibility for that run. Practice can continue, but accumulating more ordinary points cannot restore eligibility. A max-tier naming answer with a wrong classification damages the ship without breaking the naming requirement; two such mistakes remain survivable.

Prototype distance is fictional: **points x 50**, station at **100,000**, ineligible practice capped at **95,000**. Twenty correctly classified tier-six answers reach the station; with two classification errors, an eligible win takes 22 answered questions. Eight named travel bands unlock at 12,500-unit steps. These values come from the actual engine and supersede earlier proposal thresholds for this prototype. The 25-second naming deadline continues across reloads; verification below covers expiry and saved-run behavior.

An optional **six persistent final escape locks** variant exists in [progression-proposal.md](research/progression-proposal.md). It would allow recovery from earlier ordinary answers while requiring six distinct final max-tier solutions. It changes the literal rule and is not the prototype's primary or silently enabled behavior.

## Content: curated release and discovery queue

[catalog.js](../../play/misinformation/catalog.js) is the generated playable catalog. The expanded release has 155 distinct sourced answers and 184 broad prompts, including ten authored prompts in each of 16 topic families. Every answer fits at least 17 prompts; familiar low-tier answers form the majority of each accepted list. There are 14–28 questions per layer instead of three. Fresh current-layer scopes take priority, then unused unlocked material before recycling. Exact-question, answer-pool and topic cooldowns discourage cosmetic repetition, and recent-question memory persists across restarts. The 100-point discovery is a stable editorial pick for the question. Rarity is not measured player frequency. Repeated canonical subjects are allowed; the escape rule concerns the tier of every committed naming answer.

"Conspiracy theory or real-world tragedy?" is not an exclusive factual split. An actual tragedy may attract false claims; documented covert programs also exist. Cards therefore classify the **displayed proposition**, with a reveal and source link. Disputed or unresolved claims should not cause binary damage. Neither atrocity severity, victim counts, graphic detail, nor endorsement earns rarity points.

Primary verification references include [EPA on contrails](https://www.epa.gov/regulations-emissions-vehicles-and-engines/Contrails), [NASA/JPL on the 2012 prediction](https://www.jpl.nasa.gov/blog/2009/11/2012-a-scientific-reality-check), [FBI COINTELPRO records](https://vault.fbi.gov/cointel-pro), [CDC Tuskegee timeline](https://www.cdc.gov/tuskegee/about/timeline.html), [NIST's WTC report](https://www.nist.gov/publications/collapse-world-trade-center-towers-final-report-federal-building-and-fire-safety), [FBI case histories](https://www.fbi.gov/news/stories/serial-killers-part-7-jeffrey-dahmer), and [ECCC Case 002](https://www.eccc.gov.kh/en/cases/case-002).

Expansion uses CC0 Wikidata entities/aliases for discovery, independent exact-claim verification against primary records, original prompts, and retained provenance. An original editorial iceberg organizes familiarity; it is not a truth hierarchy. No community iceberg or blanket reuse license was adopted. A separate normalized SQLite research database contains **400 unique unreviewed candidates: 200 conspiracy theories, 100 human serial killers, and 100 massacres**. The import has no foreign-key errors and passes SQLite integrity checks. These candidate names are not 400 playable, verified questions. They remain outside the scored catalog pending exact-claim verification, source review, alias cleanup, prompt writing, and editorial depth assignment. A search result or Wikidata class cannot assign truth or damage.

## Verification

Automated checks exercise scoring, strict station clearance, three-hit failure, saves, scoreboard deduplication, layer selection, source/alias integrity and the shared loading worker. Browser checks follow the actual home preview into the dedicated game, complete a 20-answer escape, fail on three wrong classifications, reload saved results, search source records, expire a saved timer, and inspect phone-width layouts. These are Chromium checks, not a claim of testing Ian's physical phone.

Four review findings were corrected before the final pass: the Apollo card now links to NASA's directly relevant laser-ranging record; result movement uses actual distance gained at the practice cap; the final travel band says station approach before docking; and restored classification state is checked against the current prompt's eligible answers. The original reference game's server-side mechanics remain partly unknown despite these prototype checks.

## Request coverage

The research addresses the original mechanics and scoring; the game covers space travel, depth unlocks, two-stage answers, three hits, restarts, unlimited repeated questions, a strict highest-tier destination gate, ordinary events, serial killers, and mass-atrocity-associated leaders. Future expansion includes more reviewed discovery candidates, measured rarity, physical-phone playtests and a global server-backed leaderboard. The current scoreboard is browser-local. "Every conspiracy ever" remains an expansion ambition.


## Integration and artwork update

The requested production target is the existing MOM Inc. home at https://mominc.online/tv/?ch=mominc, with the first preview linking to /play/misinformation/. The integration branch is codex/misinformation-machine in a clean checkout based on origin/main 7f5c249. The existing dirty main checkout was preserved.

The playable scene now uses an orange-and-gold repaired paper saucer with a dark dome that obscures its pilot, pursued by the purple-and-gold one-eyed papercraft saucer identified in the actual OBS SpaceTime source. ImageGen derived a transparent pursuer from the approved still, created the matching player, and produced one two-column/four-row background atlas. All eight tiles keep a consistent restrained paper texture. The first layers show recognizable orbit and planets; the final layers show impossible rings and the Mother Solar Station. The active distance row updates with the background, and hull damage reduces the illustrated gap between the craft. Reduced motion preferences disable drift animations.

The dedicated play menu includes a browser-local scoreboard, best distance/score and saved flight results. It is explicitly labeled as local; the site's Gala leaderboard is a different system. The research database and its unapproved discovery metadata remain separate from the source-reviewed playable catalog. Proposal records and research programs are described as proposals or research, never proof that their intended methods worked.

The main route participates in the shared game-download worker. The game ID is registered, scripts mount after the asset pack verifies, and the app explicitly releases the loader after mounting. Generated asset manifests must accompany every source/asset change. Run `node --test tools/misinformation-tests/*.test.mjs`, `node --test tools/check_game_loading.test.mjs`, and `python tools/check_misinformation_ui.py http://127.0.0.1:5190` for the relevant checks.


## Initial integration verification

Before the expanded catalog, 45 Node tests and eight browser checks passed on 2026-10-14. Later release checks are recorded in RELEASE.md. The initial base was origin/main 7f5c249 and integration commit 8d6b289; no files from Ian's dirty main checkout were overwritten.

Ian's final instruction authorizes publishing the finished game directly on mominc.online and asks for the public link, with no trial link.
