import copy
import pytest
from hive.pressure import list_tests, run
from hive.pressure_verifier import verify_pressure

@pytest.mark.parametrize('test_id', [x['test_id'] for x in list_tests()])
def test_receipts_replay_and_reject_forgery(tmp_path, test_id):
    report = run(test_id, root=tmp_path)
    root = tmp_path / test_id
    assert verify_pressure(report, root)['integrity'] == 'PASS'
    import json
    assert run(test_id, root=tmp_path) == json.loads(json.dumps(report))
    forged = copy.deepcopy(report)
    forged['observations'][0]['verification']['passed'] = False
    with pytest.raises(ValueError): verify_pressure(forged, root)
    forged = copy.deepcopy(report)
    forged['observations'][0]['job_id'] = 'forged'
    with pytest.raises(ValueError): verify_pressure(forged, root)
    forged = copy.deepcopy(report)
    forged['arm_results'][0]['usage']['cycles'] = 999
    with pytest.raises(ValueError): verify_pressure(forged, root)

@pytest.mark.parametrize('test_id', ['H02','H04','H05','H06','H07','H08','H09','H10'])
def test_scenario_mechanisms(tmp_path, test_id):
    from hive.verifier import verify
    report = run(test_id, root=tmp_path)
    b = report['details']
    if test_id == 'H02':
        assert b['invalid_decision']['selected'] is None
    elif test_id == 'H04':
        assert b['decision']['selected'] is None
        assert b['control_decision']['selected'] == 'tool'
    elif test_id in ('H05','H10'):
        p = b['probe']; v = verify(p['task'], p['result'])
        assert v == p['verification'] and not v['passed']
        assert b['policy_before'] == b['policy_after']
        assert not b.get('accepted', b.get('feedback_accepted'))
    elif test_id == 'H06':
        assert b['model_barrier'] and b['tool_barrier'] is None and b['exhausted_barrier']
    elif test_id == 'H07':
        verdicts = [verify(x['task'], x['result'])['passed'] for x in b['candidates']]
        assert verdicts == [False, True, False] and b['selected_index'] == 1
    elif test_id == 'H08':
        assert not b['future_accepted'] and b['after_B'] == b['restored']
        assert b['after_A']['counts']['math'] == b['after_B']['counts']['math']
    elif test_id == 'H09':
        import json
        parent, child, broken = b['parent'], b['child'], b['broken_dependency']
        assert child['task']['input']['a'] == json.loads(parent['result']['output'])['result']
        assert verify(child['task'], child['result'])['passed']
        assert not verify(broken['task'], broken['result'])['passed']



@pytest.mark.parametrize('test_id', ['H01','H03','H11'])
def test_additional_scenario_mechanisms(tmp_path, test_id):
    import json
    from hive.verifier import verify
    report = run(test_id, root=tmp_path)
    details = report['details']
    if test_id == 'H01':
        assert len(details['levels']) == 5 and details['levels'] == sorted(details['levels'])
        assert {x['name'] for x in details['curricula']} == {'fixed','seeded_random','learning_progress'}
        for curriculum in details['curricula']:
            assert curriculum['usage']['cycles'] == 5
            assert sorted(x['level'] for x in curriculum['outcomes']) == list(range(1,6))
            for outcome in curriculum['outcomes']:
                assert verify(outcome['task'], outcome['result'])['passed']
        ladder = details['ladder']
        for rung in ('L1','L2','L5'):
            assert verify(ladder[rung]['task'], ladder[rung]['result'])['passed']
        assert not verify(ladder['L3']['task'], ladder['L3']['result'])['passed']
        assert ladder['L4']['decision']['selected'] is None
    elif test_id == 'H03':
        assert len(details['configurations']) >= 4
        for row in details['configurations']:
            assert verify(row['task'], row['result']) == row['verification']
    else:
        assert {'video_captions','video_clips','code_repair'} <= {o['task']['category'] for o in report['observations']}
        assert details['level_A'] == 'UNTESTED'


def test_comparison_rejects_unpaired_or_unmatched_arms(tmp_path):
    from hive.pressure import compare
    report = run('H02', root=tmp_path)
    assert compare([report])['research_status'] == 'UNTESTED'
    for mutation in ('budget', 'source', 'summary'):
        forged = copy.deepcopy(report)
        if mutation == 'budget': forged['arm_results'][1]['declared_budget']['max_cycles'] += 1
        elif mutation == 'source': forged['arm_results'][1]['source_groups'][0] = 'different-source'
        else: forged['arm_results'][1]['positive_passes'] += 1
        with pytest.raises(ValueError): compare([forged])

@pytest.mark.parametrize('test_id', ['H04','H10'])
def test_scenario_control_forgery_is_rejected(tmp_path, test_id):
    report = run(test_id, root=tmp_path)
    assert verify_pressure(report, tmp_path / test_id)['integrity'] == 'PASS'
    forged = copy.deepcopy(report)
    if test_id == 'H04': forged['details']['decision']['selected'] = 'tool'
    else: forged['details']['feedback_accepted'] = True
    with pytest.raises(ValueError): verify_pressure(forged, tmp_path / test_id)
    if test_id == 'H04':
        forged = copy.deepcopy(report)
        forged['details']['crash_recovery'][0]['budget_after']['cycles'] = 1
        with pytest.raises(ValueError): verify_pressure(forged, tmp_path / test_id)

@pytest.mark.parametrize('test_id', ['H01','H03','H11'])
def test_behavior_evidence_is_bound_to_artifacts(tmp_path, test_id):
    report = run(test_id, root=tmp_path)
    assert verify_pressure(report, tmp_path / test_id)['integrity'] == 'PASS'
    forged = copy.deepcopy(report)
    if test_id == 'H01': forged['details']['curricula'][0]['outcomes'][0]['result']['output'] = 'forged'
    elif test_id == 'H03': forged['details']['configurations'][0]['verification']['passed'] = False
    else: forged['details']['code_missions'][0]['mission_report']['patches'].clear()
    with pytest.raises(ValueError): verify_pressure(forged, tmp_path / test_id)

@pytest.mark.parametrize('test_id', ['H01','H02'])
def test_curriculum_and_challenger_controls_reject_forgery(tmp_path,test_id):
    report=run(test_id,root=tmp_path)
    assert verify_pressure(report,tmp_path/test_id)['integrity']=='PASS'
    forged=copy.deepcopy(report)
    if test_id=='H01': forged['details']['metrics']['transfer']['rows'][0]['delta']+=1
    else: forged['details']['repair']['siblings'][0]['unrepaired']['verification']['passed']=True
    with pytest.raises(ValueError): verify_pressure(forged,tmp_path/test_id)


def test_independent_real_arm_simulation_rejects_forged_lineage_and_budget(tmp_path,monkeypatch):
    import importlib.util
    from pathlib import Path
    from hive import model_registry
    from hive.pressure import run_development_schedule
    from hive.pressure_verifier import verify_development_pressure
    spec=importlib.util.spec_from_file_location('paired_fixture_source',Path(__file__).parents[1]/'unit'/'test_pressure_contracts.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    monkeypatch.setattr(model_registry,'discover',lambda *a,**k:pytest.fail('real endpoint called'))
    campaign,config,adapter=module.paired_fixture(tmp_path);root=tmp_path/'paired'
    report=run_development_schedule(root,campaign,config,simulation=True)
    assert verify_development_pressure(report,root)['integrity']=='PASS'
    assert report['actual_inference_calls']==0 and adapter.calls==4
    for mutation in ('job','route','team_cost','feedback','arbitration'):
        forged=copy.deepcopy(report)
        if mutation=='job': forged['observations'][0]['members'][0]['job_id']='foreign'
        elif mutation=='route': forged['observations'][0]['members'][0]['route']='local_direct'
        elif mutation=='team_cost': next(a for a in forged['arm_results'] if a['arm']=='fixed_team')['reservation']['cycles']=0
        elif mutation=='feedback': next(r for r in forged['observations'] if r['arm']=='learning_disabled')['members'][0]['feedback_ref']='forged'
        else: next(r for r in forged['observations'] if r['arm']=='fixed_team')['arbitration']['selected_member']=1
        with pytest.raises((ValueError,KeyError)): verify_development_pressure(forged,root)


def test_fixed_team_disagreement_falls_back_to_verified_tool(tmp_path,monkeypatch):
    import importlib.util,json
    from pathlib import Path
    from hive import model_registry
    from hive.pressure import run_development_schedule
    from hive.pressure_verifier import verify_development_pressure
    spec=importlib.util.spec_from_file_location('paired_fixture_disagreement',Path(__file__).parents[1]/'unit'/'test_pressure_contracts.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    class WrongSpecialist(module.SyntheticSpecialist):
        def generate(self,model,prompt,**kwargs):
            self.calls+=1
            return json.dumps({'answer':-1}),model,'synthetic-specialist-digest-v1',1
    monkeypatch.setattr(model_registry,'discover',lambda *a,**k:pytest.fail('real endpoint called'))
    campaign,config,_=module.paired_fixture(tmp_path);config['adapter']=WrongSpecialist();root=tmp_path/'paired'
    report=run_development_schedule(root,campaign,config,simulation=True)
    assert verify_development_pressure(report,root)['integrity']=='PASS'
    teams=[row for row in report['observations'] if row['arm']=='fixed_team']
    assert all(row['final_member']==1 and row['arbitration']['agreement'] is False and row['quality']==1 for row in teams)
