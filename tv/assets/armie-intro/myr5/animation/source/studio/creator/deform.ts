import * as THREE from 'three';
import type {Design,Region} from './design';
export function deformMesh(o:THREE.Mesh,region:Region,d:Design){
 const position=o.userData.basePosition as THREE.Vector3,scale=o.userData.baseScale as THREE.Vector3;
 if(!position||!scale)return;
 o.position.copy(position);o.scale.copy(scale);
 // The GLB is already converted to Y up. Scale around each feature's center.
 if(o.name.startsWith('Silky_collar')||o.name.startsWith('Silky collar')){
  o.scale.x*=1+.2*(d.fur-1);o.scale.z*=1+.2*(d.fur-1);o.scale.y*=d.fur;o.position.y+=1.5175*(1-d.fur);
 }
 if(region==='eye'&&/Iris|Pupil|Glint|glint/.test(o.name)){
  const factor=d.iris*(o.name==='Pupil'?d.pupilSize:1);
  o.scale.x*=factor;o.scale.y*=factor;
  o.position.x=position.x*factor+.04*(1-factor);
  o.position.y=position.y*factor+2.1475*(1-factor);
 }
}
