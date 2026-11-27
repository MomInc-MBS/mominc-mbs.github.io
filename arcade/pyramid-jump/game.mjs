import {gameShellPhase} from './shell-phase.mjs';
// Pyramid Jump: classic Doodle-Jump on 2D paper, 20 levels from the office to MOM's mothership desk (see LEVELS in logic.mjs).
// Lazy/optional (arcade/ is never core). World y points up (feet = y); the camera only scrolls up; falling below the view ends the run.
import {W,BEST_KEY,PLAT_W,JUMP,GRAVITY,Level,mulberry,mealMarkers,markerHeight,paperFor,LEVELS,LEVEL_H,LEVEL_COUNT,END_Y,levelAt,highestLevel,saveLevel,newlyReachedQuestLevel,steeringForMotion} from './logic.mjs';
import {performanceOwner} from './site-shims.mjs';
import {createQuestProgressReporter} from './site-shims.mjs';
const PW=40,PH=50;
const hash=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
export const bestScore=(store=localStorage)=>{try{const n=JSON.parse(store.getItem(BEST_KEY));return Number.isSafeInteger(n)&&n>0?n:0;}catch{return 0;}};
const SHADOW='#49334b66',EDGE='#624848';
const SLOGANS=[['CARED FOR.','CORRECTED.','PROVIDED FOR.'],['SMILE.','REP.','REPEAT.'],['READ THE','SOURCE.'],['ASK MOM.'],['KEEP THE','LABEL.'],['MOM IS','PROUD.'],['EAT. LIFT.','REPORT.'],['FITNESS IS','A FAMILY.']];
const POSTER=['#e5d4a2','#e0c3ea','#f2c6a0','#bfdcc6','#f0e08a'],QUILT=['#c8587a','#e0a050','#5a9ac8','#7ab86a','#a070c0','#e8d070'],ORIGAMI=['#f4a0b4','#a0d4f4','#f4e090','#b0e0a8','#d0b0f0'];

export function startGame(root,{recipe=null,meals=null,subscribeMotion=null,onExit=()=>{},seed=Date.now(),startLevel=0,auto=false,paperImg=null,onEnd=null,hold=null}={}){
 const shell=gameShellPhase('pyramid-jump',root);
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block';
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Pyramid Jump. Lean your phone or use the left and right arrow keys to steer.');
 const over=document.createElement('div');over.style.cssText='position:absolute;inset:0;display:none;place-content:center;gap:12px;text-align:center;background:#0009;color:#fff4dc;font:800 18px/1.4 system-ui,sans-serif;letter-spacing:.05em;white-space:pre-line';
 const btn=(t,f)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.style.cssText='min-height:44px;padding:0 18px;border:2px solid #fff9;border-radius:999px;background:#1d1428;color:#fff4dc;font:700 14px system-ui,sans-serif;pointer-events:auto';b.onclick=f;return b;};
 const msg=document.createElement('div'),row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:10px;justify-content:center';
 const exit=btn('EXIT',()=>onExit());exit.style.cssText+=';position:absolute;top:max(10px,env(safe-area-inset-top));right:10px;min-height:44px;min-width:44px';exit.setAttribute('aria-label','Exit to the pyramid');
 over.append(msg,row);root.append(canvas,exit,over);
 const art=paperFor(recipe),shape=new Path2D(art.d),tags=mealMarkers(meals);
 let lvl,p,camY,maxY,best=bestScore(),t=0,dir=0,tilt=0,tiltAt=-9,raf=0,last=0,dead=true,disposed=false,scale=1,viewH=640,plus=0,cur=0,banner=null,won=false,runOwner=null,reportQuest=null;
 const showOver=(text,...btns)=>{msg.textContent=text;row.replaceChildren(...btns);over.style.display='grid';};
 function begin(from){ // from = 1-based level to start on (1 = the office desk)
  runOwner=performanceOwner();
  reportQuest=createQuestProgressReporter(runOwner);
  lvl=new Level(mulberry(seed++),plus);p={x:W/2,y:0,vx:0,vy:JUMP,fly:0,flyV:0,gear:null,face:1};camY=-90;maxY=0;dead=false;won=false;over.style.display='none';
  if(from>1){const y0=(from-1)*LEVEL_H+20;lvl.ensure(y0+300);const it=lvl.items.find(i=>i.type==='static'&&!i.blink&&i.y>=y0);p.x=it.x+PLAT_W/2;p.y=it.y;camY=p.y-viewH*.45;maxY=p.y;}
  lvl.ensure(camY+viewH*2);for(const i of lvl.items)Object.assign(i,{broken:false,by:0});cur=Math.max(0,Math.min(LEVEL_COUNT-1,from-1));
 }
 const menu=()=>{const hi=highestLevel(),b=[btn(hi>1?'NEW CLIMB':'START',()=>begin(1))];if(hi>1)b.unshift(btn(`CONTINUE FROM LEVEL ${hi}`,()=>begin(hi)));b.push(btn('EXIT',()=>onExit()));return b;};
 function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);scale=canvas.width/W;viewH=canvas.height/scale;}
 const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
 if(startLevel)begin(startLevel);else if(auto)begin(Math.max(1,highestLevel()));else if(highestLevel()>1)showOver(`PYRAMID JUMP\nREACHED LEVEL ${highestLevel()} OF ${LEVEL_COUNT}`,...menu());else begin(1);
 let holding=!!hold;hold?.then(()=>{holding=false},()=>{holding=false});
 const unsub=subscribeMotion?.(sample=>{if(holding)return;tilt=steeringForMotion(sample);tiltAt=t;});
 const key=down=>e=>{if(holding)return;const k=e.key;if(k==='ArrowLeft'||k==='a')dir=down?-1:dir<0?0:dir;else if(k==='ArrowRight'||k==='d')dir=down?1:dir>0?0:dir;};
 const kd=key(true),ku=key(false);addEventListener('keydown',kd);addEventListener('keyup',ku);
 const pd=e=>{if(e.target!==canvas)return;const r=canvas.getBoundingClientRect();dir=e.clientX<r.left+r.width/2?-1:1;},pu=()=>{dir=0;};
 
 const px=it=>it.type==='moving'?Math.max(0,Math.min(W-PLAT_W,it.x+Math.sin(t*1.6+it.phase)*it.dx)):it.x;
 const solid=it=>!it.blink||Math.sin(t*6.28/it.blink+it.phase)>-.3; // origami / star platforms fold away on a timer
 function die(why){if(dead)return;dead=true;const s=Math.floor(maxY/10);if(s>best){best=s;try{localStorage.setItem(BEST_KEY,String(best));}catch{/* ignore */}}
  if(onEnd){onEnd({won:false,why,score:s,level:cur+1,best});return;}showOver(`${why}\nLEVEL ${cur+1} · HEIGHT ${s}\nBEST ${best}${s>=best&&s>0?'  NEW BEST!':''}`,...menu());}
 function win(){dead=won=true;saveLevel(LEVEL_COUNT);reportQuest?.record('pyramid-complete',1);if(onEnd){const s=Math.floor(maxY/10);if(s>best){best=s;try{localStorage.setItem(BEST_KEY,String(best));}catch{/* ignore */}}onEnd({won:true,why:'WON',score:s,level:LEVEL_COUNT,best});return;}showOver(`LEVEL ${LEVEL_COUNT} COMPLETE\nYou ate your way to MOM.`,btn('NEW GAME+',()=>{plus++;begin(1);}),btn('EXIT',()=>onExit()));}
 function step(dt){
  t+=dt;if(dead)return;
  const L=levelAt(p.y),steer=dir||(t-tiltAt<.5?tilt:0);p.vx=steer*340;if(steer)p.face=steer>0?1:-1;
  const prev=p.y;p.x+=p.vx*dt;if(p.x<-PW/2)p.x+=W+PW;else if(p.x>W+PW/2)p.x-=W+PW;
  if(p.fly>0){p.fly-=dt;p.vy=p.flyV;if(p.fly<=0)p.vy=JUMP*.6;}else p.vy-=GRAVITY*(L===8?.7:1)*dt; // moon cafeteria: floatier
  p.y+=p.vy*dt;lvl.ensure(camY+viewH*2);
  for(const it of lvl.items){
   if(it.broken){it.by-=420*dt;continue;}
   if(it.type==='monster'){it.x+=it.dir*50*dt;if(it.x<0||it.x>W-50)it.dir*=-1;const dx=Math.abs(p.x-(it.x+25)),dy=p.y+PH/2-(it.y+16);
    if(dx<PW/2+18&&Math.abs(dy)<PH/2+14){if(p.fly>0||(p.vy<0&&prev>it.y+14)){it.broken=true;p.vy=JUMP;p.fly=0;}else die('BONKED');}continue;}
   if(it.type==='hole'){if(Math.hypot(p.x-(it.x+30),p.y+PH/2-(it.y+30))<30)die('SUCKED IN');continue;}
   const x=it.type==='desk'?0:px(it),pw=it.type==='desk'?W:PLAT_W,near=Math.abs(p.x-(x+pw/2))<pw/2+PW/3;
   if(it.gear&&p.fly<=0&&near&&Math.abs(p.y-(it.y+14))<26){p.fly=it.gear==='jetpack'?4:2.5;p.flyV=it.gear==='jetpack'?900:560;p.gear=it.gear;it.gear=null;}
   if(p.vy<0&&p.fly<=0&&near&&prev>=it.y-2&&p.y<=it.y&&solid(it)){
    if(it.type==='desk'){p.y=it.y;win();return;}
    if(it.type==='breaking'){it.broken=true;continue;}
    p.y=it.y;p.vy=it.type==='spring'?JUMP*1.55:JUMP;
   }
  }
  maxY=Math.max(maxY,p.y);camY=Math.max(camY,p.y-viewH*.45);
  const nl=levelAt(maxY);if(nl!==cur){const crossed=newlyReachedQuestLevel(cur,nl);cur=nl;banner={t,text:`LEVEL ${nl+1} · ${LEVELS[nl].name}`};saveLevel(nl+1);if(crossed)reportQuest?.record('pyramid-level',crossed);}
  lvl.items=lvl.items.filter(i=>(i.y+(i.by||0))>camY-200);
  if(p.y+PH<camY)die('FELL');
 }
 const sy=wy=>(viewH-(wy-camY))*scale,sx=x=>x*scale;
 // ---- Paper toolkit (the Dr. Girlfriend look): cut edges, hard offset shadow, grain, slight tilt.
 const grain=(()=>{const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d'),d=g.createImageData(96,96);for(let i=0;i<d.data.length;i+=4){d.data[i]=d.data[i+1]=d.data[i+2]=hash(i)*255;d.data[i+3]=30;}g.putImageData(d,0,0);return c;})();
 let grainPat=null,flat=false;
 function cut(w,h,seed,j=1.3){ // slightly uneven scissor-cut rectangle centred on the origin
  const p=new Path2D(),n=Math.max(2,Math.round(w/(20*scale))),J=i=>flat?0:(hash(seed*7+i)-.5)*2*j*scale,pts=[];
  for(let i=0;i<=n;i++)pts.push([-w/2+w*i/n+J(i),-h/2+J(i+50)]);
  pts.push([w/2+J(90),J(91)]);
  for(let i=n;i>=0;i--)pts.push([-w/2+w*i/n+J(i+100),h/2+J(i+150)]);
  pts.push([-w/2+J(190),J(191)]);
  pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;
 }
 function sheet(cx,cy,w,h,fill,rot=0,seed=1,inner=null,{edge=EDGE,shadow=3,alpha=1}={}){
  ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);const path=cut(w,h,seed);
  ctx.globalAlpha*=alpha;
  if(flat){ctx.fillStyle='#fff';ctx.fill(path);ctx.strokeStyle='#000';ctx.lineWidth=2*scale;ctx.stroke(path);inner?.();ctx.restore();return;} // Flatland: lines only
  ctx.save();ctx.translate(shadow*scale,shadow*scale);ctx.fillStyle=SHADOW;ctx.fill(path);ctx.restore();
  ctx.fillStyle=fill;ctx.fill(path);grainPat??=ctx.createPattern(grain,'repeat');ctx.fillStyle=grainPat;ctx.fill(path);
  ctx.strokeStyle=edge;ctx.lineWidth=1.6*scale;ctx.stroke(path);inner?.();ctx.restore();
 }
 const tape=(x,y,r)=>{ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.fillStyle='#e8cf7acc';ctx.fillRect(-9*scale,-3.5*scale,18*scale,7*scale);ctx.strokeStyle='#b89e4a88';ctx.lineWidth=scale;ctx.strokeRect(-9*scale,-3.5*scale,18*scale,7*scale);ctx.restore();};
 const text=(t,x,y,size,color,font='Georgia,serif',weight=700)=>{ctx.fillStyle=color;ctx.font=`${weight} ${size*scale}px ${font}`;ctx.textAlign='center';ctx.fillText(t,x,y);};
 const ly=(wy,f=1)=>(viewH-(wy-camY*f))*scale; // screen y of a point on a parallax layer
 const diamond=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.45,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.45,y);ctx.closePath();ctx.fill();};
 const blob=(cx,cy,r,seed,c,a=1)=>{ctx.save();ctx.globalAlpha*=a;ctx.translate(cx,cy);const p=new Path2D(),n=14;for(let i=0;i<n;i++){const t=i/n*6.283,k=r*(.8+hash(seed+i)*.35);i?p.lineTo(Math.cos(t)*k,Math.sin(t)*k):p.moveTo(k,0);}p.closePath();ctx.fillStyle=c;ctx.fill(p);ctx.strokeStyle=EDGE;ctx.lineWidth=scale;ctx.globalAlpha*=.5;ctx.stroke(p);ctx.restore();};
 const rows=(f,step,fn)=>{for(let b=Math.floor(camY*f/step)-1;b<(camY*f+viewH)/step+1;b++)fn(b,ly(b*step+hash(b)*step*.6,f),sx(hash(b+5)*W));};
 const stars=(f=.3,c='255,244,210')=>rows(f,60,(b,y)=>{for(let k=0;k<2;k++)diamond(sx(hash(b*3+k)*W),y+k*sx(20),(1.5+hash(b+k)*2.5)*scale,`rgba(${c},.9)`);});
 function poster(cx,cy,w,h,b){
  const L=SLOGANS[b%SLOGANS.length];
  sheet(cx,cy,w,h,POSTER[b%POSTER.length],(hash(b+9)-.5)*.12,b,()=>{
   text('MOM INC.',0,-h/2+13*scale,8,'#4c3255');
   ctx.fillStyle='#79558a';ctx.beginPath();ctx.arc(0,-h/2+32*scale,9*scale,0,7);ctx.fill();diamond(0,-h/2+32*scale,8*scale,'#f4e7a0');
   L.forEach((l,i)=>text(l,0,-h/2+54*scale+i*13*scale,l.length>9?9:11,'#3a2548'));
   text('A MOM INC. WORKPLACE',0,h/2-6*scale,5,'#6d5a7c','monospace',400);tape(-w/2+8*scale,-h/2+2*scale,-.5);tape(w/2-8*scale,-h/2+2*scale,.5);});
 }
 const wallpaper=()=>{ctx.fillStyle='#ffffff14';for(let x=0;x<W;x+=48)ctx.fillRect(sx(x),0,sx(14),canvas.height);ctx.fillStyle='#00000010';for(let wy=Math.floor(camY/80)*80;wy<camY+viewH;wy+=80)ctx.fillRect(0,ly(wy),canvas.width,2*scale);
  grainPat??=ctx.createPattern(grain,'repeat');ctx.fillStyle=grainPat;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#665044';ctx.fillRect(0,0,sx(10),canvas.height);ctx.fillRect(sx(W-10),0,sx(10),canvas.height);};
 function pyramidDesk(by,k=1){ // the desk with the paper food pyramid (the same one that sat in the pyramid scene)
  const px0=sx(W/2),py0=ly(by-4);
  sheet(px0,ly(by-18),sx(300*k),sx(34),'#8a5f3c',0,6);sheet(px0,ly(by-50),sx(280*k),sx(10),'#a9774c',0,7);
  for(let i=0;i<3;i++)sheet(px0,py0-sx(17)-i*sx(32*k),sx((150-i*45)*k),sx(34*k),['#cdbb8a','#d9c590','#e8d28a'][i],0,20+i);
  for(const [dx,dy,c] of [[-30,-16,'#7fcf5a'],[0,-16,'#f4d35e'],[30,-16,'#4fd1c5'],[-14,-48,'#f4978e'],[14,-48,'#c9a7eb']])sheet(px0+sx(dx*k),py0+sx(dy*k),sx(22*k),sx(18*k),c,0,Math.round(dx+dy),null,{shadow:1});
  sheet(px0,py0-sx(100*k),sx(30*k),sx(14*k),'#2d2a4e',0,8,()=>text('FOOD',0,sx(3),6,'#f4e7a0','monospace'));
 }
 function office(by){ // the small office: floor, window, filing cabinets, desk + pyramid, the wall poster and note
  ctx.fillStyle='#6a5240';ctx.fillRect(0,ly(by-40),canvas.width,canvas.height);ctx.fillStyle='#00000022';for(let x=0;x<W;x+=40)ctx.fillRect(sx(x),ly(by-40),scale*2,canvas.height);
  sheet(sx(250),ly(by+150),sx(70),sx(90),'#bfe3ee',0,3,()=>{ctx.strokeStyle=EDGE;ctx.beginPath();ctx.moveTo(0,-sx(45));ctx.lineTo(0,sx(45));ctx.moveTo(-sx(35),0);ctx.lineTo(sx(35),0);ctx.stroke();});
  sheet(sx(36),ly(by+60),sx(46),sx(100),'#8c8f98',0,4,()=>{for(let i=0;i<3;i++){ctx.strokeStyle=EDGE;ctx.strokeRect(-sx(18),-sx(40)+i*sx(30),sx(36),sx(26));}});
  sheet(sx(86),ly(by+40),sx(46),sx(80),'#9a9da6',0,5);pyramidDesk(by);
  poster(sx(60),ly(by+250),sx(96),sx(104),0);
  sheet(sx(250),ly(by+260),sx(86),sx(54),'#dbc68a',.05,9,()=>{text('READ THE SOURCE.',0,-sx(4),6.5,'#463149','monospace',400);text('KEEP THE LABEL.',0,sx(8),6.5,'#463149','monospace',400);});
  sheet(sx(300),ly(by+420),sx(40),sx(100),'#7b5a3a',0,11,()=>text('VENT',0,0,6,'#f4e7a0','monospace')); // the bookshelf into the ceiling vent
 }
 // One scene per level, drawn inside that level's band (clipped), over its sky gradient.
 const SCENES=[
  ()=>{wallpaper();office(0);},
  ()=>{rows(1,130,(b,y)=>{sheet(sx(W/2),y,sx(W-24),sx(30),'#9aa0ae',0,b,()=>{for(let i=0;i<9;i++){ctx.fillStyle='#6a6f7c';ctx.beginPath();ctx.arc(-sx(W/2-30)+i*sx(36),0,sx(2),0,7);ctx.fill();}});
   if(b%3===0){ctx.save();ctx.translate(sx(40+hash(b)*280),y-sx(40));ctx.rotate(t*5);for(let i=0;i<4;i++){ctx.rotate(1.57);sheet(0,-sx(14),sx(8),sx(26),'#d0d4de',0,b+i,null,{shadow:1});}ctx.restore();}});},
  ()=>{wallpaper();rows(1,230,(b,y,x)=>{const w=sx(70+hash(b+1)*40);poster(sx(30+hash(b)*(W-60)),y,w,w*1.2,b);});},
  ()=>{rows(.8,150,(b,y,x)=>{const w=sx(50+hash(b)*40),h=sx(120+hash(b+2)*100);sheet(x,y+h/2-sx(60),w,h,'#5a5a78',0,b,()=>{for(let i=0;i<6;i++)for(let k=0;k<3;k++){ctx.fillStyle=hash(b*9+i*3+k)<.5?'#ffd66a':'#3a3a58';ctx.fillRect(-w/2+sx(7)+k*w/3.4,-h/2+sx(10)+i*sx(18),sx(8),sx(9));}});
   if(b%5===0)sheet(sx(W/2),y-sx(100),sx(180),sx(70),'#e45a8a',0,b+1,()=>{text('MOM',0,sx(10),30,'#fff4dc');text('LOVES YOU',0,sx(24),8,'#fff4dc','monospace');});
   if(b%3===1){ctx.strokeStyle='#2a2a3e';ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(x,y-sx(60));ctx.lineTo(x,y-sx(110));ctx.stroke();}});},
  ()=>{rows(.5,150,(b,y,x)=>{for(let k=0;k<3;k++)blob(x+sx(k*34-30),y+sx(k%2*10),sx(30+hash(b+k)*12),b+k,'#fbfaf5',.95);
   if(b%9===0)sheet(sx(W/2),y,sx(140),sx(46),'#e45a8a',0,b,()=>text('MOM',0,sx(5),16,'#fff4dc'));
   if(b%4===2){ctx.strokeStyle='#fff';ctx.lineWidth=scale;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+sx(40));ctx.stroke();ctx.fillStyle='#e0504a';ctx.beginPath();ctx.arc(x,y,sx(12),0,7);ctx.fill();}});},
  ()=>{stars();sheet(sx(W/2),sx(viewH/2),sx(10),canvas.height*1.1,'#c9c6d2',0,3,()=>{ctx.strokeStyle=EDGE;for(let wy=Math.floor(camY/60)*60;wy<camY+viewH+60;wy+=60){ctx.beginPath();ctx.moveTo(-sx(5),ly(wy)-sx(viewH/2));ctx.lineTo(sx(5),ly(wy)-sx(viewH/2));ctx.stroke();}});
   rows(1,300,(b,y,x)=>sheet(hash(b)<.5?sx(70):sx(W-70),y,sx(50),sx(36),'#8a8fa8',0,b,()=>{ctx.fillStyle='#ffd66a';ctx.fillRect(-sx(6),-sx(6),sx(12),sx(10));}));},
  ()=>{stars(.3);rows(.7,110,(b,y,x)=>sheet(x,y,sx(14+hash(b)*22),sx(8+hash(b+1)*10),'#8a8fa0',hash(b)*3,b,null,{shadow:2}));
   rows(1,330,(b,y)=>{ctx.save();ctx.strokeStyle='#fffbe8';ctx.lineWidth=5*scale;ctx.shadowColor='#fff';ctx.shadowBlur=12*scale;ctx.beginPath();ctx.moveTo(0,y);for(let i=1;i<=9;i++)ctx.lineTo(sx(i*W/9),y+(hash(b*9+i)-.5)*sx(26));ctx.stroke();ctx.restore();});},
  ()=>{stars();rows(.6,380,(b,y)=>{const left=hash(b+3)<.5,x=left?sx(70):sx(W-70),w=sx(120+hash(b)*70),hh=sx(52+hash(b+1)*30);
   sheet(x,y,w,hh,'#5d5a8c',(hash(b+6)-.5)*.05,b,()=>{for(let i=0;i<5;i++){ctx.fillStyle='#ffd66a';ctx.fillRect(-w/2+sx(12+i*26),sx(6),sx(8),sx(8));}ctx.fillStyle='#8b86c4';ctx.fillRect(-w/2,-hh/2,w,sx(8));});
   sheet(x+(left?w/2+sx(24):-w/2-sx(24)),y,sx(48),sx(7),'#9fd4e6',0,b+1,null,{shadow:2});sheet(x+(left?w/2+sx(60):-w/2-sx(60)),y-sx(10),sx(16),sx(12),'#e8e0d0',.3,b+2,null,{shadow:2});
   if(b%2===0)sheet(x,y-hh/2-sx(10),sx(86),sx(14),'#2d2a4e',0,b+3,()=>text('MOM PORT 18',0,sx(3),7,'#ffd66a','monospace'),{shadow:2});});},
  ()=>{blob(sx(W/2),ly(8700),sx(60),4,'#3b78c4');rows(1,260,(b,y,x)=>{sheet(x,y,sx(90),sx(12),'#c9c6d2',0,b,()=>{sheet(0,-sx(12),sx(24),sx(16),'#cdbb8a',0,b+3,null,{shadow:1});},{shadow:2});sheet(x,y+sx(26),sx(80),sx(8),'#8a5f3c',0,b+1,null,{shadow:2});});},
  ()=>{rows(1,120,(b,y)=>sheet(sx(W/2),y,sx(W),sx(60),b%2?'#e9d8ee':'#c7b0dc',0,b,null,{alpha:.7,shadow:0}));ctx.fillStyle='#00000026';ctx.fillRect(0,0,sx(W/2),canvas.height);
   ctx.fillStyle='#00000055';ctx.fillRect(sx(W/2)-scale,0,2*scale,canvas.height);ctx.save();ctx.globalCompositeOperation='difference';ctx.fillStyle='#e8e8e8';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();},
  ()=>{for(let r=Math.floor(camY/60);r<(camY+viewH)/60+1;r++)for(let c=0;c<7;c++){const x=sx(c*60+30),y=ly(r*60+30),k=hash(r*7+c);ctx.fillStyle=ORIGAMI[(r+c)%5];ctx.beginPath();if(k<.5){ctx.moveTo(x-sx(30),y-sx(30));ctx.lineTo(x+sx(30),y-sx(30));ctx.lineTo(x-sx(30),y+sx(30));}else{ctx.moveTo(x+sx(30),y+sx(30));ctx.lineTo(x+sx(30),y-sx(30));ctx.lineTo(x-sx(30),y+sx(30));}ctx.closePath();ctx.fill();ctx.strokeStyle='#ffffff88';ctx.stroke();}},
  ()=>{stars();rows(.6,120,(b,y,x)=>{if(b%2)blob(x,y,sx(12+hash(b)*14),b,'#6a6478');else{ctx.strokeStyle='#14101c';ctx.lineWidth=4*scale;ctx.beginPath();ctx.arc(x,y,sx(9),0,7);ctx.stroke();ctx.fillStyle='#3a3548';ctx.beginPath();ctx.arc(x,y+sx(3),sx(8),0,7);ctx.fill();}});},
  ()=>{rows(.4,80,(b,y)=>{ctx.strokeStyle=b%2?'#7fe6ff':'#d070ff';ctx.lineWidth=4*scale;ctx.beginPath();ctx.ellipse(sx(W/2),y,sx(150+(b%4)*8),sx(50),0,0,7);ctx.stroke();});
   ctx.strokeStyle='#ffffff22';for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(sx(W/2),sx(viewH/2));ctx.lineTo(sx(i*W/8),0);ctx.moveTo(sx(W/2),sx(viewH/2));ctx.lineTo(sx(i*W/8),canvas.height);ctx.stroke();}},
  ()=>{ctx.strokeStyle='#000';ctx.lineWidth=scale;for(let x=0;x<=W;x+=40){ctx.beginPath();ctx.moveTo(sx(x),0);ctx.lineTo(sx(x),canvas.height);ctx.stroke();}for(let wy=Math.floor(camY/40)*40;wy<camY+viewH+40;wy+=40){ctx.beginPath();ctx.moveTo(0,ly(wy));ctx.lineTo(canvas.width,ly(wy));ctx.stroke();for(let x=0;x<=W;x+=40){ctx.fillStyle='#000';ctx.fillRect(sx(x)-scale,ly(wy)-scale,2*scale,2*scale);}}},
  ()=>{ctx.save();const by=14000,cy=ly(by+LEVEL_H/2);ctx.translate(0,cy);ctx.scale(1,-1);ctx.translate(0,-cy);wallpaper();office(by);ctx.restore();ctx.save();ctx.globalCompositeOperation='color';ctx.fillStyle='#2aa8a0';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();},
  ()=>{for(let r=Math.floor(camY/60);r<(camY+viewH)/60+1;r++)for(let c=0;c<7;c++){const x=sx(c*60),y=ly(r*60+60);ctx.fillStyle=QUILT[Math.floor(hash(r*7+c)*6)];ctx.fillRect(x,y,sx(60),sx(60));ctx.setLineDash([4*scale,4*scale]);ctx.strokeStyle='#fff8';ctx.strokeRect(x+sx(3),y+sx(3),sx(54),sx(54));ctx.setLineDash([]);if(hash(r*7+c+9)<.3){ctx.fillStyle='#2a2030';ctx.beginPath();ctx.arc(x+sx(30),y+sx(30),sx(5),0,7);ctx.fill();}}},
  ()=>{rows(1,40,(b,y)=>{ctx.fillStyle=`rgba(80,255,220,${.08+hash(b)*.15})`;ctx.fillRect(0,y,canvas.width,sx(2+hash(b+1)*4));});
   rows(.8,90,(b,y,x)=>sheet(((t*40+b*77)%(W+40))*scale-sx(20),y,sx(24),sx(10),'#2a7a8a',0,b,()=>{ctx.fillStyle='#7fffe0';ctx.fillRect(-sx(8),-sx(2),sx(16),sx(4));},{shadow:1}));
   rows(1,260,(b,y,x)=>{ctx.fillStyle=hash(b)<.5?'#ff3aa0':'#3affd0';ctx.fillRect(x,y,sx(18),sx(12));});ctx.fillStyle='#0b4a5a';ctx.fillRect(0,0,sx(8),canvas.height);ctx.fillRect(sx(W-8),0,sx(8),canvas.height);},
  ()=>{rows(.35,300,(b,y,x)=>{blob(x,y,sx(80+hash(b)*50),b,hash(b)<.5?'#8a4fc4':'#3fa6b8',.4);});stars(.3,'255,200,230');rows(.7,150,(b,y,x)=>{const r=sx(6+hash(b)*8)*(1+.25*Math.sin(t*3+b));diamond(x,y,r*1.6,'#ffe9a0');diamond(x,y,r,'#fff');});},
  ()=>{ctx.fillStyle='#00000018';for(let wy=Math.floor(camY/10)*10;wy<camY+viewH+10;wy+=10){ctx.fillRect(0,ly(wy),sx(wy%50?10:22),scale);if(!(wy%50))text(String(wy/10%100),sx(34),ly(wy)+sx(3),6,'#000a','monospace',400);}
   rows(1,70,(b,y,x)=>{ctx.strokeStyle='#555';ctx.lineWidth=scale;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+sx(20),y-sx(8));ctx.lineTo(x+sx(36),y+sx(4));ctx.stroke();if(b%4===0)blob(x,y+sx(20),sx(4),b,'#e8a0b0');});
   const hy=ly(18700);sheet(sx(W-30),hy,sx(110),sx(70),'#e8b890',.1,3);for(let i=0;i<4;i++)sheet(sx(W-80),hy-sx(30)+i*sx(18),sx(60),sx(12),'#e8b890',.1+i*.05,4+i);},
  ()=>{rows(1,160,(b,y,x)=>{ctx.fillStyle='#00000030';ctx.beginPath();ctx.arc(sx(hash(b)<.5?50:W-50),y,sx(22),0,7);ctx.fill();ctx.strokeStyle='#8a7aa8';ctx.lineWidth=3*scale;ctx.stroke();});stars();
   pyramidDesk(END_Y-14,1.4);tags.slice(-40).forEach((m,i)=>{const c=i%4,r=Math.floor(i/4);sheet(sx(45+c*90),ly(END_Y-260-r*34),sx(80),sx(26),'#ead9a6',(hash(i)-.5)*.1,i,()=>{text(m.name,0,-sx(2),6,'#463149','system-ui,sans-serif');text(m.date,0,sx(8),5,'#463149','monospace',400);},{shadow:2});});},
 ];
 function gate(k){ // the connector between level k and k+1: a paper lintel + posts that say how you leave
  const y=ly(k*LEVEL_H+40);sheet(sx(W/2),y-sx(34),sx(W-30),sx(24),'#d7c28a',0,k,()=>text(LEVELS[k-1].gate,0,sx(3),7,'#3a2548','monospace'));
  sheet(sx(14),y,sx(12),sx(70),'#c8b47a',0,k+1,null,{shadow:2});sheet(sx(W-14),y,sx(12),sx(70),'#c8b47a',0,k+2,null,{shadow:2});
  ctx.fillStyle='#ffe9a044';ctx.fillRect(sx(20),y-sx(22),sx(W-40),sx(2));
 }
 function bg(){
  const first=levelAt(camY),lastL=levelAt(camY+viewH);
  for(let L=Math.max(0,first);L<=lastL;L++){
   const top=L===LEVEL_COUNT-1?END_Y+3000:(L+1)*LEVEL_H,a=ly(top),b=ly(L?L*LEVEL_H:-3000),next=LEVELS[Math.min(LEVEL_COUNT-1,L+1)].sky;
   ctx.save();ctx.beginPath();ctx.rect(0,a,canvas.width,b-a+1);ctx.clip();
   const g=ctx.createLinearGradient(0,b,0,a);g.addColorStop(0,LEVELS[L].sky);g.addColorStop(1,L===13?LEVELS[13].sky:next);ctx.fillStyle=g;ctx.fillRect(0,a,canvas.width,b-a+1);
   flat=L===13;SCENES[L]();flat=false;ctx.restore();
  }
  for(let k=Math.max(1,first);k<=Math.min(LEVEL_COUNT-1,lastL+1);k++)gate(k);
 }
 function paper(it){
  if(it.type==='desk'){sheet(sx(W/2),sy(it.y)+sx(8),sx(W),sx(18),'#8a5f3c',0,31);return;}
  const x=px(it),cx=sx(x+PLAT_W/2),y=sy(it.y+(it.by||0)),w=sx(PLAT_W),hh=sx(11),cy=y+hh/2-scale,rot=(hash(it.y)-.5)*.08+(it.broken?(hash(it.y+1)-.5)*3*(-(it.by||0)/200):0);
  if(it.type==='monster'||it.type==='hole'||(it.broken&&y>canvas.height+50))return;
  if(it.blink&&!solid(it)){ctx.save();ctx.strokeStyle='#ffffff88';ctx.lineWidth=2*scale;ctx.setLineDash([3*scale,3*scale]);ctx.beginPath();ctx.moveTo(cx-w/2,cy);ctx.lineTo(cx+w/2,cy);ctx.stroke();ctx.restore();return;}
  if(it.type==='breaking'){ // two paper halves with a torn edge between
   for(const s of[-1,1])sheet(cx+s*w/4,cy+(it.broken?s*sx(3):0),w/2-scale,hh,'#c58558',rot+(it.broken?s*.25:0),Math.round(it.y)+s,null,{edge:'#7a4a30'});
   ctx.strokeStyle='#4a2a1a';ctx.lineWidth=scale*1.2;ctx.beginPath();ctx.moveTo(cx,cy-hh/2);ctx.lineTo(cx-sx(3),cy-sx(1));ctx.lineTo(cx+sx(2),cy+sx(1));ctx.lineTo(cx,cy+hh/2);ctx.stroke();
  }else sheet(cx,cy,w,hh,it.type==='moving'?'#8cc3d1':it.blink?'#f4d870':'#d7c28a',rot,Math.round(it.y),it.type==='moving'?()=>{tape(-w/2+sx(5),0,-.3);tape(w/2-sx(5),0,.3);}:null);
  if(it.type==='spring'){ctx.save();ctx.translate(cx,y);for(const [o,c,wd] of[[2,SHADOW,5],[0,'#fff4dc',4]]){ctx.strokeStyle=c;ctx.lineWidth=wd*scale;ctx.lineJoin='bevel';ctx.beginPath();ctx.moveTo(-sx(7)+o,0);for(let i=0;i<4;i++)ctx.lineTo(i%2?-sx(7)+o:sx(7)+o,-(i+1)*sx(4)+o);ctx.stroke();}ctx.strokeStyle=EDGE;ctx.lineWidth=scale;ctx.stroke();ctx.restore();}
  if(it.gear==='jetpack')sheet(cx,y-sx(9),sx(11),sx(16),'#e45a5a',0,3,()=>{ctx.fillStyle='#ffb24d';ctx.fillRect(-sx(3),sx(6),sx(6),sx(5));},{shadow:2});
  else if(it.gear)sheet(cx,y-sx(8),sx(16),sx(7),'#7fe6ff',-.2,4,()=>{ctx.beginPath();ctx.moveTo(-sx(8),0);ctx.lineTo(sx(8),0);ctx.stroke();},{shadow:2});
 }
 function foe(it){
  if(it.broken)return;const x=sx(it.x),y=sy(it.y);
  if(it.type==='hole'){const cx=x+sx(30),cy=y-sx(30);const r=ctx.createRadialGradient(cx,cy,0,cx,cy,sx(34));r.addColorStop(0,'#000');r.addColorStop(.6,'#1a0830');r.addColorStop(1,'#7a3cc800');ctx.fillStyle=r;ctx.beginPath();ctx.arc(cx,cy,sx(34),0,7);ctx.fill();ctx.strokeStyle='#b57cff';ctx.lineWidth=2*scale;ctx.beginPath();ctx.arc(cx,cy,sx(18),t*4,t*4+4);ctx.stroke();return;}
  if(it.type!=='monster')return;
  const look=LEVELS[levelAt(it.y)].mon,cx=x+sx(25),cy=y-sx(16),eye=(c=0)=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy-sx(2),sx(8),0,7);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx+sx(3*Math.sign(p.x-it.x-25)),cy-sx(2),sx(3.5),0,7);ctx.fill();};
  if(look==='tri'){sheet(cx,cy,sx(40),sx(30),'#fff',0,3);ctx.strokeStyle='#000';ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(cx-sx(22),cy+sx(14));ctx.lineTo(cx,cy-sx(16));ctx.lineTo(cx+sx(22),cy+sx(14));ctx.closePath();ctx.stroke();eye();return;}
  ctx.save();ctx.translate(cx,cy);ctx.fillStyle=SHADOW;ctx.beginPath();ctx.ellipse(sx(3),sx(3),sx(25),sx(16),0,0,7);ctx.fill();ctx.restore();
  ctx.lineWidth=2*scale;ctx.strokeStyle='#1d3a1a';
  if(look==='dust'){ctx.fillStyle='#a8a4a0';for(let i=0;i<10;i++){ctx.beginPath();ctx.arc(cx+Math.cos(i*.63)*sx(18),cy+Math.sin(i*.63)*sx(11),sx(8),0,7);ctx.fill();}}
  else if(look==='pigeon'){ctx.fillStyle='#8890a0';ctx.beginPath();ctx.ellipse(cx,cy,sx(22),sx(14),0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#e8a040';ctx.beginPath();ctx.moveTo(cx+sx(20),cy-sx(4));ctx.lineTo(cx+sx(32),cy);ctx.lineTo(cx+sx(20),cy+sx(3));ctx.fill();}
  else if(look==='crane'){ctx.fillStyle='#fff4f0';ctx.beginPath();ctx.moveTo(cx-sx(26),cy-sx(10));ctx.lineTo(cx,cy+sx(12));ctx.lineTo(cx+sx(26),cy-sx(10));ctx.lineTo(cx+sx(8),cy-sx(2));ctx.lineTo(cx+sx(14),cy-sx(20));ctx.lineTo(cx,cy-sx(4));ctx.closePath();ctx.fill();ctx.stroke();}
  else if(look==='needle'){ctx.fillStyle='#c8ccd8';ctx.beginPath();ctx.moveTo(cx-sx(28),cy);ctx.lineTo(cx,cy-sx(8));ctx.lineTo(cx+sx(28),cy);ctx.lineTo(cx,cy+sx(8));ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e0504a';ctx.beginPath();ctx.arc(cx-sx(20),cy,sx(3),0,7);ctx.fill();}
  else if(look==='junk'){ctx.fillStyle='#8a8fa0';ctx.beginPath();ctx.ellipse(cx,cy,sx(22),sx(14),.3,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#e8c040';ctx.fillRect(cx-sx(3),cy-sx(18),sx(6),sx(8));}
  else if(look==='glitch'){ctx.fillStyle='#ff3aa0';ctx.fillRect(cx-sx(18),cy-sx(10),sx(36),sx(20));ctx.fillStyle='#3affd0';ctx.fillRect(cx-sx(10)+sx(6*Math.sin(t*20)),cy-sx(4),sx(30),sx(8));}
  else{ctx.fillStyle='#69b04a';ctx.beginPath();ctx.ellipse(cx,cy,sx(25),sx(16),0,0,7);ctx.fill();ctx.stroke();for(const k of[-1,1]){ctx.beginPath();ctx.moveTo(cx+sx(k*14),cy-sx(14));ctx.lineTo(cx+sx(k*20),cy-sx(26));ctx.stroke();}}
  if(look!=='needle'&&look!=='glitch')eye();
 }
 function tag(i,m){
  const wy=markerHeight(i,tags.length),y=sy(wy);if(y<-80||y>canvas.height+80||false)return;const left=i%2===0,x=left?sx(6):sx(W-150),w=sx(144),h=sx(46);
  ctx.save();ctx.translate(x+w/2,y);ctx.rotate(left?-.03:.03);ctx.strokeStyle='#ffffff55';ctx.lineWidth=scale;ctx.beginPath();ctx.moveTo(left?-w/2:w/2,0);ctx.lineTo(left?-w/2-sx(8):w/2+sx(8),-sx(30));ctx.stroke();
  ctx.fillStyle='#ead9a6';ctx.strokeStyle='#8c7646';ctx.lineWidth=2*scale;ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);ctx.textAlign='left';
  ctx.fillStyle='#463149';ctx.font=`700 ${11*scale}px system-ui,sans-serif`;ctx.fillText(m.name,-w/2+sx(6),-sx(6));ctx.font=`${9*scale}px monospace`;ctx.fillText(m.date,-w/2+sx(6),sx(6));ctx.fillText(`P${m.p} C${m.c} F${m.f}`,-w/2+sx(6),sx(17));ctx.restore();
 }
 function me(ghost=false){
  const x=sx(ghost?W-p.x:p.x),y=sy(p.y),k=PH/240*scale;ctx.save();if(ghost)ctx.globalAlpha=.4;
  for(const dx of[0,W*scale,-W*scale]){ctx.save();ctx.translate(x+dx,y);ctx.scale((ghost?-p.face:p.face)*k,k);ctx.translate(-100,-236);
   if(paperImg){ctx.shadowColor=flat?'transparent':'#49334b88';ctx.shadowOffsetX=3*scale;ctx.shadowOffsetY=3*scale;ctx.drawImage(paperImg,0,0,200,240);ctx.shadowColor='transparent';}else{ctx.shadowColor=flat?'transparent':'#49334b88';ctx.shadowOffsetX=3*scale;ctx.shadowOffsetY=3*scale;ctx.fillStyle=art.colour;ctx.strokeStyle='#2a1838';ctx.lineWidth=4;ctx.lineJoin='round';ctx.fill(shape);ctx.shadowColor='transparent';ctx.stroke(shape);
   const [ex,ey,er]=art.eye;ctx.fillStyle='#fff8eb';ctx.beginPath();ctx.arc(ex,ey,er*1.7,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#2a1838';ctx.beginPath();ctx.arc(ex+er*.5,ey,er*.8,0,7);ctx.fill();}
   if(p.fly>0&&!ghost){if(p.gear==='propeller'){ctx.fillStyle='#7fe6ff';ctx.fillRect(80,0,40,8);ctx.fillRect(100-60*Math.cos(t*30),-6,120*Math.abs(Math.cos(t*30))||4,5);}else{ctx.fillStyle='#e45a5a';ctx.fillRect(40,100,20,60);ctx.fillRect(140,100,20,60);ctx.fillStyle='#ffb24d';ctx.fillRect(44,160,12,30+30*Math.random());ctx.fillRect(144,160,12,30+30*Math.random());}}
   ctx.restore();}
  ctx.restore();
 }
 function draw(){
  bg();flat=levelAt(camY+viewH/2)===13;tags.forEach((m,i)=>tag(i,m));lvl.items.forEach(paper);lvl.items.forEach(foe);if(levelAt(p.y)===14)me(true);me();flat=false;
  const s=Math.floor(maxY/10),dark=levelAt(camY+viewH/2)===13?'#000':'#fff4dc';ctx.fillStyle=dark;ctx.strokeStyle='#000a';ctx.lineWidth=3*scale;ctx.textAlign='left';ctx.font=`800 ${18*scale}px monospace`;if(!flat)ctx.strokeText(String(s),sx(10),sx(26));ctx.fillText(String(s),sx(10),sx(26));
  ctx.font=`${10*scale}px monospace`;ctx.fillText(`LVL ${Math.max(1,cur+1)}/${LEVEL_COUNT}${plus?' +'+plus:''}  BEST ${Math.max(best,s)}`,sx(10),sx(40));
  const past=tags.filter((_,i)=>markerHeight(i,tags.length)<=p.y);if(tags.length){const m=past.at(-1)||tags[0];ctx.textAlign='right';ctx.font=`700 ${10*scale}px monospace`;ctx.fillStyle='#ead9a6';ctx.strokeText(m.date,sx(W-6),sx(120));ctx.fillText(m.date,sx(W-6),sx(120));ctx.font=`${8*scale}px monospace`;ctx.fillText('YOU ATE',sx(W-6),sx(108));}
  if(banner&&t-banner.t<2.8){ctx.save();ctx.globalAlpha=Math.min(1,(2.8-(t-banner.t))*2);sheet(sx(W/2),sx(86),sx(250),sx(40),'#ead9a6',-.02,7,()=>{text(banner.text,0,sx(5),13,'#463149');tape(-sx(112),-sx(16),-.4);tape(sx(112),-sx(16),.4);});ctx.restore();}
 }
 function tick(now){raf=requestAnimationFrame(tick);if(disposed)return;shell.phase(!dead&&!won&&!holding&&!document.hidden?'active':'paused');const dt=Math.min(.033,last?(now-last)/1000:0);last=now;if(!document.hidden){if(!holding)step(dt);draw();}}
 raf=requestAnimationFrame(tick);
 return {
  state:()=>({p,camY,maxY,dead,won,cur,items:lvl.items}),
  teleport(h){if(dead&&!won){dead=false;over.style.display='none';}lvl.ensure(h+viewH*2);p.y=h;p.vy=JUMP;p.fly=.35;p.flyV=0;camY=h-viewH*.45;maxY=Math.max(maxY,h);},
  level(n){const h=(n-1)*LEVEL_H+30;this.teleport(h);},
  dispose(){if(disposed)return;shell.close();disposed=true;cancelAnimationFrame(raf);ro.disconnect();unsub?.();removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('pointerup',pu);removeEventListener('pointercancel',pu);canvas.remove();exit.remove();over.remove();},
 };
}
