---
title: Build operations
project: haunt
system_id: build-ops
visibility: public
schema_version: 1.0.0
source_revision: c93f4656f054b2b4999a70fc5968a452c04e21eb
generated_at: 2026-11-23T22:54:39Z
evidence: see ai/TEST_RESULTS.json
---

# Build operations

**Purpose:** the tooling that runs the build: work queue and campaign status, dev doctor and smoke checks, the regression runner with a hard deadline, and this inspection generator.

**Interfaces**
- Campaign status command for the work queue.
- Dev doctor (diagnostics) and smoke (ephemeral server) checks.
- Regression runner: sequential suites, 30-minute deadline, evidence backup and restore.
- Inspection generator: record tests, generate, validate, scan, publish.

**Dependencies:** Python, Node.

**Evidence:** the generator has its own unit tests (secret fail-closed, staleness, repeatable output, safe publish, budgets).

**Limitations:** browser test runs overwrite historical evidence unless backed up first. Inspection regeneration is a manual command today.

**Next:** run the generator on every integration commit.
