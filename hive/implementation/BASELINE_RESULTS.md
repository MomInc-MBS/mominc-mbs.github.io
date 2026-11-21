# Baseline Results

| Configuration | Development | Held-out | Mean held-out latency | False accepts / rejects |
|---|---:|---:|---:|---:|
| rules | 48/48 | 24/24 | 63.5 ms | 0 / 0 |
| probe | 16/48 | 8/24 | 100.3 ms | 16 / 0 |
| combined | 48/48 | 24/24 | 96.1 ms | 0 / 0 |
| probe-guard | 48/48 | 24/24 | 73.3 ms | 0 / 0 |

All figures are generated from [EXPERIMENT_REGISTRY.json](/hive/evidence/caption-pilot-1/EXPERIMENT_REGISTRY.json), not hand-entered. Latency includes worker startup. Model arms are excluded with evidence in [Capability Registry](/hive/notes/CAPABILITIES/).


Last verified: **2026-11-21T04:27:34.3337389Z**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.
