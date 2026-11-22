import json, pathlib
from hive import orchestrator
from hive.learning_policy import Policy
from hive.task_spec import _task
p = pathlib.Path(r'D:/Repos/hive-ai/.hive/handoff-followthrough-verifier/v4-feedback-probe')
ex = orchestrator.Executor(p, {**orchestrator.DEFAULT_CONFIG, 'routes':['tool'], 'max_retries':0, 'max_tokens':16})
try:
    ex.store.set('governing_policy', Policy(mode='fixed',version=4).snapshot())
    task = _task('development','math',1,141)
    task['source_group']='source-a'
    task['permissions']={'version':1,'routes':['tool']}
    job=ex.store.enqueue({'task':task,'route':None,'learn_feedback':True})
    result=ex.run_one(job)
    original=ex.store.get('feedback:'+job)
    assert result['passed'] and original
    forged=ex.store.read_artifact(original).copy()
    forged['quality']=0
    forged['passed']=False
    forged['evidence_ref']='forged'
    ex.store.set('feedback:'+job, ex.store.put_artifact(forged))
    out=orchestrator.inspect_evidence(ex.store,job)
    print(json.dumps({'passed_before':result['passed'],'forged_feedback_accepted_on_inspect':out['verification']['passed'],'new_model_calls':0}))
finally:
    ex.close()
