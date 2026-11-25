# Video mission contract (WP1–3 thin slice)

Run `hive --store STORE video --mission MISSION [--config CONFIG]`. The mission
JSON has exactly `allowed_root`, `media`, and `subtitles`. Both input files must
be regular, non-reparse files contained by the allowed root. Supported media is
single-file MP4/MOV/M4V up to 2 GiB, probed by ffprobe with the `file` protocol,
an eight-second timeout, and a four-hour duration ceiling. SRT input is UTF-8,
up to 4 MiB, at most 2,000 cues; this first slice requires 2–64 cues and limits
the compact transcript passed to clip selection to 8,192 characters. If
`local_direct` is eligible, the exact serialized clip request is additionally
limited to 1,400 UTF-8 bytes to fit safely within the runtime's 2,048-token
context. An oversized model request stops before dispatch with guidance to use
a shorter subtitle window or the deterministic route.

HIVE normalizes SRT ordering, indexes, and overlaps while preserving cue text.
The independent verifier parses the original SRT and returned SRT separately,
checks sequential indexes, valid ordered timings, non-overlap, and exact cue text
preservation. This verifies syntax and timing normalization only; it does not
claim audio alignment. Clip proposals select two distinct IDs from the source
cue list. The verifier checks their IDs and source cue time bounds. Editorial
quality remains `needs_operator_review` and has no automatic quality score.

The default route is deterministic `tool`; local inference is opt-in through an
explicit config whose routes include `local_direct`. Only bounded subtitle text
and cue IDs/times enter the model prompt. Model output has no file paths or write
authority. The mission freezes source, runtime, config, and discovered model
digests. Existing HIVE jobs, artifacts, budgets, and feedback are reused; route
choices are filtered through the existing Policy and recorded as experimental.

Results are fixed at `STORE/output/captions.srt` and `STORE/output/clips.json`.
An intent hash is persisted before each atomic file effect. On replay, matching
files reconcile; unknown, corrupt, symlinked, or reparse-point outputs fail
closed. Stop state and artifact capacity are checked before output effects.
Repeated completed missions reuse saved verified results without new calls.

Source, config, model or runtime drift blocks reuse. Start a separately
authorized mission after diagnosis; a new store never authorizes budget replenishment. Inspect the JSON proposal before using its editorial suggestions.
