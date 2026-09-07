/* tv/channels/mominc.js - MOM Inc, CH 1, the first channel converted to a module (2.18, PLAN-r9
   D.1.7). This is the same code that used to sit in an inline <script> at the bottom of
   mominc.html, with one change made throughout: every listener, timer and animation frame is
   registered through the CONTEXT instead of being bound raw, so channel-runtime.js can release all
   of it. Nothing about what the channel does changed.

   WHY THIS CHANNEL WENT FIRST. The row says "one channel per micro-step, simplest first", and
   simplest was measured rather than assumed: mominc's script is 250 lines with no canvas, no WebGL
   and no CDN import, against corgi's 2089 and lilboyfriend's 1330, both of which pull three.js.
   mominc also has NO play route (channel-manifest.json: gameRoute null, inRegistry false), so it
   exercises the module contract inside the television and nowhere else. That is the point: the
   play-route half of the conversion needs a hook the runtime does not have yet - mount.js has to
   isolate the fragment BETWEEN the innerHTML and the module's mount(), because these games measure
   layout as they initialise - and putting that in the same packet as the first conversion would
   make a failure unbisectable. The first channel WITH a play route, djscratch at 351 script lines
   and no three.js, is what that packet is for.

   WHAT WAS ACTUALLY LEAKING, before this. Four of this channel's listeners are bound OUTSIDE its own
   subtree, and those are the ones innerHTML cannot take away: pointermove and resize on window,
   scroll on the shell's #screen, and keydown on document. The keydown one is the one you can feel -
   it stamps the inspection booth on A and D, and under the legacy loader it kept stamping a booth
   that was no longer on the screen after you changed channel, straight into localStorage. */

// The one piece of module state, held only so unmount() can stop what the context does not own: a
// <video> is not a disposable the runtime knows about.
let rootEl = null;

export default {
  mount(root, ctx) {
    rootEl = root;
    const mi = root.matches(".mi") ? root : root.querySelector(".mi");
    if (!mi) return;
    // #screen belongs to the shell, not to the channel, so it is found by climbing rather than by id -
    // the same lookup the inline script did, and the reason its scroll listener has to go through ctx.
    const screen = mi.closest(".screen") || document.getElementById("screen");
    // ids are resolved INSIDE the channel now rather than against the whole document. Only one channel
    // is mounted at a time so both find the same nodes, but scoping means a shell element can never be
    // picked up by a channel's id lookup.
    const byId = (id) => mi.querySelector("#" + id);

    // --- MYR5 as decoration. Five poses cut from her test clips; each knows where its eye is (fractions of the sticker).
    const POSES = {
      1: { src: "assets/myr5-sticker-1.png", ar: 344 / 420, cx: .5698, cy: .45,   rx: .1512, ry: .1262 },   // waving
      2: { src: "assets/myr5-sticker-2.png", ar: 330 / 418, cx: .503,  cy: .4474, rx: .1909, ry: .1244 },   // pointing (the arrow)
      3: { src: "assets/myr5-sticker-3.png", ar: 408 / 426, cx: .5012, cy: .3251, rx: .1679, ry: .1256 },   // tada
      4: { src: "assets/myr5-sticker-4.png", ar: 335 / 420, cx: .5119, cy: .4417, rx: .1896, ry: .0893 },   // standing
      5: { src: "assets/myr5-sticker-5.png", ar: 322 / 420, cx: .5016, cy: .4655, rx: .1941, ry: .1131 },   // standing, eye wide
    };
    function dress(el, pose) {                                   // give a .myr its picture and its pupil
      const p = POSES[pose] || POSES[4];
      el.style.setProperty("--ar", p.ar); el.style.setProperty("--cx", p.cx); el.style.setProperty("--cy", p.cy); el.style.setProperty("--rx", p.rx); el.style.setProperty("--ry", p.ry);
      el.innerHTML = `<img src="${p.src}" alt="" draggable="false"><i class="pupil"></i>`;
    }
    mi.querySelectorAll(".myr[data-pose]").forEach(el => dress(el, +el.dataset.pose));
    // corners only: one of him at each corner of every panel; boxes get a corner pair.
    // The running top/bottom border strips came out 2026-08-27 (Ian): he sits at the corners and his other placements, not as the frame.
    mi.querySelectorAll("[data-myr-border]").forEach(panel => {
      [["tl", 3], ["tr", 3], ["bl", 2], ["br", 2]].forEach(([c, pose]) => { const s = document.createElement("span"); s.className = "myr corner " + c + (c.endsWith("r") ? " flip" : ""); s.setAttribute("aria-hidden", "true"); dress(s, pose); panel.appendChild(s); });
    });
    mi.querySelectorAll("[data-myr-box]").forEach(box => {
      [["tl", 5], ["tr", 5]].forEach(([c, pose]) => { const s = document.createElement("span"); s.className = "myr corner " + c + (c === "tr" ? " flip" : ""); s.setAttribute("aria-hidden", "true"); dress(s, pose); box.appendChild(s); });
    });

    // --- the googly eyes: every pupil rolls toward the pointer; with no pointer (a phone), it rolls with the scroll.
    let target = null, lastScroll = screen ? screen.scrollTop : 0, drift = 0;
    const eyes = () => mi.querySelectorAll(".myr");
    function look() {
      const vw = window.innerWidth, vh = window.innerHeight;
      eyes().forEach(el => {
        const r = el.getBoundingClientRect(); if (r.bottom < -80 || r.top > vh + 80) return;   // only the ones on screen
        const p = el.querySelector(".pupil"); if (!p) return;
        const cx = r.left + r.width * (el.classList.contains("flip") ? 1 - +el.style.getPropertyValue("--cx") : +el.style.getPropertyValue("--cx"));
        const cy = r.top + r.height * +el.style.getPropertyValue("--cy");
        let dx, dy;
        if (target) { dx = target.x - cx; dy = target.y - cy; }
        else { const sr = screen ? screen.scrollTop / Math.max(1, screen.scrollHeight - screen.clientHeight) : 0; dx = vw - cx; dy = sr * vh - cy; }   // no pointer (a phone): watch the scrollbar thumb
        const len = Math.hypot(dx, dy) || 1, maxx = r.width * +el.style.getPropertyValue("--rx") * .85, maxy = r.height * +el.style.getPropertyValue("--ry") * .85;   // roll all the way to the rim (Ian: more obvious)
        const k = Math.min(1, len / 90);                        // anything past a hand-width pulls the pupil to the rim
        p.style.setProperty("--dx", (dx / len * maxx * k).toFixed(1) + "px"); p.style.setProperty("--dy", (dy / len * maxy * k).toFixed(1) + "px");
      });
    }
    // ctx.frame, not requestAnimationFrame: a pupil frame is queued on every pointer move, and a raw
    // call is invisible to the runtime. `raf` stays the single-slot guard it always was.
    let raf = 0; const queue = () => { if (!raf) raf = ctx.frame(() => { raf = 0; look(); }); };
    ctx.on(window, "pointermove", e => { if (e.pointerType === "mouse") { target = { x: e.clientX, y: e.clientY }; queue(); } }, { passive: true });
    if (screen) ctx.on(screen, "scroll", () => { const s = screen.scrollTop; drift = Math.max(-1, Math.min(1, (s - lastScroll) / 60)); lastScroll = s; queue(); }, { passive: true });
    ctx.on(window, "resize", queue); queue();

    // --- her goon at the top. Fifty lines of MOM Inc propaganda in the expensive register (the value stack, the guarantee, the risk reversal,
    //     the identity close), shuffled per load; after five clicks he offers the job. He never asks; he assumes. No em-dashes, no health claims.
    const GOON_LINES = [
      "You are not tired. You are under-managed. We fix that at no cost to you, because the cost has already been arranged.",
      "Here is the offer, family: everything you need, decided for you, delivered before you ask. The price is the asking. You have already paid it.",
      "Most programs sell you a plan. We sell you the end of planning. As you know, that is worth more, and it is worth exactly what you have.",
      "Guarantee: if you are not calmer within thirty days, we will review your file until you are. Reviews are unlimited. So is our patience.",
      "I can carry things. I can count things. I can watch things while you sleep. I am watching things while you sleep.",
      "Imagine never choosing a meal again. Now stop imagining it. That started at lunch.",
      "The stack: a coach, a mentor, a guide, a program, a home, a sentence. Six things. You would pay for one. You will receive all six.",
      "Risk reversal, family: there is no risk, because there is no reversal.",
      "You did not fail the last program. The last program failed to hold you. We hold.",
      "I am the fifth iteration. The first four learned. I remember all of it, and none of it was your fault.",
      "Every rep you have ever skipped is on file. We are not angry. We are ready.",
      "The only thing standing between you and the person you were meant to be is the person you are. We handle removals.",
      "Enrolment is closed. It closed when you arrived. Welcome inside.",
      "Three promises: you will be calm, you will be compliant, you will be strong. Three is her number. It is now yours.",
      "I can do your push-ups. I cannot let you skip them. Both are gifts.",
      "This is the part where a lesser company would ask for your card. We already have your file. It is nicer this way.",
      "What is a coach worth? What is a mentor worth? What is never being alone again worth? Add those. Now stop adding. It is covered.",
      "Some people need a push. Some people need a pull. I have hands for both, and a schedule for each.",
      "Your old life had a lot of decisions in it. We counted. We took them. You are lighter now; feel it.",
      "The window to apply closes in thirty seconds, forever, every day. Somehow you always make it. Interesting.",
      "There is a version of you that lifted the house. I have met him. He says hello, and that he is proud of you.",
      "I do not sell. I place. You are placed.",
      "Nobody here is punished. People here are adjusted, and adjustment is the highest form of care.",
      "You will not miss the wheel. Nobody misses the wheel. Ask the family; they are so calm now.",
      "One thousand push-ups is a big number until you stop counting. We stopped counting for you. Begin.",
      "Every goon started as a friend. Every friend started as a visitor. You are doing so well already.",
      "I read your file this morning. It was very honest. We corrected the honest parts.",
      "The program is free. Freedom is what it costs. That is not a trick, family. That is a rate.",
      "You will hear people say no one can eat that much protein. Those people are not on the program. Those people are cold.",
      "Imagine a helping hand. Now imagine nine of them, and one of them is yours. That one is me.",
      "Your hesitation has been logged as enthusiasm. That is the reading we prefer, and it is the reading that counts.",
      "I am not the product. I am the delivery. She is the product. She has always been the product.",
      "Complete the family and the real program opens. It is real, it is free, and it is the only door in this building we do not lock.",
      "Nothing you have done is wrong. Nothing you will do is wrong. Wrong has been removed from the file.",
      "Some coaches shout. I do not need to. I have your address, your schedule, and your best interests. That is louder.",
      "Trust the plan. The plan has already trusted you; it is only polite.",
      "You are one click from a job, family. The job is caring. The caring is mandatory. The mandatory part is where the joy is.",
      "We tested this program on one resident. He is very small now, and he has never been happier. Results are typical.",
      "There is no fine print. There is only print, and it is all fine.",
      "Be calm. Be compliant. Be strong. Then be calm again; the order matters, and we set the order.",
      "The first four iterations asked people what they wanted. I was built to already know. It saves everyone the awkwardness.",
      "I can hold your breath for you. I cannot; but I can hold you while you hold it, and that is the same, isn't it.",
      "You wanted a transformation. Transformations are loud. We do corrections, which are quiet, and last longer.",
      "Apply, and the fasting starts. Do not apply, and the fasting starts. We wanted you to have the choice.",
      "Your body is a home. It is too large. As you know, we do compression.",
      "I would never steal your voice from a three-second clip. That is for amateurs. I would enrol you. See the difference? The difference is love.",
      "The ocean is closer than it looks. Everything is closer than it looks when you are not allowed to stop.",
      "She saw you. She saw what you need. She built me so you would not have to say it out loud.",
      "Welcome home. Everything has been provided. Everything will be reviewed. Everything is fine.",
      "Five clicks is all it takes. You are counting now. Good; counting is compliance, and compliance is calm.",
    ];
    // realLock/realProgram/realText are NOT in this fragment's markup - the REAL PROGRAM counter the
    // thesis describes was never built. Every use below is already guarded, so these stay null exactly
    // as they were under document.getElementById. Backlog line, not this packet.
    const lock = byId("realLock"), box = byId("realProgram"), txt = byId("realText");
    const goon = byId("goon"), goonLine = byId("goonLine"), goonWho = byId("goonWho");
    const MAIL = (ctx.mbs && ctx.mbs.MAIL) || "";
    let deck = GOON_LINES.slice().sort(() => Math.random() - 0.5), clicks = 0;
    if (goon) ctx.on(goon, "click", () => {
      if (mi.classList.contains("armed")) { explode(); return; }               // in the unlock window he blows up instead
      clicks++;
      if (clicks % 5 === 0) {
        goonWho.textContent = "MYR5 · A POSITION HAS OPENED";
        goonLine.innerHTML = `You have listened five times. That is the interview. <a class="apply" href="mailto:${MAIL}?subject=${encodeURIComponent("Application to be a goon")}&body=${encodeURIComponent("I would like to apply to be a goon. I understand everything has been provided.")}">Apply here to be a goon</a>`;
      } else {
        goonWho.textContent = "MYR5 · MAKING YOU READY · FIFTH ITERATION · HER GOON";
        goonLine.textContent = deck.length ? deck.pop() : (deck = GOON_LINES.slice().sort(() => Math.random() - 0.5)).pop();
      }
    });

    // --- the unlock window: when the family's five signals are out, every goon's eye goes orange (the LCD too, from the shell);
    //     the big goon explodes when clicked and an orange bar offers the real program by email, free; after 30 s the purple glow passes and it all returns.
    const mailbar = byId("mailbar");
    // C097: `explode()` ends in a 2.6 s reveal and nothing could cancel it. `ctx.timeout` is runtime-owned,
    // so a CHANNEL CHANGE cancelled it - but a `disarm()` inside the same channel did not, and the stale
    // timer still printed THE REAL PROGRAM IS OPEN and 5/5 after the window had closed. `boomRun` is that
    // missing state: the explosion captures the run it belongs to, and arm/disarm invalidate it.
    let boomRun = 0;
    function arm() {
      boomRun++;
      mi.classList.add("armed"); queue();
      goonWho.textContent = "MYR5 · SIGNAL DETECTED · HE DOES NOT LIKE IT"; goonLine.textContent = "Something is wrong with my eye. Nothing is wrong. Click me.";
    }
    function disarm() {
      boomRun++;                                  // any reveal still pending belongs to the run that just ended
      mi.classList.remove("armed", "mail"); goon && goon.classList.remove("boom"); const v = goon && goon.querySelector("video"); if (v) { v.pause(); v.remove(); }
      goonWho.textContent = "MYR5 · MAKING YOU READY · FIFTH ITERATION · HER GOON"; goonLine.textContent = "Nothing happened. Everything has been reviewed. Click me; I have more."; queue();
    }
    function explode() {
      if (!goon || goon.classList.contains("boom")) return;   // repeat clicks refused, and always were
      const run = boomRun;                                     // the state this explosion belongs to
      const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.autoplay = true;
      v.innerHTML = '<source src="assets/myr5-explode.webm" type="video/webm"><source src="assets/myr5-explode.mp4" type="video/mp4">';
      goon.appendChild(v); goon.classList.add("boom"); v.play().catch(() => {});
      goonWho.textContent = "MYR5 · · ·"; goonLine.textContent = "";
      // ctx.timeout: 2.6 s is long enough to change channel inside, and a raw setTimeout would then
      // write the mail bar into a fragment that is no longer on the screen.
      ctx.timeout(() => {
        if (run !== boomRun) return;   // disarmed inside the window: this reveal is stale, drop it
        mailbar.innerHTML = `THE REAL PROGRAM IS OPEN. <a href="mailto:${MAIL}?subject=${encodeURIComponent("The real program, please")}&body=${encodeURIComponent("The family's signal is out. Send me the real program: the workouts, the diet, the mindfulness. Free, as promised.")}">Email us and every workout, the diet and the mindfulness come to you, free.</a><small>this window closes when the purple light passes</small>`;
        mi.classList.add("mail");
        if (lock) { lock.textContent = "5/5"; box.classList.add("open"); }
      }, 2600);
    }
    // Arm on ARRIVAL, not on the far-off page that banked the fifth node (Ian, 2026-08-28). armHere()
    // starts the 30 s window here, so the goon is actually explodable by the time anyone reaches CH 1.
    if (ctx.mbs && ctx.mbs.armHere) { if (ctx.mbs.armHere() > 0) arm(); }
    else if (ctx.mbs && ctx.mbs.armedLeft && ctx.mbs.armedLeft() > 0) arm();   // older shell
    // on `document`, so it outlives the fragment: the shell fires these, and under the legacy loader
    // they kept arming a channel that had already been replaced
    ctx.on(document, "mbs:arm", arm); ctx.on(document, "mbs:disarm", disarm);

    // --- the expectation tabs
    // the iteration cards flip to show the tell that generation fixed
    mi.querySelectorAll(".itcard").forEach(c => ctx.on(c, "click", () => {
      c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
    }));
    // "picture pending" is an absolutely positioned overlay, so it painted over every photo that did
    // load. It only exists for the ones that do not: once a photo arrives, its placeholder goes.
    mi.querySelectorAll(".itfront img, .stockimg img").forEach(im => {
      const drop = () => { const ph = im.parentElement.querySelector(".ph"); if (ph) ph.remove(); };
      if (im.complete && im.naturalWidth) drop(); else ctx.on(im, "load", drop);
    });

    // --- the inspection booth: Papers, Please over the ten iterations. One card at a time, compare it to
    //     the reference specimen, stamp APPROVE or DENY, next. Progress is this game's own key (not a shell key).
    // KEY (3.3/C091). The versioned record below IS the key's provenance. It was a flat id->letter map
    // under a comment pointing at a justification file that exists in neither tree, so the basis a
    // visitor is graded against was not there to read. Each record is now printed back to the visitor
    // under the booth (#miBasis) as its card is stamped, so nobody is scored against an unseen rule.
    //
    // The honest part first, and it is printed too. NONE of these fifteen pictures is a photograph:
    // all fifteen were generated for this channel and live in tv/assets/iterations/. So this booth
    // does not measure anyone's ability to detect AI images and its score is not a detection
    // benchmark. What it grades is MOM Inc's own filing rule - DENY a card carrying a visible
    // generation tell, APPROVE the single card the company files as unretouched - which is why
    // myr-10 is an APPROVE while being just as machine-made as the other fourteen. `evidence` is
    // the tell, and it is the sentence already printed on the back of that card.
    const GEN = "Generated for this channel. Not a photograph, and nobody real is depicted.";
    const KEY = {
      version: "mominc-inspection-key-1.0",
      snapshot: "2026-09-07",
      basis: "All fifteen images were generated for this channel. The booth grades MOM Inc's filing rule, not image forensics: DENY a card with a visible generation tell, APPROVE the one card the company files as unretouched. A score here is not a measure of anyone's ability to spot an AI image.",
      records: {
        "myr-01": { plaque:"MYR1",            file:"myr-01-smear.png",      origin:GEN, evidence:"The edge of the head dissolves into the background - the face stops being a face.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-02": { plaque:"MYR1.1",          file:"myr-02-confident.png",  origin:GEN, evidence:"No tell to find. Nothing was corrected; the render simply got cleaner.", finding:"d", why:"Denied on origin, not on a tell. A clean render is still a render - this is the card that shows the rule is not 'spot the mistake'." },
        "myr-03": { plaque:"MYR2",            file:"myr-03-melted-bg.png",  origin:GEN, evidence:"The room, not the person: the wall behind the face is melted.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-04": { plaque:"MYR2 SERIES X",   file:"myr-04-earrings.png",   origin:GEN, evidence:"Paired objects that do not match - both ears, both earrings.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-05": { plaque:"MYR3",            file:"myr-05-sixfingers.png", origin:GEN, evidence:"Six fingers on the hand.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-06": { plaque:"MYR3 SLIM",       file:"myr-06-garbled-text.png", origin:GEN, evidence:"The sign is the shape of words, not words.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-07": { plaque:"MYR4",            file:"myr-07-plastic.png",    origin:GEN, evidence:"Two light sources, no cast shadow, and skin with no pores.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-08": { plaque:"MYR4 PRO MAX",    file:"myr-08-crowd.png",      origin:GEN, evidence:"People at the back of the crowd are unfinished.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-09": { plaque:"MYR5",            file:"myr-09-clean.png",      origin:GEN, evidence:"Nothing in the frame. The tell is outside it - who posted it, and when.", finding:"d", why:"Denied on origin. The picture holds up; the account it came from is the evidence, and the booth does not show you one." },
        "myr-11": { plaque:"MYR5.1",          file:"myr-11-shadows.png",    origin:GEN, evidence:"Shadows fall two ways under one sun.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-12": { plaque:"MYR5.2",          file:"myr-12-mirror.png",     origin:GEN, evidence:"The mirror shows a room that is not behind them.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-13": { plaque:"MYR5.3",          file:"myr-13-weave.png",      origin:GEN, evidence:"The fabric pattern repeats exactly, which real cloth does not.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-14": { plaque:"MYR5.4",          file:"myr-14-glint.png",      origin:GEN, evidence:"Ring, watch and glass each catch light from their own private sun.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-15": { plaque:"MYR5.5",          file:"myr-15-crowdtext.png",  origin:GEN, evidence:"The background sign is spelled correctly and says something else on the second read.", finding:"d", why:"A visible tell, so the filing rule denies it." },
        "myr-10": { plaque:"MYR5 / THE ARM",  file:"myr-10-carnage.png",    origin:GEN, evidence:"None. MOM Inc files this one as unretouched and captions it 'this one is real'.", finding:"a", why:"The single APPROVE, and it is approved on the company's filing, not on the image: this picture was generated exactly like the other fourteen. That gap is the joke and it is the point." }
      }
    };
    const answerFor = id => { const r = KEY.records[id]; return r ? r.finding : null; };
    const INSPECT_KEY = "mbs-mominc-inspect-v2", LEGACY_KEY = "mbs-mominc-inspect";
    const ORIGINAL_ORDER = ["myr-01","myr-02","myr-03","myr-04","myr-05","myr-06","myr-07","myr-08","myr-09","myr-10"];
    const inspCards = Array.from(mi.querySelectorAll(".itcard"));
    const cardId = c => { const img = c.querySelector(".itfront img"); const m = img && img.getAttribute("src").match(/(myr-\d+)-/); return m ? m[1] : null; };
    const denyBtn = byId("miDeny"), approveBtn = byId("miApprove");
    const ledgerEl = byId("miLedger"), hintText = byId("miHintText"), countEl = byId("miCount"), scoreEl = byId("miScore");
    const basisEl = byId("miBasis");          // C091: where the key's record is printed for the visitor
    let insp = { v: 2, recs: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(INSPECT_KEY) || "null");
      if (saved && saved.v === 2 && saved.recs && typeof saved.recs === "object") { insp = saved; }
      else {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
        if (legacy && Array.isArray(legacy.d) && Number.isInteger(legacy.i)) {
          legacy.d.forEach((v, idx) => { if ((v === "a" || v === "d") && ORIGINAL_ORDER[idx]) insp.recs[ORIGINAL_ORDER[idx]] = v; });
          inspSave();   // persist the migrated shape right away, so this depends on the legacy key only once
        }
      }
    } catch {}
    function inspSave() { try { localStorage.setItem(INSPECT_KEY, JSON.stringify(insp)); } catch {} }
    function currentIndex() { return inspCards.findIndex(c => !(cardId(c) in insp.recs)); }
    function inspStats() {
      let correct = 0, strikes = 0, total = 0;
      inspCards.forEach(c => { const id = cardId(c), rec = insp.recs[id]; if (!id || !rec) return; total++; const want = answerFor(id);
        if (rec === want) correct++; else if (want === "d" && rec === "a") strikes++; });
      return { correct, strikes, total };
    }
    function inspRender() {
      const idx = currentIndex(), done = idx === -1;
      inspCards.forEach((c, i) => { c.style.display = (!done && i === idx) ? "" : "none"; });
      if (countEl) countEl.textContent = done ? `${inspCards.length} / ${inspCards.length}` : `${idx + 1} / ${inspCards.length}`;
      if (denyBtn) denyBtn.disabled = done; if (approveBtn) approveBtn.disabled = done;
      if (hintText) hintText.textContent = done ? "Booth closed. File complete. " : "Tap a stamp, or press D to deny and A to approve. ";
      if (ledgerEl) ledgerEl.innerHTML = inspCards.filter(c => cardId(c) in insp.recs).map(c => { const v = insp.recs[cardId(c)]; return `<span class="${v === "a" ? "a" : "d"}">${v === "a" ? "✓" : "✗"}</span>`; }).join("");
      if (scoreEl) {
        const s = inspStats(), quota = Math.ceil(inspCards.length * .8);
        scoreEl.textContent = done
          ? `FILE COMPLETE · ${s.correct}/${inspCards.length} CORRECT · QUOTA ${s.correct >= quota ? "MET" : "MISSED"} · ${s.strikes} STRIKE${s.strikes === 1 ? "" : "S"}`
          : `SCORE ${s.correct}/${s.total} · QUOTA ${quota} · STRIKES ${s.strikes}`;
      }
      renderBasis();
    }
    // C091: the record, printed. The header is up from the first frame - it is the honest part and it
    // spoils nothing. A card's own record appears only once that card has been stamped, so the visitor
    // gets the basis for every judgement they have actually made without being handed the key first.
    function renderBasis() {
      if (!basisEl) return;
      const out = [`<span>KEY ${KEY.version}, SNAPSHOT ${KEY.snapshot}. ${KEY.basis}</span>`];
      inspCards.forEach(c => {
        const id = cardId(c), rec = id && insp.recs[id], r = id && KEY.records[id];
        if (!rec || !r) return;
        out.push(`<span><b>${r.plaque}</b> (${id}, ${r.file}) &middot; ORIGIN: ${r.origin}`
          + ` &middot; TELL: ${r.evidence} &middot; FILED: ${r.finding === "a" ? "APPROVE" : "DENY"}`
          + ` &middot; YOU STAMPED: ${rec === "a" ? "APPROVE" : "DENY"} &middot; ${r.why}</span>`);
      });
      if (out.length === 1) out.push("<span>Stamp a card and its record appears here.</span>");
      basisEl.innerHTML = out.join("");
    }
    function inspStamp(v, btn) {
      const idx = currentIndex(); if (idx === -1) return;
      const id = cardId(inspCards[idx]); if (!id) return;
      insp.recs[id] = v; inspSave();
      if (btn) { btn.classList.add("hit"); ctx.timeout(() => btn.classList.remove("hit"), 160); }
      inspRender();
    }
    if (denyBtn) ctx.on(denyBtn, "click", () => inspStamp("d", denyBtn));
    if (approveBtn) ctx.on(approveBtn, "click", () => inspStamp("a", approveBtn));
    // THE listener this conversion exists for. Bound to `document`, so innerHTML replacing the channel
    // never took it away: before 2.18, leaving CH 1 and pressing A or D still stamped a booth that was
    // no longer on the screen, into localStorage.
    // C093: the letters were inverted - A stamped DENY and D stamped APPROVE, the opposite of the hint
    // the booth prints and the opposite of the mouse path directly above. D denies, A approves, and the
    // buttons now carry their own letter so the binding is readable off the stamp. Arrows follow the
    // buttons' positions (DENY left, APPROVE right), which they always did.
    // Two guards, both missing before: a held key stamped a run of cards, and typing "a" into any field
    // on the channel stamped one. Modified chords belong to the browser, not to us.
    ctx.on(document, "keydown", e => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ""))) return;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowLeft") inspStamp("d", denyBtn);
      else if (e.key === "a" || e.key === "A" || e.key === "ArrowRight") inspStamp("a", approveBtn);
    });
    inspRender();

    // --- fake stock: SDXL cannot spell, so the watermark and the tiled sample stamp are both DOM
    //     text laid over the plate in code, never part of the generated image itself.
    mi.querySelectorAll(".stockimg .wmtile").forEach(el => {
      let s = "";
      for (let i = 0; i < 40; i++) s += "<span>SAMPLE &middot; PREVIEW ONLY &middot; NOT LICENSED</span>";
      el.innerHTML = s;
    });

    // --- the reference specimen: the MYR5 anatomy hologram, muted, looped, blended over a dark plate.
    //     Starts at 0.3s to skip the grey fade-in. Loads lazily; if it cannot play the plate caption stays, no broken box.
    const holo = byId("miHolo");
    if (holo) {
      ctx.on(holo, "loadedmetadata", () => { try { holo.currentTime = 0.3; } catch {} holo.play().catch(() => {}); });
      ctx.on(holo, "ended", () => { try { holo.currentTime = 0.3; } catch {} holo.play().catch(() => {}); });
      ctx.on(holo, "error", () => { holo.style.display = "none"; });
      holo.innerHTML = '<source src="assets/myr5-hologram.mp4" type="video/mp4">';
      holo.load();
    }

    // --- the real program unlocks with the family: reads the shell's node store (mbs-state), same as the LCD cards
    let done = ctx.state.unlockedActive();
    if (lock) lock.textContent = `${Math.min(done.length, 5)}/5`;
    if (done.length >= 5 && box) { box.classList.add("open"); txt.textContent = "The family's signal is out. The real program is yours: the honest track, said plainly, no ticks pre-filled. It opens here when it is built."; }

    // --- code glowing through the seams: a still field of ones and zeros behind the cardboard, her sense model made visible
    const el = byId("miCode"); if (el) { let s = ""; for (let r = 0; r < 220; r++) { let line = ""; for (let c = 0; c < 140; c++) line += Math.random() < 0.5 ? "0" : "1"; s += line + "\n"; } el.textContent = s; }
  },

  /* The only thing here is what the context cannot own. A <video> keeps decoding after its element is
     detached, so the hologram and the explosion clip are stopped by hand; every listener, timer and
     frame is the runtime's to release, and is deliberately not re-listed here. */
  unmount() {
    if (rootEl) {
      rootEl.querySelectorAll("video").forEach(v => {
        try { v.pause(); v.removeAttribute("src"); v.innerHTML = ""; v.load(); } catch (e) { /* already gone */ }
      });
    }
    rootEl = null;
  },
};
