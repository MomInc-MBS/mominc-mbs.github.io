/* Handborne -> Coach Armie: the way a finished hand gets back out of this room.

   Handborne is a prebuilt app that knows nothing about this site. It persists its own recipe under
   `handborne-recipe-v3` and otherwise offers file downloads, so on its own it is a dead end: the
   visitor builds a hand and there is no door back. This file is that door, and it is deliberately a
   SEPARATE SCRIPT rather than a patch to the minified bundle - the bundle is a build artifact and
   editing it by hand is a change nobody can review or reproduce.

   SIX SECTIONS IN, SEVEN OUT, and that is not a fudge. Handborne v3 merged the knuckles control into
   `fingers`, which its own label calls "Fingers & knuckles - joined finger shafts, bases and
   knuckles". armie-intro's intro.js still assembles seven named regions out of the family models, and
   every family-NN.glb carries a `knuckles` node. So `fingers` legitimately drives both
   `middle_sections` and `knuckles`: one choice, the two parts it was always describing.

   The bar only ever appears with a same-origin `?return=`. An off-site return target is dropped
   rather than followed - this hands a profile to whatever page it lands on, and that page must be
   ours. */
(function () {
  "use strict";

  var STORE = "handborne-recipe-v3";
  var SIX = ["nails", "fingertips", "fingers", "palm", "back_of_hand", "wrist"];

  // Same-origin only. A relative value resolves against this page; anything else is refused.
  var target = null;
  try {
    var raw = new URLSearchParams(location.search).get("return");
    if (raw) {
      var u = new URL(raw, location.href);
      if (u.origin === location.origin) target = u;
    }
  } catch (e) { target = null; }
  if (!target) return;

  function recipe() {
    var parsed;
    try { parsed = JSON.parse(localStorage.getItem(STORE)); } catch (e) { return null; }
    if (!parsed || typeof parsed !== "object") return null;
    var s = parsed.sections && typeof parsed.sections === "object" ? parsed.sections : parsed;
    for (var i = 0; i < SIX.length; i++) {
      var v = s[SIX[i]];
      if (!Number.isInteger(v) || v < 0 || v > 19) return null;
    }
    return s;
  }

  // The shape armie.html's own validHand() accepts, and nothing more: no pose, no nail shape, no
  // identity of any kind. A hand is a set of seven small integers.
  function profile(s) {
    return {
      version: 1,
      source: "handborne",
      complete: true,
      sections: {
        nails: s.nails,
        fingertips: s.fingertips,
        middle_sections: s.fingers,
        knuckles: s.fingers,
        palm: s.palm,
        back_of_hand: s.back_of_hand,
        wrist: s.wrist
      }
    };
  }

  var bar = document.createElement("div");
  bar.id = "hb-return-bar";
  bar.setAttribute("role", "status");
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483646;display:flex;" +
    "gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;padding:12px 16px;" +
    "background:#2f6fed;color:#f7f1e1;font:600 15px/1.4 Barlow,Arial,sans-serif;" +
    "box-shadow:0 -6px 24px rgba(0,0,0,.35)";

  var say = document.createElement("span");
  var go = document.createElement("button");
  go.type = "button";
  go.textContent = "Take this hand to Coach Armie";
  go.style.cssText = "font:700 15px/1 Barlow,Arial,sans-serif;padding:11px 18px;border:0;" +
    "border-radius:2px;background:#ffcf3a;color:#22201c;cursor:pointer";
  go.addEventListener("click", function () {
    var s = recipe();
    if (!s) return;                       // the button is hidden in this state; belt and braces
    var out = new URL(target.href);
    out.hash = "hand=" + encodeURIComponent(JSON.stringify(profile(s)));
    location.href = out.href;
  });

  bar.append(say, go);
  document.body.append(bar);

  // The app writes the recipe on every change and `storage` does not fire in the writing tab, so the
  // cheapest correct watcher is a poll. Nothing here runs per frame.
  var wasReady = null;
  function sync() {
    var ready = !!recipe();
    if (ready === wasReady) return;
    wasReady = ready;
    say.textContent = ready
      ? "Your hand is finished. The coach is waiting for it."
      : "Pick every section. The coach cannot take an unfinished hand.";
    go.hidden = !ready;
  }
  sync();
  setInterval(sync, 700);
})();
