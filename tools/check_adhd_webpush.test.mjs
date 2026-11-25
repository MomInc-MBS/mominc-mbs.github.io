// ADHD push sender: RFC 8291 appendix vector, round trip, VAPID signature, endpoint allow-list.
import test from 'node:test';
import assert from 'node:assert/strict';
import {encrypt, vapidHeader, validEndpoint, sendPush, b64u, unb64u} from '../backend/adhd-push/src/webpush.mjs';

const subtle = globalThis.crypto.subtle;
const RFC = {
  plaintext: 'When I grow up, I want to be a watermelon',
  asPriv: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', asPub: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  uaPriv: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94', uaPub: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg', salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  body: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};
const jwk = (d, pub) => ({kty: 'EC', crv: 'P-256', d, x: b64u(unb64u(pub).slice(1, 33)), y: b64u(unb64u(pub).slice(33)), ext: true});
const keyPair = async (d, pub) => ({
  privateKey: await subtle.importKey('jwk', jwk(d, pub), {name: 'ECDH', namedCurve: 'P-256'}, false, ['deriveBits']),
  publicKey: await subtle.importKey('raw', unb64u(pub), {name: 'ECDH', namedCurve: 'P-256'}, true, []),
});
// Independent user-agent side decrypt (RFC 8291 section 3.4), used for round trips.
async function decrypt(body, uaPriv, uaPub, auth) {
  const salt = body.slice(0, 16), idlen = body[20], asPub = body.slice(21, 21 + idlen), ct = body.slice(21 + idlen);
  const kp = await keyPair(uaPriv, uaPub);
  const shared = new Uint8Array(await subtle.deriveBits({name: 'ECDH', public: await subtle.importKey('raw', asPub, {name: 'ECDH', namedCurve: 'P-256'}, false, [])}, kp.privateKey, 256));
  const hk = async (s, ikm, info, n) => new Uint8Array(await subtle.deriveBits({name: 'HKDF', hash: 'SHA-256', salt: s, info}, await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), n * 8));
  const e = new TextEncoder(), cat = (...a) => Uint8Array.from(a.flatMap(x => [...x]));
  const ikm = await hk(unb64u(auth), shared, cat(e.encode('WebPush: info\0'), unb64u(uaPub), asPub), 32);
  const cek = await hk(salt, ikm, e.encode('Content-Encoding: aes128gcm\0'), 16), nonce = await hk(salt, ikm, e.encode('Content-Encoding: nonce\0'), 12);
  const pt = new Uint8Array(await subtle.decrypt({name: 'AES-GCM', iv: nonce}, await subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']), ct));
  assert.equal(pt.at(-1), 2); return new TextDecoder().decode(pt.slice(0, -1));
}

test('RFC 8291 appendix vector: our encrypt reproduces the published body', async () => {
  const out = await encrypt(new TextEncoder().encode(RFC.plaintext), RFC.uaPub, RFC.auth, {salt: unb64u(RFC.salt), asKeyPair: await keyPair(RFC.asPriv, RFC.asPub)});
  assert.equal(b64u(out), RFC.body);
});
test('RFC 8291 appendix vector decrypts with the user-agent key', async () => {
  assert.equal(await decrypt(unb64u(RFC.body), RFC.uaPriv, RFC.uaPub, RFC.auth), RFC.plaintext);
});
test('round trip with a fresh key pair and random salt', async () => {
  const ua = await subtle.generateKey({name: 'ECDH', namedCurve: 'P-256'}, true, ['deriveBits']);
  const pub = b64u(await subtle.exportKey('raw', ua.publicKey)), priv = (await subtle.exportKey('jwk', ua.privateKey)).d, auth = b64u(crypto.getRandomValues(new Uint8Array(16)));
  const msg = JSON.stringify({appId: 'adhd', occurrenceId: 'x:1', body: 'Still waiting for your check-off'});
  assert.equal(await decrypt(await encrypt(new TextEncoder().encode(msg), pub, auth), priv, pub, auth), msg);
});
test('VAPID header: ES256 signature verifies, aud is the push origin', async () => {
  const k = await subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']);
  const pub = b64u(await subtle.exportKey('raw', k.publicKey)), vapid = {public: pub, private: (await subtle.exportKey('jwk', k.privateKey)).d, subject: 'mailto:test@example.com'};
  const h = await vapidHeader('https://web.push.apple.com/abc', vapid, 1_000_000_000_000);
  const [, t, kk] = /^vapid t=([^,]+), k=(.+)$/.exec(h); assert.equal(kk, pub);
  const [hd, cl, sg] = t.split('.'), claims = JSON.parse(Buffer.from(cl, 'base64url'));
  assert.equal(claims.aud, 'https://web.push.apple.com'); assert.equal(claims.exp, 1_000_000_000 + 12 * 3600);
  assert.ok(await subtle.verify({name: 'ECDSA', hash: 'SHA-256'}, k.publicKey, unb64u(sg), new TextEncoder().encode(hd + '.' + cl)));
});
test('endpoint allow-list: https push-service hosts only', () => {
  for (const ok of ['https://web.push.apple.com/x', 'https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x', 'https://wns2-par02p.notify.windows.com/w/?token=1'])
    assert.ok(validEndpoint(ok), ok);
  for (const bad of ['http://web.push.apple.com/x', 'https://evil.example/x', 'https://web.push.apple.com.evil.example/x', 'https://127.0.0.1/x', 'https://user:p@fcm.googleapis.com/x', 'https://fcm.googleapis.com:8443/x', 'nonsense', 'https://169.254.169.254/'])
    assert.ok(!validEndpoint(bad), bad);
});
test('sendPush refuses a bad endpoint without calling fetch, and reports status/retry-after', async () => {
  let called = 0; const f = async () => { called++; return new Response('', {status: 429, headers: {'retry-after': '30'}}); };
  assert.deepEqual(await sendPush({endpoint: 'https://evil.example/x', p256dh: RFC.uaPub, auth: RFC.auth}, {}, {}, {fetchImpl: f}), {status: 400, retryAfter: 0});
  assert.equal(called, 0);
  const k = await subtle.generateKey({name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign']);
  const vapid = {public: b64u(await subtle.exportKey('raw', k.publicKey)), private: (await subtle.exportKey('jwk', k.privateKey)).d, subject: 'mailto:t@example.com'};
  assert.deepEqual(await sendPush({endpoint: 'https://fcm.googleapis.com/x', p256dh: RFC.uaPub, auth: RFC.auth}, {a: 1}, vapid, {fetchImpl: f}), {status: 429, retryAfter: 30});
});
