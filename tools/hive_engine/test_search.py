"""Experiment boundaries, interrupted trials and independent recipe execution."""
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from . import contracts, effects, recipes, search
from .adapters import Registry
from .core import Store, digest
from .runtime import Runtime, BASELINE, task_for
from .test_runtime import FakeAdapter, GOOD


class SearchTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.store = Store(self.root/'search.sqlite')
        self.addCleanup(self.store.close)

    def test_closed_contracts_and_permissions_cannot_be_search_parameters(self):
        for changed in ({'verification': 'never'}, {'retry_cap': 1}, {'parallelism': 2},
                        {'permissions': ['network']}, {'specialist': '../arbitrary.py'}):
            with self.assertRaises(ValueError):
                recipes.validate(recipes.recipe() | changed)
        spec = search.specification()
        with self.assertRaises(ValueError):
            contracts.validate('ExperimentSpec', spec | {'budget': spec['budget'] | {'gpu_seconds': 1}})
        with self.assertRaises(ValueError):
            contracts.validate('DatasetSplit', spec['dataset'] | {'evaluation_ids': spec['dataset']['dev_ids']})

    def test_stateful_unknown_blocks_duplicate_until_reconciled(self):
        journal = effects.EffectJournal(self.store)
        journal.begin('stable-1', {'operation': 'test-only'})
        # Reopen semantics are the persisted ledger, no in-memory retry flag.
        journal = effects.EffectJournal(self.store)
        with self.assertRaisesRegex(ValueError, 'outcome_unknown'):
            journal.begin('stable-1', {'operation': 'test-only'})
        journal.reconcile('stable-1', 'not_applied', 'independent fake remote query: absent')
        journal.begin('stable-1', {'operation': 'test-only'})
        journal.reconcile('stable-1', 'applied', 'independent fake receipt')
        with self.assertRaises(ValueError):
            journal.begin('stable-1', {'operation': 'test-only'})
        with self.assertRaises(ValueError):
            journal.begin('stable-1', {'operation': 'changed'})

    def test_current_runtime_refuses_stateful_adapter(self):
        fake = FakeAdapter('rules')
        cap = fake.manifest() | {'effects': 'stateful'}
        source = self.root/'input.srt'
        source.write_bytes(GOOD)
        app = Runtime(self.root/'runtime', Registry([fake]))
        self.addCleanup(app.close)
        with patch.object(fake, 'manifest', return_value=cap), patch.object(app.__class__, 'active_policy', property(lambda _: __import__('tools.hive_engine.runtime', fromlist=['policy_for']).policy_for('rules'))):
            row = app.run(task_for(source), self.root)
        self.assertFalse(row['passed'])
        self.assertEqual([], fake.calls)

    def test_interrupted_trial_is_retained_without_reexecution(self):
        plan = dict(trial_id='development-11-static-0', arm='static', seed=11, index=0,
                    phase='development', state_ref='trials/unknown', reserved_seconds=45, task_order=['x']*48)
        self.store.append('SearchTrialPlan', plan)
        search.recover_pending(self.store, self.root)
        with patch.object(search, 'proposal', side_effect=AssertionError('must not retry')):
            search.execute_trial(self.root, self.store, search.specification(), 'static', 11, 0, 'development', None)
        rows = self.store.records('TrialResult')
        self.assertEqual(1, len(rows))
        self.assertEqual('inconclusive', rows[0]['status'])
        self.assertEqual(45, rows[0]['wall_seconds'])
        self.assertFalse(rows[0]['cost_known'])
        self.assertEqual(48, rows[0]['charged_calls'])

    def test_optimizer_history_excludes_evaluation_and_selection_requires_quality(self):
        value = recipes.recipe('probe')
        self.store.append('CandidateLineage', {'candidate_hash': digest(value), 'recipe': value})
        plan = dict(trial_id='dev', arm='random', seed=11, index=0, phase='development',
                    state_ref='trials/dev', candidate_hash=digest(value))
        row = search.result_for(plan, [], 1.0, 'completed', 'fixture')
        row.update(task_count=48, charged_calls=48, successes=47, mean_wall_seconds=.001)
        self.store.append('TrialResult', row)
        self.store.append('TrialResult', row | {'trial_id': 'eval', 'phase': 'evaluation', 'successes': 48})
        self.assertEqual(['dev'], [r['trial_id'] for r in search.history_for(self.store, 'random', 11)])
        self.assertIsNone(search.select(self.store, 'random', 11))

    def test_normal_recipe_runs_without_optimizer_and_audits(self):
        spec = search.specification()
        search.append(self.store, 'ExperimentSpec', spec)
        search.write(self.root/'experiment.json', spec)
        with patch.object(search, 'proposal', return_value=recipes.recipe()):
            search.execute_trial(self.root, self.store, spec, 'static', 11, 0, 'development', None)
        row, = self.store.records('TrialResult')
        self.assertEqual(('completed', 48, 48), (row['status'], row['task_count'], row['successes']))
        search.write(self.root/'results.json', search.summarize(self.root, self.store, spec))
        self.assertEqual(48, search.check(self.root)['episodes'])
        report = json.loads((self.root/'results.json').read_text())
        report['arms']['static']['task_calls'] = 0
        search.write(self.root/'results.json', report)
        with self.assertRaisesRegex(ValueError, 'does not recompute'):
            search.check(self.root)

    def test_audit_rejects_source_drift_and_early_selection(self):
        spec = search.specification()
        search.append(self.store, 'ExperimentSpec', spec)
        search.write(self.root/'experiment.json', spec)
        search.write(self.root/'results.json', search.summarize(self.root, self.store, spec))
        with patch.object(search, 'source_hashes', return_value={}):
            with self.assertRaisesRegex(ValueError, 'source or dependency lock'):
                search.check(self.root)
        self.store.append('SearchSelections', {'11:static': recipes.recipe()})
        with self.assertRaisesRegex(ValueError, 'before development'):
            search.check(self.root)

    def test_crash_after_execution_retains_and_audits_partial_trial(self):
        spec = search.specification()
        search.append(self.store, 'ExperimentSpec', spec)
        search.write(self.root/'experiment.json', spec)
        original = search.append
        def fail_result(store, kind, record):
            if kind == 'TrialResult':
                raise RuntimeError('injected power loss before result')
            return original(store, kind, record)
        with patch.object(search, 'append', side_effect=fail_result):
            with self.assertRaisesRegex(RuntimeError, 'power loss'):
                search.execute_trial(self.root, self.store, spec, 'static', 11, 0, 'development', None)
        search.recover_pending(self.store, self.root)
        row, = self.store.records('TrialResult')
        self.assertEqual(('inconclusive', 48, 48), (row['status'], row['task_count'], row['charged_calls']))
        search.write(self.root/'results.json', search.summarize(self.root, self.store, spec))
        result = search.check(self.root)
        self.assertEqual((48, 1), (result['episodes'], result['inconclusive_trials']))

    @unittest.skipUnless(os.environ.get('HIVE_OPTUNA_PYTHON'), 'optional Optuna environment not requested')
    def test_pinned_optuna_process_replays_development_history(self):
        executable = os.environ['HIVE_OPTUNA_PYTHON']
        history = [dict(trial_id='x', status='completed', recipe=recipes.recipe('probe'), quality=.33, latency=.2),
                   dict(trial_id='y', status='completed', recipe=recipes.recipe(), quality=1., latency=.1)]
        first = search.proposal('optuna', 11, 2, history, executable, 15)
        self.assertEqual(first, search.proposal('optuna', 11, 2, history, executable, 15))
        recipes.validate(first)


if __name__ == '__main__':
    unittest.main()
