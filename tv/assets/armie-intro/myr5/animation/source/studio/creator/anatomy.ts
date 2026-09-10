import * as THREE from 'three';
import {EYE_LAYOUTS,type EyeLayout} from './eye-layouts';
import {EYE_CENTER} from './eye-surface';
export function arrangeEyes(template:THREE.Group,layout:EyeLayout){
 const group=new THREE.Group();group.name='Eye arrangement';
 for(const [i,[x,y,z,r,yaw]] of EYE_LAYOUTS[layout].eyes.entries()){
  const instance=new THREE.Group();instance.name='Eye '+(i+1);instance.position.set(x,y,z);instance.rotation.y=THREE.MathUtils.degToRad(yaw);instance.scale.setScalar(r/.605);
  const content=template.clone(true);content.visible=true;content.position.copy(EYE_CENTER).negate();instance.add(content);group.add(instance);
 }
 return group;
}
