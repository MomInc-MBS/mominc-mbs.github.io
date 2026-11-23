---
title: Architecture
project: haunt
system_id: ARCHITECTURE
visibility: public
schema_version: 1.0.0
source_revision: c93f4656f054b2b4999a70fc5968a452c04e21eb
generated_at: 2026-11-23T22:54:39Z
evidence: see ai/TEST_RESULTS.json
---

# Architecture

HAUNT is built in layers. The game rules are plain JavaScript modules that run under Node with no wall clock and no unseeded randomness, so every session can be checkpointed and replayed. Thin servers expose those rules to phones over a local network.

## System map

| System | Role | Packet |
|---|---|---|
| Haunt runtime | Minotaur engine, monster brain, haunt loop, hold/deliver protocol, rejoin | [haunt-runtime](../ai/systems/haunt-runtime.md) |
| Content runtime | Rooms, sessions, checkpoints, rounds and the campaign lifecycle | [content-runtime](../ai/systems/content-runtime.md) |
| Professions | Player classes and tiers: registry, actions, event hooks, progression | [professions](../ai/systems/professions.md) |
| Items and effects | Item roles, wards, spatial and support items, world effects | [items-effects](../ai/systems/items-effects.md) |
| Haunts and finales | Haunt catalog, finale definitions, extra haunt families | [haunts-finales](../ai/systems/haunts-finales.md) |
| Phone and host | Unity phone client and TypeScript host (older track, not under active change) | [phone-host](../ai/systems/phone-host.md) |
| Build operations | Work queue, regression runner, dev doctor, this inspection portal | [build-ops](../ai/systems/build-ops.md) |

## Interfaces

- **Phone ↔ server:** WebSocket snapshots and commands. Commands carry identities and a stop generation; schemas reject unknown fields.
- **Hold actions:** a held action opens a server channel with a lease; the client heartbeats while held and confirms at the deadline. Release cancels without consuming anything.
- **Safety:** ALL-STOP latches the session. There is no local resume.
- **Checkpoints:** session state is plain JSON, saved and restored through the content runtime.

## Dependencies

- Node.js for rules, servers and tests. `ws` and `zod` from the existing host packages.
- Playwright for browser and emulated-phone tests.
- Unity for the native phone client.
- Python for build-queue tooling and this inspection generator.
