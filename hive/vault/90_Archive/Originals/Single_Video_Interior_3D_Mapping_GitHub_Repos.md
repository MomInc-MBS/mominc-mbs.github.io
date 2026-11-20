# GitHub Repositories for Mapping Interiors from a Single Video

## Project goal

Convert one continuous phone video of an interior into a coherent, navigable 3D room map, preferably without LiDAR or multiple recordings.

## Current reconstruction problem

The provided screenshots show a MASt3R-based workflow producing fragmented geometry, disconnected surfaces, and distorted meshes. The earlier testing notes also report unstable inferred focal lengths and a supplied example that appears broken in the native viewer. These observations suggest testing both alternative reconstruction methods and the mesh/viewer pipeline before blaming the captured footage.

## Three approaches

1. **Metric 3D reconstruction:** Estimate depth, camera positions, point clouds, and potentially meshes with approximate real-world scale.
2. **Visual SLAM plus dense reconstruction:** Track the moving camera and fuse observations into a spatially consistent map.
3. **Gaussian splatting:** Create realistic navigable views; a splat scene is not necessarily a clean, collision-ready mesh.

## Recommended GitHub repositories

| # | Repository | GitHub | Main use | Typical output |
|---|---|---|---|---|
| 1 | VGGT | https://github.com/facebookresearch/vggt | Video/image-based camera, depth and geometry estimation | Point clouds, camera poses, visualization/GLB |
| 2 | video-to-3dgs | https://github.com/imcmurray/video-to-3dgs | Video photogrammetry pipeline using COLMAP/OpenMVS and splatting tools | Mesh, point cloud, Gaussian splat |
| 3 | AETHER-SLAM | https://github.com/sahaj2310-tech/AETHER-SLAM | Monocular RGB room scanning with depth estimation and TSDF fusion | Room mesh (PLY) |
| 4 | DROID-Splat | https://github.com/ChenHoy/DROID-Splat | Dense SLAM and Gaussian reconstruction | Camera tracking and 3D Gaussian scene |
| 5 | Nerfstudio | https://github.com/nerfstudio-project/nerfstudio | Phone-video neural scene reconstruction | NeRF/3DGS, supported exports |
| 6 | video2mesh | https://github.com/gzhangx/video2mesh | Video-to-mesh reconstruction | OBJ/PLY mesh, point cloud, camera poses |
| 7 | Video-3D-Reconstruction | https://github.com/LLP17/Video-3d-Reconstruction | COLMAP-based video reconstruction pipeline | 3D mesh and viewer |
| 8 | photogrammetry_pipeline | https://github.com/aivarsorups/photogrammetry_pipeline | Windows-oriented COLMAP/OpenMVS reconstruction | Photogrammetry meshes |
| 9 | Monocular-3D | https://github.com/Vedkhajone/Monocular-3D | MiDaS depth, COLMAP camera poses, TSDF fusion | GLB scene |
| 10 | SLAM3R | https://github.com/PKU-VCL-3DV/SLAM3R | Dense monocular-video reconstruction with global alignment | Dense 3D reconstruction |
| 11 | SplatSLAM | https://github.com/SplatSLAM-Project/SplatSLAM | MASt3R-related SLAM with splatting and refinement | Reconstructed Gaussian scene |

## Suggested test priority

| Priority | Repository | Why test it |
|---|---|---|
| 1 | **SLAM3R** | Alternative to a camera-calibration-dependent reconstruction workflow. |
| 2 | **VGGT** | Straightforward baseline for video-derived geometry and camera poses. |
| 3 | **video-to-3dgs** | Produces mesh-oriented results as well as visual reconstruction. |
| 4 | **AETHER-SLAM** | Targets room mapping from an RGB camera. |
| 5 | **DROID-Splat** | Useful comparison for tracking, calibration, and splat reconstruction. |

## Recommended comparison

Process **the same original room video** through SLAM3R, VGGT, and video-to-3dgs. Compare:

- Continuity and alignment of walls, floors, and ceilings.
- Doorway and furniture geometry.
- Number of disconnected or floating fragments.
- Camera tracking and focal-length stability.
- Whether output can be exported to a usable mesh format (GLB, OBJ, or PLY).
- Approximate scale and ability to align the map to the phone's position.
- Reconstruction time and GPU memory requirements.

**Important:** A convincing rendering does not guarantee a structurally usable room map. The end goal is a coherent room model with connected surfaces and stable positions, not just an attractive novel-view rendering.

## Next technical decision

If all three methods produce fragmented results, inspect input frame extraction, lens calibration, camera motion, image overlap, and the mesh viewer/export path. If point clouds are coherent but meshes are broken, prioritize the meshing/fusion and rendering stages rather than replacing the entire reconstruction engine.

---

*Repository links and descriptions are compiled from the preceding discussion; current maintenance status, hardware requirements, and individual feature support should be verified in each project's README before integration.*
