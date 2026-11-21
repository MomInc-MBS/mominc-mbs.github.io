"""HIVE-owned experiment boundary. Standard library only; closed records.

These records describe authority and evidence, never grant deployment authority.
The research, code, execution and neural graphs remain separate authorities.
"""
import math

CHANNELS = ('Control', 'Task', 'Evidence', 'Teaching')
FIELDS = {
    'ComputeBudget': dict(max_trials=int, task_calls=int, wall_seconds=float, concurrency=int,
                          retry_cap=int, dollars=float, gpu_seconds=float),
    'MetricDefinition': dict(metric_id=str, unit=str, direction=str, scope=str),
    'DatasetSplit': dict(dataset_hash=str, dev_ids=list, evaluation_ids=list, holdout_status=str),
    'ExperimentSpec': dict(experiment_id=str, seeds=list, arms=list, trials_per_arm=int,
                           evaluation_trials=int, budget_scope=str, budget=dict, aggregate_budget=dict,
                           dataset=dict, metrics=list, source_hashes=dict,
                           selection_rule=str, environment=dict),
    'CandidateLineage': dict(candidate_hash=str, parent_hash=str, method=str, seed=int,
                             generation=int, development_trial_refs=list, recipe=dict),
    'TrialResult': dict(trial_id=str, arm=str, seed=int, index=int, phase=str,
                        candidate_hash=str, status=str, reason=str, task_count=int,
                        successes=int, charged_calls=int, mean_wall_seconds=float, wall_seconds=float,
                        cpu_seconds=float, peak_rss_bytes=int, cost_known=bool, state_ref=str),
    'PromotionDecision': dict(candidate_hash=str, eligible=bool, gates=dict, evidence_ref=str,
                              authority=str, deployed=bool),
}


def validate(kind, value):
    fields = FIELDS[kind]
    if not isinstance(value, dict) or value.keys() != fields.keys():
        raise ValueError(kind+': missing or unknown fields')
    for key, typ in fields.items():
        item = value[key]
        valid = type(item) is typ
        if typ is float:
            valid = type(item) in (int, float) and math.isfinite(item) and item >= 0
        if not valid:
            raise ValueError(kind+': invalid '+key)
    if kind == 'ComputeBudget' and (value['max_trials'] < 1 or value['task_calls'] < 1 or
            value['wall_seconds'] <= 0 or value['concurrency'] != 1 or value['retry_cap'] != 0 or
            value['dollars'] != 0 or value['gpu_seconds'] != 0):
        raise ValueError('pilot supports bounded serial CPU work only; no retries or spend')
    if kind == 'DatasetSplit' and (set(value['dev_ids']) & set(value['evaluation_ids']) or
            not value['dev_ids'] or not value['evaluation_ids']):
        raise ValueError('disjoint nonempty partitions required')
    if kind == 'MetricDefinition' and value['direction'] not in {'maximize', 'minimize'}:
        raise ValueError('invalid metric direction')
    if kind == 'ExperimentSpec':
        validate('ComputeBudget', value['budget'])
        validate('ComputeBudget', value['aggregate_budget'])
        validate('DatasetSplit', value['dataset'])
        for metric in value['metrics']:
            validate('MetricDefinition', metric)
        if value['trials_per_arm'] + value['evaluation_trials'] != value['budget']['max_trials']:
            raise ValueError('trial budget mismatch')
        count = len(value['seeds'])*len(value['arms'])
        for key in ('max_trials', 'task_calls', 'wall_seconds'):
            if value['aggregate_budget'][key] != count*value['budget'][key]:
                raise ValueError('aggregate budget mismatch')
    if kind == 'TrialResult' and (value['status'] not in {'completed', 'failed', 'inconclusive'} or
            value['phase'] not in {'development', 'evaluation'} or
            not 0 <= value['successes'] <= value['task_count'] <= value['charged_calls']):
        raise ValueError('invalid trial result')
    if kind == 'PromotionDecision' and value['eligible'] != all(value['gates'].values()):
        raise ValueError('decision disagrees with gates')
    return value


def schemas():
    types = {str: 'string', int: 'integer', float: 'number', bool: 'boolean', list: 'array', dict: 'object'}
    return {name: {'$schema': 'https://json-schema.org/draft/2020-12/schema',
                   '$id': 'urn:hive:'+name+':1', 'type': 'object',
                   'properties': {key: {'type': types[typ]} for key, typ in fields.items()},
                   'required': list(fields), 'additionalProperties': False}
            for name, fields in FIELDS.items()}
