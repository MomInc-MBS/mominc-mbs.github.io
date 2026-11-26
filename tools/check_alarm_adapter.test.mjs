// web-adapter.js: the contract adapter, exactly. Fake clock, fake storage, fake push module, fake outputs.
process.env.TZ = 'UTC';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createWebAdapter, EXPORT_SCHEMA} from '../apps/alarm/web-adapter.js';
import {blank, tick as rtick, KEY} from '../apps/alarm/remind.js';
import {CAP_IDS} from '../apps/alarm/capabilities.js';

const T0 = Date.UTC(2026, 11, 1, 12, 0, 0), settle = () => new Promise(r => setTimeout(r, 0));
const mem = () => ({d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { if (this.full) throw Error('quota'); this.d[k] = v; }});
const outputsStub = () => ({sync() {}, stop() {}, destroy() {}, audition: async () => {}, stopAudition() {}, unlock: async () => 'running', probeCamera: async () => ({camera: 'granted', torch: false}), needTap: () => false, facts: () => ({})});
function make(o = {}) {
  const clock = {t: T0}, storage = o.storage || mem(), cacheWrites = [], pushCalls = [];
  const push = {ADHD_PUSH_ORIGIN: o.origin ?? '', register: async () => true, enable: async () => ({subscribed: true, error: ''}), sync: async st => { pushCalls.push(st.outbox.map(x => x.k + ':' + (x.act || ''))); return o.syncFails ? st.outbox : []; }};
  const env = {localStorage: storage, navigator: {}, window: {}, caches: {open: async () => ({put: async k => cacheWrites.push(String(k))})}, fetch: o.fetch, ...o.env};
  const a = createWebAdapter({env, storage, now: () => clock.t, push, outputs: outputsStub(), owner: {isOwner: () => true, want() {}, close() {}}, fetchImpl: o.fetch});
  return {a, clock, storage, cacheWrites, pushCalls, push};
}
const rem = (o = {}) => ({...blank(), id: 'r_one00000001', time: '12:05', tz: {mode: 'fixed', zone: 'UTC'}, sound: {...blank().sound, stage: Array(4).fill('crash')}, ...o});
const confirmed = (r, rev = 1) => ({...r, confirmed: {rev, at: T0}});

test('adapter surface is exactly the contract', async () => {
  const {a} = make();
  for (const k of ['list', 'save', 'remove', 'setEnabled', 'capabilities', 'request', 'audition', 'stopAudition', 'snapshot', 'on', 'emergencyStop', 'history', 'exportData', 'importData', 'checkUpdate', 'applyUpdate', 'getPrefs', 'setPrefs', 'playChallenge'])
    assert.equal(typeof a[k], 'function', k);
  assert.equal(a.platform, 'web');
  const s = a.snapshot();
  assert.deepEqual(Object.keys(s).sort(), ['capabilities', 'dueAt', 'reminderId', 'emotion', 'highContrast', 'iconId', 'intensity', 'nextDue', 'occId', 'offAllowed', 'pendingSync', 'reducedMotion', 'rev', 'saveState', 'stage', 'unlockAt'].sort());
  assert.deepEqual([s.occId, s.stage, s.emotion, s.intensity, s.iconId, s.offAllowed, s.saveState], [null, null, 'happy', 0.3, 'stage1', true, 'idle']);
  assert.deepEqual(Object.keys(await a.capabilities()).sort(), [...CAP_IDS].sort());
  for (const c of Object.values(await a.capabilities())) assert.ok(['available', 'permission', 'active', 'unsupported', 'foreground', 'disconnected', 'error'].includes(c.state) && typeof c.reason === 'string');
});

test('save / list / remove / setEnabled: validation, confirmation, error shapes', async () => {
  const {a, storage} = make();
  assert.deepEqual(await a.save(rem({time: 'bad'})), {ok: false, error: 'invalid', field: 'time'});
  const un = await a.save(rem()); assert.equal(un.ok, true); assert.equal(un.reminder.confirmed, null); assert.equal(a.snapshot().nextDue, null);   // saved, not armed
  const ok = await a.save(confirmed(rem(), 1)); assert.equal(ok.reminder.rev, 1); assert.equal(a.snapshot().nextDue, Date.UTC(2026, 11, 1, 12, 5));
  assert.equal((await a.list()).length, 1); assert.ok(JSON.parse(storage.d[KEY]).reminders.length === 1);
  assert.equal((await a.setEnabled('r_one00000001', false)).ok, true); assert.equal(a.snapshot().nextDue, null);
  assert.equal((await a.setEnabled('nope', true)).ok, false);
  assert.equal((await a.remove('r_one00000001')).ok, true); assert.deepEqual(await a.list(), []);
});

test('storage failure is reported and rolled back, never silently lost', async () => {
  const {a, storage} = make(); storage.full = true;
  const r = await a.save(confirmed(rem())); assert.deepEqual(r, {ok: false, error: 'storage'}); assert.deepEqual(await a.list(), []);
  assert.equal(a.snapshot().saveState === 'saved', false);
});

test('lock: while an escalating occurrence is active, off / remove / time change answer locked with remainingMs; unlocked at T0+540 s', async () => {
  const {a, clock} = make();
  await a.save(confirmed(rem())); clock.t = Date.UTC(2026, 11, 1, 12, 5, 1); const ev = a.tick();
  assert.deepEqual(ev.map(e => e.type), ['start']); assert.equal(a.snapshot().stage, 1);
  clock.t += 100_000;
  assert.deepEqual(await a.setEnabled('r_one00000001', false), {ok: false, error: 'locked', remainingMs: 540_000 - 101_000});
  assert.equal((await a.remove('r_one00000001')).error, 'locked'); assert.equal((await a.save(confirmed({...rem(), time: '15:00'}, 2))).error, 'locked');
  assert.equal(a.snapshot().offAllowed, false); assert.equal(a.snapshot().unlockAt, Date.UTC(2026, 11, 1, 12, 5) + 540_000);
  clock.t = Date.UTC(2026, 11, 1, 12, 5) + 540_000;
  assert.equal((await a.setEnabled('r_one00000001', false)).ok, true);
});

test('emergencyStop ends only that occurrence, writes a tombstone the service worker can read, and shows in history; stale ids do nothing', async () => {
  const {a, clock, cacheWrites} = make();
  await a.save(confirmed(rem())); clock.t = Date.UTC(2026, 11, 1, 12, 5, 1); a.tick();
  const occ = a.snapshot().occId; await a.emergencyStop('stale:1'); assert.equal(a.snapshot().occId, occ);
  await a.emergencyStop(occ); await settle();
  assert.equal(a.snapshot().occId, null); const h = await a.history(); assert.deepEqual([h[0].outcome, h[0].occId, h[0].reminderId], ['emergency', occ, 'r_one00000001']);
  assert.deepEqual(cacheWrites, ['/__adhd_terminal/' + encodeURIComponent(occ)]);
  assert.equal(a.snapshot().nextDue, Date.UTC(2026, 11, 2, 12, 5));                                   // the recurrence stays
});

test('events: change + snapshot fire on save and stop, unsubscribe works, a throwing listener never breaks the alarm', async () => {
  const {a} = make(), seen = [];
  const off = a.on('change', () => seen.push('change')); a.on('snapshot', () => { throw Error('bad listener'); }); a.on('snapshot', () => seen.push('snapshot'));
  await a.save(confirmed(rem())); assert.deepEqual(seen, ['change', 'snapshot']);
  off(); await a.save(confirmed(rem({title: 'x'}))); assert.deepEqual(seen, ['change', 'snapshot', 'snapshot']);
});

test('export -> import round trip keeps reminders and history; the export holds NO credentials; import validates and is all-or-nothing', async () => {
  const A = make({origin: 'https://push.example'});
  await A.a.save(confirmed(rem({webhook: {url: 'https://hooks.example.com/x', token: 'SECRET-TOKEN'}, challenge: {extra: 'qr', code: 'qr-code', nfc: null, steps: 0}})));
  await A.a.save(confirmed(rem({id: 'r_two00000002', title: 'Second', recur: {kind: 'weekly', days: [1, 3]}}), 1));
  A.storage.setItem('adhd-push-install-v1', JSON.stringify({installId: 'i', secret: 'PUSH-SECRET'}));
  A.clock.t = Date.UTC(2026, 11, 1, 12, 5, 1); A.a.tick(); const occ = A.a.snapshot().occId; await A.a.emergencyStop(occ);
  const text = await A.a.exportData(), j = JSON.parse(text);
  assert.equal(j.schema, EXPORT_SCHEMA); assert.doesNotMatch(text, /SECRET|installId|outbox|secret/i); assert.equal(j.reminders[0].webhook.token, null); assert.equal(j.reminders[0].webhook.url, 'https://hooks.example.com/x');
  const B = make(); const r = await B.a.importData(text);
  assert.deepEqual(r, {ok: true, count: 2});
  const list = await B.a.list(); assert.deepEqual(list.map(x => x.id).sort(), ['r_one00000001', 'r_two00000002']);
  assert.equal(list.find(x => x.id === 'r_one00000001').challenge.code, 'qr-code'); assert.deepEqual(list.find(x => x.id === 'r_two00000002').recur.days, [1, 3]);
  assert.ok(list.every(x => x.confirmed && x.confirmed.rev === x.rev));                              // the user's own confirmations survive an import of their own export
  assert.deepEqual((await B.a.history()).map(h => h.outcome), ['emergency']);
  assert.equal((await B.a.importData(text)).ok, true); assert.equal((await B.a.history()).length, 1);  // re-import: no duplicates
  const bad = [['not json', 'invalid'], [JSON.stringify({schema: 'other', v: 1, reminders: []}), 'invalid'], [JSON.stringify({schema: EXPORT_SCHEMA, v: 2, reminders: []}), 'invalid'],
    [JSON.stringify({schema: EXPORT_SCHEMA, v: 1, reminders: [rem(), rem({id: 'r_bad00000003', time: '99:99'})]}), 'invalid'], [JSON.stringify({schema: EXPORT_SCHEMA, v: 1, reminders: [5]}), 'invalid'],
    [JSON.stringify({schema: EXPORT_SCHEMA, v: 1, reminders: [rem({webhook: {url: 'http://insecure.example/'}})]}), 'invalid'], ['x'.repeat(2_100_000), 'invalid']];
  const C = make();
  for (const [t, e] of bad) assert.equal((await C.a.importData(t)).error, e);
  assert.deepEqual(await C.a.list(), []);                                                              // the good first reminder in the bad file was not kept
  const sneaky = JSON.stringify({schema: EXPORT_SCHEMA, v: 1, reminders: [rem({webhook: {url: 'https://h.example.com/x', token: 'IMPORTED-TOKEN'}})]});
  await C.a.importData(sneaky); assert.equal((await C.a.list())[0].webhook.token, null);               // a file cannot smuggle a credential in either
});

test('import is refused while an alarm is locked; nothing changes', async () => {
  const A = make(); await A.a.save(confirmed(rem())); const text = await A.a.exportData();
  A.clock.t = Date.UTC(2026, 11, 1, 12, 5, 1); A.a.tick();
  const changed = JSON.stringify({...JSON.parse(text), reminders: [{...JSON.parse(text).reminders[0], time: '18:00'}]});
  assert.equal((await A.a.importData(changed)).error, 'locked'); assert.equal((await A.a.list())[0].time, '12:05');
});

test('offline outbox + pendingSync: changes queue while the server is unreachable, snapshot says so, and clear once it answers', async () => {
  const A = make({origin: 'https://push.example', syncFails: true});
  await A.a.save(confirmed(rem())); await settle();
  assert.equal(A.a.snapshot().pendingSync, true); assert.deepEqual(A.pushCalls[0], ['schedule:']);
  assert.equal((await A.a.capabilities()).webhook.reason, 'pending-sync');
  A.push.sync = async () => []; await A.a.sync(); assert.equal(A.a.snapshot().pendingSync, false);
  const none = make(); await none.a.save(confirmed(rem())); assert.equal(none.a.snapshot().pendingSync, false);   // no server configured: nothing to sync, never reports a broken cloud
  const pend = make({origin: 'https://push.example', syncFails: true}); await pend.a.save(confirmed(rem({webhook: {url: 'https://hooks.example.com/x'}}))); await settle();
  assert.equal((await pend.a.capabilities()).webhook.reason, 'pending-sync');
});

test('optional check-in: accepted only when the occurrence selected that kind AND the proof matches; the 2048 exit is untouched', async () => {
  const {a, clock} = make();
  await a.save(confirmed(rem({challenge: {extra: 'qr', code: 'right', nfc: null, steps: 0}}))); clock.t = Date.UTC(2026, 11, 1, 12, 5, 1); a.tick(); const occ = a.snapshot().occId;
  assert.equal(await a.checkIn(occ, 'qr', 'wrong'), false); assert.equal(await a.checkIn(occ, 'nfc', 'right'), false); assert.equal(a.snapshot().occId, occ);
  assert.equal(await a.checkIn(occ, 'qr', 'right'), true); assert.equal(a.snapshot().occId, null); assert.equal((await a.history())[0].outcome, 'checkin');
  assert.deepEqual(await a.scan('qr', 'gone', null), {ok: false, reason: 'not-selected'});
  const plain = make(); await plain.a.save(confirmed(rem())); plain.clock.t = Date.UTC(2026, 11, 1, 12, 5, 1); plain.a.tick();
  assert.equal(await plain.a.checkIn(plain.a.snapshot().occId, 'qr', 'x'), false);
});

test('checkUpdate / applyUpdate follow apps/releases.json and the shared updater note; a live alarm is never reloaded away', async () => {
  const rel = v => async () => ({ok: true, json: async () => ({apps: [{id: 'alarm', platform: 'pwa', version: v}, {id: 'alarm', platform: 'android', version: 'x'}]})});
  const sw = {navigator: {serviceWorker: {}}}, {a, storage} = make({fetch: rel('v2'), env: sw}); storage.setItem('mbs-app-ver:alarm', 'v1');
  assert.deepEqual(await a.checkUpdate(), {state: 'available', version: 'v2'});
  assert.equal((await a.capabilities()).update.state, 'available');
  storage.setItem('mbs-app-ver:alarm', 'v2'); assert.equal((await a.checkUpdate()).state, 'none');
  const err = make({fetch: async () => { throw Error('offline'); }, env: sw}); assert.equal((await err.a.checkUpdate()).state, 'error'); assert.equal((await err.a.capabilities()).update.state, 'error');
  assert.equal((await make({fetch: rel('v1')}).a.applyUpdate()).state, 'none');                         // nothing to apply
});

test('prefs persist and feed the snapshot; the system setting is the default', async () => {
  const {a, storage} = make({env: {window: {matchMedia: q => ({matches: /reduced-motion/.test(q)})}}});
  assert.deepEqual([a.snapshot().reducedMotion, a.snapshot().highContrast], [true, false]);
  a.setPrefs({reducedMotion: false, highContrast: true, junk: 1}); assert.deepEqual([a.snapshot().reducedMotion, a.snapshot().highContrast], [false, true]);
  assert.deepEqual(JSON.parse(storage.d['adhd-alarm-prefs-v1']), {reducedMotion: false, highContrast: true}); assert.deepEqual(a.getPrefs(), {reducedMotion: false, highContrast: true});
});

test('request(capId) opens only that grant and reports the resulting honest state; playChallenge raises an event', async () => {
  const {a} = make(); let got = null; a.on('playChallenge', e => { got = e; });
  assert.equal((await a.request('sound')).state, 'unsupported');                                         // no Web Audio in this fake env: still honest, never "available"
  assert.deepEqual(await a.request('exactAlarm'), {state: 'unsupported', reason: 'android-app-only'});
  assert.equal((await a.request('torch')).reason, 'no-camera-api');
  await a.playChallenge('o:1'); assert.deepEqual(got, {occId: 'o:1'});
});

test('the old single-schedule state migrates on first adapter load and the list shows it', async () => {
  const storage = mem(); storage.setItem('adhd-alarm-state-v1', JSON.stringify({v: 1, schedule: {id: 'abcdefghijkl', revision: 1, enabled: true, tz: 'UTC', armedAt: 1, time: '12:05', recur: 'daily', label: 'Pills', sound: 'crash', followups: true, tandem: false},
    occ: null, next: {id: 'abcdefghijkl:1', rev: 1, due: T0 + 300_000, status: 'PENDING', reason: null, label: 'Pills', followups: true, attempt: 1, ackedAt: null}, session: null, history: [], outbox: []}));
  const {a} = make({storage}); const l = await a.list();
  assert.deepEqual([l.length, l[0].id, l[0].title, l[0].confirmed.rev], [1, 'abcdefghijkl', 'Pills', 1]); assert.equal(a.snapshot().nextDue, T0 + 300_000);
  assert.ok(storage.d['adhd-alarm-state-v1']);                                                          // v1 stays for rollback
});

test('settings UI save shape (rev: old+1, confirmed: {rev: old+1}) arms end to end with no double bump; snapshot names the active reminder', async () => {
  const {a, clock} = make(), ui = (r, at = T0) => ({...r, rev: (r.rev | 0) + 1, confirmed: {rev: (r.rev | 0) + 1, at}});
  const base = rem(); delete base.confirmed;
  const one = await a.save(ui({...base, rev: 0}));                                                   // brand-new: rev 0 -> 1
  assert.deepEqual([one.ok, one.reminder.rev, one.reminder.confirmed.rev], [true, 1, 1]); assert.equal(a.snapshot().nextDue, Date.UTC(2026, 11, 1, 12, 5));
  const edited = await a.save(ui({...one.reminder, time: '12:30'}));                                // changed: ONE bump, still armed
  assert.deepEqual([edited.reminder.rev, edited.reminder.confirmed.rev], [2, 2]); assert.equal(a.snapshot().nextDue, Date.UTC(2026, 11, 1, 12, 30));
  const same = await a.save(ui(edited.reminder));                                                    // nothing changed: rev stays, stays armed
  assert.deepEqual([same.reminder.rev, same.reminder.confirmed.rev], [2, 2]); assert.ok(a.snapshot().nextDue);
  const bad = await a.save({...edited.reminder, rev: 3, time: '13:00', confirmed: {rev: 9, at: 1}});  // a confirmation that names another rev never arms
  assert.equal(bad.reminder.confirmed, null);
  await a.save(ui({...bad.reminder, time: '12:30'}));
  clock.t = Date.UTC(2026, 11, 1, 12, 30, 1); a.tick(); const s = a.snapshot();
  assert.deepEqual([s.reminderId, s.dueAt, s.stage], ['r_one00000001', Date.UTC(2026, 11, 1, 12, 30), 1]);
});
