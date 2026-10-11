// Pure placement recipes. The shared manager owns canvases, GPU support and lifecycle.
// Props checked against shaders' Aurora definition; two curtains stay fixed because
// curtainCount is a compile-time prop. Existing room/portrait art remains underneath.
const canvasStyle = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '42%',
  zIndex: '0',
  pointerEvents: 'none',
  imageRendering: 'auto',
  transform: 'none',
  objectFit: 'fill',
  maxWidth: 'none',
};

function meditationActive(host) {
  const dialog = host?.closest?.('.meditation-panel');
  const scene = host?.closest?.('[data-meditation-scene]');
  if (!dialog?.open || scene?.hidden || host?.isConnected === false) return false;
  if (['breathing-paused', 'snorting', 'blacking-out'].some(name => dialog.classList.contains(name))) return false;
  // The released scene uses a waterfall backdrop for every day's wonder.
  // Add only ambient sky light; the backdrop and grayscale reveal remain intact.
  return true;
}

function meditationComponents() {
  return [{
    type: 'Aurora',
    props: {
      colorA: '#a533f8', colorB: '#76dfb0', colorC: '#479bc4',
      intensity: 35, curtainCount: 2, speed: 1.2,
      waviness: 35, rayDensity: 16, height: 95,
      center: { x: .5, y: .05 }, seed: 5,
    },
  }];
}

function portraitActive(host) {
  return !!host?.querySelector?.('#avatar') && host.isConnected !== false && !host.closest?.('[hidden]');
}

function portraitComponents() {
  return [{
    type: 'Aurora',
    props: {
      colorA: '#713150', colorB: '#cbb4e7', colorC: '#d7b56c',
      intensity: 40, curtainCount: 2, speed: .8,
      waviness: 28, rayDensity: 12, height: 85,
      center: { x: .5, y: .03 }, seed: 5,
    },
  }];
}

export const auroraTargets = [
  {
    selector: '.meditation-panel .meditation-far',
    name: 'aurora', priority: 10, opacity: .25,
    style: { ...canvasStyle },
    active: meditationActive,
    components: meditationComponents,
  },
  {
    selector: '.atelier .portrait',
    name: 'aurora', priority: 10, opacity: .25,
    style: { ...canvasStyle, height: '78%' },
    active: portraitActive,
    components: portraitComponents,
  },
];
