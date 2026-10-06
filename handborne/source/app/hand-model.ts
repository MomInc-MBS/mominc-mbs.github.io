import * as THREE from 'three';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {REGIONS,STYLES,styleFor} from './catalog';
import {recipeCode,type Selection} from './recipe';
import {replaceNailShape} from './nails';
import {addHandScales} from './scales';
import {sculptMaterial,growMaterial} from './material-language';
const files=new Map<number,Promise<GLTF>>();
function family(id:number) {
  id=id>=30?(id===57||id===58||id===61||id===63||id===74?21:id===59||id===62?14:0):id;
  if(!files.has(id)) files.set(id,new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/handborne/models/family-'+String(id).padStart(2,'0')+'.glb?v=5').catch(error=>{files.delete(id);throw error;}));
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
    part.userData={...part.userData,region:r.id,style:styleFor(selection[r.id]).name,style_id:selection[r.id]};
    part.updateMatrixWorld(true);
    part.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.userData.region=r.id;obj.castShadow=true;obj.receiveShadow=true;
      if(selection[r.id]===20){const old=obj.material as THREE.MeshStandardMaterial,m=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(m,old);m.sheen=1;m.sheenRoughness=.9;m.sheenColor.set('#ffe5c9');obj.material=m;obj.userData.ownedMaterial=true;}
      else sculptMaterial(obj,styleFor(selection[r.id]),.075);
    }});
    part.add(growMaterial(part as THREE.Group,styleFor(selection[r.id]),r.id,.075,1,true));
    return part;
  }));
  group.add(...parts);addHandScales(group,scalePattern);return group;
}
