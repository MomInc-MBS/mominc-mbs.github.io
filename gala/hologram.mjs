import * as THREE from '/tv/assets/armie-intro/vendor/three.module.js';
import {GLTFLoader} from '/tv/assets/armie-intro/vendor/GLTFLoader.js';
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
