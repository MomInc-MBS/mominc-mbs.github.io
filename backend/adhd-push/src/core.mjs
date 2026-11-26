// Scheduling core: plain SQL over a D1-shaped `db` (prepare().bind().run()/first()/all()). The cron calls runCron().
import {stageFor, stageStart, faceFor, MISS_MS, copyFor, APP_NAME} from '../../../apps/alarm/stages.js';
import {nextDue as dueAfter, validZone, recurFromLegacy} from '../../../apps/alarm/recurrence.js';
import {sendHook} from './webhook.mjs';

export const HALF_MS = 30_000, AHEAD_MS = 45_000;         // alert deadlines sit on 30 s boundaries; a cron run also serves the next boundary if it is within 45 s
export const MAX_LATE_MS = 15 * 60_000;                 // a due time the cron missed by more than this is recorded MISSED, never sent
const STALE_MS = 45_000;                                // a planned send older than this is coalesced away, not delivered late (the next alert is never more than 30 s away)
const MAX_TRIES = 4;
// There is deliberately NO per-occurrence send cap: the schedule is 0/300/480/540 s then every 30 s. Provider limits (429 + Retry-After) back off, and
// intended vs effective send times are logged per attempt (attempts.intended_at / sent_at).

const COACH_NAME = "MOM's: Coach MYR5";
const coachBody = l => [...String(l ?? '').replace(/\s+/g, ' ').trim()].slice(0, 120).join('') || 'Time for your reminder.';
const one = (db, sql, ...a) => db.prepare(sql).bind(...a).first();
const many = async (db, sql, ...a) => (await db.prepare(sql).bind(...a).all()).results;
const run = async (db, sql, ...a) => (await db.prepare(sql).bind(...a).run()).meta?.changes ?? 0;
const sha = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const b64u = b => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// ---- time -----------------------------------------------------------------------------------------------
export const validTz = tz => validZone(tz);
/** Contract recur / tz of a stored schedule row. Old rows (NULL json) read through the legacy columns. */
export const recurOf = s => { try { if (s.recur_json) return JSON.parse(s.recur_json); } catch {} return recurFromLegacy(s.recur); };
export const tzOf = s => { try { if (s.tz_json) return JSON.parse(s.tz_json); } catch {} return {mode: 'device', zone: s.tz}; };
/** Next due after `after` for a schedule row (or {time, recur, tz}); {due, skipNext}. */
export const nextOf = (s, after) => dueAfter({time: s.time, recur: typeof s.recur === 'object' ? s.recur : recurOf(s), tz: typeof s.tz === 'object' ? s.tz : tzOf(s)}, after);
/** Legacy entry point kept for callers/tests: first wall-clock HH:MM in `tz` after `after` that a legacy recurrence ('once'|'daily'|'weekdays') allows. */
export const nextDue = (time, tz, recur, after) => dueAfter({time, recur: typeof recur === 'string' ? recurFromLegacy(recur) : recur, tz: {mode: 'fixed', zone: tz}}, after).due;

// ---- rate limit -------------------------------------------------------------------------------------------
export async function hit(db, key, limit, now) {
  const bucket = Math.floor(now / 60_000);
  const r = await one(db, 'INSERT INTO rate(key,bucket,n) VALUES(?,?,1) ON CONFLICT(key,bucket) DO UPDATE SET n=n+1 RETURNING n', key, bucket);
  return r.n <= limit;
}

// ---- occurrences ------------------------------------------------------------------------------------------
/** End an occurrence (COMPLETED/CANCELLED/MISSED): bump the generation and cancel its unsent attempts. Only an ACTIVE one can end. */
export async function finish(db, occId, status, reason, now) {
  const n = await run(db, "UPDATE occurrences SET status=?, reason=?, gen=gen+1, updated_at=? WHERE id=? AND status='ACTIVE'", status, reason, now, occId);
  if (n) await run(db, "UPDATE attempts SET status='cancelled' WHERE occ_id=? AND status IN ('planned','sending')", occId);
  return n;
}

/** Create occurrences for schedules whose time has come. INSERT OR IGNORE on the deterministic id makes a rerun a no-op. */
export async function materialize(db, now) {
  for (const s of await many(db, 'SELECT * FROM schedules WHERE enabled=1 AND next_due IS NOT NULL AND next_due<=?', now)) {
    const id = `${s.id}:${s.next_due}`, late = now - s.next_due > MAX_LATE_MS;
    await run(db, 'INSERT OR IGNORE INTO occurrences(id,schedule_id,install_id,due,status,reason,label,followups,tandem,rev,updated_at,app) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
      id, s.id, s.install_id, s.next_due, late ? 'MISSED' : 'ACTIVE', late ? 'cron-late' : null, s.label, s.followups, 0, s.revision, now, s.app);
    const rc = recurOf(s), x = rc.kind === 'once' ? {due: null} : nextOf(s, Math.max(now, s.next_due)), next = x.due;
    await run(db, 'UPDATE schedules SET next_due=?, enabled=?, updated_at=? WHERE id=? AND next_due=?', next, next === null ? 0 : 1, now, s.id, s.next_due);
    if (rc.skipNext && x.skipNext === false) await run(db, 'UPDATE schedules SET recur_json=? WHERE id=?', JSON.stringify({...rc, skipNext: false}), s.id);   // a skipped occurrence is consumed exactly once
  }
  for (const o of await many(db, "SELECT id FROM occurrences WHERE status='ACTIVE' AND due<?", now - MISS_MS)) await finish(db, o.id, 'MISSED', 'expired', now);
}

/** Plan the one attempt each active occurrence currently needs: the CURRENT alert only. Older ones are skipped (coalesced), never replayed. */
export async function plan(db, now) {
  const ins = "INSERT OR IGNORE INTO attempts(id,occ_id,install_id,gen,stage,kind,status,planned_at,intended_at) VALUES(?,?,?,?,?,?,'planned',?,?)";
  for (const o of await many(db, "SELECT * FROM occurrences WHERE status='ACTIVE' AND due<=?", now)) {
    const stage = o.followups ? stageFor((now - o.due) / 1000) : 0;               // alert index: 0,1,2,3 then 4,5,6... every 30 s on stage 4
    await run(db, ins, `${o.id}:${stage}:main`, o.id, o.install_id, o.gen, stage, 'main', now, o.due + stageStart(stage) * 1000);   // intended = the schedule's own boundary
  }
}

const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
export const receiptToken = async (secretHash, attemptId) => hex(await crypto.subtle.sign('HMAC',
  await crypto.subtle.importKey('raw', new TextEncoder().encode(secretHash), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']), new TextEncoder().encode(attemptId)));
const backoff = (tries, retryAfter) => Math.max(retryAfter * 1000, 30_000 * 2 ** tries);

/** Send due attempts. deps = {send(sub, payload, {ttl, topic}) -> {status, retryAfter}, publicOrigin}. */
export async function dispatch(db, now, deps) {
  const out = [];
  for (const a of await many(db, "SELECT * FROM attempts WHERE status='planned' AND planned_at<=? ORDER BY planned_at LIMIT 200", now)) {
    const occ = await one(db, 'SELECT * FROM occurrences WHERE id=?', a.occ_id);
    if (!occ || occ.status !== 'ACTIVE' || occ.gen !== a.gen) { await run(db, "UPDATE attempts SET status='cancelled' WHERE id=? AND status='planned'", a.id); continue; }
    const newer = await one(db, "SELECT 1 x FROM attempts WHERE occ_id=? AND kind=? AND stage>? AND status!='cancelled'", a.occ_id, a.kind, a.stage);
    if (newer || a.planned_at < now - STALE_MS) { await run(db, "UPDATE attempts SET status='coalesced' WHERE id=? AND status='planned'", a.id); continue; }
    const sch = await one(db, 'SELECT * FROM schedules WHERE id=?', occ.schedule_id);   // the reminder must still exist, still be on (a fired once-alarm is switched off by design) and not be older than the occurrence
    if (!sch || (!sch.enabled && sch.recur !== 'once') || sch.revision < occ.rev) { await run(db, "UPDATE attempts SET status='cancelled' WHERE id=? AND status='planned'", a.id); continue; }
    if (occ.paused_until > now) { await run(db, "UPDATE attempts SET status='coalesced' WHERE id=? AND status='planned'", a.id); continue; }   // snoozed: outputs are paused, the clock is not
    const sub = await one(db, 'SELECT s.*, i.secret_hash FROM subs s JOIN installs i ON i.id=s.install_id WHERE s.install_id=? AND s.retired_at IS NULL', a.install_id);
    if (!sub) { await run(db, "UPDATE attempts SET status='cancelled', http_status=410 WHERE id=?", a.id); continue; }
    if (sub.backoff_until > now) continue;                                              // the provider asked us to slow down: wait (goes stale and coalesces; the next alert is never replayed late)
    // Claim. The EXISTS re-checks status + generation in the same statement, so a completion that lands first wins.
    const claimed = await run(db, "UPDATE attempts SET status='sending', sent_at=?, tries=tries+1 WHERE id=? AND status='planned' AND EXISTS(SELECT 1 FROM occurrences o WHERE o.id=attempts.occ_id AND o.status='ACTIVE' AND o.gen=attempts.gen)", now, a.id);
    if (!claimed) continue;
    const ttl = a.stage === 0 ? 120 : a.stage >= 4 ? 30 : 60;
    const payload = {appId: 'adhd', occurrenceId: occ.id, occId: occ.id, attemptId: a.id, stage: a.stage, face: faceFor(a.stage) + 1, kind: a.kind, rev: occ.rev, dueAt: occ.due, expiresAt: now + ttl * 1000,
      url: `/apps/alarm/?occ=${encodeURIComponent(occ.id)}`, tag: `adhd-${occ.id}`, title: APP_NAME, body: copyFor(a.stage, occ.label, true),
      receipt: {url: deps.publicOrigin + '/v1/receipt', token: await receiptToken(sub.secret_hash, a.id)}};
    if (occ.app === 'coach') Object.assign(payload, {appId: 'coach', face: 0, url: '/apps/coach/?panel=reminders', tag: `coach-${occ.id}`, title: COACH_NAME, body: coachBody(occ.label)});   // plain text, stage 0 only: followups is always 0 for coach
    const r = await deps.send(sub, payload, {ttl, topic: b64u(await sha(occ.id)).slice(0, 22)});   // one Topic per occurrence: a queued older alert is replaced, not stacked
    if (r.status >= 200 && r.status < 300) await run(db, "UPDATE attempts SET status='sent', http_status=? WHERE id=?", r.status, a.id);
    else if (r.status === 404 || r.status === 410) {                                    // the push service says this subscription is gone
      await run(db, 'UPDATE subs SET retired_at=? WHERE install_id=?', now, a.install_id);
      await run(db, "UPDATE attempts SET status='gone', http_status=? WHERE id=?", r.status, a.id);
    } else if (r.status === 429 || r.status >= 500 || r.status === 0) {                // back off, keep the same attempt id
      if (r.status === 429 && r.retryAfter > 0) await run(db, 'UPDATE subs SET backoff_until=? WHERE install_id=?', now + r.retryAfter * 1000, a.install_id);   // honour Retry-After for this endpoint
      await run(db, 'UPDATE attempts SET status=?, planned_at=?, http_status=?, retry_after=? WHERE id=?', a.tries + 1 < MAX_TRIES ? 'planned' : 'failed', now + backoff(a.tries + 1, r.retryAfter), r.status, r.retryAfter || null, a.id);
    }
    else await run(db, "UPDATE attempts SET status='failed', http_status=? WHERE id=?", r.status, a.id);   // 400/401/403: our fault, do not hammer
    out.push({id: a.id, status: r.status, intendedAt: a.intended_at ?? a.planned_at, effectiveAt: now, lateMs: now - (a.intended_at ?? a.planned_at)});   // intended vs effective, for the log
  }
  return out;
}

/** Webhook output: POST {occId, stage, dueAt} to the reminder's user-owned URL when an occurrence reaches a NEW stage (1..4; the 30 s repeats are not new stages).
 *  Skipped while snoozed or terminal. Claimed per stage in one UPDATE, so a rerun or overlapping cron cannot send it twice. */
export async function hooks(db, now, deps) {
  const out = [];
  for (const o of await many(db, "SELECT o.*, s.webhook FROM occurrences o JOIN schedules s ON s.id=o.schedule_id WHERE o.status='ACTIVE' AND o.due<=? AND o.paused_until<=? AND s.webhook IS NOT NULL", now, now)) {
    const stage = faceFor(o.followups ? stageFor((now - o.due) / 1000) : 0) + 1;
    if (stage <= o.hook_stage || !await run(db, "UPDATE occurrences SET hook_stage=? WHERE id=? AND status='ACTIVE' AND hook_stage<?", stage, o.id, stage)) continue;
    let hook = null; try { hook = JSON.parse(o.webhook); } catch {}
    const r = await sendHook(hook, {occId: o.id, stage, dueAt: o.due}, {fetchImpl: deps.hookFetch});
    out.push({occId: o.id, stage, status: r.status});
  }
  return out;
}

/** One cron run (every minute). Sends what is due now; then, because Workers cron cannot go finer than a minute, it also serves the stage-4
 *  half-minute: all deadlines sit on 30 s boundaries (due times are whole minutes), so it sleeps to the next boundary (if within AHEAD_MS)
 *  and re-plans from the DATABASE, which means a stop, a win/loss or a disable that lands during the wait is honoured. deps.sleep/deps.clock are injectable. */
export async function runCron(db, now, deps) {
  await materialize(db, now);
  await plan(db, now);
  const sent = await dispatch(db, now, deps), hooked = await hooks(db, now, deps);
  const next = Math.floor(now / HALF_MS) * HALF_MS + HALF_MS;
  if (deps.sleep && next - now <= AHEAD_MS) {
    await deps.sleep(next - now);
    const t = Math.max(next, deps.clock?.() ?? next);
    await plan(db, t);
    sent.push(...await dispatch(db, t, deps));
    hooked.push(...await hooks(db, t, deps));
  }
  sent.hooks = hooked;
  await run(db, 'DELETE FROM rate WHERE bucket<?', Math.floor(now / 60_000) - 60);
  await run(db, 'DELETE FROM attempts WHERE COALESCE(sent_at, planned_at)<?', now - 14 * 86400_000);
  return sent;
}
