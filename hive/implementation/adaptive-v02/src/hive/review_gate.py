"""Fail-closed promotion contract.

Required true booleans: provenance_valid, critical_passed, reviewer_independent,
holdout_locked, holdout_unused_for_learning, no_regression, within_budget,
fresh_process_reproduced, ablation_passed. author_id and reviewer_id must be
nonempty distinct strings. paired_summary must contain n, delta, variance,
ci_low, ci_high (finite numbers); n >= 24, delta > 0, ci_low > 0.
The caller independently establishes provenance and reviewer identity; this pure
function cannot attest that an artifact or reviewer really exists.
"""
import math

REQUIRED_FLAGS = ('provenance_valid', 'critical_passed', 'reviewer_independent',
                  'holdout_locked', 'holdout_unused_for_learning', 'no_regression',
                  'within_budget', 'fresh_process_reproduced', 'ablation_passed')


def evaluate(evidence):
    if not isinstance(evidence, dict):
        return {'decision': 'QUARANTINE', 'reasons': ['evidence must be a mapping']}
    missing, failed = [], []
    for key in REQUIRED_FLAGS:
        value = evidence.get(key)
        if value is False:
            failed.append(key + ' failed')
        elif value is not True:
            missing.append(key + ' requires explicit true evidence')
    author, reviewer = evidence.get('author_id'), evidence.get('reviewer_id')
    if not isinstance(author, str) or not author.strip() or not isinstance(reviewer, str) or not reviewer.strip():
        missing.append('author_id and reviewer_id required')
    elif author.strip().casefold() == reviewer.strip().casefold():
        failed.append('reviewer must be separate from author')
    summary = evidence.get('paired_summary', {})
    fields = ('delta', 'variance', 'ci_low', 'ci_high')
    if not isinstance(summary, dict) or any(isinstance(summary.get(k), bool) or not isinstance(summary.get(k), (int, float)) or not math.isfinite(summary[k]) for k in fields):
        missing.append('finite paired statistics required')
    else:
        n = summary.get('n')
        if type(n) is not int or n < 24:
            missing.append('at least 24 matched held-out tasks required')
        if summary['variance'] < 0 or summary['ci_low'] > summary['ci_high'] or not summary['ci_low'] <= summary['delta'] <= summary['ci_high']:
            missing.append('inconsistent paired statistics')
        elif summary['delta'] <= 0 or summary['ci_low'] <= 0:
            failed.append('paired quality improvement not established')
    return {'decision': 'REJECT' if failed else 'QUARANTINE' if missing else 'PROMOTE', 'reasons': failed + missing}
