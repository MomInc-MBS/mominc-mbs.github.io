const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const recipe=[0,1,2,3,4,5],reward={version:1,acquiredAt:1,recipe};
function dom(t,route,html=''){
 const d=new JSDOM('<!doctype html><html><head></head><body>'+html+'</body></html>',{url:'https://mominc.online'+route,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
 const w=d.window;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});
 w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[{width:100,height:40}];};
 const native=w.getComputedStyle;w.getComputedStyle=el=>{const s=native.call(w,el);return {display:s.display,visibility:s.visibility,pointerEvents:s.pointerEvents||'auto'};};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 t.after(()=>{w.dispatchEvent(new w.Event('pagehide'));d.window.close();});return w;
}
function guide(w,{earned=true,done=[]}={}){
 let now=1000,serial=0;const timers=new Map();w.Date.now=()=>now;w.setTimeout=(fn,ms)=>{timers.set(++serial,{at:now+ms,fn});return serial;};w.clearTimeout=id=>timers.delete(id);
 if(earned)w.localStorage.setItem('mbs-goggles-v1',JSON.stringify(reward));
 w.eval(read('tv/mbs-channels.js'));w.MBS_STATE={completedPages:()=>done};w.eval(read('tv/idle-guide.js'));
 return {tick(ms){now+=ms;for(const [id,item] of [...timers])if(item.at<=now){timers.delete(id);item.fn();}},timers,done};
}
test('orange guidance is locked until correct goggles pickup, then waits five seconds',t=>{
 const w=dom(t,'/gala/','<main><button id="join" data-guide-next>Finish character</button></main>'),g=guide(w,{earned:false}),button=w.document.querySelector('#join');
 g.tick(10000);assert.ok(!button.classList.contains('mbs-idle-glow'));
 for(const line of [{v:2,phase:'grab',poured:recipe},{v:2,phase:'goggles',poured:[1,0,2,3,4,5]}]){
  w.localStorage.setItem('mbs-dg-line',JSON.stringify(line));w.dispatchEvent(new w.StorageEvent('storage',{key:'mbs-dg-line'}));g.tick(5000);assert.equal(w.MBS_GUIDE.earned(),false);
 }
 w.localStorage.setItem('mbs-goggles-v1',JSON.stringify(reward));w.dispatchEvent(new w.Event('mbs:goggles-earned'));
 g.tick(4999);assert.equal(w.document.querySelector('.mbs-idle-glow'),null);g.tick(1);assert.equal(w.document.querySelector('.mbs-idle-glow'),button);
 w.document.dispatchEvent(new w.Event('pointermove'));assert.equal(w.document.querySelector('.mbs-idle-glow'),null);g.tick(4999);assert.equal(w.document.querySelector('.mbs-idle-glow'),null);g.tick(1);assert.equal(w.document.querySelector('.mbs-idle-glow'),button);
 assert.match(w.document.querySelector('[data-idle-guide-style]').textContent,/outline:1px solid #ff961f/);
 assert.match(w.document.querySelector('[data-idle-guide-style]').textContent,/prefers-reduced-motion:reduce/);
});
test('the earned glow works across site routes and skips unavailable actions',t=>{
 for(const route of ['/gala/','/tv/?ch=djscratch','/play/corgi/','/games/lilboyfriend/','/handborne/','/files/','/download/','/coach-setup/','/arcade/tub-flight/']){
  const w=dom(t,route,'<main><button data-guide-next hidden>Hidden</button><button data-guide-next disabled>Disabled</button><button data-guide-next id="next">Continue</button></main>'),g=guide(w);
  g.tick(5000);assert.equal(w.document.querySelector('.mbs-idle-glow')?.id,'next',route);
 }
});
test('completed pages guide to the next unfinished active page, and stop when all are done',t=>{
 const w=dom(t,'/tv/?ch=goon','<a class="lcd-card" data-id="girlfriend" href="?ch=girlfriend">Dr Girlfriend</a><a class="lcd-card" data-id="djscratch" href="?ch=djscratch">DJ</a>'),g=guide(w,{done:['girlfriend','goon']});
 g.tick(5000);assert.equal(w.document.querySelector('.mbs-idle-glow').dataset.id,'djscratch');
 g.done.push('djscratch');w.MBS_GUIDE.refresh();assert.equal(w.document.querySelector('.mbs-idle-glow').dataset.nextPage,'lilboyfriend');
 g.done.push('lilboyfriend','corgi');w.MBS_GUIDE.refresh();assert.equal(w.document.querySelector('.mbs-idle-glow'),null);assert.equal(w.document.querySelector('[data-idle-next-page]'),null);
});
test('legacy goggles are recovered only after actual pickup and remain earned during a new batch',t=>{
 const w=dom(t,'/gala/','<button id="join">Join</button>');w.localStorage.setItem('mbs-dg-line',JSON.stringify({v:2,phase:'goggles',poured:recipe}));const g=guide(w,{earned:false});
 assert.equal(w.MBS_GUIDE.earned(),true);assert.ok(w.localStorage.getItem('mbs-goggles-v1'));w.localStorage.removeItem('mbs-dg-line');g.tick(5000);assert.equal(w.document.querySelector('.mbs-idle-glow').id,'join');
});
test('War Room guidance selects a legal move and frame activity resets the parent timer',t=>{
 const w=dom(t,'/play/goon/','<button class="ggTap" data-dir="left">Left</button><button class="ggTap" data-dir="right">Right</button><iframe id="ggGame"></iframe>');
 const frame=w.document.querySelector('iframe'),fw=frame.contentWindow;fw.galaSceneInstance={hasWon:false,hasLegalMoveInDirection:d=>d==='right'};
 // about:blank inherits the origin, but jsdom reports a null origin. Attach explicitly.
 const g=guide(w);w.MBS_GUIDE.attach(fw.document);g.tick(5000);assert.equal(w.document.querySelector('.mbs-idle-glow').dataset.dir,'right');
 fw.document.dispatchEvent(new fw.Event('pointerdown'));assert.equal(w.document.querySelector('.mbs-idle-glow'),null);g.tick(5000);assert.equal(w.document.querySelector('.mbs-idle-glow').dataset.dir,'right');
});
test('the real laboratory awards goggles only after the correct sequence, mould, pack and pickup',t=>{
 for(const order of [recipe,[1,0,2,3,4,5]]){
  const w=dom(t,'/tv/?ch=girlfriend',read('tv/channels/girlfriend.html')),completions=[];
  w.eval(read('tv/channels/girlfriend.js').replace('export default {','window.DG = {'));
  const ctx={on:(el,type,fn)=>el.addEventListener(type,fn),timeout:fn=>fn(),interval:()=>0,audio:x=>x,mbs:{unlock(){},wave(){},complete:(...args)=>completions.push(args)}};
  w.DG.mount(w.document.querySelector('.dg'),ctx);const click=text=>[...w.document.querySelectorAll('#dgDock button')].find(b=>b.textContent===text).click();
  order.forEach(i=>w.document.querySelector('#dgTubeProps').children[i].click());click('Mould coach');w.document.querySelector('#dgReportClose').click();click('Pack');
  assert.equal(w.localStorage.getItem('mbs-goggles-v1'),null,'correct crafting alone is not pickup');click('Take goggles');
  if(order===recipe){assert.deepEqual(JSON.parse(w.localStorage.getItem('mbs-goggles-v1')).recipe,recipe);assert.equal(completions[0][0],'girlfriend');}
  else {assert.equal(w.localStorage.getItem('mbs-goggles-v1'),null);assert.equal(completions.length,0);}
 }
});
test('character drafts stay locked; finishing saves the character and opens the unlocked Goon page',t=>{
 for(const blocked of [false,true]){
  const w=dom(t,'/gala/',read('gala/index.html'));w.eval(read('tv/dj-identity.js'));w.eval(read('gala/avatar.js'));w.GalaAvatar.draw=c=>{c.width=64;c.height=96;};
  if(blocked)w.Storage.prototype.setItem=function(k,v){if(this===w.localStorage)throw Error('blocked');Object.defineProperty(this,k,{value:String(v),configurable:true});};
  w.eval(read('gala/gala.js').replace("location.assign('/tv/?ch=goon')","window.joinDestination='/tv/?ch=goon'"));
  w.document.getElementById('random').click();assert.equal(w.localStorage.getItem('mbs-gala-character-created-v1'),null);
  w.document.getElementById('join').click();assert.equal(w.joinDestination,'/tv/?ch=goon');
  if(!blocked)assert.ok(Number(w.localStorage.getItem('mbs-gala-character-created-v1'))>0);
  else assert.ok(w.sessionStorage['mbs-gala-character-created-v1']);
 }
});
test('an open Goon page unlocks immediately and stays unlocked on return without awarding a ranked win',async t=>{
 const w=dom(t,'/tv/?ch=goon','<article id="gn"><section class="network-launch"><a href="/gala/"><span>Create</span></a></section><p data-gala-entry-note></p><div class="wrap">Content</div></article>');
 const done=new Set();w.MBS_STATE={completedPages:()=>[...done],completePage:id=>done.add(id)};
 w.eval(read('tv/network-flow.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 assert.equal(w.document.querySelector('#gn').hasAttribute('data-gala-unlocked'),false);
 w.localStorage.setItem('mbs-gala-character-created-v1','123');w.dispatchEvent(new w.StorageEvent('storage',{key:'mbs-gala-character-created-v1'}));
 assert.ok(w.document.querySelector('#gn').hasAttribute('data-gala-unlocked'));assert.ok(done.has('goon'));assert.equal(w.document.querySelector('.network-launch a').getAttribute('href'),'/play/goon/');
 w.dispatchEvent(new w.Event('pageshow'));assert.ok(w.document.querySelector('#gn').hasAttribute('data-gala-unlocked'));
 assert.match(read('tv/run-progress.js'),/if\(e.detail\?\.site!=='goon'\)/);await new Promise(setImmediate);
});
function game(){
 const context={window:{},document:{},location:{},console};vm.createContext(context);vm.runInContext(read('gala/ammo.js'),context);
 const source=read('tv/games/goon/assets/index-W2w8AfON.js');const start=source.indexOf('zs=class zs extends ve.Scene'),end=source.indexOf(';Ot(zs,"HINT_CSS_DIRECTION"',start);
 Object.assign(context,{ve:{Scene:class{}},Ot:(obj,key,value)=>obj[key]=value,Ce:4,Zp:12,Ti:120});vm.runInContext(source.slice(start,end)+';window.Game=zs;',context);
 const scene=new context.window.Game(),data=new Map();scene.scoreText={getData:k=>data.get(k),setData:(k,v)=>data.set(k,v)};return {scene,ammo:context.window.GalaAmmo};
}
test('ammo starts small, merges once per move, and scores firepower beyond the final tier',()=>{
 const {scene,ammo}=game();for(let i=0;i<30;i++){scene.resetBoard();const occupied=scene.board.flat().filter(Boolean);assert.equal(occupied.length,2);assert.ok(occupied.every(n=>n===1||n===2));}
 assert.deepEqual(Array.from(scene.mergeRow([1,1,1,1],true)),[2,2,0,0]);assert.equal(scene.scoreText.getData('score'),'4');
 assert.deepEqual(Array.from(scene.mergeRow([1,1,2,0],true)),[2,2,0,0]);assert.deepEqual(Array.from(scene.mergeRow([1,1,0,0],false)),[0,0,0,2]);
 scene.mergeRow([12,12,0,0],true);assert.equal(Number(scene.scoreText.getData('score')),4104);assert.equal(ammo.tierInfo(13).name,'Reality breaker Mk 2');
 const before=scene.scoreText.getData('score');scene.hasLegalMoveInDirection('up');assert.equal(scene.scoreText.getData('score'),before);
 for(let tier=2;tier<=14;tier++)assert.equal(ammo.power(tier),ammo.power(tier-1)*2);
});
test('all twelve 3D ammo models fit their cells and have distinct geometry',async()=>{
 const T=await import('../tv/assets/armie-intro/vendor/three.core.js'),{ammo}=game(),signatures=new Set();
 for(let tier=1;tier<=13;tier++){
  const object=ammo.model(tier,T),box=new T.Box3().setFromObject(object),size=box.getSize(new T.Vector3());
  assert.ok(size.x<.86&&size.z<.86&&size.y<.9,'tier '+tier+' stays in its cell');assert.ok([size.x,size.y,size.z].every(Number.isFinite));
  if(tier<=12)signatures.add(JSON.stringify(object.children.map(m=>[m.geometry.type,m.geometry.parameters,m.material.color.getHex()])));
 }assert.equal(signatures.size,12);
});
