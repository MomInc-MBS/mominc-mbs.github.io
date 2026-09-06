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
  function onAir(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: SHOW.tz, weekday: "short", hour: "numeric", hour12: false }).formatToParts(now);
    const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(parts.find(p => p.type === "weekday").value);
    const h = +parts.find(p => p.type === "hour").value % 24;
    return wd === SHOW.weekday && h >= SHOW.startHour && h < SHOW.endHour;
  }
  function nextAirText() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: SHOW.tz, weekday: "short" }).formatToParts(now);
    const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(parts.find(p => p.type === "weekday").value);
    const days = (SHOW.weekday - wd + 7) % 7;
    return days === 0 ? "MBS airs tonight at 7. Press power." : days === 1 ? "MBS airs tomorrow at 7. Press power." : `MBS airs Wednesday at 7. ${days} days. Press power.`;
  }

  // --- power
  function turnOn() {
    if (tv.dataset.state === "on") return;
    tv.dataset.state = "warming";
    try { sessionStorage.setItem("mbs-on", "1"); } catch {}
    setTimeout(() => { tv.dataset.state = "on"; screen.focus({ preventScroll: true }); }, 900);
  }
  function turnOff() { tv.dataset.state = "off"; darkNote.textContent = "Off. Press power."; try { sessionStorage.removeItem("mbs-on"); } catch {} }
  power.addEventListener("click", () => (tv.dataset.state === "on" ? turnOff() : turnOn()));

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
  screen.addEventListener("pointerdown", e => {
    if (tv.dataset.state !== "on") return;
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
    fetch(`channels/${name}.html`, { cache: "no-store" }).then(r => r.ok ? r.text() : Promise.reject(r.status))   // phone testing: every refresh is the current file
      .then(html => {
        channel.innerHTML = html; document.title = `MBS · ${name}`;
        const root = channel.querySelector("[data-host]");
        vfd(root ? root.dataset.ch || "" : "", root ? root.dataset.host : name.toUpperCase(), root ? root.dataset.show || "" : "");
        tv.dataset.gauge = (root && root.dataset.gauge === "off") ? "off" : "";   // a channel can hide the stress meter
        // scripts inserted through innerHTML never run; re-create each one so the channel's own behaviour starts
        channel.querySelectorAll("script").forEach(old => { const s = document.createElement("script"); s.textContent = old.textContent; old.replaceWith(s); });
      })
      .catch(() => { channel.innerHTML = testcard; });
  } else channel.innerHTML = testcard;

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
  const wave = document.getElementById("wave"), momlogo = document.getElementById("momlogo");
  let restoreTimer = 0;
  const sweep = (purple, then) => {
    wave.classList.remove("go"); void wave.offsetWidth;   // restart even mid-sweep
    wave.classList.toggle("purple", purple);
    wave.classList.add("go");
    wave.addEventListener("animationend", () => { wave.classList.remove("go", "purple"); then && then(); }, { once: true });
  };
  window.MBS.wave = (opts = {}) => {
    if (!wave) return;
    clearTimeout(restoreTimer);
    sweep(false, () => {
      restoreTimer = setTimeout(() => {
        momlogo && momlogo.classList.add("glow");
        opts.restore && opts.restore();
        sweep(true, () => setTimeout(() => momlogo && momlogo.classList.remove("glow"), 900));
      }, opts.after ?? 1000);
    });
  };

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
  if (onAir() || wasOn) { tv.dataset.state = "on"; } else { tv.dataset.state = "off"; darkNote.textContent = nextAirText(); }
})();
