// apps/update.mjs: an installed app that is reopened while idle must reload straight into a new version (the loader shows the battery);
// a busy app installs quietly and waits. Regression: the alarm's CRT counted as busy forever, so iPhones kept the old build.
import test from 'node:test';
import assert from 'node:assert/strict';

let n = 0, skew = 0;
const realNow = Date.now; Date.now = () => realNow() + skew;   // the updater throttles checks to one a minute
async function harness({published, running, busy = false}) {
  const store = new Map(running ? [['mbs-app-ver:alarm', running]] : []), sess = new Map(), on = {}, posted = [];
  let reloads = 0, hidden = false;
  const area = m => ({getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v))});
  const worker = {postMessage: (msg, [port]) => { posted.push(msg.game); port.postMessage({type: 'ready'}); }};
  globalThis.window = globalThis;
  Object.assign(globalThis, {
    location: {pathname: '/apps/alarm/', reload: () => { reloads++; }},
    localStorage: area(store), sessionStorage: area(sess),
    document: {get hidden() { return hidden; }, activeElement: null, querySelector: () => null, addEventListener: (t, f) => { on[t] = f; }},
    addEventListener: () => {}, setInterval: () => 0,
    fetch: async () => ({ok: true, json: async () => ({apps: [{id: 'alarm', platform: 'pwa', version: published.v}]})}),
    MOM_APP_BUSY: () => busy,
  });
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {onLine: true, serviceWorker: {controller: worker, getRegistration: async () => ({update: async () => {}})}}});
  const {watchUpdates} = await import('../apps/update.mjs?' + ++n);
  watchUpdates({busy: () => false});
  await new Promise(r => setTimeout(r, 10));   // launch check
  return {store, posted, reloads: () => reloads, resume: async () => { skew += 61000; hidden = false; on.visibilitychange(); await new Promise(r => setTimeout(r, 10)); }};
}

test('launch online: adopts the published version, no reload', async () => {
  const h = await harness({published: {v: 'B'}, running: 'A'});
  assert.equal(h.reloads(), 0); assert.equal(h.store.get('mbs-app-ver:alarm'), 'B');
});

test('reopened idle with a new version: reloads at once (battery shows during the reload download)', async () => {
  const published = {v: 'A'}, h = await harness({published, running: 'A'});
  published.v = 'B'; await h.resume();
  assert.equal(h.reloads(), 1); assert.equal(h.store.get('mbs-app-ver:alarm'), 'B'); assert.deepEqual(h.posted, []);
});

test('reopened while busy (alarm ringing / game / editor): installs quietly, no reload yet', async () => {
  const published = {v: 'A'}, h = await harness({published, running: 'A', busy: true});
  published.v = 'B'; await h.resume();
  assert.equal(h.reloads(), 0); assert.deepEqual(h.posted, ['app-alarm']);
});
