// Hallucination library: original, decorative-only canvas effects. No hitboxes, no strobing: every motion is a slow sine/drift,
// every fade takes ~0.8 s, hue moves < 10 deg/s. Real pipes, powder and the tub are drawn after these, so they stay on top.
// Louder per stage: the rainbow sky strengthens and effect counts grow with E.stage.
export const STAGE_NAMES=['FACTORY DEFAULT','FIRST SCOOP','SEEING COLORS','CORPORATE OVERLOAD','REALITY NOT FOUND','MAXIMUM OVERLOAD'];
export const ACCENTS=['#FFE500','#7A23D9','#19E3FF','#9CFF2E','#FF8A1F','#FF4FB6'];
export const MARKS=['o','^','#','+','~','*'];
export const CLAIMS=['99% SAFE','ASK MOM','NOT FOOD','0 RISK'];
const WINDOWS=[['REALITY.EXE','NOT RESPONDING'],['RAINBOW','BUFFER FULL'],['MOM INC. DENIES','SIDE EFFECTS'],['YOU ARE NOW A','SPONSORED THOUGHT']];
export const MAX_MODULES=6,MAX_GRAINS=180;
const SKY_ALPHA=[0,.3,.6,.75,.85,.95]; // rainbow sky strength per stage, eased in over ~1.5 s
const hash=(s,i,k)=>{const x=Math.sin(s*12.9898+i*78.233+k*37.719)*43758.5453;return x-Math.floor(x);};
const wrap=(v,n)=>((v%n)+n)%n;
const hue=(t,o)=>`hsl(${(t*10+o)%360},100%,58%)`;
const n=(E,base,per,max)=>Math.min(max,base+Math.floor(E.stage*per));
// E = {t, W, H, seed, trail, stage}; c has globalAlpha already set to the module's fade.
export const EFFECTS=[
 {id:'ribbons',min:1,max:9,motion:true,draw(c,E){const{t,W}=E;c.lineWidth=5;c.globalAlpha*=.85;for(let i=0;i<n(E,3,1,7);i++){c.strokeStyle=hue(t,i*55);c.beginPath();for(let x=0;x<=W;x+=8){const y=70+i*48+Math.sin(x/34+t*.8+i*1.7)*18;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}}},
 {id:'afterimage',min:2,max:9,motion:true,draw(c,{trail,t}){c.globalAlpha*=.55;for(let k=1;k<=4;k++){const y=trail[k*2]??trail.at(-1);if(y===undefined)continue;c.fillStyle=hue(t,k*70);c.fillRect(82-k*11-12,y-14,24,30);}}},
 {id:'chroma',min:2,max:3,motion:true,draw(c,{t,W,H}){const o=Math.sin(t*.4)*2.5;c.globalAlpha*=.5;for(let x=0;x<W;x+=32){const y=300+(x%3)*7;c.fillStyle='#19e3ff';c.fillRect(x+2+o,y,22,H-y);c.fillStyle='#ff4fb6';c.fillRect(x-2-o,y,22,H-y);}}},
 {id:'cans',min:3,max:9,draw(c,E){const{t,seed}=E,k=n(E,2,1,9);for(let i=0;i<k;i++){c.save();c.translate(wrap(30+i*(300/k)+hash(seed,i,1)*30,320),262+hash(seed,i,8)*60+Math.sin(t*4+i*2)*9);c.rotate(Math.sin(t*3+i)*.3);c.scale(1.3,1.3);c.fillStyle='#120826';c.fillRect(-13,-17,26,34);c.fillStyle=ACCENTS[(i+2)%6];c.fillRect(-11,-15,22,30);c.fillStyle='#fff';c.fillRect(-11,-3,22,9);c.fillStyle='#120826';c.fillRect(-6,-10,3,4);c.fillRect(3,-10,3,4);c.fillRect(-4,10,8,2);c.font='bold 6px monospace';c.textAlign='center';c.fillText('FUEL',0,4);c.restore();}}},
 {id:'signs',min:3,max:9,draw(c,E){const{t,seed}=E,k=n(E,1,1,6);for(let i=0;i<k;i++){c.save();c.translate(wrap(40+i*(300/k)+hash(seed,i,2)*30,320),110+hash(seed,i,9)*140);c.rotate(Math.sin(t*1.5+i*3)*.25);c.scale(1.2,1.2);c.fillStyle='#FFE500';c.strokeStyle='#7A23D9';c.lineWidth=3;c.beginPath();c.moveTo(0,-20);c.lineTo(20,14);c.lineTo(-20,14);c.closePath();c.fill();c.stroke();c.fillStyle='#120826';c.fillRect(-6,-4,3,4);c.fillRect(3,-4,3,4);c.beginPath();c.arc(0,4,6,.2,Math.PI-.2);c.stroke();c.restore();}}},
 {id:'windows',min:3,max:9,draw(c,E){const{t,W,seed}=E,k=n(E,1,.7,4);c.globalAlpha*=.95;for(let i=0;i<k;i++){const x=wrap(t*14+i*190+seed*50,W+170)-140,y=140+i*80,txt=WINDOWS[(i+Math.floor(t/10)+Math.floor(seed*4))%4];c.fillStyle='#c0c0c0';c.fillRect(x,y,124,46);c.fillStyle='#000a80';c.fillRect(x+2,y+2,120,10);c.fillStyle='#fff';c.font='bold 6px monospace';c.textAlign='left';c.fillText('MOM.EXE',x+5,y+10);c.fillStyle='#000';c.fillText(txt[0],x+6,y+27);c.fillText(txt[1],x+6,y+38);c.strokeStyle='#120826';c.lineWidth=1;c.strokeRect(x,y,124,46);}}},
 {id:'eyes',min:4,max:9,draw(c,{t,W}){c.globalAlpha*=.9;c.strokeStyle='#7A23D9';c.lineWidth=5;c.fillStyle='#fff';for(const cx of[W/2-52,W/2+52]){c.beginPath();c.ellipse(cx,100,42,26,0,0,7);c.fill();c.stroke();c.fillStyle=hue(t,cx);c.beginPath();c.arc(cx+Math.sin(t*.4)*9,100,14,0,7);c.fill();c.fillStyle='#120826';c.beginPath();c.arc(cx+Math.sin(t*.4)*9,100,7,0,7);c.fill();c.fillStyle='#fff';}c.beginPath();c.moveTo(W/2-10,100);c.lineTo(W/2+10,100);c.stroke();}},
 {id:'ghost',min:4,max:9,motion:true,draw(c,E){const{t,seed}=E;c.globalAlpha*=.35;for(let i=0;i<n(E,2,.5,5);i++){const x=wrap(-t*40+i*100+seed*30,400)-60,g=150+hash(seed,i,3)*120;c.fillStyle=hue(t,i*60);c.fillRect(x,0,44,g-75);c.fillRect(x,g+75,44,420);}}},
 {id:'wavy',min:4,max:9,motion:true,draw(c,{t,H}){c.globalAlpha*=.8;for(let i=0;i<8;i++){const bx=i*42+10,top=H-130-(i*37%80);c.fillStyle=hue(t,i*45);for(let y=top;y<H;y+=6)c.fillRect(bx+Math.sin(y/18+t*1.2+i)*5,y,28,6);}}},
 {id:'wings',min:4,max:9,motion:true,draw(c,E){const{t,W,seed}=E,k=n(E,3,1,8);for(let i=0;i<k;i++){const x=wrap(t*30+i*(W/k)+seed*60,W+60)-30,y=60+(i%4)*50+Math.sin(t*2+i)*12,f=Math.sin(t*10+i)*6;c.fillStyle='#fff';c.fillRect(x-10,y-4-f,9,4);c.fillRect(x+3,y-4-f,9,4);c.fillStyle='#120826';c.fillRect(x-5,y-5,11,11);c.fillStyle=ACCENTS[(i*2+3)%6];c.fillRect(x-4,y-4,9,9);}}},
 {id:'confetti',min:3,max:9,draw(c,E){const{t,W,H,seed}=E,k=Math.min(70,10+E.stage*10);for(let i=0;i<k;i++){c.save();c.translate(hash(seed,i,4)*W+Math.sin(t+i)*6,wrap(hash(seed,i,5)*H+t*(18+hash(seed,i,6)*14),H));c.rotate(hash(seed,i,7)*6+t*.5);c.fillStyle=ACCENTS[i%6];c.fillRect(-4,-5,8,10);c.fillStyle='#120826';c.fillRect(-4,-5,8,2);c.restore();}}},
];
export function createFx(seed=Math.random()){
 const alpha=new Map(),trail=[];let sky=0,lastTrail=0;
 function pick(stage,t,reduced){
  const ok=EFFECTS.filter(e=>stage>=e.min&&stage<=e.max&&!(reduced&&e.motion)).sort((a,b)=>b.min-a.min);
  if(stage>=5&&ok.length){const o=(Math.floor(t/14)+Math.floor(seed*9))%ok.length;ok.push(...ok.splice(0,o));} // Maximum Overload rotates its motifs
  return new Set(ok.slice(0,MAX_MODULES).map(e=>e.id));}
 return{
  update(dt,stage,t,reduced,y){
   if(t<lastTrail)lastTrail=t;if(t-lastTrail>.1){trail.unshift(y);trail.length=Math.min(trail.length,12);lastTrail=t;}
   const want=pick(stage,t,reduced),step=dt/.8;let live=0;
   for(const e of EFFECTS)if(!want.has(e.id)){const a=Math.max(0,(alpha.get(e.id)||0)-step);alpha.set(e.id,a);}
   for(const e of EFFECTS)if((alpha.get(e.id)||0)>0)live++;
   for(const e of EFFECTS)if(want.has(e.id)){const a=alpha.get(e.id)||0;if(a>0||live<MAX_MODULES){if(a===0)live++;alpha.set(e.id,Math.min(1,a+step));}}
   sky+=((reduced?0:SKY_ALPHA[Math.min(5,stage)])-sky)*Math.min(1,dt*.7);},
  // Rainbow sky: drawn first (behind the skyline). Hue drifts 8 deg/s and strength eases in, so nothing flashes or jumps.
  drawSky(c,t,W,H){
   if(sky<.01)return;const g=c.createLinearGradient?.(0,0,0,H);if(!g)return;
   for(let i=0;i<=4;i++)g.addColorStop(i/4,`hsl(${(t*8+i*70)%360},100%,55%)`);
   c.save();c.globalAlpha=sky;c.fillStyle=g;c.fillRect(0,0,W,H);c.restore();},
  draw(c,t,stage,reduced,W,H){
   const E={t:reduced?0:t,W,H,seed,trail,stage};
   for(const e of EFFECTS){const a=alpha.get(e.id)||0;if(a<.003)continue;c.save();c.globalAlpha=a;e.draw(c,E);c.restore();}},
  active(){return EFFECTS.filter(e=>(alpha.get(e.id)||0)>.003).length;},
  reset(){alpha.clear();trail.length=0;sky=0;lastTrail=0;}};
}
