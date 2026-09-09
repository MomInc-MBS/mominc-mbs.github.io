/* Original modular sci-fi pixel weapons. Stable family IDs preserve saved loadouts. Tier zero plus twenty upgrades per family. */
(()=>{'use strict';
const types=[['rapier','Plasma blade'],['greatsword','Ion cleaver'],['dagger','Phase dagger'],['sabre','Arc pistol'],['axe','Pulse rifle'],['hammer','Rail cannon'],['mace','Tesla emitter'],['flail','Tether drone'],['spear','Particle lance'],['trident','Tri-beam fork'],['halberd','Rocket pod'],['scythe','Gravity reaper'],['bow','Photon bow'],['crossbow','Gauss launcher'],['chakram','Orbit disc'],['gauntlets','Power gauntlets'],['staff','Gravity rod'],['wand','Sonic disruptor'],['tome','Nanite hive'],['cannon','Plasma cannon']].map(([id,name])=>({id,name}));
const tiers=['Field','Charged','Calibrated','Overclocked','Cryo-cooled','Twin-core','Ionized','Supercharged','Plasma-fed','Phase-linked','Quantum','Antimatter','Gravitic','Drone-linked','Neural','Singularity','Orbital','Rift-tech','Dark-matter','Starbreaker','MOM’s Impossible'];
const days=[1,2,3,5,7,10,14,21,30,45,60,75,90,120,150,180,210,240,270,300,365];
const strength=[1,2,3,4,5,6,8,10,12,15,18,20,23,27,31,35,40,45,50,60,75];
function normalize(value){if(!value||!types.some(t=>t.id===value.type)||!Number.isInteger(value.tier)||value.tier<0||value.tier>20)throw Error('This look has an unknown weapon.');return {type:value.type,tier:value.tier};}
function requirements(value){const w=normalize(value);return {days:days[w.tier],xp:days[w.tier]*100,strength:strength[w.tier]};}
function unlocked(value,progress=window.GalaProgress?.read()||{activeDays:0,totalXp:0,strength:1}){const r=requirements(value);return progress.activeDays>=r.days&&progress.totalXp>=r.xp&&progress.strength>=r.strength;}
function name(value){const w=normalize(value);return tiers[w.tier]+' '+types.find(t=>t.id===w.type).name;}
function draw(ctx,value,{x=0,y=0,scale=1}={}){
 const w=normalize(value),i=types.findIndex(type=>type.id===w.type),t=w.tier;
 const ink='#111625',shell=t<8?'#59677e':t<16?'#889ab4':'#c4cae3',dark='#283147',edge='#dbe8ff';
 const energy=['#58e8ff','#76ffc8','#ba8cff','#ff879f','#ffd76c'][Math.min(4,Math.floor(t/5))],white='#f3ffff';
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
 const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const p=(points,c,line=ink)=>{ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x+.5,y+.5):ctx.moveTo(x+.5,y+.5));ctx.closePath();ctx.fillStyle=c;ctx.fill();if(line){ctx.strokeStyle=line;ctx.lineWidth=1;ctx.stroke();}};
 const panel=(x,y,w,h,c=shell)=>{r(x,y,w,h,ink);r(x+1,y+1,w-2,h-2,c);r(x+1,y+1,w-2,1,edge);};
 const core=(x,y,size=3)=>{r(x-size-1,y-size-1,size*2+3,size*2+3,ink);r(x-size,y-size,size*2+1,size*2+1,energy);r(x-size+1,y-size+1,Math.max(1,size-1),Math.max(1,size-1),white);};
 const vents=(x,y,count=3,vertical=false)=>{for(let k=0;k<count;k++)r(x+(vertical?0:k*3),y+(vertical?k*3:0),vertical?4:1,vertical?1:4,dark);};
 const grip=(x=17,y=48,h=14)=>{panel(x,y,7,h,dark);for(let k=3;k<h-2;k+=3)r(x+1,y+k,5,1,shell);r(x+2,y+h-3,3,1,energy);};
 const rail=(x=18,y=27,h=38)=>{panel(x,y,5,h,dark);r(x+2,y+2,1,h-5,energy);};
 const ring=(cx,cy,rx,ry,col=energy)=>{ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.strokeStyle=col;ctx.lineWidth=1;ctx.stroke();};
 // Detached field stabilizers and an orbital frame arrive at advanced tiers.
 if(t>=12){for(const side of [-1,1]){const xx=side<0?2:34;panel(xx,20,4,23,dark);r(xx+1,22,2,6,energy);r(xx+1,34,2,6,energy);}}
 if(t>=16){ring(20,33,18,27);r(1,31,3,5,white);r(36,31,3,5,white);}
 switch(i){
 case 0: // Plasma blade: an emitter and a contained beam, without a metal blade.
  grip();panel(13,42,15,8);core(20,45,2);p([[17,40],[17,14],[20,5],[23,14],[23,40]],energy);r(19,13,2,26,white);panel(15,35,3,7,dark);panel(23,35,3,7,dark);break;
 case 1: // Ion cleaver with split rails and a broad energy plane.
  grip(17,53,12);panel(11,46,19,8);panel(9,13,5,35);panel(26,13,5,35);p([[14,44],[14,14],[20,5],[26,14],[26,44]],energy);r(18,14,4,29,white);core(20,49,2);break;
 case 2: // A compact phase blade carried in a powered socket.
  grip(16,43,15);panel(12,38,17,7);p([[15,36],[15,27],[20,15],[25,27],[25,36]],energy);r(19,25,2,11,white);panel(12,31,4,8);panel(25,31,4,8);core(20,41,2);break;
 case 3: // Arc pistol, visibly horizontal and compact.
  p([[10,33],[22,35],[18,53],[10,53],[13,40]],dark);panel(5,24,29,13);panel(30,22,7,16,dark);r(32,25,3,10,energy);panel(9,20,7,4);core(20,30,3);vents(8,27,3,true);r(15,43,3,6,energy);break;
 case 4: // Pulse rifle, vertical storage pose, magazine and forward handguard.
  panel(17,8,6,16,dark);r(18,9,4,3,energy);panel(12,22,15,26);panel(8,27,4,15);vents(14,25,4,true);core(22,34,2);p([[14,47],[24,47],[28,63],[14,65]],shell);panel(24,41,9,13,dark);r(26,43,5,2,energy);break;
 case 5: // Rail cannon with open parallel acceleration rails.
  grip(16,52,12);panel(9,35,23,17);panel(7,7,6,34);panel(27,7,6,34);r(13,10,2,29,energy);r(25,10,2,29,energy);r(19,14,2,23,white);for(let yy=15;yy<34;yy+=7){r(13,yy,4,2,energy);r(23,yy,4,2,energy);}core(20,44,4);break;
 case 6: // Tesla emitter: coil stack surrounding a live conductor.
  grip(17,49,14);panel(11,37,19,12);rail(18,13,27);for(let yy=15;yy<36;yy+=6){panel(9,yy,23,3);r(10,yy+1,21,1,energy);}core(20,9,3);p([[19,17],[14,24],[20,23],[17,31],[24,22],[20,22]],white,null);break;
 case 7: // A tethered attack drone and its remote grip.
  grip(6,47,14);panel(4,40,12,8);core(10,43,2);for(let k=0;k<9;k++)r(11+k,38-k*2,2,2,energy);panel(20,13,13,13);core(26,19,3);panel(14,16,5,8);panel(34,16,5,8);r(21,28,3,4,energy);r(29,28,3,4,energy);break;
 case 8: // Particle lance, twin emitter prongs and a narrow beam.
  rail(18,29,38);panel(13,26,15,7);panel(11,16,5,13);panel(25,16,5,13);r(18,6,4,20,energy);r(19,4,2,22,white);core(20,30,2);break;
 case 9: // Three separately powered beam emitters.
  rail(18,34,31);panel(8,28,25,8);for(const xx of [8,18,28]){panel(xx,17,5,13);r(xx+1,7-(xx===18?4:0),3,10+(xx===18?4:0),energy);r(xx+2,8,1,16,white);}core(20,32,2);break;
 case 10: // Rocket pod: six launch cells with guidance lights.
  panel(7,15,27,31);for(let yy=20;yy<=34;yy+=14)for(let xx=12;xx<=26;xx+=7){panel(xx-2,yy-2,6,10,dark);r(xx,yy,2,4,energy);}panel(13,46,15,7);grip(17,52,11);r(4,23,2,15,energy);break;
 case 11: // Gravity reaper bends a field between three suspended pods.
  rail(26,27,37);panel(22,19,13,9);p([[5,12],[18,8],[31,15],[27,19],[17,14],[7,17]],shell);panel(2,20,6,11);r(3,22,4,7,energy);ring(17,27,12,15);core(17,27,4);r(13,26,9,2,white);r(16,23,2,8,white);break;
 case 12: // Photon bow: floating emitter limbs and a laser string.
  panel(18,29,8,12);p([[20,27],[25,17],[20,6],[14,7],[20,18],[15,27]],shell);p([[20,42],[25,52],[20,64],[14,63],[20,52],[15,42]],shell);r(13,9,1,53,energy);r(6,34,29,2,white);p([[34,31],[39,35],[34,39]],energy);core(21,34,2);break;
 case 13: // Gauss launcher uses sideways capacitors around an acceleration tube.
  grip(17,49,14);panel(15,16,11,33);panel(4,27,10,13);panel(27,27,10,13);r(5,29,8,2,energy);r(28,29,8,2,energy);panel(17,9,7,9,dark);r(19,10,3,6,white);for(let yy=21;yy<43;yy+=6)r(17,yy,7,2,energy);break;
 case 14: // Orbit disc, segmented casing with an open energy aperture.
  p([[13,15],[27,15],[35,23],[35,41],[27,49],[13,49],[5,41],[5,23]],shell);p([[15,22],[25,22],[28,27],[28,37],[24,42],[16,42],[12,37],[12,27]],ink);ring(20,32,10,12);for(const [xx,yy] of [[18,15],[31,30],[18,45],[5,30]])r(xx,yy,5,3,energy);core(20,32,2);break;
 case 15: // Powered gauntlets with knuckle emitters and battery cuffs.
  for(const xx of [4,23]){panel(xx,27,13,25);for(let k=0;k<3;k++){panel(xx+1+k*4,20,3,10);r(xx+2+k*4,21,1,6,energy);}panel(xx-1,48,15,7,dark);core(xx+6,37,3);r(xx+3,50,7,2,energy);}break;
 case 16: // Gravity rod containing a miniature black-hole chamber.
  rail(18,32,34);panel(11,27,19,7);panel(8,12,5,17);panel(28,12,5,17);ring(20,18,8,10);core(20,18,5);r(17,15,7,7,ink);r(18,14,5,1,white);r(14,19,12,1,energy);break;
 case 17: // Sonic disruptor with broad dish and expanding pulse rings.
  grip(12,45,16);panel(8,30,17,16);p([[23,32],[30,23],[33,24],[33,45],[30,46],[23,38]],shell);r(30,27,2,15,energy);core(15,36,3);for(let k=0;k<3;k++){r(35+k*2,25+k*3,1,19-k*6,energy);}panel(6,33,3,8,dark);break;
 case 18: // Nanite hive replaces the spellbook with a floating drone cluster.
  panel(10,27,21,23);panel(14,22,13,6);core(20,36,5);vents(14,44,4);for(const [xx,yy] of [[7,16],[28,10],[34,24],[5,42],[29,58]]){panel(xx-2,yy-2,5,5);r(xx,yy,1,1,energy);r(xx,yy+4,1,2,energy);}r(17,51,2,6,energy);r(23,51,2,6,energy);break;
 case 19: // Plasma cannon with a large chamber and bright muzzle aperture.
  grip(12,43,16);panel(5,23,29,22);panel(29,19,9,29,dark);r(31,22,5,23,energy);r(33,25,2,17,white);core(16,33,6);vents(6,26,4,true);panel(9,17,17,6);r(11,19,13,2,energy);break;
 }
 // Progressive hardware: charge indicators, cooling fins, extra emitters, then drones.
 if(t>0){const rows=1+((t-1)%5);for(let k=0;k<rows;k++){r(15,54-k*3,10,2,ink);r(16,54-k*3,1+Math.min(7,t),1,energy);}}
 if(t>=4){panel(7,46,5,10,dark);r(8,48,3,5,energy);r(11,45,5,1,energy);}
 if(t>=8){
  const row=types[i].id==='chakram'?19:12;
  p([[8,row],[3,row-7],[3,row+9],[8,row+12]],shell);p([[32,row],[37,row-7],[37,row+9],[32,row+12]],shell);
  r(4,row-3,2,9,energy);r(34,row-3,2,9,energy);
  // Extra family-specific modules amplify the defining shape.
  if([0,1,2,8,9].includes(i)){r(13,11,2,19,energy);r(26,11,2,19,energy);}
  else if([3,4,5,10,13,19].includes(i)){panel(3,51,8,6);panel(29,51,8,6);r(4,53,6,2,energy);r(30,53,6,2,energy);}
  else if([6,11,14,16,17].includes(i)){ring(20,29,14,19,energy);}
  else {for(const xx of [7,32]){core(xx,57,2);r(xx,61,1,4,energy);}}
 }
 if(t>=13){for(let k=0;k<t-11;k++){const angle=k*Math.PI*2/(t-11);const xx=20+Math.cos(angle)*17,yy=33+Math.sin(angle)*28;r(xx-1,yy-1,3,3,energy);r(xx,yy,1,1,white);}}
 if(t===20){
  // The final impossible machine opens a contained portal above the weapon.
  ring(20,7,10,5,white);ring(20,7,7,3,energy);r(17,6,7,2,ink);
  for(const xx of [6,33]){panel(xx-2,61,5,5);r(xx,67,1,3,energy);}r(18,64,5,2,white);r(20,66,1,5,energy);
 }
 ctx.restore();
}

window.GalaWeapons={types,tiers,normalize,requirements,unlocked,name,draw};
})();
