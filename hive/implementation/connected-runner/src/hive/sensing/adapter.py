"""Adapter protocol, deterministic MockG01Adapter, ReplayAdapter. No hardware, ever; actuators deny-by-default."""
import math
import random
from typing import Protocol

from .schema import DeviceManifest, Event


class ActionDenied(RuntimeError):
    pass


class Adapter(Protocol):
    def discover(self): ...
    def health(self): ...
    def observe(self, duration_ns): ...
    def capabilities(self): ...
    def request_action(self, action): ...
    def stop(self): ...
    def replay(self, events): ...


def replay(events):
    """Deterministic order: (monotonic_time_ns, sequence). Never touches an actuator."""
    return sorted(events, key=lambda e: (e.monotonic_time_ns, e.sequence))


def _deny(adapter, action):
    adapter.pending_safety.append({"kind": "action_denied", "action": action, "reason": "actuators disabled"})
    raise ActionDenied("actuators disabled (deny-by-default)")


SEC = 1_000_000_000
# sensor_id -> (rate_hz, channels, units, frame)
MOCK_SENSORS = {
    "imu": (100, ("ax", "ay", "az", "gx", "gy", "gz"), {"a": "m/s^2", "g": "rad/s"}, "body"),
    "ultrasonic": (10, ("range_m",), {"range_m": "m"}, "body_front"),
    "voltage": (1, ("battery_v",), {"battery_v": "V"}, "none"),
    "camera": (5, (), {}, "camera"),
}


class MockG01Adapter:
    """Synthetic rover. Synthetic clock only; observe() advances it by duration_ns without sleeping."""

    def __init__(self, seed=0, episode_id="ep-mock", dropouts=(), consent_scope="synthetic"):
        self.rng = random.Random(seed)
        self.episode_id, self.consent_scope = episode_id, consent_scope
        self.dropouts = set(dropouts)   # {(sensor_id, sample_index)} forced missing
        self.now_ns, self.sequence, self.stopped = 0, 0, False
        self.pending_safety, self._idx = [], {k: 0 for k in MOCK_SENSORS}
        self._manifest = DeviceManifest.from_dict({
            "device_id": "mock-g01", "hardware_revision": "mock", "firmware_hash": "0" * 64, "transport": "none",
            "sensors": list(MOCK_SENSORS), "units": {k: v[2] for k, v in MOCK_SENSORS.items()},
            "frames": {k: v[3] for k, v in MOCK_SENSORS.items()},
            "update_rates": {k: v[0] for k, v in MOCK_SENSORS.items()}, "supported_actions": [],
            "bounds": {}, "safety_state": "actuators_disabled",
            "calibration_ids": {k: "mock-cal-0" for k in MOCK_SENSORS},
            "data_access": "synthetic", "operator_id": "mock", "health": "ok", "stop_capability": "software"})

    def discover(self):
        return self._manifest

    def health(self):
        return {"status": "stopped" if self.stopped else "ok", "safety_state": "actuators_disabled"}

    def capabilities(self):
        return {"sensors": list(MOCK_SENSORS), "actions": []}

    def request_action(self, action):
        _deny(self, action)

    def stop(self):
        self.stopped = True
        return True

    def replay(self, events):
        return replay(events)

    def _sample(self, sid, t):
        r = self.rng
        if sid == "imu":
            return {"ax": round(r.gauss(0, .05), 6), "ay": round(r.gauss(0, .05), 6),
                    "az": round(9.81 + r.gauss(0, .05), 6), "gx": round(r.gauss(0, .01), 6),
                    "gy": round(r.gauss(0, .01), 6), "gz": round(r.gauss(0, .01), 6)}
        if sid == "ultrasonic":
            return {"range_m": round(1.0 + .5 * math.sin(t / SEC / 7) + r.gauss(0, .005), 6)}
        if sid == "voltage":
            return {"battery_v": round(8.4 - 0.0005 * t / SEC + r.gauss(0, .002), 6)}
        return None  # camera: observation_ref only

    def observe(self, duration_ns):
        """Events for [now, now+duration) in (time, sensor) order with contiguous sequence numbers."""
        if self.stopped:
            return []
        end, due, order = self.now_ns + duration_ns, [], list(MOCK_SENSORS)
        for sid, (hz, *_rest) in MOCK_SENSORS.items():
            step = SEC // hz
            while self._idx[sid] * step < end:
                due.append((self._idx[sid] * step, order.index(sid), sid, self._idx[sid]))
                self._idx[sid] += 1
        out = []
        for t, _, sid, i in sorted(due):
            _hz, chans, units, frame = MOCK_SENSORS[sid]
            drop = (sid, i) in self.dropouts
            vals = None if drop else self._sample(sid, t)
            ref = None if drop or sid != "camera" else "frames/%s/%06d.jpg" % (self.episode_id, i)
            safety, self.pending_safety = tuple(self.pending_safety), []
            out.append(Event(
                episode_id=self.episode_id, device_id="mock-g01", sequence=self.sequence, source_clock="mock",
                source_time=t / SEC, host_receive_time=t / SEC, monotonic_time_ns=t, clock_uncertainty=0.0,
                sensor_id=sid, consent_scope=self.consent_scope, observation_ref=ref, values=vals,
                units=units or None, coordinate_frame=frame, calibration_id="mock-cal-0",
                quality_flags=("dropout",) if drop else (),
                missing_mask=(chans or ("frame",)) if drop else (), safety_events=safety))
            self.sequence += 1
        self.now_ns = end
        return out


class ReplayAdapter:
    """Read-only adapter over recorded events. Has no actuator path: request_action always denies."""

    def __init__(self, events, manifest=None):
        self._events, self._manifest = list(events), manifest
        self.pending_safety = []

    def discover(self):
        return self._manifest

    def health(self):
        return {"status": "replay", "safety_state": "actuators_disabled"}

    def capabilities(self):
        return {"sensors": sorted({e.sensor_id for e in self._events}), "actions": []}

    def observe(self, duration_ns=None):
        return replay(self._events)

    def request_action(self, action):
        _deny(self, action)

    def stop(self):
        return True

    def replay(self, events=None):
        return replay(self._events if events is None else events)
