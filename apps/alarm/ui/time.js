// Pure time helpers for the wordless settings: HH:MM:SS durations, numeric dates, weekday date columns, month grids, upcoming dates.
// ponytail: nextDue/upcoming mirror the contract rules for the on-screen preview only; round 2 can import ../recurrence.js (lane W, same
// nextDue(r, afterMs) signature) and drop the copy. The adapter's scheduler stays authoritative.
const DAY = 86400_000;
const p2 = v => String(v).padStart(2, '0');

/** Seconds -> "HH:MM:SS" (clamped at 0). */
export const hms = s => { s = Math.max(0, Math.floor(+s || 0)); return `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s % 3600 / 60))}:${p2(s % 60)}`; };
/** Remaining time until `until` (ms) as HH:MM:SS, rounded up so it never shows 00:00:00 while still locked. */
export const countdown = (until, now) => hms(Math.ceil(Math.max(0, until - now) / 1000));

const fmts = new Map();
const fmt = tz => { let f = fmts.get(tz); if (!f) fmts.set(tz, f = new Intl.DateTimeFormat('en-US', {timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short'})); return f; };
const WD = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};
export const deviceZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
export const validZone = tz => { try { fmt(tz); return true; } catch { return false; } };
/** Wall-clock parts of instant `ms` in `tz`. */
export function parts(ms, tz) {
  const o = {}; for (const p of fmt(tz).formatToParts(new Date(ms))) o[p.type] = p.value;
  return {y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: WD[o.weekday]};
}
const offset = (ms, tz) => { const p = parts(ms, tz); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000; };
/** Wall time (y,m,d,h,mi) in tz -> instant. Gap: shifted forward by the gap. Overlap: the earlier instant. */
export function wallToInstant(y, m, d, h, mi, tz) {
  const wall = Date.UTC(y, m - 1, d, h, mi), a = offset(wall - DAY, tz), b = offset(wall + DAY, tz);
  const ok = [a, b].map(o => wall - o).filter((t, i) => offset(t, tz) === [a, b][i]);
  return ok.length ? Math.min(...ok) : wall - a;
}
const keyOf = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d)); return t.toISOString().slice(0, 10); };
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return {y, m, d, n: Math.floor(Date.UTC(y, m - 1, d) / DAY), wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay()}; };
export const zoneOf = r => r?.tz?.mode === 'fixed' && r.tz.zone && validZone(r.tz.zone) ? r.tz.zone : deviceZone();
export const todayKey = (now, tz = deviceZone()) => { const p = parts(now, tz); return keyOf(p.y, p.m, p.d); };
export const addDays = (k, n) => { const {y, m, d} = fromKey(k); return keyOf(y, m, d + n); };
const isKey = k => /^\d{4}-\d{2}-\d{2}$/.test(k || '');

/** Candidate occurrences after `afterMs` (skips flagged, not removed): [{key, due, skipped, next}] up to n items. */
export function upcoming(r, afterMs, n = 6, tz = zoneOf(r)) {
  const rc = r?.recur || {kind: 'daily'}, out = [];
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r?.time || '')) return out;
  const [h, mi] = r.time.split(':').map(Number), skip = new Set(rc.skip || []), start = todayKey(afterMs, tz);
  const s0 = isKey(rc.start) ? fromKey(rc.start).n : fromKey(start).n, every = Math.max(1, rc.every | 0);
  const ok = k => {
    const x = fromKey(k);
    switch (rc.kind) {
      case 'once': return rc.date ? k === rc.date : true;
      case 'daily': return true;
      case 'weekly': return (rc.days || []).includes(x.wd);
      case 'dates': return (rc.dates || []).includes(k);
      case 'interval': return x.n >= s0 && (x.n - s0) % every === 0;
      default: return false;
    }
  };
  let pendingNext = !!rc.skipNext;
  for (let i = 0; i < 3700 && out.length < n; i++) {
    const k = addDays(start, i); if (!ok(k)) continue;
    const {y, m, d} = fromKey(k), due = wallToInstant(y, m, d, h, mi, tz);
    if (due <= afterMs) continue;
    const skipped = skip.has(k), next = !skipped && pendingNext;
    if (next) pendingNext = false;
    out.push({key: k, due, skipped: skipped || next, next});
    if (rc.kind === 'once' && !skipped && !next) break;
  }
  return out;
}
/** Next real due after afterMs -> {due|null, skipNext} (skipNext is the new value once consumed). */
export function nextDue(r, afterMs, tz = zoneOf(r)) {
  const hit = upcoming(r, afterMs, 400, tz).find(o => !o.skipped);
  return {due: hit ? hit.due : null, skipNext: !!r?.recur?.skipNext && !hit ? true : false};
}

/** Seven weekday columns starting today: [{wd, keys:[k, k+7, k+14…]}]. The header of each column is its first real date. */
export function weekColumns(fromKeyStr, weeks = 3) {
  return Array.from({length: 7}, (_, i) => { const k = addDays(fromKeyStr, i); return {wd: fromKey(k).wd, keys: Array.from({length: weeks}, (_, w) => addDays(k, w * 7))}; });
}
/** 6x7 month grid starting on the week's first day (Sunday): [{key, d, inMonth}]. */
export function monthCells(y, m) {
  const first = fromKey(keyOf(y, m, 1)), start = addDays(first.y + '-' + p2(first.m) + '-01', -first.wd);
  return Array.from({length: 42}, (_, i) => { const k = addDays(start, i), x = fromKey(k); return {key: k, d: x.d, inMonth: x.m === m}; });
}
/** Numeric local date/time strings (digits + separators only). */
export const fmtDate = (ms, tz) => new Intl.DateTimeFormat(undefined, {timeZone: tz, month: 'numeric', day: 'numeric'}).format(new Date(ms));
export const fmtTime = (ms, tz) => new Intl.DateTimeFormat('en-GB', {timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(ms));
export const fmtKey = k => { const {y, m, d} = fromKey(k); return fmtDate(Date.UTC(y, m - 1, d, 12), 'UTC'); };
export const dayOf = k => fromKey(k).d;
export const weekdayName = (k, locale) => new Intl.DateTimeFormat(locale, {weekday: 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(...(([y, m, d]) => [y, m - 1, d, 12])(k.split('-').map(Number)))));
/** "+HH:MM" / "−HH:MM" UTC offset of a zone right now (digits + sign only). */
export const offsetLabel = (tz, now = Date.now()) => { const o = Math.round(offset(now, tz) / 60000), a = Math.abs(o); return `${o < 0 ? '−' : '+'}${p2(Math.floor(a / 60))}:${p2(a % 60)}`; };

/** Bounded tab stepping for the console keys: nearest enabled tab in `delta`'s direction, or null at the end (no wrap). */
export function stepTab(order, cur, delta, disabled = () => false) {
  const d = delta < 0 ? -1 : 1;
  for (let i = order.indexOf(cur) + d; i >= 0 && i < order.length; i += d) if (!disabled(order[i])) return order[i];
  return null;
}
