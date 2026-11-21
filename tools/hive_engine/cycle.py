"""Reproducible minimum HIVE loop; old heldout is regression-only.

python -m tools.hive_engine.cycle --out .hive-local/runtime-v2-001
"""
import argparse
import json
from pathlib import Path
import platform
import random
import statistics
import time

from . import evaluation, fixtures, governor, pilot
from .audit import check
from .core import digest
from .runtime import BASELINE, Runtime, policy_for, source_hashes, task_for

CONTROLS = ['rules', 'probe', 'combined']


def rollback_drill(root, candidate, registry):
    path = root/'rollback-input'
    path.mkdir(parents=True)
    sample = path/'caption.srt'
    sample.write_bytes(b'1\n00:00:00,100 --> 00:00:01,000\nRollback rehearsal\n')
    task = task_for(sample, 'rollback-rehearsal', 'retention')
    runtime = Runtime(root/'rollback-state', registry)
    try:
        release = governor.rehearse_candidate(runtime, candidate)
    finally:
        runtime.close()
    runtime = Runtime(root/'rollback-state', registry)
    try:
        staged = runtime.run(task, path)
        governor.rollback(runtime, release['release_id'])
    finally:
        runtime.close()
    runtime = Runtime(root/'rollback-state', registry)
    try:
        restored = runtime.run(task, path)
        okay = (staged['config_id'] == candidate['candidate_id'] and restored['config_id'] == 'rules'
                and staged['passed'] and restored['passed'] and runtime.active_policy == BASELINE)
        if not okay:
            raise ValueError('rollback failed actual restarted execution')
        result = {'passed': okay, 'staged_episode': staged, 'restored_episode': restored,
                  'audit': check(runtime.root), 'candidate_hash': digest(candidate), 'code_hashes': source_hashes(),
                  'scope': 'test-only candidate rehearsal; never activated in operational state'}
        pilot.write(root/'rollback-proof.json', result)
        return result
    finally:
        runtime.close()


def run(out, dataset=None, expected_hash=None, fresh_attestation=None):
    started = time.perf_counter()
    out = Path(out).resolve()
    out.mkdir(parents=True, exist_ok=False)
    root = Path(dataset) if dataset else Path(__file__).with_name('data')
    expected_hash = expected_hash or fixtures.FROZEN_SHA256
    manifest = fixtures.load(root, expected_hash)
    initial_hashes = source_hashes()
    runtime = Runtime(out/'state')
    try:
        contract = evaluation.enroll(runtime, root, expected_hash, fresh_attestation)
        dev = [t for t in manifest['tasks'] if t['split_id'] == 'dev']
        hold = [t for t in manifest['tasks'] if t['split_id'] == 'holdout']
        rows = {arm: [] for arm in CONTROLS}
        matrix = {arm: {'first': [], 'replay': []} for arm in CONTROLS}
        for arm in CONTROLS:
            for task in dev:
                row = runtime.run(task, root, policy_for(arm))
                rows[arm].append(row)
                matrix[arm]['first'].append(row['episode_id'])
        control = min(CONTROLS, key=lambda arm: (-sum(r['passed'] for r in rows[arm]),
                                               sum(r['timings']['wall_seconds'] for r in rows[arm]), arm))
        candidate = pilot.propose([row for group in rows.values() for row in group])
        if not candidate:
            raise ValueError('no repeated dev failure; no invented correction')
        candidate['policy'] = policy_for(candidate['candidate_id'])
        candidate['comparison_baseline'] = control
        runtime.store.append('RuntimeFailurePattern', {'pattern_id': 'probe-false-accept',
                                                       'episode_refs': candidate['training_data_refs'], 'provenance': 'dev-only'})
        runtime.store.append('RuntimeCandidate', candidate)
        plan = {'controls': CONTROLS, 'control': control, 'candidate_hash': digest(candidate),
                'candidate_policy_hash': digest(candidate['policy']), 'baseline_policy_hash': digest(policy_for(control)),
                'criteria_hash': digest(fixtures.CRITERIA), 'criteria': fixtures.CRITERIA,
                'dataset_hash': expected_hash, 'code_hashes': initial_hashes, 'contract_hash': digest(contract),
                'capability_hashes': {name: digest(adapter.manifest()) for name, adapter in runtime.registry.adapters.items()},
                'holdout_status': contract['holdout_status'], 'seed': 20261120,
                'warning': 'Fresh generalization requires a new externally held evaluation set.'}
        runtime.store.append('EvaluationPlan', plan)
        pilot.write(out/'candidate.json', candidate)
        pilot.write(out/'evaluation-plan.json', plan)
        arm = candidate['candidate_id']
        rows[arm], matrix[arm] = [], {'first': [], 'replay': []}
        for task in dev:
            row = runtime.run(task, root, policy_for(arm))
            rows[arm].append(row)
            matrix[arm]['first'].append(row['episode_id'])
        if source_hashes() != initial_hashes:
            raise ValueError('code changed before evaluation')
        fixtures.load(root, expected_hash)
        runtime.store.append('RollbackProof', rollback_drill(out, candidate, runtime.registry))
        # Interleave the fixed arms on each evaluation task to reduce order drift.
        rng = random.Random(plan['seed'])
        for repeat, tasks in [('first', hold), ('replay', manifest['tasks'])]:
            for task in tasks:
                arms = list(rows)
                rng.shuffle(arms)
                for arm in arms:
                    row = runtime.run(task, root, policy_for(arm))
                    matrix[arm][repeat].append(row['episode_id'])
                    if repeat == 'first':
                        rows[arm].append(row)
        fixtures.load(root, expected_hash)
        if source_hashes() != initial_hashes or digest(json.loads((out/'candidate.json').read_text())) != plan['candidate_hash']:
            raise ValueError('frozen experiment changed')
        runtime.store.append('EvaluationMatrix', {'episodes': matrix})
        result = governor.decision(runtime)
        runtime.store.append('RuntimeReleaseDecision', result | {'activated': False, 'approval_ref': None})
        # Exercise the actual mutation entrypoint: a rejected correction must not
        # activate even with an operator-supplied reference.
        if not result['gate']['eligible']:
            try:
                governor.promote(runtime, digest(candidate), 'local-demonstration-gate-check')
                raise AssertionError('rejected candidate must not activate')
            except ValueError:
                if runtime.active_policy != BASELINE:
                    raise AssertionError('rejected candidate changed active runtime')
        summaries = {arm: {split: pilot.summarize([r for r in group if r['split_id'] == split])
                           for split in ('dev', 'holdout')} for arm, group in rows.items()}
        result.update(experiment_id='hive-runtime-v2', metrics=summaries, candidate=candidate['candidate_id'],
                      active_policy=runtime.active_policy, elapsed_seconds=time.perf_counter()-started,
                      python=platform.python_version(), source_hashes=initial_hashes,
                      model_inference_calls=0, autonomous_learning_achieved=False,
                      rollback='passed across restart; exact candidate in isolated rehearsal',
                      telemetry='Worker CPU/peak RAM on Windows. No hard RAM cap or GPU/process-tree resource attribution.',
                      repeat_scope='Output/status replay; latency and RAM are measurements, not byte-identical claims.')
        pilot.write(out/'results.json', result)
        pilot.write(out/'curated-dev.json', [dict(episode_ref=r['episode_id'], input_hash=r['input_hash'],
                    output_ref=r['output_ref'], label_source='independent-parser', partition='validated_facts')
                    for group in rows.values() for r in group if r['split_id'] == 'dev' and r['passed'] and not r['errors']])
        runtime.store.export(runtime.root/'events.jsonl')
        pilot.write(out/'audit.json', check(runtime.root))
        print(json.dumps({'decision': result['decision'], 'control': control, 'gates': result['gate']['gates'],
                          'rollback': result['rollback'], 'out': str(out)}))
        return result
    finally:
        runtime.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--dataset', type=Path)
    parser.add_argument('--dataset-sha256')
    parser.add_argument('--fresh-holdout-attestation', help='Operator provenance reference; never generated by proposer')
    args = parser.parse_args()
    if args.dataset and not args.dataset_sha256:
        parser.error('a custom dataset requires an independently recorded --dataset-sha256')
    run(args.out, args.dataset, args.dataset_sha256, args.fresh_holdout_attestation)
