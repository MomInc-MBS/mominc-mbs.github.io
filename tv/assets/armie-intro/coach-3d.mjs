// Coach Armie in 3D: whatever clay forearm sits in models/coach-hand.glb (placeholder: Modly Hunyuan3D-2 Mini mesh),
// made canonical at load and given live googly eyes in code. Every caller keeps its 2D coach (sprite / SVG /
// procedural hand) until the model is in, so a missing or broken GLB changes nothing.
// Canonical frame: length 1 along X, centred, fingers/face end at +X, up +Y, eye side +Z (as exported).
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
export const COACH_GLB=new URL('./models/coach-hand.glb',import.meta.url).href;
const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||!!document.querySelector('#ar.ar-motion-off');
let pending=null;
export const loadCoachParts=()=>pending??=new GLTFLoader().loadAsync(COACH_GLB).then(g=>canonical(g.scene));

// Bake every mesh into the canonical frame as plain arrays, so callers on another three.js copy can rebuild it.
function canonical(root){
  root.updateMatrixWorld(true);const parts=[],all=[];
  // Float copies that respect normalized (e.g. Uint16 colour/uv) attributes.
  const flat=at=>at&&Float32Array.from({length:at.count*at.itemSize},(_,i)=>at.getComponent(Math.floor(i/at.itemSize),i%at.itemSize));
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry;
    const pos=g.attributes.position.clone().applyMatrix4(o.matrixWorld);for(let i=0;i<pos.count;i++)all.push(new T.Vector3().fromBufferAttribute(pos,i));
    const m=Array.isArray(o.material)?o.material[0]:o.material;
    parts.push({name:o.name,pos,uv:flat(g.attributes.uv),color:flat(g.attributes.color),colorSize:g.attributes.color?.itemSize,index:g.index?.array,groups:g.groups,
      mat:{color:m.color?.getHex()??0x8e5b99,roughness:m.roughness??.9,metalness:m.metalness??0,map:m.map?.image??null,vertexColors:!!g.attributes.color}});});
  if(!all.length)throw Error('coach-hand.glb has no mesh');
  const box=new T.Box3().setFromPoints(all),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
  const axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z',[a,b]=['x','y','z'].filter(k=>k!==axis),L=size[axis];
  // Face end = the wider end (Ian's model: open hand with the fingers up, torn wrist and a bone below).
  const spread=(lo,hi)=>{let s=0,n=0;for(const p of all){const t=(p[axis]-box.min[axis])/L;if(t>=lo&&t<=hi){s+=Math.hypot(p[a]-c[a],p[b]-c[b]);n++;}}return n?s/n:0;};
  const dir=new T.Vector3();dir[axis]=spread(.85,1)>=spread(0,.15)?1:-1;
  const align=new T.Quaternion().setFromUnitVectors(dir,new T.Vector3(1,0,0));
  // Roll about the length so the BACK of the hand (opposite the curl of the fingers, here -Z palm side) faces +Z, the eyes' side.
  const roll=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI);
  const M=new T.Matrix4().makeScale(1/L,1/L,1/L).multiply(new T.Matrix4().makeRotationFromQuaternion(roll.multiply(align))).multiply(new T.Matrix4().makeTranslation(-c.x,-c.y,-c.z));
  for(const p of parts)p.pos=p.pos.applyMatrix4(M).array;
  // Plain-white single-material export: paint it as clay, with the bone (the thin end, x < -.16) gold. Vertex colours carry both.
  for(const p of parts)if(!p.color&&!p.mat.map&&p.mat.color>0xe0e0e0){const clay=new T.Color(0x8e5b99),bone=new T.Color(0xd4a017),n=p.pos.length/3,col=new Float32Array(n*3);
    for(let i=0;i<n;i++){const k=p.pos[i*3]<-.16?bone:clay;col.set([k.r,k.g,k.b],i*3);}
    p.color=col;p.colorSize=3;p.mat.vertexColors=true;p.mat.color=0xffffff;p.mat.roughness=.9;}
  return {parts,hasEyes:parts.some(p=>/pupil|eye/i.test(p.name))};
}

// Build the coach with the caller's three.js. tick(now,{pressure 0..1, roll}) jiggles the pupils like coach-hand.mjs.
export function buildCoach(THREE,{parts,hasEyes}){
  const group=new THREE.Group();group.name='coach-armie-3d';const body=[];
  for(const p of parts){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(p.pos),3));
    if(p.uv)g.setAttribute('uv',new THREE.BufferAttribute(p.uv,2));
    if(p.color)g.setAttribute('color',new THREE.BufferAttribute(p.color,p.colorSize));
    if(p.index)g.setIndex(Array.from(p.index));(p.groups||[]).forEach(x=>g.addGroup(x.start,x.count,x.materialIndex));g.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({color:p.mat.color,roughness:p.mat.roughness,metalness:p.mat.metalness,vertexColors:p.mat.vertexColors});
    if(p.mat.map){mat.map=new THREE.Texture(p.mat.map);mat.map.flipY=false;mat.map.colorSpace=THREE.SRGBColorSpace;mat.map.needsUpdate=true;}
    const mesh=new THREE.Mesh(g,mat);mesh.name=p.name;group.add(mesh);body.push(mesh);}
  const pupils=[];
  if(!hasEyes){// big + small mismatched googly eyes (coach-hand.mjs canon ratio 10:6).
    const sclera=new THREE.MeshStandardMaterial({color:0xfffdf6,roughness:.25}),ink=new THREE.MeshStandardMaterial({color:0x120a14,roughness:.3});
    const ray=new THREE.Raycaster(),up=new THREE.Vector3(0,1,0);
    // Ian's hand model: eyes sit on the back of the hand (x -.16 wrist .. .5 fingertips), kept inside its outline.
    for(const [x,y,r] of [[.07,.03,.06],[.2,-.03,.038]]){
      ray.set(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1));const hit=ray.intersectObjects(body,false)[0];
      const n=hit?.face?hit.face.normal.clone().normalize():new THREE.Vector3(0,0,1);if(n.z<0)n.negate();
      const eye=new THREE.Group();eye.position.copy(hit?hit.point:new THREE.Vector3(x,y,.15)).addScaledVector(n,r*.15);eye.quaternion.setFromUnitVectors(up,n);group.add(eye);
      const white=new THREE.Mesh(new THREE.SphereGeometry(1,24,12),sclera);white.scale.set(r,r*.5,r);eye.add(white);
      const pupil=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),ink);pupil.scale.set(r*.5,r*.15,r*.5);pupil.position.y=r*.42;eye.add(pupil);
      pupils.push({p:pupil,rest:pupil.position.clone(),room:r*.42,target:new THREE.Vector2()});}
  }
  let next=0,angle=0;
  return {group,tick(now,{pressure=.3,roll=false}={}){
    const quiet=still();
    if(now>=next||roll){next=now+140;angle+=.9;pupils.forEach((e,i)=>{const k=quiet?.5:roll?1:(.4+pressure*.6);
      if(quiet)e.target.set(k,0);else if(roll)e.target.set(Math.cos(angle+i*2.4),Math.sin(angle+i*2.4));else e.target.set((Math.random()*2-1)*k,(Math.random()*2-1)*k);});}
    // Pupils ride the eye's local +Y; they slide in local X/Z.
    pupils.forEach(e=>{e.p.position.x+=(e.rest.x+e.target.x*e.room-e.p.position.x)*.5;e.p.position.z+=(e.rest.z+e.target.y*e.room-e.p.position.z)*.5;});
  }};
}
export const loadCoach=THREE=>loadCoachParts().then(parts=>buildCoach(THREE,parts));

// Swap a three.js coach sprite for the model: the scene keeps moving the sprite, the model follows it every render.
// turn: extra yaw so the eye side shows (0 = face end points straight at the camera).
// The additive sprite glowed in the dark; the lit model carries its own key light, scaled by the sprite's tint
// (game-scene.js brightens the tint as Coach closes in).
export function replaceSprite(scene,sprite,{size=.9,lift=0,turn=.9,glow=2.5,rear=false}={}){
  return loadCoach(T).then(coach=>{
    const g=coach.group,to=new T.Vector3();scene.add(g);sprite.material.visible=false;
    const key=new T.PointLight('#f3dcff',0,0,1.4);key.position.set(.25,.55,1.1);g.add(key);
    const before=scene.onBeforeRender;
    scene.onBeforeRender=(renderer,s,camera,...rest)=>{before.call(scene,renderer,s,camera,...rest);
      // Never let the model swallow the camera: half its length stays inside 45% of the camera distance.
      const now=performance.now(),q=still()?0:1,k=Math.min(sprite.scale.x*size,camera.position.distanceTo(sprite.position)*.9);g.visible=sprite.visible;
      const c=sprite.material.color;key.intensity=glow*k*k*(.35+(c.r+c.g+c.b)/1.5);key.distance=k*2.2;
      g.position.copy(sprite.position);g.position.y+=k*(lift+.04*Math.abs(Math.sin(now/220))*q);g.scale.setScalar(k);
      // rear: grab beats that put the sprite at the camera's feet (lab): rear the model up to eye level so it looms, face first.
      const near=rear?T.MathUtils.clamp(1-camera.position.distanceTo(sprite.position)/4,0,1):0;g.position.y+=(camera.position.y-.1*k-g.position.y)*near;
      to.subVectors(camera.position,g.position);g.rotation.set(0,Math.atan2(-to.z,to.x)+turn*(1-.5*near),Math.sin(now/300)*.06*q);
      coach.tick(now,{pressure:sprite.userData.pressure??.4,roll:!!sprite.userData.roll});};
    return coach;
  });
}

// DOM coach for overlays: starts as the 2D SVG (fallback) and swaps to a WebGL canvas once the model has drawn.
// Same API as coachHand(): el.coach.pressure(p) / roll(on) / destroy(). Points up, face at the top.
export function coachElement(svgEl){
  const el=svgEl;let pressure=.3,roll=false,dead=false,raf=0;const api=el.coach;
  el.coach={pressure(p){pressure=Math.max(0,Math.min(1,p));api.pressure(p);},roll(on){roll=!!on;api.roll(on);},destroy(){dead=true;cancelAnimationFrame(raf);api.destroy();}};
  loadCoach(T).then(coach=>{if(dead)return;
    const renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.outputColorSpace=T.SRGBColorSpace;
    const canvas=renderer.domElement;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%';canvas.setAttribute('aria-hidden','true');
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,.5,.1,20);
    scene.add(new T.HemisphereLight('#f0e2ff','#3a1830',2.2));const key=new T.DirectionalLight('#fff0dc',2.6);key.position.set(1.5,2,3);scene.add(key);
    coach.group.rotation.set(0,-.35,Math.PI/2);scene.add(coach.group);
    let shown=false,w=0,h=0;
    const frame=now=>{if(dead||!el.isConnected&&shown){renderer.dispose();return;}raf=requestAnimationFrame(frame);
      if(!el.offsetParent)return;const cw=el.clientWidth,ch=el.clientHeight;if(!cw||!ch)return;
      if(cw!==w||ch!==h){w=cw;h=ch;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(w,h,false);camera.aspect=w/h;
        // Fit the length (now vertical) to the box height.
        camera.position.z=1.3/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));camera.updateProjectionMatrix();}
      const q=still()?0:1;coach.group.rotation.y=-.35+Math.sin(now/260)*.12*q;coach.tick(now,{pressure,roll});renderer.render(scene,camera);
      if(!shown){shown=true;el.append(canvas);const svg=el.querySelector('svg');if(svg)svg.style.visibility='hidden';}};
    raf=requestAnimationFrame(frame);
  }).catch(e=>console.warn('3D coach unavailable, keeping 2D:',e.message));
  return el;
}
