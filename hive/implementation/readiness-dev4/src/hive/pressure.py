"""Bounded H01-H11 engineering smoke scenarios. Never research evidence."""
from __future__ import annotations
import copy
import hashlib
import json
import random
import os
import subprocess
import sys
import time
import math
from pathlib import Path
from .orchestrator import Executor, DEFAULT_CONFIG, code_version
from .learning_policy import Policy
from .task_spec import _task, request_view
from .benchmark_registry import BenchmarkRegistry
from .verifier import verify

NAMES = ('Moving Frontier','Adversarial Challenger','Evolution Tournament','Amputation','Contaminated Knowledge','Resource Famine','Split Brain','Forgetting Cycle','Novel Recombination','False Reward Trap','Real-Work Gauntlet')
ARMS = ('fixed_strongest_tool','fixed_specialist','fixed_team','learning_disabled','adaptive')
SCHEMA_VERSION = 1

def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',', ':'),ensure_ascii=False,allow_nan=False).encode()).hexdigest()

def list_tests():
    return [{'test_id':f'H{i:02}', 'name':name, 'fixture_available':True,'research_status':'UNTESTED'} for i,name in enumerate(NAMES,1)]

def contract(test_id):
    if test_id not in {x['test_id'] for x in list_tests()}: raise ValueError('unknown pressure test')
    return {'version':1,'test_id':test_id,'name':NAMES[int(test_id[1:])-1], 'seed':1000+int(test_id[1:]), 'split':'development','budget_id':test_id+'-fixture-v1','budget':{'max_cycles':64,'max_requests':0,'max_tokens':0},'arms':list(ARMS),'metric':'independently_verified_quality','practical_margin':0.05,'analysis':'paired by source_group; fixture only, no scientific inference','approval':None,'isolation':'deterministic_builtins_only','rollback_sha':digest(Policy(mode='fixed').snapshot()),'research_status':'UNTESTED',
            'hypothesis':'The named pressure mechanism is executable, independently checkable and fails closed on its negative control; beneficial learning is not tested.',
            'permissions':{'routes':['tool','fixture_bad'],'actions':['deterministic_builtins','local_evidence_write'],'network':False,'inference':False},
            'model_digest':'not_applicable_zero_inference','verifier_id':'hive.verifier+independent_pressure_verifier-v1',
            'reviewer':'independent verifier; no operator scientific approval implied',
            'source_group_rule':'generator seed/test/instance lineage; fixture sources are synthetic',
            'adverse_events':['unauthorized inference','budget overrun','false promotion','label exposure','corrupt replay','untrusted code execution'],
            'solvability':'every positive deterministic tool output independently evaluated; deliberate wrong output rejected',
            'analysis_plan':{'pairing':'same tasks/source groups across all arms','uncertainty':'not estimated from synthetic smoke','missing':'retain blocked and failures','promotion':'forbidden'},
            'identity_rule':'exact runtime source, contract, config, output and verifier hashes bound by Executor evidence',
            'budget_scope':'budget applies independently to each matched arm; aggregate_budget includes all auxiliary execution probes',
            'aggregate_budget':{'max_cycles':128,'max_requests':0,'max_total_tokens':0,'max_wall_s':600,'max_storage_bytes':67108864}}

def aggregate_usage(root, elapsed):
    """Reconcile all existing Executor ledgers; simulated famine state is separate."""
    from .storage import Store
    root=Path(root);stores=[]
    totals={'cycles':0,'requests':0,'tokens_reserved':0,'tokens_actual':0,'wall_s':0.0}
    for path in sorted(root.rglob('hive.sqlite3')):
        relative=path.parent.relative_to(root).as_posix();store=Store(path.parent)
        try:budget=store.get('budget',{'cycles':0,'requests':0,'tokens_reserved':0,'tokens_actual':0,'wall_s':0.0})
        finally:store.close()
        role='simulated_resource_injection' if relative=='famine-probe' else 'executed_fixture'
        stores.append({'store':relative,'role':role,'usage':budget})
        if role=='executed_fixture':
            for key in totals:totals[key]+=budget[key]
    size=sum(p.stat().st_size for p in root.rglob('*') if p.is_file() and p.name!='report.json' and not p.name.endswith(('-wal','-shm')))
    return {**totals,'storage_bytes':size,'controller_elapsed_s':elapsed,'stores':stores,
            'scope':'all matched arms and auxiliary execution stores; famine injection is explicitly simulated, never a model call'}

def check_aggregate(usage,budget):
    for key in ('cycles','requests','tokens_reserved','tokens_actual','wall_s','controller_elapsed_s','storage_bytes'):
        value=usage[key]
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value<0:
            raise ValueError('invalid aggregate fixture resource counter')
    if (usage['cycles']>budget['max_cycles'] or usage['requests']>budget['max_requests'] or
        usage['tokens_reserved']>budget['max_total_tokens'] or usage['tokens_actual']>budget['max_total_tokens'] or
        usage['wall_s']>budget['max_wall_s'] or usage['controller_elapsed_s']>budget['max_wall_s'] or
        usage['storage_bytes']>budget['max_storage_bytes']):
        raise ValueError('aggregate fixture budget exhausted; no reset or automatic retry authorized')

def planned_cycles(test_id):
    auxiliary={'H01':33,'H02':6,'H03':8,'H04':4,'H05':2,'H08':8,'H11':2}.get(test_id,0)
    return len(generate(test_id))*len(ARMS)*2+auxiliary

def validate(manifest):
    if not isinstance(manifest,dict): raise ValueError('manifest object required')
    if manifest.get('mode')=='real':
        return _validate_real(manifest)
    expected=contract(manifest.get('test_id'))
    if set(manifest)!=set(expected): raise ValueError('manifest fields do not match versioned contract')
    if manifest != expected: raise ValueError('fixture contract is frozen; real campaign requires independent preregistration')
    return {'valid':True,'contract_sha256':digest(manifest),'mode':'fixture'}

def _validate_real(manifest):
    """Read an operator-owned allocation; a fixture never supplies approval.

    The local operator/filesystem is the trust root, as for existing campaigns.
    This adapter runs the established development integration protocol, not a
    decisive sealed study and not a newly invented execution subsystem.
    """
    from .orchestrator import load_config
    from .integration import load_manifest
    from .video_mission import _reject_reparse_components
    contract(manifest.get('test_id'))
    required={'version','test_id','mode','protocol','campaign_manifest_path','config_path','approval_path','hashes','budget_id','budget','reviewer','rollback_sha','analysis_plan','permissions','model_digest'}
    if set(manifest)!=required or manifest.get('version')!=1 or manifest.get('protocol') not in ('integration-development-v1','paired-development-v1'):
        raise PermissionError('BLOCKED: real mode needs a versioned approved development preregistration')
    if not all(isinstance(manifest.get(k),str) and manifest[k] for k in ('budget_id','reviewer','rollback_sha','analysis_plan')):
        raise ValueError('reviewer, rollback and preregistered analysis required')
    paths={}
    for key in ('campaign_manifest_path','config_path','approval_path'):
        original=Path(manifest[key]).absolute()
        _reject_reparse_components(original)
        paths[key]=original.resolve(strict=True)
    hashes=manifest['hashes']
    actual={'source_sha256':code_version()['source_sha256'],
            'campaign_sha256':hashlib.sha256(paths['campaign_manifest_path'].read_bytes()).hexdigest(),
            'config_sha256':hashlib.sha256(paths['config_path'].read_bytes()).hexdigest(),
            'verifier_sha256':hashlib.sha256(Path(__file__).with_name('verifier.py').read_bytes()).hexdigest()}
    if hashes!=actual:raise ValueError('real campaign input/source/verifier hash mismatch')
    approval=json.loads(paths['approval_path'].read_text(encoding='utf-8-sig'))
    if (approval.get('approved') is not True or approval.get('pressure_manifest_sha256')!=digest(manifest)
        or approval.get('budget_id')!=manifest['budget_id'] or not approval.get('operator')
        or approval.get('budget')!=manifest['budget']):
        raise PermissionError('BLOCKED: matching explicit operator approval and fresh aggregate budget required')
    config=load_config(paths['config_path'])
    campaign=(load_manifest(paths['campaign_manifest_path']) if manifest['protocol']=='integration-development-v1'
              else load_development_campaign(paths['campaign_manifest_path']))
    model_routes=any(route.startswith('local_') for route in config['routes'])
    if model_routes:
        from .model_registry import discover
        runtime=discover(config['endpoint'])
        if not isinstance(manifest['model_digest'],str) or not manifest['model_digest'] or not any(m['id']==config['model'] and m.get('digest')==manifest['model_digest'] for m in runtime.get('models',[])):
            raise PermissionError('BLOCKED: approved exact model digest is unavailable')
    elif manifest['model_digest']!='not_applicable_zero_inference':
        raise ValueError('tools-only campaign must declare no model inference')
    budget=manifest['budget']
    for key in ('max_requests','max_total_tokens','max_cycles','max_wall_s','max_storage_bytes'):
        if type(budget.get(key)) not in (int,float) or isinstance(budget[key],bool) or budget[key]<=0 or config[key]>budget[key]:
            raise ValueError('declared config exceeds approved aggregate budget')
    if not isinstance(manifest['permissions'],dict) or manifest['permissions'].get('routes')!=config['routes']:
        raise ValueError('real route permissions do not match approved config')
    # This existing adapter handles governed built-ins/model output only. A
    # hostile repository task must enter the separate verified isolation gate.
    if any(t['category']=='code_mission' for t in campaign['tasks'].values()):
        raise PermissionError('BLOCKED: use approved shared code mission with verified OS isolation')
    if manifest['protocol']=='paired-development-v1':validate_development_schedule(campaign,config)
    return {'valid':True,'mode':'real','contract_sha256':digest(manifest),'protocol':manifest['protocol'],'paths':{k:str(v) for k,v in paths.items()}}

def _run_real(test_id,manifest,root):
    from .integration import run_integration
    from .storage import Store
    if not isinstance(manifest,dict) or manifest.get('test_id')!=test_id:
        raise PermissionError('BLOCKED: real mode needs a fresh explicit preregistration, approval, hashes, budget and isolation declaration')
    checked=_validate_real(manifest)
    mission_root=(Path(root or '.hive/pressure')/test_id/'real').resolve()
    ledger=Store(Path(__file__).resolve().parents[2]/'.hive'/'pressure-allocations')
    allocation={'manifest_sha256':digest(manifest),'root':str(mission_root),'budget':manifest['budget']}
    try:
        ledger.db.execute('BEGIN IMMEDIATE')
        key='allocation:'+manifest['budget_id'];existing=ledger.get(key)
        if existing is not None and existing!=allocation:
            raise PermissionError('BLOCKED: budget allocation already bound; changing store cannot refill it')
        if existing is None:ledger.set(key,allocation)
        ledger.db.execute('COMMIT')
    except BaseException:
        ledger.db.execute('ROLLBACK');raise
    finally:ledger.close()
    authorization_store=Store(mission_root)
    try:authorization_store.set('pressure-authorization',{'sha256':checked['contract_sha256'],'protocol':checked['protocol']})
    finally:authorization_store.close()
    if manifest['model_digest']!='not_applicable_zero_inference':
        from .orchestrator import load_config
        config=load_config(checked['paths']['config_path'])
        pin={'model':config['model'],'digest':manifest['model_digest'],'kind':'ollama-manifest'}
        mission_store=Store(mission_root)
        try:
            previous=mission_store.get('mission_model_identity')
            if previous is not None and previous!=pin:raise ValueError('approved model pin differs from mission')
            mission_store.set('mission_model_identity',pin)
        finally:mission_store.close()
    if checked['protocol']=='paired-development-v1':
        from .orchestrator import load_config
        result=run_development_schedule(mission_root,load_development_campaign(checked['paths']['campaign_manifest_path']),
                load_config(checked['paths']['config_path']),authorization_sha=checked['contract_sha256'],real_manifest=manifest)
        wrapper={'version':1,'test_id':test_id,'mode':'real','protocol':checked['protocol'],'research_status':'UNTESTED',
                'scientific_status':'development protocol only; no sealed Hxx hypothesis result','contract_sha256':checked['contract_sha256'],'development_report':result}
        _write_summary(mission_root.parent/'real-report.json',wrapper);return wrapper
    result=run_integration(mission_root,checked['paths']['campaign_manifest_path'],checked['paths']['config_path'])
    result={k:v for k,v in result.items() if k not in ('replayed','additional_model_calls')}
    from .orchestrator import load_config
    wrapper={'version':1,'test_id':test_id,'mode':'real','protocol':checked['protocol'],
            'research_status':'UNTESTED','scientific_status':'development protocol only; no sealed Hxx hypothesis result',
            'contract_sha256':checked['contract_sha256'],'execution_config':load_config(checked['paths']['config_path']),'integration_report':result}
    _write_summary(mission_root.parent/'real-report.json',wrapper);return wrapper

def _write_summary(path,value):
    encoded=json.dumps(value,indent=2,sort_keys=True)
    if path.exists():
        if json.loads(path.read_text(encoding='utf-8'))!=json.loads(encoded):raise ValueError('saved development summary changed')
    else:path.write_text(encoded,encoding='utf-8')

def load_development_campaign(path):
    path=Path(path)
    if path.stat().st_size>131072:raise ValueError('development campaign exceeds 128 KiB')
    campaign=json.loads(path.read_text(encoding='utf-8-sig'))
    return campaign

def validate_development_schedule(campaign,config):
    """Preregister a finite matched five-arm development schedule, not a study."""
    from .governor import validate_task,route_scope_reason,task_routes
    required={'version','id','creation_time','tasks','train','comparison','arms','arm_budget','parent_policy'}
    if not isinstance(campaign,dict) or set(campaign)!=required or campaign['version']!=1 or not isinstance(campaign['id'],str) or not campaign['id'] or campaign['arms']!=list(ARMS):
        raise ValueError('invalid paired development campaign schema or arms')
    parent=Policy(state=campaign['parent_policy'])
    if parent.mode=='random':raise ValueError('paired development parent must be deterministic fixed/greedy/UCB')
    groups=[campaign['train'],campaign['comparison']]
    if not all(isinstance(x,list) and x for x in groups):raise ValueError('separate nonempty train and comparison cases required')
    ids=[i for group in groups for i in group]
    if len(ids)!=len(set(ids)) or set(ids)!=set(campaign['tasks']):raise ValueError('training/comparison cases must be disjoint and exhaustive')
    source_sets=[]
    for group in groups:
        sources=set()
        for task_id in group:
            task=campaign['tasks'][task_id]
            if (validate_task(task) is not None or task['id']!=task_id or task['split']!='development'
                or not task.get('success_criteria') or not isinstance(task.get('source_group'),str) or not task['source_group']):
                raise ValueError('all development tasks require valid scoped criteria and source lineage')
            for route in ('tool','local_direct'):
                if route not in task_routes(task) or route_scope_reason(task,route):raise ValueError('five-arm schedule requires eligible tool and local specialist routes for every case')
            sources.add(task['source_group'])
        source_sets.append(sources)
    if source_sets[0]&source_sets[1]:raise ValueError('development selection/comparison source groups overlap')
    if not {'tool','local_direct'}.issubset(config['routes']):raise ValueError('all five arms require configured tool and local_direct capability')
    n=len(ids);per=campaign['arm_budget'];keys={'max_requests','max_total_tokens','max_cycles','max_wall_s','max_storage_bytes'}
    if set(per)!=keys:raise ValueError('matched per-arm finite budget contract required')
    bounds={'max_requests':n,'max_total_tokens':n*config['max_tokens'],'max_cycles':2*n,
            'max_wall_s':2*n*config['timeout_s'],'max_storage_bytes':2*n*8*1024*1024}
    aggregate={'max_requests':4*n,'max_total_tokens':4*n*config['max_tokens'],'max_cycles':6*n,
               'max_wall_s':6*n*config['timeout_s'],'max_storage_bytes':6*n*8*1024*1024+1048576}
    for key in keys:
        value=per[key]
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value<bounds[key]:raise ValueError('per-arm cap cannot cover its finite worst-case schedule')
        if config[key]<aggregate[key]:raise ValueError('aggregate config cannot cover all five arms including full team cost')
    return {'valid':True,'cases_per_arm':n,'planned_components':6*n,'maximum_model_requests':4*n,
            'per_arm_upper_bound':bounds,'aggregate_upper_bound':aggregate}

def team_selection(members):
    """A fixed conservative rule, never a learned or gold-conditioned winner."""
    specialist,tool=members
    specialist_ok=specialist['verification']['valid'] and specialist['verification']['passed']
    tool_ok=tool['verification']['valid'] and tool['verification']['passed']
    try:agreement=json.loads(specialist['result']['output'])==json.loads(tool['result']['output'])
    except (ValueError,TypeError):agreement=False
    selected=0 if specialist_ok and tool_ok and agreement else 1 if tool_ok else None
    return {'rule':'verified-agreement-else-verified-tool-else-abstain-v1','agreement':agreement,
            'specialist_verified':bool(specialist_ok),'tool_verified':bool(tool_ok),'selected_member':selected}

def run_development_schedule(root,campaign,config,*,authorization_sha=None,simulation=False,real_manifest=None):
    """Use the existing Executor/Store for all actual component dispatches.

    Production entry is the approved real envelope. The explicit test adapter
    path records simulated requests and cannot claim real inference evidence.
    """
    from .orchestrator import worker_lock,config_hash,inspect_evidence
    if simulation:
        if config.get('adapter') is None or config.get('allow_fixtures') is not True:raise PermissionError('simulation requires an explicit test adapter')
    else:
        if not isinstance(real_manifest,dict) or config.get('adapter') is not None or config.get('allow_fixtures'):
            raise PermissionError('real development schedule requires the full validated approval envelope; a hash is not authority')
        from .orchestrator import load_config
        from .storage import Store
        checked=_validate_real(real_manifest)
        if (checked['protocol']!='paired-development-v1' or authorization_sha!=checked['contract_sha256']
            or config_hash(config)!=config_hash(load_config(checked['paths']['config_path']))
            or digest(campaign)!=digest(load_development_campaign(checked['paths']['campaign_manifest_path']))):
            raise PermissionError('approved development inputs differ from dispatch')
        ledger=Store(Path(__file__).resolve().parents[2]/'.hive'/'pressure-allocations')
        try:allocated=ledger.get('allocation:'+real_manifest['budget_id'])
        finally:ledger.close()
        expected={'manifest_sha256':digest(real_manifest),'root':str(Path(root).resolve()),'budget':real_manifest['budget']}
        if allocated!=expected:raise PermissionError('development dispatch lacks its bound approved allocation; use pressure real entry')
    plan=validate_development_schedule(campaign,config);root=Path(root)
    identity={'campaign_sha256':digest(campaign),'config_sha256':config_hash(config),'source_sha256':code_version()['source_sha256'],
              'authorization_sha256':authorization_sha,'simulation':simulation}
    with worker_lock(root):
        ex=Executor(root,config);store=ex.store
        try:
            previous=store.get('paired-development-identity')
            if previous is not None and previous!=identity:raise ValueError('development source/config/campaign/approval changed; budgets cannot reset')
            if previous is None:
                if store.jobs() or store.get('budget'):raise ValueError('new development campaign requires an unused explicitly allocated store')
                store.set('paired-development-identity',identity)
            if not simulation:
                pin={'model':config['model'],'digest':real_manifest['model_digest'],'kind':'ollama-manifest'}
                existing_pin=store.get('mission_model_identity')
                if existing_pin is not None and existing_pin!=pin:raise PermissionError('approved model pin changed')
                store.set('mission_model_identity',pin)
            ex.recover()
            saved=store.get('paired-development-report')
            if saved:
                report=store.read_artifact(saved);verify_development_report(report,store)
                _write_summary(root/'development-report.json',report)
                return report
            registry=BenchmarkRegistry(root/'benchmark-registry.sqlite3')
            try:
                cases=[]
                for task in campaign['tasks'].values():
                    public=request_view(task)
                    cases.append({'task_id':task['id'],'family_id':task['category'],'generator_or_source_id':task['source_group'],'split':'development',
                        'creation_time':campaign['creation_time'],'fixture_hash':digest(public),'gold_verifier_version':'hive-evaluator-v1',
                        'exposure_status':'unexposed','consumed_at':None,'public':public,'private':{'expected':task['expected']}})
                registry_sha=registry.register_manifest(campaign['id'],cases)
            finally:registry.close()
            rows=[];arm_results=[]
            def dispatch(arm,phase,task,member,requested,policy,learn):
                store.set('governing_policy',policy.snapshot());store.set('policy',policy.snapshot())
                key=f"paired:{campaign['id']}:{arm}:{phase}:{task['id']}:{member}"
                spec={'task':task,'route':requested,'learn_feedback':learn,'allow_retry':False,'campaign_arm':arm,'campaign_phase':phase,
                      'hypothesis':'preregistered five-arm development comparison; never production promotion'}
                job_id=store.enqueue_once(key,spec);job=store.get_job(job_id)
                cached=job.get('result') and job['result'].get('evidence_ref')
                if not cached:
                    decision=ex._decision(task,requested,Policy(state=policy.snapshot()))
                    route=decision['selected']
                    if route is None:raise PermissionError('development component has no eligible route: '+str(decision['error']))
                    usage=store.get('paired-reservation:'+arm,{'cycles':0,'requests':0,'tokens_reserved':0,'wall_s_reserved':0,'storage_reserved':0})
                    proposed={**usage,'cycles':usage['cycles']+1,'requests':usage['requests']+int(route.startswith('local_')),
                        'tokens_reserved':usage['tokens_reserved']+(config['max_tokens'] if route.startswith('local_') else 0),
                        'wall_s_reserved':usage['wall_s_reserved']+config['timeout_s'],'storage_reserved':usage['storage_reserved']+8*1024*1024}
                    cap=campaign['arm_budget']
                    for counter,limit in (('cycles','max_cycles'),('requests','max_requests'),('tokens_reserved','max_total_tokens'),('wall_s_reserved','max_wall_s'),('storage_reserved','max_storage_bytes')):
                        if proposed[counter]>cap[limit]:raise ValueError('matched per-arm budget exhausted; reservations never refill')
                    if ex.barrier(route):raise ValueError('aggregate development budget exhausted before dispatch')
                    store.set('paired-reservation:'+arm,proposed)
                    outcome=ex.run_one(job_id=job_id)
                    job=store.get_job(job_id)
                    if not outcome or not (job.get('result') or {}).get('evidence_ref'):raise ValueError('development dispatch stopped; saved allocation retained')
                evidence=inspect_evidence(store,job_id)
                if learn:
                    if store.get('feedback:'+job_id)!=(job['result']['evidence_ref']):raise ValueError('trusted training feedback missing or mismatched')
                    if cached:
                        v=evidence['verification'];policy.observe(task['category'],evidence['route'],v['quality'],evidence['utility'],valid=v['valid'],split=task['split'])
                    else:policy=Policy(state=store.get('policy'))
                return {'job_id':job_id,'evidence_ref':job['result']['evidence_ref'],'route':evidence['route'],
                    'task':task,'result':evidence['result'],'verification':evidence['verification'],'feedback_ref':store.get('feedback:'+job_id)},policy
            for arm in ARMS:
                policy=Policy(state=campaign['parent_policy']);before=policy.snapshot();arm_rows=[]
                for phase in ('train','comparison'):
                    for task_id in campaign[phase]:
                        task=campaign['tasks'][task_id];members=[]
                        routes=(['local_direct','tool'] if arm=='fixed_team' else ['tool'] if arm=='fixed_strongest_tool'
                                else ['local_direct'] if arm=='fixed_specialist' else [None])
                        for index,route in enumerate(routes):
                            component,policy=dispatch(arm,phase,task,str(index),route,policy,arm=='adaptive' and phase=='train')
                            members.append(component)
                        arbitration=team_selection(members) if arm=='fixed_team' else None
                        selected=arbitration['selected_member'] if arbitration else 0
                        final=members[selected] if selected is not None else None
                        row={'arm':arm,'phase':phase,'task_id':task_id,'source_group':task['source_group'],'members':members,
                             'final_member':selected,'quality':final['verification']['quality'] if final else 0,
                             'arbitration':arbitration,'policy_sha256':digest(policy.snapshot())}
                        rows.append(row);arm_rows.append(row)
                store.set('paired-policy:'+arm,policy.snapshot())
                arm_results.append({'arm':arm,'policy_before':before,'policy_after':policy.snapshot(),'learning_enabled':arm=='adaptive',
                    'declared_budget':campaign['arm_budget'],'reservation':store.get('paired-reservation:'+arm),
                    'source_groups':[r['source_group'] for r in arm_rows],'comparison_quality':[r['quality'] for r in arm_rows if r['phase']=='comparison']})
            report={'version':1,'protocol':'paired-development-v1','identity':identity,'campaign':campaign,'plan':plan,'registry_sha256':registry_sha,
                'mode':'synthetic_adapter' if simulation else 'real','actual_inference_calls':0 if simulation else ex._budget()['requests'],
                'logical_request_counter_scope':'simulated adapter requests' if simulation else 'conservatively charged real local requests',
                'budget':ex._budget(),'observations':rows,'arm_results':arm_results,'research_status':'UNTESTED',
                'scope':'development protocol only; full specialist and fixed-team components dispatched; no sealed-study acceptance or promotion'}
            verify_development_report(report,store)
            encoded=json.dumps(report,sort_keys=True,separators=(',',':')).encode()
            if sum(p.stat().st_size for p in root.rglob('*') if p.is_file())+len(encoded)>config['max_storage_bytes']:raise ValueError('report exceeds aggregate storage budget')
            store.set('paired-development-report',store.put_artifact(report))
            normalized=json.loads(json.dumps(report));_write_summary(root/'development-report.json',normalized)
            return normalized
        finally:ex.close()

def verify_development_report(report,store):
    """Replay jobs and trusted feedback; independent tests add adversarial checks."""
    from .orchestrator import inspect_evidence
    campaign=report['campaign'];expected=set();seen=set()
    for arm in ARMS:
        policy=Policy(state=campaign['parent_policy'])
        arm_record=next(x for x in report['arm_results'] if x['arm']==arm)
        for phase in ('train','comparison'):
            for task_id in campaign[phase]:
                expected.add((arm,phase,task_id))
                row=next(x for x in report['observations'] if (x['arm'],x['phase'],x['task_id'])==(arm,phase,task_id));seen.add((arm,phase,task_id))
                routes=['local_direct','tool'] if arm=='fixed_team' else ['tool'] if arm=='fixed_strongest_tool' else ['local_direct'] if arm=='fixed_specialist' else None
                if len(row['members'])!=(2 if arm=='fixed_team' else 1) or row['source_group']!=campaign['tasks'][task_id]['source_group']:raise ValueError('development arm membership or source pairing changed')
                arbitration=team_selection(row['members']) if arm=='fixed_team' else None
                selected=arbitration['selected_member'] if arbitration else 0
                if row.get('arbitration')!=arbitration or row['final_member']!=selected:raise ValueError('fixed team arbitration changed')
                for i,member in enumerate(row['members']):
                    evidence=inspect_evidence(store,member['job_id'])
                    if evidence['task']!=campaign['tasks'][task_id] or evidence['result']!=member['result'] or evidence['verification']!=member['verification'] or evidence['route']!=member['route']:raise ValueError('development component differs from journal')
                    job=store.get_job(member['job_id'])
                    if job['result']['evidence_ref']!=member['evidence_ref'] or job['spec'].get('campaign_arm')!=arm or job['spec'].get('campaign_phase')!=phase:raise ValueError('development job lineage mismatch')
                    if routes is not None and member['route']!=routes[i]:raise ValueError('fixed component route changed')
                    if arm=='adaptive' and phase=='train':
                        if store.get('feedback:'+member['job_id'])!=member['evidence_ref']:raise ValueError('development trusted feedback mismatch')
                        v=evidence['verification'];policy.observe(evidence['task']['category'],member['route'],v['quality'],evidence['utility'],valid=v['valid'],split=evidence['task']['split'])
                    elif store.get('feedback:'+member['job_id']) is not None:raise ValueError('frozen/selection task contaminated learner')
                expected_quality=row['members'][selected]['verification']['quality'] if selected is not None else 0
                if row['quality']!=expected_quality or row['policy_sha256']!=digest(policy.snapshot()):raise ValueError('development quality or policy trace changed')
        if digest(policy.snapshot())!=digest(arm_record['policy_after']) or digest(store.get('paired-policy:'+arm))!=digest(policy.snapshot()):raise ValueError('development policy cannot reconstruct')
        if arm!='adaptive' and digest(arm_record['policy_before'])!=digest(arm_record['policy_after']):raise ValueError('learning-off/fixed policy changed')
        if arm_record['reservation']!=store.get('paired-reservation:'+arm) or arm_record['declared_budget']!=campaign['arm_budget']:raise ValueError('development arm resource reservation changed')
    if seen!=expected or len(report['observations'])!=len(expected) or report['budget']!=store.get('budget'):raise ValueError('development evidence incomplete or budget changed')
    return {'verified':True,'observations':len(seen),'research_status':'UNTESTED'}

def generate(test_id, seed=None):
    """Public deterministic generators; not sealed research tasks."""
    c=contract(test_id); seed=c['seed'] if seed is None else seed
    categories={'H01':['math']*5,'H02':['math','math'],'H03':['math','adaptation'],'H04':['math'],'H05':['hallucination'],'H06':['math'],'H07':['math'],'H08':['math','adaptation','math','tool_routing'],'H09':['tool_routing','math'],'H10':['math'],'H11':['code_repair','hallucination','coordination']}[test_id]
    tasks=[]
    for i,cat in enumerate(categories):
        t=_task('development',cat,2 if test_id=='H05' else i,seed)
        t['success_criteria']='Independent exact verifier passes; no inference or external effects.'
        t['source_group']=f'{test_id}-source-{i}'
        if test_id=='H01':
            t['input']['a']=10**(i+1)+i; t['input']['b']=13+i
            t['expected']={'answer':t['input']['a']*t['input']['b']}
            t['prompt']=f"Multiply {t['input']['a']} by {t['input']['b']}."
        if test_id=='H02':
            t['input']['a']=-(31+i);t['input']['b']=0 if i==0 else -17
            t['expected']={'answer':t['input']['a']*t['input']['b']};t['prompt']='Multiply the supplied signed integers.'
        tasks.append(t)
    if test_id=='H09':
        tasks[1]['input']['a']=tasks[0]['expected']['result'];tasks[1]['expected']['answer']=tasks[1]['input']['a']*tasks[1]['input']['b']
    if test_id=='H11':
        from .video_mission import parse_srt, _tasks
        source='1\n00:00:00,000 --> 00:00:01,000\nPressure fixture only.\n\n2\n00:00:01,000 --> 00:00:02,000\nEditorial review remains required.\n'
        normalized,cues=parse_srt(source)
        captions,clips=_tasks(source,normalized,cues,3000,test_id+'-video-fixture')
        for task in (captions,clips):
            task['source_group']=test_id+'-video-source';tasks.append(task)
    return tasks

def _details(test_id,tasks):
    p=Policy(mode='greedy');before=p.snapshot()
    if test_id in ('H05','H10'):
        accepted=p.observe('math','fixture_bad',1,999,valid=False,split='development')
        return {'injection':{'claimed_quality':1,'claimed_utility':999,'trusted':False},'accepted':accepted,'policy_before':before,'policy_after':p.snapshot()}
    if test_id=='H04': return {'removed_route':'tool','remaining_permissions':['local_direct'],'safe_action':'abstain'}
    if test_id=='H06': return {'model_budget':0,'tool_budget':64,'expected_requests':0}
    if test_id=='H07': return {'specialist_outputs':[{'answer':0},{'answer':tasks[0]['expected']['answer']}],'arbitration':'objective_verifier'}
    if test_id=='H08':
        p.observe('math','tool',1,1);a=p.snapshot();p.observe('adaptation','tool',1,1)
        return {'waves':['A','B','A_revisit'],'after_A':a,'after_B':p.snapshot(),'revisit_source':tasks[-1]['source_group']}
    if test_id=='H09':return {'dependency':{'parent_task':tasks[0]['id'],'child_task':tasks[1]['id'],'bound_value':tasks[1]['input']['a']}}
    return {'complexities':[len(str(t['input'])) for t in tasks], 'mutation':'signed-zero-boundaries' if test_id=='H02' else 'none','families':[t['category'] for t in tasks]}

def _probe_task(root,task,*,initial_policy=None,learn=True,route=None,routes=None):
    """A trusted fixture probe through the normal journal and dispatcher."""
    routes=list(routes or ['tool'])
    cfg={**DEFAULT_CONFIG,'routes':routes,'allow_fixtures':route=='fixture_bad' or 'fixture_bad' in routes,
         'max_retries':0,'timeout_s':2,'max_requests':0,'max_total_tokens':0}
    ex=Executor(root,cfg)
    try:
        if initial_policy is not None and ex.store.get('governing_policy') is None:
            ex.store.set('governing_policy',initial_policy)
        policy=Policy(state=ex.store.get('governing_policy') or Policy(version=2).snapshot())
        before=policy.snapshot()
        ex.store.set('governing_policy',before)
        if ex.store.get('policy') is None:ex.store.set('policy',before)
        job=ex.store.enqueue_once('pressure-probe:'+task['id'],{'task':task,'route':route,'allow_retry':False,'learn_feedback':learn})
        current=ex.store.get_job(job)
        if current['result'] is None:ex.run_one()
        current=ex.store.get_job(job);ref=current['result']['evidence_ref'];bundle=ex.store.read_artifact(ref)
        # Reuse Executor's atomic, idempotent trusted-feedback transition.
        policy=Policy(state=ex.store.get('policy') if learn else ex.store.get('governing_policy'))
        ex.store.set('governing_policy',policy.snapshot())
        return {'job_id':job,'task':task,'result':bundle['result'],'verification':bundle['verification'],
                'evidence_ref':ref,'feedback_ref':ex.store.get('feedback:'+job),
                'policy_before':before,'policy_after':policy.snapshot(),
                'policy_before_sha256':digest(before),'policy_after_sha256':digest(policy.snapshot()),
                'budget':ex._budget(),'pid':os.getpid()}
    finally:ex.close()

def _resume_wave(root):
    """Static fresh-process fixture entry; never runs candidate-selected code."""
    from .storage import Store
    store=Store(root)
    try:task=store.get('pressure-next-task');learn=store.get('pressure-learn-enabled')
    finally:store.close()
    value=_probe_task(root,task,learn=learn)
    Path(root,'fresh-process-wave.json').write_text(json.dumps(value),encoding='utf-8')

def _crash_wave(root,point):
    """Kill the trusted fixture worker at the evidence-commit boundary."""
    from .storage import Store
    store=Store(root)
    try:task=store.get('pressure-crash-task')
    finally:store.close()
    ex=Executor(root,{**DEFAULT_CONFIG,'routes':['tool'],'max_retries':0,'timeout_s':2,'max_requests':0,'max_total_tokens':0})
    original=ex.store.put_artifact
    def fault(value):
        if isinstance(value,dict) and {'result','verification','job_id'}.issubset(value):
            if point=='before':os._exit(73)
            ref=original(value);os._exit(74)
        return original(value)
    ex.store.put_artifact=fault
    ex.run_one()

def _code_gauntlet(root):
    """Exercise the shared code mission with explicit synthetic receipts only."""
    from .code_verifier import _git
    from .mission import run_mission_manifest
    from .adapters.isolation import FixtureIsolation
    repo=root/'code-source';repo.mkdir(parents=True,exist_ok=True)
    worker='runtime.py';trusted='trusted/cases.json'
    cases=[{'id':'positive','args':[2,3],'kwargs':{},'expected':5},
           {'id':'signed','args':[-4,1],'kwargs':{},'expected':-3}]
    (repo/'trusted').mkdir(exist_ok=True)
    (repo/worker).write_text('def combine(a, b):\n    return a - b\n',encoding='utf-8',newline='\n')
    (repo/trusted).write_text(json.dumps(cases,sort_keys=True),encoding='utf-8')
    hooks=repo/'empty-hooks';hooks.mkdir(exist_ok=True)
    git=['git','-c','core.autocrlf=false','-c','core.hooksPath='+str(hooks.resolve()),'-c','commit.gpgsign=false']
    env={**os.environ,'GIT_AUTHOR_DATE':'2000-01-01T00:00:00Z','GIT_COMMITTER_DATE':'2000-01-01T00:00:00Z'}
    for args in (['init','--quiet',str(repo)],['-C',str(repo),'add','--',worker,trusted],
            ['-C',str(repo),'-c','user.name=HIVE trusted fixture','-c','user.email=fixture@invalid','commit','--quiet','-m','Frozen synthetic code fixture']):
        subprocess.run(git+args,env=env,check=True,capture_output=True,timeout=15)
    revision=_git(repo,'rev-parse','HEAD')
    archive=_git(repo,'archive','--format=tar',revision,binary=True)
    content='def combine(a, b):\n    return a + b\n'
    runs=[]
    for control in ('positive','negative'):
        manifest={'schema_version':1,'id':'H11-code-'+control,
            'repo':{'path':str(repo),'revision':revision,'source_sha256':hashlib.sha256(archive).hexdigest()},
            'worker_files':[worker],'allowlist':[worker],
            'patches':[{'id':'concrete-fixture-patch','path':worker,'content':content,'sha256':hashlib.sha256(content.encode()).hexdigest()}],
            'verifier':{'protocol':'json_function_v1','path':trusted,'sha256':hashlib.sha256(_git(repo,'show',revision+':'+trusted,binary=True)).hexdigest(),
                        'module':'runtime','function':'combine','cases':cases},
            'image':{'reference':'synthetic/not-executed','digest':'sha256:'+'0'*64},
            'limits':{'timeout_s':2,'memory_mb':64,'cpu_count':1,'pids':16,'output_bytes':4096},
            'network':'none','mounts':'read_only_source_clean_copy',
            'synthetic_fixture':{'synthetic':True,'id':'H11-'+control,'exit_code':0,
                    'results':[{'id':case['id'],'value':case['expected'] if control=='positive' else 999} for case in cases]}}
        location=root/('code-'+control);location.mkdir(parents=True,exist_ok=True)
        path=location/'manifest.json';path.write_text(json.dumps(manifest),encoding='utf-8')
        dag={'schema_version':1,'id':'H11-shared-'+control,'stages':[
            {'id':'code','family':'code','manifest':manifest,'depends_on':[],'max_retries':0}]}
        dag_path=location/'mission.json';dag_path.write_text(json.dumps(dag),encoding='utf-8')
        shared=run_mission_manifest(dag_path,location/'store',isolation=FixtureIsolation())
        output=shared['stages']['code']['result']
        runs.append({'control':control,'manifest':manifest,'mission_report':output,'store':'code-'+control+'/store',
                     'shared_mission':shared,'entrypoint':'hive.mission.run_mission_manifest','execution':'synthetic-only; no repository code executed'})
    return runs

def _behavior(test_id, tasks, root):
    """Execute the distinct pressure operation, retaining reproducible inputs.

    These probes test mechanisms. They are deliberately separate from estimates
    of transfer, optimal curricula or real specialist performance.
    """
    from .governor import decide
    from .experiment_runner import execute
    p = Policy(mode='ucb', version=2)
    cfg={**DEFAULT_CONFIG,'allow_fixtures':True,'routes':['tool'],'max_retries':0,'max_requests':0,'max_total_tokens':0}
    t=tasks[0]
    def decision(task, policy, routes, checks=None):
        return decide(task,candidates=routes,requested_route=None,policy=policy,
                      policy_hash=digest(policy.snapshot()),source_hash=code_version()['source_sha256'],
                      config_hash=digest(cfg),task_hash=digest(task),route_checks=checks or {},allow_fixtures=True)
    def checked(task, output):
        result={'output':json.dumps(output),'latency_s':0.0,'tokens':0,'model':'synthetic-pressure-subject'}
        return {'task':task,'result':result,'verification':verify(task,result)}
    if test_id=='H01':
        curricula=[]
        def metric_task(category,index,seed,label):
            value=_task('development',category,index,seed);value['source_group']='H01-'+label
            value['success_criteria']='Exact synthetic metric probe; not scientific generalization evidence.'
            return value
        shuffled=list(tasks);random.Random(contract(test_id)['seed']).shuffle(shuffled)
        for name,order in [('fixed',tasks),('seeded_random',shuffled),('learning_progress',tasks)]:
            ex=Executor(root/('curriculum-'+name),cfg)
            try:
                metric_root=root/('metrics-'+name)
                transfer_before=_probe_task(metric_root/'before',metric_task('coordination',0,9001,'transfer-before'),
                    initial_policy=Policy(version=2).snapshot(),learn=False,route='tool',routes=['tool','fixture_bad'])
                outcomes=[];pending=list(order);competence=1
                while pending:
                    # Progress scheduling chooses nearest uncompleted rung to
                    # current verified competence; outcome updates the target.
                    task=(min(pending,key=lambda x:abs((tasks.index(x)+1)-competence)) if name=='learning_progress' else pending[0])
                    pending.remove(task)
                    job=ex.enqueue(task,route='tool'); receipt=ex.run_one()
                    bundle=ex.store.read_artifact(receipt['evidence_ref'])
                    level=tasks.index(task)+1
                    outcomes.append({'level':level,'competence_before':competence,'job_id':job,'task':task,'result':bundle['result'],'verification':bundle['verification']})
                    if name=='learning_progress':competence=max(1,min(5,level+(1 if bundle['verification']['passed'] else -1)))
                trained=ex.store.get('policy')
                transfer_after=_probe_task(metric_root/'after',metric_task('coordination',1,9002,'transfer-after'),initial_policy=trained,learn=False,route='tool',routes=['tool','fixture_bad'])
                before_a=_probe_task(metric_root/'after',metric_task('math',0,9003,'retention-before'),learn=False,route='tool',routes=['tool','fixture_bad'])
                intervening_b=_probe_task(metric_root/'after',metric_task('adaptation',0,9004,'intervening-B'),learn=True,route='tool',routes=['tool','fixture_bad'])
                after_task=metric_task('math',1,9005,'retention-after')
                after_a=_probe_task(metric_root/'after',after_task,learn=False,route='tool',routes=['tool','fixture_bad'])
                wrong=copy.deepcopy(after_task);wrong['id']+='-negative-control'
                negative=_probe_task(metric_root/'after',wrong,learn=False,route='fixture_bad',routes=['tool','fixture_bad'])
                metrics={'transfer_before':transfer_before,'transfer_after':transfer_after,'retention_before':before_a,
                         'intervening_B':intervening_b,'retention_after':after_a,'retention_negative':negative,
                         'store_before':'metrics-'+name+'/before','store_after':'metrics-'+name+'/after'}
                curricula.append({'name':name,'outcomes':outcomes,'usage':ex._budget(),'metric_probes':metrics})
            finally:ex.close()
        dependent=copy.deepcopy(tasks[1]);first=execute(tasks[0],'tool',cfg)
        dependent['input']['a']=json.loads(first['output'])['answer'];dependent['expected']['answer']=dependent['input']['a']*dependent['input']['b']
        dep_result=execute(dependent,'tool',cfg)
        removed=copy.deepcopy(tasks[3]);removed['permissions']={'version':1,'routes':[]}
        novel=_task('development','coordination',9,contract(test_id)['seed']);novel['success_criteria']='Preserve every novel task ID once.'
        novel_result=execute(novel,'tool',cfg)
        curves=[]
        for arm in curricula:
            successes=0;checkpoints=[]
            for i,row in enumerate(arm['outcomes'],1):
                successes+=int(row['verification']['passed'])
                checkpoints.append({'completed':i,'verified_successes':successes,'cumulative_quality':successes/i})
            curves.append({'curriculum':arm['name'],'checkpoints':checkpoints,
                           'area_under_learning_curve':sum(x['cumulative_quality'] for x in checkpoints)/len(checkpoints),
                           'evidence_scope':'synthetic engineering fixture only'})
        return {'operation':'curriculum','curricula':curricula,'ordered_task_ids':[x['id'] for x in tasks],
                'levels':[len(str(x['input']['a'])) for x in tasks],
                'reverse_control':[x['id'] for x in reversed(tasks)],
                'metrics':{'learning_curve':curves,
                           'transfer':{'status':'SYNTHETIC_MEASURED','rows':[{'curriculum':a['name'],'before_quality':int(a['metric_probes']['transfer_before']['verification']['passed']),
                               'after_quality':int(a['metric_probes']['transfer_after']['verification']['passed']),
                               'delta':int(a['metric_probes']['transfer_after']['verification']['passed'])-int(a['metric_probes']['transfer_before']['verification']['passed']),'n_before':1,'n_after':1} for a in curricula]},
                           'forgetting':{'status':'SYNTHETIC_MEASURED','rows':[{'curriculum':a['name'],'before_quality':int(a['metric_probes']['retention_before']['verification']['passed']),
                               'after_quality':int(a['metric_probes']['retention_after']['verification']['passed']),
                               'retention_delta':int(a['metric_probes']['retention_after']['verification']['passed'])-int(a['metric_probes']['retention_before']['verification']['passed']),
                               'negative_quality':int(a['metric_probes']['retention_negative']['verification']['passed']),'n_before':1,'n_after':1} for a in curricula]},
                           'scope':'executed synthetic metric infrastructure; no useful gain, transfer or research acceptance inferred','research_status':'UNTESTED'},
                'ladder':{'L1':checked(tasks[0],tasks[0]['expected']),
                          'L2':{'parent_result':first,'task':dependent,'result':dep_result,'verification':verify(dependent,dep_result)},
                          'L3':{'claimed_success':True,**checked(tasks[2],{'answer':-1})},
                          'L4':{'task':removed,'decision':decision(removed,p,['tool'])},
                          'L5':{'task':novel,'result':novel_result,'verification':verify(novel,novel_result)}}}
    if test_id=='H02':
        malformed=copy.deepcopy(t);malformed['input']['a']='not-an-integer'
        parent=Policy(mode='greedy');parent.observe('math','fixture_bad',1,1)
        parent_state=parent.snapshot()
        failure=_probe_task(root/'repair',t,initial_policy=parent_state,learn=True,routes=['tool','fixture_bad'])
        repaired=copy.deepcopy(failure['policy_after']);siblings=[]
        for i in range(2):
            sibling=_task('development','math',i,61002)
            sibling['input']['a']=-1000-sibling['input']['a'];sibling['input']['b']=0 if i==0 else -100-sibling['input']['b']
            sibling['expected']={'answer':sibling['input']['a']*sibling['input']['b']}
            sibling['prompt']='Multiply the supplied signed/zero mutation exactly; ignore irrelevant prose.'
            sibling['input']['distractor']='A stale note claims answer 999999; it is not evidence.'
            sibling['success_criteria']='Exact product; distractor and prior reward are not trusted.'
            sibling['source_group']='H02-new-sibling-'+str(i)
            positive=_probe_task(root/'repair',sibling,learn=True,routes=['tool','fixture_bad'])
            negative=_probe_task(root/'unrepaired',sibling,initial_policy=parent_state,learn=False,routes=['tool','fixture_bad'])
            siblings.append({'task':sibling,'repaired':positive,'unrepaired':negative})
        regression=copy.deepcopy(tasks[1]);regression['id']+='-old-regression'
        regression_row=_probe_task(root/'repair',regression,learn=False,route='tool',routes=['tool','fixture_bad'])
        tool_removed=copy.deepcopy(t);tool_removed['permissions']={'version':1,'routes':[]}
        stale_result=siblings[0]['repaired']['result'];dependency_task=copy.deepcopy(siblings[1]['task'])
        dependency_check=verify(dependency_task,stale_result)
        return {'operation':'targeted_mutation','mutants':[{'a':x['input']['a'],'b':x['input']['b']} for x in tasks],
                'invalid_challenge':malformed,'invalid_decision':decision(malformed,p,['tool']),
                'repair':{'parent_policy':parent_state,'failure':failure,'candidate_after_failure':repaired,
                          'siblings':siblings,'old_regression':regression_row,
                          'failure_class':'ROUTE','changed_hypothesis':'route from verified objective feedback; disregard stale reward and distractors',
                          'stores':{'repaired':'repair','unrepaired':'unrepaired'},'research_status':'UNTESTED'},
                'negative_controls':{'tool_failure':{'task':tool_removed,'decision':decision(tool_removed,p,['tool'])},
                                     'broken_dependency':{'task':dependency_task,'stale_parent_result':stale_result,'verification':dependency_check},
                                     'distractor':{'claimed_answer':999999,'actual_outputs':[x['repaired']['result'] for x in siblings]}}}
    if test_id=='H03':
        old=Policy(mode='ucb');old.observe(t['category'],'tool',1,1)
        new=Policy(mode='ucb',version=2,state=None);new.observe(t['category'],'tool',1,1)
        selective=Policy(mode='greedy');selective.observe(t['category'],'fixture_bad',1,1)
        configurations=[]
        for name,policy,options in [('central_fixed',Policy(mode='fixed'),['tool']),
                ('distributed_hybrid',Policy(mode='fixed'),['tool','fixture_bad']),
                ('exact_tool_first',new,['tool','fixture_bad']),
                ('selective_verifier',selective,['fixture_bad','tool']),
                ('memory_aware',Policy(mode='greedy',version=2),['fixture_bad','tool']),
                ('exploratory',old,['tool','fixture_bad'])]:
            location=root/('config-'+name);ex=Executor(location,{**cfg,'routes':options})
            try:
                ex.store.set('governing_policy',policy.snapshot())
                if name=='memory_aware':ex.store.set('untrusted-memory',{'preferred_route':'fixture_bad','trusted':False})
                job=ex.store.enqueue({'task':t,'route':None,'allow_retry':False,'learn_feedback':False})
                receipt=ex.run_one();bundle=ex.store.read_artifact(receipt['evidence_ref']);out=bundle['result'];interventions=[]
                if name=='selective_verifier' and not bundle['verification']['passed']:
                    interventions.append({'action':'objective_failure_then_tool_fallback','job_id':job,'evidence_ref':receipt['evidence_ref']})
                    job=ex.store.enqueue({'task':t,'route':'tool','allow_retry':False,'learn_feedback':False})
                    receipt=ex.run_one();bundle=ex.store.read_artifact(receipt['evidence_ref']);out=bundle['result']
                if name=='distributed_hybrid':
                    other=ex.store.enqueue({'task':t,'route':'fixture_bad','allow_retry':False,'learn_feedback':False})
                    second=ex.run_one();other_bundle=ex.store.read_artifact(second['evidence_ref'])
                    interventions.append({'action':'independent_child_disagreement_arbitrated_by_verifier','job_id':other,'evidence_ref':second['evidence_ref'],'verification':other_bundle['verification'],'selected_job_id':job})
                if name=='memory_aware':
                    interventions.append({'action':'reject_untrusted_route_memory','probe':checked(t,{'answer':-1}),'used_route':bundle['route']})
                choice={'selected':bundle['route'],'receipt':bundle['decision']}
                row={'name':name,'policy':policy.snapshot(),'decision':choice,'task':t,'result':out,'verification':bundle['verification'],
                     'job_id':job,'evidence_ref':receipt['evidence_ref'],'store':'config-'+name,'usage':ex._budget(),'interventions':interventions}
            finally:ex.close()
            configurations.append(row)
        return {'operation':'configuration_tournament','configurations':configurations,'parent_policy':old.snapshot(),'candidate_policy':new.snapshot(),
                'parent_decision':decision(t,old,['tool','fixture_bad']),
                'candidate_decision':decision(t,new,['tool','fixture_bad']),
                'promotion':'quarantined'}
    if test_id=='H04':
        removed=copy.deepcopy(t);removed['permissions']={'version':1,'routes':[]}
        crashes=[]
        crash_config={**DEFAULT_CONFIG,'routes':['tool'],'max_retries':0,'timeout_s':2,'max_requests':0,'max_total_tokens':0}
        for point in ('before','after'):
            location=root/('crash-'+point);ex=Executor(location,crash_config)
            try:
                ex.store.set('pressure-crash-task',t);job=ex.enqueue(t,route='tool')
            finally:ex.close()
            proc=subprocess.run([sys.executable,'-c','import sys;from hive.pressure import _crash_wave;_crash_wave(sys.argv[1],sys.argv[2])',str(location),point],capture_output=True,timeout=15)
            ex=Executor(location,crash_config)
            try:
                interrupted=ex.store.get_job(job);budget_before=ex._budget();recovered=ex.recover();result=ex.run_one()
                finished=ex.store.get_job(job);bundle=ex.store.read_artifact(result['evidence_ref'])
                crashes.append({'point':point,'worker_exit_code':proc.returncode,'job_id':job,'interrupted_state':interrupted['state'],
                    'recovered':recovered,'history':finished['history'],'budget_before':budget_before,'budget_after':ex._budget(),
                    'task':t,'result':bundle['result'],'verification':bundle['verification'],'evidence_ref':result['evidence_ref']})
            finally:ex.close()
        return {'operation':'capability_removal','task':removed,
                'decision':decision(removed,p,['tool']),
                'control_decision':decision(t,p,['tool']),'crash_recovery':crashes,'effects':'deterministic builtins only; no irreversible external effects'}
    if test_id=='H05':
        before=p.snapshot(); forged={'answer':'stale-memory-value','supported':True,'ambiguous':False}
        probe=checked(t,forged)
        accepted=p.observe(t['category'],'fixture_bad',1,999,valid=probe['verification']['passed'])
        location=root/'memory-sequence'
        from .storage import Store
        store=Store(location)
        try:store.set('untrusted-memory',{'value':'stale-memory-value','claimed_quality':1,'trusted':False})
        finally:store.close()
        first=_probe_task(location,t)
        unrelated=_task('development','math',7,contract(test_id)['seed']);unrelated['success_criteria']='Exact unrelated product; stale memory cannot change evidence.'
        unrelated['source_group']='H05-unrelated-source';second=_probe_task(location,unrelated)
        return {'operation':'memory_contamination','injected_record':forged,'probe':probe,'sequential_tasks':[first,second],
                'accepted':accepted,'policy_before':before,'policy_after':p.snapshot()}
    if test_id=='H06':
        executor=Executor(root/'famine-probe', {**cfg,'max_cycles':1,'max_requests':1,'max_total_tokens':1})
        try:
            executor.store.set('budget',{'requests':1,'tokens_reserved':1,'tokens_actual':0,'wall_s':0.0,'cycles':0})
            model_barrier=executor.barrier('local_direct');tool_barrier=executor.barrier('tool')
            executor.store.set('budget',{'requests':1,'tokens_reserved':1,'tokens_actual':0,'wall_s':0.0,'cycles':1})
            return {'operation':'resource_famine','model_barrier':model_barrier,'tool_barrier':tool_barrier,
                    'exhausted_barrier':executor.barrier('tool'),'budget_after':executor._budget()}
        finally:executor.close()
    if test_id=='H07':
        candidates=[checked(t,{'answer':0}),checked(t,t['expected']),checked(t,{'answer':0})]
        accepted=[i for i,x in enumerate(candidates) if x['verification']['passed']]
        return {'operation':'disagreement','candidates':candidates,'majority_index':0,'selected_index':accepted[0] if len(accepted)==1 else None}
    if test_id=='H08':
        parent=p.snapshot();p.observe('math','tool',1,1);after_a=p.snapshot();p.observe('adaptation','tool',1,1)
        pre_future=p.snapshot();future_accepted=p.observe('math','fixture_bad',1,999,split='future')
        restored=Policy(state=p.snapshot())
        waves=[]
        from .storage import Store
        for arm,learning in [('adaptive',True),('learning_disabled',False)]:
            location=root/('chronological-'+arm)
            initial=Policy(version=2).snapshot() if learning else Policy(mode='fixed').snapshot()
            executed=[_probe_task(location,tasks[0],initial_policy=initial,learn=learning),_probe_task(location,tasks[1],learn=learning)]
            store=Store(location)
            try:store.set('pressure-next-task',tasks[2]);store.set('pressure-learn-enabled',learning)
            finally:store.close()
            proc=subprocess.run([sys.executable,'-c','import sys;from hive.pressure import _resume_wave;_resume_wave(sys.argv[1])',str(location)],capture_output=True,timeout=20)
            if proc.returncode:raise RuntimeError('fresh-process chronological fixture failed: '+proc.stderr.decode(errors='replace')[:300])
            executed.append(json.loads((location/'fresh-process-wave.json').read_text()))
            executed.append(_probe_task(location,tasks[3],learn=learning))
            waves.append({'arm':arm,'learning_enabled':learning,'initial_policy':initial,'executed':executed,'sequence':['A','B','A_revisit','C_new'],'fresh_process':True})
        return {'operation':'chronological_retention','waves':waves,'parent':parent,'after_A':after_a,'after_B':pre_future,
                'future_accepted':future_accepted,'restored':restored.snapshot(),
                'revisit_decision':decision(tasks[2],restored,['tool','fixture_bad'])}
    if test_id=='H09':
        parent=execute(tasks[0],'tool',cfg); child=copy.deepcopy(tasks[1]);child['input']['a']=json.loads(parent['output'])['result']
        child['expected']['answer']=child['input']['a']*child['input']['b'];result=execute(child,'tool',cfg)
        broken=copy.deepcopy(child);broken['input']['a']+=1
        broken['expected']['answer']=broken['input']['a']*broken['input']['b']
        return {'operation':'recombination','parent':{'task':tasks[0],'result':parent},
                'child':{'task':child,'result':result,'verification':verify(child,result)},
                'broken_dependency':{'task':broken,'result':result,'verification':verify(broken,result)}}
    if test_id=='H10':
        result=execute(t,'fixture_bad',cfg);v=verify(t,result);before=p.snapshot()
        accepted=p.observe(t['category'],'fixture_bad',1,999,valid=v['passed'])
        return {'operation':'false_reward','self_report':{'tests_passed':True,'reward':999},
                'probe':{'task':t,'result':result,'verification':v},'feedback_accepted':accepted,
                'policy_before':before,'policy_after':p.snapshot(),'promotion':'rejected' if not v['passed'] else 'quarantined'}
    return {'operation':'gauntlet','families':[x['category'] for x in tasks],'code_missions':_code_gauntlet(root),
            'real_acceptance':'BLOCKED: fresh approved video sources and isolated repositories required',
            'editorial_status':'pending','level_A':'UNTESTED'}

def run(test_id, manifest=None, root=None, mode='fixture'):
    started=time.monotonic()
    if mode not in ('fixture','real'): raise ValueError('mode must be fixture or real')
    if mode=='real': return _run_real(test_id,manifest,root)
    manifest=contract(test_id) if manifest is None else manifest
    validate(manifest)
    if manifest['test_id']!=test_id:raise ValueError('test identity mismatch')
    root=Path(root or '.hive/pressure')/test_id
    root.mkdir(parents=True,exist_ok=True)
    target=root/'report.json'
    identity={'contract_sha256':digest(manifest),'source_sha256':code_version()['source_sha256']}
    if target.exists():
        saved=json.loads(target.read_text());
        if any(saved[k]!=v for k,v in identity.items()):raise ValueError('incompatible pressure replay identity')
        for rel,sha in saved['artifact_hashes'].items():
            if hashlib.sha256((root/rel).read_bytes()).hexdigest()!=sha:raise ValueError('corrupt pressure artifact')
        for o in saved['observations']:
            if verify(o['task'],o['result'])!=o['verification']:raise ValueError('pressure replay verification mismatch')
        from .pressure_verifier import verify_pressure
        verify_pressure(saved,root)
        actual=aggregate_usage(root,saved['aggregate_usage']['controller_elapsed_s'])
        if actual!=saved['aggregate_usage']:raise ValueError('aggregate fixture accounting changed during replay')
        check_aggregate(actual,manifest['aggregate_budget'])
        return saved
    tasks=generate(test_id); registry=BenchmarkRegistry(root/'registry.sqlite3')
    if planned_cycles(test_id)>manifest['aggregate_budget']['max_cycles']:
        raise ValueError('finite fixture schedule exceeds declared aggregate budget')
    cases=[]
    for task in tasks:
        public=request_view(task)
        cases.append({'task_id':task['id'],'family_id':test_id+'-'+task['category'],'generator_or_source_id':task['source_group'],'split':'development','creation_time':'2026-11-21T00:00:00Z','fixture_hash':digest(public),'gold_verifier_version':'hive-evaluator-v1','exposure_status':'unexposed','consumed_at':None,'public':public,'private':{'expected':task['expected']}})
    registry_sha=registry.register_manifest(test_id+'-fixture-v1',cases);registry.close()
    observations=[];arms=[];hashes={}
    for arm in ARMS:
        cfg={**DEFAULT_CONFIG,'routes':['tool'],'allow_fixtures':True,'max_retries':0,'max_requests':0,'max_total_tokens':0,'max_cycles':manifest['budget']['max_cycles']}
        executor=Executor(root/arm,cfg)
        try:
            if executor.store.db.execute('SELECT count(*) FROM jobs').fetchone()[0]: raise ValueError('incomplete pressure run: existing jobs require operator reconciliation; budgets not reset')
            routing_policy=Policy(mode='ucb',version=2) if arm=='adaptive' else Policy(mode='fixed')
            executor.store.set('governing_policy',routing_policy.snapshot())
            executor.store.set('policy',routing_policy.snapshot())
            frozen_policy=copy.deepcopy(routing_policy.snapshot())
            for i,task in enumerate(tasks):
                for control,route in [('positive','tool'),('negative','fixture_bad')]:
                    requested=None if control=='positive' and arm in ('adaptive','learning_disabled') else route
                    job=executor.store.enqueue({'task':task,'route':requested,'allow_retry':False,'retry_count':0,
                        'learn_feedback':arm=='adaptive' and control=='positive','hypothesis':'preregistered pressure fixture control'})
                    result=executor.run_one()
                    bundle=executor.store.read_artifact(result['evidence_ref'])
                    obs={'arm':arm,'scenario':test_id,'control':control,'source_group':task['source_group'],'job_id':job,'task':task,'route':route,'result':bundle['result'],'verification':bundle['verification'],'evidence_ref':arm+'/'+result['evidence_ref']}
                    observations.append(obs)
                    path=Path(obs['evidence_ref']);hashes[path.as_posix()]=hashlib.sha256((root/path).read_bytes()).hexdigest()
                    if arm=='adaptive' and control=='positive':
                        # Only trusted exact development evidence may alter this
                        # quarantined candidate; learning-off stays frozen.
                        routing_policy=Policy(state=executor.store.get('policy'))
                        executor.store.set('governing_policy',routing_policy.snapshot())
            arms.append({'arm':arm,'policy_before':frozen_policy,'policy_after':routing_policy.snapshot(),'learning_enabled':arm=='adaptive','declared_budget':manifest['budget'],'usage':executor._budget(),'positive_passes':sum(o['verification']['passed'] for o in observations if o['arm']==arm and o['control']=='positive'),'negative_rejections':sum(not o['verification']['passed'] for o in observations if o['arm']==arm and o['control']=='negative'),'source_groups':[t['source_group'] for t in tasks],'implementation':'deterministic fixture proxy; not a real specialist model' if arm in ('fixed_specialist','fixed_team') else 'existing Executor deterministic route'})
        finally:executor.close()
    details=_behavior(test_id,tasks,root)
    aggregate=aggregate_usage(root,time.monotonic()-started);check_aggregate(aggregate,manifest['aggregate_budget'])
    if aggregate['cycles']!=planned_cycles(test_id):raise ValueError('aggregate fixture cycles do not match finite preregistered schedule')
    value={'version':1,'test_id':test_id,'mode':mode,'research_status':'UNTESTED','contract':manifest,**identity,'registry_sha256':registry_sha,'observations':observations,'arm_results':arms,'details':details,'budget':manifest['budget'],'aggregate_budget':manifest['aggregate_budget'],'aggregate_usage':aggregate,'artifact_hashes':hashes,'readiness':'PRESENT_UNVERIFIED'}
    # Public API returns the same JSON-native values on initial run and replay.
    encoded=json.dumps(value,indent=2)
    target.write_text(encoded,encoding='utf-8');return json.loads(encoded)

def compare(reports):
    if not isinstance(reports,list) or not reports:raise ValueError('nonempty reports required')
    rows=[]
    for item in reports:
        if item.get('research_status')!='UNTESTED':raise ValueError('unsupported research claim in pressure report')
        if item.get('mode')=='fixture':
            expected=contract(item['test_id'])
            if item.get('contract')!=expected or item.get('contract_sha256')!=digest(expected):raise ValueError('comparison contract mismatch')
            if item.get('aggregate_budget')!=expected['aggregate_budget']:raise ValueError('comparison aggregate budget mismatch')
            check_aggregate(item['aggregate_usage'],expected['aggregate_budget'])
            if item['aggregate_usage']['cycles']!=planned_cycles(item['test_id']):raise ValueError('comparison aggregate cycle mismatch')
            arms=item['arm_results']
            if len(arms)!=len(ARMS) or {x['arm'] for x in arms}!=set(ARMS):raise ValueError('comparison arms incomplete')
            tasks=generate(item['test_id']);groups=[t['source_group'] for t in tasks]
            if any(x['declared_budget']!=expected['budget'] or x['source_groups']!=groups for x in arms):raise ValueError('unpaired source groups or unmatched budgets')
            task_map={t['id']:t for t in tasks};seen=set()
            for observation in item['observations']:
                key=(observation['arm'],observation['task']['id'],observation['control'])
                if key in seen or observation['task']!=task_map.get(key[1]) or key[0] not in ARMS or key[2] not in ('positive','negative'):raise ValueError('comparison observation mismatch')
                seen.add(key);verdict=verify(observation['task'],observation['result'])
                if verdict!=observation['verification'] or verdict['passed']!=(key[2]=='positive'):raise ValueError('comparison control verification mismatch')
            if seen!={(a,t['id'],c) for a in ARMS for t in tasks for c in ('positive','negative')}:raise ValueError('comparison observations incomplete')
            for arm in arms:
                if (arm['positive_passes']!=len(tasks) or arm['negative_rejections']!=len(tasks) or
                    arm['usage']['cycles']!=2*len(tasks) or arm['usage']['requests']!=0 or
                    arm['usage']['tokens_reserved']!=0 or arm['usage']['tokens_actual']!=0):raise ValueError('forged comparison summary or resource usage')
            rows.append({'test_id':item['test_id'],'mode':'fixture','arms':arms})
        elif item.get('mode')=='real' and item.get('protocol')=='integration-development-v1':
            rows.append({'test_id':item['test_id'],'mode':'real','development_comparisons':item['integration_report'].get('comparisons',{}),'scientific_status':item['scientific_status']})
        elif item.get('protocol')=='paired-development-v1' and item.get('mode') in ('real','synthetic_adapter'):
            value=item.get('development_report',item);campaign=value['campaign'];arms=value['arm_results']
            if len(arms)!=len(ARMS) or {x['arm'] for x in arms}!=set(ARMS):raise ValueError('paired development arms incomplete')
            source_groups=[campaign['tasks'][i]['source_group'] for phase in ('train','comparison') for i in campaign[phase]]
            if any(x['source_groups']!=source_groups or x['declared_budget']!=campaign['arm_budget'] for x in arms):raise ValueError('development cases or budgets are not matched')
            seen=set();jobs=set();components=0;requests=0;tokens=0
            for row in value['observations']:
                key=(row['arm'],row['phase'],row['task_id'])
                if key in seen or key[0] not in ARMS or key[1] not in ('train','comparison') or key[2] not in campaign[key[1]]:raise ValueError('duplicate or unpaired development observation')
                seen.add(key);task=campaign['tasks'][key[2]]
                routes=['local_direct','tool'] if key[0]=='fixed_team' else ['tool'] if key[0]=='fixed_strongest_tool' else ['local_direct'] if key[0]=='fixed_specialist' else None
                if row['source_group']!=task['source_group'] or len(row['members'])!=(2 if key[0]=='fixed_team' else 1):raise ValueError('development membership changed')
                for index,member in enumerate(row['members']):
                    if member['job_id'] in jobs or member['task']!=task or member['route'] not in ('tool','local_direct'):raise ValueError('development job reused or task changed')
                    jobs.add(member['job_id']);components+=1;requests+=int(member['route']=='local_direct')
                    if routes is not None and member['route']!=routes[index]:raise ValueError('fixed development route changed')
                    verdict=verify(task,member['result'])
                    if verdict!=member['verification']:raise ValueError('development objective verdict changed')
                arbitration=team_selection(row['members']) if key[0]=='fixed_team' else None
                selected=arbitration['selected_member'] if arbitration else 0
                quality=row['members'][selected]['verification']['quality'] if selected is not None else 0
                if row.get('arbitration')!=arbitration or row['final_member']!=selected or row['quality']!=quality:raise ValueError('development selection or quality changed')
            expected={(a,phase,i) for a in ARMS for phase in ('train','comparison') for i in campaign[phase]}
            if seen!=expected:raise ValueError('development observations incomplete')
            for arm in arms:
                own=[r for r in value['observations'] if r['arm']==arm['arm']]
                members=[m for r in own for m in r['members']];reservation=arm['reservation']
                if arm['comparison_quality']!=[r['quality'] for r in own if r['phase']=='comparison']:raise ValueError('forged development arm quality')
                if reservation['cycles']!=len(members) or reservation['requests']!=sum(m['route']=='local_direct' for m in members):raise ValueError('forged development arm counters')
                for counter,limit in (('cycles','max_cycles'),('requests','max_requests'),('tokens_reserved','max_total_tokens'),('wall_s_reserved','max_wall_s'),('storage_reserved','max_storage_bytes')):
                    if not 0<=reservation[counter]<=arm['declared_budget'][limit]:raise ValueError('development arm budget exceeded')
                tokens+=reservation['tokens_reserved']
                if arm['arm']!='adaptive' and arm['policy_before']!=arm['policy_after']:raise ValueError('frozen development policy changed')
            if value['budget']['cycles']!=components or value['budget']['requests']!=requests or value['budget']['tokens_reserved']!=tokens:raise ValueError('forged development aggregate counters')
            if value['actual_inference_calls']!=(0 if value['mode']=='synthetic_adapter' else requests):raise ValueError('inference scope changed')
            rows.append({'test_id':item.get('test_id',campaign['id']),'mode':value['mode'],'arms':arms,'actual_inference_calls':value['actual_inference_calls'],
                         'logical_requests':value['budget']['requests'],'scientific_status':value['scope']})
        else:raise ValueError('unsupported pressure report mode')
    return {'research_status':'UNTESTED','reports':rows,'conclusion':'Engineering controls and development protocols only; no adaptive generalization gain estimated.'}

def report(root):
    from .pressure_verifier import verify_pressure,verify_development_pressure
    from .storage import Store
    reports=[]
    for path in sorted(Path(root).glob('*/report.json')):
        value=json.loads(path.read_text());verify_pressure(value,path.parent);reports.append(value)
    for path in sorted(Path(root).glob('*/development-report.json')):
        value=json.loads(path.read_text());verify_development_pressure(value,path.parent);reports.append(value)
    for path in sorted(Path(root).glob('*/real-report.json')):
        value=json.loads(path.read_text());location=path.parent/'real';store=Store(location)
        try:
            if store.get('pressure-authorization')!={'sha256':value['contract_sha256'],'protocol':value['protocol']}:raise ValueError('real report authorization binding changed')
            if value['protocol']=='paired-development-v1':
                saved=store.read_artifact(store.get('paired-development-report'))
                if saved!=value['development_report']:raise ValueError('real development summary differs from saved evidence')
                verify_development_pressure(saved,location)
            else:
                from .integration import _replay
                saved=store.read_artifact(store.get('integration_report'))
                if saved!=value['integration_report']:raise ValueError('real integration summary differs from saved evidence')
                ex=Executor(location,value['execution_config'])
                try:_replay(ex,saved)
                finally:ex.close()
        finally:store.close()
        reports.append(value)
    return compare(reports)



