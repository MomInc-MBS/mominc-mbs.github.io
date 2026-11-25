"""Export only the named public synthetic objective stores, without opening Store."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / 'experiments/results/next-loop-20261121/objective-evidence'
REF = re.compile(r'artifacts/[0-9a-f]{64}\.json')


def refs(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from refs(item)
    elif isinstance(value, list):
        for item in value:
            yield from refs(item)
    elif isinstance(value, str) and REF.fullmatch(value):
        yield value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = args.output.resolve()
    if output != DEFAULT_OUTPUT.resolve():
        raise ValueError('output must be the named public objective-evidence directory')
    comparison = ROOT / '.hive/next-loop-p2-comparison'
    plan = json.loads((ROOT / 'experiments/plans/objective-smoke.json').read_text(encoding='utf-8-sig'))
    task_ids = {row['id'] for key in ('code_tasks', 'structured_data_tasks') for row in plan[key]}
    if len(task_ids) != 12:
        raise ValueError('expected twelve known objective task IDs')
    stores = [('comparison/' + arm, comparison / arm) for arm in ('strongest_tool', 'learning_disabled', 'p2')]
    attempts = [('smoke-attempt1', ROOT / '.hive/objective-smoke-20261121'),
                ('smoke-final', ROOT / '.hive/objective-smoke-20261121-r2')]
    for label, work in attempts:
        children = sorted((work / 'stores').iterdir())
        if {p.name for p in children} != task_ids or any(not p.is_dir() or p.is_symlink() for p in children):
            raise ValueError('objective stores differ from known plan IDs: ' + label)
        stores += [(label + '/' + p.name, p) for p in children]
    if output.exists() and any(output.iterdir()):
        raise ValueError('refusing to overwrite an existing export; preserve its evidence')
    files, index = {}, []

    def save(relative, raw):
        path = output / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        files[relative] = {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}

    save('objective-plan.json', (ROOT / 'experiments/plans/objective-smoke.json').read_bytes())
    for label, work in attempts:
        inputs_raw = (work / 'inputs.json').read_bytes()
        inputs = json.loads(inputs_raw)
        config_path = work / 'executor-config.json'
        if Path(inputs['config']).resolve() != config_path.resolve():
            raise ValueError('inputs config path differs from named attempt config')
        config_raw = config_path.read_bytes()
        if hashlib.sha256(config_raw).hexdigest() != inputs['config_sha256']:
            raise ValueError('pinned original config bytes changed')
        save(label + '/inputs.json', inputs_raw)
        save(label + '/executor-config.json', config_raw)
        report_raw = (work / 'report.json').read_bytes()
        report = json.loads(report_raw)
        if ({row['id'] for row in report['tasks']} != task_ids or report['task_count'] != 12
                or report['actual_model_requests'] != 0):
            raise ValueError('report task/cost mismatch: ' + label)
        save(label + '/report.json', report_raw)
    for name, source in stores:
        if source.is_symlink() or (source / 'artifacts').is_symlink():
            raise ValueError('store symlink refused')
        dbpath = source / 'hive.sqlite3'
        db = sqlite3.connect(dbpath.resolve().as_uri() + '?mode=ro', uri=True)
        db.row_factory = sqlite3.Row
        try:
            db.execute('BEGIN')
            jobs = [dict(r) for r in db.execute('SELECT * FROM jobs ORDER BY rowid')]
            events = [dict(r) for r in db.execute('SELECT * FROM events ORDER BY seq')]
            missionrow = db.execute("SELECT value FROM kv WHERE key='mission_config_hash'").fetchone()
            budgetrow = db.execute("SELECT value FROM kv WHERE key='budget'").fetchone()
            for job in jobs:
                for key in ('spec', 'result'):
                    job[key] = json.loads(job[key]) if job[key] else None
                if job['spec']['task']['split'] != 'development':
                    raise ValueError('only public development jobs may be exported')
                if job['state'] != 'BLOCKED' or not (job['result'] or {}).get('passed'):
                    raise ValueError('expected completed successful, quarantined BLOCKED observations')
            for event in events:
                event['detail'] = json.loads(event['detail']) if event['detail'] else None
            payload = {'store': name, 'original_job_count': len(jobs), 'jobs': jobs,
                       'events': events, 'mission_config_hash': json.loads(missionrow[0]) if missionrow else None, 'budget': json.loads(budgetrow[0]) if budgetrow else None}
        finally:
            db.close()
        if not payload['budget'] or any(payload['budget'].get(k) != 0 for k in ('requests', 'tokens_reserved', 'tokens_actual')):
            raise ValueError('unexpected/unknown model resource usage: ' + name)
        expected = 6 if name.startswith('comparison/') else 1
        if len(jobs) != expected:
            raise ValueError('unexpected original job count: ' + name)
        pending, seen = list(refs(payload)), set()
        while pending:
            ref = pending.pop()
            if ref in seen:
                continue
            seen.add(ref)
            path = source / ref
            if path.is_symlink():
                raise ValueError('artifact symlink refused')
            raw = path.read_bytes()
            if hashlib.sha256(raw).hexdigest() != path.stem:
                raise ValueError('source artifact hash mismatch: ' + ref)
            value = json.loads(raw)
            pending.extend(refs(value))
            save(name + '/' + ref, raw)
        relative = name + '/journal.json'
        save(relative, json.dumps(payload, indent=2, allow_nan=False).encode())
        index.append({'store': name, 'journal': relative, 'original_job_count': len(jobs),
                      'source_relative': source.relative_to(ROOT).as_posix()})
    manifest = {'schema': 1, 'scope': 'public synthetic development; artifact-level offline replay only',
                'new_model_calls': 0, 'stores': index, 'original_job_count': 42, 'files': files}
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps({'exported_stores': len(index), 'exported_jobs': 42, 'hashed_files': len(files)}))


if __name__ == '__main__':
    main()
