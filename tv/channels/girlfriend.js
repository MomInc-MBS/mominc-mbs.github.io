/* tv/channels/girlfriend.js - DR GIRLFRIEND, CH 9, "The Manufacturing Floor": the FIFTH channel
   converted to a module and the third that owns a WebGL context for its whole life (2.18, PLAN-r9
   D.1.7). Same code that sat inline at the bottom of girlfriend.html, with one change made
   throughout: every listener, observer and animation frame is registered through the CONTEXT, so
   channel-runtime.js can release all of it. Nothing about what the channel does changed.

   WHY THIS CHANNEL WENT FIFTH. "Simplest first" among what is left, measured rather than assumed:
   1026 script lines against corgi's 1662, and it is the last live channel small enough to convert
   without a hand read first (tools/scan_strict.py cannot tell division from a regex literal, and
   corgi and armie are declared UNRELIABLE because of it). It also has a PLAY ROUTE, so both halves
   of the mount are exercised - and check_play holds it as a PROBED route rather than a playthrough,
   because this channel deliberately calls no unlock at all: its assertion there is the no-WebGL
   fallback rendering, and the conversion had to keep that true.

   WHAT ctx CANNOT OWN HERE. A renderer, and a scene graph of a room: back wall, floor, five posters
   with their stickers and a paperclip, a twenty-six-unit conveyor with sixty slats, six paper tube
   cards, a beaker with its graduations, a mould, a box, a drone, the goggles, and Dr Girlfriend
   herself as one flat photograph. Every texture on it is either generated in canvas (the wall, the
   posters, every paper card, her name badge, the contact shadows) or loaded (her photograph, the
   poster sticker, and the six MYR5 material stills). None of that is a disposable the context knows
   about. A browser holds only a handful of live WebGL contexts and silently drops the OLDEST once a
   page opens too many, so a renderer that outlives its channel does not throw - it takes an EARLIER
   channel's canvas away, several channel changes later, with no error anywhere. unmount() is what
   stops that.

   THE DISPOSAL IS A TRAVERSE, NOT A REGISTER - fuel.js's decision, kept for lilboyfriend and kept
   again here. The scene is built across a dozen sections of run3D(); a registration list appended to
   at each one is a list the next edit forgets, which is the exact failure mode channel-runtime.js
   exists to remove. The graph already knows what it holds. Note that the camera here is NOT a scene
   member and does not need to be: unlike the museum, nothing is parented to it, so the walk misses
   nothing by starting at the scene.

   `extra` CARRIES THE SIX MYR5 MATERIAL STILLS, and it is not optional. All six are loaded up front
   so the reveal is instant, but only ONE is ever a live unitMat.map - whichever tube went in last -
   so a scene walk alone would dispose one and miss five. Same shape lilboyfriend had with its twelve
   photographs: preloaded assets outnumbering live materials.

   THE WEBGL FEATURE PROBE LEAKED A CONTEXT, and this is the fifth channel found carrying the same
   four lines verbatim. Asking a throwaway canvas for a context to prove a context can be had left a
   REAL live context behind on a detached canvas, spending the budget the renderer needs, once per
   mount. WEBGL_lose_context hands it back on purpose. It was invisible on the legacy path because an
   unconverted channel has no teardown to measure; corgi and sag still carry it, and each conversion
   fixes its own.

   THE THREE.JS IMPORT STAYS DYNAMIC, for the same reason as fuel's and the museum's. A static import
   resolves before this module's body runs, so a CDN outage would fail the whole module and
   channel-runtime.js would correctly render the unavailable testcard - throwing away the flat page
   this channel was designed to fall back to, which is a complete readable account of the line and is
   the exact thing check_play measures on the play route. The catch on the import does what the
   feature probe does: falls back to flat.

   WHAT THE ORIGINAL DID THAT IS NOW SCOPED. Ten document.getElementById lookups against the whole
   page became lookups inside the channel's own root. Only one channel is mounted at a time so both
   forms find the same nodes today, but scoping means a shell element can never be picked up by a
   channel's id lookup. The single deliberate exception is .screen, which is the TELEVISION's scroll
   container and not this channel's: the belt is pushed by the shell's scroll position, and on a play
   route there is no .screen at all, which is why the fallback to window and document.scrollingElement
   is kept exactly as it was. */

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";

/* The one piece of module state, held for the reason set out above: a WebGLRenderer and a scene graph
   are not disposables the context can own. `session` is the mount token - the three.js import resolves
   long after mount() returns, and a scene that comes back for a session that has already ended must be
   dropped rather than built into a fragment that has gone. */
let gl = null;
let session = null;

/* ================================================================================================
   THE LINE IS NOT INSIDE THE IMPORT ANY MORE (3.3 packet 2 / C073).

   Everything between here and `export default` is this channel's data and its state machine, and
   none of it touches three.js, a canvas, or a WebGL context. Before this packet `phase`, `poured`,
   the pour/mould/pack rules and the save file all lived inside `import(THREE_URL).then(...)` -
   which is reached only AFTER the `if (!glOK)` return at the top of mount(). So a visitor without
   WebGL, or with jsDelivr blocked, got a paragraph describing a production line they could not
   operate: no buttons, no save, no restore, and no goggles at all, because the hint overlay is
   markup inside `.dg-track` and `.dg.flat` hides that outright.

   The room and the flat station are now two VIEWS of one machine. The machine below decides what is
   allowed and what is remembered; the room animates the transitions it permits and the flat station
   just renders them. Neither view owns a rule. That is also why C072's phase persistence is written
   here rather than in the closure: there is exactly one place a phase can be saved from.
   ================================================================================================ */

/* Tubes are labelled by CHARACTER. Lazlo and Durpleton are the dogs' real names and stay out of this
   entirely (Ian, 2026-08-28).
   CITATIONS (round 4, 2026-09-05): the TODO placeholders are gone. Each "cite" below was checked
   directly against its own source by COMPUTA before shipping - never invented, never a local model's
   unverified output. Full reference, one per tube, in the same order:
     DJ Scratch     - Piazza, Grioli, Catalano & Bicchi, "A Century of Robotic Hands," Annual Review of
                       Control, Robotics, and Autonomous Systems, vol. 2 (2019), pp. 1-32.
     Sag Sniffer    - AAFCO Dog Food Nutrient Profiles: adult maintenance minimum 18% crude protein (dry
                       matter basis). aafco.org (Model Bills & Regulations, Nutrient Profiles).
     Cortisol Corgi - Gutierrez Nunez, Peixoto Rabelo, Subotic, Caruso & Knezevic, "Chronic Stress and
                       Autoimmunity: The Role of HPA Axis and Cortisol Dysregulation," International
                       Journal of Molecular Sciences (2025). PMC12563903.
     Lil Boyfriend  - National Low Income Housing Coalition, Out of Reach 2025: $33.63/hr national Housing
                       Wage for a modest two-bedroom rental. nlihc.org/oor.
     Coach Armie    - Qin, Li & Chen, "Acute to chronic workload ratio (ACWR) for predicting sports injury
                       risk: a systematic review and meta-analysis," BMC Sports Science, Medicine and
                       Rehabilitation (2025): 0.8-1.3 is the lower-risk zone. PMC12487117.
     MBS Fuel       - U.S. FDA: 400 mg/day is the general upper limit of caffeine not usually associated
                       with negative effects in healthy adults. fda.gov, "Spilling the Beans."
   `variant` maps each tube to one of the six MYR5 material stills (assets/myr5-*.png, cut from the morph
   clip, background removed) - whichever tube is poured LAST decides which material the batch ships as. */
const TUBES = [
  { who: "DJ Scratch",     topic: "Robotics and autonomous hands", cite: "Piazza et al. 2019, Ann Rev Control",     col: 0xc46a2f, variant: "darkstone" },
  { who: "Sag Sniffer",    topic: "Canine nutrition",              cite: "AAFCO Dog Food Nutrient Profile",         col: 0x8a9a3a, variant: "straw-wood" },
  { who: "Cortisol Corgi", topic: "Chronic stress",                cite: "Gutierrez Nunez et al. 2025, IJMS",       col: 0xc4402f, variant: "newsprint" },
  { who: "Lil Boyfriend",  topic: "Living in small spaces",        cite: "NLIHC, Out of Reach 2025",                col: 0x3a7a9a, variant: "blankpaper" },
  { who: "Coach Armie",    topic: "Training load and recovery",    cite: "Qin et al. 2025, BMC Sports Med Rehab",   col: 0xb0872f, variant: "palestone" },
  { who: "MBS Fuel",       topic: "Stimulants and dosage",         cite: "FDA: 400mg/day caffeine ceiling",         col: 0x9a3a7a, variant: "purple" }
];

/* MYR5, AS SIX MATERIALS. Round 4 (Ian): the creature is no longer built from primitives - it is one of
   six real stills cut from "MYR5 morph - clay to wood, stone, papermache, paper" with the background
   removed. Six variants, six tubes, mapping is exact: whichever tube gets poured LAST decides which
   material the batch ships as. Each carries a definition, a random interim number under 5.0 ("cuz that's
   the interim we're at"), and one horrific, corporately-downplayed crime.

   THE TEXTURES ARE NOT ON THIS RECORD. They used to be (`c.tex = loader.load(...)`), which was safe only
   while this object was rebuilt per mount inside the closure. At module scope a Texture hung here would
   outlive the mount that made it and be handed, already disposed, to the next one. The data is shared;
   the GPU objects are built into a per-mount map beside the renderer that owns them. */
const CREATURES = {
  "purple":     { file: "myr5-purple.png",     w: 357, h: 427, name: "MYR5 &middot; PURPLE",
    def: "Our signature shade. Trusted by nobody, worn by everyone.",
    crime: "Filed as a routine viscosity test. It absorbed the tester. HR is calling that retention." },
  "darkstone":  { file: "myr5-darkstone.png",  w: 251, h: 432, name: "MYR5 &middot; DARKSTONE",
    def: "Load-bearing. Approved for outdoor use and quiet suffering.",
    crime: "Cracked twice in transit, both times over a different family's driveway. Warranty voided." },
  "straw-wood": { file: "myr5-straw-wood.png", w: 339, h: 432, name: "MYR5 &middot; STRAW-WOOD",
    def: "Warm to the touch. Smells faintly of a county fair that closed for a reason.",
    crime: "Caught fire near a school bus stop. The claim called it ambient enrichment." },
  "palestone":  { file: "myr5-palestone.png",  w: 346, h: 431, name: "MYR5 &middot; PALESTONE",
    def: "Museum finish. Looks expensive, costs nothing, means less.",
    crime: "Stood motionless in a lobby for six weeks before anyone noticed it wasn't decor." },
  "newsprint":  { file: "myr5-newsprint.png",  w: 355, h: 438, name: "MYR5 &middot; NEWSPRINT",
    def: "Prints yesterday's headlines, forever. It never learns a new one either.",
    crime: "The ink is not food-grade. Forty units shipped to a daycare regardless." },
  "blankpaper": { file: "myr5-blankpaper.png", w: 333, h: 430, name: "MYR5 &middot; BLANKPAPER",
    def: "No print, no opinion, no complaints filed and none accepted.",
    crime: "Missing from the shipping manifest a full year. Came back with a name and a mortgage." }
};

// the reveal card, one implementation for the room's projected label and the flat station's panel
function creatureCard(key) {
  const c = CREATURES[key] || CREATURES.purple;
  const interim = (Math.random() * 4.99).toFixed(2);       // "below 5.0, cuz that's the interim we're at"
  return "<b>" + c.name + " &middot; INTERIM " + interim + "</b><i>" + c.def + "</i><u>" + c.crime + "</u>";
}

/* ---- THE GOGGLES' HINT RECORD (3.3 packet 2 / C074).

   The hint list used to be hand-authored markup in girlfriend.html with no version, no date and no
   statement of what it was checked against - and it had drifted into telling the visitor three things
   that are not true of this build. The site's own hint system was the least reliable thing on it:
     - DJ Scratch: "it answers on the third" described THREE SCRATCHES. That mechanic is retired; the
       unlock is the four-lamp follow game (djscratch.js:577-616), and breakThrough() is reached from
       finishGame(), never from a scratch count.
     - Sag Sniffer: "seven of those doors are business, the eighth is dinner". The wheel is FIVE doors
       (sag.html:4, which warns in as many words not to read the surplus ITEMS pool as the wheel) - and
       sag does not ship a play route at all.
     - Cortisol Corgi: "nothing to solve here yet". Corgi has had a page hunt, a book and a desk code
       since before this HEAD (corgi.js:551-562, :612).
     - Lil Boyfriend: "he gets smaller the further down you go". He does not. The shrink starts when the
       far end is done and runs on a wall clock through the walk BACK (lilboyfriend.js:226, :237-243).

   `version`/`snapshot`/`basis` are printed to the visitor with the list, the same shape fuel's cost
   record took in packet 1: the record in the source IS the provenance, and it is on screen rather than
   pointing at a document. `checked` is per entry and is printed too - an unprinted justification is how
   the last one rotted.

   ON-AIR STATUS IS NOT COPIED HERE. `hint` is only ever shown for a channel the network manifest says
   is on air; everything else gets `offAir`, read live from window.MBS_CHANNELS (generated from
   tv/channel-manifest.json by tools/gen_channels.py). So promoting a channel corrects its own goggles
   line, which is the recurrence the item asks to stop. goon is deliberately not listed: it was never in
   this list, its source is unresolved (3.G1), and adding a channel is a decision, not a correction. */
const HINTS = {
  version: "dg-hints-1.0",
  snapshot: "2026-09-07",
  basis: "Each line was read off the named channel's own source at this snapshot. On-air status is not stored here - it is read from the network manifest every time the lenses go on.",
  offAir: "Not on air yet. Nothing there opens, and I am not going to pretend otherwise.",
  // an off-air channel prints THIS as its evidence rather than its own `checked` line. The hint is
  // withheld, so the reasoning behind it has to be withheld too, or the goggles would give the channel
  // away in the footnote of the sentence refusing to give it away.
  offCheck: "tv/channel-manifest.json - coming_soon: the television slot exists, the play route does not.",
  items: [
    { id: "djscratch", ch: "DJ Scratch",
      hint: "Turn her on before anything else. Then stop reading the copy and follow the lights to the controls - all four of them, in her order, not yours.",
      checked: "djscratch.js:577-616 - the four-lamp follow game is what breaks the signal through now. Three scratches no longer do anything but count." },
    { id: "sag", ch: "Sag Sniffer",
      hint: "Four of those doors are business. The fifth is dinner, and it is locked.",
      checked: "sag.html:4 - five doors, four buyable then the locked fifth. The seven-item bank is a surplus pool, not the wheel." },
    { id: "lilboyfriend", ch: "Lil Boyfriend",
      hint: "The hall only runs one way. Do the one thing waiting at the far end - then understand that the walk back is on a clock the walk in was not.",
      checked: "lilboyfriend.js:226 and :237-243 - the far end is what fires; the walls close on a 37.5s wall clock that starts there, not on how far down you went." },
    { id: "armie", ch: "Coach Armie",
      hint: "Stop reading and breathe with him. Hold it longer than feels sensible.",
      checked: "armie.html - the held breath is the whole interaction, and it is longer than it looks." },
    { id: "fuel", ch: "MBS Fuel",
      hint: "Nothing seals until every field has an opinion. Indifference is not an answer, and it will tell you exactly which one you skipped.",
      checked: "fuel.js:227 - the seal fires only on a complete stack, and the refusal names the first missing choice." },
    { id: "corgi", ch: "Cortisol Corgi",
      hint: "There are pages hidden along the hallway and a book that wants all of them. The desk asks for a code, and the code is not in the room.",
      checked: "corgi.js:551-562 and :612 - hall, book and desk; the desk posts its code away to be checked, so nothing in the page holds the answer." },
    { id: "mominc", ch: "MOM Inc", node: false,
      hint: "Her own channel is the scoreboard, not a door. Nothing there opens anything here.",
      checked: "mbs-channels.js - mominc is not in the unlock set. It counts; it does not play." }
  ]
};

/* ---- THE SAVE FILE, AND WHY IT NOW CARRIES A PHASE (3.3 packet 2 / C072).

   v1 wrote `{poured:[...]}` and nothing else, and restoreProgress() replayed the tubes without ever
   touching `phase` - which is initialised "pour" and only advances to "mould" inside the SIXTH pour's
   animation callback. The save happens at the top of that pour, ~2.3s earlier. Reload in that window
   and every tube comes back poured, so pourTube() refuses; phase is still "pour", so mould() refuses.
   No reachable next action, in one refresh, on the ordinary path through the channel.

   Two things changed. The phase is saved with the tubes, at the stable boundaries only - never "busy",
   which is the name of a transition in flight and not a place to come back to. And the tube list is now
   the POUR ORDER rather than scene order: v1 wrote `tubes.filter(poured).map(idx)`, so a restored batch
   replayed the mix in tube order and could reveal a different material than the one the visitor
   actually earned. The last index in the list decides the material, so the order is load-bearing.

   v1 files are still read: their indices are usable as a set, their order is not trustworthy, and they
   claim no phase - so a complete v1 line lands on "mould", which is exactly the dead end being fixed. */
const LS_KEY = "mbs-dg-line";
const STABLE = ["pour", "mould", "pack", "grab", "goggles"];

function saveLine(L) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 2, phase: L.phase, poured: L.order.slice() })); } catch {}
}
function clearLine() { try { localStorage.removeItem(LS_KEY); } catch {} }

function makeLine() {
  const L = {
    phase: "pour",                                 // pour | busy | mould | pack | grab | goggles
    order: [],                                     // poured tube indices, IN POUR ORDER
    get poured() { return L.order.length; },
    get last() { return L.order.length ? L.order[L.order.length - 1] : -1; },
    has(i) { return L.order.indexOf(i) >= 0; },
    variant() { return L.last >= 0 ? TUBES[L.last].variant : null; },

    // Every transition returns whether the machine actually moved, so a view never animates a step
    // that was refused. The room used to answer that question with a bare `return` inside the tween
    // chain; the flat station needs the same answer and cannot see the chain.
    pour(i) {
      if (L.phase !== "pour" || !TUBES[i] || L.has(i)) return false;
      L.order.push(i);
      if (L.order.length >= TUBES.length) L.phase = "mould";
      saveLine(L);
      return true;
    },
    to(p) {
      L.phase = p;
      if (STABLE.indexOf(p) >= 0) saveLine(L);     // "busy" is a transition in flight, never a save point
      return true;
    },
    reset() { L.order.length = 0; L.phase = "pour"; clearLine(); },

    // reads the save file into this machine. Returns whether anything was restored, so the view knows
    // to say so rather than opening on "six tubes on the line" over a half-finished batch.
    restore() {
      let s = null;
      try { s = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return false; }
      if (!s || !Array.isArray(s.poured)) return false;
      const seen = [];
      s.poured.forEach(i => { if (TUBES[i] && seen.indexOf(i) < 0) seen.push(i); });
      if (!seen.length) return false;
      L.order = seen;
      L.phase = seen.length < TUBES.length ? "pour"
              : (STABLE.indexOf(s.phase) >= 0 && s.phase !== "pour") ? s.phase
              : "mould";                            // a complete v1 line, or a save taken mid-sixth-pour
      return true;
    }
  };
  return L;
}

/* ---- THE GOGGLES' COPY, for both views (C073/C074).

   MODE-AWARE, and MBS.mode is a TONE switch, never an entitlement (Codex C6): ?mode=live is
   user-settable, so this only changes what the goggles SAY. Off-air they give nothing away at all.
   On-air the list is rendered from HINTS, filtered through the live manifest - never from markup, so
   there is one copy of every hint and it carries its own provenance. */
function dressGoggles(dg, live) {
  const body = dg.querySelector("#dgVisBody");
  if (!body) return;
  if (!live) {
    body.innerHTML =
      '<h2>COME BACK DURING THE STREAM</h2>' +
      '<p class="sub">Optical overlay &middot; idle &middot; property of MOM Inc</p>' +
      '<p class="foot">The lenses are fogged on purpose. Put them on once the broadcast is live and the ' +
      'room tells you what it knows. Right now: nothing. That is not a malfunction.</p>';
    return;
  }
  const roster = (window.MBS_CHANNELS && window.MBS_CHANNELS.channels) || [];
  const rows = HINTS.items.map(h => {
    const c = roster.find(x => x.id === h.id);
    const onAir = c ? !c.comingSoon : true;         // no manifest to read: say the hint rather than lie about the air
    const dim = !onAir || h.node === false;
    return '<li' + (dim ? ' class="none"' : '') + '><b>' + h.ch + '</b>' +
           '<span>' + (onAir ? h.hint : HINTS.offAir) +
           '<u>' + (onAir ? h.checked : HINTS.offCheck) + '</u></span></li>';
  }).join("");
  body.innerHTML =
    '<h2>KNOWLEDGE IS POWER</h2>' +
    '<p class="sub">Optical overlay &middot; property of MOM Inc &middot; do not remove from the floor</p>' +
    '<ul>' + rows + '</ul>' +
    '<p class="foot">I am not going to click it for you. That is the difference between knowing a thing ' +
    'and being told it.</p>' +
    '<p class="ver" id="dgVisVer">' + HINTS.version + ' &middot; checked ' + HINTS.snapshot +
    ' &middot; ' + HINTS.basis + '</p>';
}

/* ---- THE FLAT STATION (3.3 packet 2 / C073).

   No three.js, no canvas, no CDN, no WebGL: six tube buttons, a mould button, a box button and the
   goggles, driving the same makeLine() the room drives. It is the whole manufacturing sequence, which
   is what the item asks for, and the reason it can be this short is that none of the rules live here.

   TWO DELIBERATE DIFFERENCES FROM THE ROOM, both about time rather than sequence. There is no drone,
   so there is no 3.9s window in which the drone can take the goggles back and reset the line: here they
   are handed over and stay. A timed grab on a button-only view would be a trap for exactly the visitor
   this fallback exists for, and C079 is already the ticket for making the room's own window fair. And
   nothing is animated, so each step lands immediately - the tween chain is scenery, not state.

   THE OVERLAY HAS TO MOVE, not just be restyled. #dgVis is markup inside .dg-track, and `.dg.flat`
   sets `.dg-track{display:none}` - a position:fixed child of a display:none parent renders nothing at
   all. So the node is reparented onto .dg itself and the fixed positioning is done in girlfriend.html's
   own stylesheet. */
function runFlat(dg, ctx, L) {
  const host = dg.querySelector("#dgStation");
  const vis = dg.querySelector("#dgVis");
  if (!host) return;
  if (vis) dg.appendChild(vis);

  host.hidden = false;
  host.innerHTML =
    '<h2>THE LINE</h2>' +
    '<p class="dg-say" id="dgFlatSay" role="status" aria-live="polite"></p>' +
    '<div class="dg-rows" id="dgFlatTubes"></div>' +
    '<div class="dg-acts">' +
      '<button type="button" id="dgFlatMould">Shape it</button>' +
      '<button type="button" id="dgFlatPack">Box it</button>' +
      '<button type="button" id="dgFlatGog">Put the goggles on</button>' +
    '</div>' +
    '<p class="dg-reveal" id="dgFlatUnit"></p>';

  const tubeBox = host.querySelector("#dgFlatTubes");
  const sayEl = host.querySelector("#dgFlatSay");
  const mouldBtn = host.querySelector("#dgFlatMould");
  const packBtn = host.querySelector("#dgFlatPack");
  const gogBtn = host.querySelector("#dgFlatGog");
  const unitEl = host.querySelector("#dgFlatUnit");

  TUBES.forEach((t, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.tube = String(i);
    b.innerHTML = "<b>" + t.who + "</b><i>" + t.topic + "</i><u>" + t.cite + "</u>";
    tubeBox.appendChild(b);
  });

  const say = t => { sayEl.textContent = t || ""; };
  function render() {
    [].forEach.call(tubeBox.children, (b, i) => {
      const done = L.has(i);
      b.disabled = done || L.phase !== "pour";
      b.classList.toggle("spent", done);
    });
    mouldBtn.disabled = L.phase !== "mould";
    packBtn.disabled = L.phase !== "pack";
    gogBtn.disabled = L.phase !== "grab" && L.phase !== "goggles";
  }

  ctx.on(tubeBox, "click", e => {
    const b = e.target.closest ? e.target.closest("button[data-tube]") : null;
    if (!b || !L.pour(+b.dataset.tube)) return;
    render();
    say(L.phase === "mould" ? "Six in. That is goo now. Shape it."
                            : (TUBES.length - L.poured) + " tubes left on the line.");
  });
  ctx.on(mouldBtn, "click", () => {
    if (L.phase !== "mould") return;
    L.to("pack");
    unitEl.innerHTML = creatureCard(L.variant());
    render();
    say("One unit, intact. Box it.");
  });
  ctx.on(packBtn, "click", () => {
    if (L.phase !== "pack") return;
    L.to("grab");
    // the shell's own effect, the same one the room fires on the drone launch, reached through ctx
    if (ctx.mbs && ctx.mbs.wave) ctx.mbs.wave({ after: 900 });
    render();
    say("Boxed, and gone off the end of the line. She left the goggles behind.");
  });
  ctx.on(gogBtn, "click", () => {
    if (L.phase === "grab") L.to("goggles");
    if (L.phase !== "goggles" || !vis) return;
    vis.classList.add("on");
  });

  if (L.restore()) {
    if (L.phase === "pack" || L.phase === "grab" || L.phase === "goggles") unitEl.innerHTML = creatureCard(L.variant());
    say(L.phase === "pour" ? (TUBES.length - L.poured) + " tubes left on the line. Picking up where you left it."
      : L.phase === "mould" ? "Six were already in. That is goo now. Shape it."
      : L.phase === "pack" ? "A unit was already formed. Box it."
      : "The batch went out. The goggles are still here.");
  } else {
    say("Six tubes on the line. Take one.");
  }
  render();

  // the same probe name the room publishes, so one driver can assert the same sequence on either view.
  // `flat` is how it tells them apart. unmount() deletes it either way.
  window.__dg = {
    flat: true,
    get phase() { return L.phase; },
    get poured() { return L.poured; },
    get order() { return L.order.slice(); },
    get lastVariant() { return L.variant(); }
  };
}

export default {
  mount(root, ctx) {
    session = {};
    const mine = session;

    const dg = root.matches(".dg") ? root : root.querySelector(".dg");
    if (!dg) return;
    const byId = (id) => dg.querySelector("#" + id);

    const stage = byId("dgStage");
    const canvas = byId("dgCanvas");
    const labelBox = byId("dgLabels");
    const nudge = byId("dgNudge");
    const pipBox = byId("dgPips");
    const vis = byId("dgVis");
    // The deliberate exception: .screen is the television, not this channel. fitting the belt to the
    // shell's scroll position is the whole form of this room. On a play route it does not exist, the
    // scroll listener goes on window and the position is read from document.scrollingElement - which
    // is exactly what this channel has always done there.
    const screenEl = dg.closest(".screen") || document.getElementById("screen");
    if (!canvas) return;

    // The feature probe, fixed. The original asked a throwaway canvas for a context and walked away
    // from it: a real live context, on a detached canvas, spent out of the same small budget the
    // renderer below needs, once per mount. WEBGL_lose_context gives it back on purpose.
    const glOK = (() => {
      try {
        if (!window.WebGLRenderingContext) return false;
        const c = document.createElement("canvas");
        const probe = c.getContext("webgl2") || c.getContext("webgl");
        if (!probe) return false;
        const lose = probe.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
        return true;
      } catch { return false; }
    })();
    const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // THE GOGGLES ARE MODE-AWARE (round 4, Ian). The flag comes off the context rather than off window,
    // read at mount time, which is the same value tv.js and mbs-shim.js see. Dressed BEFORE the WebGL
    // branch below, and the dismiss button is bound here rather than inside the import, because the flat
    // station has goggles too now (C073) and used to reach neither.
    dressGoggles(dg, !!ctx.isLive);
    const visX = byId("dgVisX");
    if (visX && vis) ctx.on(visX, "click", () => vis.classList.remove("on"));

    // ONE machine, whichever view draws it (C073). Built before the branch so the flat station and the
    // room are handed the same object and the same save file.
    const L = makeLine();

    // No WebGL: the flat station, which is now an operable line rather than a paragraph about one.
    if (!glOK) { dg.classList.add("flat"); runFlat(dg, ctx, L); return; }

    // MOM Inc's motivational posters. Her voice: warm, total, and not on your side.
    const POSTERS = [
      "HE ASKED FOR NOTHING.\nHE WAS GIVEN LESS.",
      "A GOOD UNIT DOES NOT ASK\nWHAT IT IS FOR.",
      "YOUR POTENTIAL\nIS OUR PROPERTY.",
      "ONE EYE IS ENOUGH\nTO FIND THE DOOR.",
      "SMILE.\nIT IS CHEAPER THAN A RAISE."
    ];

    const say = t => { nudge.textContent = t || ""; nudge.classList.toggle("show", !!t); };
    TUBES.forEach(() => pipBox.appendChild(document.createElement("i")));
    const pips = [].slice.call(pipBox.children);

    import(THREE_URL).then(THREE => {
      // The import resolved for a mount that has already ended: build nothing. Without this the whole
      // room, and a WebGL context to draw it with, would be built into a fragment that has left the
      // document - and nothing would ever release it, because unmount() has already run.
      if (session !== mine) return;

      const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
      renderer.setClearColor(0x0f0818, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 60);

      // registered BEFORE the scene is populated: if any of the building below throws, the promise's
      // .catch reports it and unmount() still has a renderer and a scene to release. A half-built scene
      // that nothing can dispose is the leak this record exists to prevent.
      gl = { renderer: renderer, scene: scene, extra: [] };

      const M = {
        belt:   new THREE.MeshStandardMaterial({ color: 0xcbb98c, roughness: 1.00, metalness: 0.00 }),
        slat:   new THREE.MeshStandardMaterial({ color: 0xd8c9a0, roughness: 1.00, metalness: 0.00 }),
        frame:  new THREE.MeshStandardMaterial({ color: 0x8a6b3f, roughness: 1.00, metalness: 0.00 }),
        roller: new THREE.MeshStandardMaterial({ color: 0xc9b98a, roughness: 1.00, metalness: 0.00 }),
        wall:   new THREE.MeshStandardMaterial({ color: 0x4a3a66, roughness: 1.00, metalness: 0.00 }),
        floor:  new THREE.MeshStandardMaterial({ color: 0x2c2040, roughness: 1.00, metalness: 0.00 }),
        enamel: new THREE.MeshStandardMaterial({ color: 0xf0e9d4, roughness: 1.00, metalness: 0.00 }),
        goo:    new THREE.MeshStandardMaterial({ color: 0x7a2fc4, roughness: 0.90, metalness: 0.00, emissive: 0x2a0a44, emissiveIntensity: 0.35 }),
        card:   new THREE.MeshStandardMaterial({ color: 0xa8814f, roughness: 1.00, metalness: 0.00 }),
        gold:   new THREE.MeshStandardMaterial({ color: 0xe8c46a, roughness: 0.85, metalness: 0.10 }),
        drone:  new THREE.MeshStandardMaterial({ color: 0xece3cc, roughness: 1.00, metalness: 0.00 })
      };

      // ---- PAPER SYSTEM (Ian, 2026-09-03: "dr gf is paper 2.5 d flat but with depth"). Reference GUESSED as
      // Paper Mario: flat cut-paper cards with a white core at the torn edge, standing upright in a room that
      // keeps real 3D depth. jaggedPath draws an irregular torn-paper outline; paperTexture fills it with
      // fibre grain (plus an optional crease or taped-corner detail); paperCard turns that into a two-layer
      // mesh (a plain white backing peeking out as the "core", a printed front layer) so a flat prop reads as
      // cut paper, not a flat-shaded polygon.
      function jaggedPath(ctx2d, w, h, jag) {
        const n = 7, pts = [];
        const edge = (x0, y0, x1, y1) => { for (let i = 0; i <= n; i++) { const t = i / n;
          const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
          const j = (i > 0 && i < n) ? (Math.random() - 0.5) * jag : 0;
          pts.push([x + (y1 === y0 ? 0 : j), y + (x1 === x0 ? 0 : j)]); } };
        edge(0, 0, w, 0); edge(w, 0, w, h); edge(w, h, 0, h); edge(0, h, 0, 0);
        ctx2d.beginPath();
        pts.forEach((p, i) => i ? ctx2d.lineTo(p[0], p[1]) : ctx2d.moveTo(p[0], p[1]));
        ctx2d.closePath();
      }
      function paperTexture(w, h, color, opts) {
        opts = opts || {};
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const x = c.getContext("2d");
        jaggedPath(x, w, h, opts.jag == null ? w * 0.018 : opts.jag);
        x.fillStyle = color; x.fill();
        x.save(); x.clip();
        x.globalAlpha = 0.06;
        for (let i = 0; i < (w * h) / 90; i++) {
          x.fillStyle = Math.random() < 0.5 ? "#000" : "#fff";
          x.fillRect(Math.random() * w, Math.random() * h, 1.4, 1 + Math.random() * 5);
        }
        x.globalAlpha = 1;
        if (opts.crease) {
          x.strokeStyle = "rgba(0,0,0,.22)"; x.lineWidth = Math.max(1, w * 0.006);
          x.beginPath(); x.moveTo(opts.crease[0] * w, 0); x.lineTo(opts.crease[1] * w, h); x.stroke();
          x.strokeStyle = "rgba(255,255,255,.12)"; x.lineWidth = Math.max(1, w * 0.003);
          x.beginPath(); x.moveTo(opts.crease[0] * w + 2, 0); x.lineTo(opts.crease[1] * w + 2, h); x.stroke();
        }
        if (opts.draw) opts.draw(x, w, h);
        x.restore();
        if (opts.tape) {
          const tx = w * opts.tape[0], ty = h * opts.tape[1];
          x.save(); x.translate(tx, ty); x.rotate(-0.38);
          x.fillStyle = "rgba(214,168,88,.72)"; x.fillRect(-w * 0.11, -h * 0.03, w * 0.22, h * 0.06);
          x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 1;
          x.strokeRect(-w * 0.11, -h * 0.03, w * 0.22, h * 0.06);
          x.restore();
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      let SHADOW_TEX = null;
      function shadowTexture() {
        if (SHADOW_TEX) return SHADOW_TEX;
        const c = document.createElement("canvas"); c.width = c.height = 128;
        const x = c.getContext("2d");
        const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
        g.addColorStop(0, "rgba(0,0,0,.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g; x.fillRect(0, 0, 128, 128);
        SHADOW_TEX = new THREE.CanvasTexture(c);
        return SHADOW_TEX;
      }
      function contactShadow(rx, rz) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(rx, rz),
          new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
        m.rotation.x = -Math.PI / 2;
        return m;
      }
      // a paper card: white backing (the cut edge's core) + a printed front layer, both jagged, front slightly
      // smaller so the white always rings the edge. w/h in world units.
      function paperCard(w, h, color, opts) {
        const g = new THREE.Group();
        const back = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.09, h * 1.09),
          new THREE.MeshStandardMaterial({ map: paperTexture(256, 256, "#f7f2e4", { jag: 10 }),
            roughness: 1, metalness: 0, transparent: true, side: 2 }));
        back.position.z = -0.006; g.add(back);
        const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
          new THREE.MeshStandardMaterial({ map: paperTexture(512, 512, color, opts),
            roughness: 1, metalness: 0, transparent: true, side: 2 }));
        g.add(front);
        g.userData.front = front;
        return g;
      }

      // ---- the room. STATIC (Ian: "the background doesnt need to move"). The camera never travels, so none
      // of this has to earn its keep through parallax; it only has to be a room.
      function wallTexture() {
        return paperTexture(1024, 448, "#4a3a66", {
          jag: 0, crease: [0.62, 0.71],
          draw: (x, w, h) => {
            // pencil construction lines left on the back wall: the kind of guide marks a paper set-builder
            // leaves in and nobody bothers to erase, because the audience never gets this close.
            x.strokeStyle = "rgba(230,220,255,.10)"; x.lineWidth = 1;
            for (let gx = 0; gx < w; gx += 64) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, h); x.stroke(); }
            for (let gy = 0; gy < h; gy += 64) { x.beginPath(); x.moveTo(0, gy); x.lineTo(w, gy); x.stroke(); }
            x.strokeStyle = "rgba(230,220,255,.16)";
            for (let i = 0; i < 5; i++) {
              x.beginPath(); x.arc(120 + i * 190, 90, 34, 0, Math.PI * 2); x.stroke();
            }
          }
        });
      }
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 13),
        new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 1, metalness: 0 }));
      wall.position.set(0, 4.4, -3.4); wall.receiveShadow = true; scene.add(wall);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), M.floor);
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(30, 0.34, 0.14), M.frame);
      skirt.position.set(0, 0.17, -3.33); scene.add(skirt);

      // ---- MYR5 inspirational posters (Ian, 2026-08-28). Sticker art on printed board, slogan set beneath.
      const loader = new THREE.TextureLoader();
      function posterTexture(text, torn) {
        const c = document.createElement("canvas"); c.width = 512; c.height = 640;
        const x = c.getContext("2d");
        x.fillStyle = "#efe6d2"; x.fillRect(0, 0, 512, 640);
        x.fillStyle = "#1b0a2c"; x.fillRect(0, 0, 512, 16); x.fillRect(0, 624, 512, 16);
        x.fillStyle = "#7a2fc4"; x.fillRect(28, 430, 456, 5);
        x.fillStyle = "#1b0a2c"; x.textAlign = "center";
        x.font = "bold 38px Georgia, serif";
        text.split("\n").forEach((line, i) => x.fillText(line, 256, 496 + i * 44));
        x.fillStyle = "#7a2fc4"; x.font = "bold 17px Georgia, serif";
        x.fillText("A MOM INC PRODUCT", 256, 604);
        if (torn) {
          // a torn corner, mended with tape - the same amber tape strip that shows up wherever this channel
          // needs one, a lived-in detail repeated rather than invented fresh each time.
          x.save(); x.beginPath(); x.moveTo(512, 0); x.lineTo(512, 70); x.lineTo(450, 40); x.lineTo(480, 0);
          x.closePath(); x.globalCompositeOperation = "destination-out"; x.fill(); x.restore();
          x.save(); x.translate(465, 28); x.rotate(0.5);
          x.fillStyle = "rgba(214,168,88,.78)"; x.fillRect(-52, -12, 104, 26);
          x.strokeStyle = "rgba(255,255,255,.3)"; x.strokeRect(-52, -12, 104, 26);
          x.restore();
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      let clipDone = false;
      POSTERS.forEach((txt, i) => {
        const ppx = -9.4 + i * 4.7;
        const board = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.38),
          new THREE.MeshStandardMaterial({ map: posterTexture(txt, i === 0), roughness: 0.96, metalness: 0.0, transparent: true }));
        board.position.set(ppx, 4.75, -3.36); scene.add(board);
        const sticker = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.42),
          new THREE.MeshStandardMaterial({
            map: loader.load("assets/myr5-creature.png"),
            transparent: true, roughness: 0.95, metalness: 0.0 }));
        sticker.position.set(ppx, 5.2, -3.34); scene.add(sticker);
        // the same paperclip, holding two posters together at their seam - one lived-in detail, not invented
        // twice. Placed once, where poster 1 and poster 2 meet.
        if (i === 1 && !clipDone) {
          clipDone = true;
          const clip = new THREE.Group();
          const wire = new THREE.MeshStandardMaterial({ color: 0xb9c2c9, roughness: 0.5, metalness: 0.6 });
          const loopA = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI * 1.5), wire);
          const loopB = loopA.clone(); loopB.scale.set(0.62, 0.62, 1); loopB.position.y = 0.02;
          clip.add(loopA, loopB);
          clip.position.set(ppx + 2.35, 5.55, -3.32); clip.rotation.z = 0.15;
          scene.add(clip);
        }
      });

      // ---- the conveyor belt (Ian: "lets make it a conveyor belt in front of her"). The work comes to her;
      // the camera holds still. This is the whole answer to "it feels up and down".
      const BELT_Y = 1.06, BELT_LEN = 26;
      const beltTop = new THREE.Mesh(new THREE.BoxGeometry(BELT_LEN, 0.1, 2.0), M.belt);
      beltTop.position.set(0, BELT_Y, 0); beltTop.receiveShadow = true; scene.add(beltTop);
      [-1.08, 1.08].forEach(rz => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(BELT_LEN, 0.2, 0.14), M.frame);
        rail.position.set(0, BELT_Y + 0.06, rz); rail.castShadow = true; scene.add(rail);
      });
      for (let lx = -12; lx <= 12; lx += 3) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.06, 0.16), M.frame);
        leg.position.set(lx, 0.53, -0.7); scene.add(leg);
        const leg2 = leg.clone(); leg2.position.z = 0.7; scene.add(leg2);
      }
      // slats: what actually reads as "the belt is running"
      const slats = [];
      const slatGeo = new THREE.BoxGeometry(0.34, 0.055, 1.9);
      for (let i = 0; i < 60; i++) {
        const sl = new THREE.Mesh(slatGeo, M.slat);
        sl.position.set(-13 + i * 0.44, BELT_Y + 0.07, 0);
        sl.receiveShadow = true; scene.add(sl); slats.push(sl);
      }
      [-BELT_LEN / 2, BELT_LEN / 2].forEach(rx => {
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.0, 16), M.roller);
        roll.rotation.x = Math.PI / 2; roll.position.set(rx, BELT_Y + 0.02, 0); scene.add(roll);
      });

      // ---- light
      scene.add(new THREE.HemisphereLight(0x9d86bd, 0x2a1d3a, 0.9));
      const key = new THREE.DirectionalLight(0xffe6bc, 2.1);
      key.position.set(-5, 8, 6); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1; key.shadow.camera.far = 30;
      key.shadow.camera.left = -12; key.shadow.camera.right = 12;
      key.shadow.camera.top = 9; key.shadow.camera.bottom = -4;
      scene.add(key);
      const fillL = new THREE.DirectionalLight(0xbfa8e0, 0.5); fillL.position.set(3, 3, 8); scene.add(fillL);
      const rim = new THREE.DirectionalLight(0x9a6ad8, 0.6); rim.position.set(6, 4, -4); scene.add(rim);
      const gooGlow = new THREE.PointLight(0x9a4ae0, 0.0, 8); gooGlow.position.set(2.9, 1.7, 0.2); scene.add(gooGlow);
      // lamps hung LOW ENOUGH TO BE IN SHOT. Round 1 put pipes and lamps above the frame, where Ian correctly
      // pointed out nobody could see them.
      [-2.1, 2.1].forEach(lx => {
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6), M.frame);
        cord.position.set(lx, 4.55, 1.1); scene.add(cord);
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.4, 18, 1, true), M.enamel);
        shade.position.set(lx, 3.65, 1.1); shade.castShadow = true; scene.add(shade);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xffe6bc, emissive: 0xffd9a0, emissiveIntensity: 1.5, roughness: 1 }));
        bulb.position.set(lx, 3.5, 1.1); scene.add(bulb);
        const pool = new THREE.PointLight(0xffe0b0, 0.6, 9); pool.position.set(lx, 3.2, 1.1); scene.add(pool);
      });

      // ---- the puff. Spec beat, one per pour: DJ Scratch's needle-drop is her one moment of ceremony and
      // this is Dr Girlfriend's equivalent. An expanding ring of vapour over the beaker mouth.
      const puffs = [];
      const puffGeo = new THREE.SphereGeometry(0.09, 10, 8);
      function puff(at) {
        for (let i = 0; i < 12; i++) {
          const m = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({
            color: 0xd9c8f0, roughness: 1, transparent: true, opacity: 0.62 }));
          m.position.copy(at);
          const a = (i / 12) * Math.PI * 2;
          m.userData.v = new THREE.Vector3(Math.cos(a) * 0.011, 0.009 + Math.random() * 0.006, Math.sin(a) * 0.011);
          m.userData.life = 0;
          scene.add(m); puffs.push(m);
        }
      }

      // ---- everything on the line FLOATS (Ian: "lets have everything just kinda float").
      const floaters = [];
      const floatIt = (obj, baseY, amp) => floaters.push({ o: obj, y: baseY, a: amp == null ? 0.05 : amp, p: Math.random() * 6.28 });
      const unfloat = obj => { const i = floaters.findIndex(f => f.o === obj); if (i >= 0) floaters.splice(i, 1); };

      // ---- the six tubes, riding the belt
      const BELT = new THREE.Group(); scene.add(BELT);
      // PAPER CUTOUTS now (Ian, 2026-09-03), each a printed flask card standing on the belt rather than a
      // glass vessel. The DOM label (below) still carries the reading text; the card only has to read as
      // "a labelled tube" at a glance, which is what keeps it legible small.
      const tubes = TUBES.map((t, i) => {
        const g = new THREE.Group();
        g.position.set(-4.9 + i * 1.05, BELT_Y + 0.5, 0);
        const hex = "#" + t.col.toString(16).padStart(6, "0");
        const card = paperCard(0.58, 1.0, "#f4ecd8", { jag: 8, draw: (x, w, h) => {
          x.fillStyle = "#e8c46a"; x.fillRect(w * 0.42, h * 0.02, w * 0.16, h * 0.05);
          x.strokeStyle = "#241834"; x.lineWidth = 5;
          x.beginPath(); x.moveTo(w * 0.5, h * 0.06); x.lineTo(w * 0.5, h * 0.42);
          x.lineTo(w * 0.16, h * 0.94); x.lineTo(w * 0.84, h * 0.94); x.closePath(); x.stroke();
          x.fillStyle = hex;
          x.beginPath(); x.moveTo(w * 0.5, h * 0.5); x.lineTo(w * 0.24, h * 0.9); x.lineTo(w * 0.76, h * 0.9);
          x.closePath(); x.fill();
        } });
        g.add(card);
        const liq = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.4),
          new THREE.MeshStandardMaterial({ color: t.col, roughness: 1, metalness: 0, transparent: true }));
        liq.position.set(0, 0.42, 0.008); g.add(liq);
        const shadow = contactShadow(0.5, 0.3);
        shadow.position.set(0, -0.5, 0.02); g.add(shadow);
        g.userData = { idx: i, poured: false, liq: liq, kind: "tube", home: g.position.clone() };
        BELT.add(g);
        floatIt(g, g.position.y, 0.045);
        return g;
      });

      // ---- four discrete belt stations (Ian, round 3: separate MIX from FORMING from BOXING so no two
      // stages can ever animate over the same spot again). Each gets its own fixed X; the unit travels
      // between them, the camera never does.
      const WORK_X = 2.35;            // MIX - the pitcher, unchanged from round 2
      const FORM_X = WORK_X + 1.7;    // FORMING - new: the mould
      const BOX_X = WORK_X + 3.3;     // BOXING - new: the box table
      // A laboratory BEAKER (Ian, 2026-08-28: "a beaker not a mug"). Straight sides, no handle - the handle was
      // exactly what made the last one read as a coffee cup - plus a pour lip and graduation marks.
      const beakerGlass = new THREE.MeshStandardMaterial({ color: 0xd6e6e2, roughness: 0.10, metalness: 0.0,
        transparent: true, opacity: 0.30, side: 2 });
      const pitcher = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.42, 1.08, 30, 1, true), beakerGlass);
      pitcher.position.set(WORK_X, BELT_Y + 0.66, 0.05); pitcher.castShadow = true; scene.add(pitcher);
      const pitchBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 30), beakerGlass);
      pitchBase.position.set(WORK_X, BELT_Y + 0.13, 0.05); scene.add(pitchBase);
      // the pour lip: a short flared collar at the rim
      const lipRing = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.09, 30, 1, true), beakerGlass);
      lipRing.position.set(WORK_X, BELT_Y + 1.22, 0.05); scene.add(lipRing);
      // graduation marks up the side, because a beaker is a measuring vessel and that is the whole difference
      const gradMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.8, transparent: true, opacity: 0.5 });
      for (let gi = 1; gi <= 4; gi++) {
        const g2 = new THREE.Mesh(new THREE.TorusGeometry(0.435, 0.006, 6, 26, Math.PI * 0.5), gradMat);
        g2.rotation.x = Math.PI / 2; g2.rotation.z = -Math.PI * 0.25;
        g2.position.set(WORK_X, BELT_Y + 0.28 + gi * 0.19, 0.05); scene.add(g2);
      }
      const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.39, 1, 26), M.goo);
      fill.position.set(WORK_X, BELT_Y + 0.2, 0.05); fill.scale.y = 0.001; fill.visible = false; scene.add(fill);

      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.42, 26, 18), M.goo);
      blob.position.set(WORK_X, BELT_Y + 0.66, 0.05); blob.castShadow = true; blob.visible = false;
      blob.userData.kind = "blob"; scene.add(blob);

      // ---- MYR5's six material stills. The RECORD (name, definition, crime, pixel size) is module scope
      // now, shared with the flat station's reveal card; what is built here is the per-mount TEXTURE for
      // each of them, which is a GPU object and belongs to this renderer alone. Hanging them back on the
      // shared record - which is what the code did while the record lived in this closure - would hand a
      // disposed texture to the next mount.
      //
      // All six are loaded up front so the reveal is instant, and only ONE of them is ever a live
      // unitMat.map - whichever tube went in last. The scene walk in unmount() would therefore reach one
      // and miss five, which is exactly what gl.extra is for. TextureLoader hands the Texture object back
      // synchronously and fills in the image later, so there is no late arrival to guard here: the objects
      // are on the list before this mount can end.
      const creatureTex = {};
      Object.keys(CREATURES).forEach(k => {
        const t = loader.load("assets/" + CREATURES[k].file);
        t.colorSpace = THREE.SRGBColorSpace;
        creatureTex[k] = t;
        gl.extra.push(t);
      });

      const unit = new THREE.Group();
      unit.position.set(FORM_X, BELT_Y + 0.2, 0.05);
      unit.visible = false; unit.userData.kind = "unit"; scene.add(unit);
      const UNIT_H = 1.15;
      const unitMat = new THREE.MeshStandardMaterial({ map: null, transparent: true, alphaTest: 0.15, roughness: 0.9, metalness: 0, side: 2 });
      const unitMesh = new THREE.Mesh(new THREE.PlaneGeometry(UNIT_H, UNIT_H), unitMat);
      unitMesh.castShadow = true; unit.add(unitMesh);
      function setUnitVariant(key) {
        const c = CREATURES[key] || CREATURES.purple;
        unitMesh.geometry.dispose();
        unitMesh.geometry = new THREE.PlaneGeometry(UNIT_H * (c.w / c.h), UNIT_H);
        unitMesh.position.y = UNIT_H / 2;
        unitMat.map = creatureTex[CREATURES[key] ? key : "purple"]; unitMat.needsUpdate = true;
      }

      // ---- the mould (FORMING station, new). Two jaw halves close over the blob, hold, and open on the
      // formed unit - the physical answer to "she needs a forming station instead of mixing and finishing
      // happening in the same spot."
      const jawGeo = new THREE.BoxGeometry(0.55, 0.9, 0.9);
      const jawL = new THREE.Mesh(jawGeo, M.card); jawL.visible = false; jawL.castShadow = true; jawL.receiveShadow = true;
      const jawR = jawL.clone();
      jawL.position.set(FORM_X - 0.55, BELT_Y + 0.66, 0.05);
      jawR.position.set(FORM_X + 0.55, BELT_Y + 0.66, 0.05);
      scene.add(jawL, jawR);

      // ---- the box
      const box = new THREE.Group(); box.position.set(BOX_X, BELT_Y + 0.14, 0.05); box.visible = false;
      box.userData.kind = "box"; scene.add(box);
      const boxBody = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.68, 0.7), M.card);
      boxBody.position.y = 0.34; boxBody.castShadow = true; box.add(boxBody);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.74), M.card);
      lid.position.y = 0.72; box.add(lid);
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.02, 0.11), M.gold);
      tape.position.y = 0.765; box.add(tape);

      // ---- the drone, and the goggles it leaves behind
      const drone = new THREE.Group(); drone.position.set(-7, 5.2, -1.6); drone.visible = false; scene.add(drone);
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.17, 0.46), M.drone); hull.castShadow = true; drone.add(hull);
      const props = [];
      [[-0.45, 0.32], [0.45, 0.32], [-0.45, -0.32], [0.45, -0.32]].forEach(pair => {
        const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), M.drone);
        arm2.position.set(pair[0] * 0.55, 0, pair[1] * 0.55); arm2.rotation.z = Math.PI / 2;
        arm2.rotation.y = Math.atan2(pair[1], pair[0]); drone.add(arm2);
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.012, 0.05), M.drone);
        p.position.set(pair[0], 0.11, pair[1]); drone.add(p); props.push(p);
      });

      const goggles = new THREE.Group(); goggles.position.set(0.5, BELT_Y + 0.32, 0.3);
      goggles.visible = false; goggles.userData.kind = "goggles"; goggles.rotation.x = -0.85; scene.add(goggles);
      [-0.17, 0.17].forEach(gx => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 10, 22), M.drone);
        ring.position.set(gx, 0, 0); goggles.add(ring);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.115, 22),
          new THREE.MeshStandardMaterial({ color: 0xff8a2a, roughness: 0.25, metalness: 0.1, emissive: 0xff8a2a, emissiveIntensity: 0.8 }));
        lens.position.set(gx, 0, 0.02); goggles.add(lens);
      });
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.03), M.drone);
      strap.position.set(0, 0, -0.06); goggles.add(strap);

      // ---- Dr Girlfriend herself. ROUND 4 (Ian): "she needs to be not animated at all... we can literally
      // just take the reference video, cut her from the reference video and that laughing sequence and if we
      // cut it and frame it right and blow it up in the right way, it'll look exactly the way I want." The
      // round-3 puppet build (torso/lapels/sleeves/badge/writeArm) is gone. She is now the one still image
      // `assets/drgf-laughing-framed.png` - already cut, framed and scaled 3x from the reference footage -
      // standing in the set as a flat photo. Nothing below this point transforms per frame; that is the whole
      // point.
      const HER_X = -0.15, HER_Z = -2.85;
      const her = new THREE.Group(); her.position.set(HER_X, 0, HER_Z); scene.add(her);
      const DRGF_W = 1095, DRGF_H = 798;
      const PLANE_H = 4.6, PLANE_W = PLANE_H * (DRGF_W / DRGF_H);
      const drgfTex = loader.load("assets/drgf-laughing-framed.png");
      drgfTex.colorSpace = THREE.SRGBColorSpace;
      const heroPlane = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_W, PLANE_H),
        new THREE.MeshStandardMaterial({ map: drgfTex, roughness: 0.92, metalness: 0 }));
      heroPlane.position.set(0, PLANE_H / 2 + 0.05, 0.05);
      heroPlane.castShadow = true; heroPlane.receiveShadow = true; her.add(heroPlane);

      // the lamp stays as set dressing - it lights the frame, it no longer needs to hide a face - moved beside
      // the photo instead of over it so it never covers her.
      const lampX = PLANE_W / 2 + 0.75;
      const herCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.4, 6), M.frame);
      herCord.position.set(lampX, 5.4, 0.3); her.add(herCord);
      const herShade = new THREE.Mesh(new THREE.ConeGeometry(0.66, 0.52, 24, 1, true), M.enamel);
      herShade.position.set(lampX, 4.05, 0.3); herShade.castShadow = true; her.add(herShade);
      const herBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffe6bc, emissive: 0xffd9a0, emissiveIntensity: 1.7, roughness: 1 }));
      herBulb.position.set(lampX, 3.89, 0.3); her.add(herBulb);
      const herPool = new THREE.PointLight(0xffdca8, 1.15, 5); herPool.position.set(lampX, 3.7, 0.55); her.add(herPool);

      // her NAME BADGE carries the channel title, standing at the base of the frame like a museum placard.
      (function badge() {
        const c = document.createElement("canvas"); c.width = 512; c.height = 200;
        const x = c.getContext("2d");
        x.fillStyle = "#f4efe2"; x.fillRect(0, 0, 512, 200);
        x.fillStyle = "#7a2fc4"; x.fillRect(0, 0, 512, 12); x.fillRect(0, 188, 512, 12);
        x.fillStyle = "#1b0a2c"; x.textAlign = "center";
        x.font = "bold 62px Georgia, serif"; x.fillText("DR GIRLFRIEND", 256, 96);
        x.fillStyle = "#6a4a92"; x.font = "26px Georgia, serif";
        x.fillText("THE MANUFACTURING FLOOR", 256, 140);
        x.fillStyle = "#7a2fc4"; x.font = "bold 20px Georgia, serif";
        x.fillText("MOM INC", 256, 172);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const b = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.227),
          new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0 }));
        b.position.set(-PLANE_W / 2 + 1.05, 0.3, 0.15); b.rotation.set(-0.05, 0, 0.02);
        her.add(b);
      })();

      const herShadow = contactShadow(PLANE_W * 0.55, 1.0); herShadow.position.set(0, 0.005, 0.9); her.add(herShadow);

      // ---- her gloved hand at the line is deleted (Ian, round 3: "the hands that come down are un
      // necessary"), and as of round 4 there is no hand at all - she is a photograph, not a worker.

      // ---- labels, projected onto the objects they name
      const labels = [];
      function label(target, title, body, foot) {
        const el = document.createElement("div");
        el.className = "dg-lab";
        el.innerHTML = "<s></s><b>" + title + "</b>" + (body ? "<i>" + body + "</i>" : "") + (foot ? "<u>" + foot + "</u>" : "");
        labelBox.appendChild(el);
        const rec = { el: el, target: target, lift: 0.85 };
        labels.push(rec);
        return rec;
      }
      tubes.forEach((t, i) => {
        const rec = label(t, TUBES[i].who, TUBES[i].topic, TUBES[i].cite);
        rec.lift = 0.72 + (i % 2) * 0.66;      // stagger, or six side-by-side labels collide
        t.userData.label = rec;
      });

      // the reveal label: "you are told what kind of alien it is." Empty until the first batch forms, and
      // hidden by the visible-check below the rest of the time - never shows a blank card before then.
      const unitLabel = label(unit, "", "", "");
      unitLabel.lift = 1.25;
      function showCreatureLabel(key) {
        unitLabel.el.innerHTML = "<s></s>" + creatureCard(key);   // one card, shared with the flat station
      }

      // ---- the belt's own travel. Scroll pushes the LINE, never the page, and the camera never moves.
      let beltX = 0, beltTarget = 0, beltRun = 0;
      function readScroll() {
        const sc = screenEl || document.scrollingElement;
        if (!sc) return;
        const max = Math.max(1, sc.scrollHeight - sc.clientHeight);
        const p = Math.min(1, Math.max(0, sc.scrollTop / max));
        // rest at 0: the tubes sit left of the beaker and never overlap it. Scroll only pushes the line
        // LEFT, feeding tubes toward the work position - which is the direction a real line runs.
        beltTarget = -p * 4.2;
      }
      // through ctx: on the television this binds to the SHELL's scroll container, which outlives the
      // channel by definition - the one listener here that would still be firing on a dead closure after
      // a channel change if the runtime were not releasing it.
      ctx.on(screenEl || window, "scroll", readScroll, { passive: true });
      readScroll();

      // layered depth (Ian: "paper cut-outs standing in a set with real depth... layered stage flats that
      // parallax"). The camera itself never travels along the belt, but it leans very slightly toward the
      // pointer, which is enough for a fixed-orientation perspective camera to parallax near paper (the
      // tubes, her) against far paper (the wall posters) - the cheapest version of a multi-plane parallax rig.
      let camBaseX = 0, camBaseY = 3.3, camBaseZ = 11.4, camLookY = 2.7;
      let ptrTX = 0, ptrTY = 0, ptrX = 0, ptrY = 0;
      function trackPointer(clientX, clientY) {
        const r = stage.getBoundingClientRect();
        ptrTX = ((clientX - r.left) / r.width) * 2 - 1;
        ptrTY = ((clientY - r.top) / r.height) * 2 - 1;
      }
      ctx.on(stage, "pointermove", e => trackPointer(e.clientX, e.clientY));
      ctx.on(stage, "pointerleave", () => { ptrTX = 0; ptrTY = 0; });

      function resize() {
        const w = stage.clientWidth || 320, h = stage.clientHeight || 240;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // phones are narrow: back off so the line still reads instead of cropping to a single tube
        const narrow = w / h < 0.95;
        // Ian, 2026-08-28: "okay not whole page but maybe on modile yes". So the framing splits by shape:
        // on a PHONE she fills it, because a tall narrow window has no room for a wide production line;
        // on DESKTOP she is clearly the subject but the belt, the posters and the room still read around her.
        camBaseY = narrow ? 3.5 : 3.3; camBaseZ = narrow ? 8.0 : 11.4; camLookY = narrow ? 3.2 : 2.7;
        camera.position.set(camBaseX, camBaseY, camBaseZ);
        camera.lookAt(0, camLookY, 0);
        camera.updateProjectionMatrix();
      }
      ctx.observe(new ResizeObserver(resize), stage);
      resize();

      // ---- STATION STATE TABLE (required before authoring, plan 4.4/18.x). Four discrete belt positions;
      // "busy" blocks re-entry into any station until its animation finishes, so two stages can never run at
      // once. ALL STATIONS, backgrounded tab: rAF stops firing while hidden; each tween's elapsed time is real
      // wall-clock ms (dt = now-last, clamped to 50ms/frame), so an animation simply FREEZES at its last drawn
      // position and resumes from there on refocus - no frame-count catch-up, no skip-to-end, no NaN.
      //
      // MIX @ WORK_X - entry: page load, or resetLine() after a missed goggles grab. during: player taps
      //   tubes one at a time, unbounded and player-paced; each tap fills the pitcher a little more. exit: 6th
      //   tube poured -> auto-advance to FORM READY, blob appears at WORK_X. props: 6 tubes float on the belt,
      //   pitcher fill rises per tube. saved: poured indices, in the channel's own localStorage key.
      //
      // FORM READY / FORMING @ FORM_X (new) - entry: blob sitting at WORK_X after the 6th pour. during:
      //   player taps the blob -> busy: blob travels WORK_X -> FORM_X, the mould jaws close over it, hold
      //   (~400ms), open, the formed unit is revealed at FORM_X. ~2.5s total, not player-paced. exit: unit
      //   floating at FORM_X -> BOX READY. not saved: a reload here restarts the current batch.
      //
      // BOX READY / BOXING @ BOX_X (new) - entry: unit floating at FORM_X. during: player taps the unit ->
      //   busy: unit travels FORM_X -> BOX_X shrinking into the box, the box appears and its lid closes.
      //   ~1.2s, not player-paced. exit: box sealed at BOX_X -> TAKEN starts immediately. not saved.
      //
      // TAKEN @ BOX_X, then off frame - entry: box sealed at BOX_X. during: the drone flies in, lifts the
      //   box, flies off frame - left exactly as unexplained as it always was. ~3.9s, no player input taken.
      //   exit: drone off frame -> goggles appear, phase="grab" (existing hint-tool mechanic, unchanged). not
      //   saved.
      // ---- the sequence. The MACHINE is `L`, built above the WebGL branch and shared with the flat
      // station (C073): phase, the pour order, what each transition is allowed to do and what gets
      // written to the save file are all decided there. Everything below is the ROOM - the tween chains
      // that animate a transition the machine has already permitted. Nothing here holds a second copy of
      // the phase, which is the whole point: the save file has one author.
      // the mixing colour: "the way you mix it, it makes a different color blob." Recency-weighted so order
      // matters - the last tube poured dominates the final hue, and also decides which of the six MYR5
      // material stills gets revealed at FORM_X (see setUnitVariant/showCreatureLabel below).
      const GOO_BASE_COLOR = 0x7a2fc4, GOO_BASE_EMISSIVE = 0x2a0a44;
      const mixColor = new THREE.Color(GOO_BASE_COLOR);
      function mixIn(idx) {
        mixColor.lerp(new THREE.Color(TUBES[idx].col), 0.55);
        M.goo.color.copy(mixColor);
        M.goo.emissive.copy(mixColor).multiplyScalar(0.4);
      }
      // test/probe hook (round 4): exposes just enough to verify the four-station split, that she is a static
      // photo (no puppet, nothing rebuilt per frame), and which creature variant a batch shipped as. It closes
      // over THIS mount's scene and drives it, so unmount() removes it: left behind it would let a driver pour
      // a tube into a room that is no longer in the document.
      window.__dg = {
        get phase() { return L.phase; },
        get poured() { return L.poured; },
        get order() { return L.order.slice(); },     // the POUR ORDER, which is what decides the material
        stations: { WORK_X: WORK_X, FORM_X: FORM_X, BOX_X: BOX_X },
        jawsExist: !!(jawL && jawR),
        heroIsStaticImage: heroPlane.material.map === drgfTex,
        get lastVariant() { return L.variant(); },
        // Added by packet 13, and only because the conversion rewired the two listeners neither a gate
        // nor a photograph can see. The belt's travel is driven by a listener on the SHELL's scroll
        // container and the camera's lean by one on the stage; both sit at rest in every screenshot, so
        // a silently unbound one is invisible everywhere. These are the readbacks
        // tools/drive_girlfriend.py asserts move.
        get beltX() { return beltX; },
        get camX() { return camera.position.x; },
        // drives the sequence directly, so a probe never has to land a pixel-perfect synthetic click.
        pour: i => pourTube(tubes[i]),
        mould: () => mould(),
        pack: () => pack()
      };
      const anims = [];
      const tween = (ms, fn, done) => anims.push({ t: 0, ms: ms, fn: fn, done: done });
      const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

      // marks a tube spent in the ROOM. Shared by the pour animation and the restore below, because a
      // restored tube has to look exactly as poured as one you watched go in.
      function markSpent(g) {
        g.userData.poured = true;
        pips[g.userData.idx].classList.add("on");
        g.userData.label.el.classList.add("spent");
      }
      function setFill(n) {
        fill.visible = n > 0;
        fill.scale.y = Math.max(0.001, (n / TUBES.length) * 0.9);
        fill.position.y = BELT_Y + 0.2 + fill.scale.y * 0.44;
        gooGlow.intensity = n ? 0.3 + (n / TUBES.length) * 1.5 : 0;
      }

      function pourTube(g) {
        if (!g || !L.pour(g.userData.idx)) return;    // the machine refuses; the room does not animate
        markSpent(g);
        mixIn(g.userData.idx);
        unfloat(g);                                   // it is being worked now, it stops floating

        const from = g.position.clone();
        const lift = from.clone().setY(2.35);
        const over = new THREE.Vector3(WORK_X - BELT.position.x, 2.45, 0.1);
        const fillFrom = fill.scale.y;
        const fillTo = (L.poured / TUBES.length) * 0.9;
        let puffed = false;

        tween(500, t => { g.position.lerpVectors(from, lift, ease(t)); }, () => {
          tween(600, t => { g.position.lerpVectors(lift, over, ease(t)); }, () => {
            tween(700, t => {
              g.rotation.z = -Math.PI * 0.62 * ease(t);
              g.userData.liq.scale.y = Math.max(0.001, 1 - t);
              fill.visible = true;
              fill.scale.y = Math.max(0.001, fillFrom + (fillTo - fillFrom) * t);
              fill.position.y = BELT_Y + 0.2 + fill.scale.y * 0.44;
              gooGlow.intensity = 0.3 + (L.poured / TUBES.length) * 1.5;
              if (!puffed) { puffed = true; puff(new THREE.Vector3(WORK_X, BELT_Y + 1.3, 0.05)); }
            }, () => {
              tween(540, t => {
                g.position.lerpVectors(over, from, ease(t));
                g.rotation.z = -Math.PI * 0.62 * (1 - ease(t));
              }, () => {
                floatIt(g, from.y, 0.045);
                // L.pour() already advanced the machine to "mould" on the sixth, and SAVED it there.
                // The old code did the opposite - it deleted the save file at this point - which is
                // precisely why a reload in the ~2.3s this tween chain takes left a line that could not
                // be poured into and could not be moulded (C072).
                if (L.phase === "mould") {
                  showBlob();
                  say("Six in. That is goo now. Shape it.");
                } else {
                  say((TUBES.length - L.poured) + " tubes left on the line.");
                }
              });
            });
          });
        });
      }

      // the three "a station is ready" reveals, each reached twice: once at the end of the animation that
      // earns it, and once by restoreScene() when a reload lands on that phase (C072).
      function showBlob(instant) {
        blob.visible = true;
        if (instant) { blob.scale.setScalar(1); floatIt(blob, blob.position.y, 0.06); return; }
        blob.scale.setScalar(0.01);
        tween(700, t => blob.scale.setScalar(0.01 + ease(t) * 0.99), () => floatIt(blob, blob.position.y, 0.06));
      }
      function showUnit(instant, done) {
        setUnitVariant(L.variant());                  // whichever tube went in last decides the material
        showCreatureLabel(L.variant());
        unit.visible = true;
        const land = () => { floatIt(unit, unit.position.y, 0.05); done && done(); };
        if (instant) { unit.scale.setScalar(0.92); land(); return; }
        unit.scale.setScalar(0.01);
        tween(700, t => unit.scale.setScalar(ease(t) * 0.92), land);
      }
      function showGoggles(instant, done) {
        goggles.visible = true;
        const land = () => { floatIt(goggles, goggles.position.y, 0.035); done && done(); };
        if (instant) { goggles.scale.setScalar(1); land(); return; }
        goggles.scale.setScalar(0.01);
        tween(600, t => goggles.scale.setScalar(ease(t)), land);
      }

      function mould() {
        // the blob check is the room's own precondition, not the machine's: L advances to "mould" the
        // instant the sixth tube is committed - which is what makes the phase safe to save - but the goo
        // is not on the belt until that pour's 2.3s tween chain has finished emptying the tube into it.
        // A click cannot reach an invisible blob; the probe hook can, and did.
        if (L.phase !== "mould" || !blob.visible) return;
        L.to("busy"); say("");
        unfloat(blob);
        const from = blob.position.clone();
        const to = new THREE.Vector3(FORM_X, BELT_Y + 0.66, 0.05);
        tween(500, t => blob.position.lerpVectors(from, to, ease(t)), () => {
          jawL.visible = true; jawR.visible = true;
          tween(500, t => {
            jawL.position.x = FORM_X - 0.55 + ease(t) * 0.5;
            jawR.position.x = FORM_X + 0.55 - ease(t) * 0.5;
          }, () => {
            blob.visible = false;
            blob.position.copy(from);
            tween(400, () => {}, () => {
              tween(500, t => {
                jawL.position.x = FORM_X - 0.05 - ease(t) * 0.5;
                jawR.position.x = FORM_X + 0.05 + ease(t) * 0.5;
              }, () => {
                jawL.visible = false; jawR.visible = false;
                showUnit(false, () => {
                  L.to("pack");                        // stable: saved, so a reload here has the box to press
                  say("One unit, intact. Box it.");
                });
              });
            });
          });
        });
      }

      // the goggles are set down and the drone comes back for them. Extracted so a reload that lands on
      // "grab" gets the same window rather than a static prop with no drone attached to it (C072).
      function offerGoggles(instant) {
        showGoggles(instant, () => {
          L.to("grab");
          say("She left the goggles. The drone is coming back for them.");
          drone.visible = true;
          const gFrom = new THREE.Vector3(9.5, 5.6, -2.2);
          const gTo = new THREE.Vector3(goggles.position.x, goggles.position.y + 0.85, goggles.position.z);
          tween(3900, t => {
            if (L.phase !== "grab") return;              // already taken by the visitor
            drone.position.lerpVectors(gFrom, gTo, ease(t));
          }, () => {
            if (L.phase !== "grab") { drone.visible = false; return; }
            stealGoggles();
          });
        });
      }

      function pack() {
        if (L.phase !== "pack") return;
        L.to("busy"); say("");
        unfloat(unit);
        const ufrom = unit.position.clone();
        const uto = new THREE.Vector3(BOX_X, BELT_Y + 0.2, 0.05);
        tween(700, t => { unit.position.lerpVectors(ufrom, uto, ease(t)); unit.scale.setScalar(0.92 * (1 - ease(t) * 0.6)); }, () => {
          unit.visible = false;
          unit.position.copy(ufrom);
          box.visible = true;
          box.scale.set(1, 0.01, 1);
          tween(520, t => box.scale.set(1, 0.01 + ease(t) * 0.99, 1), () => {
            // the shell's own effect, reached through the context rather than off window. Note this
            // callback outlives the channel by design - it is the shell's 900ms restore, and it is the
            // shell's to hold.
            if (ctx.mbs && ctx.mbs.wave) ctx.mbs.wave({ after: 900 });
            drone.visible = true;
            const dFrom = new THREE.Vector3(-7, 5.2, -1.6);
            const dTo = new THREE.Vector3(BOX_X, 2.55, 0.05);
            const dOut = new THREE.Vector3(9.5, 5.6, -2.2);
            const bHome = box.position.clone();
            beltRun = 1;                                 // the line runs while the drone comes in
            tween(1500, t => drone.position.lerpVectors(dFrom, dTo, ease(t)), () => {
              tween(700, t => { box.position.y = bHome.y + ease(t) * 0.95; }, () => {
                tween(1700, t => {
                  drone.position.lerpVectors(dTo, dOut, ease(t));
                  box.position.set(drone.position.x, drone.position.y - 0.95, drone.position.z);
                }, () => {
                  drone.visible = false;
                  box.visible = false;
                  box.position.copy(bHome);
                  beltRun = 0;
                  offerGoggles(false);        // one window, then it takes them and the whole line resets
                });
              });
            });
          });
        });
      }

      function resetLine() {
        // put the line back exactly as it started. Nothing is remembered, which is the cost of missing -
        // and that now includes the save file, which L.reset() clears.
        L.reset();
        mixColor.set(GOO_BASE_COLOR);
        M.goo.color.set(GOO_BASE_COLOR); M.goo.emissive.set(GOO_BASE_EMISSIVE);
        unitLabel.el.innerHTML = "";
        setFill(0);
        blob.visible = false; unfloat(blob);
        unit.visible = false; unfloat(unit);
        box.visible = false;
        goggles.visible = false; unfloat(goggles);
        pips.forEach(el => el.classList.remove("on"));
        tubes.forEach(g => {
          g.userData.poured = false;
          g.rotation.z = 0;
          g.userData.liq.scale.y = 1;
          g.position.copy(g.userData.home);
          g.userData.label.el.classList.remove("spent");
          unfloat(g); floatIt(g, g.userData.home.y, 0.045);
        });
      }

      function stealGoggles() {
        L.to("busy");
        unfloat(goggles);
        const from = goggles.position.clone();
        const out = new THREE.Vector3(10.5, 6.0, -2.4);
        say("Too slow. It took them, and the batch with it.");
        tween(1500, t => {
          drone.position.lerpVectors(new THREE.Vector3(from.x, from.y + 0.85, from.z), out, ease(t));
          goggles.position.set(drone.position.x, drone.position.y - 0.75, drone.position.z);
        }, () => {
          drone.visible = false;
          resetLine();
          say("Six tubes on the line. Tap one. Be ready at the end this time.");
        });
      }

      // ---- clicks
      const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
      function use(o) {
        if (o.userData.kind === "tube") pourTube(o);
        else if (o.userData.kind === "blob") mould();
        else if (o.userData.kind === "unit" || o.userData.kind === "box") pack();
        else if (o.userData.kind === "goggles") {
          if (L.phase === "grab") {                     // caught them before the drone did
            L.to("goggles");                            // stable: a reload keeps what was earned
            drone.visible = false;
            say("");
            vis.classList.add("on");
          } else if (L.phase === "goggles") vis.classList.add("on");
        }
      }
      ctx.on(canvas, "click", e => {
        // .channel's zoom:1.15 is retired (2.16/C002), so visual and layout px now agree. The ray is still
        // built from the rect and the event alone, never clientWidth or offsetX: that form is correct under any
        // ancestor scale, and the mixed form is what silently put every click ~15% off on this build.
        const r = canvas.getBoundingClientRect();
        pt.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pt.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(pt, camera);
        const cands = tubes.concat([blob, unit, box, goggles]).filter(o => o.visible !== false);
        const isect = ray.intersectObjects(cands, true);
        if (!isect.length) return;
        let o = isect[0].object;
        while (o && !o.userData.kind && o.parent) o = o.parent;
        if (!o || !o.userData.kind) return;
        use(o);
      });
      // #dgVisX is bound above the WebGL branch now, so the flat station's goggles close too.

      canvas.tabIndex = 0;
      canvas.style.outline = "none";
      let kbFocus = 0;
      function kbCandidates() {
        return tubes.concat([blob, unit, box, goggles]).filter(o => o.visible !== false &&
          !(o.userData.kind === "tube" && o.userData.poured));
      }
      function announceFocus() {
        const c = kbCandidates();
        if (!c.length) return;
        kbFocus = ((kbFocus % c.length) + c.length) % c.length;
        const o = c[kbFocus];
        const nm = o.userData.kind === "tube" ? TUBES[o.userData.idx].who : o.userData.kind;
        say("Keyboard: " + nm + ". Enter to use it, arrows to move.");
      }
      ctx.on(canvas, "keydown", e => {
        const c = kbCandidates();
        if (!c.length) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { kbFocus++; announceFocus(); e.preventDefault(); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { kbFocus--; announceFocus(); e.preventDefault(); }
        else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          use(c[((kbFocus % c.length) + c.length) % c.length]);
        }
      });

      /* ---- COMING BACK TO A LINE IN PROGRESS (C072). This runs LAST, after every transition it may
         need is defined - the old restoreProgress() ran before `tween` even existed, which is part of
         why it could only ever replay tubes and never restore a station.

         Each stable phase is put back with its prop already at rest (`instant`), not re-animated: the
         visitor did not just do that, they did it before the reload, and a 2.5s mould replaying on load
         would claim credit for work they cannot see. "grab" is the one that gets its clock back - the
         drone is part of that phase, not a decoration on it, so a reload there is the same gamble it
         was, not a free pass. "busy" is never saved, so it is never restored. */
      (function restoreScene() {
        if (!L.restore()) { say("Six tubes on the line. Tap one."); return; }
        L.order.forEach(idx => {
          const g = tubes[idx];
          if (!g) return;
          markSpent(g);
          g.userData.liq.scale.y = 0.001;
          mixIn(idx);
        });
        setFill(L.poured);
        if (L.phase === "pour") { say((TUBES.length - L.poured) + " tubes left on the line. Picking up where you left it."); return; }
        if (L.phase === "mould") { showBlob(true); say("Six were already in. That is goo now. Shape it."); return; }
        if (L.phase === "pack") { showUnit(true); say("A unit was already formed. Box it."); return; }
        // grab and goggles: the unit was boxed and flown off before the reload, so only the goggles are left
        if (L.phase === "grab") { offerGoggles(true); return; }
        showGoggles(true);                               // "goggles": already earned, no drone coming back
        say("The batch went out. The goggles are yours.");
      })();

      // ---- frame loop
      let last = performance.now();
      const v = new THREE.Vector3();
      function frame(now) {
        // unmounted: stop before touching the scene. ctx cancels the pending frame as well, so this guard
        // is the belt to that braces - what it actually prevents is a frame already in flight when
        // unmount() ran from rendering into a disposed renderer.
        if (!gl || session !== mine) return;
        const dt = Math.min(50, now - last);
        last = now;

        beltX += (beltTarget - beltX) * (REDUCED ? 1 : 0.08);
        BELT.position.x = beltX;

        // the slats always creep, and run properly while the line is working
        const speed = 0.00022 + beltRun * 0.0022;
        for (let i = 0; i < slats.length; i++) {
          slats[i].position.x += speed * dt * 60;
          if (slats[i].position.x > 13) slats[i].position.x -= 26.4;
        }

        for (let i = anims.length - 1; i >= 0; i--) {
          const a = anims[i];
          a.t += dt;
          const p = Math.min(1, a.t / a.ms);
          a.fn(p);
          if (p >= 1) { anims.splice(i, 1); if (a.done) a.done(); }
        }

        // everything on the line floats: a slow bob, out of phase, never rigid
        if (!REDUCED) for (let i = 0; i < floaters.length; i++) {
          const f = floaters[i];
          f.o.position.y = f.y + Math.sin(now / 900 + f.p) * f.a;
        }

        for (let i = puffs.length - 1; i >= 0; i--) {
          const m = puffs[i];
          m.userData.life += dt;
          m.position.add(m.userData.v);
          m.scale.setScalar(1 + m.userData.life / 700);
          m.material.opacity = Math.max(0, 0.62 - m.userData.life / 1100);
          if (m.material.opacity <= 0) { scene.remove(m); m.material.dispose(); puffs.splice(i, 1); }
        }

        // she does not move. Round 4: no scribble, no lean, no per-frame transform on her at all - she is the
        // still photo, full stop.

        if (drone.visible) props.forEach((p, i) => { p.rotation.y += (i % 2 ? 0.9 : -0.9); });
        if (blob.visible) blob.rotation.y += 0.004;
        if (unit.visible) unit.rotation.y = Math.sin(now / 1600) * 0.16;

        const sw = stage.clientWidth, sh = stage.clientHeight;
        for (let i = 0; i < labels.length; i++) {
          const L = labels[i];
          L.target.getWorldPosition(v);
          v.y += L.lift;
          v.project(camera);
          // target.visible guards the reveal label: without it an empty card would float at FORM_X from the
          // very first frame, before any batch has ever formed.
          const on = L.target.visible !== false && v.z < 1 && Math.abs(v.x) < 0.94;
          L.el.classList.toggle("show", on);
          if (on) {
            // clamp inside the glass: on a 390px phone an un-clamped label runs off the right edge
            const half = L.el.offsetWidth / 2 + 6;
            const px2 = Math.min(sw - half, Math.max(half, (v.x * 0.5 + 0.5) * sw));
            L.el.style.transform = "translate(-50%,-100%) translate(" +
              px2.toFixed(1) + "px," + ((-v.y * 0.5 + 0.5) * sh).toFixed(1) + "px)";
          }
        }

        ptrX += (ptrTX - ptrX) * (REDUCED ? 1 : 0.06);
        ptrY += (ptrTY - ptrY) * (REDUCED ? 1 : 0.06);
        camera.position.x = camBaseX + ptrX * 0.55;
        camera.position.y = camBaseY - ptrY * 0.30;

        renderer.render(scene, camera);
        ctx.frame(frame);
      }
      ctx.frame(frame);
    }).catch(err => {
      if (session !== mine) return;
      console.error("[dg] three.js failed to load", err);
      dg.classList.add("flat");
      runFlat(dg, ctx, L);     // a blocked CDN gets the operable station too, not a paragraph (C073)
    });
  },

  /* What the CONTEXT cannot own, and nothing else. Six listeners - one of them bound to the SHELL's
     scroll container, which outlives the channel by definition - the ResizeObserver and the render
     chain are all registered through ctx and are deliberately not re-listed here. What is left is the
     GPU, and one window global.

     A WebGLRenderer holds a real graphics context, and a browser keeps only a handful of them alive at
     once, silently dropping the OLDEST when a page asks for one too many. So a renderer that outlives
     its channel does not throw; it takes an EARLIER channel's canvas away, several channel changes
     later. dispose() releases the GPU-side resources, and forceContextLoss() hands the context itself
     back rather than waiting for the collector to notice.

     The scene is disposed by WALKING it rather than from a list built at construction time - fuel.js's
     decision, kept because the room is built across a dozen sections and a list appended to at each one
     is a list the next edit forgets. Unlike the museum, nothing here is parented to the camera, so the
     walk misses nothing by starting at the scene. `extra` carries the one class of thing the graph does
     not: the six MYR5 material stills, of which only the last-poured variant is ever a live map.

     The canvas itself is NOT removed here: #dgCanvas is in the fragment's own markup, so it goes when
     the fragment is replaced. Removing it would be reaching into markup this module did not create.

     window.__dg goes because it closes over this mount's scene and can DRIVE it - pour, mould and pack
     are on it. Left behind, a probe could run the line inside a room that is no longer in the document. */
  unmount() {
    session = null;
    try { delete window.__dg; } catch (e) { window.__dg = undefined; }
    if (!gl) return;
    const g = gl;
    gl = null;
    const killMat = (m) => {
      if (!m) return;
      // a material's textures are disposables in their own right, and the canvas-generated ones here
      // (the wall, five posters, every paper card front and back, her name badge, the contact shadow)
      // are the bulk of what this channel puts on the GPU
      for (const k of ["map", "emissiveMap", "normalMap", "roughnessMap", "alphaMap"]) {
        if (m[k]) { try { m[k].dispose(); } catch (e) { /* already gone */ } }
      }
      try { m.dispose(); } catch (e) { /* already gone */ }
    };
    try {
      g.scene.traverse(o => {
        if (o.geometry) { try { o.geometry.dispose(); } catch (e) { /* already gone */ } }
        // dispose() is safe to call twice, which matters here: every material on M is shared across many
        // meshes, slatGeo is one geometry across sixty slats, the beaker glass across four parts and the
        // shadow texture across seven contact shadows, so the walk reaches each of them repeatedly
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(killMat);
      });
    } catch (e) { console.error("[dg] scene teardown", e); }
    g.extra.forEach(x => { try { x.dispose(); } catch (e) { /* already gone */ } });
    try { g.renderer.dispose(); } catch (e) { /* already disposed */ }
    try { g.renderer.forceContextLoss(); } catch (e) { /* context already lost */ }
  },
};
