// Coach MYR5 reminders on the shared adhd-push Worker: plain text, ONE notice per occurrence, never any 2048 escalation.
// Same D1 shim as check_adhd_push.test.mjs (real SQL on node:sqlite).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handle} from '../backend/adhd-push/src/api.mjs';
import {runCron, nextDue} from '../backend/adhd-push/src/core.mjs';

const schema = ['0001_init', '0002_revision', '0003_app', '0004_multi'].map(m => readFileSync(new URL('../backend/adhd-push/migrations/' + m + '.sql', import.meta.url), 'utf8')).join(';');
function d1() {
  const s = new DatabaseSync(':memory:'); s.exec(schema);
  return {raw: s, prepare: sql => {
    const st = s.prepare(sql);
    const mk = args => ({bind: (...a) => mk(a), run: async () => ({meta: {changes: st.run(...args).changes}}),
      first: async () => st.get(...args) ?? null, all: async () => ({results: st.all(...args)})});
    return mk([]);
  }};
}
const ENV = {ALLOW_ORIGIN: 'https://mominc.online', VAPID_PUBLIC: 'pub'};
const T0 = Date.UTC(2026, 10, 25, 12, 0, 0);
const EP = 'https://web.push.apple.com/abc', P256 = 'B'.repeat(87), AUTH = 'A'.repeat(22);
async function call(db, method, path, {body, inst, now = T0, ip = '1.1.1.1'} = {}) {
  const headers = {'cf-connecting-ip': ip, 'content-type': 'application/json'};
  if (inst) { headers['x-install-id'] = inst.installId; headers['x-install-secret'] = inst.secret; }
  const r = await handle(new Request('https://adhd.test' + path, {method, headers, body: body ? JSON.stringify(body) : undefined}), ENV, db, now);
  return {status: r.status, body: await r.json().catch(() => null)};
}
async function install(db, ip = '1.1.1.1') {
  const inst = (await call(db, 'POST', '/v1/install', {ip})).body;
  assert.equal((await call(db, 'PUT', '/v1/subscription', {inst, body: {endpoint: EP, keys: {p256dh: P256, auth: AUTH}}})).status, 200);
  return inst;
}
const coach = (over = {}) => ({app: 'coach', id: 'coach0001', time: '12:05', tz: 'UTC', recur: 'daily', label: 'Time for a water break.', revision: 1, ...over});
const sender = () => { const sent = []; return {sent, deps: {publicOrigin: 'https://adhd.test', send: async (sub, payload, opts) => { sent.push({payload, opts}); return {status: 201, retryAfter: 0}; }}}; };
const dueOf = (s, now = T0) => nextDue(s.time, s.tz, s.recur, now);

test('a coach reminder gets exactly ONE plain notice per occurrence, even if the 2048 timeline is walked (0, 5, 8, 9, 10 min ... 2 h)', async () => {
  const db = d1(), inst = await install(db), s = coach();
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: s})).status, 200);
  const {sent, deps} = sender(), due = dueOf(s);
  deps.sleep = async () => {};                                  // include the in-run 30 s half-minute pass too
  for (const sec of [0, 5, 31, 90, 299, 301, 479, 481, 539, 541, 570, 600, 630, 3600, 7200]) await runCron(db, due + sec * 1000, deps);
  assert.equal(sent.length, 1, 'one send, ever');
  const p = sent[0].payload;
  assert.deepEqual([p.appId, p.stage, p.face, p.kind, p.title, p.body, p.url], ['coach', 0, 0, 'main', "MOM's: Coach MYR5", 'Time for a water break.', '/apps/coach/?panel=reminders']);
  assert.match(p.tag, /^coach-/); assert.equal(sent[0].opts.ttl, 120);
  assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM attempts').get().n, 1);
  assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM attempts WHERE stage>0').get().n, 0, 'no escalation stages are ever planned');
  assert.equal(db.raw.prepare('SELECT followups,tandem,app FROM occurrences').get().followups, 0);
});

test('the client cannot opt a coach reminder into follow-ups: followups/tandem are ignored', async () => {
  const db = d1(), inst = await install(db), s = coach({followups: true, tandem: true});
  await call(db, 'PUT', '/v1/schedule', {inst, body: s});
  assert.deepEqual({...db.raw.prepare('SELECT followups,tandem,app FROM schedules').get()}, {followups: 0, tandem: 0, app: 'coach'});
  const {sent, deps} = sender(), due = dueOf(s);
  for (const sec of [0, 301, 481, 541, 601]) await runCron(db, due + sec * 1000, deps);
  assert.equal(sent.length, 1);
});

test('next day sends one more; disabling at any time is immediate (no 423 lock) and nothing is sent afterwards', async () => {
  const db = d1(), inst = await install(db), s = coach();
  await call(db, 'PUT', '/v1/schedule', {inst, body: s});
  const {sent, deps} = sender(), due = dueOf(s);
  await runCron(db, due + 1000, deps);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now: due + 2000, body: {...s, enabled: false, revision: 2}})).status, 200, 'turning off is allowed right away');
  await runCron(db, due + 60_000, deps); await runCron(db, due + 86400_000 + 1000, deps);
  assert.equal(sent.length, 1, 'no stale send after disable');
  assert.equal(db.raw.prepare("SELECT status FROM occurrences WHERE status='ACTIVE'").all().length, 0);
  await call(db, 'PUT', '/v1/schedule', {inst, now: due + 100_000, body: {...s, enabled: true, revision: 3}});
  await runCron(db, due + 86400_000 + 5000, deps);
  assert.equal(sent.length, 2, 're-enabled: next occurrence sends once');
});

test('editing the time: the old occurrence sends nothing, the new time sends once', async () => {
  const db = d1(), inst = await install(db), s = coach({time: '12:30'});
  await call(db, 'PUT', '/v1/schedule', {inst, body: s});
  const {sent, deps} = sender();
  await call(db, 'PUT', '/v1/schedule', {inst, body: {...s, time: '13:00', revision: 2}});
  await runCron(db, Date.UTC(2026, 10, 25, 12, 31), deps);
  assert.equal(sent.length, 0);
  await runCron(db, Date.UTC(2026, 10, 25, 13, 0, 5), deps); await runCron(db, Date.UTC(2026, 10, 25, 13, 5), deps);
  assert.equal(sent.length, 1);
});

test('2048 reminders are untouched: same install, followups still escalate, coach is capped at 16; 2048 reminders have no product cap', async () => {
  const db = d1(), inst = await install(db);
  const adhd = {id: 'adhd0001', time: '12:05', tz: 'UTC', recur: 'daily', label: 'pills', followups: true, revision: 1};
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: adhd})).status, 200);
  assert.equal(db.raw.prepare("SELECT app FROM schedules WHERE id='adhd0001'").get().app, 'adhd');
  const {sent, deps} = sender(), due = dueOf(adhd);
  for (const sec of [0, 301, 481, 541]) await runCron(db, due + sec * 1000, deps);
  assert.deepEqual(sent.map(x => [x.payload.appId, x.payload.stage]), [['adhd', 0], ['adhd', 1], ['adhd', 2], ['adhd', 3]]);
  for (let i = 1; i < 3; i++) assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: {...adhd, id: 'adhd000' + (i + 1)}})).status, 200);
  for (let i = 3; i < 12; i++) assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: {...adhd, id: 'adhd00' + String(i + 10)}})).status, 200, 'reminder ' + i);   // many per install
  for (let i = 0; i < 16; i++) assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now: T0 + i * 120_000, body: coach({id: 'coach' + String(i).padStart(4, '0')})})).status, 200, 'coach ' + i);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now: T0 + 40 * 120_000, body: coach({id: 'coach9999'})})).status, 409, '17th coach reminder refused');
});

test('validation: unknown app is refused; a schedule cannot switch app or be taken by another install', async () => {
  const db = d1(), inst = await install(db);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: coach({app: 'bogus'})})).status, 400);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: coach()})).status, 200);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: {...coach(), app: 'adhd', followups: true}})).status, 403, 'cannot turn a coach reminder into a 2048 one');
  const other = (await call(db, 'POST', '/v1/install', {ip: '2.2.2.2'})).body;
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst: other, body: coach({time: '09:00'})})).status, 403);
});

test('wording: empty text falls back, long text is cut to 120 characters, text only', async () => {
  const db = d1(), inst = await install(db), {sent, deps} = sender();
  for (const [id, label] of [['coach0001', ''], ['coach0002', 'word '.repeat(40)]]) await call(db, 'PUT', '/v1/schedule', {inst, body: coach({id, label})});
  await runCron(db, dueOf(coach()) + 1000, deps);
  const bodies = sent.map(x => x.payload.body).sort();
  assert.equal(bodies.length, 2); assert.ok(bodies.includes('Time for your reminder.')); assert.ok(bodies.every(b => [...b].length <= 120));
});
