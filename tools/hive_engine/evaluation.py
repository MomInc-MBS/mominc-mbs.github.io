"""Evaluator-owned dataset enrollment, before execution or candidate generation."""
import json
from pathlib import Path
import shutil

from . import fixtures
from .core import digest
from .runtime import exclusive, validate_task


def enroll(runtime, dataset, expected_hash, fresh_attestation=None):
    """Operator asserts freshness; code additionally rejects known exposed content.

    This records provenance, not a claim of cryptographic blindness. The trusted
    local operator can read evaluation files; candidates receive only dev rows.
    """
    with exclusive(runtime.root):
        if runtime.store.records('EvaluationContract') or runtime.store.records('RuntimeEpisode'):
            raise ValueError('evaluation must be enrolled once, before execution')
        dataset = Path(dataset).resolve()
        manifest = fixtures.load(dataset, expected_hash)
        tasks = manifest['tasks']
        if manifest['criteria'] != fixtures.CRITERIA or len({t['task_id'] for t in tasks}) != len(tasks):
            raise ValueError('criteria or task IDs invalid')
        if {t['split_id'] for t in tasks} != {'dev', 'holdout'} or set(manifest['labels']) != {t['task_id'] for t in tasks}:
            raise ValueError('complete disjoint development/evaluation labels required')
        for task in tasks:
            validate_task(task)
            label = manifest['labels'][task['task_id']]
            if type(label.get('valid')) is not bool or not label.get('label_source'):
                raise ValueError('independent reference labels required')
        known = json.loads(Path(__file__).with_name('data').joinpath('manifest.json').read_text(encoding='utf-8'))
        known_hashes = {t['input_hash'] for t in known['tasks']}
        exposed = expected_hash == fixtures.FROZEN_SHA256 or any(t['input_hash'] in known_hashes for t in tasks if t['split_id'] == 'holdout')
        if fresh_attestation and exposed:
            raise ValueError('known exposed evaluation cannot be relabeled fresh')
        target = runtime.root/'evaluation-data'
        target.mkdir(exist_ok=False)
        (target/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
        for task in tasks:
            destination = (target/task['input_ref']).resolve()
            if not destination.is_relative_to(target.resolve()):
                raise ValueError('evaluation path escape')
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(dataset/task['input_ref'], destination)
        fixtures.load(target, expected_hash)
        contract = {'dataset_hash': expected_hash, 'criteria_hash': digest(fixtures.CRITERIA),
                    'dataset_ref': 'evaluation-data',
                    'fresh_attestation': fresh_attestation,
                    'holdout_status': 'operator-attested-fresh' if fresh_attestation else 'regression-only',
                    'known_exposed': exposed}
        runtime.store.append('EvaluationContract', contract)
        return contract
