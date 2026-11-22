"""Export the eighteen known synthetic P2 comparison jobs, without opening Store."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import stat
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
sys.path.insert(0, str(ROOT / 'scripts'))
from hive.learning_policy import Policy
from hive.orchestrator import DEFAULT_CONFIG, config_hash
from objective_smoke import build_tasks, load_plan

ARMS = ('strongest_tool', 'learning_disabled', 'p2')
REF = re.compile(r'artifacts/[0-9a-f]{64}\.json')


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')


def reject_links(path):
    path = Path(path).absolute()
    for part in (path, *path.parents):
        if part.exists() or part.is_symlink():
            attributes = getattr(part.lstat(), 'st_file_attributes', 0)
            if part.is_symlink() or attributes & getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0x400):
                raise ValueError('symlink/reparse path refused')


def refs(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from refs(item)
    elif isinstance(value, list):
        for item in value:
            yield from refs(item)
    elif isinstance(value, str) and REF.fullmatch(value):
        yield value


def known_tasks(plan):
    tasks = [row['task'] for row in build_tasks(plan)]
    for task in tasks:
        task['source_group'] = 'synthetic-' + task['id']
    if len(tasks) != 6 or len({task['id'] for task in tasks}) != 6:
        raise ValueError('six known synthetic data tasks required')
    return tasks


def comparison_config():
    return dict(DEFAULT_CONFIG, routes=['tool'], max_requests=0, max_total_tokens=0,
                max_cycles=6, max_wall_s=60, max_retries=0, max_storage_bytes=16*1024*1024)


def validate_journal(journal, tasks):
    """Validate allowlisted data before traversing any artifact references."""
    name = journal['store']
    if name not in ARMS or len(journal['jobs']) != 6:
        raise ValueError('expected six jobs per named comparison arm')
    state = journal['state']
    budget = state.get('budget')
    if (not isinstance(budget, dict) or any(type(budget.get(key)) is not int or budget[key] != 0
            for key in ('requests', 'tokens_reserved', 'tokens_actual')) or budget.get('cycles') != 6):
        raise ValueError('nonzero/unknown model budget or wrong execution count')
    expected_config = config_hash(comparison_config())
    identity = state.get('comparison_identity')
    if (not isinstance(identity, dict) or set(identity) != {'runtime', 'tasks', 'config', 'policy'}
            or identity['tasks'] != config_hash(tasks) or identity['config'] != expected_config
            or state.get('mission_config_hash') != expected_config):
        raise ValueError('comparison identity/config mismatch')
    governing = state.get('governing_policy')
    if not isinstance(governing, dict):
        raise ValueError('missing governing policy snapshot')
    version = governing.get('version')
    if (name == 'p2' and version not in (3, 4)) or (name != 'p2' and version != 1):
        raise ValueError('wrong comparison policy version')
    expected_policy = Policy(version=version) if name == 'p2' else Policy(mode='fixed')
    if (config_hash(governing) != config_hash(expected_policy.snapshot())
            or identity['policy'] != config_hash(governing)):
        raise ValueError('governing policy changed from frozen comparison baseline')
    candidate = state.get('policy')
    if version == 4:
        if candidate is None or config_hash(candidate) != config_hash(expected_policy.snapshot()):
            raise ValueError('learning-disabled v4 candidate state changed or missing')
    elif candidate is not None:
        raise ValueError('learning-disabled legacy arm unexpectedly has candidate state')
    ids = [job['id'] for job in journal['jobs']]
    if len(set(ids)) != 6:
        raise ValueError('duplicate comparison job')
    task_map = {task['id']: task for task in tasks}
    seen = set()
    for job in journal['jobs']:
        spec = job['spec']
        task = spec.get('task', {})
        task_id = task.get('id')
        if task_id in seen or task_id not in task_map or task != task_map[task_id]:
            raise ValueError('not an exact known public synthetic development task')
        seen.add(task_id)
        expected_spec = {'task': task, 'route': 'tool' if name == 'strongest_tool' else None,
            'learn_feedback': False, 'allow_retry': False, 'retry_count': 0,
            'hypothesis': 'Synthetic exact-tool protection comparison; no quality-gain inference'}
        if (spec != expected_spec or job['state'] != 'BLOCKED'
                or not isinstance(job.get('result'), dict) or job['result'].get('passed') is not True
                or job['result'].get('valid') is not True):
            raise ValueError('unexpected comparison job state/spec')
        history = [event for event in journal['events'] if event['job_id'] == job['id']]
        if [event['state'] for event in history] != ['QUEUED', 'RUNNING', 'VERIFYING', 'REVIEWING', 'BLOCKED']:
            raise ValueError('unexpected/incomplete comparison event sequence')
    if len(journal['events']) != 30 or any(event['job_id'] not in ids for event in journal['events']):
        raise ValueError('unrelated comparison events')
    allowed = {'budget', 'mission_config_hash', 'comparison_identity', 'governing_policy', 'policy'}
    allowed |= {'feedback:' + job for job in ids}
    if any(key not in allowed and not key.startswith('route_skill:') for key in state):
        raise ValueError('unallowlisted state in journal')


def export(work, output):
    work, output = Path(work).absolute(), Path(output).absolute()
    reject_links(work)
    reject_links(output)
    work, output = work.resolve(), output.resolve()
    if output == work or output.is_relative_to(work) or work.is_relative_to(output):
        raise ValueError('export must be separate from comparison stores')
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError('refusing to overwrite existing export')
    plan_path = ROOT / 'experiments/plans/objective-smoke.json'
    plan = load_plan(plan_path)
    tasks = known_tasks(plan)
    blobs = {'objective-plan.json': plan_path.read_bytes()}
    index = []
    runtimes = set()
    for arm in ARMS:
        source = work / arm
        reject_links(source / 'hive.sqlite3')
        db = sqlite3.connect((source / 'hive.sqlite3').as_uri() + '?mode=ro', uri=True)
        db.row_factory = sqlite3.Row
        try:
            db.execute('BEGIN')
            jobs = [dict(row) for row in db.execute('SELECT * FROM jobs ORDER BY rowid')]
            events = [dict(row) for row in db.execute('SELECT * FROM events ORDER BY seq')]
            for job in jobs:
                for key in ('spec', 'result'):
                    job[key] = json.loads(job[key]) if job[key] else None
            for event in events:
                event['detail'] = json.loads(event['detail']) if event['detail'] else None
            def get(key):
                row = db.execute('SELECT value FROM kv WHERE key=?', (key,)).fetchone()
                return json.loads(row[0]) if row else None
            state = {key: get(key) for key in ('budget', 'mission_config_hash', 'comparison_identity', 'governing_policy', 'policy')}
            journal = {'store': arm, 'jobs': jobs, 'events': events, 'state': state}
            validate_journal(journal, tasks)
            def artifact(ref):
                if not isinstance(ref, str) or not REF.fullmatch(ref):
                    raise ValueError('invalid artifact reference')
                path = source / ref
                reject_links(path)
                raw = path.read_bytes()
                if hashlib.sha256(raw).hexdigest() != path.stem:
                    raise ValueError('source artifact digest mismatch')
                return raw, json.loads(raw)
            for job in jobs:
                feedback_ref = get('feedback:' + job['id'])
                if feedback_ref is None:
                    if state['governing_policy'].get('version') == 4:
                        raise ValueError('missing per-job v4 feedback receipt')
                    continue
                _, feedback = artifact(feedback_ref)
                if (feedback.get('job_id') != job['id'] or feedback.get('split') != 'development'
                        or feedback.get('evidence_ref') != job['result']['evidence_ref']):
                    raise ValueError('feedback is not bound to a known development job')
                state['feedback:' + job['id']] = feedback_ref
                task = job['spec']['task']
                skill_key = f"route_skill:{feedback['partition_key']}:{task['category']}:{feedback['route']}"
                skill_ref = get(skill_key)
                if skill_ref is not None:
                    state[skill_key] = skill_ref
            feedback_refs = {value for key, value in state.items() if key.startswith('feedback:')}
            for key, value in state.items():
                if key.startswith('route_skill:'):
                    _, skill = artifact(value)
                    if not set(skill.get('supporting_feedback_refs', [])) <= feedback_refs:
                        raise ValueError('skill references feedback outside the eighteen public jobs')
            pending, seen = list(refs(journal)), set()
            while pending:
                ref = pending.pop()
                if ref in seen:
                    continue
                seen.add(ref)
                raw, value = artifact(ref)
                blobs[arm + '/' + ref] = raw
                pending.extend(refs(value))
            blobs[arm + '/journal.json'] = canonical(journal)
            runtimes.add(state['comparison_identity']['runtime'])
            index.append({'store': arm, 'journal': arm + '/journal.json', 'original_job_count': 6})
        finally:
            db.close()
    if len(runtimes) != 1:
        raise ValueError('comparison arms do not share a frozen runtime')
    files = {name: {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)} for name, raw in sorted(blobs.items())}
    manifest = {'schema': 1, 'scope': 'public synthetic P2 development comparison; no acceptance or learning gain',
        'new_model_calls': 0, 'original_job_count': 18, 'stores': index,
        'runtime_source_hash': next(iter(runtimes)), 'files': files}
    manifest['manifest_sha256'] = hashlib.sha256(canonical(manifest)).hexdigest()
    output.mkdir(parents=True, exist_ok=True)
    for relative, raw in {**blobs, 'manifest.json': canonical(manifest)}.items():
        path = output / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('xb') as handle:
            handle.write(raw)
    return {'exported_jobs': 18, 'hashed_files': len(files), 'manifest_sha256': manifest['manifest_sha256']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(export(args.work, args.output), indent=2))
