"""Paired descriptive assessment for an EXPERIMENTAL incumbent update only.

Malformed, missing, duplicate, unpaired, or unusable evidence raises ValueError;
invalid rows are never silently dropped. This function cannot attest provenance,
the verifier, matched model/budget conditions, or frozen utility weights. Callers
must establish those conditions independently before comparing the supplied rows.

Binary quality has exact ties. Experimental acceptance requires a strict quality
gain; utility/latency alone cannot establish improvement from a noisy single run.
UTILITY_TOLERANCE=1e-12 is used only to describe utility wins and ties.
A critical task losing its pass blocks adoption.

The comparison baseline is the experimental incumbent, not evidence of superiority
over the strongest fixed tool baseline. Family dispersion describes this finite
batch; tasks and families are not assumed independently sampled. No confidence
interval, p-value, power guarantee, or formal significance is claimed. Repeated
validation selection and optional stopping can overfit even this deterministic
rule: record every attempt, bound rounds, then freeze before an unused holdout and
independent review. Accepted updates NEVER grant promotion permission.
"""

import math


UTILITY_TOLERANCE = 1e-12


def _number(value, field):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f'{field} requires a finite number')
    try:
        finite = math.isfinite(value)
    except (OverflowError, ValueError):
        finite = False
    if not finite:
        raise ValueError(f'{field} requires a finite number')
    return value


def _index(rows, name):
    if not isinstance(rows, list) or not rows:
        raise ValueError(f'{name} requires a nonempty list of evidence rows')
    result = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError(f'{name} evidence row requires a mapping')
        task_id, category = row.get('task_id'), row.get('category')
        if not isinstance(task_id, str) or not task_id.strip():
            raise ValueError(f'{name} requires a nonempty task_id')
        if not isinstance(category, str) or not category.strip():
            raise ValueError(f'{name} requires a nonempty category')
        if task_id in result:
            raise ValueError(f'{name} contains duplicate task_id: {task_id}')
        for field in ('valid', 'passed', 'critical'):
            if type(row.get(field)) is not bool:
                raise ValueError(f'{name} {field} requires an explicit boolean')
        if row['valid'] is not True:
            raise ValueError(f'{name} contains unusable evidence: {task_id}')
        for field in ('utility', 'latency_s', 'tokens'):
            value = _number(row.get(field), field)
            if field != 'utility' and value < 0:
                raise ValueError(f'{field} must be nonnegative')
        result[task_id] = row
    return result


def _mean(values):
    # Scale before summing to avoid overflow for large finite utility values.
    try:
        return _number(math.fsum(value / len(values) for value in values), 'mean')
    except OverflowError as exc:
        raise ValueError('derived metrics must remain finite') from exc


def _summary(pairs):
    quality_differences = [int(c['passed']) - int(b['passed']) for b, c in pairs]
    utility_differences = [_number(c['utility'] - b['utility'], 'utility delta')
                           for b, c in pairs]
    return {
        'n': len(pairs),
        'baseline_quality': sum(b['passed'] for b, _ in pairs) / len(pairs),
        'candidate_quality': sum(c['passed'] for _, c in pairs) / len(pairs),
        'quality_delta': sum(quality_differences) / len(pairs),
        'baseline_utility': _mean([b['utility'] for b, _ in pairs]),
        'candidate_utility': _mean([c['utility'] for _, c in pairs]),
        'utility_delta': _mean(utility_differences),
        'wins': sum(delta > 0 for delta in quality_differences),
        'losses': sum(delta < 0 for delta in quality_differences),
        'ties': sum(delta == 0 for delta in quality_differences),
        'utility_wins': sum(delta > UTILITY_TOLERANCE for delta in utility_differences),
        'utility_losses': sum(delta < -UTILITY_TOLERANCE for delta in utility_differences),
        'utility_ties': sum(abs(delta) <= UTILITY_TOLERANCE for delta in utility_differences),
        'latency_delta_s': _mean([c['latency_s'] - b['latency_s'] for b, c in pairs]),
        'tokens_delta': _mean([c['tokens'] - b['tokens'] for b, c in pairs]),
    }


def _dispersion(values):
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    middle = ordered[midpoint:midpoint + 1] if len(ordered) % 2 else ordered[midpoint - 1:midpoint + 1]
    return {'min': min(values), 'max': max(values),
            'equal_family_mean': _mean(values),
            'median': _mean(middle)}


def assess_candidate(baseline: list[dict], candidate: list[dict]) -> dict:
    """Assess matched usable rows; return descriptive experimental acceptance.

    Raises ValueError on every malformed input, including explicit valid=False.
    Input order is immaterial; IDs are unique and must match exactly, as must
    category and critical flags. Additional row fields are ignored. Numeric token
    counts follow metric_engine's nonnegative finite domain (fractional permitted).
    """
    baseline_rows = _index(baseline, 'baseline')
    candidate_rows = _index(candidate, 'candidate')
    if baseline_rows.keys() != candidate_rows.keys():
        raise ValueError('baseline and candidate require identical task IDs')
    pairs, families, critical_regressions = [], {}, []
    for task_id in sorted(baseline_rows):
        b, c = baseline_rows[task_id], candidate_rows[task_id]
        if b['category'] != c['category'] or b['critical'] != c['critical']:
            raise ValueError(f'category and critical attributes must match: {task_id}')
        pairs.append((b, c))
        families.setdefault(b['category'], []).append((b, c))
        if b['critical'] and b['passed'] and not c['passed']:
            critical_regressions.append(task_id)
    summary = _summary(pairs)
    by_family = {category: _summary(rows) for category, rows in sorted(families.items())}
    improved = summary['wins'] > summary['losses']
    reasons = []
    if critical_regressions:
        reasons.append('critical pass regression blocks experimental adoption')
    if summary['wins'] < summary['losses']:
        reasons.append('paired quality regressed')
    elif summary['wins'] == summary['losses']:
        reasons.append('quality tied; utility-only changes cannot establish improvement')
    else:
        reasons.append('paired quality improved')
    reasons.append('experimental incumbent comparison only; independent promotion gate required')
    return {
        **summary, 'valid_n': len(pairs),
        'accepted': improved and not critical_regressions,
        'promote_eligible': False,
        'reasons': reasons,
        'critical_regression': bool(critical_regressions),
        'critical_regressions': critical_regressions,
        'by_family': by_family,
        'utility_tolerance': UTILITY_TOLERANCE,
        'comparison_baseline': 'experimental_incumbent',
        'family_uncertainty': {
            'method': 'descriptive_family_dispersion',
            'n_families': len(by_family),
            'quality_delta': _dispersion([s['quality_delta'] for s in by_family.values()]),
            'utility_delta': _dispersion([s['utility_delta'] for s in by_family.values()]),
            'interpretation': 'Observed family means and range; no independent sampling, '
                              'confidence interval, or significance claim. Overall deltas '
                              'are task-weighted; family means weight categories equally.',
        },
    }
