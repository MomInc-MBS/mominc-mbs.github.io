import { test, expect } from 'e2e';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const python = process.env.HIVE_PYTHON || 'python';
const env = { ...process.env, PYTHONPATH: resolve('src') };
function hive(store: string, ...args: string[]) {
  return JSON.parse(execFileSync(python, ['-m', 'hive', '--store', store, ...args], {
    env, encoding: 'utf8', timeout: 90000, maxBuffer: 32 * 1024 * 1024,
  }));
}

test('all eleven pressure commands run, restart, compare and keep research untested', { timeout: 300000 }, () => {
  const store = mkdtempSync(join(tmpdir(), 'hive-pressure-cli-'));
  const listed = hive(store, 'pressure', 'list');
  expect(listed.length).toBe(11);
  const reports: string[] = [];
  for (const { test_id } of listed) {
    const manifest = resolve(`experiments/pressure/contracts/${test_id}.json`);
    expect(hive(store, 'pressure', 'validate', '--manifest', manifest).valid).toBe(true);
    const output = join(store, `${test_id}-export.json`);
    const first = hive(store, 'pressure', 'run', '--test', test_id, '--manifest', manifest, '--output', output);
    const replay = hive(store, 'pressure', 'run', '--test', test_id, '--manifest', manifest);
    expect(replay.contract_sha256).toBe(first.contract_sha256);
    expect(replay.artifact_hashes).toEqual(first.artifact_hashes);
    expect(first.mode).toBe('fixture');
    expect(first.research_status).toBe('UNTESTED');
    for (const arm of first.arm_results) expect(arm.usage.requests).toBe(0);
    reports.push(output);
  }
  expect(hive(store, 'pressure', 'compare', '--reports', ...reports).research_status).toBe('UNTESTED');
  expect(hive(store, 'pressure', 'report').research_status).toBe('UNTESTED');
});

test('doctor distinguishes caps from authorization and real pressure requires approval', () => {
  const store = mkdtempSync(join(tmpdir(), 'hive-readiness-cli-'));
  const doctor = hive(store, 'doctor', '--offline');
  expect(doctor.new_model_calls).toBe(0);
  expect(doctor.budget_is_authorization).toBe(false);
  expect(doctor.runtime.available).toBe(null);
  const blocked = spawnSync(python, ['-m', 'hive', '--store', store,
    'pressure', 'run', '--test', 'H01', '--mode', 'real'], { env, encoding: 'utf8', timeout: 20000 });
  expect(blocked.status).toBe(2);
  expect(blocked.stderr).toContain('BLOCKED');
  const bad = join(store, 'invalid.json');
  writeFileSync(bad, JSON.stringify({ test_id: 'H01', approval: true }));
  const invalid = spawnSync(python, ['-m', 'hive', 'pressure', 'validate', '--manifest', bad],
    { env, encoding: 'utf8', timeout: 20000 });
  expect(invalid.status).toBe(2);
});
