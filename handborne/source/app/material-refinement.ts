import * as T from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type CoachReliefBudget={remainingTriangles:number;usedTriangles:number;perMeshAddedTriangles:number;perMeshVertices:number};
// Budgets count added triangles per coach, and total final positions per mesh.
export const createCoachReliefBudget=(limit=240_000,perMeshAddedTriangles=64_000,perMeshVertices=32_000):CoachReliefBudget=>({remainingTriangles:limit,usedTriangles:0,perMeshAddedTriangles,perMeshVertices});
const isFloat16=(a:{array:ArrayLike<number>;isFloat16BufferAttribute?:boolean})=>!!a.isFloat16BufferAttribute||(()=>{const Float16=(globalThis as any).Float16Array;return !!Float16&&a.array instanceof Float16;})();

function component(a:T.BufferAttribute|T.InterleavedBufferAttribute,i:number,c:number){
 if(c===0)return a.getX(i);if(c===1)return a.getY(i);if(c===2)return a.getZ(i);if(c===3)return a.getW(i);
 return a.array[i*a.itemSize+c];
}
function write(a:T.BufferAttribute,i:number,c:number,v:number){
 if(c===0)a.setX(i,v);else if(c===1)a.setY(i,v);else if(c===2)a.setZ(i,v);else if(c===3)a.setW(i,v);else a.array[i*a.itemSize+c]=v;
}
function normalizeAttribute(a:T.BufferAttribute,i:number){
 if(a.itemSize<3)return;
 const x=a.getX(i),y=a.getY(i),z=a.getZ(i),length=Math.hypot(x,y,z);if(length<1e-12)return;
 a.setXYZ(i,x/length,y/length,z/length);
}

/** One linear triangle split. It preserves silhouette, UVs, authored normals and vertex attributes. */
function split(source:T.BufferGeometry,maxVertices:number):T.BufferGeometry|undefined{
 const index=source.index;if(!index||index.count%3)return undefined;
 const edgeIds=new Map<string,number>(),edges:Array<[number,number]>=[],indices:number[]=[];
 const midpoint=(a:number,b:number)=>{
  const lo=Math.min(a,b),hi=Math.max(a,b),key=lo+':'+hi,old=edgeIds.get(key);if(old!==undefined)return old;
  const id=source.attributes.position.count+edges.length;edgeIds.set(key,id);edges.push([lo,hi]);return id;
 };
 const groups=source.groups.length?source.groups:[{start:0,count:index.count,materialIndex:0}],nextGroups:{start:number;count:number;materialIndex:number}[]=[];
 for(const group of groups){
  const start=indices.length,end=Math.min(index.count,group.start+group.count);
  for(let j=group.start;j+2<end;j+=3){const a=index.getX(j),b=index.getX(j+1),c=index.getX(j+2),ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);
   indices.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
  }
  if(indices.length>start)nextGroups.push({start,count:indices.length-start,materialIndex:group.materialIndex??0});
 }
 if(!edges.length||source.attributes.position.count+edges.length>maxVertices)return undefined;
 const out=source.clone();
 for(const [name,attribute]of Object.entries(source.attributes)){
  if((attribute as T.InterleavedBufferAttribute).isInterleavedBufferAttribute||isFloat16(attribute))return undefined;
  const count=attribute.count+edges.length,array=new (attribute.array.constructor as any)(count*attribute.itemSize);array.set(attribute.array);
  const target=new T.BufferAttribute(array,attribute.itemSize,attribute.normalized);target.name=attribute.name;target.setUsage((attribute as T.BufferAttribute).usage);target.gpuType=(attribute as T.BufferAttribute).gpuType;
  for(let e=0;e<edges.length;e++){const [a,b]=edges[e],dst=attribute.count+e;
   for(let c=0;c<attribute.itemSize;c++)write(target,dst,c,(component(attribute,a,c)+component(attribute,b,c))*.5);
   if(name==='normal'||name==='tangent')normalizeAttribute(target,dst);
  }
  out.setAttribute(name,target);
 }
 out.setIndex(indices);out.clearGroups();for(const group of nextGroups)out.addGroup(group.start,group.count,group.materialIndex);
 out.morphAttributes=source.morphAttributes;out.morphTargetsRelative=source.morphTargetsRelative;out.userData={...source.userData};
 return out;
}

/** Refine only bounded static roster geometry; unknown animated/morph geometry safely stays untouched. */
export function refineCoachGeometry(source:T.BufferGeometry,budget:CoachReliefBudget,worldScale=1):{geometry:T.BufferGeometry;addedTriangles:number;addedVertices:number;levels:number}|undefined{
 if(!budget||budget.remainingTriangles<=0||Object.values(source.morphAttributes).some(attributes=>attributes.length)||source.attributes.skinIndex||source.attributes.skinWeight)return undefined;
 if(source.drawRange.start!==0||(source.index&&source.drawRange.count<source.index.count))return undefined;
 for(const attribute of Object.values(source.attributes))if((attribute as T.InterleavedBufferAttribute).isInterleavedBufferAttribute||isFloat16(attribute))return undefined;
 let working=source.clone();
 if(!working.index){const merged=mergeVertices(working);working.dispose();working=merged;}
 if(!working.index||working.index.count%3){working.dispose();return undefined;}
 if(!working.attributes.normal)working.computeVertexNormals();
 const triangles=working.index.count/3;
 // Estimate a 90th-percentile edge so tiny existing triangles stay untouched while broad facets
 // receive enough linear splits to reach roughly .025 world units. The total remains tightly capped.
 if(triangles>10_000){working.dispose();return undefined;}
 const positions=working.attributes.position,edges:number[]=[];for(let j=0;j<working.index.count;j+=3){const a=working.index.getX(j),b=working.index.getX(j+1),c=working.index.getX(j+2);for(const [u,v]of [[a,b],[b,c],[c,a]])edges.push(Math.hypot(positions.getX(u)-positions.getX(v),positions.getY(u)-positions.getY(v),positions.getZ(u)-positions.getZ(v))*worldScale);}
 edges.sort((a,b)=>a-b);const p90=edges[Math.floor((edges.length-1)*.9)]??0,desired=Math.min(5,Math.max(0,Math.ceil(Math.log2(p90/.025))));
 if(!desired){working.dispose();return undefined;}
 const initial=working.attributes.position.count,initialTriangles=triangles;let levels=0;
 for(let level=0;level<desired;level++){
  const currentTriangles=working.index!.count/3,nextTriangles=currentTriangles*4,cumulativeAdded=nextTriangles-initialTriangles;
  if(cumulativeAdded>budget.remainingTriangles||cumulativeAdded>budget.perMeshAddedTriangles||nextTriangles>64_000)break;
  const next=split(working,budget.perMeshVertices);if(!next)break;
  working.dispose();working=next;levels++;
 }
 const addedTriangles=working.index!.count/3-initialTriangles,addedVertices=working.attributes.position.count-initial;
 if(!levels){working.dispose();return undefined;}
 budget.remainingTriangles-=addedTriangles;budget.usedTriangles+=addedTriangles;
 working.userData={...working.userData,coachRelief:{addedTriangles,addedVertices,levels,originalVertices:initial}};
 return {geometry:working,addedTriangles,addedVertices,levels};
}

/** Optional alternate-coach quality path for the original imported material (no recolouring). */
export function refineCoachMesh(mesh:T.Mesh,budget:CoachReliefBudget){
 if(Array.isArray(mesh.material)||(mesh as T.SkinnedMesh).isSkinnedMesh||mesh.geometry.attributes.skinIndex||mesh.geometry.attributes.skinWeight||Object.values(mesh.geometry.morphAttributes).some(attributes=>attributes.length))return undefined;
 mesh.updateWorldMatrix(true,false);const result=refineCoachGeometry(mesh.geometry,budget,mesh.matrixWorld.getMaxScaleOnAxis());if(!result)return undefined;
 const previous=mesh.geometry;mesh.geometry=result.geometry;if(mesh.userData.ownedGeometry)previous.dispose();mesh.userData.ownedGeometry=true;
 return {addedTriangles:result.addedTriangles,addedVertices:result.addedVertices,levels:result.levels};
}
