// The ADHD part of the root service worker: push shows a notice immediately, a tap opens the app (never completes anything),
// and other apps' traffic/caches are left alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../game-assets-sw.js', import.meta.url), 'utf8');
function sw(clients = []) {
  const listeners = {}, shown = [], opened = [], posted = [], fetched = [];
  const self = {location: {origin: 'https://mominc.online'}, addEventListener: (t, f) => { (listeners[t] ||= []).push(f); }, skipWaiting() {},
    registration: {showNotification: async (title, opts) => { shown.push({title, opts}); }},
    clients: {claim() {}, matchAll: async () => clients.map(c => ({url: c.url, postMessage: m => posted.push(m), focus: async () => { c.focused = true; }})),
      openWindow: async u => { opened.push(u); }}};
  vm.runInNewContext(source, {self, caches: {}, fetch: async (u, o) => { fetched.push({u, o}); return new Response('{}'); }, URL, Response, Headers, Request, Blob, crypto, console, setTimeout});
  const run = async (type, event) => { let p; event.waitUntil = x => { p = x; }; for (const f of listeners[type] || []) f(event); await p; };
  return {listeners, shown, opened, posted, fetched, run};
}
const payload = (o = {}) => ({appId: 'adhd', occurrenceId: 'sched0001:1000', attemptId: 'sched0001:1000:2:main', tag: 'adhd-sched0001:1000', title: 'ADHD', body: 'Still waiting for your check-off.',
  url: '/apps/alarm/?occ=sched0001%3A1000', receipt: {url: 'https://adhd-push.example.workers.dev/v1/receipt', token: 'ab'.repeat(32)}, ...o});
const push = p => ({data: {json: () => p}});

test('existing owners of the worker are untouched', () => {
  const w = sw();
  for (const t of ['install', 'activate', 'message', 'fetch', 'push', 'notificationclick']) assert.ok(w.listeners[t]?.length, t);
  assert.equal(w.listeners.fetch.length, 1);     // no second fetch handler and no extra cache owner
});

test('push: an adhd payload shows a notice immediately and reports receipt', async () => {
  const w = sw(); await w.run('push', push(payload()));
  assert.equal(w.shown.length, 1);
  assert.equal(w.shown[0].opts.tag, 'adhd-sched0001:1000'); assert.equal(w.shown[0].opts.renotify, true);
  assert.deepEqual({...w.shown[0].opts.data}.url, '/apps/alarm/?occ=sched0001%3A1000');
  assert.equal(w.fetched.length, 1);
  assert.deepEqual(JSON.parse(w.fetched[0].o.body), {attemptId: 'sched0001:1000:2:main', event: 'received', token: 'ab'.repeat(32)});
});

test('push: other apps, malformed payloads and out-of-scope URLs are ignored', async () => {
  const w = sw();
  for (const bad of [{...payload(), appId: 'other'}, {...payload(), url: '/tv/'}, {...payload(), url: 'https://evil.example/apps/alarm/'}, {...payload(), tag: undefined}, {...payload(), occurrenceId: 5}, null])
    await w.run('push', push(bad));
  await w.run('push', {data: {json: () => { throw Error('not json'); }}});
  await w.run('push', {data: null});
  assert.equal(w.shown.length, 0);
});

test('a bad receipt block is ignored but the notice still shows', async () => {
  const w = sw(); await w.run('push', push(payload({receipt: {url: 'http://insecure.example/x', token: 't'}})));
  assert.equal(w.shown.length, 1); assert.equal(w.fetched.length, 0);
});

test('click: focuses an open alarm window and tells it which occurrence; otherwise opens the in-scope URL; always closes the notice', async () => {
  const data = {appId: 'adhd', occurrenceId: 'sched0001:1000', attemptId: 'a', url: '/apps/alarm/?occ=sched0001%3A1000', receipt: payload().receipt};
  let closed = 0;
  const win = {url: 'https://mominc.online/apps/alarm/'}, w = sw([{url: 'https://mominc.online/tv/'}, win]);
  await w.run('notificationclick', {notification: {data, close: () => closed++}});
  assert.equal(closed, 1); assert.equal(win.focused, true); assert.equal(JSON.stringify(w.posted), JSON.stringify([{type: 'ADHD_OPEN', occurrenceId: 'sched0001:1000'}])); assert.equal(w.opened.length, 0);
  assert.equal(w.fetched.at(-1).u, data.receipt.url); assert.equal(JSON.parse(w.fetched.at(-1).o.body).event, 'opened');
  const w2 = sw([]); await w2.run('notificationclick', {notification: {data, close: () => closed++}});
  assert.deepEqual(w2.opened, ['https://mominc.online/apps/alarm/?occ=sched0001%3A1000']);
});

test('click: other apps\' notifications and out-of-scope targets do nothing', async () => {
  const w = sw([]); let closed = 0;
  await w.run('notificationclick', {notification: {data: {appId: 'other', url: '/apps/alarm/'}, close: () => closed++}});
  await w.run('notificationclick', {notification: {data: null, close: () => closed++}});
  await w.run('notificationclick', {notification: {data: {appId: 'adhd', url: 'https://evil.example/apps/alarm/'}, close: () => closed++}});
  await w.run('notificationclick', {notification: {data: {appId: 'adhd', url: '/tv/'}, close: () => closed++}});
  assert.equal(w.opened.length, 0); assert.equal(w.posted.length, 0);
});

test('push: the notice uses the stage face as its icon, the product title, and stage 4 offers Play 2048 + Reminder settings', async () => {
  const w = sw();
  for (const [face, want] of [[1, 1], [2, 2], [3, 3], [4, 4], [9, 4], [0, 1], [undefined, 1], ['x', 1]]) await w.run('push', push(payload({face, title: "MOM's: 2048 Reminder", body: 'Reminder: “Get up”.'})));
  assert.deepEqual(w.shown.map(n => n.opts.icon), [1, 2, 3, 4, 4, 1, 1, 1].map(n => `/apps/alarm/stages/stage${n}.webp`));
  assert.equal(w.shown[0].title, "MOM's: 2048 Reminder"); assert.equal(w.shown[0].opts.body, 'Reminder: “Get up”.');
  assert.equal(w.shown.map(n => n.opts.actions.length).join(), '0,0,0,2,2,0,0,0');
  assert.equal(w.shown[3].opts.actions.map(a => a.action).join(), 'game,settings');
  const d = sw(); await d.run('push', push(payload({title: undefined}))); assert.equal(d.shown[0].title, "MOM's: 2048 Reminder");
});

test('click: the Settings action opens the Reminder settings view; a plain tap or the Play action just opens; nothing stops the alarm', async () => {
  const data = {appId: 'adhd', occurrenceId: 'sched0001:1000', attemptId: 'a', url: '/apps/alarm/?occ=sched0001%3A1000', receipt: payload().receipt};
  const win = {url: 'https://mominc.online/apps/alarm/'}, w = sw([win]);
  await w.run('notificationclick', {action: 'settings', notification: {data, close() {}}});
  await w.run('notificationclick', {action: 'game', notification: {data, close() {}}});
  await w.run('notificationclick', {notification: {data, close() {}}});
  assert.deepEqual(w.posted.map(m => m.view), ['settings', undefined, undefined]);
  const w2 = sw([]); await w2.run('notificationclick', {action: 'settings', notification: {data, close() {}}});
  assert.deepEqual(w2.opened, ['https://mominc.online/apps/alarm/?occ=sched0001%3A1000&view=settings']);
  assert.ok(w.fetched.every(f => JSON.parse(f.o.body).event === 'opened'));                 // only "opened" is ever reported: no complete/cancel call from a notice
});
