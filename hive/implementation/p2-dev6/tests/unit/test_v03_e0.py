"""Synthetic-only wrapper safety checks; never call a provider or the real E0 store."""
import copy
import importlib.util
import json
from pathlib import Path

import pytest


def module():
    spec = importlib.util.spec_from_file_location('v03_e0', Path(__file__).parents[2] / 'scripts/v03_e0.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def budget(*, complete=False):
    return {'requests': 30 if complete else 0, 'tokens_reserved': 3840 if complete else 0,
            'tokens_actual': 1008 if complete else 0, 'cycles': 36 if complete else 0,
            'wall_s': 23.125 if complete else 0.0}


def status(state='FINISHED', *, stopped=False):
    return {'adaptive': {'state': state, 'stop_reason': 'completed' if state == 'FINISHED' else 'kill switch'},
            'budget': budget(complete=state == 'FINISHED'), 'kill_switch': stopped,
            'stop_reason': 'completed' if state == 'FINISHED' else 'kill switch'}


@pytest.fixture
def rig(tmp_path, monkeypatch):
    mission = module()
    monkeypatch.setattr(mission, 'STORE', tmp_path / 'store')
    monkeypatch.setattr(mission, 'RESULTS', tmp_path / 'results')
    plan = {'mission_id': 'synthetic', 'config': dict(mission.CAPS)}
    monkeypatch.setattr(mission, 'prepare', lambda: copy.deepcopy(plan))
    monkeypatch.setattr(mission, 'cli', lambda *args: pytest.fail(f'Unexpected CLI: {args}'))
    return mission, plan


def fake_cli(monkeypatch, mission, statuses, *, fail_resume=False):
    statuses = iter(statuses)
    calls = []
    report = {'stop_reason': 'completed finite preregistered schedule', 'budget': budget(complete=True)}
    def cli(*args):
        calls.append(args)
        if args[0] == 'status':
            return copy.deepcopy(next(statuses))
        if args[0] == 'adaptive':
            if len(calls) >= 2 and calls[-2][0] == 'stop':
                return {'state': 'PAUSED', 'budget': budget()}
            return copy.deepcopy(report)
        if args[0] == 'resume' and fail_resume:
            raise RuntimeError('Synthetic interruption during resume')
        return {}
    monkeypatch.setattr(mission, 'cli', cli)
    return calls


@pytest.mark.parametrize('approval', [None, '', '  ', True])
def test_missing_approval_never_invokes_prepare_or_inference(monkeypatch, approval):
    mission = module()
    monkeypatch.setattr(mission, 'prepare', lambda: pytest.fail('unapproved prepare'))
    with pytest.raises(ValueError, match='operator approval'):
        mission.run(approval)


def test_finished_runtime_report_without_state_replays_without_new_calls(rig, monkeypatch):
    mission, _ = rig
    calls = fake_cli(monkeypatch, mission, [
        {'adaptive': None, 'kill_switch': False}, status('PAUSED', stopped=True),
        status('PAUSED'), status(), status(),
    ])
    result = mission.run('synthetic test authorization only')
    assert result['decision'] == 'PASS_RUNTIME_REPRODUCTION_ONLY'
    assert [x[0] for x in calls] == ['status', 'stop', 'adaptive', 'status', 'resume',
                                     'status', 'adaptive', 'status', 'adaptive', 'status']
    assert result['replay_new_requests'] == 0


def test_failed_preflight_resume_requires_explicit_retry(rig, monkeypatch):
    mission, _ = rig
    fake_cli(monkeypatch, mission, [{'adaptive': None}, status('PAUSED', stopped=True)], fail_resume=True)
    with pytest.raises(RuntimeError, match='Synthetic interruption'):
        mission.run('synthetic authorization')
    calls = fake_cli(monkeypatch, mission, [status('PAUSED', stopped=True)])
    assert mission.run('synthetic authorization')['decision'] == 'STOP'
    assert [x[0] for x in calls] == ['status']
    calls = fake_cli(monkeypatch, mission, [status('PAUSED', stopped=True),
                                          status('PAUSED'), status(), status()])
    assert mission.run('synthetic authorization', resume_paused=True)['decision'] == 'PASS_RUNTIME_REPRODUCTION_ONLY'
    assert [x[0] for x in calls] == ['status', 'resume', 'status', 'adaptive', 'status', 'adaptive', 'status']


def test_preexisting_operator_stop_without_campaign_is_preserved(rig, monkeypatch):
    mission, _ = rig
    calls = fake_cli(monkeypatch, mission, [{'adaptive': None, 'kill_switch': True}])
    result = mission.run('synthetic authorization')
    assert result['decision'] == 'STOP' and '--resume-paused' in result['next_test']
    assert [x[0] for x in calls] == ['status']


def test_explicit_resume_cannot_refill_budget(rig, monkeypatch):
    mission, _ = rig
    before = status('PAUSED', stopped=True)
    before['budget'] = {'requests': 2, 'tokens_reserved': 256, 'tokens_actual': 40,
                        'wall_s': 1.0, 'cycles': 2}
    fake_cli(monkeypatch, mission, [before, status('PAUSED')])
    with pytest.raises(ValueError, match='unchanged budgets'):
        mission.run('synthetic authorization', resume_paused=True)


def test_explicit_resume_must_actually_clear_stop(rig, monkeypatch):
    mission, _ = rig
    fake_cli(monkeypatch, mission, [status('PAUSED', stopped=True), status('PAUSED', stopped=True)])
    with pytest.raises(ValueError, match='clear STOP'):
        mission.run('synthetic authorization', resume_paused=True)


def test_completed_cache_replay_preserves_stop_and_existing_receipt(rig, monkeypatch):
    mission, _ = rig
    calls = fake_cli(monkeypatch, mission, [status(stopped=True)] * 3)
    first = mission.run('synthetic authorization')
    receipt = mission.RESULTS / 'v03-e0-verification.json'
    raw = receipt.read_bytes()
    stamp = receipt.stat().st_mtime_ns
    assert all('--output' not in args for args in calls)
    assert all(args[0] != 'resume' for args in calls)
    fake_cli(monkeypatch, mission, [status(stopped=True)] * 3)
    assert mission.run('synthetic authorization') == first
    assert receipt.read_bytes() == raw and receipt.stat().st_mtime_ns == stamp


@pytest.mark.parametrize('field,value', [
    ('requests', 999), ('requests', 29), ('tokens_reserved', 999),
    ('tokens_actual', 3841), ('tokens_actual', -1), ('tokens_actual', None),
    ('wall_s', 601), ('wall_s', float('inf')), ('wall_s', float('nan')),
    ('cycles', 35), ('cycles', 999), ('requests', True), ('cycles', 36.0),
])
def test_forged_or_incomplete_completed_counters_never_dispatch_or_pass(rig, monkeypatch, field, value):
    mission, _ = rig
    forged = status()
    forged['budget'][field] = value
    calls = fake_cli(monkeypatch, mission, [forged])
    with pytest.raises(ValueError):
        mission.run('synthetic authorization')
    assert [x[0] for x in calls] == ['status']
    assert not (mission.RESULTS / 'v03-e0-verification.json').exists()


@pytest.mark.parametrize('field', ['requests', 'tokens_reserved', 'tokens_actual', 'wall_s', 'cycles'])
def test_missing_completed_counter_fails_closed(rig, monkeypatch, field):
    mission, _ = rig
    forged = status()
    del forged['budget'][field]
    fake_cli(monkeypatch, mission, [forged])
    with pytest.raises(ValueError, match='budget counter'):
        mission.run('synthetic authorization')


@pytest.mark.parametrize('key', list(module().CAPS))
def test_changed_prepared_cap_cannot_start(rig, key):
    mission, plan = rig
    plan['config'][key] += 1
    with pytest.raises(ValueError, match='Prepared cap'):
        mission.run('synthetic authorization')


@pytest.mark.parametrize('field,value', [('tokens_reserved', 128), ('tokens_actual', 1),
                                        ('requests', 1), ('cycles', 1), ('wall_s', .1)])
def test_stop_preflight_rejects_nonzero_work(field, value):
    mission = module()
    paused = status('PAUSED', stopped=True)
    paused['budget'][field] = value
    with pytest.raises(ValueError):
        mission.check_budget(paused, preflight=True)


def test_stop_preflight_requires_paused_state_and_token_counters():
    mission = module()
    paused = status('PAUSED', stopped=True)
    paused['adaptive']['state'] = 'RUNNING'
    with pytest.raises(ValueError, match='PAUSED'):
        mission.check_budget(paused, preflight=True)
    paused = status('PAUSED', stopped=True)
    del paused['budget']['tokens_actual']
    with pytest.raises(ValueError, match='tokens_actual'):
        mission.check_budget(paused, preflight=True)


def test_store_artifact_limit_fails_before_cached_dispatch(rig, monkeypatch):
    mission, _ = rig
    monkeypatch.setattr(mission, 'store_bytes', lambda: 67108865)
    calls = fake_cli(monkeypatch, mission, [status()])
    with pytest.raises(ValueError, match='Artifact storage'):
        mission.run('synthetic authorization')
    assert [x[0] for x in calls] == ['status']


def test_report_budget_must_match_status(rig, monkeypatch):
    mission, _ = rig
    different = status()
    different['budget']['tokens_actual'] = 1009
    fake_cli(monkeypatch, mission, [status(), different])
    with pytest.raises(ValueError, match='report/status budgets differ'):
        mission.run('synthetic authorization')


def test_status_observability_defect_is_not_reported_as_clean_pass(rig, monkeypatch):
    mission, _ = rig
    stale = status()
    stale['stop_reason'] = 'no eligible work'
    fake_cli(monkeypatch, mission, [stale] * 3)
    assert mission.run('synthetic authorization')['decision'] == 'COMPLETED_WITH_STATUS_OBSERVABILITY_DEFECT'


def test_prepare_preserves_historical_receipt_and_plan_without_test_claims(tmp_path, monkeypatch):
    mission = module()
    monkeypatch.setattr(mission, 'PLAN', tmp_path / 'plan.json')
    monkeypatch.setattr(mission, 'CONFIG', tmp_path / 'config.json')
    monkeypatch.setattr(mission, 'RESULTS', tmp_path / 'results')
    config = dict(mission.CAPS, model='synthetic-model', seed=20261122)
    mission.write_json(mission.CONFIG, config)
    publication = {'snapshot_files': {'src/hive/verifier.py': 'synthetic-hash'}}
    doctor = {'budgets': config, 'config_hash': mission.digest(mission.canonical(config))}
    monkeypatch.setattr(mission, 'check_base', lambda: (publication, doctor))
    historical = {'source_commit': mission.PUBLICATION_SHA, 'runtime_source_sha256': mission.RUNTIME_SHA,
                  'download_sha256': mission.ZIP_SHA, 'baseline_tests': {'passed': 123, 'skipped': 9}}
    receipt = mission.RESULTS / 'v03-base-verification.json'
    mission.write_json(receipt, historical)
    raw, stamp = receipt.read_bytes(), receipt.stat().st_mtime_ns
    plan = mission.prepare()
    plan_raw, plan_stamp = mission.PLAN.read_bytes(), mission.PLAN.stat().st_mtime_ns
    assert mission.prepare() == plan
    assert receipt.read_bytes() == raw and receipt.stat().st_mtime_ns == stamp
    assert mission.PLAN.read_bytes() == plan_raw and mission.PLAN.stat().st_mtime_ns == plan_stamp
    preparation = json.loads((mission.RESULTS / 'v03-e0-preparation-verification.json').read_text())
    assert 'baseline_tests' not in preparation
    assert preparation['historical_baseline_receipt']['sha256'] == mission.digest(raw)
    assert preparation['real_inference_calls'] == 0
    assert 'no tests or inference' in preparation['scope']
