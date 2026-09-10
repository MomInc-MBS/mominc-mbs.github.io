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

const THREE_URL = "/tv/assets/armie-intro/vendor/three.module.js";

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
/* C016: the walking save's flush, hoisted here for exactly one reason - unmount() is the other way a
   walk ends, and it cannot see mount()'s closure. Set on mount, reset to a no-op on teardown. */
let flushWalk = () => {};

export default {
  mount(root, ctx) {
    session = {};
    const mine = session;
    const lb = root.matches("#lb") ? root : root.querySelector("#lb");
    if (!lb) return;
    if(!document.documentElement.dataset.game)return;
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

    /* ---- data: sourced facts (Part A/C) and housing-help resources (Part B), used exactly as written in
       LilBF Museum Housing Facts 0901.md. Numbers are never paraphrased.

       C014 adds four fields to every entry in both sets and re-cuts NOTHING: `body` and `src` are the
       reviewed strings, character for character, and the new fields sit beside them.

         url    - the source, as a link a visitor can actually open. THE RULE IS MECHANICAL AND THE GATE
                  ENFORCES IT: the host is one that already appears verbatim in this entry's own `src`,
                  never a path invented to look more specific. Where `src` cites a bare host (A9's
                  "(nahb.org)", A12's "thecoastnews.com", B1's "211.org") the link is that host's root,
                  which is a weaker link and an honest one - a fabricated article path is a fabricated
                  citation, and this file's whole thesis is that it does not have any.
         date   - the publication date as `src` states it. The eight resources have no edition, and say
                  so in the field rather than carrying an empty one: a standing hotline is not stale.
         scope  - who, where and when the claim covers. This is the field that stops a national number
                  reading as a local one and a 2024 count reading as today's, which is the whole reason
                  A3 and A6 exist beside A1 and A5.
         take   - one line of what the visitor is meant to carry away. Deliberately carries NO figure:
                  a takeaway that restates a number is a paraphrase of a number, which the top of this
                  file forbids. The numbers stay in `body`, where they were reviewed. */
    const FACTS = {
      teepee: [
        { t: "A1", body: ["On one night in January 2024, about 770,000 people in America had nowhere indoors to sleep.",
                          "That's 18 percent more than the year before.",
                          "Nobody fixed it. They just counted it again."],
          src: "HUD, 2024 Annual Homelessness Assessment Report, Dec. 2024. archives.hud.gov/news/2024/pr24-327.cfm",
          url: "https://archives.hud.gov/news/2024/pr24-327.cfm", date: "December 2024",
          scope: "United States, a single night in January 2024", take: "The count went up. The response did not." },
        { t: "A2", body: "More than a third of those 770,000 people were not even in a shelter. About 277,000 were sleeping outside, in a car, or somewhere never built for a person.",
          src: "HUD AHAR 2024, via National Alliance to End Homelessness. endhomelessness.org/media/news-releases/hud-releases-2024-annual-homelessness-assessment-report",
          url: "https://endhomelessness.org/media/news-releases/hud-releases-2024-annual-homelessness-assessment-report", date: "December 2024",
          scope: "United States, the unsheltered share of that same January 2024 night", take: "Shelter is not what most of that number got." },
        { t: "A3", body: "This city counted 8,859 homeless people in January 2026, twelve percent more than last time. Most of them, 5,017 people, had no shelter at all. You are standing near where some of them are.",
          src: "Southern Nevada Continuum of Care PIT Count, Jan. 2026. lasvegassun.com/news/2026/jul/09/point-in-time-count-reveals-12-rise-in-clark-county",
          url: "https://lasvegassun.com/news/2026/jul/09/point-in-time-count-reveals-12-rise-in-clark-county", date: "July 9, 2026",
          scope: "Clark County, Nevada, counted in January 2026", take: "This one is local. It is the street outside." }
      ],
      shoebox: [
        { t: "A4", body: "Half of America's renters spent more than 30 percent of their income on rent in 2023. More than a quarter spent over half of everything they made just to keep a roof.",
          src: "Harvard Joint Center for Housing Studies, State of the Nation's Housing 2025. habitat.org/about/advocacy/housing-report-2025",
          url: "https://habitat.org/about/advocacy/housing-report-2025", date: "2025 edition",
          scope: "United States renter households, 2023 data", take: "Paying too much for rent is the ordinary case, not the edge one." },
        { t: "A5", body: "A full-time worker needs $33.63 an hour to afford a plain two-bedroom apartment without falling behind. That's more than four times the federal minimum wage.",
          src: "National Low Income Housing Coalition, Out of Reach 2025. nlihc.org/resource/now-available-out-reach-2025-high-cost-housing",
          url: "https://nlihc.org/resource/now-available-out-reach-2025-high-cost-housing", date: "2025 edition",
          scope: "United States, the wage a two-bedroom rental takes", take: "Full-time work and a two-bedroom stopped being the same thing." },
        { t: "A6", body: "Renting a two-bedroom here takes $33.65 an hour. The average renter in this city earns $22.05 an hour. The math was never going to work out for him either.",
          src: "NLIHC, Out of Reach 2025, Nevada data. nlihc.org/sites/default/files/oor/2025_OOR-Nevada.pdf",
          url: "https://nlihc.org/sites/default/files/oor/2025_OOR-Nevada.pdf", date: "2025 edition",
          scope: "Nevada, the two-bedroom wage against what renters here actually earn", take: "The same gap as the national one, measured on this street." }
      ],
      masonjar: [
        { t: "A7", body: "Landlords in this city filed an eviction case against 14 of every 100 renter households in 2025. That's almost double the rate researchers track nationally.",
          src: "Eviction Lab, Princeton University, via Las Vegas Review-Journal. reviewjournal.com/business/housing/eviction-notices-drop-in-las-vegas-but-rates-still-high-for-metro-area-report-says",
          url: "https://reviewjournal.com/business/housing/eviction-notices-drop-in-las-vegas-but-rates-still-high-for-metro-area-report-says", date: "2025 filings",
          scope: "Clark County, Nevada renter households", take: "Filing here is routine in a way it is not elsewhere." },
        { t: "A8", body: "For every 100 of the poorest renter households in America, only 35 can find a home they can afford. In Nevada, it's 17. The gap is not an accident, it's arithmetic.",
          src: "NLIHC, The Gap: A Shortage of Affordable Homes, 2025. nlihc.org/news/nlihc-releases-gap-2025-shortage-affordable-homes",
          url: "https://nlihc.org/news/nlihc-releases-gap-2025-shortage-affordable-homes", date: "2025 edition",
          scope: "United States and Nevada, extremely low-income renter households", take: "There are not enough homes at the bottom for the people at the bottom." },
        { t: "A9", body: "The median home in America hit $412,500 in 2024, 60 percent more than six years earlier. By July 2026 it was $434,100. Nobody's paycheck grew 60 percent.",
          src: "Harvard JCHS, State of the Nation's Housing 2025 (nahb.org); NAR Existing-Home Sales, July 2026.",
          url: "https://nahb.org", date: "2025 report; NAR series to July 2026",
          scope: "United States, the median existing-home sale price", take: "The price ran away from the wage and never came back." }
      ],
      car: [
        { t: "A10", body: "California cities have been racing to ban it outright. As of January 2025, forty two California cities and two counties had passed some version of a public camping ban since the Supreme Court's Grants Pass ruling, and the newer ones increasingly name the car itself, not just a tent.",
          src: "National Homelessness Law Center, via Stateline, Many more cities ban sleeping outside despite a lack of shelter space, Jan. 27, 2025. stateline.org/2025/01/27/many-more-cities-ban-sleeping-outside-despite-a-lack-of-shelter-space",
          url: "https://stateline.org/2025/01/27/many-more-cities-ban-sleeping-outside-despite-a-lack-of-shelter-space", date: "January 27, 2025",
          scope: "California cities and counties, bans passed since the Grants Pass ruling", take: "The law moved faster than the housing did." },
        { t: "A11", body: "San Joaquin County's version goes further than a tent ban. It bans sleeping in a parked car outright, and anyone living outside is required to move at least 300 feet every hour.",
          src: "NPR, 100-plus cities in the U.S. banned homeless camping this year. But will it work?, Dec. 26, 2024. npr.org/2024/12/26/nx-s1-5199103/homeless-camping-bans-grants-pass",
          url: "https://npr.org/2024/12/26/nx-s1-5199103/homeless-camping-bans-grants-pass", date: "December 26, 2024",
          scope: "San Joaquin County, California", take: "A parked car became somewhere you can be moved on from." },
        { t: "A12", body: "Carlsbad, California counted 60 homeless residents in 2023. By 2024 it was 112, nearly double, in the same stretch the city passed its own ban on camping in a car.",
          src: "San Diego Regional Task Force on Homelessness, Point-in-Time Count, May 22, 2024, via The Coast News. thecoastnews.com",
          url: "https://thecoastnews.com", date: "May 22, 2024",
          scope: "Carlsbad, California, counted 2023 against 2024", take: "Banning it and counting more of it happened in the same year." }
      ],
      storage: [
        { t: "A13", body: "A South Salt Lake, Utah storage facility found families bolted inside sheds fitted out with beds, a microwave and a working air conditioner. One held a family of three, including a three month old. Some had been living there six months before anyone found them.",
          src: "KSL.com, Homeless families found living in storage units, 2012. ksl.com/article/20169843",
          url: "https://ksl.com/article/20169843", date: "2012",
          scope: "South Salt Lake, Utah, one storage facility", take: "It is not new, and it was found by accident." },
        { t: "A14", body: "It is illegal everywhere in the country under fire, sanitation and zoning code. A national survey of 2,000 US adults found one in five, 20 percent, had slept in a self storage unit anyway.",
          src: "StorageUnits.com and Pollfish survey, via PRWeb, Survey Finds 1 in 5 Americans Have Slept in a Storage Unit, June 2025. prweb.com/releases/survey-finds-1-in-5-americans-have-slept-in-a-storage-unit-302499519.html",
          url: "https://prweb.com/releases/survey-finds-1-in-5-americans-have-slept-in-a-storage-unit-302499519.html", date: "June 2025",
          scope: "United States, a survey panel of 2,000 adults", take: "Illegal everywhere, and common anyway." },
        { t: "A15", body: "Self storage is on track to be a fifty billion dollar industry by 2029, and already runs more than 52,000 facilities covering 2.1 billion square feet. It grows fastest in a downturn: storage companies posted a 5 percent return the same years family homelessness rose 30 percent.",
          src: "Slate, Self-storage units serve as a long-term solution when finding housing or moving isn't an option, Aug. 2024, citing Mordor Intelligence, the US Census Bureau and HUD. slate.com/business/2024/08/self-storage-units-industry-growth-housing-insecurity-evictions.html",
          url: "https://slate.com/business/2024/08/self-storage-units-industry-growth-housing-insecurity-evictions.html", date: "August 2024",
          scope: "United States self-storage industry, against family homelessness over the same years", take: "Somebody is doing well out of the shortage." }
      ],
      van: [
        { t: "A16", body: "The number of people living full time in a van in the US grew 63 percent in two years, from about 1.9 million in 2020 to 3.1 million in 2022.",
          src: "Statista, via Yahoo Finance, Paying for van life: Costs and statistics, 2025. finance.yahoo.com/news/paying-van-life-202933082.html",
          url: "https://finance.yahoo.com/news/paying-van-life-202933082.html", date: "2025",
          scope: "United States, full-time van residents, 2020 against 2022", take: "The fastest-growing kind of home has no address." },
        { t: "A17", body: ["It is marketed as freedom. People are selling million dollar homes to live in one.",
                           "The median US home costs $434,100.",
                           "A van is not cheap. It is just cheaper."],
          src: "Moneywise, Wealthy people are selling their million dollar homes to live in a van all year, 2025; NAR Existing-Home Sales, July 2026. moneywise.com/life/lifestyle/vanlife-wealthy-homeowners-hidden-costs",
          url: "https://moneywise.com/life/lifestyle/vanlife-wealthy-homeowners-hidden-costs", date: "2025; NAR series to July 2026",
          scope: "United States, van life as marketed against the median home price", take: "Cheaper is not the same word as affordable." },
        { t: "A18", body: "More than 100 US cities passed a new homeless camping ban in a single year, and enforcement keeps reaching further, past the tent and into anyone parked overnight.",
          src: "NPR, 100-plus cities in the U.S. banned homeless camping this year. But will it work?, Dec. 26, 2024. npr.org/2024/12/26/nx-s1-5199103/homeless-camping-bans-grants-pass",
          url: "https://npr.org/2024/12/26/nx-s1-5199103/homeless-camping-bans-grants-pass", date: "December 26, 2024",
          scope: "United States, camping bans passed in a single year", take: "The ban keeps widening to cover wherever people actually are." }
      ]
    };
    /* The resources carry the same four fields, and two of them read differently here on purpose. A
       hotline has no edition, so `date` says that rather than sitting empty - "no dated edition" is a
       fact about the source, an empty string is a gap in the file. And `scope` is the field that
       matters most in this set: B4, B5 and B6 are Southern Nevada only, and a visitor in Ohio reading
       a Clark County phone number as national help is the exact harm the field exists to stop. */
    const RES = {
      B1: { body: "Call 211, anywhere in the country, for shelter, rent help, food, and utility assistance. Free and confidential. In Nevada: 1-866-535-5654 or text your zip code to 898-211.", src: "211.org · nevada211.org",
            url: "https://211.org", date: "Standing service, no dated edition",
            scope: "United States, with a Nevada line", take: "One number, any state, no cost." },
      B2: { body: "Free, HUD-approved housing counseling exists for renting, buying, or facing foreclosure. Look up an agency by zip code. No cost, no catch.", src: "consumerfinance.gov/find-a-housing-counselor · 855-411-2372",
            url: "https://consumerfinance.gov/find-a-housing-counselor", date: "Standing directory, no dated edition",
            scope: "United States, HUD-approved counselling agencies", take: "Free advice exists before you need a lawyer." },
      B3: { body: "If you are homeless or about to be, start with your local Continuum of Care, 211, or social services. Here is how the process actually works.", src: "National Alliance to End Homelessness · endhomelessness.org/how-to-get-help-experiencing-homelessness",
            url: "https://endhomelessness.org/how-to-get-help-experiencing-homelessness", date: "Standing guide, no dated edition",
            scope: "United States, getting into the homelessness system", take: "There is a front door, and this is where it is." },
      B4: { body: "Behind on rent in Clark County? Emergency rental assistance and eviction prevention funds exist. Call and ask before the notice becomes a lockout.", src: "Clark County Social Service · 702-455-4270 · clarkcountynv.gov/residents/assistance_programs/housing-expense-assistance",
            url: "https://clarkcountynv.gov/residents/assistance_programs/housing-expense-assistance", date: "Standing programme, no dated edition",
            scope: "Clark County, Nevada renters only", take: "Ask before the notice becomes a lockout." },
      B5: { body: "Homeless or about to be, in Southern Nevada? This is where the shelter system's front door actually is.", src: "HELP of Southern Nevada · 702-369-4357 · helpsonv.org/get-help",
            url: "https://helpsonv.org/get-help", date: "Standing service, no dated edition",
            scope: "Southern Nevada only", take: "This is where the shelter system actually starts." },
      B6: { body: "Facing eviction in Southern Nevada? Free legal help exists, including a hotline and a weekly ask-a-lawyer clinic. Call before the court date, not after.", src: "Legal Aid Center of Southern Nevada · 702-386-1070 · lacsn.org/practice-areas/consumer-rights-project/tenant-rights",
            url: "https://lacsn.org/practice-areas/consumer-rights-project/tenant-rights", date: "Standing service, no dated edition",
            scope: "Southern Nevada tenants facing eviction", take: "Free legal help, before the court date." },
      B7: { body: "Housing and abuse often trap people together. Free, confidential help is available 24 hours a day, every day.", src: "National Domestic Violence Hotline · 1-800-799-7233 · thehotline.org",
            url: "https://thehotline.org", date: "Standing service, no dated edition",
            scope: "United States, every hour of every day", take: "Housing and safety are often the same problem." },
      B8: { body: "Behind on rent anywhere in the US? This federal tool points you to 211, HUD's housing map, and your local housing agency.", src: "CFPB Rent Help · consumerfinance.gov/renthelp",
            url: "https://consumerfinance.gov/renthelp", date: "Standing directory, no dated edition",
            scope: "United States renters behind on rent", take: "One federal page that points at the local ones." }
    };
    const RESOURCE_MAP = { teepee: ["B1", "B3", "B5"], shoebox: ["B2", "B4", "B8"], masonjar: ["B6", "B7"], car: ["B1", "B5", "B8"], storage: ["B2", "B4", "B6"], van: ["B3", "B7"] };

    /* 4.10 / S1: wall information has to be consumable - bullet points, and no paragraph over three
       sentences. A body that needs bullets is written as an ARRAY of the same sentences in the same
       order, never as new prose: `body.join(" ")` is the shipped string back, character for character,
       which is how a FORMATTING packet stays inside "numbers used exactly as written, never
       paraphrased" (the thesis at the top of the markup, and 4.4's rule that a packet must not re-cut
       shipped content). Only two of the twenty-six bodies run long enough to need it; every other one
       is still a string and renders exactly as it did. Two readers, so two projections: the DOM cards
       take bodyHTML, the canvas placards take the array straight (makeSignTexture draws it). */
    const bodyHTML = b => Array.isArray(b)
      ? '<ul class="fl-bul">' + b.map(s => "<li>" + s + "</li>").join("") + "</ul>" : b;
    // half the round-2 spacing (0.125 fraction vs 0.25) packs six exhibits into the same HALL_LEN - denser,
    // not longer, per 5.1. Old and new pairs interleave so the walk still reads as a housing progression.
    /* C012 extends this list with `short`, the name the route strip wears. It is a SEPARATE field
       rather than a slice of `label`: "THE STORAGE UNIT" cut to fit is "THE STORAG", and the strip's
       whole job is being readable at a glance in the 9px of a phone stage. Nothing else reads it, and
       the full label is still what the placard, the nameplate and every aria string use. */
    const EXHIBITS = [
      { id: "teepee", label: "THE TEEPEE", short: "TEEPEE", p: 0.15, side: 1, cozy: "assets/lilbf-teepee-cozy.jpg", horror: "assets/lilbf-teepee-horror.jpg" },
      { id: "car", label: "THE CAR", short: "CAR", p: 0.275, side: -1, cozy: "assets/lilbf-car-cozy.jpg", horror: "assets/lilbf-car-horror.jpg" },
      { id: "shoebox", label: "THE SHOEBOX", short: "SHOEBOX", p: 0.4, side: 1, cozy: "assets/lilbf-shoebox-cozy.jpg", horror: "assets/lilbf-shoebox-horror.jpg" },
      { id: "storage", label: "THE SHIPPING CONTAINER", short: "CONTAINER", p: 0.525, side: -1, cozy: "assets/lilbf-storage-cozy.jpg", horror: "assets/container-horror-v2.png" },
      { id: "masonjar", label: "THE MASON JAR", short: "JAR", p: 0.65, side: 1, cozy: "assets/lilbf-masonjar-cozy.jpg", horror: "assets/lilbf-masonjar-horror.jpg" },
      { id: "van", label: "THE VAN", short: "VAN", p: 0.775, side: -1, cozy: "assets/lilbf-van-cozy.jpg", horror: "assets/van-horror-v2.png" }
    ];
    /* ---- C107: what the programme ADVERTISED, and what it turned out to mean --------------------
       This is the one block of data in this file that is not sourced and must never look as though it
       is. It is MOM Inc's own marketing copy - fiction, written in the voice of the brochure at the top
       of the markup ("Can't afford rent? Get smaller. Size isn't everything.") - and its revised
       reading, which is the same brochure read after the walk. Neither field carries a FIGURE, for the
       same reason `take` does not: every number on this channel is a reviewed, cited one, and a number
       invented for a joke standing next to eighteen that are not is how the whole file loses the
       benefit of the doubt. The gate asserts it with a \d search over both fields.

       `rev` is a reading of THAT promise, not a general moral: the row asks for the first choice to be
       shown "beside the revised interpretation", and a single revised paragraph per exhibit would show
       the same thing to somebody who picked the freedom line and somebody who picked the price line.
       Nothing here is scored, ranked or marked - `k` is a storage key and nothing in this module ever
       compares two of them for correctness. There is no right answer to which lie was the biggest. */
    const PROMISES = {
      teepee: [
        { k: "P1", ad: "Sleeps anywhere. No lease, no landlord, no waiting list.",
          rev: "Anywhere was the true part. It is also the part the camping ordinance is about." },
        { k: "P2", ad: "Breathable canvas walls. The air in here is always fresh.",
          rev: "A wall you can breathe through is a wall the weather can come through too." },
        { k: "P3", ad: "Packs down in minutes. Take your home with you.",
          rev: "A home you can carry is a home somebody else can ask you to carry somewhere else." }
      ],
      car: [
        { k: "P1", ad: "You already own it. Your housing cost drops to nothing overnight.",
          rev: "It did not drop to nothing. It moved onto the tank, the plates and the tow fee, and none of those is a landlord you can call." },
        { k: "P2", ad: "Park anywhere. Wake up somewhere new every morning.",
          rev: "Anywhere gets smaller every year, and waking up somewhere new is what being moved on looks like from the inside." },
        { k: "P3", ad: "Doors that lock. Security comes as standard.",
          rev: "The lock keeps out everybody except the one person arriving with a ticket book." }
      ],
      shoebox: [
        { k: "P1", ad: "Everything within reach. Not one wasted step.",
          rev: "Nothing is out of reach because there is nowhere left for it to be." },
        { k: "P2", ad: "Heats in seconds. Your bills have never been smaller.",
          rev: "The bill got smaller because the room did. The rent did not follow it down." },
        { k: "P3", ad: "A dedicated place for every essential.",
          rev: "The essentials were chosen for you, by the size of the box." }
      ],
      storage: [
        { k: "P1", ad: "Climate controlled. Twenty-four hour access. Month to month.",
          rev: "The twenty-four hour access is for your things. You are not what the agreement covers." },
        { k: "P2", ad: "Your own key. Nobody comes in unless you let them.",
          rev: "Nobody comes in, and the same door is why nobody knows you are in there." },
        { k: "P3", ad: "Cheaper than anything else with a roof on it.",
          rev: "Cheaper than housing is the entire product, which is why the industry does best in the years housing does worst." }
      ],
      masonjar: [
        { k: "P1", ad: "Airtight. Nothing gets in.",
          rev: "Nothing gets in, and that includes anybody arriving to help." },
        { k: "P2", ad: "See out on every side. You will never feel shut in.",
          rev: "Seeing out of somewhere is not the same as being able to leave it." },
        { k: "P3", ad: "Stackable. Neighbours above you and below you, always.",
          rev: "Stackable is a word about containers, and it was being used about you." }
      ],
      van: [
        { k: "P1", ad: "Freedom. Your home goes wherever you go.",
          rev: "It is sold as a choice, and it is one - for the people who had another." },
        { k: "P2", ad: "Cheaper than a mortgage from the very first day.",
          rev: "Cheaper is the only claim here that holds up. Affordable was never the word being used." },
        { k: "P3", ad: "Off-grid ready. Park up and stay as long as you like.",
          rev: "As long as you like has an hourly limit in some counties now, measured in feet." }
      ]
    };

    /* ---- C105: the small print under a corner of the wallpaper ------------------------------------
       ONE CLAUSE PER EXHIBIT, AND IT IS THE PAPERWORK BEHIND A PROMISE THAT IS ALREADY ON THE WALL.
       The row's acceptance is the whole of the design: "clause develops the same housing promise, not
       a separate collectible requirement". So `ref` names which of that exhibit's three advertised
       lines this clause is the small print for, and `quote` is the phrase it lifts out of it - which
       must appear VERBATIM in that promise's own `ad` AND again in the clause's own `text`. That is
       C111's `was`/`now` rule in its third form, and the gate enforces it the same mechanical way: a
       clause that develops nothing in particular is a collectible with a contract typeface on it,
       which is the exact shape the row forbids.

       IT IS FICTION AND CARRIES NO FIGURE, gated with a \d search over `quote` and `text` exactly as
       PROMISES is. The clause NUMBER is a separate field for that reason - "clause 4(c)" is a pointer
       into an imaginary document, not a claim about the world, and letting it live in `text` would
       either put a digit in the prose or cost the gate its bluntness.

       NOTHING IS STORED. Peeling writes no state, marks nothing read and completes nothing: it is a
       <details> and the browser owns the whole of its behaviour, which is also why there is no
       listener, no aria wiring and no record of who opened one. */
    const CLAUSES = {
      teepee: { ref: "P2", n: "4(c)", quote: "Breathable canvas walls",
        text: "Breathable canvas walls are supplied as described and do not constitute a weatherproofing warranty. The Resident accepts the interior climate as the exterior climate." },
      car: { ref: "P1", n: "2(a)", quote: "Your housing cost drops to nothing",
        text: "Your housing cost drops to nothing is a statement about rent and is not a statement about fuel, registration, insurance or removal. Charges arising while the Residence is stationary remain the Resident's." },
      shoebox: { ref: "P1", n: "9(b)", quote: "Not one wasted step",
        text: "Not one wasted step is an efficiency the Resident undertakes to maintain. Possessions exceeding the Residence's declared volume are surrendered at the door and are not returned." },
      storage: { ref: "P2", n: "6(d)", quote: "Nobody comes in unless you let them",
        text: "Nobody comes in unless you let them, and the Operator is under no obligation to look. The unit is licensed for goods; occupancy by a person voids the licence and the Operator's duty of care with it." },
      masonjar: { ref: "P1", n: "3(f)", quote: "Nothing gets in",
        text: "Nothing gets in is a specification of the seal and not an undertaking regarding assistance. The Operator reserves the right to determine, from outside, whether the Residence is occupied." },
      van: { ref: "P3", n: "11(e)", quote: "Park up and stay as long as you like",
        text: "Park up and stay as long as you like remains subject to local ordinance, which the Operator does not warrant, monitor or advise upon. Notices served on the Residence are served on the Resident." }
    };

    /* ---- C111: the two claims on these walls that have a dated older version ON RECORD -------------
       THE RULE IS MECHANICAL AND THE GATE ENFORCES IT, exactly as C014's `url` rule is: `was` and `now`
       must each appear VERBATIM inside that entry's own shipped `body`. Nothing here is a sentence
       somebody wrote for this feature. A version selector whose older version is not already reviewed,
       cited and shipped is a fabricated citation wearing a date, on the one channel whose whole thesis
       is that it has none - and "the museum used to say something else" is precisely the claim a
       visitor has no way of checking.

       Which is why there are TWO of these and not eighteen. Two of the twenty-six entries state a
       figure and then state its dated replacement in the same reviewed body: A9's median home price
       (a 2024 figure from a 2025 report, overtaken by the monthly series in July 2026) and A12's
       Carlsbad count (2023, counted again in 2024). Every other entry either has one edition or names
       a change without printing the earlier number, and inventing that number is the thing this table
       exists to make impossible. Four of the six exhibits therefore show no selector at all, because
       there is no approved update on record for them. That is the honest population, not a gap. */
    const REVISIONS = {
      A9: { claim: "the median American home price",
            wasDate: "2024 figure, as the 2025 report states it",
            was: "The median home in America hit $412,500 in 2024, 60 percent more than six years earlier.",
            nowDate: "July 2026, NAR Existing-Home Sales",
            now: "By July 2026 it was $434,100.",
            why: "The monthly sales series ran on past the cut-off of the report this exhibit was written from. The older figure was not replaced and not corrected: it is what the newer one is measured against, and both are printed above." },
      A12: { claim: "Carlsbad's homeless count",
             wasDate: "2023 count",
             was: "Carlsbad, California counted 60 homeless residents in 2023.",
             nowDate: "2024 count, published May 22, 2024",
             now: "By 2024 it was 112, nearly double, in the same stretch the city passed its own ban on camping in a car.",
             why: "One count, taken again a year later by the same body. The older number is what makes the newer one mean anything, so the exhibit keeps both rather than quietly showing the current one." }
    };

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
    const SHRINK_MS = 12500;   // matches the automatic sprint back; loitering no longer buys safety
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
    /* C107's half of sanitize(), built OUT of the saved object rather than filtered down it - the same
       shape `read`'s EXHIBITS.filter() takes, and it closes the same three edits at once: an unknown
       exhibit id cannot get in, a promise key that belongs to a different exhibit cannot get in, and
       the object is bounded by the six that exist rather than by whatever a hand edit typed. */
    function pickMap(raw) {
      const out = {};
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
      EXHIBITS.forEach(e => {
        const want = raw[e.id];
        if (PROMISES[e.id].some(p => p.k === want)) out[e.id] = want;
      });
      return out;
    }
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
        /* C012: which exhibits have been inspected. Written as a FILTER OF EXHIBITS rather than a
           filter of the saved array, which is the same allowlist argument `phase` gets and closes
           three edits at once: an unknown id cannot get in, a repeated one cannot get in twice, and
           the length is bounded by the six that exist rather than by whatever a hand edit typed. The
           order is EXHIBITS' own, so the strip's marks never depend on the order they were read in. */
        read: Array.isArray(saved.read) ? EXHIBITS.filter(e => saved.read.indexOf(e.id) >= 0).map(e => e.id) : [],
        /* C014: which exhibit the visitor was reading when they left. This is what "resume at the same
           exhibit" is, said in the save rather than inferred: `t` alone puts them back in the corridor
           near the right alcove, which is a position, not a page. Allowlisted against EXHIBITS for the
           same reason `read` and `phase` are - it selects an object this file then renders. */
        reading: (EXHIBITS.find(e => e.id === saved.reading) || {}).id || null,
        /* C107: the pre-reveal pick and the after-the-return pick, kept apart and kept BOTH. Same
           allowlist argument again, applied on both axes at once - the key has to be one of the six
           exhibits and the value one of that exhibit's own three promise keys, so a hand edit cannot
           put a seventh room or a fourth promise into a comparison this file then renders. */
        promise: pickMap(saved.promise),
        promiseBack: pickMap(saved.promiseBack),
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
    function saveState() { lb.dataset.returning=String(isReturning()); try { localStorage.setItem(STORE_KEY, JSON.stringify(ST)); } catch {} }

    /* C016. Walking used to write the WHOLE save on every animation frame - about sixty synchronous
       localStorage writes a second, all of them the same record with a fourth decimal changed. The
       walk is a continuous quantity, so its save is throttled on both axes the ticket names: at most
       one write per SAVE_MS, and one whenever the visitor has covered SAVE_DT of the hall since the
       last one. At WALK_SPEED (a full hall in 37.5 seconds) it is the DISTANCE threshold that fires,
       roughly every 0.75s, so a walk costs about one write a second instead of sixty - and it is
       bounded by the speed, not by the frame rate, which is what makes the bound hold on a 144Hz
       display too.

       EVERY DISCRETE EVENT STILL CALLS saveState() DIRECTLY - the phase changes at the door and at the
       entrance, the signature, walk again, the flat gallery's per-step render. A transition is not a
       sample of a curve: there is nothing to coalesce it with, and it has to survive a reload on the
       next tick.

       And the throttle is FLUSHED, never dropped. `pagehide` (which a reload, a tab close and a
       bfcache eviction all fire) and unmount() write whatever is pending, so the resume point is the
       last frame WALKED rather than the last one written. Without that, the bounded write count would
       be bought with up to three quarters of a second of lost walk on every exit, which is a trade
       the row is not asking anyone to make. */
    const SAVE_MS = 1000, SAVE_DT = 0.02;
    let saveAt = 0, saveT = ST.t, walkDirty = false;
    function saveWalk() {
      walkDirty = true;
      if (performance.now() - saveAt < SAVE_MS && Math.abs(ST.t - saveT) < SAVE_DT) return;
      flushWalk();
    }
    flushWalk = () => {
      if (!walkDirty) return;
      walkDirty = false; saveAt = performance.now(); saveT = ST.t;
      saveState();
    };
    ctx.on(window, "pagehide", flushWalk);

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
      // 4.9: the `.breached` class this used to set had exactly one consumer - the lower gallery's
      // cozy->horror photo flip - and that gallery is gone, so the class write and its `restore` went
      // with it. The wave itself is the shipped beat and stays: MBS.wave's `restore` is optional
      // (mbs-runtime.js:59) and the purple sweep back puts the picture up on its own.
      ctx.mbs && ctx.mbs.wave && ctx.mbs.wave({ after: 5000 });
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

    /* C017: THE CONTRACTION MADE VISIBLE, AND IT READS THE SAME NUMBER.
       SHRINK_MS, the eased curve above and every consumer of rp are untouched: what was missing was
       never the logic, it was that a wall-clock contraction with no fixed reference beside it is
       invisible while it happens and inexplicable when it stops. So the hall gets a floor ruler -
       four gold rails a side, laid at the four half-widths the wall travels between, which never move
       - and the closing wall swallows one rail per third of the contraction. The rails are the cue;
       the wall arriving at them is the animation, and there is no second timeline anywhere in it.

       markAt() takes wallHalf(rp), the identical expression the hall mesh is scaled by, and answers
       which rail the wall is standing on. It does not re-derive the curve from Date.now(), from the
       phase or from the walk - that is 4.4's mistake, and this is the row where making it twice would
       be a cue that disagrees with the wall it is describing. WALL_OUT/WALL_IN/wallHalf moved OUT of
       run3D() for the same reason: the flat fallback narrates the same marks, and two copies of the
       geometry is how the two paths start telling a visitor different numbers. */
    const WALL_OUT = 1.5, WALL_IN = 0.6;
    const MARKS = [WALL_OUT, 1.2, 0.9, WALL_IN];   // the rails, outermost first; evenly spaced in rp
    const wallHalf = rp => WALL_OUT + (WALL_IN - WALL_OUT) * rp;
    function markAt(rp) {
      const half = wallHalf(rp);
      let i = 0;
      while (i + 1 < MARKS.length && half <= MARKS[i + 1] + 1e-6) i++;
      return i + 1;
    }
    function markLine(rp) { return "MARK " + markAt(rp) + " OF " + MARKS.length; }
    /* The narration, and the second half of the acceptance is the LAST line: reaching the minimum has
       to be legible as an end rather than as a stuck museum, and it names the control that leaves.
       The entrance is t=0 and WALK raises t, so BACK is what returns - the "turn around" beat flips
       the camera, never the buttons. */
    function shrinkNarration(rp) {
      if (!isReturning()) return "";
      return rp >= 1
        ? "THE HALL STOPS HERE · " + markLine(rp) + " · HOLD BACK FOR THE ENTRANCE"
        : "THE HALL IS CLOSING · " + markLine(rp);
    }

    /* C011: the tutorial's own key, and "its own" is the whole point of the field. What it records is
       that this visitor has been taught how to open a miniature - which is not ST.signed, not the
       phase, not completion and not anything in mbs-state: a visitor who finished the whole museum
       last week still knows how to open one, and a visitor who has opened one but walked out of the
       hall does too. Tying it to any of those either re-teaches someone who knows or, worse, marks
       them taught for reaching an end they reached without ever inspecting anything.

       A separate key rather than a fifth field on the museum record, for the reason 4.1 gave the mode
       its own home and 2.22 gave the CRT setting one: this is a preference-shaped fact about the
       PERSON, and "walk again" resets the walk without unteaching them. */
    const TUTOR_KEY = "mbs-lilbf-taught-v1";
    let taught = false;
    try { taught = localStorage.getItem(TUTOR_KEY) === "1"; } catch { }
    function markTaught() {
      if (taught) return;
      taught = true;
      try { localStorage.setItem(TUTOR_KEY, "1"); } catch { }
    }

    /* C012: an exhibit becomes "read" when it has actually been opened - the 3D zoom, or the flat
       gallery rendering its step, which are the two places its facts are on screen. NEVER a push:
       __lbLoaded holds the array this one came from and Object.freeze is shallow, so mutating in
       place would quietly rewrite the loader's own answer about what it accepted. */
    function markRead(id) {
      if (ST.read.indexOf(id) >= 0) return;
      ST.read = ST.read.concat(id);
      saveState();
    }

    /* ---- C014: the reading surface, shared by both render paths ------------------------------------
       An exhibit's material used to be TEXTURE TEXT: makePlacardTexture() drew the whole body and the
       whole citation into a canvas and hung it on a wall. That surface cannot be selected, cannot be
       copied, cannot be handed to a screen reader, and its URLs are a picture of a URL. Every one of
       those is a thing the ticket asks for, so the reading moves into the DOM and the placard keeps
       what a placard is for - which fact this is, what it covers, and the line to walk away with.

       ONE PROJECTION, TWO PATHS. readCards() builds the markup the 3D reading panel shows and the flat
       gallery's step shows, off the same objects, so "the source opens" cannot be true on one path and
       false on the other. The scroll chapters are deliberately NOT re-cut: 4.2's sections are asserted
       at exactly one stage tall on an 800px stage AND a 566px one, four extra lines per card is about
       35px x 3 cards, and re-fitting six chapters is 4.2 built twice for a link that the museum and
       the flat gallery both already give. Filed in the backlog, not smuggled in here.

       The link carries rel="noopener noreferrer" and opens in a new tab, which is the only shape that
       lets a visitor open a source WITHOUT losing the walk - "resume at the same exhibit" is cheapest
       when nothing was left in the first place. ST.reading is the belt to that braces: it survives a
       real reload too, which a target that replaced the page would need. */
    const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    // the link's visible text is the host and path without the scheme - the same string `src` already
    // prints, so the citation and the link read as one thing rather than two competing addresses
    const linkLabel = u => u.replace(/^https?:\/\//, "");
    /* ---- C111: the dated version selector, and the reason beside it -------------------------------
       Two radios named for their DATES, not for "old" and "new": the acceptance is that the historical
       wording stays visibly dated, and a control labelled "previous" is a control that stops being an
       answer to "as of when". Both versions and both dates are in the DOM either way - the selector
       chooses which one is on screen, it does not fetch, replace or discard anything - and the reason
       for the change is outside the selector, always visible, because a visitor who never touches the
       control still has to be told the claim moved.

       `ns` namespaces the radio group. C112's spotlight can render the same card while the walk's own
       reading panel is open behind it, and two radio groups sharing a name are ONE group: selecting a
       version in the spotlight would silently flip the card underneath it. */
    function revBlock(item, ns) {
      const r = REVISIONS[item.t];
      if (!r) return "";
      const n = ns + "-lbv-" + item.t;
      return '<div class="rd-rev" data-v="now">'
        + '<p class="rd-rev-h">Revised claim: ' + esc(r.claim) + '</p>'
        + '<p class="rd-rev-pick"><span class="rd-rev-lab">Show the version from</span>'
        + '<label><input type="radio" name="' + n + '" value="was"><span>' + esc(r.wasDate) + '</span></label>'
        + '<label><input type="radio" name="' + n + '" value="now" checked><span>' + esc(r.nowDate) + '</span></label></p>'
        + '<p class="rd-rev-was"><span class="rd-rev-d">' + esc(r.wasDate) + '</span>' + esc(r.was) + '</p>'
        + '<p class="rd-rev-now"><span class="rd-rev-d">' + esc(r.nowDate) + '</span>' + esc(r.now) + '</p>'
        + '<p class="rd-rev-why">' + esc(r.why) + '</p></div>';
    }
    function readCard(item, ns) {
      return '<div class="fl-card rd-card">'
        + '<p class="rd-head"><span class="rd-t">' + esc(item.t) + '</span>'
        + '<span class="rd-scope">' + esc(item.scope) + '</span></p>'
        + bodyHTML(item.body)
        + '<p class="rd-take">' + esc(item.take) + '</p>'
        + revBlock(item, ns || "rd")
        + '<span class="fl-src rd-src">' + esc(item.src)
        + '<a class="rd-link" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">'
        + esc(linkLabel(item.url)) + '</a>'
        + '<span class="rd-date">' + esc(item.date) + '</span></span></div>';
    }
    // the facts on the way in, the resources on the way back - the same split the placards already make,
    // named once here so the panel, the flat step and the case file cannot disagree about it
    const factsOf = id => FACTS[id];
    const resOf = id => RESOURCE_MAP[id].map(k => Object.assign({ t: k }, RES[k]));
    const readItems = (id, returning) => (returning ? resOf(id) : factsOf(id));
    // NOT `.map(readCard)`: map hands its callback an INDEX second, which would arrive as `ns` and
    // name every revision group after its position in the panel. The namespace is explicit.
    const readCards = (id, returning, ns) => readItems(id, returning).map(it => readCard(it, ns)).join("");

    /* ---- C107: the promise, before the reveal and after the return --------------------------------
       THE TWO SIDES ARE NOT THE SAME CONTROL. On the way in the exhibit has not been opened yet, so
       the block is the brochure and one question: which of these three is the strongest promise. On
       the way back the exhibit has been through the reveal, so the block is what was picked, what
       that particular promise turned out to mean, and the same three offered again with each one's
       revised reading printed under it - which is what makes the second screen a COMPARISON rather
       than a second poll.

       NEITHER SIDE BLOCKS ANYTHING. There is no required answer, no disabled NEXT, no gate on walking
       on, and skipping the first question is a state the second screen has its own line for - the
       acceptance is "does not block leaving", and a comparison screen that scolds a visitor for
       having no first answer is the same failure wearing better manners. Nothing is scored: this
       module never compares a `promise` value to a `promiseBack` value for agreement, and there is no
       right answer to which of three lies was the biggest. */
    function promiseOpts(id, when, checked) {
      return PROMISES[id].map(p =>
        '<label class="pm-opt"><input type="radio" name="lbp-' + when + '-' + id + '" value="' + p.k + '"'
        + (checked === p.k ? ' checked' : '') + '>'
        + '<span class="pm-ad">' + esc(p.ad) + '</span>'
        + (when === "after" ? '<span class="pm-rev">' + esc(p.rev) + '</span>' : '')
        + '</label>').join("");
    }
    function promiseBlock(id, returning) {
      if (!returning) {
        return '<div class="rd-promise">'
          + '<p class="pm-h">Before you read it: which promise is the strongest?</p>'
          + '<p class="pm-note">MOM Inc advertised this residence with all three.</p>'
          + promiseOpts(id, "before", ST.promise[id])
          + '<p class="pm-note">Optional, and not scored. You can walk on without answering.</p></div>';
      }
      const chosen = PROMISES[id].filter(p => p.k === ST.promise[id])[0];
      return '<div class="rd-promise">'
        + (chosen
            ? '<p class="pm-h">On the way in, you picked</p><p class="pm-was">' + esc(chosen.ad) + '</p>'
              + '<p class="pm-h">What that one turned out to mean</p><p class="pm-rev pm-rev-was">' + esc(chosen.rev) + '</p>'
            : '<p class="pm-h">On the way in, you did not pick one</p>'
              + '<p class="pm-note">Nothing is held against that. Here is what all three turned out to mean.</p>')
        + '<p class="pm-h">Which one holds up now?</p>'
        + promiseOpts(id, "after", ST.promiseBack[id])
        + '<p class="pm-note">Both answers are kept, side by side. Neither one is marked right.</p></div>'
        + peelBlock(id);
    }

    /* ---- C105: the peel, and why it is a <details> and nothing else -------------------------------
       THE NATIVE ELEMENT IS THE WHOLE IMPLEMENTATION. "Tap-to-open equivalent" is the row's own
       micro-step, and a <summary> already is one: it is a tab stop, it takes Enter and Space, it
       carries its own expanded state to a screen reader, and it needs no listener - which matters
       more here than usual, because this markup is written by innerHTML on three separate reading
       surfaces and a handler bound inside it would have to be re-bound on every render (4.11b's
       delegated-listener rule, avoided rather than obeyed). The PEEL is the ::after flap in the
       stylesheet: a masked layer that lifts off the corner when the element opens.

       IT IS ON THE RETURN LEG ONLY, because it hangs off promiseBlock's returning branch - the same
       branch C107's comparison is in, so it reaches the 3D reading panel and the flat gallery's
       return step from one place and cannot be true on one path and false on the other. C112's
       spotlight renders readCards() and no promise block, so a presenter's read-only link does not
       carry it: peeling somebody else's wallpaper is not a thing a spotlight does.

       The advertised line is REPRINTED above the clause rather than only referenced. The acceptance
       is that the clause develops that promise, and a visitor who scrolled past the brochure cannot
       see it develop anything if the thing being developed is elsewhere on the screen. */
    function peelBlock(id) {
      const c = CLAUSES[id], p = PROMISES[id].filter(x => x.k === c.ref)[0];
      return '<details class="rd-peel">'
        + '<summary class="pl-corner">The wallpaper lifts at the corner. Optional, and nothing is kept.</summary>'
        + '<div class="pl-clause">'
        + '<p class="pl-h">MOM Inc residency agreement, clause ' + esc(c.n) + '</p>'
        + '<p class="pl-ad">Advertised: ' + esc(p.ad) + '</p>'
        + '<p class="pl-text">' + esc(c.text) + '</p>'
        + '<p class="pl-note">MOM Inc\'s own paperwork, written for this exhibit. Fiction, like the brochure it is the small print for.</p>'
        + '</div></details>';
    }

    /* One delegated `change` listener per reading surface, because both the promise radios and the
       version radios live inside markup that innerHTML replaces - a listener bound to the inputs
       themselves would have to be re-bound on every render, and re-binding on a container that
       survives the render is how a handler ends up registered six times and firing six times.

       The version radios change what is ON SCREEN and nothing else: no save, no state, no record of
       which version anybody looked at. The promise radios write, and they write by REPLACING the
       object rather than assigning into it - __lbLoaded is Object.freeze(Object.assign({}, ST)) and
       freeze is SHALLOW, so mutating the map in place would quietly rewrite the loader's own answer
       about what it accepted. Same reason markRead() uses concat. */
    function wireReadInputs(rootEl) {
      ctx.on(rootEl, "change", (ev) => {
        const el = ev.target;
        if (!el || el.type !== "radio") return;
        const n = el.name || "";
        if (n.indexOf("-lbv-") > 0) {
          const box = el.closest(".rd-rev");
          if (box) box.setAttribute("data-v", el.value === "was" ? "was" : "now");
          return;
        }
        const m = /^lbp-(before|after)-(.+)$/.exec(n);
        if (!m) return;
        const ex = EXHIBITS.filter(e => e.id === m[2])[0];
        if (!ex || !PROMISES[ex.id].some(p => p.k === el.value)) return;
        const bag = m[1] === "before" ? "promise" : "promiseBack";
        const next = Object.assign({}, ST[bag]);
        next[ex.id] = el.value;
        ST[bag] = next;
        saveState();
      });
    }

    /* ---- C020: the case file the epilogue hands over -----------------------------------------------
       The row's acceptance is that finishing the museum "creates a useful object and broadcast
       contribution WITHOUT ANOTHER FULL WALK", so this is a button at the end and not a seventh
       exhibit: everything in the file is already in this module, and the walk is what earned the right
       to be standing at the epilogue holding it.

       USEFUL OBJECT is the load-bearing half. A souvenir that says "you walked a museum" is a receipt;
       what a person in this position can use is the eight resources with their phone numbers and their
       SCOPE, the eighteen claims with their sources and dates, and the six transformations with the
       arithmetic shown - so the file is all three, in a plain text/markdown blob that opens in
       anything, needs no network and can be forwarded to somebody else. Nothing in it is a summary:
       every body and every citation is the reviewed string, and the square feet come from sqftAt(),
       4.4's own curve, rather than a second table that could drift off it.

       BROADCAST CONTRIBUTION is the prompt at the foot, and it is a question rather than a form on
       purpose - C008 established this site has no send path, and inventing one would be a new
       capability through CHANGE-GATE rather than a P1 content row. The file carries its own reference
       so a contribution can be matched to the walk that produced it.

       Called from a click on both paths, never at boot: it reads RENT, BASE_SQFT and sqftAt, which are
       `const`s declared further down this module. A function declaration hoists and a const does not,
       which is exactly the TDZ that 4.3's applyMode() had to be moved for - a flat-path visitor whose
       save resumes them AT the epilogue renders that step synchronously at mount. */
    function caseFileText() {
      const stamp = new Date().toISOString().slice(0, 10);
      const n = (v) => v.toLocaleString("en-US");
      const L = [];
      L.push("MOM INC. - RESIDENTIAL COMPRESSION PROGRAM");
      L.push("CASE FILE: LIVING SMALL");
      L.push("Channel 2 - Lil Boyfriend - file LB-2-" + stamp.replace(/-/g, "") + "-" + ST.read.length + "of" + EXHIBITS.length);
      L.push("");
      L.push("THE SIX TRANSFORMATIONS");
      L.push("Starting residence: " + n(BASE_SQFT) + " sq ft. Rent: $" + n(RENT) + " a month, unchanged throughout.");
      L.push("");
      EXHIBITS.forEach((ex, i) => {
        const was = sqftAt(i), now = sqftAt(i + 1);
        L.push("  " + (i + 1) + ". " + ex.label + " - " + n(was) + " sq ft to " + n(now) + " sq ft (-" + n(was - now) + ")"
               + (ST.read.indexOf(ex.id) >= 0 ? "  [opened]" : "  [not opened]"));
      });
      L.push("");
      L.push("  Removed across the six: " + n(LOST) + " square feet.");
      L.push("  Rent charged for them: $" + n(RENT) + " a month, unchanged.");
      L.push("");
      L.push("WHAT THE FILE IS BUILT ON");
      EXHIBITS.forEach(ex => {
        L.push("");
        L.push("## " + ex.label);
        factsOf(ex.id).forEach(f => {
          L.push("");
          L.push("[" + f.t + "] " + (Array.isArray(f.body) ? f.body.join(" ") : f.body));
          L.push("    Scope: " + f.scope);
          L.push("    Takeaway: " + f.take);
          L.push("    Source: " + f.src);
          L.push("    Link: " + f.url + "  (" + f.date + ")");
          /* C111: "revisions never silently substitute into a saved case file." A file that printed
             only the current figure would be doing exactly that - the visitor would be holding a
             number with no way of knowing it had moved, or from what. Both versions, both dates and
             the reason go in, under the claim they belong to. */
          const rv = REVISIONS[f.t];
          if (rv) {
            L.push("    REVISED CLAIM: " + rv.claim);
            L.push("      " + rv.wasDate + ": " + rv.was);
            L.push("      " + rv.nowDate + ": " + rv.now);
            L.push("      Why it changed: " + rv.why);
          }
        });
      });
      /* C107: both answers, side by side, and NOT a mark out of six. The file records what was
         advertised, what this visitor picked before the reveal and what they picked after it, and it
         says out loud that the two disagreeing is not an error - because a column of before/after
         pairs printed with no such line is a scorecard whether it means to be one or not. */
      L.push("");
      L.push("WHAT WAS ADVERTISED, AND WHAT YOU MADE OF IT");
      L.push("Your own answers, kept as you gave them. Nothing here is marked right or wrong, and a");
      L.push("first answer that no longer matches the second is the point of asking twice.");
      EXHIBITS.forEach(ex => {
        const b = PROMISES[ex.id].filter(p => p.k === ST.promise[ex.id])[0];
        const a = PROMISES[ex.id].filter(p => p.k === ST.promiseBack[ex.id])[0];
        L.push("");
        L.push("## " + ex.label);
        PROMISES[ex.id].forEach(p => L.push("    [" + p.k + "] advertised: " + p.ad));
        L.push("    Strongest promise, before the reveal: " + (b ? "[" + b.k + "] " + b.ad : "not answered"));
        L.push("    Still holds up, after the return:     " + (a ? "[" + a.k + "] " + a.ad : "not answered"));
        if (b) L.push("    What that promise turned out to mean: " + b.rev);
      });
      L.push("");
      L.push("IF YOU NEED HOUSING HELP NOW");
      L.push("Read the scope line before you dial: three of these are Southern Nevada only.");
      Object.keys(RES).forEach(k => {
        const r = RES[k];
        L.push("");
        L.push("[" + k + "] " + r.body);
        L.push("    Scope: " + r.scope);
        L.push("    Takeaway: " + r.take);
        L.push("    Source: " + r.src);
        L.push("    Link: " + r.url + "  (" + r.date + ")");
      });
      L.push("");
      L.push("WHAT THE BROADCAST WANTS BACK");
      L.push("Living Small is an episode about a treatment nobody consented to. The programme");
      L.push("measures rooms. It does not measure the people left in them, so that part has to");
      L.push("come from outside the building.");
      L.push("");
      L.push("Answer one question in your own words and bring it to the channel:");
      L.push("");
      L.push("  Which of the six did you recognise, and what gave it away - the room,");
      L.push("  the rent, or the person still living in it?");
      L.push("");
      L.push("Quote the file reference above so your answer can be matched to this walk.");
      L.push("Nothing was sent anywhere when this file was made. It is yours, and it stays");
      L.push("on your machine until you decide otherwise.");
      L.push("");
      L.push(CLOSING_LINE);
      L.push("");
      return L.join("\n");
    }
    /* The download itself. An object URL on a throwaway anchor is the whole mechanism - no library, no
       server, no permission prompt - and the revoke is a PLAIN setTimeout rather than ctx.timeout for
       the reason the photo queue's patience is: check_teardown compares the context's registration
       tally between mounts for EQUALITY, and a tally that moves when somebody clicks a button is a
       flaky gate, not a leak. The URL is revoked either way; the anchor is gone the same tick. */
    function downloadCaseFile() {
      const url = URL.createObjectURL(new Blob([caseFileText()], { type: "text/markdown;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "mom-inc-case-file-living-small.md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) { /* already gone */ } }, 20000);
    }

    // test-only readback for the save-migration fixture check (18.6) - the epilogue phase blocks every normal
    // saveState() path (walking is disabled there), so there is no other way to observe a migrated value
    // without resetting it. Reads ST, changes nothing. Removed in unmount(): it closes over this mount's ST,
    // and a reader that outlives the fragment would be answering about a museum that is no longer there.
    window.__lbState = () => ({ phase: ST.phase, t: ST.t, signed: ST.signed, shrinkStartedAt: ST.shrinkStartedAt, mode: ST.mode, rp: shrinkProgress(), read: ST.read.slice(), taught: taught, mark: markAt(shrinkProgress()), reading: ST.reading, promise: Object.assign({}, ST.promise), promiseBack: Object.assign({}, ST.promiseBack) });
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
      pushTone();     // 4.7: the sound layer belongs to the chapters' timeline. Leaving them silences it.
      if (!modeBtn) return;
      modeBtn.textContent = scroll ? "MUSEUM" : "CHAPTERS";
      modeBtn.setAttribute("aria-label", scroll ? "Switch to the museum walk" : "Switch to the scroll chapters");
    }
    if (modeBtn) ctx.on(modeBtn, "click", () => {
      ST.mode = ST.mode === "scroll" ? "museum" : "scroll";
      saveState();
      applyMode();
    });

    /* ---- C112: a presenter link that opens the case being discussed, read only --------------------
       THE PARAM IS UNTRUSTED INPUT BY C018'S EXACT ARGUMENT. A URL is the one input a visitor does not
       even have to hand-edit - it arrives in a chat message, a lower third, a QR code on a slide - so
       it gets the same treatment `phase`, `read` and `reading` get: it is looked up in EXHIBITS and
       what comes back is THE OBJECT THIS FILE ALREADY HELD. The string itself never reaches innerHTML,
       never selects a code path, and never becomes an id, a class or a key. Anything that is not one
       of the six is not an error, a message or a redirect - it is a museum, which is what the visitor
       came for.

       READ ONLY IS THE OTHER HALF, and it is a claim about what pressing nothing does. Opening this
       view calls no markRead(), writes no ST.reading, moves no phase or position, signs no guest book
       and calls no saveState() - the walk underneath is exactly as it was left, which is what makes
       the link safe to put in front of an audience who each have their own save. Nothing here can
       unlock or complete either: neither of those is reachable from this block.

       It is built BEFORE the render path is chosen so it works on all three presentations - the
       museum, the flat gallery and the scroll chapters - and it is a child of the STAGE rather than
       of .lb-hud for the same reason the mode control is: the flat path removes the whole hud. Placed
       ahead of the branch on purpose, because runFlat()'s first render() snaps ST.phase and ST.t to
       its nearest step, and the resume line below is meant to report the save as the visitor left it. */
    function spotlightCase() {
      let want = "";
      try { want = new URLSearchParams(location.search).get("case") || ""; } catch (e) { want = ""; }
      return EXHIBITS.filter(e => e.id === want)[0] || null;
    }
    const spotEx = spotlightCase();
    if (spotEx) {
      const spot = document.createElement("div");
      spot.className = "lb-panel lb-read lb-spot show";
      spot.id = "lbSpot";
      spot.setAttribute("role", "dialog");
      spot.setAttribute("aria-label", "The case being discussed: " + spotEx.label);
      const started = ST.phase !== "out" || ST.t > 0 || ST.read.length > 0 || ST.signed;
      spot.innerHTML = '<div class="card">'
        + '<p class="sp-badge">The case being discussed &middot; read only</p>'
        + '<h3>' + esc(spotEx.label) + '</h3>'
        + '<p class="sp-sub">Opening this marks nothing as visited, opened or finished. '
        + (started ? 'Your saved walk is untouched: ' + ST.read.length + ' of ' + EXHIBITS.length + ' exhibits opened.'
                   : 'You have not started the walk, and this does not start it.') + '</p>'
        + '<p class="sp-h">The sourced record</p>' + readCards(spotEx.id, false, "sp")
        + '<p class="sp-h">Somewhere to call &mdash; check the scope before you dial</p>'
        + readCards(spotEx.id, true, "sp")
        + '<div class="lb-bookrow"><button type="button" class="skip" id="lbSpotClose">close and go to the museum</button></div>'
        + '</div>';
      lbStage.appendChild(spot);
      ctx.on(spot.querySelector("#lbSpotClose"), "click", () => spot.remove());
      // the version selector still works in here, because it changes what is on screen and nothing
      // else. wireReadInputs' promise branch cannot fire: this view renders no promise block.
      wireReadInputs(spot);
    }

    if (glOK) { lb.classList.add("webgl"); run3D(); } else { lbCanvas.remove(); lbHud.remove(); runFlat(); }
    // applyMode() is NOT called here, and the reason is a TDZ rather than taste: a saved mode of
    // "scroll" makes this call build the chapters immediately, and buildScroll() reads 4.3's RENT,
    // sceneScale and RX - `const`s declared further down, so reaching them from here throws
    // "Cannot access before initialization" for the one visitor who chose the chapters last time.
    // The call is at the bottom of the 4.3 block instead. Function declarations hoist; const does not.

    // =====================================================================================
    // ==== 4.1 / F.2: scroll chapters, the other mode ====
    // =====================================================================================
    /* Six chapters, one per exhibit, in the order the museum walks them - the same six homes, the same
       sourced facts, the same photographs, presented as a vertical read instead of a walk. Nothing here
       is a second copy of the content: EXHIBITS and FACTS are the file's own data and this renders them,
       exactly as runFlat() does. The card and source classes are the flat gallery's too.

       WHAT IS DELIBERATELY NOT HERE, so the next packet does not find it built twice. 4.2 makes each
       chapter sticky and bounds it to one viewport; 4.3 hangs the six consequences off scroll position;
       4.4 makes the shrink exponential and finite; 4.5 built the SHOE as this mode's terminal BEAT and
       4.6 put completion on it. So this mode has an ending, and still no unlock of its own:
       the door, the guest book and the epilogue are the museum's, and the museum is one button away at
       all times, which is what "modes, not a replacement" buys. */

    /* ---- 4.3 / E.5: the six scroll consequences -----------------------------------------------------
       E.5 names six, all six required: the character becomes smaller; the room changes teepee -> shoebox
       -> jar -> car; the monthly price REMAINS FIXED while usable space collapses; the stress meter
       rises; MOM's medical copy becomes increasingly aggressive; and the final scene reveals how much
       space the audience can restore live.

       Five of the six are one readout each, and they only land as satire if they are legible AT ONCE -
       the fixed price next to the collapsing footage is the whole joke, and it does not survive being
       split across five chapters. So they share one strip, the CONSOLE, present at every scroll
       position, and scroll position is the only input.

       THE ROOM IS NOT A SECOND LIST. E.5's teepee -> shoebox -> jar -> car is the chapter sequence this
       channel already has - EXHIBITS runs teepee, car, shoebox, storage, masonjar, van, and all four
       named rooms are in it - so the room readout is `EXHIBITS[n-1].label` and there is nothing to keep
       in step with anything.

       WHAT 4.3 DID NOT BUILD. 4.3 only had to make the shrink observable; the shrink CURVE is 4.4's and
       is the block below. 4.5 owns the shoe and 4.6 owns completion: consequence six is a REVEAL, not a
       door, and nothing in THIS block unlocks, completes or ends the run - 4.5's shoe deliberately
       leaves the give-it-back button working past the terminal. */
    const RENT = 1450;          // consequence 3: this number never moves. That is the entire joke.
    const BASE_SQFT = 240;
    /* ---- 4.4 / S1: the shrink curve, EXPONENTIAL and FINITE ----------------------------------------
       Everything downstream derives from this one expression - the figure's rendered height, sqftAt(),
       LOST, the closing copy - so 4.4 is a curve change and not five call sites. 4.3 shipped a plain
       descent as a placeholder and said so; this is the replacement.

       EXPONENTIAL IS A CLAIM ABOUT RATIOS, not about "a curve". FLOOR^(n/6) is (FLOOR^(1/6))^n, so
       every chapter keeps the same 76.47% of the room the one before it had: 240 -> 184 -> 140 -> 107
       -> 82 -> 63 -> 48 sq ft. That reads differently from 4.3's straight line and the difference is
       the satire: the first cut is the biggest and each one after it is smaller, which is how a squeeze
       that is always "only a little more this time" ends at a fifth of a room. The driver takes the
       ratio off the RENDERED figure and rejects the equal bites of a linear descent.

       FINITE IS THE CLAMP, and it is the difference between a bound and an asymptote. The line this
       replaces went NEGATIVE past chapter seven; a bare exponential instead approaches zero forever.
       Clamped to [0, EXHIBITS.length] the curve simply STOPS at the sixth chapter, so "defined and
       non-zero at chapter 6" holds by construction rather than by luck, and FLOOR is a floor.

       THE ENDPOINTS DO NOT MOVE. FLOOR stays 0.2, so sqftAt(6) is still 48 and LOST is still 192 -
       4.3's reviewed closing copy, GIVE_STEP and the driver's own LOST constant all stand. 4.4 was
       asked for the SHAPE of the shrink; re-cutting numbers 4.3 already shipped would be a content
       change wearing a curve's clothes. FLOOR is also what keeps the character on screen:
       `height:calc(38px * var(--lb-scale))` makes chapter six 7.6px of person - small, still a person.
       A curve that merely tends to zero is arithmetically non-zero at a size no one can see, which is
       why the driver's floor is measured in pixels rather than as `> 0`. */
    const FLOOR = 0.2;          // the scale after chapter six: reached, not approached
    const sceneScale = (n) => Math.pow(FLOOR, Math.min(Math.max(n, 0), EXHIBITS.length) / EXHIBITS.length);
    const sqftAt = (n) => Math.round(BASE_SQFT * sceneScale(n));
    const LOST = BASE_SQFT - sqftAt(EXHIBITS.length);
    const GIVE_STEP = LOST / 8;

    /* consequence 5, and the severity word is VISIBLE COPY drawn from an ORDERED vocabulary rather than
       a data attribute. "Increasingly aggressive" then reads off the screen the visitor is looking at -
       a source that scores its own escalation in a hidden number is its own witness, which is the one
       thing a check here must not accept. Index 0 is the entrance, before any chapter. */
    const RX = [
      ["INTAKE", "Your residence is larger than your income supports."],
      ["ADVISORY", "Mild compression. Most patients adjust within a cycle."],
      ["RECOMMENDED", "Dose increased. The discomfort is the treatment."],
      ["PRESCRIBED", "Surplus belongings are a symptom. Dispose of them."],
      ["MANDATORY", "Do not measure the room. It worsens outcomes."],
      ["ENFORCED", "Your complaint is now a condition. The unit complies."],
      ["FINAL", "Terminal size. Dissatisfaction is treated, not housed."]
    ];

    let consoleEl = null, scene = -1, restored = 0;
    const ratios = new Array(EXHIBITS.length + 1).fill(0);

    function renderScene() {
      if (!consoleEl) return;
      const n = Math.max(0, scene);
      // consequence 6 feeds back in here: restored square footage is added to whatever the scene left,
      // so giving it back grows the figure and the footage LIVE rather than printing a separate number.
      const shown = Math.min(BASE_SQFT, sqftAt(n) + restored);
      consoleEl.style.setProperty("--lb-scale", (shown / BASE_SQFT).toFixed(4));
      consoleEl.dataset.scene = String(n);
      byId("lbRoom").textContent = n ? EXHIBITS[n - 1].label : "THE ENTRANCE";
      byId("lbSqft").textContent = Math.round(shown) + " sq ft";
      byId("lbPrice").textContent = "$" + RENT.toLocaleString("en-US") + "/mo";
      byId("lbRxSev").textContent = RX[n][0];
      byId("lbRx").textContent = RX[n][1];
      const pct = n * 16;
      byId("lbStressFill").style.width = pct + "%";
      byId("lbStressPct").textContent = pct + "% COMPRESSION";
      /* 4.7/E.7: the other two layers hang off the SAME `shown` the character does, here, rather than
         off a timeline of their own. "Synchronized" is not four things that each happen to move - it is
         four things that cannot disagree, and the cheapest way to guarantee that is one write site.
         --lb-close goes on the scroll run because the six sticky chapters inherit it (one write, not
         six); the tone reads --lb-scale straight back off the strip, so it follows GIVE IT BACK too. */
      if (scrollEl) scrollEl.style.setProperty("--lb-close", (1 - shown / BASE_SQFT).toFixed(4));
      pushTone();
    }

    function setScene(n) {
      if (n === scene) return;
      scene = n;
      renderScene();
      /* E.5's meter call, and it happens PER INTERSECTION rather than per frame - which is also what
         C016 asks of this channel's writes. MBS.meter IS the progress write in this tree: tv.js paints
         the set's gauge and mbs-shim.js paints the standalone bar AND emits GAME_PROGRESS on the wire.
         E.5 also names `MBS.progress.set`; no such API exists anywhere in tv/, and adding one is a new
         shared surface through CHANGE-GATE, not a line in a channel packet. */
      if (n > 0 && ctx.mbs && ctx.mbs.meter) ctx.mbs.meter(n * 16, "COMPRESSION");
    }

    /* ---- 4.5: the shoe, this mode's terminal state -------------------------------------------------
       "After chapter 6 a large shoe falls on the character and ends the run." Three conditions, and the
       row names all three on purpose because no two of them are the same test.

       AFTER CHAPTER SIX IS NOT AT CHAPTER SIX, and that is why the end section is observed rather than
       the trigger hanging off setScene(6). Chapter six becomes the scene the moment it is 65% on screen
       - a third of the way through its own facts - and a shoe there lands on a visitor still reading.
       The end section rising is the signal that chapter six is BEHIND them. It is observed through the
       same IntersectionObserver and kept in its own variable rather than being given a data-chapter:
       the scroll run has exactly six chapters, several gates count them, and a seventh entry in that
       set to carry a sentinel would be a lie told to the cheapest thing to check.

       ONLY ONCE THE DIAGNOSIS HAS RENDERED is read OFF THE DOM, not off `scene`. MOM's prescription at
       chapter six is the diagnosis - RX[6], "FINAL / Terminal size" - and the difference between asking
       the console what it is showing and asking the module what it last set is the difference between a
       gate and a restatement. Sticky chapters mean the end section can only be up if chapter six has
       already rendered, so this is belt as well as braces, and it is the belt the row asked for.

       EXACTLY ONCE is a latch, not an event count. The observer fires again on every threshold cross,
       and scrolling back up and down again is an ordinary thing to do in a scroll piece.

       WHAT ENDS AND WHAT DOES NOT. The run ends: the state is latched terminal and the character is
       under a shoe. Consequence 6 does NOT - `#lbRestore` is a REVEAL and the give-it-back button keeps
       working, because the whole point of the closing scene is that the 192 sq ft are still on the table
       after the programme has finished with the resident. Nothing here touches --lb-scale either: a
       shoe that flattened the figure would take 4.4's finite floor and 4.3's live restore with it, and
       the beat does not need it - the sole lands across a 7.6px person and covers most of them.

       4.6 / D.1.10 (C018): THE LATCH IS THE EMISSION SITE. `terminal = true` is the one assignment in
       this channel that means "the run reached its end", so the complete() call goes on it and nowhere
       else - not on the class, not on the observer, not on the end section rising. The three guards
       above are already exactly the idempotency the contract asks for: scrolling back up and down again
       re-enters dropShoe() and returns at the first line, so completion is emitted once per run without
       a second flag to keep in step with the first.

       THE MUSEUM DOOR IS NOT THIS CHANNEL'S TERMINAL, and the two calls are deliberately in two places.
       fireConnect() unlocks at the door because the glass in the hole is the secret; the shoe completes
       because the shoe is the end. D.1.10's contract is that the pair is order-independent, and this
       channel is the one where the orders genuinely differ: scroll mode never reaches the door, so at
       the shoe complete() is usually the first call and the wire carries {terminal:"shoe"}. A visitor
       who walked the museum first has already spent unlock()'s TRANSITIONAL emission (mbs-shim.js:124),
       which shares complete()'s per-site guard, so this call is a silent no-op for that run and the
       wire carries {nodes,need} instead. Both are one GAME_COMPLETE for the site, which is the contract;
       the driver drives both orders, and the packet that removes that transitional emission changes
       nothing here. Nothing is banked and nothing is painted - completion is not progress, the node is. */
    const SHOE_LINE = "A shoe the size of the building comes down on the resident. The programme ends here.";
    let terminal = false, endRatio = 0;
    function dropShoe() {
      if (terminal) return;                                                 // exactly once
      if (endRatio < 0.65) return;                                          // after chapter six
      if (byId("lbRxSev").textContent !== RX[EXHIBITS.length][0]) return;   // the diagnosis is on screen
      terminal = true;
      ctx.mbs && ctx.mbs.complete && ctx.mbs.complete("lilboyfriend", { terminal: "shoe" });
      scrollEl.classList.add("shoe-dropped");
      consoleEl.dataset.terminal = "1";
      byId("lbShoeSaid").textContent = SHOE_LINE;
    }

    /* ---- 4.7 / E.7: THE FOURTH LAYER, and the choice that gates it ---------------------------------
       The Boat is four synchronized layers - background, character, text, sound - and three of them
       were already here and already driven: 4.2's paper, 4.4's figure under --lb-scale, 4.3's chapter
       copy and console strip. 4.7 adds SOUND, gives the background something to do (renderScene above),
       and puts the audio behind an explicit choice. All four now read one number, so the acceptance's
       "advance together" is true by construction rather than by four things being kept in step.

       NO AUDIO BEFORE THE CHOICE IS ENFORCED BY NOT HAVING AN AUDIOCONTEXT. A muted <audio>, a
       suspended context, an autoplay-blocked element - all three are "no sound came out" for reasons
       the browser owns, not reasons this channel owns, and a gate that reads `paused` or `.muted` is
       passed by a policy rather than by the build. Nothing here constructs anything audible until the
       button is pressed; the driver counts AudioContext constructions and OscillatorNode.start() calls
       at the platform boundary, and both are zero across a whole six-chapter scroll.

       WHY THE TONE IS SYNTHESIZED. This repo has no audio assets and corgi and djscratch both already
       make their sound out of oscillators through ctx.audio - so the room tone is one sine through one
       gain, and adding the first binary asset to the tree for a hum would be the expensive way round.
       The pitch is TONE_HZ / scale, which is the same curve as the character: 68Hz of room at the
       entrance rises to 340Hz at chapter six, and hands back down again under GIVE IT BACK. A hum that
       becomes a whine as the walls arrive is the sound layer doing what the other three do.

       IT GOES THROUGH ctx.audio, which is the whole teardown contract - an AudioContext outliving its
       mount is a channel still making noise into a page that has moved on, and check_teardown is what
       notices. The oscillator dies with the context; there is nothing else to unwind.

       THE CHOICE IS A TOGGLE AFTER THE FIRST PRESS. "Enter with sound" is the opt-in the row names, but
       a piece that cannot be silenced once entered has taken the choice back. Muting is the gain, not
       the context: closing and rebuilding a context per press is how a channel runs out of them. */
    const TONE_HZ = 68, TONE_LEVEL = 0.045;
    const soundBtn = byId("lbSoundBtn");
    let actx = null, osc = null, toneGain = null, soundOn = false;

    // the scale is read back off the strip the character is drawn from, so the tone cannot drift from
    // the figure even by one write - there is no second copy of the number to drift from.
    function currentScale() {
      const v = consoleEl && parseFloat(consoleEl.style.getPropertyValue("--lb-scale"));
      return v > 0 ? v : 1;
    }

    function pushTone() {
      if (!toneGain) return;
      const t = actx.currentTime;
      // the museum is not this timeline. Its mode has no scenes for a layer to ride, so the tone goes
      // to silence there and comes back on return - by GAIN, so the choice itself is not forgotten.
      const audible = soundOn && ST.mode === "scroll";
      toneGain.gain.setTargetAtTime(audible ? TONE_LEVEL : 0, t, 0.08);
      osc.frequency.setTargetAtTime(TONE_HZ / Math.max(FLOOR, currentScale()), t, 0.15);
    }

    let lastFootstep=0;
    function playEffect(laser=false){
      if(!soundOn||!actx)return;
      const t=actx.currentTime;if(!laser&&t-lastFootstep<.36)return;if(!laser)lastFootstep=t;
      const o=actx.createOscillator(),g=actx.createGain();o.type=laser?'sawtooth':'triangle';o.frequency.setValueAtTime(laser?1600:110,t);o.frequency.exponentialRampToValueAtTime(laser?75:42,t+(laser?.55:.13));g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(laser?.10:.13,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+(laser?.6:.17));o.connect(g).connect(actx.destination);o.start();o.stop(t+(laser?.65:.2));o.onended=()=>{o.disconnect();g.disconnect();};
    }
    ctx.on(lb,'pointerdown',()=>{if(!actx)soundBtn?.click();},{once:true});ctx.on(lb,'keydown',()=>{if(!actx)soundBtn?.click();},{once:true});
    function labelSound() {
      if (!soundBtn) return;
      soundBtn.textContent = soundOn ? "SOUND ON" : actx ? "SOUND OFF" : "ENTER WITH SOUND";
      soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
      soundBtn.setAttribute("aria-label", soundOn ? "Turn the sound off" : "Play the chapters with sound");
    }

    if (soundBtn) ctx.on(soundBtn, "click", () => {
      if (!actx) {
        try { actx = ctx.audio(new (window.AudioContext || window.webkitAudioContext)()); }
        catch { soundBtn.disabled = true; soundBtn.textContent = "NO SOUND"; return; }
        osc = actx.createOscillator();
        toneGain = actx.createGain();
        osc.type = "sine";
        osc.frequency.value = TONE_HZ;
        toneGain.gain.value = 0;          // the ramp is pushTone's; nothing is ever audible unramped
        osc.connect(toneGain).connect(actx.destination);
        osc.start();
      }
      if (actx.state === "suspended") actx.resume().catch(() => {});
      soundOn = !soundOn;
      pushTone();
      labelSound();
    });

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
            ${FACTS[ex.id].map(f => `<div class="fl-card">${bodyHTML(f.body)}<span class="fl-src">${f.src}</span></div>`).join("")}
          </div>
        </section>`).join("");
      scrollEl.innerHTML = `
        <section class="lb-ch" id="lbChIntro">
          <div class="lb-ch-inner">
            <span class="fl-name">${TITLE_TEXT.h1}</span>
            <p class="fl-sub">${TITLE_TEXT.h2}</p>
            <div class="fl-lead">${bodyHTML(TITLE_TEXT.body)}</div>
            <p class="fl-sub">Scroll. Six chapters. The walk is still there - the control at the top right goes back to it.</p>
          </div>
        </section>${chapters}
        <section class="lb-ch" id="lbChEnd">
          <div class="lb-ch-inner">
            <span class="fl-name">${CLOSING_LINE}</span>
            <div class="lb-restore" id="lbRestore">
              <p class="fl-sub">Removed across the six chapters: ${LOST} square feet. Rent charged for them: $${RENT.toLocaleString("en-US")} a month, unchanged.</p>
              <p>Every one of those ${LOST} square feet can be handed back, and the people watching are the ones who hand them back. Restored so far: <b id="lbGiven">0</b> of ${LOST} sq ft.</p>
              <button type="button" class="lb-give" id="lbGive">GIVE IT BACK</button>
            </div>
          </div>
        </section>
        <div class="lb-console" id="lbConsole" data-scene="0">
          <div class="lb-fig" id="lbFig" aria-hidden="true"><i></i></div>
          <div class="lb-con-body" aria-live="polite">
            <p class="lb-con-row"><b id="lbRoom"></b><span id="lbSqft"></span><span class="lb-con-price" id="lbPrice"></span></p>
            <p class="lb-con-row lb-con-bar"><span class="lb-stress"><i id="lbStressFill"></i></span><span class="lb-con-pct" id="lbStressPct"></span></p>
            <p class="lb-con-rx"><b id="lbRxSev"></b> <span id="lbRx"></span></p>
          </div>
        </div>
        <div class="lb-shoe-lane" id="lbShoeLane">
          <div class="lb-shoe" id="lbShoe" aria-hidden="true"></div>
          <p class="lb-shoe-said" id="lbShoeSaid" role="status"></p>
        </div>`;
      lbStage.appendChild(scrollEl);
      consoleEl = byId("lbConsole");

      /* STICKY CHAPTERS NEVER UN-INTERSECT, and that is the one thing E.5's "IntersectionObserver at
         threshold 0.65" does not anticipate. 4.2 pins every chapter at top:0 for the rest of the run,
         so once chapter 1 is on screen its ratio stays 1 and so does every earlier chapter's -
         IntersectionObserver reports geometry, and a chapter buried under four others is not occluded
         as far as it is concerned. Reading `entry.isIntersecting` the obvious way would therefore park
         the scene on chapter 1 for the whole scroll. The chapter at 0.65 is the HIGHEST-numbered one
         over the threshold, not the only one, so the ratios are kept and the maximum is taken. */
      const io = ctx.observe(new IntersectionObserver(entries => {
        for (const e of entries) {
          // 4.5's end sentinel rides the same observer. It is kept out of `ratios` deliberately: that
          // array is the six chapters and nothing else, and setScene() must never be able to reach it.
          if (e.target.id === "lbChEnd") endRatio = e.intersectionRatio;
          else ratios[+e.target.dataset.chapter] = e.intersectionRatio;
        }
        let n = 0;
        for (let i = 1; i <= EXHIBITS.length; i++) if (ratios[i] >= 0.65) n = i;
        setScene(n);
        dropShoe();   // AFTER setScene, so the diagnosis it gates on is the one now on screen
      }, { root: scrollEl, threshold: [0, 0.65, 1] }));
      scrollEl.querySelectorAll(".lb-ch[data-chapter], #lbChEnd").forEach(c => io.observe(c));

      /* consequence 6. A BUTTON, not a slider: 4.2's contract is that no chapter needs precision
         movement, and a drag target inside this run is the thing that check fails on. It restores in
         eight equal handfuls up to the full amount taken and then stops - the reveal is that the whole
         192 is on the table, not that it is infinite. Nothing here unlocks or completes: the shoe is
         4.5/4.6's, and this is a reveal rather than a door. */
      const give = byId("lbGive"), given = byId("lbGiven");
      ctx.on(give, "click", () => {
        restored = Math.min(LOST, restored + GIVE_STEP);
        given.textContent = String(Math.round(restored));
        give.disabled = restored >= LOST;
        renderScene();
      });

      setScene(0);
      return scrollEl;
    }

    // the deferred boot call: everything buildScroll() reaches for now exists. See the note above.
    applyMode();

    // =====================================================================================
    // ==== 3D path ====
    // =====================================================================================
    function run3D() {
      const HALL_LEN = 60, START_Z = -1, END_Z = START_Z - HALL_LEN, CENTER_Z = (START_Z + END_Z) / 2;
      // the ceiling no longer descends (that read as the walls cropping the view, per Ian) - CEIL_H is fixed.
      // What "vanishes" instead is fog: near/far pull in as the return-trip shrink progresses, so the far hall
      // and its ceiling fade into darkness rather than being pressed down onto the player.
      // C017: WALL_OUT, WALL_IN, MARKS and wallHalf() are module scope now - the flat fallback narrates
      // the same marks, and one geometry cannot be kept in step with itself in two files' worth of scope.
      const CEIL_H = 3.0, EYE_OUT = 1.5, EYE_IN = 0.9;
      const FOG_NEAR_OUT = 95, FOG_FAR_OUT = 115, FOG_NEAR_IN = 5, FOG_FAR_IN = 13;
      const WALK_SPEED = 1.6 / HALL_LEN;
      const GUESTBOOK_P = 0.035, GUESTBOOK_SIDE = -1, TITLE_P = 0.06, TITLE_SIDE = 1, FUSEBOX_P = 1;
      const zAt = p => START_Z - p * HALL_LEN;
      const eyeY = rp => EYE_OUT + (EYE_IN - EYE_OUT) * rp;
      const loom = rp => 1 + 0.6 * rp;

      const hint = byId("lbHint"), prompt = byId("lbPrompt"), shrinkNote = byId("lbShrink"), routeEl = byId("lbRoute");
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
        function stoneTexture(floor=false){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=floor?'#4f3542':'#d5c3a2';x.fillRect(0,0,512,512);for(let i=0;i<14000;i++){const a=Math.random()*.08;x.fillStyle='rgba('+ (Math.random()>.5?'255,255,255':'0,0,0')+','+a+')';x.fillRect(Math.random()*512,Math.random()*512,2,2);}x.lineWidth=3;x.strokeStyle=floor?'#c0a06a':'#917b60';for(let y=0;y<=512;y+=128){x.beginPath();x.moveTo(0,y);x.lineTo(512,y);x.stroke();for(let xx=(y%256?128:0);xx<512;xx+=256){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+128);x.stroke();}}for(let n=0;n<16;n++){x.strokeStyle='rgba(255,235,198,.12)';x.lineWidth=1;x.beginPath();x.moveTo(0,n*32);for(let xx=0;xx<=512;xx+=16)x.lineTo(xx,n*32+Math.sin(xx*.035+n)*11);x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(floor?2:14,floor?24:3);t.anisotropy=8;return t;}
        const wallMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), bumpMap:stoneTexture(), bumpScale:.035, roughness: .78, metalness: 0, side: THREE.BackSide });
        const hallGeo = new THREE.BoxGeometry(1, 1, HALL_LEN + 8);
        hallGeo.translate(0, 0.5, 0);
        const hallMesh = new THREE.Mesh(hallGeo, [wallMat,wallMat,wallMat,new THREE.MeshStandardMaterial({map:stoneTexture(true),roughness:.38,metalness:.12,side:THREE.BackSide}),wallMat,wallMat]); hallMesh.name = "hall";
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

        /* ---- C017: the floor ruler. Eight rails - the four MARKS half-widths, mirrored - running the
           whole length of the hall at the widths the wall passes through on its way in. They are the
           one thing in this room that never moves, which is the entire trick: a wall closing in an
           empty corridor has nothing to close ON, and the contraction reads as a camera effect. With
           the rails laid down first, the wall visibly eats one per third of the 37.5 seconds and the
           visitor can count what is left.

           Nothing here is animated and nothing here reads a clock. Occlusion does the work for free:
           the hall is a BackSide box, so a rail outside the current wall plane is simply behind it and
           the depth test hides it. y=0.02 puts them ABOVE the runner rug (0.01), so the innermost pair
           crosses the wine felt rather than disappearing under it, and MeshStandardMaterial means they
           take the cold light on the return with everything else. One geometry and one material for
           all eight; unmount()'s traverse disposes both several times over, which its own note already
           records as safe. */
        const railMat = new THREE.MeshStandardMaterial({ color: 0xe6c67a, roughness: 0.85, metalness: 0 });
        const railGeo = new THREE.PlaneGeometry(0.06, HALL_LEN + 8);
        MARKS.forEach(m => [-1, 1].forEach(s => {
          const rail = new THREE.Mesh(railGeo, railMat);
          rail.name = "rail";   // read back by the gate off the real scene graph, see __lbHall below
          rail.rotation.x = -Math.PI / 2;
          rail.position.set(s * m, 0.02, CENTER_Z);
          scene.add(rail);
        }));

        scene.add(new THREE.HemisphereLight(0xfff6e6, 0x241d14, 0.65));
        const ambient = new THREE.AmbientLight(0xffffff, 0.55);   // flat, no-normal-dependent floor so a
        scene.add(ambient);                                        // ceiling/wall facet can never render pure black
        const hallLights = [];
        for (let z = START_Z; z >= END_Z; z -= 8) {
          const pl = new THREE.PointLight(0xfff0d0, 1.4, 16, 1.6);
          pl.position.set(0, 2.6, z); scene.add(pl); hallLights.push(pl);
        }
        const WARM_LIGHT = new THREE.Color(0xfff0d0), COLD_LIGHT = new THREE.Color(0x9fb8dd);

        /* ---- the photographs. C015: loaded in walking order, not all at once.
           This used to build twelve promises and hand the lot to Promise.all, with the entire boot -
           camera, resume, first frame, the whole museum - waiting behind the slowest of the twelve.
           One exhibit at the far end of the hall, slow to answer, held the entrance shut. Now the boot
           waits for ONE image (see the readiness below) and the other eleven queue behind it in the
           order the walk meets them, each painted onto its own frame the moment it lands.

           Every one that lands is still pushed onto gl.extra: only the CURRENTLY SHOWN photograph is
           ever a live material.map, so the scene walk in unmount() would reach one of the twelve and
           miss eleven.

           `paint` is why the return leg never reveals a blank frame. photoMat ships with no map at
           all, so an exhibit with nothing loaded is a WHITE rectangle - and a visitor resuming into
           the return leg wants six horror photographs that have not been fetched yet. paint hangs the
           best AVAILABLE picture for the phase the museum is in: the one this side wants, or the other
           side of the same pair standing in until it arrives. Every place that used to swap a map by
           hand - the boot, the door, walk again - calls it instead, so there is one rule for which
           photograph is on a wall rather than four. */
        const loader = new THREE.TextureLoader();
        const tex = {};
        const LOAD_MS = 3000;
        function paint(e) {
          lb.dataset.returning=String(isReturning());
          const want = isReturning() ? e.texKeyHorror : e.texKeyCozy;
          const m = tex[want] || tex[e.texKeyCozy] || tex[e.texKeyHorror] || null;
          if (e.photoMat.map !== m) { e.photoMat.map = m; e.photoMat.needsUpdate = true; }
        }
        // One url, one retry, and it NEVER rejects: a photograph that will not come is a frame that
        // keeps the picture it already has, not a dead boot. Resolves the texture, or null.
        function loadTex(url, retry = 1) {
          if (tex[url]) return Promise.resolve(tex[url]);
          return new Promise(res => {
            let done = false, tid = 0;
            const settle = v => { if (done) return; done = true; clearTimeout(tid); res(v); };
            /* A request that never answers must not hold the queue - or the entrance - behind it.
               A plain setTimeout rather than ctx.timeout, cleared on every path that settles: this
               fires up to twelve times a mount as the queue advances, and check_teardown compares the
               context's tally between mounts for EQUALITY, so a registration whose count depends on
               how far the queue happened to have got is a flaky gate rather than a caught leak. If the
               photograph lands after its patience ran out, the load handler below still calls paint
               and it goes up on the wall late. */
            tid = setTimeout(() => settle(null), LOAD_MS);
            loader.load(url, t => {
              t.colorSpace = THREE.SRGBColorSpace;
              if (!gl || session !== mine) { t.dispose(); return settle(null); }   // landed after the channel left
              tex[url] = t; gl.extra.push(t);
              exhibitObjs.forEach(paint);
              settle(t);
            }, undefined, () => {
              console.error("[lb] photo failed to load", url);
              if (retry > 0) settle(loadTex(url, retry - 1)); else settle(null);
            });
          });
        }

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
          // 4.10: an array body is bullet points on the wall too, not only in the DOM cards - the placard
          // IS the wall information the row is about, and the flat card is its stand-in for a machine
          // that cannot render one. A string body draws exactly as before, gap and all.
          if (body) {
            const items = Array.isArray(body) ? body.map(s => "• " + s) : [body];
            x.font = `${fBody}px Georgia, 'Times New Roman', serif`;
            for (const it of items) y = drawWrapped(x, it, pad, y, w - pad * 2, lhBody) + (items.length > 1 ? 8 : 0);
            y += 14;
          }
          if (source) { x.font = `italic ${fSource}px Georgia, 'Times New Roman', serif`; x.fillStyle = "rgba(26,20,16,.66)"; drawWrapped(x, source, pad, y, w - pad * 2, lhSource); }
          x.shadowColor = "transparent";
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
        }
        /* placard canvas: 800x900. C014 CHANGED WHAT GOES ON IT, and that is the "instead of" half of
           the ticket rather than a styling choice. It used to carry the whole body and the whole
           citation - a paragraph painted into a texture, with a picture of a URL underneath. Nobody
           can select that, copy it, hand it to a screen reader or open it, which is the entire list of
           things the row asks for. So the wall keeps what a wall label is for - which claim this is,
           what it covers, and the one line to walk away with - and the words themselves are read in
           #lbRead, where they are text.
           The type gets bigger for free: three short fields on the same 800x900 canvas, so the
           takeaway lands well above the 14 CSS px floor the original body text was sized to at the
           1.5-unit standing distance. */
        function makePlacardTexture(item) {
          return makeSignTexture({ w: 800, h: 900, title: item.t, body: item.take, source: item.scope,
                                   fTitle: 52, fBody: 62, fSource: 38, lhTitle: 60, lhBody: 74, lhSource: 46, pad: 46 });
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
        /* ---- C102: the authored figure standing in every case ------------------------------------
           A CASE WITH NOTHING KNOWN IN IT HAS NO SCALE. Six residences behind six identical panes,
           each holding a photograph shrunk to CASE_SCALE, and nothing anywhere says how big any of
           them is - which is the row's whole complaint. The fix is the oldest one in architectural
           drawing: put a person in it. One authored silhouette, ONE height, in all six, so the cases
           are read against each other instead of each against itself.

           AND THAT IS THE ONLY CLAIM IT MAKES. The figure carries no texture, no plate, no caption
           and no dimension - `figureMat` has no `map`, and the gate asserts that rather than trusting
           it - because "a person is about this big" is knowledge a visitor already has, and the
           moment a number is printed beside it this channel has invented a measurement on a wall
           where every other figure is sourced, cited and dated. Relative space, no measurement claim:
           the acceptance, in the two halves it is actually made of.

           THE TRANSFORM IS RECORDED PER EXHIBIT, NOT BAKED INTO THE ROOM. CASE_FIGURE is where each
           one stands - `d` its depth across the case's readable gap, `z` its place across the case,
           `ry` the turn off square - and the mesh is a child of caseDecor, so the mirroring
           by `side` is done once, by the group the case is already mirrored with, and the walls
           closing move all six for free. Nothing below reads a world coordinate: a position written
           in room coordinates is a position that has to be re-eyeballed the next time the hall moves.

           ONE GEOMETRY AND ONE MATERIAL FOR ALL SIX, shared instances rather than six clones - which
           is what "consistent model scale" means when it is being enforced rather than asserted. Six
           meshes that merely happen to agree today are six meshes that can drift apart in one edit;
           these cannot, and the gate reads the uuids back to say so. The outline is a single closed
           contour (legs, torso, arms down, neck, head) authored at height 1 and scaled by FIGURE_H,
           so the height is one number in one place. */
        const FIGURE_H = 0.34;
        const FIGURE_OUTLINE = [
          [-0.055, 0], [-0.055, 0.42], [-0.080, 0.44], [-0.080, 0.58], [-0.106, 0.61], [-0.106, 0.80],
          [-0.070, 0.83], [-0.048, 0.845], [-0.030, 0.858], [-0.030, 0.876], [-0.058, 0.896],
          [-0.058, 0.956], [-0.030, 0.996], [0.030, 0.996], [0.058, 0.956], [0.058, 0.896],
          [0.030, 0.876], [0.030, 0.858], [0.048, 0.845], [0.070, 0.83], [0.106, 0.80], [0.106, 0.61],
          [0.080, 0.58], [0.080, 0.44], [0.055, 0.42], [0.055, 0], [0.017, 0], [0.017, 0.40],
          [-0.017, 0.40], [-0.017, 0]
        ];
        const figureShape = new THREE.Shape(FIGURE_OUTLINE.map(p => new THREE.Vector2(p[0], p[1])));
        const figureGeo = new THREE.ShapeGeometry(figureShape);
        // unlit and pale on purpose: the alcove behind it is dark felt and the spot swings cold on the
        // return, so a lit figure would read at a different value in every case it is meant to be the
        // constant in. MeshBasicMaterial has no map, which is also the gate's evidence that it carries
        // no caption.
        const figureMat = new THREE.MeshBasicMaterial({ color: 0xd9cba6, side: THREE.DoubleSide });
        /* THE DEPTH IS THE GAP, NOT THE RECESS. `alcoveGeo` is a SOLID box set into the wall - the
           thing a visitor sees is its near face - so the case's readable volume is the 0.02 between
           that face (side*0.01) and the glass pane in front of it (-side*0.01). `d` is where in that
           gap this exhibit's figure stands, 0 at the glass and 1 at the panel; `ry` is small for the
           same reason, because a flat silhouette turned far enough would push a shoulder through the
           panel behind it. `z` keeps every one of them clear of the shrunk photograph, which is 0.225
           either side of centre. */
        const FIGURE_GAP = 0.016;
        const CASE_FIGURE = {
          teepee:   { d: 0.52, z:  0.30, ry:  0.10 },
          car:      { d: 0.68, z: -0.31, ry: -0.12 },
          shoebox:  { d: 0.34, z:  0.27, ry: -0.06 },
          storage:  { d: 0.61, z: -0.28, ry:  0.11 },
          masonjar: { d: 0.45, z:  0.32, ry: -0.03 },
          van:      { d: 0.57, z: -0.26, ry:  0.08 }
        };
        // the alcove's own floor, which is what every one of them stands on - derived from the case
        // constants above rather than typed as a sixth number that could drift off them
        const FIGURE_FLOOR = CASE_CY - (CASE_H - 0.05) / 2;

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
            const m = new THREE.Mesh(new THREE.PlaneGeometry(PLACARD_W, PLACARD_H), new THREE.MeshBasicMaterial({ map: makePlacardTexture(f) }));
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

          // C102: and the person standing in it, at the one height, on the alcove floor, facing out
          // of the case the way every other wall piece does plus this exhibit's own recorded turn.
          const fg = CASE_FIGURE[ex.id];
          const figure = new THREE.Mesh(figureGeo, figureMat);
          figure.name = ex.id + "-figure";
          figure.position.set(ex.side * (FIGURE_GAP * (fg.d - 0.5)), FIGURE_FLOOR, fg.z);
          figure.rotation.y = -ex.side * Math.PI / 2 + fg.ry;
          figure.scale.setScalar(FIGURE_H);
          caseDecor.add(figure);

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

        /* ---- C110: the lens, which now MAGNIFIES ------------------------------------------------
           WHAT WAS WRONG WITH IT. The quad sampled the whole photograph across its own uv and bent it
           with a barrel remap - uv' = 0.5 + (uv-0.5)*(1+k*r^2) - so it showed the entire picture,
           slightly warped, at roughly the size the picture already was. A magnifying glass that
           shows you all of the thing, distorted, is a paperweight. Three changes, one each for the
           row's three micro-steps.

           (1) THE SAMPLE IS A CLIPPED CROP. `zoom` divides the sampled offset, so the disc reads a
           1/zoom-wide window of the photograph rather than all of it, and the `r > 0.5` discard that
           was already here is what clips it to the glass.

           (2) THE CROP IS CENTRED ON THE POINT THE GLASS IS OVER, not on the middle of the picture.
           `centre` is written every frame from the camera's own forward ray against the photograph's
           plane, in the PHOTOGRAPH's local frame - which is the only way "stays aligned during
           movement" can be true while the head is still turning under the zoom's yaw lerp. A fixed
           0.5,0.5 would be aligned in exactly one pose and would drift out of it for the 450ms the
           glass takes to rise.

           (3) THE REFRACTION IS RESTRAINED AND LIVES AT THE RIM. `smoothstep(REF_FROM, 0.5, r)` gates
           the bend, so the middle of the disc - the point the visitor is actually inspecting - is
           sampled straight, and the glass reads as glass only where a real one bends: at its edge.
           The old build bent the centre hardest of all, which is the one part it must not touch. */
        const LENS_ZOOM = 2.6, LENS_REF_FROM = 0.34;
        const lensMat = new THREE.ShaderMaterial({
          transparent: true, depthTest: false, depthWrite: false,
          uniforms: {
            map: { value: null }, aspect: { value: PHOTO_W / PHOTO_H }, k: { value: 0.35 },
            zoom: { value: LENS_ZOOM }, refFrom: { value: LENS_REF_FROM },
            centre: { value: new THREE.Vector2(0.5, 0.5) }
          },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `uniform sampler2D map; uniform float aspect; uniform float k;
            uniform float zoom; uniform float refFrom; uniform vec2 centre; varying vec2 vUv;
            void main(){
              vec2 c = vUv - 0.5; c.x *= aspect; float r = length(c);
              if (r > 0.5) discard;
              float ref = k * smoothstep(refFrom, 0.5, r);
              vec2 s = c * (1.0 + ref) / zoom; s.x /= aspect;
              vec4 col = texture2D(map, clamp(centre + s, 0.001, 0.999));
              float vig = smoothstep(0.32, 0.5, r);
              col.rgb *= mix(1.0, 0.55, vig);
              gl_FragColor = vec4(col.rgb, 1.0);
            }`
        });
        const lensQuad = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), lensMat);
        lensQuad.visible = false; lensQuad.renderOrder = 5; camera.add(lensQuad);

        /* C110: where the glass is pointed, in the photograph's own coordinates. Worked out in the
           PHOTO'S local frame rather than by raycasting the scene: the mesh is a plane at local z=0,
           so inverting its world matrix turns the camera's eye and forward into two numbers and the
           hit is one division - no raycaster, no intersection list, and nothing that depends on the
           rest of the hall being in a particular state.

           THE HALF-WINDOW IS WHAT THE CLAMP IS FOR. The disc samples up to (1+k)/(2*zoom) either side
           of `centre`, so a centre nearer the edge than that would run the crop off the picture and
           smear the clamped edge pixel across the rim. Held one half-window inside instead: the glass
           stays full of photograph wherever it is pointed, including past the frame. */
        const LENS_HALF = (1 + 0.35) / (2 * LENS_ZOOM);
        const lensInv = new THREE.Matrix4(), lensEye = new THREE.Vector3(), lensFwd = new THREE.Vector3();
        function aimLens(e) {
          e.photoGroup.updateMatrixWorld(true);
          camera.updateMatrixWorld();
          lensInv.copy(e.photo.matrixWorld).invert();
          lensEye.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(lensInv);
          lensFwd.set(0, 0, -1).applyQuaternion(camera.quaternion).transformDirection(lensInv);
          if (Math.abs(lensFwd.z) < 1e-4) return;          // looking along the picture: keep the last aim
          const t = -lensEye.z / lensFwd.z;
          if (t <= 0) return;                              // the photograph is behind the visitor
          const u = (lensEye.x + lensFwd.x * t) / PHOTO_W + 0.5;
          const v = (lensEye.y + lensFwd.y * t) / PHOTO_H + 0.5;
          const lim = (x) => Math.max(LENS_HALF, Math.min(1 - LENS_HALF, x));
          lensMat.uniforms.centre.value.set(lim(u), lim(v));
        }

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
            toggleRead();
          } else if (e.key === "Escape" && (zoomOpen || readOpen)) { if (zoomOpen) closeZoom(); else closeRead(); }
        });
        ctx.on(walkBtn, "pointerdown", e => { fwdHeld = true; e.preventDefault(); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(ev => ctx.on(walkBtn, ev, () => fwdHeld = false));
        ctx.on(backBtn, "pointerdown", e => { backHeld = true; e.preventDefault(); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(ev => ctx.on(backBtn, ev, () => backHeld = false));

        let targetYaw = 0, targetPitch = 0, downX = 0, downY = 0, downT = 0;
        let lookPointer=null,lastLookX=0,lastLookY=0;
        ctx.on(lookZone,'pointerdown',e=>{lookPointer=e.pointerId;lastLookX=downX=e.clientX;lastLookY=downY=e.clientY;downT=performance.now();lookZone.setPointerCapture(e.pointerId);});
        ctx.on(lookZone,'pointermove',e=>{if(lookPointer!==e.pointerId)return;const r=lookZone.getBoundingClientRect();targetYaw-=(e.clientX-lastLookX)/Math.max(1,r.width)*Math.PI;targetPitch=Math.max(-Math.PI/3,Math.min(Math.PI/3,targetPitch+(e.clientY-lastLookY)/Math.max(1,r.height)*Math.PI/2));lastLookX=e.clientX;lastLookY=e.clientY;});
        ctx.on(lookZone,'pointerup',e=>{if(lookPointer!==e.pointerId)return;lookPointer=null;if(performance.now()-downT<400&&Math.hypot(e.clientX-downX,e.clientY-downY)<10)toggleRead();});
        ctx.on(lookZone,'pointercancel',()=>lookPointer=null);
        /* ---- C011: the contextual tutorial, and C017's readout, and C012's route strip. All three are
           written from the frame loop, which is the only place that knows where the visitor is standing
           and how far the walls have come - and all three go through a one-key memo, because writing
           text and class lists sixty times a second is the habit C016 spent a packet breaking.

           THE TUTORIAL IS NOT A TIMER ANY MORE. The old #lbHint carried a general instruction at the
           entrance and a ctx.timeout(7000) took it away, so it taught whoever was looking at second
           three and nobody else - and every walk, every look and every press dismissed it early, which
           is a visitor being punished for doing the thing the banner was about to explain. It now
           appears at the FIRST exhibit, says how to open that one, and is spent the first time anyone
           opens any of them, forever. Two consequences, both deliberate: the generic "Look closer."
           prompt is suppressed while it is up (they are the same pill position and the tutorial says
           strictly more), and dismissHint() is gone - nothing dismisses this, doing it does. */
        let hintOn = null;
        function syncHint(on) {
          if (on === hintOn) return;
          hintOn = on;
          hint.classList.toggle("show", on);
        }
        let shrinkText = null;
        function syncShrink(rp) {
          const txt = shrinkNarration(rp);
          if (txt === shrinkText) return;
          shrinkText = txt;
          shrinkNote.textContent = txt;
          shrinkNote.classList.toggle("show", !!txt);
        }
        /* C012: six marks, built from EXHIBITS, in the order the WALK meets them - which is why the
           list is rebuilt in reverse on the return leg: the van is the first thing a returning visitor
           passes, and a strip that still reads teepee-first is describing a walk nobody is on. The DOM
           order is what reverses (appendChild moves a node it already holds), not a flex direction, so
           the reading order and the visual order cannot drift apart.

           "Visited" is DERIVED, never a seventh stored thing: outbound it is the exhibits the walk is
           already past, and on the return leg it is all six, because reaching the door is what a
           return leg means. "Read" is the stored half, and it is stored because inspecting is the
           thing a visitor does that leaves no trace in their position.

           NOT A MENU, which is half the acceptance: there is no control in here, .lb-hud's
           pointer-events:none means there could not be, and walking is still the only way between two
           exhibits. */
        const routeItems = {};
        EXHIBITS.forEach(ex => {
          const li = document.createElement("li");
          li.className = "lb-route-i";
          li.dataset.ex = ex.id;
          li.textContent = ex.short;
          routeEl.appendChild(li);
          routeItems[ex.id] = li;
        });
        let routeKey = null;
        function syncRoute() {
          const back = isReturning();
          const seen = EXHIBITS.map(ex => (back || ex.p <= ST.t) ? "1" : "0").join("");
          const key = (back ? "b" : "f") + seen + "|" + ST.read.join(",");
          if (key === routeKey) return;
          const reordered = routeKey === null || (routeKey[0] === "b") !== back;
          routeKey = key;
          if (reordered) (back ? EXHIBITS.slice().reverse() : EXHIBITS).forEach(ex => routeEl.appendChild(routeItems[ex.id]));
          EXHIBITS.forEach((ex, i) => {
            const li = routeItems[ex.id], v = seen[i] === "1", r = ST.read.indexOf(ex.id) >= 0;
            li.classList.toggle("is-visited", v);
            li.classList.toggle("is-read", r);
            li.setAttribute("aria-label", ex.label + (r ? ", inspected" : v ? ", walked past" : ", not reached yet"));
          });
        }

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
          markTaught();          // C011: opening one is what teaches, and it teaches once, for good
          markRead(e.cfg.id);    // C012: and it is the only thing that marks an exhibit read here
          openRead(e);           // C014: and the material it holds is now read in the DOM, not off a texture
        }
        function closeZoom() { zoomOpen = false; zoomTurning = false; closeRead(); }

        /* ---- C014: the reading panel, on both legs of the walk.
           THE RETURN LEG IS NOT AN AFTERTHOUGHT HERE. The glass case is outbound furniture - phase
           "out" is the whole of nearestCaseExhibit()'s contract, and caseDecor is hidden the moment
           the walls start closing - but the RESOURCES hang on the same walls coming back, and they
           are the eight things in this channel a visitor might genuinely need to act on: phone
           numbers, a legal aid clinic, a hotline. Leaving those as canvas text while the facts got a
           DOM panel would fix reading for the half of the material that is only interesting.

           So the panel is its own thing rather than a face of the zoom: the zoom opens it outbound
           (the glass, the fisheye and the yaw swing are unchanged), and on the way back the same
           LOOK CLOSER control opens it alone, against the photograph on the wall rather than a case
           that is not there. Two anchors because there are two arrangements - the case is recessed
           0.55 in from the wall plane, the photograph IS the wall plane - and the return leg's radius
           is wider because the corridor it is measured across is narrowing under the visitor. */
        const readPanel = byId("lbRead"), readTitle = byId("lbReadTitle"), readSub = byId("lbReadSub"),
              readBody = byId("lbReadBody"), readClose = byId("lbReadClose");
        let readExhibit = null, readOpen = false;
        // C107/C111: one delegated listener on the body the panel refills, bound once. See the note
        // on wireReadInputs - binding to the inputs themselves would need re-binding on every open.
        wireReadInputs(readBody);
        let plaqueDrag=null;ctx.on(readBody,'pointerdown',e=>{if(e.target.closest('a,button,input,select,summary'))return;plaqueDrag={id:e.pointerId,y:e.clientY,scroll:readBody.scrollTop};readBody.setPointerCapture(e.pointerId);e.preventDefault();});ctx.on(readBody,'pointermove',e=>{if(plaqueDrag?.id===e.pointerId)readBody.scrollTop=plaqueDrag.scroll+plaqueDrag.y-e.clientY;});ctx.on(readBody,'pointerup',()=>plaqueDrag=null);ctx.on(readBody,'pointercancel',()=>plaqueDrag=null);
        function wallAnchorOf(e, rp) { return { x: e.cfg.side * wallHalf(rp), z: zAt(e.cfg.p) }; }
        function nearestWallExhibit(rp) {
          for (const e of exhibitObjs) if (nearFacing(wallAnchorOf(e, rp), 2.4, 0.35)) return e;
          return null;
        }
        // which exhibit is readable right now, on whichever leg is running. The entrance-facing
        // "slotted" moment has nothing on the walls to read, so it answers null there too.
        function nearestReadable(rp) {
          if (ST.phase === "out") return nearestCaseExhibit();
          if (ST.phase === "back") return nearestWallExhibit(rp);
          return null;
        }
        function openRead(e) {
          const returning = isReturning();
          readExhibit = e; readOpen = true;
          readTitle.textContent = e.cfg.label;
          readSub.textContent = returning ? "Somewhere to call - check the scope before you dial"
                                          : "The sourced record - open any source in a new tab";
          /* C107: outbound the brochure comes FIRST - it is the question asked before the case is
             read, and putting it under three sourced claims is asking it after. Coming back it comes
             LAST, behind the resources, because the eight things on the return leg a visitor might
             actually dial are not something a comparison screen gets to push below the fold. */
          readBody.innerHTML = returning
            ? readCards(e.cfg.id, true) + promiseBlock(e.cfg.id, true)
            : promiseBlock(e.cfg.id, false) + readCards(e.cfg.id, false);
          readBody.innerHTML='<img class="lb-inspect-photo" src="'+(returning?e.cfg.horror:e.cfg.cozy)+'" alt="'+e.cfg.label+' close-up"><section class="lb-exhibit-plaque">'+readBody.innerHTML+'</section>';readBody.scrollTop=0;
          readPanel.classList.add("show");
          markRead(e.cfg.id);
          // C014: "resume at the same exhibit". Written the moment it opens rather than on the way
          // out, because the exit this has to survive is the one nobody announces - a closed tab, a
          // channel change, a phone that went to sleep on the source that had just been opened.
          if (ST.reading !== e.cfg.id) { ST.reading = e.cfg.id; saveState(); }
          takeFocus(readClose);
        }
        function closeRead() {
          const was = readOpen;
          readOpen = false; readExhibit = null;
          readPanel.classList.remove("show");
          if (ST.reading !== null) { ST.reading = null; saveState(); }
          if (was) giveFocus();
        }
        ctx.on(readClose, "click", () => { if (zoomOpen) closeZoom(); else closeRead(); });

        /* C019: the inspect control. Same action the look zone's tap and the E key already ran, given
           a name and a tab stop. Its state is written from the frame loop below, which is the only
           place that knows whether a case is in range - but through a one-key memo, because writing
           textContent and an ARIA attribute sixty times a second is the habit C016 is in this same
           packet to break. C014 adds one bit to that key: the panel can now be open with no zoom
           behind it, which is what the return leg is. */
        const lookBtn = byId("lbLook");
        let lookKey = "";
        function syncLook(inRange) {
          const open = zoomOpen || readOpen;
          const key = (inRange ? "1" : "0") + (open ? "1" : "0");
          if (key === lookKey) return;
          lookKey = key;
          lookBtn.hidden = !(inRange || open);
          lookBtn.textContent = open ? "STEP BACK" : "LOOK CLOSER";
          lookBtn.setAttribute("aria-pressed", open ? "true" : "false");
        }
        /* ONE inspect action, four ways to reach it: the button, the E/Enter key, a tap on the look
           zone, and (outbound) the glass itself. They were three copies of the same three lines
           before C014 needed a fourth branch in each, which is how a keyboard path and a touch path
           quietly stop agreeing about what the return leg does. */
        function toggleRead() {
          if (zoomOpen) { closeZoom(); return; }
          if (readOpen) { closeRead(); return; }
          const ne = nearestReadable(shrinkProgress());
          if (!ne) return;
          if (ST.phase === "out") openZoom(ne); else openRead(ne);
        }
        ctx.on(lookBtn, "click", toggleRead);

        /* ---- C019: focus, when a panel opens and when it closes.
           A panel that opens takes focus; closing hands it back to whatever had it. Without the first
           half a keyboard visitor is told nothing opened and has to hunt for the new controls; without
           the second, dismissing the guest book drops focus on <body> and the next Tab restarts at the
           top of the document, several screens above the museum.

           BOTH CLOSERS ARE LEVEL-TRIGGERED FROM THE FRAME LOOP - closeBook() and closeDoor() run on
           every frame the visitor is not standing at the lectern or the door - so the restore is
           guarded on the panel having actually been open. Unguarded, the museum would yank focus back
           sixty times a second and no other control on the page could ever hold it. */
        let focusFrom = null;
        const softFocus = el => { if (el && el.isConnected && el.focus) try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } };
        function takeFocus(el) { focusFrom = document.activeElement; softFocus(el); }
        function giveFocus() { const el = focusFrom; focusFrom = null; softFocus(el); }

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
          takeFocus(bookSkip);   // the one control that is in the panel before the engine mounts
        }
        function closeBook() { const was = bookOpen; bookOpen = false; bookPanel.classList.remove("show"); if (was) giveFocus(); }
        // No submit handler here any more - the engine owns its own form. Once signed, the frame loop's
        // proximity check below stops running altogether (it is guarded on !ST.signed), so the panel is
        // NOT closed out from under the outcomes; "walk on" is what dismisses them.
        ctx.on(bookSkip, "click", () => { bookSkipped = true; closeBook(); });

        exhibitObjs.forEach(e=>{const group=new THREE.Group();group.name="exhibit-curtains";group.rotation.y=-e.cfg.side*Math.PI/2;group.position.z=0;group.position.x=-e.cfg.side*.05;e.wallGroup.add(group);const burgundy=new THREE.MeshStandardMaterial({color:0x592d48,roughness:.94});for(const side of [-1,1])for(let j=0;j<5;j++){const fold=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,1.65,8),burgundy);fold.position.set(side*(.85+j*.07),-.4,.025);group.add(fold);}const spot=new THREE.SpotLight(0xffdfa1,1.8,6,Math.PI/6,.65);spot.position.set(0,-1.45,.7);spot.target.position.set(0,0,0);group.add(spot,spot.target);const fixture=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,.12,12),new THREE.MeshStandardMaterial({color:0x3b3540,metalness:.5,roughness:.4}));fixture.position.copy(spot.position);fixture.rotation.x=Math.PI/5;group.add(fixture);const pendant=new THREE.Mesh(new THREE.ConeGeometry(.17,.2,16),new THREE.MeshStandardMaterial({color:0xc4a16a,emissive:0x6b4116}));pendant.position.set(0,1.1,.3);group.add(pendant);});
        // ---- the door / slot overlay: an empty magnifying-glass hole. Click/tap puts the glass in - no wire,
        // no drag. Off stream: nothing happens and the museum stays explorable. Live: a machine behind the
        // hole fires a purple laser at the player (fireLaser below), then the same breach/shrink sequence
        // that used to fire on a wired connection. MBS.mode is a tone switch, never an entitlement (Codex
        // C6) - this only changes what plays, never what the run is worth.
        let doorOpen = false;
        const slotBtn = byId("slotBtn"), doorNote = byId("doorNote"), lbFlash = byId("lbFlash");
        function openDoor() { if (doorOpen || ST.phase !== "out") return; doorOpen = true; wirePanel.classList.add("show"); takeFocus(slotBtn); }
        function closeDoor() { const was = doorOpen; doorOpen = false; wirePanel.classList.remove("show"); doorNote.textContent = ""; slotBtn.disabled = false; if (was) giveFocus(); }

        let flickerT0 = 0, flickering = false;
        function onConnect() {
          fireConnect(() => {
            closeDoor();
            targetYaw=Math.PI;targetPitch=0;fwdHeld=false;backHeld=false;closeRead();zoomOpen=false;
            // C015: paint(), not a hand swap - a horror photograph still in the queue leaves its cozy
            // original on the wall until it lands, rather than blanking the frame to white
            exhibitObjs.forEach(e => { paint(e); e.spot.color.set(0x9fb8dd); e.spot.intensity = 0.75; });
            // swap placards to resource copy for each exhibit
            exhibitObjs.forEach(e => {
              const ids = RESOURCE_MAP[e.cfg.id];
              e.placards.forEach((m, i) => { m.visible = i < ids.length; });
              ids.forEach((id, i) => {
                const r = RES[id];
                e.placards[i].material.map = makePlacardTexture(Object.assign({ t: id }, r));
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
          playEffect(true);
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
          slotBtn.disabled = true; fireLaser(onConnect);
        }
        ctx.on(slotBtn, "click", attemptInsert);

        // ---- epilogue
        let stompAt=0,stompFinished=false;
        const boot=new THREE.Group();boot.visible=false;camera.add(boot);scene.add(camera);
        const shoeMaterial=new THREE.MeshStandardMaterial({color:0x231d24,roughness:.92});
        const sole=new THREE.Mesh(new THREE.BoxGeometry(.9,.18,1.7),shoeMaterial);boot.add(sole);
        const upper=new THREE.Mesh(new THREE.BoxGeometry(.78,.44,1.45),new THREE.MeshStandardMaterial({color:0x382a31,roughness:.85}));upper.position.y=.28;boot.add(upper);
        for(let i=0;i<7;i++){const tread=new THREE.Mesh(new THREE.BoxGeometry(.88,.045,.08),new THREE.MeshStandardMaterial({color:0x09070b}));tread.position.set(0,-.11,-.65+i*.21);boot.add(tread);}boot.rotation.x=Math.PI/2;
        const stompBlack=document.createElement('div');stompBlack.id='lbStompBlack';stompBlack.style.cssText='position:absolute;inset:0;background:#000;z-index:80;display:none;pointer-events:none';byId('lbStage').append(stompBlack);
        function startStomp(){if(stompAt)return;stompAt=performance.now();fwdHeld=backHeld=false;targetPitch=1.35;boot.visible=true;ctx.mbs?.complete?.('lilboyfriend',{terminal:'foot-stomp'});}
        let epiOpen = false;
        function openEpi() {
          if (epiOpen) return;
          epiOpen = true; closeRead(); epiPanel.classList.add("show");
          // C020: the download is the first control in the panel and the first thing focus lands on.
          // "walk again" throws the walk away; the file is the thing that survives it, so it is not
          // the one a keyboard visitor has to Tab past the reset to reach.
          takeFocus(byId("caseFile3d"));
        }
        function closeEpi() { const was = epiOpen; epiOpen = false; epiPanel.classList.remove("show"); if (was) giveFocus(); }
        ctx.on(byId("caseFile3d"), "click", downloadCaseFile);
        ctx.on(byId("walkAgain3d"), "click", () => {
          // C012: a new walk starts with nothing seen. The route strip is a record of THIS walk, not a
          // trophy cabinet - six gold marks over an untouched hall would say the opposite of what it
          // is for. `taught` is the one thing that survives, which is exactly why it is not in here.
          stompAt=0;stompFinished=false;boot.visible=false;stompBlack.style.display="none";ST.phase = "out"; ST.t = 0; ST.shrinkStartedAt = null; ST.read = []; ST.reading = null; ST.promise = {}; ST.promiseBack = {}; saveState();
          closeEpi(); closeZoom();
          exhibitObjs.forEach(e => { paint(e); e.spot.color.set(0xfff0d0); e.spot.intensity = 1.3; });
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

        /* ---- boot: resume from storage before the first frame, snap (no animation) to the saved phase.

           C015's readiness is the ENTRANCE PLUS ONE PHOTOGRAPH: the exhibit the resume position is
           nearest, on the side this phase shows. That is the only picture a visitor can see at the
           moment the door opens; the other eleven are down a fogged hall and can arrive while the
           walk is under way. If that one image is the thing that is missing, the other half of its own
           pair stands in - a frame holding the wrong-mood photograph is a fallback, a white rectangle
           is not - and only then does the museum open on nothing.

           `queueRest` is the other eleven, one at a time, in the order the WALK meets them: the six
           cozy exhibits outbound, the six horror ones in the order the return leg passes them, and
           whichever leg the visitor is currently on first. Serial rather than parallel on purpose -
           the point is that the NEXT frame is ready before the one after it, which twelve
           simultaneous requests fighting for the same connections do not give you. */
        function nearestExhibit() {
          let best = EXHIBITS[0], bd = Infinity;
          EXHIBITS.forEach(ex => { const d = Math.abs(ex.p - ST.t); if (d < bd) { bd = d; best = ex; } });
          return best;
        }
        const twinOf = {};
        EXHIBITS.forEach(ex => { twinOf[ex.cozy] = ex.horror; twinOf[ex.horror] = ex.cozy; });
        function queueRest() {
          const out = EXHIBITS.map(ex => ex.cozy);                       // the outbound walk's order
          const back = EXHIBITS.map(ex => ex.horror).reverse();          // the return leg's order
          const order = isReturning() ? back.concat(out) : out.concat(back);
          (function next(i) {
            if (i >= order.length || !gl || session !== mine) return;
            const url = order[i];
            loadTex(url).then(t => {
              // a frame whose own photograph did not come needs its stand-in NOW, not whenever the
              // queue happens to reach the other half of the pair - which, ordered by the walk, can
              // be eleven loads later. This is the difference between a wall that goes up in the
              // wrong mood and a wall that stays white for the rest of the leg.
              const twin = t ? null : twinOf[url];
              return twin && !tex[twin] ? loadTex(twin) : null;
            }).then(() => next(i + 1));
          })(0);
        }
        const firstEx = nearestExhibit();
        const firstUrl = isReturning() ? firstEx.horror : firstEx.cozy;
        loadTex(firstUrl).then(t => (t || firstUrl === firstEx.cozy) ? t : loadTex(firstEx.cozy)).then(() => {
          // the photograph landed after the channel was left: there is nothing to boot into
          if (session !== mine || !gl) return;
          // test-only: WHEN the door opened, on the PAGE's clock, so a gate can put it against a
          // resource's own start time without either number crossing a process boundary first.
          // Removed in unmount() with the other hooks.
          window.__lbBooted = performance.now();
          window.__lbPhotos = () => exhibitObjs.map(e => {
            const im = e.photoMat.map && e.photoMat.map.image;
            return im ? String(im.currentSrc || im.src || "?") : null;
          });
          /* C017, test-only, and RAW: where the eight rails are, and where the wall actually is this
             frame - both straight off the scene graph, neither of them an answer this channel worked
             out for anyone. Which rails are still inside the hall, and whether the narration in the
             DOM agrees with the wall, are the gate's arithmetic to do; a hook that returned "3 marks
             left" would be the museum marking its own homework, which is the one thing 4.9 and 4.7
             both had to design around. Removed in unmount() with the other hooks. */
          window.__lbHall = () => ({
            half: hallMesh.scale.x / 2,
            rails: scene.children.filter(o => o.name === "rail").map(o => Math.round(o.position.x * 1000) / 1000)
          });
          /* C102, test-only and RAW, on the same terms as __lbHall: the six figures' own transforms
             inside their own cases, the geometry and material identities they were built from, and
             the case constants they have to fit inside. Whether they are one object at one scale,
             whether each one is standing on the floor of its own alcove and whether six recorded
             transforms are actually six is the GATE's arithmetic - a hook that answered "consistent"
             would be the museum marking its own homework. Removed in unmount() with the others. */
          window.__lbFigures = () => ({
            box: { gap: FIGURE_GAP, w: CASE_W - 0.05, h: CASE_H - 0.05, cy: CASE_CY,
                   floor: FIGURE_FLOOR, photoHalfZ: PHOTO_W * CASE_SCALE / 2 },
            figures: exhibitObjs.map(e => {
              const f = e.caseDecor.getObjectByName(e.cfg.id + "-figure");
              if (!f) return { id: e.cfg.id, side: e.cfg.side, missing: true };
              return { id: e.cfg.id, side: e.cfg.side, missing: false,
                       vis: e.caseDecor.visible && f.visible,
                       pos: [f.position.x, f.position.y, f.position.z],
                       ry: f.rotation.y, scale: [f.scale.x, f.scale.y, f.scale.z],
                       geo: f.geometry.uuid, mat: f.material.uuid, mapped: !!f.material.map };
            })
          });
          /* C110, test-only and RAW: the lens uniforms as they stand this frame, plus the camera yaw
             they were derived from. The gate decides for itself whether the sample tracks the look -
             three poses, one monotonic run - and whether it stops being written when the inspection
             ends. Nothing here is an answer about alignment. Removed in unmount() with the others. */
          window.__lbLens = () => ({
            vis: lensQuad.visible, hasMap: !!lensMat.uniforms.map.value,
            centre: [lensMat.uniforms.centre.value.x, lensMat.uniforms.centre.value.y],
            zoom: lensMat.uniforms.zoom.value, refFrom: lensMat.uniforms.refFrom.value,
            k: lensMat.uniforms.k.value, yaw: camera.rotation.y
          });
          exhibitObjs.forEach(paint);
          if (isReturning()) {
            exhibitObjs.forEach(e => {
              e.spot.color.set(0x9fb8dd); e.spot.intensity = 0.75;
              const ids = RESOURCE_MAP[e.cfg.id];
              e.placards.forEach((m, i) => { m.visible = i < ids.length; if (i < ids.length) { const r = RES[ids[i]]; m.material.map = makePlacardTexture(Object.assign({ t: ids[i] }, r)); m.material.needsUpdate = true; } });
            });
            hallLights.forEach(l => { l.color.set(COLD_LIGHT); l.intensity = 0.55; });
            wallMat.color.set(COLD_WALL); rugMat.color.set(RUG_COLD); ambient.intensity = 0.3;
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
          /* C014: "resume at the same exhibit", done after the camera has been snapped and the walls
             sized, so the panel opens over a hall that is already in the right shape. The saved id is
             an ALLOWLISTED one (sanitize() filtered it against EXHIBITS), and this looks it up in the
             live objects rather than trusting the string a second time. It is deliberately NOT the
             zoom outbound: the glass rig eases over 450ms of frames and a resume has no frames yet to
             ease over - the visitor who left mid-read wanted the words back, not the animation. */
          const resumeEx = ST.reading && exhibitObjs.find(e => e.cfg.id === ST.reading);
          if (resumeEx && ST.phase !== "done") {
            // standing at it and LOOKING at it, both: the frame loop's own proximity test is what
            // holds this panel open, and it is a facing test - resuming with the saved yaw of 0 would
            // put the visitor beside the alcove staring down the corridor, and the first frame would
            // close the panel it just opened. So the resume sets the position AND the bearing, which
            // is what "at the same exhibit" means to somebody who was reading it.
            ST.t = resumeEx.cfg.p; saveState();
            camera.position.z = zAt(ST.t);
            yaw = bearingTo(caseMode0 ? caseAnchorOf(resumeEx) : wallAnchorOf(resumeEx, rp0));
            targetYaw = yaw; pitch = 0; targetPitch = 0; applyLook();
            openRead(resumeEx);
          }
          last = performance.now();
          ctx.frame(frame);
          queueRest();       // the other eleven, behind the open door
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
          // C014: reading holds the view still for the same reason the zoom does. Without it a pointer
          // parked off to one side before the panel opened keeps dragging the bearing round underneath
          // it, until the frame loop's own facing test stops finding the exhibit and closes the panel
          // the visitor is still reading.
          if (!zoomOpen && !readOpen) {
            yaw += (targetYaw - yaw) * Math.min(1, dt * 8);
            pitch += (targetPitch - pitch) * Math.min(1, dt * 8);
          }
          if(isReturning()&&!stompAt){targetYaw=Math.PI;targetPitch=0;}
          applyLook();
          updateLaser(now);
          if(stompAt&&!stompFinished){const t=(now-stompAt)/1000;camera.rotation.x=Math.min(1.35,t*1.6);boot.position.set(0,Math.max(0,3-t*2.1),-Math.max(.12,3-t*1.9));if(t>1.55){stompBlack.style.display='block';boot.visible=false;stompFinished=true;playEffect();ctx.timeout(()=>{openEpi();stompBlack.style.display='none';},1300);}}


          // C014: !readOpen joins the list for the return leg, where there is no zoom holding the
          // visitor still - a panel that is being read while the walk carries on underneath it is the
          // guest book's bug, and this one has links in it.
          if ((isReturning() || fwdHeld || backHeld) && !stompAt && !epiOpen && (isReturning() || (!bookOpen && !zoomOpen && !readOpen))) {
            const dir = isReturning()?1:(fwdHeld ? 1 : 0) - (backHeld ? 1 : 0);
            if (dir) { playEffect(); ST.t = Math.max(0, Math.min(1, ST.t + dir * (isReturning()?-3.2:1) * WALK_SPEED * dt)); saveWalk(); }
          }
          camera.position.z = zAt(ST.t);
          const rp = shrinkProgress(), caseMode = ST.phase === "out";
          camera.position.y = eyeY(rp)+(isReturning()&&!stompAt?Math.sin(now*.021)*Math.min(.035,eyeY(rp)*.1):0);

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
          // C014: the same level-triggered test, asked of whichever leg is running - the case
          // outbound, the photograph on the wall coming back. closeZoom() closes the panel with it,
          // so the outbound arm needs no second line; the return leg has no zoom to ride on.
          const nearEx = nearestReadable(rp);
          if (zoomOpen && (nearEx !== zoomExhibit || !caseMode)) closeZoom();
          if (readOpen && !zoomOpen && nearEx !== readExhibit) closeRead();
          syncLook(!!nearEx);
          // C011: at the FIRST exhibit on the route, to a visitor who has never opened one. EXHIBITS[0]
          // rather than the string "teepee": the tutorial belongs to whichever exhibit the walk meets
          // first, and 4.11a re-authors this list. `caseMode` is C014's addition: nearEx answers on the
          // return leg now, and the walk does not meet its first exhibit on the way back.
          const teaching = !taught && caseMode && !!nearEx && !zoomOpen && nearEx.cfg.id === EXHIBITS[0].id;
          syncHint(teaching);
          syncShrink(rp);
          syncRoute();
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
            aimLens(zoomExhibit);          // C110 (c): the sample is re-aimed only while inspecting
            lensQuad.position.lerpVectors(GLASS_REST, new THREE.Vector3(0, -0.04, -0.5), ease);
            lensQuad.scale.setScalar(0.25 + 1.1 * ease);
            lensQuad.visible = true;
          } else {
            // C110 (c): "update the sample only while inspection is active" is a claim about the
            // sample, not about the quad - a hidden lens still holding a live texture and a stale aim
            // is a lens that updates whenever the frame loop feels like it. Dropping the map is what
            // makes the assertion measurable, and it releases the channel's only reference to a
            // photograph that is not the one on the wall.
            lensQuad.visible = false;
            lensMat.uniforms.map.value = null;
          }

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
          } else if (nearEx && !zoomOpen && !teaching) {
            prompt.textContent = "Look closer."; prompt.classList.add("show");
          } else prompt.classList.remove("show");

          // guest book / door proximity
          if (!ST.signed && !bookSkipped) { if (nearFacing(bookGroup.position, 1.5, 0.35)) openBook(); else closeBook(); }
          if (ST.phase === "out") { if (nearFacing(doorGroup.position, 1.5, 0.35)) openDoor(); else closeDoor(); }

          // reached the entrance on the way back
          if (isReturning() && ST.t <= 0.001 && ST.phase !== "done") { ST.phase = "done"; saveState(); startStomp(); }

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
      // C107/C111: bound to the container render() empties rather than to the step it rebuilds, and
      // bound ONCE - wire() runs on every render, and a delegated listener registered in there would
      // be registered seventeen times by the end of the gallery and fire seventeen times per click.
      wireReadInputs(flat);
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
      let booted = false;   // C019: see the focus move at the end of render()

      function render() {
        const s = STEPS[step];
        ST.phase = s.phase === "slotted" && step > 6 ? "back" : s.phase; ST.t = s.t; saveState();
        flat.innerHTML = "";
        const wrap = document.createElement("div");
        switch (s.id) {
          case "entrance": wrap.innerHTML = `<span class="fl-name">${TITLE_TEXT.h1}</span><p class="fl-sub">${TITLE_TEXT.h2}</p><div class="fl-lead">${bodyHTML(TITLE_TEXT.body)}</div><div class="fl-actions"><button id="flNext">enter</button></div>`; break;
          case "book": {
            // 2.20: same engine the 3D lectern mounts, same JSON. The step is otherwise empty markup -
            // the questions have exactly one definition and it is not in this file.
            // C019: a real button. The id survives on purpose - it is what the guest-book step's
            // "walk on" has always been called, and three separate gate sections click it by name.
            wrap.innerHTML = `<div id="flBookMount"></div>
              <div class="fl-actions"><button type="button" class="skip" id="flSkip">walk on</button></div>`;
            break;
          }
          case "teepee": case "car": case "shoebox": case "storage": case "masonjar": case "van": {
            const ex = EXHIBITS.find(e => e.id === s.id);
            markRead(ex.id);   // C012: on this path the step IS the exhibit open, facts and all
            wrap.innerHTML = `<span class="fl-name">${ex.label}</span><p class="fl-sub">cozy - tap the photo to look closer</p>
              <button type="button" class="fl-zoomable" id="flZoom" aria-pressed="false" aria-label="Look closer at ${ex.label}"><img class="fl-photo" src="${ex.cozy}" alt="${ex.label} cozy"><div class="lb-flat-glass">${GLASS_SVG}</div></button>
              ${promiseBlock(ex.id, false)}
              ${readCards(ex.id, false)}
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
            markRead(ex.id);
            // C017: the same rail, off the same wallHalf(). This path has no hall to lay rails in, so
            // the mark is all there is of the cue here - and it is the same number the 3D narration
            // reads, never a second count of steps taken.
            const rpF = shrinkProgress();
            wrap.innerHTML = `<span class="fl-name">${ex.label}</span><p class="fl-sub">the walls are closer now - ${markLine(rpF)}${rpF >= 1 ? ", the last" : ""}</p>
              <button type="button" class="fl-zoomable" id="flZoom" aria-pressed="false" aria-label="Look closer at ${ex.label}"><img class="fl-photo" src="${ex.horror}" alt="${ex.label} horror"></button>
              ${readCards(ex.id, true)}
              ${promiseBlock(ex.id, true)}
              <div class="fl-actions"><button id="flNext">NEXT</button></div>`;
            break;
          }
          /* C020: the same object the museum's epilogue hands over, built by the same function from
             the same data. The note under it is not decoration - "made on this machine, sent nowhere"
             is the honest statement of what pressing it does, on a channel whose whole subject is
             being processed by a programme that never asked. */
          case "epilogue": wrap.innerHTML = `<span class="fl-name">${CLOSING_LINE}</span>
            <p class="fl-sub">Six transformations, eighteen sourced claims, eight places to call. Plain text, made on this machine, sent nowhere.</p>
            <div class="fl-actions"><button id="flCase">download the case file</button><button id="flAgain">walk again</button></div>`; break;
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
        /* C019: render() replaces the step's whole markup, so a keyboard visitor who just pressed
           NEXT is left with focus on <body> and a Tab that restarts at the top of the document. Focus
           moves to the step's primary control instead - named in list order of PREFERENCE but resolved
           by querySelector in DOCUMENT order, which is why #flBack (inserted first in .fl-actions) is
           deliberately not in the list. Not on the first render: that one runs at boot, and a channel
           that steals focus from the page the moment it mounts is a worse bug than the one this fixes. */
        if (booted) {
          const f = wrap.querySelector("#flNext, #flSlot, #flCase, #flAgain, #flSkip") || wrap.querySelector("button");
          if (f) try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
        }
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
        if (zoomable) ctx.on(zoomable, "click", () => {
          // C019: it is a toggle, so it says which way it is set. Keyboard activation comes free with
          // the element; announcing the state does not.
          zoomable.setAttribute("aria-pressed", zoomable.classList.toggle("zoomed") ? "true" : "false");
          markTaught();   // C011: this path's magnifier is the same lesson, so it spends the same key
        });
        // the door: an empty magnifying-glass hole, click to put the glass in - no wire, no drag. Off stream,
        // nothing happens and the museum stays explorable; live, a laser flash plays, then the same
        // breach/shrink sequence the 3D path uses.
        const flSlot = q("flSlot");
        if (flSlot) ctx.on(flSlot, "click", () => {
          if (flSlot.disabled) return;
          if (ST.phase !== "out") { goNext(); return; }
          {
            flSlot.disabled = true;
            playEffect(true);const flashEl = q("flFlash"); if (flashEl) flashEl.classList.add("show");
            ctx.timeout(() => { fireConnect(() => { if (flashEl) flashEl.classList.remove("show"); goNext(); }); }, 500);
          }
        });
        const again = q("flAgain");
        const caseBtn = q("flCase");
        if (caseBtn) ctx.on(caseBtn, "click", downloadCaseFile);
        if (again) ctx.on(again, "click", () => { ST.phase = "out"; ST.t = 0; ST.shrinkStartedAt = null; ST.read = []; ST.reading = null; ST.promise = {}; ST.promiseBack = {}; saveState(); step = 0; render(); });
      }
      render();
      booted = true;
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
    // C016: leaving the channel is the other way a walk ends, and no pagehide fires for it. Whatever
    // the throttle was holding is written here, before the closure it reads goes out of scope.
    flushWalk(); flushWalk = () => {};
    session = null;
    try { delete window.__lbState; } catch (e) { window.__lbState = undefined; }
    try { delete window.__lbLoaded; } catch (e) { window.__lbLoaded = undefined; }
    try { delete window.__lbBooted; } catch (e) { window.__lbBooted = undefined; }
    try { delete window.__lbPhotos; } catch (e) { window.__lbPhotos = undefined; }
    try { delete window.__lbHall; } catch (e) { window.__lbHall = undefined; }
    try { delete window.__lbFigures; } catch (e) { window.__lbFigures = undefined; }
    try { delete window.__lbLens; } catch (e) { window.__lbLens = undefined; }
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
