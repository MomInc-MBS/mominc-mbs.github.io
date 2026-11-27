// All sounds are synthesized here (original). One AudioContext, created on the first gesture. Stage changes timbre, never loudness.
const MAX_VOICES=12,SEMI=Math.pow(2,1/12);
const FLAP_WAVE=['square','square','triangle','sawtooth','square','sawtooth'];
const SCALE=[0,3,5,7,10,12,15,17];
export function createAudio(S,{tv=false}={}){
 const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
 let ctx=null,sfxBus,musBus,noise,voices=0,timer=0,next=0,step=0,stage=0,held=false,musicOn=false;
 // The TV page has its own mute switch; the ad respects it.
 const tvMuted=()=>{if(!tv)return false;try{return localStorage.getItem('mbs-tv-muted-v1')==='1';}catch{return false;}};
 const apply=()=>{if(!ctx)return;sfxBus.gain.value=S.sfx&&!tvMuted()?S.sfxVol*.9:0;musBus.gain.value=S.music&&!tv?S.musVol*.5:0;};
 function unlock(){
  if(!AC)return false;
  if(!ctx){try{ctx=new AC();}catch{ctx=null;return false;}
   const comp=ctx.createDynamicsCompressor(),master=ctx.createGain();master.gain.value=.7;sfxBus=ctx.createGain();musBus=ctx.createGain();
   sfxBus.connect(comp);musBus.connect(comp);comp.connect(master);master.connect(ctx.destination);
   noise=ctx.createBuffer(1,ctx.sampleRate*.4,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;apply();}
  if(!held&&ctx.state==='suspended')ctx.resume?.();return true;}
 // One short enveloped voice; dropped when the cap is hit (flaps get a little headroom so every tap answers).
 function tone(bus,f,dur,type,peak,{to=f,at=0,noisy=false,cut=0}={},cap=MAX_VOICES){
  if(!ctx||voices>=cap)return;const t=ctx.currentTime+at,o=noisy?ctx.createBufferSource():ctx.createOscillator(),g=ctx.createGain();
  if(noisy){o.buffer=noise;if(cut){const fl=ctx.createBiquadFilter();fl.type='highpass';fl.frequency.value=cut;o.connect(fl);fl.connect(g);}else o.connect(g);}else{o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+dur);o.connect(g);}
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.connect(bus);voices++;o.onended=()=>{voices--;};o.start(t);o.stop(t+dur+.02);}
 function sfx(name,st=stage){
  if(!ctx||held||!S.sfx||tvMuted())return;const b=sfxBus,f=440*SEMI**(st*2);
  if(name==='flap')tone(b,f,.07,FLAP_WAVE[Math.min(5,st)],.2,{to:f*1.6},16);
  else if(name==='release')tone(b,0,.16,'',.12,{noisy:true,cut:2500});
  else if(name==='catch'){tone(b,660,.12,'triangle',.22);tone(b,990,.18,'triangle',.2,{at:.07});if(st>2)tone(b,1320,.2,'sine',.14,{at:.14});}
  else if(name==='pass')tone(b,880,.05,'square',.1);
  else if(name==='stage')[0,4,7,12].forEach((n,i)=>tone(b,392*SEMI**n,.16,'square',.14,{at:i*.09}));
  else if(name==='crash'){tone(b,0,.35,'',.28,{noisy:true,cut:200});tone(b,180,.4,'sawtooth',.2,{to:50});}
  else if(name==='click')tone(b,1200,.03,'square',.08);}
 // Tiny layered loop: each stage adds a layer. Scheduled a hair ahead; nothing is queued while held.
 function music(){
  if(!ctx||held||!S.music||tv)return;const m=musBus,len=60/108/4;
  while(next<ctx.currentTime+.15){const i=step%16,root=110;
   if(i%4===0)tone(m,root*SEMI**SCALE[(step>>4)%2*2],len*3,'triangle',.5,{at:next-ctx.currentTime});
   if(stage>=1&&i%2===1)tone(m,0,.03,'',.16,{noisy:true,cut:6000,at:next-ctx.currentTime});
   if(stage>=2&&i%2===0)tone(m,root*4*SEMI**SCALE[(i*3+step)%5],len,'square',.1,{at:next-ctx.currentTime});
   if(stage>=3&&i%8===0)tone(m,root*2*SEMI**SCALE[4],len*7,'sawtooth',.08,{at:next-ctx.currentTime});
   if(stage>=4&&i%4===2)tone(m,root*8*SEMI**SCALE[(i+step)%7],len*2,'triangle',.12,{at:next-ctx.currentTime});
   if(stage>=5&&i%4===0)tone(m,0,.05,'',.2,{noisy:true,cut:300,at:next-ctx.currentTime});
   next+=len;step++;}}
 const api={
  unlock,apply,sfx,
  startMusic(){if(!ctx||musicOn||tv)return;musicOn=true;next=ctx.currentTime+.05;timer=setInterval(music,30);},
  stopMusic(){musicOn=false;clearInterval(timer);},
  setStage(s){stage=Math.min(5,s);},
  // paused / hidden / game over: silence everything right now
  hold(on){held=on;if(!ctx)return;if(on){api.stopMusic();ctx.suspend?.();}else ctx.resume?.();},
  reset(){stage=0;step=0;api.stopMusic();},
  dispose(){api.stopMusic();try{ctx?.close?.();}catch{}ctx=null;},
  get ready(){return !!ctx;}};
 return api;}
