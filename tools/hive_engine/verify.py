"""Independently inspect exported pilot evidence and record contracts."""
import argparse
import json
from pathlib import Path
from .core import digest

REQUIRED = {
    'TaskSpec': 'task_id task_type input_ref success_criteria_version permissions resource_budget split_id created_at',
    'Capability': 'capability_id kind version adapter supported_tasks constraints health provenance',
    'Config': 'config_id component_versions routing_policy_version tool_graph checker_policy_version limits',
    'Episode': 'episode_id task_id config_id input_hash trace_refs output_refs timings resources status errors',
    'Verification': 'episode_id checker_id checker_version criteria_version result confidence_if_calibrated evidence_refs label_source',
    'FailurePattern': 'pattern_id episode_refs hypothesis severity provenance status',
    'ChangeCandidate': 'candidate_id parent_version change_type diff_or_artifact_ref hypothesis training_data_refs scope',
    'Experiment': 'experiment_id candidate_id control_config_id task_split_versions metrics seed result_artifacts decision',
    'Release': 'release_id candidate_id approval_ref gate_results deployed_version rollback_ref timestamp',
    'MemoryItem': 'memory_id partition content_ref source_refs confidence validation_status created_at expires_at supersedes access_policy',
}


def validate_record(kind, record):
    missing = set(REQUIRED.get(kind, '').split()) - record.keys()
    if missing: raise ValueError(f'{kind}: missing required fields {sorted(missing)}')
    if kind in {'TaskSpec','Capability','Config'}:
        id_name = {'TaskSpec':'task_id','Capability':'capability_id','Config':'config_id'}[kind]
        if not isinstance(record[id_name],str) or not record[id_name]: raise ValueError('invalid ID')
    if kind=='Episode' and (record['status'] not in {'completed','failed'} or not isinstance(record['errors'],list)):
        raise ValueError('invalid execution status')
    if kind=='Verification' and type(record['result']) is not bool: raise ValueError('invalid verifier result')


def schema():
    return {'$schema':'https://json-schema.org/draft/2020-12/schema', 'title':'HIVE empirical event records v1',
            'oneOf':[{'type':'object','required':['kind','payload'], 'properties':{'kind':{'const':kind},
                      'payload':{'type':'object','required':fields.split()}}} for kind,fields in REQUIRED.items()]}


def check(root):
    root=Path(root)
    previous='0'*64
    counts={}
    episodes={}
    tasks={}
    configs={}
    verified=set()
    candidate=None
    for number,line in enumerate((root/'events.jsonl').read_text(encoding='utf-8').splitlines(),1):
        event=json.loads(line)
        kind,payload=event['kind'],event['payload']
        if event['seq']!=number or event['previous']!=previous or event['hash']!=digest(dict(kind=kind,payload=payload,previous=previous)):
            raise ValueError('event chain invalid')
        validate_record(kind,payload)
        previous=event['hash']
        counts[kind]=counts.get(kind,0)+1
        if kind=='TaskSpec':tasks[payload['task_id']]=payload
        if kind=='Config':configs[payload['config_id']]=payload
        if kind=='ChangeCandidate':candidate=payload
        if kind=='Episode':
            if payload['episode_id'] in episodes: raise ValueError('duplicate episode ID')
            episodes[payload['episode_id']]=payload
            if payload['task_hash']!=digest(tasks[payload['task_id']]) or payload['config_hash']!=digest(configs[payload['config_id']]):
                raise ValueError('trace version mismatch')
            for ref in payload['output_refs']:
                path=(root/ref).resolve()
                if not path.is_relative_to(root.resolve()):raise ValueError('output path escape')
                if digest(json.loads(path.read_text(encoding='utf-8')))!=payload['output_hash']:raise ValueError('output digest mismatch')
        if kind=='Verification':
            if payload['episode_id'] not in episodes:raise ValueError('unattributed verification')
            verified.add(payload['episode_id'])
    if set(episodes)!=verified:raise ValueError('missing verification')
    if not candidate or any(episodes[ref]['split_id']!='dev' for ref in candidate['training_data_refs']):raise ValueError('training lineage invalid')
    return dict(ok=True,counts=counts,chain_head=previous,episodes=len(episodes),verified=len(verified))


if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('run',type=Path)
    args=ap.parse_args()
    print(json.dumps(check(args.run),indent=2))
