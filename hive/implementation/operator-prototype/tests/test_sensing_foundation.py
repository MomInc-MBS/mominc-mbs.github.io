import hashlib
import pytest

from hive.sensing import (ActionDenied, DeviceManifest, EpisodeError, EpisodeWriter, Event, MockG01Adapter,
                          ReplayAdapter, SchemaError, read_events, replay, replay_bytes, verify)

SEC = 1_000_000_000
BASE = dict(episode_id="e", device_id="d", sequence=0, source_clock="c", source_time=0.0, host_receive_time=0.0,
            monotonic_time_ns=0, clock_uncertainty=0.0, sensor_id="s", consent_scope="x")


def capture(root, seconds, dropouts=(), seed=1, ep="ep1"):
    a = MockG01Adapter(seed=seed, episode_id=ep, dropouts=dropouts)
    w = EpisodeWriter(root, ep, a.discover())
    evs = []
    for _ in range(seconds):
        evs += a.observe(SEC)
    for e in evs:
        w.append(e)
    w.close()
    return evs, root / ep


def test_manifest_validation():
    m = MockG01Adapter().discover().to_dict()
    assert DeviceManifest.from_dict(m).device_id == "mock-g01"
    del m["firmware_hash"]
    with pytest.raises(SchemaError):
        DeviceManifest.from_dict(m)


def test_event_requires_explicit_missing_and_no_actuation():
    with pytest.raises(SchemaError):
        Event(**BASE)                                  # no data, no mask
    Event(**BASE, values=None, missing_mask=("a",))    # explicit missing is fine
    with pytest.raises(SchemaError):
        Event(**BASE, values={"a": 1}, missing_mask=("a",))
    with pytest.raises(SchemaError):
        Event(**BASE, values={"a": 1}, action_applied={"m": 1})
    with pytest.raises(SchemaError):
        Event.from_dict(dict(BASE, values={"a": 1}, bogus=1))


def test_ten_minute_capture_stable_sequence_and_flagged_dropouts(tmp_path):
    drops = {("imu", 5), ("ultrasonic", 7), ("camera", 3)}
    evs, d = capture(tmp_path, 600, dropouts=drops)
    assert [e.sequence for e in evs] == list(range(len(evs)))
    assert len(evs) == 600 * (100 + 10 + 1 + 5)
    times = [e.monotonic_time_ns for e in evs]
    assert times == sorted(times)
    flagged = [e for e in evs if "dropout" in e.quality_flags]
    assert len(flagged) == 3
    for e in flagged:
        assert e.values is None and e.observation_ref is None and e.missing_mask
    assert all(e.values is not None or e.observation_ref for e in evs if not e.quality_flags)
    assert verify(d)["events"] == len(evs)


def test_deterministic_and_replay_hash_equal(tmp_path):
    _, d1 = capture(tmp_path / "a", 20, seed=7)
    _, d2 = capture(tmp_path / "b", 20, seed=7)
    assert (d1 / "events.jsonl").read_bytes() == (d2 / "events.jsonl").read_bytes()
    r1, r2 = replay_bytes(d1), replay_bytes(d1)
    assert hashlib.sha256(r1).digest() == hashlib.sha256(r2).digest()


def test_out_of_order_time_replays_sorted(tmp_path):
    evs, _ = capture(tmp_path, 2)
    assert replay(evs[::-1]) == evs
    w = EpisodeWriter(tmp_path, "ep-ooo")
    mk = lambda i, t: Event(**dict(BASE, episode_id="ep-ooo", sequence=i, monotonic_time_ns=t), values={"a": 1})
    for i, t in enumerate([0, 10, 5]):
        w.append(mk(i, t))
    with pytest.raises(SchemaError):                   # sequence gap rejected
        w.append(mk(9, 11))
    w.close()
    assert [e.monotonic_time_ns for e in replay(read_events(tmp_path / "ep-ooo"))] == [0, 5, 10]


def test_closed_episode_immutable_and_tamper_detected(tmp_path):
    _, d = capture(tmp_path, 2)
    with pytest.raises(EpisodeError):
        EpisodeWriter(tmp_path, "ep1")
    p = d / "events.jsonl"
    p.chmod(0o666)
    p.write_bytes(p.read_bytes().replace(b'"imu"', b'"imx"', 1))
    with pytest.raises(EpisodeError):
        verify(d)
    with pytest.raises(EpisodeError):
        read_events(d)


def test_actuators_denied_live_mock_and_replay(tmp_path):
    a = MockG01Adapter(episode_id="ep-act")
    with pytest.raises(ActionDenied):
        a.request_action({"motor": "left", "pwm": 100})
    nxt = a.observe(SEC // 100)[0]
    assert nxt.safety_events and nxt.safety_events[0]["kind"] == "action_denied"
    assert all(e.action_applied is None for e in a.observe(SEC))
    assert a.stop() is True and a.stop() is True and a.observe(SEC) == []
    _, d = capture(tmp_path, 1)
    r = ReplayAdapter(read_events(d))
    with pytest.raises(ActionDenied):
        r.request_action({"motor": "left"})
    assert r.stop() is True and len(r.observe()) == 116
