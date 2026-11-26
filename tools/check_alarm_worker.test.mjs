// Push Worker, multi-reminder build: contract record, recurrence in the Worker, snooze, webhook + SSRF guard, Retry-After, migration 0004 on live rows.
// Same D1 shim as check_adhd_push.test.mjs (real SQL on node:sqlite).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handle} from '../backend/adhd-push/src/api.mjs';
import {runCron, nextOf} from '../backend/adhd-push/src/core.mjs';
import {validHookUrl, sendHook, privateHost} from '../backend/adhd-push/src/webhook.mjs';

const mig = n => readFileSync(new URL(`../backend/adhd-push/migrations/${n}.sql`, import.meta.url), 'utf8');
const LIVE = ['0001_init', '0002_revision', '0003_app'], ALL = [...LIVE, '0004_multi'];
function d1(migs = ALL) {
  const s = new DatabaseSync(':memory:'); for (const m of migs) s.exec(mig(m));
  return {raw: s, prepare: sql => {
    const st = s.prepare(sql);
    const mk = args => ({bind: (...a) => mk(a), run: async () => ({meta: {changes: st.run(...args).changes}}), first: async () => st.get(...args) ?? null, all: async () => ({results: st.all(...args)})});
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
const rec = (o = {}) => ({id: 'r_alpha00001', rev: 1, enabled: true, title: 'Laundry', time: '12:05', recur: {kind: 'daily'}, tz: {mode: 'fixed', zone: 'UTC'}, escalate: true, ...o});
async function setup(db, body = rec(), now = T0) {
  const inst = (await call(db, 'POST', '/v1/install', {now})).body;
  assert.equal((await call(db, 'PUT', '/v1/subscription', {inst, now, body: {endpoint: EP, keys: {p256dh: P256, auth: AUTH}}})).status, 200);
  const r = await call(db, 'PUT', '/v1/schedule', {inst, now, body}); assert.equal(r.status, 200, JSON.stringify(r.body));
  return {inst, due: r.body.nextDue};
}
const sender = (statusFor = () => 200) => {
  const sent = [];
  return {sent, deps: {publicOrigin: 'https://adhd.test', send: async (sub, payload, opts) => { sent.push({payload, opts}); const st = statusFor(payload, sent.length); return typeof st === 'object' ? st : {status: st, retryAfter: 0}; }}};
};

test('migration 0004 is additive: live rows from 0001-0003 keep working (legacy recur + zone columns), then new rows coexist', async () => {
  const db = d1(LIVE), inst = 'a'.repeat(32);
  db.raw.prepare('INSERT INTO installs VALUES(?,?,?,?)').run(inst, 'h', 1, 1);
  db.raw.prepare('INSERT INTO subs(install_id,endpoint,p256dh,auth,created_at) VALUES(?,?,?,?,1)').run(inst, EP, P256, AUTH);
  const due = Date.UTC(2026, 10, 26, 8);
  db.raw.prepare("INSERT INTO schedules(id,install_id,time,tz,recur,label,followups,tandem,revision,enabled,next_due,created_at,updated_at,app) VALUES('legacy0001',?,'08:00','America/New_York','weekdays','Old',1,0,2,1,?,1,1,'adhd')").run(inst, due + 5 * 3600_000);
  db.raw.exec(mig('0004_multi'));
  const row = db.raw.prepare("SELECT * FROM schedules WHERE id='legacy0001'").get();
  assert.deepEqual([row.recur, row.recur_json, row.tz_json, row.snooze, row.webhook], ['weekdays', null, null, 0, null]);
  assert.equal(nextOf(row, Date.UTC(2026, 10, 27, 14)).due, Date.UTC(2026, 10, 30, 13));                // Fri after 08:00 NY -> Monday 08:00 NY (13:00Z)
  const {sent, deps} = sender(); await runCron(db, row.next_due + 3000, deps);
  assert.equal(sent.length, 1); assert.equal(sent[0].payload.stage, 0);                                  // the existing reminder still rings
  assert.equal(db.raw.prepare("SELECT next_due FROM schedules WHERE id='legacy0001'").get().next_due, Date.UTC(2026, 10, 27, 13));
});

test('contract record: many reminders per install, own occurrences, one tag + one short Topic per occurrence, payload carries occId/dueAt/rev/expiry', async () => {
  const db = d1(), {inst, due} = await setup(db);
  for (const [id, time] of [['r_bravo00002', '12:05'], ['r_charlie003', '12:20']]) assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: rec({id, time, title: id})})).status, 200);
  const {sent, deps} = sender();
  await runCron(db, due + 2000, deps);
  assert.equal(sent.length, 2);
  const [a, b] = sent;
  assert.notEqual(a.payload.tag, b.payload.tag); assert.notEqual(a.opts.topic, b.opts.topic);
  assert.ok(a.opts.topic.length <= 32 && /^[A-Za-z0-9_-]+$/.test(a.opts.topic));
  assert.deepEqual([a.payload.occId, a.payload.dueAt, a.payload.rev, a.payload.expiresAt], [a.payload.occurrenceId, due, 1, due + 2000 + 120_000]);
  assert.equal(a.payload.url, '/apps/alarm/?occ=' + encodeURIComponent(a.payload.occId));
  await runCron(db, due + 302_000, deps);                                                                // 5 min later: both at stage 1, still ONE push each, same topic (replaces the queued alert)
  assert.equal(sent.length, 4); assert.equal(sent[2].opts.topic, a.opts.topic);
  const st = (await call(db, 'GET', '/v1/state', {inst})).body;
  assert.equal(st.schedules.length, 3); assert.ok(st.schedules.every(s => !('webhook' in s) || typeof s.webhook === 'boolean'));
  assert.equal(st.occurrences.length, 2);
});

test('recurrence in the Worker is the shared module: weekly days, skip dates, skipNext consumed once, fixed zone and DST', async () => {
  const db = d1(), LA = {mode: 'fixed', zone: 'America/Los_Angeles'};
  const {inst, due} = await setup(db, rec({recur: {kind: 'weekly', days: [1, 3, 5], skip: ['2026-11-27']}, tz: LA, time: '07:30'}), Date.UTC(2026, 10, 26, 16));   // Thu 08:00 PST
  assert.equal(due, Date.parse('2026-11-30T07:30:00-08:00'));                                            // Fri 27 skipped -> Monday
  const sk = (await call(db, 'PUT', '/v1/schedule', {inst, body: rec({rev: 2, recur: {kind: 'daily', skipNext: true}, tz: LA, time: '07:30'}), now: Date.UTC(2026, 10, 26, 16)})).body;
  assert.equal(sk.nextDue, Date.parse('2026-11-28T07:30:00-08:00'));                                     // skipNext skipped Fri 27
  assert.equal(JSON.parse(db.raw.prepare('SELECT recur_json j FROM schedules').get().j).skipNext, false);
  const gap = (await call(db, 'PUT', '/v1/schedule', {inst, body: rec({id: 'r_gap0000001', recur: {kind: 'daily'}, tz: LA, time: '02:30'}), now: Date.parse('2027-03-13T12:00:00-08:00')})).body;
  assert.equal(gap.nextDue, Date.parse('2027-03-14T03:30:00-07:00'));
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: rec({id: 'r_bad0000001', recur: {kind: 'weekly', days: []}})})).status, 400);
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: rec({id: 'r_bad0000002', tz: {mode: 'fixed', zone: 'Mars/Base'}})})).status, 400);
  // skipNext consumed by the cron's own rescheduling
  const db2 = d1(), s2 = await setup(db2, rec({recur: {kind: 'daily', skipNext: false}})), {deps} = sender();
  db2.raw.prepare("UPDATE schedules SET recur_json=? WHERE id='r_alpha00001'").run(JSON.stringify({kind: 'daily', skipNext: true}));
  await runCron(db2, s2.due + 1000, deps);
  assert.equal(db2.raw.prepare('SELECT next_due n FROM schedules').get().n, s2.due + 2 * 86400_000);     // tomorrow's occurrence skipped
  assert.equal(JSON.parse(db2.raw.prepare('SELECT recur_json j FROM schedules').get().j).skipNext, false);
});

test('Turn-off / remove / time change locked until T0+540 s (423), allowed at 540 s; removal keeps occurrence history', async () => {
  const db = d1(), {inst, due} = await setup(db), {deps} = sender();
  await runCron(db, due + 1000, deps);
  const id = 'r_alpha00001';
  for (const at of [1, 300, 539.999]) {
    const now = due + at * 1000;
    assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now, body: rec({rev: 2, enabled: false})})).status, 423);
    assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now, body: rec({rev: 2, time: '15:00'})})).status, 423);
    assert.equal((await call(db, 'DELETE', `/v1/schedule/${id}?remove=1`, {inst, now})).status, 423);
  }
  assert.equal((await call(db, 'DELETE', `/v1/schedule/${id}`, {inst, now: due + 539_000})).body.remainingMs, 1000);
  assert.equal((await call(db, 'DELETE', `/v1/schedule/${id}?remove=1`, {inst, now: due + 540_000})).status, 200);
  assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM schedules').get().n, 0);
  const o = db.raw.prepare('SELECT status FROM occurrences').get(); assert.equal(o.status, 'CANCELLED');
});

test('older revision never overwrites a newer one; terminal occurrence and stale schedule get no push', async () => {
  const db = d1(), {inst, due} = await setup(db, rec({rev: 3}));
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: rec({rev: 2, title: 'older'})})).status, 409);
  assert.equal(db.raw.prepare('SELECT label FROM schedules').get().label, 'Laundry');
  const {sent, deps} = sender(); await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  const occ = `r_alpha00001:${due}`;
  assert.equal((await call(db, 'POST', `/v1/occurrence/${occ}/complete`, {inst, now: due + 2000})).body.status, 'COMPLETED');
  await runCron(db, due + 302_000, deps); await runCron(db, due + 542_000, deps);
  assert.equal(sent.length, 1);                                                                          // a terminal occurrence never sends again
});

test('snooze pauses sends for THAT occurrence only: no T0/generation/lock change; capped to the reminder length; later stages go out again', async () => {
  const db = d1(), {inst, due} = await setup(db, rec({snooze: 120})), {sent, deps} = sender(), occ = `r_alpha00001:${due}`;
  await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  const sn = await call(db, 'POST', `/v1/occurrence/${occ}/snooze`, {inst, now: due + 20_000, body: {until: due + 20_000 + 9_999_000}});
  assert.equal(sn.body.status, 'ACTIVE');
  const o = db.raw.prepare('SELECT paused_until p, due, gen FROM occurrences').get();
  assert.deepEqual([o.p, o.due, o.gen], [due + 140_000, due, 0]);                                       // capped to 120 s; due and generation untouched
  assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, now: due + 100_000, body: rec({rev: 2, enabled: false, snooze: 120})})).status, 423);   // snoozing is not a way out
  await runCron(db, due + 301_000, deps); assert.equal(sent.at(-1).payload.stage, 1);                    // snooze ended at 140 s: stage 1 (300 s) goes out
});

test('a send inside the snooze window is dropped, never delivered late; snooze off -> 409', async () => {
  const db = d1(), {inst, due} = await setup(db, rec({snooze: 600})), {sent, deps} = sender(), occ = `r_alpha00001:${due}`;
  await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  await call(db, 'POST', `/v1/occurrence/${occ}/snooze`, {inst, now: due + 10_000, body: {until: due + 410_000}});
  await runCron(db, due + 301_000, deps); assert.equal(sent.length, 1);                                  // stage 1 (300 s) is inside the snooze
  await runCron(db, due + 481_000, deps); assert.equal(sent.at(-1).payload.stage, 2); assert.equal(sent.length, 2);   // stage 2 (480 s) is after it
  assert.equal(db.raw.prepare("SELECT status FROM attempts WHERE stage=1").get().status, 'coalesced');
  const db2 = d1(), s2 = await setup(db2, rec({snooze: 0})); await runCron(db2, s2.due + 1000, sender().deps);
  assert.equal((await call(db2, 'POST', `/v1/occurrence/r_alpha00001:${s2.due}/snooze`, {inst: s2.inst, now: s2.due + 2000, body: {until: s2.due + 99_000}})).status, 409);
});

test('provider 429 with Retry-After holds ALL sends to that endpoint until then (no arbitrary cap), then resumes; effective vs intended logged', async () => {
  const db = d1(), {due} = await setup(db);
  let st = {status: 429, retryAfter: 100};
  const {sent, deps} = sender(() => st);
  await runCron(db, due + 1000, deps); assert.equal(sent.length, 1);
  assert.equal(db.raw.prepare('SELECT backoff_until b FROM subs').get().b, due + 1000 + 100_000);
  assert.equal(db.raw.prepare('SELECT retry_after r FROM attempts').get().r, 100);
  await runCron(db, due + 60_000, deps); assert.equal(sent.length, 1);                                   // inside Retry-After
  st = 200;
  const out = await runCron(db, due + 301_000, deps);
  assert.equal(sent.at(-1).payload.stage, 1); assert.equal(out[0].intendedAt, due + 300_000); assert.equal(out[0].lateMs, 1000);
});

test('delayed cron: one push for the CURRENT alert, no catch-up burst', async () => {
  const db = d1(), {due} = await setup(db), {sent, deps} = sender();
  await runCron(db, due + 612_000, deps);
  assert.deepEqual(sent.map(x => x.payload.stage), [5]);
});

test('webhook validation (SSRF guard): https only; no localhost, private, link-local, IP literals, credentials, ports, internal names', () => {
  for (const ok of ['https://hooks.example.com/x', 'https://a.b.example.org/path?q=1']) assert.ok(validHookUrl(ok), ok);
  for (const bad of ['http://hooks.example.com/x', 'https://localhost/x', 'https://127.0.0.1/x', 'https://10.0.0.5/x', 'https://192.168.1.2/x', 'https://172.16.0.1/x', 'https://169.254.169.254/latest',
    'https://[::1]/x', 'https://[fe80::1]/x', 'https://[::ffff:10.0.0.1]/x', 'https://2130706433/x', 'https://0x7f.0.0.1/x', 'https://017700000001/x', 'https://u:p@hooks.example.com/x',
    'https://hooks.example.com:8443/x', 'https://printer.local/x', 'https://svc.internal/x', 'https://intranet/x', 'https://x.localhost/x', 'ftp://hooks.example.com/', 'javascript:alert(1)', '', null, 5, 'https://' + 'a'.repeat(600) + '.com'])
    assert.equal(validHookUrl(bad), null, String(bad));
  assert.equal(privateHost('example.com'), false);
});

test('webhook send: POST {occId, stage, dueAt} only, no redirects followed, 5 s timeout, bounded body, never throws', async () => {
  const hook = {url: 'https://hooks.example.com/x', token: 'tok'}, seen = [];
  const ok = await sendHook(hook, {occId: 'o:1', stage: 2, dueAt: 5, secret: 'leak?'}, {fetchImpl: async (u, o) => { seen.push({u, o}); return new Response('{"ok":true}', {status: 200}); }});
  assert.equal(ok.status, 200); assert.equal(seen[0].o.redirect, 'manual'); assert.equal(seen[0].o.method, 'POST'); assert.equal(seen[0].o.headers.authorization, 'Bearer tok');
  assert.deepEqual(JSON.parse(seen[0].o.body), {occId: 'o:1', stage: 2, dueAt: 5});                      // nothing else leaves the Worker
  assert.equal((await sendHook(hook, {}, {fetchImpl: async () => new Response(null, {status: 302, headers: {location: 'http://169.254.169.254/'}})})).status, 310);
  let cancelled = false;
  const big = new Response(new ReadableStream({pull(c) { c.enqueue(new Uint8Array(1500)); }, cancel() { cancelled = true; }}), {status: 200});
  assert.equal((await sendHook(hook, {}, {fetchImpl: async () => big})).status, 200); assert.equal(cancelled, true);   // body read stops at the bound
  const slow = await sendHook(hook, {}, {timeoutMs: 20, fetchImpl: (u, o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(Error('abort'))))});
  assert.equal(slow.status, 0);
  assert.equal((await sendHook({url: 'http://localhost/x'}, {}, {fetchImpl: async () => { throw Error('must not be called'); }})).refused, true);
  assert.equal((await sendHook(hook, {}, {fetchImpl: async () => { throw Error('net'); }})).status, 0);
});

test('webhook output: saved only if valid; fires once per NEW stage (not per 30 s repeat); not while snoozed; never after the occurrence ends', async () => {
  const db = d1(), hook = {url: 'https://hooks.example.com/x', token: null};
  const {inst, due} = await setup(db, rec({webhook: hook, snooze: 100}));
  for (const bad of ['http://hooks.example.com/x', 'https://localhost/x', 'https://10.1.1.1/x']) assert.equal((await call(db, 'PUT', '/v1/schedule', {inst, body: rec({id: 'r_hookbad001', webhook: {url: bad}})})).status, 400, bad);
  assert.ok(db.raw.prepare('SELECT webhook w FROM schedules').get().w);
  const posts = [], {sent, deps} = sender(); deps.hookFetch = async (u, o) => { posts.push(JSON.parse(o.body)); return new Response('', {status: 200}); };
  const occ = `r_alpha00001:${due}`;
  for (const s of [1, 30, 301, 481, 541, 571, 601]) await runCron(db, due + s * 1000, deps);
  assert.deepEqual(posts.map(p => p.stage), [1, 2, 3, 4]); assert.ok(posts.every(p => p.occId === occ && p.dueAt === due && Object.keys(p).length === 3));
  const db2 = d1(), s2 = await setup(db2, rec({webhook: hook, snooze: 600})), p2 = [], d2 = sender().deps; d2.hookFetch = async (u, o) => { p2.push(1); return new Response('', {status: 200}); };
  await runCron(db2, s2.due + 1000, d2); assert.equal(p2.length, 1);
  await call(db2, 'POST', `/v1/occurrence/r_alpha00001:${s2.due}/snooze`, {inst: s2.inst, now: s2.due + 2000, body: {until: s2.due + 602_000}});
  await runCron(db2, s2.due + 301_000, d2); assert.equal(p2.length, 1);                                  // snoozed: the stage change waits
  await call(db2, 'POST', `/v1/occurrence/r_alpha00001:${s2.due}/cancel`, {inst: s2.inst, now: s2.due + 305_000});
  await runCron(db2, s2.due + 481_000, d2); assert.equal(p2.length, 1);
});

test('nextOf handles legacy and contract rows alike', () => {
  assert.equal(nextOf({time: '08:00', tz: 'UTC', recur: 'daily'}, T0).due, Date.UTC(2026, 10, 26, 8));
  assert.equal(nextOf({time: '08:00', tz: {mode: 'fixed', zone: 'UTC'}, recur: {kind: 'daily'}}, T0).due, Date.UTC(2026, 10, 26, 8));
});
