// Sequence-clocked transition art: freezes with pause, with no independent timers.
export function createTransitionVeil(reducedMotion) {
  const veil = document.createElement("div");
  veil.id = "size-transition-veil";
  veil.setAttribute("aria-hidden", "true");
  document.body.append(veil);
  let intensity = 0, lastPhase = 0;
  function draw(value, phase) {
    lastPhase = phase;
    intensity = Math.max(0, Math.min(1, value));
    // Plateau at .9: the swirl is nearly opaque for most of the pulse, not just at the cut.
    veil.style.opacity = String(Math.min(.9, intensity * 1.5));
    veil.style.setProperty("--warp-turn", `${reducedMotion ? 0 : phase * 135}deg`);
    veil.style.setProperty("--warp-scale", String(reducedMotion ? 1 : .8 + intensity * .7));
    veil.style.setProperty("--warp-core", String(reducedMotion ? 0 : Math.pow(intensity, 3)*.18));
    veil.style.visibility = intensity > .001 ? "visible" : "hidden";
  }
  return {
    sample(time, cuts) {
      let strength = 0, phase = time;
      for (const cut of cuts) {
        const distance = Math.abs(time - (cut - .5));
        if (distance < 2.15) {
          const edge = Math.max(0, distance - 1.15);
          const pulse = Math.cos(edge * Math.PI / 2) ** 2;
          if (pulse > strength) { strength = pulse; phase = time - cut; }
        }
      }
      draw(strength, phase);
    },
    fade(dt) { if (intensity > 0) draw(Math.max(0, intensity - dt / 1.4), lastPhase + dt); },
    clear() { draw(0, 0); },
  };
}
