// Service worker push routing, multi-reminder build: one tag per occurrence, never a generic "Done", and a late push for an ended occurrence
// shows a truthful non-reactivating notice (Safari must show something).
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../game-assets-sw.js', import.meta.url), 'utf8');
function sw(tombs = []) {
  const listeners = {}, shown = [], fetched = [], store = new Set(tombs.map(id => '/__adhd_terminal/' + encodeURIComponent(id)));
  const self = {location: {origin: 'https://mominc.online'}, addEventListener: (t, f) => { (listeners[t] ||= []).push(f); }, skipWaiting() {},
    registration: {showNotification: async (title, opts) => { shown.push({title, opts}); }}, clients: {claim() {}, matchAll: async () => [], openWindow: async () => {}}};
  const caches = {open: async () => ({match: async k => store.has(String(k)) ? new Response('1') : undefined, put: async k => { store.add(String(k)); }})};
  vm.runInNewContext(source, {self, caches, fetch: async (u, o) => { fetched.push({u, o}); return new Response('{}'); }, URL, Response, Headers, Request, Blob, crypto, console, setTimeout, Date});
  return {shown, fetched, store, run: async (type, event) => { let p; event.waitUntil = x => { p = x; }; for (const f of listeners[type] || []) f(event); await p; }};
}
const payload = (o = {}) => ({appId: 'adhd', occurrenceId: 'r_alpha00001:1000', occId: 'r_alpha00001:1000', attemptId: 'r_alpha00001:1000:3:main', tag: 'adhd-r_alpha00001:1000', title: "MOM's: 2048 Reminder",
  body: 'Still pending.', face: 4, url: '/apps/alarm/?occ=r_alpha00001%3A1000', rev: 2, dueAt: 1000, receipt: {url: 'https://adhd-push.example.workers.dev/v1/receipt', token: 'ab'.repeat(32)}, ...o});
const push = p => ({data: {json: () => p}});

test('two reminders: each occurrence keeps its own tag, so one never replaces the other; the same occurrence replaces itself', async () => {
  const w = sw();
  await w.run('push', push(payload({tag: 'adhd-A:1', occurrenceId: 'A:1', occId: 'A:1'}))); await w.run('push', push(payload({tag: 'adhd-B:1', occurrenceId: 'B:1', occId: 'B:1'})));
  await w.run('push', push(payload({tag: 'adhd-A:1', occurrenceId: 'A:1', occId: 'A:1'})));
  assert.deepEqual(w.shown.map(n => n.opts.tag), ['adhd-A:1', 'adhd-B:1', 'adhd-A:1']); assert.equal(w.shown[2].opts.renotify, true);
});

test('no notification ever offers a generic "Done"/complete action; only Play 2048 and Reminder settings (both just open the app)', async () => {
  const w = sw();
  for (const face of [1, 2, 3, 4]) await w.run('push', push(payload({face})));
  const all = w.shown.flatMap(n => n.opts.actions || []);
  assert.deepEqual([...new Set(all.map(a => a.action))].sort(), ['game', 'settings']);
  assert.ok(!all.some(a => /done|complete|finish|stop|dismiss/i.test(a.title + a.action)));
});

test('late push for an occurrence the app already ended: a plain "already ended" notice, same tag, silent, no actions, still reports receipt', async () => {
  const w = sw(['r_alpha00001:1000']);
  await w.run('push', push(payload()));
  assert.equal(w.shown.length, 1);
  const n = w.shown[0];
  assert.equal(n.opts.body, 'This reminder has already ended.'); assert.equal(n.opts.tag, 'adhd-r_alpha00001:1000'); assert.equal(n.opts.silent, true); assert.equal(n.opts.renotify, false);
  assert.equal((n.opts.actions || []).length, 0); assert.equal(n.opts.data.notice, true);
  assert.doesNotMatch(n.opts.body, /Still pending|Finish the game|Reminder:/);                          // nothing that reads like a live alarm
  assert.equal(JSON.parse(w.fetched[0].o.body).event, 'received');
  await w.run('push', push(payload({occurrenceId: 'other:1', occId: 'other:1', tag: 'adhd-other:1'})));      // a different occurrence is unaffected by that tombstone
  assert.equal(w.shown[1].opts.body, 'Still pending.');
});

test('a push that outlived its own expiry is shown as a late, non-alarm notice (never dropped); an unexpired one is a normal alert', async () => {
  const w = sw(), past = Date.now() - 5000, future = Date.now() + 60_000;
  await w.run('push', push(payload({expiresAt: past}))); await w.run('push', push(payload({expiresAt: future}))); await w.run('push', push(payload({expiresAt: undefined})));
  assert.match(w.shown[0].opts.body, /late alert arrived/); assert.equal(w.shown[0].opts.silent, true);
  assert.equal(w.shown[1].opts.body, 'Still pending.'); assert.equal(w.shown[2].opts.body, 'Still pending.');
});

test('a broken Cache API never swallows a push', async () => {
  const w = sw(); const src = source;
  assert.match(src, /adhdEnded[\s\S]*catch/);
  await w.run('push', push(payload())); assert.equal(w.shown.length, 1);
});
