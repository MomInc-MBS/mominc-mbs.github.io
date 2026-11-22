import json,pathlib
from hive import orchestrator,storage
from hive.learning_policy import Policy
from hive.task_spec import _task
p=pathlib.Path(r'D:/Repos/hive-ai/.hive/handoff-followthrough-verifier/v4-final-cycle-probe')
ex=orchestrator.Executor(p,{**orchestrator.DEFAULT_CONFIG,'routes':['tool'],'max_retries':0,'max_tokens':16,'max_cycles':1})
try:
 ex.store.set('governing_policy',Policy(mode='fixed',version=4).snapshot())
 task=_task('development','math',1,555)
 job=ex.store.enqueue({'task':task,'route':None,'learn_feedback':True})
 report=ex._report
 def crash(*a,**kw): raise RuntimeError('simulated crash after feedback')
 ex._report=crash
 try: ex.run_one(job)
 except RuntimeError: pass
 saved=bool(ex.store.get('feedback:'+job))
 ex._report=report; old=storage._alive; storage._alive=lambda pid:False
 try: recovered=ex.recover(); result=ex.run_one(job)
 finally: storage._alive=old
 print(json.dumps({'saved_feedback':saved,'recovered':recovered,'run_result':result,'stop_reason':ex.store.get('stop_reason'),'job_state':ex.store.get_job(job)['state'],'budget':ex._budget(),'new_model_calls':0}))
finally: ex.close()
