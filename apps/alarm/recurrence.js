// Recurrence: next due instant for a contract reminder record. Pure (no clock, no storage); shared by the web app AND the push Worker.
// Wall-clock rules: a local time that does not exist (spring forward) is shifted forward by the gap (02:30 -> 03:30); an ambiguous one
// (fall back) fires once, at the earlier instant. Zones come from Intl only, never from the machine's TZ.
const fmts = new Map();
const fmt = tz => { let f = fmts.get(tz); if (!f) fmts.set(tz, f = new Intl.DateTimeFormat('en-US', {timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'})); return f; };
const parts = (ms, tz) => Object.fromEntries(fmt(tz).formatToParts(new Date(ms)).map(p => [p.type, +p.value]));
/** Offset (ms) of `tz` from UTC at instant `ms`. */
export const tzOffset = (ms, tz) => { const p = parts(ms, tz); return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000; };
export const validZone = tz => { try { fmt(tz); return typeof tz === 'string' && tz.length < 64; } catch { return false; } };
export const deviceZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
const DAY = 86400_000;

/** Wall time (as if UTC ms) in `tz` -> instant. Gap: shifted forward by the gap length. Overlap: the earlier instant. */
export function wallToInstant(wall, tz) {
  const a = tzOffset(wall - DAY, tz), b = tzOffset(wall + DAY, tz);
  const ok = [a, b].map(o => wall - o).filter((t, i) => tzOffset(t, tz) === [a, b][i]);
  return ok.length ? Math.min(...ok) : wall - a;        // none valid = inside a gap: the pre-gap offset lands after it
}
const ymd = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d)); return {y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay(), key: t.toISOString().slice(0, 10), day: Math.floor(t.getTime() / DAY)}; };
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && ymd(...s.split('-').map(Number)).key === s;
export const isTime = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '');

/** Zone a reminder is evaluated in. `device` follows the phone (opts.deviceZone, else the last zone it reported, else this machine). */
export const zoneOf = (r, opts = {}) => r.tz?.mode === 'fixed' && validZone(r.tz.zone) ? r.tz.zone : (opts.deviceZone || (validZone(r.tz?.zone) ? r.tz.zone : deviceZone()));

/** Next due after `afterMs`. Returns {due: ms|null, skipNext: bool}: skipNext is the NEW value (true -> consumed -> false). Never mutates r. */
export function nextDue(r, afterMs, opts = {}) {
  const rc = r.recur || {kind: 'daily'}, zone = zoneOf(r, opts);
  if (!isTime(r.time)) return {due: null, skipNext: !!rc.skipNext};
  const [h, mi] = r.time.split(':').map(Number), skip = new Set((rc.skip || []).filter(isDate));
  let skipNext = !!rc.skipNext;
  const p = parts(afterMs, zone), start = ymd(p.year, p.month, p.day);
  const allowed = dt => {
    switch (rc.kind) {
      case 'once': return rc.date ? dt.key === rc.date : true;
      case 'daily': return true;
      case 'weekly': return (rc.days || []).includes(dt.wd);
      case 'dates': return (rc.dates || []).includes(dt.key);
      case 'interval': { const n = Math.max(1, rc.every | 0), s = isDate(rc.start) ? Math.floor(Date.parse(rc.start) / DAY) : start.day; return dt.day >= s && (dt.day - s) % n === 0; }
      default: return false;
    }
  };
  const horizon = rc.kind === 'interval' ? Math.max(800, (rc.every | 0) * 3 + 10) : rc.kind === 'dates' || rc.kind === 'once' ? 800 : 400 + skip.size * 7;
  for (let i = 0; i < horizon; i++) {
    const dt = ymd(start.y, start.m, start.d + i);
    if (!allowed(dt) || skip.has(dt.key)) continue;
    const t = wallToInstant(Date.UTC(dt.y, dt.m - 1, dt.d, h, mi), zone);
    if (t <= afterMs) continue;
    if (skipNext) { skipNext = false; if (rc.kind === 'once') return {due: null, skipNext}; continue; }
    return {due: t, skipNext};
  }
  return {due: null, skipNext};
}
/** Convenience: the reminder with its skipNext consumed + the due time. */
export function advance(r, afterMs, opts = {}) {
  const x = nextDue(r, afterMs, opts);
  return {due: x.due, reminder: r.recur?.skipNext && !x.skipNext ? {...r, recur: {...r.recur, skipNext: false}} : r};
}
/** Legacy single-schedule shape {recur:'once'|'daily'|'weekdays'} -> contract recur object. */
export const recurFromLegacy = v => v === 'weekdays' ? {kind: 'weekly', days: [1, 2, 3, 4, 5]} : {kind: v === 'once' ? 'once' : 'daily'};
export const defaultRecur = () => ({kind: 'daily', days: [], date: null, dates: [], every: 1, start: null, skip: [], skipNext: false});

/** Validate a recur object; returns an error field name or null. */
export function recurError(rc) {
  if (!rc || typeof rc !== 'object') return 'recur';
  switch (rc.kind) {
    case 'once': return rc.date != null && !isDate(rc.date) ? 'recur.date' : null;
    case 'daily': return null;
    case 'weekly': return Array.isArray(rc.days) && rc.days.length && rc.days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) ? null : 'recur.days';
    case 'dates': return Array.isArray(rc.dates) && rc.dates.length && rc.dates.every(isDate) ? null : 'recur.dates';
    case 'interval': return Number.isInteger(rc.every) && rc.every >= 1 && rc.every <= 365 && (rc.start == null || isDate(rc.start)) ? null : 'recur.every';
    default: return 'recur.kind';
  }
}
