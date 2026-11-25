// Hardware layer (contract §2): camera, mic, motion, recorder, capability flags. No UI here.
const ua = navigator.userAgent || '';
export const isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/.test(ua);
const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Android/.test(ua);

// iOS Safari + MediaRecorder: H.264/AAC mp4. Everything else: webm first (Chrome mp4 exists but webm is the well-trodden path).
const MIMES_MP4 = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4'];
const MIMES_WEBM = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
export function pickMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  const order = isIOS || isSafari ? [...MIMES_MP4, ...MIMES_WEBM] : [...MIMES_WEBM, ...MIMES_MP4];
  return order.find(m => MediaRecorder.isTypeSupported(m)) || '';
}

function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }
export const capabilities = {
  camera: !!navigator.mediaDevices?.getUserMedia,
  mic: !!navigator.mediaDevices?.getUserMedia,
  motion: 'DeviceOrientationEvent' in window,
  recorder: typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream && !!pickMime(),
  webgl2: webgl2(),
  storagePersist: !!navigator.storage?.persist,
  share: !!navigator.share,
};

/** Classify a getUserMedia failure. */
export function cameraErrorKind(e) {
  const n = e?.name || '';
  if (!window.isSecureContext) return 'insecure';
  if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') return 'denied';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'notfound';
  if (n === 'NotReadableError' || n === 'AbortError' || n === 'TrackStartError') return 'busy';
  return 'other';
}
/** Per-OS recovery text for the retry banner. */
export function cameraHelp(kind) {
  const os = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  const how = {
    ios: 'iPhone: Settings > Safari > Camera > Allow (or Settings > Little Boyfriend if installed), then tap Retry. In Safari, tap aA in the address bar > Website Settings > Camera.',
    android: 'Android: tap the lock icon in the address bar > Permissions > Camera > Allow (or Settings > Apps > Little Boyfriend > Permissions), then tap Retry.',
    desktop: 'Click the camera icon in the address bar, allow the camera, then tap Retry.',
  }[os];
  if (kind === 'denied') return 'Camera is blocked. ' + how;
  if (kind === 'busy') return 'The camera is in use by another app or was interrupted. Close the other app, then tap Retry.';
  if (kind === 'notfound') return 'No camera found on this device.';
  if (kind === 'insecure') return 'The camera needs a secure (https) page.';
  return 'The camera could not start. Tap Retry.';
}

/** Camera. facing 'environment' (rear, default) | 'user'. Returns {video, stream, stop(), facing, caps, onended}. Throws the getUserMedia error. */
export async function openCamera({ facing = 'environment', host = document.body } = {}) {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) throw Object.assign(new Error('no mediaDevices'), { name: 'NotFoundError' });
  const stream = await md.getUserMedia({
    video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    audio: false,
  });
  const track = stream.getVideoTracks()[0];
  const s = track.getSettings?.() || {};
  let cams = 1;
  try { cams = (await md.enumerateDevices()).filter(d => d.kind === 'videoinput').length || 1; } catch {}
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.autoplay = true;
  video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
  // iOS only decodes a <video> that is in the DOM and not display:none
  video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none';
  host.appendChild(video);
  video.srcObject = stream;
  const cam = {
    video, stream, facing: s.facingMode || facing, onended: null,
    caps: { flip: cams > 1, width: s.width || 0, height: s.height || 0, frameRate: s.frameRate || 0, cams },
    stop() { track.removeEventListener('ended', ended); stream.getTracks().forEach(t => t.stop()); video.srcObject = null; video.remove(); },
  };
  const ended = () => cam.onended?.();
  track.addEventListener('ended', ended);
  try { await video.play(); } catch { /* autoplay blocked: renderer will retry on first tap */ }
  return cam;
}

/** Raw mic (no AGC/NS/echo: the native app records the raw mic). null if denied/missing. */
export async function openMic() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 }, video: false,
    });
  } catch { return null; }
}

/** Device pose. start() must be called from a user tap on iOS (requestPermission). Angles are radians relative to the first
 *  sample after start()/recenter(): yaw = alpha (about vertical), pitch = beta, roll = gamma. */
export function motion() {
  let on = false, base = null, cb = null;
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const D = Math.PI / 180;
  const h = e => {
    if (e.alpha == null && e.beta == null && e.gamma == null) return; // desktop fires one empty event
    const cur = { yaw: (e.alpha || 0) * D, pitch: (e.beta || 0) * D, roll: (e.gamma || 0) * D };
    if (!base) base = cur;
    cb?.({ yaw: wrap(cur.yaw - base.yaw), pitch: wrap(cur.pitch - base.pitch), roll: wrap(cur.roll - base.roll) });
  };
  return {
    async start() {
      if (on) return true;
      if (!('DeviceOrientationEvent' in window)) return false;
      const req = DeviceOrientationEvent.requestPermission;
      if (typeof req === 'function') {
        try { if (await req.call(DeviceOrientationEvent) !== 'granted') return false; } catch { return false; }
      }
      base = null; window.addEventListener('deviceorientation', h); on = true; return true;
    },
    stop() { window.removeEventListener('deviceorientation', h); on = false; },
    recenter() { base = null; },
    onPose(fn) { cb = fn; },
    get active() { return on; },
    get needsGesture() { return typeof window.DeviceOrientationEvent?.requestPermission === 'function'; },
  };
}

/** Records canvas (+ optional audio stream). stop() -> {blob, mime, durMs}. */
export function recorder(canvas, audioStream = null, fps = 30) {
  const mime = pickMime();
  let rec = null, chunks = [], t0 = 0, vs = null;
  return {
    mime,
    start() {
      if (!mime) throw new Error('MediaRecorder not supported');
      vs = canvas.captureStream(fps);
      const tracks = [...vs.getVideoTracks(), ...(audioStream ? audioStream.getAudioTracks() : [])];
      const ms = new MediaStream(tracks);
      rec = new MediaRecorder(ms, { mimeType: mime, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 });
      chunks = [];
      rec.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
      rec.start(1000);
      t0 = performance.now();
    },
    stop() {
      return new Promise((resolve, reject) => {
        if (!rec || rec.state === 'inactive') return reject(new Error('not recording'));
        rec.onstop = () => {
          vs?.getTracks().forEach(t => t.stop());
          resolve({ blob: new Blob(chunks, { type: mime.split(';')[0] }), mime, durMs: Math.round(performance.now() - t0) });
        };
        rec.onerror = e => reject(e.error || new Error('recorder error'));
        rec.stop();
      });
    },
    get recording() { return !!rec && rec.state === 'recording'; },
  };
}
