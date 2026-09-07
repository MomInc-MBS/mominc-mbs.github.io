/* tv/channels/lilboyfriend.js - LIL BOYFRIEND, CH 2, "Living Small": the FOURTH channel converted to
   a module and the second one that owns a WebGL context for its whole life (2.18, PLAN-r9 D.1.7).
   Same code that sat in an inline <script> at the bottom of lilboyfriend.html, with one change made
   throughout: every listener, timer, ResizeObserver and animation frame is registered through the
   CONTEXT, so channel-runtime.js can release all of it. Nothing about what the channel does changed.

   WHY THIS CHANNEL WENT FOURTH. "Simplest first" among what is left, measured rather than assumed:
   944 script lines against girlfriend's 1026 and corgi's 1662. Those numbers are the corrected ones -
   counting from the FIRST <script> to the first </script> gave this file 1329, because it quotes a
   literal <script> inside its own header comment (explaining why type="module" would throw there) and
   the count started at the comment and swallowed the stylesheet. The real block is the LAST one. That
   mistake picked the wrong next channel once already; see fuel.js's header for the full account.

   WHAT ctx CANNOT OWN HERE. A renderer, a scene graph of some hundred meshes across the hall, six
   exhibits, two props and a door, and every texture in it - all of them generated in canvas (felt
   panels, placards, nameplates, banners, the open guest book) except the twelve photographs, which
   are loaded. None of that is a disposable the context knows about. A browser holds only a handful of
   live WebGL contexts and silently drops the OLDEST once a page opens too many, so a renderer that
   outlives its channel does not throw - it takes an EARLIER channel's canvas away, several channel
   changes later, with no error anywhere. unmount() below is what stops that.

   THE DISPOSAL IS A TRAVERSE, NOT A REGISTER - copied from fuel.js deliberately, and this channel is
   the reason that decision was worth making. The scene is built across a dozen sections of run3D();
   a registration list appended to at each one is a list the next edit forgets, which is the exact
   failure mode channel-runtime.js exists to remove. The graph already knows what it holds, and it
   holds more here than it looks: camera.add() parents the held magnifying glass and the fisheye quad
   to the camera, and scene.add(camera) is what puts them back inside the walk. `extra` carries the
   one class of thing the graph does not - the twelve loaded photographs, of which only the currently
   shown one is ever a live material.map.

   THE WEBGL FEATURE PROBE LEAKED A CONTEXT, and this is the fourth channel found carrying the same
   four lines. Asking a throwaway canvas for a context to prove a context can be had left a REAL live
   context behind on a detached canvas, spending the budget the renderer needs, once per mount.
   WEBGL_lose_context hands it back on purpose. It was invisible on the legacy path because an
   unconverted channel has no teardown to measure; corgi, girlfriend and sag still carry it, and each
   conversion fixes its own.

   THE THREE.JS IMPORT STAYS DYNAMIC, for the same reason as fuel's. A static import resolves before
   this module's body runs, so a CDN outage would fail the whole module and channel-runtime.js would
   correctly render the unavailable testcard - and this channel's no-WebGL fallback (runFlat below) is
   a complete seventeen-step DOM gallery carrying the same photographs, the same sourced facts, the
   same guest book and the same unlock. Failing the module would throw that away to report a missing
   GPU feature. The catch on the import does what the feature probe does: falls back to the gallery. */

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";

/* 2.20 / E.8. The guest book used to ask city, country and household income the moment you walked up to
   the lectern. It asks none of those now: it mounts the assessment engine, and the six questions come
   from JSON. Resolved against import.meta.url rather than written document-relative, because this
   module is reached by dynamic import() from tv/channel-runtime.js and the DOCUMENT is the shell (or a
   /play/<slug>/ route, or a fragment sandbox) - three different base URLs for one file that never
   moves relative to this one. */
const ASSESSMENT_URL = new URL("../data/assessments/lilboyfriend.json", import.meta.url).href;

/* One import and one fetch for the life of the page, not one per mount: check_teardown mounts and
   unmounts this channel repeatedly, and the spec does not change between mounts. Module scope, beside
   `gl` and `session`, for exactly that reason. */
let assessmentLoad = null;
const loadAssessment = () => (assessmentLoad = assessmentLoad ||
  import("../questionnaire.js").then(m => m.load(ASSESSMENT_URL).then(spec => ({ create: m.create, spec }))));

/* The one piece of module state, held for the reason set out above: a WebGLRenderer and a scene graph
   are not disposables the context can own. `session` is the mount token - the three.js import and the
   twelve photograph loads all resolve long after mount() returns, and whatever comes back for a
   session that has already ended must be dropped rather than attached to a fragment that has gone. */
let gl = null;
let session = null;

export default {
  mount(root, ctx) {
    session = {};
    const mine = session;
    const lb = root.matches("#lb") ? root : root.querySelector("#lb");
    if (!lb) return;
    // ids resolve INSIDE the channel now rather than against the whole document: only one channel is
    // mounted at a time so both find the same nodes, but scoping means a shell element can never be
    // picked up by a channel's id lookup.
    const byId = (id) => lb.querySelector("#" + id);

    // The two exceptions, and they are deliberate: .screen and its parent are the TELEVISION, not this
    // channel, and fitViewport()'s whole job is to measure the shell the channel is sitting in. On a
    // play route neither exists, `glass` is null, and the stage keeps its CSS height - which is the
    // behaviour this channel has always had there.
    const screen = lb.closest(".screen") || document.getElementById("screen");
    const glass = screen ? screen.parentElement : null;
    const lbStage = byId("lbStage");

    function fitViewport() {
      if (!glass || !lbStage) return;
      const gh = glass.getBoundingClientRect().height;
      const ribbonH = lb.querySelector(".ribbon").getBoundingClientRect().height;
      const visualTarget = Math.max(240, gh - ribbonH);
      lbStage.style.height = visualTarget + "px";
    }
    if (glass) { ctx.observe(new ResizeObserver(fitViewport), glass); fitViewport(); }

    // ---- data: sourced facts (Part A/C) and housing-help resources (Part B), used exactly as written in
    // LilBF Museum Housing Facts 0901.md. Numbers are never paraphrased.
    const FACTS = {
      teepee: [
        { t: "A1", body: "On one night in January 2024, about 770,000 people in America had nowhere indoors to sleep. That's 18 percent more than the year before. Nobody fixed it. They just counted it again.",
          src: "HUD, 2024 Annual Homelessness Assessment Report, Dec. 2024. archives.hud.gov/news/2024/pr24-327.cfm" },
        { t: "A2", body: "More than a third of those 770,000 people were not even in a shelter. About 277,000 were sleeping outside, in a car, or somewhere never built for a person.",
          src: "HUD AHAR 2024, via National Alliance to End Homelessness. endhomelessness.org/media/news-releases/hud-releases-2024-annual-homelessness-assessment-report" },
        { t: "A3", body: "This city counted 8,859 homeless people in January 2026, twelve percent more than last time. Most of them, 5,017 people, had no shelter at all. You are standing near where some of them are.",
          src: "Southern Nevada Continuum of Care PIT Count, Jan. 2026. lasvegassun.com/news/2026/jul/09/point-in-time-count-reveals-12-rise-in-clark-county" }
      ],
      shoebox: [
        { t: "A4", body: "Half of America's renters spent more than 30 percent of their income on rent in 2023. More than a quarter spent over half of everything they made just to keep a roof.",
          src: "Harvard Joint Center for Housing Studies, State of the Nation's Housing 2025. habitat.org/about/advocacy/housing-report-2025" },
        { t: "A5", body: "A full-time worker needs $33.63 an hour to afford a plain two-bedroom apartment without falling behind. That's more than four times the federal minimum wage.",
          src: "National Low Income Housing Coalition, Out of Reach 2025. nlihc.org/resource/now-available-out-reach-2025-high-cost-housing" },
        { t: "A6", body: "Renting a two-bedroom here takes $33.65 an hour. The average renter in this city earns $22.05 an hour. The math was never going to work out for him either.",
          src: "NLIHC, Out of Reach 2025, Nevada data. nlihc.org/sites/default/files/oor/2025_OOR-Nevada.pdf" }
      ],
      masonjar: [
        { t: "A7", body: "Landlords in this city filed an eviction case against 14 of every 100 renter households in 2025. That's almost double the rate researchers track nationally.",
          src: "Eviction Lab, Princeton University, via Las Vegas Review-Journal. reviewjournal.com/business/housing/eviction-notices-drop-in-las-vegas-but-rates-still-high-for-metro-area-report-says" },
        { t: "A8", body: "For every 100 of the poorest renter households in America, only 35 can find a home they can afford. In Nevada, it's 17. The gap is not an accident, it's arithmetic.",
          src: "NLIHC, The Gap: A Shortage of Affordable Homes, 2025. nlihc.org/news/nlihc-releases-gap-2025-shortage-affordable-homes" },
        { t: "A9", body: "The median home in America hit $412,500 in 2024, 60 percent more than six years earlier. By July 2026 it was $434,100. Nobody's paycheck grew 60 percent.",
          src: "Harvard JCHS, State of the Nation's Housing 2025 (nahb.org); NAR Existing-Home Sales, July 2026." }
      ],
      car: [
        { t: "A10", body: "California cities have been racing to ban it outright. As of January 2025, forty two California cities and two counties had passed some version of a public camping ban since the Supreme Court's Grants Pass ruling, and the newer ones increasingly name the car itself, not just a tent.",
          src: "National Homelessness Law Center, via Stateline, Many more cities ban sleeping outside despite a lack of shelter space, Jan. 27, 2025. stateline.org/2025/01/27/many-more-cities-ban-sleeping-outside-despite-a-lack-of-shelter-space" },
        { t: "A11", body: "San Joaquin County's version goes further than a tent ban. It bans sleeping in a parked car outright, and anyone living outside is required to move at least 300 feet every hour.",
          src: "NPR, 100-plus cities in the U.S. banned homeless camping this year. But will it work?, Dec. 26, 2024. npr.org/2024/12/26/nx-s1-5199103/homeless-camping-bans-grants-pass" },
        { t: "A12", body: "Carlsbad, California counted 60 homeless residents in 2023. By 2024 it was 112, nearly double, in the same stretch the city passed its own ban on camping in a car.",
          src: "San Diego Regional Task Force on Homelessness, Point-in-Time Count, May 22, 2024, via The Coast News. thecoastnews.com" }
      ],
      storage: [
        { t: "A13", body: "A South Salt Lake, Utah storage facility found families bolted inside sheds fitted out with beds, a microwave and a working air conditioner. One held a family of three, including a three month old. Some had been living there six months before anyone found them.",
          src: "KSL.com, Homeless families found living in storage units, 2012. ksl.com/article/20169843" },
        { t: "A14", body: "It is illegal everywhere in the country under fire, sanitation and zoning code. A national survey of 2,000 US adults found one in five, 20 percent, had slept in a self storage unit anyway.",
          src: "StorageUnits.com and Pollfish survey, via PRWeb, Survey Finds 1 in 5 Americans Have Slept in a Storage Unit, June 2025. prweb.com/releases/survey-finds-1-in-5-americans-have-slept-in-a-storage-unit-302499519.html" },
        { t: "A15", body: "Self storage is on track to be a fifty billion dollar industry by 2029, and already runs more than 52,000 facilities covering 2.1 billion square feet. It grows fastest in a downturn: storage companies posted a 5 percent return the same years family homelessness rose 30 percent.",
          src: "Slate, Self-storage units serve as a long-term solution when finding housing or moving isn't an option, Aug. 2024, citing Mordor Intelligence, the US Census Bureau and HUD. slate.com/business/2024/08/self-storage-units-industry-growth-housing-insecurity-evictions.html" }
      ],
      van: [
        { t: "A16", body: "The number of people living full time in a van in the US grew 63 percent in two years, from about 1.9 million in 2020 to 3.1 million in 2022.",
          src: "Statista, via Yahoo Finance, Paying for van life: Costs and statistics, 2025. finance.yahoo.com/news/paying-van-life-202933082.html" },
        { t: "A17", body: "It is marketed as freedom. People are selling million dollar homes to live in one. The median US home costs $434,100. A van is not cheap. It is just cheaper.",
          src: "Moneywise, Wealthy people are selling their million dollar homes to live in a van all year, 2025; NAR Existing-Home Sales, July 2026. moneywise.com/life/lifestyle/vanlife-wealthy-homeowners-hidden-costs" },
        { t: "A18", body: "More than 100 US cities passed a new homeless camping ban in a single year, and enforcement keeps reaching further, past the tent and into anyone parked overnight.",
          src: "NPR, 100-plus cities in the U.S. banned homeless camping this year. But will it work?, Dec. 26, 2024. npr.org/2024/12/26/nx-s1-5199103/homeless-camping-bans-grants-pass" }
      ]
    };
    const RES = {
      B1: { body: "Call 211, anywhere in the country, for shelter, rent help, food, and utility assistance. Free and confidential. In Nevada: 1-866-535-5654 or text your zip code to 898-211.", src: "211.org · nevada211.org" },
      B2: { body: "Free, HUD-approved housing counseling exists for renting, buying, or facing foreclosure. Look up an agency by zip code. No cost, no catch.", src: "consumerfinance.gov/find-a-housing-counselor · 855-411-2372" },
      B3: { body: "If you are homeless or about to be, start with your local Continuum of Care, 211, or social services. Here is how the process actually works.", src: "National Alliance to End Homelessness · endhomelessness.org/how-to-get-help-experiencing-homelessness" },
      B4: { body: "Behind on rent in Clark County? Emergency rental assistance and eviction prevention funds exist. Call and ask before the notice becomes a lockout.", src: "Clark County Social Service · 702-455-4270 · clarkcountynv.gov/residents/assistance_programs/housing-expense-assistance" },
      B5: { body: "Homeless or about to be, in Southern Nevada? This is where the shelter system's front door actually is.", src: "HELP of Southern Nevada · 702-369-4357 · helpsonv.org/get-help" },
      B6: { body: "Facing eviction in Southern Nevada? Free legal help exists, including a hotline and a weekly ask-a-lawyer clinic. Call before the court date, not after.", src: "Legal Aid Center of Southern Nevada · 702-386-1070 · lacsn.org/practice-areas/consumer-rights-project/tenant-rights" },
      B7: { body: "Housing and abuse often trap people together. Free, confidential help is available 24 hours a day, every day.", src: "National Domestic Violence Hotline · 1-800-799-7233 · thehotline.org" },
      B8: { body: "Behind on rent anywhere in the US? This federal tool points you to 211, HUD's housing map, and your local housing agency.", src: "CFPB Rent Help · consumerfinance.gov/renthelp" }
    };
    const RESOURCE_MAP = { teepee: ["B1", "B3", "B5"], shoebox: ["B2", "B4", "B8"], masonjar: ["B6", "B7"], car: ["B1", "B5", "B8"], storage: ["B2", "B4", "B6"], van: ["B3", "B7"] };
    // half the round-2 spacing (0.125 fraction vs 0.25) packs six exhibits into the same HALL_LEN - denser,
    // not longer, per 5.1. Old and new pairs interleave so the walk still reads as a housing progression.
    const EXHIBITS = [
      { id: "teepee", label: "THE TEEPEE", p: 0.15, side: 1, cozy: "assets/lilbf-teepee-cozy.jpg", horror: "assets/lilbf-teepee-horror.jpg" },
      { id: "car", label: "THE CAR", p: 0.275, side: -1, cozy: "assets/lilbf-car-cozy.jpg", horror: "assets/lilbf-car-horror.jpg" },
      { id: "shoebox", label: "THE SHOEBOX", p: 0.4, side: 1, cozy: "assets/lilbf-shoebox-cozy.jpg", horror: "assets/lilbf-shoebox-horror.jpg" },
      { id: "storage", label: "THE STORAGE UNIT", p: 0.525, side: -1, cozy: "assets/lilbf-storage-cozy.jpg", horror: "assets/lilbf-storage-horror.jpg" },
      { id: "masonjar", label: "THE MASON JAR", p: 0.65, side: 1, cozy: "assets/lilbf-masonjar-cozy.jpg", horror: "assets/lilbf-masonjar-horror.jpg" },
      { id: "van", label: "THE VAN", p: 0.775, side: -1, cozy: "assets/lilbf-van-cozy.jpg", horror: "assets/lilbf-van-horror.jpg" }
    ];
    const TITLE_TEXT = { h1: "THE RESIDENTIAL COMPRESSION PROGRAM.", h2: "A MOM Inc retrospective.", body: FACTS.teepee[0].body };
    const CLOSING_LINE = "You leave smaller than you came in. Everyone does.";

    // ---- shared state (v2 adds shrinkStartedAt for 5.3's clock-driven walls). {phase: out|slotted|back|done,
    // t: path position 0..1, signed: bool, shrinkStartedAt: epoch ms|null}. "slotted" replaces round-1's "wired".
    const STORE_KEY_V1 = "mbs-lilbf-museum", STORE_KEY = "mbs-lilbf-museum-v2";
    const PHASES = ["out", "slotted", "back", "done"];   // the allowlist: nothing else has ever been a phase here
    /* 4.1 / F.2. Which of the two presentations the visitor last chose. "museum" is the default because
       it is the RETAINED one - a save written before this field existed, and any save that names a mode
       nobody built, is a visitor who walks the museum, never a visitor staring at a blank stage.

       WHY IT LIVES HERE AND NOT IN `mbs-state`, decided rather than defaulted. tv/state.js holds EARNED
       history - unlocks, submissions, artifacts, the event log - which is the same argument that put
       artifacts and the log there. A mode choice is a PREFERENCE: nothing about it is earned, losing it
       costs one button press, and it is meaningless to any channel but this one. 2.22 is the precedent
       and it went the same way: the CRT picture setting is a preference and got its own key in
       tv/tv.js (PICTURE_KEY), not a field in mbs-state. Two consequences worth stating out loud, since
       the alternative was live: mbs-state's VERSION is untouched and isWellFormed()'s new form.status
       clause is not involved, and sanitize() below already drops unknown keys, so the write end of this
       field is closed by the same code that closes phase's. */
    const MODES = ["museum", "scroll"];
    const SHRINK_MS = 37500;   // matches a straight walk back at WALK_SPEED below - loitering no longer buys safety
    function backfillShrink(phase, t) {
      // deterministic per legacy phase, never NaN/restart/snap-to-full: reproduces the v1 load's own progress
      const impliedProgress = phase === "done" ? 1 : Math.max(0, Math.min(1, 1 - t));
      return Date.now() - impliedProgress * SHRINK_MS;
    }
    /* C018: BOTH load paths used to be a bare Object.assign over the defaults, so whatever parsed was
       adopted whole - `{phase:"banana", t:99, shrinkStartedAt:"x"}` became the museum's state, and only
       the LEGACY path ever backfilled the timestamp. tv/state.js has validated its own key since D.1.2;
       this channel's private key is untrusted input by exactly the same argument, and a save is the one
       input a visitor can hand-edit. Field by field, never merged:
         phase  - allowlisted, anything else is a fresh walk from the entrance
         t      - a finite number clamped to the path, because zAt(t) and the exhibit proximity tests
                  take it on trust and NaN propagates into the camera
         signed - a boolean, so a truthy string cannot half-open the guest book
         shrink - a real epoch ms in the PAST, or it is rebuilt from the phase. A future timestamp (a
                  clock moved back, a hand edit) would hold shrinkProgress() at 0 for as long as it is
                  ahead, which is the walls never closing rather than a wrong-but-visible clock.
       Unknown keys are dropped rather than carried: the four above are the whole schema, and a merge is
       how a stale field from a version that no longer exists gets written straight back out by save().

       Field by field, and NOT the whole record thrown away on the first bad value - unlike tv/state.js,
       which quarantines. There is nothing here worth quarantining (a walk, not a submission), and every
       field repairs to a state the museum reaches on its own anyway: an unreadable phase is a visitor at
       the entrance, and a t of 99 with no phase left is a visitor at the door. Discarding the rest of a
       save because one key was edited costs a real walk to defend against a hand edit that cannot hurt
       anything the clamps already bound. */
    function sanitize(raw) {
      let saved = {}; try { saved = JSON.parse(raw) || {}; } catch {}
      if (typeof saved !== "object" || Array.isArray(saved)) saved = {};
      // round-1's name, remapped on either path: a v2 file never wrote "wired", but reading one as
      // "slotted" costs nothing and refusing it would silently restart a walk that really did happen.
      if (saved.phase === "wired") saved.phase = "slotted";
      const phase = PHASES.indexOf(saved.phase) >= 0 ? saved.phase : "out";
      const rawT = Number(saved.t);
      const st = {
        phase,
        t: Number.isFinite(rawT) ? Math.max(0, Math.min(1, rawT)) : 0,
        signed: saved.signed === true,
        shrinkStartedAt: null,
        // 4.1: allowlisted exactly like `phase`, and for the same reason - it selects which code runs.
        mode: MODES.indexOf(saved.mode) >= 0 ? saved.mode : "museum",
      };
      if (phase !== "out") {
        const at = Number(saved.shrinkStartedAt);
        st.shrinkStartedAt = (Number.isFinite(at) && at > 0 && at <= Date.now()) ? at : backfillShrink(phase, st.t);
      }
      return st;
    }
    function loadState() {
      let raw = null; try { raw = localStorage.getItem(STORE_KEY); } catch {}
      if (raw !== null) return sanitize(raw);
      let legacy = null; try { legacy = localStorage.getItem(STORE_KEY_V1); } catch {}
      return sanitize(legacy || "{}");
    }
    const ST = loadState();
    // test-only, and NOT the same readback as __lbState below: both render paths move ST the moment they
    // boot (the flat gallery's render() snaps phase and t to its nearest step, the 3D walk ends a return
    // that resumes at t=0), so by the time anything can be observed, what loadState() ACCEPTED is already
    // gone. C018 is a claim about the loader, so the loader's own answer is what the gate has to read.
    // Frozen: a reader cannot become a writer. Removed in unmount() with the other hook.
    window.__lbLoaded = Object.freeze(Object.assign({}, ST));
    function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(ST)); } catch {} }

    function fireForm(f) {
      if (ST.signed) return;
      ST.signed = true; saveState();
      ctx.mbs && ctx.mbs.form && ctx.mbs.form("lilboyfriend", f);
    }

    /* 2.20: both render paths put the guest book on screen, so both mount the same engine into whatever
       element they built for it. The engine owns the questions, the privacy statement, the missing-answer
       message and the five outcomes; this channel owns only what happens AFTER a completed assessment -
       the signature. It does not close or advance the panel on completion: the outcomes render into the
       form the visitor just submitted, and dismissing them to prove the submit worked would be the one
       thing E.8's "no email or phone required to reveal the result" is about. Walking on stays a choice.

       A failed load (offline, or the JSON moved) leaves a line of text and the skip link, never a blank
       card, and drops the cached promise so the next visit to the lectern tries again. */
    function mountAssessment(host, onDone) {
      if (!host || host.dataset.qMounted) return;
      host.dataset.qMounted = "1";
      const wanted = assessmentLoad = loadAssessment();
      wanted.then(({ create, spec }) => {
        if (session !== mine || !host.isConnected) return;
        create(host, spec, { onComplete: r => { fireForm(r.answers); onDone && onDone(r); } });
      }).catch(e => {
        console.error("[lb] the guest book could not be loaded", e);
        if (assessmentLoad === wanted) assessmentLoad = null;
        delete host.dataset.qMounted;
        if (session === mine && host.isConnected) host.textContent = "The guest book is not available right now. Walk on.";
      });
    }
    function fireConnect(onVisual) {
      if (ST.phase !== "out") return;   // fires once: never on resume, never from walk again
      ST.phase = "slotted"; ST.shrinkStartedAt = Date.now(); saveState();
      ctx.mbs && ctx.mbs.unlock && ctx.mbs.unlock("lilboyfriend");
      const restore = () => lb.classList.remove("breached");
      lb.classList.add("breached");   // drives the infomercial's own .breached photo flip below, unchanged
      // MBS.wave's own {after, restore} contract is the shell's timer, not this channel's, and it is the
      // shell's to own; the fallback timer when there is no wave() IS this channel's, so it goes through
      // ctx and dies with the mount rather than writing into a fragment that has been replaced.
      if (ctx.mbs && ctx.mbs.wave) ctx.mbs.wave({ after: 5000, restore });
      else ctx.timeout(restore, 5000);
      onVisual && onVisual();
    }
    function isReturning() { return ST.phase === "slotted" || ST.phase === "back" || ST.phase === "done"; }
    function shrinkProgress() {
      // 5.3: driven by elapsed wall-clock time from shrink start, never frame count or return-progress, so
      // standing still (or a throttled/backgrounded tab) no longer stalls or skips the close. Floor is rp=1
      // (the existing WALL_IN/EYE_IN/FOG_*_IN minimum below); it never goes past it, on reload or otherwise.
      if (!isReturning() || !ST.shrinkStartedAt) return 0;
      const raw = Math.max(0, Math.min(1, (Date.now() - ST.shrinkStartedAt) / SHRINK_MS));
      return raw * raw;   // eased in: gentle at first, closing in faster as it goes, per Ian
    }
    // test-only readback for the save-migration fixture check (18.6) - the epilogue phase blocks every normal
    // saveState() path (walking is disabled there), so there is no other way to observe a migrated value
    // without resetting it. Reads ST, changes nothing. Removed in unmount(): it closes over this mount's ST,
    // and a reader that outlives the fragment would be answering about a museum that is no longer there.
    window.__lbState = () => ({ phase: ST.phase, t: ST.t, signed: ST.signed, shrinkStartedAt: ST.shrinkStartedAt, mode: ST.mode, rp: shrinkProgress() });
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- canvas-text sign textures, shared by both render paths' data but only consumed by the 3D path
    // (the flat path renders the same strings as plain DOM text).
    function drawWrapped(c2d, text, x, y, maxW, lh) {
      const words = text.split(" "); let line = "", cy = y;
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (c2d.measureText(test).width > maxW && line) { c2d.fillText(line, x, cy); cy += lh; line = w; }
        else line = test;
      }
      if (line) { c2d.fillText(line, x, cy); cy += lh; }
      return cy;
    }

    // ==== WebGL feature detect ====
    /* Can this browser do WebGL at all? Asked BEFORE the CDN import, so a machine that cannot render the
       hall never downloads three.js to find that out.

       THE PROBE HAS TO GIVE ITS CONTEXT BACK, and the version carried over from the inline script did
       not. Asking a throwaway canvas for a context to prove a context can be had leaves a REAL live
       WebGL context behind, on a detached canvas, held until the collector happens to notice - and a
       browser keeps only a handful alive, dropping the OLDEST when a page asks for one too many. So the
       probe was quietly spending the same budget the renderer needs, once per mount, and the teardown
       gate caught it on fuel the moment that channel became measurable. WEBGL_lose_context is the only
       way to hand one back on purpose. Same four lines were inline here; corgi, girlfriend and sag still
       carry them, and each conversion fixes its own. */
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

    const lbCanvas = byId("lbCanvas"), lbHud = byId("lbHud"), modeBtn = byId("lbModeBtn");

    /* ---- 4.1 / F.2: the two modes -------------------------------------------------------------------
       S1 wants the museum walk AND the scroll presentation, and F.2 resolves that as "both, as modes".
       So the museum is built exactly as it always was - unchanged, on whichever of its two render paths
       this browser earns - and the chapters are a THIRD presentation built beside it, with the stage
       showing one at a time.

       THE MUSEUM IS NOT TORN DOWN TO SHOW THE CHAPTERS, and that is the whole reason this is cheap.
       run3D() registers three window listeners, two ResizeObservers and a frame loop through ctx; calling
       it a second time would register all of them twice, and unwinding a WebGLRenderer to rebuild it on
       the way back is the unmount() path run mid-mount. Hiding costs one CSS class. What it does cost is
       a live GPU context while the chapters are up - which this channel already pays for its whole life
       by design - and that is bought back by the one guard in frame() below, which stops the museum
       RENDERING while it is off screen without stopping the loop that makes coming back instant.

       The chapters are built LAZILY and once: a visitor who never presses the control never pays for
       them, and pressing the control twice does not build them twice. */
    let scrollEl = null;
    function applyMode() {
      const scroll = ST.mode === "scroll";
      if (scroll) buildScroll();
      lbStage.classList.toggle("mode-scroll", scroll);
      if (!modeBtn) return;
      modeBtn.textContent = scroll ? "MUSEUM" : "CHAPTERS";
      modeBtn.setAttribute("aria-label", scroll ? "Switch to the museum walk" : "Switch to the scroll chapters");
    }
    if (modeBtn) ctx.on(modeBtn, "click", () => {
      ST.mode = ST.mode === "scroll" ? "museum" : "scroll";
      saveState();
      applyMode();
    });

    if (glOK) { lb.classList.add("webgl"); run3D(); } else { lbCanvas.remove(); lbHud.remove(); runFlat(); }
    applyMode();

    // =====================================================================================
    // ==== 4.1 / F.2: scroll chapters, the other mode ====
    // =====================================================================================
    /* Six chapters, one per exhibit, in the order the museum walks them - the same six homes, the same
       sourced facts, the same photographs, presented as a vertical read instead of a walk. Nothing here
       is a second copy of the content: EXHIBITS and FACTS are the file's own data and this renders them,
       exactly as runFlat() does. The card and source classes are the flat gallery's too.

       WHAT IS DELIBERATELY NOT HERE, so the next packet does not find it built twice. 4.2 makes each
       chapter sticky and bounds it to one viewport; 4.3 hangs the six consequences off scroll position;
       4.4 makes the shrink exponential and finite; 4.5 and 4.6 build the SHOE as this mode's terminal
       and put completion there. So this mode has no ending beat and no unlock of its own yet: the door,
       the guest book and the epilogue are the museum's, and the museum is one button away at all times,
       which is what "modes, not a replacement" buys. Building a terminal here now would be building
       4.5's terminal twice, which is the mistake Stage 4's ordering exists to prevent. */
    function buildScroll() {
      if (scrollEl) return scrollEl;
      scrollEl = document.createElement("div");
      scrollEl.className = "lb-scroll"; scrollEl.id = "lbScroll";
      scrollEl.setAttribute("aria-label", "Living Small, in chapters");
      const chapters = EXHIBITS.map((ex, i) => `
        <section class="lb-ch" data-chapter="${i + 1}" id="lbCh-${ex.id}">
          <div class="lb-ch-inner">
            <p class="lb-ch-n">Chapter ${i + 1} of ${EXHIBITS.length}</p>
            <h3>${ex.label}</h3>
            <img class="lb-ch-photo" src="${ex.cozy}" alt="${ex.label}" loading="lazy">
            ${FACTS[ex.id].map(f => `<div class="fl-card">${f.body}<span class="fl-src">${f.src}</span></div>`).join("")}
          </div>
        </section>`).join("");
      scrollEl.innerHTML = `
        <section class="lb-ch" id="lbChIntro">
          <div class="lb-ch-inner">
            <span class="fl-name">${TITLE_TEXT.h1}</span>
            <p class="fl-sub">${TITLE_TEXT.h2}</p>
            <p>${TITLE_TEXT.body}</p>
            <p class="fl-sub">Scroll. Six chapters. The walk is still there - the control at the top right goes back to it.</p>
          </div>
        </section>${chapters}
        <section class="lb-ch" id="lbChEnd">
          <div class="lb-ch-inner"><span class="fl-name">${CLOSING_LINE}</span></div>
        </section>`;
      lbStage.appendChild(scrollEl);
      return scrollEl;
    }

    // =====================================================================================
    // ==== 3D path ====
    // =====================================================================================
    function run3D() {
      const HALL_LEN = 60, START_Z = -1, END_Z = START_Z - HALL_LEN, CENTER_Z = (START_Z + END_Z) / 2;
      // the ceiling no longer descends (that read as the walls cropping the view, per Ian) - CEIL_H is fixed.
      // What "vanishes" instead is fog: near/far pull in as the return-trip shrink progresses, so the far hall
      // and its ceiling fade into darkness rather than being pressed down onto the player.
      const WALL_OUT = 1.5, WALL_IN = 0.6, CEIL_H = 3.0, EYE_OUT = 1.5, EYE_IN = 0.9;
      const FOG_NEAR_OUT = 95, FOG_FAR_OUT = 115, FOG_NEAR_IN = 5, FOG_FAR_IN = 13;
      const WALK_SPEED = 1.6 / HALL_LEN;
      const GUESTBOOK_P = 0.035, GUESTBOOK_SIDE = -1, TITLE_P = 0.06, TITLE_SIDE = 1, FUSEBOX_P = 1;
      const zAt = p => START_Z - p * HALL_LEN;
      const wallHalf = rp => WALL_OUT + (WALL_IN - WALL_OUT) * rp;
      const eyeY = rp => EYE_OUT + (EYE_IN - EYE_OUT) * rp;
      const loom = rp => 1 + 0.6 * rp;

      const hint = byId("lbHint"), prompt = byId("lbPrompt");
      const walkBtn = byId("lbWalk"), backBtn = byId("lbBack"), lookZone = byId("lookZone");
      const bookPanel = byId("bookPanel"), wirePanel = byId("wirePanel"), epiPanel = byId("epiPanel");

      import(/* @vite-ignore */ THREE_URL).then(THREE => {
        // the channel was left while the CDN was in flight: build nothing, and above all do not open a
        // WebGL context for a fragment that is no longer in the document
        if (session !== mine) return;

        const renderer = new THREE.WebGLRenderer({ canvas: lbCanvas, antialias: true, preserveDrawingBuffer: true });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0d14, FOG_NEAR_OUT, FOG_FAR_OUT);
        const camera = new THREE.PerspectiveCamera(66, 1, 0.05, 120);
        scene.add(camera);   // a first-person held prop is a camera child; the camera must be a scene member

        // registered BEFORE the scene is populated: if any of the building below throws, the promise's
        // .catch reports it and unmount() still has a renderer and a scene to release. A half-built scene
        // that nothing can dispose is the leak this record exists to prevent.
        gl = { renderer: renderer, scene: scene, extra: [] };

        let yaw = 0, pitch = 0;
        function applyLook() { camera.rotation.order = "YXZ"; camera.rotation.y = yaw; camera.rotation.x = pitch; }

        // ---- felt: the one material vocabulary for this channel (Ian, 0903 texture pass). A soft base
        // colour, short flecked fibre strokes for grain, a dashed running stitch in a contrasting thread
        // colour along the tile border so every repeat reads as a stitched felt panel, and an occasional
        // stray pale thread for the lived-in rule. One generator, reused for every surface and prop below.
        function makeFeltTexture(base, stitch, w = 512, h = 512, repX = 1, repY = 1) {
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          const x = c.getContext("2d");
          x.fillStyle = base; x.fillRect(0, 0, w, h);
          for (let i = 0; i < 2600; i++) {
            const px = Math.random() * w, py = Math.random() * h, a = Math.random() * Math.PI, l = 2 + Math.random() * 5;
            x.strokeStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${0.03 + Math.random() * 0.06})`;
            x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
          }
          x.fillStyle = "rgba(255,255,255,.55)";
          for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 1.6, 0, Math.PI * 2); x.fill(); }
          x.strokeStyle = "rgba(80,60,40,.35)"; x.lineWidth = 1.4;
          x.beginPath(); x.moveTo(w * 0.15, h * 0.2); x.lineTo(w * (0.15 + Math.random() * 0.5), h * (0.2 + Math.random() * 0.5)); x.stroke();
          x.strokeStyle = stitch; x.lineWidth = 3; x.setLineDash([9, 7]);
          x.strokeRect(6, 6, w - 12, h - 12);
          x.setLineDash([]);
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(repX, repY); t.anisotropy = 4; return t;
        }

        // ---- the hall: ONE box, BackSide material so the camera (always inside it) sees the interior faces.
        // Lights below all sit inside this volume, never behind a sealed face - that's what keeps the first
        // render from going pure black. Geometry is unit width/height (translated so floor sits at local y=0)
        // so width/height can be re-scaled every frame instead of rebuilt; length is fixed, never scaled.
        // Walls/ceiling/floor share one felt panel material; the cold multiply on the return still works
        // because a CanvasTexture map is multiplied by material.color exactly like the flat colour it replaces.
        const wallMat = new THREE.MeshStandardMaterial({ map: makeFeltTexture("#ece4d3", "#c9a24c", 512, 512, 14, 3), roughness: 1, metalness: 0, side: THREE.BackSide });
        const hallGeo = new THREE.BoxGeometry(1, 1, HALL_LEN + 8);
        hallGeo.translate(0, 0.5, 0);
        const hallMesh = new THREE.Mesh(hallGeo, wallMat); hallMesh.name = "hall";
        hallMesh.position.set(0, 0, CENTER_Z);
        scene.add(hallMesh);
        const WARM_WALL = new THREE.Color(0xffffff), COLD_WALL = new THREE.Color(0xa9b4c2);

        // ---- the runner rug: a second felt panel, wine-red with a cream stitched border, laid 0.01 above
        // the floor on the centreline so it never z-fights - felt does not fray like a woven rug when cut,
        // it leaves a soft raw fibrous edge, which is this material's version of the spec's fringe.
        const rugMat = new THREE.MeshStandardMaterial({ map: makeFeltTexture("#7a2a3a", "#e8ceb0", 512, 512, 1, 24), roughness: 1, metalness: 0 });
        const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, HALL_LEN + 8), rugMat);
        rugMesh.rotation.x = -Math.PI / 2; rugMesh.position.set(0, 0.01, CENTER_Z);
        scene.add(rugMesh);
        const RUG_WARM = new THREE.Color(0xffffff), RUG_COLD = new THREE.Color(0xa9b4c2);

        scene.add(new THREE.HemisphereLight(0xfff6e6, 0x241d14, 0.65));
        const ambient = new THREE.AmbientLight(0xffffff, 0.55);   // flat, no-normal-dependent floor so a
        scene.add(ambient);                                        // ceiling/wall facet can never render pure black
        const hallLights = [];
        for (let z = START_Z; z >= END_Z; z -= 8) {
          const pl = new THREE.PointLight(0xfff0d0, 1.4, 16, 1.6);
          pl.position.set(0, 2.6, z); scene.add(pl); hallLights.push(pl);
        }
        const WARM_LIGHT = new THREE.Color(0xfff0d0), COLD_LIGHT = new THREE.Color(0x9fb8dd);

        // ---- preload every photo now (both cozy and horror) so the return swap is instant, no load stall.
        // Every one that lands is pushed onto gl.extra: only the CURRENTLY SHOWN photograph is ever a live
        // material.map, so the scene walk in unmount() would reach one of the twelve and miss eleven.
        const loader = new THREE.TextureLoader();
        const tex = {};
        const texPromises = [];
        EXHIBITS.forEach(ex => {
          [["cozy", ex.cozy], ["horror", ex.horror]].forEach(([k, url]) => {
            texPromises.push(new Promise(res => {
              loader.load(url, t => {
                t.colorSpace = THREE.SRGBColorSpace; tex[url] = t;
                if (gl) gl.extra.push(t); else t.dispose();   // landed after the channel left: hand it straight back
                res();
              }, undefined, () => { console.error("[lb] photo failed to load", url); res(); });
            }));
          });
        });

        // review-round fix: placards were unreadable (tiny canvas font, cropped near the floor). fTitle/
        // fBody/fSource are now explicit per call site instead of one-size-fits-all defaults, so a placard
        // (big canvas, big font) and the title wall (smaller) can both use this without fighting each other.
        // placards are felt patches now, not paper cards: a fibre-noise base and a dashed stitched border
        // drawn under the copy, with a soft white text shadow to suggest embroidery. Same 48px body rule.
        function makeSignTexture({ w = 900, h = 620, bg = "#f4ecd8", stitch = "#c9a24c", ink = "#1a1410", title, body, source,
            fTitle = 46, fBody = 32, fSource = 24, lhTitle = 52, lhBody = 42, lhSource = 30, pad = 40 }) {
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          const x = c.getContext("2d");
          x.fillStyle = bg; x.fillRect(0, 0, w, h);
          for (let i = 0; i < Math.round(w * h / 350); i++) {
            const px = Math.random() * w, py = Math.random() * h, a = Math.random() * Math.PI, l = 2 + Math.random() * 4;
            x.strokeStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${0.03 + Math.random() * 0.05})`;
            x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
          }
          x.strokeStyle = stitch; x.lineWidth = 4; x.setLineDash([10, 8]); x.strokeRect(6, 6, w - 12, h - 12); x.setLineDash([]);
          x.shadowColor = "rgba(255,255,255,.55)"; x.shadowOffsetX = 1; x.shadowOffsetY = 1; x.shadowBlur = 0;
          x.fillStyle = ink; x.textBaseline = "top";
          let y = pad;
          if (title) { x.font = `bold ${fTitle}px Georgia, 'Times New Roman', serif`; y = drawWrapped(x, title, pad, y, w - pad * 2, lhTitle) + 16; }
          if (body) { x.font = `${fBody}px Georgia, 'Times New Roman', serif`; y = drawWrapped(x, body, pad, y, w - pad * 2, lhBody) + 14; }
          if (source) { x.font = `italic ${fSource}px Georgia, 'Times New Roman', serif`; x.fillStyle = "rgba(26,20,16,.66)"; drawWrapped(x, source, pad, y, w - pad * 2, lhSource); }
          x.shadowColor = "transparent";
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
        }
        // placard canvas: 800x900, big enough that body text lands >=14 CSS px on screen (mobile) / >=18px
        // (desktop) at the 1.5-unit standing distance, source line >=10px - see the README's review-round
        // section for the math. Placards no longer stack under the photo; they sit at eye height beside it.
        function makePlacardTexture(id, body, source) {
          return makeSignTexture({ w: 800, h: 900, title: id, body, source, fTitle: 44, fBody: 48, fSource: 32, lhTitle: 50, lhBody: 58, lhSource: 39, pad: 42 });
        }
        function makePlateTexture(label) {
          const c = document.createElement("canvas"); c.width = 700; c.height = 150;
          const x = c.getContext("2d");
          x.fillStyle = "#241d14"; x.fillRect(0, 0, 700, 150);
          x.strokeStyle = "#c9a24c"; x.lineWidth = 6; x.strokeRect(6, 6, 688, 138);
          x.fillStyle = "#e6c67a"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "bold 58px Georgia, serif";
          x.fillText(label, 350, 78);
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
        }

        // ---- exhibits: each a small Group so the "photos loom" scale-up on return moves as one unit; the
        // group's own position/scale are recomputed every frame (see updateExhibit), never fixed.
        // review-round fix: placards used to stack below the photo down near the floor, cropped by the
        // viewport bottom and the MOM INC badge, at a canvas font too small to read. Now: photo is smaller,
        // the nameplate sits above it, and the three placards run beside it (not below it) at the SAME eye
        // height as the photo (local y=0, matching the pivot) - so nothing in this group is ever near the
        // floor. Each placard is big (0.8x0.9 units) with a large canvas font (see makePlacardTexture) -
        // legible standing in front of it without needing to be simultaneously framed with the photo on a
        // narrow 390px portrait viewport (the photo and the placard run are read as two separate, both
        // fully-in-frame, glances - like looking at a painting, then turning your head to its wall label -
        // not two things squeezed into one shot; see the README's review-round section for the FOV math on
        // why a 390px-wide view can't hold a legible photo AND a legible placard at once at a fixed 1.5-unit
        // standing distance).
        const PHOTO_W = 1.5, PHOTO_H = 1.05, PLACARD_W = 0.8, PLACARD_H = 0.9, PLACARD_GAP = 0.15;
        // ---- round 3 (0905, "part of the wall, not on a stand"): the case is set INTO the wall - a shallow
        // lit alcove behind a glass pane flush with the wall, a small windowsill lip protruding below it, two
        // pillars flanking it, a felt banner above. CASE_CY matches the full-size wall piece's eye height
        // (1.6) so the discrete swap at the door slot never jumps vertically. The three placards are still a
        // separate group (wallGroup) that never leaves the wall and never case-scales, exactly as the spec
        // requires ("stay on the wall beside it, unchanged").
        const CASE_SCALE = 0.3, CASE_W = 0.85, CASE_H = 0.85, CASE_CY = 1.6;
        const SILL_LIP = 0.11, SILL_H = 0.06, RECESS = 0.14, PILLAR_W = 0.09, PILLAR_PROTRUDE = 0.06;
        const BANNER_H = 0.3, BANNER_GAP = 0.05;
        const frameMat = new THREE.MeshStandardMaterial({ map: makeFeltTexture("#5c4326", "#e6c67a", 256, 256, 2, 2), roughness: 1 });
        const alcoveGeo = new THREE.BoxGeometry(RECESS, CASE_H - 0.05, CASE_W - 0.05);
        const alcoveMat = new THREE.MeshStandardMaterial({ map: makeFeltTexture("#1c1712", "#3c3552", 128, 128), roughness: 1 });
        const glassGeo = new THREE.PlaneGeometry(CASE_W, CASE_H);
        const caseMat = new THREE.MeshPhysicalMaterial({ color: 0xdcefff, transparent: true, opacity: 0.16, roughness: 0.15, side: THREE.DoubleSide });
        const sillGeo = new THREE.BoxGeometry(SILL_LIP + 0.03, SILL_H, CASE_W + 0.14);
        const sillMat = new THREE.MeshStandardMaterial({ map: makeFeltTexture("#c9a24c", "#3c3552", 128, 128, 2, 1), roughness: 0.7 });
        const pillarGeo = new THREE.BoxGeometry(PILLAR_PROTRUDE + 0.02, CASE_H + 0.34, PILLAR_W);
        const pillarMat = new THREE.MeshStandardMaterial({ map: makeFeltTexture("#e6dcc0", "#c9a24c", 128, 128, 1, 3), roughness: 0.85 });
        function makeBannerTexture(label) {
          const w = 420, h = 190; const c = document.createElement("canvas"); c.width = w; c.height = h;
          const x = c.getContext("2d");
          x.fillStyle = "#7a2a3a";
          x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w, h * 0.7); x.lineTo(w * 0.5, h); x.lineTo(0, h * 0.7); x.closePath(); x.fill();
          x.strokeStyle = "#e6c67a"; x.lineWidth = 5; x.stroke();
          x.fillStyle = "#f7eacb"; x.font = "bold 34px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle";
          x.fillText(label, w / 2, h * 0.34);
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
        }
        const exhibitObjs = EXHIBITS.map(ex => {
          const photoGroup = new THREE.Group(); scene.add(photoGroup);
          const photoMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
          const photo = new THREE.Mesh(new THREE.PlaneGeometry(PHOTO_W, PHOTO_H), photoMat); photo.name = ex.id + "-photo";
          photo.position.set(-ex.side * 0.04, 0, 0); photo.rotation.y = -ex.side * Math.PI / 2;
          const frame = new THREE.Mesh(new THREE.PlaneGeometry(PHOTO_W + 0.12, PHOTO_H + 0.12), frameMat);
          frame.position.set(-ex.side * 0.02, 0, 0); frame.rotation.y = -ex.side * Math.PI / 2;
          const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.24), new THREE.MeshBasicMaterial({ map: makePlateTexture(ex.label) }));
          plate.rotation.y = -ex.side * Math.PI / 2;
          photoGroup.add(frame, photo, plate);

          const wallGroup = new THREE.Group(); scene.add(wallGroup);
          const placards = FACTS[ex.id].map((f, i) => {
            const placardZ = PHOTO_W / 2 + PLACARD_GAP + PLACARD_W / 2 + i * (PLACARD_W + PLACARD_GAP);
            const m = new THREE.Mesh(new THREE.PlaneGeometry(PLACARD_W, PLACARD_H), new THREE.MeshBasicMaterial({ map: makePlacardTexture(f.t, f.body, f.src) }));
            m.position.set(-ex.side * 0.03, 0, placardZ); m.rotation.y = -ex.side * Math.PI / 2;
            wallGroup.add(m); return m;
          });

          // the case: built into the wall, not on a stand. The alcove recesses INTO the wall (away from the
          // corridor), the glass sits flush at the wall plane, the sill protrudes a small lip toward the
          // corridor below it, pillars flank it either side, a banner hangs above - all mirrored by "side"
          // the same way the wall pieces already are.
          const caseDecor = new THREE.Group(); scene.add(caseDecor);
          const alcove = new THREE.Mesh(alcoveGeo, alcoveMat); alcove.position.set(ex.side * (RECESS / 2 + 0.01), CASE_CY, 0); caseDecor.add(alcove);
          const glassPane = new THREE.Mesh(glassGeo, caseMat); glassPane.position.set(-ex.side * 0.01, CASE_CY, 0); glassPane.rotation.y = -ex.side * Math.PI / 2; caseDecor.add(glassPane);
          const sill = new THREE.Mesh(sillGeo, sillMat); sill.position.set(-ex.side * (SILL_LIP / 2 + 0.01), CASE_CY - CASE_H / 2 - SILL_H / 2, 0); caseDecor.add(sill);
          const pillarL = new THREE.Mesh(pillarGeo, pillarMat); pillarL.position.set(-ex.side * (PILLAR_PROTRUDE / 2 + 0.01), CASE_CY, -(CASE_W / 2 + PILLAR_W / 2 + 0.04)); caseDecor.add(pillarL);
          const pillarR = pillarL.clone(); pillarR.position.z = CASE_W / 2 + PILLAR_W / 2 + 0.04; caseDecor.add(pillarR);
          const banner = new THREE.Mesh(new THREE.PlaneGeometry(CASE_W * 0.95, BANNER_H), new THREE.MeshBasicMaterial({ map: makeBannerTexture(ex.label), transparent: true }));
          banner.position.set(-ex.side * 0.01, CASE_CY + CASE_H / 2 + BANNER_GAP + BANNER_H / 2, 0); banner.rotation.y = -ex.side * Math.PI / 2;
          caseDecor.add(banner);

          const spot = new THREE.SpotLight(0xfff0d0, 1.3, 6, 0.55, 0.45, 1.6);
          const spotTarget = new THREE.Object3D();
          scene.add(spot, spotTarget); spot.target = spotTarget;
          return { cfg: ex, photoGroup, photo, photoMat, plate, wallGroup, placards, caseDecor, spot, spotTarget, texKeyCozy: ex.cozy, texKeyHorror: ex.horror };
        });

        function updateExhibit(e, rp, caseMode) {
          const half = wallHalf(rp), z = zAt(e.cfg.p);
          e.wallGroup.position.set(e.cfg.side * half, 1.6, z);
          e.wallGroup.scale.setScalar(loom(rp));
          let px, py, pz, pscale;
          if (caseMode) {
            px = e.cfg.side * (half - 0.02); py = CASE_CY; pz = z; pscale = CASE_SCALE;
            e.plate.position.set(-e.cfg.side * 0.03, -PHOTO_H * 0.55, 0.04);
          } else {
            px = e.cfg.side * half; py = 1.6; pz = z; pscale = loom(rp);
            e.plate.position.set(-e.cfg.side * 0.03, PHOTO_H / 2 + 0.18, 0);
          }
          e.photoGroup.position.set(px, py, pz);
          e.photoGroup.scale.setScalar(pscale);
          e.caseDecor.visible = caseMode;
          e.caseDecor.position.set(e.cfg.side * half, 0, z);
          e.spot.position.set(px + (caseMode ? e.cfg.side * -0.35 : e.cfg.side * -0.6), py + 1.1, pz);
          e.spotTarget.position.set(px, py, pz);
        }
        exhibitObjs.forEach(e => updateExhibit(e, 0, true));

        // ---- guest book lectern + title plaque, near the entrance; reposition (not loom-scale) with the
        // shrinking walls so they never float outside the hall on the final approach.
        // review-round fix: this read as a bare brown box - the only thing on top of it was a small dark
        // brass-style plate (the same texture as the exhibit nameplates), which doesn't look like a book at
        // all. Now: an actual open-book texture (cream pages, a centre spine, two columns of ruled lines) on
        // the lectern top, plus a separate wall-mounted GUEST BOOK sign above it so a visitor coming down the
        // hall knows what it is before they're standing on top of it.
        function makeOpenBookTexture() {
          const c = document.createElement("canvas"); c.width = 640; c.height = 420;
          const x = c.getContext("2d");
          x.fillStyle = "#efe6d0"; x.fillRect(0, 0, 640, 420);
          x.strokeStyle = "rgba(60,50,30,.35)"; x.lineWidth = 3;
          [ [0, 0, 320, 420], [320, 0, 320, 420] ].forEach(([px, py, pw, ph]) => x.strokeRect(px + 6, py + 6, pw - 12, ph - 12));
          x.fillStyle = "rgba(40,30,15,.4)"; x.fillRect(316, 0, 8, 420);   // the spine
          x.strokeStyle = "rgba(60,50,30,.5)"; x.lineWidth = 2;
          for (let col = 0; col < 2; col++) for (let i = 0; i < 11; i++) {
            const ly = 40 + i * 32; x.beginPath(); x.moveTo(col * 320 + 34, ly); x.lineTo(col * 320 + 286, ly); x.stroke();
          }
          x.fillStyle = "#241d14"; x.font = "italic 30px Georgia, serif"; x.textAlign = "center";
          x.fillText("guest book", 320, 400);
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
        }
        const bookGroup = new THREE.Group(); scene.add(bookGroup);
        bookGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.4), new THREE.MeshStandardMaterial({ color: 0x5c4326, roughness: 0.9 })));
        const bookTop = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.38), new THREE.MeshBasicMaterial({ map: makeOpenBookTexture(), side: THREE.DoubleSide }));
        bookTop.position.set(0, 0.52, 0); bookTop.rotation.x = -Math.PI / 2.6; bookGroup.add(bookTop);
        const bookSign = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.24), new THREE.MeshBasicMaterial({ map: makePlateTexture("GUEST BOOK") }));
        bookSign.position.set(0, 1.0, 0); bookSign.rotation.y = -GUESTBOOK_SIDE * Math.PI / 2;
        bookGroup.add(bookSign);

        const titleGroup = new THREE.Group(); scene.add(titleGroup);
        const titleTex = makeSignTexture({ w: 1100, h: 640, title: TITLE_TEXT.h1 + "\n" + TITLE_TEXT.h2, body: TITLE_TEXT.body });
        const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.34), new THREE.MeshBasicMaterial({ map: titleTex }));
        titleMesh.rotation.y = -TITLE_SIDE * Math.PI / 2;
        titleGroup.add(titleMesh);

        // insetFrac pulls a prop in from the wall toward the centreline path, so its lateral offset doesn't
        // already eat the whole 1.5-unit near-and-facing budget on its own (a flush wall-mount left almost no
        // z-slack to trigger the guest book's proximity check - found and fixed in this pass, see README).
        function updateProp(group, side, p, rp, insetFrac) { group.position.set(side * (wallHalf(rp) - 0.03) * (insetFrac ?? 1), 1.6, zAt(p)); }
        updateProp(bookGroup, GUESTBOOK_SIDE, GUESTBOOK_P, 0, 0.55);
        updateProp(titleGroup, TITLE_SIDE, TITLE_P, 0, 1);

        // ---- the museum door: felt panel with a magnifying-glass-shaped slot (a dark ring inset, a felt
        // brass rim, a stem below for the handle), replacing the fuse box as the end-hall interactable.
        const doorGroup = new THREE.Group(); doorGroup.position.set(0, 0, zAt(FUSEBOX_P) + 0.04); scene.add(doorGroup);
        doorGroup.add(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.2), new THREE.MeshStandardMaterial({ map: makeFeltTexture("#6b3f4a", "#e6c67a", 512, 512, 1, 2), roughness: 1 })));
        const slotRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 10, 24), new THREE.MeshStandardMaterial({ map: makeFeltTexture("#c9a24c", "#3c3552", 128, 128), roughness: 0.8 }));
        slotRing.position.set(0, 1.5, 0.03); doorGroup.add(slotRing);
        const slotHole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), new THREE.MeshBasicMaterial({ color: 0x140f12 }));
        slotHole.position.set(0, 1.5, 0.031); doorGroup.add(slotHole);
        const slotStem = new THREE.Mesh(new THREE.PlaneGeometry(0.032, 0.17), new THREE.MeshBasicMaterial({ color: 0x140f12 }));
        slotStem.position.set(0, 1.5 - 0.185, 0.031); doorGroup.add(slotStem);
        const doorPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.22), new THREE.MeshBasicMaterial({ map: makeSignTexture({ w: 900, h: 200, bg: "#241d14", stitch: "#8a5a34", ink: "#e6c67a", body: "INSERT INSTRUMENT TO CONTINUE THE TOUR.", fBody: 40, lhBody: 46, pad: 30 }) }));
        doorPlate.position.set(0, 1.1, 0.031); doorGroup.add(doorPlate);
        // the beacon: a warm light bright and far-reaching enough to read as "the light at the end of the
        // tunnel" from well back down the hall, something to walk toward rather than just corridor lighting.
        const doorLight = new THREE.PointLight(0xffdca0, 2.2, 46, 1.4); doorLight.position.set(0, 1.9, zAt(FUSEBOX_P) - 0.6); scene.add(doorLight);

        // ---- the magnifying glass, held: a felt-wrapped ring and a wooden handle, parented to the camera so
        // it moves with the look; idle a slow breathing bob, raised and grown to frame the fisheye on zoom.
        const GLASS_REST = new THREE.Vector3(0.34, -0.26, -0.52), GLASS_RAISED = new THREE.Vector3(0, -0.04, -0.42);
        const glassGroup = new THREE.Group(); glassGroup.position.copy(GLASS_REST); camera.add(glassGroup);
        const glassRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.016, 10, 24), new THREE.MeshStandardMaterial({ map: makeFeltTexture("#c9a24c", "#3c3552", 128, 128), roughness: 0.85 }));
        glassGroup.add(glassRing);
        const glassLens = new THREE.Mesh(new THREE.CircleGeometry(0.078, 24), new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.32, side: THREE.DoubleSide }));
        glassGroup.add(glassLens);
        const glassHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.017, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0x5c4326, roughness: 0.9 }));
        glassHandle.position.set(0, -0.17, 0); glassHandle.rotation.z = 0.35; glassGroup.add(glassHandle);

        // ---- the fisheye lens: a camera-child plane sampling the currently-faced exhibit's photo through a
        // radial barrel remap (uv' = c + (uv - c) * (1 + k*r^2)), clipped to a circle with a soft rim vignette.
        // Hidden until zoomed; grows and centres together with the glass above.
        const lensMat = new THREE.ShaderMaterial({
          transparent: true, depthTest: false, depthWrite: false,
          uniforms: { map: { value: null }, aspect: { value: PHOTO_W / PHOTO_H }, k: { value: 0.35 } },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `uniform sampler2D map; uniform float aspect; uniform float k; varying vec2 vUv;
            void main(){
              vec2 c = vUv - 0.5; c.x *= aspect; float r = length(c);
              if (r > 0.5) discard;
              vec2 warped = c * (1.0 + k * r * r); warped.x /= aspect;
              vec4 col = texture2D(map, warped + 0.5);
              float vig = smoothstep(0.32, 0.5, r);
              col.rgb *= mix(1.0, 0.55, vig);
              gl_FragColor = vec4(col.rgb, 1.0);
            }`
        });
        const lensQuad = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), lensMat);
        lensQuad.visible = false; lensQuad.renderOrder = 5; camera.add(lensQuad);

        camera.position.set(0, EYE_OUT, zAt(0)); applyLook();

        // ---- input: hold-to-walk forward AND backward (keyboard + WALK/BACK buttons); look follows wherever
        // the pointer currently is (hover for mouse, live position while touching for touch - no drag, per
        // G2), using getBoundingClientRect() + clientX/clientY only, per the shell's own zoom-compensation
        // contract. The look zone also reads a quick tap (short + little movement) as the exhibit zoom's
        // click-to-open/close.
        // Every one of these goes through ctx: the three window-level key listeners are the reason it has to.
        // A channel that binds to window and is then replaced leaves its keys bound to a fragment that is
        // gone - the next channel's W key would still be walking this museum.
        let fwdHeld = false, backHeld = false;
        function typing() { const a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA"); }
        ctx.on(window, "keydown", e => {
          if (typing()) return;
          if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") fwdHeld = true;
          else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") backHeld = true;
        });
        ctx.on(window, "keyup", e => {
          if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") fwdHeld = false;
          else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") backHeld = false;
        });
        ctx.on(window, "keydown", e => {
          if (typing()) return;
          if (e.key === "e" || e.key === "E" || e.key === "Enter") {
            if (doorOpen) { attemptInsert(); return; }
            if (zoomOpen) { closeZoom(); return; }
            const ne = nearestCaseExhibit(); if (ne) openZoom(ne);
          } else if (e.key === "Escape" && zoomOpen) { closeZoom(); }
        });
        ctx.on(walkBtn, "pointerdown", e => { fwdHeld = true; e.preventDefault(); dismissHint(); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(ev => ctx.on(walkBtn, ev, () => fwdHeld = false));
        ctx.on(backBtn, "pointerdown", e => { backHeld = true; e.preventDefault(); dismissHint(); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(ev => ctx.on(backBtn, ev, () => backHeld = false));

        let targetYaw = 0, targetPitch = 0, downX = 0, downY = 0, downT = 0;
        function updateLook(e) {
          const r = lbCanvas.getBoundingClientRect();
          const nx = (e.clientX - r.left) / Math.max(1, r.width), ny = (e.clientY - r.top) / Math.max(1, r.height);
          targetYaw = (nx - 0.5) * Math.PI;
          targetPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, (0.5 - ny) * (Math.PI / 2)));
        }
        ctx.on(lookZone, "pointermove", e => { updateLook(e); dismissHint(); });
        ctx.on(lookZone, "pointerdown", e => {
          updateLook(e); downX = e.clientX; downY = e.clientY; downT = performance.now();
          lookZone.setPointerCapture(e.pointerId); dismissHint();
        });
        ctx.on(lookZone, "pointerup", e => {
          const isTap = performance.now() - downT < 400 && Math.hypot(e.clientX - downX, e.clientY - downY) < 10;
          if (!isTap) return;
          if (zoomOpen) closeZoom(); else { const ne = nearestCaseExhibit(); if (ne) openZoom(ne); }
        });

        let hintShown = true;
        function dismissHint() { if (!hintShown) return; hintShown = false; hint.classList.add("hide"); }
        ctx.timeout(dismissHint, 7000);

        // three.js's actual Y-axis rotation of the base forward vector (0,0,-1) is (-sin(yaw),0,-cos(yaw)) -
        // matching camera.rotation.y=yaw (order YXZ) is what the renderer really does, so the near+facing
        // math below has to use the same sign or it silently judges a mirrored direction (found via a raycast
        // debug hit landing on the wrong wall while building this pass).
        function forwardXZ() { return { x: -Math.sin(yaw), z: -Math.cos(yaw) }; }
        function bearingTo(pos) { return Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z); }
        function angleLerp(a, b, t) { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; }
        function nearFacing(pos, maxDist, minDot) {
          const dx = pos.x - camera.position.x, dz = pos.z - camera.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist > maxDist) return false;
          if (dist < 0.05) return true;
          const f = forwardXZ();
          return (f.x * dx / dist + f.z * dz / dist) > minDot;
        }

        // ---- exhibit zoom: which case (if any) is in range while a case exists (outbound only), and the
        // glass's rise/grow eased toward its target every frame (450ms open, 300ms close; cut instantly with
        // no bob under reduced motion, per spec).
        // 5.2: opening also yaws the view onto the exhibit's exact bearing over that same open ease, so the
        // turn is a visible swing (the glass rig, a camera child, swings with it for free) - the camera is
        // already roughly facing the case (that's what nearFacing already required), this squares it exactly.
        let zoomExhibit = null, zoomOpen = false, zoomEase = 0, zoomTurning = false, zoomYawFrom = 0, zoomYawTo = 0;
        function caseAnchorOf(e) { return { x: e.cfg.side * (WALL_OUT - 0.55), z: zAt(e.cfg.p) }; }
        function nearestCaseExhibit() {
          if (ST.phase !== "out") return null;
          for (const e of exhibitObjs) if (nearFacing(caseAnchorOf(e), 1.6, 0.35)) return e;
          return null;
        }
        function openZoom(e) {
          zoomExhibit = e; zoomOpen = true;
          zoomYawFrom = yaw; zoomYawTo = bearingTo(caseAnchorOf(e)); zoomTurning = true;
        }
        function closeZoom() { zoomOpen = false; zoomTurning = false; }

        // ---- guest book overlay
        const bookMount = byId("bookMount"), bookSkip = byId("bookSkip");
        let bookOpen = false, bookSkipped = false;   // review-round bug fix: without bookSkipped, the
        // proximity check re-opened the panel (and re-froze movement) on the very next frame after
        // "walk on" was clicked, since near+facing hadn't changed - the panel is level-triggered every
        // frame, so a dismiss has to be sticky, not just a one-time close.
        function openBook() {
          if (bookOpen || ST.signed || bookSkipped) return;
          bookOpen = true; bookPanel.classList.add("show");
          // mounted on first approach, not at mount(): a visitor who never walks to the lectern never
          // fetches the assessment, and the import is idempotent for one who reaches it twice.
          mountAssessment(bookMount);
        }
        function closeBook() { bookOpen = false; bookPanel.classList.remove("show"); }
        // No submit handler here any more - the engine owns its own form. Once signed, the frame loop's
        // proximity check below stops running altogether (it is guarded on !ST.signed), so the panel is
        // NOT closed out from under the outcomes; "walk on" is what dismisses them.
        ctx.on(bookSkip, "click", () => { bookSkipped = true; closeBook(); });

        // ---- the door / slot overlay: an empty magnifying-glass hole. Click/tap puts the glass in - no wire,
        // no drag. Off stream: nothing happens and the museum stays explorable. Live: a machine behind the
        // hole fires a purple laser at the player (fireLaser below), then the same breach/shrink sequence
        // that used to fire on a wired connection. MBS.mode is a tone switch, never an entitlement (Codex
        // C6) - this only changes what plays, never what the run is worth.
        let doorOpen = false;
        const slotBtn = byId("slotBtn"), doorNote = byId("doorNote"), lbFlash = byId("lbFlash");
        function openDoor() { if (doorOpen || ST.phase !== "out") return; doorOpen = true; wirePanel.classList.add("show"); }
        function closeDoor() { doorOpen = false; wirePanel.classList.remove("show"); doorNote.textContent = ""; slotBtn.disabled = false; }

        let flickerT0 = 0, flickering = false;
        function onConnect() {
          fireConnect(() => {
            closeDoor();
            exhibitObjs.forEach(e => {
              const t = tex[e.texKeyHorror]; if (t) { e.photoMat.map = t; e.photoMat.needsUpdate = true; }
              e.spot.color.set(0x9fb8dd); e.spot.intensity = 0.75;
            });
            // swap placards to resource copy for each exhibit
            exhibitObjs.forEach(e => {
              const ids = RESOURCE_MAP[e.cfg.id];
              e.placards.forEach((m, i) => { m.visible = i < ids.length; });
              ids.forEach((id, i) => {
                const r = RES[id];
                e.placards[i].material.map = makePlacardTexture(id, r.body, r.src);
                e.placards[i].material.needsUpdate = true;
              });
            });
            if (reducedMotion) {
              hallLights.forEach(l => { l.color.set(COLD_LIGHT); l.intensity = 0.55; });
              wallMat.color.set(COLD_WALL); rugMat.color.set(RUG_COLD); ambient.intensity = 0.3;
            } else { flickering = true; flickerT0 = performance.now(); }
          });
        }

        // ---- the purple laser: the machine behind the hole, only real on stream. A thin emissive beam from
        // the slot to the camera for ~half a second, plus a screen flash, while the hole itself flashes
        // purple as the machine fires.
        const LASER_MS = 550;
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xb400ff, transparent: true, opacity: 0, fog: false });
        const laserBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1, 8), laserMat);
        laserBeam.visible = false; scene.add(laserBeam);
        const laserFrom = new THREE.Vector3(0, 1.5, zAt(FUSEBOX_P) + 0.03);
        let laserActive = false, laserT0 = 0, laserCb = null;
        function fireLaser(cb) {
          laserActive = true; laserT0 = performance.now(); laserCb = cb; laserBeam.visible = true;
          slotHole.material.color.set(0xb400ff);
          if (lbFlash) lbFlash.classList.add("show");
        }
        function updateLaser(now) {
          if (!laserActive) return;
          const el = now - laserT0, to = camera.position;
          laserBeam.position.lerpVectors(laserFrom, to, 0.5);
          laserBeam.scale.set(1, laserFrom.distanceTo(to), 1);
          laserBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(laserFrom).normalize());
          laserMat.opacity = Math.min(1, el / 100) - Math.max(0, (el - (LASER_MS - 150)) / 150);
          if (el >= LASER_MS) {
            laserActive = false; laserBeam.visible = false; slotHole.material.color.set(0x140f12);
            if (lbFlash) lbFlash.classList.remove("show");
            const cb = laserCb; laserCb = null; if (cb) cb();
          }
        }
        function attemptInsert() {
          if (!doorOpen || slotBtn.disabled) return;
          if (ctx.mbs && ctx.mbs.isLive) { slotBtn.disabled = true; fireLaser(onConnect); }
          else { doorNote.textContent = "Nothing happens."; }
        }
        ctx.on(slotBtn, "click", attemptInsert);

        // ---- epilogue
        let epiOpen = false;
        function openEpi() { if (epiOpen) return; epiOpen = true; epiPanel.classList.add("show"); }
        function closeEpi() { epiOpen = false; epiPanel.classList.remove("show"); }
        ctx.on(byId("walkAgain3d"), "click", () => {
          ST.phase = "out"; ST.t = 0; ST.shrinkStartedAt = null; saveState();
          closeEpi(); closeZoom();
          exhibitObjs.forEach(e => { const t = tex[e.texKeyCozy]; if (t) { e.photoMat.map = t; e.photoMat.needsUpdate = true; } e.spot.color.set(0xfff0d0); e.spot.intensity = 1.3; });
          hallLights.forEach(l => { l.color.set(WARM_LIGHT); l.intensity = 0.85; });
          wallMat.color.set(WARM_WALL); rugMat.color.set(RUG_WARM); ambient.intensity = 0.55;
          scene.fog.near = FOG_NEAR_OUT; scene.fog.far = FOG_FAR_OUT;
          yaw = 0; pitch = 0; targetYaw = 0; targetPitch = 0; applyLook();
        });

        function resize() {
          const w = lbStage.clientWidth || 320, h = lbStage.clientHeight || 240;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setSize(w, h, false);
          camera.aspect = w / h; camera.updateProjectionMatrix();
        }
        ctx.observe(new ResizeObserver(resize), lbStage);
        resize();

        // ---- boot: resume from storage before the first frame, snap (no animation) to the saved phase.
        Promise.all(texPromises).then(() => {
          // the twelve photographs landed after the channel was left: there is nothing to boot into
          if (session !== mine || !gl) return;
          exhibitObjs.forEach(e => {
            const cozy = tex[e.texKeyCozy]; if (cozy) e.photoMat.map = cozy; e.photoMat.needsUpdate = true;
          });
          if (isReturning()) {
            exhibitObjs.forEach(e => {
              const h = tex[e.texKeyHorror]; if (h) { e.photoMat.map = h; e.photoMat.needsUpdate = true; }
              e.spot.color.set(0x9fb8dd); e.spot.intensity = 0.75;
              const ids = RESOURCE_MAP[e.cfg.id];
              e.placards.forEach((m, i) => { m.visible = i < ids.length; if (i < ids.length) { const r = RES[ids[i]]; m.material.map = makePlacardTexture(ids[i], r.body, r.src); m.material.needsUpdate = true; } });
            });
            hallLights.forEach(l => { l.color.set(COLD_LIGHT); l.intensity = 0.55; });
            wallMat.color.set(COLD_WALL); rugMat.color.set(RUG_COLD); ambient.intensity = 0.3;
            lb.classList.toggle("breached", false);
          }
          if (ST.phase === "done") openEpi();
          camera.position.z = zAt(ST.t);
          const rp0 = shrinkProgress(), caseMode0 = ST.phase === "out";
          camera.position.y = eyeY(rp0);
          hallMesh.scale.set(2 * wallHalf(rp0), CEIL_H, 1);
          scene.fog.near = FOG_NEAR_OUT + (FOG_NEAR_IN - FOG_NEAR_OUT) * rp0;
          scene.fog.far = FOG_FAR_OUT + (FOG_FAR_IN - FOG_FAR_OUT) * rp0;
          exhibitObjs.forEach(e => updateExhibit(e, rp0, caseMode0));
          updateProp(bookGroup, GUESTBOOK_SIDE, GUESTBOOK_P, rp0, 0.55);
          updateProp(titleGroup, TITLE_SIDE, TITLE_P, rp0, 1);
          glassGroup.visible = caseMode0;
          last = performance.now();
          ctx.frame(frame);
        });

        let last = performance.now();
        function frame(now) {
          // unmounted: stop before touching the scene. ctx cancels the pending frame as well, so this guard
          // is the belt to that braces - what it actually prevents is a frame already in flight when
          // unmount() ran from rendering into a disposed renderer.
          if (!gl || session !== mine) return;
          // 4.1: the chapters are up, so the museum is off screen. Keep the loop (coming back is then a
          // class toggle and the next frame, not a rebuild) and skip the work - no scene update, and above
          // all no renderer.render() into a canvas nobody can see. `last` still advances, or the first
          // frame back would carry the whole time away as one dt.
          if (ST.mode !== "museum") { last = now; ctx.frame(frame); return; }
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          if (!zoomOpen) {
            yaw += (targetYaw - yaw) * Math.min(1, dt * 8);
            pitch += (targetPitch - pitch) * Math.min(1, dt * 8);
          }
          applyLook();
          updateLaser(now);

          if ((fwdHeld || backHeld) && !bookOpen && !epiOpen && !zoomOpen) {
            const dir = (fwdHeld ? 1 : 0) - (backHeld ? 1 : 0);
            if (dir) { ST.t = Math.max(0, Math.min(1, ST.t + dir * WALK_SPEED * dt)); saveState(); }
          }
          camera.position.z = zAt(ST.t);
          const rp = shrinkProgress(), caseMode = ST.phase === "out";
          camera.position.y = eyeY(rp);

          if (!flickering) {
            hallMesh.scale.set(2 * wallHalf(rp), CEIL_H, 1);
            scene.fog.near = FOG_NEAR_OUT + (FOG_NEAR_IN - FOG_NEAR_OUT) * rp;
            scene.fog.far = FOG_FAR_OUT + (FOG_FAR_IN - FOG_FAR_OUT) * rp;
          }
          exhibitObjs.forEach(e => updateExhibit(e, rp, caseMode));
          updateProp(bookGroup, GUESTBOOK_SIDE, GUESTBOOK_P, rp, 0.55);
          updateProp(titleGroup, TITLE_SIDE, TITLE_P, rp, 1);
          glassGroup.visible = caseMode;

          // exhibit zoom: close on walking away, leaving the case phase, or turning; ease the glass and the
          // fisheye lens toward the open/closed target together.
          const nearEx = caseMode ? nearestCaseExhibit() : null;
          if (zoomOpen && (nearEx !== zoomExhibit || !caseMode)) closeZoom();
          const zoomTarget = zoomOpen ? 1 : 0;
          if (reducedMotion) zoomEase = zoomTarget;
          else { const rate = (zoomTarget > zoomEase ? dt / 0.45 : dt / 0.3); zoomEase = zoomTarget > zoomEase ? Math.min(zoomTarget, zoomEase + rate) : Math.max(zoomTarget, zoomEase - rate); }
          const ease = zoomEase * zoomEase * (3 - 2 * zoomEase);
          if (zoomTurning) {
            yaw = angleLerp(zoomYawFrom, zoomYawTo, ease); applyLook();
            if (ease >= 1) zoomTurning = false;
          }
          glassGroup.position.lerpVectors(GLASS_REST, GLASS_RAISED, ease);
          glassGroup.scale.setScalar(1 + 2.4 * ease);
          if (!reducedMotion) glassGroup.position.y += Math.sin(now * 0.0016) * 0.012 * (1 - ease);
          if (zoomEase > 0.02 && zoomExhibit && zoomExhibit.photoMat.map) {
            lensMat.uniforms.map.value = zoomExhibit.photoMat.map;
            lensQuad.position.lerpVectors(GLASS_REST, new THREE.Vector3(0, -0.04, -0.5), ease);
            lensQuad.scale.setScalar(0.25 + 1.1 * ease);
            lensQuad.visible = true;
          } else lensQuad.visible = false;

          if (flickering) {
            const el = now - flickerT0;
            if (el < 600) {
              const jitter = 0.6 + Math.random() * 0.7;
              hallLights.forEach(l => l.intensity = 0.85 * jitter);
            } else {
              flickering = false;
              hallLights.forEach(l => { l.color.set(COLD_LIGHT); l.intensity = 0.55; });
              wallMat.color.set(COLD_WALL); rugMat.color.set(RUG_COLD); ambient.intensity = 0.3;
            }
          }

          // prompt priority: turn around, then the door's slot, then an in-range case - one shared element
          if (ST.phase === "slotted") {
            prompt.textContent = "Turn around."; prompt.classList.add("show");
            const f = forwardXZ();
            if (f.z > 0.3) { ST.phase = "back"; saveState(); prompt.classList.remove("show"); }
          } else if (caseMode && nearFacing(doorGroup.position, 1.5, 0.35)) {
            prompt.textContent = "The door has a slot."; prompt.classList.add("show");
          } else if (nearEx && !zoomOpen) {
            prompt.textContent = "Look closer."; prompt.classList.add("show");
          } else prompt.classList.remove("show");

          // guest book / door proximity
          if (!ST.signed && !bookSkipped) { if (nearFacing(bookGroup.position, 1.5, 0.35)) openBook(); else closeBook(); }
          if (ST.phase === "out") { if (nearFacing(doorGroup.position, 1.5, 0.35)) openDoor(); else closeDoor(); }

          // reached the entrance on the way back
          if (isReturning() && ST.t <= 0.001 && ST.phase !== "done") { ST.phase = "done"; saveState(); openEpi(); }

          renderer.render(scene, camera);
          ctx.frame(frame);
        }
      }).catch(err => {
        if (session !== mine) return;   // left while the CDN was in flight: nothing to fall back to
        console.error("[lb] three.js failed to load", err);
        lb.classList.remove("webgl"); lbCanvas.remove(); lbHud.remove(); runFlat();
      });
    }

    // =====================================================================================
    // ==== flat / no-WebGL fallback ====
    // =====================================================================================
    function runFlat() {
      const flat = document.createElement("div"); flat.className = "lb-flat"; flat.id = "lbFlat";
      lbStage.appendChild(flat);
      // the held glass, drawn once as inline SVG: a corner decoration on every exhibit step, and (via
      // .fl-zoomable) the tap target that swaps a photo for a 2x circular crop of itself - fisheye is a
      // WebGL-only build, magnification is the fallback's job.
      const GLASS_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="26" cy="26" r="16" fill="rgba(234,246,255,.4)" stroke="#c9a24c" stroke-width="5"/><line x1="38" y1="38" x2="54" y2="54" stroke="#5c4326" stroke-width="6" stroke-linecap="round"/></svg>`;
      // step -> {phase,t}: kept in exact lockstep with the shared storage schema so a save from this path
      // reads back correctly (and, loosely, so a save from the 3D path resumes to the nearest matching step).
      const STEPS = [
        { id: "entrance", phase: "out", t: 0 },
        { id: "book", phase: "out", t: 0 },
        { id: "teepee", phase: "out", t: 0.15 },
        { id: "car", phase: "out", t: 0.275 },
        { id: "shoebox", phase: "out", t: 0.4 },
        { id: "storage", phase: "out", t: 0.525 },
        { id: "masonjar", phase: "out", t: 0.65 },
        { id: "van", phase: "out", t: 0.775 },
        { id: "door", phase: "out", t: 1 },
        { id: "turn", phase: "slotted", t: 1 },
        { id: "van-h", phase: "back", t: 0.775 },
        { id: "masonjar-h", phase: "back", t: 0.65 },
        { id: "storage-h", phase: "back", t: 0.525 },
        { id: "shoebox-h", phase: "back", t: 0.4 },
        { id: "car-h", phase: "back", t: 0.275 },
        { id: "teepee-h", phase: "back", t: 0.15 },
        { id: "epilogue", phase: "done", t: 0 }
      ];
      function nearestStep() {
        let best = 0, bestScore = Infinity;
        STEPS.forEach((s, i) => {
          const score = (s.phase === ST.phase ? 0 : 2) + Math.abs(s.t - ST.t);
          if (score < bestScore) { bestScore = score; best = i; }
        });
        return best;
      }
      let step = nearestStep();

      function render() {
        const s = STEPS[step];
        ST.phase = s.phase === "slotted" && step > 6 ? "back" : s.phase; ST.t = s.t; saveState();
        flat.innerHTML = "";
        const wrap = document.createElement("div");
        switch (s.id) {
          case "entrance": wrap.innerHTML = `<span class="fl-name">${TITLE_TEXT.h1}</span><p class="fl-sub">${TITLE_TEXT.h2}</p><p>${TITLE_TEXT.body}</p><div class="fl-actions"><button id="flNext">enter</button></div>`; break;
          case "book": {
            // 2.20: same engine the 3D lectern mounts, same JSON. The step is otherwise empty markup -
            // the questions have exactly one definition and it is not in this file.
            wrap.innerHTML = `<div id="flBookMount"></div>
              <div class="fl-actions"><a class="skip" id="flSkip">walk on</a></div>`;
            break;
          }
          case "teepee": case "car": case "shoebox": case "storage": case "masonjar": case "van": {
            const ex = EXHIBITS.find(e => e.id === s.id);
            wrap.innerHTML = `<span class="fl-name">${ex.label}</span><p class="fl-sub">cozy - tap the photo to look closer</p>
              <div class="fl-zoomable" id="flZoom"><img class="fl-photo" src="${ex.cozy}" alt="${ex.label} cozy"><div class="lb-flat-glass">${GLASS_SVG}</div></div>
              ${FACTS[ex.id].map(f => `<div class="fl-card">${f.body}<span class="fl-src">${f.src}</span></div>`).join("")}
              <div class="fl-actions"><button id="flNext">NEXT</button></div>`;
            break;
          }
          case "door": wrap.innerHTML = `<span class="fl-name">The Door</span><p>There's an empty magnifying-glass hole in it.</p>
            <button type="button" class="lb-slotBtn" id="flSlot" aria-label="Put the glass in the hole">🔍</button>
            <p class="fl-sub" id="flDoorNote"></p>
            <div class="fl-actions"></div>`; break;
          case "turn": wrap.innerHTML = `<span class="fl-name">Turn around.</span><p>The hall behind you is smaller than the one you walked in.</p><div class="fl-actions"><button id="flNext">turn around</button></div>`; break;
          case "teepee-h": case "car-h": case "shoebox-h": case "storage-h": case "masonjar-h": case "van-h": {
            const ex = EXHIBITS.find(e => e.id === s.id.replace("-h", ""));
            const ids = RESOURCE_MAP[ex.id];
            wrap.innerHTML = `<span class="fl-name">${ex.label}</span><p class="fl-sub">the walls are closer now</p>
              <div class="fl-zoomable" id="flZoom"><img class="fl-photo" src="${ex.horror}" alt="${ex.label} horror"></div>
              ${ids.map(id => `<div class="fl-card">${RES[id].body}<span class="fl-src">${RES[id].src}</span></div>`).join("")}
              <div class="fl-actions"><button id="flNext">NEXT</button></div>`;
            break;
          }
          case "epilogue": wrap.innerHTML = `<span class="fl-name">${CLOSING_LINE}</span><div class="fl-actions"><button id="flAgain">walk again</button></div>`; break;
        }
        flat.appendChild(wrap);
        const flash = document.createElement("div"); flash.className = "lb-laser-flash"; flash.id = "flFlash";
        flat.appendChild(flash);
        if (step > 0) {
          const actions = wrap.querySelector(".fl-actions");   // 2.20: the book step has one of these now too
          if (actions) {
            const back = document.createElement("button"); back.type = "button"; back.id = "flBack"; back.textContent = "back";
            actions.insertBefore(back, actions.firstChild);
          }
        }
        wire();
      }
      function goNext() { step = Math.min(STEPS.length - 1, step + 1); render(); }
      function goBack() { step = Math.max(0, step - 1); render(); }
      function wire() {
        // scoped to the gallery this path built, never the document: render() replaces the whole step, so
        // these ids come and go, and a document-wide lookup would be the one place a shell element with the
        // same id could be picked up instead.
        const q = (id) => flat.querySelector("#" + id);
        const next = q("flNext"); if (next) ctx.on(next, "click", goNext);
        const back = q("flBack"); if (back) ctx.on(back, "click", goBack);
        const skip = q("flSkip"); if (skip) ctx.on(skip, "click", goNext);
        // 2.20: the guest-book step mounts the engine into the node render() just built. render() replaces
        // the whole step, so this node is new every time and the mount is not a duplicate; walking back to
        // the book re-mounts, and the engine restores the saved draft into its own radios. Completion does
        // not advance the step - the outcomes render here, and "walk on" is what leaves them.
        const bookMount = q("flBookMount");
        if (bookMount) mountAssessment(bookMount);
        const zoomable = q("flZoom");
        if (zoomable) ctx.on(zoomable, "click", () => zoomable.classList.toggle("zoomed"));
        // the door: an empty magnifying-glass hole, click to put the glass in - no wire, no drag. Off stream,
        // nothing happens and the museum stays explorable; live, a laser flash plays, then the same
        // breach/shrink sequence the 3D path uses.
        const flSlot = q("flSlot");
        if (flSlot) ctx.on(flSlot, "click", () => {
          if (flSlot.disabled) return;
          if (ST.phase !== "out") { goNext(); return; }
          const note = q("flDoorNote");
          if (ctx.mbs && ctx.mbs.isLive) {
            flSlot.disabled = true;
            const flashEl = q("flFlash"); if (flashEl) flashEl.classList.add("show");
            ctx.timeout(() => { fireConnect(() => { if (flashEl) flashEl.classList.remove("show"); goNext(); }); }, 500);
          } else if (note) { note.textContent = "Nothing happens."; }
        });
        const again = q("flAgain");
        if (again) ctx.on(again, "click", () => { ST.phase = "out"; ST.t = 0; ST.shrinkStartedAt = null; saveState(); step = 0; render(); });
      }
      render();
    }
  },

  /* What the CONTEXT cannot own, and nothing else. Every listener - including the three bound to window -
     the two ResizeObservers, the hint timer, the flat path's laser timer and the render chain are
     registered through ctx and are deliberately not re-listed here. What is left is the GPU, and one
     window global.

     A WebGLRenderer holds a real graphics context, and a browser keeps only a handful of them alive at
     once, silently dropping the OLDEST when a page asks for one too many. So a renderer that outlives
     its channel does not throw; it takes an EARLIER channel's canvas away, several channel changes
     later. dispose() releases the GPU-side resources, and forceContextLoss() hands the context itself
     back rather than waiting for the collector to notice.

     The scene is disposed by WALKING it rather than from a list built at construction time - fuel.js's
     decision, and this channel is larger again, which is the argument for it. The graph holds more than
     it appears to: camera.add() parents the held magnifying glass and the fisheye quad, and scene.add
     (camera) is what brings them back into the walk. `extra` carries the one class of thing it does not,
     the twelve loaded photographs, of which only the currently displayed one is ever a live material.map.

     The canvas itself is NOT removed here: #lbCanvas is in the fragment's own markup, so it goes when
     the fragment is replaced. Removing it would be reaching into markup this module did not create.

     window.__lbState and window.__lbLoaded go because they close over this mount's state object: left
     behind, they would answer questions about a museum that is no longer in the document. */
  unmount() {
    session = null;
    try { delete window.__lbState; } catch (e) { window.__lbState = undefined; }
    try { delete window.__lbLoaded; } catch (e) { window.__lbLoaded = undefined; }
    if (!gl) return;
    const g = gl;
    gl = null;
    const killMat = (m) => {
      if (!m) return;
      // a material's textures are disposables in their own right, and the canvas-generated ones here
      // (every felt panel, eighteen placards, six nameplates, six banners, the title wall, the guest
      // book, the door plate) are the largest thing this channel puts on the GPU
      for (const k of ["map", "emissiveMap", "normalMap", "roughnessMap", "alphaMap"]) {
        if (m[k]) { try { m[k].dispose(); } catch (e) { /* already gone */ } }
      }
      try { m.dispose(); } catch (e) { /* already gone */ }
    };
    try {
      g.scene.traverse(o => {
        if (o.geometry) { try { o.geometry.dispose(); } catch (e) { /* already gone */ } }
        // dispose() is safe to call twice, which matters: frameMat, alcoveMat, caseMat, sillMat and
        // pillarMat are each shared by all six exhibits, so the walk reaches them six times over
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(killMat);
      });
    } catch (e) { console.error("[lb] scene teardown", e); }
    g.extra.forEach(x => { try { x.dispose(); } catch (e) { /* already gone */ } });
    try { g.renderer.dispose(); } catch (e) { /* already disposed */ }
    try { g.renderer.forceContextLoss(); } catch (e) { /* context already lost */ }
  },
};
