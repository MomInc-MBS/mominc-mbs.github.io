// Scheduling core: plain SQL over a D1-shaped `db` (prepare().bind().run()/first()/all()). The cron calls runCron().
import {stageFor, faceFor, MISS_MS, copyFor, APP_NAME} from '../../../apps/alarm/stages.js';

export const MAX_SENDS = 24, WINDOW_MS = 10 * 60_000;  // our bound: 24 sends per occurrence per rolling 10 min (stage 4 needs 20; not Apple's number)
export const HALF_MS = 30_000, AHEAD_MS = 45_000;         // alert deadlines sit on 30 s boundaries; a cron run also serves the next boundary if it is within 45 s
export const MAX_LATE_MS = 15 * 60_000;                 // a due time the cron missed by more than this is recorded MISSED, never sent
const STALE_MS = 45_000;                                // a planned send older than this is coalesced away, not delivered late (the next alert is never more than 30 s away)
const MAX_TRIES = 4;

const COACH_NAME = "MOM's: Coach MYR5";
const coachBody = l => [...String(l ?? '').replace(/\s+/g, ' ').trim()].slice(0, 120).join('') || 'Time for your reminder.';
const one = (db, sql, ...a) => db.prepare(sql).bind(...a).first();
const many = async (db, sql, ...a) => (await db.prepare(sql).bind(...a).all()).results;
const run = async (db, sql, ...a) => (await db.prepare(sql).bind(...a).run()).meta?.changes ?? 0;

// ---- time -----------------------------------------------------------------------------------------------
const parts = (ms, tz) => Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric'}).formatToParts(new Date(ms)).map(p => [p.type, +p.value]));
const offset = (ms, tz) => { const p = parts(ms, tz); return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000; };
export const validTz = tz => { try { new Intl.DateTimeFormat('en-US', {timeZone: tz}); return typeof tz === 'string' && tz.length < 64; } catch { return false; } };

/** First wall-clock `HH:MM` in `tz` strictly after `after` (ms) that the recurrence allows. */
export function nextDue(time, tz, recur, after) {
  const [h, m] = time.split(':').map(Number), start = parts(after, tz);
  for (let d = 0; d < 9; d++) {
    const day = new Date(Date.UTC(start.year, start.month - 1, start.day + d));
    const wd = day.getUTCDay();                          // weekday of that local calendar date
    if (recur === 'weekdays' && (wd === 0 || wd === 6)) continue;
    const wall = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m);
    let t = wall - offset(wall, tz); t = wall - offset(t, tz);   // second pass settles DST edges
    if (t > after) return t;
  }
  return null;
}

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
    const next = s.recur === 'once' ? null : nextDue(s.time, s.tz, s.recur, Math.max(now, s.next_due));
    await run(db, 'UPDATE schedules SET next_due=?, enabled=?, updated_at=? WHERE id=? AND next_due=?', next, next === null ? 0 : 1, now, s.id, s.next_due);
  }
  for (const o of await many(db, "SELECT id FROM occurrences WHERE status='ACTIVE' AND due<?", now - MISS_MS)) await finish(db, o.id, 'MISSED', 'expired', now);
}

/** Plan the one attempt each active occurrence currently needs: the CURRENT alert only. Older ones are skipped (coalesced), never replayed. */
export async function plan(db, now) {
  const ins = "INSERT OR IGNORE INTO attempts(id,occ_id,install_id,gen,stage,kind,status,planned_at) VALUES(?,?,?,?,?,?,'planned',?)";
  for (const o of await many(db, "SELECT * FROM occurrences WHERE status='ACTIVE' AND due<=?", now)) {
    const stage = o.followups ? stageFor((now - o.due) / 1000) : 0;               // alert index: 0,1,2,3 then 4,5,6... every 30 s on stage 4
    await run(db, ins, `${o.id}:${stage}:main`, o.id, o.install_id, o.gen, stage, 'main', now);
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
    const recent = await one(db, 'SELECT COUNT(*) n FROM attempts WHERE occ_id=? AND sent_at>?', a.occ_id, now - WINDOW_MS);
    if (recent.n >= MAX_SENDS) continue;                                                // over our bound: wait; goes stale and coalesces
    const sub = await one(db, 'SELECT s.*, i.secret_hash FROM subs s JOIN installs i ON i.id=s.install_id WHERE s.install_id=? AND s.retired_at IS NULL', a.install_id);
    if (!sub) { await run(db, "UPDATE attempts SET status='cancelled', http_status=410 WHERE id=?", a.id); continue; }
    // Claim. The EXISTS re-checks status + generation in the same statement, so a completion that lands first wins.
    const claimed = await run(db, "UPDATE attempts SET status='sending', sent_at=?, tries=tries+1 WHERE id=? AND status='planned' AND EXISTS(SELECT 1 FROM occurrences o WHERE o.id=attempts.occ_id AND o.status='ACTIVE' AND o.gen=attempts.gen)", now, a.id);
    if (!claimed) continue;
    const payload = {appId: 'adhd', occurrenceId: occ.id, attemptId: a.id, stage: a.stage, face: faceFor(a.stage) + 1, kind: a.kind, url: `/apps/alarm/?occ=${encodeURIComponent(occ.id)}`,
      tag: `adhd-${occ.id}`, title: APP_NAME, body: copyFor(a.stage, occ.label, true),
      receipt: {url: deps.publicOrigin + '/v1/receipt', token: await receiptToken(sub.secret_hash, a.id)}};
    if (occ.app === 'coach') Object.assign(payload, {appId: 'coach', face: 0, url: '/apps/coach/?panel=reminders', tag: `coach-${occ.id}`, title: COACH_NAME, body: coachBody(occ.label)});   // plain text, stage 0 only: followups is always 0 for coach
    const r = await deps.send(sub, payload, {ttl: a.stage === 0 ? 120 : a.stage >= 4 ? 30 : 60, topic: occ.id.slice(-16).replace(/[^A-Za-z0-9_-]/g, '_')});
    if (r.status >= 200 && r.status < 300) await run(db, "UPDATE attempts SET status='sent', http_status=? WHERE id=?", r.status, a.id);
    else if (r.status === 404 || r.status === 410) {                                    // the push service says this subscription is gone
      await run(db, 'UPDATE subs SET retired_at=? WHERE install_id=?', now, a.install_id);
      await run(db, "UPDATE attempts SET status='gone', http_status=? WHERE id=?", r.status, a.id);
    } else if (r.status === 429 || r.status >= 500 || r.status === 0)                  // back off, keep the same attempt id
      await run(db, 'UPDATE attempts SET status=?, planned_at=?, http_status=? WHERE id=?', a.tries + 1 < MAX_TRIES ? 'planned' : 'failed', now + backoff(a.tries + 1, r.retryAfter), r.status, a.id);
    else await run(db, "UPDATE attempts SET status='failed', http_status=? WHERE id=?", r.status, a.id);   // 400/401/403: our fault, do not hammer
    out.push({id: a.id, status: r.status});
  }
  return out;
}

/** One cron run (every minute). Sends what is due now; then, because Workers cron cannot go finer than a minute, it also serves the stage-4
 *  half-minute: all deadlines sit on 30 s boundaries (due times are whole minutes), so it sleeps to the next boundary (if within AHEAD_MS)
 *  and re-plans from the DATABASE, which means a stop, a win/loss or a disable that lands during the wait is honoured. deps.sleep/deps.clock are injectable. */
export async function runCron(db, now, deps) {
  await materialize(db, now);
  await plan(db, now);
  const sent = await dispatch(db, now, deps);
  const next = Math.floor(now / HALF_MS) * HALF_MS + HALF_MS;
  if (deps.sleep && next - now <= AHEAD_MS) {
    await deps.sleep(next - now);
    const t = Math.max(next, deps.clock?.() ?? next);
    await plan(db, t);
    sent.push(...await dispatch(db, t, deps));
  }
  await run(db, 'DELETE FROM rate WHERE bucket<?', Math.floor(now / 60_000) - 60);
  await run(db, 'DELETE FROM attempts WHERE COALESCE(sent_at, planned_at)<?', now - 14 * 86400_000);
  return sent;
}
