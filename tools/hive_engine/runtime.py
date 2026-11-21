"""Task entry, actual routing, independent verification and persistent local state.

python -m tools.hive_engine.runtime --state STATE --input-root ROOT --task TASK.json
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import time
import uuid

from . import checker
from .adapters import default_registry
from .core import Store, canonical, digest, finite_number, route
from .pilot import write

WEIGHTS = {'value': 1, 'cost': .1, 'latency': .1, 'risk': 1}
BASELINE = {'policy_id': 'rules-baseline-2', 'allowed': ['rules', 'probe', 'combined'],
            'estimates': {name: {'p': p, 'cost': 0, 'latency': 0, 'risk': 0}
                          for name, p in [('rules', 1), ('probe', .5), ('combined', .99)]},
            'weights': WEIGHTS}


def policy_for(name):
    return {'policy_id': 'fixed-'+name, 'allowed': [name],
            'estimates': {name: {'p': 1, 'cost': 0, 'latency': 0, 'risk': 0}}, 'weights': WEIGHTS}


def source_hashes():
    names = ['core', 'captions', 'checker', 'adapters', 'worker', 'runtime', 'governor', 'cycle', 'audit', 'evaluation', 'fixtures', 'pilot', 'contracts', 'effects', 'recipes', 'optimizer', 'search']
    return {name: hashlib.sha256(Path(__file__).with_name(name+'.py').read_bytes()).hexdigest() for name in names}


@contextmanager
def exclusive(root):
    """One local task/control mutation at a time; fail busy instead of queuing forever."""
    path = Path(root)/'.runtime.lock'
    with path.open('a+b') as stream:
        if stream.tell() == 0:
            stream.write(b'0')
            stream.flush()
        stream.seek(0)
        try:
            if os.name == 'nt':
                import msvcrt
                msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            raise RuntimeError('runtime busy; concurrency limit 1') from exc
        try:
            yield
        finally:
            stream.seek(0)
            if os.name == 'nt':
                msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(stream, fcntl.LOCK_UN)


def validate_task(task):
    for key in ('task_id', 'task_type', 'input_ref', 'input_hash', 'success_criteria_version', 'split_id', 'created_at'):
        if not isinstance(task.get(key), str) or not task[key]:
            raise ValueError('invalid task field: '+key)
    if task['success_criteria_version'] != 'caption-rubric-1':
        raise ValueError('unsupported success criteria')
    if task['split_id'] not in {'dev', 'holdout', 'live', 'retention'}:
        raise ValueError('unknown task partition')
    if not isinstance(task.get('permissions'), list) or not all(isinstance(p, str) for p in task['permissions']):
        raise ValueError('invalid permissions')
    budget = task.get('resource_budget', {})
    for key in ('wall_seconds', 'input_bytes', 'concurrency'):
        if not finite_number(budget.get(key)) or budget[key] <= 0:
            raise ValueError('invalid resource budget')
    if budget['wall_seconds'] > 60 or budget['input_bytes'] > 65536 or budget['concurrency'] != 1:
        raise ValueError('unsupported budget; maximum 60s/64KiB/concurrency 1')
    canonical(task)


def task_for(path, task_id='caption', split='live'):
    path = Path(path)
    return dict(task_id=task_id, task_type='caption-validation', input_ref=path.name,
                input_hash=hashlib.sha256(path.read_bytes()).hexdigest(), success_criteria_version='caption-rubric-1',
                permissions=['read-fixture', 'run-ffprobe'], resource_budget={'wall_seconds': 3, 'input_bytes': 65536, 'concurrency': 1},
                split_id=split, created_at=datetime.now(timezone.utc).isoformat())


class Runtime:
    def __init__(self, root, registry=None):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.registry = registry or default_registry()
        with exclusive(self.root):
            self.store = Store(self.root/'runtime.sqlite')
            self.store.verify()
            if not self.store.records('RuntimePolicy'):
                self.store.append('RuntimePolicy', {'policy': BASELINE, 'reason': 'initial baseline', 'previous': None})

    @property
    def active_policy(self):
        self.store.verify()
        return self.store.records('RuntimePolicy')[-1]['policy']

    def close(self):
        self.store.close()

    def run(self, task, input_root, evaluation_policy=None):
        with exclusive(self.root):
            self.store.verify()
            try:
                validate_task(task)
            except (ValueError, TypeError) as exc:
                self.store.append('RuntimeRejection', {'reason': str(exc), 'timestamp': time.time()})
                raise
            started = time.perf_counter()
            if evaluation_policy is not None:
                contracts = self.store.records('EvaluationContract')
                if len(contracts) != 1 or task['split_id'] not in {'dev', 'holdout'}:
                    raise ValueError('evaluation requires an enrolled frozen task')
                manifest = json.loads((self.root/'evaluation-data'/'manifest.json').read_text(encoding='utf-8'))
                if digest(manifest) != contracts[0]['dataset_hash'] or task not in manifest['tasks']:
                    raise ValueError('task outside frozen evaluation contract')
            active = self.store.records('RuntimePolicy')[-1]
            if active.get('scope') == 'test-only' and task['split_id'] == 'live':
                raise ValueError('sandbox policy cannot execute live tasks')
            if active.get('code_hashes') and active['code_hashes'] != source_hashes():
                raise ValueError('active release implementation changed')
            policy = evaluation_policy or self.active_policy
            snapshot = self.registry.snapshot()
            if not evaluation_policy and active.get('capability_hashes'):
                for name in policy['allowed']:
                    if digest(self.registry.adapters[name].manifest()) != active['capability_hashes'].get(name):
                        raise ValueError('active release adapter changed')
            if not policy['allowed'] or set(policy['allowed']) - self.registry.adapters.keys():
                raise ValueError('policy refers to unregistered adapter')
            caps = [cap for cap in snapshot if cap['capability_id'] in policy['allowed']]
            decision = route(task, caps, policy['estimates'], policy['weights'])
            episode_id = uuid.uuid4().hex
            self.store.append('RuntimeTask', {'episode_id': episode_id, 'task': task})
            self.store.append('RuntimeRoute', {'episode_id': episode_id, 'policy': policy, 'decision': decision,
                                              'mode': 'evaluation' if evaluation_policy else 'active'})
            outcome = {'output': {}, 'error': 'ineligible', 'resources': {}, 'wall_seconds': 0}
            data, input_ref = None, None
            selected = decision['selected']
            if selected:
                try:
                    base = Path(input_root).resolve()
                    path = (base/task['input_ref']).resolve()
                    if not path.is_relative_to(base) or not path.is_file():
                        raise ValueError('input path outside authorized root or missing')
                    if path.stat().st_size > task['resource_budget']['input_bytes']:
                        raise ValueError('input budget exceeded')
                    data = path.read_bytes()
                    if len(data) > task['resource_budget']['input_bytes'] or hashlib.sha256(data).hexdigest() != task['input_hash']:
                        raise ValueError('input changed or hash mismatch')
                    input_ref = 'inputs/'+task['input_hash']+'.srt'
                    (self.root/'inputs').mkdir(exist_ok=True)
                    target = self.root/input_ref
                    if target.exists() and target.read_bytes() != data:
                        raise ValueError('stored input corrupted')
                    target.write_bytes(data)
                    remaining = task['resource_budget']['wall_seconds'] - (time.perf_counter()-started)
                    if remaining <= 0:
                        raise TimeoutError('admission budget exceeded')
                    selected_manifest = next(c for c in caps if c['capability_id'] == selected)
                    if selected_manifest.get('effects') != 'read-only':
                        raise ValueError('stateful adapter requires enrolled idempotency/reconciliation integration')
                    self.store.append('AdapterInvocation', {'channel': 'Task', 'episode_id': episode_id,
                                      'capability_id': selected, 'effects': 'read-only', 'retry': 0,
                                      'reserved_seconds': remaining, 'timestamp': time.time()})
                    outcome = self.registry.adapters[selected].execute(data, remaining)
                    if not isinstance(outcome.get('output'), dict) or (outcome.get('error') is None and type(outcome['output'].get('valid')) is not bool):
                        outcome = {'output': {}, 'error': 'malformed-output', 'resources': {}, 'wall_seconds': 0}
                    canonical(outcome)
                except Exception as exc:
                    outcome = {'output': {}, 'error': type(exc).__name__, 'resources': {}, 'wall_seconds': 0}
            elapsed = time.perf_counter()-started
            if elapsed > task['resource_budget']['wall_seconds']:
                outcome['error'] = 'budget-exceeded'
            verification_start = time.perf_counter()
            verified = checker.verify(data, outcome['output'], outcome['error']) if input_ref is not None else {
                'checker_id': checker.VERSION, 'result': False, 'expected': None, 'actual': None,
                'confidence_if_calibrated': None}
            verified.update(episode_id=episode_id, criteria_version=task['success_criteria_version'],
                            label_source='independent-parser', wall_seconds=time.perf_counter()-verification_start)
            artifact = {'output': outcome['output'], 'error': outcome['error']}
            output_hash = digest(artifact)
            output_ref = 'outputs/'+output_hash+'.json'
            write(self.root/output_ref, artifact)
            verified['evidence_refs'] = [output_ref]
            episode = dict(episode_id=episode_id, task_id=task['task_id'], task_hash=digest(task),
                           policy_hash=digest(policy), config_id=selected, input_hash=task['input_hash'], input_ref=input_ref,
                           output_ref=output_ref, output_hash=output_hash, status='failed' if outcome['error'] else 'completed',
                           errors=[outcome['error']] if outcome['error'] else [], split_id=task['split_id'],
                           source_group=task.get('source_group',task['task_id']), family=task.get('family','caption'),
                           timings={'wall_seconds': elapsed, 'adapter_seconds': outcome['wall_seconds'],
                                    'verification_seconds': verified['wall_seconds']}, resources=outcome['resources'],
                           passed=verified['result'], expected=verified['expected'], actual=verified['actual'])
            self.store.append('RuntimeEpisode', episode)
            self.store.append('RuntimeVerification', verified)
            self.store.append('AdapterOutcome', {'channel': 'Evidence', 'episode_id': episode_id,
                              'status': episode['status'] if selected else 'abstained',
                              'error': outcome['error'], 'resources': outcome['resources'],
                              'adapter_seconds': outcome['wall_seconds'],
                              'model_tokens': None if selected and selected.startswith('ollama-') else 0,
                              'gpu_seconds': None if selected and selected.startswith('ollama-') else 0,
                              'recipe_route': outcome.get('recipe_route'), 'retries': 0})
            self.store.export(self.root/'events.jsonl')
            return episode


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--input-root', type=Path, required=True)
    parser.add_argument('--task', type=Path, required=True)
    args = parser.parse_args()
    runtime = Runtime(args.state)
    try:
        result = runtime.run(json.loads(args.task.read_text(encoding='utf-8')), args.input_root)
        print(json.dumps(result, indent=2))
        raise SystemExit(0 if result['passed'] else 1)
    finally:
        runtime.close()
