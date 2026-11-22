"""Prepare or explicitly authorize one pinned v0.2.1 reproduction mission.

No inference in prepare. Run uses one fixed durable store; never replenishes caps.
The published ZIP must already be downloaded and extracted under .hive/v03-base.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / '.hive/v03-base'
SOURCE = BASE / 'source'
STORE = ROOT / '.hive/v03-e0-20261121'
CONFIG = ROOT / 'configs/v03-e0.json'
PLAN = ROOT / 'experiments/plans/v03-e0.json'
RESULTS = ROOT / 'experiments/results'
PUBLICATION_SHA = 'eeec51497038ec34454d867f55ebe0fcadfffddf'
RUNTIME_SHA = '2f1ad5f919ec8918a6d699ee0c4328438e5b203294e4048717c0134c9e9bc37f'
ZIP_SHA = 'cd0c782e476f52c75952c923abc5cf16ca6dcbcd3a188c6f4f3c60102f03c445'
MODEL_SHA = 'a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c'
CAPS = {'max_requests': 30, 'max_total_tokens': 3840, 'max_wall_s': 600,
        'max_storage_bytes': 67108864, 'concurrency': 1, 'max_cycles': 50,
        'max_retries': 0, 'max_tokens': 128, 'timeout_s': 60}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def check_caps(config):
    if not isinstance(config, dict):
        raise ValueError('Prepared configuration is missing')
    for key, expected in CAPS.items():
        value = config.get(key)
        if (isinstance(value, bool) or not isinstance(value, (int, float))
                or not math.isfinite(value) or value != expected):
            raise ValueError(f'Prepared cap differs: {key}')
        if key not in ('max_wall_s', 'timeout_s') and type(value) is not int:
            raise ValueError(f'Prepared cap must be an integer: {key}')


def check_budget(status, *, complete=False, preflight=False):
    budget = status.get('budget')
    if not isinstance(budget, dict):
        raise ValueError('Missing budget counters')
    limits = {'requests': 30, 'tokens_reserved': 3840, 'tokens_actual': 3840,
              'cycles': 50, 'wall_s': 600}
    for key, maximum in limits.items():
        value = budget.get(key)
        if (isinstance(value, bool) or not isinstance(value, (int, float))
                or not math.isfinite(value) or not 0 <= value <= maximum):
            raise ValueError(f'Invalid or exceeded budget counter: {key}')
        if key != 'wall_s' and type(value) is not int:
            raise ValueError(f'Budget counter must be an integer: {key}')
    if budget['tokens_actual'] > budget['tokens_reserved']:
        raise ValueError('Actual tokens exceed reservations')
    if budget['tokens_reserved'] != 128 * budget['requests']:
        raise ValueError('Request/token reservation counters disagree')
    if preflight:
        if ((status.get('adaptive') or {}).get('state') != 'PAUSED'
                or status.get('kill_switch') is not True
                or any(budget[key] != 0 for key in ('requests', 'tokens_reserved', 'tokens_actual', 'cycles', 'wall_s'))):
            raise ValueError('STOP preflight requires PAUSED and zero requests/tokens/work')
    if complete and (budget['requests'] != 30 or budget['tokens_reserved'] != 3840
                     or budget['cycles'] != 36):
        raise ValueError('Completed schedule requires 30 requests, 3840 reserved tokens and 36 cycles')
    return budget


def store_bytes():
    # Matches the pinned executor's store-wide artifact accounting, not OS quotas.
    return sum(path.stat().st_size for path in STORE.rglob('*') if path.is_file())


def check_storage():
    if store_bytes() > CAPS['max_storage_bytes']:
        raise ValueError('Artifact storage cap exceeded')


def checkpoint(status):
    result = {'decision': 'STOP', 'status': status,
              'next_test': 'Diagnose persisted reason; explicitly use --resume-paused only when operator STOP may be cleared; no new store or enlarged budget'}
    write_json(RESULTS / 'v03-e0-checkpoint.json', result)
    return result


def explicit_resume(status):
    budget = check_budget(status)
    cli('resume')
    resumed = cli('status')
    if resumed.get('kill_switch') is not False or check_budget(resumed) != budget:
        raise ValueError('Explicit resume did not clear STOP with unchanged budgets')


def cli(*args):
    env = dict(os.environ, PYTHONPATH=str(SOURCE / 'src'),
               GIT_CEILING_DIRECTORIES=str(BASE))
    result = subprocess.run([sys.executable, '-m', 'hive', '--store', str(STORE), *args],
                            cwd=SOURCE, env=env, capture_output=True, text=True, timeout=720)
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return json.loads(result.stdout)


def check_base():
    publication = json.loads((BASE / 'publication.json').read_text(encoding='utf-8-sig'))
    if publication['source_commit'] != PUBLICATION_SHA or publication['runtime_source_sha256'] != RUNTIME_SHA:
        raise ValueError('Publication identity changed')
    if publication['download_sha256'] != ZIP_SHA or digest((BASE / 'v021.zip').read_bytes()) != ZIP_SHA:
        raise ValueError('Published ZIP hash differs')
    for rel, expected in publication['snapshot_files'].items():
        target = (SOURCE / rel).resolve()
        if not target.is_relative_to(SOURCE.resolve()) or digest(target.read_bytes()) != expected:
            raise ValueError(f'Pinned snapshot differs: {rel}')
    doctor = cli('doctor', '--config', str(CONFIG))
    if doctor['build']['source_sha256'] != RUNTIME_SHA or doctor['build']['version'] != '0.2.1':
        raise ValueError('Wrong executable source')
    model = next((x for x in doctor['runtime']['models'] if x['id'] == 'myr5-hold-local:latest'), None)
    if not model or model['digest'] != MODEL_SHA:
        raise ValueError('Model identity unavailable or changed')
    return publication, doctor


def prepare():
    publication, doctor = check_base()
    check_caps(doctor.get('budgets'))
    config = json.loads(CONFIG.read_text(encoding='utf-8-sig'))
    if config != doctor['budgets'] or digest(canonical(config)) != doctor['config_hash']:
        raise ValueError('Prepared doctor/config identity differs')
    plan = {
        'mission_id': 'hive-v03-e0-20261121', 'status': 'prepared_awaiting_operator_budget_approval',
        'purpose': 'Fresh v0.2.1 runtime reproduction only; no generalization or promotion claim',
        'source_commit': PUBLICATION_SHA, 'runtime_version': '0.2.1',
        'runtime_source_sha256': RUNTIME_SHA, 'download_sha256': ZIP_SHA,
        'model': 'myr5-hold-local:latest', 'model_digest': MODEL_SHA,
        'config': doctor['budgets'], 'config_hash': doctor['config_hash'],
        'config_file_sha256': digest(CONFIG.read_bytes()),
        'evaluator_sha256': publication['snapshot_files']['src/hive/verifier.py'],
        'seed': 20261122, 'rounds': 3,
        'matrix': {'development': '6 families x 2 local routes',
                   'validation': '6 families x direct, learned, fixed-local-tool, fixed-tool',
                   'max_requests': 30, 'observations': 36},
        'stop_conditions': ['operator STOP', 'any depleted cap', 'source/model/config drift',
                            'evidence integrity error', 'unexpected side effect'],
        'aggregate_scope': 'Only .hive/v03-e0-20261121; all retries/resumes share these caps; other stores forbidden',
        'previous_mission': 'v0.2.0 used 30/48 calls; its unused allowance is not transferred',
        'steps': ['synthetic recovery/integrity tests first', 'STOP before inference; verify PAUSED and zero calls',
                  'explicit resume of same store', 'run finite adaptive schedule once',
                  'fresh-process replay must use zero additional requests'],
        'permissions': {'production_deploy': False, 'arbitrary_shell_from_model': False,
                        'modify_evaluator': False, 'consume_new_holdout': False},
        'decision_rule': 'PASS runtime reproduction only if complete evidence and replay agree; otherwise STOP and diagnose',
        'limitations': ['Historical synthetic task families', 'No independent holdout',
                        'Single repeat', 'Application resource limits, not OS quotas'],
    }
    if PLAN.exists():
        if json.loads(PLAN.read_text(encoding='utf-8')) != plan:
            raise ValueError('Existing preregistration differs; do not overwrite')
    else:
        write_json(PLAN, plan)
    historical = RESULTS / 'v03-base-verification.json'
    reference = None
    if historical.exists():
        raw = historical.read_bytes()
        receipt = json.loads(raw)
        if any(receipt.get(key) != value for key, value in (
                ('source_commit', PUBLICATION_SHA), ('runtime_source_sha256', RUNTIME_SHA),
                ('download_sha256', ZIP_SHA))):
            raise ValueError('Historical baseline receipt has different source identity')
        reference = {'path': historical.name, 'sha256': digest(raw),
                     'attribution': 'Existing historical receipt; no baseline tests executed by prepare'}
    write_json(RESULTS / 'v03-e0-preparation-verification.json', {
        'source_commit': PUBLICATION_SHA, 'runtime_source_sha256': RUNTIME_SHA,
        'download_sha256': ZIP_SHA, 'files_verified': len(publication['snapshot_files']),
        'doctor': doctor, 'plan_sha256': digest(canonical(plan)), 'real_inference_calls': 0,
        'historical_baseline_receipt': reference,
        'scope': 'Snapshot/hash/doctor/config preparation checks only; no tests or inference executed',
        'policy_deployed': False,
    })
    return plan


def run(approval, *, resume_paused=False):
    # This is an operator user-session gate, not cryptographic proof of consent.
    # Callers must only supply approval/--resume-paused when the operator authorized it.
    if not isinstance(approval, str) or not approval.strip():
        raise ValueError('Explicit operator approval text required; prepare alone never runs inference')
    plan = prepare()
    check_caps(plan.get('config'))
    STORE.mkdir(parents=True, exist_ok=True)
    auth = STORE / 'operator-authorization.json'
    auth_data = {'plan_sha256': digest(canonical(plan)), 'operator_approval': approval}
    if auth.exists():
        if json.loads(auth.read_text(encoding='utf-8'))['plan_sha256'] != auth_data['plan_sha256']:
            raise ValueError('Authorized plan changed')
    else:
        write_json(auth, auth_data)
    command = ('adaptive', '--config', str(CONFIG), '--seed', '20261122', '--rounds', '3')
    before = cli('status')
    check_storage()
    state = (before.get('adaptive') or {}).get('state')
    if before.get('budget') is not None:
        check_budget(before, complete=state == 'FINISHED')
    elif before.get('adaptive'):
        raise ValueError('Existing mission has no budget counters')
    if state == 'ERROR':
        return checkpoint(before)
    if state != 'FINISHED' and (before.get('kill_switch') or state == 'PAUSED'):
        if not resume_paused:
            return checkpoint(before)
        if state == 'PAUSED':
            if before.get('kill_switch') and before['budget']['requests'] == 0:
                check_budget(before, preflight=True)
            explicit_resume(before)
        else:
            # Establish the zero-call preflight before explicitly clearing an
            # operator STOP that existed before this wrapper started.
            paused = cli(*command)
            status = cli('status')
            check_budget(paused)
            check_budget(status, preflight=True)
            if paused.get('state') != 'PAUSED' or paused['budget'] != status['budget']:
                raise ValueError('STOP preflight report/status differ')
            explicit_resume(status)
    elif not before.get('adaptive'):
        cli('stop')
        paused = cli(*command)
        write_json(RESULTS / 'v03-e0-stop.json', paused)
        status = cli('status')
        check_budget(paused)
        check_budget(status, preflight=True)
        if paused.get('state') != 'PAUSED' or paused['budget'] != status['budget']:
            raise ValueError('STOP preflight report/status differ')
        explicit_resume(status)
    # FINISHED returns the pinned cached report without rewriting its real receipt.
    output_args = () if state == 'FINISHED' else ('--output', str(RESULTS / 'v03-e0-real-model.json'))
    report = cli(*command, *output_args)
    after = cli('status')
    check_budget(after)
    check_storage()
    if (after.get('adaptive') or {}).get('state') != 'FINISHED':
        return checkpoint(after)
    check_budget(after, complete=True)
    if check_budget(report, complete=True) != after['budget']:
        raise ValueError('Completed report/status budgets differ')
    replay = cli(*command)
    final = cli('status')
    check_budget(final, complete=True)
    check_storage()
    if replay != report or after['budget'] != final['budget']:
        raise ValueError('Fresh-process replay changed evidence or budget')
    stale_reason = final.get('stop_reason') != final['adaptive'].get('stop_reason')
    result = {'decision': ('COMPLETED_WITH_STATUS_OBSERVABILITY_DEFECT' if stale_reason
                           else 'PASS_RUNTIME_REPRODUCTION_ONLY'), 'source_commit': PUBLICATION_SHA,
              'runtime_source_sha256': RUNTIME_SHA, 'model_digest': MODEL_SHA,
              'plan_sha256': digest(canonical(plan)), 'budget': final['budget'],
              'replay_new_requests': 0, 'policy_deployed': False,
              'status_reason_consistent': not stale_reason,
              'next_test': 'Independently review and freeze E1 pilot after separate budget authorization'}
    receipt = RESULTS / 'v03-e0-verification.json'
    if receipt.exists():
        if json.loads(receipt.read_text(encoding='utf-8')) != result:
            raise ValueError('Existing verification receipt differs; preserve and review')
    else:
        write_json(receipt, result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'run'])
    parser.add_argument('--operator-approval')
    parser.add_argument('--resume-paused', action='store_true',
                        help='Explicitly clear operator STOP/resume the same paused mission without refilling caps')
    args = parser.parse_args()
    output = prepare() if args.action == 'prepare' else run(args.operator_approval, resume_paused=args.resume_paused)
    print(json.dumps(output, indent=2))
