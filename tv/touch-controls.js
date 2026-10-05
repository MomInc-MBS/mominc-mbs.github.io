/* Shared browser-gesture guard. Install before the game runtime on every route. */
(() => {
  if (document.getElementById('mbs-touch-controls')) return;
  const controls = 'button,[role="button"],canvas,svg,[data-control],.joystick,.cc-joy,.corner,.platter,.knob,.touch-controls,.dpad,#controls,#lbStage,#deck,#sgStage,#sgInvSrc,#selectWrap,#gameWrap,#ccViewport,.fu-stage,#ggFrame,#dgStage';
  const editable = 'input,textarea,select,[contenteditable=""],[contenteditable="true"],[data-selectable]';
  const style = document.createElement('style');
  style.id = 'mbs-touch-controls';
  style.textContent = `
    :is(${controls}), :is(${controls}) * {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-user-drag: none;
    }
    button, [role="button"] { touch-action: manipulation; }
    canvas, .joystick, .touch-controls, .dpad, #controls button { touch-action: none; }
    :is(${controls}) :is(${editable}),
    :is(${controls}) :is(${editable}) *,
    :is(${editable}) {
      -webkit-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default !important;
    }
  `;
  document.head.append(style);
  const isControl = target => {
    const el = target instanceof Element ? target : target?.parentElement;
    return el && !el.closest(editable) && el.closest(controls);
  };
  // Do not cancel touchstart/pointerdown: native clicks and game hold handlers must run.
  for (const type of ['selectstart', 'contextmenu']) {
    document.addEventListener(type, event => {
      if (isControl(event.target)) event.preventDefault();
    }, { capture: true });
  }
  document.addEventListener('dragstart', event => {
    if (isControl(event.target) && event.target?.getAttribute?.('draggable') !== 'true') event.preventDefault();
  }, { capture: true });
})();
