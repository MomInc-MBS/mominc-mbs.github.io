import * as T from 'three';
import {EYE_LAYOUTS} from './eye-layouts';
import {STYLES,type Design,type Region} from './design';
import {sculptMaterial,materialFor} from './material-language';

export function boneSockets(d:Design){
 const group=new T.Group();group.name='Empty bone sockets';group.userData.region='head';
 for(const [index,[x,y,z,r,yaw]]of EYE_LAYOUTS[d.eyeLayout].eyes.entries()){
  const socket=new T.Group();socket.name='Empty socket '+(index+1);socket.position.set(x,y,z);socket.rotation.y=T.MathUtils.degToRad(yaw);
  // A recessed concave bowl and a continuous ivory rim. No eyeball, iris,
  // pupil, highlight or emissive dot is present, even for mixed recipes.
  const bowlGeo=new T.SphereGeometry(r*.94,32,20,0,Math.PI*2,Math.PI/2,Math.PI/2);bowlGeo.rotateX(Math.PI/2);
  const bowl=new T.Mesh(bowlGeo,new T.MeshStandardMaterial({color:'#0c0907',roughness:1,side:T.DoubleSide}));bowl.name='Recessed empty cavity';bowl.position.z=-r*.06;
  const rim=new T.Mesh(new T.TorusGeometry(r*.94,r*.105,8,32),materialFor(STYLES[7],1));rim.material.vertexColors=false;rim.name='Weathered orbital bone';
  socket.add(bowl,rim);socket.userData.emptySocket=true;group.add(socket);
 }
 return group;
}

export function skeletalStructure(region:Region,d:Design){
 const root=new T.Group();root.name='Articulated skeleton '+region;root.userData.region=region;
 const mat=new T.MeshStandardMaterial({color:STYLES[7].primary,roughness:.83});
 const mesh=(g:T.BufferGeometry,p:number[],scale=[1,1,1])=>{const m=new T.Mesh(g,mat.clone());m.position.fromArray(p);m.scale.fromArray(scale);m.userData.region=region;root.add(m);return m;};
 const joint=(p:number[],r=.07)=>mesh(new T.SphereGeometry(r,10,7),p,[1,.78,1]);
 const bone=(a:number[],b:number[],r=.055)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),dir=to.clone().sub(from);const m=mesh(new T.CylinderGeometry(r*.72,r*.9,dir.length(),9),from.clone().add(to).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());joint(a,r*1.6);joint(b,r*1.6);};
 if(region==='body'){
  bone([0,.48,-.18],[0,1.5,-.18],.09);
  for(let i=0;i<7;i++){const y=.58+i*.125,w=.3+Math.sin((i+1)/8*Math.PI)*.24;const points=Array.from({length:25},(_,k)=>{const a=k/24*Math.PI*2;return new T.Vector3(Math.cos(a)*w,y+Math.sin(a)*.035,-.08+Math.sin(a)*.35);});mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points,true),32,.031,6,true),[0,0,0]);}
  bone([0,.75,.3],[0,1.41,.27],.043);for(const sign of [-1,1]){bone([0,1.4,-.08],[sign*.51,1.4,-.03],.048);const pelvis=mesh(new T.TorusGeometry(.2,.075,6,12),[sign*.22,.51,-.09],[1,.78,1]);pelvis.rotation.y=sign*.3;}
 }else if(region==='collar'){
  for(let i=0;i<3;i++){const ring=mesh(new T.TorusGeometry(.24+i*.075,.043,6,22),[0,1.39+i*.09,-.04]);ring.rotation.x=Math.PI/2;}
 }else if(region==='arms'){
  for(const sign of [-1,1]){
   const shoulder=[sign*.52,1.36,-.02],elbow=[sign*.78,1.05,.04],wrist=[sign*.91,.81,.16];bone(shoulder,elbow,.057);bone([elbow[0]-.035,elbow[1],elbow[2]],wrist,.035);bone([elbow[0]+.035,elbow[1],elbow[2]-.025],[wrist[0]+.055,wrist[1],wrist[2]],.028);
   for(let i=0;i<d.fingers;i++){const offset=(i-(d.fingers-1)/2)*.056,a=[wrist[0]+sign*offset,wrist[1]-.08,wrist[2]+.035],b=[a[0]+sign*.06,a[1]-.13,a[2]+.08],c=[b[0]-sign*.025,b[1]-.09,b[2]+.055];bone(wrist,a,.024);bone(a,b,.021);bone(b,c,.017);}
  }
 }else if(region==='feet'){
  for(const sign of [-1,1]){const hip=[sign*.34,.58,-.03],ankle=[sign*.39,.2,.04];bone(hip,ankle,.068);for(let i=0;i<d.toes;i++){const x=sign*.39+(i-(d.toes-1)/2)*.072;bone(ankle,[x,.14,.2],.03);bone([x,.14,.2],[x,.105,.38],.025);}}
 }
 root.updateMatrixWorld(true);root.traverse(o=>{if(o instanceof T.Mesh)sculptMaterial(o,STYLES[7]);});return root;
}

export function materialCollar(styleId:number){
 const group=new T.Group();group.name='Material collar';group.userData.region='collar';
 const style=STYLES[styleId],hard=[3,13,18,19].includes(styleId),geo=new T.TorusGeometry(.52,hard?.15:.18,hard?6:14,hard?12:32);
 geo.rotateX(Math.PI/2);geo.scale(1,1,.75);geo.translate(0,1.45,-.03);
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial());group.add(mesh);sculptMaterial(mesh,style,1);return group;
}

export function robotStructure(region:Region,d:Design){
 const root=new T.Group();root.name='Mechanical '+region;root.userData.region=region;
 const armor=new T.MeshPhysicalMaterial({color:'#ad7842',metalness:.87,roughness:.27,clearcoat:.4}),steel=new T.MeshStandardMaterial({color:'#252e3b',metalness:.88,roughness:.3}),light=new T.MeshStandardMaterial({color:'#ffe7a0',emissive:'#ffd169',emissiveIntensity:1.2,roughness:.2});
 const mesh=(g:T.BufferGeometry,p:number[],mat=armor)=>{const m=new T.Mesh(g,mat.clone());m.position.fromArray(p);m.userData.region=region;root.add(m);return m;};
 const rod=(a:number[],b:number[],radius:number,mat=steel)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),dir=to.clone().sub(from);const m=mesh(new T.CylinderGeometry(radius,radius,dir.length(),8),from.clone().add(to).multiplyScalar(.5).toArray(),mat as typeof armor);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());};
 const hinge=(p:number[],r:number)=>{const m=mesh(new T.CylinderGeometry(r,r,.12,12),p,steel as typeof armor);m.rotation.x=Math.PI/2;const hub=mesh(new T.CylinderGeometry(r*.45,r*.45,.14,8),p);hub.rotation.x=Math.PI/2;};
 if(region==='body'){
  const shell=mesh(new T.CylinderGeometry(.51,.42,.93,8),[0,.99,-.09]);shell.scale.z=.79;
  for(const y of [.57,.78,1.03,1.43]){const ring=mesh(new T.TorusGeometry(.45,.035,5,8),[0,y,-.09],steel as typeof armor);ring.rotation.x=Math.PI/2;ring.scale.y=.8;}
  const reactor=mesh(new T.CylinderGeometry(.19,.19,.07,12),[0,1.1,.34],steel as typeof armor);reactor.rotation.x=Math.PI/2;
  const core=mesh(new T.CylinderGeometry(.12,.12,.08,12),[0,1.1,.36],light as typeof armor);core.rotation.x=Math.PI/2;
  for(const sign of [-1,1])for(const y of [.75,1.3]){const rivet=mesh(new T.CylinderGeometry(.036,.036,.1,6),[sign*.29,y,.34],steel as typeof armor);rivet.rotation.x=Math.PI/2;}
 }else if(region==='arms'){
  for(const sign of [-1,1]){const shoulder=[sign*.52,1.38,0],elbow=[sign*.77,1.04,.04],wrist=[sign*.91,.8,.17];hinge(shoulder,.16);rod(shoulder,elbow,.108,armor);hinge(elbow,.12);rod(elbow,wrist,.086,armor);rod([elbow[0]+sign*.06,elbow[1],elbow[2]+.07],[wrist[0]+sign*.06,wrist[1],wrist[2]+.07],.027);hinge(wrist,.085);
   mesh(new T.BoxGeometry(.23,.16,.13),[wrist[0],.69,.21]);for(let i=0;i<d.fingers;i++){const x=wrist[0]+(i-(d.fingers-1)/2)*.052,a=[x,.63,.21],b=[x,.52,.27],c=[x,.45,.3];hinge(a,.029);rod(a,b,.023,armor);hinge(b,.026);rod(b,c,.02,armor);}}
 }else if(region==='feet'){
  for(const sign of [-1,1]){hinge([sign*.35,.53,-.01],.13);rod([sign*.35,.53,-.01],[sign*.39,.22,.04],.095,armor);hinge([sign*.39,.22,.04],.095);mesh(new T.BoxGeometry(.26,.13,.32),[sign*.39,.13,.15]);for(let i=0;i<d.toes;i++)mesh(new T.BoxGeometry(.055,.085,.13),[sign*.39+(i-(d.toes-1)/2)*.065,.115,.36]);}
 }
 return root;
}
