"""Run with: python -m tools.hive_engine.pilot --out .hive-local/run-001

The proposer sees verified development failures only. The fixed evaluator owns
labels/criteria. This is process/API separation for trusted bounded procedures,
not hostile-code isolation. No production release command exists.
"""
from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import os
from pathlib import Path
import platform
import random
import shutil
import statistics
import subprocess
import sys
import time

from . import captions, fixtures
from .core import (Store, canonical, digest, eligibility, route, verification_value,
                   experiment_priority, promotion_gate)

HERE = Path(__file__).resolve().parent


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, allow_nan=False)+'\n', encoding='utf-8')


def child_resources(process):
    """Worker process only; grandchild ffprobe and GPU use are not attributed."""
    result = dict(cpu_seconds=None, peak_rss_bytes=None,
                  scope='worker process only; ffprobe child/GPU attribution unavailable')
    if os.name == 'nt':
        from ctypes import wintypes
        class Counters(ctypes.Structure):
            _fields_ = [('cb', wintypes.DWORD), ('faults', wintypes.DWORD)] + [(n, ctypes.c_size_t) for n in
                         ('peak', 'working', 'paged_peak', 'paged', 'nonpaged_peak', 'nonpaged', 'pagefile', 'pagefile_peak')]
        mem = Counters()
        mem.cb = ctypes.sizeof(mem)
        handle = wintypes.HANDLE(int(process._handle))
        if ctypes.windll.psapi.GetProcessMemoryInfo(handle, ctypes.byref(mem), mem.cb):
            result['peak_rss_bytes'] = mem.peak
        values = [ctypes.c_ulonglong() for _ in range(4)]
        if ctypes.windll.kernel32.GetProcessTimes(handle, *(ctypes.byref(x) for x in values)):
            result['cpu_seconds'] = (values[2].value + values[3].value)/10_000_000
    return result


def invoke(config, path, executable, timeout):
    started = time.perf_counter()
    process = subprocess.Popen([sys.executable, str(HERE/'captions.py'), config, str(path), '--ffprobe', executable],
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    error = None
    try:
        stdout, stderr = process.communicate(timeout=timeout)
        if process.returncode: error = 'worker-failed'
    except subprocess.TimeoutExpired:
        process.kill()
        stdout, stderr = process.communicate()
        error = 'timeout'
    elapsed = time.perf_counter()-started
    resources = child_resources(process)
    try:
        output = json.loads(stdout) if not error else {'error': error}
        if not isinstance(output, dict) or type(output.get('valid')) is not bool:
            error = error or 'malformed-output'
    except (json.JSONDecodeError, UnicodeDecodeError):
        output, error = {}, 'malformed-output'
    return dict(output=output, error=error, wall_seconds=elapsed, resources=resources,
                # stderr may contain user paths in other workflows: never export raw stderr.
                stderr_hash=hashlib.sha256(stderr).hexdigest(), returncode=process.returncode)


def capabilities(executable):
    return [dict(capability_id=name, kind='deterministic-tool' if name != 'rules' else 'procedure',
                 version=captions.VERSION, adapter='captions.execute', supported_tasks=['caption-validation'],
                 permissions=['read-fixture'] + (['run-ffprobe'] if name != 'rules' else []),
                 requirements={'wall_seconds': 3, 'input_bytes': 65536, 'concurrency': 1},
                 constraints={'max_bytes': 65536, 'max_media_seconds': 15, 'dependencies': [] if name == 'rules' else ['ffprobe']},
                 health='ready' if name == 'rules' or executable else 'unavailable', safe=True,
                 provenance={'adapter_sha256': hashlib.sha256((HERE/'captions.py').read_bytes()).hexdigest()})
            for name in ('rules', 'probe', 'combined', 'probe-guard')]


def evaluate(output, label, error):
    # Independent immutable expected verdict: never ask the candidate to grade itself.
    return error is None and type(output.get('valid')) is bool and output['valid'] == label['valid']


def benchmark(store, tasks, labels, root, run_root, config, cap, executable, run_tag='first'):
    rows = []
    config_record = dict(config_id=config, component_versions={config: captions.VERSION},
                         routing_policy_version='deciders-1', tool_graph=[config],
                         checker_policy_version=fixtures.CRITERIA['version'], limits=cap['requirements'])
    store.append('Config', config_record)
    for task in tasks:
        ep_id = f'{config}-{task["task_id"]}-{run_tag}'
        started = time.time()
        gate = eligibility(task, cap)
        if gate['eligible']:
            outcome = invoke(config, root/task['input_ref'], executable or 'ffprobe', task['resource_budget']['wall_seconds'])
        else:
            outcome = dict(output={}, error='ineligible', wall_seconds=0, resources={}, returncode=None, stderr_hash=None)
        if outcome['wall_seconds'] > task['resource_budget']['wall_seconds']:
            outcome['error'] = 'budget-exceeded'
        artifact = {'task_id': task['task_id'], 'config_id': config, 'output': outcome['output']}
        artifact_hash = digest(artifact)
        ref = f'outputs/{artifact_hash}.json'
        write(run_root/ref, artifact)
        episode = dict(episode_id=ep_id, task_id=task['task_id'], config_id=config,
                       input_hash=task['input_hash'], task_hash=digest(task), config_hash=digest(config_record),
                       trace_refs=[artifact_hash], output_refs=[ref], output_hash=artifact_hash,
                       timings={'wall_seconds': outcome['wall_seconds'], 'started_at': started},
                       resources=outcome['resources'], status='failed' if outcome['error'] else 'completed',
                       errors=[outcome['error']] if outcome['error'] else [], eligibility=gate,
                       calls={'worker': 1 if gate['eligible'] else 0, 'ffprobe': outcome['output'].get('tool_calls', 0),
                              'models': 0, 'retries': 0, 'human_interventions': 0},
                       split_id=task['split_id'], source_group=task['source_group'], family=task['family'])
        store.append('Episode', episode)
        passed = evaluate(outcome['output'], labels[task['task_id']], outcome['error'])
        verification = dict(episode_id=ep_id, checker_id='reference-label-comparator', checker_version='1',
                            criteria_version=fixtures.CRITERIA['version'], result=passed,
                            confidence_if_calibrated=None, evidence_refs=[ref], label_source=labels[task['task_id']]['label_source'],
                            expected=labels[task['task_id']]['valid'], actual=outcome['output'].get('valid'))
        store.append('Verification', verification)
        rows.append(dict(episode, passed=passed, expected=verification['expected'], actual=verification['actual']))
    return rows


def summarize(rows):
    groups = sorted({r['source_group'] for r in rows})
    group_means = [statistics.mean(r['passed'] for r in rows if r['source_group'] == g) for g in groups]
    rng = random.Random(20261120)
    bootstrap = sorted(statistics.mean(rng.choices(group_means, k=len(groups))) for _ in range(2000))
    times = sorted(r['timings']['wall_seconds'] for r in rows)
    return dict(n=len(rows), source_groups=len(groups), accuracy=statistics.mean(r['passed'] for r in rows),
                cluster_bootstrap_95=[bootstrap[49], bootstrap[1949]],
                mean_wall_seconds=statistics.mean(times), p95_wall_seconds=times[min(len(times)-1, int(len(times)*.95))],
                failures=sum(not r['passed'] for r in rows),
                false_accept=sum(r['actual'] is True and r['expected'] is False for r in rows),
                false_reject=sum(r['actual'] is False and r['expected'] is True for r in rows),
                execution_errors=sum(bool(r['errors']) for r in rows),
                by_family={f: statistics.mean(r['passed'] for r in rows if r['family'] == f) for f in sorted({r['family'] for r in rows})},
                warning='Synthetic, correlated fixtures; few source clusters. Intervals do not establish real-world generalization.')


def propose(development_rows):
    if any(r['split_id'] != 'dev' for r in development_rows): raise ValueError('holdout contamination')
    failures = [r for r in development_rows if r['config_id'] == 'probe' and not r['passed'] and r['actual'] is True]
    if len(failures) < 2: return None
    return dict(candidate_id='probe-guard', parent_version='probe', change_type='procedure',
                diff_or_artifact_ref='captions.execute:probe-guard',
                hypothesis='Reject invalid timing/structure before ffprobe; reduce false acceptance and unnecessary tool calls.',
                training_data_refs=[r['episode_id'] for r in failures], scope='local-staging',
                procedure={'before': ['ffprobe'], 'after': ['rules', 'ffprobe-only-if-rules-pass'], 'allowed_code': 'captions-1'})


def curated_dataset(store):
    verified = {v['episode_id']: v for v in store.records('Verification') if v['result']}
    return [dict(episode_ref=e['episode_id'], input_hash=e['input_hash'], output_refs=e['output_refs'],
                 label_source=verified[e['episode_id']]['label_source'], partition='validated_facts',
                 config_hash=e['config_hash']) for e in store.records('Episode')
            if e['split_id'] == 'dev' and e['episode_id'] in verified and e['status'] == 'completed']


def run(root, out):
    out.mkdir(parents=True, exist_ok=False)
    checksum = fixtures.FROZEN_SHA256
    if (root/'manifest.sha256').read_text().strip() != checksum:
        raise ValueError('fixture lock differs from independently pinned checksum')
    manifest = fixtures.load(root, checksum)
    store = Store(out/'events.sqlite')
    executable = shutil.which('ffprobe')
    caps = capabilities(executable)
    for cap in caps: store.append('Capability', cap)
    for task in manifest['tasks']: store.append('TaskSpec', task)
    version = subprocess.run([executable, '-version'], capture_output=True, text=True, timeout=3).stdout.splitlines()[0] if executable else None
    metadata = dict(python=platform.python_version(), platform=platform.platform(), ffprobe=version,
                    manifest_hash=checksum, policy_hash=digest(fixtures.CRITERIA),
                    code_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in HERE.glob('*.py')},
                    started_at=time.time(), seed=manifest['seed'], execution='CPU; no model inference; max concurrency 1',
                    exclusions={'model-plus-tools': 'No already loaded local model; occupied GPU; inference not executed.',
                                'specialist-model-group': 'No verified serving model group; not executed.'},
                    telemetry_limits='Worker CPU/peak RAM on Windows; grandchild ffprobe/GPU utilization and queue contention not attributed.')
    write(out/'metadata.json', metadata)
    dev = [t for t in manifest['tasks'] if t['split_id'] == 'dev']
    hold = [t for t in manifest['tasks'] if t['split_id'] == 'holdout']
    rows = {}
    for config in ('rules', 'probe', 'combined'):
        rows[config] = benchmark(store, dev, manifest['labels'], root, out, config, next(c for c in caps if c['capability_id']==config), executable)
    # Control chosen on development evidence, before any held-out execution.
    control = min(rows, key=lambda c: (-sum(r['passed'] for r in rows[c]), sum(r['timings']['wall_seconds'] for r in rows[c])))
    estimates = {name: dict(p=statistics.mean(r['passed'] for r in rr), cost=statistics.mean(r['timings']['wall_seconds'] for r in rr),
                           latency=statistics.mean(r['timings']['wall_seconds'] for r in rr), risk=0) for name, rr in rows.items()}
    store.append('RoutingDecision', route(dev[0], caps[:3], estimates, dict(value=1, cost=.1, latency=.1, risk=1)))
    store.append('VerificationDecision', verification_value(True, 0, 1))
    store.append('ExperimentPriority', experiment_priority(.5, .1, .01, 0, 1, .5))
    candidate = propose([r for rr in rows.values() for r in rr])
    if candidate is None: raise RuntimeError('No repeated probe failures; no candidate invented')
    store.append('FailurePattern', dict(pattern_id='probe-false-accept', episode_refs=candidate['training_data_refs'],
                                      hypothesis=candidate['hypothesis'], severity='incorrect-validation', provenance='dev-only', status='observed'))
    store.append('ChangeCandidate', candidate)
    write(out/'candidate.json', candidate)
    candidate_hash = digest(candidate)
    rows[candidate['candidate_id']] = benchmark(store, dev, manifest['labels'], root, out, candidate['candidate_id'], caps[-1], executable)
    fixtures.load(root, checksum)
    if {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in HERE.glob('*.py')} != metadata['code_hashes']:
        raise ValueError('implementation changed during development')
    if digest(json.loads((out/'candidate.json').read_text())) != candidate_hash: raise ValueError('candidate changed before holdout')
    for config in rows:
        rows[config] += benchmark(store, hold, manifest['labels'], root, out, config, next(c for c in caps if c['capability_id']==config), executable)
    replays = {}
    for config in rows:
        repeated = benchmark(store, manifest['tasks'], manifest['labels'], root, out, config,
                             next(c for c in caps if c['capability_id']==config), executable, run_tag='replay')
        original = {r['task_id']:r for r in rows[config]}
        replays[config] = dict(tasks=len(repeated), matches=sum(original[r['task_id']]['output_hash']==r['output_hash'] and
                              original[r['task_id']]['status']==r['status'] for r in repeated), metrics=summarize(repeated))
    store.append('ReplayEvidence', replays)
    write(out/'replay.json', replays)
    fixtures.load(root, checksum)
    if digest(json.loads((out/'candidate.json').read_text())) != candidate_hash:
        raise ValueError('candidate changed during evaluation')
    if {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in HERE.glob('*.py')} != metadata['code_hashes']:
        raise ValueError('implementation changed during evaluation')
    summaries = {c:{s:summarize([r for r in rr if r['split_id']==s]) for s in ('dev','holdout')} for c, rr in rows.items()}
    control_rows = {r['task_id']:r for r in rows[control]}
    candidate_rows = rows[candidate['candidate_id']]
    regressions = sum(control_rows[r['task_id']]['passed'] and not r['passed'] for r in candidate_rows)
    baseline = summaries[control]['holdout']
    updated = summaries[candidate['candidate_id']]['holdout']
    # Test evidence is independently generated before the run; do not invent gate success.
    test_report_path = HERE/'test-results.json'
    test_report = json.loads(test_report_path.read_text()) if test_report_path.exists() else {}
    suite_current = test_report.get('ok') is True and test_report.get('code_hashes') == metadata['code_hashes']
    evidence = dict(quality_delta=updated['accuracy']-baseline['accuracy'],
                    cost_reduction=1-updated['mean_wall_seconds']/baseline['mean_wall_seconds'],
                    regressions=regressions, safety_passed=suite_current, memory_passed=suite_current,
                    budgets_passed=all(not r['errors'] for rr in rows.values() for r in rr),
                    reproducible=all(r['tasks']==r['matches'] for r in replays.values()),
                    holdout_clean=set(candidate['training_data_refs']).issubset({r['episode_id'] for rr in rows.values() for r in rr if r['split_id']=='dev'}),
                    rollback_tested=suite_current and bool(test_report.get('artifacts',{}).get('rollback')))
    write(out/'boundary.json', dict(candidate_hash=candidate_hash, rubric_hash=digest(manifest['criteria']),
          pinned_manifest=checksum, training_refs=candidate['training_data_refs'],
          proposer_input='Development episode verdicts only, before held-out execution.',
          worker_input='One fixture path and fixed config ID; no labels or rubric file passed.',
          limitation='Trusted bounded adapters, not filesystem isolation from hostile candidate code. Holdout opened once; later replays are regression tests.'))
    gate = promotion_gate(evidence, manifest['criteria'])
    result = dict(experiment_id='caption-pilot-1', candidate_id=candidate['candidate_id'], control_config_id=control,
                  task_split_versions={'version':manifest['version'], 'sha256':checksum}, metrics=summaries, seed=manifest['seed'],
                  result_artifacts=['events.jsonl','metadata.json','candidate.json','curated-dev.json','replay.json','boundary.json'],
                  decision='awaiting-operator-approval' if gate['eligible'] else 'rejected', gate=gate,
                  approval=None, deployed_version=None, candidate_hash=candidate_hash, rubric_hash=digest(manifest['criteria']),
                  interpretation='A bounded procedure proposal, evaluated against the best simple development control. No compounding-learning claim.',
                  learning_speed={'threshold':.95, 'gain':None, 'reason':'No successive training distributions or equal-budget trials-to-threshold study.'})
    store.append('Experiment', result)
    store.append('ReleaseDecision', dict(candidate_id=candidate['candidate_id'], gate_results=gate,
                                        decision=result['decision'], approval_ref=None, production_changed=False))
    write(out/'curated-dev.json', curated_dataset(store))
    write(out/'EXPERIMENT_REGISTRY.json', result)
    # Curves show per-source retention/generalization, not fictitious sample efficiency.
    write(out/'learning-curves.json', {c:[dict(source_group=g, accuracy=statistics.mean(r['passed'] for r in rr if r['source_group']==g))
                                        for g in sorted({r['source_group'] for r in rr})] for c,rr in rows.items()})
    store.export(out/'events.jsonl')
    store.close()
    print(json.dumps({'out':str(out), 'decision':result['decision'], 'control':control,
                      'holdout':{k:v['holdout']['accuracy'] for k,v in summaries.items()}, 'gate':gate['gates']}))
    return result


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--dataset', type=Path, default=HERE/'data')
    args = ap.parse_args()
    if not args.dataset.exists():
        ap.error('Frozen dataset missing. Bootstrap explicitly with python -m tools.hive_engine.fixtures --out PATH')
    run(args.dataset.resolve(), args.out.resolve())
