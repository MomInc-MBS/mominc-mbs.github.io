'use client';

import { assemble } from './hand-model';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { REGIONS, STYLES, type RegionId } from './catalog';
import { recipeCode, designCode, type Selection } from './recipe';
import { getPose, mixPoses, type Pose } from './poses';
import { bindHand, applyHandPose, type HandRig } from './pose-rig';
import { replaceNailShape } from './nails';
import { specimenMotion } from './motion';
import { addHandScales } from './scales';

export type HandViewerHandle = { exportFile:(format:'glb'|'obj'|'png')=>Promise<void>; resetView:()=>void; flipView:()=>void; };
type Props = {selection:Selection;poseId:string;nailShape:string;scalePattern?:string;animate:boolean;gray?:boolean;selectedRegion:RegionId;exploded:boolean;onSelectRegion:(r:RegionId)=>void;onReady?:(code:string)=>void;};
function download(blob:Blob,name:string) {
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function disposeDisplay(group:THREE.Group) {
  group.traverse(obj=>{if(obj instanceof THREE.Mesh && obj.userData.displayMaterial) {
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());
  }});
}

export const HandViewer=forwardRef<HandViewerHandle,Props>(function HandViewer({selection,poseId,nailShape,scalePattern='none',animate,gray=false,selectedRegion,exploded,onSelectRegion,onReady},ref) {
  const host=useRef<HTMLDivElement>(null);
  const sceneRef=useRef<THREE.Scene|null>(null),handRef=useRef<THREE.Group|null>(null);
  const floatingRoot=useRef<THREE.Group|null>(null);
  const cameraRef=useRef<THREE.PerspectiveCamera|null>(null),rendererRef=useRef<THREE.WebGLRenderer|null>(null),controlsRef=useRef<OrbitControls|null>(null);
  const current=useRef({selection,poseId,nailShape,scalePattern,animate,gray,selectedRegion,exploded,onSelectRegion,onReady});current.current={selection,poseId,nailShape,scalePattern,animate,gray,selectedRegion,exploded,onSelectRegion,onReady};
  const rigRef=useRef<HandRig|null>(null),loadedStyle=useRef(''),displayedPose=useRef(getPose(poseId));
  const transition=useRef<{from:Pose;to:Pose;start:number;duration:number;last:number}|null>(null);
  const [status,setStatus]=useState('Loading hand…'),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  const selectionKey=recipeCode(selection)+'/'+nailShape+'/'+scalePattern;

  function decorate() {
    sceneRef.current?.traverse(obj=>{
      if(obj instanceof THREE.Light){obj.userData.originalColor??=obj.color.clone();obj.color.copy(current.current.gray?new THREE.Color('#ffffff'):obj.userData.originalColor);}
      if(obj instanceof THREE.HemisphereLight){obj.userData.originalGroundColor??=obj.groundColor.clone();obj.groundColor.copy(current.current.gray?new THREE.Color('#202020'):obj.userData.originalGroundColor);}
    });
    const hand=handRef.current;if(!hand)return;
    for(const part of hand.children) {
      const region=part.userData.region as RegionId;
      const offsets:Record<RegionId,[number,number,number]>={nails:[0,.018,.014],fingertips:[0,.012,0],fingers:[0,.005,0],palm:[0,0,-.020],back_of_hand:[0,0,.020],wrist:[0,-.020,0]};
      part.position.fromArray(current.current.exploded?offsets[region]:[0,0,0]);
      part.traverse(obj=>{
        if(!(obj instanceof THREE.Mesh))return;
        if(!obj.userData.displayMaterial) {
          obj.userData.sourceMaterials=Array.isArray(obj.material)?obj.material:[obj.material];
          obj.material=Array.isArray(obj.material)?obj.material.map(m=>m.clone()):obj.material.clone();
          obj.userData.displayMaterial=true;
          const m=Array.isArray(obj.material)?obj.material[0]:obj.material;
          if(m instanceof THREE.MeshStandardMaterial)obj.userData.originalEmissive=m.emissive.clone();
        }
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        for(const [i,m]of mats.entries())if(m instanceof THREE.MeshStandardMaterial) {
          m.copy(obj.userData.sourceMaterials[i]);
          if(current.current.gray){m.color.set('#92979c');m.emissive.set(0);m.map=null;m.normalMap=null;m.roughnessMap=null;m.metalnessMap=null;m.roughness=.66;m.metalness=0;}
          if(current.current.gray&&m instanceof THREE.MeshPhysicalMaterial){m.transmission=0;m.thickness=0;m.clearcoat=0;m.sheen=0;m.iridescence=0;}
          if(!current.current.gray&&region===current.current.selectedRegion)m.emissive.add(new THREE.Color('#081b14'));
          m.needsUpdate=true;
        }
      });
    }
  }
  useEffect(()=>{decorate();},[selectedRegion,exploded,gray]);
  useEffect(()=>{
    if(!rigRef.current)return;
    transition.current={from:displayedPose.current,to:getPose(poseId),start:performance.now(),duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1100,last:0};
  },[poseId]);
  useEffect(()=>{
    let cancelled=false;setStatus('Loading selected forms…');setError(false);
    assemble(selection,nailShape,scalePattern).then(hand=>{
      if(cancelled||!floatingRoot.current){hand.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.ownedGeometry)o.geometry.dispose();});return;}
      if(handRef.current){handRef.current.removeFromParent();disposeDisplay(handRef.current);rigRef.current?.dispose();}
      // Bind in rest-space before attaching the independent, moving display parent.
      handRef.current=hand;rigRef.current=bindHand(hand);floatingRoot.current.add(hand);loadedStyle.current=selectionKey;
      displayedPose.current=getPose(current.current.poseId);transition.current=null;applyHandPose(rigRef.current,displayedPose.current);
      decorate();setStatus('');current.current.onReady?.(designCode({sections:selection,pose:current.current.poseId,nailShape,scalePattern}));
    }).catch(()=>{if(!cancelled){setError(true);setStatus('Could not load this hand. Check your connection and retry.');}});
    return ()=>{cancelled=true;};
  },[selectionKey,retry]);

  useImperativeHandle(ref,()=>({
    async exportFile(format) {
      if(format==='png') {
        const renderer=rendererRef.current,scene=sceneRef.current,camera=cameraRef.current;
        if(!renderer||!scene||!camera)throw new Error('The preview is still loading.');
        renderer.render(scene,camera);
        const blob=await new Promise<Blob|null>(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
        if(!blob)throw new Error('Could not capture the preview.');
        download(blob,'handborne-preview.png');return;
      }
      const chosen={sections:current.current.selection,pose:current.current.poseId,nailShape:current.current.nailShape,scalePattern:current.current.scalePattern};
      const hand=await assemble(chosen.sections,chosen.nailShape,chosen.scalePattern),exportRig=bindHand(hand);applyHandPose(exportRig,getPose(chosen.pose));hand.userData.recipe=designCode(chosen);hand.userData.nail_shape=chosen.nailShape;hand.updateMatrixWorld(true);
      try{
      if(format==='glb') {
        const {GLTFExporter}=await import('three/examples/jsm/exporters/GLTFExporter.js');
        const result=await new GLTFExporter().parseAsync(hand,{binary:true,onlyVisible:true});
        if(!(result instanceof ArrayBuffer))throw new Error('GLB export failed.');
        download(new Blob([result],{type:'model/gltf-binary'}),'handborne-'+chosen.pose+'.glb');
      } else {
        const {OBJExporter}=await import('three/examples/jsm/exporters/OBJExporter.js');
        const {zipSync,strToU8}=await import('three/examples/jsm/libs/fflate.module.js');
        let mtl='# Handborne material library\n';const seen=new Set<string>();
        hand.traverse(obj=>{
          if(!(obj instanceof THREE.Mesh))return;
          for(const m of (Array.isArray(obj.material)?obj.material:[obj.material]))if(m instanceof THREE.MeshStandardMaterial&&!seen.has(m.name)){
            seen.add(m.name);
            const style=STYLES.find(s=>m.name.startsWith(s.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'_'));
            const c=m.map&&style?new THREE.Color(style.primary):m.color;
            mtl+='newmtl '+m.name+'\nKd '+[c.r,c.g,c.b].join(' ')+'\nKs 0.25 0.25 0.25\nNs '+Math.round((1-m.roughness)*200)+'\nd 1\n\n';
          }
        });
        const obj='mtllib handborne.mtl\n'+new OBJExporter().parse(hand);
        const archive=zipSync({'handborne.obj':strToU8(obj),'handborne.mtl':strToU8(mtl),'recipe.json':strToU8(JSON.stringify({version:4,...chosen},null,2)),'README.txt':strToU8('OBJ preserves the selected pose, nail shape, raised scale pattern, anatomical mesh, physical relief and base material colors. Use GLB for embedded albedo and microrelief normal maps. This is a baked static pose, not an animation skeleton. Curved module interfaces remain open; not print-ready.')});
        download(new Blob([archive as unknown as BlobPart],{type:'application/zip'}),'handborne-'+chosen.pose+'-obj.zip');
      }
      }finally{exportRig.dispose();}
    },
    resetView(){const camera=cameraRef.current;if(camera){const fit=Math.max(1,.62/camera.aspect);camera.position.set(.055*fit,.035+.06*fit,.36*fit);}controlsRef.current?.target.set(0,.035,0);controlsRef.current?.update();},
    flipView(){const camera=cameraRef.current;if(camera){camera.position.x*=-1;camera.position.z*=-1;controlsRef.current?.update();}},
  }),[]);

  useEffect(()=>{
    const mount=host.current;if(!mount)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}
    catch {setError(true);setStatus('3D graphics are unavailable. Try a browser with hardware acceleration.');return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);rendererRef.current=renderer;
    const scene=new THREE.Scene();sceneRef.current=scene;
    const floatGroup=new THREE.Group();floatGroup.name='Specimen motion';scene.add(floatGroup);floatingRoot.current=floatGroup;
    const camera=new THREE.PerspectiveCamera(34,1,.005,5);camera.position.set(.055,.095,.36);cameraRef.current=camera;
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.035,0);controls.enableDamping=true;
    controls.enablePan=false;controls.minDistance=.20;controls.maxDistance=.95;controlsRef.current=controls;
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;
    scene.environmentIntensity=.55;
    scene.add(new THREE.HemisphereLight('#c6e8ef','#15212b',.65));
    const key=new THREE.DirectionalLight('#ffead6',3.2);key.position.set(.22,.25,.30);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-.18;key.shadow.camera.right=.18;key.shadow.camera.top=.25;key.shadow.camera.bottom=-.16;key.shadow.camera.near=.01;key.shadow.camera.far=1;key.shadow.bias=-.00005;key.shadow.normalBias=.0006;key.shadow.radius=3;scene.add(key);
    const rim=new THREE.DirectionalLight('#9adeee',2.1);rim.position.set(-.28,.16,-.16);scene.add(rim);
    const fill=new THREE.DirectionalLight('#abc3e9',.65);fill.position.set(-.3,.03,.2);scene.add(fill);
    const chamber=new THREE.Group();chamber.name='Observation chamber';scene.add(chamber);
    const platform=new THREE.Mesh(new THREE.CylinderGeometry(.105,.11,.012,80),new THREE.MeshStandardMaterial({color:'#17242d',metalness:.75,roughness:.28}));
    platform.position.y=-.083;platform.receiveShadow=true;chamber.add(platform);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.101,.00065,8,100),new THREE.MeshBasicMaterial({color:'#ffd36e'}));
    ring.rotation.x=Math.PI/2;ring.position.y=-.076;chamber.add(ring);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshStandardMaterial({color:'#09151c',roughness:.54,metalness:.25}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.09;floor.receiveShadow=true;chamber.add(floor);
    let start=[0,0];const down=(e:PointerEvent)=>{start=[e.clientX,e.clientY];};
    const up=(e:PointerEvent)=>{
      if(!handRef.current||Math.hypot(e.clientX-start[0],e.clientY-start[1])>6)return;
      const rect=renderer.domElement.getBoundingClientRect();const point=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      const ray=new THREE.Raycaster();ray.setFromCamera(point,camera);
      const hit=ray.intersectObject(handRef.current,true)[0];if(hit?.object.userData.region)current.current.onSelectRegion(hit.object.userData.region);
    };
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
    let firstSize=true;
    const resize=()=>{const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();if(firstSize&&w>0&&h>0){const fit=Math.max(1,.62/camera.aspect);camera.position.set(.055*fit,.035+.06*fit,.36*fit);firstSize=false;}};
    const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    let frame=0,motionTime=0,lastTime=performance.now();const tick=()=>{
      const change=transition.current,now=performance.now();
      if(current.current.animate&&!document.hidden)motionTime+=Math.min((now-lastTime)/1000,.05);lastTime=now;
      const motion=specimenMotion(motionTime);floatGroup.position.fromArray(motion.position);floatGroup.rotation.set(...motion.rotation);
      if(change&&rigRef.current&&(now-change.last>28||change.duration===0)){
        const t=change.duration===0?1:Math.min(1,(now-change.start)/change.duration);change.last=now;
        displayedPose.current=mixPoses(change.from,change.to,t*t*(3-2*t));applyHandPose(rigRef.current,displayedPose.current);
        if(t===1){transition.current=null;if(loadedStyle.current===recipeCode(current.current.selection)+'/'+current.current.nailShape+'/'+current.current.scalePattern)current.current.onReady?.(designCode({sections:current.current.selection,pose:change.to.id,nailShape:current.current.nailShape,scalePattern:current.current.scalePattern}));}
      }
      controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(tick);
    };tick();
    return ()=>{
      cancelAnimationFrame(frame);observer.disconnect();controls.dispose();env.dispose();pmrem.dispose();room.dispose();
      chamber.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();for(const material of(Array.isArray(obj.material)?obj.material:[obj.material]))material.dispose();}});key.shadow.dispose();if(handRef.current)disposeDisplay(handRef.current);rigRef.current?.dispose();rigRef.current=null;
      renderer.dispose();if(renderer.domElement.parentElement===mount)mount.removeChild(renderer.domElement);
      sceneRef.current=null;rendererRef.current=null;floatingRoot.current=null;
    };
  },[]);
  return <div className="hand-viewer-wrap"><div ref={host} className="hand-canvas" role="img" aria-label="Five-finger 3D hand. Drag to rotate, scroll to zoom, or tap a section." />
    {status&&<div className={'model-status '+(error?'is-error':'')} role="status">{status}{error&&<button onClick={()=>setRetry(v=>v+1)}>Retry</button>}</div>}
  </div>;
});
