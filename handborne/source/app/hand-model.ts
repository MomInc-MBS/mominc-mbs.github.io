import * as THREE from 'three';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {REGIONS,STYLES} from './catalog';
import {recipeCode,type Selection} from './recipe';
import {replaceNailShape} from './nails';
import {addHandScales} from './scales';
const files=new Map<number,Promise<GLTF>>();
function family(id:number) {
  if(!files.has(id)) files.set(id,new GLTFLoader().loadAsync('/handborne/models/family-'+String(id).padStart(2,'0')+'.glb?v=5').catch(error=>{files.delete(id);throw error;}));
  return files.get(id)!;
}
export async function assemble(selection:Selection,nailShape:string,scalePattern='none') {
  const group=new THREE.Group();group.name='Handborne_Creature';
  group.userData={recipe:recipeCode(selection),units:'metres',fingers:5};
  const parts=await Promise.all(REGIONS.map(async r=>{
    const gltf=await family(selection[r.id]);
    const source=gltf.scene.getObjectByName(r.id);
    if(!source)throw new Error('Missing '+r.label+' module');
    const part=source.clone(true);part.name=r.id;
    if(r.id==='nails')replaceNailShape(part,nailShape,selection.nails);
    part.userData={...part.userData,region:r.id,style:STYLES[selection[r.id]].name,style_id:selection[r.id]};
    part.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.userData.region=r.id;obj.castShadow=true;obj.receiveShadow=true;}});
    return part;
  }));
  group.add(...parts);addHandScales(group,scalePattern);return group;
}
