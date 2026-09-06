/* tv/channels/_runtime-probe.js - NOT A CHANNEL. The module half of the runtime fixture (2.17).
   See _runtime-probe.html for why it exists.

   It is written the way a converted channel should be written, and is the reference for 2.18:
   every listener, timer, interval, animation frame, observer and AudioContext goes through the
   context, so unmount() releases all of it without this file having to remember any of it.

   The three query flags are how the gate reaches the error contracts and the bad-citizen case
   without a second fixture:
     ?probe=throw-mount   mount() throws, after registering disposables - the runtime must catch it,
                          release what was registered, and leave the rest of the television working
     ?probe=throw-unmount unmount() throws - the runtime must still release everything
     ?probe=raw           one listener is bound with a RAW addEventListener, bypassing the context.
                          The runtime cannot release what it was never told about, and the gate
                          asserts that this is visible rather than silently tolerated - that is the
                          whole failure mode 2.18's conversions have to avoid. */

let live = false;      // module state that must not survive an unmount
let ticks = 0;
let rawBound = null;

const flag = () => new URLSearchParams(location.search).get("probe") || "";

export default {
  mount(root, ctx) {
    live = true;
    ticks = 0;

    const btn = root.querySelector("#probeBtn");
    const box = root.querySelector("#probeBox");

    // listeners: one on a control inside the channel, one on a target OUTSIDE it. The outside one is
    // the one that matters - a listener on window survives innerHTML replacing the channel, which is
    // precisely how the legacy path leaks.
    ctx.on(btn, "click", () => { ticks++; });
    ctx.on(window, "resize", () => { ticks++; });

    ctx.timeout(() => { ticks++; }, 60000);
    ctx.interval(() => { ticks++; }, 1000);
    ctx.observe(new ResizeObserver(() => { ticks++; }), box);

    // a render loop, re-registered each frame the way a real game's is
    const loop = () => { if (live) ctx.frame(loop); };
    ctx.frame(loop);

    // AudioContext: constructed only when the browser allows it without a gesture, since a headless
    // run has no gesture and a throw here would be the fixture failing rather than the runtime
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx.audio(new AC());
    } catch (e) { /* no audio in this context; the other disposables still exercise dispose() */ }

    if (flag() === "raw") {
      // deliberately NOT through ctx: the leak the contract exists to prevent
      rawBound = () => { ticks++; };
      window.addEventListener("resize", rawBound);
    }

    window.__probe = { mounted: true, unmounted: false, ticks: () => ticks, ctx };

    if (flag() === "throw-mount") throw new Error("probe: deliberate throw inside mount()");
  },

  unmount() {
    live = false;
    if (window.__probe) { window.__probe.mounted = false; window.__probe.unmounted = true; }
    if (rawBound) { /* deliberately NOT removed: see ?probe=raw above */ }
    if (flag() === "throw-unmount") throw new Error("probe: deliberate throw inside unmount()");
  },
};
