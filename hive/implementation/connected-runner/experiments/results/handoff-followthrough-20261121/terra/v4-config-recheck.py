import json, pathlib, copy
from hive import orchestrator
from hive.learning_policy import Policy
from hive.task_spec import _task
p=pathlib.Path(r'D:/Repos/hive-ai/.hive/handoff-followthrough-verifier/v4-config-recheck')
ex=orchestrator.Executor(p,{**orchestrator.DEFAULT_CONFIG,'routes':['tool'],'max_retries':0,'max_tokens':16})
try:
    ex.store.set('governing_policy',Policy(mode='fixed',version=4).snapshot())
    task=_task('development','math',1,333)
    job=ex.store.enqueue({'task':task,'route':None,'learn_feedback':True})
    result=ex.run_one(job)
    evidence=ex.store.read_artifact(result['evidence_ref'])
    evidence['mission_config']['model']='forged-omitted-from-contract'
    changed=ex.store.put_artifact(evidence)
    rec=ex.store.get_job(job)['result']; rec['evidence_ref']=changed
    ex.store.db.execute('UPDATE jobs SET result=? WHERE id=?',(json.dumps(rec),job))
    try:
        orchestrator.inspect_evidence(ex.store,job)
        print(json.dumps({'config_tamper_rejected':False}))
    except ValueError as e:
        print(json.dumps({'config_tamper_rejected':True,'error':str(e),'new_model_calls':0}))
finally:
    ex.close()
