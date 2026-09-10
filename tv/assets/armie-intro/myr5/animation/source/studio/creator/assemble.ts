import {arrangeEyes} from './anatomy';
import {EYE_LAYOUTS} from './eye-layouts';
import {pupilGeometry} from './pupils';
import {getCoach} from './coaching';
import {prepareEyeMesh,conformEyeMesh} from './eye-surface';
import {sculptMaterial,growMaterial} from './material-language';
import {boneSockets,skeletalStructure,materialCollar,robotStructure} from './skeletal-anatomy';

import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {REGIONS,STYLES,type Region,type Design} from './design';
import {deformMesh} from './deform';

// Adapted from the existing MYR5 AlienViewer. The app and editor use this assembly.
const modelBuffers=new Map<string,Promise<ArrayBuffer>>();
function bytes(url:string){if(!modelBuffers.has(url))modelBuffers.set(url,fetch(url).then(response=>{if(!response.ok)throw Error('Creature model is unavailable.');return response.arrayBuffer();}).catch(error=>{modelBuffers.delete(url);throw error;}));return modelBuffers.get(url)!;}
export async function assembleCreature(d:Design,assetBase:string){
 const loader=new GLTFLoader();
 const [gltf,anatomy,hands]=await Promise.all(['myr5','anatomy','hands-v2'].map(async name=>loader.parseAsync(await bytes(assetBase+'models/'+name+'.glb'),assetBase+'models/')));
 const root=new THREE.Group(),details=new THREE.Group();details.name='Style ornaments';root.add(details);
 const materials:THREE.MeshStandardMaterial[]=[];
    const regions={} as Record<Region,THREE.Group>;
   for(const region of REGIONS){const source=gltf.scene.getObjectByName(region);if(!source){throw Error('A creature section could not load.');}const wrapper=new THREE.Group();wrapper.name=region;root.add(wrapper);wrapper.add(source);regions[region]=wrapper;wrapper.traverse(o=>{if(o instanceof THREE.Mesh){if(region==='eye')prepareEyeMesh(o);o.userData.region=region;o.userData.basePosition=o.position.clone();o.userData.baseScale=o.scale.clone();o.material=(o.material as THREE.MeshStandardMaterial).clone();const m=o.material as THREE.MeshStandardMaterial;m.userData={baseColor:m.color.clone(),baseRough:m.roughness,baseMetal:m.metalness,name:m.name};materials.push(m);}});}
   const lid=new THREE.Mesh(new THREE.SphereGeometry(.619,48,24,0,Math.PI*2,0,.57),new THREE.MeshStandardMaterial({color:STYLES[0].primary,roughness:.58}));lid.position.set(0,2.1575,.55);lid.name='Expression eyelid';lid.userData.region='eye';const eyeTemplate=regions.eye.children[0] as THREE.Group;eyeTemplate.add(lid);
   const variants=new Map<string,THREE.Object3D>();variants.set('head_single',regions.head.children[0]);variants.set('original_arms',regions.arms.children[0]);variants.set('original_feet',regions.feet.children[0]);
   for(const object of [...anatomy.scene.children].filter(o=>!o.name.startsWith('arms_')).concat([...hands.scene.children])){const region=object.name.split('_')[0] as Region;object.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.region=region;o.userData.basePosition=o.position.clone();o.userData.baseScale=o.scale.clone();o.material=(o.material as THREE.MeshStandardMaterial).clone();const m=o.material as THREE.MeshStandardMaterial;m.userData={baseColor:m.color.clone(),baseRough:m.roughness,baseMetal:m.metalness,name:m.name};}});object.removeFromParent();variants.set(object.name,object);}

 const e={root,regions,details,lid,materials,variants,eyeTemplate,eyeCopies:null as THREE.Group|null};
 const hologram=false,parts=false;
   if(e.eyeCopies){e.regions.eye.remove(e.eyeCopies);e.eyeCopies=null;}e.eyeTemplate.visible=true;
  for(const [region,key] of [['head','head_'+d.eyeLayout],['arms','arms_'+d.fingers],['feet','feet_'+d.toes]] as const){const variant=e.variants.get(key);if(variant&&e.regions[region].children[0]!==variant){e.regions[region].clear();e.regions[region].add(variant);}if(region==='head')variant?.traverse(o=>{o.userData.eyeSockets=EYE_LAYOUTS[d.eyeLayout].eyes;});}
  for(const region of REGIONS){const style=STYLES[d.styles[region]],group=e.regions[region];
   group.position.set(0,0,0);if(parts){const offsets:Record<Region,number[]>={head:[0,.65,0],eye:[0,.18,1.0],collar:[0,-.1,0],body:[0,-.45,0],arms:[.45,0,0],feet:[0,-.65,0]};group.position.fromArray(offsets[region]);}
   group.traverse(o=>{if(!(o instanceof THREE.Mesh)||o===e.lid)return;const m=o.material as THREE.MeshStandardMaterial;const base=m.userData.baseColor as THREE.Color;const name=m.userData.name as string;const fixed=['Eye ivory','Pupil','Eye glint'].includes(name);
    m.color.copy(base);m.emissive.set(0);m.metalness=m.userData.baseMetal;m.roughness=m.userData.baseRough;m.transparent=false;m.opacity=1;m.depthWrite=true;
    if(d.styles[region]!==0&&!fixed){m.color.set(name==='Lilac hair'||name==='Raised scales'?style.accent:style.primary);if(name==='Socket shadow'||name==='Body velvet')m.color.multiplyScalar(.43);m.roughness=style.roughness;m.metalness=style.metalness;m.emissive.set(style.emissive).multiplyScalar(.25);}
    if(hologram){m.color.set(fixed&&name==='Pupil'?'#261336':'#c9b0ea');m.emissive.set('#76518f');m.emissiveIntensity=.55;m.roughness=.25;m.metalness=.1;}
    if(o.name==='Pupil'&&o.userData.pupilType!==d.pupil){o.geometry.dispose();o.geometry=pupilGeometry(d.pupil);o.userData.basePosition=new THREE.Vector3(.04,2.1475,1.183);o.userData.baseScale=new THREE.Vector3(1,1,1);o.userData.pupilType=d.pupil;}
    if(o.name==='Iris'&&o.userData.irisType!==d.pupil){o.geometry.dispose();o.geometry=pupilGeometry(d.pupil);o.geometry.scale(1.48,1.48,1);o.userData.basePosition=new THREE.Vector3(.04,2.1475,1.133);o.userData.baseScale=new THREE.Vector3(1,1,1);o.userData.irisType=d.pupil;}
    if(/^Iris.fiber/.test(o.name))o.visible=d.pupil==='round';
    if(/^Crown.scale/.test(o.name))o.visible=d.styles[region]===0;
    deformMesh(o,region,d);if(region==='eye')conformEyeMesh(o);else if(o.visible&&style.id!==0)sculptMaterial(o,style,1,d.detail);
    if(o.name==='Iris'){const p=o.geometry.attributes.position,colors=new Float32Array(p.count*3);for(let j=0;j<p.count;j++){const a=Math.atan2(p.getY(j),p.getX(j)),r=Math.hypot(p.getX(j),p.getY(j));const shade=.78+.16*Math.sin(a*117+r*35)+.06*Math.cos(a*61);colors[j*3]=shade;colors[j*3+1]=shade;colors[j*3+2]=Math.min(1,shade+.07);}o.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));m.vertexColors=true;m.needsUpdate=true;}
   });
  }
  const cap=d.eye==='sleepy'?1.56:d.eye==='wide'?.30:.57;e.lid.geometry.dispose();e.lid.geometry=new THREE.SphereGeometry(.619,48,24,0,Math.PI*2,0,cap);(e.lid.material as THREE.MeshStandardMaterial).color.set(hologram?'#c9b0ea':STYLES[d.styles.head].primary);
  if(d.eyeLayout!=='single'){e.eyeCopies=arrangeEyes(e.eyeTemplate,d.eyeLayout);e.regions.eye.add(e.eyeCopies);e.eyeTemplate.visible=false;}
  const key=JSON.stringify([d.styles,d.detail,d.eyeLayout,d.fingers,d.toes,hologram,parts]);e.details.userData.key=key;
  e.details.children.slice().forEach(o=>{o.traverse(c=>{if(c instanceof THREE.Mesh){c.geometry.dispose();(c.material as THREE.Material).dispose();}});e.details.remove(o);});
  for(const region of REGIONS){
   const style=STYLES[d.styles[region]],original=e.regions[region];
   if(style.id===7&&region!=='head'&&region!=='eye'){original.visible=false;e.details.add(skeletalStructure(region,d));continue;}
   if(style.id===18&&['body','arms','feet'].includes(region)){original.visible=false;e.details.add(robotStructure(region,d));continue;}
   let surface=original;
   if(region==='collar'&&style.id!==0&&style.id!==20){original.visible=false;surface=materialCollar(style.id);e.details.add(surface);}
   e.details.add(growMaterial(surface,style,region,1,d.detail));
  }
  if(d.styles.head===7){e.regions.eye.visible=false;e.details.add(boneSockets(d));}
 // Retain unused variants for cleanup after geometry is baked into the animation rig.
 root.userData.recipe=JSON.parse(JSON.stringify(d));
 return {root,dispose(){const geometries=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();for(const object of [root,...variants.values(),gltf.scene,anatomy.scene,hands.scene])object.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
