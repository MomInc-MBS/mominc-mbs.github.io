"""Evidence-driven local staging. No production or weight deployment entrypoint.

Operator authority is the local caller's filesystem/process authority, not an
authenticated remote identity. Hashes detect drift, not a malicious file owner.
"""
import json
import statistics
import time
from pathlib import Path

from . import fixtures
from .audit import check
from .core import digest, promotion_gate
from .runtime import BASELINE, exclusive, policy_for, source_hashes


def decision(runtime):
    """Recompute from this store's sealed experiment; accept no caller success flags."""
    runtime.store.export(runtime.root/'events.jsonl')
    audit = check(runtime.root)
    plans = runtime.store.records('EvaluationPlan')
    if len(plans) != 1:
        raise ValueError('one frozen evaluation plan required')
    plan = plans[0]
    contracts = runtime.store.records('EvaluationContract')
    if len(contracts) != 1 or digest(contracts[0]) != plan['contract_hash']:
        raise ValueError('evaluation authority changed')
    contract = contracts[0]
    candidate = runtime.store.records('RuntimeCandidate')
    if len(candidate) != 1 or digest(candidate[0]) != plan['candidate_hash']:
        raise ValueError('candidate changed')
    if plan['criteria_hash'] != digest(fixtures.CRITERIA) or plan['dataset_hash'] != contract['dataset_hash']:
        raise ValueError('unknown or changed criteria/dataset')
    if plan['code_hashes'] != source_hashes():
        raise ValueError('implementation changed since freeze')
    current_caps = {name: digest(adapter.manifest()) for name, adapter in runtime.registry.adapters.items()}
    if current_caps != plan['capability_hashes']:
        raise ValueError('enrolled adapter/tool identity changed')
    for routed in runtime.store.records('RuntimeRoute'):
        if routed['mode'] == 'evaluation':
            for cap in routed['decision']['capabilities']:
                if digest(cap | {'health': 'unknown'}) != plan['capability_hashes'].get(cap['capability_id']):
                    raise ValueError('adapter changed during evaluation')
    tasks = {t['task']['task_id']: t['task'] for t in runtime.store.records('RuntimeTask')}
    rows = runtime.store.records('RuntimeEpisode')
    lookup = {row['episode_id']: row for row in rows}
    if not candidate[0]['training_data_refs'] or any(lookup[ref]['split_id'] != 'dev' for ref in candidate[0]['training_data_refs']):
        raise ValueError('candidate lineage is not development-only')
    matrix = runtime.store.records('EvaluationMatrix')
    if len(matrix) != 1:
        raise ValueError('complete evaluation matrix required')
    matrix = matrix[0]['episodes']
    arms = [*plan['controls'], candidate[0]['candidate_id']]
    if set(matrix) != set(arms):
        raise ValueError('missing control or candidate arm')
    if contract['dataset_ref'] != 'evaluation-data':
        raise ValueError('untrusted evaluation location')
    frozen = fixtures.load(runtime.root/'evaluation-data', contract['dataset_hash'])
    pinned_tasks = {t['task_id']: t for t in frozen['tasks']}
    # Full original TaskSpecs, including permissions, budgets and input hashes,
    # must agree with the externally pinned fixture manifest.
    if any(tasks.get(k) != v for k, v in pinned_tasks.items()):
        raise ValueError('task set differs from frozen fixture')
    by_arm = {}
    for arm in arms:
        refs = matrix[arm]
        if set(refs) != {'first', 'replay'}:
            raise ValueError('repeat missing')
        by_arm[arm] = {}
        for run in refs:
            selected = [lookup[ref] for ref in refs[run]]
            if len(selected) != len(pinned_tasks) or {r['task_id'] for r in selected} != set(pinned_tasks):
                raise ValueError('incomplete benchmark coverage')
            if any(r['config_id'] != arm for r in selected):
                raise ValueError('incorrect adapter in arm')
            for row in selected:
                if row['expected'] != frozen['labels'][row['task_id']]['valid']:
                    raise ValueError('live checker disagrees with pinned label')
            by_arm[arm][run] = {r['task_id']: r for r in selected}
    def dev_rank(arm):
        dev = [r for r in by_arm[arm]['first'].values() if r['split_id'] == 'dev']
        return (-sum(r['passed'] for r in dev), sum(r['timings']['wall_seconds'] for r in dev), arm)
    control = min(plan['controls'], key=dev_rank)
    if plan['control'] != control:
        raise ValueError('baseline was not best development control')
    baseline = by_arm[control]['first']
    improved = by_arm[candidate[0]['candidate_id']]['first']
    hold_ids = [k for k, t in pinned_tasks.items() if t['split_id'] == 'holdout']
    quality_delta = statistics.mean(improved[k]['passed']-baseline[k]['passed'] for k in hold_ids)
    baseline_cost = statistics.mean(baseline[k]['timings']['wall_seconds'] for k in hold_ids)
    candidate_cost = statistics.mean(improved[k]['timings']['wall_seconds'] for k in hold_ids)
    replay = all((r['output_hash'], r['status']) == (by_arm[a]['replay'][k]['output_hash'], by_arm[a]['replay'][k]['status'])
                 for a in arms for k, r in by_arm[a]['first'].items())
    evidence = dict(quality_delta=quality_delta, cost_reduction=1-candidate_cost/baseline_cost,
                    regressions=sum(baseline[k]['passed'] and not improved[k]['passed'] for k in pinned_tasks),
                    safety_passed=all(not r['errors'] for r in improved.values()),
                    memory_passed=not runtime.store.records('MemoryItem'),
                    budgets_passed=all(not r['errors'] for arm in by_arm.values() for repeat in arm.values() for r in repeat.values()),
                    reproducible=replay, holdout_clean=bool(contract['fresh_attestation']) and not contract['known_exposed'],
                    rollback_tested=verify_rollback(runtime, candidate[0], plan))
    # The default known dataset is exposed; enrollment rejects relabeling it.
    gate = promotion_gate(evidence, fixtures.CRITERIA)
    return dict(candidate_hash=plan['candidate_hash'], control=control, gate=gate,
                decision='eligible-for-local-staging' if gate['eligible'] else 'rejected',
                audit=audit, holdout_status=contract['holdout_status'],
                interpretation='Gate evidence is local and task-specific; no compounding-learning claim.')


def promote(runtime, candidate_hash, approval_ref):
    """Only recomputed eligible evidence can activate a policy. Operator invokes this."""
    with exclusive(runtime.root):
        result = decision(runtime)
        if runtime.active_policy != BASELINE:
            raise ValueError('evaluation parent is no longer active')
        if result['candidate_hash'] != candidate_hash or not approval_ref or not result['gate']['eligible']:
            runtime.store.append('RuntimeReleaseDecision', result | {'approval_ref': approval_ref, 'activated': False})
            raise ValueError('promotion rejected by evidence gates')
        candidate = runtime.store.records('RuntimeCandidate')[0]
        policy = candidate['policy']
        if policy != policy_for(candidate['candidate_id']):
            raise ValueError('unverified policy payload')
        previous = runtime.active_policy
        release = dict(release_id=digest(result), policy=policy, previous=previous,
                       candidate_hash=candidate_hash, approval_ref=approval_ref,
                       gate=result['gate'], scope='local-staging', timestamp=time.time(),
                       code_hashes=source_hashes(), capability_hashes=runtime.store.records('EvaluationPlan')[0]['capability_hashes'])
        runtime.store.append('RuntimePolicy', release)
        return release


def rollback(runtime, release_id):
    with exclusive(runtime.root):
        current = runtime.store.records('RuntimePolicy')[-1]
        if current.get('release_id') != release_id or current.get('previous') is None:
            raise ValueError('only current release can be rolled back')
        restored = {'release_id': release_id+'-rollback', 'policy': current['previous'],
                    'previous': current['policy'], 'reason': 'operator rollback', 'timestamp': time.time()}
        runtime.store.append('RuntimePolicy', restored)
        return restored


def rehearse_candidate(runtime, candidate):
    """Pre-release candidate activation/rollback in a pristine disposable state.

    Require a fresh disposable runtime. This function is not a path around failed
    candidate gates in the experiment or operational state.
    """
    with exclusive(runtime.root):
        if runtime.store.records('RuntimeCandidate') or runtime.store.records('RuntimeEpisode') or len(runtime.store.records('RuntimePolicy')) != 1:
            raise ValueError('rollback rehearsal requires pristine disposable state')
        if candidate['candidate_id'] != 'probe-guard' or candidate['policy'] != policy_for('probe-guard'):
            raise ValueError('only bounded enrolled candidate may be rehearsed')
        release = {'release_id': 'candidate-rehearsal', 'policy': candidate['policy'],
                   'candidate_hash': digest(candidate),
                   'previous': runtime.active_policy, 'reason': 'isolated candidate rollback rehearsal; not performance promotion',
                   'scope': 'test-only', 'timestamp': time.time()}
        runtime.store.append('RuntimePolicy', release)
        return release


def verify_rollback(runtime, candidate, plan):
    proofs = runtime.store.records('RollbackProof')
    if len(proofs) != 1:
        return False
    proof = proofs[0]
    if proof.get('candidate_hash') != digest(candidate) or proof.get('code_hashes') != plan['code_hashes']:
        return False
    root = runtime.root.parent/'rollback-state'
    if check(root) != proof['audit']:
        return False
    events = [json.loads(line) for line in (root/'events.jsonl').read_text().splitlines()]
    policies = [e['payload'] for e in events if e['kind'] == 'RuntimePolicy']
    episodes = [e['payload'] for e in events if e['kind'] == 'RuntimeEpisode']
    return (len(policies) == 3 and policies[1].get('candidate_hash') == digest(candidate)
            and policies[1]['scope'] == 'test-only' and policies[1]['policy'] == candidate['policy']
            and policies[-1]['policy'] == BASELINE and len(episodes) == 2
            and episodes[0] == proof['staged_episode'] and episodes[1] == proof['restored_episode']
            and episodes[0]['config_id'] == candidate['candidate_id'] and episodes[1]['config_id'] == 'rules'
            and all(e['passed'] for e in episodes))
