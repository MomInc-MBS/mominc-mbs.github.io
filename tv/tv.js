// MBS television shell: power gate, knob-on-scroll, press-into-the-glass, channel loading.
(() => {
  const tv = document.getElementById("tv");
  const screen = document.getElementById("screen");
  const channel = document.getElementById("channel");
  const knob = document.getElementById("knob");
  const presses = document.getElementById("presses");
  const power = document.getElementById("power");
  const darkNote = document.getElementById("darkNote");

  // --- the show's clock. Wednesday, 7 to 8 pm, Las Vegas time (Ian, 2026-08-25: one show a week, Wednesday). Change here only.
  const SHOW = { weekday: 3, startHour: 19, endHour: 20, tz: "America/Los_Angeles" };
  // 2.23/C009: every reading of the clock takes `now` as an argument, and only paintDark() supplies
  // the default. A schedule computed from a buried Date.now() passes at 3pm and fails at 3am, so it
  // can never be gated; with `now` on the outside the gate drives it at a fixed instant.
  const WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function showParts(now) {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: SHOW.tz, weekday: "short", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", hour12: false }).formatToParts(now);
    const n = t => +p.find(x => x.type === t).value;
    return { wd: WD.indexOf(p.find(x => x.type === "weekday").value), y: n("year"), m: n("month"), d: n("day"), h: n("hour") % 24 };
  }
  function onAir(now = new Date()) {
    const t = showParts(now);
    return t.wd === SHOW.weekday && t.h >= SHOW.startHour && t.h < SHOW.endHour;
  }
  // The UTC instant of a wall-clock hour in SHOW.tz. Intl formats an instant INTO a zone and will not
  // read one back out, so: guess the instant as though the zone were UTC, format the guess back, and
  // subtract however far off the zone put it. The show starts at 7pm and no US transition lands near
  // it, so a single correction is exact on both sides of a daylight-saving change.
  function zoned(y, m, d, h) {
    const guess = Date.UTC(y, m - 1, d, h);
    const t = showParts(new Date(guess));
    return new Date(guess - (Date.UTC(t.y, t.m - 1, t.d, t.h) - guess));
  }
  function nextStart(now = new Date()) {
    const t = showParts(now);
    let days = (SHOW.weekday - t.wd + 7) % 7;
    if (days === 0 && t.h >= SHOW.endHour) days = 7;   // Wednesday, but tonight's hour is spent: it is next week's show
    return zoned(t.y, t.m, t.d + days, SHOW.startHour);
  }
  const FMT = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" };
  const fmtShow = new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: SHOW.tz }, FMT));
  const fmtHere = new Intl.DateTimeFormat("en-US", FMT);   // no timeZone: whatever zone the visitor is in
  const stamp = t => t.toISOString().split(/[-:]/).join("").slice(0, 15) + "Z";
  function ics(start) {
    const end = new Date(start.getTime() + (SHOW.endHour - SHOW.startHour) * 3600000);
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MOM INC//MBS//EN", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + stamp(start) + "-mbs@momincorporated",
      "DTSTAMP:" + stamp(start),
      "DTSTART:" + stamp(start),
      "DTEND:" + stamp(end),
      "RRULE:FREQ=WEEKLY;BYDAY=WE",
      "SUMMARY:MBS",
      "DESCRIPTION:One show a week on the set.",
      "END:VEVENT", "END:VCALENDAR", "",
    ].join("\r\n");
  }
  // The calendar affordance is a real file, not a link to somebody else's calendar: an .ics the set
  // hands over. Blob rather than a data: URL because Chrome will not download a top-level data: URL.
  let icsUrl = null;
  function calendarLink(start) {
    if (icsUrl) URL.revokeObjectURL(icsUrl);
    icsUrl = URL.createObjectURL(new Blob([ics(start)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.id = "darkAdd"; a.href = icsUrl; a.download = "mbs.ics"; a.textContent = "Add to your calendar";
    return a;
  }
  // The dark screen is the guide. It says the next actual airing - dated, in the show's zone and in
  // the visitor's - and offers the two things they can do about it right now.
  function paintDark(now = new Date()) {
    darkNote.textContent = "";
    if (onAir(now)) { darkNote.dataset.next = ""; darkNote.textContent = "MBS is on air now, until 8. Press power."; return; }
    const start = nextStart(now);
    darkNote.dataset.next = start.toISOString();
    const there = fmtShow.format(start), here = fmtHere.format(start);
    const line = document.createElement("span");
    line.textContent = "Next show " + there + (here === there ? "" : ", " + here + " where you are") + ".";
    darkNote.append(line, document.createElement("br"), calendarLink(start), document.createTextNode(" · or press power now."));
  }

  // --- power
  // 2.13/C006: the warm-up is cancellable. It used to be a bare setTimeout, so pausing (or switching
  // off) during the 900 ms warm-up did nothing and the set came on anyway, mid-pause.
  let cancelWarmUp = null;
  function turnOn() {
    if (tv.dataset.state === "on") return;
    tv.dataset.state = "warming";
    try { sessionStorage.setItem("mbs-on", "1"); } catch {}
    window.MBS_RT.resume("power");
    cancelWarmUp = window.MBS_RT.warmUp(900, () => {
      cancelWarmUp = null;
      tv.dataset.state = "on";
      screen.focus({ preventScroll: true });
    });
  }
  function turnOff() {
    if (cancelWarmUp) { cancelWarmUp(); cancelWarmUp = null; }
    window.MBS.cancelWave && window.MBS.cancelWave();
    window.MBS_RT.pause("power");
    tv.dataset.state = "off"; paintDark(); try { sessionStorage.removeItem("mbs-on"); } catch {}
  }
  power.addEventListener("click", () => (tv.dataset.state === "on" ? turnOff() : turnOn()));

  // --- the picture control (2.22 / C003)
  // How much CRT treatment is on the glass is a PREFERENCE, not progress, so it does not go into
  // state.js: that store is versioned, migrated and validated for what a visitor has earned, and a
  // display setting has no business forcing a schema bump. Its own key, read once, written on change.
  // localStorage rather than sessionStorage because "survives reload" has to mean tomorrow's visit too.
  const PICTURE_KEY = "mbs-picture";
  const pictureBtn = document.getElementById("pictureBtn");
  const pictureLegend = document.getElementById("pictureLegend");
  const clearPicture = () => tv.dataset.picture === "clear";
  function paintPicture() {
    const clear = clearPicture();
    if (pictureBtn) {
      pictureBtn.setAttribute("aria-pressed", clear ? "true" : "false");
      pictureBtn.setAttribute("aria-label", clear ? "Restore the CRT picture" : "Clear picture");
      pictureBtn.title = clear ? "Restore the CRT picture" : "Clear picture";
    }
    // the legend names what pressing DOES, the way GAME/EXIT does two keys along
    if (pictureLegend) pictureLegend.textContent = clear ? "CRT" : "CLEAR";
  }
  function setPicture(clear) {
    if (clear) tv.dataset.picture = "clear"; else delete tv.dataset.picture;
    try { localStorage.setItem(PICTURE_KEY, clear ? "clear" : "crt"); } catch {}
    paintPicture();
  }
  let storedPicture = null; try { storedPicture = localStorage.getItem(PICTURE_KEY); } catch {}
  if (storedPicture === "clear") tv.dataset.picture = "clear";
  paintPicture();
  if (pictureBtn) pictureBtn.addEventListener("click", () => setPicture(!clearPicture()));

  // --- the channel LCD: MOM INC as the heading, then every channel as a card. Built ones link; the rest sit dim until their page exists.
  // Channel data (id/ch/name/head/half/comingSoon/suppressed) is generated from tv/channel-manifest.json
  // into window.MBS_CHANNELS by tools/gen_channels.py (mbs-channels.js, loaded before this file) - three
  // channels carry comingSoon from the manifest's status; one of those three also carries suppressed
  // (its compiled bundle asks for card details; route closed until the rebuild lands, see the
  // suppression register in channel-manifest.json).
  const CHANNELS = [
    ...window.MBS_CHANNELS.channels,
    // the way out of the television and into the games' own pages (plan item 13: the set discovers and
    // launches them, it is no longer the box they have to run inside). Not a channel, so not in the
    // manifest: a navigation link to /games/, kept here.
    { id: "allgames", ch: 0, name: "ALL GAMES", href: "../games/", label: "PLAY" },
  ];
  const COMING_SOON = CHANNELS.filter(c => c.comingSoon).map(c => c.id);   // keep in sync with the list above
  const lcdList = document.getElementById("lcdList");
  const current = new URLSearchParams(location.search).get("ch") || "";
  if (lcdList) CHANNELS.forEach(c => {
    const built = (c.ch > 0 || !!c.href) && !c.suppressed;   // a suppressed channel renders as a dim span, never as a link
    const el = document.createElement(built ? "a" : "span");
    el.className = "lcd-card" + (c.head ? " head" : "") + (c.half ? " half" : "") + (built ? "" : " off") + (c.id === current ? " on" : "");
    el.dataset.id = c.id;
    if (built) el.href = c.href || `?ch=${c.id}`;
    el.innerHTML = `<span class="lcd-ch">${c.ch > 0 ? "CH " + c.ch : (c.label || "CH --")}</span><span class="lcd-name">${c.name}${c.comingSoon ? " (SOON)" : ""}</span>`;
    lcdList.appendChild(el);
  });

  // --- the numbered dial ring: 2 to 13 like a VHF dial, plus U for the UHF click
  const ticks = document.getElementById("dialTicks");
  if (ticks) {
    const labels = ["2","3","4","5","6","7","8","9","10","11","12","13","U"];
    labels.forEach((t, i) => {
      const a = (-150 + i * (300 / (labels.length - 1))) * Math.PI / 180;
      const x = 60 + Math.sin(a) * 50, y = 60 - Math.cos(a) * 50;
      const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
      el.setAttribute("x", x.toFixed(1)); el.setAttribute("y", (y + 3).toFixed(1)); el.setAttribute("text-anchor", "middle"); el.textContent = t;
      ticks.appendChild(el);
    });
  }

  // --- knob turns with scrolling
  screen.addEventListener("scroll", () => {
    knob.style.setProperty("--rot", `${(screen.scrollTop * 0.6) % 360}deg`);
  }, { passive: true });

  // --- press into the glass: a distortion spot at the point, growing while held; the picture sinks toward it
  let active = null, raf = 0, t0 = 0;
  // 2.16/C002: the press-scale is set dressing for the GLASS, not for what is playing on it. Scaling
  // the whole #screen under a live canvas, an embedded game, or a control moves the thing the pointer is
  // already on, so a drag lands off-target and a button pushes itself out from under the finger. Excluded
  // at the shell by what the press LANDED on, not by a class each channel has to remember to add.
  const NO_PRESS = "canvas,iframe,video,button,input,select,textarea,a,label,[role=button],[data-nopress]";
  screen.addEventListener("pointerdown", e => {
    if (tv.dataset.state !== "on") return;
    if (e.target.closest && e.target.closest(NO_PRESS)) return;
    const r = screen.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const p = document.createElement("span"); p.className = "press";
    p.style.left = x + "px"; p.style.top = y + "px";
    presses.appendChild(p);
    active = p; t0 = performance.now();
    screen.style.transformOrigin = `${x}px ${y}px`;
    const grow = now => {
      const held = Math.min((now - t0) / 1400, 1);              // full size after 1.4 s of hold
      const k = 0.25 + held * 2.4;                                // spot radius grows with the hold
      p.style.setProperty("--k", k.toFixed(3));
      screen.style.transform = `scale(${1 - 0.012 - held * 0.028})`;
      if (active === p) raf = requestAnimationFrame(grow);
    };
    raf = requestAnimationFrame(grow);
  });
  const release = () => {
    if (!active) return;
    cancelAnimationFrame(raf);
    const p = active; active = null;
    p.classList.add("release");
    screen.style.transform = "";
    setTimeout(() => p.remove(), 450);
  };
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => screen.addEventListener(ev, release));

  // --- MBS.mode: the same TONE switch the standalone /play/ routes publish (mbs-shim.js:18-30), so a
  // channel's live/off-air gate works identically embedded in the television or standalone. Set before
  // the channel loads below, since its re-created scripts read this on their own init. TONE only, never
  // entitlement - a query string can change what a channel looks like, never what it is worth (Codex C6).
  window.MBS = window.MBS || {};
  const mbsMode = new URLSearchParams(location.search).get("mode") === "live" ? "live" : "public";
  document.documentElement.dataset.mode = mbsMode;
  document.documentElement.classList.toggle("mbs-live", mbsMode === "live");
  window.MBS.mode = mbsMode;
  window.MBS.isLive = mbsMode === "live";

  // --- channel: ?ch=<name> loads channels/<name>.html into the glass; no channel = the test card
  const name = new URLSearchParams(location.search).get("ch");
  const testcard = `<section class="testcard" aria-label="MBS test card"><h1>MBS</h1><div class="spacer"></div><p>Mom's Brainwashing Stream. This set is tuned to no one yet.</p></section>`;
  if (name && COMING_SOON.includes(name)) {
    // coming_soon: the channel still has a slot, but there is no game to load - never fetch its fragment
    const c = CHANNELS.find(x => x.id === name);
    channel.innerHTML = `<section class="testcard" aria-label="${c.name} coming soon"><h1>${c.name}</h1><div class="spacer"></div><p>This channel is being rebuilt. Coming soon.</p></section>`;
    document.title = `MBS · ${name}`;
    vfd(String(c.ch), c.name, "COMING SOON");
  } else if (name && /^[a-z0-9-]+$/.test(name)) {
    // 2.17: fetching the fragment, importing a channel module and calling mount() all belong to
    // channel-runtime.js, so the module-loading and error contracts have ONE owner and one failure
    // path. What stays here is the television's own dressing - the VFD readout and the stress gauge -
    // which is the set's job and not the channel's.
    window.MBS_CH.mount(name, channel).then(res => {
      if (!res.ok && !res.legacy) return;     // the runtime rendered the unavailable state; the set keeps working
      document.title = `MBS · ${name}`;
      const root = res.root && res.root.matches("[data-host]") ? res.root : channel.querySelector("[data-host]");
      vfd(root ? root.dataset.ch || "" : "", root ? root.dataset.host : name.toUpperCase(), root ? root.dataset.show || "" : "");
      tv.dataset.gauge = (root && root.dataset.gauge === "off") ? "off" : "";   // a channel can hide the stress meter
      // Not converted to a module yet (2.18 does that one channel at a time): scripts inserted through
      // innerHTML never run, so re-create each one. This is the path with no teardown - it is exactly
      // what channel-runtime.js exists to replace, and it shrinks by one channel per 2.18 micro-step.
      if (res.legacy) {
        channel.querySelectorAll("script").forEach(old => { const s = document.createElement("script"); s.textContent = old.textContent; old.replaceWith(s); });
      }
    });
  } else channel.innerHTML = testcard;

  // --- 2.15 / C001: the game frame. A game channel can take the whole set: data-mode="game" drops the
  // CRT furniture and gives the stage the viewport, with the shell controls kept visible above it.
  //
  // Three things this does NOT do, each on purpose:
  //   - It never re-fetches or re-mounts the channel. Entering and leaving game mode is one attribute
  //     on .tv and the CSS that hangs off it, so the running game keeps its DOM, its canvas and its
  //     variables, and "progress-preserving exit" is a property of the design rather than a promise.
  //   - It never requires fullscreen. The API is called only from the visitor's own click, and a
  //     refusal is not an error path: the in-page expanded layout IS game mode, and fullscreen only
  //     removes the browser chrome on top of it.
  //   - It never writes a second sweep or a second timer. The pause lifecycle is MBS_RT's.
  const gameKey = document.getElementById("gameKey");
  const gameBtn = document.getElementById("gameBtn");
  const gameLegend = document.getElementById("gameLegend");
  const chanRec = (window.MBS_CHANNELS.channels || []).find(c => c.id === name) || {};
  // a coming-soon or suppressed channel loads no fragment at all (above), so there is nothing to frame
  const isGame = !!chanRec.game && !chanRec.comingSoon && !chanRec.suppressed;
  const inGame = () => tv.dataset.mode === "game";

  function paintGame() {
    const on = inGame();
    if (gameBtn) {
      gameBtn.setAttribute("aria-pressed", on ? "true" : "false");
      gameBtn.setAttribute("aria-label", on ? "Exit game" : "Enter game");
      gameBtn.title = on ? "Exit game" : "Enter game";
    }
    if (gameLegend) gameLegend.textContent = on ? "EXIT" : "GAME";
  }

  // The stage changed shape. Pause across the transition and resume on the other side of it: the
  // lifecycle's held-input release is the point, because the pointer or key that entered game mode
  // can be released outside the page and never deliver its keyup. Two frames, so the resume lands
  // after the browser has laid the new stage out rather than during it.
  function settleGame() {
    requestAnimationFrame(() => requestAnimationFrame(() => window.MBS_RT.resume("game")));
  }
  function enterGame() {
    if (!isGame || inGame()) return;
    window.MBS_RT.pause("game");
    window.MBS.cancelWave && window.MBS.cancelWave();     // a sweep is television furniture, not game
    tv.dataset.mode = "game";
    try { sessionStorage.setItem("mbs-game", "1"); } catch {}
    paintGame();
    const el = document.documentElement;
    if (el.requestFullscreen) { const r = el.requestFullscreen(); r && r.catch && r.catch(() => {}); }
    settleGame();
  }
  function exitGame() {
    if (!inGame()) return;
    window.MBS_RT.pause("game");
    delete tv.dataset.mode;
    try { sessionStorage.removeItem("mbs-game"); } catch {}
    paintGame();
    if (document.fullscreenElement && document.exitFullscreen) {
      const r = document.exitFullscreen(); r && r.catch && r.catch(() => {});
    }
    settleGame();
  }
  window.MBS.enterGame = enterGame;
  window.MBS.exitGame = exitGame;
  window.MBS.inGame = inGame;

  if (isGame && gameKey && gameBtn) {
    gameKey.hidden = false;
    gameBtn.addEventListener("click", () => (inGame() ? exitGame() : enterGame()));
    // game mode survives a channel change within the tab, the same way the power state does. Fullscreen
    // cannot: it needs a gesture, so a restored session comes back in the in-page expanded mode.
    let wasGame = false; try { wasGame = sessionStorage.getItem("mbs-game") === "1"; } catch {}
    if (wasGame) { tv.dataset.mode = "game"; settleGame(); }
  } else {
    try { sessionStorage.removeItem("mbs-game"); } catch {}   // tuning to the hub leaves game mode
  }
  paintGame();

  // the accessible exit, beyond the button: Escape leaves game mode, and if the browser drops
  // fullscreen by any route (its own Escape, the window chrome, a gesture) the layout follows it out
  // instead of stranding the visitor in a frame they did not ask to keep.
  document.addEventListener("keydown", e => { if (e.key === "Escape" && inGame()) exitGame(); });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && inGame()) exitGame(); });

  // --- the renderer-resize contract: the renderer follows the STAGE, not the window.
  // Entering game mode changes the stage's box without changing the window's, so a game that sizes
  // itself on a window resize would keep the old letterbox forever. Every game in this tree does size
  // itself that way (mount.js dispatches a resize after injecting a fragment for exactly that reason),
  // so one observer on the stage turns a stage change into the event they already listen for, and not
  // one game file needs editing. Coalesced to a frame, and guarded on the measured box so a game that
  // resizes its own canvas in the handler cannot feed itself.
  if (window.ResizeObserver) {
    let stageRaf = 0, lastBox = "";
    new ResizeObserver(() => {
      const box = screen.clientWidth + "x" + screen.clientHeight;
      if (box === lastBox) return;
      lastBox = box;
      cancelAnimationFrame(stageRaf);
      stageRaf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }).observe(screen);
  }

  // --- the stress gauge, driven by the channel
  const gaugeEl = document.getElementById("gauge"), gaugePct = document.getElementById("gaugePct"), gaugeLabel = document.getElementById("gaugeLabel");
  window.MBS.meter = (pct, label) => {
    const v = Math.max(0, Math.min(100, pct || 0));
    if (gaugeEl) gaugeEl.style.setProperty("--meter", v);
    if (gaugePct) gaugePct.textContent = Math.round(v) + "%";
    if (label && gaugeLabel) gaugeLabel.textContent = label;
  };

  // --- the orange wave, a shared effect every channel can fire: a pixelated band sweeps through the glass.
  // Then, after a pause (opts.after ms, default 1000), the MOM Inc bug glows purple and a purple wave sweeps back through, restoring the page;
  // opts.restore() runs as that wave fires, so a channel can put its own picture back in step with it.
  // 2.14/C007: the sweep engine is tv/mbs-effects.js, shared with mbs-shim.js. It used to be written
  // out here and again there, and both copies accumulated animationend listeners across overlapping
  // waves, so a second wave ran the first one's completion.
  const wave = document.getElementById("wave"), momlogo = document.getElementById("momlogo");
  let liveWave = null;
  window.MBS.wave = (opts = {}) => {
    if (!wave) { opts.restore && opts.restore(); return; }
    liveWave = window.MBS_RT.wave(wave, opts, momlogo);
    return liveWave;
  };
  window.MBS.cancelWave = () => { liveWave && liveWave.cancel && liveWave.cancel(); liveWave = null; };

  // --- the cross-site unlock: each channel's solved interactable turns its LCD card orange and banks its node.
  // Progress persists per visitor; when every node is in, the LCD is armed for the hacked menu (that destination is still to be built). Shared store: mbs-state (tv/state.js), via MBS_STATE.
  // sag and armie went coming_soon (G5) and no longer call MBS.unlock, so the reachable set is whatever
  // the manifest marks active - two other channels deliberately never call it either. MBS_STATE.unlockedActive()
  // filters against the active set on every read, so a stale sag/armie entry from before this change self-heals
  // instead of permanently over- or under-counting a returning visitor's progress.
  const ACTIVE_UNLOCK = window.MBS_CHANNELS.active;
  const NODES = ACTIVE_UNLOCK.length;
  const lcd = document.getElementById("lcd");
  const readUnlock = () => window.MBS_STATE.unlockedActive();
  const paintUnlock = () => {
    const done = readUnlock();
    document.querySelectorAll(".lcd-card").forEach(el => el.classList.toggle("done", done.includes(el.dataset.id)));
    if (lcd) lcd.dataset.count = `${done.length}/${NODES}`;
  };
  const ARMED_MS = 30000;                                   // the unlock window: 30 s from the fifth node, then the purple glow passes and everything returns (Ian, 2026-08-26)
  window.MBS.MAIL = "ianmyersrocks97@gmail.com";           // the one address behind every email link on the network; change here only
  window.MBS.unlock = (site) => {
    if (!site) return;
    window.MBS_STATE.bankUnlock(site);
    paintUnlock(); paintArmed();
    // the missing half of the old chain: unlock() banked the node and told nobody. Only rearmTest() ever
    // fired mbs:arm, and that is the localhost test hook, so a channel listening for it never heard a thing.
    if (window.MBS.armedLeft() > 0) document.dispatchEvent(new CustomEvent("mbs:arm"));
  };
  // Every node is in, but the clock has NOT started. The fourth node always banks on DJ Scratch, Lil
  // Boyfriend, Corgi or Fuel, never on MOM Inc - so starting a 30 s window there meant it had always expired
  // by the time the visitor reached CH 1 and the payoff was unreachable in normal play. (Ian, 2026-08-28:
  // arm on arrival instead. His 30 s stands; it just starts where the event actually happens.)
  window.MBS.armReady = () => { const done = readUnlock(); return ACTIVE_UNLOCK.every(id => done.includes(id)); };  // C004: explicit active-set every(), not a counter
  window.MBS.armHere = () => {                              // a channel calls this on load to start its window
    if (!window.MBS.armReady()) return 0;
    window.MBS_STATE.setArmedAt(Date.now());
    paintArmed();
    document.dispatchEvent(new CustomEvent("mbs:arm"));
    return window.MBS.armedLeft();
  };
  // --- the forms gate (Ian, 2026-08-27): two separate gates, not one.
  // Gate 1, here: fill in every channel's form and MYR5 offers the free workout template outright.
  // Gate 2, above: solve every channel's secret and MBS.unlock banks the node, which is what frees the full coach assistant.
  const FORM_SITES = window.MBS_CHANNELS.forms;   // every built channel that asks the visitor for something; sag and armie are coming soon and ask nothing
  window.MBS.formsDone = () => window.MBS_STATE.formsDone(FORM_SITES);
  window.MBS.form = (site, data) => {                       // a channel calls this when its form is submitted
    if (!site || FORM_SITES.indexOf(site) < 0) return;
    window.MBS_STATE.saveForm(site, data);
    paintForms();
  };
  function paintForms() {
    const { done, need } = window.MBS.formsDone();
    document.querySelectorAll(".lcd-card").forEach(el => el.classList.toggle("filled", FORM_SITES.includes(el.dataset.id) && window.MBS_STATE.formStatus(el.dataset.id) !== "draft"));
    if (done < need) return;
    if (document.getElementById("myrOffer")) return;        // the offer stands once; it is not a nag
    if (sessionStorage.getItem("mbs-offer-shut")) return;
    const bar = document.createElement("div");
    bar.id = "myrOffer"; bar.className = "myr-offer";
    bar.innerHTML = '<img src="assets/myr5-sticker-2.png" alt="" aria-hidden="true">'
      + '<p>I already took the workout template out for you. It is done, it is yours, nobody asked me to. I only need the forms filled so it looks like you earned it.'
      + ' <a href="mailto:' + window.MBS.MAIL + '?subject=' + encodeURIComponent("The free workout template")
      + '&body=' + encodeURIComponent("I did my part. Send the template you already took out.") + '">Send it to me</a></p>'
      + '<button type="button" aria-label="Close">×</button>';
    bar.querySelector("button").addEventListener("click", () => { bar.remove(); try { sessionStorage.setItem("mbs-offer-shut", "1"); } catch {} });
    (document.querySelector(".glass") || document.body).appendChild(bar);
  }

  window.MBS.armedLeft = () => {                            // ms left in the unlock window, or 0
    const at = window.MBS_STATE.getArmedAt() || 0;
    return window.MBS.armReady() && at ? Math.max(0, ARMED_MS - (Date.now() - at)) : 0;
  };
  let armedTimer = 0;
  function paintArmed() {                                   // the LCD goes orange for the window, then the purple wave passes and it returns
    const left = window.MBS.armedLeft();
    if (lcd) { lcd.classList.toggle("armed", left > 0); lcd.style.setProperty("--armed-elapsed", left > 0 ? `-${ARMED_MS - left}ms` : "0ms"); }
    clearTimeout(armedTimer);
    if (left > 0) armedTimer = setTimeout(() => { lcd && lcd.classList.remove("armed"); window.MBS.wave && window.MBS.wave({ after: 0 }); document.dispatchEvent(new CustomEvent("mbs:disarm")); }, left);
  }
  window.MBS.rearmTest = () => {                            // local testing only: pretend the fourth node just banked
    if (!/^(127\.|192\.168\.|100\.|localhost)/.test(location.hostname)) return;
    ACTIVE_UNLOCK.forEach(id => window.MBS_STATE.bankUnlock(id));
    window.MBS_STATE.setArmedAt(Date.now());
    paintUnlock(); paintArmed(); document.dispatchEvent(new CustomEvent("mbs:arm"));
  };
  paintUnlock(); paintArmed(); paintForms();
  if (location.hash === "#armtest") setTimeout(() => window.MBS.rearmTest(), 1200);

  // --- the sub-screen
  function vfd(ch, host, show) {
    document.getElementById("vfdCh").textContent = ch ? `CH ${ch}` : "CH --";
    document.getElementById("vfdName").textContent = host || "MBS";
    document.getElementById("vfdShow").textContent = show || "NO SIGNAL";
  }

  // --- boot: on-air, the set is already on; off-air, the visitor presses power
  // once the visitor has pressed power, the set stays on across channel clicks for the rest of the tab (Ian, 2026-08-26)
  let wasOn = false; try { wasOn = sessionStorage.getItem("mbs-on") === "1"; } catch {}
  if (onAir() || wasOn) { tv.dataset.state = "on"; } else { tv.dataset.state = "off"; paintDark(); }
})();
