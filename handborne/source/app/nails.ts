import * as THREE from 'three';
import shapes from './nail-shapes.json' with {type:'json'};
import { DIGITS, type Digit } from './poses.ts';
import { REST_SOURCE, DIGIT_RADII, BABY_RIG_SCALE } from './pose-rig.ts';
export const NAIL_SHAPES=shapes;
export const DEFAULT_NAIL_SHAPE='family';
export function validateNailShape(value:unknown):string {
  if(value===DEFAULT_NAIL_SHAPE||shapes.some(s=>s.id===value))return value as string;
  throw new Error('Choose a valid nail shape.');
}
function curve(digit:Digit,t:number){
  const points=REST_SOURCE[digit].map(([x,y,z])=>new THREE.Vector3(x,z,-y));
  const u=Math.min(t*3,3-1e-8),i=Math.floor(u),a=u-i;
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(3,i+2)];
  return p1.clone().multiplyScalar(2).addScaledVector(p0,-a+2*a*a-a*a*a).addScaledVector(p1,-5*a*a+3*a*a*a).addScaledVector(p2,a+4*a*a-3*a*a*a).addScaledVector(p3,-a*a+a*a*a).multiplyScalar(.5);
}
export function nailGeometry(digit:Digit,shapeId:string,styleId:number){
  const shape=shapes.find(s=>s.id===shapeId);if(!shape)throw new Error('Unknown nail shape');
  const positions:number[]=[],uv:number[]=[],indices:number[]=[],rings=24,sides=20,row=sides+1,layer=(rings+1)*row;
  const radius=DIGIT_RADII[DIGITS.indexOf(digit)];
  for(let bottom=0;bottom<2;bottom++)for(let j=0;j<=rings;j++){
    const u=j/rings,t=.78+u*.195,p=curve(digit,t),tangent=curve(digit,t+.002).sub(curve(digit,t-.002)).normalize();
    const dorsal=new THREE.Vector3(0,0,1);dorsal.addScaledVector(tangent,-dorsal.dot(tangent)).normalize();
    const side=tangent.clone().cross(dorsal).normalize();
    const growth=Math.max(0,(u-.32)/.68),width=radius*.72*shape.width*(.8+.2*Math.sin(Math.PI*u))*(1-(1-shape.tip)*Math.pow(u,shape.taper));
    p.addScaledVector(tangent,shape.extension*growth*growth).addScaledVector(dorsal,-shape.curve*Math.pow(growth,3));
    for(let k=0;k<=sides;k++){
      const v=k/sides*2-1;
      const ridge=styleId===0?0:.00022*Math.sin(v*Math.PI*(3+styleId%5))*Math.sin(Math.PI*u);
      const point=p.clone().addScaledVector(side,width*v).addScaledVector(dorsal,radius*(1-.31*t)*(.87-.18*v*v)+.00055-bottom*.0007+ridge);
      positions.push(point.x,point.y,point.z);uv.push(k/sides,u);
    }
  }
  const quad=(a:number,b:number,c:number,d:number)=>indices.push(a,b,c,a,c,d);
  for(let j=0;j<rings;j++)for(let k=0;k<sides;k++){
    const a=j*row+k;quad(a,a+1,a+row+1,a+row);quad(a+layer,a+row+layer,a+row+1+layer,a+1+layer);
  }
  for(let j=0;j<rings;j++){
    const a=j*row,b=a+sides;quad(a,a+row,a+row+layer,a+layer);quad(b,b+layer,b+row+layer,b+row);
  }
  for(let k=0;k<sides;k++){quad(k,k+layer,k+1+layer,k+1);const a=rings*row+k;quad(a,a+1,a+1+layer,a+layer);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  if(styleId===22)geometry.scale(BABY_RIG_SCALE.x,BABY_RIG_SCALE.y,BABY_RIG_SCALE.z);
  return geometry;
}
export function replaceNailShape(part:THREE.Object3D,shapeId:string,styleId:number){
  validateNailShape(shapeId);if(shapeId===DEFAULT_NAIL_SHAPE)return;
  const materials=new Map<Digit,THREE.Material|THREE.Material[]>();
  part.traverse(obj=>{if(obj instanceof THREE.Mesh&&obj.userData.digit&&obj.userData.source_part?.endsWith('_claw'))materials.set(obj.userData.digit,obj.material);});
  part.clear();
  for(const digit of DIGITS){
    const material=materials.get(digit);if(!material)throw new Error('Missing nail material for '+digit);
    const mesh=new THREE.Mesh(nailGeometry(digit,shapeId,styleId),material);
    mesh.name=digit+'_'+shapeId;mesh.userData={region:'nails',digit,source_part:digit+'_claw',nail_shape:shapeId,ownedGeometry:true,...(styleId===22?{rig_profile:'baby'}:{})};mesh.castShadow=true;mesh.receiveShadow=true;part.add(mesh);
  }
}
