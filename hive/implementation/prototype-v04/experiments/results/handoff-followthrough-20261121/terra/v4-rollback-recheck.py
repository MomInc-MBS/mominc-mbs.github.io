import json, pathlib
from hive import orchestrator
from hive.learning_policy import Policy
from hive.task_spec import _task
p=pathlib.Path(r'D:/Repos/hive-ai/.hive/handoff-followthrough-verifier/v4-rollback-recheck')
ex=orchestrator.Executor(p,{**orchestrator.DEFAULT_CONFIG,'routes':['tool'],'max_retries':0,'max_tokens':16})
try:
    ex.store.set('policy',Policy(version=4).snapshot())
    ex.store.set('governing_policy',Policy(mode='fixed',version=1).snapshot())
    task=_task('development','math',1,321)
    job=ex.store.enqueue({'task':task,'route':None,'learn_feedback':True})
    try:
        result=ex.run_one(job)
        out={'result':result}
    except Exception as e:
        out={'error_type':type(e).__name__,'error':str(e),'job_state':ex.store.get_job(job)['state']}
    print(json.dumps(out))
finally:
    ex.close()

