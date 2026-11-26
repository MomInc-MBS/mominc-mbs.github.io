// HTTP API. handle(request, env, db, now) -> Response. No accounts: an install id + secret made by the browser identify one device.
import {validEndpoint} from './webpush.mjs';
import {hit, nextOf, recurOf, tzOf, finish, receiptToken} from './core.mjs';
import {validHookUrl, validToken} from './webhook.mjs';
import {recurError, recurFromLegacy, validZone, isTime} from '../../../apps/alarm/recurrence.js';
import {OFF_LOCK_MS, MAX_LABEL} from '../../../apps/alarm/stages.js';

// MAX_SCHEDULES is an abuse bound for one anonymous install, not a product limit (the app has none).
const MUTATIONS_PER_MIN = 30, INSTALLS_PER_HOUR_IP = 10, MAX_SCHEDULES = 200, MAX_COACH = 16, MAX_BODY = 8192, MAX_SNOOZE_S = 3600;
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const rand = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const same = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;
const one = (db, sql, ...a) => db.prepare(sql).bind(...a).first();
const run = async (db, sql, ...a) => (await db.prepare(sql).bind(...a).run()).meta?.changes ?? 0;

class Err extends Error { constructor(status, msg, extra) { super(msg); this.status = status; this.extra = extra; } }

const cors = env => ({'access-control-allow-origin': env.ALLOW_ORIGIN || 'https://mominc.online', 'access-control-allow-headers': 'content-type,x-install-id,x-install-secret',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-max-age': '86400', vary: 'origin'});
const json = (env, data, status = 200) => new Response(JSON.stringify(data), {status, headers: {...cors(env), 'content-type': 'application/json', 'cache-control': 'no-store'}});

async function body(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) throw new Err(413, 'too large');
  try { const v = JSON.parse(text || '{}'); if (v && typeof v === 'object') return v; } catch {}
  throw new Err(400, 'bad json');
}

async function auth(request, db) {
  const id = request.headers.get('x-install-id') || '', secret = request.headers.get('x-install-secret') || '';
  if (!/^[0-9a-f]{32}$/.test(id) || !/^[0-9a-f]{64}$/.test(secret)) throw new Err(401, 'unauthorized');
  const row = await one(db, 'SELECT * FROM installs WHERE id=?', id);
  if (!row || !same(row.secret_hash, await sha256(secret))) throw new Err(401, 'unauthorized');
  return row;
}

/** Turning an escalating reminder off is refused (423) until T0 + 540 s of its live occurrence; the lock counts from the due time, so late delivery never extends it. */
async function assertOffAllowed(db, scheduleId, now) {
  const o = await one(db, "SELECT due FROM occurrences WHERE schedule_id=? AND status='ACTIVE' AND followups=1 AND due+?>? ORDER BY due LIMIT 1", scheduleId, OFF_LOCK_MS, now);
  if (o) throw new Err(423, 'locked', {unlocksAt: o.due + OFF_LOCK_MS, remainingMs: o.due + OFF_LOCK_MS - now});
}
const occView = o => ({id: o.id, status: o.status, reason: o.reason, due: o.due, label: o.label, acked: !!o.acked_at, updatedAt: o.updated_at});

export async function handle(request, env, db, now = Date.now()) {
  const url = new URL(request.url), path = url.pathname, m = request.method;
  if (m === 'OPTIONS') return new Response(null, {status: 204, headers: cors(env)});
  try {
    if (path === '/v1/vapid' && m === 'GET') return json(env, {publicKey: env.VAPID_PUBLIC});

    if (path === '/v1/install' && m === 'POST') {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      if (!await hit(db, 'ip:' + ip + ':install', INSTALLS_PER_HOUR_IP, now)) throw new Err(429, 'slow down');
      const id = rand(16), secret = rand(32);
      await run(db, 'INSERT INTO installs(id,secret_hash,created_at,last_seen) VALUES(?,?,?,?)', id, await sha256(secret), now, now);
      return json(env, {installId: id, secret}, 201);
    }

    if (path === '/v1/receipt' && m === 'POST') {          // service worker reports received/opened; authenticated by the per-attempt HMAC
      const b = await body(request), ev = b.event;
      if (typeof b.attemptId !== 'string' || !['received', 'opened'].includes(ev)) throw new Err(400, 'bad receipt');
      const a = await one(db, 'SELECT a.*, i.secret_hash FROM attempts a JOIN installs i ON i.id=a.install_id WHERE a.id=?', b.attemptId);
      if (!a || typeof b.token !== 'string' || !same(await receiptToken(a.secret_hash, a.id), b.token)) throw new Err(403, 'bad token');
      await run(db, ev === 'received' ? 'UPDATE attempts SET received_at=COALESCE(received_at,?) WHERE id=?' : 'UPDATE attempts SET opened_at=COALESCE(opened_at,?) WHERE id=?', now, a.id);
      return json(env, {ok: true});
    }

    const inst = await auth(request, db);
    const mutating = m !== 'GET';
    if (mutating && !await hit(db, 'inst:' + inst.id, MUTATIONS_PER_MIN, now)) throw new Err(429, 'slow down');
    await run(db, 'UPDATE installs SET last_seen=? WHERE id=?', now, inst.id);

    if (path === '/v1/subscription' && m === 'PUT') {
      const b = await body(request), k = b.keys || {};
      if (typeof b.endpoint !== 'string' || !validEndpoint(b.endpoint) || typeof k.p256dh !== 'string' || typeof k.auth !== 'string'
          || !/^[A-Za-z0-9_-]{80,90}$/.test(k.p256dh) || !/^[A-Za-z0-9_-]{20,30}$/.test(k.auth)) throw new Err(400, 'bad subscription');
      await run(db, 'INSERT INTO subs(install_id,endpoint,p256dh,auth,created_at) VALUES(?,?,?,?,?) ON CONFLICT(install_id) DO UPDATE SET endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth,retired_at=NULL', inst.id, b.endpoint, k.p256dh, k.auth, now);
      return json(env, {ok: true});
    }
    if (path === '/v1/subscription' && m === 'DELETE') { await run(db, 'DELETE FROM subs WHERE install_id=?', inst.id); return json(env, {ok: true}); }

    if (path === '/v1/schedule' && m === 'PUT') {
      const b = await body(request);
      const title = b.title ?? b.label ?? '', esc = b.escalate ?? b.followups;
      const recur = typeof b.recur === 'string' ? (['once', 'daily', 'weekdays'].includes(b.recur) ? recurFromLegacy(b.recur) : null) : b.recur;      // legacy strings still work
      const tz = typeof b.tz === 'string' ? {mode: 'device', zone: b.tz} : b.tz;
      if (typeof b.id !== 'string' || !/^[A-Za-z0-9_-]{8,40}$/.test(b.id) || !isTime(b.time) || !tz || !['device', 'fixed'].includes(tz.mode) || !validZone(tz.zone) || !recur || recurError(recur)
          || typeof title !== 'string' || title.length > MAX_LABEL) throw new Err(400, 'bad schedule');
      const snooze = b.snooze == null ? 0 : Math.floor(+b.snooze);
      if (!(snooze >= 0 && snooze <= MAX_SNOOZE_S)) throw new Err(400, 'bad schedule');
      let hook = null;
      if (b.webhook != null) {
        if (!validHookUrl(b.webhook.url) || !validToken(b.webhook.token)) throw new Err(400, 'bad webhook');          // SSRF guard: https only, no private/IP-literal hosts
        hook = JSON.stringify({url: validHookUrl(b.webhook.url), token: b.webhook.token || null});
      }
      const cur = await one(db, 'SELECT * FROM schedules WHERE id=?', b.id);
      const app = b.app ?? 'adhd';   // 'coach' = MOM's: Coach MYR5 plain reminders: one notice per occurrence, never any follow-ups
      if (!['adhd', 'coach'].includes(app)) throw new Err(400, 'bad schedule');
      if (cur && (cur.install_id !== inst.id || cur.app !== app)) throw new Err(403, 'not yours');
      if (!cur && (await one(db, 'SELECT COUNT(*) n FROM schedules WHERE install_id=? AND enabled=1 AND app=?', inst.id, app)).n >= (app === 'coach' ? MAX_COACH : MAX_SCHEDULES)) throw new Err(409, 'too many schedules');
      const revIn = Math.floor(+(b.revision ?? b.rev)) || 1;
      if (cur && revIn < cur.revision) throw new Err(409, 'stale', {revision: cur.revision});                            // an older offline edit never overwrites a newer one
      const sameTz = cur && JSON.stringify(tzOf(cur)) === JSON.stringify(tz);
      const timeChange = !!cur && cur.enabled && b.enabled !== false && (cur.time !== b.time || !sameTz);
      if ((b.enabled === false || timeChange) && cur) await assertOffAllowed(db, b.id, now);     // changing the time is locked like Turn off
      const enabled = b.enabled === false ? 0 : 1, fu = esc && app === 'adhd' ? 1 : 0, td = 0;   // tandem notices are retired
      const x = enabled ? nextOf({time: b.time, recur, tz}, now) : {due: null, skipNext: !!recur.skipNext};
      const next = x.due, rc = {...recur, skipNext: x.skipNext};
      await run(db, `INSERT INTO schedules(id,install_id,time,tz,recur,label,followups,tandem,revision,enabled,next_due,created_at,updated_at,app,recur_json,tz_json,webhook,snooze) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET time=excluded.time,tz=excluded.tz,recur=excluded.recur,label=excluded.label,followups=excluded.followups,tandem=excluded.tandem,
        revision=excluded.revision,enabled=excluded.enabled,next_due=excluded.next_due,updated_at=excluded.updated_at,recur_json=excluded.recur_json,tz_json=excluded.tz_json,webhook=excluded.webhook,snooze=excluded.snooze`,
        b.id, inst.id, b.time, tz.zone, rc.kind, title, fu, td, Math.max(1, revIn, timeChange ? cur.revision + 1 : 0), enabled, next, now, now, app, JSON.stringify(rc), JSON.stringify(tz), hook, snooze);
      if (timeChange) for (const o of (await db.prepare("SELECT id FROM occurrences WHERE schedule_id=? AND status='ACTIVE'").bind(b.id).all()).results) await finish(db, o.id, 'CANCELLED', 'rescheduled', now);   // past the lock: the old occurrence ends, no stale push
      if (!enabled) for (const o of (await db.prepare("SELECT id FROM occurrences WHERE schedule_id=? AND status='ACTIVE'").bind(b.id).all()).results) await finish(db, o.id, 'CANCELLED', 'disabled', now);
      return json(env, {ok: true, nextDue: next});
    }
    if (path === '/v1/state' && m === 'GET') {                       // read current state: this install's reminders (no secrets) and recent occurrences
      const rows = (await db.prepare('SELECT id,time,tz,recur,label,followups,revision,enabled,next_due,snooze,recur_json,tz_json,webhook IS NOT NULL AS hook FROM schedules WHERE install_id=?').bind(inst.id).all()).results;
      const occs = (await db.prepare('SELECT * FROM occurrences WHERE install_id=? ORDER BY due DESC LIMIT 30').bind(inst.id).all()).results;
      return json(env, {schedules: rows.map(r => ({id: r.id, rev: r.revision, enabled: !!r.enabled, title: r.label, time: r.time, recur: recurOf(r), tz: tzOf(r), escalate: !!r.followups, snooze: r.snooze, webhook: !!r.hook, nextDue: r.next_due})), occurrences: occs.map(occView)});
    }
    let mm = /^\/v1\/schedule\/([A-Za-z0-9_-]{8,40})$/.exec(path);
    if (mm && m === 'DELETE') {                                    // disable (or, with ?remove=1, delete the reminder; occurrence history stays)
      const s = await one(db, 'SELECT * FROM schedules WHERE id=? AND install_id=?', mm[1], inst.id);
      if (!s) throw new Err(404, 'no such schedule');
      await assertOffAllowed(db, s.id, now);
      if (url.searchParams.get('remove') === '1') await run(db, 'DELETE FROM schedules WHERE id=?', s.id);
      else await run(db, 'UPDATE schedules SET enabled=0, next_due=NULL, updated_at=? WHERE id=?', now, s.id);
      for (const o of (await db.prepare("SELECT id FROM occurrences WHERE schedule_id=? AND status='ACTIVE'").bind(s.id).all()).results) await finish(db, o.id, 'CANCELLED', 'disabled', now);
      return json(env, {ok: true});
    }

    mm = /^\/v1\/occurrence\/([^/]{1,80})(?:\/(ack|complete|cancel|snooze))?$/.exec(path);
    if (mm) {
      const id = decodeURIComponent(mm[1]), act = mm[2];
      const occ = await one(db, 'SELECT * FROM occurrences WHERE id=? AND install_id=?', id, inst.id);
      if (!occ) throw new Err(404, 'no such occurrence');
      if (!act && m === 'GET') return json(env, occView(occ));
      if (act && m === 'POST') {
        // Terminal states are final: a late/duplicate call just reports the current state (a stale notice can never reactivate anything).
        if (occ.status === 'ACTIVE') {
          if (act === 'snooze') {                                   // output pause ONLY: due time, stage, generation and the Turn-off lock are untouched
            const sc = await one(db, 'SELECT snooze FROM schedules WHERE id=?', occ.schedule_id), b = await body(request);
            if (!sc?.snooze) throw new Err(409, 'snooze is off for this reminder');
            const until = Math.min(Math.max(Math.floor(+b.until) || 0, now), now + sc.snooze * 1000);
            await run(db, "UPDATE occurrences SET paused_until=? WHERE id=? AND status='ACTIVE'", until, id);
          } else if (act === 'ack') await run(db, "UPDATE occurrences SET acked_at=COALESCE(acked_at,?) WHERE id=? AND status='ACTIVE'", now, id);   // opens/acknowledges: recorded only, never completes, pauses or stops anything
          else await finish(db, id, act === 'complete' ? 'COMPLETED' : 'CANCELLED', act === 'complete' ? 'client-reported' : 'stopped', now);
        }
        return json(env, occView(await one(db, 'SELECT * FROM occurrences WHERE id=?', id)));
      }
    }
    throw new Err(404, 'not found');
  } catch (e) {
    if (e instanceof Err) return json(env, {error: e.message, ...e.extra}, e.status);
    return json(env, {error: 'server error'}, 500);
  }
}
