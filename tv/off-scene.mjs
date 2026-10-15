// The set switched off: the gold computer from the Coach Armie intro, in 3D, orbitable by drag / wheel / arrows.
// Front: a sticky note on the dead CRT. Over the monitor one way: Armie's exit door far behind. The other way:
// Coach peeking over the top. Rear: two cut wires. Join them (hotwire) and the real #power works again (tv.js gates it).
// Loaded lazily by tv.js paintDark(); if WebGL fails the plain dark tube stays and power is ungated.
import * as THREE from './assets/armie-intro/vendor/three.module.js';
import {loadCoach} from './assets/armie-intro/coach-3d.mjs';

export const NOTE = 'Be smart. Beat the games. Beat Mom. Be free.';
export const HOTWIRE_KEY = 'mbs-hotwired';
const tv = document.getElementById('tv'), realPower = document.getElementById('power');
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let hot = false; try { hot = sessionStorage.getItem(HOTWIRE_KEY) === '1'; } catch {}
// After hotwiring and switching on, the scene locks to the front (localStorage, across visits) until Coach Armie is beaten.
// Armie's completion signal: armie.html writes 'mbs-armie-hall-result' when the run completes (both endings), and the
// run clock records the 'armie' checkpoint. Locked implies wired, so tv.js lets power through.
export const LOCK_KEY = 'mbs-off3d-locked';
const armieDone = () => { try { return !!localStorage.getItem('mbs-armie-hall-result') || !!window.MBS_RUN?.read()?.completed?.includes('armie') || !!window.MBS_STATE?.completedPages?.().includes('armie'); } catch { return false; } };
let locked = false, yaw = 0, yawTo = 0;
function relock() {
  try { if (localStorage.getItem(LOCK_KEY) === '1' && armieDone()) localStorage.removeItem(LOCK_KEY); locked = localStorage.getItem(LOCK_KEY) === '1'; } catch { locked = false; }
  if (locked) { hot = true; yaw = yawTo = Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI; }
}
const isHot = () => hot;
const sfx = k => { try { window.MBS_SOUND?.unlock(); window.MBS_SOUND?.play(k); } catch {} };

// --- DOM layer: canvas + projected real buttons (taps and keyboard hit DOM, not raycasts)
const layer = document.createElement('div');
layer.className = 'off3d'; layer.dataset.noTvSound = ''; layer.tabIndex = 0;
layer.setAttribute('role', 'region'); layer.setAttribute('aria-label', 'The television is off. Look around the computer: arrow keys or drag.');
const renderer = new THREE.WebGLRenderer({antialias: true}); // throws without WebGL: tv.js catches and keeps the dark tube
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.domElement.setAttribute('aria-hidden', 'true');
const btn = (cls, label) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'off3d-hit ' + cls; b.setAttribute('aria-label', label); layer.append(b); return b; };
layer.append(renderer.domElement);
const noteBtn = btn('off3d-note', 'Sticky note: ' + NOTE);
const powerBtn = btn('off3d-power', 'Power');
const wireBtns = [btn('off3d-wire', 'Loose wire end. Drag it onto the other wire, or press Enter to connect them.'), btn('off3d-wire', 'Loose wire end. Drag it onto the other wire, or press Enter to connect them.')];
const hint = document.createElement('p'); hint.className = 'off3d-hint'; hint.textContent = 'drag to look around'; layer.append(hint);
const live = document.createElement('p'); live.className = 'off3d-sr'; live.setAttribute('role', 'status'); layer.append(live);
document.body.append(layer);

// --- scene: the intro's room palette and the computer, copied from armie-intro/intro.js (FACE_HEIGHT non-live)
const scene = new THREE.Scene(); scene.background = new THREE.Color('#09080c'); scene.fog = new THREE.FogExp2('#100c15', .05);
const camera = new THREE.PerspectiveCamera(48, 1, .05, 60);
scene.add(new THREE.HemisphereLight('#b8b4d6', '#251422', .9));
const key = new THREE.PointLight('#ffe3b4', 20, 13); key.position.set(0, 3, 2.4); scene.add(key);
const backKey = new THREE.PointLight('#d5b7ed', 9, 7); backKey.position.set(0, 2.6, -2.6); scene.add(backKey);
function noiseTexture() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#777'; g.fillRect(0, 0, 256, 256); let seed = 93; const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; for (let i = 0; i < 24000; i++) { const v = 45 + rand() * 145; g.fillStyle = `rgba(${v},${v},${v},${.15 + rand() * .6})`; g.fillRect(rand() * 256, rand() * 256, 1 + rand() * 3, 1 + rand() * 3); } const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(3, 3); return tx; }
const grit = noiseTexture(); const mat = (color, roughness = .5, metalness = .15) => new THREE.MeshStandardMaterial({color, roughness, metalness, bumpMap: grit, bumpScale: .035});
const purple = mat('#443147', .85, .1), gold = mat('#b28c45', .34, .64), floorMat = mat('#49294e', .33, .35), black = mat('#0c0b10', .75, .1);
purple.map = grit; purple.bumpScale = .13; gold.bumpScale = .045; floorMat.bumpScale = .08;
function box(w, h, d, m, x, y, z, parent = scene) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
function plane(w, h, m, x, y, z, parent = scene) { const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
const FACE_HEIGHT = 1.434375, FACE_Y = 1.68;
box(40, .15, 40, floorMat, 0, -.075, 0);
const computer = new THREE.Group(); scene.add(computer); box(3, .15, 1.8, gold, 0, .64, 0, computer); for (const x of [-1.3, 1.3]) box(.14, .6, .14, black, x, .3, 0, computer);
box(2.55, FACE_HEIGHT, .85, gold, 0, FACE_Y, 0, computer); box(1.3, .12, .7, gold, 0, .92, .05, computer); box(2.15, .11, .55, gold, 0, .8, .72, computer);
for (let row = 0; row < 4; row++) for (let k = 0; k < 13; k++) box(.12, .025, .085, black, -.87 + k * .145, .867, .53 + row * .105, computer);
const tex = url => { const t = new THREE.TextureLoader().load(url); t.colorSpace = THREE.SRGBColorSpace; return t; };
plane(2.55, FACE_HEIGHT, new THREE.MeshBasicMaterial({map: tex('/tv/assets/armie-intro/website-bezel.png'), toneMapped: false}), 0, FACE_Y, .431, computer);
const SCREEN = {x: (582 / 1280 - .5) * 2.55, y: FACE_Y + (.5 - 359 / 720) * FACE_HEIGHT, w: 954 / 1280 * 2.55, h: 672 / 720 * FACE_HEIGHT};
const screenMat = new THREE.MeshStandardMaterial({color: '#0b0d12', roughness: .18, metalness: .4, emissive: '#6d63c8', emissiveIntensity: 0});
plane(SCREEN.w, SCREEN.h, screenMat, SCREEN.x, SCREEN.y, .432, computer);
box(.035, .12, .22, black, 1.29, 1.3, .24, computer); // the side drive slot (the USB itself left with Armie)
// The bezel's printed POWER key at (1138, 522) of 1280x720, given a real cap to press.
const POWER = new THREE.Vector3((1138 / 1280 - .5) * 2.55, FACE_Y + (.5 - 522 / 720) * FACE_HEIGHT, .45);
const powerCap = box(.1, .065, .04, mat('#7a2fc4', .4, .2), POWER.x, POWER.y, POWER.z, computer);
// Rear panel (the intro only ever showed the front): vent slats and a service plate.
const REAR_Z = -.426;
for (let i = 0; i < 9; i++) box(1.7, .035, .03, black, 0, 2.15 - i * .07, REAR_Z - .01, computer);
function labelTexture(lines, bg, fg, w = 512, h = 160) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = 'bold 34px monospace'; g.textAlign = 'center'; lines.forEach((t, i) => g.fillText(t, w / 2, 52 + i * 46)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const plate = plane(.72, .225, new THREE.MeshStandardMaterial({map: labelTexture(['MOM INC MBS-1998', 'NO USER SERVICEABLE PARTS', 'DO NOT HOTWIRE'], '#463421', '#ffd995'), roughness: .5, metalness: .3}), 0, 1.45, REAR_Z - .012, computer);
plate.rotation.y = Math.PI;

// --- the sticky note: scrawled in Rock Salt (already loaded by the page's font link)
const NOTE_POS = new THREE.Vector3(SCREEN.x + .42, SCREEN.y + .2, .445), NOTE_SIZE = .5;
const noteCanvas = document.createElement('canvas'); noteCanvas.width = noteCanvas.height = 512;
const noteTex = new THREE.CanvasTexture(noteCanvas); noteTex.colorSpace = THREE.SRGBColorSpace; noteTex.anisotropy = 4;
function paintNote() {
  const g = noteCanvas.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#fff27a'); grad.addColorStop(.18, '#ffe94f'); grad.addColorStop(1, '#f7d93a');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 512); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, 512, 70);
  g.fillStyle = '#1d1a6e'; g.textAlign = 'left'; g.textBaseline = 'middle';
  ['Be smart.', 'Beat the games.', 'Beat Mom.', 'Be free.'].forEach((t, i) => {
    g.save(); g.translate(40 + (i % 2) * 14, 130 + i * 98); g.rotate(-.05 + i * .025);
    g.font = `${i === 3 ? 60 : 46}px "Rock Salt", "Segoe Print", cursive`; g.fillText(t, 0, 0, 440); g.restore(); });
  g.strokeStyle = '#1d1a6e'; g.lineWidth = 5; g.beginPath(); g.moveTo(52, 462); g.quadraticCurveTo(200, 446, 300, 466); g.stroke();
  noteTex.needsUpdate = true;
}
paintNote(); document.fonts?.load('46px "Rock Salt"').then(paintNote, () => {});
const note = plane(NOTE_SIZE, NOTE_SIZE, new THREE.MeshStandardMaterial({map: noteTex, roughness: .9, side: THREE.DoubleSide}), NOTE_POS.x, NOTE_POS.y, NOTE_POS.z, computer);
note.rotation.z = .07;
// One read only (Ian): once zoomed in and back out, the note is gone for good (localStorage).
export const NOTE_KEY = 'mbs-note-read';
let noteGone = false; try { noteGone = localStorage.getItem(NOTE_KEY) === '1'; } catch {}
note.visible = !noteGone;
let noteOpened = false;
function closeNote() { zoomTo = 0; if (!noteOpened) return; noteGone = true; try { localStorage.setItem(NOTE_KEY, '1'); } catch {} }
note.geometry.attributes.position.setZ(0, .02); note.geometry.attributes.position.setZ(1, .015); // the curl at the top edge

// --- far behind one side: Armie's exit door (game-scene.js doorway: dark double panels, gold edges) with daylight leaking
const PEEK = .75; // the "over the monitor" yaw
const doorway = new THREE.Group(); scene.add(doorway);
doorway.position.set(-Math.sin(PEEK) * 9, 0, -Math.cos(PEEK) * 9); doorway.rotation.y = PEEK;
const doorDark = new THREE.MeshStandardMaterial({color: '#35223d', metalness: .3, roughness: .4}), doorGold = new THREE.MeshStandardMaterial({color: '#b28c45', metalness: .64, roughness: .34});
for (const side of [-1, 1]) { box(1.35, 3, .12, doorDark, side * .69, 1.5, 0, doorway); box(.07, 3.1, .15, doorGold, side * 1.43, 1.55, 0, doorway); box(2.4, 4.2, .2, purple, side * 2.68, 2.1, -.05, doorway); }
box(3, .45, .2, doorGold, 0, 3.3, -.02, doorway);
box(.05, 2.9, .05, new THREE.MeshBasicMaterial({color: '#fff6d6'}), 0, 1.5, .02, doorway);
const doorGlow = new THREE.PointLight('#ffefd2', 9, 6); doorGlow.position.set(0, 2, 1.2); doorway.add(doorGlow);

// --- the other side: Coach peeking over the top of the monitor (stands up, eyes to the camera, like coachElement)
const coachHolder = new THREE.Group(); coachHolder.position.set(.75, 1.2, -.75); coachHolder.rotation.y = -PEEK; coachHolder.visible = false; scene.add(coachHolder);
let coach = null;
loadCoach(THREE).then(c => { coach = c; const pivot = new THREE.Group(); pivot.rotation.x = Math.PI / 2; pivot.add(c.group); const stand = new THREE.Group(); stand.rotation.set(0, 0, Math.PI / 2); stand.add(pivot); stand.scale.setScalar(1.3); coachHolder.add(stand); const glow = new THREE.PointLight('#f3dcff', 3, 3); glow.position.set(0, .4, 1); coachHolder.add(glow); }).catch(e => console.warn('3D coach unavailable:', e.message));

// --- the rear: two cut wires with stripped copper ends
const copper = new THREE.MeshStandardMaterial({color: '#d9773a', metalness: .9, roughness: .3, emissive: '#ff8a3a', emissiveIntensity: 0});
const wires = [['#b3262e', -.32], ['#1b1b20', .32]].map(([color, x], i) => {
  const root = new THREE.Vector3(x, 1.28, REAR_Z), rest = new THREE.Vector3(x * 1.15, .98, REAR_Z - .6);
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({color, roughness: .55})); scene.add(mesh);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.018, .012, .1, 10), copper); scene.add(tip);
  box(.09, .09, .03, black, x, 1.28, REAR_Z - .015, computer); // grommet
  return {root, rest, end: rest.clone(), mesh, tip, button: wireBtns[i]};
});
const up = new THREE.Vector3(0, 1, 0);
function shapeWire(w) {
  const r = w.root, e = w.end, curve = new THREE.CatmullRomCurve3([r, new THREE.Vector3(r.x, r.y - .05, r.z - .25), new THREE.Vector3((r.x + e.x) / 2, Math.min(r.y, e.y) - .18, (r.z + e.z) / 2 - .1), e]);
  w.mesh.geometry.dispose(); w.mesh.geometry = new THREE.TubeGeometry(curve, 24, .022, 8, false);
  const t = curve.getTangent(1); w.tip.position.copy(e).addScaledVector(t, .045); w.tip.quaternion.setFromUnitVectors(up, t);
}
const spark = new THREE.PointLight('#ffd27a', 0, 2.5); scene.add(spark);
const sparkBits = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(60 * 3), 3)), new THREE.PointsMaterial({color: '#fff1a8', size: .035, transparent: true, opacity: 0}));
scene.add(sparkBits); const sparkVel = Array.from({length: 60}, () => new THREE.Vector3());
let sparkAt = -1e9;
function placeJoined() { const mid = wires[0].rest.clone().lerp(wires[1].rest, .5); mid.y += .05; wires[0].end.copy(mid).x -= .03; wires[1].end.copy(mid).x += .03; wires.forEach(shapeWire); }
function hotwire(now) {
  if (hot) return;
  hot = true; try { sessionStorage.setItem(HOTWIRE_KEY, '1'); } catch {}
  placeJoined(); sparkAt = now; spark.position.copy(wires[0].end);
  const p = sparkBits.geometry.attributes.position; for (let i = 0; i < 60; i++) { p.setXYZ(i, spark.position.x, spark.position.y, spark.position.z); sparkVel[i].set(Math.random() - .5, Math.random() * .9, Math.random() - .5).multiplyScalar(2.2); } p.needsUpdate = true;
  sfx('switch'); setTimeout(() => sfx('click'), 90);
  live.textContent = 'Wires connected. The computer has power. Turn around and press Power.';
  if (navigator.vibrate) try { navigator.vibrate(40); } catch {}
}
relock(); if (isHot()) placeJoined(); else wires.forEach(shapeWire);

// --- camera rig: yaw `yaw` around the computer; a bump near ±PEEK lifts the camera over the monitor and looks past it
 let zoom = 0, zoomTo = 0, flick = 0, w = 0, h = 0, fitD = 6, portrait = 0;
const look = new THREE.Vector3(), pos = new THREE.Vector3(), tmp = new THREE.Vector3();
function rig() {
  const a = Math.abs(Math.atan2(Math.sin(yaw), Math.cos(yaw))), over = Math.exp(-(((a - PEEK) / .38) ** 2)), rear = THREE.MathUtils.smoothstep(a, 1.7, 2.6);
  // Portrait (p -> 1): raise the camera a little and aim lower so the monitor, keyboard and desk sit centred in the tall frame;
  // at the rear it no longer pulls in, so the plate and both wires stay in frame.
  const d = fitD * (1 - .3 * rear * (1 - portrait));
  pos.set(Math.sin(yaw) * d, THREE.MathUtils.lerp(THREE.MathUtils.lerp(1.75 + 1.3 * portrait, 3.05, over), 1.75, rear), Math.cos(yaw) * d);
  look.set(0, THREE.MathUtils.lerp(1.6 - .5 * portrait, 1.25, rear), 0).lerp(tmp.set(-Math.sin(yaw) * 7, 1.7, -Math.cos(yaw) * 7), over * .9);
  if (zoom > 0) { const nz = NOTE_POS.clone(); pos.lerp(tmp.set(nz.x, nz.y, nz.z + NOTE_SIZE * .62 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(1, camera.aspect)), zoom); look.lerp(nz, zoom); }
  camera.position.copy(pos); camera.lookAt(look);
  return {over, rear, a};
}
function resize() {
  const cw = innerWidth, ch = innerHeight; if (cw === w && ch === h) return; w = cw; h = ch;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const v = THREE.MathUtils.degToRad(camera.fov / 2), hz = Math.atan(Math.tan(v) * camera.aspect);
  portrait = THREE.MathUtils.clamp((1 - camera.aspect) / .55, 0, 1);
  fitD = Math.max(1.35 / Math.tan(v), 1.42 / Math.tan(hz)) + .45; // the screen and its note fill the frame, phone portrait included
}
const scr = new THREE.Vector3();
function place(el, world, size, show) {
  el.hidden = !show; if (!show) return;
  scr.copy(world).project(camera); const px = Math.max(48, size);
  el.style.cssText = `left:${(scr.x + 1) / 2 * w - px / 2}px;top:${(1 - scr.y) / 2 * h - px / 2}px;width:${px}px;height:${px}px`;
}
const pxPerUnit = at => h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.distanceTo(at));

// --- input: drag / wheel / arrows orbit; buttons are real buttons
let drag = null, held = null, hintGone = false;
const turn = v => { if (!locked) yaw = yawTo = v; };
const dropHint = () => { if (!hintGone) { hintGone = true; hint.classList.add('gone'); } };
setTimeout(dropHint, 5000);
const STOPS = [0, PEEK, Math.PI, 2 * Math.PI - PEEK], TAU = 2 * Math.PI;
renderer.domElement.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, moved: false}; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e => {
  if (!drag) return; const dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) + Math.abs(e.clientY - drag.y) < 8) return;
  drag.moved = true; dropHint(); if (zoomTo) closeNote(); turn(yaw - dx * .0085); drag.x = e.clientX; drag.y = e.clientY;
});
const endDrag = () => { if (drag && !drag.moved && zoomTo) closeNote(); drag = null; };
renderer.domElement.addEventListener('pointerup', endDrag); renderer.domElement.addEventListener('pointercancel', () => { drag = null; });
layer.addEventListener('wheel', e => { e.preventDefault(); dropHint(); if (zoomTo) closeNote(); turn(yaw + (e.deltaY + e.deltaX) * .0022); }, {passive: false});
layer.addEventListener('keydown', e => {
  if (e.key === 'Escape' && zoomTo) { closeNote(); layer.focus(); return; }
  if (locked || e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); dropHint(); if (zoomTo) closeNote();
  const cur = ((yawTo % TAU) + TAU) % TAU;
  const at = e.key === 'ArrowRight' ? STOPS.find(s => s > cur + .05) ?? TAU : [...STOPS].reverse().find(s => s < cur - .05) ?? STOPS[3] - TAU;
  yawTo += at - cur; if (still()) yaw = yawTo;
});
noteBtn.addEventListener('click', () => { dropHint(); if (zoomTo) { closeNote(); powerBtn.focus(); return; } noteOpened = true; yawTo = Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI; zoomTo = 1; if (still()) { yaw = yawTo; zoom = 1; } sfx('bloop'); live.textContent = 'The note says: ' + NOTE; });
powerBtn.addEventListener('click', () => { realPower.click(); });
tv.addEventListener('mbs:deadpower', () => { flick = performance.now(); live.textContent = 'Nothing. No power. Check the back.'; });
wireBtns.forEach((b, i) => {
  b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hotwire(performance.now()); } });
  b.addEventListener('pointerdown', e => { if (isHot()) return; e.preventDefault(); held = i; b.setPointerCapture(e.pointerId); dropHint(); });
  b.addEventListener('pointermove', e => {
    if (held !== i) return; const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(e.clientX / w * 2 - 1, -(e.clientY / h) * 2 + 1);
    ray.setFromCamera(ndc, camera); const hit = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -wires[i].rest.z), new THREE.Vector3());
    if (!hit) return; const wire = wires[i]; hit.sub(wire.root).clampLength(0, 1.1).add(wire.root); hit.y = Math.max(.12, hit.y); wire.end.copy(hit); shapeWire(wire);
    if (wire.end.distanceTo(wires[1 - i].end) < .14) { held = null; hotwire(performance.now()); }
  });
  const release = () => { if (held === i) { held = null; } };
  b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release);
});

// --- loop: runs only while the set is off
let raf = 0, running = false;
function frame(now) {
  raf = requestAnimationFrame(frame); resize();
  const q = still() ? 1 : .12; yaw += (yawTo - yaw) * q; zoom += (zoomTo - zoom) * (still() ? 1 : .1);
  if (Math.abs(zoom - zoomTo) < .002) zoom = zoomTo;
  const {over, rear, a} = rig(), wrapped = Math.atan2(Math.sin(yaw), Math.cos(yaw)), front = Math.abs(wrapped) < .45;
  // Coach rises behind the monitor only while you look over its side, and ducks again when you turn away.
  const peek = wrapped < 0 ? over : 0; coachHolder.visible = !!coach && peek > .02;
  coachHolder.position.y = .95 + peek * 1.05 + (still() ? 0 : Math.sin(now / 380) * .03 * peek); coachHolder.rotation.z = still() ? 0 : Math.sin(now / 520) * .08;
  coach?.tick(now, {pressure: .5});
  // CRT: a dead flicker when power is pressed unwired, a faint hum once hotwired.
  const f = Math.max(0, 1 - (now - flick) / 450); screenMat.emissiveIntensity = (isHot() ? .06 + .03 * Math.sin(now / 300) : 0) + f * (Math.sin(now / 18) > 0 ? .55 : .1);
  // Spark burst.
  const s = (now - sparkAt) / 700; spark.intensity = s < 1 ? (1 - s) * 14 * (Math.random() * .6 + .4) : 0; copper.emissiveIntensity = s < 1 ? (1 - s) * 1.5 : 0;
  sparkBits.material.opacity = s < 1 ? 1 - s : 0;
  if (s < 1) { const p = sparkBits.geometry.attributes.position; for (let i = 0; i < 60; i++) { sparkVel[i].y -= .06; p.setXYZ(i, p.getX(i) + sparkVel[i].x * .016, p.getY(i) + sparkVel[i].y * .016, p.getZ(i) + sparkVel[i].z * .016); } p.needsUpdate = true; }
  renderer.render(scene, camera);
  note.visible = !noteGone || zoom > .05; // peels off as the camera pulls back
  const zoomed = zoom > .5;
  place(noteBtn, NOTE_POS, (zoomed ? .9 : 1.1) * NOTE_SIZE * pxPerUnit(NOTE_POS), front && !noteGone);
  place(powerBtn, POWER, 0, front && !zoomed);
  const back = rear > .85 && !isHot();
  wires.forEach(wr => place(wr.button, wr.end, 0, back));
  layer.classList.toggle('zoomed', zoomed); layer.classList.toggle('hot', isHot());
}
function sync() {
  const on = tv.dataset.state === 'off';
  if (on && !running) { relock(); hint.hidden = locked; running = true; w = h = 0; raf = requestAnimationFrame(frame); }
  if (!on && running) { running = false; cancelAnimationFrame(raf); renderer.setSize(1, 1, false); // free the framebuffer while the TV runs
    if (zoomTo) closeNote(); zoom = 0; if (hot && !armieDone()) try { localStorage.setItem(LOCK_KEY, '1'); } catch {} }
}
addEventListener('mbs:page-complete', () => running && relock());
new MutationObserver(sync).observe(tv, {attributes: true, attributeFilter: ['data-state']});
tv.dataset.off3d = 'on'; sync();
// test hook: the check script drives the camera without simulating drags
window.MBS_OFF3D = {setYaw: turn, get locked() { return locked; }, get noteGone() { return noteGone; }, relock, get yaw() { return yaw; }, hotwire: () => hotwire(performance.now()), get hot() { return isHot(); }};
