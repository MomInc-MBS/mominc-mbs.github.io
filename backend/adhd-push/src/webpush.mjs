// Web Push for Workers: RFC 8291 (aes128gcm) + RFC 8292 (VAPID) with WebCrypto only. No npm dependency.
// Why not the `web-push` library: it needs node:crypto/http/https streams; under Workers nodejs_compat that path
// is unproven here (wrangler is not installed on the build PC), and a 120-line WebCrypto file is testable
// against the RFC 8291 appendix vector right now.
const enc = new TextEncoder();
const subtle = globalThis.crypto.subtle;

export const b64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };

// Push services we will talk to. Anything else is refused so the sender cannot be pointed at an arbitrary URL.
const HOSTS = [/^web\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/,
  /^[a-z0-9-]+\.push\.services\.mozilla\.com$/, /^[a-z0-9-]+\.notify\.windows\.com$/];
export function validEndpoint(endpoint) {
  let u; try { u = new URL(endpoint); } catch { return false; }
  return u.protocol === 'https:' && !u.port && !u.username && !u.password && endpoint.length <= 600 && HOSTS.some(r => r.test(u.hostname));
}

const hkdf = async (salt, ikm, info, bytes) => subtle.deriveBits({name: 'HKDF', hash: 'SHA-256', salt, info},
  await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), bytes * 8).then(b => new Uint8Array(b));

/** Encrypt `payload` (Uint8Array) for a subscription (p256dh/auth are base64url). `fixed` = {salt, asKeyPair} for tests only. */
export async function encrypt(payload, p256dh, auth, fixed = {}) {
  const ua = unb64u(p256dh), authSecret = unb64u(auth);
  if (ua.length !== 65 || ua[0] !== 4 || authSecret.length !== 16) throw Error('bad subscription keys');
  const as = fixed.asKeyPair || await subtle.generateKey({name: 'ECDH', namedCurve: 'P-256'}, true, ['deriveBits']);
  const asPub = new Uint8Array(await subtle.exportKey('raw', as.publicKey));
  const uaKey = await subtle.importKey('raw', ua, {name: 'ECDH', namedCurve: 'P-256'}, false, []);
  const shared = new Uint8Array(await subtle.deriveBits({name: 'ECDH', public: uaKey}, as.privateKey, 256));
  const ikm = await hkdf(authSecret, shared, cat(enc.encode('WebPush: info\0'), ua, asPub), 32);
  const salt = fixed.salt || globalThis.crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  if (payload.length > 3993) throw Error('payload too large');   // one 4096-byte record: 86 header + 16 tag + 1 delimiter
  const data = cat(payload, Uint8Array.of(2));                      // 0x02 = last-record delimiter
  const ct = new Uint8Array(await subtle.encrypt({name: 'AES-GCM', iv: nonce}, await subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']), data));
  return cat(salt, Uint8Array.of(0, 0, 16, 0, 65), asPub, ct);      // salt | rs=4096 | idlen=65 | key id | ciphertext
}

/** VAPID Authorization header. vapid = {public: b64u 65-byte point, private: b64u 32-byte scalar, subject: 'mailto:..'}. */
export async function vapidHeader(endpoint, vapid, now = Date.now()) {
  const pub = unb64u(vapid.public);
  const key = await subtle.importKey('jwk', {kty: 'EC', crv: 'P-256', d: vapid.private, x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33)), ext: true},
    {name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign']);
  const part = o => b64u(enc.encode(JSON.stringify(o)));
  const body = part({typ: 'JWT', alg: 'ES256'}) + '.' + part({aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: vapid.subject});
  const sig = await subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, key, enc.encode(body));   // WebCrypto already returns raw r||s
  return `vapid t=${body}.${b64u(sig)}, k=${vapid.public}`;
}

/** Send one push. Returns {status, retryAfter}. Never throws on HTTP errors; network failure -> status 0. */
export async function sendPush(sub, payload, vapid, {ttl = 120, urgency = 'high', topic, fetchImpl = fetch, now} = {}) {
  if (!validEndpoint(sub.endpoint)) return {status: 400, retryAfter: 0};
  const body = await encrypt(enc.encode(JSON.stringify(payload)), sub.p256dh, sub.auth);
  const headers = {Authorization: await vapidHeader(sub.endpoint, vapid, now), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
    TTL: String(ttl), Urgency: urgency};
  if (topic) headers.Topic = topic;
  try {
    const r = await fetchImpl(sub.endpoint, {method: 'POST', headers, body, redirect: 'error'});
    return {status: r.status, retryAfter: Number(r.headers.get('retry-after')) || 0};
  } catch { return {status: 0, retryAfter: 0}; }
}
