"""Bounded, resumable local video subtitle and clip proposal mission."""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import stat
import time
from pathlib import Path

from .orchestrator import Executor, config_hash, code_version, inspect_evidence, worker_lock
from .learning_policy import Policy
from .storage import Store

MAX_MEDIA = 2 * 1024 * 1024 * 1024
MAX_SRT = 4 * 1024 * 1024
MAX_CUES = 2000
MAX_DURATION = 4 * 60 * 60
TIME = re.compile(r"^(\d{2}):(\d{2}):(\d{2}),(\d{3})$")


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _reparse(path: Path) -> bool:
    try:
        attrs = path.lstat().st_file_attributes
    except (AttributeError, OSError):
        return path.is_symlink()
    return bool(attrs & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400))


def _reject_reparse_components(path: Path) -> None:
    absolute = path.absolute()
    probe = Path(absolute.anchor)
    for part in absolute.parts[1:]:
        probe = probe / part
        if probe.exists() and _reparse(probe):
            raise ValueError("Filesystem symlink or reparse point is refused")


def _safe_file(root: Path, value: str) -> Path:
    _reject_reparse_components(root)
    base = root.resolve(strict=True)
    candidate = Path(value)
    if not candidate.is_absolute():
        candidate = base / candidate
    probe = Path(candidate.anchor)
    for piece in candidate.parts[1:]:
        probe = probe / piece
        if probe.exists() and _reparse(probe):
            raise ValueError("Mission input symlinks are refused")
    resolved = candidate.resolve(strict=True)
    if _reparse(resolved) or not resolved.is_file() or not resolved.is_relative_to(base):
        raise ValueError("Mission inputs must be regular files under allowed_root; symlinks and traversal are refused")
    return resolved


def _ms(value: str) -> int:
    match = TIME.fullmatch(value)
    if not match:
        raise ValueError("Invalid SRT timestamp")
    h, m, s, ms = map(int, match.groups())
    if m > 59 or s > 59:
        raise ValueError("Invalid SRT timestamp")
    return ((h * 60 + m) * 60 + s) * 1000 + ms


def _stamp(value: int) -> str:
    h, rem = divmod(value, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def parse_srt(text: str) -> tuple[str, list[dict]]:
    blocks = re.split(r"\r?\n\s*\r?\n", text.strip()) if text.strip() else []
    parsed = []
    for block in blocks:
        lines = block.splitlines()
        ti = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if ti is None or ti + 1 >= len(lines):
            raise ValueError("Malformed SRT cue")
        pair = [part.strip() for part in lines[ti].split("-->", 1)]
        if len(pair) != 2:
            raise ValueError("Malformed SRT time range")
        start, end = _ms(pair[0]), _ms(pair[1])
        content = "\n".join(lines[ti + 1:]).strip()
        if not content or end <= start:
            raise ValueError("SRT cues need text and a positive duration")
        parsed.append((start, end, content))
    parsed.sort(key=lambda cue: (cue[0], cue[1]))
    if not parsed or len(parsed) > MAX_CUES:
        raise ValueError("SRT cue count must be between 1 and 2000")
    cues = []
    output = []
    last_end = 0
    for start, end, content in parsed:
        start = max(start, last_end)  # resolve overlaps by moving the cue start only
        if end <= start:
            raise ValueError("Overlapping SRT cues cannot be normalized without losing duration")
        last_end = end
        cue_id = f"c{len(cues) + 1:04d}"
        cues.append({"id": cue_id, "start_ms": start, "end_ms": end, "text": content})
        output.append(f"{len(cues)}\n{_stamp(start)} --> {_stamp(end)}\n{content}")
    return "\n\n".join(output) + "\n", cues


def _probe(media: Path, timeout: float = 8.0) -> float:
    exe = shutil.which("ffprobe")
    if not exe:
        raise ValueError("ffprobe is required for video missions")
    if media.suffix.lower() not in {".mp4", ".mov", ".m4v"}:
        raise ValueError("Only single-file MP4/MOV media is supported")
    try:
        proc = subprocess.run([exe, "-v", "error", "-protocol_whitelist", "file", "-f", "mov", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(media)], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as exc:
        raise ValueError("ffprobe exceeded its eight-second mission bound") from exc
    if proc.returncode or len(proc.stdout) > 64:
        raise ValueError("ffprobe could not read local media")
    try:
        duration = float(proc.stdout.strip())
    except ValueError as exc:
        raise ValueError("ffprobe returned invalid duration") from exc
    if not 0 < duration <= MAX_DURATION:
        raise ValueError("Media duration must be between 0 and four hours")
    return duration


def _atomic_output(store: Store, name: str, payload: bytes, *, max_storage_bytes=None) -> str:
    """Journal immutable intent before fixed-name output effect; reconcile on replay."""
    output = store.root / "output"
    _reject_reparse_components(store.root)
    output.mkdir(exist_ok=True)
    if _reparse(output) or (store.root.exists() and _reparse(store.root)):
        raise ValueError("Output directory symlink refused")
    if (store.root / "STOP").exists():
        raise RuntimeError("STOP prevents video output effects")
    target = output / name
    digest = _sha(payload)
    key = "video_output_intent:" + name
    intent = store.get(key)
    if intent is None:
        store.set(key, {"sha256": digest, "size": len(payload)})
    elif intent != {"sha256": digest, "size": len(payload)}:
        raise ValueError("Output intent conflicts with saved mission result")
    if target.exists():
        if _reparse(target) or target.stat().st_size != len(payload) or _file_sha(target) != digest:
            raise ValueError("Existing output is unknown or corrupt; refusing overwrite")
        return str(target)
    temp = target.with_suffix(target.suffix + ".tmp")
    if temp.exists():
        if temp.is_symlink() or _file_sha(temp) != digest:
            raise ValueError("Existing temporary output is unknown or corrupt")
        os.replace(temp, target)
        return str(target)
    if max_storage_bytes is not None:
        current = sum(p.stat().st_size for p in store.root.rglob("*") if p.is_file())
        if current + len(payload) > max_storage_bytes:
            raise RuntimeError("Artifact storage budget prevents video output effect")
    with temp.open("xb") as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temp, target)
    return str(target)


def _tasks(source_srt: str, normalized: str, cues: list[dict], duration_ms: int, mission_key: str) -> tuple[dict, dict]:
    captions = {"id": mission_key + "-captions", "category": "video_captions", "split": "development",
                "prompt": "Normalize the supplied subtitle cues, preserving text exactly.",
                "input": {"source_srt": source_srt}, "expected": {"srt": normalized}, "critical": False,
                "evaluator": "video_captions_v1", "allowed_tools": ["normalize_srt"],
                "tool_schemas": {"normalize_srt": {"srt": "string"}}, "success_criteria": "Exact normalized SRT match"}
    clip = {"id": mission_key + "-clips", "category": "video_clips", "split": "development",
            "prompt": "Choose exactly two distinct subtitle cue IDs that make promising clip suggestions. Use only IDs below. Return JSON {\"cue_ids\":[\"id\",\"id\"]}.",
            "input": {"cues": [{**c, "text": c["text"][:160]} for c in cues], "duration_ms": duration_ms}, "expected": {}, "critical": False,
            "evaluator": "video_clips_v1", "allowed_tools": [], "tool_schemas": {},
            "success_criteria": "Two source-backed cue IDs with valid timestamps"}
    return captions, clip


def _run_mission(store_root, mission_path, config_path=None) -> dict:
    """Run or resume the same mission using HIVE's existing durable executor."""
    from .orchestrator import load_config
    mission_file = Path(mission_path).resolve(strict=True)
    if mission_file.stat().st_size > 16_384:
        raise ValueError("Mission JSON exceeds 16 KiB")
    mission = json.loads(mission_file.read_text(encoding="utf-8-sig"))
    if not isinstance(mission, dict) or set(mission) != {"allowed_root", "media", "subtitles"}:
        raise ValueError("Mission requires exactly allowed_root, media, and subtitles")
    root = Path(mission["allowed_root"])
    _reject_reparse_components(root)
    root = root.resolve(strict=True)
    media = _safe_file(root, mission["media"])
    subtitle = _safe_file(root, mission["subtitles"])
    if media.stat().st_size > MAX_MEDIA or subtitle.stat().st_size > MAX_SRT:
        raise ValueError("Input exceeds media or subtitle size limit")
    media_hash = _file_sha(media)
    srt_bytes = subtitle.read_bytes()
    try:
        srt_text = srt_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("SRT must be UTF-8") from exc
    normalized, cues = parse_srt(srt_text)
    duration_ms = int(_probe(media) * 1000)
    if any(c["end_ms"] > duration_ms for c in cues):
        raise ValueError("Subtitle cue exceeds probed media duration")
    if len(cues) > 64 or sum(min(len(c["text"]), 160) for c in cues) > 8192:
        raise ValueError("Video transcript exceeds bounded clip-selection context (64 cues / 8192 characters)")
    config = load_config(config_path)
    if config_path is None:
        config["routes"] = ["tool"]  # inference is opt-in for this workload
    if "tool" not in config["routes"]:
        raise ValueError("Video subtitle normalization requires the explicitly configured deterministic tool route")
    eligible_routes = [route for route in config["routes"] if route in {"tool", "local_direct"}]
    if not eligible_routes:
        raise ValueError("Video clip selection requires an eligible tool or local_direct route")
    model_digest = None
    if "local_direct" in config["routes"]:
        from .model_registry import discover
        catalog = discover(config["endpoint"])
        model_digest = next((m.get("digest") for m in catalog.get("models", []) if m.get("id") == config["model"]), None)
        if not model_digest:
            raise ValueError("Configured local model digest unavailable; video mission abstains")
    config["_expected_model_digest"] = model_digest
    source = {"media_sha256": media_hash, "srt_sha256": _sha(srt_bytes), "media_size": media.stat().st_size,
              "srt_size": len(srt_bytes), "model_digest": model_digest, "config_hash": config_hash(config),
              "runtime": code_version()}
    identity = _sha(json.dumps(source, sort_keys=True).encode())[:24]
    store = Store(store_root)
    try:
        previous = store.get("video_mission")
        if previous and previous.get("identity") != identity:
            raise ValueError("Video mission source/config/model changed; use a fresh store")
        if not previous:
            policy_before = store.get("policy")
            clip_route = Policy(state=policy_before, seed=config["seed"]).choose("video_clips", eligible_routes)
            store.set("video_mission", {"identity": identity, "source": source, "mission_path": str(mission_file),
                                         "policy_before": policy_before, "clip_route": clip_route, "created": time.time()})
        elif _file_sha(media) != media_hash or _file_sha(subtitle) != source["srt_sha256"]:
            raise ValueError("Mission inputs changed since intake")
        else:
            policy_before = previous.get("policy_before")
            clip_route = previous.get("clip_route")
            if clip_route not in eligible_routes:
                raise ValueError("Frozen clip route is no longer eligible under this mission config")
    finally:
        store.close()

    if len(cues) < 2:
        raise ValueError("Video clip proposals require at least two subtitle cues")
    captions, clips = _tasks(srt_text, normalized, cues, duration_ms, "video-" + identity)
    if model_digest:
        from .task_spec import request_view
        prompt_bytes = len(json.dumps(request_view(clips), separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
        if prompt_bytes > 1400:
            raise ValueError("Local clip request exceeds 1,400 UTF-8 bytes; use a shorter subtitle window or deterministic tool route")
    executor = Executor(store_root, config)
    try:
        executor.recover()
        policy_before_hash = config_hash(policy_before)
        cap_id = executor.store.enqueue_once("video:" + identity + ":captions", {"task": captions, "route": "tool", "learn_feedback": True, "retry_count": 0, "allow_retry": False})
        clip_id = executor.store.enqueue_once("video:" + identity + ":clips", {"task": clips, "route": clip_route, "learn_feedback": True, "retry_count": 0, "allow_retry": False})
        for job_id in (cap_id, clip_id):
            job = executor.store.get_job(job_id)
            if job["state"] == "QUEUED":
                # Recheck frozen source and model immediately before dispatch.
                if _file_sha(media) != media_hash or _file_sha(subtitle) != source["srt_sha256"] or code_version() != source["runtime"]:
                    raise ValueError("Video mission inputs or runtime source changed since intake")
                if model_digest:
                    from .model_registry import discover
                    live = discover(config["endpoint"])
                    found = next((m.get("digest") for m in live.get("models", []) if m.get("id") == config["model"]), None)
                    if found != model_digest:
                        raise ValueError("Configured model digest changed since intake")
                results = executor.loop(1)
                if not results or results[0]["id"] != job_id:
                    raise RuntimeError("Video task did not complete; mission remains resumable")
        cap_job, clip_job = executor.store.get_job(cap_id), executor.store.get_job(clip_id)
        if (cap_job.get("spec", {}).get("task") != captions
                or cap_job.get("spec", {}).get("route") != "tool"
                or clip_job.get("spec", {}).get("task") != clips
                or clip_job.get("spec", {}).get("route") != clip_route):
            raise ValueError("Video mission jobs do not match the reconstructed source tasks and routes")
        if cap_job["state"] != "BLOCKED" or clip_job["state"] != "BLOCKED":
            raise RuntimeError("Video task failed verification; inspect HIVE store")
        cap_bundle = inspect_evidence(executor.store, cap_id)
        clip_bundle = inspect_evidence(executor.store, clip_id)
        if (cap_bundle.get("job_id") != cap_id or cap_bundle.get("task") != captions
                or cap_bundle.get("route") != "tool"
                or clip_bundle.get("job_id") != clip_id or clip_bundle.get("task") != clips
                or clip_bundle.get("route") != clip_route):
            raise ValueError("Video evidence is not bound to its reconstructed job/task/route")
        from .verifier import verify
        if (verify(cap_bundle["task"], cap_bundle["result"]) != cap_bundle["verification"] or
            verify(clip_bundle["task"], clip_bundle["result"]) != clip_bundle["verification"] or
            not cap_bundle["verification"].get("passed") or not clip_bundle["verification"].get("passed")):
            raise ValueError("Cached video evidence failed independent replay verification")
        cap = json.loads(cap_bundle["result"]["output"])
        choice = json.loads(clip_bundle["result"]["output"])
        if not clip_bundle["verification"]["valid"]:
            raise RuntimeError("Clip task did not pass objective source and time checks")
        by_id = {cue["id"]: cue for cue in cues}
        selected = [by_id[cue_id] for cue_id in choice["cue_ids"]]
        policy_after = executor.store.get("policy")
        next_policy = Policy(state=policy_after, seed=config["seed"])
        expected_proposal = {"objective_status": "objective_verified", "editorial_status": "needs_operator_review", "quality_claim": None, "source": source,
                    "learning": {"source_split": "development", "policy_before_sha256": policy_before_hash,
                                 "policy_after_sha256": config_hash(policy_after), "clip_route_used": clip_job["spec"]["route"],
                                 "next_proposed_route": next_policy.choose("video_clips", eligible_routes),
                                 "next_proposed_route_executed": False, "evidence_status": "experimental"},
                    "resource_use": {"model_requests": sum(bundle["route"] in {"local_direct", "local_tool"} for bundle in (cap_bundle, clip_bundle)),
                                     "generated_tokens": sum(int(bundle["result"].get("tokens", 0)) for bundle in (cap_bundle, clip_bundle)),
                                     "input_tokens": None, "input_token_measurement": "unavailable from configured adapter",
                                     "clip_generated_tokens": clip_bundle["result"].get("tokens", 0)},
                    "clips": [{"cue_id": c["id"], "start_ms": c["start_ms"], "end_ms": c["end_ms"],
                               "start": _stamp(c["start_ms"]), "end": _stamp(c["end_ms"]), "text": c["text"],
                               "evidence": {"subtitle_sha256": source["srt_sha256"], "cue_id": c["id"]}} for c in selected],
                    "verification": clip_bundle["verification"]}
        receipt_ref = executor.store.get("video_receipt")
        if receipt_ref is None:
            receipt_ref = executor.store.put_artifact(expected_proposal)
            executor.store.set("video_receipt", receipt_ref)
            proposal = expected_proposal
        else:
            proposal = executor.store.read_artifact(receipt_ref)
            if (proposal.get("source") != source or proposal.get("clips") != expected_proposal["clips"] or
                proposal.get("learning", {}).get("clip_route_used") != clip_job["spec"]["route"]):
                raise ValueError("Saved mission receipt does not match reverified source and clip selection")
        caption_bytes = cap["srt"].encode("utf-8")
        clips_bytes = json.dumps(proposal, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
        for payload in (caption_bytes, clips_bytes):
            if (executor.root / "STOP").exists():
                raise RuntimeError("STOP prevents video output effects")
            if executor._budget()["wall_s"] >= config["max_wall_s"]:
                raise RuntimeError("Mission wall-time budget prevents video output effect")
            current = sum(p.stat().st_size for p in executor.root.rglob("*") if p.is_file())
            if current + len(payload) > config["max_storage_bytes"]:
                raise RuntimeError("Artifact storage budget prevents video output effect")
        _atomic_output(executor.store, "captions.srt", caption_bytes, max_storage_bytes=config["max_storage_bytes"])
        clips_path = _atomic_output(executor.store, "clips.json", clips_bytes, max_storage_bytes=config["max_storage_bytes"])
        return {"mission": identity, "captions": str(Path(store_root) / "output" / "captions.srt"),
                "clips": clips_path, "status": proposal["objective_status"], "editorial_status": proposal["editorial_status"], "jobs": [cap_id, clip_id], "source": source, "learning": proposal["learning"], "resource_use": proposal["resource_use"]}
    finally:
        executor.close()


def run_mission(store_root, mission_path, config_path=None) -> dict:
    """Serialize intake, execution, and output reconciliation per mission store."""
    root = Path(store_root)
    for child in (root, root / "artifacts", root / "reports", root / "hive.sqlite3", root / "video-mission-lock"):
        _reject_reparse_components(child)
    root.mkdir(parents=True, exist_ok=True)
    with worker_lock(root / "video-mission-lock"):
        return _run_mission(root, mission_path, config_path)
