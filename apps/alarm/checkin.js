// Optional check-ins (QR, NFC tag, motion). Each is an ALTERNATIVE exit that exists only for a reminder that selected it; the 2048 win/loss and the held
// emergency stop always remain. Foreground only, real feature detection, no fake success: a scan that cannot run reports why and does nothing else.
export const SHAKE_G = 14, SHAKE_GAP_MS = 250, DEFAULT_STEPS = 10;

/** Does `proof` satisfy the reminder's chosen check-in? Pure. */
export function verify(kind, challenge, proof) {
  const c = challenge || {};
  if (kind === 'qr') return typeof c.code === 'string' && c.code !== '' && proof === c.code;
  if (kind === 'nfc') return typeof c.nfc === 'string' && c.nfc !== '' && proof === c.nfc;
  if (kind === 'motion') return Number(proof) >= (c.steps > 0 ? c.steps : DEFAULT_STEPS);
  return false;
}

/** Shake/step counter over DeviceMotion samples ({x,y,z} m/s^2 incl. gravity, t ms): counts a peak when the magnitude crosses the threshold, with a debounce. */
export function stepCounter(threshold = SHAKE_G, gap = SHAKE_GAP_MS) {
  let n = 0, last = -Infinity, above = false;
  return {push(s) {
    const m = Math.hypot(s.x || 0, s.y || 0, s.z || 0);
    if (m >= threshold && !above && s.t - last >= gap) { n++; last = s.t; above = true; } else if (m < threshold * 0.8) above = false;
    return n;
  }, count: () => n};
}

const stop = r => { try { r?.stop?.(); } catch {} };
/** Scan for a QR code until `signal` aborts or the code matches. Resolves {ok, reason}. */
export async function scanQr(env, challenge, signal, onProof = () => {}) {
  const w = env.window || env, n = env.navigator || {};
  if (!w.BarcodeDetector) return {ok: false, reason: 'no-barcode-detector'};
  if (!n.mediaDevices?.getUserMedia) return {ok: false, reason: 'no-camera-api'};
  let stream;
  try { stream = await n.mediaDevices.getUserMedia({video: {facingMode: 'environment'}}); } catch (e) { return {ok: false, reason: /NotAllowed|Permission/i.test(e?.name || '') ? 'camera-denied' : 'camera-error'}; }
  try {
    const video = env.document.createElement('video'); video.muted = true; video.playsInline = true; video.srcObject = stream; await video.play();
    const det = new w.BarcodeDetector({formats: ['qr_code']});
    while (!signal?.aborted) {
      for (const b of await det.detect(video).catch(() => [])) { onProof(b.rawValue); if (verify('qr', challenge, b.rawValue)) return {ok: true, proof: b.rawValue}; }
      await new Promise(r => setTimeout(r, 250));
    }
    return {ok: false, reason: 'aborted'};
  } finally { stream.getTracks().forEach(stop); }
}
/** Read an NFC tag (Web NFC NDEF, Android Chrome) until it matches. */
export async function scanNfc(env, challenge, signal) {
  const w = env.window || env; if (!w.NDEFReader) return {ok: false, reason: 'no-web-nfc'};
  const reader = new w.NDEFReader();
  try { await reader.scan({signal}); } catch (e) { return {ok: false, reason: /NotAllowed/i.test(e?.name || '') ? 'denied' : 'nfc-error'}; }
  return new Promise(res => {
    signal?.addEventListener?.('abort', () => res({ok: false, reason: 'aborted'}));
    reader.onreading = e => {
      const texts = [e.serialNumber, ...[...(e.message?.records || [])].map(r => { try { return new TextDecoder().decode(r.data); } catch { return ''; } })];
      const hit = texts.find(t => verify('nfc', challenge, t)); if (hit !== undefined) res({ok: true, proof: hit});
    };
    reader.onreadingerror = () => {};
  });
}
/** Shake the phone `steps` times. iOS needs DeviceMotionEvent.requestPermission() from a gesture (call requestMotion first). */
export async function requestMotion(env) {
  const D = (env.window || env).DeviceMotionEvent; if (!D) return 'unsupported';
  if (typeof D.requestPermission !== 'function') return 'granted';
  try { return await D.requestPermission() === 'granted' ? 'granted' : 'denied'; } catch { return 'denied'; }
}
export function countMotion(env, challenge, signal, onCount = () => {}) {
  const w = env.window || env; if (!w.DeviceMotionEvent) return Promise.resolve({ok: false, reason: 'no-device-motion'});
  const sc = stepCounter();
  return new Promise(res => {
    const h = e => { const a = e.accelerationIncludingGravity; if (!a) return; const c = sc.push({x: a.x, y: a.y, z: a.z, t: e.timeStamp ?? Date.now()}); onCount(c); if (verify('motion', challenge, c)) done({ok: true, proof: c}); };
    const done = r => { w.removeEventListener('devicemotion', h); res(r); };
    signal?.addEventListener?.('abort', () => done({ok: false, reason: 'aborted'}));
    w.addEventListener('devicemotion', h);
  });
}
