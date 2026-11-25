from copy import deepcopy

CATEGORIES = {'ENVIRONMENT', 'IMPLEMENTATION', 'MATHEMATICAL', 'MODEL', 'EVALUATION', 'EXPERIMENTAL', 'PERMISSIONS'}

def triage(job, category, reason, evidence_paths=None):
    if category not in CATEGORIES: raise ValueError('unknown failure category')
    spec = job.get('spec', {})
    count = spec.get('retry_count', 0)
    if not isinstance(count, int) or isinstance(count, bool) or count < 0: raise ValueError('invalid retry_count')
    strategies = ['reproduce_and_instrument', 'challenge_diagnosis', 'alternate_strategy']
    next_spec = None
    if count < 3:
        next_spec = deepcopy(spec)
        next_spec.update(retry_count=count + 1, strategy=strategies[count], failure_category=category)
    return {'cycle_id': job.get('id', ''), 'failure_category': category, 'observed_failure': str(reason), 'reproduction_steps': ['Re-run the recorded input with the recorded configuration and inspect its evidence.'], 'evidence_paths': list(evidence_paths or []), 'root_cause_hypotheses': [f'{category.lower()} failure in the recorded execution', 'invalid or incomplete instrumentation'], 'next_test_that_discriminates_hypotheses': 'Compare an isolated reproduction with a known-good control.', 'proposed_change': strategies[count] if count < 3 else 'quarantine the persistent failure', 'owner': 'TERRA' if category in {'ENVIRONMENT','IMPLEMENTATION'} else 'SOL', 'retry_count': count, 'escalation_trigger': 'Block after the alternate strategy fails.', 'state': 'RETRY_READY' if next_spec else 'BLOCKED', 'next_spec': next_spec}
