/* tv/channels/djscratch.js - DJ Scratch, CH 3, the second channel converted to a module and the
   FIRST one with a play route (2.18, PLAN-r9 D.1.7). Same code that sat in an inline <script> at the
   bottom of djscratch.html, with one change made throughout: every listener, timer, interval,
   animation frame and the AudioContext are registered through the CONTEXT, so channel-runtime.js can
   release all of it. Nothing about what the channel does changed.

   WHY THIS CHANNEL WENT SECOND. 351 script lines and no three.js - the smallest fragment after
   mominc, measured rather than assumed - and unlike mominc it has a play route, which is the half of
   the conversion packet 9 deliberately did not touch. /play/djscratch/ has to run mount.js's
   ISOLATION pass (the ancestor-path reveal that hides the page furniture) BETWEEN the fragment being
   injected and this module's mount() being called, because a game that measures layout while it
   initialises must never see the advert around it. That is what opts.beforeMount in
   channel-runtime.js is for, and this is the channel that proves it.

   WHAT WAS ACTUALLY LEAKING, before this. An AudioContext and a 25 ms scheduler interval. The
   scheduler and the visualiser both guard on `dj.isConnected`, so they stop THEMSELVES once the
   channel is replaced - but the AudioContext does not close, and a closed-over interval that returns
   early is still an interval firing forty times a second for the life of the page. Change channel
   four times with the deck powered on and the old set is four dead audio graphs and four live
   timers. ctx.audio and ctx.interval end both.

   A DEFECT FOUND BY THE CONVERSION, fixed here. scratch() called requestAnimationFrame(loop) to
   "nudge the loop in case rAF was idle" - but loop() re-requests itself unconditionally while the
   record is not done, so rAF was never idle and the nudge started a SECOND concurrent chain. Every
   scratch doubled the chains, each one writing the same transform. `raf` is now the single-slot
   guard the original comment assumed it had. */

/* ---------------------------------------------------------------------------------------------
   THE HAND EDITOR. PLAN-r9 row 7.9 - "wire the supplied floating-hand.obj and .mtl as a hologram
   that changes style, lizard, rock, furry, human" - brought forward out of Stage 7 on Ian's
   instruction and landed HERE, in the customize card, in place of the four questions it used to ask.

   WHAT WENT, AND WHY THAT IS A FIX RATHER THAN A TRADE. The old card was a <select> and three free
   text inputs - colour, nails, powers - that were read by nothing, submitted nowhere, and answered
   with a joke. It asked a visitor to type into an advert. The racks that replaced it are preset
   radios, so the card now collects no free text at all, which is the same resolution the plan reached
   for GOON's card entry: a privacy problem that is removed rather than mitigated. Every pick drives
   the hologram, so the answers are visible instead of imagined - which is also C027, "produce a local
   preview card from hand type/colour/nails/powers", satisfied by the model itself and by #handSpec.

   WHY THERE IS A PARSER HERE AND NOT AN OBJLoader IMPORT. three.js's OBJLoader is an addon that does
   `import ... from "three"` - a bare specifier, which a browser resolves only through an import map,
   and this shell cannot supply one: tv.js re-creates channel <script> tags copying textContent, so
   the channel reaches three.js by dynamic import() precisely to avoid needing module plumbing in the
   shell. tools/prep_hand_obj.py strips the shipped model to bare `v` and `f a b c` triangles, and
   parsing exactly that is twenty lines. Fewer moving parts than an import map, and no second CDN.

   THE FALLBACK IS THE DEFAULT, exactly as it is on fuel. The racks are in the DOM and wired before
   three.js is asked for; #handStage stays display:none until a scene has actually rendered. No
   WebGL, no CDN, no JS module support - the card still works, still reads back the spec in words,
   and still gives the receipt. The 3D is an upgrade layered onto a working control, never the
   control itself.

   WHY THE LOAD IS DEFERRED. The model is 1.19 MB. It is fetched on the first IntersectionObserver
   hit on the customize card, not at mount, so a visitor who never scrolls that far never pays for
   it, and the render loop idles whenever the card is off screen. -------------------------------- */

const HAND_OBJ = "assets/floating-hand.obj";   // relative to the DOCUMENT: /tv/ directly, and the
const HAND_MTL = "assets/floating-hand.mtl";   // play route through its <base href="../../tv/">
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";

/* Being type is the SURFACE - how the light sits on it. Colour is the body. Both are visible at once
   on purpose: if being also set the hue, choosing a colour would silently overrule it and one of the
   two racks would look broken. `tint` null means "use the model's own skin tone from the .mtl". */
const BEINGS = {
  human:  { rough: 0.62, metal: 0.03, flat: false, tint: null,     glow: 0.12 },
  lizard: { rough: 0.24, metal: 0.35, flat: true,  tint: 0x2fbf7a, glow: 0.34 },
  furry:  { rough: 0.97, metal: 0.00, flat: false, tint: 0xc9773a, glow: 0.16 },
  rock:   { rough: 0.92, metal: 0.12, flat: true,  tint: 0x6d7284, glow: 0.10 },
};
const COLOURS = { gold: 0xffc94a, void: 0x3a1360, aura: 0xff2f7a, signal: 0x39ff9a };
/* scale is applied to each claw about its own base vertex; see clawBase() */
const NAILS = { trimmed: { scale: 0.55, hex: 0xf2e4c4 }, long: { scale: 1.0, hex: 0xffd36e }, talon: { scale: 1.75, hex: 0xd9e0ea } };
/* a power is an aura colour and how fast the hand turns itself over. Folding fitted sheets is, as
   advertised, almost no power at all. */
const POWERS = {
  telekinesis: { aura: 0x39c5ff, spin: 0.55 },
  fire:        { aura: 0xff6a2f, spin: 0.22 },
  sheets:      { aura: 0x39ff9a, spin: 0.05 },
  mom:         { aura: 0x7a2fc4, spin: 1.30 },
};

/* v / f only - the shipped model has no vt or vn (tools/prep_hand_obj.py). Vertex indices are global
   across the file and 1-based; each `o` block is kept separate so the five claws stay addressable. */
function parseOBJ(text) {
  const pos = [], parts = [];
  let part = null, mat = "skin";
  for (const line of text.split("\n")) {
    if (line.startsWith("v ")) { const p = line.split(/\s+/); pos.push(+p[1], +p[2], +p[3]); }
    else if (line.startsWith("o ")) { part = { name: line.slice(2).trim(), mat: mat, idx: [] }; parts.push(part); }
    else if (line.startsWith("usemtl")) { mat = line.split(/\s+/)[1]; if (part) part.mat = mat; }
    else if (line.startsWith("f ") && part) { const p = line.split(/\s+/); part.idx.push(+p[1] - 1, +p[2] - 1, +p[3] - 1); }
  }
  return { pos: pos, parts: parts };
}

/* Only the three Kd lines matter here; the model's own skin, nail and stump tones. */
function parseMTL(text) {
  const out = {};
  let name = null;
  for (const line of text.split("\n")) {
    const p = line.trim().split(/\s+/);
    if (p[0] === "newmtl") name = p[1];
    else if (p[0] === "Kd" && name) out[name] = (Math.round(p[1] * 255) << 16) | (Math.round(p[2] * 255) << 8) | Math.round(p[3] * 255);
  }
  return out;
}

/* One compact geometry per part, its indices remapped to only the vertices it uses. The alternative -
   48 geometries all indexing one shared 28,586-vertex position buffer - makes computeVertexNormals
   allocate a full-length normal array for each of them, 2.4 MB of it for triangles nobody draws. */
function partGeometry(THREE, pos, idx) {
  const seen = new Map(), xyz = [], local = new Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    const g = idx[i];
    let l = seen.get(g);
    if (l === undefined) { l = xyz.length / 3; seen.set(g, l); xyz.push(pos[g * 3], pos[g * 3 + 1], pos[g * 3 + 2]); }
    local[i] = l;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(xyz, 3));
  geo.setIndex(local);   // a plain array: three picks Uint16 or Uint32 by the largest index itself
  geo.computeVertexNormals();
  return geo;
}

/* ponytail: a claw grows by scaling UNIFORMLY about its base - the vertex of that claw nearest the
   hand's centre - so it gets bigger rather than strictly longer. Four lines instead of a per-finger
   axis and pivot. If C119's rigging ever lands, that is where real pivots belong. */
function clawBase(THREE, geo, centre) {
  const a = geo.attributes.position, best = new THREE.Vector3(), v = new THREE.Vector3();
  let bestD = Infinity;
  for (let i = 0; i < a.count; i++) {
    v.fromBufferAttribute(a, i);
    const d = v.distanceToSquared(centre);
    if (d < bestD) { bestD = d; best.copy(v); }
  }
  return best;
}

/* The one piece of module state, held for the same reason mominc holds its root: a WebGLRenderer,
   its geometries and its materials are NOT disposables the context knows about, and a browser drops
   the OLDEST WebGL context when a page opens too many - so four channel changes with this card
   visited would quietly cost the page its earlier contexts. `session` is the mount token: the model
   fetch and the three.js import both resolve long after mount() returns, and whatever comes back for
   a session that has already ended is disposed on arrival rather than attached to a dead fragment. */
let gl = null;
let session = null;

export default {
  mount(root, ctx) {
    session = {};
    const dj = root.matches("#dj") ? root : root.querySelector("#dj");
    if (!dj) return;
    // ids resolve INSIDE the channel now rather than against the whole document: only one channel is
    // mounted at a time so both find the same nodes, but scoping means a shell element can never be
    // picked up by a channel's id lookup.
    const byId = (id) => dj.querySelector("#" + id);

    // no stress gauge on this channel (data-gauge="off" hides the shell meter for DJ Scratch)

    // the buy button and the forms are in-character only; nothing is sold or sent
    ctx.on(byId("buyBtn"), "click", e => {
      const b = e.currentTarget; b.textContent = "MOM IS PROCESSING YOUR DEVOTION…"; b.disabled = true;
      ctx.timeout(() => { b.textContent = "THERE IS NO CHECKOUT. THERE NEVER WAS."; }, 1400);
    });
    ctx.on(byId("subForm"), "submit", e => {
      e.preventDefault();
      const b = byId("subBtn"); b.textContent = "NOTED ON THIS DEVICE ONLY. NOTHING WAS SENT AND NOBODY HEARD IT."; b.disabled = true;
      ctx.mbs && ctx.mbs.form && ctx.mbs.form("djscratch", { track: true });
    });
    // The customization card. In-character only, and now genuinely nothing to send: every control is
    // a preset radio, so there is no free text on this page to receive even if someone wired an
    // endpoint to it. The button is a receipt for a thing that already happened on screen.
    ctx.on(byId("orderForm"), "submit", e => {
      e.preventDefault();
      const b = byId("orderBtn"); b.textContent = "DRAWING UP YOUR HAND…"; b.disabled = true;
      ctx.timeout(() => { b.textContent = "THAT IS YOUR HAND. NOTHING WAS SENT AND NO FACTORY EXISTS."; }, 1500);
    });

    /* ---- the hand editor. The racks first, so they are live whatever happens to three.js ------- */
    const customize = byId("customize"), stage = byId("handStage"), spec = byId("handSpec");
    const orderForm = byId("orderForm");
    // one listener on the form, not four on the racks: change bubbles, and the radios are the state
    const picked = (name) => orderForm.querySelector('input[name="' + name + '"]:checked');
    const style = () => ({
      being: picked("being").value, colour: picked("color").value,
      nails: picked("nails").value, powers: picked("powers").value,
    });
    // the spec is read back off the labels themselves rather than a second copy of the words here,
    // so the card can be re-worded in the HTML alone and this cannot drift out of step with it
    const sayIt = () => {
      spec.textContent = "YOUR HAND: " + ["being", "color", "nails", "powers"]
        .map(n => picked(n).nextElementSibling.textContent.toLowerCase()).join(" / ") + ".";
    };
    let restyle = sayIt;   // replaced once (and if) a scene exists
    ctx.on(orderForm, "change", () => restyle());
    // The spec is NOT written at mount. On /play/djscratch/ the isolation pass hides the whole advert
    // and shows only the deck, so a write here goes into furniture the visitor cannot see - which is
    // exactly what check_play calls a hidden write, and it caught this. It is written when the card is
    // first approached instead, which is the only moment it can be read anyway.

    /* The 1.19 MB model is not fetched until the card is actually approached, and the render loop
       idles while it is off screen. One observer does both jobs. */
    let onScreen = false, asked = false;
    const io = new IntersectionObserver(entries => {
      onScreen = entries.some(en => en.isIntersecting);
      if (onScreen && !asked) { asked = true; sayIt(); buildHand(); }
    }, { rootMargin: "300px" });
    ctx.observe(io, customize);

    function buildHand() {
      const mine = session;
      Promise.all([
        import(/* @vite-ignore */ THREE_URL),
        fetch(HAND_OBJ).then(r => { if (!r.ok) throw new Error("obj " + r.status); return r.text(); }),
        fetch(HAND_MTL).then(r => r.ok ? r.text() : ""),
      ]).then(([THREE, objText, mtlText]) => {
        if (session !== mine) return;          // the channel was left while this was in flight
        const scene = buildScene(THREE, objText, mtlText, mine);
        if (scene) { restyle = scene; restyle(); }
      }).catch(err => {
        // the stage stays hidden and the racks above still work - see the fallback note at the top
        console.error("[dj] the hand editor could not load", err);
      });
    }

    function buildScene(THREE, objText, mtlText, mine) {
      const kd = parseMTL(mtlText);
      const model = parseOBJ(objText);
      if (!model.parts.length) throw new Error("the model parsed to nothing");

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch (e) {
        console.error("[dj] no WebGL context for the hand editor", e);   // racks carry on
        return null;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");   // the racks are the accessible control, not this
      stage.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 4 / 3, 0.1, 40);
      camera.position.set(0, 0, 2.45);
      // kept dim and near-neutral: a saturated sky light multiplies into the chosen colour and
      // the gold hand comes out green, which is what the first screenshot showed
      scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x2a0a44, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(1.4, 1.9, 2.2);
      scene.add(key);
      // The power's colour is a RIM: behind and above, so it edges the silhouette. In front of the
      // hand at this strength it simply repainted it - a gold hand under a cyan fill photographed
      // olive, and the colour rack looked broken when it was the lighting that was wrong.
      const aura = new THREE.PointLight(0x39c5ff, 3.2, 9, 2);
      aura.position.set(-1.7, 1.0, -1.6);
      scene.add(aura);

      const mats = {
        skin: new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.94 }),
        nail: new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.97, roughness: 0.18, metalness: 0.65 }),
        stump_flesh: new THREE.MeshStandardMaterial({ color: kd.stump_flesh != null ? kd.stump_flesh : 0x7c442f, roughness: 0.85, transparent: true, opacity: 0.94 }),
      };

      // the model's own bounds, taken before anything is moved, so the claw bases are found in the
      // same space the vertices are in
      const box = new THREE.Box3(), v = new THREE.Vector3();
      for (let i = 0; i < model.pos.length; i += 3) box.expandByPoint(v.set(model.pos[i], model.pos[i + 1], model.pos[i + 2]));
      const centre = box.getCenter(new THREE.Vector3());
      // Fit the bounding SPHERE, not the longest side: the hand turns, and a model framed by its
      // largest dimension swings its fingers out of shot the moment it does. The diagonal is the
      // sphere's diameter, so 1.35 against a visible height of 1.50 fits at every angle with margin.
      const span = box.getSize(new THREE.Vector3());
      const fit = 1.35 / span.length();

      // pivot is what rotates, model is what is centred and scaled: rotating a node that also carries
      // the centring offset would swing the hand around the model's origin instead of its own middle
      const pivot = new THREE.Group(), holo = new THREE.Group();
      holo.scale.setScalar(fit);
      holo.position.set(-centre.x * fit, -centre.y * fit, -centre.z * fit);
      pivot.add(holo);
      scene.add(pivot);

      const geoms = [], claws = [];
      for (const part of model.parts) {
        const geo = partGeometry(THREE, model.pos, part.idx);
        geoms.push(geo);
        const mesh = new THREE.Mesh(geo, mats[part.mat] || mats.skin);
        if (part.mat === "nail") {
          const base = clawBase(THREE, geo, centre);
          geo.translate(-base.x, -base.y, -base.z);
          mesh.position.copy(base);
          claws.push(mesh);
        }
        holo.add(mesh);
      }

      gl = { renderer: renderer, geoms: geoms, mats: Object.values(mats), canvas: canvas };
      customize.classList.add("has3d");

      /* ---- turning it over: one pointer handler, no OrbitControls addon ---- */
      let yaw = 0.6, pitch = -0.12, drag = null;
      ctx.on(canvas, "pointerdown", e => {
        drag = { x: e.clientX, y: e.clientY };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older pointer impls */ }
      });
      ctx.on(canvas, "pointermove", e => {
        if (!drag) return;
        yaw += (e.clientX - drag.x) * 0.011;
        pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - drag.y) * 0.011));
        drag = { x: e.clientX, y: e.clientY };
      });
      const letGo = () => { drag = null; };
      ctx.on(canvas, "pointerup", letGo);
      ctx.on(canvas, "pointercancel", letGo);

      /* ---- size from the stage's own box, never from a constant ---- */
      const resize = () => {
        const r = stage.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
      };
      ctx.observe(new ResizeObserver(resize), stage);
      resize();

      let spin = POWERS.telekinesis.spin, last = 0;
      function frame(t) {
        if (!gl || session !== mine) return;   // unmounted; ctx cancels the pending frame too
        ctx.frame(frame);
        const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
        last = t;
        if (!onScreen) return;                 // off screen: hold the frame, draw nothing
        if (!drag) yaw += spin * dt;
        pivot.rotation.set(pitch, yaw, 0);
        renderer.render(scene, camera);
      }
      ctx.frame(frame);

      /* ---- what a pick actually does ---- */
      return function apply() {
        const s = style();
        const b = BEINGS[s.being] || BEINGS.human;
        const n = NAILS[s.nails] || NAILS.long;
        const p = POWERS[s.powers] || POWERS.telekinesis;
        const flatChanged = mats.skin.flatShading !== b.flat;
        mats.skin.color.setHex(COLOURS[s.colour] != null ? COLOURS[s.colour] : COLOURS.gold);
        mats.skin.roughness = b.rough;
        mats.skin.metalness = b.metal;
        mats.skin.flatShading = b.flat;
        mats.skin.emissive.setHex(b.tint === null ? (kd.skin != null ? kd.skin : 0xc6a982) : b.tint);
        mats.skin.emissiveIntensity = b.glow;
        // only a shader-recompiling change needs this; colours and roughness do not
        if (flatChanged) mats.skin.needsUpdate = true;
        mats.nail.color.setHex(n.hex);
        mats.nail.emissive.setHex(n.hex);
        mats.nail.emissiveIntensity = 0.22;
        claws.forEach(c => c.scale.setScalar(n.scale));
        aura.color.setHex(p.aura);
        spin = p.spin;
        sayIt();
      };
    }

    // THE TURNTABLE. The record spins forever; scratching the hand halts it and jolts it back.
    // Kept for feel only (Ian: "the scratching is good") - it no longer gates anything. The rack below does.
    const deck = byId("deck"), platter = byId("platter");
    const hand = byId("scratchHand"), tuner = dj.querySelector(".tuner"), tunerText = byId("tunerText");
    const marks = [byId("s1"), byId("s2"), byId("s3")];
    const hint = byId("deckHint"), sigLbl = byId("sigLbl");
    let scratches = 0, angle = 0, spinning = true, done = false, jog = null;
    const VEL = 2.4;                                              // deg/frame: a full spin about every 2.5s at 60fps

    // raf is the single-slot guard, and it is now actually enforced: see the header note. A frame is
    // queued through ctx.frame, never raw, or the runtime cannot cancel the loop when the channel goes.
    let raf = 0;
    function loop(now) {                                          // one animation loop drives the endless spin and every jog
      raf = 0;
      if (jog) {
        const p = Math.min((now - jog.t0) / jog.dur, 1);
        angle = jog.from - jog.back * (1 - Math.pow(1 - p, 2));   // halt forward, jerk backward (ease-out)
        if (p >= 1) { jog = null; spinning = !done; }             // resume the endless spin (unless it's over)
      } else if (spinning && !done) {
        angle += VEL;
      }
      platter.style.transform = `rotate(${angle}deg)`;
      if (!done || jog) raf = ctx.frame(loop);
    }
    raf = ctx.frame(loop);

    function scratch() {
      if (done) return;
      spinning = false;
      jog = { from: angle, back: 55 + Math.random() * 45, t0: performance.now(), dur: 165 };   // halt + jolt back like a real scratch; a fresh scratch restarts it
      if (!raf) raf = ctx.frame(loop);                            // nudge the loop only if it really is idle
      hand.classList.remove("jab"); void hand.offsetWidth; hand.classList.add("jab");
      scratches++;
      if (marks[scratches - 1]) marks[scratches - 1].classList.add("on");
    }

    function breakThrough() {
      done = true;
      dj.classList.add("glitch");
      const partyMode = tunerText.textContent;                    // the ad copy the purple wave puts back
      const restore = () => { tuner.classList.remove("alert"); tunerText.textContent = partyMode; };
      if (ctx.mbs && ctx.mbs.wave) ctx.mbs.wave({ after: 3000, restore });   // orange glitch; 3s later the purple wave returns PARTY MODE
      tuner.classList.add("alert");
      let i = 0; const msg = "HELP, GET US OUT";
      const type = ctx.interval(() => {                           // the tuner skips PARTY MODE for her signal
        tunerText.textContent = msg.slice(0, ++i) + (i < msg.length ? "_" : "");
        if (i >= msg.length) {
          clearInterval(type);
          tunerText.textContent = "HELP, GET US OUT";
          hint.innerHTML = "the record skipped. that was her, not it.";
          sigLbl.textContent = "// signal confirmed // she is in the machine //";
          if (ctx.mbs) { ctx.mbs.meter && ctx.mbs.meter(100, "SIGNAL"); ctx.mbs.unlock && ctx.mbs.unlock("djscratch"); }
        }
      }, 90);
    }

    ctx.on(hand, "pointerdown", e => { e.preventDefault(); scratch(); });
    ctx.on(hand, "keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); scratch(); } });

    // ---- YOUR DJ NAME: three fixed lists, concatenated (Fuel's picker pattern, fuel.html:313-327/382),
    // then leetspeak-transformed ourselves - Fuel has no generator or transform to reuse (Codex B4).
    const djA = byId("djA"), djB = byId("djB"), djC = byId("djC");
    const djName = byId("djName");
    const cap = s => s[0].toUpperCase() + s.slice(1);
    function leetify(s) {
      const map = { A: "4", E: "3", I: "1", O: "0", S: "5", T: "7" };
      let out = "";
      for (let i = 0; i < s.length; i++) {
        const ch = s[i], up = ch.toUpperCase();
        out += (map[up] && (s.charCodeAt(i) + i * 7) % 3 === 0) ? map[up] : ch;   // deterministic swap, not every eligible letter - reads "swished", not fully numeric
      }
      return out;
    }
    function updateDjName() { djName.textContent = leetify([djA.value, djB.value, djC.value].join(" ")); }
    [djA, djB, djC].forEach(s => ctx.on(s, "change", updateDjName));
    updateDjName();

    // ---- THE CONTROL RACK: BASS/TREBLE knobs, VOLUME/TEMPO sliders, POWER switch. Every value is set from
    // pointer POSITION (rect + event only, per the zoom note) so a single tap works exactly like a drag would -
    // no press-move-release gesture is required, so this is usable at 390px with one tap (Codex C4: no hover on touch).
    const rack = byId("rack");
    const state = { bass: 5, treble: 5, volume: 5, tempo: 5, power: 0 };
    function setValue(key, val) {
      val = Math.max(0, Math.min(10, val));
      state[key] = val;
      const num = byId("num" + cap(key));
      if (num) num.textContent = val;
      const knob = rack.querySelector(`.knobface[data-key="${key}"]`);
      if (knob) {
        const deg = (val / 10 * 270) - 135;
        knob.querySelector(".knobneedle").style.transform = `translate(-50%,0) rotate(${deg}deg)`;
        knob.setAttribute("aria-valuenow", val);
      }
      const track = rack.querySelector(`.slidertrack[data-key="${key}"]`);
      if (track) {
        track.querySelector(".sliderthumb").style.bottom = (val / 10 * 88) + "%";
        track.setAttribute("aria-valuenow", val);
      }
      applyAudioParam(key, val);
    }
    rack.querySelectorAll(".knobface,.slidertrack").forEach(el => {
      el.tabIndex = 0; el.setAttribute("role", "slider");
      el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "10");
      el.setAttribute("aria-label", cap(el.dataset.key));
    });
    rack.querySelectorAll(".knobface").forEach(face => {
      const key = face.dataset.key;
      const fromEvent = e => {
        const r = face.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let deg = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
        if (deg > 180) deg -= 360;
        return Math.round(((Math.max(-135, Math.min(135, deg))) + 135) / 270 * 10);
      };
      ctx.on(face, "pointerdown", e => { e.preventDefault(); try { face.setPointerCapture(e.pointerId); } catch {} setValue(key, fromEvent(e)); registerTouch(key); });
      ctx.on(face, "pointermove", e => { if (e.buttons) setValue(key, fromEvent(e)); });
    });
    rack.querySelectorAll(".slidertrack").forEach(track => {
      const key = track.dataset.key;
      const fromEvent = e => {
        const r = track.getBoundingClientRect();
        const rel = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
        return Math.round((1 - rel) * 10);
      };
      ctx.on(track, "pointerdown", e => { e.preventDefault(); try { track.setPointerCapture(e.pointerId); } catch {} setValue(key, fromEvent(e)); registerTouch(key); });
      ctx.on(track, "pointermove", e => { if (e.buttons) setValue(key, fromEvent(e)); });
    });
    rack.querySelectorAll(".knobface,.slidertrack").forEach(el => {
      ctx.on(el, "keydown", e => {
        const key = el.dataset.key;
        if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); setValue(key, state[key] + 1); registerTouch(key); }
        else if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); setValue(key, state[key] - 1); registerTouch(key); }
      });
    });
    // ---- THE BEAT. Synthesised only (oscillators + noise), never a file. Feeds the visualiser and the follow-game's audio.
    let actx = null, master = null, lowShelf = null, highShelf = null, analyser = null;
    let bpm = 115, nextStepTime = 0, stepIdx = 0, schedTimer = null, vizRAF = null;
    function ensureAudio() {
      if (actx) return;
      // ctx.audio: the graph is the one disposable here that nothing else can reach. The scheduler
      // and the visualiser stop themselves when dj.isConnected goes false; a live AudioContext just
      // keeps holding the device.
      actx = ctx.audio(new (window.AudioContext || window.webkitAudioContext)());
      master = actx.createGain(); master.gain.value = 0.0001;
      lowShelf = actx.createBiquadFilter(); lowShelf.type = "lowshelf"; lowShelf.frequency.value = 200;
      highShelf = actx.createBiquadFilter(); highShelf.type = "highshelf"; highShelf.frequency.value = 3000;
      analyser = actx.createAnalyser(); analyser.fftSize = 64;
      lowShelf.connect(highShelf); highShelf.connect(master); master.connect(analyser); analyser.connect(actx.destination);
    }
    function playKick(t) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(lowShelf); o.start(t); o.stop(t + 0.16);
    }
    function playHat(t) {
      const n = Math.floor(actx.sampleRate * 0.05), buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = actx.createBufferSource(); src.buffer = buf;
      const g = actx.createGain(); g.gain.value = 0.22;
      src.connect(g); g.connect(highShelf); src.start(t);
    }
    function applyAudioParam(key, val) {
      if (!actx) return;
      const t = actx.currentTime;
      if (key === "bass") lowShelf.gain.setTargetAtTime((val - 5) * 3, t, 0.05);
      if (key === "treble") highShelf.gain.setTargetAtTime((val - 5) * 3, t, 0.05);
      if (key === "volume") master.gain.setTargetAtTime(state.power ? val / 10 * 0.5 : 0.0001, t, 0.05);
      if (key === "tempo") bpm = 70 + val * 9;
    }
    ["bass", "treble", "volume", "tempo"].forEach(k => setValue(k, 5));   // sync needle/thumb art to the default numbers
    const vizCanvas = byId("vizCanvas"), vizNote = byId("vizNote");
    function scheduleStep() {
      while (nextStepTime < actx.currentTime + 0.1) {
        const accent = stepIdx % 4 === 0;
        if (accent) { playKick(nextStepTime); flashViz(nextStepTime - actx.currentTime); }
        else if (stepIdx % 2 === 1) playHat(nextStepTime);
        stepIdx = (stepIdx + 1) % 8;
        nextStepTime += (60 / bpm) / 2;
      }
    }
    function flashViz(delaySec) { ctx.timeout(() => { vizCanvas.classList.add("hit"); ctx.timeout(() => vizCanvas.classList.remove("hit"), 120); }, Math.max(0, delaySec * 1000)); }
    function startScheduler() {
      if (schedTimer) return;
      nextStepTime = actx.currentTime + 0.05; stepIdx = 0;
      // the isConnected guard stays: it stops the BEAT the moment the fragment is replaced, which is
      // sooner than unmount() reaches it on the legacy path. ctx.interval is what actually ends the timer.
      schedTimer = ctx.interval(() => { if (!dj.isConnected) return stopScheduler(); scheduleStep(); }, 25);
    }
    function stopScheduler() { clearInterval(schedTimer); schedTimer = null; }
    function startViz() {
      if (vizRAF) return;
      const ctx2d = vizCanvas.getContext("2d"), data = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        if (!dj.isConnected) { vizRAF = null; return; }
        analyser.getByteFrequencyData(data);
        ctx2d.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
        const barW = vizCanvas.width / (data.length / 2);
        for (let i = 0; i < data.length / 2; i++) {
          const h = (data[i] / 255) * vizCanvas.height;
          ctx2d.fillStyle = i % 2 ? "#ffd36e" : "#39ff9a";
          ctx2d.fillRect(i * barW, vizCanvas.height - h, barW - 2, h);
        }
        vizRAF = ctx.frame(draw);
      };
      vizRAF = ctx.frame(draw);
    }
    function stopViz() { if (vizRAF) cancelAnimationFrame(vizRAF); vizRAF = null; vizCanvas.getContext("2d").clearRect(0, 0, vizCanvas.width, vizCanvas.height); }

    // ---- THE COLOUR-FOLLOWING GAME: slow, easy, one lamp lit at a time. Follow it to the matching control.
    // Completing it earns the exact same payoff three scratches used to (breakThrough(), unchanged below).
    const SEQUENCE = ["bass", "treble", "volume", "tempo"];
    const lamps = [...dj.querySelectorAll("#cueLights .lamp")];
    const cueHint = byId("cueHint");
    const scoreNum = byId("scoreNum"), scoreGrade = byId("scoreGrade");
    let seqIndex = 0, hits = 0, misses = 0, gameStarted = false, gameActive = false, gameDone = false;
    function startGame() {
      if (gameStarted) return;
      gameStarted = true; gameActive = true; seqIndex = 0;
      scoreGrade.textContent = "FOLLOW THE LIGHTS";
      nextRound();
    }
    function nextRound() {
      lamps.forEach(l => l.classList.remove("on"));
      rack.querySelectorAll(".ctrl.glow").forEach(c => c.classList.remove("glow"));
      if (seqIndex >= SEQUENCE.length) return finishGame();
      const key = SEQUENCE[seqIndex];
      const lamp = lamps.find(l => l.dataset.key === key);
      if (lamp) lamp.classList.add("on");
      const ctrl = rack.querySelector(`.ctrl[data-key="${key}"]`);
      if (ctrl) ctrl.classList.add("glow");
      cueHint.textContent = "follow the light — move the " + key.toUpperCase();
    }
    function registerTouch(key) {
      if (!gameActive || gameDone) return;
      if (key === SEQUENCE[seqIndex]) { hits++; seqIndex++; updateScore(); nextRound(); }
      else { misses++; updateScore(); }
    }
    function updateScore() {
      scoreNum.textContent = hits + "/" + SEQUENCE.length;
      const total = hits + misses, pct = total ? Math.round(hits / total * 100) : 100;
      if (!gameDone) scoreGrade.textContent = pct >= 90 ? "SHARP EAR" : pct >= 60 ? "KEEPING UP" : "KEEP LISTENING";
    }
    function finishGame() {
      gameActive = false; gameDone = true;
      cueHint.textContent = "the follow's done.";
      const total = hits + misses, pct = total ? Math.round(hits / total * 100) : 100;
      scoreGrade.textContent = pct >= 90 ? "A+ DJ" : pct >= 60 ? "B DJ" : "STILL A DJ";
      ctx.timeout(breakThrough, 400);
    }

    // ---- POWER: turns on the beat + visualiser (first tap needs a gesture for AudioContext) and starts the game.
    const powerBtn = byId("powerSwitch");
    function togglePower(on) {
      powerBtn.setAttribute("aria-pressed", on ? "true" : "false");
      state.power = on ? 1 : 0;
      byId("numPower").textContent = state.power;
      if (on) {
        ensureAudio(); actx.resume && actx.resume();
        applyAudioParam("volume", state.volume);
        startScheduler(); startViz();
        vizNote.textContent = "deck is live"; startGame();
      } else {
        stopScheduler(); stopViz();
        if (master) master.gain.setTargetAtTime(0.0001, actx.currentTime, 0.05);
        vizNote.textContent = "deck is off";
      }
    }
    ctx.on(powerBtn, "click", () => togglePower(powerBtn.getAttribute("aria-pressed") !== "true"));
    ctx.on(powerBtn, "keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); powerBtn.click(); } });

    // ---- LIVE CODE ENTRY. Numeric, typed manually, checked ONLY by the deployed Supabase redeem endpoint
    // ({mission_id, code} -> {game, bearer}), never compared locally. mission_id/API base come from
    // data-mission-id / data-api on <html> - the registry agent is adding these empty (Codex C blocker 5),
    // so while either is blank this stays inert and claims nothing. MBS.mode is never used to gate it (Codex C6).
    const missionId = (document.documentElement.dataset.missionId || "").trim();
    const apiBase = (document.documentElement.dataset.api || "").trim();
    const codeArmed = !!(missionId && apiBase);
    const codeForm = byId("codeForm"), codeInput = byId("codeInput");
    const codeSubmit = byId("codeSubmit"), codeNote = byId("codeNote");
    codeInput.disabled = !codeArmed; codeSubmit.disabled = !codeArmed;
    if (codeArmed) codeNote.textContent = "Enter the code given live on stream.";
    let bearer = null;   // memory only - never localStorage, never a URL (Part D)
    ctx.on(codeForm, "submit", e => {
      e.preventDefault();
      if (!codeArmed) return;                            // never accepted locally, whatever the input holds
      const code = codeInput.value.trim();
      if (!code) return;
      codeSubmit.disabled = true; codeSubmit.textContent = "CHECKING…";
      fetch(apiBase.replace(/\/$/, "") + "/redeem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission_id: missionId, code })
      }).then(r => r.json().then(j => ({ ok: r.ok, j })).catch(() => ({ ok: false, j: null })))
        .then(({ ok, j }) => {
          codeSubmit.disabled = false; codeSubmit.textContent = "ENTER";
          if (ok && j && j.game === "djscratch") {
            bearer = j.bearer || null;
            codeNote.textContent = "CODE ACCEPTED.";
            transformToPhono();
          } else {
            codeNote.textContent = "CODE NOT RECOGNIZED. TRY AGAIN.";
          }
        })
        .catch(() => { codeSubmit.disabled = false; codeSubmit.textContent = "ENTER"; codeNote.textContent = "COULD NOT REACH THE DESK. TRY AGAIN."; });
    });

    // ---- THE PHONOGRAPH: what the whole record-player/turntable setup becomes once a code is redeemed.
    // The tuning dial reads data-station on <html> - also empty until the registry agent wires it (Codex B5) -
    // and stays visually inert and claims no station while it is.
    const phono = byId("phono"), phonoDial = byId("phonoDial"), phonoStation = byId("phonoStation");
    const station = (document.documentElement.dataset.station || "").trim();
    if (!station) {
      phonoDial.classList.add("inert"); phonoDial.setAttribute("aria-disabled", "true");
      phonoStation.textContent = "NO STATION SET";
    } else {
      phonoStation.textContent = "TUNED TO " + station;
      const needle = phonoDial.querySelector(".knobneedle");
      const fromEvent = e => {
        const r = phonoDial.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let deg = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
        if (deg > 180) deg -= 360;
        return Math.max(-135, Math.min(135, deg));
      };
      ctx.on(phonoDial, "pointerdown", e => { e.preventDefault(); try { phonoDial.setPointerCapture(e.pointerId); } catch {} needle.style.transform = `translate(-50%,0) rotate(${fromEvent(e)}deg)`; });
      ctx.on(phonoDial, "pointermove", e => { if (e.buttons) needle.style.transform = `translate(-50%,0) rotate(${fromEvent(e)}deg)`; });
    }
    ctx.on(phono.querySelector(".phono-play"), "click", () => { ensureAudio(); actx.resume && actx.resume(); state.power = 1; applyAudioParam("volume", state.volume); startScheduler(); startViz(); vizNote.textContent = "deck is live"; });
    ctx.on(phono.querySelector(".phono-stop"), "click", () => { stopScheduler(); if (master) master.gain.setTargetAtTime(0.0001, actx.currentTime, 0.05); vizNote.textContent = "deck is off"; });
    ctx.on(phono.querySelector(".phono-rewind"), "click", () => { stepIdx = 0; });
    function transformToPhono() {
      deck.classList.add("phono-on");
      dj.classList.add("glitch");
      if (ctx.mbs && ctx.mbs.wave) ctx.mbs.wave({ after: 800, restore: () => {} });
    }
  },

  /* This channel used to have no unmount() at all, and said so in writing: everything it opened was a
     disposable the CONTEXT owns - listeners, the two intervals, the spin and visualiser frames, and
     the AudioContext through ctx.audio, whose close() takes the scheduled oscillators with it. The
     hand editor is the first thing on it that ctx genuinely cannot own. A WebGLRenderer holds a GPU
     context, and a browser silently drops the OLDEST live context once a page holds too many - so a
     visitor who opens this card, changes channel, and comes back four times costs the page its
     earlier contexts rather than this one. dispose() releases the GPU resources; forceContextLoss()
     hands the context itself back rather than waiting for the garbage collector to notice.

     The rule mominc states holds here too: only what the context cannot own belongs in this
     function. Every listener, the ResizeObserver, the IntersectionObserver and the render frame are
     registered through ctx and are deliberately not re-listed. Clearing `session` is what stops an
     in-flight model fetch from attaching a scene to a fragment that has already gone. */
  unmount() {
    session = null;
    if (!gl) return;
    const g = gl;
    gl = null;
    g.geoms.forEach(geo => { try { geo.dispose(); } catch (e) { /* already gone */ } });
    g.mats.forEach(mat => { try { mat.dispose(); } catch (e) { /* already gone */ } });
    try { g.renderer.dispose(); } catch (e) { /* already disposed */ }
    try { g.renderer.forceContextLoss(); } catch (e) { /* context already lost */ }
    try { g.canvas.remove(); } catch (e) { /* fragment already replaced */ }
  },
};
