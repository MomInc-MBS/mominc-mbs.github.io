// A small arcade canvas with run-local points; it never writes workout XP or unlocks.
import {createFlightScore} from './flight-score.mjs';
import {asteroid,rock} from './space-rocks.mjs';
const SHIPS=['supportive','direct','analytical','playful','calm','mom'];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const sprite=[
 '.......11.......','......1221......','......1221......','.....123321.....',
 '....12344321....','...1234554321...','..123456654321..','1123456776543211',
 '1123456776543211','..123456654321..','...1234554321...','....12344321....',
 '.....123321.....','......1881......','.....8.88.8.....','....8..88..8....'
];
const colors={supportive:['#142b40','#70b4db','#b9edff','#f4e6b2','#f37f42','#ffe4a0','#fff8de','#e66638'],direct:['#302644','#b59ce8','#e6caff','#ffdfad','#d95f51','#ff9c65','#fff4db','#e65d39'],analytical:['#183a40','#60d3cc','#b8fff0','#e1e8ff','#6b8fea','#afd3ff','#fff8de','#e66638'],playful:['#3d2445','#fa9ccf','#ffd7ec','#ffecae','#fc7d87','#ffc484','#fff8de','#e66638'],calm:['#173a36','#7dbea7','#c6f5d7','#f8e8be','#8ecbc6','#d7fff0','#fff8de','#e66638'],mom:['#402824','#dba579','#f7d5ad','#fff0c9','#d86d50','#ffbc7f','#fff8de','#e66638']};
function drawShip(ctx,x,y,style,t){
 const palette=colors[SHIPS.includes(style)?style:'supportive'],pixel=3;
 ctx.save();ctx.translate(Math.round(x-24),Math.round(y-24));
 // Each selected catalog hull has its own readable silhouette at this small resolution.
 ctx.fillStyle=palette[1];
 if(style==='supportive'){for(const px of [1,37]){ctx.fillRect(px,19,10,12);ctx.fillRect(px+2,31,6,9);}}
 if(style==='direct'){ctx.fillRect(0,28,15,5);ctx.fillRect(33,28,15,5);ctx.fillRect(3,23,10,6);ctx.fillRect(35,23,10,6);}
 if(style==='analytical'){ctx.fillRect(4,32,40,4);ctx.fillRect(4,25,4,11);ctx.fillRect(40,25,4,11);ctx.fillRect(12,36,24,5);}
 if(style==='playful'){ctx.fillRect(4,3,5,26);ctx.fillRect(39,3,5,26);ctx.fillRect(0,30,11,10);ctx.fillRect(37,30,11,10);}
 if(style==='calm'){ctx.fillRect(9,12,30,28);ctx.fillRect(13,7,22,5);ctx.fillRect(13,40,22,5);}
 if(style==='mom'){ctx.fillRect(2,18,44,22);ctx.fillRect(17,6,14,15);ctx.fillRect(4,10,9,13);ctx.fillRect(35,10,9,13);}
 for(let row=0;row<16;row++)for(let col=0;col<16;col++){
  const code=Number(sprite[row][col]);if(!code)continue;
  ctx.fillStyle=palette[code-1]||palette[0];ctx.fillRect(col*pixel,row*pixel,pixel,pixel);
 }
 ctx.fillStyle=t%360<180?'#f58b40':'#ffe5a0';ctx.fillRect(19,48,4,8);ctx.fillRect(27,48,4,8);ctx.restore();
}
export function mountLevelMapScene(canvas,{ship='supportive',reducedMotion=false,onScore=()=>{}}={}){
 const points=createFlightScore();
 const publish=()=>onScore(points.read());publish();
 const ctx=canvas.getContext('2d');if(!ctx)return {start(){},stop(){},startFiring(){},stopFiring(){},fire(){},aim(){},setShip(){},resize(){},setWarp(){}};
 let running=false,raf=0,w=1,h=1,last=0,time=0,style=ship,aimX=.5,aimY=.72,x=.5,y=.72,firing=false,shotClock=0;
 const clampX=(xVal)=>{if(w<100)return xVal;const maxR=9,minX=(maxR/w)+0.08,maxX=1-minX;return Math.max(minX,Math.min(maxX,xVal));};
 const asteroids=Array.from({length:9},(_,i)=>({x:.12+.76*((i*37+19)%97)/100,y:((i*29+8)%103)/100,r:3+i%4*2,s:.000035+i%5*.000016,hit:0}));
 // R-1017: the constellation page's dark lit-rim rocks join the flight as bigger, slower targets (both pages' asteroids, one game).
 for(let i=0;i<4;i++)asteroids.push({x:.18+.64*((i*41+7)%89)/89,y:((i*31+50)%101)/100,s:.00002+i%3*.00001,hit:0,...asteroid(8,13),poly:true});
 // Hyper-speed: warp streaks while the page jumps to a section; warp is the scroll speed in px/ms (+ = flying up).
 let warp=0;const streaks=Array.from({length:42},(_,i)=>({x:((i*53+11)%97)/97,y:((i*71+5)%89)/89,l:.4+(i*37%10)/10}));
 const lasers=[];const blasts=[];
 // Kenney Space Shooter Remastered, CC0: https://kenney.nl/assets/space-shooter-remastered
 const meteors=['grey','brown'].map(c=>new URL(`../pod/worlds/kenney-meteor-${c}-tiny1.png`,import.meta.url).href).map(src=>{const img=new Image();img.src=src;img.onload=()=>{if(!running)draw();};return img;});
 const resize=()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);w=Math.max(1,rect.width);h=Math.max(1,rect.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();};
 function draw(){ctx.clearRect(0,0,w,h);const now=time;
  for(let index=0;index<asteroids.length;index++){const a=asteroids[index];if(a.hit>0)continue;const px=a.x*w,py=a.y*h,img=meteors[index%meteors.length];if(a.poly){rock(ctx,px,py,a.r,a.rot+a.vr*now/1000,a.verts,.9);continue;}if(img.complete&&img.naturalWidth){ctx.drawImage(img,px-a.r,py-a.r,a.r*2,a.r*2);}else{ctx.fillStyle='#aabcca';ctx.fillRect(px-a.r,py-a.r,a.r*2,a.r*2);}}
  for(const l of lasers){ctx.strokeStyle='#b9faff';ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor='#60e6ff';ctx.beginPath();ctx.moveTo(l.x*w,l.y*h);ctx.lineTo(l.x*w,(l.y-.08)*h);ctx.stroke();ctx.shadowBlur=0;}
  for(const b of blasts){ctx.strokeStyle=`rgba(255,190,105,${Math.max(0,1-b.age/380)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x*w,b.y*h,3+b.age/24,0,Math.PI*2);ctx.stroke();}
  if(warp){const k=Math.min(1,Math.abs(warp)/40);ctx.strokeStyle='#cfefff';ctx.lineWidth=1.5;ctx.globalAlpha=.25+.6*k;ctx.beginPath();
   for(const s of streaks){const sx=s.x*w,sy=s.y*h,len=(30+h*.5*k)*s.l;ctx.moveTo(sx,sy);ctx.lineTo(sx,sy-Math.sign(warp)*len);}
   ctx.stroke();ctx.globalAlpha=1;}
  drawShip(ctx,x*w,y*h,style,now);
  if(warp){ctx.fillStyle='#ffb25a';ctx.globalAlpha=.85;const flame=10+Math.min(60,Math.abs(warp)*1.5);ctx.fillRect(x*w-7,y*h+(warp>0?24:-24-flame),14,flame);ctx.globalAlpha=1;}
 }
 function frame(now){if(!running)return;const dt=Math.min(40,Math.max(0,now-last));last=now;time+=dt;
  // Streaks rush past opposite the jump; asteroids are left behind (they recycle off the edge without breaking the multiplier).
  if(warp){for(const s of streaks){s.y=((s.y+warp*dt/h*1.6)%1+1)%1;}for(const a of asteroids){if(a.hit<=0){a.y+=warp*dt/h;if(a.y>1.04||a.y<-.1){a.y=a.y>1?-.08:1;a.x=clampX((a.x+.37)%1);}}}}
  x+=(aimX-x)*Math.min(1,dt*.04);y+=(aimY-y)*Math.min(1,dt*.04);
  if(firing){shotClock+=dt;while(shotClock>=125){lasers.push({x,y:y-.04});shotClock-=125;}}
  for(const a of asteroids){if(a.hit>0){a.hit-=dt;continue;}if(!reducedMotion){a.y+=a.s*dt;if(a.y>1.05){a.y=-.08;a.x=clampX((a.x+.37)%1);points.miss();publish();}}}
  for(let i=lasers.length-1;i>=0;i--){const l=lasers[i];l.y-=dt*.0016;if(l.y<-.1){lasers.splice(i,1);continue;}const hit=asteroids.find(a=>a.hit<=0&&Math.abs(a.x-l.x)*w<a.r+5&&Math.abs(a.y-l.y)*h<a.r+10);if(hit){hit.hit=700;blasts.push({x:hit.x,y:hit.y,age:0});hit.y=-.08;hit.x=clampX((hit.x+.37)%1);lasers.splice(i,1);points.hit();publish();}}
  for(let i=blasts.length-1;i>=0;i--){blasts[i].age+=dt;if(blasts[i].age>380)blasts.splice(i,1);}
  draw();raf=requestAnimationFrame(frame);
 }
 function start(){resize();if(running||document.hidden)return;running=true;last=performance.now();raf=requestAnimationFrame(frame);}
 function stopFiring(){firing=false;shotClock=0;}
 function stop(){stopFiring();running=false;if(raf)cancelAnimationFrame(raf);raf=0;}
 function fire(){if(document.hidden)return;lasers.push({x,y:y-.04});if(!running)draw();}
 return {start,stop,stopFiring,resetScore(){points.reset();publish();},startFiring(){if(document.hidden)return;firing=true;shotClock=0;fire();},resize,setWarp(value){warp=reducedMotion?0:value;},aim(clientX,clientY){const r=canvas.getBoundingClientRect();aimX=clamp((clientX-r.left)/r.width,.1,.9);aimY=clamp((clientY-r.top)/r.height,.14,.88);x=aimX;y=aimY;draw();},fire,setShip(value){style=value;draw();}};
}
