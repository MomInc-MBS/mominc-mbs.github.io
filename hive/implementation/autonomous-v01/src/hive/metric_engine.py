"""Version 1 metrics, frozen defaults: T_ref=120 seconds; K_ref=128 tokens."""
import math
import random
import statistics

DEFAULT_WEIGHTS = {'quality': 1.0, 'unsupported': 1.0, 'latency': 0.05,
                   'tokens': 0.05, 'robustness': 0.25}
T_REF = 120.0
K_REF = 128.0


def utility(quality, unsupported, latency_s, tokens, robustness=0, weights=None):
    values = (quality, unsupported, latency_s, tokens, robustness)
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in values):
        raise ValueError('finite numeric metrics required')
    if not all(0 <= v <= 1 for v in (quality, unsupported, robustness)) or min(latency_s, tokens) < 0:
        raise ValueError('metrics outside domain')
    w = dict(DEFAULT_WEIGHTS) if weights is None else dict(weights)
    if set(w) != set(DEFAULT_WEIGHTS) or any(not isinstance(v, (int, float)) or not math.isfinite(v) or v < 0 for v in w.values()):
        raise ValueError('complete nonnegative finite weights required')
    return w['quality'] * quality - w['unsupported'] * unsupported - w['latency'] * latency_s / T_REF - w['tokens'] * tokens / K_REF - w['robustness'] * robustness


def paired_summary(candidate, baseline, seed=42):
    if not candidate or len(candidate) != len(baseline):
        raise ValueError('nonempty matched arrays required')
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in list(candidate) + list(baseline)):
        raise ValueError('finite numeric samples required')
    differences = [a - b for a, b in zip(candidate, baseline)]
    n = len(differences)
    delta = statistics.mean(differences)
    variance = statistics.variance(differences) if n > 1 else 0.0
    rng = random.Random(seed)
    boot = sorted(statistics.mean(rng.choices(differences, k=n)) for _ in range(4000))
    # Degenerate paired distributions have no standardized finite effect; use None.
    return {'n': n, 'delta': delta, 'variance': variance, 'ci_low': boot[99],
            'ci_high': boot[3899], 'effect_size': delta / math.sqrt(variance) if variance else None,
            'method': 'paired-percentile-bootstrap-95-v1', 'bootstrap_samples': 4000, 'seed': seed}
