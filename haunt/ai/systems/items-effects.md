---
title: Items and effects
project: haunt
system_id: items-effects
visibility: public
schema_version: 1.0.0
source_revision: c93f4656f054b2b4999a70fc5968a452c04e21eb
generated_at: 2026-11-23T22:54:39Z
evidence: see ai/TEST_RESULTS.json
---

# Items and effects

**Purpose:** items players find, carry and use, and the world effects they cause.

**Interfaces**
- Item records carry a role: usable, ambiance or hazard-cover.
- Item families: wards, spatial items, player support, status cleanse, truth reveal, garment wards.
- World effects apply item results to rooms and creatures.

**Dependencies:** content runtime; haunt definitions.

**Evidence:** covered by the `content-runtime` suite.

**Limitations:** about 280 item IDs have no effect text in the design masters and are spec-blocked.

**Next:** owner or source author supplies effect text; classify remaining items by role.
