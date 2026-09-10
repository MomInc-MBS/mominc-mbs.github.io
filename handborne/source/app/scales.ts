import * as THREE from 'three';
import { validateScalePattern, type ScalePattern } from './scale-patterns.ts';

type Point = [number,number];
const outlines:Record<Exclude<ScalePattern,'none'>,Point[]>={
  round:Array.from({length:12},(_,i)=>[Math.cos(i*Math.PI/6),Math.sin(i*Math.PI/6)*1.08]),
  diamond:[[0,1.25],[-.87,0],[0,-1.25],[.87,0]],
  hex:Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]),
  shield:[[0,1.35],[-.88,.30],[-.88,-.65],[-.55,-.95],[.55,-.95],[.88,-.65],[.88,.30]],
};

/** Sample a staggered lattice on each surface, then add real, separately rooted plates.
 * Source meshes and their shared geometry/materials are never modified.
 * The same routine is used for the live hand and its GLB/OBJ exports. */
export function addHandScales(group:THREE.Group,value:string='none') {
  const pattern=validateScalePattern(value);group.userData.scale_pattern=pattern;
  if(pattern==='none')return;
  group.updateMatrixWorld(true);
  const sources:THREE.Mesh[]=[];
  group.traverse(o=>{
    if(!(o instanceof THREE.Mesh)||o.userData.region==='nails'||o.userData.trapped_bubble||o.geometry.hasAttribute('_fur_root')||o.userData.surface_pattern)return;
    if(String(o.userData.source_part??'').endsWith('_sculpt')||o.userData.structure_piece)sources.push(o);
  });
  // One spatial hash across module boundaries avoids double-stamping their seams.
  const occupied=new Map<string,THREE.Vector3[]>(),cell=.0024;
  const accept=(p:THREE.Vector3,distance:number)=>{
    const x=Math.floor(p.x/cell),y=Math.floor(p.y/cell),z=Math.floor(p.z/cell),range=Math.ceil(distance/cell);
    for(let dx=-range;dx<=range;dx++)for(let dy=-range;dy<=range;dy++)for(let dz=-range;dz<=range;dz++){
      const near=occupied.get(`${x+dx},${y+dy},${z+dz}`);
      if(near?.some(other=>other.distanceToSquared(p)<distance*distance))return false;
    }
    const key=`${x},${y},${z}`;if(!occupied.has(key))occupied.set(key,[]);occupied.get(key)!.push(p.clone());return true;
  };
  for(const source of sources){
    if(!source.parent)continue;
    const geometry=source.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv'),index=geometry.index;
    if(!position||!normal)continue;
    const small=source.userData.rig_profile==='baby',spacing=small?.0031:.0056,rowHeight=spacing*.87;
    const radius=spacing*.49,height=spacing*(pattern==='round'?.15:pattern==='hex'?.20:pattern==='diamond'?.24:.28);
    const inverse=source.parent.matrixWorld.clone().invert(),worldNormal=new THREE.Matrix3().getNormalMatrix(source.matrixWorld);
    const vertices: number[]=[],roots:number[]=[],uvs:number[]=[],indices:number[]=[];
    const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),face=new THREE.Vector3(),edge=new THREE.Vector3();
    const point=new THREE.Vector3(),n=new THREE.Vector3(),na=new THREE.Vector3(),nb=new THREE.Vector3(),nc=new THREE.Vector3();
    const forward=new THREE.Vector3(),side=new THREE.Vector3(),v=new THREE.Vector3(),outline=outlines[pattern];
    let count=0;
    const stamp=(u:number,w:number)=>{
      // Project the finger-length direction onto the surface; fall back at end caps.
      forward.set(0,1,0).addScaledVector(n,-n.y);
      if(forward.lengthSq()<.05)forward.set(0,0,1).addScaledVector(n,-n.z);
      forward.normalize();side.crossVectors(forward,n).normalize();
      const base=vertices.length/3,size=outline.length;
      const vertex=(x:number,y:number,z:number)=>{
        v.copy(point).addScaledVector(side,x*radius).addScaledVector(forward,y*radius).addScaledVector(n,z).applyMatrix4(inverse);
        vertices.push(v.x,v.y,v.z);roots.push(point.x,point.y,point.z);uvs.push(u+x*.012,w+y*.012);
      };
      for(const [x,y]of outline)vertex(x,y,-height*.12);
      const inset=pattern==='round'?.60:pattern==='hex'?.78:pattern==='diamond'?.26:.64;
      for(const [x,y]of outline)vertex(x*inset,y*inset,height*(pattern==='shield'?(.60+.23*y):.78));
      vertex(0,pattern==='shield'?.18:0,height*(pattern==='hex'?.78:1));
      for(let j=0;j<size;j++){
        const k=(j+1)%size;
        indices.push(base+j,base+k,base+size+k,base+j,base+size+k,base+size+j,base+size+j,base+size+k,base+size*2);
      }
      count++;
    };
    const total=index?index.count:position.count;
    for(let triangle=0;triangle<total;triangle+=3){
      const ia=index?index.getX(triangle):triangle,ib=index?index.getX(triangle+1):triangle+1,ic=index?index.getX(triangle+2):triangle+2;
      a.fromBufferAttribute(position,ia).applyMatrix4(source.matrixWorld);b.fromBufferAttribute(position,ib).applyMatrix4(source.matrixWorld);c.fromBufferAttribute(position,ic).applyMatrix4(source.matrixWorld);
      face.subVectors(b,a).cross(edge.subVectors(c,a));
      const abs=[Math.abs(face.x),Math.abs(face.y),Math.abs(face.z)],axis=abs.indexOf(Math.max(...abs));
      // Y is the row coordinate for side faces, keeping plates aligned along fingers.
      const h=axis===0?2:0,k=axis===1?2:1;
      const ax=a.getComponent(h),ay=a.getComponent(k),bx=b.getComponent(h),by=b.getComponent(k),cx=c.getComponent(h),cy=c.getComponent(k);
      const denominator=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(denominator)<1e-15)continue;
      const y0=Math.ceil(Math.min(ay,by,cy)/rowHeight),y1=Math.floor(Math.max(ay,by,cy)/rowHeight);
      for(let row=y0;row<=y1;row++){
        const y=row*rowHeight,offset=(Math.abs(row)%2)*.5;
        const x0=Math.ceil(Math.min(ax,bx,cx)/spacing-offset),x1=Math.floor(Math.max(ax,bx,cx)/spacing-offset);
        for(let col=x0;col<=x1;col++){
          const x=(col+offset)*spacing,wa=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/denominator,wb=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/denominator,wc=1-wa-wb;
          if(wa<-.00001||wb<-.00001||wc<-.00001)continue;
          point.copy(a).multiplyScalar(wa).addScaledVector(b,wb).addScaledVector(c,wc);
          if(!accept(point,spacing*.55))continue;
          na.fromBufferAttribute(normal,ia);nb.fromBufferAttribute(normal,ib);nc.fromBufferAttribute(normal,ic);
          n.copy(na).multiplyScalar(wa).addScaledVector(nb,wb).addScaledVector(nc,wc).applyNormalMatrix(worldNormal);
          stamp(uv?uv.getX(ia)*wa+uv.getX(ib)*wb+uv.getX(ic)*wc:0,uv?uv.getY(ia)*wa+uv.getY(ib)*wb+uv.getY(ic)*wc:0);
        }
      }
    }
    if(!count)continue;
    const relief=new THREE.BufferGeometry();relief.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));relief.setAttribute('_surface_root',new THREE.Float32BufferAttribute(roots,3));relief.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));relief.setIndex(indices);relief.computeVertexNormals();
    // Flat facets on the angular patterns; rounded scales keep a soft dome.
    let finalGeometry=relief;
    if(pattern!=='round'){finalGeometry=relief.toNonIndexed();finalGeometry.computeVertexNormals();relief.dispose();}
    const mesh=new THREE.Mesh(finalGeometry,Array.isArray(source.material)?source.material[0]:source.material);
    mesh.name=source.name+'_'+pattern+'_scales';mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.userData={region:source.userData.region,rig_profile:source.userData.rig_profile,rig_bone:source.userData.rig_bone,surface_pattern:pattern,scale_count:count,ownedGeometry:true};
    source.parent.add(mesh);
  }
}
