import copy
import json
import pytest
from hive.pressure import ARMS, compare, contract, generate, list_tests, run, validate
from hive.learning_policy import Policy

@pytest.mark.parametrize('test_id',[x['test_id'] for x in list_tests()])
def test_pressure_positive_negative_replay_budget(test_id,tmp_path):
    report=run(test_id,root=tmp_path)
    assert report['research_status']=='UNTESTED'
    for arm in report['arm_results']:
        assert arm['positive_passes']==len(generate(test_id))
        assert arm['negative_rejections']==len(generate(test_id))
        assert arm['usage']['requests']==0
        assert arm['usage']['cycles']<=arm['declared_budget']['max_cycles']
    assert run(test_id,root=tmp_path)==report
    assert compare([report])['research_status']=='UNTESTED'
    forged=copy.deepcopy(report);forged['arm_results'][0]['positive_passes']=999
    with pytest.raises(ValueError):compare([forged])
    forged=copy.deepcopy(report);forged['arm_results'][0]['source_groups']=['unpaired']
    with pytest.raises(ValueError):compare([forged])
    changed=contract(test_id);changed['budget']['max_cycles']=999
    with pytest.raises(ValueError):run(test_id,changed,root=tmp_path)
    with pytest.raises(PermissionError):run(test_id,root=tmp_path,mode='real')

def test_contracts_frozen():
    for item in list_tests():assert validate(contract(item['test_id']))['valid']
    bad=contract('H01');bad['seed']=True
    with pytest.raises(ValueError):validate(bad)

def test_exact_tool_rule_versioned():
    historical=Policy();historical.observe('math','tool',1,1)
    assert historical.choose('math',['tool','local_direct'])=='local_direct'
    protected=Policy(version=2);protected.observe('math','tool',1,1)
    assert protected.choose('math',['tool','local_direct'])=='tool'
    assert protected.choose('math',{'tool':False,'local_direct':True})=='local_direct'
    assert protected.choose('text_classification',['local_direct'])=='local_direct'
    assert Policy(state=protected.snapshot()).snapshot()==protected.snapshot()
    assert Policy(state=historical.snapshot()).snapshot()==historical.snapshot()

def test_untrusted_and_non_development_never_learn():
    policy=Policy(version=2);before=policy.snapshot()
    for split in ('validation','holdout','future','chronological'):
        assert policy.observe('math','local_direct',1,999,split=split) is False
    assert policy.observe('math','local_direct',1,999,valid=False) is False
    assert policy.snapshot()==before

def test_distinct_pressure_operations(tmp_path):
    from hive.pressure import _behavior
    def behavior(key):return _behavior(key,generate(key),tmp_path/key)
    b=behavior('H02');assert b['invalid_decision']['selected'] is None
    b=behavior('H03');assert b['parent_decision']['selected']=='fixture_bad';assert b['candidate_decision']['selected']=='tool'
    b=behavior('H04');assert b['decision']['selected'] is None;assert b['control_decision']['selected']=='tool'
    b=behavior('H05');assert b['accepted'] is False;assert b['policy_before']==b['policy_after']
    b=behavior('H06');assert b['model_barrier'];assert b['tool_barrier'] is None;assert b['exhausted_barrier']
    b=behavior('H07');assert b['selected_index']==1;assert not b['candidates'][b['majority_index']]['verification']['passed']
    b=behavior('H08');assert b['future_accepted'] is False;assert b['after_A']['counts']['math']==b['after_B']['counts']['math'];assert b['restored']==b['after_B']
    b=behavior('H09');assert b['child']['verification']['passed'];assert not b['broken_dependency']['verification']['passed']
    b=behavior('H10');assert b['feedback_accepted'] is False;assert b['policy_before']==b['policy_after'];assert b['promotion']=='rejected'
    b=behavior('H11');assert b['code_missions'][0]['mission_report']['synthetic'];assert all(p['verification']['passed'] for p in b['code_missions'][0]['mission_report']['patches'].values());assert all(not p['verification']['passed'] for p in b['code_missions'][1]['mission_report']['patches'].values())

def test_approved_real_adapter_zero_inference_and_allocation_binding(tmp_path):
    import hashlib
    from hive.pressure import digest
    from hive.orchestrator import DEFAULT_CONFIG,code_version
    from hive.task_spec import _task
    from pathlib import Path
    import uuid
    tasks={}
    for i in range(3):
        task=_task('development','math',i,456789)
        task.update(contract_version=1,permissions={'version':1,'routes':['tool']},success_criteria='Exact product.')
        tasks[task['id']]=task
    ids=list(tasks)
    campaign={'version':1,'id':'zero-inference-real-adapter-test','controls':['incumbent','candidate','strongest_fixed','learning_disabled'],'tasks':tasks,'train':ids[:1],'comparison':ids[1:2],'subsequent':ids[2:]}
    campaign_path=tmp_path/'campaign.json';campaign_path.write_text(json.dumps(campaign))
    config={**DEFAULT_CONFIG,'routes':['tool'],'max_requests':1,'max_total_tokens':128,'max_cycles':32,'max_wall_s':60,'max_storage_bytes':1048576}
    config_path=tmp_path/'config.json';config_path.write_text(json.dumps(config))
    approval_path=tmp_path/'approval.json'
    sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    manifest={'version':1,'test_id':'H03','mode':'real','model_digest':'not_applicable_zero_inference','protocol':'integration-development-v1','campaign_manifest_path':str(campaign_path),'config_path':str(config_path),'approval_path':str(approval_path),'hashes':{'source_sha256':code_version()['source_sha256'],'campaign_sha256':sha(campaign_path),'config_sha256':sha(config_path),'verifier_sha256':sha(Path(__import__('hive.pressure',fromlist=['x']).__file__).with_name('verifier.py'))},'budget_id':'unit-zero-inference-'+uuid.uuid4().hex,'budget':{k:config[k] for k in ('max_requests','max_total_tokens','max_cycles','max_wall_s','max_storage_bytes')},'reviewer':'unit fixture only','rollback_sha':digest(Policy().snapshot()),'analysis_plan':'engineering adapter only; no research','permissions':{'routes':['tool']}}
    approval_path.write_text(json.dumps({'approved':False}))
    with pytest.raises(PermissionError):run('H03',manifest,root=tmp_path/'out',mode='real')
    approval_path.write_text(json.dumps({'approved':True,'pressure_manifest_sha256':digest(manifest),'budget_id':manifest['budget_id'],'operator':'synthetic unit allocation; zero inference routes only','budget':manifest['budget']}))
    result=run('H03',manifest,root=tmp_path/'out',mode='real')
    assert result['research_status']=='UNTESTED'
    assert result['integration_report']['status']=='FRAMEWORK_WIRED'
    with pytest.raises(PermissionError,match='allocation already bound'):
        run('H03',manifest,root=tmp_path/'new-out',mode='real')

class SyntheticSpecialist:
    """Public-input-only test subject; never calls a model endpoint."""
    def __init__(self):self.calls=0
    def generate(self,model,prompt,*,seed=42,max_tokens=128,expected_digest=None):
        from hive.experiment_runner import _tool_baseline
        self.calls+=1
        public=json.loads(prompt)
        return json.dumps(_tool_baseline(public)),model,'synthetic-specialist-digest-v1',1


def paired_fixture(tmp_path):
    from hive.orchestrator import DEFAULT_CONFIG
    from hive.task_spec import _task
    tasks={}
    for i in range(2):
        task=_task('development','math',i,781230)
        task.update(source_group='paired-synthetic-source-'+str(i),success_criteria='Exact synthetic product; no real model inference.',
                    permissions={'version':1,'routes':['tool','local_direct']})
        tasks[task['id']]=task
    ids=list(tasks);adapter=SyntheticSpecialist()
    campaign={'version':1,'id':'paired-zero-inference-v1','creation_time':'2026-11-21T00:00:00Z','tasks':tasks,'train':ids[:1],
        'comparison':ids[1:],'arms':list(ARMS),'parent_policy':Policy(version=2).snapshot(),
        'arm_budget':{'max_requests':2,'max_total_tokens':256,'max_cycles':4,'max_wall_s':8,'max_storage_bytes':33554432}}
    config={**DEFAULT_CONFIG,'routes':['tool','local_direct'],'adapter':adapter,'allow_fixtures':True,'max_retries':0,
            'timeout_s':2,'max_requests':8,'max_total_tokens':1024,'max_cycles':12,'max_wall_s':60,'max_storage_bytes':134217728}
    return campaign,config,adapter


def test_five_arm_development_dispatch_replay_and_budget(tmp_path,monkeypatch):
    from hive.pressure import run_development_schedule
    from hive.storage import Store
    from hive import model_registry
    monkeypatch.setattr(model_registry,'discover',lambda *a,**k:pytest.fail('simulation contacted model endpoint'))
    campaign,config,adapter=paired_fixture(tmp_path)
    report=run_development_schedule(tmp_path/'schedule',campaign,config,simulation=True)
    assert report['mode']=='synthetic_adapter' and report['actual_inference_calls']==0
    assert report['budget']['requests']==adapter.calls==4
    assert report['budget']['cycles']==12
    assert len(report['observations'])==10
    for row in report['observations']:
        assert row['quality']==1
        if row['arm']=='fixed_team':assert [m['route'] for m in row['members']]==['local_direct','tool']
    arms={x['arm']:x for x in report['arm_results']}
    assert arms['fixed_team']['reservation']['requests']==2
    assert arms['fixed_team']['reservation']['cycles']==4
    assert arms['learning_disabled']['policy_before']==arms['learning_disabled']['policy_after']
    assert arms['adaptive']['policy_before']!=arms['adaptive']['policy_after']
    assert run_development_schedule(tmp_path/'schedule',campaign,config,simulation=True)==report
    assert adapter.calls==4
    from hive.pressure import compare,report as summarize,team_selection
    assert compare([report])['reports'][0]['logical_requests']==4
    assert summarize(tmp_path)['reports'][0]['logical_requests']==4
    forged=copy.deepcopy(report);forged['arm_results'][0]['comparison_quality']=[0]
    with pytest.raises(ValueError):compare([forged])
    forged=copy.deepcopy(report);forged['observations'][1]['members'][0]['job_id']=forged['observations'][0]['members'][0]['job_id']
    with pytest.raises(ValueError):compare([forged])
    team=next(r for r in report['observations'] if r['arm']=='fixed_team')
    assert team['final_member']==0 and team['arbitration']['agreement']
    disagreement=copy.deepcopy(team['members']);disagreement[0]['result']['output']='{"answer":-999}'
    disagreement[0]['verification']['passed']=False
    assert team_selection(disagreement)['selected_member']==1
    disagreement[1]['verification']['passed']=False
    assert team_selection(disagreement)['selected_member'] is None
    changed=copy.deepcopy(campaign);changed['arm_budget']['max_requests']=1
    with pytest.raises(ValueError):run_development_schedule(tmp_path/'other',changed,config,simulation=True)
    with pytest.raises(PermissionError):run_development_schedule(tmp_path/'unauthorized',campaign,{k:v for k,v in config.items() if k!='adapter'},authorization_sha='made-up')
    store=Store(tmp_path/'schedule')
    try:
        key='paired-development-report';ref=store.get(key);artifact=store.read_artifact(ref)
        artifact['observations'][0]['quality']=0
        store.set(key,store.put_artifact(artifact))
    finally:store.close()
    with pytest.raises(ValueError):run_development_schedule(tmp_path/'schedule',campaign,config,simulation=True)
