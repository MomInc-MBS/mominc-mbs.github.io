/* Original modular pixel weapons. Tier zero plus twenty upgrades per family. */
(()=>{'use strict';
const types=[['rapier','Rapier'],['greatsword','Greatsword'],['dagger','Dagger'],['sabre','Sabre'],['axe','Battle axe'],['hammer','War hammer'],['mace','Mace'],['flail','Flail'],['spear','Spear'],['trident','Trident'],['halberd','Halberd'],['scythe','Scythe'],['bow','Longbow'],['crossbow','Crossbow'],['chakram','Chakram'],['gauntlets','Gauntlets'],['staff','Staff'],['wand','Wand'],['tome','Spellbook'],['cannon','Hand cannon']].map(([id,name])=>({id,name}));
const tiers=['Plain','Polished','Etched','Brassbound','Silver','Gilded','Gemset','Royal','Prismatic','Ember','Frost','Storm','Runic','Astral','Eclipse','Gravitic','Celestial','Riftborn','Nebula','Worldbreaker','MOM’s Impossible'];
const days=[1,2,3,5,7,10,14,21,30,45,60,75,90,120,150,180,210,240,270,300,365];
const strength=[1,2,3,4,5,6,8,10,12,15,18,20,23,27,31,35,40,45,50,60,75];
function normalize(value){if(!value||!types.some(t=>t.id===value.type)||!Number.isInteger(value.tier)||value.tier<0||value.tier>20)throw Error('This look has an unknown weapon.');return {type:value.type,tier:value.tier};}
function requirements(value){const w=normalize(value);return {days:days[w.tier],xp:days[w.tier]*100,strength:strength[w.tier]};}
function unlocked(value,progress=window.GalaProgress?.read()||{activeDays:0,totalXp:0,strength:1}){const r=requirements(value);return progress.activeDays>=r.days&&progress.totalXp>=r.xp&&progress.strength>=r.strength;}
function name(value){const w=normalize(value);return tiers[w.tier]+' '+types.find(t=>t.id===w.type).name;}
function draw(ctx,value,{x=0,y=0,scale=1}={}){
 const w=normalize(value),i=types.findIndex(t=>t.id===w.type),t=w.tier,band=Math.floor(t/4),ink='#1c1025',steel=['#a1a6b0','#d9c2a1','#a3d8dd','#b6c8ff','#e0adeb','#f5da9c'][band],edge=['#e5e4d9','#fff0bf','#d8ffff','#e9f5ff','#ffe7ff','#ffffff'][band],accent=['#756557','#c99c45','#54bec8','#8778ed','#dd6aca','#8ce7df'][band],dark=['#51546a','#6f503f','#2f6d83','#414b91','#813b83','#805293'][band];
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
 const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const p=(points,c,line=ink)=>{ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x+.5,y+.5):ctx.moveTo(x+.5,y+.5));ctx.closePath();ctx.fillStyle=c;ctx.fill();if(line){ctx.strokeStyle=line;ctx.lineWidth=1;ctx.stroke();}};
 const gem=(x,y,size=2,c=accent)=>{p([[x,y-size],[x+size,y],[x,y+size],[x-size,y]],c);r(x,y-size+1,1,1,edge);};
 const shaft=(x=18,y=25,h=34)=>{r(x-1,y,5,h,ink);r(x,y,3,h,accent);r(x,y,1,h,edge);};
 const grip=(x=17,y=47,h=13)=>{r(x-1,y,7,h,ink);r(x,y,5,h,dark);for(let k=1;k<h;k+=3)r(x,y+k,5,1,accent);gem(x+2,y+h+2,2,steel);};
 // High tiers gain floating frames behind the original silhouette.
 if(t>=13){for(const side of [-1,1]){const xx=20+side*(13+(t%3));p([[xx,17],[xx+side*2,34],[xx,51],[xx-side*2,34]],dark);for(let k=0;k<1+Math.floor((t-13)/2);k++)gem(xx,21+k*8,1+(t>=17?1:0));}}
 if(t>=17){for(let k=0;k<t-15;k++){const a=k*Math.PI*2/(t-15)+.3;gem(20+Math.cos(a)*16,33+Math.sin(a)*25,2,k%2?accent:steel);}}
 switch(i){
 case 0:grip();p([[19,46],[17,13-t%4],[20,4],[22,14],[21,46]],steel);r(19,12,1,32,edge);p([[10,43],[18,46],[29,41],[27,49],[15,49]],accent);break;
 case 1:grip(17,53,11);p([[15-t%3,49],[14-t%3,13],[20,3],[26+t%3,13],[25+t%3,49]],steel);r(19,12,2,35,edge);r(10,49,21,4,accent);break;
 case 2:grip(17,43,13);p([[16,40],[15,26],[21,15-t%3],[25,31],[22,40]],steel);r(18,28,2,11,edge);r(12,40,17,3,accent);break;
 case 3:grip(16,50,12);p([[17,49],[24,40],[28,25],[27,10],[33,5],[34,26],[28,43],[22,51]],steel);p([[12,48],[13,59],[24,60],[25,50],[21,53],[17,52]],accent);break;
 case 4:shaft(18,12,52);p([[18,15],[8,11],[4,18],[4,33],[13,38],[18,30]],steel);if(t>2)p([[22,15],[30,12],[35,19],[34,32],[26,36],[22,29]],steel);r(18,12,2,25,edge);break;
 case 5:shaft(18,24,39);r(5,14,30,17,ink);r(6,15,28,15,steel);r(7,16,26,3,edge);r(15,15,10,15,accent);if(t>7){p([[4,17],[1,22],[4,29]],accent);p([[35,17],[39,22],[35,29]],accent);}break;
 case 6:shaft(18,30,31);p([[12,12],[27,12],[31,25],[25,36],[14,36],[9,24]],steel);for(const [x,y] of [[10,15],[29,15],[9,27],[31,27],[20,8]])p([[x-2,y+2],[x,y-4],[x+3,y+3]],accent);r(18,14,3,19,edge);break;
 case 7:grip(11,47,17);for(let n=0;n<7;n++){r(13+n*2,45-n*4,4,3,steel);r(14+n*2,46-n*4,1,1,ink);}p([[22,10],[31,9],[36,17],[32,25],[22,25],[18,18]],steel);for(const [x,y] of [[21,10],[33,10],[19,22],[35,22]])gem(x,y,3);break;
 case 8:shaft(18,25,42);p([[20,3],[12,24],[20,31],[28,24]],steel);r(19,10,2,18,edge);break;
 case 9:shaft(18,27,39);p([[6,10],[7,28],[14,34],[26,34],[33,28],[34,10],[29,16],[28,27],[22,28],[22,9],[20,3],[17,10],[17,28],[11,27],[11,16]],steel);break;
 case 10:shaft(18,10,57);p([[20,3],[15,13],[24,13]],steel);p([[16,16],[8,13],[4,23],[7,34],[16,31]],steel);p([[22,20],[34,24],[23,30]],accent);break;
 case 11:shaft(27,12,52);p([[30,12],[17,7],[7,12],[1,29],[9,20],[18,17],[29,19]],steel);r(26,13,2,14,edge);break;
 case 12:p([[14,7],[28,18],[33,34],[27,51],[13,64],[18,51],[24,35],[20,20]],accent);r(13,8,1,54,edge);shaft(12,31,9);p([[6,35],[33,33],[33,36]],steel);p([[33,31],[39,34],[33,38]],edge);break;
 case 13:grip(17,42,18);p([[6,24],[3,38],[19,30],[35,38],[33,24],[20,19]],accent);r(5,35,30,1,edge);r(18,14,4,33,steel);p([[15,15],[20,7],[25,15]],edge);break;
 case 14:p([[20,10],[33,17],[37,31],[31,46],[19,53],[6,44],[3,30],[8,17]],steel);p([[20,19],[27,23],[28,32],[24,41],[16,42],[11,34],[12,25]],ink);for(let k=0;k<4;k++)gem(20+Math.cos(k*Math.PI/2)*14,31+Math.sin(k*Math.PI/2)*18,2);break;
 case 15:for(const x of [5,23]){r(x,25,12,26,ink);r(x+1,26,10,24,steel);for(let k=0;k<3;k++)r(x+1+k*3,21-k%2*3,3,16,accent);r(x,44,12,7,dark);gem(x+6,37,3);}break;
 case 16:shaft(18,27,39);p([[20,5],[30,15],[27,28],[13,28],[10,15]],accent);gem(20,18,7,steel);r(19,10,1,10,edge);break;
 case 17:p([[10,62],[14,64],[28,25],[24,23]],accent);p([[26,10],[29,20],[38,20],[31,26],[34,36],[26,30],[18,35],[21,25],[14,20],[23,19]],steel);gem(26,24,3);break;
 case 18:p([[4,20],[17,16],[20,19],[24,16],[36,21],[36,51],[23,47],[20,50],[16,47],[4,52]],accent);p([[7,22],[17,20],[19,23],[19,44],[15,42],[7,46]],edge);p([[22,23],[25,20],[33,23],[33,46],[25,42],[22,44]],steel);for(let k=0;k<4;k++){r(9,26+k*4,7,1,dark);r(25,26+k*4,6,1,dark);}gem(20,11,3);break;
 case 19:p([[8,36],[13,32],[21,43],[17,59],[9,57],[13,46]],dark);p([[7,22],[33,16],[36,31],[11,40]],steel);r(30,18,5,14,ink);r(31,19,3,11,accent);p([[8,24],[11,35],[16,34],[13,22]],accent);r(18,35,7,5,accent);break;
 }
 // Each upgrade adds a visible tier-specific pattern and fittings, not just a tint.
 if(t){for(let k=0;k<1+(t%4);k++)gem(17+(k%2)*6,34+k*4,1+(t>=8?1:0),k%2?steel:accent);}
 if(t>=4){if([0,1,2,3,8,9,10,11,16,17].includes(i))p([[14,44],[8-(t%3),38],[13,49],[20,51],[27,47],[32+(t%2),39],[25,43]],accent);gem(20,46,2,edge);}
 if(t>=8){const reach=2+Math.floor(t/4);
  switch(i){
  case 0:for(let yy=18;yy<42;yy+=6){p([[14,yy],[25,yy+3],[14,yy+6]],accent);r(19,yy,1,6,edge);}break;
  case 1:p([[12,15],[8,24],[11,40],[16,44],[16,18]],accent);p([[25,15],[32,24],[29,40],[23,44],[23,18]],steel);break;
  case 2:for(const side of [-1,1])p([[20,42],[20+side*(9+reach),20],[20+side*9,39]],steel);break;
  case 3:p([[13,40],[19,27],[20,12],[16,5],[12,25],[7,40],[16,47]],accent);break;
  case 4:for(const side of [-1,1])p([[20+side*4,16],[20+side*17,7],[20+side*15,17],[20+side*18,34],[20+side*8,38]],accent);break;
  case 5:r(3,7,10,13,accent);r(27,7,10,13,accent);r(5,8,7,3,edge);r(28,8,7,3,edge);if(t>=16)r(12,9,16,5,steel);break;
  case 6:for(let k=0;k<7;k++){const a=k*Math.PI*2/7;p([[20+Math.cos(a)*8,24+Math.sin(a)*10],[20+Math.cos(a)*(12+reach),24+Math.sin(a)*(14+reach)],[20+Math.cos(a+.45)*8,24+Math.sin(a+.45)*10]],accent);}break;
  case 7:for(let yy=25;yy<49;yy+=5)r(8,yy,3,3,steel);gem(9,19,5,accent);if(t>=16){for(let yy=30;yy<50;yy+=5)r(28,yy,3,3,steel);gem(30,26,5,steel);}break;
  case 8:p([[14,29],[9,15],[14,5],[17,22]],accent);p([[26,29],[31,15],[26,5],[23,22]],steel);break;
  case 9:p([[9,29],[3,7],[7,1],[13,22]],accent);p([[30,29],[37,7],[33,1],[27,22]],accent);break;
  case 10:p([[24,35],[36,37],[31,47],[33,37],[24,42]],accent);p([[10,13],[6,3],[15,10]],edge);break;
  case 11:p([[29,20],[15,22],[6,34],[3,48],[12,35],[27,28]],accent);break;
  case 12:p([[11,7],[4,23],[7,35],[3,49],[11,63],[8,47],[12,35],[8,23]],steel);r(7,20,1,30,edge);break;
  case 13:p([[2,26],[9,17],[20,23],[30,17],[38,26],[30,23],[20,30],[9,23]],steel);r(11,13,3,23,accent);r(27,13,3,23,accent);break;
  case 14:for(let k=0;k<6;k++){const a=k*Math.PI/3;p([[20+Math.cos(a)*14,32+Math.sin(a)*19],[20+Math.cos(a+.2)*19,32+Math.sin(a+.2)*25],[20+Math.cos(a+.4)*14,32+Math.sin(a+.4)*19]],accent);}break;
  case 15:for(const xx of [6,11,25,30])p([[xx,28],[xx+1,9-reach],[xx+4,26]],steel);r(5,50,13,5,accent);r(23,50,13,5,accent);break;
  case 16:gem(20,18,10,accent);gem(20,18,6,edge);for(const xx of [6,34])gem(xx,15,3,steel);break;
  case 17:gem(10,13,3,accent);gem(33,44,4,steel);for(let k=0;k<6;k++)r(5+k*3,7+k*2,1,1,edge);break;
  case 18:p([[7,23],[0,14],[2,42],[8,49]],edge);p([[33,23],[40,14],[38,42],[32,49]],steel);r(8,13,24,1,accent);for(let k=0;k<3;k++)gem(13+k*7,8,2);break;
  case 19:p([[13,16],[32,9],[34,17],[15,24]],accent);p([[16,38],[34,32],[36,40],[19,47]],accent);r(32,10,3,8,ink);r(34,33,3,8,ink);break;
  }
 }
 if(t>=12){gem(20,5,2+(t%3),edge);r(18,58,5,1,accent);r(20,60,1,5,edge);}
 if(t===20){p([[7,8],[5,1],[14,5],[20,0],[26,5],[35,1],[33,8]],accent);for(const xx of [10,20,30])gem(xx,8,2,edge);}
 ctx.restore();
}
window.GalaWeapons={types,tiers,normalize,requirements,unlocked,name,draw};
})();
