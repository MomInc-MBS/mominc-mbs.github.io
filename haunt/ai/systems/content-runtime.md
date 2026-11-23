---
title: Content runtime
project: haunt
system_id: content-runtime
visibility: public
schema_version: 1.0.0
source_revision: c93f4656f054b2b4999a70fc5968a452c04e21eb
generated_at: 2026-11-23T22:54:39Z
evidence: see ai/TEST_RESULTS.json
---

# Content runtime

**Purpose:** the shared game runtime for rooms and sessions: room layouts, session join/resume/disconnect, checkpoints, the campaign lifecycle and tribute rounds. Haunts, items and professions plug into it.

**Interfaces**
- HTTP routes for join, resume, disconnect and checkpoint on an ephemeral or local port.
- Campaign lifecycle: phase list, breather advance (host only), terminal phases, all-stop.
- Session checkpoints as plain JSON with a maximum age.
- Room storage with stale-save rejection.

**Dependencies:** Node; scene server; item, profession and haunt modules.

**Evidence:** non-browser content suites are in `TEST_RESULTS.json` as suite `content-runtime`. Browser and emulated-phone suites run separately and are not recorded here yet.

**Limitations:** the persistent local preview can be stale; a page answering at `/` does not prove the current source is loaded.

**Next:** keep the runtime stable while the Minotaur haunt is playtested.
