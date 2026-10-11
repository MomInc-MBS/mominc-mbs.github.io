// Decorative recipes for shaders 4.0.4 Hologram. The shared manager owns canvases
// and lifecycle; exercise/hand Three.js models and controls stay in their hosts.
// SDF names/fields checked against the npm package's analytic shape resolver:
// ellipseSDF / roundedRectSDF use radius (half-width), height and rounding.
const available = host => !!host?.isConnected && !host.closest('[hidden], [aria-hidden="true"]') &&
  (!host.closest('dialog') || host.closest('dialog').open);

const projection = (color, shape) => [{
  type: 'Hologram',
  props: {
    color, shape: JSON.stringify(shape), scale: 3,
    center: {x: .5, y: .5}, brightness: .8, fill: .12,
    edgeGlow: .6, edgeSoftness: .03, depthLines: .12, depthScale: 12,
    scanlines: .18, scanlineScale: 60, scanlineSpeed: .2,
    sweep: .025, flicker: 0, distortion: 0, grain: .05, speed: .25,
  },
}];
const plate = {type: 'roundedRectSDF', radius: .44, height: .1, rounding: .04};
const pedestal = {type: 'ellipseSDF', radius: .44, height: .07};

export const hologramTargets = [
  {
    selector: 'body[data-screen="pod"] > .ship-header, #portalWorkoutHome > .ship-header',
    name: 'hologram', priority: 20, opacity: .24,
    // A small plate accent in the open centre, clear of the brand and Settings.
    style: {top: '5px', left: 'calc(50% - 56px)', width: '112px', height: '30px', zIndex: '0'},
    active: host => available(host) &&
      (!!host.closest('#portalWorkoutHome') || host.ownerDocument?.body?.dataset.screen === 'pod'),
    components: () => projection('#b877ed', plate),
  },
  {
    selector: '#hologramPanel #holoStage',
    name: 'hologram', priority: 20, opacity: .3,
    // Small projection light in the stage margin, clear of the figure and setup controls.
    style: {bottom: 'auto', top: '12px', left: '12px', width: '64px', height: '32px', zIndex: '0'},
    active: host => available(host) && !!host.closest('#hologramPanel') &&
      !!host.closest('dialog')?.open,
    components: () => projection('#9afae4', pedestal),
  },
  {
    selector: '.war-room .gala-bay-stage',
    name: 'hologram', priority: 20, opacity: .24,
    style: {bottom: 'auto', top: '80px', left: '12px', width: '64px', height: '32px', zIndex: '2'},
    active: host => available(host) && !!host.closest('.war-room'),
    components: () => projection('#ff9a1f', plate),
  },
  {
    // The current hand customizer owns the model and floor. Keep a projection
    // light in its empty upper corner, clear of the hand and bottom view tools.
    selector: '.design-studio .viewport-panel .hand-canvas',
    name: 'hologram', priority: 20, opacity: .28,
    style: {inset: 'auto', top: '12px', right: '12px', width: '64px', height: '32px', zIndex: '2'},
    active: host => available(host) && !!host.closest('.design-studio') &&
      !!host.querySelector('canvas:not([data-shader-effect])') &&
      !host.closest('.hand-viewer-wrap')?.querySelector('.model-status'),
    components: () => projection('#78ffdc', pedestal),
  },
];
