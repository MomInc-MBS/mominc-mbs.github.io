# Local Coder Prompt: Continuous Video Uploading

## Your assignment

Work directly on my local computer. Find and use **the video uploading software I already have and the finished videos I already have**. Complete any missing automation, verify the real workflow, and leave it running continuously.

The goal is to upload as many eligible videos as possible at the **highest reliable rate supported by my existing uploader, accounts, connection, and destination limits**, while preserving my established publishing settings.

Drain the existing backlog, pick up newly finished videos automatically, and resume after interruptions. Do not impose an arbitrary total-video cap or stop after a demonstration batch.

**This is an implementation-and-operation task. Do not finish with only a plan, suggested software, pseudocode, or instructions for me to perform the work.**

## 1. Find the existing setup before changing it

Inspect the current project, applicable project instructions, local documentation, uploader configuration, launchers, running processes, relevant scheduled tasks, logs, and previous upload records. Follow references to the actual media directories and destination accounts.

Use `Ian-AI-Generation-and-Game-Design-Software.pdf` as a starting reference if available. It is an inventory snapshot dated November 15, 2026; verify the current machine rather than assuming its recorded readiness still applies.

These are existing discovery pointers from that inventory:

| Component | Recorded location | Recorded status |
| --- | --- | --- |
| MBS Clipping Workbench | `D:/MOM Rig/pipeline/Open Clipping Workbench.cmd` | Prepared; launch not tested |
| Remotion / MBS Motion | `D:/MOM Rig/remotion` | Prepared |
| MOM Channel Surf | `C:/Users/ianmy/Documents/Codex/Apps/MOM Channel Surf` | Running during the inventory |
| FFmpeg / ffprobe | Commands recorded as available on PATH | Installed |

Source: the named inventory, pages 12–13. These pointers **do not establish which application uploads videos or where finished videos are stored**. The inventory excluded generated media. Locate the actual uploader and source folders from current local evidence.

Establish and record:

- The actual uploader, its project/install path, version, launch command, and working integration method.
- Its existing queue, upload history, and whether another worker is already running.
- The finished-video folders or manifests and their inclusion/exclusion rules.
- The intended platform and account/channel for each source or queue.
- Existing titles, descriptions, thumbnails, captions, visibility, scheduling, ordering, and other required publishing fields.
- Authentication readiness and any current uploader, account, or service limits.

Reuse the working application and its supported API, CLI, queue interface, or existing automation. If it only offers an interactive interface, extend the established automation where permitted and detect failures explicitly. Do not claim an unattended workflow works while it still needs unhandled manual clicks.

Prefer repairing or extending the existing uploader. Add only the missing queue/supervision layer when necessary, in its current language/runtime where practical. Preserve unrelated code, local changes, and configuration. Back up configuration before changing it.

Do not replace the stack, migrate the workflow, buy services, or create accounts just to satisfy this task. Reuse existing credentials through their intended mechanisms; keep secrets out of code, logs, screenshots, and handoff documents.

## 2. Establish exactly what should be uploaded

Use the existing publishing queue, approved manifest, or designated finished/export folders as the source of truth. Discovering a video elsewhere on disk does not make it eligible for publication.

- Include all eligible existing videos, then watch for new completed videos.
- Preserve existing source-to-account routing. Upload to multiple destinations only where that mapping is already established.
- Preserve approved metadata and publishing preferences. Do not invent descriptions, tags, visibility, audience classifications, or a new posting cadence.
- Respect exclusions for raw footage, unfinished renders, temporary files, rejected clips, and material already completed for that destination.
- Preserve source files. Do not delete, move, rename, or modify originals as part of uploading.
- If conversion is genuinely required by the existing destination, use the available media tools to create a separate derivative and retain its relationship to the original. Avoid blanket re-encoding.

Before queueing a file, establish that rendering/copying has finished. Prefer the producer's completion marker or manifest; otherwise check that size and modification time remain stable for a configurable interval and that the media can be opened and probed. Recheck its identity before uploading. If it changes, invalidate the old preparation and reassess it.

If a necessary source, account, or publication setting cannot be established, complete all independent implementation work and ask a focused question with the concrete alternatives found. **Do not ask for permission again for each video when the existing source, destination, and settings already establish the workflow.** Hold only the affected jobs when possible.

## 3. Build or reuse a durable queue

Reuse the uploader's persistent queue if it already provides these guarantees. Otherwise add a small transactional local store, such as SQLite, without creating competing queue owners.

Each upload job must retain enough information to resume and audit it:

- Stable job ID, source path, content identity, source size/mtime, and relevant metadata.
- Intended platform/account/channel and required publication outcome.
- Current state, attempts, next eligible retry time, and last actionable error.
- Worker ownership and timestamps.
- Remote upload/session ID, remote video ID, available URL, and last verified remote state.

Track upload transfer, remote processing, and publication separately. A video can be successfully uploaded yet still processing, private, or scheduled; do not call those states “published.” Completion must match the existing workflow's intended outcome.

### Duplicate prevention and restart recovery

- Treat content identity plus the intended destination as the deduplication basis. Filenames alone are insufficient.
- Carry the source identity through derivatives so a compatibility conversion does not become an unintended second upload.
- Import/reconcile usable history from the existing uploader before adding backlog jobs. Consult destination history where supported; avoid relying on matching titles alone.
- Do not globally mark a video complete when only one of several configured destinations has succeeded.
- Persist remote IDs and resumable session information as soon as available. Use supported idempotency features where the uploader exposes them.
- If a timeout or crash happens after a remote submission might have succeeded, reconcile that submission before retrying. If its outcome cannot be determined, hold it as `NEEDS_RECONCILIATION` instead of blindly creating another upload.
- Recover interrupted jobs before making them available to workers again. Prevent simultaneous controllers and use atomic job claims so two workers cannot submit the same job.
- Coordinate with any existing uploader worker; do not launch an overlapping second system.
- A failed, blocked, scheduled, or completed job must not become a fresh upload merely because a folder scan sees the file again.

Preserve queue history when a drive or network folder disappears. Mark it unavailable and retry access later.

## 4. Run continuously at the highest reliable throughput

The normal loop should be:

1. Reconcile existing state and discover eligible completed files.
2. Claim ready jobs whose destination and retry windows permit work.
3. Upload using the existing software.
4. Persist the remote result and track processing/publication as appropriate.
5. Continue immediately with other eligible work.
6. When idle or temporarily limited, wait efficiently and resume automatically.

Use folder watching plus a periodic scan so missed filesystem events, restarts, and time spent offline do not lose videos. Use the existing upload order; if none exists, use a stable oldest-ready-first order.

Reuse current worker settings when they are sound. Otherwise begin with a working baseline and increase **bounded** concurrency only when the installed uploader and destination support it. A single interactive uploader session may need serialization. Separate destination queues should make progress without one failure blocking everything.

Optimize confirmed successful throughput, not the number of requests launched. Consider upload bandwidth, disk access, memory, uploader stability, remote processing capacity, and shared account/API-project quotas. Set sensible resource limits so continuous uploading remains usable on my PC.

Check current official documentation and the actual account/uploader responses for limits. Do not hardcode guessed daily upload allowances. Respect retry instructions, quota resets, scheduling capacity, and account restrictions. Aggregate limits across workers sharing the same quota. Do not evade limits by switching accounts or proxies.

Uploading ahead of a posting schedule is allowed only where the existing workflow supports it. Preserve the publishing schedule even if transfer capacity is higher.

Keep retry and reset times in persistent state. When a limit clears, automatically continue. When the queue is empty, stay alive and watch for new files.

## 5. Recover without losing progress

Handle these cases explicitly:

| Situation | Required behavior |
| --- | --- |
| Network interruption or temporary server failure | Resume the existing upload when supported; otherwise reconcile before retrying, with bounded exponential backoff and jitter |
| Rate limit or quota exhaustion | Respect the supplied delay/reset time; pause the affected quota scope and continue unrelated eligible work |
| Expired login or authentication challenge | Pause that destination, preserve state, and show the exact local sign-in action needed |
| Invalid media, missing required metadata, or permanent rejection | Record a useful reason, isolate the job, and continue other eligible videos |
| Upload accepted but processing fails | Record the remote ID and failure; do not treat it as published or automatically create duplicates |
| PC sleep, process crash, or restart | Recover persisted state and reconcile in-flight work before continuing |
| Source drive unavailable | Retain all job/history records and retry access later |

Bound automatic retries so a permanently broken file cannot monopolize the queue. Keep delayed jobs from blocking ready jobs. Do not busy-loop when waiting for files, authentication, remote processing, or a reset.

An exit code of zero, closed dialog, or finished progress bar is not sufficient proof of success. Confirm the destination's accepted item/status through the strongest evidence the existing integration exposes. State any verification limitation honestly.

## 6. Provide simple controls and ongoing operation

Use the current interface where available; otherwise provide small local commands or launchers for:

- **Start:** launch or attach to the single continuous worker.
- **Pause:** stop claiming new uploads and preserve in-flight state.
- **Resume:** continue a paused queue.
- **Stop:** shut down cleanly with recoverable progress.
- **Status:** show queue counts, active jobs, recent successes, retry times, and blockers.

Make manual pause/stop persist so a supervisor does not immediately undo it. Provide a deliberate failed-job retry operation that rechecks remote state before resubmission.

Use the machine's appropriate existing background/scheduled-task mechanism for automatic recovery. On Windows, a user task may be appropriate; an interactive uploader may require the user to remain signed in. Configure for the actual runtime and report that requirement. Do not claim uploads continue while the computer is powered off or asleep.

Keep rotating, redacted logs and a durable history. Show counts for ready, active, processing, uploaded/scheduled/published, waiting, blocked, and failed jobs without combining incompatible states. Report recent successful throughput and the current bottleneck.

## 7. Verify, then leave it working

Run targeted verification for the risks that could lose work or create duplicate posts:

- Existing and newly added finished videos enter the queue; partial files do not.
- Rescanning or renaming an already known file does not create a duplicate for the same destination.
- A restart recovers queue state and reconciles an uncertain remote result.
- Temporary errors and quota waits preserve the next retry time.
- A blocked file/account does not stop unrelated eligible work.
- Two workers cannot claim the same job.
- Pause/stop prevents new work as intended and survives supervisor restarts.

Use mocks or the existing test facilities for fault injection; do not generate extra public posts to test failures.

Once the established source, destination, and publishing settings are clear, run **one eligible real video through the actual uploader**, verify the remote result, and record it as normal production work. Do not upload that file a second time for testing. Then activate the continuous backlog and watcher.

If a concrete blocker prevents live operation, leave the completed implementation ready to resume and report the exact blocker. Do not label a simulation or dry run as a working live uploader.

## 8. Final handoff to me

Keep the report concise and specific:

1. Which existing uploader you used and which files you changed.
2. Actual video source folders and destination accounts/channels.
3. Visibility, scheduling, metadata, and routing behavior retained.
4. Exact start, pause, resume, stop, and status commands or launcher paths.
5. Queue/history/log locations and the background task/process used.
6. Evidence from the first real upload, current counts, and whether the worker is running.
7. Any remaining blocked jobs, account action, runtime limitation, or uncertain remote result.

**Begin now: inspect my local setup, reuse the uploader and finished videos already present, implement what is missing, verify the real path, and leave continuous uploading operational.**

