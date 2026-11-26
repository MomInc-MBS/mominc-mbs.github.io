// Optional user-owned webhook output. The Worker must never become an arbitrary URL requester, so: https only, no credentials/port,
// no IP literals, no localhost / private / link-local / internal names, no redirects, 5 s timeout, bounded response body.
export const HOOK_TIMEOUT_MS = 5000, HOOK_MAX_BODY = 2048, HOOK_MAX_URL = 500;

const V4 = /^\d{1,3}(\.\d{1,3}){3}$/;
/** True for anything that is, or may resolve straight to, this machine or a private network. IP literals of every kind are refused outright. */
export function privateHost(host) {
  const h = String(host).toLowerCase().replace(/\.$/, '');
  if (!h || !h.includes('.')) return true;                                            // localhost, intranet single labels
  if (h.startsWith('[') || h.includes(':')) return true;                                // IPv6 literal (incl. ::1, fe80::, fc00::, ::ffff:10.0.0.1)
  if (V4.test(h) || /^[0-9.x]+$/i.test(h) || /^\d+$/.test(h.split('.').pop())) return true;   // dotted, hex/octal/decimal-looking IPv4 or a numeric TLD
  return /(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain|home\.arpa|in-addr\.arpa|ip6\.arpa)$/.test(h);
}
/** Returns the normalised URL string, or null when it must not be called. */
export function validHookUrl(raw) {
  if (typeof raw !== 'string' || raw.length > HOOK_MAX_URL) return null;
  let u; try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port || privateHost(u.hostname)) return null;
  return u.href;
}
export const validToken = t => t == null || (typeof t === 'string' && t.length <= 200 && !/[\r\n]/.test(t));

async function drain(res, max) {                                                       // read at most `max` bytes, then drop the rest
  try {
    const rd = res.body?.getReader?.(); if (!rd) return;
    let n = 0;
    for (;;) { const {done, value} = await rd.read(); if (done) return; n += value.length; if (n > max) { await rd.cancel(); return; } }
  } catch { /* ignore */ }
}
/** POST {occId, stage, dueAt}. Returns {status} (0 = network/timeout/refused). Never throws. */
export async function sendHook(hook, body, {fetchImpl = fetch, timeoutMs = HOOK_TIMEOUT_MS} = {}) {
  const url = validHookUrl(hook?.url);
  if (!url || !validToken(hook?.token)) return {status: 400, refused: true};
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const headers = {'content-type': 'application/json', 'user-agent': 'moms-2048-reminder'};
    if (hook.token) headers.authorization = 'Bearer ' + hook.token;
    const res = await fetchImpl(url, {method: 'POST', headers, body: JSON.stringify({occId: body.occId, stage: body.stage, dueAt: body.dueAt}), redirect: 'manual', signal: ctl.signal});
    await drain(res, HOOK_MAX_BODY);
    return {status: res.status >= 300 && res.status < 400 ? 310 : res.status};          // a redirect is never followed; report it as a failure
  } catch { return {status: 0}; } finally { clearTimeout(timer); }
}
