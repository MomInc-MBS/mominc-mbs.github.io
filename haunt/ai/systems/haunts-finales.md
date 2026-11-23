---
title: Haunts and finales
project: haunt
system_id: haunts-finales
visibility: public
schema_version: 1.0.0
source_revision: c93f4656f054b2b4999a70fc5968a452c04e21eb
generated_at: 2026-11-23T22:54:39Z
evidence: see ai/TEST_RESULTS.json
---

# Haunts and finales

**Purpose:** the catalog of haunts and their objective finales.

**Interfaces**
- Haunt and finale catalog with definitions per haunt.
- Haunt handlers and extra haunt families (including robot and web families) built on the content runtime.
- Finale objectives checked by the runtime for win and lose.

**Dependencies:** content runtime; items; professions.

**Evidence:** covered by the `content-runtime` suite. Only the Minotaur haunt is playable end to end.

**Limitations:** other haunts are partial; their finales are defined but not driven by a full loop.

**Next:** after the Minotaur playtest, bring a second haunt onto the same loop.
