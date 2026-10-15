# Mom's Misinformation Machine - mechanics research and release scope

Original research date: 2026-10-14; implementation updated 2026-10-15. This document distinguishes recovered Krillion behavior, proposed adaptations, and our original implementation. The public release has a curated playable catalog; it does not claim an exhaustive database of every conspiracy. Current release behavior and checks are recorded in [RELEASE.md](RELEASE.md).

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

The premise is escaping MOM Inc. through space toward **Mother Solar Station**. [engine.js](../../play/misinformation/engine.js) preserves the six point values, adds three-hit failure, and separates naming from evidence classification. A question requests a subject; after a valid answer, the player classifies an exact statement as an unsupported claim or documented fact. A correct classification banks points and propulsion; an incorrect one banks neither and adds one hit. The third hit ends the run. Unlimited fresh runs and recycled questions make continued play possible.

The current release makes the destination reachable with ordinary answers. The original perfect-only eligibility rule has been superseded by Ian's later progression direction. All correct classifications advance the route; higher answer tiers travel farther. Lower-tier answers and passes do not permanently disqualify a run. Two classification errors remain survivable.

Route distance is fictional: the station is at **100,000**, with correct answers advancing **5,000/5,500/6,000/6,500/7,000/7,500** by tier. Twenty common-tier correct checks can reach it; fourteen highest-tier checks can also win. There is no practice-only cap. Twenty illustrated levels occupy 5,000-unit steps, while eight separate question-difficulty bands unlock at 12,500-unit steps. The naming window is **35 seconds**, classification is untimed, and saved deadlines survive reload. A saved active deadline from the old 25-second implementation receives the extra ten seconds once. Hosted name lookup pauses the naming clock and permits retry on lookup failure.

The earlier **six persistent final escape locks** variant in [progression-proposal.md](research/progression-proposal.md) remains a historical proposal. It is not enabled in the current reachable-route implementation.

## Content: curated release and discovery queue

[catalog.js](../../play/misinformation/catalog.js) is the generated playable catalog. The current release has **204 distinct sourced answers and 184 broad prompts**, including ten authored prompts in each of 16 topic families and 10,193 accepted subject/question combinations. Every reviewed answer fits at least 17 prompts; at least 55% of each accepted list occupies the common score tier. There are 14 to 28 questions per difficulty band. Fresh current-band scopes take priority, then unused unlocked material before recycling. Exact-question, answer-pool and topic cooldowns discourage cosmetic repetition, and recent-question memory persists across restarts. The 100-point discovery is a stable editorial pick for the question. Rarity is not measured player frequency. Repeated canonical subjects remain valid.

The latest expansion adds 49 subjects, including familiar wars, revolutions, financial crises, medical milestones and disasters, plus precisely scoped conspiracy-related subjects. Cuban Missile Crisis aliases explicitly include **"cuban missle crisis"**. The [version-three source review](research/release-v3-source-review.md) records provenance and factual boundaries. These additions bring the reviewed bank to 170 documented propositions and 34 unsupported or contradicted propositions.

Names beyond a prompt's reviewed list can receive a hosted **typed category-fit decision** through the separate [Cloudflare answer judge](../../backend/misinformation-judge/README.md). Known reviewed cards retain their sourced facts. New names resolve against fixed-host encyclopedia search and summary records; the model chooses identity and fit rather than supplying factual statements or arbitrary URLs. New records receive common-tier scoring and a short attributed description. This is broader online coverage, not an exhaustive verified conspiracy database or a calibrated truth oracle. The finite reviewed bank remains usable offline; retrieval and model failures permit retry without damage. Only the submitted answer and server-owned prompt identifier are sent, with no connection to Ian's computer or private agent memories.

"Conspiracy theory or real-world tragedy?" is not an exclusive factual split. An actual tragedy may attract false claims; documented covert programs also exist. Cards therefore classify the **displayed proposition**, with a reveal and source link. Disputed or unresolved claims should not cause binary damage. Neither atrocity severity, victim counts, graphic detail, nor endorsement earns rarity points.

Primary verification references include [EPA on contrails](https://www.epa.gov/regulations-emissions-vehicles-and-engines/Contrails), [NASA/JPL on the 2012 prediction](https://www.jpl.nasa.gov/blog/2009/11/2012-a-scientific-reality-check), [FBI COINTELPRO records](https://vault.fbi.gov/cointel-pro), [CDC Tuskegee timeline](https://www.cdc.gov/tuskegee/about/timeline.html), [NIST's WTC report](https://www.nist.gov/publications/collapse-world-trade-center-towers-final-report-federal-building-and-fire-safety), [FBI case histories](https://www.fbi.gov/news/stories/serial-killers-part-7-jeffrey-dahmer), and [ECCC Case 002](https://www.eccc.gov.kh/en/cases/case-002).

Expansion uses CC0 Wikidata entities/aliases for discovery, independent exact-claim verification against primary records, original prompts, and retained provenance. An original editorial iceberg organizes familiarity; it is not a truth hierarchy. No community iceberg or blanket reuse license was adopted. A separate normalized SQLite research database contains **400 unique unreviewed candidates: 200 conspiracy theories, 100 human serial killers, and 100 massacres**. The import has no foreign-key errors and passes SQLite integrity checks. These candidate names are not 400 playable, verified questions. They remain outside the scored catalog pending exact-claim verification, source review, alias cleanup, prompt writing, and editorial depth assignment. A search result or Wikidata class cannot assign truth or damage.

## Verification

Automated checks exercise scoring, reachable station clearance, three-hit failure, old-save migration, scoreboard deduplication, question rotation, source/alias integrity, twenty journey scenes, hosted-decision boundaries, original story templates and the shared loading worker. The release captain verified a twenty-common-answer escape, an actual hosted lookup for the previously unlisted Great Fire of Rome, accepted evidence after reload, and score persistence. Broader browser checks follow the home preview into the dedicated game, test three-hit failure, saved timers and phone-width layouts. These are browser checks, not a claim of testing Ian's physical phone; current commands and release evidence are in [RELEASE.md](RELEASE.md).

Earlier checks corrected the Apollo laser-ranging source, restored classification validation and pre-docking language. Later progression work removed the practice cap. Reviewed evidence cards and hosted accepted records survive reload, and the new bank tests cover common world-event answers and Cuban Missile Crisis spelling variants. The reference game's server-side mechanics remain partly unknown despite these independent implementation checks.

## Request coverage

The research addresses the original mechanics and scoring; the current game covers space travel, twenty visual levels, eight question bands, two-stage answers, three hits, restarts, unlimited repeated questions, a reachable destination, ordinary events, serial killers, mass-atrocity-associated leaders, broader hosted name matching and editable end-of-run wordplay. Higher-tier answers still earn more points and travel farther. Future expansion includes more reviewed discovery candidates, measured rarity, physical-phone playtests and a global server-backed leaderboard. The current scoreboard is browser-local. "Every conspiracy ever" remains an expansion ambition.


## Integration and artwork update

The production target is the existing MOM Inc. home at https://mominc.online/tv/?ch=mominc, with the first preview linking to /play/misinformation/. Current integration uses `D:/site-work/misinformation-main`, branch `codex/misinformation-machine`, targeting the existing repository's main branch. The original dirty checkout was preserved. Historical base and initial integration details remain below; current release information is in [RELEASE.md](RELEASE.md).

The playable scene uses an orange-and-gold repaired paper saucer with a dark dome that obscures its pilot, pursued by the purple-and-gold one-eyed papercraft saucer identified in the actual OBS SpaceTime source. ImageGen derived the transparent craft from the approved references. The current journey uses **twenty original SVG scenes**, replacing the initial eight-tile background atlas. Its route runs from the office, vents and rooftop through the space elevator, junkyard and lunar cafeteria, then the Fold, origami and wormhole regions, ending at MOM's Mothership Desk. Cut-paper materials remain consistent while illustrated dimensions become stranger. Every resolved answer or pass moves the chase; a sticky phone chase stays visible while answering. Reduced motion preserves scene and position information without crossing animations.

[stories.js](../../play/misinformation/stories.js) contains twelve original ready-made ad-lib templates. End-of-run reports are explicitly fictional automatic wordplay. Compatible noun/person/place/event/theory blanks use actual answers; missing roles remain editable blanks, as do verbs, adjectives and adverbs. A criminal case is not silently inserted as a person, and a telescope is not substituted for a place. Players can edit, remix and copy the report. Story text stays separate from real source cards and is rendered as plain text.

The dedicated play menu includes a browser-local scoreboard, best distance/score and saved flight results. It is explicitly labeled as local; the site's Gala leaderboard is a different system. The research database and its unapproved discovery metadata remain separate from the source-reviewed playable catalog. Proposal records and research programs are described as proposals or research, never proof that their intended methods worked.

The main route participates in the shared game-download worker. The game ID is registered, scripts mount after the asset pack verifies, and the app explicitly releases the loader after mounting. Generated asset manifests must accompany every source/asset change. Run `node --test tools/misinformation-tests/*.test.mjs`, `node --test tools/check_game_loading.test.mjs`, and `python tools/check_misinformation_ui.py http://127.0.0.1:5190` for the relevant checks.


## Initial integration verification

Before the expanded catalog, 45 Node tests and eight browser checks passed on 2026-10-14. Later release checks are recorded in RELEASE.md. The initial base was origin/main 7f5c249 and integration commit 8d6b289; no files from Ian's dirty main checkout were overwritten.

Ian's final instruction authorizes publishing the finished game directly on mominc.online and asks for the public link, with no trial link.
