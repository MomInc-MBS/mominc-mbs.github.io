---
title: Haunt runtime
project: haunt
system_id: haunt-runtime
visibility: public
schema_version: 1.0.0
source_revision: c93f4656f054b2b4999a70fc5968a452c04e21eb
generated_at: 2026-11-23T22:54:39Z
evidence: see ai/TEST_RESULTS.json
---

# Haunt runtime (Minotaur)

**Purpose:** run one complete haunt: the Minotaur engine, the monster brain and the haunt loop, served to phones over the local network.

**Interfaces**
- Commands from phones: join, resume, move, pick up, deliver (hold), witness, stop. Commands carry an identity and the current stop generation. Unknown fields are rejected.
- Snapshots to phones: phase, round, nodes, offerings, creatures, the phone's own channel progress.
- Brain: pure function of state and runtime clock (`advanceTo(ms)`), seeded RNG. No wall clock, no unseeded randomness.
- Haunt loop phases: PREP, R1, BREATHER_1, R2, BREATHER_2, R3, DEBRIEF, COMPLETE, FAILED, STOPPED.

**Dependencies:** content runtime (campaign lifecycle, tribute rounds, checkpoints); `ws`, `zod`.

**Evidence:** Minotaur core suites (engine, brain, haunt, hold protocol, rejoin, transport) are in `TEST_RESULTS.json` as suite `minotaur-core`. Seeded replays are kept with the build's test runs. Browser safety test needs Playwright and is not in the recorded suites.

**Limitations:** see KNOWN_ISSUES 1–4. Not yet played on physical phones.

**Next:** real-phone game night ([NEXT_WORK_ITEM](../NEXT_WORK_ITEM.md)).
