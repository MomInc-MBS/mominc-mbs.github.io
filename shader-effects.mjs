// Decorative WebGPU effects. The existing artwork remains the immediate fallback.
export function startShaderEffects({targets, loadRuntime = () => import('/vendor/shaders/runtime.mjs')} = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let spent = new WeakMap();
  const failed = new WeakMap(), exhausted = new Set();
  let current = null, timer = 0, stopped = false, epoch = 0, runtime, owner=null;
  const canRun = () => !stopped && !document.hidden && !reduced.matches && !!navigator.gpu && !document.getElementById('mbs-game-loading') &&
    document.body.dataset.cameraWorkout !== 'true' && document.body.dataset.tracking !== 'true';
  function visible(host) {
    if (!host.isConnected || host.closest('[hidden], [inert]')) return false;
    const dialog = host.closest('dialog');
    if (dialog && !dialog.open) return false;
    const modal = [...document.querySelectorAll('dialog[open]')].at(-1);
    if (modal && !modal.contains(host)) return false;
    const tv = host.closest('#tv');
    if(tv && tv.dataset.state!=='on')return false;
    const style = getComputedStyle(host), rect = host.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 &&
      rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
  }
  function mark(map, host, target) {
    const names = map.get(host) || new Set(); names.add(target); map.set(host, names);
  }
  function destroy() {
    epoch++;
    if (!current) return;
    clearTimeout(current.timeout);
    current.resize?.disconnect();
    current.shader?.destroy();
    current.canvas.remove();
    current = null;
  }
  function candidates() {
    for(const entry of exhausted) if(!entry.host.isConnected || !entry.host.matches(entry.target.selector) || (entry.target.active && !entry.target.active(entry.host))) {
      spent.get(entry.host)?.delete(entry.target); exhausted.delete(entry);
    }
    const list = [];
    for (const target of targets || []) for (const host of document.querySelectorAll(target.selector)) {
      const active = !target.active || target.active(host);
      if (!active) { spent.get(host)?.delete(target); failed.get(host)?.delete(target); continue; }
      if (!spent.get(host)?.has(target) && !failed.get(host)?.has(target) && visible(host)) list.push({target, host});
    }
    return list.sort((a,b) => (b.target.priority || 0) - (a.target.priority || 0));
  }
  function resize(entry) {
    if (!entry.shader || !entry.canvas.isConnected) return;
    const {width,height} = entry.canvas.getBoundingClientRect();
    // Explicit bounded dimensions keep decorative surfaces inexpensive on high-DPR phones.
    const scale = Math.min(1, 600 / Math.max(1,width), 400 / Math.max(1,height)) / Math.max(1,devicePixelRatio || 1);
    const cssWidth=entry.canvas.style.width, cssHeight=entry.canvas.style.height;
    entry.shader.resize(Math.max(1,Math.round(width*scale)), Math.max(1,Math.round(height*scale)));
    entry.canvas.style.width=cssWidth; entry.canvas.style.height=cssHeight;
  }
  async function mount({target, host}) {
    const canvas = document.createElement('canvas');
    canvas.className = 'shaders-layer'; canvas.dataset.shader = target.name; canvas.dataset.shaderEffect=target.name;
    canvas.setAttribute('aria-hidden','true');
    Object.assign(canvas.style, {position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',opacity:String(target.opacity ?? .35),zIndex:'0',...target.style});
    host.append(canvas);
    const entry = current = {host,target,canvas,shader:null};
    const request = ++epoch;
    try {
      runtime ||= loadRuntime();
      const {createShader} = await runtime;
      if (request !== epoch || !canRun() || !visible(host) || (target.active && !target.active(host))) {
        if (current === entry) destroy(); return;
      }
      const shader = await createShader(canvas,{components:target.components(host)},{disableTelemetry:true,observeElement:false,onError:()=>{
        setTimeout(()=>{if(current===entry && entry.shader?.getFailureReason?.()){mark(failed,host,target);destroy();schedule();}},0);
      }});
      if (request !== epoch || !canRun() || !visible(host) || (target.active && !target.active(host))) {
        shader.destroy(); if (current === entry) destroy(); return;
      }
      if (shader.getFailureReason?.()) { shader.destroy(); mark(failed,host,target); destroy(); return; }
      entry.shader = shader; resize(entry);
      entry.resize = new ResizeObserver(() => resize(entry)); entry.resize.observe(host);
      if (target.durationMs) entry.timeout = setTimeout(() => { mark(spent,host,target); exhausted.add({host,target}); if (current === entry) destroy(); schedule(); },target.durationMs);
    } catch {
      mark(failed,host,target);
      if (current === entry) destroy();
    }
  }
  function sync() {
    timer = 0;
    if (!canRun()) { destroy(); return; }
    const next = candidates()[0];
    if (current && next?.host === current.host && next.target === current.target) return;
    destroy(); if (next) void mount(next);
  }
  function schedule() {
    if (!stopped && !timer) timer = setTimeout(sync,80);
  }
  const observer = new MutationObserver(records=>{
    for(const entry of exhausted) for(const record of records) if(record.target.contains?.(entry.host) &&
      (record.attributeName==='data-phase' || record.attributeName==='open' ||
        (record.attributeName==='class' && record.target.matches('.reward-pack-dialog') && !String(record.oldValue).split(/\s+/).includes('opened')))) {
      spent.get(entry.host)?.delete(entry.target);exhausted.delete(entry);break;
    }
    schedule();
  });
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['open','hidden','inert','class','data-state','data-phase','data-screen','data-camera-workout','data-tracking','data-wonder']});
  const events = ['scroll','resize','visibilitychange','pageshow'];
  for (const type of events) window.addEventListener(type,schedule,{passive:true,capture:true});
  reduced.addEventListener('change',schedule);
  const clear = () => { spent=new WeakMap(); exhausted.clear(); destroy(); schedule(); };
  const account = event => {const next=`${event.detail?.user?.id || ''}/${event.detail?.dataEpoch ?? ''}`;if(next!==owner){owner=next;clear();}};
  window.addEventListener('myr5:account-cleared',clear);
  window.addEventListener('myr5:account-ready',account);
  function dispose() {
    stopped = true; clearTimeout(timer); timer = 0; destroy(); observer.disconnect();
    for (const type of events) window.removeEventListener(type,schedule,true);
    reduced.removeEventListener('change',schedule);
    window.removeEventListener('myr5:account-cleared',clear);
    window.removeEventListener('myr5:account-ready',account);
    window.removeEventListener('pagehide',hide);
  }
  const hide = () => { clearTimeout(timer); timer=0; destroy(); };
  window.addEventListener('pagehide',hide); schedule();
  return {dispose,refresh:schedule};
}
