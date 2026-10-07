import { createTransitionVeil } from "./transition-veil.js?objects=12";
import * as THREE from "./vendor/three.module.js?objects=12";
import { createWorld, createMagnifier } from "./world.js?objects=12";
import { createTraveler, createClayHand } from "./rig.js?objects=12";
import { ROOM_COPY } from "./room-copy.js?objects=12";
import { EXHIBITS, ENDING, SMALL_HAND_ENDING } from "./content.js?objects=12";
import { createRouteSampler } from "./room-routes.js?objects=12";
import { createSoundscape } from "./audio.js?objects=12";
import { createStudioEnvironment } from "./surfaces.js?objects=12";
import { theftShots, probeShots, commitShots } from "./choreography.js?objects=12";
import { Pipeline } from "./sakura/post.js?objects=12";
import { illustrate, disposeIllustrationRamps } from "./illustration.js?objects=12";

const $ = (id) => document.getElementById(id),
  lerp = THREE.MathUtils.lerp,
  clamp = THREE.MathUtils.clamp;
const smooth = (t) => t * t * (3 - 2 * t),
  v = (x, y, z) => new THREE.Vector3(x, y, z);
const renderer = new THREE.WebGLRenderer({
  canvas: $("world"),
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(
  Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.75),
);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.12;
const scene = new THREE.Scene();
const studioEnvironment = createStudioEnvironment(THREE, renderer);
scene.environment = studioEnvironment.texture;
scene.environmentIntensity = 0.5;
scene.background = new THREE.Color("#dce6ee");
scene.fog = new THREE.Fog("#dce6ee", 25, 65);
scene.add(new THREE.HemisphereLight("#dcecff", "#b6a6c6", 1.12));
const sun = new THREE.DirectionalLight("#fff1d8", 2.0);
sun.position.set(-4, 9, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(
  innerWidth < 700 ? 1024 : 2048,
  innerWidth < 700 ? 1024 : 2048,
);
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -35;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.035;
sun.shadow.radius = 3;
scene.add(sun);
const skyFill = new THREE.DirectionalLight("#a9bdf5", .85);
skyFill.position.set(8, 6, -12);
scene.add(skyFill);
const fill = new THREE.PointLight("#b890f6", 12, 20);
fill.position.set(0, 3, -23);
scene.add(fill);
const camera = new THREE.PerspectiveCamera(
  54,
  innerWidth / innerHeight,
  0.012,
  100,
);
camera.rotation.order = "YXZ";
const world = createWorld(THREE);
const illustratedDisposers = [illustrate(world.gallery), ...Object.values(world.rooms).map(illustrate)];
const roomOrder = world.roomOrder;
const roomKeys = ["gallery", ...roomOrder];
for (const key of roomKeys) scene.add(world[key]);
const routes = createRouteSampler(THREE, world.roomMetadata);
// LB2: every room hangs its name (and scale) from chains just inside the entrance.
function hangSign(parent, [name, scale], at, heading) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 340;
  const g = c.getContext("2d");
  g.fillStyle = "#eed8ac";
  g.fillRect(0, 0, 1024, 340);
  g.strokeStyle = "#873db9";
  g.lineWidth = 14;
  g.strokeRect(14, 14, 996, 312);
  g.fillStyle = "#3a2548";
  g.textAlign = "center";
  g.font = "700 118px 'Space Grotesk',sans-serif";
  g.textBaseline = "middle";
  let size = 118;
  while (g.measureText(name).width > 900 && size > 40) g.font = `700 ${(size -= 6)}px 'Space Grotesk',sans-serif`;
  g.fillText(name, 512, 135);
  g.fillStyle = "#873db9";
  size = 60;
  g.font = `600 ${size}px 'Space Grotesk',sans-serif`;
  while (g.measureText(scale).width > 900 && size > 28) g.font = `600 ${(size -= 4)}px 'Space Grotesk',sans-serif`;
  g.fillText(scale, 512, 252);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Group();
  sign.name = "hanging-room-sign";
  const w = 1.8, h = w * 340 / 1024;
  sign.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide })));
  const chain = new THREE.MeshBasicMaterial({ color: "#3a2548" });
  for (const x of [-w / 2 + .1, w / 2 - .1]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 3, 6), chain);
    rod.position.set(x, h / 2 + 1.5, 0);
    sign.add(rod);
  }
  sign.position.copy(at);
  sign.rotation.y = heading;
  parent.add(sign);
}
const visited = [];
const completedEntrances = [];
const sound = createSoundscape();
let muted = false,
  atomicPrompted = false,
  stepDistance = 0,
  routeVelocity = 0,
  recoveredReady = false;
const traveler = createTraveler(THREE);
scene.add(traveler.group);
const thief = createClayHand(THREE);
illustratedDisposers.push(illustrate(traveler.group), illustrate(thief.group));
scene.add(thief.group);
thief.group.visible = false;
let magnifier = createMagnifier(THREE);
const disposeMagnifiers = [magnifier.userData.dispose];
traveler.grip.add(magnifier);
magnifier.position.set(0, .214, .015);
const orangeLight = new THREE.PointLight("#ff932e", 7, 8);
orangeLight.position.set(0, 1.5, -16.5);
scene.add(orangeLight);
orangeLight.visible = false;
const contactGeometry = new THREE.RingGeometry(0.12, 0.155, 48);
const contactMaterial = new THREE.MeshBasicMaterial({
  color: "#cf9eff",
  transparent: true,
  opacity: 0,
  side: THREE.DoubleSide,
  depthWrite: false,
  toneMapped: false,
});
const contactRing = new THREE.Mesh(contactGeometry, contactMaterial);
contactRing.visible = false;
contactRing.renderOrder = 5;
scene.add(contactRing);
function fieldContact(point, strength) {
  contactRing.visible = strength > 0.01;
  contactRing.position.copy(point);
  contactRing.scale.setScalar(1 + strength * 0.35);
  contactMaterial.opacity = strength * 0.55;
}
let state = "intro",
  room = "gallery",
  route = 0,
  targetRoute = 0,
  paused = false,
  inspecting = false,
  inspected = -1,
  returned = false,
  sequence = null,
  elapsed = 0,
  pitch = 0,
  targetPitch = 0,
  yaw = 0,
  targetYaw = 0,
  heldMove = 0,
  touch = null,
  hasStarted = false;
const reducedMotion =
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  new URLSearchParams(location.search).get("motion") === "reduce";
let tiny = false;
const defaultLeft = traveler.leftHand.position.clone(),
  defaultLeftRotation = traveler.leftHand.rotation.clone();
const roomNames = {
  gallery: ["THE GALLERY", "HUMAN SCALE"],
  ...Object.fromEntries(
    roomOrder.map((id) => [
      id,
      [world.roomMetadata[id].label, world.roomMetadata[id].scale],
    ]),
  ),
};
const signPos = {}, signsRead = new Set();
hangSign(world.gallery, roomNames.gallery, v(0, 2.7, -4.5), 0);
for (const id of roomOrder) {
  const p = routes.sample(id, 4.5);
  signPos[id] = p.position.clone().setY(2.7);
  hangSign(world[id], roomNames[id], signPos[id], p.heading);
}
function eyeAt(id, distance) {
  return routes
    .sample(id, distance)
    .position.clone()
    .add(v(0, 1.55, 0));
}
scene.add(camera);
function frameLens(blend=1) {
  if (magnifier.parent !== camera) camera.attach(magnifier);
  const d=.64, halfHeight=Math.tan(camera.fov*Math.PI/360)*d*.985;
  magnifier.position.set(0,-.65*(1-blend),-d);
  magnifier.rotation.set(0,0,0);
  magnifier.scale.set(halfHeight*camera.aspect/.24,halfHeight/.24,1);
  magnifier.visible=true;
  camera.updateMatrixWorld(true);
  const handPoint=camera.localToWorld(v(halfHeight*camera.aspect*.72,-halfHeight*.90,-d+.06));
  traveler.group.updateMatrixWorld(true);
  traveler.rightHand.position.copy(traveler.group.worldToLocal(handPoint));
  traveler.rightHand.quaternion.copy(traveler.group.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(camera.getWorldQuaternion(new THREE.Quaternion())));
  traveler.solveLimbs?.();
}
function lowerLens() {
  if (magnifier.parent !== camera) return;
  traveler.grip.add(magnifier);magnifier.position.set(0,.214,.015);
  magnifier.rotation.set(0,0,0);magnifier.scale.setScalar(1);
}
function placeExplorer() {
  const pose = routes.sample(room, route);
  traveler.group.position.copy(pose.position);
  traveler.group.rotation.y = pose.heading + yaw;
  camera.position.copy(pose.position).add(v(0, 1.55, 0));
  camera.rotation.set(pitch, pose.heading + yaw, 0, "YXZ");
  if (inspecting && room === "gallery") {
    const ex = world.exhibits[inspected];
    const finalOffer = inspected === 5 && !returned;
    const focus = finalOffer ? ex.inspectionPosition.clone() : ex.position.clone().add(v(0,0,.16));
    const normal = finalOffer ? v(0,0,1) : v(0,0,1).applyQuaternion(ex.group.quaternion);
    const distance = finalOffer ? 1.7 : 2.0;
    const eye = focus.clone().addScaledVector(normal,distance);
    const blend = reducedMotion ? 1 : smooth(clamp((elapsed-inspectionStarted)/.35,0,1));
    const original = camera.quaternion.clone();
    camera.position.lerp(eye,blend);camera.lookAt(focus);
    const aimed = camera.quaternion.clone();camera.quaternion.copy(original).slerp(aimed,blend);
    frameLens(blend);
  }
  traveler.setViewHeight?.((camera.position.y-traveler.group.position.y)/traveler.group.scale.y);

}
let inspectionStarted = 0;
const sequenceLog = [];
// One text-only prompt (LB5). contextPrompt() picks the options for the moment.
let promptActions = [],
  promptKey = "";
function setPrompt(opts) {
  promptActions = opts;
  const key = opts.map((o) => o.text).join("|");
  if (key === promptKey) return;
  promptKey = key;
  $("prompt").classList.toggle("show", opts.length > 0);
  if (opts.length)
    $("prompt").replaceChildren(
      ...opts.map((o) => {
        const b = document.createElement("button");
        b.textContent = o.text;
        b.onclick = o.fn;
        return b;
      }),
    );
}
function contextPrompt() {
  if (state === "choice1") return [{ text: "tap to reach in", fn: probe }];
  if (state === "fieldIn") return [{ text: "tap to pull back", fn: pullBack }];
  if (state === "choice2")
    return [
      { text: "enter again", fn: () => { field.clear(); commit(); } },
      { text: "leave", fn: () => { field.clear(); refuse(); } },
    ];
  if (state !== "explore" || sequence || paused) return [];
  if (inspecting)
    return room === "gallery" && inspected === 5 && !returned
      ? [{ text: "tap to continue", fn: theft }]
      : [];
  if (room === "gallery")
    return nearestExhibit() >= 0 ? [{ text: "tap to inspect", fn: inspect }] : [];
  if (room === "atomicRoom") {
    if (camera.position.distanceTo(magnifier.position) < 1.5)
      return [{ text: "tap to step through", fn: inspect }];
    return nearSign() ? [{ text: "tap to read", fn: inspect }] : [];
  }
  if (nearWelcome()) return [{ text: "tap to enter", fn: inspect }];
  return nearSign() ? [{ text: "tap to read", fn: inspect }] : [];
}
function caption(text) {
  $("caption").textContent = text;
}
const quips = {
  boxRoom: "Whoa. Okay. That box is huge now.",
  jarRoom: "Wait. Is that a jar? It is a whole building.",
  pencilRoom: "A pencil. A PENCIL. It is a skyscraper. What?",
  matchRoom: "That is a matchstick. Why is it so big? I am so small!",
  spoolRoom: "I am standing on thread. THREAD. How is this my life?",
  fiberRoom: "Those are fuzz bits. I can see the fuzz. This is NOT okay!",
  atomicRoom: "Atoms. Cool. Is that it? ...I'm kind of bored.",
};
const quipped = new Set();
let quipTimers = [];
function quip(key) {
  const text = quips[key];
  if (!text || quipped.has(key)) return;
  quipped.add(key);
  quipTimers.forEach(clearTimeout);
  const el = $("subtitle");
  el.classList.remove("show");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const later = (fn, ms) => quipTimers.push(setTimeout(fn, ms));
  later(() => {
    caption("Little Boyfriend: " + text);
    el.lastChild.textContent = "";
    el.classList.add("show");
    let i = 0;
    const type = () => {
      i = reduced ? text.length : i + 1;
      el.lastChild.textContent = text.slice(0, i);
      if (i < text.length) later(type, 40);
      else later(() => el.classList.remove("show"), 5000);
    };
    type();
  }, 800);
}
function setState(next) {
  heldMove = 0;
  touch = null;
  targetYaw = yaw = 0;
  targetPitch = pitch = 0;
  state = next;
  document.body.classList.toggle("locked", next === "sequence");
  $("controls").hidden = ["intro", "ending"].includes(next);
  $("controls").classList.toggle("idle", next !== "explore");
  sequenceLog.push(next);
}
function showRoom(key) {
  room = key;
  for (const k of roomKeys) world[k].visible = k === key;
  orangeLight.visible = key === "atomicRoom";
  fill.visible = key === "gallery";
  sound.setRoom(key);
  quip(key);
  atomicPrompted = false;
  scene.background.set(
    world.roomMetadata[key]?.background ||
      (key === "atomicRoom" ? "#170d2a" : "#dce6ee"),
  );
  scene.fog.color.copy(scene.background);
  const visualDepth=world.roomMetadata[key]?.visualDepth || (key === "atomicRoom" ? 132 : 48);
  scene.fog.near = key === "atomicRoom" ? 45 : 20;
  scene.fog.far = visualDepth;
  camera.far = Math.max(100,visualDepth*1.25);
  camera.updateProjectionMatrix();
}
function closeHolo() {
  lowerLens();
  inspecting = false;
  $("hologram").hidden = true;
  $("hologram").classList.remove("sign-card");
  const welcome = world.roomMetadata[room]?.welcome;
  if (welcome) welcome.mug.position.y = welcome.baseY;
  $("hologram").querySelector(".advert").hidden = false;
}
function nearWelcome() {
  const gift = world.roomMetadata[room]?.welcome;
  return gift && camera.position.distanceTo(v(...gift.position)) < 3
    ? gift
    : null;
}
function readWelcome(gift) {
  const ex = EXHIBITS.find((item) => item.id === gift.exhibit);
  inspecting = true;
  gift.mug.position.y = gift.baseY + 0.48;
  $("holo-count").textContent = "MOM INC / WELCOME HOME GIFT";
  $("holo-title").textContent = "A note under your mug";
  $("holo-body").textContent = ex.body;
  $("holo-source").textContent = ex.sourceLabel;
  $("holo-source").href = ex.sourceUrl || "#";
  if (!ex.sourceUrl) $("holo-source").removeAttribute("href");
  $("holo-source").hidden = false;
  $("hologram").querySelector(".advert").hidden = true;
  $("hologram").hidden = false;
  $("hologram").setAttribute("aria-label", "Welcome-home note");
  $("hologram").classList.remove("lens-readout");
  caption("A welcome gift. Lift the mug to read the museum's practical note.");
}
function nearSign() {
  return room !== "gallery" && !signsRead.has(room) && signPos[room] && camera.position.distanceTo(signPos[room]) < 5.2;
}
function readSign() {
  inspecting = true;
  signsRead.add(room);
  $("holo-count").textContent = "";
  $("holo-title").textContent = roomNames[room][0];
  $("holo-body").textContent = ROOM_COPY[room].ad.replace(/^MOM FICTIONAL AD:\s*/, "");
  $("holo-source").textContent = "";
  $("holo-source").removeAttribute("href");
  $("holo-ad").textContent = "";
  $("hologram").querySelector(".advert").hidden = true;
  $("hologram").setAttribute("aria-label", "Room sign");
  $("hologram").classList.remove("lens-readout");
  $("hologram").classList.add("sign-card");
  $("hologram").hidden = false;
}
function nearestExhibit() {
  if (room !== "gallery") return -1;
  let best = -1,
    dist = 3.15;
  world.exhibits.forEach((ex, i) => {
    const d = Math.abs(ex.position.z - (1 - route));
    if (d < dist) {
      best = i;
      dist = d;
    }
  });
  return best;
}
function inspect() {
  if (state !== "explore") return;
  if (room !== "gallery") {
    if (inspecting) {
      closeHolo();
      return;
    }
    const gift = nearWelcome();
    if (gift) {
      readWelcome(gift);
      return;
    }
    if (nearSign()) {
      readSign();
      return;
    }
  }
  if (room === "atomicRoom") {
    if (camera.position.distanceTo(magnifier.position) < 1.5) returnHome();
    return;
  }
  if (room !== "gallery") return;
  const i = nearestExhibit();
  if (i < 0) return;
  if (inspecting) {
    if (inspected === 5 && !returned) theft();
    else closeHolo();
    return;
  }
  inspecting = true;
  inspectionStarted = elapsed;
  inspected = i;
  $("hologram").setAttribute("aria-label", "Magnifier hologram");
  $("hologram").classList.add("lens-readout");
  const ex = EXHIBITS[i];
  $("holo-count").textContent =
    `EXHIBIT ${String(i + 1).padStart(2, "0")} / 06`;
  $("holo-title").textContent =
    i === 5 && !returned ? "WHY LIVE LARGE?" : ex.title;
  $("holo-body").textContent =
    i === 5 && !returned
      ? "This micro-shrinker is super small. Your space is waiting. Your old life takes up too much room."
      : ex.body;
  $("holo-source").textContent = ex.sourceLabel || "Museum editorial checklist";
  $("holo-source").href = ex.sourceUrl || "#";
  $("holo-source").hidden = i === 5 && !returned;
  $("holo-ad").textContent = returned
    ? "Your surroundings may have changed. MOM thanks you for participating."
    : ex.ad;
  $("hologram").hidden = false;
  caption(
    i === 5 && !returned
      ? "The final display has nothing left to offer but shrinking."
      : "The lens opens a hologram. Practical advice, interrupted by an offer.",
  );
}
function putMagnifier(parent) {
  parent.attach(magnifier);
}
function freeMag(position, rotation = new THREE.Euler()) {
  scene.attach(magnifier);
  magnifier.position.copy(position);
  magnifier.rotation.copy(rotation);
  magnifier.scale.setScalar(1);
}
function poseCamera(position, look, groundedFoot = null) {
  camera.position.copy(position);
  camera.lookAt(look);
  if (groundedFoot) traveler.group.position.copy(groundedFoot);
  else traveler.group.position.set(position.x, Math.max(0, position.y - 1.55 * traveler.group.scale.y), position.z);
  traveler.group.rotation.y = camera.rotation.y;
  traveler.setViewHeight?.((camera.position.y-traveler.group.position.y)/traveler.group.scale.y);
}
function tweenVec(a, b, t) {
  return a.clone().lerp(b, smooth(clamp(t, 0, 1)));
}
const transitionVeil = createTransitionVeil(reducedMotion);
function runSequence(name, segments, onDone, cuts = null) {
  transitionVeil.clear();
  closeHolo();
  heldMove = 0;
  targetPitch = pitch = 0;
  targetYaw = yaw = 0;
  setState("sequence");
  sequence = {
    name,
    segments,
    index: -1,
    time: 0,
    onDone,
    total: segments.reduce((a, s) => a + s.duration, 0),
    cuts: cuts || (name === "enter-box"
      ? [1.1, segments.reduce((a, s) => a + s.duration, 0)]
      : name.startsWith("enter-")
        ? [segments.reduce((a, s) => a + s.duration, 0) - segments.at(-1).duration]
        : []),
  };
  updateSequence(0);
}
function updateSequence(dt) {
  if (!sequence) return;
  const seq = sequence;
  seq.time = Math.min(seq.total, seq.time + dt * (reducedMotion ? 2 : 1));
  let base = 0;
  for (let i = 0; i < seq.segments.length; i++) {
    const s = seq.segments[i],
      end = base + s.duration;
    if (seq.time <= end || i === seq.segments.length - 1) {
      if (seq.index !== i) {
        seq.index = i;
        seq.shot = null;
        s.enter?.();
      }
      s.update?.(clamp((seq.time - base) / s.duration, 0, 1));
      break;
    }
    if (seq.index < i) {
      seq.index = i;
      seq.shot = null;
      s.enter?.();
      s.update?.(1);
    } else if (seq.index === i) s.update?.(1);
    base = end;
  }
  transitionVeil.sample(seq.time, seq.cuts);
  if (seq.time >= seq.total) {
    sequence = null;
    seq.onDone();
  }
}
function firstChoice() {
  setState("choice1");
  caption("The hand waits. Your equipment does not belong to you.");
}
function theft() {
  if (state !== "explore" || inspected !== 5 || returned) return;
  route = targetRoute = 22.3;
  runSequence(
    "theft",
    theftShots({
      THREE,
      world,
      camera,
      traveler,
      thief,
      magnifier,
      poseCamera,
      caption,
      sound,
      freeMag,
      putMagnifier,
    }),
    firstChoice,
  );
}
// LB-RIG owns the hand while the field is active (reports/lb-rig-api.md).
const field = traveler.field;
// rest = the hand held close to the chest, so the reach is a short poke to the plane .43 m ahead.
field.set({ point: world.opening.probeBoundary, normal: v(0, 0, 1), onContact: fieldContact, rest: v(-.12, 1.0, -.22) });
addEventListener("lb:field-reached", () => { tiny = true; if (state === "field") setState("fieldIn"); });
addEventListener("lb:field-withdrawn", () => {
  if (state !== "field" && state !== "fieldIn") return;
  setState("choice2");
  caption("One hand has already made the trip.");
});
function probe() {
  runSequence("probe", probeShots({ THREE, world, camera, traveler, poseCamera, caption }), () => {
    setState("field");
    field.reachIn();
  });
}
function pullBack() {
  setState("field");
  field.pullBack();
}
function commit() {
  traveler.leftHand.position.copy(defaultLeft);
  traveler.leftHand.rotation.copy(defaultLeftRotation);
  runSequence(
    "enter-box",
    commitShots({ THREE, world, camera, traveler, poseCamera, caption, eyeAt }),
    () => {
      traveler.group.scale.setScalar(1);
      traveler.setTinyHand(false);
      thief.group.visible = false;
      magnifier.visible = false;
      world.boxRoom.scale.setScalar(1);
      world.boxRoom.position.set(0, 0, 0);
      showRoom("boxRoom");
      if (!visited.includes("boxRoom")) visited.push("boxRoom");
      route = targetRoute = 0;
      setState("explore");
      placeExplorer();
      caption(
        "A folded box is your first home. Follow the bend toward the broken jar.",
      );
    },
  );
}
function setupRecovered() {
  if (!recoveredReady) {
    for (const child of [...magnifier.children]) magnifier.remove(child);
    const recovered = createMagnifier(THREE, { metal: true });
    disposeMagnifiers.push(recovered.userData.dispose);
    for (const child of [...recovered.children]) magnifier.add(child);
    recoveredReady = true;
  }
  world.atomicRoom.add(magnifier);
  magnifier.name = "recovered-MOM-magnifier";
  magnifier.visible = true;
  magnifier.rotation.set(0, 0, 0);
  magnifier.position.fromArray(
    world.roomMetadata.atomicRoom.artifactPosition || [0, 1.5, -17],
  );
  magnifier.scale.setScalar(2.3);
  orangeLight.position.copy(magnifier.position).add(v(0, 0, 0.5));
}
function transitionRoom(next) {
  const from = room,
    portal = world.roomMetadata[from].portal;
  const start = camera.position.clone(),
    approach = v(...portal.approach),
    target = v(...portal.target),
    look = v(...portal.look);
  const ladder = portal.kind.includes("ladder"),
    segments = [];
  // Keep the eye outside the leaning rungs while the hands reach them.
  if (ladder) start.z += 1;
  const miniatureLook = (goal) =>
    goal.clone().add(routes.sample(next, 0).tangent.multiplyScalar(0.26));
  const previewNext = (goal) => {
    const interior = world[next];
    interior.scale.setScalar(0.13);
    interior.position.copy(goal).sub(eyeAt(next, 0).multiplyScalar(0.13));
    interior.visible = true;
    interior.updateMatrixWorld(true);
    if (next === "atomicRoom") setupRecovered();
  };
  segments.push({
    duration: 0.75,
    enter() {
      caption(portal.caption);
      sound.cue(portal.kind);
    },
    update() {
      poseCamera(start, ladder ? v(0, 3.6, -19.2) : target);
    },
  });
  if (ladder) {
    const ladderData = portal.ladder || {
      centerZ: -19.2,
      bottomOffset: 2.55,
      topOffset: 1.75,
      height: 3.8,
    };
    const railZ = (y) =>
      ladderData.centerZ +
      lerp(
        ladderData.bottomOffset,
        ladderData.topOffset,
        y / ladderData.height,
      );
    const ladderFoot = v(0, 1.55, railZ(0) + 0.6),
      aboveRim = v(0, 4.35, railZ(2.8) + 0.6);
    segments.push({
      duration: 1,
      update(t) {
        poseCamera(tweenVec(start, ladderFoot, t), v(0, 3.7, -17.6));
      },
    });
    segments.push({
      duration: 2.3,
      enter() {
        caption(
          "One felt hand, then the other. Up the ladder and over the cup rim.",
        );
      },
      update(t) {
        traveler.group.scale.setScalar(1);
        poseCamera(tweenVec(ladderFoot, aboveRim, t), v(0, 3.6, -19.2));
        traveler.group.updateMatrixWorld(true);
        const foot = traveler.group.position.y;
        const handPose = (hand, sign) => {
          const y = Math.min(
            3.68,
            foot + 1.08 + Math.sin(t * 24 + sign) * 0.12,
          );
          hand.position.copy(
            traveler.group.worldToLocal(v(sign * 0.43, y, railZ(y) + 0.01)),
          );
        };
        handPose(traveler.leftHand, -1);
        handPose(traveler.rightHand, 1);
      },
    });
    segments.push({
      duration: 1.3,
      enter() {
        caption("The ladder continues down inside the cup.");
      },
      update(t) {
        traveler.group.scale.setScalar(lerp(1, 0.13, smooth(t)));
        poseCamera(tweenVec(aboveRim, target, t), look);
      },
    });
    const inside = target.clone();
    inside.y = 0.7;
    segments.push({
      duration: 1.1,
      enter() {
        previewNext(inside);
      },
      update(t) {
        poseCamera(
          tweenVec(target, inside, t),
          tweenVec(inside.clone().add(v(0, 0, -1)), miniatureLook(inside), t),
        );
      },
    });
  } else {
    segments.push({
      duration: 1.3,
      update(t) {
        traveler.group.scale.setScalar(lerp(1, portal.kind === "recorder-grille" ? 0.13 : 0.32, smooth(t)));
        poseCamera(tweenVec(start, approach, t), target);
        traveler.leftHand.position.copy(
          tweenVec(defaultLeft, v(-0.25, 1.15, -0.6), t),
        );
      },
    });
    segments.push({
      duration: 1.8,
      enter() {
        previewNext(target);
        caption(
          "The edges grow around you. Through the opening, into a smaller home.",
        );
      },
      update(t) {
        traveler.group.scale.setScalar(lerp(portal.kind === "recorder-grille" ? 0.13 : 0.32, 0.13, smooth(t)));
        poseCamera(
          tweenVec(approach, target, t),
          tweenVec(look, miniatureLook(target), t),
        );
      },
    });
  }
  // A physical threshold shot precedes this coordinate rebase. The next shot
  // reveals its matching interior edge, rather than a generic portal cutout.
  segments.push({
    duration: 0.7,
    enter() {
      traveler.group.scale.setScalar(1);
      traveler.leftHand.position.copy(defaultLeft);
      traveler.setTinyHand(false);
      world[next].scale.setScalar(1);
      world[next].position.set(0, 0, 0);
      showRoom(next);
      route = targetRoute = 0;
      if (!visited.includes(next)) visited.push(next);
      completedEntrances.push({ from, to: next, kind: portal.kind });
      if (next === "atomicRoom") setupRecovered();
    },
    update(t) {
      const eye = eyeAt(next, 0);
      const onward = eye
        .clone()
        .add(routes.sample(next, 0).tangent.multiplyScalar(2));
      poseCamera(eye, onward);
    },
  });
  runSequence(`enter-${next}`, segments, () => {
    setState("explore");
    placeExplorer();
    caption(
      next === "atomicRoom"
        ? "The familiar orange glass is ahead. Move close, then touch it."
        : world.roomMetadata[next].portal.caption,
    );
  });
}
function returnHome() {
  if (state !== "explore" || returned || room !== "atomicRoom") return;
  const start = camera.position.clone(),
    touchLocal = traveler.group.worldToLocal(magnifier.position.clone());
  touchLocal.z += 0.03;
  const segments = [
    {
      duration: 0.9,
      enter() {
        caption("You reach out and touch the orange glass.");
        sound.cue("orange-return");
      },
      update(t) {
        traveler.leftHand.position.copy(tweenVec(defaultLeft, touchLocal, t));
        camera.lookAt(magnifier.position);
      },
    },
    {
      duration: 0.9,
      enter() {
        caption("The glass remembers your size.");
        document.body.classList.add("flash");
      },
      update(t) {
        document.body.style.setProperty(
          "--flash",
          String(reducedMotion ? 0.2 : Math.sin((t * Math.PI) / 2)),
        );
        magnifier.scale.setScalar(2.3 + 2 * t);
        poseCamera(
          tweenVec(start, magnifier.position, t),
          magnifier.position.clone().add(v(0, 0, -1)),
        );
      },
    },
  ];
  const reverse = [...visited].reverse();
  const legs = reverse.map(id => ({id,distance:id === "atomicRoom" ? route : routes.length(id)}));
  const totalDistance = legs.reduce((sum,leg) => sum + leg.distance,0);
  let activeLeg=-1, boundaryOffset=v(0,0,0), boundaryRotation=camera.quaternion.clone();
  segments.push({
    duration: reducedMotion ? .35 : 4.6,
    enter(){
      document.body.classList.remove("flash");magnifier.visible=false;
      traveler.group.scale.setScalar(1);traveler.leftHand.position.copy(defaultLeft);
      caption("The smaller worlds rush backwards around you.");
    },
    update(t){
      if(reducedMotion)return;
      let distance=t*totalDistance,index=0;
      while(index<legs.length-1 && distance>legs[index].distance){distance-=legs[index].distance;index++;}
      const leg=legs[index],d=Math.max(0,leg.distance-distance);
      if(activeLeg!==index){
        activeLeg=index;
        boundaryOffset.copy(camera.position).sub(eyeAt(leg.id,leg.distance));
        boundaryRotation.copy(camera.quaternion);showRoom(leg.id);
      }
      // Translate the incoming room to meet the outgoing eye, then continuously
      // rebase it while reversing. No room boundary resets the camera position.
      const progress=leg.distance>0?distance/leg.distance:1;
      world[leg.id].position.copy(boundaryOffset).multiplyScalar(1-progress);
      const eye=eyeAt(leg.id,d).add(world[leg.id].position),look=eye.clone().add(routes.sample(leg.id,d).tangent.multiplyScalar(2));
      poseCamera(eye,look);
      const desired=camera.quaternion.clone();
      camera.quaternion.copy(boundaryRotation).slerp(desired,clamp(progress/.12,0,1));
    },
  });
  const galleryStart=v(0,1.55,-21.5),galleryEnd=v(0,1.55,1);
  let galleryOrigin=galleryStart.clone(),galleryRotation=camera.quaternion.clone();
  segments.push({
    duration: reducedMotion ? .6 : 2.6,
    enter(){
      galleryOrigin.copy(camera.position);galleryRotation.copy(camera.quaternion);
      world.gallery.position.copy(galleryOrigin).sub(galleryStart);
      returned=true;world.setReturned(true);showRoom("gallery");caption("The same promises. Six changed photographs.");
    },
    update(t){
      world.gallery.position.copy(galleryOrigin).sub(galleryStart).multiplyScalar(1-t);
      const eye=galleryStart.clone().lerp(galleryEnd,t).add(world.gallery.position);
      const progress=t*(world.exhibits.length-1),index=Math.max(0,world.exhibits.length-1-Math.floor(progress));
      const next=Math.max(0,index-1),blend=progress%1;
      const photo=world.exhibits[index].position.clone().lerp(world.exhibits[next].position,blend).add(world.gallery.position);
      const look=photo.lerp(v(0,1.55,-12),Math.max(0,(t-.88)/.12));
      poseCamera(eye,look);
      const desired=camera.quaternion.clone();camera.quaternion.copy(galleryRotation).slerp(desired,clamp(t/.08,0,1));
    },
  });
  let coveredDistance = 0;
  const returnCuts = [1.8];
  for (const leg of legs.slice(0, -1)) {
    coveredDistance += leg.distance;
    returnCuts.push(1.8 + segments[2].duration * coveredDistance / totalDistance);
  }
  returnCuts.push(1.8 + segments[2].duration);
  runSequence("orange-return", segments, () => {
    route = targetRoute = 0;
    for (const key of roomKeys) world[key].position.set(0,0,0);
    traveler.setTinyHand(false);
    tiny = false;
    traveler.leftHand.position.copy(defaultLeft);
    traveler.group.scale.setScalar(1);
    traveler.grip.add(magnifier);
    magnifier.position.set(0, .214, .015);
    magnifier.rotation.set(0, 0, 0);
    magnifier.scale.setScalar(1);
    magnifier.visible = true;
    const pane = magnifier.getObjectByName("magnifier-pane");
    if (pane) { pane.material.color.set("#e5d7ff"); pane.material.opacity = .08; }
    setState("explore");
    window.MBS?.unlock?.("lilboyfriend");
    window.MBS?.complete?.("lilboyfriend", { terminal: "orange-glass" });
    window.scrollTo(0, 0);
    placeExplorer();
    caption("Welcome back to the Museum of Living Small.");
  }, returnCuts);
}
function refuse() {
  if (state !== "choice1" && state !== "choice2") return;
  closeHolo();
  $("ending-copy").textContent = tiny ? SMALL_HAND_ENDING : ENDING;
  caption("You sigh.");
  sound.cue("sigh");
  runSequence(
    "leave",
    [
      {
        duration: 1.4,
        enter() {
          $("ending").hidden = false;
          $("ending").style.opacity = "0";
          $("ending-copy").style.visibility = "hidden";
          $("restart").style.visibility = "hidden";
        },
        update(t) {
          $("ending").style.opacity = String(smooth(t));
        },
      },
    ],
    () => {
      setState("ending");
      $("ending-copy").style.visibility = "visible";
      $("restart").style.visibility = "visible";
      caption("");
      $("restart").focus();
    },
  );
}
function movement(delta) {
  if (state !== "explore" || inspecting || paused) return;
  targetRoute = clamp(targetRoute + delta, 0, routes.limit(room));
}
$("start").onclick = () => {
  hasStarted = true;
  sound.start();
  $("intro").hidden = true;
  setState("explore");
  caption("The first photograph is ahead. Keep the borrowed lens close.");
};
$("hologram").onclick = () => {
  if (!(inspected === 5 && room === "gallery" && !returned)) closeHolo();
};
$("restart").onclick = () => location.reload();
for (const [id, dir] of [
  ["forward", 1],
  ["back", -1],
]) {
  $(id).addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try {
      $(id).setPointerCapture(e.pointerId);
    } catch {
      /* Capture may be unavailable after a browser gesture cancellation. */
    }
    if (state === "explore" && !paused) heldMove = dir;
  });
  $(id).addEventListener("pointerup", () => (heldMove = 0));
  $(id).addEventListener("pointercancel", () => (heldMove = 0));
}
addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    movement(clamp(e.deltaY * 0.008, -1.5, 1.5));
  },
  { passive: false },
);
addEventListener("keydown", (e) => {
  if (e.repeat && (e.key === "Enter" || e.code === "Space")) {
    e.preventDefault();
    return;
  }
  if (e.target.closest?.("button,a") && e.key === "Enter") return;
  if (["ArrowUp", "ArrowDown", " ", "ArrowLeft", "ArrowRight"].includes(e.key))
    e.preventDefault();
  if (e.code === "KeyE" && !e.repeat && promptActions.length === 1) promptActions[0].fn();
  if (state !== "explore" || paused) return;
  if (["ArrowUp", "KeyW"].includes(e.code)) heldMove = 1;
  if (["ArrowDown", "KeyS"].includes(e.code)) heldMove = -1;
  if (e.code === "ArrowLeft") targetYaw = clamp(targetYaw + 0.12, -1.05, 1.05);
  if (e.code === "ArrowRight") targetYaw = clamp(targetYaw - 0.12, -1.05, 1.05);
});
addEventListener("keyup", () => (heldMove = 0));
addEventListener("blur", () => {
  heldMove = 0;
});
$("world").addEventListener("pointermove", (e) => {
  if (state !== "explore" || paused) return;
  if (e.pointerType === "touch") {
    if (!touch) return;
    targetYaw = clamp(targetYaw - (e.clientX - touch.x) * 0.006, -1.1, 1.1);
    targetPitch = clamp(
      targetPitch - (e.clientY - touch.y) * 0.006,
      -1.52,
      0.5,
    );
    touch = { x: e.clientX, y: e.clientY };
  } else {
    targetYaw = (0.5 - e.clientX / innerWidth) * 1.75;
    targetPitch = clamp((0.5 - e.clientY / innerHeight) * 3.1, -1.52, 0.6);
  }
});
$("world").addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") {
    touch = { x: e.clientX, y: e.clientY };
    $("world").setPointerCapture(e.pointerId);
  }
});
let canvasPress = null;
$("world").addEventListener(
  "pointerdown",
  (e) => (canvasPress = { x: e.clientX, y: e.clientY }),
);
$("world").addEventListener("pointerup", (e) => {
  touch = null;
  if (!canvasPress) return;
  const moved = Math.hypot(
    e.clientX - canvasPress.x,
    e.clientY - canvasPress.y,
  );
  canvasPress = null;
  if (moved <= 14 && promptActions.length === 1) promptActions[0].fn();
});
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  pipeline.setSize(innerWidth, innerHeight);
}
const pipeline = new Pipeline(renderer, scene, camera, {pixelBudget: innerWidth < 700 ? 850000 : 2200000});
pipeline.ink.mat.uniforms.uStrength.value = .72;
pipeline.ink.mat.uniforms.uSens.value = .012;
pipeline.ink.mat.uniforms.uFadeStart.value = 18;
pipeline.ink.mat.uniforms.uFadeEnd.value = 45;
addEventListener("resize", resize);
resize();
showRoom("gallery");
camera.position.set(0, 1.55, 1);
traveler.group.position.set(0, 0, 1);
let running = true,
  frameId,
  previous = performance.now();
function updateFrame(dt) {
  if (!paused) {
    if (!sequence) transitionVeil.fade(dt);
    elapsed += dt;
    world.update(elapsed);
    traveler.update(
      elapsed,
      state === "explore" && Math.abs(route - targetRoute) > 0.03,
      inspecting,
    );
    if (sequence) {
      updateSequence(dt);
      traveler.solveLimbs?.();
    } else if (
      state === "explore" ||
      state === "intro" ||
      state === "returned"
    ) {
      if (state === "explore") {
        movement(heldMove * dt * 3);
        const previousRoute = route;
        const gap = targetRoute - route;
        const wishVelocity = clamp(gap * 7, -3.3, 3.3);
        routeVelocity = lerp(routeVelocity, wishVelocity, 1 - Math.exp(-dt * 14));
        const stride = Math.abs(routeVelocity * dt) < Math.abs(gap) ? routeVelocity * dt : gap;
        route += Math.sign(stride) === Math.sign(gap) ? stride : 0;
        if(Math.abs(gap)<.001) routeVelocity=0;
        stepDistance += Math.abs(route - previousRoute);
        if (stepDistance > 0.7) {
          sound.cue("footsteps");
          stepDistance = 0;
        }
        yaw = lerp(yaw, targetYaw, 1 - Math.exp(-dt * 8));
        pitch = lerp(pitch, targetPitch, 1 - Math.exp(-dt * 8));
      }
      placeExplorer();
      if (
        state === "explore" &&
        !returned &&
        room !== "gallery" &&
        room !== "atomicRoom" &&
        route > routes.limit(room) - 0.18
      ) {
        const next = roomOrder[roomOrder.indexOf(room) + 1];
        if (next) transitionRoom(next);
      }
    }
  }
  setPrompt(contextPrompt());
  const clipNear = state === "sequence" ? .012 : .08;
  if (camera.near !== clipNear) {
    camera.near = clipNear;
    camera.updateProjectionMatrix();
    pipeline.ink.mat.uniforms.uNear.value = clipNear;
  }
  pipeline.render();
}
function tick(now) {
  if (!running) return;
  const dt = Math.min((now - previous) / 1000, 0.25);
  previous = now;
  updateFrame(dt);
  frameId = requestAnimationFrame(tick);
}
frameId = requestAnimationFrame(tick);
// Inspectable state and deterministic sequence stepping for draft review.
window.museum = {
  snapshot: () => ({
    state,
    paused,
    fieldState: field.state,
    fieldDepth: field.depth,
    handScale: traveler.leftHand.scale.x,
    bodyRoot: traveler.group.position.toArray(),
    visibleBodyMeshes: traveler.group.children.filter(child => child.isMesh && child.visible).length,
    deviceBounds: (() => {
      magnifier.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
      const points=[];
      for(const x of [-.24,.24])for(const y of [-.24,.24])points.push(magnifier.localToWorld(v(x,y,0)).project(camera));
      return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};
    })(),
    room,
    route,
    targetRoute,
    returned,
    tiny,
    reducedMotion,
    inspected,
    sequence: sequence?.name,
    sequenceTime: sequence?.time,
    sequenceLog: [...sequenceLog],
    camera: camera.position.toArray(),
    heading: camera.rotation.y,
    routeLength: routes.length(room),
    routeLimit: routes.limit(room),
    progress: route / routes.limit(room),
    roomOrder: [...roomOrder],
    visited: [...visited],
    entrances: [...completedEntrances],
    nextRoom: roomOrder[roomOrder.indexOf(room) + 1],
    entranceKind: world.roomMetadata[room]?.portal.kind,
    deviceParent:
      magnifier.parent === scene || magnifier.parent === world.atomicRoom
        ? "world"
        : magnifier.parent === traveler.grip
          ? "felt-hand"
          : magnifier.parent === camera ? "view-lens" : magnifier.parent === thief.grip
            ? "clay-hand"
            : "other",
  }),
  reviewPause: (value=true) => {
    paused=Boolean(value);document.body.classList.toggle("paused",paused);sound.setPaused(paused);
    pipeline.render();
  },
  reviewSequenceTime: (seconds) => {
    if(sequence && seconds >= sequence.time) updateSequence(seconds-sequence.time);
    traveler.solveLimbs?.();pipeline.render();
  },
  advanceSequence: (seconds) => {
    if (sequence && !paused) updateSequence(seconds);
  },
  move: (delta) => movement(delta),
  reviewPosition: (value) => {
    if (state === "explore" && !inspecting) {
      route = targetRoute = clamp(value, 0, routes.limit(room));
    }
  },
  reviewProgress: (value) => {
    if (state === "explore" && !inspecting) {
      route = targetRoute = routes.limit(room) * clamp(value, 0, 1);
    }
  },
  reviewRoom: (id) => {
    if (roomOrder.includes(id)) {
      for (const key of roomOrder) {
        world[key].position.set(0, 0, 0);
        world[key].scale.setScalar(1);
      }
      closeHolo();
      sequence = null;
      returned = false;
      world.setReturned(false);
      showRoom(id);
      route = targetRoute = 0;
      traveler.group.scale.setScalar(1);
      traveler.leftHand.position.copy(defaultLeft);
      magnifier.visible = false;
      visited.splice(
        0,
        visited.length,
        ...roomOrder.slice(0, roomOrder.indexOf(id) + 1),
      );
      if (id === "atomicRoom") setupRecovered();
      $("intro").hidden = true;
      setState("explore");
      caption(
        world.roomMetadata[id]?.portal?.caption ||
          "Follow the clay path through this smaller world.",
      );
      placeExplorer();
    }
  },
  reviewFrame: (dt) => updateFrame(Math.min(dt, 0.25)),
  photoSources: () =>
    world.exhibits.map((ex) => {
      let src = "";
      ex.group.traverse((child) => {
        const value = child.material?.map?.image?.src;
        if (value?.includes("lilbf-")) src = value;
      });
      return src;
    }),
  renderInfo: () => ({
    calls: pipeline.sceneStats?.calls || 0,
    triangles: pipeline.sceneStats?.triangles || 0,
  }),
};
addEventListener("pagehide", () => {
  running = false;
  cancelAnimationFrame(frameId);
  for (const dispose of disposeMagnifiers) dispose?.();
  world.dispose();
  traveler.dispose();
  thief.dispose();
  sound.dispose();
  contactGeometry.dispose();
  contactMaterial.dispose();
  studioEnvironment.dispose();
  pipeline.dispose();
  for (const dispose of illustratedDisposers) dispose();
  disposeIllustrationRamps();
  renderer.dispose();
});

addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});
