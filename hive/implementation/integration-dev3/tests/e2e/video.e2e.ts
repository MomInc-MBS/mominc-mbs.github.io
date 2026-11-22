import { test, expect } from 'e2e';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const python = process.env.HIVE_PYTHON || 'python';
const env = { ...process.env, PYTHONPATH: resolve('src') };

test('synthetic video mission replays in a fresh process without duplicate output', async () => {
  const base = mkdtempSync(join(tmpdir(), 'hive-video-e2e-'));
  const source = join(base, 'source');
  const store = join(base, 'store');
  mkdirSync(source);
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=32x32:r=10:d=3', '-c:v', 'mpeg4', join(source, 'synthetic.mp4')], { timeout: 20000 });
  writeFileSync(join(source, 'source.srt'), '1\n00:00:00,000 --> 00:00:01,000\nFirst synthetic cue\n\n2\n00:00:01,100 --> 00:00:02,000\nSecond synthetic cue\n');
  const mission = join(base, 'mission.json');
  const config = join(base, 'config.json');
  writeFileSync(mission, JSON.stringify({ allowed_root: source, media: 'synthetic.mp4', subtitles: 'source.srt' }));
  writeFileSync(config, JSON.stringify({ routes: ['tool'], max_retries: 0 }));
  const invoke = () => JSON.parse(execFileSync(python, ['-m', 'hive', '--store', store, 'video', '--mission', mission, '--config', config], { env, encoding: 'utf8', timeout: 20000 }));
  const first = invoke();
  const bytes = readFileSync(first.clips, 'utf8');
  const second = invoke();
  expect(second.mission).toBe(first.mission);
  expect(second.jobs).toEqual(first.jobs);
  expect(readFileSync(second.clips, 'utf8')).toBe(bytes);
  expect(JSON.parse(bytes).editorial_status).toBe('needs_operator_review');
});
