'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter.js';
import {assembleCreature} from './creator/assemble';
import {REGIONS,type Design,type Region} from './design';
import {regionBounds,frameRegion} from './creator/camera-focus';
export type ViewerHandle={exportFile:(format:'glb'|'obj'|'png')=>Promise<void>;front:()=>void;back:()=>void};
type Props={design:Design;selected:Region;hologram:boolean;parts:boolean;playing:boolean;onPick:(r:Region)=>void;onReady:()=>void};
type Assembly=Awaited<ReturnType<typeof assembleCreature>>;
type Engine={scene:T.Scene;camera:T.PerspectiveCamera;renderer:T.WebGLRenderer;orbit:OrbitControls;assembly:Assembly|null;holder:T.Group;revision:number};
const BASE='/tv/assets/armie-intro/myr5/';
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
export const AlienViewer=forwardRef<ViewerHandle,Props>(function AlienViewer(props,ref){
 const mount=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),latest=useRef(props);latest.current=props;
 const [started,setStarted]=useState(false),[status,setStatus]=useState('Waking up MYR5…');
 const focus=()=>{const e=engine.current;if(!e?.assembly)return;e.holder.rotation.y=0;const region=latest.current.selected;let box=regionBounds(e.assembly.root,region);if(box.isEmpty()&&region==='eye')box=regionBounds(e.assembly.root,'head');frameRegion(e.camera,e.orbit,box);};
 const look=(z:number)=>{const e=engine.current;if(e){e.holder.rotation.y=0;e.orbit.minDistance=5.2;e.camera.position.set(0,2.8,z);e.orbit.target.set(0,1.95,0);e.orbit.update();}};
 useImperativeHandle(ref,()=>({front:()=>look(8.5),back:()=>look(-8.5),async exportFile(format){
  const e=engine.current;if(!e?.assembly)throw Error('Wait for the coach to load.');
  if(format==='png'){e.renderer.render(e.scene,e.camera);const b=await new Promise<Blob|null>(r=>e.renderer.domElement.toBlob(r));if(!b)throw Error('Image could not be saved.');download(b,'myr5-preview.png');return;}
  const clone=e.assembly.root.clone(true);clone.children.forEach(o=>{o.position.set(0,0,0);if(o.name==='Style ornaments')o.children.forEach(p=>p.position.set(0,0,0));});clone.updateMatrixWorld(true);
  if(format==='obj')download(new Blob([new OBJExporter().parse(clone)],{type:'text/plain'}),'myr5-custom.obj');
  else {const data=await new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true});download(new Blob([data as ArrayBuffer],{type:'model/gltf-binary'}),'myr5-custom.glb');}
 }}));
 useEffect(()=>{
  if(!mount.current)return;let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});}catch{setStatus('3D needs WebGL. Open the picker in Chrome or Edge.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.domElement.setAttribute('aria-label','Your custom Coach Armie');renderer.domElement.setAttribute('role','img');mount.current.appendChild(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.1,100),holder=new T.Group();scene.add(holder);camera.position.set(-.35,2.9,8.8);
  const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.95,0);orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=5.2;orbit.maxDistance=14;
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight('#e4dbed','#23182b',2));const key=new T.DirectionalLight('#fff0dc',3);key.position.set(-3,5,5);scene.add(key);const rim=new T.DirectionalLight('#bba6dd',2);rim.position.set(3,4,-3);scene.add(rim);
  const floor=new T.Mesh(new T.CylinderGeometry(1.5,1.6,.1,64),new T.MeshStandardMaterial({color:'#21172a',roughness:.4,metalness:.5}));floor.position.y=-.1;scene.add(floor);
  const e:Engine={scene,camera,renderer,orbit,assembly:null,holder,revision:0};engine.current=e;setStarted(true);
  const resize=()=>{const box=mount.current?.getBoundingClientRect();if(box?.width&&box.height){renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();}};const observer=new ResizeObserver(resize);observer.observe(mount.current);resize();
  const ray=new T.Raycaster();let down=[0,0];const start=(ev:PointerEvent)=>{down=[ev.clientX,ev.clientY];};const pick=(ev:PointerEvent)=>{if(Math.hypot(ev.clientX-down[0],ev.clientY-down[1])>5)return;const b=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((ev.clientX-b.left)/b.width*2-1,1-(ev.clientY-b.top)/b.height*2),camera);const hit=ray.intersectObject(holder,true).find(h=>h.object.visible&&h.object.userData.region);if(hit)latest.current.onPick(hit.object.userData.region);};renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointerup',pick);
  let frame=0,last=0;const tick=(now:number)=>{frame=requestAnimationFrame(tick);if(document.hidden||now-last<32)return;const dt=Math.min(.05,(now-last)/1000);last=now;if(latest.current.playing)holder.rotation.y+=dt*.24;orbit.update();renderer.render(scene,camera);};frame=requestAnimationFrame(tick);
  return()=>{e.revision++;cancelAnimationFrame(frame);observer.disconnect();orbit.dispose();e.assembly?.dispose();floor.geometry.dispose();floor.material.dispose();scene.environment?.dispose();renderer.dispose();renderer.domElement.remove();engine.current=null;};
 },[]);
 useEffect(()=>{
  const e=engine.current;if(!e||!started)return;const run=++e.revision;setStatus('Updating material…');
  assembleCreature(props.design,BASE).then(next=>{if(engine.current!==e||run!==e.revision){next.dispose();return;}e.assembly?.root.removeFromParent();e.assembly?.dispose();e.assembly=next;e.holder.add(next.root);
   if(props.parts){const offsets:Record<Region,number[]>={head:[0,.65,0],eye:[0,.18,1],collar:[0,-.1,0],body:[0,-.45,0],arms:[.45,0,0],feet:[0,-.65,0]};for(const child of next.root.children){if(REGIONS.includes(child.name as Region))child.position.fromArray(offsets[child.name as Region]);else for(const detail of child.children)if(offsets[detail.userData.region as Region])detail.position.fromArray(offsets[detail.userData.region as Region]);}}
   if(props.hologram)next.root.traverse(o=>{if(o instanceof T.Mesh&&!/cavity/i.test(o.name)){const m=o.material as T.MeshStandardMaterial;m.emissive.set('#664999');m.emissiveIntensity=.3;}});
   focus();setStatus('');latest.current.onReady();
  }).catch(()=>{if(run===e.revision)setStatus('This material could not load. Choose a style to retry.');});
 },[started,props.design,props.parts,props.hologram]);
 useEffect(()=>{focus();},[props.selected]);
 return <div className="hand-viewer-wrap"><div className="hand-canvas" ref={mount}/>{status&&<div className="model-status" role="status">{status}</div>}</div>;
});
