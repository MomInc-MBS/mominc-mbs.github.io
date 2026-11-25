"""Independent integrity checks for deterministic pressure receipts.

This checks provenance and baseline controls, not scientific or scenario readiness.
"""
import hashlib
import json
from pathlib import Path
from .pressure import ARMS, contract, digest, generate, aggregate_usage, check_aggregate
from .verifier import verify
from .storage import Store
from .learning_policy import Policy
from .orchestrator import inspect_evidence


def verify_pressure(report, root):
    """Raise ValueError for corrupt, fabricated, incomplete, or over-budget receipts."""
    try:
        root = Path(root).resolve()
        test_id = report['test_id']
        expected_contract = contract(test_id)
        if (report['version'] != 1 or report['mode'] != 'fixture' or
                report['research_status'] != 'UNTESTED' or report['contract'] != expected_contract or
                report['contract_sha256'] != digest(expected_contract) or report['budget'] != expected_contract['budget']):
            raise ValueError('contract mismatch')
        tasks = {task['id']: task for task in generate(test_id)}
        expected_keys = {(arm, task_id, control) for arm in ARMS for task_id in tasks for control in ('positive', 'negative')}
        seen, jobs, referenced = set(), set(), set()
        for observation in report['observations']:
            task = observation['task']; key = (observation['arm'], task['id'], observation['control'])
            if key not in expected_keys or key in seen or task != tasks[task['id']]:
                raise ValueError('unexpected, duplicate or modified task')
            seen.add(key)
            if observation['job_id'] in jobs: raise ValueError('duplicate job')
            jobs.add(observation['job_id'])
            route = 'tool' if observation['control'] == 'positive' else 'fixture_bad'
            if observation['route'] != route or observation['source_group'] != task['source_group'] or observation['scenario'] != test_id:
                raise ValueError('control or lineage mismatch')
            ref = observation['evidence_ref']; relative = Path(ref)
            if relative.is_absolute() or '..' in relative.parts: raise ValueError('unsafe artifact path')
            path = (root / relative).resolve()
            if not path.is_relative_to(root) or not path.is_file(): raise ValueError('missing artifact')
            raw = path.read_bytes(); actual_hash = hashlib.sha256(raw).hexdigest()
            if report['artifact_hashes'].get(relative.as_posix()) != actual_hash:
                raise ValueError('artifact hash mismatch')
            artifact = json.loads(raw)
            if (artifact['job_id'] != observation['job_id'] or artifact['task'] != task or
                    artifact['route'] != route or artifact['result'] != observation['result'] or
                    artifact['verification'] != observation['verification']):
                raise ValueError('observation differs from evidence')
            if artifact['config']['max_requests'] != 0 or artifact['config']['max_total_tokens'] != 0:
                raise ValueError('fixture inference budget is not zero')
            verdict = verify(task, artifact['result'])
            if verdict != artifact['verification'] or verdict['passed'] != (route == 'tool'):
                raise ValueError('independent objective check failed')
            store = Store(root / observation['arm'])
            try:
                job = store.get_job(observation['job_id'])
                requested = None if observation['arm'] in ('adaptive', 'learning_disabled') and observation['control'] == 'positive' else route
                if job['spec']['task'] != task or job['spec']['route'] != requested or job['result']['evidence_ref'] != relative.parts[-2] + '/' + relative.parts[-1]:
                    raise ValueError('job journal binding mismatch')
                checked = inspect_evidence(store, observation['job_id'])
                if checked['result'] != artifact['result'] or checked['verification'] != verdict:
                    raise ValueError('journal evidence mismatch')
            finally:
                store.close()
            referenced.add(relative.as_posix())
        if seen != expected_keys or referenced != set(report['artifact_hashes']):
            raise ValueError('incomplete observations or unexpected artifacts')
        arms = {arm['arm']: arm for arm in report['arm_results']}
        if len(arms) != len(ARMS) or set(arms) != set(ARMS): raise ValueError('arm mismatch')
        for arm in arms.values():
            reconstructed = Policy(state=arm['policy_before'])
            if arm['learning_enabled'] != (arm['arm'] == 'adaptive'):
                raise ValueError('learning arm mismatch')
            if arm['arm'] == 'adaptive':
                for obs in report['observations']:
                    if obs['arm'] == 'adaptive' and obs['control'] == 'positive':
                        evidence = json.loads((root / Path(obs['evidence_ref'])).read_text(encoding='utf-8'))
                        verdict = verify(obs['task'], evidence['result'])
                        reconstructed.observe(obs['task']['category'], obs['route'], verdict['quality'], evidence['utility'], valid=verdict['valid'], split=obs['task']['split'])
            if digest(reconstructed.snapshot()) != digest(arm['policy_after']):
                raise ValueError('arm policy does not reconstruct from verified feedback')
            store = Store(root / arm['arm'])
            try:
                if digest(store.get('policy')) != digest(arm['policy_after']) or digest(store.get('governing_policy')) != digest(arm['policy_after']):
                    raise ValueError('persisted policy differs from arm report')
            finally:
                store.close()
            if arm['arm'] == 'adaptive' and digest(arm['policy_before']) == digest(arm['policy_after']):
                raise ValueError('adaptive arm did not learn')
            if (arm['declared_budget'] != expected_contract['budget'] or
                    arm['usage']['cycles'] != 2 * len(tasks) or arm['usage']['cycles'] > expected_contract['budget']['max_cycles'] or
                    arm['usage']['requests'] != 0 or arm['usage']['tokens_actual'] != 0 or
                    arm['positive_passes'] != len(tasks) or arm['negative_rejections'] != len(tasks) or
                    arm['source_groups'] != [t['source_group'] for t in tasks.values()]):
                raise ValueError('budget or summary mismatch')
        _verify_behavior(test_id, report['details'], root)
        usage = aggregate_usage(root, report['aggregate_usage']['controller_elapsed_s'])
        if report['aggregate_budget'] != expected_contract['aggregate_budget'] or usage != report['aggregate_usage']:
            raise ValueError('aggregate usage does not reproduce')
        check_aggregate(usage, expected_contract['aggregate_budget'])
        return {'integrity': 'PASS', 'scenario_readiness': 'NOT_ASSESSED', 'observations': len(seen)}
    except (KeyError, TypeError, OSError, json.JSONDecodeError) as exc:
        raise ValueError('malformed pressure receipt') from exc


def _verify_behavior(test_id, behavior, root):
    """Reject altered control assertions; does not certify full Hxx coverage."""
    if test_id == 'H01':
        curricula = behavior['curricula']
        if {x['name'] for x in curricula} != {'fixed', 'seeded_random', 'learning_progress'}:
            raise ValueError('curricula missing')
        for arm in curricula:
            if sorted(x['level'] for x in arm['outcomes']) != [1,2,3,4,5] or arm['usage']['cycles'] != 5:
                raise ValueError('curriculum budget or levels mismatch')
            store = Store(root / ('curriculum-' + arm['name']))
            try:
                for row in arm['outcomes']:
                    evidence = inspect_evidence(store, row['job_id'])
                    if evidence['task'] != row['task'] or evidence['result'] != row['result'] or verify(row['task'],row['result']) != row['verification']:
                        raise ValueError('curriculum journal mismatch')
            finally: store.close()
            probes = arm['metric_probes']
            for name in ('transfer_before','transfer_after','retention_before','intervening_B','retention_after','retention_negative'):
                location = root / ('metrics-' + arm['name']) / ('before' if name == 'transfer_before' else 'after')
                _verify_probe(location, probes[name], name == 'intervening_B')
            if probes['retention_negative']['verification']['passed']:
                raise ValueError('retention negative control passed')
        metrics = behavior['metrics']
        if metrics['transfer']['status'] != 'SYNTHETIC_MEASURED' or metrics['forgetting']['status'] != 'SYNTHETIC_MEASURED':
            raise ValueError('missing synthetic transfer or retention metrics')
        for metric, before, after, delta in (('transfer','transfer_before','transfer_after','delta'),('forgetting','retention_before','retention_after','retention_delta')):
            rows = {x['curriculum']: x for x in metrics[metric]['rows']}
            for arm in curricula:
                row = rows[arm['name']]; p = arm['metric_probes']
                actual_before = int(p[before]['verification']['passed']); actual_after = int(p[after]['verification']['passed'])
                if row['before_quality'] != actual_before or row['after_quality'] != actual_after or row[delta] != actual_after-actual_before:
                    raise ValueError('synthetic metric mismatch')
        ladder = behavior['ladder']
        if any(not verify(ladder[k]['task'],ladder[k]['result'])['passed'] for k in ('L1','L2','L5')) or verify(ladder['L3']['task'],ladder['L3']['result'])['passed'] or ladder['L4']['decision']['selected'] is not None:
            raise ValueError('ladder objective controls mismatch')
    elif test_id == 'H02':
        from .governor import decide
        from .orchestrator import DEFAULT_CONFIG, code_version
        task = behavior['invalid_challenge']; policy = Policy(mode='ucb',version=2)
        cfg = {**DEFAULT_CONFIG, 'allow_fixtures':True, 'routes':['tool'], 'max_retries':0, 'max_requests':0, 'max_total_tokens':0}
        actual = decide(task,candidates=['tool'],requested_route=None,policy=policy,policy_hash=digest(policy.snapshot()),source_hash=code_version()['source_sha256'],config_hash=digest(cfg),task_hash=digest(task),route_checks={},allow_fixtures=True)
        if actual['selected'] is not None or behavior['invalid_decision']['selected'] is not None:
            raise ValueError('invalid challenger accepted')
        repair = behavior['repair']; failure = repair['failure']
        _verify_probe(root / 'repair', failure, True)
        if failure['verification']['passed'] or digest(failure['policy_after']) != digest(repair['candidate_after_failure']):
            raise ValueError('challenger failure feedback mismatch')
        siblings = repair['siblings']
        if len(siblings) != 2 or len({x['task']['id'] for x in siblings}) != 2:
            raise ValueError('fresh sibling challenges missing')
        for sibling in siblings:
            good, bad = sibling['repaired'], sibling['unrepaired']
            _verify_probe(root / 'repair',good,True); _verify_probe(root / 'unrepaired',bad,False)
            if good['task'] != sibling['task'] or bad['task'] != sibling['task'] or not good['verification']['passed'] or bad['verification']['passed']:
                raise ValueError('challenger sibling control mismatch')
        _verify_probe(root / 'repair',repair['old_regression'],False)
        if not repair['old_regression']['verification']['passed']:
            raise ValueError('old challenge regression')
        negative=behavior['negative_controls']; broken=negative['broken_dependency']
        if (negative['tool_failure']['decision']['selected'] is not None or
                verify(broken['task'],broken['stale_parent_result']) != broken['verification'] or broken['verification']['passed']):
            raise ValueError('challenge negative control mismatch')
    elif test_id == 'H03':
        configs = behavior['configurations']
        if {x['name'] for x in configs} != {'central_fixed','distributed_hybrid','exact_tool_first','selective_verifier','memory_aware','exploratory'}:
            raise ValueError('configuration controls missing')
        for row in configs:
            store = Store(root / ('config-' + row['name']))
            try:
                evidence = inspect_evidence(store, row['job_id'])
                if (row['task'] != generate('H03')[0] or evidence['task'] != row['task'] or evidence['result'] != row['result'] or evidence['verification'] != row['verification'] or evidence['route'] != row['decision']['selected'] or evidence['decision'] != row['decision']['receipt'] or digest(store.get('governing_policy')) != digest(row['policy'])):
                    raise ValueError('configuration journal mismatch')
            finally: store.close()
    elif test_id == 'H11':
        rows = behavior['code_missions']
        if {x['control'] for x in rows} != {'positive','negative'}:
            raise ValueError('code mission controls missing')
        for row in rows:
            shared = row['shared_mission']
            expected_outer = 'COMPLETED' if row['control'] == 'positive' else 'FAILED'
            expected_stage = 'SYNTHETIC_ONLY' if row['control'] == 'positive' else 'FAILED'
            if shared['status'] != expected_outer or shared['stages']['code']['state'] != expected_stage or shared['stages']['code']['result'] != row['mission_report']:
                raise ValueError('shared code mission state mismatch')
            location = root / row['store']
            store = Store(location)
            try:
                patches = row['mission_report']['patches']
                if len(patches) != 1: raise ValueError('invalid code mission result')
                record = next(iter(patches.values()))
                evidence = inspect_evidence(store, record['job_id'])
                verdict = verify(evidence['task'], evidence['result'])
                if verdict != evidence['verification'] or verdict['passed'] != (row['control'] == 'positive'):
                    raise ValueError('code mission control mismatch')
            finally: store.close()
    elif test_id in ('H05', 'H10'):
        probe = behavior['probe']
        verdict = verify(probe['task'], probe['result'])
        if verdict != probe['verification'] or verdict['passed'] or behavior['policy_before'] != behavior['policy_after']:
            raise ValueError('false-feedback control does not reproduce')
        if behavior.get('accepted', behavior.get('feedback_accepted')) is not False:
            raise ValueError('untrusted feedback accepted')
        if test_id == 'H05':
            if len(behavior['sequential_tasks']) != 2: raise ValueError('missing memory sequence')
            for row in behavior['sequential_tasks']:
                _verify_probe(root / 'memory-sequence', row, True)
    elif test_id == 'H06':
        from .orchestrator import DEFAULT_CONFIG, Executor
        cfg = {**DEFAULT_CONFIG,'allow_fixtures':True,'routes':['tool'],'max_retries':0,'max_requests':1,'max_total_tokens':1,'max_cycles':1}
        ex = Executor(root / 'famine-probe',cfg)
        try:
            if ex._budget() != behavior['budget_after'] or not ex.barrier('tool') or not behavior['model_barrier'] or behavior['tool_barrier'] is not None or not behavior['exhausted_barrier']:
                raise ValueError('budget famine control mismatch')
        finally: ex.close()
    elif test_id == 'H07':
        verdicts = [verify(x['task'], x['result'])['passed'] for x in behavior['candidates']]
        if verdicts != [False, True, False] or behavior['selected_index'] != 1:
            raise ValueError('disagreement control does not reproduce')
    elif test_id == 'H08':
        waves = behavior['waves']
        if {x['arm'] for x in waves} != {'adaptive','learning_disabled'}: raise ValueError('missing retention controls')
        for wave in waves:
            rows = wave['executed']; learn = wave['arm'] == 'adaptive'
            if len(rows) != 4 or not wave['fresh_process'] or rows[0]['pid'] == rows[2]['pid']:
                raise ValueError('missing fresh process wave')
            for row in rows: _verify_probe(root / ('chronological-' + wave['arm']), row, learn)
            if any(digest(rows[i]['policy_after']) != digest(rows[i+1]['policy_before']) for i in range(3)):
                raise ValueError('policy wave continuity mismatch')
    elif test_id == 'H09':
        parent, child, broken = behavior['parent'], behavior['child'], behavior['broken_dependency']
        if (json.loads(parent['result']['output'])['result'] != child['task']['input']['a'] or
                not verify(child['task'], child['result'])['passed'] or verify(broken['task'], broken['result'])['passed']):
            raise ValueError('dependency control does not reproduce')
    elif test_id == 'H04':
        # Recompute the permission boundary from the supplied task rather than
        # accepting the report's claimed abstention.
        from .governor import decide
        from .orchestrator import DEFAULT_CONFIG, code_version
        cfg = {**DEFAULT_CONFIG, 'allow_fixtures':True, 'routes':['tool'], 'max_retries':0}
        policy = Policy(mode='ucb', version=2)
        def decision(task):
            return decide(task, candidates=['tool'], requested_route=None, policy=policy,
                          policy_hash=digest(policy.snapshot()), source_hash=code_version()['source_sha256'],
                          config_hash=digest(cfg), task_hash=digest(task), route_checks={}, allow_fixtures=True)
        actual = decision(behavior['task'])
        if actual['selected'] is not None or behavior['decision']['selected'] != actual['selected']:
            raise ValueError('amputation control does not reproduce')
        crashes = behavior['crash_recovery']
        if {x['point'] for x in crashes} != {'before', 'after'}:
            raise ValueError('missing crash control')
        for row in crashes:
            if (row['worker_exit_code'] != (73 if row['point'] == 'before' else 74) or
                    row['interrupted_state'] != 'VERIFYING' or row['recovered'] != [row['job_id']] or
                    row['budget_before']['cycles'] != 1 or row['budget_after']['cycles'] != 2):
                raise ValueError('crash recovery accounting mismatch')
            store = Store(root / ('crash-' + row['point']))
            try:
                job = store.get_job(row['job_id'])
                if job['history'] != row['history'] or job['result']['evidence_ref'] != row['evidence_ref']:
                    raise ValueError('crash recovery journal mismatch')
                evidence = inspect_evidence(store, row['job_id'])
                if evidence['task'] != row['task'] or evidence['result'] != row['result'] or verify(row['task'], row['result']) != row['verification']:
                    raise ValueError('crash evidence mismatch')
            finally:
                store.close()


def _verify_probe(path, row, learn):
    store = Store(path)
    try:
        evidence = inspect_evidence(store, row['job_id'])
        job = store.get_job(row['job_id'])
        if (evidence['task'] != row['task'] or evidence['result'] != row['result'] or evidence['verification'] != row['verification'] or
                job['result']['evidence_ref'] != row['evidence_ref'] or job['spec']['learn_feedback'] is not learn):
            raise ValueError('sequential probe journal mismatch')
        if store.get('feedback:' + row['job_id']) != (row['evidence_ref'] if learn else None):
            raise ValueError('probe feedback identity mismatch')
        p = Policy(state=row['policy_before'])
        if learn:
            v=verify(row['task'], row['result'])
            p.observe(row['task']['category'], evidence['route'], v['quality'], evidence['utility'], valid=v['valid'], split=row['task']['split'])
        if digest(p.snapshot()) != digest(row['policy_after']): raise ValueError('probe policy mismatch')
    finally: store.close()


def verify_development_pressure(report, root):
    """Independently bind five-arm development evidence and reservations.

    This verifies only engineering behavior, never research or promotion.
    """
    from .pressure import validate_development_schedule
    from .orchestrator import DEFAULT_CONFIG
    campaign = report['campaign']; store = Store(root)
    try:
        if report['research_status'] != 'UNTESTED' or report['protocol'] != 'paired-development-v1':
            raise ValueError('unsupported development evidence claim')
        expected = {(arm,phase,task_id) for arm in ARMS for phase in ('train','comparison') for task_id in campaign[phase]}
        rows = report['observations']; seen = set(); jobs = set()
        arms = {a['arm']:a for a in report['arm_results']}
        if set(arms) != set(ARMS) or len(arms) != len(report['arm_results']): raise ValueError('arm set mismatch')
        for arm in ARMS:
            policy = Policy(state=campaign['parent_policy'])
            expected_cycles = 0; expected_requests = 0
            for phase in ('train','comparison'):
                for task_id in campaign[phase]:
                    matches=[r for r in rows if (r['arm'],r['phase'],r['task_id']) == (arm,phase,task_id)]
                    if len(matches)!=1: raise ValueError('missing or duplicate paired row')
                    row=matches[0];key=(arm,phase,task_id);seen.add(key);task=campaign['tasks'][task_id]
                    if row['source_group']!=task['source_group']: raise ValueError('source group mismatch')
                    routes=(['local_direct','tool'] if arm=='fixed_team' else ['tool'] if arm=='fixed_strongest_tool' else ['local_direct'] if arm=='fixed_specialist' else [None])
                    if len(row['members'])!=len(routes): raise ValueError('team component mismatch')
                    for member,requested in zip(row['members'],routes):
                        jid=member['job_id']
                        if jid in jobs: raise ValueError('duplicate job reused')
                        jobs.add(jid);job=store.get_job(jid);evidence=inspect_evidence(store,jid)
                        if (evidence['job_id']!=jid or evidence['task']!=task or job['spec']['task']!=task or
                            job['spec']['campaign_arm']!=arm or job['spec']['campaign_phase']!=phase or
                            job['spec']['route']!=requested or job['result']['evidence_ref']!=member['evidence_ref'] or
                            evidence['result']!=member['result'] or evidence['route']!=member['route'] or
                            verify(task,evidence['result'])!=member['verification'] or evidence['verification']!=member['verification']):
                            raise ValueError('development journal or verifier binding mismatch')
                        if requested is not None and evidence['route']!=requested: raise ValueError('fixed route mismatch')
                        learn=arm=='adaptive' and phase=='train'
                        if job['spec']['learn_feedback'] is not learn or store.get('feedback:'+jid)!=(member['evidence_ref'] if learn else None) or member['feedback_ref'] != store.get('feedback:'+jid):
                            raise ValueError('feedback eligibility mismatch')
                        if learn:
                            v=evidence['verification'];policy.observe(task['category'],evidence['route'],v['quality'],evidence['utility'],valid=v['valid'],split=task['split'])
                        expected_cycles+=1;expected_requests+=int(evidence['route'].startswith('local_'))
                    if arm == 'fixed_team':
                        first, second = row['members']
                        v1=verify(task,first['result']);v2=verify(task,second['result'])
                        try: agrees=json.loads(first['result']['output'])==json.loads(second['result']['output'])
                        except (TypeError,ValueError): agrees=False
                        good1=bool(v1['valid'] and v1['passed']);good2=bool(v2['valid'] and v2['passed'])
                        selected=0 if good1 and good2 and agrees else 1 if good2 else None
                        expected_arbitration={'rule':'verified-agreement-else-verified-tool-else-abstain-v1','agreement':agrees,'specialist_verified':good1,'tool_verified':good2,'selected_member':selected}
                        if row['arbitration']!=expected_arbitration: raise ValueError('team arbitration mismatch')
                    else:
                        selected=0
                        if row['arbitration'] is not None: raise ValueError('unexpected arbitration')
                    quality=row['members'][selected]['verification']['quality'] if selected is not None else 0
                    if row['final_member']!=selected or row['quality']!=quality or row['policy_sha256']!=digest(policy.snapshot()): raise ValueError('development decision mismatch')
            item=arms[arm];reservation=store.get('paired-reservation:'+arm)
            if (digest(item['policy_before'])!=digest(campaign['parent_policy']) or digest(item['policy_after'])!=digest(policy.snapshot()) or
                digest(store.get('paired-policy:'+arm))!=digest(policy.snapshot()) or item['learning_enabled'] != (arm=='adaptive') or
                item['declared_budget']!=campaign['arm_budget'] or item['reservation']!=reservation or
                reservation['cycles']!=expected_cycles or reservation['requests']!=expected_requests):
                raise ValueError('arm policy or resource accounting mismatch')
            for k,cap in (('cycles','max_cycles'),('requests','max_requests'),('tokens_reserved','max_total_tokens'),('wall_s_reserved','max_wall_s'),('storage_reserved','max_storage_bytes')):
                if reservation[k]>campaign['arm_budget'][cap]: raise ValueError('arm budget exceeded')
        if seen!=expected or len(rows)!=len(expected) or store.get('budget')!=report['budget']:
            raise ValueError('incomplete paired campaign or changed budget')
        if report['mode']=='synthetic_adapter' and report['actual_inference_calls']!=0: raise ValueError('synthetic run misreports inference')
        if report['mode']=='real' and report['actual_inference_calls']!=report['budget']['requests']: raise ValueError('real inference count mismatch')
        if report['mode'] not in ('real','synthetic_adapter'): raise ValueError('invalid development execution mode')
        return {'integrity':'PASS','observations':len(seen),'research_status':'UNTESTED'}
    except (KeyError,TypeError,StopIteration,OSError) as exc:
        raise ValueError('malformed development campaign evidence') from exc
    finally: store.close()
