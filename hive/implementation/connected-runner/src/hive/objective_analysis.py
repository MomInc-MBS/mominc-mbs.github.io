"""Descriptive objective comparisons, not statistical promotion or policy updates.

Route IDs group repeated observations. Means describe valid rows only; invalid
rows are counted and excluded. Constraint compliance is checked on every valid
row, not just averages. Ties resolve by sorted route ID for reproducibility.
"""
import math
from .metric_engine import utility

CONSTRAINTS = {'max_unsupported': 0.0, 'max_latency_s': 120.0, 'max_tokens': 128.0}


def compare_objectives(observations):
    groups = {}
    invalid = 0
    for observation in observations:
        if not isinstance(observation, dict) or type(observation.get('valid')) is not bool:
            raise ValueError('observation requires an explicit valid boolean')
        if observation['valid'] is False:
            invalid += 1
            continue
        route = observation.get('route')
        if not isinstance(route, str) or not route.strip():
            raise ValueError('valid observation requires route ID')
        values = [observation.get(k) for k in ('quality', 'unsupported', 'latency_s', 'tokens')]
        # Shared metric domain validation; no invalid record can become a winner.
        utility(*values)
        groups.setdefault(route, []).append(values)
    routes = {}
    for route, rows in sorted(groups.items()):
        means = [math.fsum(row[i] for row in rows) / len(rows) for i in range(4)]
        routes[route] = dict(zip(('quality', 'unsupported', 'latency_s', 'tokens'), means))
        routes[route].update(n=len(rows), utility=utility(*means), feasible=all(
            row[1] <= CONSTRAINTS['max_unsupported'] and row[2] <= CONSTRAINTS['max_latency_s']
            and row[3] <= CONSTRAINTS['max_tokens'] for row in rows))
    def select(candidates, key):
        return max(candidates, key=key) if candidates else None
    def lex(route):
        r = routes[route]
        return (r['quality'], -r['unsupported'], -r['latency_s'], -r['tokens'])
    def vector(route):
        r = routes[route]
        return (r['quality'], -r['unsupported'], -r['latency_s'], -r['tokens'])
    def dominates(a, b):
        av, bv = vector(a), vector(b)
        return all(x >= y for x, y in zip(av, bv)) and any(x > y for x, y in zip(av, bv))
    feasible = [route for route, row in routes.items() if row['feasible']]
    return {'version': 1, 'utility_selected': select(routes, lambda route: routes[route]['utility']),
            'constrained_selected': select(feasible, lambda route: routes[route]['utility']),
            'lexicographic_selected': select(routes, lex),
            'pareto': [route for route in routes if not any(dominates(other, route) for other in routes)],
            'routes': routes, 'constraints': dict(CONSTRAINTS), 'invalid_excluded': invalid,
            'interpretation': 'Descriptive observed route means; no superiority or promotion claim.'}


def prior_sensitivity(successes, failures):
    """Beta posterior means of observed pass rates, not specific-claim truth."""
    if type(successes) is not int or type(failures) is not int or min(successes, failures) < 0:
        raise ValueError('nonnegative integer pass/failure counts required')
    n = successes + failures
    return {'successes': successes, 'failures': failures, 'n': n,
            'observed_pass_rate': successes / n if n else None,
            'estimates': [{'alpha': a, 'beta': a, 'posterior_mean': (successes + a) / (n + 2 * a)}
                          for a in (0.5, 1.0, 2.0)],
            'interpretation': 'Observed pass reliability under comparable tested conditions; not claim truth probability.'}
