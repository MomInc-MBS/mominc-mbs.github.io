// ADHD push backend: scheduling, idempotency, cancellation generation, no send cap, retry/retire, API auth + validation.
// Runs the real SQL from schema.sql on node:sqlite behind a tiny D1-shaped shim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handle} from '../backend/adhd-push/src/api.mjs';
import {runCron, nextDue, finish} from '../backend/adhd-push/src/core.mjs';

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
  return {sent, deps: {publicOrigin: 'https://adhd.test', send: async (sub, payload, opts) => {
    sent.push({payload, opts}); const status = statusFor(payload, sent.length); return typeof status === 'object' ? status : {status, retryAfter: 0};
  }}};
};
const dueOf = occ => Number(occ.split(':')[1]);
// A sleep that records the wait instead of waiting: the Worker's ~30 s wait for the stage-4 half-minute alert.
const withSleep = (deps, log = []) => { deps.sleep = async ms => { log.push(ms); }; return deps; };
const sids = sent => sent.map(x => x.payload.stage);

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

test('stages from T0: 0, 300, 480, 540 s then every 30 s (570, 600, 630); one push each; face 1-4 and title/body wording', async () => {
  const db = d1(), {occ} = await setup(db, {label: 'Call Alex'}), {sent, deps} = sender(), due = dueOf(occ);
  for (const s of [0, 31, 95, 299, 301, 479, 481, 539, 541, 569, 571, 599, 601, 629, 631]) await runCron(db, due + s * 1000, deps);   // no sleep dep: only the minute-cron sends
  assert.deepEqual(sids(sent), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(sent.map(x => x.payload.face), [1, 2, 3, 4, 4, 4, 4]);
  assert.ok(sent.every(x => x.payload.title === "MOM's: 2048 Reminder"));
  assert.deepEqual(sent.slice(0, 4).map(x => x.payload.body), ['Reminder: “Call Alex”.', 'Still waiting: “Call Alex”.', 'Did you forget about “Call Alex”?',
    'Still pending: “Call Alex”. Finish the game or open Settings to turn this alarm off.']);
  assert.equal(sent[4].payload.body, sent[3].payload.body);
  assert.equal(sent[0].opts.ttl, 120); assert.equal(sent[6].opts.ttl, 30);
});

test('the 30 s repeats: ONE cron run per minute serves both boundaries via the in-run wait (sleep to the next :00/:30, then re-plan from the DB)', async () => {
  const db = d1(), {occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ), waits = [];
  withSleep(deps, waits);
  for (const s of [540, 600, 660]) { deps.clock = () => due + (s + 30) * 1000; await runCron(db, due + s * 1000 + 300, deps); }   // minute crons fire ~0.3 s late
  assert.deepEqual(sids(sent), [3, 4, 5, 6, 7, 8]);                                            // 540, 570, 600, 630, 660, 690 s
  assert.deepEqual(waits, [29_700, 29_700, 29_700]);
  assert.equal(new Set(sent.map(x => x.payload.attemptId)).size, sent.length);                 // unique attempt ids
  const n = sent.length; deps.clock = () => due + 690_000;
  await runCron(db, due + 660_000 + 300, deps);                                                // a duplicate cron invocation in the same minute: nothing new
  assert.equal(sent.length, n);
});

test('a stop / win / loss / disable that lands DURING the 30 s wait cancels the half-minute push', async () => {
  for (const kill of ['complete', 'cancel']) {
    const db = d1(), {inst, occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
    deps.sleep = async () => { await call(db, 'POST', `/v1/occurrence/${encodeURIComponent(occ)}/${kill}`, {inst, now: due + 600_000 + 10_000}); };
    deps.clock = () => due + 630_000;
    await runCron(db, due + 600_000 + 300, deps);
    assert.deepEqual(sids(sent), [5], kill);                                                    // the 600 s alert went out; the 630 s one never did
  }
  const db = d1(), {inst, s, occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);   // disabling after the lock (so the API accepts it) during the wait
  deps.sleep = async () => { assert.equal((await call(db, 'DELETE', `/v1/schedule/${s.id}`, {inst, now: due + 600_000 + 10_000})).status, 200); };
  deps.clock = () => due + 630_000;
  await runCron(db, due + 600_000 + 300, deps);
  assert.deepEqual(sids(sent), [5]);
});

test('a delayed cron reconciles to the CURRENT alert and sends exactly ONE push (no catch-up burst)', async () => {
  const db = d1(), {occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 1000, deps);                                                         // alert 0
  await runCron(db, due + 860_000, deps);                                                      // the cron was down: alerts 1..12 were missed; 860 s = alert 13
  assert.deepEqual(sids(sent), [0, 13]);
  assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM attempts').get().n, 2);                  // nothing for the skipped alerts was even queued
});

test('cancellation generation: complete stops future sends; an attempt planned before cancellation cannot slip out', async () => {
  const db = d1(), {inst, occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  const r = await call(db, 'POST', `/v1/occurrence/${encodeURIComponent(occ)}/complete`, {inst, now: due + 20_000});
  assert.equal(r.body.status, 'COMPLETED');
  await runCron(db, due + 40_000, deps); await runCron(db, due + 400_000, deps);
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

test('stale or revoked: a finished, disabled, deleted or older-revision reminder gets no push', async () => {
  // a planned attempt exists for each; the send-time check (occurrence + revision + enabled) must still refuse it
  const planned = async (mutate) => {
    const db = d1(), {inst, occ, s} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
    await runCron(db, due + 1000, deps);                                                       // occurrence is live, alert 0 sent
    const iid = db.raw.prepare('SELECT id FROM installs').get().id;
    db.raw.prepare("INSERT INTO attempts(id,occ_id,install_id,gen,stage,kind,status,planned_at) VALUES(?,?,?,0,1,'main','planned',?)").run(occ + ':1:main', occ, iid, due + 300_000);
    await mutate(db, {inst, occ, s, due});
    await runCron(db, due + 301_000, deps);
    return sent.length;
  };
  assert.equal(await planned(async () => {}), 2, 'control: untouched, the 300 s alert goes out');
  assert.equal(await planned(async (db, {inst, occ, due}) => { await call(db, 'POST', `/v1/occurrence/${encodeURIComponent(occ)}/cancel`, {inst, now: due + 100_000}); }), 1, 'stopped');
  assert.equal(await planned(async (db, {inst, occ, due}) => { await call(db, 'POST', `/v1/occurrence/${encodeURIComponent(occ)}/complete`, {inst, now: due + 100_000}); }), 1, 'won/lost');
  assert.equal(await planned(async (db, {s}) => { db.raw.prepare('UPDATE schedules SET enabled=0 WHERE id=?').run(s.id); }), 1, 'schedule disabled behind the occurrence');
  assert.equal(await planned(async (db, {s}) => { db.raw.prepare('DELETE FROM schedules WHERE id=?').run(s.id); }), 1, 'schedule gone');
  assert.equal(await planned(async (db, {s}) => { db.raw.prepare('UPDATE occurrences SET rev=5').run(); }), 1, 'schedule older than the occurrence revision');
  assert.equal(await planned(async (db) => { db.raw.prepare("UPDATE schedules SET enabled=0, recur='once'").run(); }), 2, 'a fired once-alarm (switched off by design) still rings its live occurrence');
});

test('Turn off alarm at the Worker: 423 before T0+540 s (PUT enabled=false and DELETE), accepted at 540 s; text and history kept', async () => {
  const db = d1(), {inst, s, occ} = await setup(db, {label: 'Laundry'}), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 1000, deps);
  const off = now => call(db, 'DELETE', `/v1/schedule/${s.id}`, {inst, now});
  const put = now => call(db, 'PUT', '/v1/schedule', {inst, now, body: {...s, enabled: false}});
  for (const at of [1, 300, 539.999]) {
    const r = await off(due + at * 1000); assert.equal(r.status, 423, 'DELETE at ' + at); assert.equal(r.body.error, 'locked'); assert.ok(r.body.remainingMs > 0);
    assert.equal((await put(due + at * 1000)).status, 423, 'PUT at ' + at);
  }
  assert.equal((await off(due + 539_000)).body.remainingMs, 1000);
  assert.equal(db.raw.prepare('SELECT enabled FROM schedules').get().enabled, 1);              // rejected: nothing changed
  assert.equal(db.raw.prepare('SELECT status FROM occurrences').get().status, 'ACTIVE');
  assert.equal((await off(due + 540_000)).status, 200);
  const row = db.raw.prepare('SELECT * FROM schedules').get();
  assert.equal(row.enabled, 0); assert.equal(row.label, 'Laundry'); assert.equal(row.next_due, null);
  const o = db.raw.prepare('SELECT status, reason, label FROM occurrences').get(); assert.deepEqual({...o}, {status: 'CANCELLED', reason: 'disabled', label: 'Laundry'});
  const n = sent.length; await runCron(db, due + 570_000, deps); assert.equal(sent.length, n);  // cancelled: no more pushes
  // not escalating: no lock. The same reminder via PUT at 539 s is also accepted once escalation is off
  const d2 = d1(), s2 = await setup(d2, {followups: false}), q = sender(), t2 = dueOf(s2.occ);
  await runCron(d2, t2 + 1000, q.deps);
  assert.equal((await call(d2, 'DELETE', `/v1/schedule/${s2.s.id}`, {inst: s2.inst, now: t2 + 5000})).status, 200);
});

test('Stop, win and loss end ONE occurrence at any stage and keep the recurrence in D1; tomorrow still rings', async () => {
  for (const act of ['cancel', 'complete'])
    for (const at of [1, 301, 481, 541, 571, 631]) {
      const db = d1(), {inst, occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
      await runCron(db, due + at * 1000, deps);
      const r = await call(db, 'POST', `/v1/occurrence/${encodeURIComponent(occ)}/${act}`, {inst, now: due + at * 1000 + 5000});
      assert.equal(r.body.status, act === 'cancel' ? 'CANCELLED' : 'COMPLETED', `${act} at ${at}`);
      const n = sent.length;
      await runCron(db, due + at * 1000 + 40_000, deps); await runCron(db, due + 900_000, deps);
      assert.equal(sent.length, n, 'no push after ' + act);
      const sch = db.raw.prepare('SELECT enabled, next_due FROM schedules').get();
      assert.equal(sch.enabled, 1); assert.equal(sch.next_due, due + 86_400_000);              // future recurrence kept in D1
      await runCron(db, due + 86_400_000 + 1000, deps);                                         // ...and it fires
      assert.equal(sent.length, n + 1); assert.equal(sent.at(-1).payload.stage, 0);
    }
});

test('opening / acknowledging never pauses or stops the Worker\'s escalation; terminal states are final (stale calls are harmless)', async () => {
  const db = d1(), {inst, occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ), url = `/v1/occurrence/${encodeURIComponent(occ)}`;
  await runCron(db, due + 1000, deps);
  assert.equal((await call(db, 'POST', url + '/ack', {inst, now: due + 20_000})).body.status, 'ACTIVE');
  assert.equal((await call(db, 'POST', url + '/ack', {inst, now: due + 21_000})).body.acked, true);
  await runCron(db, due + 301_000, deps); await runCron(db, due + 541_000, deps);
  assert.deepEqual(sids(sent), [0, 1, 3]);                                                      // not delayed by the ack
  await call(db, 'POST', url + '/cancel', {inst, now: due + 550_000});
  const late = await call(db, 'POST', url + '/complete', {inst, now: due + 560_000});
  assert.equal(late.body.status, 'CANCELLED');                                                  // stopped stays stopped; a stale tap cannot flip it
  assert.equal((await call(db, 'GET', url, {inst, now: due + 570_000})).body.status, 'CANCELLED');
  await runCron(db, due + 700_000, deps); assert.equal(sent.length, 3);
});

test('two reminders are independent: own stages, own icons; stopping or turning off one leaves the other ringing', async () => {
  const db = d1(), a = await setup(db, {id: 'remindaaa1', time: '12:05', label: 'Get up'});
  const inst = a.inst, now = T0;
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now, body: {id: 'remindbbb1', time: '12:08', tz: 'UTC', recur: 'daily', label: 'Leave at 4', followups: true, revision: 1}})).status, 200);
  const {sent, deps} = sender(), dueA = dueOf(a.occ);
  for (const s of [0, 31, 181, 301, 481]) await runCron(db, dueA + s * 1000, deps);              // A: 12:05 -> 0..; B (due +180 s): its own 0 at 181 s
  const of = id => sent.filter(x => x.payload.occurrenceId.startsWith(id)).map(x => [x.payload.stage, x.payload.body]);
  assert.deepEqual(of('remindaaa1').map(x => x[0]), [0, 1, 2]);                                 // A: 0, 300, 480 s
  assert.deepEqual(of('remindbbb1').map(x => x[0]), [0, 1]);                                    // B: 0 (at +181 s = its +1 s), 300 s (its due +300 = A +481)
  assert.match(of('remindaaa1')[2][1], /^Did you forget about “Get up”\?/); assert.match(of('remindbbb1')[1][1], /^Still waiting: “Leave at 4”\./);
  const occA = a.occ, occB = `remindbbb1:${dueA + 180_000}`;
  await call(db, 'POST', `/v1/occurrence/${encodeURIComponent(occA)}/cancel`, {inst, now: dueA + 482_000});   // stop A only
  const n = sent.length;
  for (const s of [541, 721]) await runCron(db, dueA + s * 1000, deps);
  assert.ok(sent.slice(n).every(x => x.payload.occurrenceId === occB), 'only B keeps going');
  assert.ok(sent.length > n);
  assert.equal((await call(db, 'DELETE', '/v1/schedule/remindbbb1', {inst, now: dueA + 722_000})).status, 200);   // B is past its lock: allowed
  const m = sent.length; await runCron(db, dueA + 781_000, deps); assert.equal(sent.length, m);
  assert.equal(db.raw.prepare("SELECT enabled FROM schedules WHERE id='remindaaa1'").get().enabled, 1);       // A itself is still armed
  // A (escalating, locked) never blocks turning off C (not escalating)
  const db2 = d1(), b = await setup(db2, {id: 'remindaaa1'}), t = dueOf(b.occ);
  await call(db2, 'PUT', '/v1/schedule', {inst: b.inst, now: T0, body: {id: 'remindccc1', time: '12:06', tz: 'UTC', recur: 'daily', followups: false, revision: 1}});
  await runCron(db2, t + 61_000, sender().deps);
  assert.equal((await call(db2, 'DELETE', '/v1/schedule/remindccc1', {inst: b.inst, now: t + 2000})).status, 200);
  assert.equal((await call(db2, 'DELETE', '/v1/schedule/remindaaa1', {inst: b.inst, now: t + 2000})).status, 423);
});

test('wording over the push: label rules (empty, whitespace, emoji, long preview), text only', async () => {
  for (const [label, want] of [['Get up', '“Get up”'], ['Go to the store', '“Go to the store”'], ['Call Alex', '“Call Alex”'], ['Laundry', '“Laundry”'], ['Leave at 4', '“Leave at 4”'],
    ['🔥🚗', '“🔥🚗”'], ['', '“Your reminder”'], ['  Leave   at\n 4 ', '“Leave at 4”'], ['<img src=x onerror=alert(1)>', '“<img src=x onerror=alert(1)>”']]) {
    const db = d1(), {occ} = await setup(db, {label}), {sent, deps} = sender();
    await runCron(db, dueOf(occ) + 1000, deps);
    assert.equal(sent[0].payload.body, `Reminder: ${want}.`, JSON.stringify(label));
  }
  const long = 'z'.repeat(150), db = d1(), {occ} = await setup(db, {label: long}), {sent, deps} = sender();
  await runCron(db, dueOf(occ) + 1000, deps);
  assert.equal(sent[0].payload.body, `Reminder: “${'z'.repeat(59)}…”.`);                          // only the preview is cut
  assert.equal(db.raw.prepare('SELECT label FROM occurrences').get().label, long);               // the full text is kept
});

test('migration 0002 keeps existing reminders and occurrences (rev defaults to 0 = always allowed)', async () => {
  const s = new DatabaseSync(':memory:'); s.exec(readFileSync(new URL('../backend/adhd-push/migrations/0001_init.sql', import.meta.url), 'utf8'));
  s.exec("INSERT INTO installs VALUES('i1','h',1,1); INSERT INTO schedules(id,install_id,time,tz,recur,label,followups,tandem,revision,enabled,next_due,created_at,updated_at) VALUES('old00001','i1','08:00','UTC','daily','take pills',1,1,3,1,99,1,1)");
  s.exec("INSERT INTO occurrences(id,schedule_id,install_id,due,status,label,updated_at) VALUES('old00001:5','old00001','i1',5,'ACTIVE','take pills',1)");
  s.exec(readFileSync(new URL('../backend/adhd-push/migrations/0002_revision.sql', import.meta.url), 'utf8'));
  assert.equal(s.prepare('SELECT label, revision, enabled FROM schedules').get().label, 'take pills');
  assert.equal(s.prepare('SELECT rev FROM occurrences').get().rev, 0);
});

test('no follow-ups opted in: stage 0 only', async () => {
  const db = d1(), {occ} = await setup(db, {followups: false, tandem: true}), {sent, deps} = sender(), due = dueOf(occ);
  for (const s of [0, 40, 100, 200, 400]) await runCron(db, due + s * 1000, deps);
  assert.equal(sent.length, 1);
});

test('NO per-occurrence send cap: every 30 s alert is sent (24+ in a row); intended vs effective times are logged', async () => {
  const db = d1(), {occ} = await setup(db), {sent, deps} = sender(), due = dueOf(occ);
  let last = [];
  for (let i = 0; i < 40; i++) last = await runCron(db, due + 540_000 + i * 30_000 + 400, deps);
  assert.ok(sent.length >= 40, 'sent ' + sent.length);                                            // stage 3 at 540 s then 39 repeats, nothing withheld
  assert.deepEqual(last.map(x => x.lateMs), [400]);                                                // effective - intended, per attempt
  const row = db.raw.prepare('SELECT intended_at, sent_at FROM attempts WHERE stage=5').get();
  assert.equal(row.intended_at, due + 600_000); assert.equal(row.sent_at, due + 600_400);
});

test('provider errors: 429 backs off (Retry-After), 410 retires the subscription, 403 is not retried', async () => {
  const db = d1(), {occ} = await setup(db), due = dueOf(occ);
  let status = {status: 429, retryAfter: 90};
  const {sent, deps} = sender(() => status);
  await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  await runCron(db, due + 20_000, deps); assert.equal(sent.length, 1);          // still backing off (Retry-After 90 s)
  status = 200;
  await runCron(db, due + 400_000, deps);                                        // the stage-0 retry is stale; the current stage goes instead
  assert.equal(sent.at(-1).payload.stage, 1);
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
  for (const bad of [{time: '8:00'}, {time: '24:00'}, {tz: 'Mars/Base'}, {recur: 'hourly'}, {id: 'x'}, {label: 'x'.repeat(201)}])
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

test('changing the time at the Worker: 423 before T0+540 s, accepted at 540 s; old occurrence gets no push; the new time makes exactly one chain', async () => {
  const db = d1(), {inst, s, occ} = await setup(db, {label: 'Call Alex'}), {sent, deps} = sender(), due = dueOf(occ);
  await runCron(db, due + 1000, deps);
  const change = (now, time = '15:30') => call(db, 'PUT', '/v1/schedule', {inst, now, body: {...s, time, revision: 2}});
  for (const at of [1, 300, 539.999]) { const r = await change(due + at * 1000); assert.equal(r.status, 423, 'at ' + at); assert.equal(r.body.error, 'locked'); }
  assert.equal((await change(due + 539_000)).body.remainingMs, 1000);
  assert.equal(db.raw.prepare('SELECT time FROM schedules').get().time, '12:05');                  // rejected: unchanged
  assert.equal(db.raw.prepare('SELECT status FROM occurrences').get().status, 'ACTIVE');
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now: due + 100_000, body: {...s, label: 'Call Alex 2'}})).status, 200);   // same time: not locked
  const ok = await change(due + 540_000); assert.equal(ok.status, 200);
  const sch = db.raw.prepare('SELECT * FROM schedules').get();
  assert.equal(sch.enabled, 1); assert.equal(sch.time, '15:30'); assert.ok(sch.revision >= 2); assert.equal(sch.next_due, Date.UTC(2026, 10, 25, 15, 30));
  const o = db.raw.prepare('SELECT status, reason FROM occurrences').get(); assert.deepEqual({...o}, {status: 'CANCELLED', reason: 'rescheduled'});
  const n = sent.length; await runCron(db, due + 570_000, deps); await runCron(db, due + 900_000, deps);
  assert.equal(sent.length, n);                                                                      // no stale send
  const at = sch.next_due; await runCron(db, at + 1000, deps); await runCron(db, at + 20_000, deps);
  assert.equal(sent.length, n + 1); assert.equal(sent.at(-1).payload.stage, 0);                      // exactly one new chain
  assert.equal(db.raw.prepare("SELECT COUNT(*) n FROM occurrences WHERE status='ACTIVE'").get().n, 1);
  // outside an active occurrence the time edits normally
  const d2 = d1(), s2 = await setup(d2); assert.equal((await call(d2, 'PUT', '/v1/schedule', {inst: s2.inst, now: T0 + 1000, body: {...s2.s, time: '18:00'}})).status, 200);
});
