import pytest
from hive.storage import Store
from hive.work_queue import BuildQueue


def test_failed_build_continues_other_work_across_restart_without_reset(tmp_path):
    manifest = {'version': 1, 'authorization_ref': 'test-only engineering scope', 'items': [
        {'id': 'repair', 'owner': 'implementer', 'authorized': True, 'hypothesis': 'first cause',
         'next_command': 'trusted test', 'depends_on': []},
        {'id': 'package', 'owner': 'integrator', 'authorized': True, 'hypothesis': 'package reproduces',
         'next_command': 'trusted package check', 'depends_on': ['repair']},
        {'id': 'independent', 'owner': 'tester', 'authorized': True, 'hypothesis': 'other test works',
         'next_command': 'other trusted test', 'depends_on': []}]}
    store = Store(tmp_path); queue = BuildQueue(store)
    queue.initialize(manifest)
    store.set('budget', {'requests': 6})
    (tmp_path / 'STOP').write_text('mission stopped')
    for _ in range(2):
        result = queue.record('repair', outcome='failed', failure_signature='same failure', evidence={'receipt': 'failed assertion'})
    assert result['next_item'] == 'independent'
    assert result['items'][0]['status'] == 'BLOCKED_REVIEW'
    store.close()
    store = Store(tmp_path); queue = BuildQueue(store)
    assert queue.initialize(manifest)['next_item'] == 'independent'
    queue.record('independent', outcome='passed', evidence={'receipt': 'independent check'})
    assert queue.status()['next_item'] is None
    with pytest.raises(ValueError):
        queue.record('repair', outcome='failed', failure_signature='same failure', evidence={'receipt': 'third attempt'})
    review_ref = store.put_artifact({'item_id': 'repair', 'reviewer': 'tester', 'diagnosis': 'different root cause',
                                    'discriminating_test': 'new independent test'})
    with pytest.raises(ValueError):
        queue.revise('repair', hypothesis='first cause', review_ref=review_ref)
    queue.revise('repair', hypothesis='different cause with test', review_ref=review_ref)
    queue.record('repair', outcome='passed', evidence={'receipt': 'fixed check'})
    assert queue.status()['next_item'] == 'package'
    assert store.get('budget') == {'requests': 6}
    assert (tmp_path / 'STOP').exists()
    store.close()
