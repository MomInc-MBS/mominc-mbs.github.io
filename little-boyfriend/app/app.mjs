// Little Boyfriend web shell. Chrome = DOM/CSS port of CoachFrameAdapter/RailButton; engine + gallery come from the contract interfaces.
import * as hw from './hw.mjs';
import { createVoice, VoiceMath } from './voice.mjs';

const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const STUBS = Q.has('stubs');
const TEST = STUBS || Q.has('test');
const app = $('app'), coach = $('coach');

// ------------------------------------------------------------------ prefs (localStorage; every access guarded)
let prefs = {};
try { prefs = JSON.parse(localStorage.getItem('lbf.prefs') || '{}'); } catch {}
const pref = (k, d) => (k in prefs ? prefs[k] : d);
const setPref = (k, v) => { prefs[k] = v; try { localStorage.setItem('lbf.prefs', JSON.stringify(prefs)); } catch {} };

// ------------------------------------------------------------------ FramePalette.kt port (same constants)
const DEFAULT_METAL = [0x4D, 0x3D, 0x4F], DEFAULT_STRIP = [0xB0, 0x26, 0xFF];
function hsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, hp = (((h % 360) + 360) % 360) / 60, x = c * (1 - Math.abs(hp % 2 - 1));
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(hp)] || [c, 0, x];
  const m = l - c / 2, q = v => Math.min(255, Math.max(0, Math.round((v + m) * 255)));
  return [q(r), q(g), q(b)];
}
const METAL = [DEFAULT_METAL, ...Array.from({ length: 8 }, (_, i) => hsl(i * 3 * 15, .65, .40))];
const mix = (c, t, to) => c.map((v, i) => Math.min(255, Math.max(0, Math.round(v * (1 - t) + to[i] * t))));
const css = c => `rgb(${c.join(',')})`;
const STRIP_MODES = ['COACH', 'TINTED', 'OFF'];
const stripColor = (idx, mode) => mode === 'OFF' ? null : mode === 'COACH' || idx === 0 ? DEFAULT_STRIP : hsl((idx - 1) * 3 * 15, .65, .60);

// ------------------------------------------------------------------ Look params, presets, cadence: ONE source = effects.v1.json (extracted from Look.kt / TempoModel.kt)
let FX = null;
try { FX = await (await fetch('effects.v1.json')).json(); } catch (e) { console.error('effects.v1.json', e); }
if (!FX) { showMsg0('Could not load the look definitions (effects.v1.json). Check your connection and reload.'); throw new Error('effects.v1.json missing'); }
function showMsg0(t) { $('msg-text').textContent = t; $('msg-retry').hidden = true; $('msg').hidden = false; }
const PARAMS = FX.look.params;
const BUILT_IN = Object.fromEntries(Object.entries(FX.look.presets).map(([n, o]) => [n, PARAMS.map(p => o[p.key] ?? p.def)]));
const CADENCE = Object.entries(FX.tempo.modes);
const LIVE = 'Extreme 8 Live';
const FRAMES = [['dollhouse', 'Pink dollhouse'], ['birdhouse', 'Birdhouse'], ['mason_jar', 'Mason jar'], ['cardboard_box', 'Cardboard box'], [null, 'None (drawn)']];
const MAT_SIZE = 6; // MaterialColor.PALETTES: index 0 = original + 5 colours per frame

// ------------------------------------------------------------------ state
let customs = pref('custom', {});
let presetName = pref('preset', FX.look.default);
let values = (customs[presetName] || BUILT_IN[presetName] || BUILT_IN[FX.look.default]).slice();
let intensity = pref('intensity', 1), mono = pref('bw', false);
let cadMode = pref('cadMode', 'Natural'), anticipate = pref('anticipate', true);
let frameIdx = ((pref('frameIdx', 0) % METAL.length) + METAL.length) % METAL.length;
let stripMode = STRIP_MODES.includes(pref('stripMode', '')) ? pref('stripMode') : 'COACH';
let sceneFrame = pref('sceneFrame', 'dollhouse');
let facing = pref('facing', 'environment');
let voiceOn = pref('voiceOn', false), voiceSpeech = pref('voiceSpeech', false), voiceVal = pref('voiceVal', 4);
const matIdx = id => (id ? (pref('mat.' + id, 0) % MAT_SIZE) : 0);

let renderer = null, store = null, galleryMod = null, cam = null, mic = null, voice = null, rec = null, recT0 = 0, recTimer = 0, overlayOpen = false;
const mot = hw.motion();
const idx = k => PARAMS.findIndex(p => p.key === k);

function effective() {
  const o = {}; PARAMS.forEach((p, i) => { o[p.key] = values[i]; }); return o;   // RAW preset values: renderer.setLook applies the intensity master itself
}
function pushLook() {
  if (!renderer) return;
  renderer.setLook({ ...effective(), bw: mono, intensity });
  renderer.setAnticipation(anticipate);
  renderer.setTempo(cadMode);
}

// ------------------------------------------------------------------ toast / messages
let toastT = 0;
function toast(s, ms = 2200) { const t = $('toast'); t.textContent = s; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function showMsg(text, retry = true) { $('msg-text').textContent = text; $('msg-retry').hidden = !retry; $('msg').hidden = false; }
const hideMsg = () => { $('msg').hidden = true; };

// ------------------------------------------------------------------ geometry (CoachFrameAdapter.geometry port)
const RAIL = 15, DOCK_MIN = 76, DOCK_MAX = 84, GEAR = 48;
const probe = document.createElement('div'); probe.id = 'probe'; app.appendChild(probe);
function layout() {
  const cs = getComputedStyle(probe);
  const it = parseFloat(cs.paddingTop) || 0, ib = parseFloat(cs.paddingBottom) || 0, il = parseFloat(cs.paddingLeft) || 0, ir = parseFloat(cs.paddingRight) || 0;
  const W = app.clientWidth, H = app.clientHeight, r = RAIL;
  const top = it + r, availW = W - 2 * r - il - ir, availH = H - top - r - DOCK_MIN - ib;
  const ww = Math.max(1, Math.min(availW, availH * 9 / 16)), wh = ww * 16 / 9, left = il + (W - il - ir - ww) / 2;
  const dockTop = top + wh + r, dockBottom = H - ib;
  const dh = Math.max(DOCK_MIN, Math.min(DOCK_MAX, dockBottom - dockTop)), spare = Math.max(0, (dockBottom - dockTop - dh) / 2);
  const s = app.style, px = v => v + 'px';
  s.setProperty('--wx', px(left)); s.setProperty('--wy', px(top)); s.setProperty('--ww', px(ww)); s.setProperty('--wh', px(wh));
  s.setProperty('--dx', px(r)); s.setProperty('--dw', px(W - 2 * r)); s.setProperty('--dh', px(dh)); s.setProperty('--dy', px(dockBottom - dh - spare));
  s.setProperty('--bx', px(left - r / 2)); s.setProperty('--by', px(top - r / 2)); s.setProperty('--bw', px(ww + r)); s.setProperty('--bh', px(wh + r));
  [...$('bolts').children].forEach((b, i) => {
    const [fx, fy] = BOLTS[i]; b.style.left = px(left + fx * (ww + r) - r / 2); b.style.top = px(top + fy * (wh + r) - r / 2);
  });
}
const BOLTS = [[0, 0], [1, 0], [0, 1], [1, 1], [0, .33], [0, .67], [1, .33], [1, .67]];
BOLTS.forEach(() => $('bolts').appendChild(document.createElement('i')));
{
  const g = $('cog');
  for (let i = 0; i < 8; i++) { const e = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); e.setAttribute('x', -2.5); e.setAttribute('y', -3.5); e.setAttribute('width', 5); e.setAttribute('height', 7); e.setAttribute('rx', 1); e.setAttribute('transform', `translate(12 12) rotate(${i * 45}) translate(0 -12.6)`); g.appendChild(e); }
}

// ------------------------------------------------------------------ frame look (metal colour + strip)
function applyFrameLook() {
  const pm = METAL[frameIdx], s = app.style;
  s.setProperty('--pm', css(pm)); s.setProperty('--mh', css(mix(pm, .38, [255, 255, 255]))); s.setProperty('--md', css(mix(pm, .25, [0, 0, 0])));
  s.setProperty('--mx', css(mix(pm, .45, [0, 0, 0]))); s.setProperty('--me', css(mix(pm, .10, [255, 255, 255])));
  const sc = stripColor(frameIdx, stripMode);
  coach.classList.toggle('strip', !!sc); coach.classList.toggle('stripoff', !sc);
  if (sc) {
    [sc, mix(sc, .6, [0, 0, 0]), sc, mix(sc, .55, [255, 255, 255])].forEach((c, i) => s.setProperty('--c' + i, css(c)));
    s.setProperty('--sc', sc.join(',')); s.setProperty('--sip', css(sc));
  } else s.removeProperty('--sip');
  $('b-frame').setAttribute('aria-label', `Frame colour ${frameIdx + 1} of ${METAL.length}, tap for next, long press for scene settings`);
  $('b-strip').querySelector('.lb').textContent = { COACH: 'Strip', TINTED: 'Strip tint', OFF: 'Strip off' }[stripMode];
  $('b-strip').setAttribute('aria-label', 'Light strip: ' + { COACH: 'on', TINTED: 'matches frame colour', OFF: 'off' }[stripMode] + ', tap to change');
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', css(pm));
}
const cycleFrame = () => { frameIdx = (frameIdx + 1) % METAL.length; setPref('frameIdx', frameIdx); applyFrameLook(); };
const cycleStrip = () => { stripMode = STRIP_MODES[(STRIP_MODES.indexOf(stripMode) + 1) % 3]; setPref('stripMode', stripMode); applyFrameLook(); };

// ------------------------------------------------------------------ camera lifecycle + permission recovery
let camBusy = false;
async function startCamera() {
  if (cam || camBusy || !renderer) return;
  camBusy = true;
  try {
    cam = await hw.openCamera({ facing, host: app });
    cam.onended = () => { const c = cam; cam = null; c?.stop(); renderer?.setSource(null); $('testcard').hidden = false; $('testcard').textContent = 'Camera stopped.'; showMsg(hw.cameraHelp('busy')); };
    renderer.setMirror(cam.facing === 'user'); renderer.setSource(cam.video); $('testcard').hidden = true; hideMsg();
    cam.video.play?.().catch(() => {});
    const c = cam; stableVideo(c.video).then(() => { if (cam === c) renderer.reveal(); });
  } catch (e) {
    renderer.setSource(null);
    $('testcard').hidden = false; $('testcard').textContent = 'No camera: test card shown. The rest of the app still works.';
    showMsg(hw.cameraHelp(hw.cameraErrorKind(e)), hw.cameraErrorKind(e) !== 'notfound' && hw.cameraErrorKind(e) !== 'insecure');
  } finally { camBusy = false; refreshPhotoReady(); }
}
/** Resolves when the video has decoded frames and its clock is advancing (camera live and stable); gives up after 4 s. */
function stableVideo(v) {
  return new Promise(res => {
    const t0 = performance.now(); let last = -1, n = 0;
    const poll = () => {
      if (v.readyState >= 2 && v.videoWidth && v.currentTime !== last) { last = v.currentTime; if (++n >= 6) return res(); }
      if (performance.now() - t0 > 4000) return res();
      setTimeout(poll, 60);
    };
    poll();
  });
}
function stopCamera() { if (!cam) return; const c = cam; cam = null; c.onended = null; c.stop(); renderer?.setSource(null); }
async function flipCamera() { facing = facing === 'environment' ? 'user' : 'environment'; setPref('facing', facing); stopCamera(); await startCamera(); }
function refreshPhotoReady() { $('b-photo').classList.toggle('notready', !(cam && cam.video.readyState >= 2) && !!cam); }
$('msg-retry').onclick = () => { stopCamera(); startCamera(); };

async function ensureMic() {
  if (mic && mic.getAudioTracks().some(t => t.readyState === 'live')) return mic;
  mic = await hw.openMic();
  if (mic && voice) voice.attachStream(mic);
  return mic;
}
async function ensureVoice() {
  if (voice) return voice;
  voice = await createVoice();
  voice.setParams({ speech: voiceSpeech, value: voiceVal }); voice.setEnabled(voiceOn);
  if (TEST) window.__lbf.voice = voice;
  return voice;
}

// ------------------------------------------------------------------ photo / record / gallery
const saveItem = async m => {
  const id = await store.save(m);
  if (hw.capabilities.storagePersist && !app.dataset.persisted) { app.dataset.persisted = '1'; navigator.storage.persist().catch(() => {}); }
  return id;
};
async function takePhoto() {
  if (!renderer) return;
  try {
    const blob = await renderer.photo(), c = renderer.outputCanvas;
    await saveItem({ blob, kind: 'photo', w: c.width, h: c.height, durMs: 0 });
    $('flash').classList.remove('go'); void $('flash').offsetWidth; $('flash').classList.add('go');
    toast('Photo saved to gallery');
  } catch (e) { toast('Photo failed: ' + (e.message || e)); }
}
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function setRecUI(on) {
  const b = $('b-rec'); b.classList.toggle('on', on);
  $('rec-sq').hidden = !on; b.setAttribute('aria-label', on ? 'Stop recording' : 'Start recording');
  $('rec-dot').setAttribute('r', on ? 4 : 10); $('rec-dot').setAttribute('cx', on ? 4 : 12); $('rec-dot').setAttribute('cy', on ? 4 : 12);
  b.querySelector('.lb').textContent = on ? 'REC 0:00' : 'Record';
}
async function startRec() {
  if (!hw.capabilities.recorder) return toast('Recording is not supported in this browser');
  const m = await ensureMic();
  if (voice) await voice.resume();
  let audio = voice ? voice.stream : m;
  if (!audio) toast('No microphone: video will be silent');
  try { rec = hw.recorder(renderer.outputCanvas, audio); rec.start(); } catch (e) { rec = null; renderer.setAdaptive(true); return toast('Cannot record: ' + (e.message || e)); }
  renderer.setAdaptive(false); recT0 = performance.now(); setRecUI(true);
  recTimer = setInterval(() => { $('b-rec').querySelector('.lb').textContent = 'REC ' + fmt(Math.floor((performance.now() - recT0) / 1000)); }, 250);
}
async function stopRec() {
  clearInterval(recTimer); const r = rec; rec = null; setRecUI(false); renderer?.setAdaptive(true);
  if (!r) return;
  try {
    const { blob, mime, durMs } = await r.stop(), c = renderer.outputCanvas;
    if (TEST) window.__lbf.lastRec = { mime, durMs, size: blob.size };
    await saveItem({ blob, kind: 'video', w: c.width, h: c.height, durMs });
    toast(`Video saved (${fmt(Math.round(durMs / 1000))})`);
  } catch (e) { toast('Recording failed: ' + (e.message || e)); }
}
const toggleRec = () => (rec ? stopRec() : startRec());

async function openGallery() {
  if (!galleryMod) return toast('Gallery is not available');
  overlayOpen = true; $('overlay').hidden = false;
  (galleryMod.openGalleryChooser || galleryMod.openGallery)($('overlay'), { onClose: () => { overlayOpen = false; $('overlay').hidden = true; $('overlay').innerHTML = ''; } });
}

// ------------------------------------------------------------------ settings sheet
const TABS = ['Look', 'Motion', 'Voice', 'Scene', 'Camera', 'Presets', 'Output', 'Diag'];
let tab = pref('tab', 'Look');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function btn(txt, fn, on) { const b = el('button', 'btn' + (on ? ' on' : ''), txt); b.onclick = fn; return b; }
function row(...kids) { const r = el('div', 'row'); kids.forEach(k => r.append(k)); return r; }
function note(t) { return el('p', 'note', t); }
function slider(label, min, max, val, fn, fmtv = v => (+v).toFixed(2)) {
  const l = el('label', 'sl'), s = el('span', '', fmtv(val)), i = el('input'); i.type = 'range'; i.min = min; i.max = max; i.step = (max - min) / 200; i.value = val;
  i.oninput = () => { s.textContent = fmtv(+i.value); fn(+i.value); };
  l.append(label, s, i); return l;
}
function toggle(label, val, fn) { const l = el('label', 'tg'), i = el('input'); i.type = 'checkbox'; i.checked = val; i.onchange = () => fn(i.checked); l.append(i, label); return l; }
const setSheet = open => { $('sheet').hidden = !open; if (open) showTab(tab); };
function showTab(t) {
  tab = t; setPref('tab', t);
  const keep = $('panel').scrollTop; const p = $('panel'); p.replaceChildren();
  [...$('tabs').children].forEach(b => b.classList.toggle('on', b.textContent === t));
  TAB[t](p, () => showTab(t)); p.scrollTop = keep;
}
const TAB = {
  Look(p) {
    p.append(slider('Intensity (0 = bypass)', 0, 1, intensity, v => { intensity = v; setPref('intensity', v); pushLook(); }));
    PARAMS.forEach((q, i) => {
      if (q.key === 'cadence' || q.key === 'speed') return;
      p.append(slider(q.label, q.min, q.max, values[i], v => { values[i] = v; pushLook(); }));
    });
    p.append(toggle('Black & White (picture + frame; colours stay saved)', mono, v => { mono = v; setPref('bw', v); pushLook(); }));
    p.append(note('Drag on the picture to move the focus band.'));
  },
  Motion(p, redo) {
    p.append(row(...CADENCE.map(([n, f]) => btn((cadMode === n ? '✓ ' : '') + n, () => { cadMode = n; values[idx('cadence')] = f; setPref('cadMode', n); pushLook(); redo(); }))));
    p.append(toggle('Anticipation hold + 1.5x catch-up (Extreme 8 Live; off = plain 8 fps)', anticipate, v => { anticipate = v; setPref('anticipate', v); pushLook(); redo(); }));
    if (cadMode === LIVE && anticipate) p.append(note('Extreme 8 Live shows the picture ~150 ms late (frozen 250 ms before a movement, then 1.5x catch-up); the microphone stays live, so audio runs ahead of the picture.'));
    p.append(note('Motion cadence = how many NEW images per second you see. Held images repeat. Real time and your voice are never sped up or delayed.'));
    const st = renderer?.stats?.() || {};
    p.append(note(`Rendering ${(st.fps || 0).toFixed(0)} fps, ${(st.uniqueFps || 0).toFixed(0)} unique fps`), btn('Refresh counters', redo));
  },
  Voice(p, redo) {
    p.append(btn(voiceOn ? '✓ Miniature Voice ON (tap = bypass)' : 'Miniature Voice OFF (tap to enable)', async () => {
      voiceOn = !voiceOn; setPref('voiceOn', voiceOn);
      if (voiceOn || voice) { await ensureMic(); await ensureVoice(); voice.setEnabled(voiceOn); voice.resume(); }
      redo();
    }));
    p.append(row(btn((!voiceSpeech ? '✓ ' : '') + 'Miniature (octaves)', () => setVoiceMode(false, redo)), btn((voiceSpeech ? '✓ ' : '') + 'Speech-friendly (semitones)', () => setVoiceMode(true, redo))));
    const l = note(VoiceMath.label(voiceSpeech, voiceVal)); l.style.cssText = 'color:#fff;font-size:15px';
    const sl = slider('Pitch', VoiceMath.OCT_MIN, VoiceMath.OCT_MAX, voiceVal, v => { voiceVal = VoiceMath.snap(v, 3, 6); setPref('voiceVal', voiceVal); l.textContent = VoiceMath.label(voiceSpeech, voiceVal); voice?.setParams({ speech: voiceSpeech, value: voiceVal }); });
    sl.querySelector('input').step = VoiceMath.STEP; p.append(l, sl);
    p.append(note('⚠ Extreme pitch. +4 oct makes every frequency ×16 (150 Hz voice → 2.4 kHz). Speech may be shrill or unintelligible. No speaker monitoring — check with headphones at LOW volume. Affects recording; video and motion cadence are independent.'));
    p.append(note(!voice ? 'Voice DSP: starts when you enable it or first record.' : voice.failed && voiceOn ? '⛔ Voice DSP FAILED — audio is MUTED. Turn Miniature Voice OFF to record your normal mic.' : voice.failed ? 'Voice DSP unavailable; normal mic in use.' : `DSP latency ${voice.latencyMs.toFixed(0)} ms (always applied, so bypass never jumps) · Signalsmith Stretch web build`));
  },
  Scene(p, redo) {
    p.append(note('Surround frame (live, saved):'));
    p.append(row(...FRAMES.map(([id, n]) => btn((sceneFrame === id ? '✓ ' : '') + n, () => { sceneFrame = id; setPref('sceneFrame', id); applyScene(); redo(); }))));
    if (sceneFrame) p.append(btn(`Color: ${matIdx(sceneFrame) === 0 ? 'Original' : matIdx(sceneFrame) + '/' + (MAT_SIZE - 1)} (tap for next)`, () => { setPref('mat.' + sceneFrame, (matIdx(sceneFrame) + 1) % MAT_SIZE); renderer.setMaterialColor(matIdx(sceneFrame)); redo(); }));
    p.append(btn(`Light strip: ${stripMode.toLowerCase()} (tap to change)`, () => { cycleStrip(); redo(); }));
    p.append(row(btn('Replay reveal', () => renderer?.reveal()), btn('Recenter', () => mot.recenter()),
      ...['high', 'balanced', 'low'].map(q => btn((quality === q ? '✓ ' : '') + q, () => { quality = q; setPref('quality', q); renderer?.setQuality(q); redo(); }))));
    const mats = shownMaterials();
    if (mats.length > 1) p.append(note('Material (camera picture only):'), row(...mats.map(m => btn((material === m.id ? '✓ ' : '') + m.name, () => { material = m.id; setPref('material', m.id); renderer.setMaterial(m.id); redo(); }))));
    p.append(note('Surround models (Small/Large on-device inpainting) are Android-only; the web app uses the procedural/photo surround.'));
  },
  Camera(p, redo) {
    p.append(note(cam ? `Camera live: ${cam.facing}, ${cam.caps.width}x${cam.caps.height} @ ${Math.round(cam.caps.frameRate)} fps` : 'Camera is off.'));
    p.append(row(btn('Restart camera', async () => { stopCamera(); await startCamera(); redo(); }), ...(cam?.caps.flip ? [btn('⟲ Flip camera', async () => { await flipCamera(); redo(); })] : [])));
    p.append(btn(mot.active ? '✓ Motion on' : 'Enable motion (gyro parallax)', async () => { toast((await mot.start()) ? 'Motion on' : 'Motion not available / denied'); redo(); }));
    p.append(note(hw.capabilities.motion ? 'Tilt the phone to look around inside the frame.' : 'This device has no motion sensor: no parallax.'));
  },
  Presets(p, redo) {
    const all = { ...BUILT_IN, ...customs };
    Object.keys(all).forEach(n => p.append(row(btn((n === presetName ? '✓ ' : '') + n, () => {
      presetName = n; values = all[n].slice(); const cur = values[idx('cadence')]; setPref('preset', n);
      const m = CADENCE.find(([, f]) => f === cur); cadMode = cadMode === LIVE ? LIVE : (m ? m[0] : 'Natural'); pushLook(); redo();
    }), ...(customs[n] ? [btn('Delete', () => { delete customs[n]; setPref('custom', customs); redo(); })] : []))));
    const name = el('input'); name.type = 'text'; name.placeholder = 'Name for current look'; name.maxLength = 40;
    p.append(name, btn('Save current look as preset', () => { const n = name.value.trim(); if (!n) return toast('Type a name first'); customs[n] = values.slice(); setPref('custom', customs); presetName = n; setPref('preset', n); redo(); }));
  },
  Output(p, redo) {
    p.append(note('Saved video speed (1x/1.25x/1.5x/2x) is Android-only for now: the web recorder saves real time.'));
    p.append(note('Photos and videos are stored on this device (IndexedDB). Nothing is uploaded unless you Share/Export.'));
    const name = el('input'); name.type = 'text'; name.maxLength = 40; name.placeholder = 'Album name';
    store?.getAlbumName?.().then(n => { name.value = n || ''; }).catch(() => {});
    name.onchange = () => store?.setAlbumName?.(name.value.trim() || 'My Album');
    p.append(note('Album name'), name);
    p.append(btn('Keep my media (ask browser not to evict)', async () => toast(hw.capabilities.storagePersist && await navigator.storage.persist() ? 'Storage will persist' : 'Browser declined / not supported')));
    p.append(btn(`Recording format: ${hw.pickMime().split(';')[0] || 'none'}`, () => {}));
  },
  Diag(p, redo) {
    const st = renderer?.stats?.() || {};
    p.append(note(JSON.stringify({ stats: st, caps: hw.capabilities, mime: hw.pickMime(), ua: navigator.userAgent, version: swVersion, sw: !!navigator.serviceWorker?.controller }, null, 1)), btn('Refresh', redo));
  },
};
function setVoiceMode(speech, redo) { voiceSpeech = speech; voiceVal = speech ? VoiceMath.SEMI_DEFAULT : VoiceMath.OCT_DEFAULT; setPref('voiceSpeech', speech); setPref('voiceVal', voiceVal); voice?.setParams({ speech, value: voiceVal }); redo(); }
// Material list: ship ones always; candidates only with ?lab=1 (labelled). Unknown / hidden id -> Original.
const LAB = Q.has('lab');
const shownMaterials = () => (renderer?.listMaterials?.() || []).filter(m => (m.status === 'ship' || (LAB && m.status === 'candidate')) && !m.disabled).map(m => ({ ...m, name: m.status === 'ship' ? m.name : m.name + ' (lab)' }));
let quality = pref('quality', 'high'), material = pref('material', 'original');
TABS.forEach(t => $('tabs').append(btn(t, () => showTab(t))));
$('sheet-close').onclick = () => setSheet(false);

function applyScene() { if (!renderer) return; renderer.setFrame(sceneFrame); renderer.setMaterialColor(matIdx(sceneFrame)); }

// ------------------------------------------------------------------ install help (logic of the site's apps/install.mjs, no dependency on it)
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let deferredInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
addEventListener('appinstalled', () => { deferredInstall = null; $('install').hidden = true; $('install-link').hidden = true; });
if (standalone) $('install-link').hidden = true;
$('install-link').onclick = () => {
  const t = $('install-text'); $('install-go').hidden = true;
  if (hw.isIOS) t.textContent = 'On iPhone/iPad: tap the Share button in Safari, then "Add to Home Screen". It then opens full screen like an app.';
  else if (deferredInstall) { t.textContent = "Install MOM's: Little Boyfriend LIVE on this device."; $('install-go').hidden = false; }
  else if (hw.isAndroid) t.textContent = 'On Android: open the browser menu (three dots) and tap "Install app" (or "Add to Home screen"). Or use the APK link below.';
  else t.textContent = 'Use the install icon in the address bar (or the browser menu > Install). On Android you can also get the APK.';
  $('install').hidden = false;
};
$('install-go').onclick = async () => { const d = deferredInstall; deferredInstall = null; $('install').hidden = true; if (d) { d.prompt(); await d.userChoice; } };
$('install-x').onclick = () => { $('install').hidden = true; };

// ------------------------------------------------------------------ service worker + update prompt
let swVersion = '', reloading = false;
function showUpdate(worker) {
  $('update').hidden = false;
  const apply = () => worker.postMessage('SKIP_WAITING');
  $('update-btn').onclick = apply;
  // Auto-update: the new version is already installed in the background; switch (one reload) at the first safe moment:
  // not while recording, not while a field has focus. The banner button stays as the manual path.
  const timer = setInterval(() => {
    if (rec || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    clearInterval(timer); apply();
  }, 2000);
}
async function initSW() {
  if (!('serviceWorker' in navigator) || Q.has('nosw')) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return; reloading = true;
    let recent = false; try { recent = Date.now() - Number(sessionStorage.getItem('lbf-reloaded') || 0) < 60000; sessionStorage.setItem('lbf-reloaded', String(Date.now())); } catch {}
    if (!window.__lbfNoReload && !recent) location.reload();   // recent = loop guard
  });
  navigator.serviceWorker.addEventListener('message', e => { if (e.data?.version) swVersion = e.data.version; });
  try {
    const reg = await navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' });
    const ask = () => (reg.active || navigator.serviceWorker.controller)?.postMessage('GET_VERSION');
    const watch = w => w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w); });
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => reg.installing && watch(reg.installing));
    navigator.serviceWorker.ready.then(ask);
    if (TEST) Object.assign(window.__lbf, { checkUpdate: () => reg.update(), swVersion: () => { ask(); return swVersion; } });
    const upd = () => reg.update().catch(() => {});   // launch (register), visible, online, and at most every 30 min while visible
    document.addEventListener('visibilitychange', () => { if (!document.hidden) upd(); });
    addEventListener('online', upd);
    setInterval(() => { if (!document.hidden) upd(); }, 30 * 60000);
  } catch (e) { console.warn('sw', e); }
}

// ------------------------------------------------------------------ boot
async function boot() {
  if (TEST) window.__lbf = { hw, mot, get cam() { return cam; }, get rec() { return rec; }, get renderer() { return renderer; } };
  applyFrameLook(); layout();
  new ResizeObserver(layout).observe(app); addEventListener('resize', layout); addEventListener('orientationchange', layout);
  if (!STUBS && !hw.capabilities.webgl2) {
    showMsg('This browser has no WebGL2, which the miniature look needs. Try a newer Chrome/Safari, or on Android install the APK.', false);
    initSW(); return;
  }
  let R, S, G;
  try {
    if (STUBS) R = S = G = await import('./dev/stubs.mjs');
    else { [R, S, G] = await Promise.all([import('./render.mjs'), import('./store.mjs'), import('./gallery.mjs')]); S = S.default?.save ? S.default : S; }
  } catch (e) { showMsg('Could not load the app engine: ' + (e.message || e), false); console.error(e); initSW(); return; }
  store = STUBS ? R.store : S; galleryMod = G;
  try { renderer = await R.createRenderer($('out'), { effects: FX, base: new URL('./', location.href).href }); }
  catch (e) { showMsg('Renderer failed to start: ' + (e.message || e), false); console.error(e); initSW(); return; }
  if (TEST) window.__lbf.store = store;
  applyScene(); renderer.setQuality(quality); pushLook();
  if (!shownMaterials().some(m => m.id === material)) material = 'original';
  if (material !== 'original') renderer.setMaterial(material);
  // DeviceOrientation: alpha grows when turning LEFT, beta grows when the rear camera aims UP; the renderer wants yaw + = aimed right, pitch + = aimed up (native SIGN_X=1/SIGN_Y=-1 live inside the renderer)
  mot.onPose(p => renderer.setPose({ yaw: -p.yaw, pitch: p.pitch, roll: p.roll }));
  if (!hw.capabilities.recorder) { $('b-rec').hidden = true; toast('Recording is not supported in this browser'); }

  // rAF drives the renderer; idle when the page is hidden or the gallery covers it (except while recording)
  const tick = now => { requestAnimationFrame(tick); if (document.hidden || (overlayOpen && !rec)) return; try { renderer.frame(now); } catch (e) { console.error(e); } if (cam) refreshPhotoReady(); };
  requestAnimationFrame(tick);

  // rail
  $('b-frame').onclick = e => { if ($('b-frame').dataset.long) { delete $('b-frame').dataset.long; return; } cycleFrame(); };
  let lp = 0;
  $('b-frame').addEventListener('pointerdown', () => { lp = setTimeout(() => { $('b-frame').dataset.long = '1'; setSheet(true); showTab('Scene'); }, 600); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('b-frame').addEventListener(ev, () => clearTimeout(lp)));
  $('b-strip').onclick = cycleStrip;
  $('b-photo').onclick = takePhoto;
  $('b-rec').onclick = toggleRec;
  $('b-gal').onclick = openGallery;
  $('b-gear').onclick = () => setSheet($('sheet').hidden);

  // first tap: resume audio, iOS motion permission (must come from a gesture)
  const firstTap = () => { voice?.resume(); if (mot.needsGesture && !mot.active) mot.start(); };
  addEventListener('pointerup', firstTap);
  if (hw.capabilities.motion && !mot.needsGesture) mot.start();

  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) { if (rec) await stopRec(); stopCamera(); mic?.getTracks().forEach(t => t.stop()); mic = null; }
    else startCamera();
  });
  if (voiceOn) { ensureVoice().catch(() => {}); }
  startCamera();
  initSW();
}
boot();
