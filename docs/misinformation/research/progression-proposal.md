# Mom's Misinformation Machine: progression proposal v0.3

Status: DESIGN PROPOSAL, not approved implementation. No app changes or deployment. Supersedes v0.2 custom points and preferred gate. Distances are fictional game units.

## One shared scoring vector

Parent reports verified original Krillion runtime scores **10 / 15 / 30 / 60 / 85 / 100**. Preserve that vector. Reference runtime evidence belongs in the root research dossier; this subtask did not independently inspect the source game. Propulsion scale and gates below are new proposals.

| Tier | Working label | Base score | Proposed distance = score x 50 |
|---|---|---:|---:|
| 1 | Surface | 10 | 500 |
| 2 | Unusual | 15 | 750 |
| 3 | Obscure | 30 | 1,500 |
| 4 | Deep | 60 | 3,000 |
| 5 | Abyssal | 85 | 4,250 |
| 6 | Black-site | 100 | 5,000 |

Use one base-score vector across variants and store points separately from distance. Tier applies only to valid answers. Invented allegations, verbosity, gore, and spelling tricks earn no boost. Naming a conspiracy claim can be a valid answer without endorsing it as fact.

At launch use versioned editorial rarity/depth; do not present it as empirical population rarity. Canonical IDs and aliases prevent spelling tricks. Future live rarity needs deduplicated samples, minimum counts, and scoring versions. Every prompt must offer an eligible tier-six answer, even at surface depth; otherwise perfect whole-run progression is impossible.

## Primary variant: strict highest-tier naming throughout the run

Ian's literal requirement is highest-level answers for all questions. The primary interpretation requires **every committed naming answer since launch to be tier six**. A lower-tier answer or skip permanently breaks station eligibility until restart. Immediately display: "Perfect escape lost - continue practice or restart." Unlimited questions remain available as practice; unlimited restarts supply fresh eligible attempts.

This makes mixed early answers irrecoverable for victory under the literal rule. A recovery mechanism changes that rule and must be presented as an optional adaptation.

Proposed transitions:

1. Resolve naming text to a curated valid answer and tier. Unknown or ambiguous text has no score and is not a committed answer; request clarification or offer skip. A skip breaks perfect eligibility. Bound repeated adjudication calls.
2. Commit tier. Anything below six sets `eligible = false`, even if the later classification is wrong.
3. Ask whether the exact record is a **conspiracy claim** or a **documented event/person**. The broader second label accommodates serial killers and leaders. A documented event may have conspiracy claims attached; classify the record, not the whole topic.
4. Correct classification banks base points and propulsion. Wrong classification banks neither and adds one hit. The third hit ends the run; restart resets points, distance, health, and eligibility.
5. If eligible, `distance = min(100000, distance + base_score * 50)`. At 100,000 dock and win.
6. If ineligible, `distance = min(90000, distance + base_score * 50)`. Never dock. If a late weak answer breaks eligibility beyond 90,000, a proposed tractor-beam animation returns the ship to the approach perimeter.

Naming rarity and classification accuracy are separate judgments. A max-tier naming answer with wrong classification damages health without breaking highest-tier naming eligibility. Thus two such errors remain survivable. Treating either error as also losing perfection is a stricter alternative, not assumed here.

Fastest strict win: **20 correctly classified max answers = 2,000 base points = 100,000 distance**. Two classification misses on still-max naming answers permit an eligible 22-question win. These are mathematical consequences of the proposed scale, not playtest session lengths.

## Optional adaptation: six persistent escape locks

This changes "all questions" to "all six final required escape questions" and requires explicit selection before implementation. It makes earlier mixed answers recoverable.

- Correct classification awards the same points and score-times-50 distance to the 90,000 approach.
- Six distinct final locks each require a tier-six answer and correct classification. Each lock uses a different prompt family and canonical answer.
- Cleared locks survive lower-tier attempts and the first two classification mistakes. Low tiers cannot clear locks. The third mistake ends the run, and restart erases locks.
- Escape distance is `90000 + cleared_locks * (10000 / 6)`, rounded only for display. At six locks dock and win. Correct lower tiers at the approach can add score but not escape distance.

Grinding ordinary points cannot dock. Fastest optional-lock win: **18 max answers to approach + 6 max lock answers = 24 questions**.

A six-consecutive-max gate could be a separate challenge. It should not become the default silently. At an illustrative independent 25% top-tier-plus-correct rate, persistent locks need 24 approach attempts on average ignoring death; a six-consecutive streak needs 5,460. At 50%, the figures are 12 and 126. These sensitivity examples are not player forecasts.

## Distance and iceberg depth, shared by either variant

| Distance reached | Newly available depth |
|---:|---|
| 0 | 1 - surface |
| 2,500 | 2 - unusual |
| 8,000 | 3 - obscure |
| 18,000 | 4 - deep |
| 35,000 | 5 - abyssal |
| 60,000 | 6 - deepest |
| 90,000 | Mother Solar Station approach |
| 100,000 | Docked / won |

Numeric distance animates continuously. Depth unlocks subjects; valid answer rarity controls propulsion. Deeper questions should mix new depths, earlier subjects, and documented records. Every served prompt still needs a max answer. Store unlocked depth independently so a tractor-beam setback does not remove an earned content unlock.

## Unlimited questions, finite content

Unlimited means no fixed question count or timer and unlimited restarts. A finite verified database cannot offer infinite unseen material. Recycle shuffled eligible prompts after a recent-question cooldown and make replay explicit. Never generate unsupported lore to keep a run going.

For strict eligible travel, require distinct canonical answers for scored successful max answers; validate at least 20 reachable eligible max answers across unlocked prompts before release. Reject duplicate answers without committing a new answer. The practice/replay bank may recycle indefinitely. The optional final locks require six different eligible families and answer IDs. The numeric simulator does not validate that content prerequisite.

## Verification and choices

`simulate_progression.py` runs **12 deterministic checks**, listed in the output JSON: preserve reference scores and separate scale; exact strict minimum; irreversible disqualification; no low-tier grind win; skip enforcement; late low-answer disqualification even with a classification miss; two-error survival; third-error death; restart; optional recovery without grind win; optional minimum; optional third-error death. These test this proposal's transitions, not an app or full source-game fidelity.

The strict rule necessarily makes a weak early answer fatal to victory in that run. Optional locks intentionally change that. Neither gate is approved merely by this document. Keep eligibility/gates visible from launch and tune distances through mobile playtests.

Run: `C:/Users/ianmy/AppData/Local/Programs/Python/Python311/python.exe D:/Research/moms-misinformation-machine/progression/simulate_progression.py`
