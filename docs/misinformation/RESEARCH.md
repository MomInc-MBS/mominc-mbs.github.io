# Mom's Misinformation Machine - mechanics research and prototype scope

Research date: 2026-10-14. This document distinguishes recovered Krillion behavior, proposed adaptations, and the local prototype. It is not a claim that the complete game or exhaustive content database has shipped.

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

## Content: current sample and expansion

[dist/catalog.js](../../play/misinformation/catalog.js) contains **12 subjects and nine category prompts**, not every conspiracy. Subjects are Chemtrails, Nibiru, Apollo reflectors, MKULTRA, COINTELPRO, Tuskegee, September 11, Hindenburg, Ted Bundy, Jeffrey Dahmer, Adolf Hitler/the Nazi regime, and Khieu Samphan. Prompts cover sky/space, covert programs, disasters, serial killers, genocide-associated leaders, documented abuses, doomsday claims, deep records, and apparently improbable documented events. Rarity is editorial, question-specific, and demonstrative; it is not measured player rarity. The sample recycles and does not enforce 20 distinct canonical winning answers.

"Conspiracy theory or real-world tragedy?" is not an exclusive factual split. An actual tragedy may attract false claims; documented covert programs also exist. Cards therefore classify the **displayed proposition**, with a reveal and source link. Disputed or unresolved claims should not cause binary damage. Neither atrocity severity, victim counts, graphic detail, nor endorsement earns rarity points.

Primary verification references include [EPA on contrails](https://www.epa.gov/regulations-emissions-vehicles-and-engines/Contrails), [NASA/JPL on the 2012 prediction](https://www.jpl.nasa.gov/blog/2009/11/2012-a-scientific-reality-check), [FBI COINTELPRO records](https://vault.fbi.gov/cointel-pro), [CDC Tuskegee timeline](https://www.cdc.gov/tuskegee/about/timeline.html), [NIST's WTC report](https://www.nist.gov/publications/collapse-world-trade-center-towers-final-report-federal-building-and-fire-safety), [FBI case histories](https://www.fbi.gov/news/stories/serial-killers-part-7-jeffrey-dahmer), and [ECCC Case 002](https://www.eccc.gov.kh/en/cases/case-002).

Expansion should use CC0 Wikidata entities/aliases for discovery, independently verify exact claims against primary records, author original prompts, retain provenance and review versions, then calibrate rarity from sufficient valid-answer samples. An original editorial iceberg organizes familiarity; it is not a truth hierarchy. No community iceberg or blanket reuse license was adopted. The separate research starter includes a normalized SQLite schema and deliberately unapproved seed records; it is not a production database. A separate Wikidata discovery import now contains **400 unique unreviewed candidates: 200 conspiracy theories, 100 human serial killers, and 100 massacres**. These candidate names are not 400 playable, verified questions. They remain outside the scored sample pending exact-claim verification, source review, alias cleanup, prompt writing, and editorial depth assignment. SQL integration of this discovery queue is in preparation; a search result or Wikidata class is not sufficient to assign truth or damage.

## Verification

The root implementation session reports **eight passing engine tests** and verification through the actual browser DOM: 20 correctly classified top-tier answers reached the station; three incorrect classifications ended the run and restart reset it; reload preserved progress; an expired saved answer deadline became a skip; archive search returned matching entries; and the 390px mobile layout had no horizontal overflow. This verifies a local prototype, not behavior on Ian's physical phone or a public deployment.

Four review findings were corrected before the final pass: the Apollo card now links to NASA's directly relevant laser-ranging record; result movement uses actual distance gained at the practice cap; the final travel band says station approach before docking; and restored classification state is checked against the current prompt's eligible answers. The original reference game's server-side mechanics remain partly unknown despite these prototype checks.

## Request coverage

The research addresses the original mechanics and scoring; the prototype engine covers space travel, depth unlocks, two-stage answers, three hits, restarts, unlimited repeated questions, a strict highest-tier destination gate, ordinary events, serial killers, and mass-atrocity-associated leaders. Remaining work includes turning the discovery queue into a substantially larger reviewed playable catalog, deeper varied questions, measured rarity, physical-phone playtests, durable server storage, and any public deployment. "Every conspiracy ever" remains an expansion ambition, not a completed deliverable.


## Integration and artwork update

The requested production target is the existing MOM Inc. home at https://mominc.online/tv/?ch=mominc, with the first preview linking to /play/misinformation/. The integration branch is codex/misinformation-machine in a clean checkout based on origin/main 7f5c249. The existing dirty main checkout was preserved.

The playable scene now uses an orange-and-gold repaired paper saucer with a dark dome that obscures its pilot, pursued by the purple-and-gold one-eyed papercraft saucer identified in the actual OBS SpaceTime source. ImageGen derived a transparent pursuer from the approved still, created the matching player, and produced one two-column/four-row background atlas. All eight tiles keep a consistent restrained paper texture. The first layers show recognizable orbit and planets; the final layers show impossible rings and the Mother Solar Station. The active distance row updates with the background, and hull damage reduces the illustrated gap between the craft. Reduced motion preferences disable drift animations.

The dedicated play menu includes a browser-local scoreboard, best distance/score and saved flight results. It is explicitly not a global leaderboard; the site's existing Gala leaderboard is a different system and was not reused. The research database has 400 unique unreviewed Wikidata discovery entities (200 theory candidates, 100 human serial-killer occupation matches, 100 massacre instances), separate from the 12 drafted exact propositions. None of the discovery metadata is automatically declared true or eligible for damage grading.

The main route participates in the shared game-download worker. The game ID is registered, scripts mount after the asset pack verifies, and the app explicitly releases the loader after mounting. Generated asset manifests must accompany every source/asset change. Run `node --test tools/misinformation-tests/*.test.mjs`, `node --test tools/check_game_loading.test.mjs`, and `python tools/check_misinformation_ui.py http://127.0.0.1:5190` for the relevant checks.


## Final local verification

On 2026-10-14, 45 Node tests passed: 22 game/scoring/scene tests plus 23 shared download/loading regressions. A fresh headless Chromium session passed eight browser checks on the actual main-site paths, including Power-on, the first home preview, its new-tab link, completed asset download, invalid-answer retry, all eight visual/chart bands, the 20-answer station win, third-hit recall, reload deduplication, and phone-width play/menu/scoreboard layouts. The SQLite import reports 400 unique discovery entities, no foreign-key errors, integrity OK and zero automatically approved scored research cards. The separate clearly labeled playable sample contains 12 subjects.

A private owner-only review copy was published successfully at https://moms-misinformation-machine.ianmyersrocks97.chatgpt.site. The public main site has not been changed by this branch.
