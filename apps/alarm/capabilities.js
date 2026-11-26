// Honest capability states for the web edition (contract: {state, reason} per capId). Pure: `describe(env, facts)` looks at feature APIs on `env`
// (default globalThis) and at what the app has actually observed (`facts`). An API merely existing is never shown as ready: anything that needs a
// gesture, a grant or a hardware probe stays `permission` until that really happened, and anything that only works with the page visible is `foreground`.
export const CAP_IDS = ['notify', 'push', 'exactAlarm', 'fullScreen', 'lockScreen', 'dnd', 'overlay', 'torch', 'vibrate', 'sound', 'speak', 'wakeLock', 'badge', 'qr', 'nfc', 'motion',
  'widget', 'tile', 'watch', 'bluetooth', 'webhook', 'update', 'storage'];
const ANDROID_ONLY = ['exactAlarm', 'fullScreen', 'lockScreen', 'dnd', 'overlay', 'widget', 'tile', 'watch', 'bluetooth'];   // native APK features: nothing on the web can provide them
const c = (state, reason) => ({state, reason});

export function facts0() {
  return {audio: 'locked', torch: null, camera: 'unknown', nfc: 'unknown', motion: 'unknown', wake: false, badge: null, persisted: null, update: null, push: {origin: '', subscribed: false, error: '', permission: 'default'},
    webhooks: 0, outbox: 0, storageError: false};
}

export function describe(env = globalThis, f = facts0()) {
  const n = env.navigator || {}, w = env.window || env, out = {};
  const standalone = !!(n.standalone || w.matchMedia?.('(display-mode: standalone)').matches);
  const ios = /iPad|iPhone|iPod/.test(n.userAgent || '') || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  for (const id of ANDROID_ONLY) out[id] = c('unsupported', 'android-app-only');

  const perm = f.push.permission ?? (w.Notification ? w.Notification.permission : 'denied');
  out.notify = !w.Notification ? c('unsupported', 'no-notification-api') : perm === 'granted' ? c('active', 'granted') : perm === 'denied' ? c('permission', 'denied') : c('permission', 'prompt');
  if (!f.push.origin) out.push = c('disconnected', 'no-server');
  else if (!('serviceWorker' in n) || !w.PushManager) out.push = c('unsupported', ios && !standalone ? 'ios-needs-home-screen' : 'no-push-api');
  else if (perm !== 'granted') out.push = c('permission', perm === 'denied' ? 'denied' : 'prompt');
  else if (f.push.error) out.push = c('error', f.push.error);
  else out.push = f.push.subscribed ? c('active', 'subscribed') : c('disconnected', 'not-registered');

  out.vibrate = 'vibrate' in n ? c('foreground', 'visible-page-only') : c('unsupported', ios ? 'ios-no-vibration' : 'no-vibration-api');
  out.sound = !(w.AudioContext || w.webkitAudioContext) ? c('unsupported', 'no-web-audio')
    : f.audio === 'running' ? c('foreground', 'visible-page-only') : f.audio === 'error' ? c('error', 'audio-failed') : c('permission', f.audio === 'suspended' ? 'audio-suspended' : 'audio-locked');
  out.speak = w.speechSynthesis && w.SpeechSynthesisUtterance ? c('foreground', 'visible-page-only') : c('unsupported', 'no-speech-api');
  out.wakeLock = !('wakeLock' in n) ? c('unsupported', 'no-wake-lock-api') : f.wake ? c('active', 'held') : c('foreground', 'visible-page-only');
  out.badge = !('setAppBadge' in n) ? c('unsupported', 'no-badge-api') : f.badge === true ? c('active', 'set') : f.badge === false ? c('error', 'badge-failed') : standalone ? c('available', 'installed') : c('permission', 'needs-install');

  const cam = !!n.mediaDevices?.getUserMedia;
  out.torch = !cam ? c('unsupported', 'no-camera-api') : f.camera === 'denied' ? c('permission', 'camera-denied')
    : f.torch === true ? c('foreground', 'torch-capable') : f.torch === false ? c('unsupported', 'no-torch-capability') : c('permission', 'not-probed');
  out.qr = !cam ? c('unsupported', 'no-camera-api') : !w.BarcodeDetector ? c('unsupported', 'no-barcode-detector') : f.camera === 'denied' ? c('permission', 'camera-denied') : f.camera === 'granted' ? c('foreground', 'camera-granted') : c('permission', 'not-requested');
  out.nfc = !w.NDEFReader ? c('unsupported', 'no-web-nfc') : f.nfc === 'denied' ? c('permission', 'denied') : f.nfc === 'granted' ? c('foreground', 'granted') : c('permission', 'not-requested');
  out.motion = !w.DeviceMotionEvent ? c('unsupported', 'no-device-motion') : f.motion === 'denied' ? c('permission', 'denied')
    : f.motion === 'granted' || typeof w.DeviceMotionEvent.requestPermission !== 'function' ? c('foreground', 'visible-page-only') : c('permission', 'prompt');

  out.webhook = !f.push.origin ? c('disconnected', 'no-server') : f.outbox ? c('disconnected', 'pending-sync') : f.webhooks ? c('active', 'server-side') : c('permission', 'none-configured');
  out.update = !('serviceWorker' in n) ? c('unsupported', 'no-service-worker') : f.update?.state === 'error' ? c('error', 'check-failed') : f.update?.state === 'available' || f.update?.state === 'ready' || f.update?.state === 'downloading' ? c('available', 'update-' + f.update.state)
    : f.update?.state === 'none' ? c('active', 'current') : c('foreground', 'not-checked');
  out.storage = f.storageError ? c('error', 'quota-or-blocked') : f.persisted === true ? c('active', 'persisted') : f.persisted === false ? c('permission', 'not-persisted') : c('foreground', 'unknown');
  return out;
}
