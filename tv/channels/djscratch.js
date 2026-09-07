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

export default {
  mount(root, ctx) {
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
    // the customization order: in-character only; a real endpoint (Formspree free tier) can be wired later to actually receive orders
    ctx.on(byId("orderForm"), "submit", e => {
      e.preventDefault();
      const b = byId("orderBtn"); b.textContent = "DRAWING UP YOUR HAND…"; b.disabled = true;
      ctx.timeout(() => { b.textContent = "THAT IS YOUR HAND. NOTHING WAS SENT AND NO FACTORY EXISTS."; }, 1500);
    });

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

  /* No unmount() on purpose, and that is a statement rather than an omission: everything this channel
     opens is a disposable the CONTEXT owns - listeners, the two intervals, the spin and visualiser
     frames, and the AudioContext through ctx.audio, whose close() takes the scheduled oscillators
     with it. mominc needs one because a detached <video> keeps decoding and a video is not a
     disposable the runtime knows about. This channel has no such thing, and a hand-written unmount()
     that re-listed what dispose() already releases is exactly the "channel remembers what it
     created" design channel-runtime.js exists to avoid. */
};
