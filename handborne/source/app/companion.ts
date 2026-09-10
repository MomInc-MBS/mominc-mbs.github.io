import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {assemble} from './hand-model';
import {bindHand,applyHandPose,type HandRig} from './pose-rig';
import {getPose,mixPoses} from './poses';
import {parseDesign,type HandDesign} from './recipe';
import {DEFAULT_SELECTION} from './catalog';
import {DEFAULT_NAIL_SHAPE} from './nails';
export {parseDesign};
export const HAND_KEY='handborne-recipe-v4';
export function readHand(storage:Pick<Storage,'getItem'>):HandDesign {
  try{const value=storage.getItem(HAND_KEY);if(value)return parseDesign(value);}catch{}
  return {sections:{...DEFAULT_SELECTION},pose:'relaxed',nailShape:DEFAULT_NAIL_SHAPE};
}
export function createHandCompanion(host:HTMLDivElement,{storage=localStorage,onStatus=(_text:string)=>{}}={}){
  let disposed=false,revision=0,frame=0,rig:HandRig|null=null,hand:THREE.Group|null=null;
  let currentPose=getPose('relaxed'),transition:{from:ReturnType<typeof getPose>;to:ReturnType<typeof getPose>;start:number}|null=null;
  let gestureUntil=0,lastFrame=0,active=true;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
  renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Your customized Helping Hand beside your Gala avatar');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
  const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
  const camera=new THREE.PerspectiveCamera(34,1,.005,3);camera.position.set(.045,.08,.39);camera.lookAt(0,.035,0);
  scene.add(new THREE.HemisphereLight('#fff4e0','#655179',2));
  const key=new THREE.DirectionalLight('#fff2ce',3.6);key.position.set(.3,.3,.4);scene.add(key);
  const rim=new THREE.DirectionalLight('#d899ff',2.5);rim.position.set(-.3,.15,-.2);scene.add(rim);
  const resize=()=>{const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function release(){if(hand)hand.removeFromParent();rig?.dispose();rig=null;hand=null;}
  async function refresh(){
    const run=++revision;onStatus('Your hand is arriving…');
    try{const design=readHand(storage),next=await assemble(design.sections,design.nailShape,design.scalePattern);
      if(disposed||run!==revision){next.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.ownedGeometry)o.geometry.dispose();});return;}
      release();hand=next;rig=bindHand(next);root.add(next);currentPose=getPose('relaxed');transition=null;applyHandPose(rig,currentPose);onStatus('Helping Hand ready');
    }catch{if(!disposed&&run===revision)onStatus('Hand could not load. Tap Retry hand.');}
  }
  function gesture(id:string){if(disposed)return;transition={from:currentPose,to:getPose(id),start:performance.now()};gestureUntil=performance.now()+1500;}
  function tick(now:number){if(disposed)return;frame=requestAnimationFrame(tick);if(!active||document.hidden||now-lastFrame<40)return;lastFrame=now;
    if(transition&&rig){const t=reduced.matches?1:Math.min(1,(now-transition.start)/220);currentPose=mixPoses(transition.from,transition.to,t);applyHandPose(rig,currentPose);if(t===1)transition=null;}
    if(gestureUntil&&now>gestureUntil){gestureUntil=0;transition={from:currentPose,to:getPose('relaxed'),start:now};}
    root.position.y=reduced.matches?0:Math.sin(now/850)*.003;root.rotation.y=reduced.matches?0:Math.sin(now/1400)*.08;
    renderer.render(scene,camera);
  }
  const changed=(event:StorageEvent)=>{if(event.key===HAND_KEY||event.key===null)void refresh();};window.addEventListener('storage',changed);
  frame=requestAnimationFrame(tick);void refresh();
  return {refresh,gesture,setActive(value:boolean){active=value;},dispose(){if(disposed)return;disposed=true;revision++;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('storage',changed);release();scene.environment?.dispose();renderer.dispose();renderer.domElement.remove();}};
}
