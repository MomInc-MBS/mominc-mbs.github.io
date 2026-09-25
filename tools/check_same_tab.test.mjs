import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

// The site keeps one tab. Each extra tab held its own 3D scene, and a phone that runs out of graphics
// memory stops giving the site 3D at all (Lil Boyfriend and Corgi fall back to text, the Gala blanks).
const root = new URL('../', import.meta.url);
const skipped = [/^handborne\/source\//, /\/animation\/source\//, /^tools\//, /\.map$/];
// Unused: nothing imports it. A cross-app handoff that must keep a window reference to post to.
const allowed = new Set(['coach-setup/transfer.mjs']);
const generators = ['tools/gen.py', 'tools/network_pages.py'];
const newTab = /target\s*=\s*\\?["']?_blank|\.target\s*=\s*["']_blank|window\.open\s*\(/;

test('no page, script, or page generator opens a new tab', () => {
  const files = execFileSync('git', ['ls-files', '*.html', '*.js', '*.mjs'], {cwd: root, encoding: 'utf8'})
    .split('\n').filter(path => path && !skipped.some(pattern => pattern.test(path)) && !allowed.has(path));
  const offenders = [...files, ...generators].filter(path => newTab.test(readFileSync(new URL(path, root), 'utf8')));
  assert.deepEqual(offenders, []);
});
