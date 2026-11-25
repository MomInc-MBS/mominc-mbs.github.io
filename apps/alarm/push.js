// ADHD web push client: capability card + install/subscribe/sync against backend/adhd-push. NOT connected until ADHD_PUSH_ORIGIN is set.
export const ADHD_PUSH_ORIGIN = 'https://adhd-push.mominc-coach.workers.dev';        // e.g. 'https://adhd-push.<account>.workers.dev' after Ian deploys backend/adhd-push. Empty = reminders server not connected.

const NOTES = [
  'ADHD on the web is a reminder, not an offline wake-up alarm: it needs a connection and the phone\'s own notification settings (Focus, Silent) still apply.',
  'For an alarm that rings with the phone locked, use the Android app (/download/alarm/).',
  'A custom horn on a locked iPhone needs a native iPhone app that is not shipped yet.',
];

/** Pure: what the status card says. env = {origin, hasSW, hasPush, permission, standalone, ios, subscribed, error}. */
export function capability(env) {
  const out = (status, reason, action) => ({status, reason, ...(action ? {action} : {}), notes: NOTES});
  if (!env.origin) return out('Unavailable', 'The reminders server not connected yet, so no reminder can reach a closed app. The alarm still rings while ADHD is open.');
  if (!env.hasSW || !env.hasPush) return out('Unavailable', env.ios && !env.standalone
    ? 'On iPhone, web reminders need ADHD on your Home Screen (iOS 16.4 or later): tap Share, then Add to Home Screen, and open it from there.'
    : 'This browser cannot receive web push reminders.');
  if (env.permission === 'denied') return out('Permission needed', 'Notifications are blocked for ADHD. Turn them on in your phone\'s settings, then reopen the app.');
  if (env.permission !== 'granted') return out('Permission needed', 'Allow notifications so reminders can reach you when ADHD is closed.', 'request');
  if (env.error) return out('Unavailable', env.error);
  if (!env.subscribed) return out('Unavailable', 'Notifications are allowed, but this phone is not registered with the reminders server yet.', 'retry');
  return out('Reminders enabled', 'Reminders can arrive when ADHD is closed. This is not an offline wake-up alarm: it needs a connection, and Focus and notification settings still apply.');
}

export function detect(subscribed = false, error = '') {
  const n = globalThis.navigator || {}, w = globalThis;
  return {origin: ADHD_PUSH_ORIGIN, hasSW: 'serviceWorker' in n, hasPush: 'PushManager' in w && 'Notification' in w,
    permission: 'Notification' in w ? Notification.permission : 'denied', standalone: !!(n.standalone || w.matchMedia?.('(display-mode: standalone)').matches),
    ios: /iPad|iPhone|iPod/.test(n.userAgent || '') || (n.platform === 'MacIntel' && n.maxTouchPoints > 1), subscribed, error};
}

const CRED = 'adhd-push-install-v1';
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
const get = () => { try { return JSON.parse(localStorage.getItem(CRED)); } catch { return null; } };

async function call(method, path, body, cred) {
  const headers = {'content-type': 'application/json'};
  if (cred) { headers['x-install-id'] = cred.installId; headers['x-install-secret'] = cred.secret; }
  const r = await fetch(ADHD_PUSH_ORIGIN + path, {method, headers, body: body ? JSON.stringify(body) : undefined});
  return {status: r.status, body: await r.json().catch(() => null)};
}
async function install() {
  let c = get();
  if (c) return c;
  const r = await call('POST', '/v1/install');
  if (r.status !== 201) throw Error('The reminders server did not accept this phone (' + r.status + ').');
  c = r.body; try { localStorage.setItem(CRED, JSON.stringify(c)); } catch {}
  return c;
}

/** Call from a tap handler. Asks for permission (iOS needs the gesture) and registers this phone. Returns {subscribed, error}. */
export async function enable() {
  if (!ADHD_PUSH_ORIGIN) return {subscribed: false, error: ''};
  try {
    if (Notification.permission === 'default') await Notification.requestPermission();      // first await in the handler: still inside the user gesture
    if (Notification.permission !== 'granted') return {subscribed: false, error: ''};
    return {subscribed: await register(), error: ''};
  } catch (e) { return {subscribed: false, error: String(e.message || e)}; }
}
/** Re-register an existing permission on every open (subscriptions rotate). No permission prompt here. */
export async function register() {
  if (!ADHD_PUSH_ORIGIN || Notification.permission !== 'granted') return false;
  const cred = await install(), reg = await navigator.serviceWorker.ready;
  const key = (await call('GET', '/v1/vapid')).body?.publicKey;
  if (!key) throw Error('The reminders server has no push key yet.');
  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: b64u(key)});
  const j = sub.toJSON();
  return (await call('PUT', '/v1/subscription', {endpoint: j.endpoint, keys: j.keys}, cred)).status === 200;
}
export async function unregister() {
  const c = get(); if (!ADHD_PUSH_ORIGIN || !c) return;
  try { await (await (await navigator.serviceWorker.ready).pushManager.getSubscription())?.unsubscribe(); await call('DELETE', '/v1/subscription', null, c); } catch {}
}

/** Send queued schedule/occurrence changes. Returns the items still waiting (offline or server trouble keep them queued). */
export async function sync(state) {
  const c = get(); if (!ADHD_PUSH_ORIGIN || !c) return state.outbox;
  const left = [];
  for (const o of state.outbox) {
    try {
      const sc = state.schedule;
      const r = o.k === 'schedule'
        ? (sc ? await call('PUT', '/v1/schedule', {id: sc.id, time: sc.time, tz: sc.tz, recur: sc.recur, label: sc.label, followups: sc.followups, tandem: sc.tandem, revision: sc.revision, enabled: sc.enabled}, c) : {status: 200})
        : await call('POST', '/v1/occurrence/' + encodeURIComponent(o.id) + '/' + o.act, null, c);
      if (r.status === 429 || r.status >= 500) left.push(o);          // a 4xx (e.g. the server never knew this occurrence) is final
    } catch { left.push(o); }
  }
  return left;
}
/** What the server says about an occurrence (null when unreachable / unknown). */
export async function remote(occId) {
  const c = get(); if (!ADHD_PUSH_ORIGIN || !c) return null;
  try { const r = await call('GET', '/v1/occurrence/' + encodeURIComponent(occId), null, c); return r.status === 200 ? r.body : null; } catch { return null; }
}
