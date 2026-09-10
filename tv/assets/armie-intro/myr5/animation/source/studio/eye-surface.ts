import * as THREE from 'three';
export const EYE_CENTER=new THREE.Vector3(0,2.1575,.55);
export const LID_RADIUS=.619;
const originals=new WeakMap<THREE.Mesh,{source:THREE.BufferGeometry;projected:THREE.BufferGeometry}>();
function subdivideSurface(source:THREE.BufferGeometry){
 const flat=source.index?source.toNonIndexed():source.clone();const positions=flat.getAttribute('position');const vertices:number[]=[];
 const split=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,depth:number)=>{
  if(depth<6&&Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a))>.04){const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5);split(a,ab,ca,depth+1);split(ab,b,bc,depth+1);split(ca,bc,c,depth+1);split(ab,bc,ca,depth+1);}else vertices.push(...a.toArray(),...b.toArray(),...c.toArray());
 };
 for(let i=0;i<positions.count;i+=3)split(new THREE.Vector3().fromBufferAttribute(positions,i),new THREE.Vector3().fromBufferAttribute(positions,i+1),new THREE.Vector3().fromBufferAttribute(positions,i+2),0);
 flat.dispose();const dense=new THREE.BufferGeometry();dense.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));return dense;
}
export function prepareEyeMesh(o:THREE.Mesh){
 if(o.name==='Iris'){
  o.geometry.dispose();o.geometry=new THREE.CircleGeometry(.375,128);o.geometry.scale(1, .395/.375,1);o.position.set(.04,2.1475,1.133);
 }else if(o.name==='Glint'||o.name==='Small_glint'||o.name==='Small glint'){
  const small=o.name!=='Glint';o.geometry.dispose();o.geometry=new THREE.CircleGeometry(small?.024:.063,32);o.geometry.scale(1,small?.028/.024:.081/.063,1);o.position.y-=.4725;
 }
}
// A geometric mask keeps eye markings on the globe and inside the eyelid.
// Actual surface geometry also preserves occlusion in GLB and OBJ exports.
export function conformEyeMesh(o:THREE.Mesh){
 if(!/^(Iris|Pupil|Glint|Small.glint)/.test(o.name))return;
 let entry=originals.get(o);
 if(!entry||entry.projected!==o.geometry){entry?.source.dispose();entry={source:subdivideSurface(o.geometry),projected:o.geometry};originals.set(o,entry);}
 const geometry=entry.source.clone();const positions=geometry.getAttribute('position');const point=new THREE.Vector3();o.updateMatrix();const inverse=o.matrix.clone().invert();const localNormalMatrix=new THREE.Matrix3().setFromMatrix4(o.matrix).transpose();const normal=new THREE.Vector3();const normals=new Float32Array(positions.count*3);
 const radius=o.name==='Pupil'?.609:/glint/i.test(o.name)?.611:o.name==='Iris'?.606:.6075;
 for(let i=0;i<positions.count;i++){
  point.fromBufferAttribute(positions,i).applyMatrix4(o.matrix);
  let x=point.x-EYE_CENTER.x,y=point.y-EYE_CENTER.y;const distance=Math.hypot(x,y),limit=.595;
  if(distance>limit){x*=limit/distance;y*=limit/distance;}
  point.set(EYE_CENTER.x+x,EYE_CENTER.y+y,EYE_CENTER.z+Math.sqrt(radius*radius-x*x-y*y));normal.copy(point).sub(EYE_CENTER).normalize().applyMatrix3(localNormalMatrix).normalize();normal.toArray(normals,i*3);point.applyMatrix4(inverse);
  positions.setXYZ(i,point.x,point.y,point.z);
 }
 geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.computeBoundingBox();geometry.computeBoundingSphere();o.geometry.dispose();o.geometry=geometry;entry.projected=geometry;
}
