import * as THREE from '/tv/assets/armie-intro/vendor/three.module.js';
import {GLTFLoader} from '/tv/assets/armie-intro/vendor/GLTFLoader.js';

// The War Room supplies the scene and projector, so the specimen uses the board's
// camera and renderer instead of floating in a separate screen overlay.
export async function mountSceneHologram(projector,{Material=THREE.MeshBasicMaterial,onStatus=()=>{}}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),rig=new THREE.Group();rig.name='myr5-specimen';projector.add(rig);
 const parts=[],resources=new Set();let disposed=false,frame=0,last=0,t=0;
 onStatus('MYR5 / CONNECTING SPECIMEN');
 try{
  const {scene:model}=await new GLTFLoader().loadAsync('/tv/assets/armie-intro/myr5/models/myr5.glb');
  const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);
  // Reserve room for a complete turn and the specimen's separating parts. The
  // projector stays clear of the board while fitting below the old gauge's top.
  const spread=extent*.3,scale=Math.min(2.35/(size.y+spread),1.25/(Math.hypot(size.x,size.z)+spread));
  model.position.sub(center);rig.scale.setScalar(scale);rig.position.y=.12+(size.y+spread)*scale/2;rig.add(model);rig.updateMatrixWorld(true);
  model.traverse(node=>{
   if(!node.isMesh)return;resources.add(node.geometry);
   const prior=Array.isArray(node.material)?node.material:[node.material];prior.forEach(material=>{material.map?.dispose();material.dispose();});
   const material=new Material({color:0x8affec,wireframe:true,transparent:true,opacity:.48,depthWrite:false});node.material=material;resources.add(material);
   // Displacement is in the mesh parent's coordinates, independent of the
   // projector's new world position and of any transforms inside the GLTF.
   const position=new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());rig.worldToLocal(position);
   const direction=position.length()>.001?position.normalize():new THREE.Vector3(0,1,0);
   const start=rig.localToWorld(new THREE.Vector3()),end=rig.localToWorld(direction.multiplyScalar(extent*.15));
   node.parent.worldToLocal(start);node.parent.worldToLocal(end);
   parts.push({node,home:node.position.clone(),out:end.sub(start)});
  });
 }catch(error){rig.removeFromParent();for(const resource of resources)resource.dispose();throw error;}
 function draw(now){
  frame=0;if(disposed||document.hidden)return;
  if(!last||now-last>=70){if(last)t+=Math.min(.1,(now-last)/1000);last=now;
   const split=reduced.matches?.2:(1-Math.cos(t*.55))*.5;
   for(const part of parts)part.node.position.copy(part.home).addScaledVector(part.out,split);
   rig.rotation.y=reduced.matches?.25:t*.14;
  }
  if(!reduced.matches)frame=requestAnimationFrame(draw);
 }
 function schedule(){if(frame)cancelAnimationFrame(frame);last=0;if(!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);schedule();onStatus('MYR5 / LIVE SPECIMEN');
 return {dispose(){disposed=true;if(frame)cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',schedule);reduced.removeEventListener('change',schedule);rig.removeFromParent();for(const resource of resources)resource.dispose();}};
}

export async function mountHologram(host){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setClearColor(0,0);host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.01,100),rig=new THREE.Group();scene.add(rig);camera.position.set(0,.1,6);camera.lookAt(0,0,0);let disposed=false,frame=0,last=0,t=0,force=null;
 const status=document.createElement('span');status.className='hologram-status';status.textContent='CONNECTING SPECIMEN…';host.append(status);
 let model,parts=[],resources=[];
 try{const loaded=await new GLTFLoader().loadAsync('/tv/assets/armie-intro/myr5/models/myr5.glb');model=loaded.scene;if(disposed)return;
  const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);model.position.sub(center);rig.scale.setScalar(2.45/extent);rig.add(model);
  model.traverse(node=>{if(!node.isMesh)return;resources.push(node.geometry);const prior=Array.isArray(node.material)?node.material:[node.material];prior.forEach(m=>{m.map?.dispose();m.dispose();});const material=new THREE.MeshBasicMaterial({color:0x8affec,wireframe:true,transparent:true,opacity:.32,depthWrite:false});node.material=material;resources.push(material);const pos=new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());const direction=pos.length()>.001?pos.normalize():new THREE.Vector3(0,1,0);parts.push({node,home:node.position.clone(),out:direction.multiplyScalar(extent*.15)});});status.textContent='MYR5 / LIVE SPECIMEN';
 }catch{status.textContent='SPECIMEN SIGNAL LOST';}
 function resize(){const width=host.clientWidth||320,height=host.clientHeight||240;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function draw(now){frame=0;if(disposed||document.hidden)return;if(now-last>=70){if(last)t+=Math.min(.1,(now-last)/1000);last=now;const split=force??(reduced.matches?.2:(1-Math.cos(t*.55))*.5);for(const part of parts)part.node.position.copy(part.home).addScaledVector(part.out,split);rig.rotation.y=reduced.matches?.25:t*.14;renderer.render(scene,camera);}if(!reduced.matches)frame=requestAnimationFrame(draw);}
 function schedule(){if(frame)cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(draw);}
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);schedule();
 return {split(value){force=value;schedule();},dispose(){disposed=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',schedule);reduced.removeEventListener('change',schedule);for(const resource of new Set(resources))resource.dispose();renderer.dispose();renderer.domElement.remove();status.remove();}};
}
