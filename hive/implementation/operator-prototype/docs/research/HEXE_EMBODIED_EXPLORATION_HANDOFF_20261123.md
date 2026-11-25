# HIVE Embodied Exploration Engine (HEXE)
## Research and coding-agent handoff — 2026-11-23

**Status:** Proposed additive subsystem, not an inspection of the current HIVE repository. Do not interrupt an in-progress architecture migration; discover the current interfaces at a checkpoint. Start with capture and replay, not model-controlled hardware. No purchase required for initial bench work if existing equipment functions.

## 1. Mission

Give HIVE repeatable, measurable experience through physical observation, supervised movement, controlled interventions and independent verification. The system must preserve observations as numeric/tensor data and media, with language annotations as optional parallel metadata. HIVE can subsequently call separately trained world models as specialized capabilities. Do not conflate semantic memory, model weights and safe actuator control. Learned weights arise through training on experience rather than manual insertion of conclusions.

## 2. Inventory and verification

- G01: ELEGOO Smart Robot Car, appears V4.0 family. Photographs show four geared wheels, Arduino-style controller with USB-B, SmartCar-Shield V1.1 marking, ELEGOO camera board, ultrasonic transducers, servo, and ITG/MPU-style IMU board. Exact camera sensor, firmware, IMU revision and wheel encoder availability must be checked. Manufacturer source supports UNO, JSON serial, MPU6050, ultrasonic, voltage and line sensors; do not assume every feature is present on this unit. Confirm battery and wiring condition, then test with wheels elevated.
- A01: Ruko foldable quadcopter and original transmitter, likely F11 family, exact model unverified. Photograph underside label and battery label, identify matching official app/manual and inspect scuffed propellers and batteries. Do not fly damaged hardware. GPS, waypoint support, log export and video format are model-dependent. No verified public SDK for this unit; do not assume it accepts MAVLink or modify flight firmware. Initially read-only/offline capture from official app or onboard media if supported, with human pilot.
- Fixed lab: existing MOM Inc cameras where accessible, calibrated overhead camera, printed tags, known measurement targets. Use consent-controlled local recording only.

## 3. Research and implementation reuse

| Source | Reuse | Stage |
|---|---|---|
| [ELEGOO V4 original](https://github.com/elegooofficial/ELEGOO-Smart-Robot-Car-Kit-V4.0) | Schematics, camera archive, original firmware; archived | G01 identification |
| [ELEGOO V4 New](https://github.com/elegooofficial/ELEGOO-Smart-Robot-Car-Kit-V4.0-New) | Serial JSON, hardware drivers, watchdog; verify revision match before flashing | G01 adapter |
| [Community ELEGOO ROS2 bridge](https://github.com/koh43/elegoo_src_base) | ESP32 serial and video transport reference; ROS publisher incomplete per README | Optional transport |
| [AprilTag 3](https://github.com/AprilRobotics/apriltag) | Calibrated tag pose estimates and ground truth | Indoor localization |
| [rosbag2](https://github.com/ros2/rosbag2) | Topic recording and replay, optional MCAP storage | Capture/replay |
| [LeRobot datasets](https://huggingface.co/docs/lerobot/en/api/datasets) | Episode export of time-aligned observations and actions | Training interface |
| [DreamerV3 reimplementation](https://github.com/danijar/dreamerv3) | Latent action-conditioned world model research, not a production controller | Offline research |
| [PX4 simulation](https://docs.px4.io/main/en/simulation/) | Simulated aerial research with developer APIs; does not imply Ruko compatibility | Future simulation |
| [Ruko F11 support](https://rukotoy.com/support/camera-drones/drone-f11) | Official model-specific app capabilities, verify model | A01 read-only |
| [FAA operation rules](https://www.faa.gov/uas/recreational_flyers), [Remote ID](https://www.faa.gov/uas/getting_started/remote_id), [airspace](https://www.faa.gov/uas/getting_started/where_can_i_fly) | U.S. compliance, pilot oversight | A01 gate |

Nemotron research workers: inspect exact revisions, licenses, dependencies, source provenance and tests. Return bounded summaries and patch suggestions, not entire repositories. Claude: integrate tested pieces into existing HIVE architecture; do not duplicate the existing capability registry, experiment store, model registry, or safety layer. Pin revisions, keep notices and document modifications. Community code is not guaranteed correct or complete.

## 4. Proposed interfaces and architecture

HIVE matrix -> hypothesis proposal -> experiment validator -> human approval where required -> local device gateway -> device. Telemetry -> timestamped evidence store -> experiment evaluator -> candidate training -> independent evaluation -> existing model registry -> HIVE retrieval. The gateway is independent of learned policies, deny-by-default and not bypassable by model outputs. No arbitrary shell or network execution from a model. Simulation/replay credentials cannot access real actuators.

Device manifest: device_id, hardware_revision, firmware_hash, transport, sensors, units, frames, update_rates, supported_actions, bounds, safety_state, calibration_ids, data_access, operator_id, health, stop_capability. Adapter methods: discover(), health(), observe(), capabilities(), request_action(), stop(), replay(). Aerial adapter is initially observe/replay only. Ground adapter initially read-only; later approved bounded primitives in a supervised clear indoor arena. Real hardware commands expire; loss of communication, localization or authority causes local stop for rover. Hardware stop and human override remain independent. No physical experiments on people or animals, no following people, no surveillance, no road traffic, no hazardous payloads.

Event schema: episode_id, device_id, sequence, source_clock, source_time, host_receive_time, monotonic_time_ns, clock_uncertainty, sensor_id, observation_ref, units, coordinate_frame, calibration_id, quality_flags, missing_mask, action_proposed, action_applied, acknowledgment, operator_override, safety_events, outcome, hypothesis_id, model_version, consent_scope. Preserve raw media and numeric values; don't invent missing data. Store estimates separately from independent truth and language annotations. Hash and version evidence. Log action duration and measured outcome; a motor command is not a measured displacement. Keep immutable raw episodes and separate derived datasets with provenance.

## 5. Localization and hardware additions

First use a fixed calibrated overhead camera plus printable AprilTag on G01; measure position and heading in room coordinates using known reference points. Compare camera, ultrasonic and IMU signals. IMU alone drifts; indoor GPS is inadequate. Add encoders if compatible, then investigate camera-based SLAM, UWB and outdoor GNSS only as separate branches. A small Wi-Fi-capable companion board may be needed for reliable untethered telemetry if stock camera/serial firmware is insufficient. Prefer existing USB connection for bench tests; verify voltage, current, pin compatibility and battery before changes. Preserve stock firmware and recovery instructions.

Additional useful sensors: temperature/humidity, ambient light, pressure, microphone (consent), current sensor, downward optical flow, time-of-flight depth sensor, later 2D lidar. Add one modality at a time, calibrate and log uncertainty. Do not mount extra equipment to Ruko until payload limits and flight safety are confirmed. Existing hardware is sufficient for first experiments. Optional rough cost planning (not live quotes): printed tags $0–5, USB cable $0–10, additional camera $20–50, Wi-Fi bridge $10–30, encoders $10–30, environmental sensor $5–20. Buy only after checking compatibility.

## 6. Experiments

Each experiment: question, competing hypotheses, predicted measurement distribution, intervention, independent outcome measurement, control, uncertainty, repeat count, stop conditions, budget, result, and follow-up. Start with manually supervised tests in a cleared small room/arena, no pets or people in the movement area. Use stationary apparatus for range experiments; avoid deliberate collisions. Suggested initial batch:

1. Movement calibration: compare measured displacement and heading against repeated brief supervised motion on different safe floor surfaces. Use overhead markers as reference; test unseen surface later.
2. Acoustic ranging: place cardboard, fabric and angled flat targets at known distances, measure stationary sensor readings; compare residuals and dropouts against ground truth.
3. Sensor fusion: compare vision-only, range-only and combined distance estimates under varied light; withhold one room layout.
4. Object permanence: move viewpoint under supervision around a stationary inanimate object, retain/reacquire its location; test against overhead view.
5. Energy: compare measured current (if instrumented) or voltage trend over comparable supervised trials, without deliberately depleting cells.
6. Cross-view mapping: align prerecorded, lawfully captured aerial photographs of a permitted empty test area with ground photographs of the same stationary scene. Track coordinate uncertainty and avoid personal identification.
7. Active acquisition in replay/simulation: compare fixed observation schedule, random selection and uncertainty-driven observation choice under identical data/time budgets. Only later allow approved physical trials.

Research branch: expected information gain I(H;O|a), normalized by measurement/time/energy cost. Safety is a hard constraint, not a penalty a model can trade away. In early experiments the model chooses a question or suggests observations; operator validates and executes. No autonomous aerial exploration on the Ruko.

## 7. Training pipeline

Train first a small action-conditioned model: encode RGB frames and numeric channels (normalized only using training split), handle missing modality masks, combine action and latent state, and predict future latent state plus measurable quantities such as displacement, heading and range. Self-supervised or supervised sensor targets are derived from the recorded experience, not manually authored language. Use separate optional timestamped narrative annotations. Compare simple kinematic and persistence baselines, small recurrent networks and later Dreamer-style latent world models. Keep data from human pilots, simulated runs and device revisions distinguishable. Separate episodes by day/layout/device before splitting; never randomly split adjacent frames into train and test. Retain unseen tests, safety tests and old-task retention sets. Track calibration, uncertainty, sensor ablations, failure cases and distribution shift. Train offline in bounded local batches; no live weight modification of hardware controllers. Register candidate checkpoints, dataset hashes, metrics and model cards; promote only against independent tests and human approval, with rollback.

## 8. Build phases and acceptance gates

P0 — Inspect existing HIVE seams and device inventory. Deliver capability manifests, license/provenance report, interfaces and test fixtures. No actuator writes.
P1 — Bench telemetry and replay: recover read-only firmware/sensor interface, capture camera and IMU/range streams, record/replay timestamps. Gate: 10-minute stable capture, explicit missing data flags, deterministic event-order replay; no motion.
P2 — Indoor localization: calibrated external camera and tag, fixed test grid, report position error and dropout. Suggested target <=5 cm median in a small calibrated arena; measure rather than promise.
P3 — Supervised ground motion: local watchdog, physical stop, speed/time limits, operator control, no pets/people in arena. Verify wheels-up first, then limited floor trials. Gate: all communication-loss, stale-command and operator-stop tests pass; no unsupervised learned actuation.
P4 — Experiment ledger: repeatable experiment definitions, signed approvals, independent outcomes and replay-only research planner. Gate: reproduce logged experiment results; clearly separate inference from measurements.
P5 — Offline learning: collect at least 100 short valid episodes across multiple sessions as initial engineering target, not sufficient evidence for generalization. Establish baseline, candidate training, independent metrics, retention, registry and rollback. Gate: candidate meets preregistered improvement and does not regress on retained tasks.
P6 — Aerial observation: confirm exact Ruko model and supported log export; record only supervised lawful missions and import observations with actual or explicitly unknown GPS metadata. Aerial simulation separate with PX4; no live control bridge unless a documented compatible platform and separate compliance/safety review exist.
P7 — Research branches: sensor fusion, active perception, causal discovery, simulation-to-real, multi-device shared map and environmental dynamics. Keep branches independently testable and opt-in.

## 9. Mandatory context and token economics

Use per-role packets: task ID, constraints, relevant interface signatures, selected source excerpts, test commands/results and artifact pointers. Default planning budget: 8k input/2k output per focused worker task, one bounded retry before escalation; adjust explicitly for real context needs. Keep rolling summaries <=1k tokens and hand off at checkpoints. Retrieve only relevant history, avoid repeated full-repo or video ingestion into LLM context; use local indexes, hashes, numeric pipelines and references. Record uncached/cached input, output, tool usage, wall time, compute and cost. Set per-run dollar/token/time caps and halt before exceeding them. Report cached-token cost, context utilization and cost per verified deliverable. Nemotron workers return evidence and diffs; Claude receives focused patches, failing tests and integration constraints. No unbounded agent loops. Preserve all branches in registry instead of stuffing them into every prompt.

## 10. Aerial compliance and limitations

In the US, work/research flights generally fall outside purely recreational use and may require Part 107 certificated pilot, registration and Remote ID compliance. Check controlled airspace, local restrictions and visual line-of-sight requirements. Use original human pilot controls, inspect propellers, batteries and manufacturer manual. No flight from the software prototype; no unattended launch, tracking people or flight in occupied spaces. Treat inaccessible Ruko telemetry as missing rather than inventing a GPS track. Use an open developer-supported platform in simulation if future programmatic aerial research is needed.

## 11. First coder instruction

Implement P0 and P1 only after current HIVE build checkpoint. Map existing interfaces, create a mock G01 adapter and replay fixture before connecting physical hardware, then add verified read-only transport. Keep A01 import-only. Add tests for schema, timestamps, missing data, replay and disabled actuators. Return files changed, tests, cost metrics, known limitations, and the smallest next approved task. Do not flash hardware or authorize motion without operator verification. Preserve current HIVE build path and all research branches.
