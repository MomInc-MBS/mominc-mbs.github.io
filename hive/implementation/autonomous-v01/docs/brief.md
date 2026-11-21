# Hive AI initial brief

Date: 2026-11-20 (America/Los_Angeles)

## Ian's direction

> Hive AI new type we are building its a frame work

Ian asked this assistant to oversee its creation, use NVIDIA and Grok where
multiple points of view help, and use e2e army where available.

## Questions still open

1. What should the first complete task be: building/testing software, producing a
   reviewed answer, or general work with tools and memory?
2. What distinctive behavior should make this a new kind of framework?
3. Which execution environments and interfaces does the first task require?

## Provisional design exploration

Explore a small local, provider-neutral coordination core. Candidate concepts:
task, worker, run, artifact, review, verification evidence, and acceptance.
Consider deadlines, bounded concurrency, failures, cancellation, and ownership.
Do not assume every concept needs a service, model call, or user interface.

Reviews must describe which decisions depend on the answers above. The milestone
is a proposal until the first use case is chosen. No framework implementation,
provider integration, product test pass, or deployment is claimed yet.

## Review assignments

- NVIDIA/OpenCode: propose the smallest useful executable slice, contracts,
  component boundaries, and what can be reused instead of built.
- Grok: independently challenge the hypothesis and propose failure and acceptance
  tests, including where Tester Army helps and where exact checks are enough.

## Availability evidence

- T3 reports OpenCode and Grok can run delegated tasks.
- Catalog exposed `nvidia/deepseek-ai/deepseek-v4.1-flash` through OpenCode and
  `grok-4.7-build-fast` through Grok. The NVIDIA endpoint rejected its run as
  retired; the Grok provider completed its configured review successfully.
- Tester Army is present at `D:\Repos\tester-army-e2e`; the installed CLI in
  `D:\Repos\myr5-e2e` reports `0.21.1` under Node `v24.19.0`.
- No Hive AI test target exists yet, so no product e2e run has occurred.

## Routing record

Ruflo returned keyword-fallback routing (tester/reviewer) and a generic Opus
recommendation. Laya's context packet reported its local service down and a
deterministic strong-local hint. These are advisory. The actual design workers
follow Ian's explicit NVIDIA/Grok request: NVIDIA-hosted DeepSeek V4.1 Flash and
Grok 4.7 Fast, each assigned one bounded read-only review.

## Dispatch boundary

T3 rejected binding a local delegate from the current Haunt conversation to the
new Hive AI project. Both successful dispatches are therefore reasoning-only
reviews of the supplied brief, with no tools or filesystem ownership. Their
runtime remains the parent Haunt workspace. No implementation work is assigned
there. Future implementation delegates must have the correct workspace binding
before they receive file ownership.

Dispatch acknowledgment is not proof of a successful model result. Both attempts
are terminal; their outcomes follow. No implementation worker is running.

### NVIDIA attempt

The NVIDIA-hosted DeepSeek V4.1 Flash task failed before producing a review.
The endpoint returned HTTP 410 and stated the model reached end of life on
2026-11-16 at 08:00 UTC. Its catalog listing was therefore stale. No replacement
model has been dispatched and no NVIDIA review is claimed.

### Grok result

The Grok provider, configured as `grok-4.7-build-fast`, completed a read-only
review. The parent read its final response through T3. It recommends evidence
verification as a possible differentiator, using software-build/test as a first
candidate because exact checks can contradict an agent's completion claim.

The parent has not adopted that use case as Ian's choice. The synthesis and
qualifications are in [the first milestone proposal](first-milestone.md).
