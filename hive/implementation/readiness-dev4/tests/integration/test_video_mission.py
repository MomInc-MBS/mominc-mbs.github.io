import json
import subprocess
from unittest.mock import patch

from hive.video_mission import parse_srt, run_mission


def test_parse_srt_reindexes_sorts_and_preserves_text():
    raw = "2\n00:00:02,000 --> 00:00:03,000\nSecond line\n\n8\n00:00:00,000 --> 00:00:01,000\nFirst <i>line</i>"
    normalized, cues = parse_srt(raw)
    assert [cue["text"] for cue in cues] == ["First <i>line</i>", "Second line"]
    assert normalized.startswith("1\n00:00:00,000 --> 00:00:01,000\nFirst <i>line</i>")
    assert "2\n00:00:02,000 --> 00:00:03,000\nSecond line" in normalized


def test_video_mission_runs_and_replays_without_inference(tmp_path):
    allowed = tmp_path / "allowed"
    allowed.mkdir()
    (allowed / "sample.mp4").write_bytes(b"synthetic video bytes")
    (allowed / "sample.srt").write_text(
        "1\n00:00:00,000 --> 00:00:01,000\nOpening line\n\n"
        "2\n00:00:02,000 --> 00:00:03,000\nClosing line\n", encoding="utf-8")
    mission = tmp_path / "mission.json"
    mission.write_text(json.dumps({"allowed_root": str(allowed), "media": "sample.mp4", "subtitles": "sample.srt"}), encoding="utf-8")
    config = tmp_path / "config.json"
    config.write_text(json.dumps({"routes": ["tool"]}), encoding="utf-8")
    probe = subprocess.CompletedProcess([], 0, "3.5\n", "")
    with patch("hive.video_mission.shutil.which", return_value="ffprobe"), patch("hive.video_mission.subprocess.run", return_value=probe):
        first = run_mission(tmp_path / "store", mission, config)
        second = run_mission(tmp_path / "store", mission, config)
    assert first["jobs"] == second["jobs"]
    assert first["status"] == "objective_verified"
    assert first["editorial_status"] == "needs_operator_review"
    proposal = json.loads((tmp_path / "store" / "output" / "clips.json").read_text(encoding="utf-8"))
    assert len(proposal["clips"]) == 2
    assert all(clip["evidence"]["subtitle_sha256"] == first["source"]["srt_sha256"] for clip in proposal["clips"])
    assert (tmp_path / "store" / "output" / "captions.srt").read_text(encoding="utf-8").startswith("1\n")
