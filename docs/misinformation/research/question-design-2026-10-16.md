# Question wording pass — 2026-10-16

This is a first wording pass over the authored prompt bank. It changes prompt text only: topic membership, filters, answer records, scoring, and gameplay are untouched. The aim is to remove avoidable formality and prestige qualifiers while retaining each prompt's existing answer classes. It is not a complete overhaul of question quality or answer coverage.

## Reference observations

- The [Krillion daily game](https://krillion.io/) presents one open-ended category prompt at a time, with a short hint and a single answer field. Its [FAQ](https://krillion.io/faq) says answer sets are built by aggregating and cleaning sources, notes that valid answers are sometimes missed, and distinguishes familiar-answer frequency from a manual fun-factor choice for deep answers. That supports keeping the question itself readable and giving players a way to recover from a missed match; it does not establish that MOM should copy Krillion's interface or scoring.
- The [official Family Feud history](https://www.familyfeud.com/about/) describes its format as guessing how 100 people answered, and says the first prompt was “Name a famous George.” The [Arkadium Family Feud help page](https://support.arkadium.com/en/support/solutions/articles/44002366581--family-feud-how-to-play-question-reports-scoring-using-gems-multiplayer) describes timed typed answers and tells players to say the first thing that comes to mind. The useful observed pattern is a direct, quickly understood category prompt. Family Feud's survey scoring is a different mechanic from MOM's curated factual answer catalog.

## Changes made

Thirty-one prompts were revised in `tools/misinformation_question_bank.mjs`. Examples include removing status qualifiers such as “well-known,” “famous,” “notorious,” and “major”; dropping bureaucratic evidence qualifiers such as “documented” or “recorded in historical sources” where the existing topic membership already supplies the intended subject scope; and making a few phrases more direct. Where the original prompt allowed multiple answer classes, the wording keeps those classes—for example, `science-02` still asks for a medical event, study, or discovery, and `technology-02` still includes a transport event, project, or space mission.

These edits are an inference from the references and the current authored bank, not a claim that the reference games prove a particular wording will perform better. Removing “famous” and similar terms also avoids telling players to guess the most familiar answer in a game whose reward system values rarity.

## Remaining limitation

The visible prompt is only half the contract. `topicQuestions` and `questionFilters` constrain which catalog subjects count. More welcoming wording cannot make an out-of-catalog answer valid, and it cannot add everyday categories absent from the catalog. A later pass should inspect actual answer coverage and rejection patterns, then broaden or rebalance the accepted sets alongside the prompt text. This pass makes no claim that the full bank is now broad, diverse, or solved.

The catalog retains 194 stable prompt IDs with 187 distinct wordings. Seven depth/legacy variants now share the same plain wording and identical accepted-subject pools. Rotation already treats identical `poolId` values as one pool; validation requires matching answer pools for matching wording rather than cosmetic synonyms.
