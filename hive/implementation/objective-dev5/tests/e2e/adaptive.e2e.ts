import { test, expect } from 'e2e';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Synthetic adapter only. Real model evidence is a separate bounded experiment.
const driver = `
import sys
import hive.orchestrator as runtime
from hive.experiment_runner import execute
from hive.cli import main
def synthetic(task, route, config):
    result = execute(task, 'tool', config)
    if route.startswith('local_'):
        result.update(model=config['model'], model_digest='synthetic-e2e', backend='synthetic')
    return result
runtime.execute = synthetic
runtime.model_registry.discover = lambda *_: {'available': True, 'models': [{'id': 'synthetic-e2e', 'digest': 'synthetic-e2e'}]}
raise SystemExit(main(sys.argv[1:]))
`;
const python = process.env.HIVE_PYTHON || 'python';
function hive(store: string, ...args: string[]) {
  return JSON.parse(execFileSync(python, ['-c', driver, '--store', store, ...args], {
    env: { ...process.env, PYTHONPATH: resolve('src') }, encoding: 'utf8', timeout: 20000,
  }));
}

test('adaptive CLI resumes after STOP and retains completed evidence without new work (synthetic)', () => {
  const store = mkdtempSync(join(tmpdir(), 'hive-adaptive-e2e-'));
  const config = join(store, 'config.json');
  writeFileSync(config, JSON.stringify({ model: 'synthetic-e2e' }));
  hive(store, 'stop');
  hive(store, 'adaptive', '--config', config, '--rounds', '3');
  const stopped = hive(store, 'status');
  expect(stopped.kill_switch).toBe(true);
  expect(stopped.budget?.requests ?? 0).toBe(0);
  hive(store, 'resume');
  const first = hive(store, 'adaptive', '--config', config, '--rounds', '3');
  expect(first.candidates).toHaveLength(3);
  expect(first.candidates.every((c: { promote_eligible: boolean }) => c.promote_eligible === false)).toBe(true);
  const status = hive(store, 'status');
  expect(status.champion).toBe(null);
  expect(status.adaptive.state).toBe('FINISHED');
  const again = hive(store, 'adaptive', '--config', config, '--rounds', '3');
  expect(again).toEqual(first);
  expect(hive(store, 'status').budget).toEqual(status.budget);
});
