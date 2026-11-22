# Run and inspect the integrated HIVE framework

From the downloaded source root or `D:/Repos/hive-ai`, use Python 3.11+.
Start with the public evidence replay; it needs no model, private database,
network access or inference allocation:

```powershell
$env:PYTHONPATH = "$PWD\src"
python scripts/replay_integration_export.py
```

Expected: eleven verified jobs, 43 hashed artifacts, candidate `REJECTED`, and
zero new model calls. The checker recomputes saved verdicts, utility, feedback
and comparison decisions from exported bytes. This is evidence validation, not
fresh model replication. The public package excludes private SQLite stores.

## Two source identities

The real mission ran on commit `28239aba838fa7f6b2d04719ec75d629d1b14308`,
runtime SHA256 `c73866989d9c03253af8eb199b0c93509adbc50b92bcab7e0a29fde15db0d9d2`.
Its exact source archive is published beside the latest package. Latest runtime
SHA256 `6ee9ae14b32ec6c9972bba693bb45395af5998516c4bc9de19dd5bbb5f550c99`
fixes interrupted-time accounting discovered after that run. No new real calls
were made with the later source; no historical receipts were rewritten.

The private completed store is pinned to the original source, manifest and
configuration. The latest integration executable correctly refuses that old
store because the source changed. To replay that completed historical store on
this machine, use its preserved frozen source:

```powershell
$env:PYTHONPATH = 'D:/Repos/hive-ai/.hive/frozen-integration-28239ab/src'
python -m hive --store D:/Repos/hive-ai/.hive/integration-20261121 status
python -m hive --store D:/Repos/hive-ai/.hive/integration-20261121 inspect --run <job-id-from-report>
python -m hive --store D:/Repos/hive-ai/.hive/integration-20261121 integration --manifest D:/Repos/hive-ai/experiments/manifests/integration-20261121.json --config D:/Repos/hive-ai/configs/integration-20261121.json
```

That completed replay spends zero model calls. Use the latest source for new
work; the old recovery limitation is preserved as part of the historical record.

## A separately allocated real mission

The recorded allocation used all six authorized local calls (147 generated
tokens, 768 reserved). Creating another store is a new run, not a refill or a
way to recover a spent allocation. With a separately authorized allocation,
installed pinned model and fresh configuration/store, the entry point is:

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m hive doctor --config <new-config.json>
python -m hive --store <new-store> integration --manifest <manifest.json> --config <new-config.json> --output <new-report.json>
```

The supplied development manifest aggregates repository-source inventory,
classifies directive excerpts, freezes feedback-derived P1, compares it against
three controls with learning disabled, and runs a subsequent task under P0.
Both recorded training missions passed. P1's inventory sum failed, so P1 was
rejected. All classification comparison arms disagreed with frozen label d5.
These exposed development cases do not establish useful adaptive gain.

No cloud inference, model download, weight training, arbitrary shell execution
or automatic production promotion is part of this mission.

## Restart, STOP and policy restoration

For any store, use its exact source, manifest and config for integration replay.
Latest-source recovery atomically settles a dead owner's reserved wall time,
clears the reservation and requeues. Requests and tokens remain charged; a
live-owned job is left alone. Repeated resume never refills any budget.

```powershell
python -m hive --store <store> stop
python -m hive --store <store> status
python -m hive --store <store> resume
```

The report names `initial_snapshot` and `candidate_snapshot` artifact references:

```powershell
python -m hive --store <store> rollback --experimental <initial_snapshot>
python -m hive --store <store> rollback --experimental <candidate_snapshot>
```

These restore only candidate learning state and print the unchanged governing
hash. The separate production operation remains
`rollback --checkpoint <independently-approved-checkpoint>`; unapproved snapshots
are refused. The integration's independent acceptance did not promote P1.

## Verification

```powershell
$env:PYTHONPATH = "$PWD\src"
python -m pytest -q
npx e2e run --config e2e.config.mts --output <new-e2e-output-directory>
python scripts/replay_integration_export.py
```

The historical `scripts/verify_integration.py` requires the completed private
store and must itself run from the exact measured source because it sets its
subprocess source path. Its original and complete-receipt exports already
record two fresh-process replays, STOP/resume and both experimental restores,
with unchanged spending/authority. Never overwrite a prior verification directory.

These are CLI/software checks, not physical-phone testing. Recovery guarantees
cover the tested finite read-only tool/model flow. Historical video acceptance,
isolated repository execution, Level A/B and frontier-model benefit retain
their separate open gates.
