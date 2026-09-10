/* tv/channels/corgi.js - CORTISOL CORGI, CH 6, "The School Hunt": the SIXTH channel converted to a
   module, the LAST live channel, and the largest file in the programme (2.18, PLAN-r9 D.1.7). Same
   1662 lines that sat in an inline script at the bottom of corgi.html, with one change made
   throughout: every listener, timer, interval, observer, animation frame and the AudioContext is
   registered through the CONTEXT, so channel-runtime.js can release all of it. Nothing about what the
   channel does changed.

   WHY THIS ONE WENT LAST, and what that cost. 1662 script lines against girlfriend's 1026, and the one
   file tools/scan_strict.py refuses to vouch for: it lost 5 of 456 declarations there, because this
   file contains regex literals and telling `/` division from `/` regex needs a real tokenizer. A module
   is STRICT MODE, so a bare `name = value` that was a harmless implicit global inline becomes a
   ReferenceError reachable only on the code path that assigns - djscratch's was on the line that fires
   when the game is WON. So this conversion was preceded by a hand audit of EVERY assignment target in
   the block, not a scan: 370 distinct targets, all of them declared, no for-loop implicit init, no
   destructuring assignment, no chained `a = b = c` to an undeclared name. The twelve that first looked
   undeclared are all members of multi-declarator `let` lists (corgi.html:1563-1564, 1699, 1705, 1848).

   WHAT ctx CANNOT OWN HERE. A renderer, and a scene graph rebuilt per level: a 26- or 46-unit main
   corridor, three branch areas with loops and pillars, per-area lighting, furniture under every page,
   a papier-mache monster, a door, and on live level 0 a trophy case. Every texture in it is generated
   in canvas - walls, floor, newsprint, sign, poster, grain, prop and page sprites - and there is not a
   single loaded image among them, which is the one way this channel is SIMPLER to tear down than the
   museum or the line. A browser holds only a handful of live WebGL contexts and silently drops the
   OLDEST once a page opens too many, so a renderer that outlives its channel does not throw - it takes
   an EARLIER channel's canvas away, several channel changes later. unmount() is what stops that.

   THE DISPOSAL IS A TRAVERSE, NOT A REGISTER - fuel.js's decision, kept for the museum, the line, and
   kept again here where the argument is strongest: this scene is built across buildLevel, buildLevelTail,
   genArea, buildFurniture and buildMonster, and a registration list appended to at each one is a list
   the next edit forgets. scene.add(camera) is load-bearing for the walk, exactly as in the museum: the
   flashlight and its target are camera children, so the camera has to be a scene member for the graph
   to reach them. It already was.

   `extra` CARRIES WHAT THE GRAPH GENUINELY CANNOT REACH, and here it is a different shape from the
   museum's twelve photographs or the line's six stills. wallBox() CLONES its material and its map for
   every wall so each can carry its own repeat, and buildLevel clones floorMat and (in public) ceilMat
   the same way - so the ORIGINAL shared materials those clones came from are never on a mesh at all,
   and a scene walk would miss every one of them. areaMat()'s three materials per level are cloned by
   wallBox for the same reason. own() below registers each one as it is created.

   THE WEBGL FEATURE PROBE LEAKED A CONTEXT, and this is the sixth and last live channel found carrying
   the same four lines verbatim. Asking a throwaway canvas for a context to prove a context can be had
   left a REAL live context behind on a detached canvas, spending the budget the renderer needs, once
   per mount. WEBGL_lose_context hands it back on purpose. Only `sag` still carries it, and it is a
   coming_soon channel that cannot be verified through the real path until its status changes.

   THE THREE.JS IMPORT STAYS DYNAMIC, for the same reason as fuel's, the museum's and the line's. A
   static import resolves before this module's body runs, so a CDN outage would fail the whole module
   and channel-runtime.js would correctly render the unavailable testcard - throwing away runFallback(),
   which is a complete room-picker carrying the same three pages, the same lessons, the same stats, the
   same form and the same unlock, and which is what check_play actually drives on this route. The catch
   on the import does what the feature probe does: falls back to the picker.

   ONE RENAME, AND IT IS THE ONLY EDIT TO THE CHANNEL'S OWN LOGIC. setupOfficeAmbience() held its
   AudioContext in a local called `ctx`, which is now the name of the mount context. It is `actx` here.
   Nothing else about the ambience changed; it is registered through ctx.audio so the runtime closes it.

   WHAT IS NOW SCOPED. Sixty-two document-level id and class lookups became lookups inside the channel's
   own root. The deliberate exceptions are the ones that are NOT this channel: `.screen`'s parent, which
   is the television's glass and is what fitViewport() exists to measure, and document.documentElement's
   dataset, which is where mbs-shim.js publishes the mode, the mission id and the API base. */

import { PAPER_HEARTS, restoreDream, losePaperHeart, restartDream, canOpenBackDoor, breakRoomPose } from "./corgi-dream.mjs";
import { createPaperHearts, schoolCortisol, heartbeatBpm } from "./corgi-hearts.mjs";

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";

/* The one piece of module state, held for the reason set out above: a WebGLRenderer and a scene graph
   are not disposables the context can own. `session` is the mount token - the three.js import resolves
   long after mount() returns, and a school that comes back for a session that has already ended must be
   dropped rather than built into a fragment that has gone. */
let gl = null;
let session = null;

export default {
  mount(root, ctx) {
    session = {};
    const mine = session;

    const cc = root.matches("#cc") ? root : root.querySelector("#cc");
    if (!cc) return;
    if(!document.documentElement.dataset.game && cc.querySelector('[data-corgi-editorial]'))return;
    // ids resolve INSIDE the channel now rather than against the whole document: only one channel is
    // mounted at a time so both find the same nodes, but scoping means a shell element can never be
    // picked up by a channel's id lookup.
    const byId = (id) => cc.querySelector("#" + id);

    // ---------------------------------------------------------------- mode (0905): TONE only, never entitlement.
    // The shim (mbs-shim.js:22-27) already publishes this on document.documentElement whenever it runs; a plain
    // TV-embedded view without the shim has nothing set, and that absence must read as PUBLIC (the office is the
    // default, brighter world), never LIVE. MBS.mode is checked first because it survives even if the
    // dataset attribute is written after this script runs; falls back to the dataset/class the shim also sets.
    // Read off the context rather than window, which is the same object and the same value the shell sees -
    // and deliberately NOT ctx.mode, whose own default would swallow the documentElement fallback below.
    const MODE = ((((ctx.mbs && ctx.mbs.mode) || document.documentElement.dataset.mode ||
        (document.documentElement.classList.contains("mbs-live") ? "live" : "public")) === "live") ? "live" : "public");
    cc.dataset.mode = MODE;
    // the office is watched by CCTV, not worn on a GoPro -- reuses the existing REC corner instead of adding a
    // second badge next to it (a second line there crowded the 390px HUD against the PAGES tally, tried and
    // screenshotted). The timecode underneath it is left running: a security-camera readout still has one.
    const recLabel = byId("ccRecLabel");
    if (recLabel && MODE === "public") recLabel.textContent = "CCTV 04";

    // ---------------------------------------------------------------- state: LEVELS model, versioned save (3.2/3.3),
    // now mode-partitioned (3.7, Ian's 2026-09-04 public/live split). THE KEY ITSELF DOES NOT CHANGE: registry.json's
    // progress_key and tv/card.js's resume check both point at STORE_KEY by name, and neither is this file's to
    // edit. Only the value stored under it changes shape, from one flat save to {public,live} partitions, so an
    // untouched card.js still sees a valid non-empty object and still offers "resume" correctly either way.
    // v1 (pre-0903) stored one flat found[3] for a single hallway. v2 (pre-0905) stored one flat
    // {found:[3][3],unlocked,level} covering all three old levels (School, Food Service, Office) with no mode
    // split at all. Reusing that one save for two now-different level sets would resume a player into the wrong
    // world (Codex C7), so it is split here, once, on first load under the new build:
    //   - old level 0 (THE SCHOOL) had, and still has, unchanged content -> becomes live's own first level.
    //   - old level 2 (THE OFFICE) had, and still has, unchanged content -> becomes public's one level.
    //   - old level 1 (FOOD SERVICE) has no home in either new scheme. Its flags are not carried into anything;
    //     nothing is invented in their place, and nothing already earned in the other two levels is lost.
    const STORE_KEY_V1 = "mbs-corgi-school";
    const STORE_KEY = "mbs-corgi-school-v3";
    const emptyFound = () => [[false, false, false], [false, false, false], [false, false, false]];
    const state = { level: 0, found: emptyFound(), unlocked: 0, ...restoreDream() };
    const coerceModeState = s => ({
      ...restoreDream(s),
      found: [0, 1, 2].map(i => [!!(s.found[i] || [])[0], !!(s.found[i] || [])[1], !!(s.found[i] || [])[2]]),
      unlocked: Math.max(0, Math.min(2, s.unlocked | 0)),
      level: Math.max(0, Math.min(MODE === "public" ? 1 : 2, s.level | 0))
    });
    const save = () => {
      try {
        const blob = { public: null, live: null };
        try { const prior = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
          if (prior) { if (prior.live) blob.live = prior.live; if (prior.public) blob.public = prior.public; } } catch {}
        blob[MODE] = { found: state.found, unlocked: state.unlocked, level: state.level, lives: state.lives, dreamPhase: state.dreamPhase };
        localStorage.setItem(STORE_KEY, JSON.stringify(blob));
      } catch {}
    };
    (function loadState() {
      try {
        const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem("mbs-corgi-school-v2");
        if (raw) {
          const blob = JSON.parse(raw);
          if (blob && (blob.live || blob.public)) {
            const mine2 = blob[MODE];
            if (mine2 && Array.isArray(mine2.found) && Array.isArray(mine2.found[0])) Object.assign(state, coerceModeState(mine2));
            return;
          }
          if (Array.isArray(blob.found) && Array.isArray(blob.found[0])) {
            const old = coerceModeState(blob);
            if (MODE === "live") {
              state.found = [old.found[0], [false, false, false], [false, false, false]];
              state.level = Math.min(old.level, 1); state.unlocked = Math.min(old.unlocked, 1);
            } else {
              state.found = [old.level === 2 ? old.found[2] : [false, false, false], [false, false, false], [false, false, false]];
              state.level = 0; state.unlocked = 0;
            }
            save();   // persist the split immediately -- a player who looks and quits this session must not
                      // depend on the old flat key still being there next time.
            return;
          }
        }
      } catch {}
      // v1: a single un-leveled hallway, and it was always the school -- only live mode has anywhere to put it
      if (MODE === "live") {
        try {
          const raw1 = localStorage.getItem(STORE_KEY_V1);
          if (raw1) {
            const s1 = JSON.parse(raw1);
            if (Array.isArray(s1.found)) {
              const f = [!!s1.found[0], !!s1.found[1], !!s1.found[2]];
              state.found[0] = f;
              const complete = f.every(Boolean);
              state.unlocked = complete ? 1 : 0;
              state.level = complete ? 1 : 0;
              save();
            }
          }
        } catch {}
      }
    })();

    // ---------------------------------------------------------------- LEVELS (0905): two separate sets, one per
    // mode. LIVE is now three SCHOOL levels that get stranger as you go deeper (Ian's directive; the pre-0905
    // build's "Food Service" and "Office" stages were never school, so they are not reused as live levels -- see
    // codex-r1-findings.md finding A3). PUBLIC is the office alone, unchanged content, reused verbatim per Codex
    // B3 -- its own door now leads to the head office's desk (buildLevel's transition branches on MODE for this,
    // see the public-only enterHeadOffice() path further down) instead of a fourth level. `crazy` (live only)
    // scales wall art density, light colour and monster tempo per level -- see buildLevel/scheduleAmbient below.
    // `handAuthored` marks live level 0 as the pre-existing, byte-identical corridor (level0MainCorridor/
    // level0Areas); everything else, public's office included, uses the generated corridor (genMainCorridor/
    // genLevelAreas) that already served the old Food Service/Office levels.
    const LEVELS_LIVE = [
      { name: "THE SCHOOL", doorLabel: "THE ART WING", furniture: "desk", handAuthored: true, crazy: 0,
        pages: [
          { door: "THE LIBRARY", title: "FREE MENTORS FOR YOUR OWN BUSINESS", deskLabel: "FREE SBA MENTORING", deskDate: "SCORE / SBA",
            flavor: "The card catalog drawer was already open. Someone had been through it before you. One index card sat on top, torn from a newspaper, folded twice.",
            stat: "SCORE, a nonprofit resource partner of the U.S. Small Business Administration, gives free one-on-one mentoring and a free business plan review to anyone starting a company -- no cost, no revenue minimum to qualify.",
            src: "SCORE.org, a resource partner of the U.S. Small Business Administration.",
            lessonTitle: "FREE IS A CLAIM YOU CAN GO CHECK.",
            lesson: "A free-mentor claim is either true or it isn't, and it's checkable in one search. SCORE has run this exact program for decades under an actual federal partnership. Before assuming starting a business costs money you don't have, go look at what's already free." },
          { door: "THE GYMNASIUM", title: "PASS ONE TEST, SKIP THE CLASS", deskLabel: "CLEP: CREDIT UNDER $100", deskDate: "COLLEGE BOARD",
            flavor: "Someone had taped a page to the underside of the bleachers, face down, like they did not want it read standing up.",
            stat: "CLEP exams, run by the College Board, let you earn real college credit for a flat fee under $100 per test, accepted at more than 2,900 colleges and universities nationwide.",
            src: "The College Board, CLEP program.",
            lessonTitle: "ONE TEST IS CHEAPER THAN ONE SEMESTER.",
            lesson: "A single exam fee under $100 standing in for a whole semester's tuition is a real trade, not a trick. Check the accepted-college list for the specific school you care about before assuming it doesn't apply to you." },
          { door: "THE LOCKER ROW", title: "IRELAND WILL PAY YOU TO MOVE TO AN ISLAND", deskLabel: "EUR 84,000 TO RELOCATE", deskDate: "IRELAND, 2022",
            flavor: "It was folded into a locker vent, small enough that a hand that was not yours had to have put it there.",
            stat: "In 2022 Ireland's government began offering grants of roughly 84,000 euro to people willing to relocate to, and renovate a home on, one of its remote offshore islands -- a real repopulation policy, not a rumor.",
            src: "Government of Ireland, Our Living Islands policy, 2022.",
            lessonTitle: "A GOVERNMENT PROGRAM HAS A NAME AND A PAGE.",
            lesson: "\"Countries pay you to move there\" sounds like an urban legend until you find the actual policy with an actual name. This one has both. Search the name before deciding whether it's real." }
        ] },
      { name: "THE ART WING", doorLabel: "THE ATTIC", furniture: "desk", crazy: 1,
        pages: [
          { door: "THE ART ROOM", title: "ADVICE FROM 900 FREE CENTERS", deskLabel: "FREE SBDC ADVISING", deskDate: "SBA NETWORK",
            flavor: "Paint-smudged and pinned under a drying brush, like whoever left it meant to come back for it.",
            stat: "The Small Business Administration's nationwide network of roughly 900 free Small Business Development Centers offers no-cost, one-on-one advising on writing a business plan and getting a company running, in every state.",
            src: "America's SBDC / U.S. Small Business Administration.",
            lessonTitle: "FREE ADVICE STILL NEEDS A NAME ATTACHED.",
            lesson: "900 centers is a specific, checkable number, not a vibe. Look up the one nearest you before deciding whether \"free business advice\" is a real thing or a slogan." },
          { door: "THE COMPUTER LAB", title: "DSST: THE MILITARY'S CREDIT-BY-EXAM", deskLabel: "DSST EXAMS, OFTEN FREE", deskDate: "PROMETRIC / DANTES",
            flavor: "Still warm from a monitor that shouldn't have been on after hours, half printed and left in the tray.",
            stat: "DSST exams work the same way CLEP does -- one test in place of one class -- and for servicemembers the fee has historically been covered entirely through the Defense Department's DANTES program.",
            src: "Prometric DSST program; U.S. Department of Defense DANTES.",
            lessonTitle: "SOMEONE ELSE MAY HAVE ALREADY PAID THE FEE.",
            lesson: "Before assuming a credit-by-exam costs you anything, check whether an employer, a branch of service, or a school already covers it. That one question has saved people real money." },
          { door: "THE FACULTY LOUNGE", title: "ITALY PAID TOWNS TO STAY ALIVE", deskLabel: "UP TO EUR 28,000 TO RELOCATE", deskDate: "CALABRIA, ITALY",
            flavor: "Left face-up on the good couch, the one nobody but the staff was ever supposed to sit on.",
            stat: "Italy's Calabria region offered new residents payments of up to about 28,000 euro over three years for moving into one of its depopulating towns and staying -- one of several such offers across small Italian towns this decade.",
            src: "Regione Calabria relocation incentive, widely reported 2021-2022.",
            lessonTitle: "\"THIS DECADE\" MEANS IT'S STILL SEARCHABLE.",
            lesson: "A recent policy leaves a recent paper trail. Search the region's own name plus the year before repeating a secondhand version of the story." }
        ] },
      { name: "THE ATTIC", doorLabel: null, furniture: "desk", crazy: 2,
        pages: [
          { door: "THE AUDITORIUM", title: "FILE YOUR OWN COMPANY FOR UNDER $200", deskLabel: "MOST STATES: UNDER $200", deskDate: "STATE FILING FEES",
            flavor: "Taped under a folding seat, in a room with no lights on and no reason for anyone to be seated.",
            stat: "Forming an LLC yourself, without a lawyer, costs a state filing fee that in most U.S. states runs well under $200 -- a few charge more, several charge far less -- and no attorney is legally required to file it.",
            src: "State Secretary of State filing fee schedules, by state.",
            lessonTitle: "THE FEE VARIES BY STATE. YOURS IS ONE SEARCH AWAY.",
            lesson: "\"It costs too much to start a company\" is a claim about a specific number that's different in every state and public on every Secretary of State's website. Look up your own state's fee before believing the average." },
          { door: "THE BOILER ROOM", title: "WHAT YOU ALREADY KNOW MIGHT BE CREDIT", deskLabel: "CREDIT FOR PRIOR LEARNING", deskDate: "CAEL",
            flavor: "Scorched a little at one corner, resting on a pipe that should not have been that warm.",
            stat: "Many community colleges run a \"credit for prior learning\" review that turns a work certification, military training, or documented job experience you already have into transferable college credit, at no extra tuition.",
            src: "Council for Adult and Experiential Learning (CAEL), prior learning assessment.",
            lessonTitle: "WHAT YOU ALREADY DID MIGHT ALREADY COUNT.",
            lesson: "Before paying for a class in something you already know how to do, ask the registrar whether a prior-learning review exists. The answer is yes or no, and it's a five-minute question." },
          { door: "THE ATTIC", title: "SWITZERLAND PAID CASH TO STOP A VILLAGE DYING", deskLabel: "CASH AND FREE LAND, EUROPE", deskDate: "ALBINEN, SWITZERLAND",
            flavor: "Under a drop cloth, dated but never thrown out, like someone up here was keeping score.",
            stat: "The Swiss village of Albinen voted to pay newcomers cash to move in and build a home -- one of several small European towns, alongside offers in Greece, Spain and Sardinia, that have paid or given away property just to keep the local school and shops open.",
            src: "Municipality of Albinen, Switzerland, resident vote widely reported 2017 onward.",
            lessonTitle: "A SMALL TOWN'S OWN VOTE IS A RECORD, NOT A RUMOR.",
            lesson: "A town council vote is public record in a way a viral post is not. Before repeating \"this country pays you to move there,\" find the town, the vote and the year." }
        ] }
    ];
    const LEVELS_PUBLIC = [
      { name: "THE OFFICE", doorLabel: "THE BREAK ROOM", furniture: "desk", crazy: 0,
        pages: [
          // C032: deskDate is the field built to carry an edition, and all three of these held a publisher name
          // instead, so the desk sign dated nothing and the newspaper printed "up to 800 million" as a flat
          // estimate. It is not flat: it is the top of a modelled RANGE, from a report published before
          // generative AI existed. The edition and the scenario now travel with the number, in the src line the
          // visitor reads, which is the record -- not the header comment, which had drifted (see corgi.html).
          { door: "THE MAIL ROOM", title: "UP TO 800 MILLION JOBS, WORLDWIDE", deskLabel: "800M JOBS WORLDWIDE", deskDate: "MCKINSEY, 2017",
            flavor: "Folded into an empty mail slot, the kind with a name label long since peeled off.",
            stat: "In 2017 the McKinsey Global Institute modelled a range: 400 to 800 million people worldwide could be displaced by automation by 2030. The 800 million is the top of that range, its fastest-adoption scenario rather than its expected case, and it was published years before generative AI.",
            src: "McKinsey Global Institute, “Jobs Lost, Jobs Gained: Workforce Transitions in a Time of Automation,” November 2017. 800M is that report's rapid-adoption upper scenario; its midpoint scenario is 400M.",
            lessonTitle: "A GLOBAL NUMBER IS NOT YOUR NUMBER.",
            lesson: "800 million is every job, everywhere, added together. It tells you the shape of the problem. It does not tell you what happens to the one job in this building. Keep the scale of the claim attached to the claim." },
          { door: "THE CUBE FARM", title: "710,000 FEWER ADMINISTRATIVE ASSISTANTS", deskLabel: "710K FEWER ASSISTANTS", deskDate: "MCKINSEY, 2023",
            flavor: "Left on an empty chair in a cubicle with the nameplate still screwed to the wall.",
            stat: "McKinsey's 2023 research on generative AI and the future of work in America projected that demand for administrative assistants could fall by roughly 710,000 positions by 2030 as AI takes over repetitive clerical tasks.",
            src: "McKinsey & Company, “Generative AI and the future of work in America,” July 2023. A projection to 2030, not a count of jobs already gone.",
            lessonTitle: "A NAMED JOB TITLE IS EASIER TO CHECK THAN A TREND.",
            lesson: "“Administrative assistants, down 710,000” can be checked against real hiring data for that one job title. “AI is coming for office jobs” cannot be checked against anything. Prefer the number with a job title attached to it." },
          { door: "THE COPIER ALCOVE", title: "THE MOST REPETITIVE WORK GOES FIRST", deskLabel: "REPETITIVE WORK FIRST", deskDate: "MCKINSEY, 2023",
            flavor: "Warm from the copier tray, like it had just come off the machine and nobody had claimed it.",
            stat: "McKinsey's 2023 research found office and administrative support work involves an especially high share of repetitive, data-processing tasks, exactly the kind of work automated systems handle most easily.",
            src: "McKinsey & Company, “Generative AI and the future of work in America,” July 2023.",
            lessonTitle: "REPETITIVE IS THE PATTERN, NOT THE JOB TITLE.",
            lesson: "The pattern that predicts automation is the shape of the task, not the name on the door. A repetitive task inside a job that sounds safe is still a repetitive task. Look at what the day actually consists of." }
        ] }
    ];
    const LEVELS = MODE === "public" ? [LEVELS_PUBLIC[0], {...LEVELS_LIVE[0], doorLabel:"THE BACK OF THE SCHOOL", crazy:1, pages:LEVELS_PUBLIC[0].pages.map((p,i)=>({...p,door:LEVELS_LIVE[0].pages[i].door}))}] : LEVELS_LIVE;
    if (MODE === 'public' && (state.lives === 0 || state.dreamPhase === 'done')) {
      state.level = 0; state.found[0] = [true, true, true];
    }
    cc.dataset.school=String(!!LEVELS[state.level].handAuthored);

    function paintHearts() {
      const hearts = byId('ccLives');
      hearts.hidden = MODE !== 'public';
      hearts.setAttribute('aria-label', state.lives + ' of ' + PAPER_HEARTS + ' paper hearts remaining');
      hearts.querySelectorAll('.cc-paper-heart').forEach((heart, i) => heart.classList.toggle('lost', i >= state.lives));
    }
    paintHearts();
    const announce = t => { const el = byId("ccAnnounce"); if (el) el.textContent = t; };

    // ---------------------------------------------------------------- meter: banked ratchet (unchanged logic
    // from 2026-08-28) plus a live component added on top for the hunt (0901: "the CORTISOL bar fills with
    // proximity too"). Displayed value is min(100, banked + live); the banked ratchet itself never drops, and
    // capture drops only the live component (see doCapture() below).
    const meterPct = byId("ccMeterPct"), meterEl = byId("ccMeter");
    let bankedVal = 4, liveVal = 0, lastMeterPaint = 0, heartVisual = null, heartCortisol = 4;
    function paintMeter() {
      const shown = MODE === 'public' && state.level === 1 && state.dreamPhase === 'hunt'
        ? schoolCortisol(state.found[1].filter(Boolean).length, liveVal / 30)
        : Math.max(0, Math.min(100, Math.round(bankedVal + liveVal)));
      heartCortisol = shown;
      byId('ccLives').style.setProperty('--heartbeat', (60 / heartbeatBpm(shown)) + 's');
      cc.style.setProperty("--meter", shown); meterPct.textContent = shown + "%"; meterEl.setAttribute("aria-valuenow", shown);
    }
    function bankMeter(v) { bankedVal = Math.max(bankedVal, Math.round(v)); paintMeter(); }

    // ---------------------------------------------------------------- ransom-note headline letters (unchanged, 2026-08-28)
    let rseed = 91; const rnd = () => (rseed = (rseed * 9301 + 49297) % 233280) / 233280;
    const fonts = ["Anton", "Archivo Black", "Bowlby One SC", "Special Elite", "Barlow Condensed"];
    function dressRansom(rootEl) {
      rootEl.querySelectorAll("[data-ransom]").forEach(el => {
        if (el.dataset.dressed) return; el.dataset.dressed = "1";
        const wrap = document.createElement("span"); wrap.className = "ransom";
        el.dataset.ransom.split(" ").forEach((word, wi) => {
          if (wi) { const sp = document.createElement("span"); sp.className = "g sp"; sp.innerHTML = "&nbsp;"; wrap.appendChild(sp); }
          const w = document.createElement("span"); w.className = "word";
          [...word].forEach(ch => {
            const g = document.createElement("span");
            g.className = "g k" + Math.floor(rnd() * 6);
            g.style.setProperty("--f", `"${fonts[Math.floor(rnd() * fonts.length)]}"`);
            g.style.setProperty("--r", (rnd() * 10 - 5).toFixed(1) + "deg");
            g.textContent = ch; w.appendChild(g);
          });
          wrap.appendChild(w);
        });
        el.appendChild(wrap);
      });
    }

    // ---------------------------------------------------------------- the book (leaf/flip mechanics unchanged, 2026-08-28)
    const book = byId("ccBook");
    const leaves = [...book.querySelectorAll(".leaf")];
    const N = leaves.length;
    const prevBtn = byId("ccPrev"), nextBtn = byId("ccNext");
    const cornerNext = byId("ccCornerNext"), cornerPrev = byId("ccCornerPrev");
    const titles = ["THE FRONT PAGE", "PAGE ONE", "PAGE TWO", "PAGE THREE", "THE ANCHOR'S OWN RECORD"];
    const bstate = { page: 0 };
    const leftPane = byId("ccLeft");
    function paintLeft() {
      leftPane.innerHTML = bstate.page > 0 ? "" : '<div class="verso"></div>';
      if (bstate.page > 0) leftPane.appendChild(leaves[bstate.page - 1].querySelector(".face.front").cloneNode(true));
    }
    function renderBook() {
      leaves.forEach((leaf, i) => {
        const turned = i < bstate.page;
        leaf.style.transform = `rotateY(${turned ? -180 : 0}deg)`;
        leaf.style.zIndex = turned ? (100 + i) : (100 + (N - i));
        leaf.style.pointerEvents = (i === bstate.page || (turned && i === bstate.page - 1)) ? "auto" : "none";
      });
      paintLeft();
      prevBtn.disabled = bstate.page <= 0;
      nextBtn.disabled = bstate.page >= N - 1;
      cornerNext.hidden = bstate.page >= N - 1;
      cornerPrev.hidden = bstate.page <= 0;
      announce(`Page ${bstate.page + 1} of ${N}: ${titles[bstate.page]}`);
    }
    function goTo(p) { bstate.page = Math.max(0, Math.min(N - 1, p)); renderBook(); }
    ctx.on(prevBtn, "click", () => goTo(bstate.page - 1));
    ctx.on(nextBtn, "click", () => goTo(bstate.page + 1));
    const rightPane = byId("ccRight");
    function bindCorner(el, dir) {
      let dragging = false, rect = null, idx = null;
      ctx.on(el, "pointerdown", e => {
        if (dir === "next" && bstate.page >= N - 1) return;
        idx = bstate.page; rect = rightPane.getBoundingClientRect();
        leaves[idx].style.transition = "none"; dragging = true;
        try { el.setPointerCapture(e.pointerId); } catch {}
      });
      ctx.on(el, "pointermove", e => {
        if (!dragging) return;
        const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        leaves[idx].style.transform = `rotateY(${(-(1 - frac) * 180).toFixed(2)}deg)`;
      });
      const finish = () => {
        if (!dragging) return; dragging = false;
        const leaf = leaves[idx];
        const m = /rotateY\(([-\d.]+)deg\)/.exec(leaf.style.transform);
        const deg = m ? parseFloat(m[1]) : 0;
        leaf.style.transition = "";
        goTo(deg <= -90 ? bstate.page + 1 : bstate.page);
      };
      ctx.on(el, "pointerup", finish);
      ctx.on(el, "pointercancel", finish);
    }
    bindCorner(cornerNext, "next");
    ctx.on(cornerNext, "click", () => { if (!cornerNext.hidden) goTo(bstate.page + 1); });
    ctx.on(cornerPrev, "click", () => { if (!cornerPrev.hidden) goTo(bstate.page - 1); });
    ctx.on(book, "keydown", e => {
      if (cc.dataset.view !== "book") return;
      if (e.key === "ArrowRight") goTo(bstate.page + 1);
      else if (e.key === "ArrowLeft") goTo(bstate.page - 1);
    });

    // ---- leaf content: front page, three locked/found slots, the record. Level-aware (3.2): reads whichever
    // LEVELS[state.level] is current, so the same five leaves carry a different level's content each time.
    function paintFront() {
      const lvl = state.level, L = LEVELS[lvl];
      const n = state.found[lvl].filter(Boolean).length;
      const front = byId("ccLeaf0").querySelector(".face.front");
      front.innerHTML = `
        <header class="masthead">
          <p class="kicker">Mom's Brainwashing Stream presents</p>
          <h1 class="rtitle" data-ransom="THE NAUSEOUS TIMES"></h1>
          <div class="dateline"><span>${L.name} EDITION</span><span>VOL. X9 &middot; NO. ${lvl + 1}</span><span>PRICE: YOUR CALM</span></div>
        </header>
        <figure class="lead">
          <img src="assets/cortisol-corgi-badge.png" alt="Cortisol Corgi, the anchor, three anxious corgis in collars" width="1761" height="1516">
          <figcaption>THE ANCHOR, WEARING A CAMERA, IN ${L.name} AFTER HOURS. HE HAS NOT SLEPT. NEITHER HAS THE STORY.</figcaption>
        </figure>
        <div class="cols" aria-label="This morning's newspaper">
          <p><span class="lede">${lvl === 0 ? (MODE === "public" ? "THE OFFICE WAS BRIGHT WHEN HE WENT IN." : "THE SCHOOL WAS EMPTY WHEN HE WENT IN.") : `HE IS IN ${L.name} NOW.`}</span> Three pages are loose somewhere in it. He is going to find all three, because someone has to, and the someone is him.</p>
          <p class="head">PAGES FOUND: ${n} / 3</p>
          <p>${n === 0 ? "None yet. Walk the halls." : n < 3 ? "Keep going. It is worse further in." : "All three. Turn the page and see what he found."}</p>
          <p>Each page he finds gets turned into this paper, right here, in order. Press READ THE PAPER any time to look at what he already has.</p>
        </div>
        <p class="pageno">DRAG THE CORNER, OR PRESS PAGE &middot; PG 1 / ${N}</p>`;
      dressRansom(front);
    }
    function paintPage(i) {
      const lvl = state.level;
      const front = byId("ccLeaf" + (i + 1)).querySelector(".face.front");
      const p = LEVELS[lvl].pages[i];
      if (state.found[lvl][i]) {
        front.innerHTML = `
          <section class="block ${["manila","pink","constr"][i]} r${i + 1}" aria-labelledby="ccPg${i}H"><span class="tape tl" aria-hidden="true"></span>
            <p class="kicker">Found in ${p.door}</p>
            <h2 id="ccPg${i}H" data-ransom="${p.title}"></h2>
            <p class="body">${p.stat}</p>
            <p class="src">${p.src}</p>
            <p class="lesson"><b>${p.lessonTitle}</b>${p.lesson}</p>
          </section>
          <p class="pageno">PG ${i + 2} / ${N}</p>`;
      } else {
        front.innerHTML = `
          <section class="block r${i + 1}">
            <p class="kicker">Still out there</p>
            <h2>PAGE ${i + 1}</h2>
            <p class="body">Not found yet. It is somewhere in ${p.door}. Go look.</p>
          </section>
          <p class="pageno">PG ${i + 2} / ${N}</p>`;
      }
      if(LEVELS[lvl].handAuthored&&state.found[lvl][i])front.innerHTML='<img class="school-crayon-page" src="assets/school-drawing-'+(i+1)+'.png" alt="'+['HE IS IN THE HALL','DONT LET HIM SEE YOU','HE KNOWS MY NAME'][i]+'" style="width:100%;height:100%;object-fit:contain;background:#e8dfb7">';
      dressRansom(front);
    }
    function paintLeaf4() {
      const front = byId("ccLeaf4").querySelector(".face.front");
      const lvl = state.level;
      if (MODE === 'public' ? state.dreamPhase !== 'done' : lvl < LEVELS.length - 1) {
        const complete = state.found[lvl].every(Boolean);
        front.innerHTML = `
          <section class="block r1 pressure" aria-labelledby="ccNextH"><span class="tape tl" aria-hidden="true"></span>
            <p class="kicker">${complete ? "Door open" : "Still out there"}</p>
            <h2 id="ccNextH" data-ransom="${complete ? LEVELS[lvl].doorLabel : "KEEP LOOKING"}"></h2>
            <p class="body">${complete ? `He found all three here. The door to ${LEVELS[lvl].doorLabel} is open at the end of the hall. Walk to it.` : "Three pages are somewhere in this building. He has not found all of them yet."}</p>
            <p class="cap" style="color:var(--gold)">WOOF WOOF. WOOF.</p>
            <p class="cap">(answer the quiz on Wednesday. every answer is a signal out. he cannot say more. he cannot say why.)</p>
          </section>
          <p class="pageno">PG ${N} / ${N}</p>`;
        dressRansom(front);
        return;
      }
      front.innerHTML = `
        <section class="block constr r3" aria-labelledby="scanH"><span class="tape tl" aria-hidden="true"></span>
          <p class="kicker">The anchor's own record</p>
          <h2 id="scanH" data-ransom="Submit your stress"></h2>
          <p class="body">He walked ${MODE === "public" ? "the whole office" : "the whole school"} for these three pages. Hold still for the scan. Then tell him which one is coming for your job.</p>
          <div class="scan" id="scan"><div class="line"></div><div class="out" id="scanOut">HOLD STILL. LOOK AT THE DOG.</div></div>
          <button class="big" type="button" id="scanBtn">SCAN MY STRESS</button>
          <p class="fine">The scan is purely visual. It measures nothing, stores nothing, and cannot see you. Cortisol Corgi cannot see either. That is canon.</p>
          <p class="fine">Whatever you type below is saved in this browser so the channel knows you answered. It is not sent anywhere and nobody reads it.</p>
          <form id="ventForm">
            <label for="ventName">A name, or not</label>
            <input id="ventName" name="name" placeholder="Anonymous is fine.">
            <label for="ventAI">Which AI is coming for your job?</label>
            <input id="ventAI" name="aiJob" required placeholder="The chatbot. The scheduler. All of them.">
            <button class="big" type="submit" id="ventBtn">TELL THE DOG</button>
            <p class="fine">Nothing is posted anywhere. In-character participation only, never a sale.</p>
          </form>
          <div class="feeder" id="feeder" aria-hidden="true">
            <svg class="pile" id="kibbleSvg" viewBox="0 0 560 180" preserveAspectRatio="xMidYMax meet" role="button" tabindex="-1" aria-label="Dog food pushed out. Click it."></svg>
            <div class="pawclip"><svg class="paw" viewBox="0 0 210 210" aria-hidden="true">
              <g filter="url(#fur)">
                <path d="M210 58 Q150 54 120 74 Q94 92 92 118 Q95 152 132 162 Q176 170 210 160 Z" fill="#f6f7f9"/>
                <ellipse cx="86" cy="112" rx="62" ry="70" fill="#f8f9fb"/>
                <ellipse cx="52" cy="52" rx="17" ry="24" transform="rotate(-32 52 52)" fill="#f6f7f9"/>
                <ellipse cx="40" cy="92" rx="18" ry="25" transform="rotate(-12 40 92)" fill="#f8f9fb"/>
                <ellipse cx="42" cy="134" rx="18" ry="25" transform="rotate(10 42 134)" fill="#f6f7f9"/>
                <ellipse cx="58" cy="170" rx="17" ry="24" transform="rotate(28 58 170)" fill="#f8f9fb"/>
              </g>
              <g opacity=".92">
                <path d="M60 96 Q86 78 112 96 Q118 128 86 140 Q54 128 60 96 Z" fill="#df9fb2"/>
                <ellipse cx="44" cy="54" rx="9" ry="12" transform="rotate(-30 44 54)" fill="#e7b7c6"/>
                <ellipse cx="31" cy="92" rx="9" ry="13" fill="#e7b7c6"/>
                <ellipse cx="33" cy="134" rx="9" ry="13" fill="#e7b7c6"/>
                <ellipse cx="49" cy="170" rx="9" ry="12" transform="rotate(28 49 170)" fill="#e7b7c6"/>
              </g>
              <g fill="#efe9dc" stroke="#b8ac90" stroke-width="1">
                <path d="M30 44 Q15 39 11 48 Q20 53 31 52 Z"/><path d="M18 88 Q3 86 1 95 Q12 98 23 94 Z"/>
                <path d="M20 132 Q5 134 5 144 Q16 144 25 139 Z"/><path d="M38 166 Q25 177 29 185 Q41 181 45 172 Z"/>
              </g>
            </svg></div>
          </div>
        </section>
        <p class="cap" style="color:var(--gold)">WOOF WOOF. WOOF.</p>
        <p class="cap">(answer the quiz on Wednesday. every answer is a signal out. he cannot say more. he cannot say why.)</p>
        <p class="pageno">PG ${N} / ${N} &middot; THE BACK PAGE</p>`;
      dressRansom(front);
      bindRecord();
    }
    function repaintAll() { paintFront(); LEVELS[state.level].pages.forEach((_, i) => paintPage(i)); }

    // ---- the record leaf's own behaviour: scan (decorative, unchanged) + vent form + kibble/paw (unchanged
    // except the drop no longer calls MBS.unlock -- that fired already, on the third page)
    let recordBound = false;
    function bindRecord() {
      if (recordBound) return; recordBound = true;
      const svg = byId("kibbleSvg"), cell = 13, y0 = 12; const pieces = [];
      const shades = ["#5a3a1c", "#6b4423", "#4a2f16", "#7a5230", "#3e2812"];
      const font = { H: ["10001","10001","10001","11111","10001","10001","10001"], E: ["11111","10000","10000","11110","10000","10000","11111"],
                     L: ["10000","10000","10000","10000","10000","10000","11111"], P: ["11110","10001","10001","11110","10000","10000","10000"] };
      const chunk = s => { const rot = (rnd() * 360).toFixed(0), r = (5 + rnd() * 1.8).toFixed(1);
        return `<g transform="rotate(${rot})"><path d="M${-r} 0 Q${-r} ${-r*0.9} 0 ${-r*0.95} Q${r*0.9} ${-r} ${r*0.95} 0 Q${r} ${r*0.85} 0 ${r*0.9} Q${-r*0.9} ${r} ${-r} 0 Z" fill="${s}" stroke="#231405" stroke-width="1"/><ellipse cx="${-r*0.3}" cy="${-r*0.35}" rx="${(r*0.42).toFixed(1)}" ry="${(r*0.28).toFixed(1)}" fill="rgba(255,235,200,.16)"/></g>`; };
      const step = cell * 6 + 8; let ox = (560 - ("HELP".length * step - 8)) / 2;
      for (const ch of "HELP") { font[ch].forEach((row, r) => [...row].forEach((bit, c) => { if (bit !== "1") return;
        pieces.push({ hx: ox + c * cell + (rnd() - .5) * 6, hy: y0 + r * cell + (rnd() - .5) * 6, inner: chunk(shades[Math.floor(rnd() * shades.length)]) }); })); ox += step; }
      for (let i = 0; i < 12; i++) pieces.push({ hx: 70 + rnd() * 420, hy: 2 + rnd() * 150, inner: chunk(shades[Math.floor(rnd() * shades.length)]) });
      svg.innerHTML = pieces.map(p => `<g class="k">${p.inner}</g>`).join("");
      [...svg.children].forEach((g, i) => { const p = pieces[i]; p.g = g;
        p.home = `translate(${p.hx.toFixed(1)}px, ${p.hy.toFixed(1)}px)`;
        p.px = 280 + (rnd() - .5) * 150; p.py = 116 + (rnd() - .5) * 34; p.pile = `translate(${p.px.toFixed(1)}px, ${p.py.toFixed(1)}px)`;
        g.style.opacity = "0"; g.style.transform = `translate(${p.px.toFixed(1)}px, ${(p.py + 70).toFixed(1)}px)`; });
      const feeder = byId("feeder");
      let dispensed = false, arranged = false, dropped = false;
      function dispense() { if (dispensed) return; dispensed = true; feeder.classList.add("on");
        ctx.frame(() => pieces.forEach((p, i) => ctx.timeout(() => { p.g.style.opacity = "1"; p.g.style.transform = p.pile; }, 60 + i * 7 + rnd() * 40))); }
      function arrange() { if (arranged) return; if (!dispensed) dispense(); arranged = true;
        ctx.timeout(() => { feeder.classList.add("covering");
          ctx.timeout(() => pieces.forEach(p => { p.g.style.transform = p.home; }), 380);
          ctx.timeout(() => { feeder.classList.remove("covering"); feeder.classList.add("ready"); svg.setAttribute("tabindex", "0"); }, 1180);
        }, 300); }
      function drop() { if (dropped || !arranged) return; dropped = true; feeder.classList.add("dropping");
        if (ctx.mbs && ctx.mbs.wave) ctx.mbs.wave();
        pieces.forEach((p, i) => ctx.timeout(() => { const dx = (rnd() * 60 - 30), dy = (760 + rnd() * 520), rot = (rnd() * 720 - 360).toFixed(0);
          p.g.style.transform = `translate(${(p.hx + dx).toFixed(0)}px, ${(p.hy + dy).toFixed(0)}px) rotate(${rot}deg)`; p.g.style.opacity = "0"; }, i * 7 + rnd() * 40)); }
      ctx.on(svg, "click", drop);
      ctx.on(svg, "keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drop(); } });

      const scan = byId("scan"), out = byId("scanOut"), btn = byId("scanBtn");
      const readings = ["ELEVATED. AS EXPECTED.", "HIGH. THE DOG UNDERSTANDS.", "VERY HIGH. HAVE A SEAT.", "OFF THE CHART. WELCOME HOME.", "MILD. SUSPICIOUS. SCAN AGAIN."];
      let scanCount = 0;
      ctx.on(btn, "click", () => { if (scan.classList.contains("running")) return;
        scan.classList.remove("done"); scan.classList.add("running"); out.textContent = "SCANNING. DO NOT BREATHE NORMALLY."; scanCount++;
        const held = Math.min(99, 44 + scanCount * 13);
        ctx.timeout(() => { scan.classList.remove("running"); scan.classList.add("done");
          out.textContent = `STRESS: ${held}%. ${readings[(scanCount - 1) % readings.length]}`; bankMeter(held); dispense(); }, 2300); });

      // the ONE MBS.form call site on this page (Ian, 2026-08-30: which AI is coming for your job, name kept)
      ctx.on(byId("ventForm"), "submit", e => {
        e.preventDefault();
        const b = byId("ventBtn"); b.textContent = "THE DOG HEARD YOU"; b.disabled = true;
        const data = { name: byId("ventName").value || "anonymous", aiJob: byId("ventAI").value };
        ctx.mbs && ctx.mbs.form && ctx.mbs.form("corgi", data);
        // Optional follow-up after the school ending. Completion is idempotent.
        ctx.mbs && ctx.mbs.complete && ctx.mbs.complete("corgi", { terminal: "vent" });
        arrange();
      });
    }
    repaintAll(); paintLeaf4();

    // ---------------------------------------------------------------- view switching
    const huntStage = byId("ccHuntStage"), bookStage = byId("ccBookStage");
    const deskStage = byId("ccDeskStage");
    const readBtn = byId("ccReadBtn"), backHunt = byId("ccBackHunt");
    // C035: ONE active-hunt state, asked by everything that is allowed to run while the hall is up. It was
    // four separate reads of this same attribute -- the ambient haunt scheduler, the keydown, the timecode --
    // and the frame loop, the one that matters most, was not one of them. Its only guard was unmount, so with
    // the newspaper up the world kept walking, kept draining stamina, kept burning the flashlight and kept
    // letting the suited figure close the distance. Only the KEYBOARD was muted, and only for keys pressed
    // after the book went up: a key already held stayed held.
    const hunting = () => cc.dataset.view === "hunt";
    function showHunt() { cc.dataset.view = "hunt"; huntStage.hidden = false; bookStage.hidden = true; deskStage.hidden = true; announce("Back in the hallway."); }
    function showBook() { cc.dataset.view = "book"; huntStage.hidden = true; bookStage.hidden = false; deskStage.hidden = true; renderBook(); }
    function showDesk() { cc.dataset.view = "desk"; huntStage.hidden = true; bookStage.hidden = true; deskStage.hidden = false; announce("At the head office's desk. It wants a code."); }
    cc.dataset.view = "hunt";
    // Round 2, section 2: BACK TO THE HALL normally just swaps stages -- but if a page was found at a desk and
    // the dog is still standing over it, this button has to stand him down first (camera, pitch, paws, the
    // haunt) before the hall shows. runHunt3D fills this hook in; the fallback path leaves it null.
    let deskStandDownHook = null;
    ctx.on(readBtn, "click", () => { if (!cc.dataset.transition && !cc.dataset.caught) showBook(); });
    ctx.on(backHunt, "click", () => { if (!(deskStandDownHook && deskStandDownHook())) showHunt(); });
    const deskBackBtn = byId("ccDeskBack");
    if (deskBackBtn) ctx.on(deskBackBtn, "click", showHunt);

    // ---- 0905: public mode's head-office desk. enterHeadOffice() is the door-transition's public-mode branch
    // (see the frame loop below); the code itself is never checked here -- see the desk form below.
    function enterHeadOffice() { showDesk(); }

    // ---- 0905: the desk's own code check, server-authority only (Codex C6). MBS.mode is a tone switch and is
    // never treated as entitlement here -- this form does not compare the typed code to anything in the page;
    // it posts to the deployed Supabase `redeem` function ({mission_id, code} -> a bearer + the mission's game
    // slug) and only a genuine 2xx response with a matching game slug counts as a win. mission_id and the API
    // base are read straight off document.documentElement -- deliberately NOT scoped to the channel, because
    // that is the SHELL's element and the same place mbs-shim.js reads its own API base. While either is empty
    // the desk renders inert and claims nothing, and it never falls back to accepting a code locally.
    (function setupDesk() {
      const deskEl = byId("ccDesk"), deskMsg = byId("ccDeskMsg");
      const deskForm = byId("ccDeskForm"), deskCode = byId("ccDeskCode");
      if (!deskEl) return;
      const MISSION_ID = document.documentElement.dataset.missionId || "";
      const API_BASE = document.documentElement.dataset.api || "";
      const ready = !!(MISSION_ID && API_BASE);
      if (!ready) {
        deskEl.dataset.state = "inert";
        deskMsg.textContent = "THE SCREEN IS DARK. NOTHING TO TYPE INTO YET -- CHECK BACK DURING THE STREAM.";
      }
      ctx.on(deskForm, "submit", e => {
        e.preventDefault();
        if (!ready) return;   // inert: never accepts a code with nothing to check it against
        const code = deskCode.value.trim();
        if (!code) return;
        deskEl.dataset.state = "checking"; deskMsg.textContent = "CHECKING...";
        fetch(API_BASE + "/redeem", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mission_id: MISSION_ID, code })
        }).then(r => r.ok ? r.json() : Promise.reject(new Error("http " + r.status)))
          .then(data => {
            if (data && data.game && data.game !== "corgi") throw new Error("mismatched game");
            deskEl.dataset.state = ""; deskMsg.textContent = "ACCESS GRANTED. SENDING YOU BACK.";
            ctx.timeout(() => { const u = new URL(location.href); u.searchParams.set("mode", "live"); location.href = u.toString(); }, 900);
          })
          .catch(() => { deskEl.dataset.state = ""; deskMsg.textContent = "THAT CODE COULD NOT BE CHECKED. TRY AGAIN."; });
      });
    })();

    // Shared by both renderers: the final three-page collection finishes this mode.
    function markLevelComplete(lvl) {
      if (MODE === "public" && state.dreamPhase !== "done") { save(); return; }
      if (lvl >= LEVELS.length - 1) {
        // Recovering the final school pages is the shipped game ending. The old vent form
        // is optional; it must not hold the sponsor ad behind another, unrelated action.
        ctx.mbs?.complete?.("corgi", { terminal: MODE === "public" ? "school-dream" : "school-pages" });
        ctx.mbs?.wave?.(); ctx.mbs?.unlock?.("corgi");
      }
      save();
    }
    function advanceLevel() { if (state.level < LEVELS.length - 1) { state.level += 1; save(); return true; } return false; }
    function collect(i) {
      const lvl = state.level;
      if (state.found[lvl][i]) return;
      state.found[lvl][i] = true; save();
      paintFront(); paintPage(i);
      const n = state.found[lvl].filter(Boolean).length;
      byId("ccTally").textContent = `${MODE === 'public' && lvl === 1 ? 'PICTURES' : 'PAGES'} ${n}/3`;
      bankMeter(4 + n * 30);
      announce(`Page found: ${LEVELS[lvl].pages[i].title}. Read it any time.`);
      if (n === 3) {
        ctx.timeout(() => {
          markLevelComplete(lvl);
          if(state.level !== lvl)return;
          paintLeaf4();
          announce(lvl >= LEVELS.length - 1
            ? (MODE === "public" ? "All three scary pictures found. The school back door is open. Find the final pages beyond it." : "All nine pages found. The anchor's own record is open.")
            : `All three pages found. The door to ${LEVELS[lvl].doorLabel} is open.`);
        }, 900);
      }
      return true;
    }
    byId("ccTally").textContent = `${MODE === 'public' && state.level === 1 ? 'PICTURES' : 'PAGES'} ${state.found[state.level].filter(Boolean).length}/3`;
    bankMeter(4 + state.found[state.level].filter(Boolean).length * 30);   // a restored session shows the stress already earned, not a reset 4%

    // ---- the viewport fills the glass (Ian, review 2026-08-31: "a third of the glass is dead black... make
    // the game fill the glass"). See the CSS comment on .cc-viewport for why this has to be measured, not
    // calc()'d. Runs for both the WebGL and the fallback path, since both render inside #ccViewport.
    const viewport = byId("ccViewport");
    // The deliberate exception to scoping: .screen is the TELEVISION and its parent is the glass this
    // channel is sitting in, which is exactly what fitViewport() measures. On a play route neither exists,
    // glassEl is undefined and the viewport keeps its CSS height - the behaviour this channel has always
    // had there.
    const screenEl = cc.closest(".screen") || document.getElementById("screen");
    const glassEl = (screenEl || {}).parentElement;
    function fitViewport() {
      if (!glassEl) return;
      const gh = glassEl.getBoundingClientRect().height;   // .glass sits OUTSIDE the zoomed .channel -- a plain, unzoomed px value
      const meterH = byId("ccMeter").getBoundingClientRect().height;   // meter is INSIDE .channel, so this rect is already post-zoom (visual) px
      const reserve = meterH + 18;   // this stage's 8px+10px padding, now plain px (2.16 retired .channel's zoom, so no 1.15 factor) -- only the outer chrome (gh) varies by breakpoint
      const visualTarget = Math.max(220, gh - reserve - 6);
      // .channel is no longer zoomed (2.16/C002), so a layout px IS a rendered px here and the height is
      // assigned as measured. gh comes off .glass, which was always outside the zoom, so it never changed.
      viewport.style.height = visualTarget + "px";
    }
    if (glassEl) { ctx.observe(new ResizeObserver(fitViewport), glassEl); fitViewport(); }

    // ---------------------------------------------------------------- office ambience (0905): fax, typing,
    // phone chatter, synthesised locally with WebAudio -- no audio asset, nothing scraped, nothing licensed.
    // Shared between the WebGL and fallback paths since it's audio, not scene content; gated to public mode
    // only, and started on the first pointer/key gesture, same event class the shim already waits for, since
    // browsers refuse audio before one. ponytail: three fixed sound-shapes (typing bursts, an occasional fax
    // handshake, a muffled phone-murmur bed), not a mixed soundscape engine -- upgrade if a future pass wants
    // more variety.
    // CONVERSION NOTE: the AudioContext local was called `ctx` inline. It is `actx` here, because `ctx` is now
    // the mount context. It is registered through ctx.audio so the runtime closes it on unmount - an
    // AudioContext left open is a channel that is still making noise into a page that has moved on.
    function setupOfficeAmbience() {
      let actx = null, started = false;
      function typingBurst(t) {
        const n = 4 + Math.floor(rnd() * 6);
        for (let i = 0; i < n; i++) {
          const at = t + i * (0.06 + rnd() * 0.05);
          const src = actx.createBufferSource(); const buf = actx.createBuffer(1, 200, actx.sampleRate);
          const d = buf.getChannelData(0); for (let j = 0; j < 200; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / 200);
          src.buffer = buf;
          const f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2200 + rnd() * 1400; f.Q.value = 2.2;
          const g = actx.createGain(); g.gain.value = 0.05 + rnd() * 0.04;
          src.connect(f); f.connect(g); g.connect(actx.destination); src.start(at);
        }
      }
      function faxHandshake(t) {
        const o1 = actx.createOscillator(), o2 = actx.createOscillator(), g = actx.createGain();
        o1.type = "square"; o2.type = "square"; o1.frequency.value = 1100; o2.frequency.value = 1850;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.08); g.gain.linearRampToValueAtTime(0, t + 1.6);
        o1.connect(g); o2.connect(g); g.connect(actx.destination);
        o1.start(t); o2.start(t + 0.35); o1.stop(t + 1.6); o2.stop(t + 1.6);
      }
      function phoneMurmurBed() {
        const bufLen = actx.sampleRate * 2, buf = actx.createBuffer(1, bufLen, actx.sampleRate);
        const d = buf.getChannelData(0); for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
        const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
        const g = actx.createGain(); g.gain.value = 0.012;
        const lfo = actx.createOscillator(); lfo.frequency.value = 0.4; const lfoGain = actx.createGain(); lfoGain.gain.value = 0.008;
        lfo.connect(lfoGain); lfoGain.connect(g.gain);
        src.connect(f); f.connect(g); g.connect(actx.destination); src.start(); lfo.start();
      }
      function scheduleNext() {
        const wait = 2600 + rnd() * 4200;
        ctx.timeout(() => {
          if (cc.dataset.mode !== "public") return;   // defensive; MODE never actually changes mid-session
          if (state.level > 0) { actx.suspend().catch(() => {}); return; }
          if (rnd() < 0.7) typingBurst(actx.currentTime); else faxHandshake(actx.currentTime);
          scheduleNext();
        }, wait);
      }
      function start() {
        if (state.level > 0) return;
        if (started) return; started = true;
        try { actx = ctx.audio(new (window.AudioContext || window.webkitAudioContext)()); } catch { return; }
        if (actx.state === "suspended") actx.resume().catch(() => {});
        phoneMurmurBed(); scheduleNext();
      }
      ["pointerdown", "keydown"].forEach(ev => ctx.on(viewport, ev, start, { once: true, passive: true }));
    }
    if (MODE === "public") setupOfficeAmbience();
    let musicAudio=null,musicBeat=0,alarmAt=-10;
    function musicTone(hz,duration,level,type='sine'){if(!musicAudio)return;const t=musicAudio.currentTime,o=musicAudio.createOscillator(),g=musicAudio.createGain();o.type=type;o.frequency.value=hz;g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(musicAudio.destination);o.start();o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
    function alarmSound(){if(!musicAudio||musicAudio.currentTime-alarmAt<3)return;alarmAt=musicAudio.currentTime;const o=musicAudio.createOscillator(),g=musicAudio.createGain(),t=musicAudio.currentTime;o.type='triangle';o.frequency.setValueAtTime(440,t);o.frequency.linearRampToValueAtTime(880,t+.6);o.frequency.linearRampToValueAtTime(440,t+1.2);g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+1.4);o.connect(g).connect(musicAudio.destination);o.start();o.stop(t+1.4);o.onended=()=>{o.disconnect();g.disconnect();};}
    function startMusic(){if(musicAudio)return;try{musicAudio=ctx.audio(new AudioContext());musicAudio.resume();}catch{return;}ctx.interval(()=>{if(!LEVELS[state.level].handAuthored){const notes=[261.63,329.63,392,493.88,440,349.23,293.66,392];musicTone(notes[musicBeat%8],.65,.018);if(musicBeat%4===0)musicTone(notes[musicBeat%8]/2,1.5,.012,'triangle');musicBeat++;}},450);}
    ctx.on(viewport,'pointerdown',startMusic,{once:true});ctx.on(viewport,'keydown',startMusic,{once:true});

    // ---------------------------------------------------------------- WebGL detect
    // The probe, fixed. The original asked a throwaway canvas for a context and walked away from it: a real
    // live context, on a detached canvas, spent out of the same small budget the renderer below needs, once
    // per mount. WEBGL_lose_context gives it back on purpose.
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

    if (!glOK) { runFallback(); } else { runHunt3D(); }

    // ================================================================== FALLBACK (no WebGL / no CDN)
    function runFallback() {
      byId("ccCanvas").remove();
      cc.querySelector(".cc-joy").remove();
      byId("ccFlashBtn").remove();
      cc.querySelector(".cc-sprint").remove();
      byId("ccStatic").remove();
      byId("ccPrompt").remove();
      byId("ccBurst").remove();
      const fb = byId("ccFallback"); fb.hidden = false;
      const map = byId("ccFbMap"), read = byId("ccFbRead");
      let reflected = false;
      // 3.2/3.6: level-aware now -- rooms are built from whichever LEVELS[state.level] is current, so the
      // fallback walks all three levels in turn, not just the original school. The library's flavour-only loop
      // stops stay (level 1 only, unchanged); levels 2 and 3 keep this simpler (three pages, one locked next
      // door) -- ponytail: the bespoke flavour-loop dressing is not duplicated for the new levels, upgrade if a
      // future pass wants it there too.
      function roomsFor(lvl) {
        const L = LEVELS[lvl];
        const rooms = L.pages.map((p, i) => ({ id: i, label: p.door, kind: "page" }));
        if (L.handAuthored) {   // 0905: was `lvl === 0`, which also matched public's office (idx 0, generated) --
                                // this flavour dressing (trophy/library/gym/locker) is the hand-authored school's
                                // own, so it must key off that flag, not the index.
          rooms.unshift({ id: "trophy", label: "THE TROPHY CASE", kind: "reflect" });
          rooms.splice(2, 0, { id: "lib-loop", label: "THE LIBRARY -- READING NOOK", kind: "flavor",
            text: "A ring of low shelves, walked all the way around. Nothing here but dust and the sense of being circled." });
          rooms.splice(4, 0, { id: "gym-loop", label: "THE GYMNASIUM -- BLEACHER LOOP", kind: "flavor",
            text: "Under and around the bleachers, a full lap. Something creaked on the far side before you got there." });
          rooms.push({ id: "locker-loop", label: "THE LOCKER ROW -- VENT LOOP", kind: "flavor",
            text: "A second row of lockers, looping back around to the first. One vent is warm to the touch." });
        }
        if (L.doorLabel) rooms.push({ id: "next", label: L.doorLabel, kind: "locked" });
        return rooms;
      }
      let ROOMS = roomsFor(state.level);
      function paintMap() {
        map.innerHTML = "";
        ROOMS.forEach(r => {
          const btn = document.createElement("button"); btn.type = "button"; btn.textContent = r.label;
          if (r.kind === "page") { if (state.found[state.level][r.id]) btn.classList.add("found"); }
          if (r.kind === "locked") {
            btn.classList.toggle("locked", !state.found[state.level].every(Boolean));
            btn.setAttribute("aria-disabled", String(!state.found[state.level].every(Boolean)));
          }
          ctx.on(btn, "click", () => visit(r));
          map.appendChild(btn);
        });
      }
      function visit(r) {
        if (r.kind === "locked") {
          if(!state.found[state.level].every(Boolean)){read.textContent=r.label+'. Locked. Find all three pages here first.';return;}
          if (MODE === 'public' && state.dreamPhase === 'done') { read.textContent = 'The dream is over. You are back in the office, and your file is unlocked.'; return; }
          if (MODE === 'public' && state.level === 1) {
            if (!canOpenBackDoor(state)) return;
            read.textContent = 'The back door swings open. At the back of the school, three final pages wait on a desk.';
            map.replaceChildren();
            const pickup = document.createElement('button'); pickup.type = 'button'; pickup.textContent = 'COLLECT THE FINAL PAGES';
            ctx.on(pickup, 'click', showFallbackEnding); map.append(pickup); return;
          }
          if (MODE === 'public' && state.lives === 0) { restartDream(state); save(); paintHearts(); }
          if(advanceLevel()){ROOMS=roomsFor(state.level);paintMap();repaintAll();paintLeaf4();cc.dataset.school=String(!!LEVELS[state.level].handAuthored);byId('ccTally').textContent=(MODE === 'public' ? 'PICTURES ' : 'PAGES ')+state.found[state.level].filter(Boolean).length+'/3';read.textContent='You enter the break room and fall asleep. You wake in the school. Find the three scary pictures to open its back door.';}return;
        }
        if (r.kind === "flavor") { read.textContent = r.text; return; }
        if (r.kind === "reflect") {
          reflected = true;
          read.textContent = "The glass on the case catches you before you catch it. Round ears. A wet nose, close to the floor. You are the dog. You already knew that. Seeing it is different.";
          return;
        }
        const lvl = state.level, i = r.id, p = LEVELS[lvl].pages[i];
        if (state.found[lvl][i]) { read.textContent = `${p.title}. Already in the paper. Press READ THE PAPER above the map to see it again.`; return; }
        read.textContent = `${p.flavor} On a desk in ${LEVELS[lvl].name}. ${p.stat} ${p.src} ${p.lessonTitle} ${p.lesson}`;
        collect(i); paintMap();
        if (state.found[lvl].every(Boolean) && LEVELS[lvl].doorLabel) read.textContent+=' All three pages found. Walk to the back door.';
      }
      function showFallbackEnding() {
        state.dreamPhase = 'ending'; save();
        read.textContent = 'The pages slip from your paws. You wake up in the break room. “Oh thank Mom, it was just a dream.”';
        map.replaceChildren();
        const leave = document.createElement('button'); leave.type = 'button'; leave.textContent = 'LEAVE THE BREAK ROOM';
        ctx.on(leave, 'click', () => {
          state.dreamPhase = 'done'; state.level = 0; save();
          cc.dataset.school = 'false'; ROOMS = roomsFor(0); paintMap(); repaintAll(); paintLeaf4();
          byId('ccTally').textContent = 'PAGES 3/3';
          read.textContent = 'The scene retraces your way in: you lift your head, move away from the table, and leave the break room. You are back in the office. Your file is unlocked.';
          markLevelComplete(LEVELS.length - 1);
        });
        map.append(leave); leave.focus();
      }
      paintMap();
      read.textContent = "Tap a room to see what Cortisol Corgi found there.";
      if (MODE === 'public' && state.dreamPhase === 'ending') showFallbackEnding();
    }

    // ================================================================== 3D HUNT
    function runHunt3D() {
      // Keep touch devices (including landscape phones) within a modest pixel budget.
      const mobileRender = matchMedia("(pointer: coarse), (max-width: 768px)").matches;
      cc.dataset.renderQuality = mobileRender ? "mobile" : "full";
      const canvas = byId("ccCanvas");   // viewport is already declared in the shared scope above
      const joy = byId("ccJoy"), joyNub = byId("ccJoyNub");
      const flashBtn = byId("ccFlashBtn"), batFill = byId("ccBatFill");
      const tcEl = byId("ccTC"), reflectEl = byId("ccReflect");
      const promptEl = byId("ccPrompt"), burstEl = byId("ccBurst");
      const vhsGrain = viewport.querySelector(".cc-vhs .grain"), vhsScan = viewport.querySelector(".cc-vhs .scan");
      const staticCanvas = byId("ccStatic"), staticCtx = staticCanvas.getContext("2d");
      staticCanvas.width = 48; staticCanvas.height = 27;
      let lastStaticDraw = -Infinity;
      function drawStaticNoise() {
        const img = staticCtx.createImageData(48, 27);
        for (let p = 0; p < 48 * 27; p++) { const v = Math.random() * 255, o = p * 4;
          img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255; }
        staticCtx.putImageData(img, 0, 0);
      }

      import(THREE_URL).then(THREE => {
        // The import resolved for a mount that has already ended: build nothing. Without this the whole
        // school, and a WebGL context to draw it with, would be built into a fragment that has left the
        // document - and nothing would ever release it, because unmount() has already run.
        if (session !== mine) return;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobileRender });
        renderer.setClearColor(0xcfe6f2, 1);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 60);
        scene.add(camera);   // load-bearing for the walk in unmount(): the flashlight and its target are
                             // camera children, so the camera has to be a scene member to be reached.

        // registered BEFORE the scene is populated: if any of the building below throws, the promise's
        // .catch reports it and unmount() still has a renderer and a scene to release. A half-built scene
        // that nothing can dispose is the leak this record exists to prevent.
        gl = { renderer: renderer, scene: scene, extra: [] };
        if (MODE === 'public') {
          try {
            heartVisual = createPaperHearts(THREE, byId('ccHeartCanvas'), {reducedMotion:REDUCED});
            gl.extra.push(heartVisual);
          } catch (error) { console.warn('[cc] Using newspaper-heart fallback', error); }
        }

        /* own(x): register something the scene walk will NOT reach. This channel's shape is particular -
           wallBox() clones its material AND its map for every wall so each can carry its own repeat, and
           buildLevel clones floorMat (and, in public, ceilMat) the same way. The ORIGINALS those clones came
           from are therefore never attached to a mesh at all, and a traverse would miss every one. Same for
           areaMat()'s three materials per level, and for every signTexture(): the door's map is REPLACED
           when the door opens, so the map it was carrying before is unreachable from that moment on. */
        let collectingLevel = false;
        const levelExtras = new Set();
        const own = (x) => {
          if (gl && x) {
            if (collectingLevel) { levelExtras.add(x); if (x.map) levelExtras.add(x.map); }
            else { gl.extra.push(x); if (x.map) gl.extra.push(x.map); }
          }
          return x;
        };

        // ---- cheerful primary-colour school textures, all cheap canvas draws
        function wallTexture() {
          const c = document.createElement("canvas"); c.width = 256; c.height = 128; const x = c.getContext("2d");
          x.fillStyle = "#f4ecd2"; x.fillRect(0, 0, 256, 128);
          x.fillStyle = "#e2b23a"; x.fillRect(0, 0, 256, 14); x.fillStyle = "#3a7ab8"; x.fillRect(0, 108, 256, 20);
          const cols = ["#d8452f", "#e2b23a", "#3a7ab8", "#4a9a5a"];
          for (let i = 0; i < 8; i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(6 + i * 31, 32, 24, 70); x.strokeStyle = "rgba(0,0,0,.25)"; x.strokeRect(6 + i * 31, 32, 24, 70);
            x.fillStyle = "rgba(0,0,0,.18)"; for (let v = 0; v < 4; v++) x.fillRect(9 + i * 31, 40 + v * 15, 18, 2); }
          const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
        }
        function floorTexture() {
          const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
          x.fillStyle = "#e9eef2"; x.fillRect(0, 0, 64, 64); x.fillStyle = "#bcd7ea"; x.fillRect(0, 0, 32, 32); x.fillRect(32, 32, 32, 32);
          const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
        }
        function paperTexture() {
          const c = document.createElement("canvas"); c.width = c.height = 96; const x = c.getContext("2d");
          x.fillStyle = "#e6dcc0"; x.fillRect(0, 0, 96, 96); x.strokeStyle = "rgba(40,30,10,.4)"; x.lineWidth = 1;
          for (let i = 0; i < 26; i++) { x.beginPath(); const y = rnd() * 96; x.moveTo(3, y); x.lineTo(93, y + (rnd() * 2 - 1)); x.stroke(); }
          const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
        }
        // real newsprint, canvas-drawn: columns of tiny type plus a bold headline fragment, not just ruled
        // lines -- this is what actually reads as "papier-mache made out of newspaper" at monster scale (round
        // 2 honest report, 2026-08-31: the ruled-line paperTexture above was legible on nothing up close).
        // paper/ink swapped per part so the head stays pale and the suit stays dark -- same material family,
        // different value, so the silhouette still separates the way a bald head must from a suited body.
        function newsprintTexture(paper, ink, headline, density) {
          // rows drawn at 3-4px and repeat kept low (below, where each texture is applied) on purpose: three.js
          // mipmaps a CanvasTexture by default, and hairline detail averages straight back to a flat colour at
          // any real viewing distance -- exactly the "texture is invisible" failure from the honest round-2
          // report. Chunky rows plus mipmapping off keeps the pattern surviving past point-blank range.
          // Art pass 0901 rebuild: round 3's attempt at this (paper base like #2e2b35 on the suit) was too dark
          // for the ink to ever show against it -- that's the "torso samples flat #1A1920" failure. Paper bases
          // now stay in the cream/manila family for all three parts (varied by density, not by going to near-
          // black) and a big high-contrast headline block plus halftone dots are added so there's something
          // that reads at corridor distance, not just up close.
          const c = document.createElement("canvas"); c.width = c.height = 192; const x = c.getContext("2d");
          x.fillStyle = paper; x.fillRect(0, 0, 192, 192);
          // masthead-style headline block: big and high-contrast, the part that has to read from across the hall
          x.fillStyle = `rgba(${ink},.88)`; x.fillRect(4, 4, 184, 20);
          x.fillStyle = paper; x.font = "900 15px Georgia"; x.textBaseline = "top"; x.textAlign = "left";
          x.fillText(headline, 8, 6);
          x.fillStyle = `rgba(${ink},.7)`; x.fillRect(4, 28, 184, 3);
          // fake body-text columns, density sets how dark/frequent -- the briefcase runs darkest of the three
          const cols = 3, colW = 184 / cols;
          for (let col = 0; col < cols; col++) {
            let y = 38 + rnd() * 6;
            while (y < 178) {
              if (rnd() < 0.1) { y += 7; continue; }   // paragraph break
              x.fillStyle = `rgba(${ink},${(0.32 + rnd() * 0.3 + density * 0.3).toFixed(2)})`;
              x.fillRect(4 + col * colW + 3, y, (colW - 6) * (0.5 + rnd() * 0.5), 3.4);
              y += 6.4;
            }
          }
          // one halftone-dot patch -- the newsprint tell, a "photo" rendered as a dot grid
          const hx = 8 + rnd() * 90, hy = 96 + rnd() * 34;
          for (let py = 0; py < 46; py += 5) for (let px = 0; px < 70; px += 5) {
            const shade = 0.25 + rnd() * 0.5;
            x.fillStyle = `rgba(${ink},${shade.toFixed(2)})`;
            x.beginPath(); x.arc(hx + px, hy + py, 1.1 + shade * 1.6, 0, 7); x.fill();
          }
          // crumple creases: irregular dark/light streak pairs so the flat map reads as paper glued over a
          // form, which is what papier-mache actually is, rather than a printed-on skin
          for (let i = 0; i < 5; i++) {
            const sx = rnd() * 192, sy = rnd() * 192, ex = sx + (rnd() - .5) * 140, ey = sy + (rnd() - .5) * 140;
            x.strokeStyle = `rgba(${ink},${(0.18 + rnd() * 0.18).toFixed(2)})`; x.lineWidth = 2 + rnd() * 2;
            x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke();
            x.strokeStyle = "rgba(255,250,235,.22)"; x.lineWidth = 1;
            x.beginPath(); x.moveTo(sx + 1.5, sy + 1.5); x.lineTo(ex + 1.5, ey + 1.5); x.stroke();
          }
          const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
        }
        function signTexture(a, b) {
          const c = document.createElement("canvas"); c.width = 256; c.height = 96; const x = c.getContext("2d");
          x.fillStyle = "#c0392b"; x.fillRect(0, 0, 256, 96); x.fillStyle = "#f4ecd2"; x.font = "bold 26px Georgia"; x.textAlign = "center";
          x.fillText(a, 128, 40); x.font = "bold 16px Georgia"; x.fillText(b, 128, 68);
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
          // owned: the door's map is REPLACED when the door opens, so the one it carried before that moment
          // is unreachable from the graph and a walk would never find it.
          return own(t);
        }
        // Round 2 art directive (Ian, 0903, "newspaper papier-mache", overrides this channel's earlier prop
        // materials): the monster is already papier-mache; now every prop is too -- torn newsprint strips wrapped
        // over a form, readable headline fragments at the seams, matte, slightly lumpy, glue sheen off, torn
        // edges. One shared texture generator, reused for every prop (the desks, the trophy case), so the whole
        // school reads as one material vocabulary, not per-prop palettes. The masthead fragment is drawn
        // identically on every call -- the repeated detail Ian's directive asks for.
        function machePropTexture(headline, date) {
          const c = document.createElement("canvas"); c.width = c.height = 192; const x = c.getContext("2d");
          const paperTones = ["#cbbd91", "#d3c69a", "#c3b587", "#d9cc9f"];
          x.fillStyle = "#3a2f1c"; x.fillRect(0, 0, 192, 192);   // glue-shadow base: torn strip gaps read dark, not white
          for (let s = 0; s < 6; s++) {
            const sy = s * 34 - 6 + rnd() * 6, rot = (rnd() * 6 - 3);
            x.save(); x.translate(96, sy + 17); x.rotate(rot * Math.PI / 180); x.translate(-96, -(sy + 17));
            x.fillStyle = paperTones[s % paperTones.length];
            x.beginPath(); x.moveTo(-6, sy + 2);
            for (let px = -6; px <= 198; px += 14) x.lineTo(px, sy + 2 + (rnd() * 6 - 3));
            x.lineTo(198, sy + 32); for (let px = 198; px >= -6; px -= 14) x.lineTo(px, sy + 32 - (rnd() * 6 - 3));
            x.closePath(); x.fill();
            x.fillStyle = "rgba(40,34,20,.5)";   // fake type columns torn into the strip
            for (let ty = 8; ty < 26; ty += 4) { let tx = -2;
              while (tx < 192) { const wlen = 4 + rnd() * 14; x.fillRect(tx, sy + ty, wlen, 2); tx += wlen + 3 + rnd() * 5; } }
            x.restore();
          }
          x.save(); x.translate(96, 96); x.rotate(-4 * Math.PI / 180);   // the repeated masthead fragment
          x.fillStyle = "rgba(40,34,20,.75)"; x.font = "italic 900 13px Georgia"; x.textAlign = "center";
          x.fillText("the NAUSEOUS TIMES", 0, 0);
          x.strokeStyle = "rgba(40,34,20,.5)"; x.lineWidth = 1; x.beginPath(); x.moveTo(-46, 6); x.lineTo(46, 6); x.stroke();
          x.restore();
          x.save(); x.translate(96, 150); x.rotate((rnd() * 4 - 2) * Math.PI / 180);   // one AI/jobs headline, at the seam
          x.fillStyle = "#ded2ac"; x.fillRect(-84, -14, 168, 30);
          x.fillStyle = "#201808"; x.font = "900 14px Georgia"; x.textAlign = "center";
          x.fillText(headline, 0, -1); x.font = "11px Georgia"; x.fillText(date, 0, 13);
          x.restore();
          for (let i = 0; i < 6; i++) {   // crumple creases, same idea as the monster's own newsprint
            const sx = rnd() * 192, sy = rnd() * 192, ex = sx + (rnd() - .5) * 100, ey = sy + (rnd() - .5) * 100;
            x.strokeStyle = "rgba(30,24,12,.22)"; x.lineWidth = 1.5 + rnd() * 1.5;
            x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke();
          }
          const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
        }
        function machePropMat(headline, date) { return new THREE.MeshStandardMaterial({ map: machePropTexture(headline, date), roughness: 1, metalness: 0 }); }

        // own()ed below: wallBox() and buildLevel() CLONE these, so the originals are never on a mesh and the
        // scene walk in unmount() would not reach a single one of them.
        const wallMat = own(new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.92, metalness: 0 }));
        const floorMat = own(new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.85, metalness: 0.05 }));
        const ceilMat = own(new THREE.MeshStandardMaterial({ color: 0xfff6da, roughness: 1, metalness: 0 }));
        // doorMat is built fresh per level now (buildLevel, below) -- its texture names that level's own next
        // door, so it can no longer be one shared constant.
        const glassMat = own(new THREE.MeshStandardMaterial({ color: 0xdcefe8, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
        // trophy cups: matte papier-mache newsprint now, not gilt metal, per Ian's 0903 material directive.
        // Only ever attached in live mode's hand-authored school, so in public it is created and never used --
        // own()ed for that case.
        const trophyMat = own(machePropMat("CASE FILE: WHO'S NEXT", "SCHOOL EDITION"));
        // Art pass 0901: round 3's fix (real newsprint texture + a light that travels with him, monsterLight
        // below) was the right direction but the paper base itself was too dark to read (#2e2b35 on the suit is
        // near-black, so darker ink on top of it just disappears -- the "torso samples flat #1A1920" failure).
        // All three surfaces now stay in the cream/manila family -- head palest, suit a duller cream, briefcase
        // the darkest base AND the densest ink of the three -- so he still reads as the darkest thing on the
        // tape (muted creams against the school's saturated primaries, then the Rung 3 sepia/vignette on top)
        // without the print itself going invisible. Emissive dropped way down (was 0.3-0.32, washing toward
        // flat colour) to a bare separation floor -- real light now does the work. Matte throughout: roughness
        // stays at 1, metalness at 0.
        const suitMat = new THREE.MeshStandardMaterial({ map: newsprintTexture("#7a7460", "40,34,20", "SLIDES IN", 0.55), roughness: 1, metalness: 0, emissive: 0x1a1610, emissiveIntensity: 0.06 });
        suitMat.map.repeat.set(1.4, 2.6);
        const paperMat = new THREE.MeshStandardMaterial({ map: newsprintTexture("#8f866c", "30,24,14", "JOBS", 0.3), roughness: 1, metalness: 0, emissive: 0x241f14, emissiveIntensity: 0.05 });
        paperMat.map.repeat.set(1.2, 1.2);
        const caseMat = new THREE.MeshStandardMaterial({ map: newsprintTexture("#5a5443", "20,16,8", "CASE FILE", 0.85), roughness: 1, metalness: 0, emissive: 0x120f0a, emissiveIntensity: 0.05 });
        // Expansion pass 0901: one flat matte colour per area, no stripes -- a shared grain texture (3-5%
        // per-pixel value noise near white) tinted by material.color, so it reads as painted concrete rather
        // than bare untextured geometry without ever drawing a repeating pattern.
        function grainTexture() {
          const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
          const img = x.createImageData(64, 64);
          for (let p = 0; p < 64 * 64; p++) { const v = 242 + Math.floor(rnd() * 13); const o = p * 4;
            img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255; }
          x.putImageData(img, 0, 0);
          const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
        }
        // own()ed for the same reason as wallMat: every wall built from an area material is a CLONE of it.
        function areaMat(hex) { return own(new THREE.MeshStandardMaterial({ color: hex, map: grainTexture(), roughness: 0.95, metalness: 0 })); }

        // ---- WALL_H and wallBox() are the one shared building block every level (and its furniture, via
        // machePropMat/buildFurniture below) is built from. collideRects and levelGroup are cleared and rebuilt
        // by buildLevel() on every level change (3.2) -- levelGroup.add() instead of scene.add() so a whole
        // level's meshes/lights come out in one THREE.Scene.remove() when the next level replaces them.
        // Respawns now rebuild levels repeatedly. Release their resources while keeping shared materials.
        const sharedResources = new Set([...gl.extra, suitMat, paperMat, caseMat, suitMat.map, paperMat.map, caseMat.map]);
        const WALL_H = 2.6;
        const collideRects = [];
        let levelGroup = new THREE.Group(); scene.add(levelGroup);
        function disposeLevel() {
          levelGroup.traverse(o => {
            if (o.geometry) levelExtras.add(o.geometry);
            for (const material of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
              levelExtras.add(material);
              for (const key of ['map','emissiveMap','normalMap','roughnessMap','alphaMap']) if (material[key]) levelExtras.add(material[key]);
            }
          });
          for (const resource of levelExtras) if (!sharedResources.has(resource)) resource.dispose();
          levelExtras.clear();
        }
        gl.extra.push({dispose:disposeLevel});
        function wallBox(cx, cz, w, d, mat) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), mat || wallMat);
          m.name="solid-wall";m.material.side=THREE.DoubleSide;
          m.position.set(cx, WALL_H / 2, cz);
          const rep = Math.max(1, Math.round(Math.max(w, d) / 1.4)); if (m.material.map) { m.material = m.material.clone(); m.material.map = m.material.map.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(rep, 1); }
          levelGroup.add(m);
          collideRects.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
          return m;
        }

        // ---- level 1's hand-authored corridor and three areas, byte-identical to the pre-0903 build (do not
        // touch: area colours closed 2026-09-01, corridor shape closed by round-2 collision fixes).
        function level0MainCorridor() {
          wallBox(-0.6, 0, 0.4, 3.0);
          [[2.75, 1.35, 5.5, 0.3], [14.4, 1.35, 11.8, 0.3], [24.35, 1.35, 3.3, 0.3],
           [6.25, -1.35, 12.5, 0.3], [21.25, -1.35, 9.5, 0.3]
          ].forEach(w => wallBox(...w));
          return 26;
        }
        // ---- Expansion pass 0901: each of the three page areas is now its own hallway (10-14 units) with
        // offshooting branches, authored as data -- one array of areas (id, colour, corridor-defining wall
        // rectangles, lights, page position, haunt anchors, a bounding box for "which area is the player in")
        // -- consumed by one loop that calls the existing wallBox() helper (unchanged). The main corridor above
        // is untouched: same length, same striped wallTexture(), same doorway gaps. Each area leaves its
        // doorway going straight, then forks: one dead-end branch, and one loop (two mouths into the same wall
        // with a solid pillar between them, so it's an actual ring walked around, not a wide bulge) -- never a
        // comb. Corridor widths stay in the 2.4-3.0 spec band (loop legs a touch narrower, still >= 2.2). Every
        // page sits at the deep end of its branch, never visible from the main corridor doorway.
        // Colours tuned THROUGH the Rung 3 treatment, not in isolation, per the spec's own instruction -- see
        // the full account in corgi.html's own history: the overlay cast plus saturate/sepia crushes almost any
        // input hue toward the same yellow-green olive, and the monster must still be the darkest thing on the
        // tape, so both floors are satisfied at once by picks verified live through the real render.
        function level0Areas() {
          return [
            { id: "library", name: "THE LIBRARY", mat: areaMat(0x2f6b3a), furniture: "desk", deskYaw: Math.PI / 2,
              walls: [
                [8.55, 3.675, 0.3, 4.65], [8.55, 11.975, 0.3, 6.75],          // spine east wall, gap z 6-8.6 (branch mouth)
                [5.45, 2.675, 0.3, 2.65], [5.45, 9, 0.3, 4.8], [5.45, 14.675, 0.3, 1.35],   // spine west wall, gaps z 4-6.6 & 11.4-14 (loop mouths)
                [7, 15.5, 3.1, 0.3],                                          // spine far cap
                [12.55, 8.75, 8.3, 0.3], [12.55, 5.85, 8.3, 0.3], [16.7, 7.3, 0.3, 2.9],   // branch: north wall, south wall, dead-end cap
                [2.45, 9, 0.3, 10], [3.95, 3.85, 3.0, 0.3], [3.95, 14.15, 3.0, 0.3]         // loop: outer wall, south cap, north cap
              ],
              lights: [[7, 4], [7, 8], [7, 12], [7, 15], [11, 7.3], [15, 7.3], [3.95, 6], [3.95, 9], [3.95, 13]],
              pagePos: [15.5, 1.0, 7.3],
              anchors: [[7, 2], [7, 5], [7, 9], [7, 12], [7, 14], [10, 7.3], [13, 7.3], [16, 7.3], [3.95, 5], [3.95, 9], [3.95, 13]],
              bbox: { x0: 2.2, x1: 16.9, z0: 1.2, z1: 15.7 } },
            { id: "gym", name: "THE GYMNASIUM", mat: areaMat(0x7a2e1c), furniture: "desk", deskYaw: -Math.PI / 2,
              walls: [
                [12.85, -3.675, 0.3, 4.65], [12.85, -11.975, 0.3, 6.75],
                [16.15, -2.675, 0.3, 2.65], [16.15, -9, 0.3, 4.8], [16.15, -14.675, 0.3, 1.35],
                [14.5, -15.5, 3.3, 0.3],
                [9, -5.85, 8.3, 0.3], [9, -8.75, 8.3, 0.3], [4.7, -7.3, 0.3, 2.9],
                [19.15, -9, 0.3, 10], [17.65, -3.85, 3.0, 0.3], [17.65, -14.15, 3.0, 0.3]
              ],
              lights: [[14.5, -4], [14.5, -8], [14.5, -12], [14.5, -15], [10, -7.3], [6, -7.3], [17.65, -6], [17.65, -9], [17.65, -13]],
              pagePos: [6.2, 1.0, -7.3],
              anchors: [[14.5, -2], [14.5, -5], [14.5, -9], [14.5, -12], [14.5, -14], [11, -7.3], [8, -7.3], [5, -7.3], [17.65, -5], [17.65, -9], [17.65, -13]],
              bbox: { x0: 4.5, x1: 19.3, z0: -15.7, z1: -1.2 } },
            { id: "locker", name: "THE LOCKER ROW", mat: areaMat(0x1c2a4a), furniture: "desk", deskYaw: Math.PI / 2,
              walls: [
                [22.85, 3.675, 0.3, 4.65], [22.85, 11.975, 0.3, 6.75],
                [20.15, 2.675, 0.3, 2.65], [20.15, 9, 0.3, 4.8], [20.15, 14.675, 0.3, 1.35],
                [21.5, 15.5, 2.7, 0.3],
                [26.85, 8.75, 8.3, 0.3], [26.85, 5.85, 8.3, 0.3], [31, 7.3, 0.3, 2.9],
                [17.3, 9, 0.3, 10], [18.725, 3.85, 2.85, 0.3], [18.725, 14.15, 2.85, 0.3]
              ],
              lights: [[21.5, 4], [21.5, 8], [21.5, 12], [21.5, 15], [25, 7.3], [29, 7.3], [18.7, 6], [18.7, 9], [18.7, 13]],
              pagePos: [29.7, 1.0, 7.3],
              anchors: [[21.5, 2], [21.5, 5], [21.5, 9], [21.5, 12], [21.5, 14], [24, 7.3], [27, 7.3], [30, 7.3], [18.7, 5], [18.7, 9], [18.7, 13]],
              bbox: { x0: 17.1, x1: 31.2, z0: 1.2, z1: 15.7 } }
          ];
        }
        // ---- 3.5: FOOD SERVICE and THE OFFICE get a NEW generated corridor + three areas, same building block
        // (wallBox) and the same topology family as level 1's hand-authored areas -- a dead-end branch (the
        // page, at furthest depth) and a two-mouth loop around a solid pillar, never a comb. Parametrized on a
        // spine position (cx) and side (s, +1/-1) so the same generator serves all six new areas across both
        // levels; only names/colours/furniture differ between them. ponytail: simpler round-number geometry
        // than level 1's bespoke hand-tuned shape (verified safe -- ring corridor width 1.8/1.5 units, both well
        // over the 0.56-unit player diameter) -- upgrade to bespoke per-area shapes if a future pass wants
        // level 1's exact intricacy replicated rather than the same template reused with a new skin.
        function genArea(cx, s, name, id, furnKind, colorHex) {
          const bx0 = cx - 4.4, bx1 = cx - 1.6;             // dead-end branch, width 2.8 (spec band 2.4-3.0)
          const lx0 = cx + 1.5, lx1 = cx + 7.5;              // loop footprint, width 6
          const near = s * 1.35, far = s * 8.5;
          const zc = (near + far) / 2, zlen = Math.abs(far - near);
          return {
            id, name, mat: areaMat(colorHex), furniture: furnKind, deskYaw: s > 0 ? 0 : Math.PI,
            walls: [
              [bx0, zc, 0.3, zlen], [bx1, zc, 0.3, zlen], [(bx0 + bx1) / 2, far + s * 0.15, (bx1 - bx0) + 0.3, 0.3],   // branch: sides + dead-end cap
              [lx0, zc, 0.3, zlen], [lx1, zc, 0.3, zlen], [(lx0 + lx1) / 2, far + s * 0.15, (lx1 - lx0) + 0.3, 0.3],   // loop: outer sides + far cap
              [cx + 2.1, near, 1.2, 0.3], [cx + 4.5, near, 1.2, 0.3], [cx + 6.9, near, 1.2, 0.3],                       // loop: 3 near-wall stubs, 2 gaps between them (the two mouths)
              [cx + 4.5, zc, 2.4, zlen - 3.0]                                                                            // loop: the solid pillar between the two mouths
            ],
            lights: [[cx - 3, near + 1], [cx - 3, zc], [cx - 3, far - 1], [cx + 4.5, near + 1], [cx + 4.5, far - 1]],
            pagePos: [cx - 3.0, 1.0, far - s * 1.0],
            anchors: [[cx - 3, near + 1], [cx - 3, zc], [cx - 3, far - 1], [cx + 2.1, near + 0.8], [cx + 6.9, near + 0.8], [cx + 4.5, far - 0.8]],
            bbox: { x0: cx - 4.6, x1: cx + 7.7, z0: Math.min(near, far) - 0.2, z1: Math.max(near, far) + 0.2 }
          };
        }
        // 0905: palette selection is mode-aware now, not just an idx-1 offset -- public's office sits at idx 0
        // (the generated layout, not the hand-authored school), where the old scheme assumed idx 0 always meant
        // the hand-authored school and never looked up a palette for it at all.
        function paletteFor(idx) {
          if (MODE === "public") return [0xd8dde6, 0xdfe6df, 0xe9e3c8];   // bright office: pale blue-grey, pale sage, pale brass
          const LIVE_PAL = [null, [0x6b3a8a, 0x1c6b5a, 0x8a5a1c], [0xb0203a, 0x203ab0, 0xb0a020]];   // idx0 is hand-authored, unused
          return LIVE_PAL[idx];
        }
        function genLevelAreas(lvl) {
          const L = LEVELS[lvl], pal = paletteFor(lvl);
          return [{ cx: 8, s: 1 }, { cx: 22, s: -1 }, { cx: 36, s: 1 }].map((sp, i) =>
            genArea(sp.cx, sp.s, L.pages[i].door, i, L.furniture, pal[i]));
        }
        const OFFICE_BOX={x0:-.65,x1:47.05,z0:-9.05,z1:9.05};
        function officeWindow(cx,cz,w){
          const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');const sky=x.createLinearGradient(0,0,0,256);sky.addColorStop(0,'#779fba');sky.addColorStop(.65,'#d5e4e9');sky.addColorStop(1,'#899da9');x.fillStyle=sky;x.fillRect(0,0,512,256);
          for(let i=0;i<18;i++){const xx=i*32,h=35+(i*43%85);x.fillStyle=i%2?'#697e90':'#8297a4';x.fillRect(xx,256-h,27,h);x.fillStyle='#bbd0d7';for(let y=262-h;y<250;y+=13)for(let dx=5;dx<23;dx+=9)x.fillRect(xx+dx,y,4,6);}
          x.strokeStyle='#ffffff30';x.lineWidth=9;x.beginPath();x.moveTo(40,210);x.lineTo(200,0);x.moveTo(300,256);x.lineTo(485,30);x.stroke();
          const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const glass=new THREE.MeshStandardMaterial({map:tex,color:0xc7e0e9,roughness:.2,metalness:.25,side:THREE.DoubleSide});
          const pane=wallBox(cx,cz,w,.3,glass);pane.name='office-window';
          const frame=new THREE.MeshStandardMaterial({color:0x596875,roughness:.6});
          function rail(width,height,xx,yy){const m=new THREE.Mesh(new THREE.BoxGeometry(width,height,.35),frame);m.position.set(xx,yy,cz);levelGroup.add(m);}
          rail(w,.7,cx,.35);rail(w,.18,cx,2.51);rail(w,.07,cx,1.6);
          const count=Math.max(1,Math.ceil(w/1.5));for(let i=0;i<=count;i++)rail(.075,2.6,cx-w/2+i*w/count,1.3);
        }
        function encloseOffice(){
          wallBox(-.8,0,.3,18.7);wallBox(47.2,0,.3,18.7);
          for(const z of [-9.2,9.2])for(let i=0;i<8;i++)officeWindow(2.2+i*6,z,6);
        }
        function genMainCorridor() {
          wallBox(-0.6, 0, 0.4, 3.0);
          [[1.9, 1.35, 3.4, 0.3], [23.55, 1.35, 16.1, 0.3], [45, 1.35, 3, 0.3],
           [8.9, -1.35, 17.4, 0.3], [38, -1.35, 17, 0.3]
          ].forEach(w => wallBox(...w));
          return 46;
        }

        // ---- 0905: "every hallway needs to get crazier and crazier as you go deeper" -- generic-school-wall-art
        // made scary, canvas-drawn (no new asset dependency), density and warp scaling with `crazy` (1 or 2).
        // Decorative planes only, no collideRects entry -- they hang flush on the corridor walls, never blocking.
        function posterTexture(kind, crazyLvl) {
          const c = document.createElement("canvas"); c.width = c.height = 220; const x = c.getContext("2d");
          x.fillStyle = "#e9e2c8"; x.fillRect(0, 0, 220, 220); x.strokeStyle = "#2a2214"; x.lineWidth = 6; x.strokeRect(3, 3, 214, 214);
          const drips = (bx, by, n, len) => { for (let i = 0; i < n; i++) { const dx = bx + (rnd() - .5) * 40;
            x.strokeStyle = "rgba(40,20,50,.5)"; x.lineWidth = 3 + rnd() * 3; x.beginPath(); x.moveTo(dx, by);
            x.bezierCurveTo(dx + (rnd() - .5) * 10, by + len * 0.5, dx + (rnd() - .5) * 14, by + len * 0.8, dx + (rnd() - .5) * 6, by + len); x.stroke(); } };
          if (kind === "apple") {
            x.fillStyle = "#b8203a"; x.beginPath();
            x.moveTo(110, 60); x.bezierCurveTo(150, 50, 175, 90, 165, 130); x.bezierCurveTo(155, 175, 120, 190, 110, 190);
            x.bezierCurveTo(100, 190, 65, 175, 55, 130); x.bezierCurveTo(45, 90, 70, 50, 110, 60); x.fill();
            x.strokeStyle = "#3a2410"; x.lineWidth = 5; x.beginPath(); x.moveTo(110, 60); x.lineTo(112, 34); x.stroke();
            drips(80, 150, 3 + crazyLvl * 3, 40 + crazyLvl * 30); drips(140, 155, 2 + crazyLvl * 3, 35 + crazyLvl * 30);
            x.fillStyle = "#3a2214"; x.font = "italic 12px Georgia"; x.textAlign = "center"; x.fillText("EVERY BITE IS TRACKED", 110, 210);
          } else if (kind === "ai") {
            x.fillStyle = "#1c1a2a"; x.fillRect(20, 30, 180, 140);
            const nodes = []; for (let i = 0; i < 8 + crazyLvl * 4; i++) nodes.push([40 + rnd() * 140, 45 + rnd() * 110]);
            x.strokeStyle = "rgba(150,220,255,.55)"; x.lineWidth = 1.5;
            nodes.forEach((n, i) => nodes.slice(i + 1).forEach(m => { if (rnd() < 0.35) { x.beginPath(); x.moveTo(n[0], n[1]); x.lineTo(m[0], m[1]); x.stroke(); } }));
            nodes.forEach(n => { x.fillStyle = "#8fe0ff"; x.beginPath(); x.arc(n[0], n[1], 3 + rnd() * 2, 0, 7); x.fill(); });
            drips(70, 170, 2 + crazyLvl * 3, 30 + crazyLvl * 25); drips(150, 168, 2 + crazyLvl * 2, 28 + crazyLvl * 22);
            x.fillStyle = "#3a2214"; x.font = "900 16px Georgia"; x.textAlign = "center"; x.fillText("A.I.", 110, 200);
          } else {
            x.fillStyle = "#1e3524"; x.fillRect(16, 16, 188, 188);
            const glyphs = ["∑", "∂", "π", "∞", "√", "Δ", "≈", "∫", "x²", "θ", "λ", "≡"];
            x.fillStyle = "#e9e2c8"; x.textAlign = "center";
            for (let i = 0; i < 22 + crazyLvl * 16; i++) {
              x.save(); x.translate(30 + rnd() * 160, 30 + rnd() * 160); x.rotate((rnd() - .5) * (0.5 + crazyLvl * 0.4));
              x.font = (10 + rnd() * 10) + "px Georgia"; x.fillText(glyphs[Math.floor(rnd() * glyphs.length)], 0, 0); x.restore();
            }
          }
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
        }
        function addSchoolPosters(doorX, crazyLvl) {
          const kinds = ["apple", "ai", "formula"], count = crazyLvl * 4;
          for (let i = 0; i < count; i++) {
            const px = 4 + (i / count) * (doorX - 8), pz = i % 2 ? 1.34 : -1.34, ry = i % 2 ? Math.PI : 0;
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9),
              new THREE.MeshStandardMaterial({ map: posterTexture(kinds[i % 3], crazyLvl), roughness: 1, metalness: 0, side: THREE.DoubleSide }));
            mesh.position.set(px, 1.5, pz); mesh.rotation.y = ry; levelGroup.add(mesh);
          }
        }

        // ---- Round 2, section 1: a kid's school desk under every page. Extended (3.5) into a furniture
        // dispatcher: FOOD SERVICE's tool bench and THE OFFICE's cubicle are new shapes built the same way
        // (boxes, one shared machePropMat papier-mache material, no laminate/metal) -- same material vocabulary,
        // a different prop. buildDesk itself is unchanged; the reading beat below (startDeskRead/standDown)
        // only ever reads a furniture group's position, never its shape, so all three are interchangeable to it.
        function woodTexture(){
          const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle='#b7854f';x.fillRect(0,0,512,256);
          for(let y=0;y<256;y+=2){x.strokeStyle=y%6?'#996634':'#d3a16c';x.lineWidth=.6;x.beginPath();for(let u=0;u<=512;u+=8){const v=y+2*Math.sin(u*.016+y*.09);u?x.lineTo(u,v):x.moveTo(u,v);}x.stroke();}
          const t=own(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;
        }
        function buildDesk(headline, date) {
          const g = new THREE.Group();
          const mat = new THREE.MeshStandardMaterial({color:0x885126,roughness:.83,map:woodTexture()});
          const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), mat); top.position.y = 0.56; g.add(top);
          [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.04), mat); leg.position.set(lx, 0.28, lz); g.add(leg); });
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.16), mat); seat.position.set(0, 0.32, 0.42); g.add(seat);
          [[-0.24, 0.42], [0.24, 0.42]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.03), mat); leg.position.set(lx, 0.16, lz); g.add(leg); });
          return g;
        }
        function buildBench(headline, date) {
          const g = new THREE.Group(); const mat = machePropMat(headline, date);
          const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.55), mat); top.position.y = 0.6; g.add(top);
          [[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.22], [0.42, 0.22]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), mat); leg.position.set(lx, 0.3, lz); g.add(leg); });
          const rail = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.04), mat); rail.position.set(0, 0.88, -0.28); g.add(rail);
          return g;
        }
        function buildCubicle(headline, date) {
          const g = new THREE.Group(); const mat = machePropMat(headline, date);
          const top = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.5), mat); top.position.y = 0.6; g.add(top);
          [[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), mat); leg.position.set(lx, 0.3, lz); g.add(leg); });
          for(const side of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.045,1.15,.65),new THREE.MeshStandardMaterial({color:0x657680,roughness:1}));p.position.set(side*.45,.8,0);g.add(p);}
          const partition = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.05), mat); partition.position.set(0, 1.05, -0.3); g.add(partition);
          return g;
        }
        function buildFurniture(kind, headline, date) {
          if (kind === "bench") return buildBench(headline, date);
          if (kind === "cubicle") return buildCubicle(headline, date);
          return buildDesk(headline, date);
        }
        function areaAt(x, z) { for (const a of AREAS) if (x >= a.bbox.x0 && x <= a.bbox.x1 && z >= a.bbox.z0 && z <= a.bbox.z1) return a; return null; }

        let AREAS = [], DESKS = [], MAIN_ANCHORS = [], pageObjs = [], monster = null, trophyGlass = null;
        let finalPages = null;
        let PAGE_POS = [], AREA_DOOR_X = [], DOOR_X = 0, doorOpen = false, transitioning = false, doorMesh = null, doorRectIdx = -1;
        const TROPHY_AT = new THREE.Vector3(), reflVec = new THREE.Vector3();
        // ---- 3.2: buildLevel(idx) assembles one level's whole scene -- corridor, areas, furniture, monster,
        // pages, door -- and runs again on every level transition (advanceLevel(), further down). Everything it
        // creates goes into levelGroup, so a rebuild is one Scene.remove() away from clean.
        function dressArea(a,school){
          const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});const metal=mat(0x555967),green=mat(0x42794b),cream=mat(0xe5dec8),wood=mat(0x8d633e);
          function item(group,geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;group.add(o);return o;}
          a.anchors.filter((p,i)=>i%2===1&&Math.hypot(p[0]-a.pagePos[0],p[1]-a.pagePos[2])>1.8).slice(0,5).forEach((p,i)=>{
            const g=new THREE.Group();g.name=school?'school-props':'office-props';g.position.set(p[0]+.4,0,p[1]+.3);levelGroup.add(g);
            if(!school&&i%3===0){item(g,new THREE.CylinderGeometry(.17,.12,.3,12),mat(0xa86e4a),0,.15,0);for(let j=0;j<6;j++){const leaf=item(g,new THREE.SphereGeometry(.12,8,8),green,Math.sin(j)*.13,.38+j*.065,Math.cos(j)*.1);leaf.scale.set(.6,1.8,.6);}}
            else if(!school){item(g,new THREE.BoxGeometry(.65,.62,.38),wood,0,.31,0);if(i%3===1){item(g,new THREE.BoxGeometry(.24,.3,.22),metal,0,.79,0);item(g,new THREE.CylinderGeometry(.095,.095,.19,16),new THREE.MeshStandardMaterial({color:0x9dcbd8,transparent:true,opacity:.65,roughness:.2}),.2,.74,0);item(g,new THREE.TorusGeometry(.075,.012,6,12),cream,.30,.76,0);}else{item(g,new THREE.CylinderGeometry(.11,.09,.24,16),mat(0x3b241a),0,.77,0);for(let j=0;j<3;j++)item(g,new THREE.CylinderGeometry(.045,.035,.09,12),cream,-.22+j*.18,.67,.10);}}
            else if(i%3===0){const bag=item(g,new THREE.BoxGeometry(.3,.42,.18),mat(0xb85272),0,.23,0);item(g,new THREE.TorusGeometry(.08,.025,6,12),metal,0,.49,0);item(g,new THREE.BoxGeometry(.22,.17,.04),mat(0xe1aa59),0,.2,.11);}
            else if(i%3===1){item(g,new THREE.SphereGeometry(.16,16,12),mat(0xde782c),0,.16,0);item(g,new THREE.BoxGeometry(.7,.08,.35),mat(0x407d8f),0,.05,.4);item(g,new THREE.CylinderGeometry(.035,.035,.48,10),wood,.2,.24,0);}
            else{const desk=buildDesk('','');g.add(desk);item(g,new THREE.SphereGeometry(.075,12,12),mat(0xbb2935),-.2,.66,0);item(g,new THREE.CylinderGeometry(.008,.008,.055,6),wood,-.2,.75,0);item(g,new THREE.BoxGeometry(.35,.008,.045),mat(0xe5be58),.12,.59,.12);}
          });
          // Additional work surfaces make the report desk one among several.
          a.anchors.filter((p,i)=>i%3===0&&Math.hypot(p[0]-a.pagePos[0],p[1]-a.pagePos[2])>2.5).slice(1,3).forEach(p=>{const d=school?buildDesk('',''):buildCubicle('','');d.position.set(p[0]-.4,0,p[1]-.35);levelGroup.add(d);collideRects.push({x0:d.position.x-.46,x1:d.position.x+.46,z0:d.position.z-.34,z1:d.position.z+.34});});
        }
        function buildLevel(idx) {
          cc.dataset.school=String(LEVELS[idx].handAuthored === true);
          flashBtn.hidden=!LEVELS[idx].handAuthored;setFlash(false);battery=100;doorSeen=false;
          disposeLevel(); collectingLevel = true;
          scene.remove(levelGroup); levelGroup = new THREE.Group(); scene.add(levelGroup);
          collideRects.length = 0; pageObjs = []; finalPages = null; monster = null; trophyGlass = null; doorOpen = false; transitioning = false;
          ghost.active = false; ghost.seen = false; creep.active = false; caught = false;
          monsterWasVisible = false; monsterVisibleAt = 0; staticIntensity = 0; liveVal = 0;
          if (ambientTimer) clearTimeout(ambientTimer);
          if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

          // 0905: brightness is the office's own visual signature ("bright and still, but with CCTV" -- the
          // client's own words) -- public mode's hemisphere and corridor lights run noticeably hotter than the
          // school's. `crazy` (live only, 0-2) nudges the corridor lights toward an off colour as the levels get
          // stranger, on top of the wall-art/monster-tempo escalation below.
          const bright = MODE === "public" && idx === 0;renderer.setClearColor(bright?0xcfe6f2:0x010102,1);
          const crazy = LEVELS[idx].crazy || 0;
          const floor = new THREE.Mesh(new THREE.PlaneGeometry(110, 50), floorMat.clone());
          floor.material.map = floor.material.map.clone(); floor.material.map.repeat.set(36, 16);
          floor.rotation.x = -Math.PI / 2; floor.position.set(20, 0, 0); levelGroup.add(floor);
          const ceil = new THREE.Mesh(new THREE.PlaneGeometry(110, 50), bright ? ceilMat.clone() : ceilMat);
          if (bright) ceil.material.color.set(0xffffff);
          ceil.rotation.x = Math.PI / 2; ceil.position.set(20, 2.6, 0); levelGroup.add(ceil);
          levelGroup.add(new THREE.HemisphereLight(bright ? 0xffffff : 0xfff6da, bright ? 0xe4ecf4 : 0xbcd7ea, bright ? 1.75 : 0.003));

          const useHandAuthored = !!LEVELS[idx].handAuthored;
          DOOR_X = useHandAuthored ? level0MainCorridor() : genMainCorridor();
          const corridorLight = bright ? 0xffffff : (crazy >= 2 ? 0xd9b8ff : crazy >= 1 ? 0xe8d0ff : 0xfff3d0);
          // A zero-intensity light still occupies a Three.js lighting slot. The dark
          // school needs only its three desk lamps and the player's flashlight.
          if (!useHandAuthored) {
            for (let lx = 1; lx <= DOOR_X - 2; lx += 5) { const l = new THREE.PointLight(corridorLight, bright ? 0.85 : 0.006, bright ? 9 : 1.2); l.position.set(lx, 2.4, 0); l.userData.schoolLamp=!bright; levelGroup.add(l); }
          }

          if (crazy > 0) addSchoolPosters(DOOR_X, crazy);

          AREAS = useHandAuthored ? level0Areas() : genLevelAreas(idx);
          AREAS.forEach(a => { a.walls.forEach(w => {if(bright && Math.abs(w[1])>8 && w[2]>2 && w[3]<.5)officeWindow(w[0],w[1],w[2]);else wallBox(w[0],w[1],w[2],w[3],a.mat);}); if (!useHandAuthored) a.lights.forEach(([lx, lz]) => { const l = new THREE.PointLight(0xfff3d0, 0.5, 8); l.position.set(lx, 2.2, lz); levelGroup.add(l); }); });

          AREAS.forEach(a=>dressArea(a,useHandAuthored));
          if(bright)encloseOffice();
          if(useHandAuthored){for(const a of AREAS){const lamp=new THREE.PointLight(0xc4b79b,.48,1.8,2);lamp.name="school-desk-pool";lamp.position.set(a.pagePos[0],1.45,a.pagePos[2]);lamp.userData.deskLamp=true;levelGroup.add(lamp);}}
          const pages = LEVELS[idx].pages;
          DESKS = AREAS.map((a, i) => {
            const d = buildFurniture(useHandAuthored ? "desk" : "cubicle", pages[i].deskLabel, pages[i].deskDate);
            d.position.set(a.pagePos[0], 0, a.pagePos[2]); d.rotation.y = a.deskYaw || 0; levelGroup.add(d);
            // ponytail: axis-aligned footprint, sized for desk+bench together rather than rotating the rectangle --
            // every deskYaw this round is a multiple of 90deg so this is exact; a non-90 yaw would need real rotation.
            collideRects.push({ x0: a.pagePos[0] - 0.35, x1: a.pagePos[0] + 0.35, z0: a.pagePos[2] - 0.45, z1: a.pagePos[2] + 0.45 });
            return d;
          });
          MAIN_ANCHORS = useHandAuthored
            ? [[2, 1], [2, -1], [6, 1], [6, -1], [10, 1], [10, -1], [14, 1], [14, -1], [18, 1], [18, -1], [22, 1], [22, -1], [24.5, 1], [24.5, -1]]
            : [[2, 1], [2, -1], [12, 1], [12, -1], [19, 1], [19, -1], [27, 1], [27, -1], [33, 1], [33, -1], [41, 1], [41, -1], [44.5, 1], [44.5, -1]];

          // ---- the trophy case: live level 1's own easter egg (the hand-authored school), so it only exists
          // there (useHandAuthored) -- public's office at idx 0 must NOT get it, only live's school does. A
          // shallow glass front set into the south corridor wall, plus two matte trophy shapes behind it. x=5,
          // well past the x=1 spawn point, so the reveal is something the player walks to and finds (Ian, review
          // 2026-08-31). Mounted at y=1.0, not adult wall height: a wall-height case at dog eye height needs a
          // look-up angle past both the FOV and the pitch clamp -- genuinely unreachable at any angle.
          if (useHandAuthored) {
            const TROPHY_X = 5;
            trophyGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), glassMat);
            trophyGlass.position.set(TROPHY_X, 1.0, -1.18); levelGroup.add(trophyGlass);
            [-0.35, 0.35].forEach(dx => {
              const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 10), trophyMat); base.position.set(TROPHY_X + dx, 0.55, -1.3); levelGroup.add(base);
              const cup = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 10), trophyMat); cup.position.set(TROPHY_X + dx, 0.74, -1.3); levelGroup.add(cup);
            });
            TROPHY_AT.set(TROPHY_X, 0, -1.0);
          }

          PAGE_POS = AREAS.map(a => new THREE.Vector3(a.pagePos[0], 0.60, a.pagePos[2]));   // on the desktop (0.58) plus 0.02, not floating
          AREA_DOOR_X = AREAS.map(a => a.anchors[0][0]);   // each area's own doorway x on this level's main corridor
          function wrapText(x, text, cx, cy, maxW, lh) {
            const words = text.split(" "); let line = "", y = cy;
            words.forEach(w => { const test = line + w + " "; if (x.measureText(test).width > maxW && line) { x.fillText(line, cx, y); line = w + " "; y += lh; } else line = test; });
            x.fillText(line, cx, y);
          }
          function pageSprite(headline, i) {
            const c = document.createElement("canvas"); c.width = 256; c.height = 160; const x = c.getContext("2d");
            x.fillStyle = ["#f0d67d","#eea0ba","#93d5be"][i]; x.fillRect(0, 0, 256, 160); x.strokeStyle = "#241a0e"; x.lineWidth = 4; x.strokeRect(4, 4, 248, 152);
            x.fillStyle = "#241a0e"; x.font = "bold 20px Georgia"; x.textAlign = "center"; wrapText(x, headline, 128, 55, 220, 24);
            const tex = LEVELS[idx].handAuthored ? new THREE.TextureLoader().load('assets/school-drawing-'+(i+1)+'.png') : new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
            const s = LEVELS[idx].handAuthored ? new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({map:tex,roughness:1,side:THREE.DoubleSide})) : new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));s.name=LEVELS[idx].handAuthored?"school-wall-drawing":"office-page"; s.scale.set(LEVELS[idx].handAuthored?.52:.42, LEVELS[idx].handAuthored?.70:.26, 1); return s;   // Round 2: page-sized on the desktop, not a hallway sign
          }
          pageObjs = PAGE_POS.map((pos, i) => {
            if (state.found[idx][i]) return null;
            const s = pageSprite(pages[i].title, i); s.position.copy(pos);if(useHandAuthored){s.position.set([16.53,4.87,30.83][i],1.05,pos.z);s.rotation.y=i===1?Math.PI/2:-Math.PI/2;PAGE_POS[i].copy(s.position);} levelGroup.add(s);
            let g = null;
            if (!useHandAuthored) { g = new THREE.PointLight(0xffd36e, 0.13, 1); g.position.copy(pos); levelGroup.add(g); }
            return { sprite: s, light: g, base: pos.y };
          });
        }
        // buildLevel(idx) closes here -- the monster/haunt machinery just below is shared, reusable game
        // mechanics (unchanged from the pre-0903 build), not per-level construction, so it stays OUTSIDE
        // buildLevel as sibling functions. buildLevelTail(idx), defined right after it, is buildLevel's actual
        // second half (a fresh monster, the door, the player back at spawn, the ambient loop) -- split out only
        // because it has to be defined after scheduleAmbient exists, and both are called together at every
        // call site (initial kickoff and every level transition, below).

        // ---- the monster: papier-mache, faceless, matte, tall and thin -- slides, never runs
        function buildMonster() {
          const g = new THREE.Group();
          const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.05, 8), suitMat); legs.position.set(0, 0.55, 0); g.add(legs);
          const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.75, 4, 8), suitMat); torso.position.set(0, 1.42, 0); g.add(torso);
          // head was 0.15 radius, same value/lit-behaviour as the torso it sat directly on -- it never read as
          // its own shape (round 2 honest report). Bigger, flattened for a bald crown, and nudged up so there is
          // real negative space above the collar before it starts, not a sphere grafted onto the capsule.
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), paperMat);
          head.position.set(0, 2.14, 0); head.scale.set(1, 0.94, 1); g.add(head);
          const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.7, 6), suitMat); armL.position.set(-0.18, 1.25, 0.05); armL.rotation.z = 0.15; g.add(armL);
          const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.7, 6), suitMat); armR.position.set(0.19, 1.15, 0.05); armR.rotation.z = -0.05; g.add(armR);
          const brief = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.06), caseMat); brief.position.set(0.22, 0.82, 0.08); g.add(brief);
          // his own light, travels with him: with lookAt(player) his local -Z always faces the camera, so a
          // light offset onto -Z and to one side keys his camera-facing surface directly instead of relying on
          // ceiling spill from above (root cause of the round-2 flat-black read). Not inside any sealed mesh --
          // sits clear in front of his torso/head, checked live at all three test distances.
          if (!LEVELS[state.level].handAuthored) {
            const monsterLight = new THREE.PointLight(0xcfe0ff, .65, 6, 2);
            monsterLight.position.set(0.6, 1.5, -2.2); g.add(monsterLight);
          }
          if(!LEVELS[state.level].handAuthored){
            const jacket=new THREE.MeshStandardMaterial({color:0x202c3e,roughness:.92});g.traverse(o=>{if(o.isMesh&&o.material===suitMat)o.material=jacket;});
            const shirt=new THREE.Mesh(new THREE.BoxGeometry(.18,.38,.03),new THREE.MeshStandardMaterial({color:0xece7dc}));shirt.position.set(0,1.63,-.14);g.add(shirt);
            const tie=new THREE.Mesh(new THREE.ConeGeometry(.045,.28,3),new THREE.MeshStandardMaterial({color:0x923b46}));tie.rotation.z=Math.PI;tie.position.set(0,1.56,-.17);g.add(tie);g.name='suited-office-boss';
          }else g.name='school-monster';
          g.visible = false; levelGroup.add(g); return g;
        }
        const ghost = { active: false, from: new THREE.Vector3(), to: new THREE.Vector3(), t0: 0, dur: 4000, seen: false };
        let hideTimer = null;   // found live while testing FIX 1: a page-pickup haunt starting within 500ms of
        // the PREVIOUS haunt's own end left that old haunt's hide callback pending, so it fired mid-way through
        // the new one and hid the monster early -- the centrepiece vanishing right when he's meant to land.
        function haunt(from, to, dur) {
          if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
          ghost.active = true; ghost.from.copy(from); ghost.to.copy(to); ghost.t0 = performance.now(); ghost.dur = dur;
          monster.visible = true; monster.position.copy(from);
          if (!ghost.seen) { ghost.seen = true; announce("Something is standing at the end of the hall."); }
        }
        // ---- ambient re-haunts: escalate per page found (locked canon: "each page found is more stressful
        // than the last") -- more frequent, closer, and quicker to relocate as n climbs. Still no pathfinding:
        // haunt() just slides him between two authored points, same as the page-pickup haunts already did.
        const monsterVec = new THREE.Vector3();
        let staticIntensity = 0, caught = false, ambientTimer = null;
        // 0901: the creep (the Slender loop) and the touch-range kill. creep tracks its own "watched" clock
        // (2s dead-on hides him, same as a normal haunt end); monsterVisibleAt/monsterWasVisible track how long
        // he's been continuously visible so a touch-range catch can never fire on the very frame he appears.
        const creep = { active: false, watchedMs: 0 };
        const CREEP_SPEED = 0.45;   // walk speed is 2.5 -- any player who moves gets away
        let monsterVisibleAt = 0, monsterWasVisible = false;
        // 0905: public mode's dialogue lines, picked and held for a few seconds at a time (see the frame loop).
        const DEADLINE_LINES = [
          "The Q3 numbers are due Thursday. Nobody has started them.",
          "Did you get the memo about Friday? There wasn't one. There will be.",
          "He needs that email forwarded. He will not say to who.",
          "The deadline moved up again. It always moves up.",
          "Someone has to own this by end of day. It is being decided who.",
          "The meeting about the meeting starts in five minutes."
        ];
        let talkLine = "", talkPickedAt = 0;
        // Capture is guarded once for both monster contact and static overload.
        function doCapture() {
          if (caught || transitioning) return;
          caught = true;
          burstEl.classList.remove('go'); void burstEl.offsetWidth; burstEl.classList.add('go');
          monster.visible = false; ghost.active = false; creep.active = false;
          if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
          liveVal = 0; staticIntensity = 0; paintMeter();
          if (MODE === 'public' && losePaperHeart(state)) {
            save(); paintHearts(); stopInput();
            const exhausted = state.lives === 0;
            const death = document.createElement('section'); death.className = 'school-death';
            death.setAttribute('role', 'dialog'); death.setAttribute('aria-modal', 'true');
            death.setAttribute('aria-label', exhausted ? 'No paper hearts left' : 'He found you');
            death.innerHTML = '<h2>' + (exhausted ? 'YOUR LAST HEART TORE.' : 'HE FOUND YOU.') + '</h2><p>' +
              (exhausted ? 'The dream is over. Start another with three fresh paper hearts. Your office pages are still saved.' :
              'One paper heart tore. ' + state.lives + ' remain. Return to the office and enter the break room again. Your pages are still saved.') +
              '</p><button type="button">' + (exhausted ? 'Restart dream — return to office' : 'Return to the office') + '</button>';
            viewport.append(death); cc.dataset.caught = 'true';
            ctx.on(death, 'pointerdown', e => e.stopPropagation());
            ctx.on(death, 'keydown', e => e.stopPropagation());
            ctx.on(death.querySelector('button'), 'click', () => {
              if (exhausted) restartDream(state);
              death.remove(); delete cc.dataset.caught; returnToOffice();
              announce('Back in the office. Your office pages are saved. Enter the break room to try again.');
            });
            announce(death.textContent); death.querySelector('button').focus();
          } else {
            announce('Caught. Pages already found are still found.');
            ctx.timeout(() => { player.x = 1; player.z = 0; player.yaw = -Math.PI / 2; player.pitch = 0;
              caught = false; monster.visible = false; monsterWasVisible = false; }, 700);
          }
        }
        function scheduleAmbient() {
          const n = state.found[state.level].filter(Boolean).length;
          // 0905: "every hallway needs to get crazier" also means the monster gets bolder, deeper in -- shorter
          // waits and quicker haunts as `crazy` climbs (live only; crazy is 0 for public and live's own level 0).
          const crazyLvl = LEVELS[state.level].crazy || 0;
          const wait = Math.max(1800, (8500 - n * 2000) - crazyLvl * 1800) + rnd() * 2500;
          ambientTimer = ctx.timeout(() => {
            if (hunting() && !transitioning && state.dreamPhase !== "done" && !ghost.active && !creep.active && !caught) {
              // Haunt anchors, authored per area (corridor centrelines, never inside a wall) -- replaces the
              // single-corridor aheadX/side math, which assumed one straight hallway and would place him inside
              // a branch's own wall (or off in empty space) now that the school has branches (0901 expansion).
              const area = areaAt(player.x, player.z);
              const pool = area ? area.anchors : MAIN_ANCHORS;
              const far = pool.filter(a => Math.hypot(a[0] - player.x, a[1] - player.z) > 3);
              const near = pool.filter(a => Math.hypot(a[0] - player.x, a[1] - player.z) > 1.6);   // keeps the "to" point clear of touch range on frame one
              const fromPool = far.length ? far : pool, toPool = near.length ? near : pool;
              const from = fromPool[Math.floor(rnd() * fromPool.length)], to = toPool[Math.floor(rnd() * toPool.length)];
              haunt(new THREE.Vector3(from[0], 0, from[1]), new THREE.Vector3(to[0], 0, to[1]), Math.max(1600, 4600 - n * 500 - crazyLvl * 900));
            }
            scheduleAmbient();
          }, wait);
        }

        // buildLevel's second half: a fresh monster, this level's own end door (named for its own next level,
        // or a dead end on the third), the player back at spawn, an opening haunt tease scaled to this level's
        // own corridor length, and the ambient loop started. Split from buildLevel itself (closed in the
        // previous part) only because it must come after scheduleAmbient is defined; every call site below
        // calls buildLevel(idx) immediately followed by buildLevelTail(idx).
        function buildLevelTail(idx) {
          monster = buildMonster();
          doorMesh = wallBox(DOOR_X, 0, 0.3, 2.6, new THREE.MeshStandardMaterial({ map: signTexture("LOCKED", LEVELS[idx].doorLabel || "END OF THE LINE"), roughness: 0.7, metalness: 0.15 }));
          doorRectIdx = collideRects.length - 1;
          doorSeen = false;
          if (MODE === 'public' && idx === 1) {
            const end = DOOR_X + 6;
            wallBox(DOOR_X + 3, -1.35, 6, .3);
            wallBox(DOOR_X + 3, 1.35, 6, .3);
            wallBox(end, 0, .3, 3);
            const desk = buildDesk('THE FINAL PAGES', 'WAKE UP');
            desk.position.set(end - 1, 0, 0); levelGroup.add(desk);
            collideRects.push({x0:end-1.45,x1:end-.55,z0:-.34,z1:.34});
            finalPages = new THREE.Group(); finalPages.name = 'school-final-pages';
            for (let i = 0; i < 3; i++) {
              const page = new THREE.Mesh(new THREE.PlaneGeometry(.5, .38), new THREE.MeshStandardMaterial({map:signTexture('WAKE UP', 'MOM IS WAITING'), side:THREE.DoubleSide, roughness:1,emissive:0xefdcb0,emissiveIntensity:.3}));
              page.rotation.set(-.12,-Math.PI / 2,(i - 1) * .12);
              page.position.set((i - 1) * .025, .91 + i * .025, (i - 1) * .05); finalPages.add(page);
            }
            finalPages.position.set(end - 1.3, 0, 0); levelGroup.add(finalPages);
            const light = new THREE.PointLight(0xffdfa2, .8, 4, 2);
            light.position.set(end - 1.6, 1.7, 0); levelGroup.add(light);
          }
          player.x = 1.0; player.z = 0; player.yaw = -Math.PI / 2; player.pitch = 0;
          (function () { const dx = DOOR_X, builtLevel = levelGroup; ctx.timeout(() => {
            if (builtLevel === levelGroup && !transitioning && !caught && state.dreamPhase !== 'done') haunt(new THREE.Vector3(dx - 2, 0, 0), new THREE.Vector3(dx - 8, 0, 0), 6000);
          }, 3200); })();
          scheduleAmbient();
          collectingLevel = false;
        }

        // ---- player: low, at dog height
        const EYE_H = 0.38, R = 0.28, SPEED = 2.5;
        const player = { x: 1.0, z: 0, yaw: -Math.PI / 2, pitch: 0 };

        // ---- Round 2, section 2: the reading beat. Approach a desk, the page comes off it, the camera rises
        // to standing-on-hind-legs height while two paws come into frame -- then the book opens to the page just
        // found. deskRead is the one state machine for it; data-reading (set on the <article>) is what the kill
        // paths below check to suspend while the dog's back is to the hall. Yaw locks toward the desk itself
        // (PAGE_POS[i], which now sits on the desktop) rather than a separate authored point.
        const RISE_MS = REDUCED ? 150 : 700, STAND_MS = 400;
        const deskRead = { phase: "idle", t0: 0, i: -1, baseYaw: 0, faceYaw: 0 };
        const pawsEl = byId("ccPaws");
        pawsEl.style.setProperty("--pawdur", REDUCED ? "0ms" : "400ms");
        function startDeskRead(i) {
          deskRead.phase = "rising"; deskRead.t0 = performance.now(); deskRead.i = i;
          deskRead.baseYaw = player.yaw;
          deskRead.faceYaw = Math.atan2(player.x - PAGE_POS[i].x, player.z - PAGE_POS[i].z);
          cc.setAttribute("data-reading", "1");
        }
        function finishRise() { deskRead.phase = "held"; pawsEl.classList.add("up"); collect(deskRead.i); showBook(); goTo(deskRead.i + 1); }
        function standDown() {
          if (deskRead.phase !== "held") return false;
          deskRead.phase = "standing"; deskRead.t0 = performance.now();
          pawsEl.classList.remove("up"); showHunt();
          const i = deskRead.i, doorZ = i === 1 ? -1.35 : 1.35;   // the pickup haunt, now fired here instead of on pickup
          haunt(new THREE.Vector3(AREA_DOOR_X[i], 0, doorZ), new THREE.Vector3(player.x, 0, player.z), 4300 + i * 1300);
          return true;
        }
        function finishStandDown() { deskRead.phase = "idle"; cc.removeAttribute("data-reading"); }
        deskStandDownHook = standDown;
        // read-only probe hook (BRIEF-0903b): confirms the desks exist and lets a harness script teleport the
        // player next to one to exercise the rise. Getters, not a snapshot -- DESKS and state.level now change
        // on every level transition. Never written to by game code; changes no behaviour. Removed in unmount():
        // it closes over THIS mount's player and level state, and left behind it would answer questions about,
        // and let a driver move, a school that is no longer in the document.
        window.__corgi = { player, deskRead, get desks() { return DESKS.length; }, get level() { return state.level; }, get doorLabel() { return LEVELS[state.level].doorLabel; }, get transition(){return roomCut?.stage||null;}, get battery(){return battery;}, get lives(){return state.lives;}, get dreamPhase(){return state.dreamPhase;}, get doorX(){return DOOR_X;}, get doorOpen(){return doorOpen;}, get pages(){return PAGE_POS.map(p=>({x:p.x,z:p.z}));}, get finalPages(){return finalPages?.position.clone()||null;}, get monster(){return monster;}, get camera(){return roomCut?.camera||camera;} };
        // 0901 corner-trap fix. Root cause, found live by logging position + blocked() every frame while
        // scripting a diagonal hold into three different corners: the old test expanded each wall's AABB by R
        // on both axes independently, and the per-axis slide below tests each axis's candidate against the
        // OTHER axis's frame-START value, never the proposed pair together (chaining them was tried in round 2
        // and rejected -- it froze both axes solid the same way, just sooner). Diagonal movement can walk the
        // player up to within fractions of a unit of TWO perpendicular walls at once, at which point every
        // further diagonal step re-asks the same two already-blocked single-axis questions: a rejected axis
        // never updates, so the next frame tests the identical stuck position again, forever, for as long as
        // the player keeps holding into the corner.
        // blocked() is now a real circle-vs-rectangle test (clamp the query point onto the wall's own box,
        // compare distance to R) instead of a point-in-expanded-AABB test -- geometrically correct for the
        // player's actual collision radius, and it rounds the corner dead zone instead of squaring it.
        // depenetrate() is the actual escape guarantee: after the per-axis slide, if the player is still
        // overlapping any wall's padded circle, push straight out along whichever single axis needs the least
        // correction. Runs every frame regardless of input, so the very next move in ANY direction away from
        // the wall is free -- "escaped by a single opposing input," proven live in the harness (see README).
        function nearestOnRect(x, z, w) { return { x: Math.max(w.x0, Math.min(x, w.x1)), z: Math.max(w.z0, Math.min(z, w.z1)) }; }
        function blocked(x, z) { if(MODE==="public"&&state.level===0&&(x<OFFICE_BOX.x0+R||x>OFFICE_BOX.x1-R||z<OFFICE_BOX.z0+R||z>OFFICE_BOX.z1-R))return true;for (const w of collideRects) { const p = nearestOnRect(x, z, w); const dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz < R * R) return true; } return false; }
        function depenetrate(x, z) {
          let px = x, pz = z;
          for (const w of collideRects) {
            const p = nearestOnRect(px, pz, w); const dx = px - p.x, dz = pz - p.z; const d = Math.hypot(dx, dz);
            if (d >= R) continue;
            if (d > 1e-4) { const push = (R - d) + 0.002; px += (dx / d) * push; pz += (dz / d) * push; }
            else px = w.x1 + R + 0.002;   // dead-on top of a wall face: pick a side, any side, and go
          }
          if(MODE==="public"&&state.level===0){px=Math.max(OFFICE_BOX.x0+R,Math.min(OFFICE_BOX.x1-R,px));pz=Math.max(OFFICE_BOX.z0+R,Math.min(OFFICE_BOX.z1-R,pz));}
          return { x: px, z: pz };
        }

        // ---- flashlight: drains while on, recharges while off, never a consumable
        const flash = new THREE.SpotLight(0xfff3d0, 0, 8, Math.PI / 6.5, 0.45, 1.4);
        camera.add(flash); camera.add(flash.target); flash.target.position.set(0, 0, -1);
        let battery = 100, flashOn = false;
        function setFlash(on) { flashOn = !!(on && LEVELS[state.level].handAuthored && battery > 3); flash.intensity = flashOn ? 2.6 : 0; flashBtn.setAttribute("aria-pressed", String(flashOn)); }
        ctx.on(flashBtn, "click", () => setFlash(!flashOn));

        // ---- sprint: hold Shift (desktop) or the SPRINT button (mobile), drains/recharges a stamina pool,
        // never a hard block on movement -- just slower once it's spent
        const sprintBtn = byId("ccSprintBtn"), stamFill = byId("ccStamFill");
        let stamina = 100, sprintHeld = false;
        ctx.on(sprintBtn, "pointerdown", () => { sprintHeld = true; sprintBtn.setAttribute("aria-pressed", "true"); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(ev => ctx.on(sprintBtn, ev, () => { sprintHeld = false; sprintBtn.setAttribute("aria-pressed", "false"); }));

        // ---- look-drag: raw client deltas need no rect correction (a delta, not an absolute position)
        let dragging = false, lastX = 0, lastY = 0;
        function lookStart(x, y) { dragging = true; lastX = x; lastY = y; }
        function lookMove(x, y) {
          if (!dragging) return;
          player.yaw -= (x - lastX) * 0.0055; player.pitch = Math.max(-0.6, Math.min(0.6, player.pitch - (y - lastY) * 0.0045));
          lastX = x; lastY = y;
        }
        ctx.on(viewport, "pointerdown", e => { if (caught || transitioning || e.target === joy || joy.contains(e.target) || e.target === flashBtn || e.target === readBtn) return; lookStart(e.clientX, e.clientY); try { viewport.setPointerCapture(e.pointerId); } catch {} });
        ctx.on(viewport, "pointermove", e => lookMove(e.clientX, e.clientY));
        ["pointerup", "pointercancel", "pointerleave"].forEach(ev => ctx.on(viewport, ev, () => dragging = false));

        // ---- 0905 (G2): "get rid of the drag feature ... it just needs to be based off of where the mouse is."
        // This was a held/moved joystick that zeroed on release; it's tap-to-set now -- a tap or drag inside the
        // ring sets a heading that PERSISTS after release, so the dog keeps walking without the pointer held
        // down. Tapping the small dead zone at dead-centre stops him. Still its own getBoundingClientRect() plus
        // the event only (see the file's own note on the retired .channel zoom -- never clientWidth/offsetX).
        // A concrete tap mechanic, not just a relabelled drag: touch has no hover, so a full-viewport
        // mouse-position control would leave 390px with nothing to move it at all (Codex C4).
        let joyVec = { x: 0, y: 0 }, joyId = null;
        ctx.on(joy, "pointerdown", e => { joyId = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch {} updateJoy(e); e.stopPropagation(); });
        ctx.on(joy, "pointermove", e => { if (e.pointerId === joyId) { updateJoy(e); e.stopPropagation(); } });
        ["pointerup", "pointercancel"].forEach(ev => ctx.on(joy, ev, e => { if (e.pointerId === joyId) joyId = null; }));
        function updateJoy(e) {
          const r = joy.getBoundingClientRect();
          let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          const max = r.width / 2; const len = Math.hypot(dx, dy) || 1;
          if (len < max * 0.22) { joyVec = { x: 0, y: 0 }; joyNub.style.transform = ""; return; }   // centre tap: stop
          if (len > max) { dx = dx / len * max; dy = dy / len * max; }
          joyNub.style.transform = `translate(${dx}px, ${dy}px)`;
          joyVec = { x: dx / max, y: dy / max };
        }

        // ---- keyboard: WASD / arrows to move, F to flash, R to read the paper.
        // THESE TWO ARE BOUND TO WINDOW, which outlives every channel: a keydown left bound after a channel
        // change is a dead school reading the next channel's W key. ctx.on is what stops that.
        const keys = {};
        ctx.on(window, "keydown", e => { if (!hunting() || caught) return;
          if (roomCut) { if (e.key.toLowerCase() === 'f' && roomCut.stage === 'wake') leaveCut(); return; }
          keys[e.key.toLowerCase()] = true;
          if (e.key.toLowerCase() === "f") {if(roomCut?.stage==='wake')leaveCut();else setFlash(!flashOn);} if (e.key.toLowerCase() === "r") showBook(); });
        ctx.on(window, "keyup", e => keys[e.key.toLowerCase()] = false);

        function resize() {
          const w = viewport.clientWidth || 320, h = viewport.clientHeight || 320;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileRender ? 1 : 2));
          renderer.setSize(w, h, false);
          camera.aspect = w / h; camera.updateProjectionMatrix();
          heartVisual?.resize();
        }
        ctx.observe(new ResizeObserver(resize), viewport); resize();

        // One break-room set and one camera path, played forwards on entry and backwards on escape.
        let roomCut = null, breakRoomSet = null;
        const cut = document.createElement('section'); cut.id = 'ccTransition'; cut.hidden = true;
        cut.style.cssText = 'position:absolute;inset:0;z-index:100;display:none;place-content:center;text-align:center;color:#f3e4c7;padding:25px;font:18px Georgia';
        cut.setAttribute('role', 'dialog'); cut.setAttribute('aria-label', 'Break room');
        cut.innerHTML = '<h2></h2><p aria-live="polite"></p><button type="button" hidden>TURN ON THE FLASHLIGHT</button>';
        viewport.append(cut);
        const cutTitle = cut.querySelector('h2'), cutText = cut.querySelector('p'), cutButton = cut.querySelector('button');
        ctx.on(cut, 'pointerdown', e => e.stopPropagation());
        ctx.on(cut, 'keydown', e => { if (e.key.toLowerCase() === 'f' && roomCut?.stage === 'wake') leaveCut(); e.stopPropagation(); });

        function stopInput() {
          for (const key of Object.keys(keys)) delete keys[key];
          joyVec = {x:0, y:0}; joyNub.style.transform = ''; dragging = false; sprintHeld = false;
          sprintBtn.setAttribute('aria-pressed', 'false');
        }
        function leaveCut() {
          const schoolWake = roomCut?.stage === 'wake';
          roomCut = null; transitioning = false; delete cc.dataset.transition;
          cut.hidden = true; cut.style.display = 'none'; stopInput(); setFlash(schoolWake);
          announce(schoolWake ? 'You woke up in the school. Find the three scary pictures, then go through the back door.' : 'Back in the office. The dream is over.');
        }
        function returnToOffice() {
          state.level = 0; save();
          bankedVal = 4; liveVal = 0; paintMeter();
          buildLevel(0); buildLevelTail(0);
          player.x = DOOR_X - 2.3;
          camera.position.set(player.x, EYE_H, player.z); camera.rotation.set(0, player.yaw, 0, 'YXZ');
          deskRead.phase = 'idle'; cc.removeAttribute('data-reading'); pawsEl.classList.remove('up');
          stopInput(); stamina = 100; setFlash(false);
          repaintAll(); paintLeaf4(); goTo(0); showHunt(); paintHearts();
          byId('ccTally').textContent = 'PAGES ' + state.found[0].filter(Boolean).length + '/3';
          promptEl.classList.remove('show');
        }
        function getBreakRoomSet() {
          if (breakRoomSet) return breakRoomSet;
          const rs = new THREE.Scene(); rs.background = new THREE.Color(0x777b72);
          const rc = new THREE.PerspectiveCamera(68, viewport.clientWidth / viewport.clientHeight, .05, 40);
          rs.add(new THREE.HemisphereLight(0xf2e7c8, 0x554b47, 2));
          const box = (x,y,z,w,h,d,color) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color,roughness:.85}));
            m.position.set(x,y,z); rs.add(m); return m;
          };
          box(0,-.12,-2,7,.2,12,0x76716a); box(0,2,-6,7,4,.2,0xa8ada0);
          box(-3.5,2,-2,.2,4,8,0x939b91); box(3.5,2,-2,.2,4,8,0x939b91);
          box(0,.65,-3,2.6,.12,1.25,0x795e3c);
          for (const x of [-1.1,1.1]) for (const z of [-3.5,-2.5]) box(x,.3,z,.09,.6,.09,0x474941);
          box(-2.4,.7,-4.9,1.4,1.4,.75,0xd3c9b5); box(-2.4,1.6,-4.9,.48,.5,.45,0x2e3434);
          box(-2.4,1.8,-4.65,.18,.16,.08,0x965f3c);
          box(2.4,.55,-4.6,1.5,1.1,1,0x665866); box(2.4,1.05,-5,1.5,.9,.25,0x665866);
          for (const x of [-.5,.5]) {
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(.13,.1,.2,12), new THREE.MeshStandardMaterial({color:0xe5d4b9}));
            cup.position.set(x,.81,-3); rs.add(cup);
          }
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.1,.8), new THREE.MeshBasicMaterial({map:signTexture('BREAK ROOM','REST YOUR EYES.')}));
          sign.position.set(0,2.3,-5.85); rs.add(sign);
          gl.extra.push({dispose(){rs.traverse(o => {o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}});
          breakRoomSet = {scene:rs,camera:rc}; return breakRoomSet;
        }
        function openCut(stage) {
          transitioning = true; cc.dataset.transition = 'true'; setFlash(false); stopInput();
          monster.visible = false; ghost.active = false; creep.active = false;
          cut.hidden = false; cut.style.display = 'grid'; cut.style.background = 'transparent'; cutButton.hidden = true;
          promptEl.classList.remove('show');
          roomCut = {stage,start:performance.now(),...getBreakRoomSet()};
        }
        function enterBreakRoom() {
          openCut(state.lives === 0 ? 'retry' : 'enter');
          cutTitle.textContent = state.lives === 0 ? 'NO PAPER HEARTS LEFT.' : 'BREAK TIME.';
          cutText.textContent = state.lives === 0 ? 'Your office pages are saved. Begin another dream with three fresh paper hearts.' : 'Just a minute. You have earned it.';
          if (state.lives === 0) { cutButton.textContent = 'START A NEW DREAM'; cutButton.hidden = false; cutButton.focus(); }
        }
        function startDreamEnding() {
          state.dreamPhase = 'ending'; save();
          bankedVal = 4; liveVal = 0; paintMeter();
          openCut('dream-wake');
          cutTitle.textContent = 'THE BREAK ROOM.'; cutText.textContent = 'The pages slip from your paws. You open your eyes.';
          announce(cutText.textContent);
        }
        ctx.on(cutButton, 'click', () => {
          if (roomCut?.stage === 'dream-message') {
            roomCut.stage = 'dream-leave'; roomCut.start = performance.now(); cutButton.hidden = true;
            cutTitle.textContent = ''; cutText.textContent = 'Time to go back to the office.';
          } else if (roomCut?.stage === 'retry') { restartDream(state); save(); paintHearts(); enterBreakRoom(); }
          else leaveCut();
        });
        function renderBreakRoom(q, seconds) {
          const pose = breakRoomPose(seconds, REDUCED);
          q.camera.position.set(0,pose.y,pose.z); q.camera.rotation.set(pose.pitch,0,pose.roll);
          q.camera.aspect = viewport.clientWidth / viewport.clientHeight; q.camera.updateProjectionMatrix();
          renderer.render(q.scene,q.camera); return pose;
        }
        function tickBreakRoom(now) {
          if (!roomCut) return false;
          const q = roomCut, t = (now - q.start) / 1000;
          if (q.stage === 'enter') {
            const pose = renderBreakRoom(q,t);
            cut.style.background = 'rgba(0,0,0,' + pose.darkness + ')';
            if (t > 2.5) { cutTitle.textContent = ''; cutText.textContent = 'Your eyes are so heavy.'; }
            if (t > 4.1) {
              q.stage = 'loading'; cut.style.background = '#000'; cutTitle.textContent = ''; cutText.textContent = '';
              ctx.timeout(() => {
                if (!gl || session !== mine) return;
                try {
                  advanceLevel(); buildLevel(state.level); buildLevelTail(state.level); transitioning = true;
                  paintMeter();
                  repaintAll(); paintLeaf4(); goTo(0); showHunt(); deskRead.phase = 'idle'; cc.removeAttribute('data-reading');
                  byId('ccTally').textContent = 'PICTURES ' + state.found[state.level].filter(Boolean).length + '/3';
                  camera.position.set(player.x,EYE_H,player.z); camera.rotation.set(0,player.yaw,0,'YXZ');
                  q.stage = 'wake'; q.start = performance.now();
                } catch (error) { console.error('School transition failed',error); cutTitle.textContent = 'The school could not load.'; cutText.textContent = 'Reload to wake up here. Your pages are saved.'; }
              },120);
            }
          } else if (q.stage === 'wake') {
            renderer.render(scene,camera); cut.style.background = 'rgba(0,0,0,' + (1-Math.min(.3,t*.18)) + ')';
            cutTitle.textContent = 'THIS IS NOT THE BREAK ROOM.';
            cutText.textContent = 'Find the three scary pictures, then the pages beyond the school back door. You have ' + state.lives + ' paper hearts. Your flashlight recharges while off.';
            cutButton.textContent = 'TURN ON THE FLASHLIGHT';
            if (cutButton.hidden) { cutButton.hidden = false; cutButton.focus(); }
          } else if (q.stage === 'dream-wake') {
            const progress = Math.min(1,t / (REDUCED ? .3 : 1.5));
            const pose = renderBreakRoom(q,4.1-progress*1.5);
            cut.style.background = 'rgba(0,0,0,' + pose.darkness + ')';
            if (progress === 1) {
              q.stage = 'dream-message';
              cutTitle.textContent = 'OH THANK MOM, IT WAS JUST A DREAM.';
              cutText.textContent = 'The school is gone. You are safe in the break room.';
              cutButton.textContent = 'LEAVE THE BREAK ROOM'; cutButton.hidden = false; cutButton.focus();
              announce('Oh thank Mom, it was just a dream.');
            }
          } else if (q.stage === 'dream-message') {
            renderBreakRoom(q,2.6); cut.style.background = 'rgba(0,0,0,.28)';
          } else if (q.stage === 'dream-leave') {
            const progress = Math.min(1,t / (REDUCED ? .3 : 2.6));
            renderBreakRoom(q,2.6*(1-progress)); cut.style.background = 'rgba(0,0,0,.12)';
            if (progress === 1) {
              state.dreamPhase = 'done'; returnToOffice(); transitioning = true;
              q.stage = 'done'; cutTitle.textContent = 'BREAK TIME IS OVER.';
              cutText.textContent = 'You made it out. The pages are safe. Your file is unlocked.';
              cutButton.textContent = 'BACK TO THE OFFICE'; cutButton.hidden = false; cutButton.focus();
              markLevelComplete(LEVELS.length - 1);
            }
          } else if (q.stage === 'done') { renderer.render(scene,camera); }
          else if (q.stage === 'retry') { renderBreakRoom(q,0); cut.style.background = 'rgba(0,0,0,.5)'; }
          return true;
        }

        // ---- timecode
        let secs = 0; ctx.interval(() => { if (hunting()) { secs++; const m = String(Math.floor(secs / 60)).padStart(2, "0"), s = String(secs % 60).padStart(2, "0"); tcEl.textContent = `${m}:${s}`; } }, 1000);

        let doorSeen = false;
        let last = performance.now();
        function frame(now) {
          // unmounted: stop before touching the scene. ctx cancels the pending frame as well, so this guard
          // is the belt to that braces - what it actually prevents is a frame already in flight when
          // unmount() ran from rendering into a disposed renderer.
          if (!gl || session !== mine) return;
          const dt = Math.min(50, now - last) / 1000; last = now;
          heartVisual?.render(now, state.lives, heartCortisol);
          if(tickBreakRoom(now)){ctx.frame(frame);return;}
          levelGroup.children.forEach(l=>{if(l.userData.deskLamp)l.intensity=REDUCED?.3:((now*.001+l.position.x)%5.3<.25?.015:.48);});
          if(!REDUCED) levelGroup.children.forEach(l=>{if(l.userData.schoolLamp)l.intensity=((now*.001+l.position.x*.17)%4.7<.22)?0:.006;});

          // C035: the hall is not up, so the hall does not run. Everything below this line IS the world --
          // movement, stamina, the camera, the flashlight battery, page pickups, the door, the monster's
          // slide and creep, the static and the two kill paths -- and none of it belongs to a visitor who is
          // reading the newspaper or standing at the desk terminal. `last` is advanced above, so the frame
          // that resumes gets an ordinary dt instead of the whole pause. The two ABSOLUTE stamps below have
          // to be carried across it by hand: ghost.t0 is a start time compared against `now`, so a haunt in
          // flight when the book went up would snap straight to its endpoint the moment it came down, and
          // monsterVisibleAt is the 600ms no-spawn-kill grace, which reading the paper must not burn through.
          // This is the same freeze the watched-dead-on branch below already performs on ghost.t0.
          if (!hunting() || caught) {
            if (ghost.active) ghost.t0 += dt * 1000;
            if (monster.visible) monsterVisibleAt += dt * 1000;
            ctx.frame(frame);
            return;
          }

          // movement
          let mx = 0, mz = 0;
          if (keys.w || keys.arrowup) mz -= 1; if (keys.s || keys.arrowdown) mz += 1;
          if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1;
          mx += joyVec.x; mz += joyVec.y;
          const mlen = Math.hypot(mx, mz);
          const wantSprint = (keys.shift || sprintHeld) && stamina > 2 && mlen > 0.05;
          if (wantSprint) stamina = Math.max(0, stamina - dt * 26); else stamina = Math.min(100, stamina + dt * 15);
          stamFill.style.setProperty("--stam", stamina.toFixed(0));
          if (mlen > 0.05 && deskRead.phase === "idle") {   // Round 2: movement ignored while rising, held or standing down
            mx /= Math.max(mlen, 1); mz /= Math.max(mlen, 1);
            const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
            const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
            const curSpeed = SPEED * (wantSprint ? 1.7 : 1);
            const dx = (fx * -mz + rx * mx) * curSpeed * dt, dz = (fz * -mz + rz * mx) * curSpeed * dt;
            // both axes tested against the frame-START position, never chained -- chaining (testing z against
            // the just-updated x) let a room's back corner freeze both axes solid while diagonal was held, since
            // a rejected move never updates position, so the next frame re-asked the identical stuck question
            // (found live 2026-08-31, round 2; workaround was avoiding diagonal input entirely). Independent
            // tests always admit whichever single axis is actually open, which is what makes a wall a slide.
            const x0 = player.x, z0 = player.z;
            const nx = x0 + dx; if (!blocked(nx, z0)) player.x = nx;
            const nz = z0 + dz; if (!blocked(x0, nz)) player.z = nz;
          }
          if (blocked(player.x, player.z)) { const r = depenetrate(player.x, player.z); player.x = r.x; player.z = r.z; }

          let camY = EYE_H + (mlen > 0.05 && !REDUCED ? Math.abs(Math.sin(now / 130)) * 0.02 : 0), camPitch = player.pitch, camYaw = player.yaw;
          if (deskRead.phase === "rising" || deskRead.phase === "standing") {
            const rising = deskRead.phase === "rising", dur = rising ? RISE_MS : STAND_MS;
            const p = Math.min(1, (now - deskRead.t0) / dur), e = 1 - Math.pow(1 - p, 3);
            const y0 = rising ? EYE_H : 0.95, y1 = rising ? 0.95 : EYE_H;
            const pitch0 = rising ? 0 : 0.44, pitch1 = rising ? 0.44 : 0;
            const yaw0 = rising ? deskRead.baseYaw : deskRead.faceYaw, yaw1 = rising ? deskRead.faceYaw : deskRead.baseYaw;
            camY = y0 + (y1 - y0) * e; camPitch = pitch0 + (pitch1 - pitch0) * e; camYaw = yaw0 + (yaw1 - yaw0) * e;
            if (p >= 1) { if (rising) finishRise(); else finishStandDown(); }
          } else if (deskRead.phase === "held") { camY = 0.95; camPitch = 0.44; camYaw = deskRead.faceYaw; }
          camera.position.set(player.x, camY, player.z);
          camera.rotation.set(camPitch, camYaw, 0, "YXZ");
          const lookFx = -Math.sin(player.yaw), lookFz = -Math.cos(player.yaw);   // forward, needed even when not moving (the reflection's facing check below)

          // flashlight battery
          if (flashOn) { battery = Math.max(0, battery - dt * .55); if (battery <= 0) setFlash(false); }
          else battery = Math.min(100, battery + dt * 3.5);
          batFill.style.setProperty("--bat", battery.toFixed(0));

          // page pickups: an interact prompt shows once near and looking at one, before the tighter pickup
          // radius actually triggers -- so there's always a visible "found it" beat before the grab, not just
          // an instant silent counter tick. Pickup itself stays proximity-based (a walked-to pickup, not a
          // button press) but now fires a brief zoom/flash jolt, the classic paper-grab beat.
          let anyPrompt = false;
          pageObjs.forEach((po, i) => {
            if (!po) return;
            if(!LEVELS[state.level].handAuthored)po.sprite.position.y = po.base + Math.sin(now / 500 + i) * 0.015;   // stirring on the desk, not levitating
            const ddx = po.sprite.position.x - player.x, ddz = po.sprite.position.z - player.z;
            const d = Math.hypot(ddx, ddz);
            const facing = d > 0.05 && (lookFx * ddx / d + lookFz * ddz / d) > 0.3;
            if (d < 0.9 && deskRead.phase === "idle") {
              po.sprite.removeFromParent(); po.light?.removeFromParent(); pageObjs[i] = null;
              viewport.classList.remove("cc-jolt"); void viewport.offsetWidth; viewport.classList.add("cc-jolt");
              startDeskRead(i);   // Round 2: the rise begins here; collect() and the haunt fire later (finishRise/standDown)
            } else if (d < 1.7 && facing) {
              anyPrompt = true;
              promptEl.textContent = "A PAGE. STAND UP.";
              promptEl.classList.add("show");
            }
          });

          // trophy case reflection: pinned to the glass's own projected screen position every frame, like the
          // page sprites, so it sits ON the case rather than parked in a screen corner. Shows only when near it
          // AND actually looking toward it AND it's in the camera's frustum -- a found reveal, not a HUD panel.
          if (trophyGlass) {
            const dTrophy = Math.hypot(player.x - TROPHY_AT.x, player.z - TROPHY_AT.z);
            const tdx = TROPHY_AT.x - player.x, tdz = TROPHY_AT.z - player.z, tlen = Math.hypot(tdx, tdz) || 1;
            const facing = (lookFx * tdx / tlen + lookFz * tdz / tlen) > 0.45;
            trophyGlass.getWorldPosition(reflVec); reflVec.project(camera);
            const inFrustum = reflVec.z < 1 && Math.abs(reflVec.x) < 0.96 && Math.abs(reflVec.y) < 0.96;
            const show = dTrophy < 1.9 && facing && inFrustum;
            reflectEl.classList.toggle("show", show);
            if (show) {
              const vw = viewport.clientWidth, vh = viewport.clientHeight;
              reflectEl.style.left = ((reflVec.x * 0.5 + 0.5) * vw).toFixed(0) + "px";
              reflectEl.style.top = ((-reflVec.y * 0.5 + 0.5) * vh).toFixed(0) + "px";
            }
          } else reflectEl.classList.remove("show");

          // locked door / level transition (3.6): three pages open THIS level's own next door; walking past it
          // once open rebuilds the scene for the next level. The third level's door never opens -- doorLabel is
          // null, there is nothing after it.
          if (!doorSeen && player.x > DOOR_X - 1.7) {
            doorSeen = true;
            announce(MODE === 'public' && state.dreamPhase === 'done' ? 'Break time is over. You made it out of the dream.' : LEVELS[state.level].doorLabel ? (state.found[state.level].every(Boolean) ? `The door to ${LEVELS[state.level].doorLabel} is open. Go on.` : `The hallway ends here. ${LEVELS[state.level].doorLabel}. Locked. Find the three pages first.`) : "The hallway ends here. Nothing past it. This is as far as the building goes.");
          }
          if (LEVELS[state.level].doorLabel && !doorOpen && state.found[state.level].every(Boolean) && (MODE !== "public" || (state.dreamPhase === "hunt" && (state.level === 0 || canOpenBackDoor(state))))) {
            doorOpen = true;
            collideRects.splice(doorRectIdx, 1);
            doorMesh.position.z = 2.6;
            doorMesh.material.map?.dispose();
            doorMesh.material.map = signTexture("OPEN. GO ON.", LEVELS[state.level].doorLabel);
            doorMesh.material.map.colorSpace = THREE.SRGBColorSpace; doorMesh.material.needsUpdate = true;
          }
          if (doorOpen && !transitioning && state.level < LEVELS.length - 1 && player.x > DOOR_X - 0.4) {
            transitioning = true;
            // 0905: public's door doesn't lead to a fourth level (LEVELS_PUBLIC has exactly one entry) -- it
            // leads to the head office's desk instead. See enterHeadOffice(), defined with the desk-terminal UI.
            if (state.level < LEVELS.length - 1) { if(MODE==="public"&&state.level===0)enterBreakRoom();else ctx.timeout(() => { advanceLevel(); buildLevel(state.level); buildLevelTail(state.level); repaintAll(); paintLeaf4(); goTo(0); transitioning = false; }, 250); }
          }

          if (finalPages && canOpenBackDoor(state) && deskRead.phase === 'idle') {
            const distance = Math.hypot(player.x - finalPages.position.x, player.z - finalPages.position.z);
            if (distance < 2.5) { anyPrompt = true; promptEl.textContent = 'THE FINAL PAGES. COME CLOSER.'; promptEl.classList.add('show'); }
            if (distance < 1.15) { finalPages.visible = false; startDreamEnding(); ctx.frame(frame); return; }
          }

          // monster: slides while off-frame or at the edge, holds still when watched dead-on (locked canon --
          // no pathfinding chase either way, this only changes whether the existing slide is allowed to progress)
          let monsterOnscreen = false, monsterCentered = false, monsterDist = 99;
          if (monster.visible) {
            if (!monsterWasVisible) monsterVisibleAt = now;
            monsterVec.copy(monster.position); monsterVec.y = camera.position.y; monsterVec.project(camera);
            monsterOnscreen = monsterVec.z < 1 && Math.abs(monsterVec.x) < 1.05 && Math.abs(monsterVec.y) < 1.05;
            monsterCentered = monsterOnscreen && Math.abs(monsterVec.x) < 0.22 && Math.abs(monsterVec.y) < 0.3;
            monsterDist = Math.hypot(monster.position.x - player.x, monster.position.z - player.z);
            if (ghost.active) {
              if (monsterCentered) { ghost.t0 += dt * 1000; }   // watched dead-on: freeze the slide's progress
              else {
                const p = Math.min(1, (now - ghost.t0) / ghost.dur);
                monster.position.lerpVectors(ghost.from, ghost.to, p);
                if (p >= 1) {
                  ghost.active = false;
                  // 0901: the Slender loop. A haunt that lands close to the player creeps instead of hiding --
                  // watching him dead-on freezes the creep (still builds static, same as any slide), looking
                  // away lets him close the gap. Ends by being watched out (hides, same as before) or by reaching
                  // touch range, where the kill check below takes it from there.
                  // Landing distance, not the frame-stale monsterDist computed above (before this lerp): that
                  // was still measuring the monster's PREVIOUS position, so a haunt landing close never read as
                  // close and the creep branch below never fired -- found live, the first time this was tested,
                  // by logging monsterDist across a haunt end and seeing it never dip under the threshold.
                  const landDist = Math.hypot(monster.position.x - player.x, monster.position.z - player.z);
                  if (landDist < 3.5) { creep.active = true; creep.watchedMs = 0; }
                  else hideTimer = ctx.timeout(() => { monster.visible = false; hideTimer = null; }, 500);
                }
              }
              monster.lookAt(player.x, monster.position.y, player.z);
            } else if (creep.active) {
              if (monsterCentered) {
                creep.watchedMs += dt * 1000;
                if (creep.watchedMs >= 2000) { creep.active = false; monster.visible = false; }
              } else {
                creep.watchedMs = 0;
                const cdx = player.x - monster.position.x, cdz = player.z - monster.position.z, cd = Math.hypot(cdx, cdz) || 1;
                const step = Math.min(CREEP_SPEED * dt, cd);
                monster.position.x += cdx / cd * step; monster.position.z += cdz / cd * step;
              }
              monster.lookAt(player.x, monster.position.y, player.z);
            }
            // touch-range kill: visible at least 600ms (no spawn-kills), close enough -- he can take you from
            // behind, whether or not you're facing him. Static-maxout kill is the other path, below. LIVE ONLY --
            // "the suited figure does NOT kill you" in public mode is the one behaviour difference the mode makes.
            if (LEVELS[state.level].handAuthored && !caught && !cc.hasAttribute("data-reading") && (now - monsterVisibleAt) >= 600 && monsterDist < 1.1) doCapture();
          }
          monsterWasVisible = monster.visible;

          // 0905: public mode's obstacle talks instead of killing -- a random deadline line while he's in range,
          // refreshed every few seconds rather than every frame so it reads as speech, not a flicker.
          if (MODE === "public" && monster.visible && monsterDist < 3.4) {
            if (!talkLine || now - talkPickedAt > 4500) { talkLine = DEADLINE_LINES[Math.floor(rnd() * DEADLINE_LINES.length)]; talkPickedAt = now; }
            anyPrompt = true; promptEl.textContent = talkLine; promptEl.classList.add("show");
          }
          if (!anyPrompt) promptEl.classList.remove("show");

          // static proximity effect: ramps faster watched dead-on than seen at the edge, decays once he's
          // off-frame or far. Escalates with pages found. Distinct from the ambient Rung 3 grain: it also
          // drives a dedicated coarse white-noise canvas layer, much blockier and brighter than the fine
          // feTurbulence grain, so a danger spike actually reads as a spike.
          {
            const n = state.found[state.level].filter(Boolean).length;
            const escal = 1 + n * 0.4;
            let target = 0;
            if (monster.visible && monsterOnscreen) { const prox = Math.max(0, 1 - monsterDist / 9); target = prox * (monsterCentered ? 1 : 0.45); }
            else if (monster.visible && monsterDist < 3.5) target = (1 - monsterDist / 3.5) * 0.25;
            const rate = (target > staticIntensity ? 0.55 : 0.4) * escal;
            staticIntensity = target > staticIntensity ? Math.min(1, staticIntensity + rate * dt) : Math.max(0, staticIntensity - rate * dt);
            const effectCap=LEVELS[state.level].handAuthored?1:.5;staticIntensity=Math.min(effectCap,staticIntensity);cc.dataset.haze=String(staticIntensity);
            if(staticIntensity>.3)alarmSound();
            vhsGrain.style.opacity = mobileRender ? .12 : effectCap===.5?.12:Math.min(1,0.35+staticIntensity*.4);
            vhsScan.style.opacity = mobileRender ? .16 : effectCap===.5?.1:Math.min(1,0.3+staticIntensity*.3);
            if (staticIntensity > 0.03) {
              // Preserve the danger cue and its game timing; refresh only its noise
              // texture at 12 Hz on phones instead of generating it every frame.
              if (!mobileRender || now - lastStaticDraw >= 1000 / 12) { drawStaticNoise(); lastStaticDraw = now; }
              staticCanvas.style.opacity = effectCap===.5?Math.min(.35,staticIntensity*.7):Math.min(.85,staticIntensity);
            }
            else staticCanvas.style.opacity = 0;

            // 0901: CORTISOL fills with proximity too. A live component rides on top of the banked ratchet --
            // proximity to the monster (when visible) plus staticIntensity, worth up to ~30 points, rising as
            // he closes and decaying over ~2.5s once he's gone. Displayed value is min(100, banked + live),
            // painted at ~10/sec (below) so the bar's 400ms CSS transition doesn't fight a per-frame write.
            // Hitting 100 is a readout, not a trigger -- the two kill paths above/below are the only triggers.
            const proxRaw = monster.visible ? Math.max(0, 1 - monsterDist / 6) : 0;
            const liveTarget = Math.max(proxRaw, staticIntensity) * 30;
            liveVal = liveTarget >= liveVal ? liveTarget : Math.max(liveTarget, liveVal - dt * 12);
            if (now - lastMeterPaint > 100) { lastMeterPaint = now; paintMeter(); }

            // static-maxout: the other kill path (both live, Ian's ruling). Shares the one capture routine
            // with the touch-range path above -- doCapture() never touches state.found, never calls save(),
            // never re-fires MBS.form/unlock/wave. LIVE ONLY, same as the touch-range path above.
            if (MODE === "live" && !caught && !cc.hasAttribute("data-reading") && staticIntensity >= 0.99) doCapture();
          }

          renderer.render(scene, camera);
          ctx.frame(frame);
        }
        buildLevel(state.level); buildLevelTail(state.level);
        if (MODE === 'public' && state.dreamPhase === 'ending') startDreamEnding();
        ctx.frame(frame);
      }).catch(err => {
        if (session !== mine) return;
        console.error("[cc] three.js failed to load", err);
        runFallback();
      });
    }
  },

  /* What the CONTEXT cannot own, and nothing else. Thirty listeners - two of them bound to WINDOW, which
     outlives every channel - eighteen timeouts, the timecode interval, both ResizeObservers, the render
     chain and the office AudioContext are all registered through ctx and are deliberately not re-listed
     here. What is left is the GPU, and one window global.

     A WebGLRenderer holds a real graphics context, and a browser keeps only a handful of them alive at
     once, silently dropping the OLDEST when a page asks for one too many. So a renderer that outlives
     its channel does not throw; it takes an EARLIER channel's canvas away, several channel changes
     later. dispose() releases the GPU-side resources, and forceContextLoss() hands the context itself
     back rather than waiting for the collector to notice.

     The scene is disposed by WALKING it rather than from a list built at construction time - fuel.js's
     decision, and this is the largest scene in the programme, which is the argument for it. scene.add
     (camera) is what brings the flashlight and its target inside the walk. `extra` carries what the
     graph genuinely cannot reach: the shared materials every wall, floor and ceiling CLONES rather than
     uses, the per-level area materials cloned the same way, and every sign texture - the door's map is
     replaced when the door opens, so the one it carried before that is unreachable from that moment.

     The canvas itself is NOT removed here: #ccCanvas is in the fragment's own markup, so it goes when
     the fragment is replaced. Removing it would be reaching into markup this module did not create.

     window.__corgi goes because it closes over this mount's player and level state. Left behind, a
     driver could teleport a dog around a school that is no longer in the document. */
  unmount() {
    session = null;
    try { delete window.__corgi; } catch (e) { window.__corgi = undefined; }
    if (!gl) return;
    const g = gl;
    gl = null;
    const killMat = (m) => {
      if (!m) return;
      // a material's textures are disposables in their own right, and every one here is canvas-generated -
      // the striped corridor walls, the checked floor, three newsprint maps for the monster, one papier-mache
      // map per prop, the area grain, the school posters, the page sprites and the door signs
      for (const k of ["map", "emissiveMap", "normalMap", "roughnessMap", "alphaMap"]) {
        if (m[k]) { try { m[k].dispose(); } catch (e) { /* already gone */ } }
      }
      try { m.dispose(); } catch (e) { /* already gone */ }
    };
    try {
      g.scene.traverse(o => {
        if (o.geometry) { try { o.geometry.dispose(); } catch (e) { /* already gone */ } }
        // dispose() is safe to call twice, which matters here: suitMat is shared by the monster's legs, torso
        // and both arms, one machePropMat serves every part of a desk, and the walk reaches each of them
        // repeatedly
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(killMat);
      });
    } catch (e) { console.error("[cc] scene teardown", e); }
    g.extra.forEach(x => { try { x.dispose(); } catch (e) { /* already gone */ } });
    try { g.renderer.dispose(); } catch (e) { /* already disposed */ }
    try { g.renderer.forceContextLoss(); } catch (e) { /* context already lost */ }
  },
};
