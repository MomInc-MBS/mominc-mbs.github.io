"""DeviceManifest and Event record (HEXE handoff section 4). Missing data = None + missing_mask, never invented."""
from dataclasses import dataclass, asdict, fields

from hive.storage import _json  # canonical JSON shared with the rest of HIVE


class SchemaError(ValueError):
    pass


MANIFEST_REQUIRED = ("device_id", "hardware_revision", "firmware_hash", "transport", "sensors", "units", "frames",
                     "update_rates", "supported_actions", "bounds", "safety_state", "calibration_ids",
                     "data_access", "operator_id", "health", "stop_capability")


@dataclass(frozen=True)
class DeviceManifest:
    device_id: str
    hardware_revision: str
    firmware_hash: str
    transport: str
    sensors: tuple
    units: dict
    frames: dict
    update_rates: dict
    supported_actions: tuple
    bounds: dict
    safety_state: str
    calibration_ids: dict
    data_access: str
    operator_id: str
    health: str
    stop_capability: str

    @classmethod
    def from_dict(cls, d):
        # empty containers are valid (no actions, no bounds); None or "" is "missing"
        missing = [k for k in MANIFEST_REQUIRED if d.get(k) is None or d.get(k) == ""]
        if missing:
            raise SchemaError("manifest missing required fields: " + ", ".join(missing))
        extra = set(d) - set(MANIFEST_REQUIRED)
        if extra:
            raise SchemaError("manifest unknown fields: " + ", ".join(sorted(extra)))
        d = dict(d, sensors=tuple(d["sensors"]), supported_actions=tuple(d["supported_actions"]))
        return cls(**d)

    def to_dict(self):
        return {k: (list(v) if isinstance(v, tuple) else v) for k, v in asdict(self).items()}


@dataclass(frozen=True)
class Event:
    episode_id: str
    device_id: str
    sequence: int
    source_clock: str
    source_time: float            # seconds on the device clock
    host_receive_time: float      # seconds, host wall clock
    monotonic_time_ns: int
    clock_uncertainty: float      # seconds
    sensor_id: str
    consent_scope: str
    observation_ref: str = None   # e.g. camera frame ref; numeric samples go in `values`
    values: dict = None           # None when data is missing
    units: dict = None
    coordinate_frame: str = None
    calibration_id: str = None
    quality_flags: tuple = ()
    missing_mask: tuple = ()      # channel names with no data
    action_proposed: dict = None
    action_applied: dict = None
    acknowledgment: str = None
    operator_override: bool = False
    safety_events: tuple = ()
    outcome: str = None
    hypothesis_id: str = None
    model_version: str = None

    def __post_init__(self):
        for k in ("episode_id", "device_id", "source_clock", "sensor_id", "consent_scope"):
            if not isinstance(getattr(self, k), str) or not getattr(self, k):
                raise SchemaError(k + " required")
        for k in ("sequence", "monotonic_time_ns"):
            v = getattr(self, k)
            if isinstance(v, bool) or not isinstance(v, int) or v < 0:
                raise SchemaError(k + " must be a non-negative int")
        if self.clock_uncertainty is None or self.clock_uncertainty < 0:
            raise SchemaError("clock_uncertainty required, >= 0")
        if self.values is None and self.observation_ref is None and not self.missing_mask:
            raise SchemaError("no data and no missing_mask: missing data must be explicit")
        if self.values is not None and set(self.missing_mask) & set(self.values):
            raise SchemaError("channel both present and masked")
        if self.action_applied is not None:
            raise SchemaError("action_applied must be None: actuators are disabled in this layer")

    def to_dict(self):
        return {k: (list(v) if isinstance(v, tuple) else v) for k, v in asdict(self).items()}

    @classmethod
    def from_dict(cls, d):
        names = {f.name for f in fields(cls)}
        if set(d) - names:
            raise SchemaError("unknown event fields: " + ", ".join(sorted(set(d) - names)))
        d = dict(d)
        for k in ("quality_flags", "missing_mask", "safety_events"):
            d[k] = tuple(d.get(k, ()))
        try:
            return cls(**d)
        except TypeError as e:
            raise SchemaError(str(e))

    def to_line(self):
        return _json(self.to_dict())
