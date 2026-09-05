/* Mounts one channel fragment into a standalone play route, showing the GAME and none of the page.
   Same injection contract tv.js uses (scripts re-created copying textContent only), because the
   fragments were written against that contract and must not be edited to leave the television. */
(() => {
  const slug = document.documentElement.dataset.game;
  const host = document.getElementById("channel");
  const boot = document.getElementById("boot");
  const fail = (why) => {
    if (host) host.innerHTML = "";
    if (!boot) return;
    boot.innerHTML = '<p>This channel did not come in. <a href="../games/' + slug + '/">Go back</a> and try again.</p>';
    window.MBS && window.MBS.lifecycle && window.MBS.lifecycle.emit("GAME_ERROR", { stage: "mount", why: String(why).slice(0, 120) });
  };
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return fail("bad slug");

  /* Isolation is an ancestor-path reveal, never a blanket hide: display:none collapses descendant
     geometry and these games measure layout while they initialise (fuel.html:721, lilboyfriend.html:1035,
     armie.html:441). So mark every root and every ancestor of a root as on-path, then hide only the
     OFF-path siblings. Interleaved game UI keeps its ancestor: fuel's live flavour readout sits inside
     the branding strip and djscratch's signal line sits inside the advert, and each survives while its
     ad-copy siblings go. Runs BEFORE the scripts are re-created, so a game never sees the page
     furniture, and never a frame of it.

     `hide` is the other half of the contract, and it is not optional. A root keeps its WHOLE subtree,
     so page furniture living INSIDE a game root can only be removed by naming it - djscratch's CUSTOM
     HANDS sign sits in the deck and links to a section that is now hidden. Roots union, hide subtracts;
     a list of roots alone cannot express the subtraction. */
  const NEVER_HIDE = /^(script|style|link|template|noscript|meta|title|base)$/;   /* elements that never render at all, so hiding them can only do harm */

  const one = (sel, kind) => {
    const hit = host.querySelectorAll(sel);
    if (hit.length !== 1) throw new Error(kind + " " + sel + " matched " + hit.length + ", want 1");
    return hit[0];
  };

  const isolate = (roots, hide) => {
    const keep = new Set(), path = new Set();
    for (const sel of roots) {
      const el = one(sel, "root");
      keep.add(el);
      for (let n = el.parentElement; n && n !== host; n = n.parentElement) path.add(n);
    }
    const walk = (parent) => {
      for (const el of parent.children) {
        if (keep.has(el)) continue;                                   /* a root: its whole subtree is the game */
        if (path.has(el)) walk(el);                                   /* on the way to a root: descend, hide its other children */
        else if (!NEVER_HIDE.test(el.tagName.toLowerCase())) el.classList.add("mbs-off");
      }
    };
    walk(host);
    for (const sel of hide) one(sel, "hide").classList.add("mbs-off");
  };

  /* Fail closed on the registry, not only on the DOM. An absent or empty roots list is the likeliest
     registry mistake, and treating it as "nothing to isolate" would quietly serve the whole page as
     the game, which is the exact defect Part A exists to remove. */
  const selectors = (v) => Array.isArray(v) && v.every(x => typeof x === "string" && x.trim());
  let roots, hide;
  try {
    const cfg = JSON.parse(document.documentElement.dataset.roots || "null");
    roots = Array.isArray(cfg) ? cfg : cfg && cfg.roots;
    hide = (cfg && !Array.isArray(cfg) && cfg.hide) || [];
    if (!selectors(roots) || !roots.length || !selectors(hide)) throw new Error("roots must be a non-empty list of selectors");
  } catch (e) { return fail(e.message || "bad roots"); }

  fetch("channels/" + slug + ".html", { cache: "no-store" })
    .then(r => r.ok ? r.text() : Promise.reject(r.status))
    .then(htmlText => {
      host.innerHTML = htmlText;
      const root = host.querySelector("[data-host]");
      if (root) document.title = (root.dataset.show || root.dataset.host || slug) + " | MBS";

      /* A missing selector, a duplicate match or a stale wrapper aborts with nothing mounted, rather
         than running the game with the whole page still around it. */
      try { isolate(roots, hide); }
      catch (e) { return fail(e.message); }

      host.querySelectorAll("script").forEach(old => {
        const s = document.createElement("script");
        s.textContent = old.textContent;
        old.replaceWith(s);
      });
      boot && boot.remove();
      window.dispatchEvent(new Event("resize"));   // a fragment inserted after load never gets one otherwise; games size themselves on resize
      window.MBS && window.MBS.bindFrames && window.MBS.bindFrames();       // an iframe game (goon) swallows its own pointer events
      window.MBS && window.MBS.lifecycle && window.MBS.lifecycle.ready();   // ready means mounted, never before
    })
    .catch(fail);
})();
