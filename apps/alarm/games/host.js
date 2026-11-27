// MOM's alarm-game host: ONE lifecycle for every extra game. Game module shape: {id, rulesVersion, create() -> game}; game = {mount(el, ctx), start(), pause(), resume(), resize(b), serialize(), destroy()}.
// ctx = {roundId, token, config, saved, finish(outcome, reason, finalState), save(), error(reason)}. The host accepts a terminal event only from the mounted game + roundId + token, once.
// Real-time games run only while started AND visible (tab visible, element has size, not host-paused). Hidden -> pause(); visible -> resume() with no catch-up (games reset their clock).
// A load/mount failure is a NON-terminal error (the caller falls back to 2048); it is never a loss. Nothing here can complete an occurrence: it hands {gameId, rulesVersion, roundId, outcome, finalState} to onFinish.
export function createHost({onFinish, onSave, onError, doc = document, win = window} = {}) {
  let cur = null, serial = 0;                                  // cur = {game, mod, roundId, token, el, started, manual, running, finished, off[]}
  const tok = () => `${Date.now().toString(36)}-${(++serial).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const safe = (f, ...a) => { try { return f?.(...a); } catch (e) { console.warn('alarm game host:', e); } };
  const bounds = c => { const r = c.el.getBoundingClientRect(); return {width: Math.floor(r.width), height: Math.floor(r.height)}; };
  const visible = c => !doc.hidden && c.el.isConnected && bounds(c).width > 0 && bounds(c).height > 0;
  const save = c => { if (cur === c && !c.finished && c.game) safe(() => onSave?.({gameId: c.mod.id, rulesVersion: c.mod.rulesVersion, roundId: c.roundId, saved: c.game.serialize()})); };
  function sync(c) {                                           // reconcile "should be running" with what the game was last told
    if (cur !== c || c.finished) return;
    const want = c.started && !c.manual && visible(c);
    if (want === c.running) return;
    c.running = want;
    if (want) safe(() => c.began ? c.game.resume() : (c.began = true, c.game.start())); else { safe(() => c.game.pause()); save(c); }
  }
  function mount(el, mod, {roundId, config = {}, saved = null} = {}) {
    destroy();
    const c = cur = {mod, roundId, token: tok(), el, started: false, manual: false, running: false, finished: false, off: []};
    const mine = () => cur === c && !c.finished;
    try {
      if (!mod || typeof mod.create !== 'function' || typeof roundId !== 'string' || !roundId) throw Error('bad game module');
      c.game = mod.create();
      c.game.mount(el, {roundId, token: c.token, config, saved,
        finish: (outcome, reason, finalState) => {              // terminal: current game + round + token, at most once
          if (!mine()) return false;
          if (outcome !== 'won' && outcome !== 'lost') return false;
          c.finished = true; c.running = false;
          safe(() => c.game.pause());
          safe(onFinish, {gameId: mod.id, rulesVersion: mod.rulesVersion, roundId, outcome, reason, finalState});
          return true;
        },
        save: () => save(c),
        error: reason => { if (mine()) safe(onError, {gameId: mod.id, roundId, reason: String(reason)}); }});
    } catch (e) { if (cur === c) { destroy(); safe(onError, {gameId: mod?.id, roundId, reason: 'mount:' + (e?.message || e)}); } return false; }
    const vis = () => sync(c), hide = () => { if (cur === c) { c.running = false; safe(() => c.game.pause()); save(c); } };
    doc.addEventListener('visibilitychange', vis); win.addEventListener('pagehide', hide);
    c.off.push(() => doc.removeEventListener('visibilitychange', vis), () => win.removeEventListener('pagehide', hide));
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => { if (cur === c && !c.finished) { const b = bounds(c); if (b.width > 0 && b.height > 0) safe(() => c.game.resize(b)); sync(c); } });
      ro.observe(el); c.off.push(() => ro.disconnect());
    }
    const b = bounds(c); if (b.width > 0 && b.height > 0) safe(() => c.game.resize(b));
    return true;
  }
  /** Dynamic-import a game module by URL; any failure is a non-terminal error. */
  async function load(el, url, opts) {
    let mod; try { mod = (await import(url)).default; } catch (e) { safe(onError, {gameId: null, roundId: opts?.roundId, reason: 'load:' + (e?.message || e)}); return false; }
    return mount(el, mod, opts);
  }
  const start = () => { if (cur && !cur.finished) { cur.started = true; sync(cur); } };
  const pause = () => { if (cur) { cur.manual = true; sync(cur); } };
  const resume = () => { if (cur) { cur.manual = false; sync(cur); } };
  const resize = () => { if (cur && !cur.finished) { const b = bounds(cur); if (b.width > 0 && b.height > 0) safe(() => cur.game.resize(b)); } };
  const serialize = () => cur && !cur.finished ? safe(() => cur.game.serialize()) : null;
  function destroy() {
    const c = cur; if (!c) return; save(c); cur = null;         // c.finished/cur cleared first: a late finish() from the dying game is dropped
    c.off.forEach(f => safe(f)); safe(() => c.game?.destroy()); c.el.replaceChildren?.();
  }
  return {mount, load, start, pause, resume, resize, serialize, destroy, get roundId() { return cur?.roundId ?? null; }, get running() { return !!cur?.running; }};
}
