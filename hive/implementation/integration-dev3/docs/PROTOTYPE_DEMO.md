# Working-prototype engineering demo

This is an engineering-alpha demonstration, not Level A acceptance or proof of
adaptive advantage. Genuine footage selection and editorial acceptance remain
operator steps. See `PROTOTYPE_ACCEPTANCE.md` for the 12-task/two-type gate.

## Launch and health

Python 3.11+, ffprobe from FFmpeg, and the existing pinned local Ollama model are
required for the model route. The deterministic route needs no model. No model
is downloaded automatically. From the extracted source/repository:

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m hive doctor --config configs/prototype-video.json
ffprobe -version
python -m hive video --help
```

## Prepare one approved input

Create `.hive/prototype-video-input.json` using the example mission schema. Point
`allowed_root` at the approved local input directory, and `media` and `subtitles`
at a single MP4/MOV and UTF-8 SRT inside it. Keep original media and transcripts
local. This first adapter accepts short transcripts; an explicit size/context
error means shorten the approved input, not silently truncate evidence.

Record source group, prior exposure, approval and success criteria before the
genuine run. The plan allocation is `.hive/prototype-video`, at most three
requests/384 reserved output tokens/120 active seconds. Do not make another
store to refill it, and do not reuse a changed source/config/input as if it were
the same mission.

## Execute, stop, resume and inspect

```powershell
python -m hive --store .hive/prototype-video video --mission .hive/prototype-video-input.json --config configs/prototype-video.json
python -m hive --store .hive/prototype-video status
```

The mission returns paths to the normalized captions and clip proposals under
the store's `output` directory. Inspect the verification, source hashes and
job IDs. `needs_operator_review` is intentional: timestamp/source checks cannot
judge the edit's quality or whether it preserves a joke. No source is overwritten
and nothing is uploaded. Read the returned captions and proposals before using
them in an edit.

Run the exact video command again in a new process to verify saved evidence and
reconcile output hashes. A completed replay must not spend another model call.

```powershell
python -m hive --store .hive/prototype-video stop
# A subsequent video invocation must dispatch no work or recreate outputs.
python -m hive --store .hive/prototype-video resume
# Rerun the identical video command; the budget is not replenished.
python -m hive --store .hive/prototype-video review --run <returned-job-id>
```

STOP permits an already dispatched request to finish within its timeout. Changed
inputs, model identity, source or corrupt evidence require diagnosis; do not
overwrite the receipt or delete the store to make a test pass.

## Engineering verification

```powershell
python -m pytest -q
npx --no-install e2e run --config e2e.config.mts --output experiments/results/prototype-e2e
```

The video e2e creates a tiny synthetic MP4 and synthetic captions, then launches
and replays the actual CLI in separate processes. These checks prove engineering
behavior only. Synthetic fixtures do not count as unused genuine tasks.

Existing checkpoint regression tests exercise rejected candidates and approved
restore mechanics. They do not approve a new default policy. Experimental
development feedback and policy hashes remain separate from production approval.

Next work and remaining source/sandbox/research gates are in `NEXT_WORK_ITEM.md`.

## Recorded real-input demo, 21 November 2026

Ian authorized any long-form stream. The local Nov 3 recording is 39:13.75; the
bounded first-seven-cue excerpt is 28.32 seconds. A pre-existing batch transcript
has the same recording basename and duration but names an absent MP4 while the
MKV remains available. Audio alignment is not independently verified. This is
previously edited development material, not an unused acceptance source.

The executed mission used the clean source exported at `7983ae0` outside Git,
so the runtime records `commit=unversioned` plus its exact source hash. It used
one request, 17 generated tokens, 128 reserved tokens and 7.641 active seconds.
Both jobs passed independent structural checks. Replay, STOP and resume retained
identical output bytes/mtimes and budget in new processes. No policy was promoted.
The next proposed route changed to `tool`; no later tool task was executed.

Local input manifest: `.hive/prototype-video-input/input-manifest.json`.
Local outputs: `.hive/prototype-video/output/captions.srt` and `clips.json`.
Public receipt: `experiments/results/prototype-real-video-demo.json`, with hashes,
costs, source times and review limits. Original media/transcript/raw evidence stay
local. To inspect/replay the existing mission, use the same frozen runtime bytes
outside a Git checkout and the documented fixed store and input/config paths.
Do not rerun the preparation or create another store to spend unused capacity.
