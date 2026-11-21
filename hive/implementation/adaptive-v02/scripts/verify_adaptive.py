"""Reverify a finished adaptive run without inference and export aggregate evidence."""
import argparse
import json
from pathlib import Path

from hive.adaptive import run_adaptive
from hive.orchestrator import load_config
from hive.storage import Store


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--store', type=Path, required=True)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    store = Store(args.store)
    try:
        state = store.get('adaptive_campaign', {})
        if state.get('state') != 'FINISHED' or not state.get('report_ref'):
            raise ValueError('Verification requires an already finished adaptive run')
        saved = store.read_artifact(state['report_ref'])
        before_budget, before_jobs = store.get('budget'), len(store.jobs())
    finally:
        store.close()
    verified = run_adaptive(args.store, load_config(args.config),
                            seed=saved['plan']['seed'], rounds=saved['plan']['rounds'])
    store = Store(args.store)
    try:
        assert verified == saved, 'cached report changed'
        assert store.get('budget') == before_budget, 'verification spent mission budget'
        assert len(store.jobs()) == before_jobs, 'verification created new work'
        rows = state['progress']['rows']
        groups = {'baseline': [v['baseline']['evidence_ref'] for v in rows['validation'].values()]}
        for name in saved['plan']['validation']['candidates']:
            groups[name] = [v[name]['evidence_ref'] for v in rows['validation'].values()]
        outcomes = {}
        for name, refs in groups.items():
            bundles = [store.read_artifact(ref) for ref in refs]
            outcomes[name] = {
                'n': len(bundles), 'valid': sum(b['verification']['valid'] for b in bundles),
                'passed': sum(b['verification']['passed'] for b in bundles),
                'tokens': sum(b['result']['tokens'] for b in bundles),
                'latency_s': sum(b['result']['latency_s'] for b in bundles),
            }
        result = {
            'verified': True, 'fresh_process': True, 'new_model_calls': 0,
            'report_ref': state['report_ref'], 'run_id': saved['run_id'],
            'build': saved['build'], 'model': store.get('adaptive_model_binding'),
            'evidence_jobs': before_jobs, 'budget': before_budget,
            'outcomes': outcomes, 'experimental_incumbent': saved['experimental_incumbent'],
            'current_checkpoint': store.get('current_checkpoint'),
            'limitation': 'Six synthetic families; repeated selection validation, no unused holdout or generalization claim.',
        }
    finally:
        store.close()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
