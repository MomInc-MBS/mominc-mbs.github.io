"""Finite, executable routing hypotheses; no weight-training claims."""

def propose(failure, policy):
    category = (failure or {}).get('failure_category', 'EXPERIMENTAL')
    route = 'tool' if category in ('MODEL', 'EVALUATION', 'MATHEMATICAL') else 'local_tool'
    return {'version': 1, 'mechanism': 'routing_policy', 'mode': 'ucb',
            'route': route, 'baseline_mode': 'fixed', 'ablation_mode': 'fixed',
            'hypothesis': 'Development-only verified feedback improves routing on unseen task families.',
            'falsifier': 'Paired held-out quality CI lower bound is not positive or a hard gate fails.',
            'max_candidates': 1, 'policy_version': policy.get('version', 1),
            'model_weight_training': False}
