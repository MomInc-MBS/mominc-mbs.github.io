/* The resistance's ammo foundry, inside MOM's specimen-control terminal. */
(()=>{'use strict';
 function dress(scene,T){
  const steel=new T.MeshStandardMaterial({color:0x526568,metalness:.6,roughness:.5}),dark=new T.MeshStandardMaterial({color:0x11272b,metalness:.35,roughness:.6}),edge=new T.MeshStandardMaterial({color:0x9eb2ab,metalness:.65,roughness:.3}),glow=new T.MeshBasicMaterial({color:0x92ffce});
  const add=(geo,material,x,y,z)=>{const object=new T.Mesh(geo,material);object.position.set(x,y,z);object.receiveShadow=true;object.castShadow=true;scene.add(object);return object;};
  add(new T.BoxGeometry(8.5,.4,6.5),steel,0,-.53,0);add(new T.BoxGeometry(8.65,.08,6.6),edge,0,-.29,0);add(new T.BoxGeometry(8.45,.06,6.4),dark,0,-.24,0);
  for(const x of [-3.2,3.2])for(const z of [-2.2,2.2])add(new T.BoxGeometry(.5,2,.5),steel,x,-1.5,z);
  add(new T.BoxGeometry(32,.15,30),dark,0,-2.5,-4);add(new T.BoxGeometry(25,9,.2),steel,0,1.8,-6);
  for(let x=-12;x<=12;x+=2){add(new T.BoxGeometry(.02,.01,24),edge,x,-2.41,-3);add(new T.BoxGeometry(28,.01,.02),edge,0,-2.41,x-4);}
  for(const x of [-5.5,5.5]){add(new T.BoxGeometry(1.1,7,1),dark,x,.9,-5.6);for(let i=0;i<9;i++)add(new T.BoxGeometry(.75,.035,.03),glow,x,-1.5+i*.6,-5.05);}
  function screen(label,x,z){const c=document.createElement('canvas');c.width=192;c.height=112;const g=c.getContext('2d');g.fillStyle='#061c25';g.fillRect(0,0,192,112);g.fillStyle='#c0c0c0';g.fillRect(0,0,192,15);g.fillStyle='#172744';g.font='bold 10px monospace';g.fillText(label,7,11);g.fillStyle='#91ffd0';g.font='11px monospace';g.fillText('MOM_OS / 95',8,38);g.fillText('CONTAINMENT: LOST',8,56);g.fillText('PRISONER: ACTIVE',8,74);for(let i=0;i<8;i++)g.fillRect(8+i*20,88,11,4+(i*7)%13);const tex=new T.CanvasTexture(c);tex.magFilter=tex.minFilter=T.NearestFilter;tex.colorSpace=T.SRGBColorSpace;add(new T.BoxGeometry(1.6,1.1,.24),edge,x,.45,z);const face=add(new T.PlaneGeometry(1.4,.9),new T.MeshBasicMaterial({map:tex}),x,.45,z+.14);face.name='gala-war-terminal';add(new T.BoxGeometry(.3,.5,.3),steel,x,-.2,z);}
  screen('ESCAPEE REGISTRY',-3.35,-1.3);screen('MYR5 SPECIMEN',3.35,-1.3);
  const ring=add(new T.CylinderGeometry(.75,.9,.18,40),edge,0,-.1,-2.65);ring.name='myr5-projector';add(new T.CylinderGeometry(.64,.64,.025,40),glow,0,.005,-2.65);
  // Chunky alien fragments, slime and bone pixels surround the table.
  for(let i=0;i<28;i++){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),colours=['#902d61','#6b3780','#429a82','#763443'];g.fillStyle=colours[i%4];for(let n=0;n<25;n++){const x=8+(n*17+i*9)%46,y=9+(n*13+i*7)%43;g.fillRect(x,y,4+(n%3)*3,3+(n%4)*2);}g.fillStyle='#dbd4b1';for(let n=0;n<4;n++){g.fillRect(14+n*8,22+n*4,13,3);g.fillRect(13+n*8,21+n*4,3,5);}g.fillRect(26,17,11,10);g.fillStyle='#183340';g.fillRect(28,20,3,3);g.fillRect(33,20,3,3);const tex=new T.CanvasTexture(c);tex.minFilter=tex.magFilter=T.NearestFilter;const mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),decal=add(new T.PlaneGeometry(1.05,1.05),mat,(i%2?1:-1)*(4.5+(i%4)*.5),-2.39,-4.7+Math.floor(i/2)*.57);decal.rotation.x=-Math.PI/2;decal.rotation.z=i*.73;decal.name='gala-pixel-carnage';}
 }
 function mount(board){
  const hud=document.createElement('aside');hud.className='gala-war-hud';hud.innerHTML='<div class="gala-war-title">RESISTANCE <span>AMMO FOUNDRY</span></div><p>Merge matching ammo. Double its firepower.</p><strong data-war-tier>Pellet · +1</strong><p data-war-next>Next: Cartridge · +2</p><p data-war-gain role="status" aria-live="polite">Small beginnings. Impossible firepower.</p><small data-war-name>Anonymous guest</small><nav><a href="/tv/?ch=goon" target="_top">Goon page ↗</a><a href="/gala/terminal/" target="_top">Rankings ↗</a></nav>';document.body.append(hud);
  const host=document.createElement('div');host.className='gala-table-hologram';host.setAttribute('aria-label','Floating MYR5 specimen hologram');document.body.append(host);let hologram=null,disposed=false;
  import('/gala/hologram.mjs').then(m=>m.mountHologram(host)).then(value=>{if(disposed)value?.dispose();else hologram=value;}).catch(()=>{host.textContent='MYR5 / SIGNAL LOST';});
  function identity(){hud.querySelector('[data-war-name]').textContent=window.MBS_DJ?.display()||'Anonymous guest';}identity();window.addEventListener('storage',identity);window.addEventListener('mbs:dj-identity',identity);
  const player=document.querySelector('.gala-player');
  // Anchor above the actual portrait, including its equipped weapon and ability button.
  function placeHologram(){const height=player&&!player.hidden?player.getBoundingClientRect().height:0;host.style.bottom=(height+18)+'px';}
  const resize=new ResizeObserver(placeHologram);if(player)resize.observe(player);resize.observe(document.body);placeHologram();
  function sync(cells,merged){
   const ammo=window.GalaAmmo,best=Math.max(1,...cells.flat()),info=ammo.tierInfo(best),next=ammo.tierInfo(best+1);
   hud.querySelector('[data-war-tier]').textContent=info.name+' · +'+info.power.toLocaleString();
   hud.querySelector('[data-war-next]').textContent='Next: '+next.name+' · +'+next.power.toLocaleString();
   if(merged.length){const gain=merged.reduce((sum,[row,col])=>sum+ammo.power(cells[row][col]),0);hud.querySelector('[data-war-gain]').textContent='+'+gain.toLocaleString()+' FIREPOWER FOR THE RESISTANCE';}
  }
  return {sync,dispose(){disposed=true;resize.disconnect();hologram?.dispose();hud.remove();host.remove();window.removeEventListener('storage',identity);window.removeEventListener('mbs:dj-identity',identity);}};
 }
 window.GalaWarRoom={dress,mount};
})();
