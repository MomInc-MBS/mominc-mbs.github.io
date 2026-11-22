"""Deterministic, category-bucketed routing; only development can train state."""
import copy
import math
import random

from .governor import P2_EXACT_TOOL_CATEGORIES


class Policy:
    MODES = ('fixed', 'greedy', 'ucb', 'random')

    def __init__(self, mode='ucb', state=None, seed=42, version=1, memory_enabled=True):
        if state is not None:
            mode = state['mode']
            seed = state['seed']
            version = state.get('version', 1)
            if version == 4:
                memory_enabled = state.get('memory_enabled', True)
        if type(version) is not int or version not in (1, 2, 3, 4):
            raise ValueError('unsupported policy version')
        if version == 4 and type(memory_enabled) is not bool:
            raise ValueError('P2 v4 memory_enabled must be boolean')
        self.version = version
        if mode not in self.MODES:
            raise ValueError('unknown policy mode')
        self.mode, self.seed = mode, seed
        self.counts = copy.deepcopy(state.get('counts', {})) if state else {}
        self.memory_enabled = memory_enabled if version == 4 else True
        self.partitions = copy.deepcopy(state.get('partitions', {})) if state and version == 4 else {}
        self.rng = random.Random(seed)
        if state and 'rng_state' in state:
            def tuples(value):
                return tuple(tuples(v) for v in value) if isinstance(value, (list, tuple)) else value
            self.rng.setstate(tuples(state['rng_state']))

    def choose(self, category, routes, *, partition_keys=None):
        # A mapping may mark infeasible routes False; lists are prefiltered by caller.
        options = [r for r, feasible in routes.items() if feasible is True] if isinstance(routes, dict) else list(routes)
        if not options or any(not isinstance(r, str) or not r for r in options):
            raise ValueError('nonempty feasible routes required')
        options = list(dict.fromkeys(options))
        # Versions 1 and 2 retain their historical semantics. Versions 3 and
        # 4 are quarantined P2 candidates; governor eligibility is applied first.
        if self.version == 4 and category in P2_EXACT_TOOL_CATEGORIES and 'tool' not in options:
            raise ValueError('P2 v4 exact categories require the deterministic tool or abstention')
        if self.version in (2, 3, 4) and category in P2_EXACT_TOOL_CATEGORIES and 'tool' in options:
            return 'tool'
        if self.mode == 'fixed':
            return options[0]
        if self.mode == 'random':
            return self.rng.choice(options)
        bucket = self.counts.get(category, {})
        if self.version == 4:
            bucket = {}
            if self.memory_enabled and isinstance(partition_keys, dict):
                bucket = {route: self.partitions.get(partition_keys.get(route), {}).get(category, {}).get(
                    route, {'n': 0, 'successes': 0, 'utility_sum': 0.0})
                    for route in options if partition_keys.get(route)}
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

    def observe(self, category, route, quality, utility, valid=True, split='development', *, partition_key=None):
        if self.version == 4:
            if not isinstance(partition_key, str) or not partition_key.strip():
                raise ValueError('P2 v4 feedback requires a valid partition key')
            if not self.memory_enabled:
                return False
        if valid is not True or split != 'development':
            return False
        if quality not in (0, 1) or not math.isfinite(utility):
            raise ValueError('binary verified quality and finite utility required')
        if self.version == 4:
            v = self.partitions.setdefault(partition_key, {}).setdefault(category, {}).setdefault(
                route, {'n': 0, 'successes': 0, 'utility_sum': 0.0})
        else:
            v = self.counts.setdefault(category, {}).setdefault(route, {'n': 0, 'successes': 0, 'utility_sum': 0.0})
        v['n'] += 1
        v['successes'] += quality
        v['utility_sum'] += utility
        return True

    def confidence_provenance(self, category, route, partition_key=None):
        if self.version != 4 or not self.memory_enabled or not partition_key:
            return {'kind': 'unmeasured'}
        row = self.partitions.get(partition_key, {}).get(category, {}).get(route)
        if not row or not row.get('n'):
            return {'kind': 'unmeasured', 'partition_key': partition_key}
        return {'kind': 'verified_partition', 'partition_key': partition_key,
                'observations': row['n'], 'quality_rate': row['successes'] / row['n'],
                'mean_utility': row['utility_sum'] / row['n']}

    def snapshot(self):
        # JSON serialization converts RNG tuples to arrays; constructor restores them.
        record = {'version': self.version, 'mode': self.mode, 'seed': self.seed,
                  'counts': self.counts, 'rng_state': self.rng.getstate()}
        if self.version == 4:
            record.update(memory_enabled=self.memory_enabled, partitions=self.partitions)
        return copy.deepcopy(record)
