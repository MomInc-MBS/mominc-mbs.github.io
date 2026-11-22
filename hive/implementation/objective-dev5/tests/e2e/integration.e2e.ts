import { test, expect } from 'e2e';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const python = process.env.HIVE_PYTHON || 'python';
function hive(store: string, ...args: string[]) {
  return JSON.parse(execFileSync(python, ['-m', 'hive', '--store', store, ...args], {
    env: { ...process.env, PYTHONPATH: resolve('src') }, encoding: 'utf8', timeout: 20000,
  }));
}

test('integrated tool CLI preserves candidate rejection, STOP, restart and experimental rollback', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hive-integration-e2e-'));
  const store = join(directory, 'state');
  const manifest = JSON.parse(readFileSync('experiments/manifests/integration-20261121.json', 'utf8'));
  manifest.train = ['inventory-train'];
  manifest.comparison = ['inventory-compare'];
  manifest.subsequent = ['inventory-subsequent'];
  manifest.tasks = Object.fromEntries([...manifest.train, ...manifest.comparison, ...manifest.subsequent]
    .map(id => [id, { ...manifest.tasks[id], permissions: { version: 1, routes: ['tool'] } }]));
  const manifestPath = join(directory, 'manifest.json');
  const configPath = join(directory, 'config.json');
  writeFileSync(manifestPath, JSON.stringify(manifest));
  writeFileSync(configPath, JSON.stringify({ routes: ['tool'], max_requests: 1, max_retries: 0 }));
  const args = ['integration', '--manifest', manifestPath, '--config', configPath];
  hive(store, 'stop');
  expect(hive(store, ...args).status).toBe('BLOCKED');
  expect(hive(store, 'status').budget?.requests ?? 0).toBe(0);
  hive(store, 'resume');
  const first = hive(store, ...args);
  expect(first.functional_missions_passed).toBe(true);
  expect(first.candidate_decision).toBe('REJECTED');
  expect(first.budget.requests).toBe(0);
  const rollback = hive(store, 'rollback', '--experimental', first.initial_snapshot);
  expect(rollback.governing_hash).toBe(first.governing_hash);
  hive(store, 'rollback', '--experimental', first.candidate_snapshot);
  const replay = hive(store, ...args);
  expect(replay.replayed).toBe(true);
  expect(replay.additional_model_calls).toBe(0);
  expect(hive(store, 'inspect', '--run', first.jobs[0]).verification.passed).toBe(true);
  expect(hive(store, 'status').budget).toEqual(first.budget);
});
