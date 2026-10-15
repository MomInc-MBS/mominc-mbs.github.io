const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const flow=fs.readFileSync(path.join(root,'tv/network-flow.js'),'utf8');
const ads=fs.readFileSync(path.join(root,'tv/retro-ads.js'),'utf8');
const required=['lilboyfriend','djscratch','corgi','goon'];
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
const sessionOf=w=>Object.fromEntries(Array.from({length:w.sessionStorage.length},(_,i)=>{const key=w.sessionStorage.key(i);return [key,w.sessionStorage.getItem(key)];}));
async function environment(t,{done=[],power='on',standalone=false,delayGame=false,session={},initialNow=0,channel='mominc',random=0}={}){
 const dom=new JSDOM('<!doctype html><html><head></head><body>'+(standalone?'<main></main>':'<main id="tv" data-state="'+power+'"><div class="glass"><div id="screen" tabindex="0"><button id="channel-button">Channel action</button></div><div class="dark"></div></div><aside class="panel"><button id="power">Power</button></aside></main>')+'</body></html>',{url:'https://mominc.online/'+(standalone?'play/djscratch/':'tv/?ch='+channel),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document,finished=new Set(done),timers=new Map();let now=initialNow,id=0,resolveGame,mounts=0,pauses=0,disposals=0;
 for(const [key,value] of Object.entries(session))w.sessionStorage.setItem(key,value);
 w.Date.now=()=>now;w.Math.random=typeof random==='function'?random:()=>random;
 w.setTimeout=(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;};w.clearTimeout=id=>timers.delete(id);
 w.setInterval=(fn,ms)=>{timers.set(++id,{fn,at:now+ms,interval:ms});return id;};w.clearInterval=w.clearTimeout;
 w.HTMLDialogElement.prototype.showModal=()=>{throw new Error('Sponsors must never enter the browser top layer');};
 const module={mountTubFlight(host,options){assert.equal(options.autoFuel,true);mounts++;host.classList.add('tub-flight');host.innerHTML='<canvas tabindex="0"></canvas>';return {pause(){pauses++;},dispose(){disposals++;host.replaceChildren();}};}};
 w.loadArcade=()=>delayGame?new Promise(resolve=>{resolveGame=resolve;}):Promise.resolve(module);
 w.MBS_STATE={completedPages:()=>[...finished],completePage(name){if(finished.has(name))return;finished.add(name);w.dispatchEvent(new w.Event('mbs:page-complete'));}};
 w.eval(flow);d.dispatchEvent(new w.Event('DOMContentLoaded'));
 w.eval(ads.replace("import('/arcade/tub-flight/game.mjs?v=neon-tv-2')",'window.loadArcade()'));await flush();
 t.after(async()=>{w.dispatchEvent(new w.Event('pagehide'));await flush();dom.window.close();});
 return {w,d,timers,get now(){return now;},get ad(){return d.querySelector('.retro-sponsor');},get layer(){return d.querySelector('.tv-ad-layer');},get game(){return d.querySelector('.sponsor-arcade');},get mounts(){return mounts;},get pauses(){return pauses;},get disposals(){return disposals;},
  async advance(ms){const end=now+ms;let limit=0;for(;;){const entry=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;assert.ok(++limit<2000,'timer loop settles');now=entry[1].at;if(entry[1].interval)entry[1].at+=entry[1].interval;else timers.delete(entry[0]);entry[1].fn();await flush();}now=end;await flush();},
  async power(state){d.querySelector('#tv').dataset.state=state;await flush();},
  async visible(value){Object.defineProperty(d,'hidden',{configurable:true,value:!value});d.dispatchEvent(new w.Event('visibilitychange'));await flush();},
  async finish(){for(const name of required)w.MBS_STATE.completePage(name);await flush();},
  async play(){d.querySelector('.sponsor-cta').click();await flush();},
  async loadGame(){resolveGame(module);await flush();},
  saveHand(){w.MBS_FLOW.saveHand({sections:{nails:0,fingertips:0,fingers:0,palm:0,back_of_hand:0,wrist:0}});w.dispatchEvent(new w.Event('mbs-flow'));}
 };
}
test('only a powered main television mounts Fuel; standalone games have no ads',async t=>{
 const off=await environment(t,{power:'off'});assert.equal(off.ad,null);assert.equal(off.layer.hidden,true);await off.advance(60000);assert.equal(off.ad,null);
 await off.power('warming');assert.equal(off.ad,null);await off.power('on');assert.equal(off.ad.dataset.sponsor,'fuel');assert.equal(off.ad.parentElement,off.layer);assert.equal(off.layer.parentElement.className,'glass');assert.equal(off.layer.contains(off.d.querySelector('#power')),false);
 const standalone=await environment(t,{standalone:true,done:required});assert.equal(standalone.layer,null);assert.equal(standalone.d.querySelector('script[src="/tv/retro-ads.js"]'),null);assert.equal(standalone.d.querySelector('dialog'),null);
});
test('five neon Fuel variants share one impression count and only the third has a close lock',async t=>{
 const e=await environment(t);
 for(const [index,style] of ['corner','bottom','side','button','game'].entries()){
  if(style==='game'){assert.equal(e.ad,null);assert.ok(e.game,'fifth placement is the playable game itself');}else{
   assert.ok(e.ad.classList.contains('sponsor-'+style));assert.equal(e.ad.dataset.sponsor,'fuel');assert.equal(e.ad.querySelector('img'),null);assert.ok(e.ad.querySelector('.sponsor-tub'));
   const close=e.ad.querySelector('.sponsor-cap button');assert.equal(close.disabled,index===2);if(index===2){close.click();assert.ok(e.ad);await e.advance(2000);}await e.play();
  }
  assert.equal(e.ad,null);assert.ok(e.layer.contains(e.game));assert.equal(e.d.querySelector('dialog'),null);assert.equal(e.d.querySelector('[aria-modal]'),null);
  const exit=e.game.querySelector('button');assert.equal(exit.disabled,index===2);if(index===2){await e.advance(2999);assert.equal(exit.disabled,true);await e.advance(1);assert.equal(exit.disabled,false);}exit.click();assert.equal(e.game,null);await e.advance(24999);assert.equal(e.ad,null);assert.equal(e.game,null);if(index<4)await e.advance(1);
 }
 assert.equal(e.mounts,5);assert.equal(e.disposals,5);assert.equal(e.w.sessionStorage.getItem('mbs-fuel-entry-v1'),'ad');
 assert.equal(JSON.parse(e.w.sessionStorage.getItem('mbs-fuel-ad-cadence-v1')).count,5);
});
test('Fuel cooldown survives navigation and blocks scroll, power, and debug show until 25 seconds after close or auto-close',async t=>{
 const first=await environment(t);assert.equal(first.ad.querySelector('button').disabled,false);first.w.MBS_ADS.close();assert.equal(first.ad,null);
 first.w.MBS_ADS.show('game');assert.equal(first.game,null);const screen=first.d.querySelector('#screen');screen.scrollTop=250;screen.dispatchEvent(new first.w.Event('scroll'));assert.equal(first.ad,null);
 assert.equal(JSON.parse(first.w.sessionStorage.getItem('mbs-fuel-ad-cadence-v1')).nextAt,25000);
 await first.advance(10000);const second=await environment(t,{session:sessionOf(first.w),initialNow:first.now});assert.equal(second.ad,null);
 await second.power('off');await second.advance(14999);await second.power('on');second.w.MBS_ADS.show('game');assert.equal(second.game,null);
 second.d.querySelector('#screen').scrollTop=250;second.d.querySelector('#screen').dispatchEvent(new second.w.Event('scroll'));assert.equal(second.ad,null);
 await second.advance(1);assert.equal(second.ad.dataset.sponsor,'fuel');assert.equal(second.ad.querySelector('button').disabled,false);assert.equal(JSON.parse(second.w.sessionStorage.getItem('mbs-fuel-ad-cadence-v1')).count,2);
 second.w.MBS_ADS.close();await second.advance(25000);assert.equal(second.ad.querySelector('button').disabled,true);assert.equal(JSON.parse(second.w.sessionStorage.getItem('mbs-fuel-ad-cadence-v1')).count,3);
 await second.advance(15999);assert.ok(second.ad);await second.advance(1);assert.equal(second.ad,null);second.w.MBS_ADS.show('game');assert.equal(second.game,null);
 await second.advance(24999);assert.equal(second.ad,null);await second.advance(1);assert.equal(second.ad.querySelector('button').disabled,false);
});
test('the 45-second Fuel deadline is sampled once and retained across reload',async t=>{
 const first=await environment(t,{random:0.9999999999999999});first.w.MBS_ADS.close();assert.equal(JSON.parse(first.w.sessionStorage.getItem('mbs-fuel-ad-cadence-v1')).nextAt,45000);
 await first.advance(10000);const next=await environment(t,{session:sessionOf(first.w),initialNow:first.now,random:0});assert.equal(next.ad,null);
 await next.advance(34999);assert.equal(next.ad,null);await next.advance(1);assert.equal(next.ad.dataset.sponsor,'fuel');
});
test('opening Tub Flight from a Fuel card draws the cooldown only when the arcade closes',async t=>{
 let draws=0;const e=await environment(t,{random:()=>{draws++;return 0;}});await e.play();assert.equal(draws,0);e.game.querySelector('button').click();assert.equal(draws,1);assert.equal(JSON.parse(e.w.sessionStorage.getItem('mbs-fuel-ad-cadence-v1')).nextAt,25000);
});
test('malformed Fuel session cadence starts safely at the first immediately dismissible impression',async t=>{
 const e=await environment(t,{session:{'mbs-fuel-ad-cadence-v1':'{"count":-8,"nextAt":"broken"}'}});assert.equal(e.ad.querySelector('button').disabled,false);assert.equal(JSON.parse(e.w.sessionStorage.getItem('mbs-fuel-ad-cadence-v1')).count,1);
});
test('power off hides arcade, pauses gameplay and suspends its close countdown',async t=>{
 const e=await environment(t,{session:{'mbs-fuel-ad-cadence-v1':JSON.stringify({count:2,nextAt:0})}});await e.play();await e.advance(1000);await e.power('off');assert.equal(e.layer.hidden,true);assert.ok(e.pauses>0);await e.advance(10000);
 await e.power('warming');assert.equal(e.layer.hidden,true);await e.power('on');assert.equal(e.layer.hidden,false);assert.equal(e.mounts,1);const exit=e.game.querySelector('button');assert.equal(exit.disabled,true);await e.advance(3999);assert.equal(exit.disabled,true);await e.advance(1);assert.equal(exit.disabled,false);
});
test('the fourth page replaces Fuel with DJ Scratch Helping Hand, even during Tub Flight',async t=>{
 const e=await environment(t,{done:required.slice(0,3)});await e.play();await e.finish();assert.equal(e.game,null);assert.equal(e.disposals,1);assert.equal(e.ad.dataset.sponsor,'hand');assert.match(e.ad.textContent,/DJ SCRATCH/);assert.equal(e.ad.querySelector('a').getAttribute('href'),'/handborne/');assert.equal(e.d.querySelectorAll('[data-sponsor]').length,1);
});
test('Helping Hand repeats after ten seconds, respects power, and stops when the hand is saved',async t=>{
 const e=await environment(t,{done:required});e.ad.querySelector('button').click();await e.advance(1000);e.w.dispatchEvent(new e.w.Event('storage'));assert.equal(e.ad,null);await e.advance(8999);assert.equal(e.ad,null);await e.advance(1);assert.equal(e.ad.dataset.sponsor,'hand');
 await e.power('off');assert.equal(e.layer.hidden,true);await e.advance(30000);await e.power('on');assert.equal(e.layer.hidden,false);e.saveHand();await flush();assert.equal(e.ad,null);await e.advance(30000);assert.equal(e.ad,null);e.w.MBS_ADS.showHand();assert.equal(e.ad.dataset.sponsor,'hand');
});
test('a module loading across power-off is paused; a stale module cannot resurrect a replaced ad',async t=>{
 const e=await environment(t,{delayGame:true});await e.play();await e.power('off');await e.loadGame();assert.equal(e.mounts,1);assert.ok(e.pauses>0);assert.equal(e.layer.hidden,true);
 const stale=await environment(t,{delayGame:true});await stale.play();await stale.finish();await stale.loadGame();assert.equal(stale.mounts,0);assert.equal(stale.ad.dataset.sponsor,'hand');
});
test('screen scrolling alone triggers the button ad, positioned relative to the glass',async t=>{
 const e=await environment(t,{channel:'fuel'});Object.defineProperty(e.w,'scrollY',{value:400});e.w.dispatchEvent(new e.w.Event('scroll'));assert.equal(e.ad,null);
 const glass=e.d.querySelector('.glass');glass.getBoundingClientRect=()=>({left:100,top:200,width:300,height:240,bottom:440,right:400});
 e.d.querySelector('#channel-button').getBoundingClientRect=()=>({left:120,top:350,width:120,height:40,bottom:390});
 const screen=e.d.querySelector('#screen');e.w.history.replaceState(null,'','/tv/?ch=mominc');screen.scrollTop=240;screen.dispatchEvent(new e.w.Event('scroll'));assert.ok(e.ad.classList.contains('sponsor-button'));assert.equal(e.ad.style.left,'20px');assert.equal(e.ad.style.top,'70px');
});
test('hidden tabs and page lifecycle cannot leak an ad, duplicate it, or shorten a close lock',async t=>{
 const e=await environment(t,{session:{'mbs-fuel-ad-cadence-v1':JSON.stringify({count:2,nextAt:0})}});await e.advance(1000);await e.visible(false);assert.equal(e.layer.hidden,true);await e.advance(20000);await e.visible(true);assert.equal(e.layer.hidden,false);assert.equal(e.ad.querySelector('button').disabled,true);assert.equal(e.d.querySelectorAll('.retro-sponsor').length,1);
 e.w.dispatchEvent(new e.w.Event('pagehide'));assert.equal(e.ad,null);assert.equal(e.timers.size,0);e.w.dispatchEvent(new e.w.Event('pageshow'));assert.equal(e.d.querySelectorAll('.retro-sponsor').length,0);await e.advance(25000);assert.equal(e.d.querySelectorAll('.retro-sponsor').length,1);
});
test('containment rules use screen coordinates and keep the power shield above ads',()=>{
 const css=fs.readFileSync(path.join(root,'tv/retro-ads.css'),'utf8');assert.doesNotMatch(css,/position\s*:\s*fixed|::backdrop|\d+(?:d?v[wh])/);assert.match(css,/\.tv-ad-layer\{[^}]*position:absolute;inset:0;z-index:8;overflow:hidden;border-radius:inherit/);assert.match(css,/#tv:not\(\[data-state="on"\]\) \.tv-ad-layer\{display:none!important\}/);assert.doesNotMatch(ads,/myr5-creature|showModal|document.body.append/);
 const fuel=fs.readFileSync(path.join(root,'tv/channels/fuel.html'),'utf8');for(const color of ['#ff2e88','#c6ff00','#00e0ff','#ffea00','#7a2fc4']){assert.ok(css.includes(color));assert.ok(fuel.includes(color));}
});

const html=fs.readFileSync(path.join(root,'tv/index.html'),'utf8');
const early=html.match(/<main class="tv" id="tv" data-state="off">\s*<script>([\s\S]*?)<\/script>/)[1];
const shell=fs.readFileSync(path.join(root,'tv/tv.js'),'utf8');
const boot=shell.slice(shell.indexOf('  // --- boot:'),shell.lastIndexOf('})();'));
function powerEnvironment(storage,air){const tv={dataset:{state:'off'}};return {tv,onAir:()=>air,paintDark(){},document:{getElementById:()=>tv},sessionStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};}
test('saved power is restored before the channel is painted',()=>{
 const e=powerEnvironment(new Map([['mbs-on','1']]),false);vm.runInNewContext(early,e);assert.equal(e.tv.dataset.state,'on');
});
test('automatic broadcast startup stays on across the next off-air channel',()=>{
 const storage=new Map();const first=powerEnvironment(storage,true);vm.runInNewContext(boot,first);assert.equal(storage.get('mbs-on'),'1');const next=powerEnvironment(storage,false);vm.runInNewContext(early,next);assert.equal(next.tv.dataset.state,'on');vm.runInNewContext(boot,next);assert.equal(next.tv.dataset.state,'on');
});
test('an explicit press of Power off remains off',()=>{
 const e=powerEnvironment(new Map([['mbs-on','0']]),true);vm.runInNewContext(early,e);vm.runInNewContext(boot,e);assert.equal(e.tv.dataset.state,'off');
});
