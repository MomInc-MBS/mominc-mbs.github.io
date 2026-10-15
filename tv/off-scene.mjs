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
// One WebGL context: render the room small and blur it, then draw the computer sharp on top.
// A second context could be evicted on phones while leaving its blank canvas and power gate visible.
const mkRenderer = (opts, ratio) => { const r = new THREE.WebGLRenderer(opts); r.setPixelRatio(ratio); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15; r.domElement.setAttribute('aria-hidden', 'true'); return r; };
const renderer = mkRenderer({antialias: true}, Math.min(devicePixelRatio, 1.5)); // throws without WebGL: tv.js keeps the dark tube
const roomTarget = new THREE.WebGLRenderTarget(1, 1, {depthBuffer: true});
const blurScene = new THREE.Scene(), blurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const blurMat = new THREE.ShaderMaterial({
  uniforms: {room: {value: roomTarget.texture}, texel: {value: new THREE.Vector2(1, 1)}},
  vertexShader: 'varying vec2 uvOut; void main() { uvOut = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D room; uniform vec2 texel; varying vec2 uvOut;
    void main() {
      vec4 c = texture2D(room, uvOut) * .20;
      c += texture2D(room, uvOut + vec2(texel.x, 0.)) * .12;
      c += texture2D(room, uvOut - vec2(texel.x, 0.)) * .12;
      c += texture2D(room, uvOut + vec2(0., texel.y)) * .12;
      c += texture2D(room, uvOut - vec2(0., texel.y)) * .12;
      c += texture2D(room, uvOut + texel) * .08;
      c += texture2D(room, uvOut - texel) * .08;
      c += texture2D(room, uvOut + vec2(texel.x, -texel.y)) * .08;
      c += texture2D(room, uvOut + vec2(-texel.x, texel.y)) * .08;
      gl_FragColor = c;
      #include <colorspace_fragment>
    }`
});
blurScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat));
const btn = (cls, label) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'off3d-hit ' + cls; b.setAttribute('aria-label', label); layer.append(b); return b; };
layer.append(renderer.domElement);
const noteBtn = btn('off3d-note', 'Sticky note: ' + NOTE);
const powerBtn = btn('off3d-power', 'Power');
const sharedDial = document.getElementById('knob');
const dialBtn = btn('off3d-dial', 'Channel dial');
const wireBtns = [btn('off3d-wire', 'Loose wire end. Drag it onto the other wire, or press Enter to connect them.'), btn('off3d-wire', 'Loose wire end. Drag it onto the other wire, or press Enter to connect them.')];
const hint = document.createElement('p'); hint.className = 'off3d-hint'; hint.textContent = 'drag to look around'; layer.append(hint);
const live = document.createElement('p'); live.className = 'off3d-sr'; live.setAttribute('role', 'status'); layer.append(live);
document.body.append(layer);
const channelNav = document.getElementById('lcd'), channelHome = channelNav?.parentNode, channelNext = channelNav?.nextSibling;
function restoreChannelNav() {
  if (!channelNav || channelNav.parentNode !== layer) return;
  channelHome.insertBefore(channelNav, channelNext);
  for (const property of ['left', 'top', 'width', 'height', 'visibility']) channelNav.style.removeProperty(property);
  channelNav.inert = false;
}

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
// Phone-shaped (Ian, 15 Oct): a tall slim face that fills a phone face-on, the bezel's own dial, power key and logo in the chin.
const FACE_W = 1.7, FACE_HEIGHT = 3.6, FACE_D = .5, FACE_Y = .98 + FACE_HEIGHT / 2, FRONT_Z = FACE_D / 2;
const floor = box(40, .15, 40, floorMat, 0, -.075, 0);
const computer = new THREE.Group(); scene.add(computer); box(3, .15, 1.8, gold, 0, .64, 0, computer); for (const x of [-1.3, 1.3]) box(.14, .6, .14, black, x, .3, 0, computer);
box(FACE_W, FACE_HEIGHT, FACE_D, gold, 0, FACE_Y, 0, computer); box(1.3, .12, .7, gold, 0, .92, .05, computer); box(2.15, .11, .55, gold, 0, .8, .72, computer);
for (let row = 0; row < 4; row++) for (let k = 0; k < 13; k++) box(.12, .025, .085, black, -.87 + k * .145, .867, .53 + row * .105, computer);
// A crop (px of the 1280x720 bezel art) of website-bezel.png on its own plane.
function crop(px, py, pw, ph, w, x, y, z = FRONT_Z + .002, round = false) {
  const t = new THREE.TextureLoader().load('/tv/assets/armie-intro/website-bezel.png'); t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(pw / 1280, ph / 720); t.offset.set(px / 1280, 1 - (py + ph) / 720);
  const m = new THREE.MeshBasicMaterial({map: t, toneMapped: false});
  if (!round) return plane(w, w * ph / pw, m, x, y, z, computer);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 48), m); disc.position.set(x, y, z); computer.add(disc); return disc;
}
const TOP = FACE_Y + FACE_HEIGHT / 2;
// Two displays share the original face: the live channel selector above the dead, note-covered tube.
const SCREEN = {x: 0, w: FACE_W - .16, h: 1.51, y: 2.555};
const CHANNEL_CRT = {x: 0, w: 1.34, h: .81, y: 3.915, z: FRONT_Z + .021};
plane(SCREEN.w + .05, SCREEN.h + .05, black, 0, SCREEN.y, FRONT_Z + .001, computer); // the screen's dark rim
const screenMat = new THREE.MeshStandardMaterial({color: '#0b0d12', roughness: .85, metalness: .05, emissive: '#6d63c8', emissiveIntensity: 0});
plane(SCREEN.w, SCREEN.h, screenMat, SCREEN.x, SCREEN.y, FRONT_Z + .002, computer);
// The upper glass bows toward the viewer. A real DOM channel nav sits just in front of it while facing front.
plane(CHANNEL_CRT.w + .12, CHANNEL_CRT.h + .12, black, 0, CHANNEL_CRT.y, FRONT_Z + .004, computer);
const crtGeometry = new THREE.PlaneGeometry(CHANNEL_CRT.w, CHANNEL_CRT.h, 16, 10);
const crtPositions = crtGeometry.attributes.position;
for (let i = 0; i < crtPositions.count; i++) {
  const x = crtPositions.getX(i) / (CHANNEL_CRT.w / 2), y = crtPositions.getY(i) / (CHANNEL_CRT.h / 2);
  crtPositions.setZ(i, .026 * (1 - x * x) * (1 - y * y));
}
crtGeometry.computeVertexNormals();
const crtGlass = new THREE.Mesh(crtGeometry, new THREE.MeshPhysicalMaterial({color: '#182820', roughness: .23, metalness: .12, clearcoat: .72, clearcoatRoughness: .24, emissive: '#152d22', emissiveIntensity: .24}));
crtGlass.position.set(0, CHANNEL_CRT.y, FRONT_Z + .008); computer.add(crtGlass);
const CHIN_Y = 1.26;
const DIAL = new THREE.Vector3(-.4, CHIN_Y + .03, FRONT_Z + .03);
const dial = crop(1112, 17, 122, 122, .62, DIAL.x, DIAL.y, DIAL.z, true); // the channel dial, big
// The bezel's POWER key, four times its old size (Ian): a real cap wearing the art's power symbol.
const POWER = new THREE.Vector3(.4, CHIN_Y + .03, FRONT_Z + .06);
box(.46, .32, .05, black, POWER.x, POWER.y, FRONT_Z + .02, computer);
const powerCap = box(.4, .26, .06, mat('#7a2fc4', .4, .2), POWER.x, POWER.y, POWER.z - .02, computer);
crop(1118, 510, 42, 24, .38, POWER.x, POWER.y, POWER.z + .012);
// Bump-mapped brass badges read as stamped metal under the scene lights, including on both cabinet sides.
function badgeTexture(vertical = false, words = 'MOM INC') {
  const canvas = document.createElement('canvas'); canvas.width = vertical ? 128 : 512; canvas.height = vertical ? 512 : 128;
  const g = canvas.getContext('2d'); g.fillStyle = '#43331b'; g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = '#f9d994'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (vertical) { g.font = 'bold 64px Georgia, serif'; [...'MOMINC'].forEach((letter, i) => g.fillText(letter, 64, 49 + i * 82)); }
  else { g.font = 'bold 70px Georgia, serif'; g.fillText(words, 256, 69, 476); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
}
function badge(w, h, x, y, z, rotationY, vertical, words) {
  const texture = badgeTexture(vertical, words);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: texture, bumpMap: texture, bumpScale: .045, roughness: .32, metalness: .58, side: THREE.DoubleSide}));
  mesh.position.set(x, y, z); mesh.rotation.y = rotationY; computer.add(mesh);
}
crop(1115, 640, 112, 40, .34, 0, TOP - .13); // small original MOM INC maker mark
box(1.45, .17, .035, gold, 0, 1.7, FRONT_Z + .015, computer);
badge(1.4, .14, 0, 1.7, FRONT_Z + .037, 0, false, 'GLORY BE TO MOMMY');
for (const side of [-1, 1]) {
  box(.025, 1.35, .39, gold, side * (FACE_W / 2 + .015), 2.75, 0, computer);
  badge(.31, 1.24, side * (FACE_W / 2 + .03), 2.75, 0, side * Math.PI / 2, true);
}
box(.035, .12, .22, black, FACE_W / 2 + .01, 1.6, 0, computer); // the side drive slot (the USB itself left with Armie)
// Rear panel (the intro only ever showed the front): vent slats and a service plate.
const REAR_Z = -FACE_D / 2 - .001;
for (let i = 0; i < 9; i++) box(1.2, .035, .03, black, 0, TOP - .35 - i * .07, REAR_Z - .01, computer);
function labelTexture(lines, bg, fg, w = 512, h = 160) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = 'bold 34px monospace'; g.textAlign = 'center'; lines.forEach((t, i) => g.fillText(t, w / 2, 52 + i * 46)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const plate = plane(.72, .225, new THREE.MeshStandardMaterial({map: labelTexture(['MOM INC MBS-1998', 'NO USER SERVICEABLE PARTS', 'DO NOT HOTWIRE'], '#463421', '#ffd995'), roughness: .5, metalness: .3}), 0, 2.4, REAR_Z - .012, computer);
plate.rotation.y = Math.PI;

// --- the sticky note: scrawled in Rock Salt (already loaded by the page's font link)
const NOTE_POS = new THREE.Vector3(SCREEN.x + .28, SCREEN.y + .28, FRONT_Z + .015), NOTE_SIZE = .5;
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
const coachHolder = new THREE.Group(); coachHolder.position.set(.75, 3.3, -.75); coachHolder.rotation.y = -PEEK; coachHolder.visible = false; scene.add(coachHolder);
let coach = null;
loadCoach(THREE).then(c => { coach = c; const pivot = new THREE.Group(); pivot.rotation.x = Math.PI / 2; pivot.add(c.group); const stand = new THREE.Group(); stand.rotation.set(0, 0, Math.PI / 2); stand.add(pivot); stand.scale.setScalar(1.3); coachHolder.add(stand); const glow = new THREE.PointLight('#f3dcff', 3, 3); glow.position.set(0, .4, 1); coachHolder.add(glow); }).catch(e => console.warn('3D coach unavailable:', e.message));

// --- the rear: two cut wires with stripped copper ends
const copper = new THREE.MeshStandardMaterial({color: '#d9773a', metalness: .9, roughness: .3, emissive: '#ff8a3a', emissiveIntensity: 0});
const wires = [['#b3262e', -.32], ['#1b1b20', .32]].map(([color, x], i) => {
  const root = new THREE.Vector3(x, 1.6, REAR_Z), rest = new THREE.Vector3(x * 1.15, .98, REAR_Z - .6);
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({color, roughness: .55})); scene.add(mesh);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.018, .012, .1, 10), copper); scene.add(tip);
  box(.09, .09, .03, black, x, 1.6, REAR_Z - .015, computer); // grommet
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
  // Face-on the camera sits square to the face; at the rear it pulls in on wide screens only, so both wires stay in frame.
  const d = fitD * (1 - .3 * rear * (1 - portrait));
  pos.set(Math.sin(yaw) * d, THREE.MathUtils.lerp(THREE.MathUtils.lerp(FACE_Y, TOP + .45, over), 2.1, rear), Math.cos(yaw) * d);
  look.set(0, THREE.MathUtils.lerp(FACE_Y, 1.5, rear), 0).lerp(tmp.set(-Math.sin(yaw) * 7, 1.7, -Math.cos(yaw) * 7), over * .9);
  if (zoom > 0) { const nz = NOTE_POS.clone(); pos.lerp(tmp.set(nz.x, nz.y, nz.z + NOTE_SIZE * .62 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(1, camera.aspect)), zoom); look.lerp(nz, zoom); }
  camera.position.copy(pos); camera.lookAt(look);
  return {over, rear, a};
}
function resize() {
  const cw = innerWidth, ch = innerHeight; if (cw === w && ch === h) return; w = cw; h = ch;
  renderer.setSize(w, h, false);
  const rw = Math.max(1, Math.floor(w * .5)), rh = Math.max(1, Math.floor(h * .5));
  roomTarget.setSize(rw, rh); blurMat.uniforms.texel.value.set(2 / rw, 2 / rh);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const v = THREE.MathUtils.degToRad(camera.fov / 2), hz = Math.atan(Math.tan(v) * camera.aspect);
  portrait = THREE.MathUtils.clamp((1 - camera.aspect) / .55, 0, 1);
  // Portrait: cover, so both gold sides sit just off-screen and the face is the whole phone. Landscape: the whole face fits.
  const byW = s => FACE_W * s / (2 * Math.tan(hz)), byH = s => FACE_HEIGHT * s / (2 * Math.tan(v));
  fitD = (camera.aspect < 1 ? Math.min(byW(.95), byH(1)) : Math.max(byW(1.1), byH(1.08))) + FRONT_Z;
}
const scr = new THREE.Vector3();
function place(el, world, size, show) {
  el.hidden = !show; if (!show) return;
  scr.copy(world).project(camera); const px = Math.max(48, size);
  el.style.cssText = `left:${(scr.x + 1) / 2 * w - px / 2}px;top:${(1 - scr.y) / 2 * h - px / 2}px;width:${px}px;height:${px}px`;
}
const pxPerUnit = at => h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.distanceTo(at));
function placeChannelNav(show) {
  if (!channelNav) return;
  if (channelNav.parentNode !== layer) layer.append(channelNav); // keep tv.js's original links and listeners
  channelNav.style.visibility = show ? 'visible' : 'hidden'; channelNav.inert = !show;
  if (!show) return;
  const corners = [
    [-.5, -.5], [-.5, .5], [.5, -.5], [.5, .5]
  ].map(([x, y]) => new THREE.Vector3(CHANNEL_CRT.x + x * CHANNEL_CRT.w, CHANNEL_CRT.y + y * CHANNEL_CRT.h, CHANNEL_CRT.z).project(camera));
  const xs = corners.map(p => (p.x + 1) * w / 2), ys = corners.map(p => (1 - p.y) * h / 2);
  const left = Math.min(...xs), top = Math.min(...ys);
  channelNav.style.left = `${left}px`; channelNav.style.top = `${top}px`;
  channelNav.style.width = `${Math.max(...xs) - left}px`; channelNav.style.height = `${Math.max(...ys) - top}px`;
}

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
layer.addEventListener('wheel', e => { if (e.target.closest('#lcd')) return; e.preventDefault(); dropHint(); if (zoomTo) closeNote(); turn(yaw + (e.deltaY + e.deltaX) * .0022); }, {passive: false});
layer.addEventListener('keydown', e => {
  if (e.target.closest('#lcd')) return;
  if (e.key === 'Escape' && zoomTo) { closeNote(); layer.focus(); return; }
  if (locked || e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); dropHint(); if (zoomTo) closeNote();
  const cur = ((yawTo % TAU) + TAU) % TAU;
  const at = e.key === 'ArrowRight' ? STOPS.find(s => s > cur + .05) ?? TAU : [...STOPS].reverse().find(s => s < cur - .05) ?? STOPS[3] - TAU;
  yawTo += at - cur; if (still()) yaw = yawTo;
});
noteBtn.addEventListener('click', () => { dropHint(); if (zoomTo) { closeNote(); powerBtn.focus(); return; } noteOpened = true; yawTo = Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI; zoomTo = 1; if (still()) { yaw = yawTo; zoom = 1; } sfx('bloop'); live.textContent = 'The note says: ' + NOTE; });
powerBtn.addEventListener('click', () => { realPower.click(); });
// Keep the 3D dial's spin and sound here; tv.js owns channel selection and tuning.
const requestedChannel = new URLSearchParams(location.search).get('ch') || 'mominc';
const channelId = requestedChannel === 'sag' ? 'mominc' : requestedChannel;
const selectedChannel = window.MBS_CHANNELS?.channels?.find(c => c.id === channelId);
const dialLabel = selectedChannel
  ? `Channel dial. Currently channel ${selectedChannel.ch}, ${selectedChannel.name}. Tap or press Enter or Space for the next channel.`
  : 'Channel dial. Tap or press Enter or Space for the next channel.';
dialBtn.setAttribute('aria-label', dialLabel);
dialBtn.title = dialLabel;
let dialTo = -(Math.max(0, Number(selectedChannel?.ch) || 0)) * Math.PI / 7;
dial.rotation.z = dialTo;
dialBtn.addEventListener('click', () => { dialTo -= Math.PI / 7; sfx('click'); sharedDial?.click(); });
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
let raf = 0, running = false, failed = false, ready = false;
function failScene(error) {
  if (failed) return;
  failed = true; ready = false; running = false; cancelAnimationFrame(raf); restoreChannelNav();
  tv.dataset.off3d = 'failed'; // tv.js releases the power gate; the original TV remains usable.
  if (error) console.warn('3D off screen unavailable:', error);
}
renderer.debug.onShaderError = (gl, program) => failScene(gl.getProgramInfoLog(program) || 'WebGL shader failed');
renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); failScene('WebGL context lost'); });
renderer.domElement.addEventListener('webglcontextrestored', () => { failed = false; w = h = 0; sync(); });
function frame(now) {
  raf = requestAnimationFrame(frame);
  try {
  resize();
  const q = still() ? 1 : .12; yaw += (yawTo - yaw) * q; zoom += (zoomTo - zoom) * (still() ? 1 : .1);
  if (Math.abs(zoom - zoomTo) < .002) zoom = zoomTo;
  const {over, rear, a} = rig(), wrapped = Math.atan2(Math.sin(yaw), Math.cos(yaw)), front = Math.abs(wrapped) < .45;
  // Coach rises behind the monitor only while you look over its side, and ducks again when you turn away.
  const peek = wrapped < 0 ? over : 0; coachHolder.visible = !!coach && peek > .02;
  coachHolder.position.y = TOP - 1.45 + peek * 1.05 + (still() ? 0 : Math.sin(now / 380) * .03 * peek); coachHolder.rotation.z = still() ? 0 : Math.sin(now / 520) * .08;
  coach?.tick(now, {pressure: .5});
  // CRT: a dead flicker when power is pressed unwired, a faint hum once hotwired.
  const f = Math.max(0, 1 - (now - flick) / 450); screenMat.emissiveIntensity = (isHot() ? .06 + .03 * Math.sin(now / 300) : 0) + f * (Math.sin(now / 18) > 0 ? .55 : .1);
  // Spark burst.
  const s = (now - sparkAt) / 700; spark.intensity = s < 1 ? (1 - s) * 14 * (Math.random() * .6 + .4) : 0; copper.emissiveIntensity = s < 1 ? (1 - s) * 1.5 : 0;
  sparkBits.material.opacity = s < 1 ? 1 - s : 0;
  if (s < 1) { const p = sparkBits.geometry.attributes.position; for (let i = 0; i < 60; i++) { sparkVel[i].y -= .06; p.setXYZ(i, p.getX(i) + sparkVel[i].x * .016, p.getY(i) + sparkVel[i].y * .016, p.getZ(i) + sparkVel[i].z * .016); } p.needsUpdate = true; }
  renderLayers();
  if (failed) return;
  if (renderer.getContext().isContextLost()) { failScene('WebGL context lost'); return; }
  if (!ready) { ready = true; tv.dataset.off3d = 'on'; }
  note.visible = !noteGone || zoom > .05; // peels off as the camera pulls back
  const zoomed = zoom > .5;
  placeChannelNav(Math.abs(wrapped) < .22 && !zoomed);
  place(noteBtn, NOTE_POS, (zoomed ? .9 : 1.1) * NOTE_SIZE * pxPerUnit(NOTE_POS), front && !noteGone);
  place(powerBtn, POWER, .42 * pxPerUnit(POWER), front && !zoomed);
  place(dialBtn, DIAL, .6 * pxPerUnit(DIAL), front && !zoomed);
  dial.rotation.z += (dialTo - dial.rotation.z) * (still() ? 1 : .2);
  const back = rear > .85 && !isHot();
  wires.forEach(wr => place(wr.button, wr.end, 0, back));
  layer.classList.toggle('zoomed', zoomed); layer.classList.toggle('hot', isHot());
  } catch (error) { failScene(error); }
}
const ROOM = new Set([floor, doorway]);
function renderLayers() {
  const vis = scene.children.map(c => c.visible), bg = scene.background;
  try {
    scene.children.forEach(c => { if (!c.isLight) c.visible = ROOM.has(c); });
    renderer.setRenderTarget(roomTarget); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(blurScene, blurCamera);
    scene.children.forEach((c, i) => { c.visible = vis[i] && !ROOM.has(c); });
    scene.background = null; renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera);
  } finally {
    renderer.setRenderTarget(null); renderer.autoClear = true;
    scene.children.forEach((c, i) => { c.visible = vis[i]; }); scene.background = bg;
  }
}
function sync() {
  const on = tv.dataset.state === 'off';
  if (on && !running && !failed) { relock(); hint.hidden = locked; running = true; w = h = 0; raf = requestAnimationFrame(frame); }
  if (!on && running) { running = false; ready = false; cancelAnimationFrame(raf); renderer.setSize(1, 1, false); roomTarget.setSize(1, 1); // free the framebuffer while the TV runs
    restoreChannelNav();
    if (zoomTo) closeNote(); zoom = 0; if (hot && !armieDone()) try { localStorage.setItem(LOCK_KEY, '1'); } catch {} }
}
addEventListener('mbs:page-complete', () => running && relock());
new MutationObserver(sync).observe(tv, {attributes: true, attributeFilter: ['data-state']});
sync();
// test hook: the check script drives the camera without simulating drags
window.MBS_OFF3D = {setYaw: turn, get locked() { return locked; }, get noteGone() { return noteGone; }, relock, get yaw() { return yaw; }, hotwire: () => hotwire(performance.now()), get hot() { return isHot(); }};
