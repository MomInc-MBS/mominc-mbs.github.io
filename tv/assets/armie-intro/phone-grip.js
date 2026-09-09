import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {bindHand,applyHandPose} from './pose-rig.js';
export async function mountPhoneGrip(phone,profile){
 const regions=['nails','fingertips','middle_sections','knuckles','palm','back_of_hand','wrist'];
 if(!regions.every(k=>Number.isInteger(profile?.sections?.[k])&&profile.sections[k]>=0&&profile.sections[k]<23))return;
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);renderer.domElement.className='ar-grip-canvas';renderer.domElement.setAttribute('aria-hidden','true');phone.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,20);camera.position.z=5;
 scene.add(new THREE.HemisphereLight('#e6d5ff','#483453',2));const light=new THREE.DirectionalLight('#ffddb7',3);light.position.set(-2,3,4);scene.add(light);
 const hand=new THREE.Group(),holder=new THREE.Group();holder.add(hand);scene.add(holder);const loader=new GLTFLoader(),families=new Map();
 await Promise.all([...new Set(regions.map(k=>profile.sections[k]))].map(async id=>families.set(id,await loader.loadAsync(new URL((id<20?'./models/':'/handborne/models/')+'family-'+String(id).padStart(2,'0')+'.glb',import.meta.url).href))));
 const joinedFingers=new Set();
 for(const region of regions){const family=families.get(profile.sections[region]).scene;let part=family.getObjectByName(region);if(!part&&(region==='middle_sections'||region==='knuckles')){part=family.getObjectByName('fingers');if(joinedFingers.has(profile.sections[region]))continue;joinedFingers.add(profile.sections[region]);}if(!part)throw Error('Missing custom hand part: '+region);const clone=part.clone(true);clone.userData.region=region;clone.userData.styleId=profile.sections[region];hand.add(clone);}
 const rig=bindHand(hand);applyHandPose(rig,{id:'phone-grip',name:'Phone grip',rotation:[0,0,0],opposition:22,fingers:{index:[54,75,38,0],middle:[60,80,40,0],ring:[65,83,42,0],pinky:[70,87,45,0],thumb:[10,25,20,-35]}});
 // Real depth masking lets the palm sit behind the handset while the curled fingers cross its edge.
 const mask=new THREE.Mesh(new THREE.BoxGeometry(1,1,.035),new THREE.MeshBasicMaterial({colorWrite:false}));mask.renderOrder=-1;scene.add(mask);
 const wrist=hand.getObjectByName('wrist');let wristMaterial=null;wrist.traverse(o=>{if(o.isMesh&&!wristMaterial)wristMaterial=Array.isArray(o.material)?o.material[0]:o.material;});
 const forearm=new THREE.Mesh(new THREE.CylinderGeometry(.105,.16,1,28),wristMaterial);forearm.visible=false;scene.add(forearm);
 let tipMat=null;hand.getObjectByName('fingertips').traverse(o=>{if(o.isMesh&&!tipMat)tipMat=Array.isArray(o.material)?o.material[0]:o.material;});const thumb=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.15,8,18),tipMat);thumb.rotation.z=-.3;scene.add(thumb);
 // Show only palm-facing fingertips curling around the left edge.
 holder.visible=false;thumb.visible=false;
 const tips=new THREE.Group();scene.add(tips);
 for(let i=0;i<4;i++){const tip=new THREE.Mesh(new THREE.CapsuleGeometry(.048,.095,8,18),tipMat);tip.rotation.z=Math.PI/2;tip.rotation.y=Math.PI;tip.userData.finger=i;tips.add(tip);}
 holder.rotation.set(.1,.25,.8);holder.scale.setScalar(4.8);
 function draw(){if(!phone.isConnected)return;const w=phone.offsetWidth,h=phone.offsetHeight,extra=w*.65,cw=w+extra*2,ch=h+w*.65;renderer.setSize(cw,ch,false);renderer.domElement.style.width=cw+'px';renderer.domElement.style.height=ch+'px';renderer.domElement.style.left=-extra+'px';renderer.domElement.style.top='0px';camera.left=-cw/w/2;camera.right=cw/w/2;camera.top=ch/w/2;camera.bottom=-ch/w/2;camera.updateProjectionMatrix();const py=(ch/2-h/2)/w;mask.scale.set(.94,h/w,1);mask.position.set(.03,py,2);holder.position.set(-.24,py-h/w/2+.42,-.32);thumb.position.set(.49,py-h/w*.25,2.2);tips.children.forEach((tip,i)=>tip.position.set(-.49,py+.25-i*.16,2.12));holder.updateMatrixWorld(true);const anchor=new THREE.Box3().setFromObject(wrist).getCenter(new THREE.Vector3());const end=new THREE.Vector3(1.25,py-h/w/2-.85,anchor.z-.08);const direction=end.clone().sub(anchor);forearm.position.copy(anchor).add(end).multiplyScalar(.5);forearm.scale.y=direction.length();forearm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());renderer.render(scene,camera);}
 const resize=new ResizeObserver(draw);resize.observe(phone);draw();phone.dataset.handSections=JSON.stringify(profile.sections);phone.dataset.handReady='true';
 const removal=new MutationObserver(()=>{if(!phone.isConnected){resize.disconnect();removal.disconnect();rig.dispose();renderer.dispose();}});removal.observe(document.body,{childList:true,subtree:true});
 return {draw,holder,hand,renderer,camera,scene,mask};
}



