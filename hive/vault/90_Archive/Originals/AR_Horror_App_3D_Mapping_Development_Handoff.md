# AR Horror App — Interior Mapping Foundation & Developer Handoff

**Purpose:** Turn the repositories and findings in `Single_Video_Interior_3D_Mapping_GitHub_Repos.md` into an actionable implementation foundation for a room-aware AR horror application.

**Status:** Engineering plan, not a claim that any repository is installed, working, or integrated. Verify each project's license, requirements, current API, and output formats before adopting it.

## 1. Product objective

A player scans an indoor environment with one continuous phone video. The app reconstructs a coherent room map, identifies usable structural surfaces and objects, aligns the virtual map with the physical room, and uses that spatial understanding to stage interactive horror encounters. Monsters should appear grounded in the room, hide behind real furniture, emerge from doorways, respond to player movement, and remain in plausible locations as the player walks around.

**Critical architectural distinction:** A prerecorded monocular video can build an *offline spatial map*, but reliable *live AR alignment* also needs a runtime camera-tracking and relocalization solution (e.g. a suitable platform AR SDK). Do not treat reconstruction camera poses as automatically equivalent to live tracking.

## 2. Source material and roles

The supplied repository research describes three classes of reconstruction: metric 3D, visual SLAM with dense fusion, and Gaussian splatting. It also reports fragmented MASt3R geometry, unstable focal length estimates, and potentially faulty viewer/export behavior. These are starting observations, not independently reproduced diagnoses.

| Repository | URL | Candidate role in this app |
|---|---|---|
| SLAM3R | https://github.com/PKU-VCL-3DV/SLAM3R | First dense video reconstruction benchmark |
| VGGT | https://github.com/facebookresearch/vggt | Baseline camera poses, depth, geometry |
| video-to-3dgs | https://github.com/imcmurray/video-to-3dgs | Mesh/photogrammetry and visual-scene comparison |
| AETHER-SLAM | https://github.com/sahaj2310-tech/AETHER-SLAM | Monocular room-mesh and fusion comparison |
| DROID-Splat | https://github.com/ChenHoy/DROID-Splat | Tracking and splat benchmark |
| Nerfstudio | https://github.com/nerfstudio-project/nerfstudio | Optional photorealistic visual representation |
| video2mesh | https://github.com/gzhangx/video2mesh | Alternative mesh export path |
| Video-3D-Reconstruction | https://github.com/LLP17/Video-3d-Reconstruction | COLMAP-based baseline |
| photogrammetry_pipeline | https://github.com/aivarsorups/photogrammetry_pipeline | Windows-oriented photogrammetry fallback |
| Monocular-3D | https://github.com/Vedkhajone/Monocular-3D | Depth + poses + TSDF / GLB alternative |
| SplatSLAM | https://github.com/SplatSLAM-Project/SplatSLAM | MASt3R-related tracking/splat comparison |

**Selection rule:** Do not combine all 11 into production. Benchmark the top three first; choose one primary reconstruction backend and at most one fallback. Keep the rest as research or optional components.

## 3. Proposed system architecture

```text
PHONE ROOM VIDEO
  -> Capture validation / metadata / frame extraction
  -> Reconstruction adapter (SLAM3R | VGGT | video-to-3dgs)
  -> Camera poses + depth / point cloud / optional splat
  -> Geometry cleanup + meshing + coordinate normalization
  -> Semantic analysis: floor, walls, ceiling, doors, furniture
  -> Scene manifest + collision mesh + occlusion mesh + visual assets
  -> Room package saved to device / app storage

LIVE PHONE CAMERA + IMU
  -> Platform AR tracking + room relocalization
  -> World-to-room transform + tracking confidence
  -> Horror director + enemy AI + spawn rules
  -> Rendering, depth/occlusion, collision, spatial audio
  -> AR gameplay
```

Keep four representations distinct: **visual render** (mesh or splat), **collision geometry** (simplified mesh), **occlusion geometry** (stable depth/mesh), and **semantic scene graph** (labeled objects and surfaces). A photorealistic splat by itself is not a dependable physics or navigation map.

## 4. Implementation phases

### Phase 0 — Audit and establish a reproducible baseline

1. Inspect existing AR horror app code, runtime, renderer, device targets, and current reconstruction pipeline. Do not assume a game engine or SDK.
2. Inventory local software and GPU capability; distinguish installed, working, and merely downloaded tools.
3. Preserve the original phone footage, capture metadata, MASt3R output, point cloud, mesh, and native-viewer screenshots.
4. Create a fixed benchmark room video with a slow walkthrough, overlap, visible corners, furniture, and doorway. Record device, resolution, lens/camera intrinsics when available, and capture conditions.
5. Check whether defects occur in the point cloud, meshing, export, coordinate transforms, or viewer before replacing the backend.

**Deliverable:** `baseline/` with reproducible inputs, commands, logs, sample outputs, and a short failure report.

### Phase 1 — Reconstruction backend bake-off

1. Run the **same unmodified source video** through SLAM3R, VGGT, and video-to-3dgs using documented configurations.
2. Export camera poses, point clouds, meshes, and diagnostic views wherever supported.
3. Evaluate wall/floor continuity, doorway geometry, furniture placement, floaters, camera trajectory stability, scale drift, run time, VRAM, and export compatibility.
4. If results remain fragmented, inspect lens calibration, frame selection, blur, overlap, camera motion, and meshing/fusion independently.
5. Test AETHER-SLAM as the next candidate for a room mesh; test DROID-Splat if tracking or visual reconstruction is the dominant problem.

**Decision gate:** Pick the backend that produces the most spatially coherent, reusable geometry—not simply the best-looking rendering. Record measurable evidence and known failure cases.

### Phase 2 — Convert reconstruction into an AR-ready room package

1. Normalize coordinate systems, axes, units, orientation, and origin. Preserve the transform from reconstruction coordinates to room coordinates.
2. Remove isolated fragments, fill small holes conservatively, and simplify meshes without erasing doorways or furniture silhouettes.
3. Extract floor, wall, ceiling, and major object candidates; attach confidence values and allow manual correction.
4. Generate independent render, collision, and occlusion assets; use GLB/PLY/OBJ as interchange formats only where the selected tools actually support them.
5. Store provenance, calibration assumptions, scale confidence, and object IDs in a versioned scene manifest.
6. Add a simple 3D inspection/debug viewer showing camera path, axes, surface labels, and geometry overlays.

**Deliverable:** A loadable `RoomPackage` that does not depend on the reconstruction tool being installed on the phone.

### Phase 3 — Live AR alignment and persistence

1. Integrate the existing app's platform tracking SDK or choose a compatible AR runtime after inspecting the codebase.
2. Align the reconstructed room to the live camera using shared visual features, user-confirmed landmarks, or a suitable relocalization method; do not assume a single monocular scan yields metric scale automatically.
3. Save a room anchor/transform and reload it when the user returns.
4. Track localization confidence; pause or downgrade precise interactions when tracking is lost.
5. Debug by overlaying virtual walls, doors, and furniture outlines on the actual camera view while the user moves.

**Deliverable:** Virtual room features remain aligned through ordinary movement and can be recovered after tracking interruptions, within documented limitations.

### Phase 4 — Horror-specific spatial intelligence

Implement a semantic room graph with entities such as `floor`, `wall`, `ceiling`, `doorway`, `window`, `table`, `chair`, `cabinet`, `bed`, and `unknown_obstacle`. These labels are **target features to build**, not promised outputs of the source repositories.

Gameplay systems:

- **Spawn validator:** Place enemies on appropriate surfaces, outside solid geometry, with enough clearance.
- **Occlusion:** Allow monsters to move behind walls or furniture rather than drawing over them.
- **Line of sight:** Trigger behaviors when the player can see a doorway, dark corner, or hiding place.
- **Navigation:** Use a simplified walkable floor and obstacle map; avoid assuming arbitrary reconstructed meshes form a navigable surface.
- **Spatial audio:** Anchor footsteps, knocks, whispers, and impacts to stable room locations.
- **Environmental events:** Trigger doorframe appearances, corner peeks, furniture movement illusions, and ceiling/wall encounters according to verified geometry.
- **Safety constraints:** No gameplay mechanic should require running, entering dangerous areas, or navigating with an obstructed real-world view.

**Deliverable:** One enemy can spawn, hide, emerge, move, and disappear in spatially credible ways in a mapped test room.

### Phase 5 — Gameplay vertical slice

Build a complete test encounter: scan room → inspect map → approve/correct surfaces → align live camera → enemy appears beyond a doorway → enemy becomes hidden behind a real obstacle → spatial sound directs attention → encounter ends → room state persists. Provide debug toggles for mesh, anchors, labels, visibility rays, spawn candidates, and tracking confidence.

**Deliverable:** A repeatable demonstration on the target phone, not just a desktop reconstruction preview.

### Phase 6 — Optimize and harden

Measure scan processing time, device heat, RAM/VRAM, app storage, battery, frame rate, tracking drift, occlusion artifacts, and crash rate. Determine which reconstruction stages can run on-device and which require local desktop/server preprocessing. Test low-texture walls, mirrors, glass, dark rooms, motion blur, moving people, narrow halls, and large open rooms. Provide a graceful fallback when mapping confidence is inadequate.

## 5. Recommended code organization

```text
ar-horror/
  app/                      # Existing app: preserve framework
  capture/                  # Video input, metadata, quality checks
  reconstruction/
    adapters/
      slam3r/
      vggt/
      video_to_3dgs/
    benchmark/
    normalization/
  room_processing/
    meshing/
    semantics/
    collision/
    occlusion/
  ar_runtime/
    tracking/
    relocalization/
    anchors/
  horror/
    director/
    spawning/
    navigation/
    perception/
    audio/
  schemas/
  tools/room_inspector/
  tests/
  sample_rooms/
  docs/
```

Wrap external repositories in adapters rather than copying their entire code into the application. Keep licenses and upstream versions documented. If an existing directory structure is already established, adapt this layout rather than reorganizing unnecessarily.

## 6. Proposed scene data contract

The following is a **new application-level schema proposal**, not an output format guaranteed by any listed repository:

```json
{
  "schema_version": "1.0",
  "room_id": "sample_room_001",
  "units": "meters",
  "coordinate_system": "documented_right_handed_room_frame",
  "reconstruction_backend": "selected_backend",
  "source_video": "capture/room.mp4",
  "room_to_reconstruction_transform": "4x4_matrix_reference",
  "room_to_ar_world_transform": "runtime_resolved_4x4_matrix",
  "scale_confidence": null,
  "assets": {
    "visual": "room_visual.glb",
    "collision": "room_collision.glb",
    "occlusion": "room_occlusion.glb"
  },
  "surfaces": [
    {"id": "floor_01", "type": "floor", "confidence": 0.0}
  ],
  "objects": [
    {"id": "door_01", "type": "doorway", "confidence": 0.0}
  ],
  "spawn_zones": [],
  "tracking": {"relocalization_method": "to_be_selected"}
}
```

Replace illustrative values with measured data. Store matrices in a specified convention and validate them on import. A null scale confidence means unverified scale, not a successful metric reconstruction.

## 7. Acceptance tests and decision gates

| Test | Pass condition |
|---|---|
| Reconstruction integrity | Main walls, floor, and doorways form a coherent, inspectable scene; major floating fragments identified |
| Export/import | Round-trip import preserves axes, orientation, scale assumptions, and geometry |
| Semantic editing | Developer can inspect and correct door/furniture/floor labels |
| AR alignment | Overlays remain acceptably aligned during a full walk around the test room; drift is measured |
| Occlusion | Monster disappears behind mapped solid objects from multiple camera angles |
| Collision | Monster does not visibly intersect major furniture or walls |
| Persistence | Reopening a saved room supports documented relocalization or an explicit recalibration flow |
| Failure behavior | Tracking loss and bad geometry do not trigger unsafe or broken gameplay |
| Performance | Target-device FPS, latency, memory, and heat are measured against agreed budgets |

**Before coding:** Agree numeric thresholds for positional error, angular drift, minimum frame rate, scan duration, and room coverage based on target hardware. Do not invent success metrics from repository descriptions.

## 8. Handoff instructions for the implementing developer / agent

1. **Read** `Single_Video_Interior_3D_Mapping_GitHub_Repos.md` and this document first.
2. **Inspect** the existing app and current MASt3R pipeline before changing dependencies, architecture, or UI.
3. **Verify** repository URLs, licenses, model-weight terms, active setup instructions, supported exports, and platform constraints.
4. **Reproduce** the existing failure and isolate whether it is caused by reconstruction, meshing, transforms, or rendering.
5. **Benchmark** SLAM3R, VGGT, and video-to-3dgs against the same video, recording commands, results, timing, and GPU memory.
6. **Choose** one backend based on structural map quality; explain the selection and rejected alternatives.
7. **Implement** the RoomPackage contract and build a debug viewer before adding enemy behavior.
8. **Integrate** with existing AR tracking; explicitly solve room-to-live-camera alignment and scale.
9. **Build** one complete horror encounter using actual room geometry and validate it on a physical device.
10. **Deliver** working code, setup instructions, reproducible tests, sample room assets, performance measurements, and a known-issues list. Never report a feature complete solely because a demo image or desktop viewer looks correct.

### Required progress report format

For each phase report: **implemented**, **verified on device**, **blocked**, **evidence/paths**, **next action**. Clearly distinguish planned capabilities from demonstrated behavior.

## 9. Immediate first sprint

- Day/task 1: Audit current code and hardware; collect failing MASt3R artifacts.
- Day/task 2: Build repeatable frame extraction and benchmark harness.
- Day/task 3: Run SLAM3R and VGGT on the reference capture.
- Day/task 4: Run video-to-3dgs and compare mesh/point-cloud outputs.
- Day/task 5: Inspect geometry and select primary/fallback strategy.
- Day/task 6: Implement RoomPackage export and a scene debug overlay.
- Day/task 7: Demonstrate a virtual object anchored to a real, reconstructed doorway with measured tracking error.

Tasks are ordered work items, not guaranteed one-day estimates. Escalate early if dependencies, licensing, hardware, or device tracking make the plan infeasible.

## 10. Non-negotiable engineering principles

- Prioritize **coherent physical geometry** over attractive splat renders.
- Never equate offline reconstruction with live AR localization.
- Keep rendering, occlusion, collision, and semantic data separate.
- Do not discard the existing app or working assets without justification.
- Use measured tests and inspect raw intermediate outputs.
- Maintain a clear path from **one room video** to **one stable AR horror encounter**.

---

**Source:** `Single_Video_Interior_3D_Mapping_GitHub_Repos.md`, supplied November 17, 2026. The repository roles and observed MASt3R issues come from that source. AR integration, horror mechanics, architecture, schemas, testing, and delivery phases are proposed implementation work rather than verified repository features.
