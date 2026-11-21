"""Recompute runtime routing/verdicts from stored bytes, not success flags."""
import argparse
import hashlib
import json
from pathlib import Path

from . import checker
from .core import digest, route


def artifact(root, ref):
    path = (root/ref).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('artifact path escape')
    return path


def check(root, allow_incomplete=False):
    root = Path(root)
    previous = '0'*64
    tasks, routes, episodes, verifications = {}, {}, {}, {}
    active_policy, contract = None, None
    for index, line in enumerate((root/'events.jsonl').read_text(encoding='utf-8').splitlines(), 1):
        event = json.loads(line)
        kind, payload = event['kind'], event['payload']
        if event['seq'] != index or event['previous'] != previous or event['hash'] != digest({'kind': kind, 'payload': payload, 'previous': previous}):
            raise ValueError('event integrity failure')
        previous = event['hash']
        if kind == 'RuntimePolicy':
            active_policy = payload['policy']
        if kind == 'EvaluationContract':
            if contract is not None:
                raise ValueError('evaluation contract replaced')
            contract = payload
        if kind == 'RuntimeRoute':
            if payload['mode'] == 'active':
                if payload['policy'] != active_policy:
                    raise ValueError('active route differs from preceding policy')
            elif payload['mode'] == 'evaluation':
                if contract is None:
                    raise ValueError('evaluation without enrollment')
                frozen = json.loads((root/'evaluation-data'/'manifest.json').read_text(encoding='utf-8'))
                if digest(frozen) != contract['dataset_hash'] or payload['decision']['task'] not in frozen['tasks']:
                    raise ValueError('evaluation outside enrolled task set')
            else:
                raise ValueError('unknown execution mode')
        collections = {'RuntimeTask': tasks, 'RuntimeRoute': routes, 'RuntimeEpisode': episodes, 'RuntimeVerification': verifications}
        if kind in collections:
            target = collections[kind]
            if payload['episode_id'] in target:
                raise ValueError('duplicate episode record')
            target[payload['episode_id']] = payload
    complete = tasks.keys() & routes.keys() & episodes.keys() & verifications.keys()
    incomplete = (tasks.keys() | routes.keys() | episodes.keys() | verifications.keys()) - complete
    if incomplete and not allow_incomplete:
        raise ValueError('incomplete execution trace')
    for key, ep in episodes.items():
        if key not in complete:
            continue
        task = tasks[key]['task']
        routed = routes[key]
        decision = routed['decision']
        policy = routed['policy']
        if decision != route(task, decision['capabilities'], policy['estimates'], policy['weights']):
            raise ValueError('routing decision does not replay')
        if {c['capability_id'] for c in decision['capabilities']} != set(policy['allowed']):
            raise ValueError('policy/capability mismatch')
        if digest(task) != ep['task_hash'] or digest(policy) != ep['policy_hash'] or decision['selected'] != ep['config_id']:
            raise ValueError('dispatch trace mismatch')
        output = json.loads(artifact(root, ep['output_ref']).read_text(encoding='utf-8'))
        if digest(output) != ep['output_hash'] or ep['errors'] != ([output['error']] if output['error'] else []):
            raise ValueError('output mismatch')
        expected, actual, passed = None, None, False
        if ep['input_ref']:
            data = artifact(root, ep['input_ref']).read_bytes()
            if hashlib.sha256(data).hexdigest() != ep['input_hash'] or ep['input_hash'] != task['input_hash']:
                raise ValueError('input mismatch')
            result = checker.verify(data, output['output'], output['error'])
            expected, actual, passed = result['expected'], result['actual'], result['result']
        verified = verifications[key]
        if verified['evidence_refs'] != [ep['output_ref']] or verified['checker_id'] != checker.VERSION or verified['criteria_version'] != task['success_criteria_version']:
            raise ValueError('checker provenance mismatch')
        for record in (ep, verified):
            result_key = 'passed' if record is ep else 'result'
            if type(record[result_key]) is not bool or (record[result_key], record['expected'], record['actual']) != (passed, expected, actual):
                raise ValueError('fabricated verification result')
        if passed and (ep['status'] != 'completed' or ep['timings']['wall_seconds'] > task['resource_budget']['wall_seconds']):
            raise ValueError('passed episode violated execution budget')
    result = {'ok': not incomplete, 'episodes': len(complete), 'verified': len(complete), 'chain_head': previous}
    if allow_incomplete:
        result['incomplete_episode_ids'] = sorted(incomplete)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('state', type=Path)
    print(json.dumps(check(parser.parse_args().state), indent=2))
