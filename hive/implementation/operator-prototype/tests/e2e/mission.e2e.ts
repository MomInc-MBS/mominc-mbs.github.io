import { test, expect } from 'e2e';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('public mission CLI runs real isolated code and video in one DAG then replays', { timeout: 120000 }, () => {
  const work = mkdtempSync(join(tmpdir(), 'hive-mission-cli-'));
  const result = JSON.parse(execFileSync(process.env.HIVE_PYTHON || 'python',
    ['scripts/readiness_demo.py', '--work', work], {
      env: { ...process.env, PYTHONPATH: resolve('src') }, encoding: 'utf8', timeout: 110000,
    }));
  expect(result.new_model_calls).toBe(0);
  expect(result.statuses).toEqual({ video: 'COMPLETED', code: 'COMPLETED', combined: 'COMPLETED' });
  const receipt = JSON.parse(readFileSync(result.report, 'utf8'));
  expect(receipt.original_source_unchanged).toBe(true);
  expect(receipt.outputs.combined.first.budget).toEqual(receipt.outputs.combined.replay.budget);
  expect(Object.keys(receipt.outputs.combined.first.stages).length).toBe(2);
});
