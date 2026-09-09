/* Party guests share the wardrobe renderer and live inside the palace scene. */
(()=>{
 'use strict';
 const KEY='mominc-avatar-v1';
 function readPlayer(){
  try{const raw=localStorage.getItem(KEY)||sessionStorage.getItem(KEY);if(raw)return GalaAvatar.normalize(JSON.parse(raw));}catch{}
  return GalaAvatar.normalize(GalaAvatar.defaultLook);
 }
 function wardrobe(player,random=Math.random){
  const decks=new Map();
  function pick(key,values){
   let deck=decks.get(key);
   if(!deck?.length){deck=values.slice();for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}decks.set(key,deck);}
   return deck.pop();
  }
  return ()=>({schema:'mominc-avatar',version:1,name:'Gala party guest',
   dye:pick('dye',GalaAvatar.dyes.map((_,i)=>i).filter(i=>i!==player.dye)),
   parts:Object.fromEntries(GalaAvatar.sections.map(section=>{
    const choices=section.choices.filter(id=>id!==player.parts[section.id]&&(section.id!=='body'||id%10!==player.parts.body%10));
    return [section.id,pick(section.id,choices)];
   }))});
 }
 // The back promenade clears the round table and runs behind the palace columns.
 function promenade(progress,lane=0){
  const x=-8.5+17*progress,turn=Math.max(0,(Math.abs(x)-4.8)/3.7);
  return {x,z:-4.9+5.8*turn*turn*(3-2*turn)+lane*.16};
 }
 function mount(board,T){
  if(!window.GalaAvatar)return null;
  const root=new T.Group();root.name='gala-party-guests';board.scene.add(root);
  const geometry=new T.PlaneGeometry(1,1),guests=[];
  const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let nextLook=wardrobe(readPlayer()),elapsed=0,disposed=false;
  function dress(guest){
   guest.look=nextLook();
   GalaAvatar.draw(guest.canvas,guest.look,{base:false,weapon:false});
   guest.texture.needsUpdate=true;
  }
  for(let i=0;i<9;i++){
   const canvas=document.createElement('canvas'),texture=new T.CanvasTexture(canvas);
   texture.minFilter=texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=T.SRGBColorSpace;
   const material=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.04,depthWrite:false,depthTest:true,toneMapped:false});
   const mesh=new T.Mesh(geometry,material);mesh.name='gala-party-guest';root.add(mesh);
   const height=2.8+(i%3)*.14;
   mesh.scale.set(height*2/3,height,1);
   const guest={mesh,canvas,texture,material,height,phase:(i+.45)/9,direction:i%3===0?-1:1,duration:46+(i%4)*5,lane:i%2,look:null};
   dress(guest);guests.push(guest);
  }
  function update(delta=0){
   if(disposed||document.hidden)return;
   const moving=!motion?.matches,dt=moving?Math.min(.1,Math.max(0,delta)):0;
   elapsed+=dt;
   const compact=innerWidth<640||innerWidth/innerHeight<.85;
   for(let i=0;i<guests.length;i++){
    const guest=guests[i];guest.mesh.visible=!compact||i%3!==2;
    if(!guest.mesh.visible)continue;
    guest.phase+=dt/guest.duration;
    if(guest.phase>=1){guest.phase%=1;dress(guest);}
    const progress=guest.direction===1?guest.phase:1-guest.phase;
    const position=promenade(progress,guest.lane),height=guest.height+(compact?.65:0);
    const bob=moving?Math.sin(elapsed*1.6+i*1.9)*.025:0;
    guest.mesh.scale.set(height*2/3,height,1);
    guest.mesh.position.set(position.x,-2.35+height/2+bob,position.z);
    guest.mesh.rotation.y=Math.atan2(board.camera.position.x-position.x,board.camera.position.z-position.z);
    guest.material.opacity=Math.min(1,guest.phase/.065,(1-guest.phase)/.065)*.92;
   }
  }
  function refresh(){nextLook=wardrobe(readPlayer());guests.forEach(dress);update();}
  function storage(event){if(event.key===KEY||event.key===null)refresh();}
  window.addEventListener('storage',storage);
  window.addEventListener('mominc-avatar-change',refresh);
  motion?.addEventListener?.('change',updateStill);
  function updateStill(){update();}
  update();
  return {update,dispose(){
   if(disposed)return;disposed=true;
   window.removeEventListener('storage',storage);
   window.removeEventListener('mominc-avatar-change',refresh);
   motion?.removeEventListener?.('change',updateStill);
   root.removeFromParent();geometry.dispose();
   guests.forEach(guest=>{guest.texture.dispose();guest.material.dispose();});
  }};
 }
 window.GalaCrowd={wardrobe,promenade,mount};
})();
