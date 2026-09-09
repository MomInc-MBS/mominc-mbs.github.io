'use client';
import {arrangeEyes} from './anatomy';
import {EYE_LAYOUTS} from './eye-layouts';
import {pupilGeometry} from './pupils';
import {getCoach} from './coaching';
import {applySurfaceStyle,growSurfaceDetails} from './surface-styles';
import {prepareEyeMesh,conformEyeMesh} from './eye-surface';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter.js';
import {REGIONS,STYLES,type Region,type Design} from './design';
import {deformMesh} from './deform';
export type ViewerHandle={exportFile:(format:'glb'|'obj'|'png')=>Promise<void>;front:()=>void;back:()=>void};
type Props={design:Design;selected:Region;hologram:boolean;parts:boolean;playing:boolean;onPick:(r:Region)=>void;onReady:()=>void};
const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
type Engine={scene:THREE.Scene;root:THREE.Group;camera:THREE.PerspectiveCamera;renderer:THREE.WebGLRenderer;orbit:OrbitControls;regions:Record<Region,THREE.Group>;details:THREE.Group;lid:THREE.Mesh;materials:THREE.MeshStandardMaterial[];variants:Map<string,THREE.Object3D>;eyeTemplate:THREE.Group;eyeCopies:THREE.Group|null};
export const AlienViewer=forwardRef<ViewerHandle,Props>(function AlienViewer(props,ref){
 const mount=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),latest=useRef(props);latest.current=props;
 const [error,setError]=useState(''),[loaded,setLoaded]=useState(false);
 useImperativeHandle(ref,()=>({front(){const e=engine.current;if(e){e.root.rotation.y=0;e.camera.position.set(0,2.8,8.5);e.orbit.target.set(0,1.95,0);e.orbit.update();}},back(){const e=engine.current;if(e){e.root.rotation.y=0;e.camera.position.set(0,2.8,-8.5);e.orbit.target.set(0,1.95,0);e.orbit.update();}},async exportFile(format){
  const e=engine.current;if(!e)throw Error('The creature is still loading.');
  if(format==='png'){e.renderer.render(e.scene,e.camera);const blob=await new Promise<Blob|null>(r=>e.renderer.domElement.toBlob(r));if(!blob)throw Error('Could not make the image.');download(blob,'myr5-preview.png');return;}
  // Export the assembled current design, never the inspection offsets or turntable.
  const clone=e.root.clone(true);clone.position.set(0,0,0);clone.rotation.set(0,0,0);clone.children.forEach(o=>{if(REGIONS.includes(o.name as Region))o.position.set(0,0,0);});clone.getObjectByName('Style ornaments')?.children.forEach(o=>o.position.set(0,0,0));clone.traverse(o=>{for(const child of [...o.children])if(!child.visible)o.remove(child);});clone.userData.anatomy={fingers:latest.current.design.fingers,toes:latest.current.design.toes,eyeLayout:latest.current.design.eyeLayout};clone.userData.coaching={...getCoach(latest.current.design.coach)};clone.updateMatrixWorld(true);
  if(format==='glb'){const data=await new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true});download(new Blob([data as ArrayBuffer],{type:'model/gltf-binary'}),'myr5-custom.glb');}
  else {download(new Blob([new OBJExporter().parse(clone)],{type:'text/plain'}),'myr5-custom.obj');}
 }}));
 useEffect(()=>{
  const el=mount.current;if(!el)return;let disposed=false,frame=0;let e:Engine|undefined;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch{setError('3D needs WebGL. Try opening this customizer in Chrome or Edge.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(37,1,.1,100);camera.position.set(-.35,2.9,8.8);
  const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.95,0);orbit.enableDamping=true;orbit.minDistance=5.2;orbit.maxDistance=14;orbit.maxPolarAngle=Math.PI*.9;orbit.enablePan=false;
  scene.add(new THREE.HemisphereLight(0xe4cfff,0x180923,2.0));
  const key=new THREE.DirectionalLight(0xffead3,3);key.position.set(-3,5,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xb590dd,2.5);rim.position.set(3,3,-3);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xe2c58c,1.0);fill.position.set(-2,1,-1);scene.add(fill);
  const stage=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.65,.16,80),new THREE.MeshStandardMaterial({color:0x1b1422,metalness:.6,roughness:.35}));stage.position.y=-.12;scene.add(stage);
  for(const radius of [1.40,1.57]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.015,8,96),new THREE.MeshStandardMaterial({color:0xc5a65c,emissive:0x9a783d,emissiveIntensity:.5}));ring.rotation.x=Math.PI/2;ring.position.y=-.025;scene.add(ring);}
  const root=new THREE.Group();scene.add(root);const details=new THREE.Group();details.name='Style ornaments';root.add(details);
  const resize=()=>{const {width,height}=el.getBoundingClientRect();if(width&&height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const materials:THREE.MeshStandardMaterial[]=[];
  const loader=new GLTFLoader();Promise.all([loader.loadAsync('/models/myr5.glb?v=5'),loader.loadAsync('/models/anatomy.glb?v=1'),loader.loadAsync('/models/hands-v2.glb')]).then(([gltf,anatomy,hands])=>{
   for(const old of [...anatomy.scene.children])if(old.name.startsWith('arms_')){old.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});anatomy.scene.remove(old);}
   for(const hand of [...hands.scene.children])anatomy.scene.add(hand);
   if(disposed){anatomy.scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});return;}
   const regions={} as Record<Region,THREE.Group>;
   for(const region of REGIONS){const source=gltf.scene.getObjectByName(region);if(!source){setError('A creature section could not load. Refresh to try again.');return;}const wrapper=new THREE.Group();wrapper.name=region;root.add(wrapper);wrapper.add(source);regions[region]=wrapper;wrapper.traverse(o=>{if(o instanceof THREE.Mesh){if(region==='eye')prepareEyeMesh(o);o.userData.region=region;o.userData.basePosition=o.position.clone();o.userData.baseScale=o.scale.clone();o.material=(o.material as THREE.MeshStandardMaterial).clone();const m=o.material as THREE.MeshStandardMaterial;m.userData={baseColor:m.color.clone(),baseRough:m.roughness,baseMetal:m.metalness,name:m.name};materials.push(m);}});}
   const lid=new THREE.Mesh(new THREE.SphereGeometry(.619,48,24,0,Math.PI*2,0,.57),new THREE.MeshStandardMaterial({color:STYLES[0].primary,roughness:.58}));lid.position.set(0,2.1575,.55);lid.name='Expression eyelid';lid.userData.region='eye';const eyeTemplate=regions.eye.children[0] as THREE.Group;eyeTemplate.add(lid);
   const variants=new Map<string,THREE.Object3D>();variants.set('head_single',regions.head.children[0]);variants.set('original_arms',regions.arms.children[0]);variants.set('original_feet',regions.feet.children[0]);
   for(const object of [...anatomy.scene.children]){const region=object.name.split('_')[0] as Region;object.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.region=region;o.userData.basePosition=o.position.clone();o.userData.baseScale=o.scale.clone();o.material=(o.material as THREE.MeshStandardMaterial).clone();const m=o.material as THREE.MeshStandardMaterial;m.userData={baseColor:m.color.clone(),baseRough:m.roughness,baseMetal:m.metalness,name:m.name};}});anatomy.scene.remove(object);variants.set(object.name,object);}
   e={scene,root,camera,renderer,orbit,regions,details,lid,materials,variants,eyeTemplate,eyeCopies:null};engine.current=e;setLoaded(true);latest.current.onReady();
  }).catch(()=>setError('The model could not load. Refresh to try again.'));
  const ray=new THREE.Raycaster();let down={x:0,y:0};const pointerDown=(ev:PointerEvent)=>{down={x:ev.clientX,y:ev.clientY};};const pointerUp=(ev:PointerEvent)=>{if(!e||Math.hypot(ev.clientX-down.x,ev.clientY-down.y)>5)return;const box=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((ev.clientX-box.left)/box.width*2-1,-(ev.clientY-box.top)/box.height*2+1),camera);const hit=ray.intersectObject(root,true).find(h=>h.object.userData.region);if(hit)latest.current.onPick(hit.object.userData.region);};renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
  let last=performance.now();const animate=(now:number)=>{frame=requestAnimationFrame(animate);const dt=Math.min(.05,(now-last)/1000);last=now;if(e){if(latest.current.playing&&!document.hidden){root.rotation.y+=dt*.24;root.position.y=.035+Math.sin(now*.0013)*.028;}orbit.update();}renderer.render(scene,camera);};frame=requestAnimationFrame(animate);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();orbit.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);if(e)for(const object of e.variants.values())if(!object.parent)scene.add(object);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer.dispose();renderer.domElement.remove();engine.current=null;};
 },[]);
 useEffect(()=>{
  const e=engine.current;if(!e)return;const d=props.design;
  if(e.eyeCopies){e.regions.eye.remove(e.eyeCopies);e.eyeCopies=null;}e.eyeTemplate.visible=true;
  for(const [region,key] of [['head','head_'+d.eyeLayout],['arms','arms_'+d.fingers],['feet','feet_'+d.toes]] as const){const variant=e.variants.get(key);if(variant&&e.regions[region].children[0]!==variant){e.regions[region].clear();e.regions[region].add(variant);}if(region==='head')variant?.traverse(o=>{o.userData.eyeSockets=EYE_LAYOUTS[d.eyeLayout].eyes;});}
  for(const region of REGIONS){const style=STYLES[d.styles[region]],group=e.regions[region];
   group.position.set(0,0,0);if(props.parts){const offsets:Record<Region,number[]>={head:[0,.65,0],eye:[0,.18,1.0],collar:[0,-.1,0],body:[0,-.45,0],arms:[.45,0,0],feet:[0,-.65,0]};group.position.fromArray(offsets[region]);}
   group.traverse(o=>{if(!(o instanceof THREE.Mesh)||o===e.lid)return;const m=o.material as THREE.MeshStandardMaterial;const base=m.userData.baseColor as THREE.Color;const name=m.userData.name as string;const fixed=['Eye ivory','Pupil','Eye glint'].includes(name);
    m.color.copy(base);m.emissive.set(0);m.metalness=m.userData.baseMetal;m.roughness=m.userData.baseRough;m.transparent=false;m.opacity=1;m.depthWrite=true;
    if(d.styles[region]!==0&&!fixed){m.color.set(name==='Lilac hair'||name==='Raised scales'?style.accent:style.primary);if(name==='Socket shadow'||name==='Body velvet')m.color.multiplyScalar(.43);m.roughness=style.roughness;m.metalness=style.metalness;m.emissive.set(style.emissive).multiplyScalar(.25);}
    if(props.hologram){m.color.set(fixed&&name==='Pupil'?'#261336':'#c9b0ea');m.emissive.set('#76518f');m.emissiveIntensity=.55;m.roughness=.25;m.metalness=.1;}
    if(o.name==='Pupil'&&o.userData.pupilType!==d.pupil){o.geometry.dispose();o.geometry=pupilGeometry(d.pupil);o.userData.basePosition=new THREE.Vector3(.04,2.1475,1.183);o.userData.baseScale=new THREE.Vector3(1,1,1);o.userData.pupilType=d.pupil;}
    if(o.name==='Iris'&&o.userData.irisType!==d.pupil){o.geometry.dispose();o.geometry=pupilGeometry(d.pupil);o.geometry.scale(1.48,1.48,1);o.userData.basePosition=new THREE.Vector3(.04,2.1475,1.133);o.userData.baseScale=new THREE.Vector3(1,1,1);o.userData.irisType=d.pupil;}
    if(/^Iris.fiber/.test(o.name))o.visible=d.pupil==='round';
    if(/^Crown.scale/.test(o.name))o.visible=d.styles[region]===0;
    deformMesh(o,region,d);if(region==='eye')conformEyeMesh(o);else applySurfaceStyle(o,d.styles[region],region,d.detail);
    if(o.name==='Iris'){const p=o.geometry.attributes.position,colors=new Float32Array(p.count*3);for(let j=0;j<p.count;j++){const a=Math.atan2(p.getY(j),p.getX(j)),r=Math.hypot(p.getX(j),p.getY(j));const shade=.78+.16*Math.sin(a*117+r*35)+.06*Math.cos(a*61);colors[j*3]=shade;colors[j*3+1]=shade;colors[j*3+2]=Math.min(1,shade+.07);}o.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));m.vertexColors=true;m.needsUpdate=true;}
   });
  }
  const cap=props.design.eye==='sleepy'?1.56:props.design.eye==='wide'?.30:.57;e.lid.geometry.dispose();e.lid.geometry=new THREE.SphereGeometry(.619,48,24,0,Math.PI*2,0,cap);(e.lid.material as THREE.MeshStandardMaterial).color.set(props.hologram?'#c9b0ea':STYLES[d.styles.head].primary);
  if(d.eyeLayout!=='single'){e.eyeCopies=arrangeEyes(e.eyeTemplate,d.eyeLayout);e.regions.eye.add(e.eyeCopies);e.eyeTemplate.visible=false;}
  const key=JSON.stringify([d.styles,d.detail,d.eyeLayout,d.fingers,d.toes,props.hologram,props.parts]);if(e.details.userData.key===key)return;e.details.userData.key=key;
  e.details.children.slice().forEach(o=>{o.traverse(c=>{if(c instanceof THREE.Mesh){c.geometry.dispose();(c.material as THREE.Material).dispose();}});e.details.remove(o);});
  for(const region of REGIONS){const growth=growSurfaceDetails(e.regions[region],d.styles[region],region,props.hologram,d.detail);growth.position.copy(e.regions[region].position);e.details.add(growth);}
 },[props.design,props.hologram,props.parts,loaded]);
 return <div className={'hand-viewer-wrap '+(props.hologram?'holo-view':'')}><div className="hand-canvas" ref={mount}/>{(!loaded||error)&&<div className={'model-status '+(error?'is-error':'')}>{error||'Waking up MYR5…'}</div>}</div>;
});










