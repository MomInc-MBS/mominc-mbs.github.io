"""Replay named objective artifact exports offline; never dispatch or open SQLite."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
from hive.governor import p2_source_context
from hive.orchestrator import config_hash
from hive.verifier import verify
from replay_readiness_exports import recorded_config_hash

BASE = ROOT / 'experiments/results/next-loop-20261121/objective-evidence'


def read(relative):
    path = (BASE / relative).resolve()
    if not path.is_relative_to(BASE.resolve()) or not path.is_file() or (BASE / relative).is_symlink():
        raise ValueError('missing/out-of-scope exported file: ' + str(relative))
    return path.read_bytes()


def main():
    manifest = json.loads(read('manifest.json'))
    if manifest['schema'] != 1 or manifest['original_job_count'] != 42 or len(manifest['stores']) != 27:
        raise ValueError('unexpected objective export manifest')
    files = manifest['files']
    for relative, entry in files.items():
        raw = read(relative)
        if len(raw) != entry['bytes'] or hashlib.sha256(raw).hexdigest() != entry['sha256']:
            raise ValueError('export digest mismatch: ' + relative)

    def artifact(store, ref):
        import re
        if not isinstance(ref, str) or not re.fullmatch(r'artifacts/[0-9a-f]{64}\.json', ref):
            raise ValueError('invalid artifact ref')
        relative = store + '/' + ref
        if relative not in files:
            raise ValueError('unlisted artifact')
        raw = read(relative)
        if hashlib.sha256(raw).hexdigest() != Path(ref).stem:
            raise ValueError('content-addressed artifact mismatch')
        return json.loads(raw)

    plan = json.loads(read('objective-plan.json'))
    task_ids = {r['id'] for k in ('code_tasks', 'structured_data_tasks') for r in plan[k]}
    expected_stores = {'comparison/' + arm for arm in ('strongest_tool','learning_disabled','p2')}
    expected_stores |= {label + '/' + task for label in ('smoke-attempt1','smoke-final') for task in task_ids}
    if len(task_ids) != 12 or {s['store'] for s in manifest['stores']} != expected_stores:
        raise ValueError('store IDs do not match named plan')
    reports, originals = {}, {}
    for label in ('smoke-attempt1','smoke-final'):
        inputs = json.loads(read(label + '/inputs.json'))
        raw_config = read(label + '/executor-config.json')
        original = json.loads(raw_config)
        if (hashlib.sha256(raw_config).hexdigest() != inputs['config_sha256']
                or config_hash(original) != inputs['config_hash']
                or hashlib.sha256(read('objective-plan.json')).hexdigest() != inputs['plan_sha256']):
            raise ValueError('pinned original config/plan mismatch')
        originals[label] = original
        report = json.loads(read(label + '/report.json'))
        if ({r['id'] for r in report['tasks']} != task_ids or report['task_count'] != 12
                or report['actual_model_requests'] != 0):
            raise ValueError('report task count/model usage mismatch')
        reports[label] = report
    total, versions, runtimes = 0, {}, set()
    seen_stores = set()
    for item in manifest['stores']:
        name = item['store']
        if name in seen_stores or item['journal'] != name + '/journal.json' or item['journal'] not in files:
            raise ValueError('duplicate/unbound journal')
        seen_stores.add(name)
        journal = json.loads(read(item['journal']))
        jobs = journal['jobs']
        if not journal['budget'] or any(journal['budget'].get(k) != 0 for k in ('requests','tokens_reserved','tokens_actual')):
            raise ValueError('unknown/nonzero model resource usage')
        if name.startswith('smoke-'):
            label, task_id = name.split('/')
            report_task = next(r for r in reports[label]['tasks'] if r['id'] == task_id)
            if (report_task['costs'] != journal['budget']
                    and any(report_task['costs'].get(k) != journal['budget'].get(k) for k in report_task['costs'])):
                raise ValueError('report/store budget mismatch')
            if report_task.get('job_id') and [j['id'] for j in jobs] != [report_task['job_id']]:
                raise ValueError('report/store job identity mismatch')
        if (journal['store'] != name or len(jobs) != journal['original_job_count']
                or len(jobs) != item['original_job_count']):
            raise ValueError('original job count mismatch')
        if len({j['id'] for j in jobs}) != len(jobs):
            raise ValueError('duplicate job')
        for job in jobs:
            task = job['spec']['task']
            if task['split'] != 'development' or job['state'] != 'BLOCKED' or not job['result']['passed']:
                raise ValueError('unexpected original observation state')
            bundle = artifact(name, job['result']['evidence_ref'])
            decision = artifact(name, bundle['decision_ref'])
            if (bundle['job_id'] != job['id'] or bundle['task'] != task or decision != bundle['decision']
                    or decision['task_hash'] != config_hash(task)
                    or decision['selected_route'] != bundle['route']
                    or bundle['route'] not in decision['eligible_routes']
                    or decision['source_hash'] != bundle['build']['source_sha256']
                    or recorded_config_hash(bundle['config']) != bundle['config_hash']):
                raise ValueError('task/config/runtime/route binding mismatch')
            if name.startswith('smoke-') and report_task.get('task_hash'):
                if report_task['task_hash'] != config_hash(task) or report_task['output_hash'] != hashlib.sha256(json.dumps(bundle['result'], sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode('utf-8')).hexdigest():
                    raise ValueError('report/task/output identity mismatch')
            mission_hash = journal.get('mission_config_hash')
            if name.startswith('smoke-'):
                original = originals[label]
                if mission_hash != config_hash(original):
                    raise ValueError('mission does not bind authorized original config')
                effective = dict(bundle['config'])
                timeout = effective['timeout_s']
                if (type(timeout) not in (int, float) or not 0 < timeout <= min(original['timeout_s'], original['max_wall_s'])):
                    raise ValueError('effective timeout exceeds authorized caps')
                restored = dict(effective, timeout_s=original['timeout_s'])
                if task['category'] == 'code_mission':
                    added = {'_cancel_file', '_store_root', 'test_isolation_adapter'}
                    if (set(restored) != set(original) | added
                            or restored['test_isolation_adapter'] != 'hive.adapters.isolation.DockerIsolation'
                            or any(not isinstance(restored[k], str) or not restored[k] for k in ('_cancel_file','_store_root'))):
                        raise ValueError('unexpected code executor configuration additions')
                    if recorded_config_hash(restored) != decision['config_hash']:
                        raise ValueError('code decision config derivation mismatch')
                    stripped = {k:v for k,v in restored.items() if k not in added}
                    if stripped != original:
                        raise ValueError('code executor changed original config fields')
                elif restored != original or decision['config_hash'] != mission_hash:
                    raise ValueError('data original/decision config mismatch')
            elif mission_hash is None or decision['config_hash'] != mission_hash:
                raise ValueError('comparison decision/original mission config mismatch')
            requested = job['spec'].get('route')
            if requested is not None and requested != bundle['route']:
                raise ValueError('explicit route mismatch')
            if verify(task, bundle['result']) != bundle['verification']:
                raise ValueError('objective verifier result did not reproduce')
            history = [e for e in journal['events'] if e['job_id'] == job['id']]
            verifying = [e for e in history if e['state'] == 'VERIFYING']
            provenance = (verifying[-1]['detail'] or {}) if verifying else {}
            is_p2 = provenance.get('policy_version') == 3 or decision.get('policy_version') == 3
            if is_p2:
                attribution = decision['route_attribution']
                if (provenance.get('policy_version') != 3 or decision.get('policy_version') != 3
                        or provenance.get('decision_ref') != bundle['decision_ref']
                        or attribution.get('source_context') != p2_source_context(task)
                        or attribution.get('source') != decision.get('route_source')
                        or any(attribution.get(k) != decision.get(k) for k in
                               ('task_hash','config_hash','policy_hash','source_hash','selected_route','eligible_routes'))):
                    raise ValueError('P2 receipt/event/source attribution mismatch')
            if not history or history[-1]['state'] != job['state']:
                raise ValueError('journal terminal state mismatch')
            version = str(decision.get('policy_version', 'legacy'))
            versions[version] = versions.get(version, 0) + 1
            runtimes.add(bundle['build']['source_sha256'])
            total += 1
    if total != manifest['original_job_count']:
        raise ValueError('total original job count mismatch')
    print(json.dumps({'status':'passed', 'original_jobs':total, 'hashed_files':len(files),
        'attempt_reports':{label: {'passed':r['passed'], 'all_replayed_with_equal_budget':r['all_replayed_with_equal_budget']} for label,r in reports.items()}, 'policy_receipts':versions,'runtime_source_hashes':sorted(runtimes),'new_model_calls':0,
        'scope':'artifact-level offline verifier and journal binding replay; no fresh execution, Store restart, or learning gain'},indent=2))


if __name__ == '__main__':
    main()
