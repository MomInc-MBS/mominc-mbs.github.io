import * as T from 'three';
import type {Region} from './design';

export function regionBounds(root:T.Object3D,region:Region){
 const bounds=new T.Box3();root.updateMatrixWorld(true);
 function visit(node:T.Object3D){
  if(!node.visible)return;
  if(node instanceof T.Mesh&&node.userData.region===region){
   node.geometry.computeBoundingBox();
   if(node.geometry.boundingBox)bounds.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));
  }
  node.children.forEach(visit);
 }
 visit(root);return bounds;
}

export function frameRegion(camera:T.PerspectiveCamera,orbit:{target:T.Vector3;minDistance:number;maxDistance:number;update:()=>void},bounds:T.Box3,padding=1.2){
 if(bounds.isEmpty())return false;
 const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const halfFov=T.MathUtils.degToRad(camera.fov/2);
 const distance=Math.max(size.y/(2*Math.tan(halfFov)),size.x/(2*Math.tan(halfFov)*Math.max(.25,camera.aspect)))*padding+size.z/2;
 orbit.minDistance=Math.min(.7,distance*.5);orbit.maxDistance=Math.max(14,distance*2);
 orbit.target.copy(center);camera.position.copy(center).add(new T.Vector3(0,0,Math.max(1,distance)));orbit.update();return true;
}
