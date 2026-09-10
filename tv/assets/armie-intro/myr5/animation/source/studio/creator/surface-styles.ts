import * as THREE from 'three';
import {STYLES,type Region} from './design';
const source=new WeakMap<THREE.Mesh,THREE.BufferGeometry>();
const cache=new WeakMap<THREE.Mesh,string>();
function noise(x:number,y:number,z:number){return Math.sin(x*7.7+Math.sin(z*5.3))*Math.cos(y*8.1-z*2.7)*.55+Math.sin(x*23+y*17+z*13)*.25+Math.sin(x*51-y*39+z*29)*.12;}
export function applySurfaceStyle(mesh:THREE.Mesh,id:number,region:Region,amount=1){
 if(region==='eye'||/Silky|Iris|Pupil|Glint/.test(mesh.name))return;
 if(cache.get(mesh)===id+':'+amount)return;
 if(!source.has(mesh))source.set(mesh,mesh.geometry.clone());
 const base=source.get(mesh)!;const g=base.clone(),p=g.getAttribute('position'),n=base.getAttribute('normal');const colors=new Float32Array(p.count*3);const v=new THREE.Vector3(),normal=new THREE.Vector3();mesh.updateMatrix();const inverse=mesh.matrix.clone().invert(),normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrix);const palette=STYLES[id];
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(base.getAttribute('position'),i).applyMatrix4(mesh.matrix);normal.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();
  const {x,y,z}=v;const coarse=noise(x*1.3,y*1.3,z*1.3),fine=noise(x*4,y*4,z*4);let d=0,shade=1;
  if(id){
   const wave=Math.sin(y*38+Math.sin(x*15+z*11)*2),vein=Math.pow(1-Math.abs(Math.sin(x*11+z*9+Math.sin(y*10))),7);
   switch(palette.detail){
    case 'vine':d=.018*coarse+.04*vein;break;
    case 'caps':d=.035*Math.max(0,coarse)+.009*fine;break;
    case 'plates':d=.021*Math.pow(Math.max(0,wave+coarse*.5),.7)+.006*fine;break;
    case 'scales':d=.027*Math.pow(Math.max(0,Math.sin(y*45)*Math.cos(x*39+z*33)),.65);break;
    case 'bone':d=.028*wave+.012*coarse;break;
    case 'rock':case 'magma':d=.048*coarse+.015*fine;break;
    case 'crystal':case 'ice':d=.021*Math.round(coarse*5)/5+.005*fine;break;
    case 'gears':d=.014*Math.sign(wave)+.012*vein;break;
    case 'neon':case 'storm':d=.012*vein;break;
    default:d=.02*coarse+.01*fine;
   }
   if(region==='arms'||region==='feet')d*=.45;
   shade=Math.max(.55,Math.min(1.2,.86+coarse*.24+fine*.12+vein*.13));
  }
  // Preserve each carved socket's smooth boundary when applying skin relief.
  for(const [sx,sy,sz,r] of mesh.userData.eyeSockets??[]){const distance=Math.hypot(x-sx,y-sy,z-sz);d*=THREE.MathUtils.smoothstep(distance,r*1.12,r*1.45);}
  v.addScaledVector(normal,d*amount).applyMatrix4(inverse);p.setXYZ(i,v.x,v.y,v.z);colors[i*3]=shade;colors[i*3+1]=shade*(1-.04*Math.max(0,coarse));colors[i*3+2]=shade;
 }
 if(id)g.setAttribute('color',new THREE.BufferAttribute(colors,3));else g.deleteAttribute('color');
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();mesh.geometry.dispose();mesh.geometry=g;const m=mesh.material as THREE.MeshStandardMaterial;m.vertexColors=id!==0;m.needsUpdate=true;cache.set(mesh,id+':'+amount);
}
// Grow branching / crystalline detail out of real surface triangles, in region coordinates.
export function growSurfaceDetails(group:THREE.Group,id:number,region:Region,hologram:boolean,detailSize=1){
 const result=new THREE.Group();result.name='ornaments_'+region;
 if(![1,2,5,6,9,12,14,16].includes(id)||region==='eye'||region==='collar')return result;
 const meshes:THREE.Mesh[]=[];group.traverseVisible(o=>{if(o instanceof THREE.Mesh&&!/scale/i.test(o.name))meshes.push(o);});
 let seed=id*9049+region.length*371;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const style=STYLES[id],amount=region==='head'?26:region==='body'?18:9;
 const triangles:{a:THREE.Vector3;b:THREE.Vector3;c:THREE.Vector3;area:number}[]=[];let total=0;
 group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert();
 for(const mesh of meshes){const g=mesh.geometry,p=g.attributes.position,ix=g.index,matrix=inverse.clone().multiply(mesh.matrixWorld);for(let j=0;j<(ix?ix.count:p.count);j+=3){const ids=[0,1,2].map(k=>ix?ix.getX(j+k):j+k);const [a,b,c]=ids.map(k=>new THREE.Vector3().fromBufferAttribute(p,k).applyMatrix4(matrix));const area=b.clone().sub(a).cross(c.clone().sub(a)).length()*.5;if(area>1e-9){total+=area;triangles.push({a,b,c,area:total});}}}
 if(!triangles.length)return result;
 for(let k=0;k<amount;k++){
  const pick=rand()*total;let lo=0,hi=triangles.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid].area<pick)lo=mid+1;else hi=mid;}const {a,b,c}=triangles[lo];const u=Math.sqrt(rand()),v=rand(),anchor=a.clone().multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v);const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  // Keep the eye opening clear and avoid outgrowths on the soles.
  if(region==='head'&&meshes.some(m=>(m.userData.eyeSockets??[]).some(([x,y,z,r]:number[])=>anchor.distanceTo(new THREE.Vector3(x,y,z))<r*1.5)))continue;
  if(region==='head'&&anchor.z>.15&&anchor.y<2.8)continue;if(region==='feet'&&anchor.y<.15)continue;
  const height=detailSize*(.045+Math.pow(rand(),2)*.22)*(region==='arms'||region==='feet'?.45:1),radius=detailSize*([14,16].includes(id)?(.033+rand()*.05):(.018+rand()*.035));const angle=rand()*6.28;const tangent=new THREE.Vector3(Math.cos(angle),Math.sin(angle),.3).projectOnPlane(normal).normalize();
  const points=[];for(let j=0;j<6;j++){const t=j/5;points.push(anchor.clone().addScaledVector(normal,-.012+height*t).addScaledVector(tangent,Math.sin(t*1.8)*height*.32));}
  const curve=new THREE.CatmullRomCurve3(points);const geo=new THREE.TubeGeometry(curve,12,radius,[14,16].includes(id)?5:8,false);const pos=geo.attributes.position;
  for(let j=0;j<=12;j++){const t=j/12,center=curve.getPointAt(t);let taper=Math.pow(1-t,.65)+.025;if([14,16].includes(id))taper=t<.62?.85:Math.max(.015,(1-t)/.38*.85);if(id===2)taper=.45+1.4*Math.exp(-Math.pow((t-.72)/.22,2));if(id===6)taper=.7+.23*Math.sin(t*17);for(let r=0;r<=geo.parameters.radialSegments;r++){const index=j*(geo.parameters.radialSegments+1)+r;const q=new THREE.Vector3().fromBufferAttribute(pos,index).sub(center).multiplyScalar(taper).add(center);pos.setXYZ(index,q.x,q.y,q.z);}}
  geo.computeVertexNormals();const color=new THREE.Color(style.primary).lerp(new THREE.Color(style.accent),.2+rand()*.7);const mat=new THREE.MeshStandardMaterial({color:hologram?'#dac494':color,roughness:style.roughness,metalness:style.metalness,emissive:hologram?'#78568d':style.emissive,emissiveIntensity:.18});const growth=new THREE.Mesh(geo,mat);growth.userData.region=region;growth.userData.surfaceRoot=anchor.toArray();result.add(growth);
 }
 return result;
}
