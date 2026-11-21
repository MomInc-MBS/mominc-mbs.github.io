"""Optional trusted proposal process. stdin contains development summaries only.

No file paths, holdout labels, evaluator or permission mutations in this API.
Optuna is imported only here. The process is not an OS hostile-code sandbox.
"""
import json
from pathlib import Path
import sys
import hashlib
import importlib.metadata

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))


def environment():
    packages, records = {}, {}
    for item in importlib.metadata.distributions():
        name = item.metadata['Name'].lower().replace('_', '-')
        packages[name] = item.version
        records[name] = hashlib.sha256((item.read_text('RECORD') or '').encode()).hexdigest()
    return {'packages': packages, 'installed_records_sha256': records}


def propose(request):
    import optuna
    from tools.hive_engine.recipes import SPECIALISTS, THRESHOLDS, recipe
    optuna.logging.set_verbosity(optuna.logging.ERROR)
    if optuna.__version__ != '5.1.0':
        raise ValueError('Optuna version differs from audited lock')
    study = optuna.create_study(directions=['maximize', 'minimize'],
        sampler=optuna.samplers.TPESampler(seed=request['seed']+request['index'], n_startup_trials=2))
    distributions = {'specialist': optuna.distributions.CategoricalDistribution(SPECIALISTS),
                     'threshold': optuna.distributions.CategoricalDistribution(THRESHOLDS)}
    for item in request['history']:
        if item['status'] != 'completed':
            continue
        study.add_trial(optuna.trial.create_trial(
            params={'specialist': item['recipe']['specialist'], 'threshold': item['recipe']['escalate_above_bytes']},
            distributions=distributions, values=[item['quality'], item['latency']]))
    trial = study.ask()
    return recipe(trial.suggest_categorical('specialist', SPECIALISTS),
                  trial.suggest_categorical('threshold', THRESHOLDS))


if __name__ == '__main__':
    request = json.loads(sys.stdin.read(1048576))
    identity = environment()
    if request.get('mode') == 'environment':
        result = identity
    else:
        if identity != request['environment']:
            raise ValueError('optimizer installation changed')
        result = propose(request)
    print(json.dumps(result, allow_nan=False))
