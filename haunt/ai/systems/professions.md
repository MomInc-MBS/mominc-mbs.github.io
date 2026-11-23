---
title: Professions
project: haunt
system_id: professions
visibility: public
schema_version: 1.0.0
source_revision: c93f4656f054b2b4999a70fc5968a452c04e21eb
generated_at: 2026-11-23T22:54:39Z
evidence: see ai/TEST_RESULTS.json
---

# Professions

**Purpose:** player classes with tiered passives and actions, plus progression.

**Interfaces**
- Registry: each profession tier is implemented, partial, blocked, pending a named hook, or spec-blocked. Pending tiers list the hook they need.
- Actions and hold commands routed through the runtime.
- Event hooks: producers emit capture, scare and similar events that profession passives consume.

**Dependencies:** content runtime; event producers.

**Evidence:** covered by the `content-runtime` suite. Independent reviews accompany each accepted profession module.

**Limitations:** most tiers wait on missing hooks: doors/vents, reveal markers, monster behavior, noise, Director Q&A, dodge/hit, shop, revive.

**Next:** wire accepted modules into runtime hold commands; add noise, Director Q&A and monster ignore/decoy producers; design the monster attention contract.
