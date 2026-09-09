/* Cosmetic scenes for the player's saved Gala character. */
(()=>{
 'use strict';
 const A=window.GalaAvatar,W=window.GalaWeapons,TAU=Math.PI*2;
 const ease=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
 function playlist(look){
  const scenes=[{name:'idle',duration:6000}];
  if(look.weapon&&W?.unlocked(look.weapon))scenes.push({name:'weapon',duration:4500},{name:'idle',duration:2500});
  if(look.parts.pet)scenes.push({name:'pet',duration:5500},{name:'idle',duration:2500});
  scenes.push({name:'face',duration:5500},{name:'idle',duration:2500},{name:'walk',duration:8000});return scenes;
 }
 function moment(scenes,time){
  let remaining=Math.max(0,time)%scenes.reduce((sum,scene)=>sum+scene.duration,0);
  for(const scene of scenes){if(remaining<scene.duration)return {...scene,time:remaining,progress:remaining/scene.duration};remaining-=scene.duration;}
 }
 function create(look){
  const body=document.createElement('canvas'),pet=document.createElement('canvas'),weapon=document.createElement('canvas');
  const scenes=playlist(look),hasWeapon=scenes.some(scene=>scene.name==='weapon');
  weapon.width=40;weapon.height=72;if(hasWeapon)W.draw(weapon.getContext('2d'),look.weapon);
  A.draw(pet,look,{base:false,weapon:false,petOnly:true});let lastPose='';
  function paint(canvas,time=0,still=false){
   if(canvas.width!==160||canvas.height!==168){canvas.width=160;canvas.height=168;}
   const ctx=canvas.getContext('2d'),scene=still?{name:'idle',time:0,progress:0,duration:6000}:moment(scenes,time);
   ctx.clearRect(0,0,160,168);ctx.imageSmoothingEnabled=false;canvas.dataset.scene=scene.name;
   const seconds=scene.time/1000,wave=Math.sin(seconds*TAU*1.15),blink=!still&&(scene.name==='face'?(seconds>1.5&&seconds<1.68)||(seconds>3.2&&seconds<3.37):(time%4900>4570&&time%4900<4710));
   const pose={};if(scene.name==='walk')pose.walk=wave;if(scene.name==='pet')pose.petting=wave;if(scene.name==='weapon')pose.weapon=true;
   const poseKey=JSON.stringify([blink,scene.name,scene.name==='walk'||scene.name==='pet'?Math.round(wave*10):0]);
   if(poseKey!==lastPose){A.draw(body,look,{base:false,weapon:false,companion:false,prop:scene.name!=='weapon',blink,pose});lastPose=poseKey;}
   let offset=0,flip=false,zoom=0;
   if(scene.name==='walk'){
    if(seconds<2.6)offset=-170*ease(seconds/2.6);
    else if(seconds<3.5)offset=-170;
    else if(seconds<6.5){offset=-170*(1-ease((seconds-3.5)/3));flip=true;}
   }
   if(scene.name==='face')zoom=ease(Math.min(seconds/.9,(5.5-seconds)/.9));
   const bob=still?0:Math.sin(time/850)*.8;
   if(zoom<1){ctx.globalAlpha=(1-zoom)*.5;ctx.fillStyle='#b69adb';ctx.beginPath();ctx.ellipse(80+offset,153,35,3,0,0,TAU);ctx.fill();ctx.globalAlpha=1;}
   ctx.save();ctx.translate(offset,0);if(flip){ctx.translate(160,0);ctx.scale(-1,1);}
   if(scene.name==='walk'){
    ctx.drawImage(body,0,0,64,70,32,13+bob,96,105);
    ctx.drawImage(body,0,70,32,26,32,118+wave*2,48,39);
    ctx.drawImage(body,32,70,32,26,80,118-wave*2,48,39);
   }else ctx.drawImage(body,17*zoom,10*zoom,64-34*zoom,96-66*zoom,32-24*zoom,13-3*zoom+bob,96+48*zoom,144);
   if(look.parts.pet&&zoom<1){
    ctx.globalAlpha=1-zoom;const affection=scene.name==='pet'?Math.max(0,wave)*1.3:0;ctx.drawImage(pet,32,13-affection,96,144);ctx.globalAlpha=1;
    if(scene.name==='pet'){const rise=(seconds%1.25)/1.25,hx=45,hy=113-rise*18;ctx.globalAlpha=Math.sin(rise*Math.PI)*.85;ctx.fillStyle='#ff97c2';ctx.fillRect(hx-3,hy-2,3,3);ctx.fillRect(hx+1,hy-2,3,3);ctx.fillRect(hx-2,hy+1,5,2);ctx.fillRect(hx,hy+3,1,1);ctx.globalAlpha=1;}
   }
   if(hasWeapon&&zoom<1){
    ctx.globalAlpha=1-zoom;ctx.save();
    if(scene.name==='weapon'){
     const melee=['rapier','greatsword','dagger','spear','trident','scythe'].includes(look.weapon.type),beat=(seconds%1.35)/1.35;
     ctx.translate(128,79);ctx.rotate(Math.sin(beat*TAU)*(melee ? .8 : .09));ctx.drawImage(weapon,-19,-36,38,68);ctx.restore();
     ctx.strokeStyle='#87efff';ctx.lineWidth=2;ctx.globalAlpha=(1-zoom)*Math.sin(beat*Math.PI);
     if(melee){ctx.beginPath();ctx.arc(117,77,30,-1.6,-.15);ctx.stroke();}
     else{ctx.beginPath();ctx.ellipse(129,67,8+beat*16,6+beat*13,0,0,TAU);ctx.stroke();ctx.fillStyle='#d8ffff';ctx.fillRect(135+beat*24,62-beat*24,5,2);}
    }else{ctx.translate(128,78+bob*2);ctx.rotate(-.1);ctx.drawImage(weapon,-16,-31,32,58);ctx.restore();}
    ctx.globalAlpha=1;
   }
   ctx.restore();return scene;
  }
  return {paint,scenes};
 }
 window.GalaPerformance={playlist,moment,create};
})();
