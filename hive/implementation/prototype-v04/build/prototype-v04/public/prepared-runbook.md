# Prepared prototype operator demonstration

Prepared from public first-party source at `0b3bfc391c8fc21555f451012757174933f1c479`. Four classification sources
and four inventory inputs are pairwise distinct within each learning plan.
Terra independently checked the original six labels; baseline_verify also checked
the two RUN_HIVE excerpts. This is development review, not research acceptance.
Original input roots remain immutable. Preparation performs no inference.
These commands replay the measured allocation on Ian's machine. For another
checkout or extracted ZIP, run `scripts/prepare_operational_demo.py` there and
use its generated runbook; absolute identities do not transfer between stores.
The earlier failed `tool-store` and interrupted `tool-store-fixed` remain preserved and must not be reset.

Run from `D:\Repos\hive-ai` in PowerShell:

```powershell
$env:PYTHONPATH = "$PWD\build\prototype-v04\runtime-recovery\src"
$env:GIT_CEILING_DIRECTORIES = "$PWD\build\prototype-v04"
Set-Location "$PWD\build\prototype-v04\runtime-recovery"
$demo = 'D:\Repos\hive-ai\.hive\prototype-v04-final-inputs'
# Read-only health. No inference and no implicit downloads:
python -m hive doctor --config configs/local.json
# Replay the measured shared zero-call allocation for tool-only tasks and learning:
python -m hive --store "$demo/tool-store-recovery" data --manifest "$demo/inputs/inventory-mission.json"
python -m hive --store "$demo/tool-store-recovery" mission run --manifest "$demo/inputs/python-standalone.json"
python -m hive --store "$demo/tool-store-recovery" mission run --manifest "$demo/inputs/python-label-standalone.json"
python -m hive --store "$demo/tool-store-recovery" mission run --manifest "$demo/inputs/combined-mission.json"
python -m hive --store "$demo/tool-store-recovery" learn --plan "$demo/inventory-learning-plan.json"
# Inspect the same completed work in the authenticated local console:
python -m hive --store "$demo/tool-store-recovery" console --allowed-root "$demo/inputs"
```

Inspect `operator-approval.proposed.json`. It is deliberately `approved:false`;
no command can use it for live inference. The separate operator must review its
eight exact task fingerprints (including recovery variants and combined data),
pinned model digest, sources, labels and caps before saving an approved copy at
`operator-approval.json`. Do not edit generated inputs after review. Approval is
one 24-request / 128-token-per-request / 3072-token allocation, one worker, 1800
active seconds and 64 MiB, bound to `live-store`. No new store refills that cap.

Only after that separate authorization exists:

```powershell
$approval = "$demo/operator-approval.json"
python -m hive --store "$demo/live-store" data --manifest "$demo/inputs/development-mission.json" --approval "$approval"
python -m hive --store "$demo/live-store" mission run --manifest "$demo/inputs/python-label-standalone.json" --approval "$approval" --allowed-root "$demo/inputs"
python -m hive --store "$demo/live-store" mission run --manifest "$demo/inputs/model-combined-mission.json" --approval "$approval" --allowed-root "$demo/inputs"
python -m hive --store "$demo/live-store" learn --plan "$demo/classification-learning-plan.json" --approval "$approval"
# Learning includes development, two frozen comparison sources and a subsequent
# distinct source under the retained permitted procedure. P0 remains governing.
python -m hive --store "$demo/live-store" status
python -m hive --store "$demo/live-store" stop
python -m hive --store "$demo/live-store" resume
# Replay the exact commands above in a fresh process; verify unchanged counters.
python -m hive --store "$demo/live-store" console --allowed-root "$demo/inputs" --approval "$approval"
```

The model-backed combined stage binds actual verified `data.json` `/labels` into
the Python case `source-labels`, argument zero. Its patch counts repeated labels
and returns sorted label/count records. Independent expected cases are fixed
before execution and never generated from the model's actual answer. The
inventory combined mission separately retains `/rows` and case `source-rows`.
Missing Docker/model/approval is a blocker, never permission for a fallback.
Learning ties or weaker quality reject; no beneficial-learning or policy
promotion claim is made by preparation or by merely running this loop.
