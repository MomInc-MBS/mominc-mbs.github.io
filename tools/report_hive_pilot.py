"""Publish explicitly selected, synthetic pilot evidence into the static reference.

Usage: python tools/report_hive_pilot.py .hive-local/run-002 --inventory .hive-local/inventory.json
This copies only the known synthetic pilot outputs, never arbitrary local traces.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.hive_engine.core import digest
from tools.hive_engine import fixtures
from tools.hive_engine.verify import check, schema

ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'hive'
ENGINE=ROOT/'tools/hive_engine'
BASE='/hive/'


def write(path,text):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(text.strip()+'\n',encoding='utf-8')


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('run',type=Path)
    ap.add_argument('--inventory',type=Path,required=True)
    ap.add_argument('--plan',type=Path,required=True)
    args=ap.parse_args()
    run=args.run.resolve()
    integrity=check(run)
    meta=json.loads((run/'metadata.json').read_text())
    if meta['manifest_hash']!=fixtures.FROZEN_SHA256:raise ValueError('only reviewed synthetic pilot can be published')
    if meta['code_hashes']!={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ENGINE.glob('*.py')}:
        raise ValueError('code differs from measured run')
    result=json.loads((run/'EXPERIMENT_REGISTRY.json').read_text())
    inventory=json.loads(args.inventory.read_text(encoding='utf-8-sig'))
    tests=json.loads((ENGINE/'test-results.json').read_text())
    evidence=WEB/'evidence/caption-pilot-1'
    evidence.mkdir(parents=True,exist_ok=True)
    # Fixed synthetic artifacts only; SQLite, local endpoints, and stderr stay local.
    for name in ('EXPERIMENT_REGISTRY.json','events.jsonl','metadata.json','candidate.json','curated-dev.json','learning-curves.json','replay.json','boundary.json'):
        shutil.copyfile(run/name,evidence/name)
    shutil.copytree(run/'outputs',evidence/'outputs',dirs_exist_ok=True)
    shutil.copyfile(ENGINE/'test-results.json',evidence/'test-results.json')
    write(evidence/'integrity.json',json.dumps(integrity,indent=2))
    write(evidence/'inventory.json',json.dumps(inventory,indent=2))
    write(evidence/'records.schema.json',json.dumps(schema(),indent=2))
    qa_path=ROOT/'.qa/hive-empirical/report.json'
    if qa_path.exists():
        qa=json.loads(qa_path.read_text())
        qa['base']='local-staging'
        write(evidence/'website-checks.json',json.dumps(qa,indent=2))
    # The complete runnable source/data archive uses repository-relative names.
    source_files=sorted(list(ENGINE.glob('*.py'))+list((ENGINE/'data').rglob('*')))
    with zipfile.ZipFile(evidence/'reproduce.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for p in source_files:
            if p.is_file():
                info=zipfile.ZipInfo(p.relative_to(ROOT).as_posix(),date_time=(2026,11,20,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED
                archive.writestr(info,p.read_bytes())
    public_caps=[]
    for line in (run/'events.jsonl').read_text().splitlines():
        row=json.loads(line)
        if row['kind']=='Capability':public_caps.append(row['payload'])
    write(evidence/'capabilities.json',json.dumps(public_caps,indent=2))
    # Static, source-linked plot: no browser library, live endpoint or invented data.
    curves=json.loads((run/'learning-curves.json').read_text())
    colors={'rules':'#4b236d','probe':'#9a751c','combined':'#895aae','probe-guard':'#c14866'}
    svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 400" role="img" aria-labelledby="title desc">',
         '<title id="title">Caption pilot accuracy by source group</title>',
         '<desc id="desc">Twelve synthetic source groups. Groups 0–7 development, 8–11 held-out. Rules, combined and candidate score 100%; probe-only 33.3%. Same-template groups limit uncertainty estimates. This is not a learning-speed curve.</desc>',
         '<rect width="820" height="400" fill="#faf7fc"/><g font-family="sans-serif" fill="#29143f">',
         '<text x="60" y="30" font-size="20">Observed accuracy by source group</text>',
         '<rect x="545" y="55" width="215" height="235" fill="#f1e7c8"/>',
         '<text x="550" y="75" font-size="13">Exposed held-out fixtures</text>']
    for fraction in (0,.5,1):
        y=285-fraction*200
        svg += [f'<path d="M60 {y}H760" stroke="#d8ccdf"/><text x="12" y="{y+5}" font-size="13">{fraction*100:.0f}%</text>']
    for index,(name,points) in enumerate(curves.items()):
        coords=' '.join(f'{70+i*62},{285-p["accuracy"]*200}' for i,p in enumerate(points))
        dash=['','8 4','2 5','14 6'][index]
        svg += [f'<polyline points="{coords}" fill="none" stroke="{colors[name]}" stroke-width="3" stroke-dasharray="{dash}"/>',
                f'<text x="{60+index*185}" y="345" font-size="14" fill="{colors[name]}">{name}</text>']
    for i in range(12):svg.append(f'<text x="{64+i*62}" y="310" font-size="12">{i}</text>')
    svg += ['<text x="60" y="375" font-size="12">Overlapping 100% traces. Cluster intervals collapse here; real-world uncertainty remains unmeasured.</text></g></svg>']
    write(evidence/'learning-curves.svg',''.join(svg))
    write(evidence/'artifact-manifest.json',json.dumps({p.relative_to(evidence).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
                                                    for p in sorted(evidence.rglob('*')) if p.is_file() and p.name!='artifact-manifest.json'},indent=2))
    def artifact(name,label=None):return f'[{label or name}]({BASE}evidence/caption-pilot-1/{name})'
    def page(id,label):return f'[{label}]({BASE}notes/{id}/)'
    stamp=inventory['verified_at_utc']
    common=f'\n\nLast verified: **{stamp}**. Evidence is a local CPU/tool pilot on synthetic fixtures. No production HIVE runtime, trained weights, or compounding-learning result is claimed.\n'
    metrics=result['metrics']
    table='| Configuration | Development | Held-out | Mean held-out latency | False accepts / rejects |\n|---|---:|---:|---:|---:|\n'
    for name,row in metrics.items():
        d,h=row['dev'],row['holdout']
        table+=f'| {name} | {d["n"]-d["failures"]}/{d["n"]} | {h["n"]-h["failures"]}/{h["n"]} | {h["mean_wall_seconds"]*1000:.1f} ms | {h["false_accept"]} / {h["false_reject"]} |\n'
    links=' · '.join(page(i,t) for i,t in [('STATUS','Implementation status'),('RUNS','Experiment registry'),('CAPABILITIES','Capability registry'),('LEARNING','Learning progress'),('LEDGER','Decision ledger'),('GAPS','Known gaps'),('RELEASES','Change / release history')])
    reports={}
    reports['CURRENT_STATE.md']=f'''# Implementation Status

{links}

**IMPLEMENTED / MEASURED, narrow local pilot.** The first empirical engine now executes caption-validation tasks, records evidence, proposes a bounded procedure from development failures, compares it with a frozen control, rejects it when benefit is absent, and tests local version rollback. The public site remains a static reference.

## Confirmed target and existing work

Release base: `MomInc-MBS/mominc-mbs.github.io`, main `60b1412e6ee401faccc94500b9f6a6d6dd97ebea`. Working branch: `feature/hive-empirical-engine-20261120`. Target URL: `https://mominc.online/hive/`.

At inspection the site contained 288 searchable research pages, 2,413 typed edges, preserved framework 0.2, coder directions 0.4 and the adaptive addendum. `tools/build_hive.py` and `tools/check_hive.py` built/verified that reference. No operational HIVE learning controller or real-model benchmark was found in the inspected HIVE checkout or bounded local discovery. This is a scoped search, not a claim about every disk.

The original ZIP and all vault source bytes, including 19 archived originals, remain unchanged. Archived NumPy simulations are preserved as archival evidence; none are relabeled as GPU or real-model measurements.

## What runs

| Component | Status | Executable evidence |
|---|---|---|
| Episode/event store and provenance | IMPLEMENTED, tested | `core.py:Store`; append-only SQLite, hash chain, {integrity['episodes']} episodes verified |
| Caption workflow and ffprobe adapter | IMPLEMENTED, MEASURED | `captions.py`; 48 development + 24 held-out tasks across three controls and one candidate, plus full replay |
| D1–D5 policies | IMPLEMENTED, partial calibration | `core.py`; hard eligibility, logged routing, mandatory verification, priority heuristic, independent release gates |
| Development-only proposal / curated export | IMPLEMENTED, tested | `pilot.py:propose`, `curated_dataset`; frozen lineage and rubric |
| Local stage/rollback | IMPLEMENTED, test-only | {artifact('test-results.json')}; explicit bound test approval and restored execution |
| Partitioned memory corrections | IMPLEMENTED, tested | `core.py`; expiry, conflicts, access, supersession and rollback revision |
| Real-model arms, learned router, parameter training | PLANNED / unavailable for this run | No model loaded; no inference or neural weight updates executed |
| Production promotion | NOT DEPLOYED | Candidate {result['decision']}; no operator approval; no production deployment function |

## Evidence conventions

**HYPOTHESIS** means an untested proposition. **SPECIFIED** means a contract exists. **IMPLEMENTED** requires executable code exercised by a check. **MEASURED** requires a named run and its scope. **REPLICATED** requires an independently described repeat; this pilot reports same-machine deterministic replay, not independent scientific replication. **REJECTED** records a candidate or hypothesis that failed its declared gate. A page may have several dimensions; old archival labels retain their original meaning.

## Reproduce

Download and extract {artifact('reproduce.zip','the complete source and fixed fixtures')}. With Python 3.11+ and ffprobe 9.0 on PATH:

```sh
python -m tools.hive_engine.test_engine
python -m tools.hive_engine.pilot --out run-new
python -m tools.hive_engine.verify run-new
```

Use a new output directory each time. The runner requires the committed dataset and independently pinned digest; it never silently generates a replacement. An explicit bootstrap command exists for reproducing the supplied fixtures, and verifies the fixed digest. No third-party Python package is required for the runtime.

{artifact('integrity.json','Trace integrity result')} · {artifact('records.schema.json','Portable record schema')} · {page('GAPPLAN','Supplied architecture change plan')}
'''
    reports['CAPABILITY_INVENTORY.md']=f'''# Capability Registry

**MEASURED local inventory; operational registry separate from the research graph.**

| Capability | Observed readiness | Contract / limit |
|---|---|---|
| CPU | {inventory['cpu']['Name'].strip()}, {inventory['cpu']['NumberOfCores']} cores / {inventory['cpu']['NumberOfLogicalProcessors']} threads | CPU pilot, concurrency 1 |
| System RAM | {inventory['ram_bytes']/2**30:.1f} GiB | Worker peak working set measured on Windows; no hard process-tree memory sandbox |
| GPU | {inventory['gpu']} | Point-in-time shared studio load, not per-task attribution |
| Python | {inventory['python']} | Standard library engine |
| ffprobe | {inventory['ffprobe']} | Read-only SRT probe; 64 KiB input; 2-second tool timeout |
| Node | {inventory['node']} | Existing site/test tooling only |
| Ollama | Service responded; one downloaded 9B Q4 model; no loaded models | Model+tools arm excluded; inference, startup and model quality unmeasured |
| LM Studio | Model endpoint unavailable during audit | Excluded; no service started or model swapped |
| Laya | Health endpoint unavailable | Routing remains transparent heuristic; no learned selector claimed |
| Studio Brain / Ruflo | Context and routing calls responded | Existing studio context only; not wired into pilot memory or model training |

The three baseline configurations are `rules`, `probe`, and `combined`. They are all deterministic software configurations. They satisfy a comparable three-configuration tool pilot; they do **not** stand in for the plan's proposed single-model and specialist-model arms. Candidate `probe-guard` validates semantics before conditionally invoking ffprobe.

{artifact('capabilities.json','Executable capability registry')} records adapter/version, supported task, health, required permissions, dependencies, budgets and source hash. {artifact('inventory.json','Hardware/software observations')} records the verification time. Local service addresses, process identities and private file paths are intentionally absent from the public artifacts.

## Archived experiments

The preserved `HIVE_Reproducible_Experiments.zip` contains 31 entries: learning, representation and scheduling simulation runners plus results/analyzers. Its pinned NumPy 2.3.5 / matplotlib 3.10.8 environment was not present (local NumPy 2.4.6; matplotlib absent). The archive reports Python 3.12.14; this run uses 3.11.9. It was inspected, not rerun or modified. Those are CPU simulations, not hardware scheduling or model-serving benchmarks.

## Resource limits and unknowns

Episodes record wall time, worker CPU time, worker peak RSS, tool calls, failures and retries. Wall time includes interpreter launch and tool startup. Separate model startup, per-tool process-tree CPU/RAM, VRAM per episode, queue wait and contention are unmeasured. A four-writer SQLite test establishes only small event-store concurrency, not agent/GPU scalability.
'''
    reports['EXPERIMENT_REGISTRY.md']=f'''# Experiment Registry

## caption-pilot-1 — mandatory validation before tool use

**MEASURED / candidate REJECTED.** Hypothesis: syntax-level ffprobe acceptance is insufficient for timing/structure validation; a bounded procedure can reject invalid captions before a tool call.

Frozen fixture version: `caption-fixtures-1`; digest `{meta['manifest_hash']}`. Eight synthetic source groups supply 48 development tasks; four separate source groups supply 24 held-out tasks. Each group has six related variants: valid UTF-8, BOM/CRLF, overlap, reversed time, media-bound overrun, duplicate cue IDs. Exact input hashes and source-group separation are checked. Reference verdicts are specified by fixture construction, not generated by the adapter under test. All arms use the same 15-second media limit, checker and budget.

Control chosen on development outcomes before held-out execution: **{result['control_config_id']}**. The candidate's training references contain development false-accept episodes only. The procedure is a fixed allowlisted composition, not arbitrary generated code or a trained model.

{table}

Full replay: 72/72 output/status matches per configuration, 288/288 total. All {integrity['episodes']} first/replay episodes have independent reference checks and hashed output artifacts.

These are correlated synthetic tests. Cluster-bootstrap intervals describe the four held-out groups; all groups share the same error pattern so intervals are degenerate. That is not evidence of certainty on real captions. The held-out fixtures were exposed during the first engineering run; later runs are regression evidence, not fresh blinded estimates. No procedure selection or rubric change was based on a held-out gain; the candidate remains rejected.

{artifact('EXPERIMENT_REGISTRY.json','Machine-readable experiment')} · {artifact('events.jsonl','Full synthetic episode/event trace')} · {artifact('replay.json','Replay comparison')} · {artifact('boundary.json','Evaluator/proposer boundary')} · {artifact('artifact-manifest.json','Artifact hashes')}

## Calibration and ablations

Removing the rule checker (`probe`) produces 16 false accepts on 24 held-out tasks. Removing ffprobe (`rules`) preserves all 24 correct verdicts and reduces latency. The candidate skips ffprobe on invalid input, as verified by its tool-call trace and a negative-call test; the strongest simple control still wins. This supports the contribution of the deterministic checker only within this SRT subset. No model verifier calibration or human-labeled real-media reliability is established.
'''
    reports['BASELINE_RESULTS.md']='# Baseline Results\n\n'+table+f'\nAll figures are generated from {artifact("EXPERIMENT_REGISTRY.json")}, not hand-entered. Latency includes worker startup. Model arms are excluded with evidence in {page("CAPABILITIES","Capability Registry")}.\n'
    reports['LEARNING_LOOP_REPORT.md']=f'''# Learning Progress

**The first cycle completed with a rejected proposal. Compounding learning has not been demonstrated.**

1. The unchanged `probe` configuration produced repeated development false accepts.
2. The proposer used those episode IDs to select a bounded procedure: check timing and structure before conditionally invoking ffprobe.
3. Candidate source/configuration, rubric and fixture hashes were frozen for evaluation; the worker received one input path and a fixed configuration, never reference labels.
4. The independent evaluator compared all configurations against unchanged reference labels. Existing correctly solved tasks had no observed regressions.
5. The benefit gate rejected the candidate against the strongest simple control. Production remained unchanged.
6. Separate test-only staging and rollback restored the prior configuration and executed it successfully. No production approval is implied by that test.

{table}

The candidate improves the insufficient probe-only workflow, but does not improve upon `rules`. Its correction is a useful procedure experiment, not evidence of increased best-system capability. The initial diagnostic run proposed an already-existing composition; review caught that duplication. The final bounded procedure has a distinct fail-fast execution order and tool-call counts. Both outcomes are retained; the final comparison uses the same exposed regression fixtures and cannot establish fresh generalization.

## Curves, retention and sample efficiency

![Accuracy by synthetic source group; not a sample-efficiency claim](/hive/evidence/caption-pilot-1/learning-curves.svg)

{artifact('learning-curves.json','Per-source curves')} records accuracy for every source group. {artifact('replay.json','Repeated execution')} checks deterministic output retention. Learning-speed indicator is **not estimated**: there has been no equal-budget, successive-distribution trials-to-threshold study. No neural training, forgetting study, transfer study or real-world performance claim is supported.

## Independent gates

{chr(10).join('- '+k.replace('_',' ')+': **'+('PASS' if v else 'FAIL')+'**' for k,v in result['gate']['gates'].items())}

Here, holdout integrity means frozen bytes, disjoint groups and development-only proposal lineage; it does not mean the fixture labels remain secret from a local operator. Safety and memory gates refer to the {tests['tests']} recorded regression tests, not a security audit. These trusted-process checks are not a hostile-code sandbox.

{artifact('test-results.json','Test and rollback evidence')} · {artifact('candidate.json','Candidate lineage')} · {artifact('curated-dev.json','Validated development-only dataset')}

Next smallest deciding experiment: freeze an independently labeled, source-disjoint set of real SRT/video tasks before designing the next candidate. Compare rule-only, retrieval/procedure and an already available model under the same budgets. A fresh holdout and real-task gain are prerequisites for any improvement claim.
'''
    gaps=[
        ('G01','P0','IMPLEMENTED narrow cycle; improvement unproven','core.py / pilot.py / test_engine.py','Real-world held-out candidate gain'),
        ('G02','P0','PARTIAL: five logged policies; heuristics uncalibrated','core.py; RoutingDecision / ExperimentPriority events','Calibrate success/cost/risk on new workloads'),
        ('G03','P0','PARTIAL: real deterministic tool benchmark','pilot.py; capabilities.json; events.jsonl','Safe verified local-model arms'),
        ('G04','P0','PLANNED: no compounding result','learning-curves.json; null learning-speed metric','Successive distributions and unchanged controls'),
        ('G05','P1','PARTIAL: checker/tool ablation measured','EXPERIMENT_REGISTRY.json','Independent real-task counterfactual study'),
        ('G06','P1','PARTIAL: constrained static router','core.py:route','Quality dataset before learned routing / exploration'),
        ('G07','P1','IMPLEMENTED development-only curated export','pilot.py:curated_dataset; curated-dev.json','Real consented provenance-reviewed training data'),
        ('G08','P1','IMPLEMENTED scoped capability registry','capabilities.json; captions.py','Model/service health and compatibility adapters'),
        ('G09','P1','PARTIAL: actual worker resources and budgets','Episode.resources; concurrency test','Process-tree/VRAM/load/queue scheduling measurements'),
        ('G10','P1','IMPLEMENTED local memory contracts','core.py:memory_add / memory_retrieve; tests','Integrate only with explicitly authorized partition owners'),
        ('G11','P1','PARTIAL: reference-label error accounting','Verification records; false accepts/rejects','Independent human labels and probabilistic checker calibration'),
        ('G12','P2','SPECIFIED and ranked heuristically','ARCHITECTURE_DECISIONS.md; ExperimentPriority','Measured research value against a deciding experiment'),
    ]
    gap_table='| Gap | Priority | Status | Files / evidence | Deciding experiment / dependency |\n|---|---|---|---|---|\n'+''.join('| '+' | '.join(row)+' |\n' for row in gaps)
    reports['GAP_IMPLEMENTATION_MAP.md']=f'''# Known Gaps

Every gap remains owned by the HIVE implementation maintainer; promotion authority remains Ian/operator. **Partial means partial, not complete.**

{gap_table}

## Phase gates

- Phase 0: inspected source/services/hardware/archive; a deterministic non-destructive baseline runs.
- Phase 1: task/registry/event/checker/benchmark pipeline implemented and exercised for three tool configurations. Model configurations excluded, not simulated.
- Phase 2: failure-to-procedure-to-evaluation-to-rejection cycle exercised. No accepted improvement or production release.
- Phase 3: static routing and tool/checker ablations exist. Learned organization superiority, model ensembles and bounded contextual exploration remain evidence-gated research.
- Phase 4: memory provenance/expiry/correction/rollback tests exist. Retrieval versus fine-tuning, isolated/shared adapters, replay/distillation/pruning, checkpoint swapping and forgetting remain unmeasured. No training checkpoint is available or justified for this workload.

Sleep-inspired consolidation is retained as a future testable deduplication/replay job, not a mechanism validated by this pilot. Real streaming and horror-game transfer remain follow-on work after a representative video-workflow result. Existing 100/1,000/10,000 logical-expert research paths and competing organizations remain intact.

## First-release checklist

- Checked local capability inventory, executed caption workflow and compared three deterministic configurations.
- Recorded task, capability, config, episode, verifier, failure, candidate and experiment contracts; release/memory contracts exercised in tests.
- Generated a bounded procedure from development failure evidence; froze rubric/splits; compared regressions and retained rejection evidence.
- Tested version restore and prior-config execution; kept production approval separate.
- **Not achieved:** accepted best-baseline improvement, real-model operation, compounding learning, independent fresh holdout generalization, hard hostile-code isolation, process-tree resource attribution.

{page('GAPPLAN','Exact supplied plan')} remains the full specification; this map prevents deferred conditional work from being mistaken for delivered capability.
'''
    reports['ARCHITECTURE_DECISIONS.md']=f'''# Decision Ledger

| Decision | Alternatives retained | Evidence / confidence | Revisit trigger |
|---|---|---|---|
| Use standard-library SQLite + JSON artifacts | Major graph DB, distributed event bus | Append-only/concurrent tests; high for this small local workload | Measured write/contention or retrieval bottleneck |
| Keep runtime capability registry separate from research graph | Research pages as execution authority | Registry executable IDs and hashes; high | New supported operational component |
| Start CPU deterministic caption validation | Local-model plus tool, specialist groups | Model unavailable/occupied hardware; real ffprobe available; high | Existing safe loaded model and useful model-specific task |
| Keep strongest simple control | Probe-only control, combined tools | Rules wins development selection and held-out comparison; scoped high | Source-disjoint real captions expose a rule limitation |
| Reject current candidate promotion | Accept correction versus weak tool-only arm | Equal best quality, no sufficient cost benefit; high in synthetic pilot | Practical held-out benefit under unchanged gates |
| Freeze/record trusted procedure choices | Arbitrary generated code, autonomous permissions | Bounded adapter subprocess; high for pilot, no hostile isolation | OS sandbox/Job Objects needed for untrusted extensions |
| Procedures before weights | Retrieval, isolated/shared adapters, core model update | No justified trainable checkpoint or task gain; medium | Real workflow failures justify a controlled learning study |

Reviewer: implementation agent plus separate read-only requirements/code review. Approval authority: Ian/operator; review is not deployment approval.

## Research queue tied to decisions

1. Hypothesis: real captions expose failures the fixed rules miss. Experiment: independent labeled video/SRT sample with frozen source-disjoint holdout. Decision: whether another procedure/model earns its cost.
2. Hypothesis: contextual routing reduces cost without quality loss. Experiment: varied task conditions, static controls, logged eligible alternatives and bounded exploration. Decision: whether to replace static selection.
3. Hypothesis: retrieval resolves recurring corrections before fine-tuning is needed. Experiment: compare no-memory, retrieval and reusable-procedure arms; only then test a compatible isolated adapter. Decision: whether parameter training is warranted.
4. Hypothesis: consolidation reduces stale/conflicting memory errors. Experiment: versioned deduplication/replay job, counterfactual retrieval and rollback. Decision: whether to schedule a sleep-inspired job.

`core.py:experiment_priority` records probability, future gain, cost, risk, scarce usage and uncertainty. Its initial values are explicitly heuristic, not calibrated probabilities. Competing designs stay visible and can reopen after contradictory evidence.
'''
    reports['CHANGELOG.md']=f'''# Change / Release History

## 2026-11-20 local / 2026-11-21 UTC — empirical pilot

**Implementation prepared; production release pending approval.** Base `60b1412`; scoped feature branch `feature/hive-empirical-engine-20261120`.

- Added `tools/hive_engine/`: D1–D5 decisions, append-only trace store, capability contracts, caption adapters, frozen fixtures, independent checker, failure-derived proposal, curated export, replay, memory and local stage/rollback.
- Added eight requested reports under `hive/implementation/`, seven navigable evidence views, the exact supplied change plan, and sanitized synthetic artifacts under `hive/evidence/caption-pilot-1/`.
- Extended the existing static builder, navigation, full-text search and research graph. Preserved the purple/gold theme, old sources and all archive bytes.
- Initial regression checks exposed non-finite budget handling, a concatenated-cue edge case and a mutable fixture-rubric reference. These were corrected before the first recorded pilot.
- Initial pilot: candidate rejected; review identified its equivalence to an existing composition. The next engineering revision performs semantic validation before invoking ffprobe and records skipped calls. The same exposed fixture holdout was retained for regression comparison; no fresh-generalization claim.
- Review tightened the externally pinned fixture digest, explicit fixture bootstrap, code/candidate hash checks, record contracts and full replay evidence. No gates or reference labels were weakened to obtain acceptance.
- Final measured candidate: **{result['decision'].upper()}**. Approval absent; no deployed experimental policy, weights, permissions or production runtime changes.

## Reproducible checks

```sh
python -m tools.hive_engine.test_engine
python -m tools.hive_engine.pilot --out .hive-local/run-new
python -m tools.hive_engine.verify .hive-local/run-new
python tools/check_hive.py
python tools/gen_game_packs.py
```

Runtime regression result: {tests['tests']} tests, {tests['failures']} failures, {tests['errors']} errors. Evidence inspector: {integrity['episodes']} episodes with attributable verifications and output hashes. The test-only release record and restored execution are in {artifact('test-results.json')}. No real production release was created.

Website QA passed at 1440, 1024, 900, 390 and 320 CSS pixels: all seven evidence views, mobile navigation, search, graph, original diagrams/equations, and reading without JavaScript. There were no page errors or failed requests. These are browser/emulated-phone checks, not a physical-phone test. The vault validator reported zero errors; the static checker verified 313 HTML pages, over 22,800 local links and all 19 original archives. Required game-pack regeneration produced no asset-content changes. The first build refused a colliding `EXPERIMENTS` ID; the measured registry now uses additive `RUNS`, preserving the old experiment-design index.

{artifact('website-checks.json','Staged browser regression report')}

The supplied change plan explicitly requires approval for production-impacting changes and prohibits autonomous promotion of experimental policies/weights. Website publication is requested only after the staged diff and checks are reviewable. Local test approvals never authorize production.
'''
    node_files=[('STATUS','CURRENT_STATE.md','Implementation Status','measured'),('CAPABILITIES','CAPABILITY_INVENTORY.md','Capability Registry','measured'),
                ('RUNS','EXPERIMENT_REGISTRY.md','Experiment Registry','measured'),('LEARNING','LEARNING_LOOP_REPORT.md','Learning Progress','measured'),
                ('GAPS','GAP_IMPLEMENTATION_MAP.md','Known Gaps','specified'),('LEDGER','ARCHITECTURE_DECISIONS.md','Decision Ledger','specified'),
                ('RELEASES','CHANGELOG.md','Change / Release History','measured'),('BASELINE','BASELINE_RESULTS.md','Baseline Results','measured')]
    updates=json.loads((WEB/'updates/index.json').read_text(encoding='utf-8'))
    new_ids={n[0] for n in node_files}|{'GAPPLAN'}
    updates['entries']=[e for e in updates['entries'] if e['id'] not in new_ids]
    updates['edges']=[e for e in updates['edges'] if e['source'] not in new_ids and e['target'] not in new_ids]
    for id,file,title,status in node_files:
        write(WEB/'implementation'/file,reports[file]+common)
        path='implementation/'+file
        updates['entries'].append(dict(id=id,path=path,title=title,type='build',status=status,evidence_status=status,
                                      implementation_status='partial' if id in {'GAPS','LEDGER'} else 'implemented_scoped_pilot',
                                      date='2026-11-21',citation_label='HIVE empirical pilot (21 November 2026 UTC)',
                                      sha256=hashlib.sha256((WEB/path).read_bytes()).hexdigest(),tags=['hive','empirical-pilot',status]))
        if id!='STATUS':updates['edges'].append(dict(source='STATUS',target=id,relation='related_to'))
    plan_path='updates/HIVE_Architecture_Gaps_and_Agent_Change_Plan.md'
    shutil.copyfile(args.plan,WEB/plan_path)
    updates['entries'].append(dict(id='GAPPLAN',path=plan_path,title='Architecture gaps and agent change plan',type='build',status='specified',
                                  evidence_status='specified',implementation_status='partially_implemented',date='2026-11-20',
                                  citation_label='HIVE architecture change plan (20 November 2026)',
                                  sha256=hashlib.sha256((WEB/plan_path).read_bytes()).hexdigest(),tags=['hive','architecture','empirical-learning']))
    for target in ('FRAMEWORK','ROADMAP','ADAPTIVE','HISTORY','B04','B06','CODER'):
        updates['edges'].append(dict(source='STATUS',target=target,relation='informs'))
    updates['edges'] += [dict(source='GAPPLAN',target='STATUS',relation='tested_by'),dict(source='RUNS',target='LEARNING',relation='informs')]
    updates['implementation_status_id']='STATUS'
    write(WEB/'updates/index.json',json.dumps(updates,indent=2,ensure_ascii=False))
    print(json.dumps({'reports':len(reports),'new_pages':len(node_files)+1,'trace':integrity,'decision':result['decision']}))


if __name__=='__main__':main()
