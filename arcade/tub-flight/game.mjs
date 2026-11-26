import {TubFlight,WIDTH,HEIGHT,TARGET,TUB_X,MOUTH} from './engine.mjs';
import {loadSettings,saveSettings,isReduced} from './settings.mjs';
import {createAudio} from './audio.mjs';
import {createFx,STAGE_NAMES,ACCENTS,MARKS,CLAIMS} from './fx.mjs';
export const FUEL_KEY='mbs-fuel-flight-v1';
export const BEST_KEY='nitro-fuel-best-v1';
export function fuelUnlocked(store=localStorage){try{const value=JSON.parse(store.getItem(FUEL_KEY));return value?.version===1&&value.pipes===8&&Number.isSafeInteger(value.completedAt)&&value.completedAt>0;}catch{return false;}}
const MODAL='<div class="tub-modal" role="dialog" aria-modal="true" hidden><div class="tub-win"><div class="tub-bar" data-mtitle></div><p data-mbody></p><div class="tub-opts" data-opts><label><input type="checkbox" data-sfx> Sound effects</label><label><input type="checkbox" data-music> Music</label></div><div class="tub-row"><button type="button" data-resume>Resume</button><button type="button" data-retry>TRY AGAIN ↻</button><button type="button" data-menu>Menu</button></div></div></div>';
export function mountTubFlight(host,{onComplete=()=>{},title='TUB FLIGHT',autoFuel=false,endless=false,icon=''}={}){
 const S=loadSettings(),reduced=isReduced(S),game=new TubFlight(Math.random,{target:endless?Infinity:TARGET,ramp:endless}),audio=createAudio(S,{tv:autoFuel}),fx=createFx();
 let best=0;if(endless)try{best=Math.max(0,Math.floor(Number(localStorage.getItem(BEST_KEY)))||0);}catch{}
 let frame=0,last=0,paused=false,ended=false,disposed=false,redirect=0,shown=0,speedSeen=1,notice=null,puffs=[],pops=[],crashed=false,modalKey='',lastAcc='#edffb8',labelKey='';
 host.classList.add('tub-flight');host.innerHTML=`<div class="tub-title">${icon?'<img alt="" width="18" height="18">':''}<strong></strong><span>SPONSORED SOFTWARE · 1995</span></div><p class="tub-caption">Keep the tub afloat. Clear eight pipes. Catch eight scoops.</p><div class="tub-screen"><canvas width="320" height="420" tabindex="0" aria-label="Fuel tub flight game. Tap or press Space to flap."></canvas><button type="button" class="tub-pause" data-pause aria-label="Pause">Pause</button><div class="tub-message" role="status"></div>${MODAL}</div><p class="tub-note">Optional arcade break. This game never unlocks the rest of the site.</p>`;
 host.querySelector('.tub-title strong').textContent=title;if(icon)host.querySelector('.tub-title img').src=icon;if(endless){host.querySelector('.tub-caption').textContent='Keep the tub afloat. Every pipe is a point. How far can you go?';host.querySelector('.tub-note').textContent='Endless mode. Your best score is saved on this device.';}
 const q=s=>host.querySelector(s),canvas=q('canvas'),ctx=canvas.getContext('2d'),message=q('.tub-message'),modal=q('.tub-modal'),pause=q('[data-pause]'),retry=q('[data-retry]'),resume=q('[data-resume]'),menu=q('[data-menu]'),opts=q('[data-opts]'),sfxBox=q('[data-sfx]'),musicBox=q('[data-music]');
 // Hazard-stripe tile for the pipe bodies; falls back to flat yellow if canvas patterns are unavailable.
 let stripe=null;try{const t=document.createElement('canvas');t.width=t.height=16;const g=t.getContext('2d');g.fillStyle='#FFE500';g.fillRect(0,0,16,16);g.strokeStyle='#2a0f4a';g.lineWidth=5;g.beginPath();for(const o of[-16,0,16]){g.moveTo(o,16);g.lineTo(o+16,0);}g.stroke();stripe=ctx.createPattern(t,'repeat')||null;}catch{}
 function tub(x,y,tilt){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.fillStyle='#0009';ctx.fillRect(-14,-16,34,40);ctx.fillStyle='#120826';ctx.fillRect(-17,-19,34,40);ctx.fillStyle='#eee4ff';ctx.fillRect(-15,-17,30,36);
  ctx.fillStyle='#291044';ctx.fillRect(-12,-17,24,25);const fill=Math.min(25,game.powder*3.8);ctx.fillStyle=lastAcc;ctx.fillRect(-12,8-fill,24,fill); // open mouth; the fill is capped to the cavity
  ctx.fillStyle='#692ca7';ctx.fillRect(-15,8,30,11);ctx.fillStyle='#b5ff23';ctx.fillRect(-18,-21,6,6);ctx.fillRect(12,-21,6,6);ctx.fillStyle='#fff';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('FUEL',0,17);ctx.restore();}
 function pipe(p,st){const top=p.gap-75,bot=p.gap+75,acc=ACCENTS[p.id%6];ctx.save();ctx.translate(p.x,0);
  const body=(y,h)=>{ctx.fillStyle='#0009';ctx.fillRect(3,y+3,46,h);ctx.fillStyle='#120826';ctx.fillRect(-1,y,46,h);ctx.fillStyle='#7A23D9';ctx.fillRect(0,y,44,h);ctx.fillStyle=stripe||'#FFE500';ctx.fillRect(5,y,34,h);};
  body(0,top);body(bot,HEIGHT-bot);
  for(const y of[top-15,bot]){ctx.fillStyle='#0009';ctx.fillRect(-4,y+3,58,15);ctx.fillStyle='#120826';ctx.fillRect(-7,y,58,15);ctx.fillStyle='#7A23D9';ctx.fillRect(-5,y+2,54,11);}
  ctx.fillStyle='#120826';ctx.fillRect(13,top-6,18,6);ctx.fillStyle=acc;ctx.fillRect(15,top-4,14,3); // nozzle opening, in this pipe's dosing colour
  for(const y of[top-32,bot+22]){ctx.fillStyle='#120826';ctx.fillRect(4,y-1,36,11);ctx.fillStyle=acc;ctx.fillRect(5,y,34,9);ctx.fillStyle='#120826';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText(MARKS[p.id%6],22,y+8);}
  if(st>=2&&top>90){ctx.fillStyle='#fff';ctx.fillRect(7,top-62,30,10);ctx.fillStyle='#120826';ctx.font='bold 6px monospace';ctx.fillText(CLAIMS[p.id%4],22,top-55);}
  ctx.restore();}
 function draw(dt=0){const t=game.elapsed,st=Math.min(5,game.stage);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#130e2c';ctx.fillRect(0,0,WIDTH,HEIGHT);fx.update(Math.min(.1,dt),game.stage,t,reduced,game.y);fx.drawSky(ctx,t,WIDTH,HEIGHT);ctx.fillStyle='#31254d';for(let x=0;x<WIDTH;x+=32){const y=300+(x%3)*7;ctx.fillRect(x,y,22,HEIGHT-y);ctx.fillStyle='#617348';ctx.fillRect(x+5,y+12,3,3);ctx.fillStyle='#31254d';}ctx.fillStyle='#74548f';for(let i=0;i<25;i++)ctx.fillRect((i*73)%320,(i*53)%285,2,2);
  fx.draw(ctx,t,game.stage,reduced,WIDTH,HEIGHT);
  for(const p of game.pipes)pipe(p,st);
  for(const s of game.scoops){ctx.fillStyle=ACCENTS[s.id%6];for(let i=1;i<=6;i++){ctx.globalAlpha=.7-i*.1;ctx.fillRect(s.x-1+[-3,2,-1,3,-2,1][i-1],s.y-i*5-2,2,3);}ctx.globalAlpha=1;ctx.fillStyle='#120826';ctx.fillRect(s.x-4,s.y-4,8,8);ctx.fillStyle=ACCENTS[s.id%6];ctx.fillRect(s.x-3,s.y-3,6,6);}
  if(game.phase==='running'){puffs=puffs.filter(f=>t-f.at<.25);for(const f of puffs)for(let i=0;i<4;i++){const a=t-f.at;ctx.globalAlpha=1-a/.25;ctx.fillStyle='#eee4ff';ctx.fillRect(TUB_X+(i-1.5)*6,game.y+20+a*60,3,3);}
   if(!reduced){pops=pops.filter(f=>t-f.at<.35);for(const f of pops){const a=t-f.at;ctx.globalAlpha=1-a/.35;ctx.strokeStyle=f.c;ctx.lineWidth=2;ctx.strokeRect(TUB_X-12-a*30,game.y+MOUTH-6-a*20,24+a*60,12+a*40);}}ctx.globalAlpha=1;}
  tub(TUB_X,game.y,Math.max(-.2,Math.min(.3,game.velocity/1300)));ctx.fillStyle='#bdd861';ctx.fillRect(0,HEIGHT-18,WIDTH,18);ctx.fillStyle='#172528';for(let x=0;x<WIDTH;x+=16)ctx.fillRect(x,HEIGHT-15,9,4);
  ctx.fillStyle='#130e2ccc';ctx.fillRect(6,10,214,42);ctx.textAlign='left';ctx.font='bold 18px monospace';ctx.fillStyle='#efffc9';ctx.fillText(endless?`${game.score} PIPES · BEST ${best}`:`${game.score} / ${TARGET} PIPES`,14,29);ctx.font='11px monospace';ctx.fillStyle='#97caca';ctx.fillText(`STAGE ${game.stage} · ${STAGE_NAMES[st]}`,14,45);
  if(notice){const a=t-notice.at;if(a>1.5)notice=null;else{const h=notice.speed?38:24;ctx.globalAlpha=Math.min(1,a/.3,(1.5-a)/.9);ctx.fillStyle='#130e2c99';ctx.fillRect(14,58,WIDTH-28,h);ctx.strokeStyle=ACCENTS[(game.stage+2)%6];ctx.lineWidth=2;ctx.strokeRect(14,58,WIDTH-28,h);ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.fillStyle='#fff';ctx.fillText(notice.text,WIDTH/2,75);if(notice.speed){ctx.fillStyle='#c7ff43';ctx.fillText(notice.speed,WIDTH/2,91);}ctx.globalAlpha=1;}}
 }
 function paint(dt=0){draw(dt);const ready=game.phase==='ready',lost=game.phase==='crashed',complete=game.phase==='complete';message.hidden=!ready;if(ready)message.textContent='TAP ANYWHERE TO FLAP\nKEYS: SPACE / ↑ / W';
  const key=paused?'p':lost?'c':complete?'w':'';
  if(key!==modalKey){const from=modalKey;modalKey=key;modal.hidden=!key;
   if(key){q('[data-mtitle]').textContent=key==='p'?'PAUSED':key==='c'?'TUB DOWN':'FULL TUB';q('[data-mbody]').textContent=key==='c'?(endless?`${game.score} PIPES. BEST ${best}.`:'TUB DOWN. SCOOPS RESET.'):key==='w'?'EIGHT PIPES. ONE FULL TUB.':endless?`${game.score} PIPES · BEST ${best}`:`${game.score} / ${TARGET} PIPES`;resume.hidden=key!=='p';retry.textContent=key==='p'?'Restart':'TRY AGAIN ↻';menu.hidden=!endless;opts.hidden=!(endless&&key==='p');sfxBox.checked=S.sfx;musicBox.checked=S.music;(key==='p'?resume:retry).focus();}
   else if(from)canvas.focus();}
  pause.disabled=ready||lost||complete;pause.textContent=paused?'Resume':'Pause';const label=`Fuel tub flight. ${endless?game.score+' pipes':game.score+' of eight pipes'}. Stage ${game.stage}. ${game.phase}. Tap or press Space to flap.`;if(label!==labelKey){labelKey=label;canvas.setAttribute('aria-label',label);}}
 // Sounds and notices follow what the engine reports; the engine itself never knows about them.
 function events(){for(const e of game.events){if(e.type==='release')audio.sfx('release',shown);else if(e.type==='catch'){lastAcc=ACCENTS[e.id%6];audio.sfx('catch',shown);pops.push({at:game.elapsed,c:lastAcc});}else if(e.type==='pass')audio.sfx('pass',shown);}game.events.length=0;
  if(game.stage>shown){shown=game.stage;audio.setStage(shown);audio.sfx('stage',shown);const k=game.speed();notice={at:game.elapsed,text:`STAGE ${shown} · ${STAGE_NAMES[Math.min(5,shown)]}`,speed:k!==speedSeen?`SPEED x${k.toFixed(2)}`:''};speedSeen=k;}
  if(game.phase==='crashed'&&!crashed){crashed=true;audio.stopMusic();audio.sfx('crash');}}
 function tick(now){frame=0;if(disposed)return;const dt=last?(now-last)/1000:0;last=now;const live=!paused&&!document.hidden;if(live)game.step(dt);events();if(endless&&game.score>best){best=game.score;try{localStorage.setItem(BEST_KEY,String(best));}catch{}}paint(live?dt:0);
  if(game.phase==='complete'&&!ended){ended=true;audio.stopMusic();const receipt={version:1,pipes:8,completedAt:Date.now()};try{localStorage.setItem(FUEL_KEY,JSON.stringify(receipt));}catch{}onComplete(receipt);if(autoFuel)redirect=setTimeout(()=>location.assign('/tv/?ch=fuel'),0);}
  if(game.phase==='running'&&live)frame=requestAnimationFrame(tick);}
 function schedule(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(game.phase==='running'&&!paused&&!document.hidden)frame=requestAnimationFrame(tick);paint();}
 function setPaused(v){paused=v;audio.hold(v);if(!v&&game.phase==='running')audio.startMusic();schedule();}
 function flap(){if(paused)return;audio.unlock();const was=game.phase;if(game.flap()){if(was==='ready')audio.startMusic();audio.sfx('flap',shown);puffs.push({at:game.elapsed});if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}paint();}}
 const pointer=e=>{if(e.isPrimary===false)return;e.preventDefault();flap();};
 const key=e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat)flap();}};
 canvas.addEventListener('pointerdown',pointer);canvas.addEventListener('keydown',key);
 retry.onclick=()=>{clearTimeout(redirect);game.reset();fx.reset();audio.reset();audio.hold(false);shown=0;speedSeen=1;notice=null;puffs=[];pops=[];crashed=false;ended=false;paused=false;lastAcc='#edffb8';paint();canvas.focus();};
 pause.onclick=()=>setPaused(!paused);resume.onclick=()=>setPaused(false);menu.onclick=()=>document.getElementById('back')?.click();
 sfxBox.onchange=()=>{S.sfx=!!sfxBox.checked;saveSettings(S);audio.apply();};musicBox.onchange=()=>{S.music=!!musicBox.checked;saveSettings(S);audio.apply();};
 function visibility(){if(document.hidden){if(game.phase==='running')paused=true;audio.hold(true);}else if(!paused)audio.hold(false);schedule();}document.addEventListener('visibilitychange',visibility);paint();
 const api={game,pause(){setPaused(true);},dispose(){disposed=true;if(frame)cancelAnimationFrame(frame);clearTimeout(redirect);audio.dispose();canvas.removeEventListener('pointerdown',pointer);canvas.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);host.replaceChildren();}};
 if(globalThis.__fuelDebug)globalThis.__fuel={...api,fx,audio,S,paint};
 return api;
}
