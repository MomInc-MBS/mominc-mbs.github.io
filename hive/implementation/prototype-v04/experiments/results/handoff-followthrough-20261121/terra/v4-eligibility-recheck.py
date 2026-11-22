import json,pathlib
from hive import orchestrator
from hive.learning_policy import Policy
from hive.task_spec import _task
rows=[]
for disabled in (False,True):
 p=pathlib.Path(r'D:/Repos/hive-ai/.hive/handoff-followthrough-verifier/v4-eligibility-recheck-'+str(disabled))
 ex=orchestrator.Executor(p,{**orchestrator.DEFAULT_CONFIG,'routes':['tool'],'max_retries':0,'max_tokens':16})
 try:
  ex.store.set('governing_policy',Policy(mode='fixed',version=4,memory_enabled=True).snapshot())
  ex.store.set('policy',Policy(mode='fixed',version=4,memory_enabled=not disabled).snapshot())
  task=_task('development','math',1,444)
  job=ex.store.enqueue({'task':task,'route':None,'learn_feedback':True}); result=ex.run_one(job)
  orchestrator.inspect_evidence(ex.store,job)
  fb=ex.store.read_artifact(ex.store.get('feedback:'+job)); original=fb['feedback_eligible']; fb['feedback_eligible']=not original
  ex.store.set('feedback:'+job,ex.store.put_artifact(fb))
  try: orchestrator.inspect_evidence(ex.store,job); rejected=False
  except ValueError: rejected=True
  rows.append({'candidate_memory_enabled':not disabled,'original_eligible':original,'forgery_rejected':rejected})
 finally: ex.close()
print(json.dumps({'cases':rows,'new_model_calls':0}))
