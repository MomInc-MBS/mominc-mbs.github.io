"""One recorded live reproducibility checkpoint; never trains on held-out results."""
import argparse
import json
from pathlib import Path

from hive.learning_policy import Policy
from hive.orchestrator import Executor, config_hash, load_config, worker_lock
from hive.task_spec import CATEGORIES


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--store', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    ex = Executor(args.store, load_config('configs/local.json'))
    try:
        if ex.store.get('live_reproduction_report'):
            report = ex.store.read_artifact(ex.store.get('live_reproduction_report'))
        else:
            with worker_lock(args.store):
                candidate = ex.store.get('frozen_candidate')
                policy = Policy(state=candidate)
                chosen = []
                for category in CATEGORIES:
                    route = policy.choose(category, ['local_direct', 'local_tool'])
                    original = next(j for j in ex.store.jobs() if j['spec']['task']['split'] == 'holdout'
                                    and j['spec']['task']['category'] == category and j['spec']['task']['critical']
                                    and j['spec']['route'] == route)
                    chosen.append({'task': original['spec']['task'], 'route': route,
                                   'original_evidence': original['result']['evidence_ref']})
                # Persist exact chosen cases and matching criterion BEFORE new inference.
                plan = {'hypothesis': 'Six predeclared critical cases, one per category, retain verified quality in a new process with frozen policy.',
                        'candidate_hash': config_hash(candidate), 'selection': 'first critical case per category; no outcome-conditioned selection',
                        'criterion': 'same verified quality as original on all six; no learned updates', 'chosen': chosen}
                plan_ref = ex.store.put_artifact(plan)
                ex.store.set('live_reproduction_plan', plan_ref)
                if ex._budget()['requests'] + len(chosen) > ex.config['max_requests']:
                    raise ValueError('Insufficient budget for predeclared reproduction checkpoint')
                matched = 0
                passed = 0
                refs = []
                before = config_hash(ex.store.get('policy'))
                for row in chosen:
                    job = ex.store.enqueue_once('live-reproduction:' + row['task']['id'],
                                                {'task': row['task'], 'route': row['route'], 'allow_retry': False, 'retry_count': 0,
                                                 'hypothesis': plan['hypothesis']})
                    previous = ex.store.get_job(job)
                    if previous.get('result'):
                        result = previous['result']
                    else:
                        result = ex.run_one()
                    if not result:
                        raise RuntimeError('Reproduction stopped at resource barrier')
                    current = ex.store.read_artifact(result['evidence_ref'])
                    original = ex.store.read_artifact(row['original_evidence'])
                    matched += int(current['verification']['valid'] and current['verification']['quality'] == original['verification']['quality'])
                    passed += int(current['verification']['passed'])
                    refs.append(result['evidence_ref'])
                unchanged = before == config_hash(ex.store.get('policy'))
                report = {'cycle_id': 'C6-live-reproduction', 'hypothesis': plan['hypothesis'], 'plan_ref': plan_ref,
                          'candidate_hash': config_hash(candidate), 'n': len(chosen), 'matched_quality': matched, 'passed': passed,
                          'learning_unchanged': unchanged, 'reproduced': matched == len(chosen) and unchanged,
                          'evidence_refs': refs, 'budget': ex._budget(), 'decision': 'QUARANTINE',
                          'limitation': 'Six-case reproducibility diagnostic; does not replace independent family-level superiority evidence.',
                          'next_experiment': 'Broader preregistered families with fresh holdout, after allocating a new bounded mission.'}
                ex.store.set('live_reproduction_report', ex.store.put_artifact(report))
        Path(args.output).write_text(json.dumps(report, indent=2), encoding='utf-8')
        print(json.dumps({k:v for k,v in report.items() if k != 'evidence_refs'}, indent=2))
    finally:
        ex.close()


if __name__ == '__main__':
    main()
