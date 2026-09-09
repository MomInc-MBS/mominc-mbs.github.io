import * as THREE from './vendor/three.module.js';
import { DIGITS,                       } from './poses.js';

// Rest centerlines are shared with the anatomical sculpt (converted to Y-up).
export const REST_SOURCE                         ={
 index:[[-.028,0,.048],[-.032,.003,.086],[-.033,.010,.112],[-.032,.018,.132]],
 middle:[[-.008,-.001,.054],[-.009,.002,.097],[-.009,.011,.126],[-.008,.021,.148]],
 ring:[[.013,0,.050],[.015,.004,.090],[.017,.014,.115],[.018,.025,.135]],
 pinky:[[.031,.002,.039],[.038,.006,.069],[.042,.015,.089],[.043,.026,.105]],
 thumb:[[-.028,.010,-.021],[-.049,.016,.003],[-.067,.020,.023],[-.077,.028,.044]],
};
export const DIGIT_RADII=[.0092,.0098,.0089,.0073,.0108];
const radii=DIGIT_RADII;
const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),axisZ=new THREE.Vector3(0,0,1);
const rest=DIGITS.map(d=>REST_SOURCE[d].map(([x,y,z])=>new THREE.Vector3(x,z,-y)));
export const BABY_RIG_SCALE=new THREE.Vector3(.78,.40,.95);
                                  
const makeBones=(landmarks                  )=>landmarks.map(points=>points.slice(0,3).map((p,i)=>{
  const dir=points[i+1].clone().sub(p),length=dir.length();dir.normalize();
  const side=dir.clone().cross(axisZ).normalize(),back=side.clone().cross(dir).normalize();
  const quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,dir,back));
  const inverse=new THREE.Matrix4().compose(p,quaternion,new THREE.Vector3(1,1,1)).invert();
  return {p,dir,length,quaternion,inverse};
}));
const profileBones={standard:makeBones(rest),baby:makeBones(rest.map(points=>points.map(p=>p.clone().multiply(BABY_RIG_SCALE))))};
const smooth=(x       )=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function poseMatrices(pose     ,profile           ='standard')                 {
  const bones=profileBones[profile];
  const matrices=[new THREE.Matrix4()],rad=Math.PI/180;
  for(let d=0;d<5;d++){
    const angles=pose.fingers[DIGITS[d]];let previousQ=new THREE.Quaternion(),previousP=new THREE.Vector3();
    for(let i=0;i<3;i++){
      const bone=bones[d][i];let q                 ,p              ;
      if(i===0){
        q=new THREE.Quaternion().setFromAxisAngle(axisZ,angles[3]*rad);
        if(d===4)q.multiply(new THREE.Quaternion().setFromAxisAngle(axisY,-pose.opposition*rad));
        q.multiply(bone.quaternion);p=bone.p.clone();
      }else{
        q=previousQ.clone().multiply(bones[d][i-1].quaternion.clone().invert().multiply(bone.quaternion));
        p=previousP.clone().add(new THREE.Vector3(0,bones[d][i-1].length,0).applyQuaternion(previousQ));
      }
      q.multiply(new THREE.Quaternion().setFromAxisAngle(axisX,-angles[i]*rad));
      matrices.push(new THREE.Matrix4().compose(p,q,new THREE.Vector3(1,1,1)).multiply(bone.inverse));
      previousQ=q;previousP=p;
    }
  }
  const rotation=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...pose.rotation.map(v=>v*rad)                          ));
  return matrices.map(m=>rotation.clone().multiply(m));
}
export function fingerTip(pose     ,digit      )               {
  const index=DIGITS.indexOf(digit);return rest[index][3].clone().applyMatrix4(poseMatrices(pose)[index*3+3]);
}

function influences(x       ,y       ,z       ,profile           ='standard')                   {
  const bones=profileBones[profile],size=profile==='baby'?.46:1;
  const radii=DIGIT_RADII.map(r=>r*(profile==='baby'?.86:1));
  if(y<-.033*(profile==='baby'?BABY_RIG_SCALE.y:1))return [[0,1]];
  const candidates                                                        =[];
  for(let d=0;d<5;d++){
    let min=Infinity,segment=0,t=0;
    for(let i=0;i<3;i++){
      const b=bones[d][i],dx=x-b.p.x,dy=y-b.p.y,dz=z-b.p.z;
      const u=Math.max(0,Math.min(1,(dx*b.dir.x+dy*b.dir.y+dz*b.dir.z)/b.length));
      const ex=dx-b.dir.x*u*b.length,ey=dy-b.dir.y*u*b.length,ez=dz-b.dir.z*u*b.length;
      const dist=ex*ex+ey*ey+ez*ez;if(dist<min){min=dist;segment=i;t=u;}
    }
    const base=bones[d][0],along=(x-base.p.x)*base.dir.x+(y-base.p.y)*base.dir.y+(z-base.p.z)*base.dir.z;
    const gain=smooth((along+.007*size)/(.020*size))*(1-smooth((Math.sqrt(min)/radii[d]-1.45)/1.1));
    candidates.push({score:1/Math.pow(.08+min/(radii[d]*radii[d]),4),gain,d,i:segment,t});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const chosen=candidates.slice(0,2),total=chosen.reduce((s,c)=>s+c.score,0),weights=new Map               ();
  const add=(id       ,w       )=>weights.set(id,(weights.get(id)??0)+w);
  for(const c of chosen){
    const fraction=c.score/total,active=fraction*c.gain,id=c.d*3+c.i+1;add(0,fraction-active);
    const previous=c.i>0?.5*(1-smooth(c.t/.20)):0,next=c.i<2?.5*smooth((c.t-.80)/.20):0;
    add(id,active*(1-previous-next));if(previous)add(id-1,active*previous);if(next)add(id+1,active*next);
  }
  const result=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=result.reduce((s,[,w])=>s+w,0);
  return result.map(([id,w])=>[id,w/sum]);
}
                                                                                                                                                                                      
                                                                            
export function bindHand(group            )         {
  group.updateMatrixWorld(true);const bound            =[];
  group.traverse(obj=>{
    if(!(obj instanceof THREE.Mesh))return;
    const original=obj.geometry;obj.geometry=original.clone();if(obj.userData.ownedGeometry)original.dispose();obj.userData.posedGeometry=true;
    const pos=obj.geometry.getAttribute('position'),normal=obj.geometry.getAttribute('normal');
    const positions=new Float32Array(pos.count*3),normals=new Float32Array(pos.count*3),ids=new Uint8Array(pos.count*4),weights=new Float32Array(pos.count*4);
    const worldNormal=new THREE.Matrix3().getNormalMatrix(obj.matrixWorld),p=new THREE.Vector3(),n=new THREE.Vector3();
    const profile           =obj.userData.rig_profile==='baby'?'baby':'standard';
    const furRoots=obj.geometry.getAttribute('_fur_root');
    let rootX=NaN,rootY=NaN,rootZ=NaN,rootWeights                  =[];
    for(let i=0;i<pos.count;i++){
      p.fromBufferAttribute(pos,i).applyMatrix4(obj.matrixWorld);n.fromBufferAttribute(normal,i).applyNormalMatrix(worldNormal);
      p.toArray(positions,i*3);n.toArray(normals,i*3);
      const nailDigit=obj.userData.region==='nails'?DIGITS.indexOf(obj.userData.digit):-1;
      const explicitBone=obj.userData.rig_bone;
      if(furRoots){
        const x=furRoots.getX(i),y=furRoots.getY(i),z=furRoots.getZ(i);
        if(x!==rootX||y!==rootY||z!==rootZ){rootX=x;rootY=y;rootZ=z;rootWeights=influences(x,y,z,profile);}
      }
      const vertexWeights=Number.isInteger(explicitBone)&&explicitBone>=0&&explicitBone<=15?[[explicitBone,1]]:nailDigit>=0?[[nailDigit*3+3,1]]:furRoots?rootWeights:influences(p.x,p.y,p.z,profile);
      for(const[j,[id,w]]of vertexWeights.entries()){ids[i*4+j]=id;weights[i*4+j]=w;}
    }
    bound.push({mesh:obj,profile,positions,normals,ids,weights,inverse:obj.matrixWorld.clone().invert(),inverseNormal:worldNormal.clone().invert()});
  });
  return {group,meshes:bound,dispose(){for(const item of bound)item.mesh.geometry.dispose();}};
}
export function applyHandPose(rig        ,pose     ) {
  const profileMatrices={standard:poseMatrices(pose).map(m=>m.elements),baby:poseMatrices(pose,'baby').map(m=>m.elements)},min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);
  const p=new THREE.Vector3(),n=new THREE.Vector3();
  for(const bound of rig.meshes){
    const {mesh,positions,normals,ids,weights}=bound,pos=mesh.geometry.getAttribute('position'),normal=mesh.geometry.getAttribute('normal');
    const matrices=profileMatrices[bound.profile];
    for(let i=0;i<pos.count;i++){
      const k=i*3,x=positions[k],y=positions[k+1],z=positions[k+2],nx=normals[k],ny=normals[k+1],nz=normals[k+2];
      let px=0,py=0,pz=0,ox=0,oy=0,oz=0;
      for(let j=0;j<4;j++){
        const w=weights[i*4+j];if(!w)continue;const m=matrices[ids[i*4+j]];
        px+=w*(m[0]*x+m[4]*y+m[8]*z+m[12]);py+=w*(m[1]*x+m[5]*y+m[9]*z+m[13]);pz+=w*(m[2]*x+m[6]*y+m[10]*z+m[14]);
        ox+=w*(m[0]*nx+m[4]*ny+m[8]*nz);oy+=w*(m[1]*nx+m[5]*ny+m[9]*nz);oz+=w*(m[2]*nx+m[6]*ny+m[10]*nz);
      }
      p.set(px,py,pz);min.min(p);max.max(p);p.applyMatrix4(bound.inverse);pos.setXYZ(i,p.x,p.y,p.z);
      n.set(ox,oy,oz).applyMatrix3(bound.inverseNormal).normalize();normal.setXYZ(i,n.x,n.y,n.z);
    }
    pos.needsUpdate=true;normal.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
    // Exporters regenerate tangents from the posed normals and preserved UVs.
    mesh.geometry.deleteAttribute('tangent');
  }
  const center=min.add(max).multiplyScalar(.5);rig.group.position.set(-center.x,.035-center.y,-center.z);
  rig.group.userData.pose=pose.id;rig.group.userData.pose_name=pose.name;rig.group.updateMatrixWorld(true);
}
