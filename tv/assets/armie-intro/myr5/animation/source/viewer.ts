import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {assembleCreature} from './creator/assemble';
import {createRig,disposeObject,type CreatureRig} from './rig';
import {MotionController,type Gesture} from './motion';
import {importCreature,motionSettings} from './profile';
import {sampleShot,SHOTS,type Cinematic} from './cinematic-shots';

export class CreatureViewer {
 cinematicKind:Cinematic|null=null;
 cinematic(kind:Cinematic|null,elapsed=0){
  if(!kind){if(!this.cinematicKind)return;this.cinematicKind=null;const giant=this.stage==='encounter';this.camera.position.set(0,giant?2.1:2.65,giant?5.8:8.9);this.orbit.target.set(0,giant?2.25:1.95,0);this.camera.fov=giant?32:36;this.camera.updateProjectionMatrix();this.orbit.update();this.play('idle');return;}
  if(!Object.hasOwn(SHOTS,kind)||this.settings.reduced)return;
  if(this.cinematicKind!==kind){this.cinematicKind=kind;this.play(SHOTS[kind].gesture);}
  const [x,y,z,target]=sampleShot(kind,elapsed);this.camera.position.set(x,y,z);this.orbit.target.set(0,target,0);this.camera.fov=36;this.camera.updateProjectionMatrix();this.orbit.update();
 }
 scene=new T.Scene();camera=new T.PerspectiveCamera(36,1,.1,50);renderer:T.WebGLRenderer;orbit:OrbitControls;rig:CreatureRig|null=null;motion:MotionController|null=null;generation=0;disposed=false;frame=0;last=0;visible=true;settings=motionSettings(null);resizeObserver:ResizeObserver;visibilityObserver:IntersectionObserver;gesture:Gesture='idle';paused=false;stage:'pod'|'encounter'='pod';floorObjects:T.Object3D[]=[];
 constructor(public mount:HTMLElement,public assetBase:string,interactive=true){
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;
  const environment=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
  this.renderer.domElement.setAttribute('aria-label','Your animated MYR5 creature');this.renderer.domElement.setAttribute('role','img');mount.append(this.renderer.domElement);
  this.camera.position.set(0,2.65,8.9);this.orbit=new OrbitControls(this.camera,this.renderer.domElement);this.orbit.target.set(0,1.95,0);this.orbit.enableDamping=true;this.orbit.enablePan=false;this.orbit.minDistance=6;this.orbit.maxDistance=13;this.orbit.enabled=interactive;this.orbit.maxPolarAngle=Math.PI*.85;
  this.scene.add(new T.HemisphereLight(0xe5d5ff,0x23152e,2));const key=new T.DirectionalLight(0xffeedc,3);key.position.set(-3,5,5);this.scene.add(key);const rim=new T.DirectionalLight(0xb997ff,2);rim.position.set(3,4,-3);this.scene.add(rim);
  const floor=new T.Mesh(new T.CylinderGeometry(1.45,1.55,.08,64),new T.MeshStandardMaterial({color:0x241e31,roughness:.5,metalness:.4}));floor.position.y=-.05;this.scene.add(floor);
  const ring=new T.Mesh(new T.TorusGeometry(1.4,.014,6,64),new T.MeshBasicMaterial({color:0xd3b86d}));ring.rotation.x=Math.PI/2;ring.position.y=.005;this.scene.add(ring);
  this.floorObjects=[floor,ring];
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(mount);this.resize();
  this.visibilityObserver=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;});this.visibilityObserver.observe(mount);
  const tick=(now:number)=>{if(this.disposed)return;this.frame=requestAnimationFrame(tick);const dt=Math.min(.05,(now-this.last)/1000);if(now-this.last<32)return;this.last=now;if(!this.visible||document.hidden)return;this.motion?.update(dt);this.orbit.update();this.renderer.render(this.scene,this.camera);};this.frame=requestAnimationFrame(tick);
 }
 resize(){const {width,height}=this.mount.getBoundingClientRect();if(width&&height){this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}}
 async setRecipe(raw:unknown){
  const recipe=importCreature(JSON.stringify(raw)),generation=++this.generation;
  const assembly=await assembleCreature(recipe,this.assetBase);let rig:CreatureRig;
  try{if(this.disposed||generation!==this.generation)return false;rig=createRig(assembly.root,recipe);}finally{assembly.dispose();}
  if(this.rig){this.motion?.dispose();this.scene.remove(this.rig.root);disposeObject(this.rig.root);}
  this.rig=rig!;this.motion=new MotionController(rig!);Object.assign(this.motion,this.settings,{paused:this.paused});this.scene.add(rig!.root);this.motion.play(this.gesture);return true;
 }
 play(id:Gesture){this.gesture=id;this.motion?.play(id);}
 setSettings(settings:ReturnType<typeof motionSettings>){this.settings=settings;if(this.motion)Object.assign(this.motion,settings);}
 setPaused(paused:boolean){this.paused=paused;if(this.motion)this.motion.paused=paused;}
 setStage(stage:'pod'|'encounter'){if(this.stage===stage)return;this.stage=stage;const giant=stage==='encounter';this.floorObjects.forEach(o=>o.visible=!giant);this.orbit.minDistance=giant?4:6;this.camera.fov=giant?32:36;this.camera.position.set(0,giant?2.1:2.65,giant?5.8:8.9);this.orbit.target.set(0,giant?2.25:1.95,0);this.camera.updateProjectionMatrix();this.orbit.update();this.resize();}
 resetView(){this.camera.position.set(0,2.65,8.9);this.orbit.target.set(0,1.95,0);this.orbit.update();}
 async exportGLB(){
  if(!this.rig||!this.motion)throw Error('Wait for your creature to load.');
  // Export a clean neutral clone and the same reusable clips used in the app.
  const clone=this.rig.root.clone(true);for(const [name,rest] of Object.entries(this.rig.rest)){const node=clone.getObjectByName(name)!;node.position.copy(rest.position);node.quaternion.copy(rest.quaternion);node.scale.copy(rest.scale);}clone.updateMatrixWorld(true);
  const result=await new GLTFExporter().parseAsync(clone,{binary:true,animations:this.motion.clips});return new Blob([result as ArrayBuffer],{type:'model/gltf-binary'});
 }
 stats(){return {gesture:this.motion?.current,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,visible:this.visible,paused:this.paused,contextLost:this.renderer.getContext().isContextLost(),canvas:{width:this.renderer.domElement.width,height:this.renderer.domElement.height},rigVersion:1,recipe:this.rig?.recipe};}
 dispose(){this.disposed=true;this.generation++;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.visibilityObserver.disconnect();this.orbit.dispose();this.motion?.dispose();disposeObject(this.scene);this.scene.environment?.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
