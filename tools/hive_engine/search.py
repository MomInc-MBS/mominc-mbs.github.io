"""Bounded four-arm search. Frozen exposed fixtures are REGRESSION ONLY.

python -m tools.hive_engine.search --out RUN --optimizer-python PATH
python -m tools.hive_engine.search --audit RUN

Only the proposal subprocess needs Optuna. All candidates and the verifier run
in the unchanged core Python environment. No operational promotion entry point.
"""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import random
import re
import statistics
import subprocess
import tempfile
import time

from . import audit, contracts, evaluation, fixtures
from .adapters import Registry
from .core import Store, digest
from .pilot import write
from .recipes import RecipeAdapter, SPECIALISTS, THRESHOLDS, recipe, validate as validate_recipe
from .runtime import Runtime, exclusive, policy_for, source_hashes

ARMS = ('static', 'heuristic', 'random', 'optuna')
SEEDS = (11, 29, 47)
TRIALS = 4
DATA = Path(__file__).with_name('data')


def append(store, kind, record):
    contracts.validate(kind, record)
    store.append(kind, record)


def specification(optimizer_identity=None):
    m = fixtures.load(DATA, fixtures.FROZEN_SHA256)
    return contracts.validate('ExperimentSpec', dict(
        experiment_id='caption-search-1', seeds=list(SEEDS), arms=list(ARMS), trials_per_arm=TRIALS,
        evaluation_trials=1, budget_scope='per arm per seed; includes evaluation reserve',
        budget=dict(max_trials=TRIALS+1, task_calls=TRIALS*48+24, wall_seconds=240.0,
                    concurrency=1, retry_cap=0, dollars=0.0, gpu_seconds=0.0),
        aggregate_budget=dict(max_trials=60, task_calls=2592, wall_seconds=2880.0,
                    concurrency=1, retry_cap=0, dollars=0.0, gpu_seconds=0.0),
        dataset=dict(dataset_hash=fixtures.FROZEN_SHA256,
                     dev_ids=[t['task_id'] for t in m['tasks'] if t['split_id'] == 'dev'],
                     evaluation_ids=[t['task_id'] for t in m['tasks'] if t['split_id'] == 'holdout'],
                     holdout_status='regression-only-known-exposed'),
        metrics=[dict(metric_id='verified_fraction', unit='fraction', direction='maximize', scope='independent checker and frozen labels'),
                 dict(metric_id='execution_latency', unit='seconds', direction='minimize', scope='admission through adapter; persistence excluded'),
                 dict(metric_id='total_trial_wall', unit='seconds', direction='minimize', scope='proposal plus execution verification and persistence')],
        source_hashes=source_hashes(), selection_rule='quality must be 1.0; Pareto quality/latency; lowest dev latency then recipe hash; no scalar quality/cost trade',
        environment={'python': platform.python_version(), 'platform': platform.platform(),
                     'optuna': '5.1.0', 'lock_sha256': hashlib.sha256(Path(__file__).parents[1].joinpath('hive-optuna.lock').read_bytes()).hexdigest(),
                     'optimizer_installation': optimizer_identity,
                     'software': RecipeAdapter(recipe('combined')).manifest()['provenance']}))


def optimizer_call(executable, request, timeout):
    with tempfile.TemporaryDirectory(prefix='hive-proposal-') as tmp:
        result = subprocess.run([str(Path(executable).resolve()), '-I', str(Path(__file__).with_name('optimizer.py'))],
                                input=json.dumps(request), text=True, encoding='utf-8',
                                capture_output=True, cwd=tmp, timeout=timeout, check=True)
    if len(result.stdout) > 16384:
        raise ValueError('proposal output budget')
    return json.loads(result.stdout)


def optimizer_environment(executable):
    identity = optimizer_call(executable, {'mode': 'environment'}, 15)
    lock = Path(__file__).parents[1].joinpath('hive-optuna.lock').read_text()
    expected = dict(re.findall(r'^([a-z0-9-]+)==([^\s]+)', lock, re.MULTILINE))
    if identity['packages'] != expected:
        raise ValueError('optimizer environment differs from pinned dependency set')
    return identity


def proposal(arm, seed, index, history, optimizer_python, remaining, environment=None):
    if arm == 'static':
        return recipe()
    if arm == 'heuristic':
        # Existing dev-derived false-acceptance guard, frozen before this search.
        return recipe('probe-guard')
    if arm == 'random':
        rng = random.Random(seed+index)
        return recipe(rng.choice(SPECIALISTS), rng.choice(THRESHOLDS))
    request = {'seed': seed, 'index': index, 'history': history,
               'environment': environment or optimizer_environment(optimizer_python)}
    return validate_recipe(optimizer_call(optimizer_python, request, min(15, remaining)))


def trial_id(arm, seed, index, phase):
    return f'{phase}-{seed}-{arm}-{index}'


def result_for(plan, rows, elapsed, status, reason, known=True, charged_calls=None):
    return dict(trial_id=plan['trial_id'], arm=plan['arm'], seed=plan['seed'], index=plan['index'],
                phase=plan['phase'], candidate_hash=plan.get('candidate_hash', ''), status=status, reason=reason,
                task_count=len(rows), successes=sum(r['passed'] for r in rows),
                charged_calls=len(rows) if charged_calls is None else charged_calls,
                mean_wall_seconds=statistics.mean(r['timings']['wall_seconds'] for r in rows) if rows else 0.0,
                wall_seconds=elapsed, cpu_seconds=sum(r['resources'].get('cpu_seconds') or 0 for r in rows),
                peak_rss_bytes=max((r['resources'].get('peak_rss_bytes') or 0 for r in rows), default=0),
                cost_known=known, state_ref=plan['state_ref'])


def recover_pending(store, out):
    finished = {r['trial_id'] for r in store.records('TrialResult')}
    for plan in store.records('SearchTrialPlan'):
        if plan['trial_id'] not in finished:
            # Never silently repeat a partially observed call. Count the whole
            # reserved wall allocation conservatively; retain its partial state.
            rows = []
            state = audit.artifact(Path(out), plan['state_ref'])
            if (state/'runtime.sqlite').exists():
                partial = Store(state/'runtime.sqlite')
                try:
                    partial.verify()
                    partial.export(state/'events.jsonl')
                    trace = audit.check(state, allow_incomplete=True)
                    rows = [r for r in partial.records('RuntimeEpisode') if r['episode_id'] not in trace['incomplete_episode_ids']]
                finally:
                    partial.close()
            frozen = [r for r in store.records('SearchCandidateFrozen') if r['trial_id'] == plan['trial_id']]
            if frozen:
                plan = plan | {'candidate_hash': frozen[0]['candidate_hash']}
            append(store, 'TrialResult', result_for(plan, rows, plan['reserved_seconds'],
                   'inconclusive', 'outcome_unknown after interruption; no automatic retry', False,
                   len(plan['task_order'])))


def history_for(store, arm, seed):
    candidates = {r['candidate_hash']: r for r in store.records('CandidateLineage')}
    result = []
    for r in store.records('TrialResult'):
        if r['phase'] == 'development' and r['arm'] == arm and r['seed'] == seed and r['candidate_hash']:
            result.append({'trial_id': r['trial_id'], 'status': r['status'],
                           'recipe': candidates[r['candidate_hash']]['recipe'],
                           'quality': r['successes']/r['task_count'] if r['task_count'] else 0,
                           'latency': r['mean_wall_seconds']})
    return result


def execute_trial(out, store, spec, arm, seed, index, phase, optimizer_python, chosen=None):
    ident = trial_id(arm, seed, index, phase)
    if any(r['trial_id'] == ident for r in store.records('TrialResult')):
        return
    prior = [r for r in store.records('TrialResult') if r['arm'] == arm and r['seed'] == seed]
    remaining = max(0.0, spec['budget']['wall_seconds']-sum(r['wall_seconds'] for r in prior))
    calls_left = spec['budget']['task_calls']-sum(r['charged_calls'] for r in prior)
    manifest = fixtures.load(DATA, spec['dataset']['dataset_hash'])
    tasks = [t for t in manifest['tasks'] if t['split_id'] == ('dev' if phase == 'development' else 'holdout')]
    random.Random(seed+index).shuffle(tasks)  # identical per seed/index across arms
    allocation = min(45.0, remaining)
    plan = dict(trial_id=ident, arm=arm, seed=seed, index=index, phase=phase,
                state_ref='trials/'+ident, reserved_seconds=allocation,
                channel='Control', started_unix=time.time(), task_order=[t['task_id'] for t in tasks])
    store.append('SearchTrialPlan', plan)
    started = time.perf_counter()
    rows, app = [], None
    try:
        if remaining < 4 or calls_left < len(tasks) or len(prior) >= spec['budget']['max_trials']:
            raise TimeoutError('arm budget exhausted')
        history = history_for(store, arm, seed)
        value = chosen if chosen is not None else proposal(arm, seed, index, history, optimizer_python, allocation,
                                                          spec['environment']['optimizer_installation'])
        adapter = RecipeAdapter(value)
        plan['candidate_hash'] = digest(value)
        append(store, 'CandidateLineage', dict(candidate_hash=digest(value), parent_hash=digest(recipe()),
               method=arm, seed=seed, generation=index, development_trial_refs=[h['trial_id'] for h in history], recipe=value))
        store.append('SearchCandidateFrozen', dict(trial_id=ident, candidate_hash=digest(value), channel='Teaching'))
        state = out/plan['state_ref']
        app = Runtime(state, Registry([adapter]))
        evaluation.enroll(app, DATA, spec['dataset']['dataset_hash'])
        for task in tasks:
            if time.perf_counter()-started+task['resource_budget']['wall_seconds'] > allocation:
                raise TimeoutError('trial watchdog stopped before next call')
            row = app.run(task, DATA, policy_for(adapter.id))
            rows.append(row)
            # Label agreement is separate from the independent parser's verdict.
            if row['expected'] != manifest['labels'][task['task_id']]['valid']:
                raise ValueError('independent checker/reference disagreement')
        audit.check(state)
        status, reason = ('completed', 'all task outcomes retained') if all(r['status'] == 'completed' for r in rows) else ('failed', 'one or more execution errors')
    except Exception as exc:
        status, reason = 'inconclusive', type(exc).__name__+': '+str(exc)[:200]
    finally:
        if app:
            app.close()
    append(store, 'TrialResult', result_for(plan, rows, time.perf_counter()-started, status, reason))
    store.export(out/'search-events.jsonl')


def select(store, arm, seed):
    candidates = {r['candidate_hash']: r['recipe'] for r in store.records('CandidateLineage')}
    valid = [r for r in store.records('TrialResult') if r['phase'] == 'development' and r['arm'] == arm and r['seed'] == seed
             and r['status'] == 'completed' and r['task_count'] == 48 and r['successes'] == 48]
    # A failed quality constraint cannot be paid for with lower latency.
    if not valid:
        return None
    best = min(valid, key=lambda r: (r['mean_wall_seconds'], r['candidate_hash'], r['index']))
    return candidates[best['candidate_hash']]


def summarize(out, store, spec):
    trials = store.records('TrialResult')
    summaries, decisions = {}, []
    for arm in ARMS:
        rows = [r for r in trials if r['arm'] == arm and r['phase'] == 'evaluation']
        all_rows = [r for r in trials if r['arm'] == arm]
        summaries[arm] = dict(evaluation_trials=len(rows),
            successes=sum(r['successes'] for r in rows), tasks=sum(r['task_count'] for r in rows),
            mean_execution_seconds=statistics.mean(r['mean_wall_seconds'] for r in rows) if rows else None,
            total_wall_seconds=sum(r['wall_seconds'] for r in all_rows),
            task_calls=sum(r['task_count'] for r in all_rows),
            charged_calls=sum(r['charged_calls'] for r in all_rows),
            failures=sum(r['status'] != 'completed' for r in all_rows),
            cpu_seconds=sum(r['cpu_seconds'] for r in all_rows),
            peak_rss_bytes=max((r['peak_rss_bytes'] for r in all_rows), default=0))
    for row in [r for r in trials if r['phase'] == 'evaluation' and r['arm'] != 'static']:
        base = next((r for r in trials if r['arm'] == 'static' and r['seed'] == row['seed'] and r['phase'] == 'evaluation'), None)
        q = row['successes']/row['task_count'] if row['task_count'] else 0
        bq = base['successes']/base['task_count'] if base and base['task_count'] else 1
        reduction = 1-row['mean_wall_seconds']/base['mean_wall_seconds'] if base and base['mean_wall_seconds'] else 0
        gates = dict(complete=row['status'] == 'completed' and row['task_count'] == 24,
                     benefit=(q-bq >= fixtures.CRITERIA['min_quality_gain'] or (q >= bq and reduction >= fixtures.CRITERIA['min_cost_reduction'])),
                     fresh_holdout=False, novel_family_retention=False, candidate_recovery_evidence=False)
        decisions.append(contracts.validate('PromotionDecision', dict(candidate_hash=row['candidate_hash'], eligible=all(gates.values()),
                        gates=gates, evidence_ref=row['trial_id'], authority='independent frozen evaluator; search cannot activate policies', deployed=False)))
    return dict(experiment_hash=digest(spec), arms=summaries, decisions=decisions,
                all_trials=trials, limitation='Known exposed synthetic caption fixtures. No novel family, generalist/team comparison, fresh generalization or autonomous learning demonstrated.',
                answer='No verified improvement established; every candidate rejected for operational promotion.')


def run(out, optimizer_python):
    out = Path(out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    with exclusive(out):
        spec = specification(optimizer_environment(optimizer_python))
        store = Store(out/'search.sqlite')
        try:
            store.verify()
            prior = store.records('ExperimentSpec')
            if prior and prior != [spec]:
                raise ValueError('frozen experiment/source/environment changed; use a new output directory')
            if not prior:
                append(store, 'ExperimentSpec', spec)
                write(out/'experiment.json', spec)
            recover_pending(store, out)
            # Rotate arm order by seed/trial to reduce systematic time-of-run bias.
            for seed in SEEDS:
                for index in range(TRIALS):
                    arms = list(ARMS)
                    random.Random(seed+index).shuffle(arms)
                    for arm in arms:
                        execute_trial(out, store, spec, arm, seed, index, 'development', optimizer_python)
                    print(f'development seed={seed} trial={index+1}/{TRIALS}', flush=True)
            # Freeze every winning recipe before any evaluation is dispatched.
            selections = {f'{seed}:{arm}': select(store, arm, seed) for seed in SEEDS for arm in ARMS}
            existing = store.records('SearchSelections')
            if existing and existing != [selections]:
                raise ValueError('selection changed after evaluation')
            if not existing:
                store.append('SearchSelections', selections)
            for seed in SEEDS:
                arms = list(ARMS)
                random.Random(seed).shuffle(arms)
                for arm in arms:
                    chosen = selections[f'{seed}:{arm}']
                    if chosen:
                        execute_trial(out, store, spec, arm, seed, TRIALS, 'evaluation', optimizer_python, chosen)
                print(f'evaluation seed={seed}', flush=True)
            if source_hashes() != spec['source_hashes']:
                raise ValueError('implementation changed during experiment')
            result = summarize(out, store, spec)
            write(out/'results.json', result)
            store.export(out/'search-events.jsonl')
            return result
        finally:
            store.close()


def check(out):
    out = Path(out).resolve()
    store = Store(out/'search.sqlite')
    try:
        head = store.verify()
        spec, = store.records('ExperimentSpec')
        contracts.validate('ExperimentSpec', spec)
        if json.loads((out/'experiment.json').read_text()) != spec:
            raise ValueError('experiment artifact changed')
        if spec['source_hashes'] != source_hashes() or spec['environment']['lock_sha256'] != hashlib.sha256(Path(__file__).parents[1].joinpath('hive-optuna.lock').read_bytes()).hexdigest():
            raise ValueError('source or dependency lock changed')
        manifest = fixtures.load(DATA, spec['dataset']['dataset_hash'])
        # Check chronology, not just the existence of a consistent final map.
        seen_plans, seen_results, seen_candidates, seen_frozen = {}, {}, {}, {}
        selections = None
        for kind, payload in store.db.execute('SELECT kind,payload FROM events ORDER BY seq'):
            item = json.loads(payload)
            if kind == 'SearchTrialPlan':
                ident = item['trial_id']
                if ident in seen_plans or item['arm'] not in ARMS or item['seed'] not in SEEDS:
                    raise ValueError('invalid/duplicate trial plan')
                if ident != trial_id(item['arm'], item['seed'], item['index'], item['phase']):
                    raise ValueError('trial identity mismatch')
                if item['phase'] == 'evaluation':
                    if selections is None or item['index'] != TRIALS:
                        raise ValueError('evaluation before frozen development selections')
                elif item['phase'] != 'development' or selections is not None or not 0 <= item['index'] < TRIALS:
                    raise ValueError('development after evaluation freeze or invalid slot')
                expected = [t for t in manifest['tasks'] if t['split_id'] == ('dev' if item['phase'] == 'development' else 'holdout')]
                random.Random(item['seed']+item['index']).shuffle(expected)
                if item['task_order'] != [t['task_id'] for t in expected] or not 0 <= item['reserved_seconds'] <= 45:
                    raise ValueError('trial task order or allocation changed')
                seen_plans[ident] = item
            elif kind == 'CandidateLineage':
                contracts.validate('CandidateLineage', item)
                validate_recipe(item['recipe'])
                if digest(item['recipe']) != item['candidate_hash'] or item['parent_hash'] != digest(recipe()):
                    raise ValueError('candidate recipe/parent mismatch')
                expected_refs = [r['trial_id'] for r in seen_results.values() if r['arm'] == item['method'] and
                                 r['seed'] == item['seed'] and r['phase'] == 'development' and r['candidate_hash']]
                if item['development_trial_refs'] != expected_refs:
                    raise ValueError('candidate lineage includes unavailable or non-development evidence')
                seen_candidates[(item['method'], item['seed'], item['generation'])] = item
            elif kind == 'SearchCandidateFrozen':
                ident = item['trial_id']
                if ident not in seen_plans or ident in seen_frozen or ident in seen_results:
                    raise ValueError('invalid candidate freeze chronology')
                plan = seen_plans[ident]
                lineage = seen_candidates[(plan['arm'], plan['seed'], plan['index'])]
                if item['candidate_hash'] != lineage['candidate_hash']:
                    raise ValueError('candidate freeze differs from lineage')
                if plan['phase'] == 'evaluation' and item['candidate_hash'] != digest(selections[f"{plan['seed']}:{plan['arm']}"]):
                    raise ValueError('evaluation differs from frozen development selection')
                seen_frozen[ident] = item['candidate_hash']
            elif kind == 'TrialResult':
                contracts.validate('TrialResult', item)
                ident = item['trial_id']
                if ident not in seen_plans or ident in seen_results:
                    raise ValueError('result without unique preceding plan')
                if item['candidate_hash'] != seen_frozen.get(ident, ''):
                    raise ValueError('result differs from frozen candidate')
                seen_results[ident] = item
            elif kind == 'SearchSelections':
                if selections is not None or len(seen_results) != len(SEEDS)*len(ARMS)*TRIALS:
                    raise ValueError('selection before development trial accounting')
                selections = item
                if item != {f'{seed}:{arm}': select(store, arm, seed) for seed in SEEDS for arm in ARMS}:
                    raise ValueError('selection does not recompute from development')
        plan_rows = store.records('SearchTrialPlan')
        plans = {p['trial_id']: p for p in plan_rows}
        if len(plans) != len(plan_rows):
            raise ValueError('duplicate trial plans')
        frozen = {r['trial_id']: r['candidate_hash'] for r in store.records('SearchCandidateFrozen')}
        recipes = {r['candidate_hash']: r['recipe'] for r in store.records('CandidateLineage')}
        if seen_results.keys() != plans.keys():
            raise ValueError('unreconciled pending trials')
        total = 0
        for row in store.records('TrialResult'):
            contracts.validate('TrialResult', row)
            plan = plans[row['trial_id']]
            if any(row[k] != plan[k] for k in ('arm', 'seed', 'index', 'phase', 'state_ref')):
                raise ValueError('result does not match its plan')
            unknown = not row['cost_known']
            if unknown and (not row['reason'].startswith('outcome_unknown') or row['wall_seconds'] != plan['reserved_seconds'] or row['charged_calls'] != len(plan['task_order'])):
                raise ValueError('unknown outcome reservation accounting mismatch')
            if row['cost_known'] and row['charged_calls'] != row['task_count']:
                raise ValueError('measured call accounting mismatch')
            state = audit.artifact(out, row['state_ref'])
            if not (state/'runtime.sqlite').exists():
                if row['status'] == 'completed' or row['task_count'] != 0:
                    raise ValueError('trial claims execution without state')
                continue
            audited = audit.check(state, allow_incomplete=unknown)
            app = Store(state/'runtime.sqlite')
            try:
                if app.verify() != audited['chain_head']:
                    raise ValueError('runtime database/export mismatch')
                if frozen[row['trial_id']] != row['candidate_hash'] or digest(recipes[row['candidate_hash']]) != row['candidate_hash']:
                    raise ValueError('candidate lineage mismatch')
                expected_id = 'recipe-'+row['candidate_hash'][:16]
                if any(r['decision']['selected'] != expected_id or
                       r['decision']['capabilities'][0]['provenance']['recipe'] != recipes[row['candidate_hash']]
                       for r in app.records('RuntimeRoute')):
                    raise ValueError('executed recipe differs from frozen candidate')
                episodes = [e for e in app.records('RuntimeEpisode') if e['episode_id'] not in audited.get('incomplete_episode_ids', [])]
                if len(episodes) != row['task_count'] or [e['task_id'] for e in episodes] != plan['task_order'][:len(episodes)]:
                    raise ValueError('trial coverage/order mismatch')
                if row['status'] == 'completed' and len(episodes) != len(plan['task_order']):
                    raise ValueError('completed trial lacks task coverage')
                measured = result_for(plans[row['trial_id']] | {'candidate_hash': row['candidate_hash']}, episodes,
                                      row['wall_seconds'], row['status'], row['reason'], row['cost_known'], row['charged_calls'])
                if measured != row:
                    raise ValueError('trial metrics do not recompute')
                total += len(episodes)
            finally:
                app.close()
        all_rows = store.records('TrialResult')
        groups = [(spec['budget'], [r for r in all_rows if r['arm'] == arm and r['seed'] == seed]) for arm in ARMS for seed in SEEDS]
        groups.append((spec['aggregate_budget'], all_rows))
        for budget, rows in groups:
            if len(rows) > budget['max_trials'] or sum(r['charged_calls'] for r in rows) > budget['task_calls'] or sum(r['wall_seconds'] for r in rows) > budget['wall_seconds']:
                raise ValueError('experiment budget exceeded')
        if summarize(out, store, spec) != json.loads((out/'results.json').read_text()):
            raise ValueError('summary/decision does not recompute')
        return dict(ok=True, episodes=total, trials=len(all_rows), chain_head=head,
                    complete=len(all_rows) == spec['aggregate_budget']['max_trials'],
                    inconclusive_trials=sum(r['status'] == 'inconclusive' for r in all_rows))
    finally:
        store.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--optimizer-python', type=Path)
    parser.add_argument('--audit', type=Path)
    args = parser.parse_args()
    if args.audit:
        print(json.dumps(check(args.audit), indent=2))
    elif args.out and args.optimizer_python:
        result = run(args.out, args.optimizer_python)
        print(json.dumps({'arms': result['arms'], 'answer': result['answer']}, indent=2))
    else:
        parser.error('provide --out and --optimizer-python, or --audit')
