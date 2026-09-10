const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'tv/retro-pointer.js'),'utf8');
function environment(t,route='/tv/?ch=mominc',reduced=false){
 const dom=new JSDOM('<!doctype html><html><head></head><body><button id="tap">Tap</button><input id="name"><div data-sponsor="fuel"><button id="fuel">Fly</button></div><dialog open><button id="modal">Tap in popup</button></dialog></body></html>',{url:'https://mominc.online'+route,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document,timers=new Map();let id=0;w.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};w.clearTimeout=id=>timers.delete(id);w.matchMedia=()=>({matches:reduced});w.eval(source);t.after(()=>{w.dispatchEvent(new w.Event('pagehide'));dom.window.close();});
 return {w,d,timers,event(type,target='#tap',props={}){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerType:'touch',pointerId:1,clientX:40,clientY:70,...props});d.querySelector(target).dispatchEvent(e);return e;},get marker(){return d.querySelector('.retro-touch-marker');},get css(){return d.querySelector('#retro-pointer-style').textContent;},expire(){for(const timer of [...timers.values()])timer.fn();}};
}
test('channel, game, customizer and terminal routes select their own pointer style',t=>{
 const routes={'/tv/?ch=mominc':'mominc','/tv/?ch=girlfriend':'girlfriend','/play/djscratch/':'djscratch','/games/lilboyfriend/':'lilboyfriend','/play/corgi/':'corgi','/tv/games/goon/':'goon','/arcade/tub-flight/':'fuel','/gala/':'goon','/gala/terminal/':'terminal','/handborne/':'handborne','/download/':'files','/coach-setup/':'armie','/tv/?ch=unknown':'mominc'};
 for(const [route,theme] of Object.entries(routes)){const e=environment(t,route);assert.equal(e.d.documentElement.dataset.retroPointer,theme,route);}
});
test('all twelve cursor themes use original crisp 48px artwork, with valid hotspots and semantic variants',t=>{
 const e=environment(t);const drawings=[...e.css.matchAll(/--retro-arrow:url\("data:image\/svg\+xml,([^"\n]+)"\) 3 0/g)];assert.equal(drawings.length,12);assert.equal(new Set(drawings.map(m=>m[1])).size,12);
 for(const [,encoded] of drawings){const svg=new e.w.DOMParser().parseFromString(decodeURIComponent(encoded),'image/svg+xml');assert.equal(svg.querySelector('parsererror'),null);assert.equal(svg.documentElement.getAttribute('width'),'48');assert.equal(svg.documentElement.getAttribute('height'),'48');assert.equal(svg.documentElement.getAttribute('shape-rendering'),'crispEdges');for(const cell of svg.querySelectorAll('rect')){assert.ok(Number(cell.getAttribute('x'))<16);assert.ok(Number(cell.getAttribute('y'))<16);}}
 assert.match(e.css,/--retro-hand:/);assert.match(e.css,/--retro-text:/);assert.match(e.css,/cursor:not-allowed!important/);assert.doesNotMatch(e.css,/cursor:none/);e.w.eval(source);assert.equal(e.d.querySelectorAll('#retro-pointer-style').length,1);
});
test('mobile taps show the page pointer without preventing the tap, then remove it',t=>{
 const e=environment(t,'/play/corgi/');let clicks=0;e.d.querySelector('#tap').addEventListener('click',()=>clicks++);const down=e.event('pointerdown');assert.equal(down.defaultPrevented,false);assert.equal(e.marker.dataset.retroPointer,'corgi');assert.equal(e.marker.style.left,'40px');assert.equal(e.marker.style.top,'70px');assert.equal(e.marker.parentElement.getAttribute('aria-hidden'),'true');e.d.querySelector('#tap').click();assert.equal(clicks,1);e.event('pointerup');assert.ok(e.marker.classList.contains('released'));e.expire();assert.equal(e.marker,null);assert.equal(e.d.querySelector('.retro-touch-layer'),null);
});
test('scrolling, a drag, pointer cancellation, and page departure clear touch feedback',t=>{
 const e=environment(t);for(const stop of [()=>e.event('pointermove','#tap',{clientX:80}),()=>e.event('pointercancel'),()=>e.d.dispatchEvent(new e.w.Event('scroll')),()=>e.w.dispatchEvent(new e.w.Event('pagehide'))]){e.event('pointerdown');assert.ok(e.marker);stop();assert.equal(e.marker,null);assert.equal(e.timers.size,0);}
});
test('mouse movement and text entry get no touch marker; Fuel ads and native popups get the right local feedback',t=>{
 const e=environment(t);e.event('pointerdown','#tap',{pointerType:'mouse'});assert.equal(e.marker,null);e.event('pointerdown','#name');assert.equal(e.marker,null);e.event('pointerdown','#fuel');assert.equal(e.marker.dataset.retroPointer,'fuel');e.event('pointerup','#fuel');e.expire();e.event('pointerdown','#modal');assert.equal(e.marker.closest('dialog'),e.d.querySelector('dialog'));
});
test('reduced motion uses a short static touch marker',t=>{
 const e=environment(t,'/tv/',true);e.event('pointerdown');e.event('pointerup');assert.equal([...e.timers.values()][0].ms,150);assert.match(e.css,/@media\(prefers-reduced-motion:reduce\)/);e.expire();assert.equal(e.marker,null);
});
test('public website, standalone games, and embedded Gala all load the shared pointer',()=>{
 const pages=['tv/index.html','download/index.html','coach-setup/index.html','files/index.html','games/index.html','gala/index.html','gala/music.html','gala/terminal/index.html','handborne/index.html','handborne/source/hand-entry.html','arcade/tub-flight/index.html','tv/games/goon/index.html','tv/assets/armie-intro/index.html','tv/assets/armie-intro/creature-tv.html',...['lilboyfriend','girlfriend','fuel','goon','djscratch','corgi'].flatMap(name=>['play/'+name+'/index.html','games/'+name+'/index.html']),'games/armie/index.html'];
 for(const page of pages){const html=fs.readFileSync(path.join(root,page),'utf8');assert.equal((html.match(/src="\/tv\/retro-pointer.js"/g)||[]).length,1,page);}
});
