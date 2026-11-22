import copy
import json

import pytest

from hive.adaptive_metrics import UTILITY_TOLERANCE, assess_candidate


def row(task_id='a', category='arithmetic', passed=False, critical=False, utility=0):
    return dict(task_id=task_id, category=category, valid=True, passed=passed,
                critical=critical, utility=utility, latency_s=1.0, tokens=8)


def test_quality_improvement_overrides_lower_utility_without_promoting():
    result = assess_candidate([row()], [row(passed=True, utility=-100)])
    assert result['accepted'] is True
    assert result['promote_eligible'] is False
    assert result['quality_delta'] == 1
    assert result['utility_delta'] == -100
    assert (result['wins'], result['losses'], result['ties']) == (1, 0, 0)
    assert result['n'] == result['valid_n'] == 1
    assert result['comparison_baseline'] == 'experimental_incumbent'


def test_critical_regression_blocks_net_quality_improvement():
    baseline = [row('a', passed=True, critical=True), row('b'), row('c')]
    candidate = [row('a', critical=True), row('b', passed=True), row('c', passed=True)]
    result = assess_candidate(baseline, candidate)
    assert result['quality_delta'] > 0
    assert result['accepted'] is False
    assert result['critical_regression'] is True
    assert result['critical_regressions'] == ['a']


def test_utility_cannot_rescue_quality_regression():
    result = assess_candidate([row(passed=True)], [row(utility=100)])
    assert result['accepted'] is False
    assert 'paired quality regressed' in result['reasons']


@pytest.mark.parametrize(('delta', 'accepted'), [
    (-1, False), (0, False), (UTILITY_TOLERANCE / 2, False),
    (UTILITY_TOLERANCE, False), (UTILITY_TOLERANCE * 2, False), (1.0, False),
])
def test_quality_ties_never_accept_utility_only_improvement(delta, accepted):
    result = assess_candidate([row()], [row(utility=delta)])
    assert result['accepted'] is accepted


def test_balanced_quality_changes_tie_even_when_different_tasks_pass():
    result = assess_candidate([row('a', passed=True), row('b')],
                              [row('a', utility=1), row('b', passed=True, utility=1)])
    assert result['quality_delta'] == 0
    assert (result['wins'], result['losses'], result['ties']) == (1, 1, 0)
    assert result['accepted'] is False


def test_family_dispersion_exposes_heterogeneity_and_weighting():
    baseline = [row('a'), row('b'), row('c', category='code', passed=True)]
    candidate = [row('a', passed=True), row('b', passed=True), row('c', category='code')]
    result = assess_candidate(baseline, candidate)
    assert result['quality_delta'] == pytest.approx(1 / 3)
    assert result['by_family']['arithmetic']['quality_delta'] == 1
    assert result['by_family']['code']['quality_delta'] == -1
    dispersion = result['family_uncertainty']
    assert dispersion['n_families'] == 2
    assert dispersion['quality_delta'] == dict(min=-1, max=1, equal_family_mean=0, median=0)
    assert 'confidence interval' in dispersion['interpretation']
    assert 'ci_low' not in dispersion


def test_order_independent_deterministic_and_does_not_mutate_evidence():
    baseline = [row('b', category='code'), row('a')]
    candidate = [row('a', passed=True), row('b', category='code')]
    before = copy.deepcopy((baseline, candidate))
    result = assess_candidate(baseline, candidate)
    assert result == assess_candidate(list(reversed(baseline)), list(reversed(candidate)))
    assert result == assess_candidate(baseline, candidate)
    assert (baseline, candidate) == before
    json.dumps(result, allow_nan=False)


@pytest.mark.parametrize('rows', [None, (), [], [None], [row(), row()]])
def test_bad_batch_or_duplicate_ids_fail_closed(rows):
    with pytest.raises(ValueError):
        assess_candidate(rows, [row()])
    with pytest.raises(ValueError):
        assess_candidate([row()], rows)


@pytest.mark.parametrize(('field', 'value'), [
    ('task_id', None), ('task_id', ' '), ('category', None), ('category', ''),
    ('valid', False), ('valid', 1), ('passed', 1), ('critical', 0),
    ('utility', None), ('utility', True), ('utility', float('nan')),
    ('utility', float('inf')), ('utility', -float('inf')),
    ('latency_s', -1), ('latency_s', float('nan')), ('tokens', -1),
    ('tokens', float('inf')), ('tokens', '8'), ('tokens', True),
])
def test_malformed_and_unusable_metrics_fail_on_either_side(field, value):
    bad = row()
    bad[field] = value
    with pytest.raises(ValueError):
        assess_candidate([bad], [row()])
    with pytest.raises(ValueError):
        assess_candidate([row()], [bad])


@pytest.mark.parametrize('field', ['task_id', 'category', 'valid', 'passed', 'critical',
                                  'utility', 'latency_s', 'tokens'])
def test_missing_required_field_fails_closed(field):
    bad = row()
    del bad[field]
    with pytest.raises(ValueError):
        assess_candidate([row()], [bad])


@pytest.mark.parametrize('candidate', [
    [row('different')], [row(), row('extra')],
    [row(category='code')], [row(critical=True)],
])
def test_unmatched_ids_categories_or_critical_attributes_fail(candidate):
    with pytest.raises(ValueError):
        assess_candidate([row()], candidate)


def test_finite_inputs_whose_difference_overflows_fail_closed():
    with pytest.raises(ValueError, match='finite'):
        assess_candidate([row(utility=-1e308)], [row(utility=1e308)])


def test_single_family_range_does_not_claim_population_uncertainty():
    result = assess_candidate([row()], [row(passed=True)])
    assert result['family_uncertainty']['n_families'] == 1
    assert result['family_uncertainty']['quality_delta']['min'] == 1
    assert result['family_uncertainty']['quality_delta']['max'] == 1
    assert result['promote_eligible'] is False


def test_large_finite_family_deltas_produce_serializable_descriptive_summary():
    baseline = [row('a'), row('b', category='code')]
    candidate = [row('a', utility=1e308), row('b', category='code', utility=1e308)]
    result = assess_candidate(baseline, candidate)
    assert result['utility_delta'] == 1e308
    assert result['family_uncertainty']['utility_delta']['median'] == 1e308
    json.dumps(result, allow_nan=False)
