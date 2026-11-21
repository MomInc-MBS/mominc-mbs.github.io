import { test, expect } from 'e2e';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const python = process.env.HIVE_PYTHON || 'python';
const env = { ...process.env, PYTHONPATH: resolve('src') };
function hive(store: string, ...args: string[]) {
  return JSON.parse(execFileSync(python, ['-m', 'hive', '--store', store, ...args], { env, encoding: 'utf8', timeout: 20000 }));
}

test('CLI queues, stops, resumes, verifies and restores a task', async () => {
  const store = mkdtempSync(join(tmpdir(), 'hive-e2e-'));
  const task = hive(store, 'tasks')[0].id;
  const queued = hive(store, 'run', '--task', task, '--route', 'tool', '--enqueue-only');
  expect(typeof queued.queued).toBe('string');
  hive(store, 'stop');
  expect(hive(store, 'loop').results).toHaveLength(0);
  expect(hive(store, 'status').jobs.QUEUED).toBe(1);
  hive(store, 'resume');
  const run = hive(store, 'loop');
  expect(run.results).toHaveLength(1);
  expect(run.results[0].passed).toBe(true);
  const restored = hive(store, 'review', '--run', queued.queued);
  expect(restored.verification.passed).toBe(true);
  expect(hive(store, 'status').budget.cycles).toBe(1);
});
