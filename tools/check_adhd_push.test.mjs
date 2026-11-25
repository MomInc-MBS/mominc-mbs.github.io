// ADHD push backend: scheduling, idempotency, cancellation generation, 8/10 min bound, retry/retire, API auth + validation.
// Runs the real SQL from schema.sql on node:sqlite behind a tiny D1-shaped shim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handle} from '../backend/adhd-push/src/api.mjs';
import {runCron, nextDue, finish, MAX_SENDS} from '../backend/adhd-push/src/core.mjs';

const schema = readFileSync(new URL('../backend/adhd-push/migrations/0001_init.sql', import.meta.url), 'utf8');
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
const T0 = Date.UTC(2026, 10, 25, 12, 0, 0);            // 25 Nov 2026 12:00 UTC
const EP = 'https://web.push.apple.com/abc';
const P256 = 'B'.repeat(87), AUTH = 'A'.repeat(22);

async function call(db, method, path, {body, inst, now = T0, ip = '1.1.1.1'} = {}) {
  const headers = {'cf-connecting-ip': ip, 'content-type': 'application/json'};
  if (inst) { headers['x-install-id'] = inst.installId; headers['x-install-secret'] = inst.secret; }
  const r = await handle(new Request('https://adhd.test' + path, {method, headers, body: body ? JSON.stringify(body) : undefined}), ENV, db, now);
  return {status: r.status, body: await r.json().catch(() => null)};
}
async function setup(db, sched = {}, now = T0) {
  const inst = (await call(db, 'POST', '/v1/install', {now})).body;
  assert.equal((await call(db, 'PUT', '/v1/subscription', {inst, now, body: {endpoint: EP, keys: {p256dh: P256, auth: AUTH}}})).status, 200);
  const s = {id: 'sched0001', time: '12:05', tz: 'UTC', recur: 'daily', label: 'take pills', followups: true, tandem: false, revision: 1, ...sched};
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now, body: s})).status, 200);
  return {inst, s, occ: `${s.id}:${nextDue(s.time, s.tz, s.recur, now)}`};
}
const sender = (statusFor = () => 200) => {
  const sent = [];
  return {sent, deps: {publicOrigin: 'https://adhd.test', sleep: async () => {}, send: async (sub, payload, opts) => {
    sent.push({payload, opts}); const status = statusFor(payload, sent.length); return typeof status === 'object' ? status : {status, retryAfter: 0};
  }}};
};
const dueOf = occ => Number(occ.split(':')[1]);

test('nextDue: daily, weekdays, and the DST fall-back day', () => {
  assert.equal(nextDue('08:00', 'UTC', 'daily', T0), Date.UTC(2026, 10, 26, 8));
  assert.equal(new Date(nextDue('08:00', 'UTC', 'weekdays', Date.UTC(2026, 10, 27, 12))).getUTCDay(), 1);   // Fri noon -> Monday
  // New York fell back on 1 Nov 2026 (EDT -> EST): 07:00 local is 11:00Z on 31 Oct and 12:00Z on 1 Nov.
  assert.equal(nextDue('07:00', 'America/New_York', 'daily', Date.UTC(2026, 9, 31, 0)), Date.UTC(2026, 9, 31, 11));
  assert.equal(nextDue('07:00', 'America/New_York', 'daily', Date.UTC(2026, 9, 31, 12)), Date.UTC(2026, 10, 1, 12));
});

test('cron: due time sends once; repeated cron runs do not duplicate; occurrence id is deterministic', async () => {
  const db = d1(), {occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 5_000, deps); await runCron(db, due + 5_000, deps); await runCron(db, due + 20_000, deps);
  assert.equal(sent.length, 1);
  assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM occurrences').get().n, 1);
  const p = sent[0].payload;
  assert.equal(p.appId, 'adhd'); assert.equal(p.occurrenceId, occ); assert.equal(p.url, '/apps/alarm/?occ=' + encodeURIComponent(occ)); assert.equal(p.stage, 0);
  assert.match(p.receipt.url, /\/v1\/receipt$/);
});

test('follow-up stages follow 0/30/90/180/300 s, one send per stage; stale stages are coalesced, never replayed', async () => {
  const db = d1(), {occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  for (const s of [0, 31, 95, 185, 305]) await runCron(db, due + s * 1000, deps);
  assert.deepEqual(sent.map(x => x.payload.stage), [0, 1, 2, 3, 4]);
  await runCron(db, due + 1000_000, deps);                     // cron outage: only the current stage (6 at 900 s) goes out
  assert.deepEqual(sent.map(x => x.payload.stage).slice(5), [6]);
});

test('no follow-ups opted in: stage 0 only', async () => {
  const db = d1(), {occ} = await setup(db, {followups: false, tandem: true}), {sent, deps} = sender(), due = dueOf(occ);
  for (const s of [0, 40, 100, 200, 400]) await runCron(db, due + s * 1000, deps);
  assert.equal(sent.length, 1);
});

test('tandem: companion only from the 180 s stage, one pair per stage, 3 s gap requested', async () => {
  const db = d1(), {occ} = await setup(db, {tandem: true}), {sent, deps} = sender(), due = dueOf(occ), gaps = [];
  deps.sleep = async ms => gaps.push(ms);
  for (const s of [0, 31, 95, 185, 190]) await runCron(db, due + s * 1000, deps);
  assert.deepEqual(sent.map(x => x.payload.kind + x.payload.stage), ['main0', 'main1', 'main2', 'main3', 'companion3']);
  assert.deepEqual(gaps, [3000]);
  assert.notEqual(sent[3].payload.tag, sent[4].payload.tag);
});

test('cancellation generation: complete stops future sends; an attempt planned before cancellation cannot slip out', async () => {
  const db = d1(), {inst, occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  const r = await call(db, 'POST', `/v1/occurrence/${encodeURIComponent(occ)}/complete`, {inst, now: due + 20_000});
  assert.equal(r.body.status, 'COMPLETED');
  await runCron(db, due + 40_000, deps); await runCron(db, due + 100_000, deps);
  assert.equal(sent.length, 1);
  assert.equal(db.raw.prepare('SELECT gen FROM occurrences').get().gen, 1);

  const db2 = d1(), s2 = await setup(db2), q = sender(), due2 = dueOf(s2.occ);
  await runCron(db2, due2 + 1000, q.deps);
  const iid = db2.raw.prepare('SELECT id FROM installs').get().id;
  db2.raw.prepare("INSERT INTO attempts(id,occ_id,install_id,gen,stage,kind,status,planned_at) VALUES('x',?,?,0,3,'main','planned',?)").run(s2.occ, iid, due2 + 2000);
  await finish(db2, s2.occ, 'CANCELLED', 'stopped', due2 + 2000);
  await runCron(db2, due2 + 3000, q.deps);
  assert.equal(q.sent.length, 1);
  assert.equal(db2.raw.prepare("SELECT status FROM attempts WHERE id='x'").get().status, 'cancelled');
});

test('ack pauses follow-ups for 60 s and never completes; terminal states are final (stale calls are harmless)', async () => {
  const db = d1(), {inst, occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ), url = `/v1/occurrence/${encodeURIComponent(occ)}`;
  await runCron(db, due + 1000, deps);
  assert.equal((await call(db, 'POST', url + '/ack', {inst, now: due + 20_000})).body.status, 'ACTIVE');
  await runCron(db, due + 40_000, deps);                       // stage 1 is due but paused until +80 s
  assert.equal(sent.length, 1);
  await runCron(db, due + 100_000, deps);                      // pause over: current stage is 2
  assert.deepEqual(sent.map(x => x.payload.stage), [0, 2]);
  await call(db, 'POST', url + '/cancel', {inst, now: due + 110_000});
  const late = await call(db, 'POST', url + '/complete', {inst, now: due + 120_000});
  assert.equal(late.body.status, 'CANCELLED');                 // stopped stays stopped; a stale tap cannot flip it
  assert.equal((await call(db, 'GET', url, {inst, now: due + 130_000})).body.status, 'CANCELLED');
  await runCron(db, due + 400_000, deps); assert.equal(sent.length, 2);
});

test('8 sends per occurrence per rolling 10 min', async () => {
  const db = d1(), {occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  const iid = db.raw.prepare('SELECT id FROM installs').get().id;
  for (let i = 0; i < MAX_SENDS; i++)
    db.raw.prepare("INSERT INTO attempts(id,occ_id,install_id,gen,stage,kind,status,planned_at,sent_at) VALUES(?,?,?,0,0,'main','sent',?,?)").run('old' + i, occ, iid, due, due + 1000 * i);
  await runCron(db, due + 30_000, deps); assert.equal(sent.length, 0);          // 8 sends already inside the window
  await runCron(db, due + 11 * 60_000, deps); assert.equal(sent.length, 1);     // window rolled over
});

test('provider errors: 429 backs off (Retry-After), 410 retires the subscription, 403 is not retried', async () => {
  const db = d1(), {occ} = await setup(db), due = dueOf(occ);
  let status = {status: 429, retryAfter: 90};
  const {sent, deps} = sender(() => status);
  await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  await runCron(db, due + 20_000, deps); assert.equal(sent.length, 1);          // still backing off (Retry-After 90 s)
  status = 200;
  await runCron(db, due + 100_000, deps);                                        // the stage-0 retry is stale; the current stage goes instead
  assert.equal(sent.at(-1).payload.stage, 2);
  assert.equal(db.raw.prepare("SELECT status FROM attempts WHERE id=?").get(occ + ':0:main').status, 'coalesced');

  const db2 = d1(), s2 = await setup(db2), q = sender(() => 410), d2 = dueOf(s2.occ);
  await runCron(db2, d2 + 1000, q.deps); await runCron(db2, d2 + 40_000, q.deps);
  assert.notEqual(db2.raw.prepare('SELECT retired_at FROM subs').get().retired_at, null);
  assert.equal(q.sent.length, 1);                                                // retired: nothing further is sent

  const db3 = d1(), s3 = await setup(db3), q3 = sender(() => 403), d3 = dueOf(s3.occ);
  await runCron(db3, d3 + 1000, q3.deps); await runCron(db3, d3 + 2000, q3.deps);
  assert.equal(q3.sent.length, 1);
  assert.equal(db3.raw.prepare("SELECT status FROM attempts WHERE stage=0").get().status, 'failed');
});

test('a due time the cron missed by more than 15 min is MISSED and never sent; once-schedules disable themselves', async () => {
  const db = d1(), {occ} = await setup(db, {recur: 'once'}), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 20 * 60_000, deps);
  assert.equal(sent.length, 0);
  assert.equal(db.raw.prepare('SELECT status FROM occurrences').get().status, 'MISSED');
  assert.equal(db.raw.prepare('SELECT enabled FROM schedules').get().enabled, 0);
});

test('API: auth, schedule validation, endpoint allow-list, ownership, per-install and per-IP rate limits', async () => {
  const db = d1(), inst = (await call(db, 'POST', '/v1/install')).body, ok = {id: 'abcdefgh', time: '08:00', tz: 'UTC', recur: 'daily'};
  assert.equal((await call(db, 'PUT', '/v1/schedule', {body: ok})).status, 401);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst: {installId: inst.installId, secret: '0'.repeat(64)}, body: ok})).status, 401);
  for (const endpoint of ['https://evil.example/x', 'http://web.push.apple.com/x', 'https://169.254.169.254/latest'])
    assert.equal((await call(db, 'PUT', '/v1/subscription', {inst, body: {endpoint, keys: {p256dh: P256, auth: AUTH}}})).status, 400, endpoint);
  for (const bad of [{time: '8:00'}, {time: '24:00'}, {tz: 'Mars/Base'}, {recur: 'hourly'}, {id: 'x'}, {label: 'x'.repeat(61)}])
    assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: {...ok, ...bad}})).status, 400, JSON.stringify(bad));
  const other = (await call(db, 'POST', '/v1/install', {ip: '2.2.2.2'})).body;
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: ok})).status, 200);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst: other, body: {...ok, time: '09:00'}})).status, 403);
  let last; for (let i = 0; i < 32; i++) last = await call(db, 'DELETE', '/v1/subscription', {inst});
  assert.equal(last.status, 429);
  assert.equal((await call(db, 'DELETE', '/v1/subscription', {inst, now: T0 + 120_000})).status, 200);   // a new minute is allowed again
  for (let i = 0; i < 10; i++) await call(db, 'POST', '/v1/install', {ip: '3.3.3.3'});
  assert.equal((await call(db, 'POST', '/v1/install', {ip: '3.3.3.3'})).status, 429);
});

test('receipt endpoint needs the per-attempt HMAC and never completes anything', async () => {
  const db = d1(), {occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 1000, deps);
  const p = sent[0].payload;
  assert.equal((await call(db, 'POST', '/v1/receipt', {body: {attemptId: p.attemptId, event: 'opened', token: '0'.repeat(64)}})).status, 403);
  assert.equal((await call(db, 'POST', '/v1/receipt', {body: {attemptId: p.attemptId, event: 'received', token: p.receipt.token}, now: due + 2000})).status, 200);
  assert.equal(db.raw.prepare('SELECT received_at r FROM attempts').get().r, due + 2000);
  assert.equal(db.raw.prepare('SELECT status FROM occurrences').get().status, 'ACTIVE');
});
