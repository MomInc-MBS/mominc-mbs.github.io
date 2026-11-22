"""Matched zero-inference development comparison through the existing Executor.

Only tool, learning-disabled and opt-in P2 arms run. Model/team arms are blocked,
not simulated. Public synthetic cases cannot establish genuine acceptance/gain.
"""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
sys.path.insert(0, str(ROOT / 'scripts'))
from objective_smoke import build_tasks, load_plan
from hive.adaptive_metrics import assess_candidate
from hive.learning_policy import Policy
from hive.orchestrator import DEFAULT_CONFIG, Executor, code_version, config_hash, inspect_evidence


def run(work, output):
    plan = load_plan(ROOT / 'experiments/plans/objective-smoke.json')
    tasks = [row['task'] for row in build_tasks(plan)]
    for task in tasks:
        task['source_group'] = 'synthetic-' + task['id']
    config = dict(DEFAULT_CONFIG, routes=['tool'], max_requests=0, max_total_tokens=0,
                  max_cycles=6, max_wall_s=60, max_retries=0, max_storage_bytes=16*1024*1024)
    build = code_version()
    arms, trace = {}, []
    for name in ('strongest_tool', 'learning_disabled', 'p2'):
        ex = Executor(work / name, config)
        try:
            policy = Policy(version=3) if name == 'p2' else Policy(mode='fixed')
            identity = {'runtime': build['source_sha256'], 'tasks': config_hash(tasks),
                        'config': config_hash(config), 'policy': config_hash(policy.snapshot())}
            prior = ex.store.get('comparison_identity')
            if prior and prior != identity:
                raise ValueError('changed comparison identity; no implicit rerun')
            ex.store.set('comparison_identity', identity)
            if not prior:
                ex.store.set('governing_policy', policy.snapshot())
            rows = []
            for task in tasks:
                spec = {'task': task, 'route': 'tool' if name == 'strongest_tool' else None,
                        'learn_feedback': False, 'allow_retry': False, 'retry_count': 0,
                        'hypothesis': 'Synthetic exact-tool protection comparison; no quality-gain inference'}
                job = ex.store.enqueue_once('paired:' + task['id'], spec)
                if ex.store.get_job(job)['state'] == 'QUEUED':
                    ex.loop(1)
                evidence = inspect_evidence(ex.store, job)
                verdict, result = evidence['verification'], evidence['result']
                rows.append({'task_id': task['id'], 'category': task['category'],
                    'valid': verdict['valid'], 'passed': verdict['passed'], 'critical': task['critical'],
                    'utility': evidence['utility'], 'latency_s': result['latency_s'], 'tokens': result['tokens']})
                trace.append({'arm': name, 'job_id': job, 'task_hash': config_hash(task),
                    'input_hash': config_hash(task['input']), 'source_group': task['source_group'],
                    'evidence_ref': ex.store.get_job(job)['result']['evidence_ref'],
                    'output_hash': config_hash(result), 'policy_hash': evidence['decision']['policy_hash'],
                    'decision_ref': evidence['decision_ref'], 'verifier': verdict, 'route': evidence['route']})
            arms[name] = {'scheduled': len(tasks), 'rows': rows, 'costs': ex._budget(),
                          'policy_hash': identity['policy'], 'feedback_enabled': False}
        finally:
            ex.close()
    assessment = assess_candidate(arms['strongest_tool']['rows'], arms['p2']['rows'])
    report = {'scope': 'Synthetic development tool-only comparison; no model/team quality measurement',
        'runtime': build, 'source_groups': [t['source_group'] for t in tasks],
        'source_independence_established': False, 'input_plan_hash': config_hash(plan),
        'config_hash': config_hash(config), 'arms': arms,
        'blocked_arms': {'fixed_specialist': 'No new inference allocation',
                         'fixed_two_component_team': 'No new inference allocation; both components must be charged'},
        'assessment': assessment, 'decision': 'QUARANTINE', 'quality_gain': False,
        'model_calls': sum(x['costs']['requests'] for x in arms.values()),
        'promotion_authorized': False, 'trace': trace}
    output.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(report, sort_keys=True, indent=2) + '\n'
    if output.exists() and output.read_text(encoding='utf-8') != encoded:
        raise ValueError('comparison receipt exists with different bytes')
    output.write_text(encoded, encoding='utf-8')
    return {'output': str(output), 'matched_tasks': len(tasks), 'executed_arms': list(arms),
            'quality_delta': assessment['quality_delta'], 'accepted': assessment['accepted'],
            'model_calls': report['model_calls']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(run(args.work.resolve(), args.output.resolve()), indent=2))
