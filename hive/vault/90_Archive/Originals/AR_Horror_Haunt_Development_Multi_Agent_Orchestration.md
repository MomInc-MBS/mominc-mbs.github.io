# AR Horror App — Parallel Haunt Development Orchestration

> **Execution handoff:** Astra (head orchestrator) → Sol (section overseer) → Luna (initial coder) → Grok 4.7 (reviewer) → [on failure: NVIDIA Nemotron (problem solver) → Terra (solution coder) → Grok 4.7 (re-review), max 3 cycles] → Sol (section-vision verification) → Astra (main-vision integration)
>
> **Primary objective:** Continue implementing the already-designed haunts against a metric-scale, fixed-point 3D test environment while real-world mapping, relocalization, and geolocation remain unresolved. Preserve all existing work and make haunt logic portable to the final room maps.

## 0. Mandatory operating rules

1. **Inspect the existing repository first.** Identify actual app framework, renderer, device targets, AR SDK, existing haunt code, existing directions, asset paths, and the current mapping pipeline. Do not assume Unity, Unreal, Godot, React, or a new engine.
2. **Use the user's existing haunt designs and directions as the source of truth.** Do not invent or redesign haunts, rewrite their narrative behavior, or silently drop requirements.
3. **Do not block haunt coding on GPS/geolocation.** Develop in a metric local coordinate frame. GPS position, real-room reconstruction, and phone-to-room alignment are separate integration concerns.
4. **Do not confuse a metric scene with real-world alignment.** Verify units and imported dimensions; do not claim an open-source test room proves real-world geolocation or AR relocalization.
5. **Reuse existing software and dependencies where possible.** Check the user's software inventory and actual installation/readiness before introducing a tool.
6. **Never overwrite or replace the existing reconstruction pipeline.** Preserve existing MASt3R or other mapping integrations. Keep the `RoomPackage` boundary and `room_to_ar_world_transform` concept.
7. **Isolate parallel edits.** Luna and Terra must use separate branches/worktrees or controlled sequential handoffs. Terra implements approved solutions to findings from Luna’s work; no concurrent shared-file edits without Sol’s ownership assignment.
8. **No unverified completion claims.** Every completed task needs evidence: changed files, test command/output, and any remaining limitations.
9. **Licensing gate.** Confirm source asset and dependency licenses, including commercial-use permissions, before committing third-party assets or models.
10. **Keep changes incremental and reversible.** Small commits, reproducible setup, and no destructive migrations.
11. **Astra sets the shared contract before mass implementation.** Freeze a versioned `RoomPackage` interface, metric unit and axis convention, named placement resolver, player pose interface, and test requirements before Sol assigns multiple haunt sections. Changes require a documented compatibility review.
12. **Tests are mandatory evidence, not optional review commentary.** Run applicable automated checks before each Grok submission, again after Terra repairs, and at Astra integration. Failures or missing checks block promotion unless an explicit exception is approved and documented.
13. **Maximum three corrective cycles per finding group.** After the third unsuccessful Nemotron → Terra → Grok cycle, stop automatic repair and escalate to Sol; architectural or scope issues go to Astra. Do not loop indefinitely.
14. **Independent review inputs.** Grok receives source requirements, actual diffs, test output, and reproduction steps—not only the coder's narrative. Nemotron receives concrete failing evidence, relevant code, and prior attempted fixes.
15. **Only versioned, auditable section packages reach Astra.** Include branch/commit, interface version, tests/logs, Grok verdict, Sol acceptance, known limitations, integration steps, and rollback instructions.

## 1. Command hierarchy and responsibilities

```text
ASTRA — HEAD ORCHESTRATOR / MAIN VISION
└── SOL — SECTION OVERSEER / SECTION VISION
    └── LUNA — PRIMARY FEATURE CODER
         └── AUTOMATED TESTS (must run)
              └── GROK 4.7 — INDEPENDENT REVIEW
                   ├── PASS ────────────────────────────────┐
                   └── CHANGES REQUIRED                     │
                        └── NVIDIA NEMOTRON — ROOT CAUSE    │
                             └── TERRA — TARGETED REPAIR    │
                                  └── AUTOMATED REGRESSION  │
                                       └── GROK RE-REVIEW   │
                                            ├── PASS ───────┤
                                            └── FAIL: retry │
                                                max 3; then│
                                                escalate   │
                                                           ▼
                                     SOL — SECTION ACCEPTANCE
                                                           ▼
                                     ASTRA — INTEGRATION TESTS
                                            + FINAL MERGE
```

**Strict sequence:** Luna implements the assigned haunt or section first. Grok 4.7 reviews Luna’s implementation. If Grok identifies a defect, gap, or blocker, NVIDIA Nemotron diagnoses it and proposes a concrete solution. Terra implements that solution. Grok reviews Terra’s changes. Sol verifies the complete result meets the **section vision**, not merely that tests pass. Astra then integrates the Sol-approved section into the **main vision**. No role may bypass these gates.

**Clean first-pass rule:** If Grok passes Luna’s work with no changes required, Nemotron and Terra are not invoked for artificial rework; the deliverable proceeds to Sol. If Terra’s solution fails Grok’s review, loop **Grok → Nemotron → Terra → automated tests → Grok** for at most **three repair cycles**. After three unsuccessful cycles, halt and escalate to Sol (and to Astra for architecture/scope decisions). If Sol rejects section fit, Sol sends precise findings into the same solution loop. Astra can reject integration and return work to Sol with project-level feedback.

**Availability rule:** Use actual configured agents/models only. Verify that the local system can invoke Astra, Sol, Luna, Terra, Grok 4.7, and NVIDIA Nemotron; do not assume a model name means an accessible endpoint or claim that a review happened without a real run. If unavailable, mark that gate BLOCKED and report it to Astra.

### Astra — Head orchestrator / main-vision authority

- Own the complete AR horror app vision, priorities, integration strategy, and final approval.
- Delegate bounded sections with written acceptance criteria to Sol.
- Receive only Sol-verified section packages, review cross-section compatibility, and authorize integration into the main project.
- Resolve scope conflicts and project-level blockers; never bypass Sol’s verification or Grok’s review.
- Maintain the overall roadmap, integration status, and rollback decisions.

### Sol — Overseer / section-vision authority

- Translate Astra’s assignment into a concrete section vision, requirements checklist, and test criteria grounded in the user's existing haunt directions.
- Manage Luna, Grok 4.7, Nemotron, and Terra through conditional routing, a three-cycle repair limit, and evidence-based acceptance.
- Ensure the approved metric-scale sandbox, `RoomPackage` boundary, and existing project interfaces are respected.
- After Grok PASS, independently verify the **whole section**: intended experience, haunt directions, compatibility, portability, tests, and integration constraints.
- Return unmet requirements for correction; submit only verified, evidence-backed packages to Astra.

### Luna — Initial coder

- Implement the original haunt/section assignment using existing designs, code, and assets.
- Add unit/integration tests, deterministic replay, and placement-independent behavior.
- Deliver a commit/branch, implementation notes, requirement-to-code mapping, and test evidence to Grok 4.7.
- Do not self-approve, merge, or bypass the reviewer.

### Grok 4.7 — Independent reviewer (two checkpoints)

- **Review 1:** Examine Luna’s implementation against original directions, interfaces, tests, spatial correctness, and section acceptance criteria.
- Return PASS, CHANGES REQUIRED, or BLOCKED, with exact reproduction steps and file/line findings. Inspect actual diffs, original requirements, and executed test evidence; do not accept coder summaries as proof.
- **Review 2:** Independently review Terra’s implementation of Nemotron’s solution, including regression tests and the original requirements.
- Reject incomplete fixes and return findings to Nemotron/Terra; pass only verified work to Sol.
- Use the same reviewer role at both gates; queue work if only one Grok session exists.

### NVIDIA Nemotron — Problem solver / diagnosis and fix specification

- Receive Grok’s actionable findings, relevant code, logs, tests, and section criteria.
- Diagnose root cause from failing tests/logs, source code, and prior attempts; assess alternatives and propose the smallest compatible fix. On repeated failure, revise the diagnosis instead of repeating the same proposal.
- Give Terra an explicit implementation plan: files/interfaces affected, expected behavior, tests, risks, and acceptance criteria.
- Escalate ambiguous requirements to Sol rather than inventing new haunt behavior.
- Do not silently implement, approve, or merge code; the solution-design role is distinct from Terra’s coding role.

### Terra — Solution coder

- Implement Nemotron’s approved corrective plan in an isolated branch/worktree or controlled handoff from Luna’s changes.
- Add regression tests demonstrating that the reported defect is fixed without breaking the original haunt requirements.
- Submit code, test evidence, and a finding-by-finding resolution matrix to Grok 4.7 for the second review.
- Address review failures through the Nemotron → Terra → Grok loop; do not self-approve or merge.

## 2. Phase plan and ownership

| Phase | Responsible roles | Exit condition |
|---|---|---|
| 0 — Repository discovery | Astra delegates; Sol inventories | Verified app framework, existing haunt manifest, source assets, and integration constraints |
| 1 — Metric sandbox | Luna implements; Grok reviews; Nemotron/Terra resolve findings | Verified meter scale, simulated player, collision/occlusion checks; Sol confirms sandbox section vision |
| 2 — Portable haunt contract | Sol defines; Luna codes; full review/fix pipeline | `RoomPackage`, named placements, triggers, tests, and debug replay accepted |
| 3 — Single-haunt vertical slice | Luna → Grok → Nemotron/Terra as needed → Grok → Sol | Original directions satisfied, full replay works, Sol accepts |
| 4 — Portability proof | Same pipeline | Same haunt works in two arrangements without rewriting behavior |
| 5 — Remaining haunt sections | Sol assigns one bounded section at a time through full pipeline | Each section passes Grok and Sol vision verification |
| 6 — Main integration | Astra accepts Sol-approved sections | Main-vision compatibility, integration tests, and rollback path verified |
| 7 — Real-room adapter (later) | Astra assigns; Sol oversees full pipeline | Physical scale, room alignment, tracking/relocalization validated on target device |

**Dependency gate:** Prove portability on one representative haunt before expanding to the full catalog. Nemotron and Terra are the corrective-solution stage, not an independent second stream of unrelated haunt assignments. Astra can run multiple independent section pipelines only when real agent capacity, code ownership, and review capacity are verified.

## 3. Test environment requirements

Use an open-source scene with known dimensions and an explicit coordinate system, or create a simple meter-scaled test room if importing a third-party scene would slow development. One candidate to evaluate is [mertgulerx/world-collection](https://github.com/mertgulerx/world-collection), including its office scenes; confirm actual file formats, dimensions, licensing, and import compatibility before choosing it. A Gazebo/SDF scene may require conversion into the existing renderer.

The test environment must provide:

- A defined origin and axis convention; distances in meters.
- Walls, doorways, furniture or obstacles as needed by the existing haunts.
- Visual geometry, collision geometry, and occlusion geometry (logically separate even if they share simple meshes initially).
- A simulated player transform: position, rotation, movement, and relevant interactions.
- Debug overlays for spawn points, waypoints, trigger volumes, line of sight, and active haunt states.
- A repeatable scale test: reference length, two markers separated by a known number of meters, and collision alignment.

**Important:** The environment is a test harness, not a substitute for proving real-room reconstruction or AR alignment.

## 4. Portable data contracts (illustrative; adapt to existing code)

Do not force these exact field names if the app already has equivalent schemas.

```json
{
  "room_id": "sandbox_office_01",
  "units": "meters",
  "coordinate_system": "documented_local_frame",
  "visual_geometry": "existing_or_imported_scene_reference",
  "collision_geometry": "collision_reference",
  "occlusion_geometry": "occlusion_reference",
  "named_points": {
    "doorway_a": [2.0, 0.0, 4.0],
    "behind_wall_a": [5.0, 0.0, 4.0]
  },
  "room_to_ar_world_transform": null,
  "scale_verified": false
}
```

The numeric values above are **examples only**, not measured positions. `room_to_ar_world_transform` remains unset until the room is aligned with an actual AR session. The axis order must be adapted to the chosen engine.

```json
{
  "haunt_id": "EXISTING_HAUNT_ID",
  "behavior_ref": "existing_haunt_implementation",
  "spatial_requirements": ["spawn", "trigger", "route"],
  "placement": {
    "spawn": "doorway_a",
    "trigger": "hallway_trigger_a",
    "route": ["doorway_a", "behind_wall_a"]
  }
}
```

**Rule:** A haunt reads named roles through a room/placement resolver. No haunt should directly depend on sandbox scene coordinates or asset-specific mesh names. The final room can supply different bindings to the same roles.

## 5. Assignment and sequential review/solution protocol

Astra maintains a canonical manifest derived from **existing** haunt directions and a versioned shared haunt/room contract. Each entry records exact haunt ID, source files, section vision, spatial requirements, assigned Luna implementation, Grok first verdict, Nemotron diagnosis (if required), Terra corrective commit (if required), Grok second verdict, Sol section acceptance, and Astra integration status.

### Required per-section workflow

1. **Astra → Sol:** Assign a bounded section and state its contribution to the overall app vision.
2. **Sol → Luna:** Supply verified directions, relevant assets, interfaces, spatial roles, and acceptance criteria.
3. **Luna → automated checks → Grok:** Implement the section, execute applicable tests, and submit actual commit/diff, logs, and requirements checklist. A failed/missing mandatory test is not a review PASS.
4. **Grok review 1:** PASS proceeds to Sol; CHANGES REQUIRED/BLOCKED produces a specific findings packet.
5. **Grok → Nemotron:** For actionable findings, diagnose root causes and design concrete, compatible fixes; escalate unresolved specifications to Sol.
6. **Nemotron → Terra:** Implement the proposed solutions and regression tests in an isolated branch or controlled handoff.
7. **Terra → automated regression checks → Grok re-review:** Review every fix and check for regressions. On failure, repeat steps 5–7, recording the attempt number and changed diagnosis. **Maximum three repair cycles**; if still failing, halt and escalate to Sol. On PASS, send the full package to Sol.
8. **Sol section verification:** Verify that the whole delivered section accomplishes its intended vision, follows original haunt directions, passes portability and integration checks, and has adequate evidence. Reject with precise findings if not.
9. **Sol → Astra:** Submit the accepted section, tests, review record, known limitations, and integration instructions.
10. **Astra main-vision integration:** Confirm the section advances the overall AR horror app, verify its versioned delivery package, run automated cross-section integration checks, authorize merge only on success, and assign the next section. If rejected, return it to Sol for another correction cycle.

### Code ownership and handoff

- **Sol-controlled:** shared runtime contracts, room schema, tracking adapter, collision/occlusion integration, and section acceptance criteria.
- **Luna-owned:** initial implementation of assigned sections and first-pass tests.
- **Terra-owned:** changes specifically required to implement Nemotron’s corrective solutions and regression tests.
- **Grok-owned:** review findings, verdicts, and review evidence; no unreviewed code changes.
- **Nemotron-owned:** diagnosis and proposed fixes; no silent code merges.
- **Astra-owned:** main-vision acceptance and final integration authorization.
- Preserve commits and branch provenance. Terra should base corrective work on the reviewed Luna commit; never overwrite uncommitted Luna work. Shared-interface changes require Sol approval.

## 6. Acceptance criteria

### Per haunt

- Matches the original written directions and uses existing approved assets.
- Uses metric distances and named placement roles; no hardcoded test-room locations in behavior code.
- Runs from start to finish, resets cleanly, and can be replayed.
- Handles missing placement or incompatible geometry with an explicit diagnostic rather than crashing.
- Has executed automated test results, Grok 4.7 PASS verdict (including second review if Terra made changes), Sol section-vision acceptance, and Astra integration approval.

### System-wide

- One representative haunt works in two different spatial arrangements with **no changes to behavior code**.
- Multiple haunts coexist without event-state leaks or shared-file conflicts.
- Debug tools show triggers, routes, player pose, and state transitions.
- A final room can be swapped in via the `RoomPackage`/placement interface without reimplementing haunt logic.
- No claim that real-world scale, occlusion, relocalization, or geolocation is validated until device tests prove it.

## 7. Reporting cadence and escalation

For each completed section, **Sol** sends Astra:

```text
SECTION / HAUNT ID: <identifier>
SECTION VISION: <intended outcome and source directions>
LUNA INITIAL IMPLEMENTATION: <commit, tests, requirements mapping>
GROK REVIEW 1: <PASS / CHANGES REQUIRED / BLOCKED; findings>
NEMOTRON SOLUTION: <root cause and proposed fix, or NOT REQUIRED>
TERRA SOLUTION CODE: <commit, regression tests, or NOT REQUIRED>
GROK REVIEW 2: <PASS / CHANGES REQUIRED / BLOCKED, or NOT REQUIRED>
SOL SECTION-VISION VERIFICATION: <PASS / REJECT; evidence>
INTERFACE / ROOMPACKAGE VERSION: <version>
REPAIR CYCLES: <0-3; failure history if any>
AUTOMATED TEST COMMANDS / RESULTS: <commands, logs, pass/fail, environment>
BRANCH / COMMIT / DIFF: <immutable identifiers>
KNOWN LIMITATIONS: <items and impact>
INTEGRATION / ROLLBACK INSTRUCTIONS: <steps>
ASTRA ACTION REQUEST: <integrate / return for correction / escalate>
```

No automatic promotion on the basis of a coder’s self-report. If a review/model is unavailable, preserve the pending work and mark the gate BLOCKED. If a finding is a specification conflict, Sol resolves it against existing directions and escalates scope changes to Astra. Real-world AR mapping remains separately unverified until physical device testing.

## 8. Quality gates, independence, and bounded escalation

### Gate A — Astra's shared contract (before parallel haunt work)

Astra and Sol inspect the existing app and record the **versioned** canonical interfaces for `RoomPackage`, coordinate origin and axis order, meters-per-unit, placement resolver, simulated/live player pose, collision/occlusion inputs, and haunt lifecycle. This is a contract decision, **not** permission to replace existing architecture. Run one-haunt portability proof before broad assignment. Any incompatible schema edit requires Sol's change proposal and Astra's approval.

### Gate B — Executed tests before Grok

Luna must run the available relevant checks and supply command lines, environment, exit codes, and logs. Required behaviors for a relevant haunt include trigger boundaries and distances, spawn validity, collision/line-of-sight as applicable, event timing, animation/audio sequencing, clean reset/replay, missing-placement handling, and a second placement arrangement. Not every haunt requires every behavior; Sol maps checks to the actual directions. Grok independently compares the implementation and evidence to source requirements. A model's assertion of success does **not** substitute for a test run.

### Gate C — Conditional repair, maximum three attempts

- **PASS on Luna's first review:** Skip Nemotron and Terra entirely; send to Sol.
- **First failed review:** Nemotron provides a root-cause hypothesis grounded in logs/diffs; Terra repairs and adds a regression test; tests run; Grok re-reviews.
- **Second failed review:** Nemotron must re-examine its hypothesis using the new failure evidence and history, not repeat the same patch; Terra revises; tests run; Grok re-reviews.
- **Third failed review:** One final evidence-backed repair may be attempted. If Grok still rejects, **STOP automatic retries** and send the complete failure history to Sol. Sol decides whether to revise the section specification, reassign, or escalate architectural/scope decisions to Astra. No silent fourth attempt.
- **BLOCKED (missing model, unavailable tools, irreproducible environment, unclear requirements):** Do not pretend a review or fix happened. Sol owns unblock decisions.

### Gate D — Sol verifies section vision

Sol checks the original haunt directions and section acceptance criteria **independently of Grok's code-quality verdict**. Verify gameplay experience, portable placement, compatibility, evidence, and known limitations. If rejected, Sol issues a precise requirement gap and routes it to the appropriate owner; the three-attempt cap still applies to the same unresolved issue.

### Gate E — Astra integrates only verified deliverables

The section package must contain: source requirement IDs; branch and commit hash; diff; shared interface version; executed test commands, environment and logs; Grok PASS; Sol acceptance; known limitations; integration steps; rollback plan. Astra checks for schema compatibility, cross-haunt interference, shared-state leaks, and main-app regressions in the target branch before authorizing a merge. A sandbox PASS does not imply real-device AR alignment is verified.

### Agent evidence boundaries

| Agent | Authority | Must not substitute for |
|---|---|---|
| Astra | Master architecture, prioritization, merge approval | Executed integration tests |
| Sol | Section specification, assignments, section acceptance | Grok's independent code review |
| Luna | First implementation and test creation | Reviewer verdict |
| Grok 4.7 | Independent diff/requirement/test review | Actual test execution or Sol's vision acceptance |
| NVIDIA Nemotron | Failure diagnosis and repair specification | Terra's implementation or test evidence |
| Terra | Targeted repair and regression tests | Grok's re-review |

---

## 8. Copy-paste launch directive for the local orchestrator

> **ASTRA: You are the head orchestrator and own the complete AR horror app vision. SOL is the section overseer and must verify each section accomplishes its intended vision before sending it to you. Execute this exact pipeline for each assigned section: SOL briefs LUNA; LUNA writes the initial haunt code and tests; GROK 4.7 independently reviews LUNA's work; if GROK finds defects or gaps, NVIDIA NEMOTRON diagnoses the problems and specifies fixes; TERRA codes those solutions and regression tests; GROK 4.7 reviews TERRA's corrections; repeat the NEMOTRON → TERRA → automated tests → GROK loop **at most three times** per unresolved finding, then STOP and escalate to SOL (ASTRA for architecture/scope). SOL then independently verifies the completed section against its original directions, tests, and section vision. Only SOL-approved sections return to ASTRA for cross-project review and integration into the main vision. If GROK passes LUNA's first implementation, skip unnecessary NEMOTRON/TERRA rework and send directly to SOL. Do not skip required review or acceptance gates. Before distributing multiple haunts, establish a versioned shared `RoomPackage`, meter/axis convention, named-placement resolver, player-pose interface, and test contract; prove portability with one haunt. Start by inspecting the existing repository, approved haunt directions, local software availability, and mapping handoff. Do not assume a game engine or that named models are actually accessible. Build a verified meter-scale sandbox and portable fixed-point `RoomPackage` interface so haunt development continues without waiting for real-room geolocation. Preserve existing code, assets, mapping integrations, and original haunt behavior. Run actual tests before every review and at integration. Give GROK the original requirements, actual diff and logs, not just LUNA/TERRA summaries; give NEMOTRON concrete failures and previous attempts. Require a versioned section package with commits, test logs, review verdicts, repair history, SOL acceptance, known limitations, integration and rollback instructions. Never claim completion without verified execution.**

## 9. Immediate first actions

1. **Astra:** Establish main vision and assign the metric-sandbox section to Sol.
2. **Sol:** Inspect the repository, establish section acceptance criteria, and brief Luna.
3. **Luna:** Implement the sandbox and first representative haunt; submit tests and commit to Grok.
4. **Grok 4.7:** Review Luna's work and issue PASS or actionable findings.
5. **NVIDIA Nemotron:** Only on a failed review, diagnose concrete findings and specify a minimal compatible fix; reconsider diagnosis on repeated failure.
6. **Terra:** Implement Nemotron's fix and regression tests; resubmit to Grok.
7. **Grok 4.7:** Review Terra's tested fixes; cap the repair loop at three cycles, then escalate unresolved failures to Sol; send PASS to Sol.
8. **Sol:** Verify the entire section meets its vision and is ready for integration.
9. **Astra:** Pull the accepted section into the main vision, run integration checks, and assign the next section.

**Definition of success:** Existing haunt coding proceeds in a metric sandbox despite unresolved real-world mapping. Luna codes, Grok reviews, Nemotron solves review findings, Terra implements solutions, Grok verifies the corrections, Sol validates section vision, and Astra integrates each accepted section into the overall app.
