/* Keep the phone cockpit inside the visible area when the native keyboard opens. */
(() => {
  const phone = window.matchMedia('(max-width: 650px)');
  const viewport = window.visualViewport;
  let baseline = 0;
  let baselineWidth = 0;

  function isTextInput(element) {
    return element instanceof HTMLElement &&
      (element.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'));
  }

  function keepFocusedInputVisible() {
    const input = document.activeElement;
    const pane = input?.closest?.('#terminal');
    if (!pane || !isTextInput(input)) return;
    const paneRect = pane.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    if (inputRect.bottom > paneRect.bottom - 8) pane.scrollTop += inputRect.bottom - paneRect.bottom + 8;
    if (inputRect.top < paneRect.top + 8) pane.scrollTop -= paneRect.top - inputRect.top + 8;
  }

  function syncViewport() {
    const body = document.body;
    if (!body) return;
    if (!phone.matches) {
      body.style.removeProperty('--cockpit-viewport-height');
      body.classList.remove('keyboard-open');
      return;
    }
    const width = Math.round(viewport?.width || window.innerWidth);
    const height = Math.round(Math.min(window.innerHeight, viewport?.height || window.innerHeight));
    if (Math.abs(width - baselineWidth) > 60) {
      baselineWidth = width;
      baseline = height;
    }
    if (!isTextInput(document.activeElement)) baseline = Math.max(baseline, height);
    body.style.setProperty('--cockpit-viewport-height', `${height}px`);
    body.classList.toggle('keyboard-open', isTextInput(document.activeElement) && baseline - height > 100);
    requestAnimationFrame(keepFocusedInputVisible);
  }

  window.addEventListener('resize', syncViewport, { passive: true });
  window.addEventListener('orientationchange', syncViewport, { passive: true });
  viewport?.addEventListener('resize', syncViewport, { passive: true });
  viewport?.addEventListener('scroll', syncViewport, { passive: true });
  document.addEventListener('focusin', (event) => {
    if (isTextInput(event.target)) {
      syncViewport();
      setTimeout(syncViewport, 100);
      setTimeout(syncViewport, 300);
    }
  });
  document.addEventListener('focusout', () => setTimeout(syncViewport, 100));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncViewport, { once: true });
  else syncViewport();
})();
