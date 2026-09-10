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
test('Gala and War Room guidance select a legal move and frame activity resets the parent timer',t=>{
 for(const route of ['/play/goon/','/play/war-room/']){
 const w=dom(t,route,'<button class="ggTap" data-dir="left">Left</button><button class="ggTap" data-dir="right">Right</button><iframe id="ggGame"></iframe>');w.document.documentElement.dataset.game='goon';
 const frame=w.document.querySelector('iframe'),fw=frame.contentWindow;fw.galaSceneInstance={hasWon:false,hasLegalMoveInDirection:d=>d==='right'};
 // about:blank inherits the origin, but jsdom reports a null origin. Attach explicitly.
 const g=guide(w);w.MBS_GUIDE.attach(fw.document);g.tick(5000);assert.equal(w.document.querySelector('.mbs-idle-glow').dataset.dir,'right');
 fw.document.dispatchEvent(new fw.Event('pointerdown'));assert.equal(w.document.querySelector('.mbs-idle-glow'),null);g.tick(5000);assert.equal(w.document.querySelector('.mbs-idle-glow').dataset.dir,'right');
 }
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
function game(asset='index-W2w8AfON.js'){
 const context={window:{},document:{},location:{},console};vm.createContext(context);vm.runInContext(read('gala/ammo.js'),context);
 const source=read('tv/games/goon/assets/'+asset);const start=source.lastIndexOf('wr=',source.indexOf('zs=class zs extends ve.Scene')),end=source.indexOf(';Ot(zs,"HINT_CSS_DIRECTION"',start);
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
test('the original Gala keeps money tiles and scoring without loading War Room assets',()=>{
 const {scene}=game('index-gala-classic.js');for(let i=0;i<30;i++){scene.resetBoard();const occupied=scene.board.flat().filter(Boolean);assert.equal(occupied.length,2);assert.ok(occupied.every(n=>n===5||n===6));}
 assert.deepEqual(Array.from(scene.mergeRow([5,5,0,0],true)),[6,0,0,0]);assert.equal(scene.scoreText.getData('score'),'32');
 scene.board=[[12,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];assert.equal(scene.checkWinCondition(),true);
 const entry=read('tv/games/goon/index.html'),bundle=read('tv/games/goon/assets/index-gala-classic.js');
 assert.match(entry,/index-gala-classic\.js/);assert.doesNotMatch(entry,/war-room\.js|ammo\.js|hologram/);
 assert.doesNotMatch(bundle,/GalaWarRoom|GalaAmmo/);assert.match(bundle,/this\.bar=i,i\.position\.set\(2\.9,0,0\)/);assert.match(bundle,/PLEDGED SO FAR: \$/);assert.match(bundle,/Kp=5000/);assert.match(bundle,/checkpoint\("goon"\)/);
});
test('both War Room entries require full-run and app clearance before loading the game',async t=>{
 for(const route of ['/play/war-room/','/tv/games/goon/war-room.html'])for(const run of [null,{completedAt:1},{installedAt:1},{completedAt:1,installedAt:1}]){
  const w=dom(t,route);w.localStorage.setItem('mbs-gala-character-created-v1','123');w.localStorage.setItem('mbs-gala-completed-v1','123');
  w.MBS_RUN={read:()=>run,refresh:async()=>run};let loaded=0;
  w.eval(read('gala/war-room-access.js').replace("target.location.replace('/gala/terminal/')","window.blockedDestination='/gala/terminal/'"));
  const entered=await w.GalaWarRoomAccess.enter(()=>{loaded++;});const eligible=!!(run?.completedAt&&run?.installedAt);
  assert.equal(entered,eligible);assert.equal(loaded,eligible?1:0);if(!eligible)assert.equal(w.blockedDestination,'/gala/terminal/');
 }
 const w=dom(t,'/play/war-room/');let state=null,resolveRefresh,loaded=0;
 w.MBS_RUN={read:()=>state,refresh:()=>new Promise(resolve=>{resolveRefresh=()=>{state={completedAt:1,installedAt:1};resolve(state);};})};w.eval(read('gala/war-room-access.js'));
 const entering=w.GalaWarRoomAccess.enter(()=>{loaded++;});assert.equal(loaded,0);resolveRefresh();assert.equal(await entering,true);assert.equal(loaded,1);
 for(const file of ['play/war-room/index.html','tv/games/goon/war-room.html']){assert.match(read(file),/war-room-access\.js/);assert.match(read(file),/war-room-boot\.js/);assert.doesNotMatch(read(file),/<script[^>]+src="(?:mount\.js|[^\"]*index-W2w8AfON\.js)/);}
});
test('the two play routes mount separate games and the TV page loads neither game',t=>{
 const html=read('tv/channels/goon.html');
 for(const [route,war,destination] of [['/play/goon/',false,'/tv/games/goon/index.html'],['/play/war-room/',true,'/tv/games/goon/war-room.html'],['/tv/?ch=goon',false,null]]){
  const w=dom(t,route,html);const base=w.document.createElement('base');base.href='https://mominc.online/tv/';w.document.head.append(base);
  if(destination)w.document.documentElement.dataset.game='goon';if(war)w.document.documentElement.dataset.galaRoom='war-room';
  for(const script of w.document.querySelectorAll('script'))w.eval(script.textContent);
  const frame=w.document.querySelector('#ggGame');if(destination)assert.equal(new URL(frame.src).pathname,destination);else assert.equal(frame.getAttribute('src'),null);
 }
});
test('character creation opens the Gala while War Room navigation waits for full clearance',async t=>{
 const w=dom(t,'/tv/?ch=goon','<article id="gn"><section class="network-launch"><a><span>Create</span></a></section><p data-gala-entry-note></p></article>');let run=null;
 w.MBS_STATE={completedPages:()=>[],completePage(){}};w.MBS_RUN={read:()=>run};w.localStorage.setItem('mbs-gala-character-created-v1','123');
 w.eval(read('tv/network-flow.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const gala=w.document.querySelector('.network-launch a'),war=w.document.querySelector('[data-war-room-launch]');
 assert.equal(gala.getAttribute('href'),'/play/goon/');assert.match(gala.textContent,/ENTER THE GALA/);assert.equal(war.hidden,true);
 run={completedAt:1};w.dispatchEvent(new w.Event('mbs:run-update'));assert.equal(war.hidden,true);
 run={completedAt:1,installedAt:1};w.dispatchEvent(new w.Event('mbs:run-update'));assert.equal(war.hidden,false);assert.equal(war.getAttribute('href'),'/play/war-room/');assert.equal(gala.getAttribute('href'),'/play/goon/');await new Promise(setImmediate);
});
test('all twelve 3D ammo models fit their cells and have distinct geometry',async()=>{
 const T=await import('../tv/assets/armie-intro/vendor/three.core.js'),{ammo}=game(),signatures=new Set();
 for(let tier=1;tier<=13;tier++){
  const object=ammo.model(tier,T),box=new T.Box3().setFromObject(object),size=box.getSize(new T.Vector3());
  assert.ok(size.x<.86&&size.z<.86&&size.y<.9,'tier '+tier+' stays in its cell');assert.ok([size.x,size.y,size.z].every(Number.isFinite));
  if(tier<=12)signatures.add(JSON.stringify(object.children.map(m=>[m.geometry.type,m.geometry.parameters,m.material.color.getHex()])));
 }assert.equal(signatures.size,12);
});
