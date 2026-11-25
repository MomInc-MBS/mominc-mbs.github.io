"""Replay public P2 journals offline in a temporary Store; never dispatch work."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import tempfile

from export_p2_evidence import ARMS, ROOT, REF, canonical, known_tasks, comparison_config, reject_links, refs, validate_journal
from hive.contracts import OutcomeFeedbackV1, feedback_partition_key, record_hash
from hive.orchestrator import config_hash, inspect_evidence, recorded_config_hash
from hive.storage import Store


def replay(base):
    base = Path(base).absolute()
    reject_links(base)
    base = base.resolve()
    def read(relative):
        if (not isinstance(relative, str) or '\\' in relative or ':' in relative
                or PurePosixPath(relative).is_absolute() or '..' in PurePosixPath(relative).parts):
            raise ValueError('out-of-scope export path')
        path = base / relative
        reject_links(path)
        return path.read_bytes()
    manifest = json.loads(read('manifest.json'))
    unsigned = dict(manifest)
    digest = unsigned.pop('manifest_sha256', None)
    if digest != hashlib.sha256(canonical(unsigned)).hexdigest():
        raise ValueError('manifest canonical hash mismatch')
    if (manifest.get('schema') != 1 or manifest.get('original_job_count') != 18
            or manifest.get('new_model_calls') != 0 or len(manifest.get('stores', [])) != 3
            or [entry['store'] for entry in manifest['stores']] != list(ARMS)):
        raise ValueError('unexpected comparison manifest')
    files = manifest['files']
    for relative, expected in files.items():
        raw = read(relative)
        if len(raw) != expected['bytes'] or hashlib.sha256(raw).hexdigest() != expected['sha256']:
            raise ValueError('export digest mismatch: ' + relative)
    actual_files = {path.relative_to(base).as_posix() for path in base.rglob('*') if path.is_file()}
    if actual_files != set(files) | {'manifest.json'}:
        raise ValueError('unlisted or missing export files')
    if read('objective-plan.json') != (ROOT / 'experiments/plans/objective-smoke.json').read_bytes():
        raise ValueError('export is not the known public objective plan')
    tasks = known_tasks(json.loads(read('objective-plan.json')))
    versions, totals, runtimes = {}, {}, set()
    with tempfile.TemporaryDirectory(prefix='hive-p2-offline-replay-') as temp:
        for entry in manifest['stores']:
            arm = entry['store']
            if entry['journal'] != arm + '/journal.json' or entry['original_job_count'] != 6:
                raise ValueError('unbound comparison journal')
            journal = json.loads(read(entry['journal']))
            if journal['store'] != arm:
                raise ValueError('journal arm mismatch')
            validate_journal(journal, tasks)
            if any(key.startswith('route_skill:') for key in journal['state']):
                raise ValueError('learning-disabled comparison unexpectedly wrote route skill')
            pending, reached = list(refs(journal)), set()
            while pending:
                ref = pending.pop()
                if ref in reached:
                    continue
                reached.add(ref)
                relative = arm + '/' + ref
                if not REF.fullmatch(ref) or relative not in files:
                    raise ValueError('unlisted artifact reference')
                raw = read(relative)
                if hashlib.sha256(raw).hexdigest() != Path(ref).stem:
                    raise ValueError('content-addressed artifact mismatch')
                pending.extend(refs(json.loads(raw)))
            expected_files = {arm + '/journal.json'} | {arm + '/' + ref for ref in reached}
            if {name for name in files if name.startswith(arm + '/')} != expected_files:
                raise ValueError('export includes unrelated artifacts')
            store = Store(Path(temp) / arm)
            try:
                for ref in reached:
                    shutil.copyfile(base / arm / ref, store.root / ref)
                for job in journal['jobs']:
                    store.db.execute('INSERT INTO jobs(id,spec,state,owner,generation,pid,result) VALUES (?,?,?,?,?,?,?)',
                        (job['id'], json.dumps(job['spec']), job['state'], job['owner'], job['generation'], job['pid'], json.dumps(job['result'])))
                for event in journal['events']:
                    store.db.execute('INSERT INTO events(seq,job_id,state,detail) VALUES (?,?,?,?)',
                        (event['seq'], event['job_id'], event['state'], json.dumps(event['detail']) if event['detail'] is not None else None))
                for key, value in journal['state'].items():
                    store.set(key, value)
                governing = journal['state']['governing_policy']
                for job in journal['jobs']:
                    evidence = inspect_evidence(store, job['id'])
                    decision = store.read_artifact(evidence['decision_ref'])
                    runtime = evidence['build']['source_sha256']
                    if (evidence['task'] != job['spec']['task'] or evidence['job_id'] != job['id']
                            or decision != evidence['decision'] or evidence['route'] != 'tool'
                            or decision['selected_route'] != 'tool' or 'tool' not in decision['eligible_routes']
                            or decision['task_hash'] != config_hash(evidence['task'])
                            or decision['policy_hash'] != config_hash(governing)
                            or decision['source_hash'] != runtime
                            or runtime != journal['state']['comparison_identity']['runtime']
                            or decision['config_hash'] != journal['state']['mission_config_hash']
                            or recorded_config_hash(evidence['config']) != evidence['config_hash']
                            or type(evidence['result'].get('tokens')) is not int or evidence['result']['tokens'] != 0):
                        raise ValueError('task/config/runtime/policy/route binding mismatch')
                    effective = dict(evidence['config'])
                    timeout = effective.pop('timeout_s')
                    expected_config = comparison_config()
                    if (type(timeout) not in (int, float) or not 0 < timeout <= expected_config['max_wall_s']
                            or dict(effective, timeout_s=expected_config['timeout_s']) != expected_config):
                        raise ValueError('serialized config exceeds comparison allocation')
                    feedback_ref = journal['state'].get('feedback:' + job['id'])
                    version = decision.get('policy_version', 'legacy')
                    if version == 4:
                        if evidence.get('mission_config') != expected_config or not feedback_ref:
                            raise ValueError('missing v4 original config/feedback')
                        feedback = store.read_artifact(feedback_ref)
                        typed = OutcomeFeedbackV1(**{k:v for k,v in feedback.items() if k != 'schema_version'}).to_record()
                        contract = decision['task_contract']
                        partition = feedback_partition_key(contract, 'tool', model_identity=None, runtime_source_hash=runtime)
                        if (typed != feedback or feedback['schema_version'] != 1
                                or feedback['job_id'] != job['id'] or feedback['evidence_ref'] != job['result']['evidence_ref']
                                or feedback['decision_ref'] != evidence['decision_ref']
                                or feedback['task_contract_hash'] != record_hash(contract)
                                or feedback['task_contract_hash'] != decision['task_contract_hash']
                                or feedback['partition_key'] != partition
                                or feedback['route'] != evidence['route'] or feedback['split'] != 'development'
                                or any(feedback[key] != evidence['verification'][key] for key in ('valid','passed','quality'))
                                or feedback['feedback_eligible'] is not False):
                            raise ValueError('v4 feedback/verdict/partition binding mismatch')
                        costs = feedback['charged_cost']
                        if (costs.get('reserved_requests') != 0 or costs.get('reserved_tokens') != 0
                                or costs.get('actual_tokens') != 0 or costs.get('cycles') != 1):
                            raise ValueError('v4 feedback model charges changed')
                        # These comparison jobs disable feedback; no route-skill update is authorized.
                        skill_key = f"route_skill:{partition}:{evidence['task']['category']}:tool"
                        if skill_key in journal['state']:
                            raise ValueError('learning-disabled comparison unexpectedly wrote route skill')
                    elif feedback_ref is not None:
                        raise ValueError('legacy learning-disabled job unexpectedly wrote feedback')
                    versions[str(version)] = versions.get(str(version), 0) + 1
                    totals[arm] = totals.get(arm, 0) + int(evidence['verification']['passed'])
                    runtimes.add(runtime)
                if store.get('governing_policy') != journal['state']['governing_policy'] or store.get('policy') != journal['state']['policy']:
                    raise ValueError('replay mutated candidate/governing policy')
            finally:
                store.close()
    if runtimes != {manifest['runtime_source_hash']}:
        raise ValueError('manifest/runtime mismatch')
    return {'status': 'passed', 'original_jobs': 18, 'hashed_files': len(files),
        'manifest_sha256': digest, 'policy_receipts': versions, 'independently_verified_passes': totals,
        'new_model_calls': 0, 'scope': 'offline saved-output/journal/contract/feedback replay; no fresh task execution or learning gain',
        'limitations': ['Only the eighteen successful known synthetic comparison jobs are supported.',
            'Original database migration, interrupted/failed-state recovery and post-feedback crash recovery are not reproduced.',
            'Comparison feedback is disabled; route-skill updates are unauthorized and rejected.',
            'Manifest hashes prove internal integrity, not external authenticity or independent source freshness.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', '--export', dest='base', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(replay(args.base), indent=2))
