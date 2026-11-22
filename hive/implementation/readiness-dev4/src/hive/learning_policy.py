"""Deterministic, category-bucketed routing; only development can train state."""
import copy
import math
import random


class Policy:
    MODES = ('fixed', 'greedy', 'ucb', 'random')

    def __init__(self, mode='ucb', state=None, seed=42, version=1):
        if state is not None:
            mode = state['mode']
            seed = state['seed']
            version = state.get('version', 1)
        if type(version) is not int or version not in (1, 2):
            raise ValueError('unsupported policy version')
        self.version = version
        if mode not in self.MODES:
            raise ValueError('unknown policy mode')
        self.mode, self.seed = mode, seed
        self.counts = copy.deepcopy(state.get('counts', {})) if state else {}
        self.rng = random.Random(seed)
        if state and 'rng_state' in state:
            def tuples(value):
                return tuple(tuples(v) for v in value) if isinstance(value, (list, tuple)) else value
            self.rng.setstate(tuples(state['rng_state']))

    def choose(self, category, routes):
        # A mapping may mark infeasible routes False; lists are prefiltered by caller.
        options = [r for r, feasible in routes.items() if feasible is True] if isinstance(routes, dict) else list(routes)
        if not options or any(not isinstance(r, str) or not r for r in options):
            raise ValueError('nonempty feasible routes required')
        options = list(dict.fromkeys(options))
        # Version 1 remains reproducible for historical missions. Version 2
        # protects exact built-in work; the governor has already checked tool
        # scope, permissions, verifier and resource eligibility.
        exact_categories = {'math', 'structured_data', 'tool_routing', 'coordination',
                            'hallucination', 'adaptation', 'code_repair', 'video_captions'}
        if self.version == 2 and category in exact_categories and 'tool' in options:
            return 'tool'
        if self.mode == 'fixed':
            return options[0]
        if self.mode == 'random':
            return self.rng.choice(options)
        bucket = self.counts.get(category, {})
        total = sum(v['n'] for v in bucket.values())
        def score(route):
            v = bucket.get(route, {'n': 0, 'successes': 0, 'utility_sum': 0.0})
            if self.mode == 'greedy':
                return (v['successes'] + 1) / (v['n'] + 2)
            mean = v['utility_sum'] / v['n'] if v['n'] else 0.0
            return mean + math.sqrt(math.log1p(total) / (1 + v['n']))
        # UCB cold starts explicitly sample each available route once.
        if self.mode == 'ucb':
            for route in options:
                if not bucket.get(route, {}).get('n', 0):
                    return route
        return max(options, key=score)

    def observe(self, category, route, quality, utility, valid=True, split='development'):
        if valid is not True or split != 'development':
            return False
        if quality not in (0, 1) or not math.isfinite(utility):
            raise ValueError('binary verified quality and finite utility required')
        v = self.counts.setdefault(category, {}).setdefault(route, {'n': 0, 'successes': 0, 'utility_sum': 0.0})
        v['n'] += 1
        v['successes'] += quality
        v['utility_sum'] += utility
        return True

    def snapshot(self):
        # JSON serialization converts RNG tuples to arrays; constructor restores them.
        return copy.deepcopy({'version': self.version, 'mode': self.mode, 'seed': self.seed,
                              'counts': self.counts, 'rng_state': self.rng.getstate()})
