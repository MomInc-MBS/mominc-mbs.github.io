// Original continuous sculpt and sewing. Controller owns all animation and input.
import { createSurfaceLibrary } from "./surfaces.js?objects=12";
import { handSculpt } from "./assets/actors/hand-mesh.js?objects=12";
const TAU = Math.PI * 2;

function makeWorkshop(THREE, felt) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const maps = createSurfaceLibrary(THREE, t => (textures.add(t), t))(felt ? "felt" : "clay");
  const material = parameters => { const m = new THREE.MeshStandardMaterial(parameters); materials.add(m); return m; };
  const surface = material({color:felt?0x8d64a7:0x8546b4,roughness:felt?.94:.48,metalness:0,...maps,bumpScale:felt?.00065:.00038});
  const highlight = material({color:felt?0xb99bc9:0x9158b3,roughness:felt?.96:.52,...maps,bumpScale:felt?.00065:.00025});
  const cuff = material({color:0x674679,roughness:1,...maps,bumpScale:.0007});
  const sleeve = material({color:0x6d517f,roughness:1,...maps,bumpScale:.0008});
  const threadMaterial = material({color:felt?0xd1b8dc:0x8144a9,roughness:.95});
  function own(g) {geometries.add(g);return g;}
  function mesh(g,mat=surface) {const m=new THREE.Mesh(own(g),mat);m.castShadow=m.receiveShadow=true;return m;}
  function pad(size,mat=surface) {const m=mesh(new THREE.SphereGeometry(1,32,20),mat);m.scale.set(...size);return m;}
  function thread(parent,points,radius=.0007) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const value=mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*6),radius,5,false),threadMaterial);
    parent.add(value);return value;
  }
  function stitches(parent,points,width=.004,count=16) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    // Stitch segments share a draw call; these are small thread loops, not fuzz spikes.
    const positions=[],normals=[],indices=[];
    for(let i=0;i<count;i++) {
      const t=(i+.5)/count,p=curve.getPoint(t),tangent=curve.getTangent(t);
      const cross=new THREE.Vector3(-tangent.z,.2,tangent.x).normalize().multiplyScalar(width/2);
      const loop=new THREE.CatmullRomCurve3([p.clone().sub(cross),new THREE.Vector3(p.x,p.y+.0008,p.z),p.clone().add(cross)]);
      const tube=new THREE.TubeGeometry(loop,6,.0005,4,false),offset=positions.length/3;
      positions.push(...tube.attributes.position.array);normals.push(...tube.attributes.normal.array);
      for(const index of tube.index.array)indices.push(offset+index);
      tube.dispose();
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);
    parent.add(mesh(g,threadMaterial));
  }
  // Shaped cloth cross-sections encode shoulders, waist, ankles and soles.
  function softForm(sections,mat=surface,radial=40) {
    const curves=[1,2,3].map(axis=>new THREE.CatmullRomCurve3(sections.map(row=>new THREE.Vector3(row[0],row[axis]||0,0))));
    const rings=36,position=[],uv=[],indices=[];
    for(let j=0;j<=rings;j++) {
      const t=j/rings,sx=curves[0].getPoint(t),sz=curves[1].getPoint(t),shift=curves[2].getPoint(t);
      for(let i=0;i<=radial;i++) {
        const angle=i/radial*TAU,c=Math.cos(angle),s=Math.sin(angle);
        position.push(Math.sign(c)*Math.pow(Math.abs(c),.88)*Math.max(.0001,sx.y),sx.x,Math.sign(s)*Math.pow(Math.abs(s),.88)*Math.max(.0001,sz.y)+shift.y);
        uv.push(i/radial*2.8,t*4.2);
        if(j<rings&&i<radial){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,a+1,b,b+1);}
      }
    }
    // Cap tucked fabric ends; visible wrists must not be open hollow tubes.
    for(const row of [0,rings])for(let i=1;i<radial;i++) {
      const start=row*(radial+1);if(row===0)indices.push(start,start+i,start+i+1);else indices.push(start,start+i+1,start+i);
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(position,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(g,mat);
  }
  return {surface,highlight,cuff,sleeve,mesh,own,pad,thread,stitches,softForm,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}

// handSculpt is a RIGHT hand (thumb on -x, nails on +y). mirror=true builds a left
// hand: the whole sculpt + skeleton sits under a scale.x=-1 group, bound mirrored.
function makeHand(THREE,workshop,felt,mirror=false) {
  const hand=new THREE.Group();hand.name=felt?"sewn-felt-anatomical-glove":"continuous-purple-clay-hand";
  const body=new THREE.Group();body.name=mirror?"mirrored-left-hand":"right-hand";if(mirror)body.scale.x=-1;hand.add(body);
  const root=new THREE.Bone();root.name="palm-root";body.add(root);
  const bones=[root],chains=[];
  handSculpt.fingers.forEach((finger,i)=> {
    const base=new THREE.Group();base.name=["index","middle","ring","little","thumb"][i]+"-metacarpal";
    base.position.fromArray(finger.base);base.rotation.y=finger.angle;root.add(base);
    let parent=base;const joints=[];
    finger.lengths.forEach((length,j)=> {
      const joint=new THREE.Bone();joint.name=`${base.name}-joint-${j}`;if(j)joint.position.z=-finger.lengths[j-1];parent.add(joint);
      joints.push(joint);bones.push(joint);parent=joint;
      const radius=finger.radius*(1-j*.12);
      if(felt)for(const sign of [-1,1])workshop.stitches(joint,[[sign*radius*.86,radius*.35,-.006],[sign*radius*.82,radius*.37,-length+.006]],.0032,Math.max(3,Math.round(length/.008)));
      else if(j===finger.lengths.length-1){const nail=workshop.pad([radius*.56,.00065,length*.25],workshop.highlight);nail.position.set(0,radius*.70,-length*.49);joint.add(nail);}
    });
    chains.push({base,joints,thumb:i===4});
  });
  const geometry=workshop.own(new THREE.BufferGeometry());
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(handSculpt.positions,3));
  geometry.setAttribute("normal",new THREE.Float32BufferAttribute(handSculpt.normals,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(handSculpt.uvs,2));
  geometry.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(handSculpt.skinIndices,4));
  geometry.setAttribute("skinWeight",new THREE.Float32BufferAttribute(handSculpt.skinWeights,4));
  geometry.setIndex(handSculpt.indices);geometry.computeBoundingSphere();
  const skin=new THREE.SkinnedMesh(geometry,workshop.surface);skin.name="voxel-fused-palm-webbing-and-fingers";skin.castShadow=skin.receiveShadow=true;skin.frustumCulled=false;body.add(skin);
  hand.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);skin.bind(skeleton);
  if(felt) {
    const detailScale=handSculpt.detailScale;
    const stitchHand=(points,width,count)=>workshop.stitches(root,points.map(p=>p.map(v=>v*detailScale)),width*detailScale,count);
    stitchHand([[-.032,.018,.077],[-.053,.022,.034],[-.058,.025,-.016]],.005,17);
    stitchHand([[.033,.018,.077],[.053,.022,.034],[.058,.023,-.016]],.005,17);
    const cuff=workshop.softForm([[.049,.039,.026,0],[.055,.044,.029,0],[.076,.041,.027,0],[.083,.034,.023,0]],workshop.cuff,32);
    cuff.rotation.x=Math.PI/2;cuff.scale.setScalar(detailScale);root.add(cuff);
    stitchHand([[-.035,.023,.071],[0,.028,.074],[.035,.023,.071]],.004,13);
  }
  return {hand,chains,skeleton};
}

function aimLimb(THREE,limb,from,to) {
  const delta=new THREE.Vector3().subVectors(to,from);limb.position.copy(from).addScaledVector(delta,.5);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());limb.scale.y=delta.length();
}

export function createTraveler(THREE) {
  const workshop=makeWorkshop(THREE,true),group=new THREE.Group();group.name="first-person-sewn-purple-felt-traveler";
  const torso=workshop.softForm([[-.37,.10,.075,0],[-.31,.19,.125,0],[-.13,.208,.135,0],[.07,.239,.142,0],[.25,.25,.128,0],[.33,.195,.10,0],[.37,.11,.065,0]]);
  torso.position.set(0,.98,.24);group.add(torso);
  const hips=workshop.softForm([[-.13,.15,.092,0],[-.09,.215,.132,0],[.05,.229,.14,0],[.12,.18,.10,0]]);hips.position.set(0,.62,.2);group.add(hips);
  workshop.stitches(torso,[[0,.32,-.101],[0,.18,-.138],[0,-.08,-.139],[0,-.30,-.126]],.008,42);
  for(const sign of [-1,1])workshop.stitches(torso,[[sign*.16,.31,-.085],[sign*.238,.17,-.036],[sign*.203,-.14,-.035],[sign*.18,-.30,-.04]],.007,34);
  const legs=[],feet=[];
  for(const sign of [-1,1]) {
    const leg=workshop.softForm([[-.275,.071,.066,0],[-.23,.078,.077,0],[-.03,.079,.080,0],[.17,.09,.088,0],[.275,.075,.065,0]]);leg.position.set(sign*.123,.335,-.055);group.add(leg);legs.push(leg);
    workshop.stitches(leg,[[sign*.064,-.25,-.031],[sign*.077,-.06,-.035],[sign*.085,.14,-.039],[sign*.062,.25,-.025]],.005,34);
    const foot=workshop.softForm([[-.057,.053,.104,-.005],[-.045,.093,.153,-.022],[.011,.092,.159,-.029],[.048,.075,.125,-.006],[.057,.047,.067,.013]],workshop.highlight);foot.position.set(sign*.123,.057,-.20);group.add(foot);feet.push(foot);
    workshop.stitches(foot,[[-.08,-.02,-.075],[0,-.018,-.181],[.08,-.02,-.075]],.005,28);
  }
  const left=makeHand(THREE,workshop,true,true),right=makeHand(THREE,workshop,true),leftHand=left.hand,rightHand=right.hand;
  leftHand.name="traveler-left-probe-hand";rightHand.name="traveler-right-device-hand";
  leftHand.position.set(-.35,1.08,-.45);rightHand.position.set(.36,1.08,-.45);leftHand.rotation.z=-.16;group.add(leftHand,rightHand);
  const grip=new THREE.Group();grip.name="traveler-magnifier-grip";grip.position.set(0,.05,-.05);rightHand.add(grip);
  const upperArms=[],lowerArms=[],sleeves=[];
  // Two-bone arm: shoulder sleeve (torso shoulder -> elbow), forearm sleeve
  // (elbow -> cuff), felt forearm (cuff -> wrist). Always anchored at the torso.
  const UPPER=.34,SLEEVE=.40;
  for(let i=0;i<2;i++) {
    const upper=workshop.softForm([[-.5,.042,.038,0],[0,.046,.04,0],[.5,.048,.04,0]],workshop.sleeve);
    const sleeve=workshop.softForm([[-.5,.036,.032,0],[-.43,.048,.043,0],[.2,.053,.045,0],[.5,.05,.043,0]],workshop.sleeve);
    const forearm=workshop.softForm([[-.5,.032,.023,0],[-.30,.036,.027,0],[.35,.040,.031,0],[.5,.042,.033,0]]);
    upper.name=i?"right-felt-upper-arm":"left-felt-upper-arm";
    sleeve.name=i?"right-tailored-felt-sleeve":"left-tailored-felt-sleeve";
    forearm.name=i?"right-felt-forearm":"left-felt-forearm";
    workshop.stitches(sleeve,[[.041,-.46,-.021],[.055,0,-.025],[.054,.45,-.021]],.004,24);
    workshop.stitches(sleeve,[[-.041,-.44,-.021],[0,-.43,-.039],[.041,-.44,-.021]],.004,14);
    group.add(upper,sleeve,forearm);upperArms.push(upper);sleeves.push(sleeve);lowerArms.push(forearm);
  }
  let inspection=0,lastTime=null,tiny=false,lastBob=0,viewHeight=1.55;
  function setViewHeight(value=1.55){
    viewHeight=Math.max(.18,Math.min(2,value));
    // Standing: the whole body is below the eye, so looking down shows it.
    // Crouched or climbing the eye sits inside the torso; hide it then.
    const standing=viewHeight>=1.4;torso.visible=hips.visible=standing;for(const leg of legs)leg.visible=standing;
  }
  function solveLimbs() {
    for(let i=0;i<2;i++) {
      const hand=i?rightHand:leftHand,sign=i?1:-1,ratio=hand.scale.x;
      const wrist=new THREE.Vector3(0,0,.070*handSculpt.detailScale).multiply(hand.scale).applyQuaternion(hand.quaternion).add(hand.position);
      const shoulder=new THREE.Vector3(sign*.28,Math.min(1.25,viewHeight-.30),.05);
      const backward=shoulder.clone().sub(wrist).normalize();
      // Forearm and cuff shrink with the palm; the sleeves keep their length and
      // only taper toward it, so a shrunk hand still hangs off a full-size body.
      const cuff=wrist.clone().addScaledVector(backward,.105*ratio);
      const axis=cuff.clone().sub(shoulder),d=Math.max(1e-4,axis.length());axis.divideScalar(d);
      const reach=Math.min(d,UPPER+SLEEVE),a=(UPPER*UPPER-SLEEVE*SLEEVE+reach*reach)/(2*reach),h=Math.sqrt(Math.max(0,UPPER*UPPER-a*a));
      const bend=new THREE.Vector3(sign*.3,-1,-.1);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
      const elbow=shoulder.clone().addScaledVector(axis,a).addScaledVector(bend,h);
      aimLimb(THREE,lowerArms[i],wrist,cuff);
      aimLimb(THREE,sleeves[i],cuff,elbow);
      aimLimb(THREE,upperArms[i],elbow,shoulder);
      lowerArms[i].scale.x=lowerArms[i].scale.z=ratio;
      sleeves[i].scale.x=sleeves[i].scale.z=(1+ratio)/2;
    }
    group.userData.armScale=leftHand.scale.x;
  }
  // Purple-field probe: the rig owns the left hand while active. World-space
  // plane; depth>0 means the palm is inside, which shrinks it toward .4.
  const restLeft=leftHand.position.clone();
  const field={state:"idle",depth:0,set(o){field.point=o.point.clone();field.normal=o.normal.clone().normalize();field.onContact=o.onContact;field.rest=o.rest?.clone();},
    // Reach from the chest rest (if set), not from wherever choreography left the hand: the poke must start outside the plane.
    reachIn(){if(!field.point)return;field.state="reaching";field.t=0;field.shrink=0;field.from=(field.rest||leftHand.position).clone();leftHand.position.copy(field.from);field.crossed=false;},
    pullBack(){if(field.state==="idle")return;field.state="withdrawing";field.t=0;field.from=leftHand.position.clone();},
    clear(){field.state="idle";field.depth=0;field.shrink=0;field.onContact?.(field.point,0);}};
  function updateField(dt) {
    if(field.state==="idle"||!field.point)return;
    group.updateMatrixWorld(true);
    const pLocal=group.worldToLocal(field.point.clone()),nLocal=field.normal.clone().applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
    const palm=new THREE.Vector3(0,0,-.03).applyQuaternion(leftHand.quaternion);
    const rest=field.rest||restLeft;
    if(field.state==="reaching"||field.state==="inside") {
      const target=pLocal.clone().addScaledVector(nLocal,-.05).sub(palm);
      field.t=Math.min(1,field.t+dt/1.1);leftHand.position.copy(field.from).lerp(target,field.t*field.t*(3-2*field.t));
    } else if(field.state==="withdrawing") {
      field.t=Math.min(1,field.t+dt/1.0);leftHand.position.copy(field.from).lerp(rest,field.t*field.t*(3-2*field.t));
    }
    field.depth=pLocal.clone().sub(leftHand.position.clone().add(palm)).dot(nLocal);
    // The shrink is its own beat: full size at the plane, then down to .4 over .6 s; back up as the hand leaves.
    if(field.state==="inside")field.shrink=Math.min(1,(field.shrink||0)+dt/.6);
    else if(field.state==="withdrawing"&&field.depth<.02)field.shrink=Math.max(0,(field.shrink||0)-dt/.5);
    const s=field.shrink||0,scale=1-.6*s*s*(3-2*s);
    leftHand.scale.setScalar(scale);
    field.onContact?.(field.point,field.depth>-.12&&field.depth<.12?1-Math.abs(field.depth)/.12:0);
    const detail={depth:field.depth,scale};
    if(field.state==="reaching"&&field.depth>0&&!field.crossed){field.crossed=true;field.state="inside";dispatchEvent(new CustomEvent("lb:field-reached",{detail}));}
    if(field.state==="withdrawing"&&field.t>=1){field.state="idle";leftHand.scale.setScalar(1);field.onContact?.(field.point,0);dispatchEvent(new CustomEvent("lb:field-withdrawn",{detail:{depth:field.depth,scale:1}}));}
  }
  function setLeftPose(name="open",amount=1,time=0) {
    amount=Math.max(0,Math.min(1,amount));
    left.chains.forEach(({base,joints,thumb},index)=>{if(thumb)base.rotation.y=1.02+((name==="pinch"||name==="curl"?-.35:1.02)-1.02)*amount;joints.forEach((joint,j)=> {
      const rest=thumb?.15:.07+j*.08+Math.sin(time*2+index)*.025;
      const target=name==="pinch"?(thumb?[.70,.80][j]:index===0?[1.0,1.10,.75][j]:.15+j*.07):name==="inspect"?(thumb?.35:[.05,.20,.15][j]):name==="curl"?(thumb?[.70,.80][j]:[1.0,1.10,.75][j]):rest;
      joint.rotation.x=-(rest+(target-rest)*amount);
    });});
  }
  function update(time=0,moving=false,inspect=false) {
    const dt=lastTime===null?1/60:Math.min(.1,Math.max(0,time-lastTime));lastTime=time;
    const amount=typeof inspect==="number"?Math.max(0,Math.min(1,inspect)):inspect?1:0;inspection+=(amount-inspection)*(1-Math.exp(-dt*10));
    const stride=moving?Math.sin(time*8):0;lastBob=moving?Math.sin(time*16)*.008:Math.sin(time*2)*.002;
    rightHand.position.set(.36-inspection*.33,1.08+inspection*.24+lastBob,-.45-inspection*.80);rightHand.rotation.set(inspection*-.08,inspection*-.08,0);
    // A slight forward lean on the legs shows their length from above instead of two end-on stubs.
    for(let i=0;i<2;i++){legs[i].rotation.x=-.18+stride*.12*(i?-1:1);feet[i].position.z=-.20+stride*.03*(i?-1:1);}
    setLeftPose("open",1,time);right.chains.forEach(({base,joints,thumb})=>{if(thumb)base.rotation.y=-.35;joints.forEach((joint,j)=>joint.rotation.x=-(thumb?[.3,.9][j]:[.45,.72,.50][j]));});updateField(dt);solveLimbs();leftHand.userData.tiny=tiny;
  }
  function setTinyHand(value){tiny=Boolean(value);if(field.state==="idle")leftHand.scale.setScalar(tiny?.23:1);leftHand.userData.tiny=tiny;}
  update(0,false,false);
  return {group,leftHand,rightHand,grip,field,update,setTinyHand,solveLimbs,setLeftPose,setViewHeight,dispose(){left.skeleton.dispose();right.skeleton.dispose();workshop.dispose();}};
}

export function createClayHand(THREE) {
  const workshop=makeWorkshop(THREE,false),group=new THREE.Group();group.name="independent-sculpted-purple-clay-finger-thief";
  const {hand,chains,skeleton}=makeHand(THREE,workshop,false);group.add(hand);
  // Continuous clay forearm overlaps the fused wrist and follows the same hand
  // transform. Its long tapered end trails back (+z) and stays beneath the table.
  const forearm=workshop.softForm([[.047,.023,.018,0],[.075,.031,.025,0],[.20,.037,.032,0],[.43,.043,.037,0],[.64,.047,.039,0]]);
  forearm.name="thief-connected-long-clay-forearm";forearm.rotation.x=Math.PI/2;hand.add(forearm);
  // Coach Armie canon (tv/assets/armie-intro/coach-hand.mjs): a fur ring where
  // the forearm starts and two mismatched googly eyes whose pupils lag behind.
  const furMaterial=new THREE.MeshStandardMaterial({color:0xc79be0,roughness:1});
  const FUR=280,fur=new THREE.InstancedMesh(workshop.own(new THREE.ConeGeometry(.008,.045,5)),furMaterial,FUR);
  fur.name="thief-forearm-fur-ring";fur.castShadow=false;fur.userData.visualOnly=true;
  {const m=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),seed=i=>Math.abs(Math.sin(i*12.9898+78.233)*43758.5453)%1;
    for(let i=0;i<FUR;i++){const th=i/FUR*TAU*7.3+seed(i)*.9,y=.12+seed(i+1)*.10,rx=.030+y*.03,rz=.025+y*.03;
      const dir=new THREE.Vector3(Math.cos(th)*rz,.35+seed(i+2)*.5,Math.sin(th)*rx).normalize();q.setFromUnitVectors(up,dir);
      m.compose(new THREE.Vector3(Math.cos(th)*rx*.92,y,Math.sin(th)*rz*.92).addScaledVector(dir,.012),q,new THREE.Vector3(1,.7+seed(i+3)*.7,1));fur.setMatrixAt(i,m);}
    forearm.add(fur);}
  const sclera=new THREE.MeshStandardMaterial({color:0xfffdf6,roughness:.35}),ink=new THREE.MeshStandardMaterial({color:0x120a14,roughness:.3});
  // Eyes sit at the hand end of the forearm, where the theft camera looks: big r .045, small r .028 (10:6).
  const eyes=[[-.022,.055,-.022,.045],[.026,.098,-.022,.028]].map(([x,y,z,r],i)=>{
    const eye=workshop.mesh(new THREE.SphereGeometry(1,18,12),sclera);eye.name=i?"coach-small-googly-eye":"coach-big-googly-eye";eye.position.set(x,y,z);eye.scale.setScalar(r);forearm.add(eye);
    const pupil=workshop.mesh(new THREE.SphereGeometry(.5,12,8),ink);pupil.position.z=-.7;eye.add(pupil);
    return {pupil,r,pos:new THREE.Vector2(),vel:new THREE.Vector2()};});
  let lastWorld=null,lastEyeTime=null;
  function updateEyes() {
    const now=performance.now()/1000,dt=lastEyeTime===null?1/60:Math.min(.1,now-lastEyeTime);lastEyeTime=now;
    group.updateMatrixWorld(true);const world=group.getWorldPosition(new THREE.Vector3());
    const delta=lastWorld?world.clone().sub(lastWorld):new THREE.Vector3();lastWorld=world;
    delta.applyQuaternion(forearm.getWorldQuaternion(new THREE.Quaternion()).invert());
    eyes.forEach((e,i)=>{
      // Pupils are loose beads: movement throws them the other way, a spring brings them back.
      e.vel.x+=(-delta.x*18-e.pos.x*60-e.vel.x*7)*dt;e.vel.y+=(-delta.y*18-e.pos.y*60-e.vel.y*7)*dt;
      e.pos.addScaledVector(e.vel,dt);const room=.4;if(e.pos.length()>room)e.pos.setLength(room);
      e.pupil.position.set(e.pos.x+Math.sin(now*1.3+i*2.4)*.06,e.pos.y+Math.cos(now*.9+i)*.06,-.7);
    });
  }
  const grip=new THREE.Group();grip.name="clay-thief-frame-edge-pinch";grip.position.set(-.033,-.052,-.019);hand.add(grip);
  function poseFingers(name,time,graspAmount=0) {
    const walking=["crawl","walk","walking"].includes(name),climbing=["climb","climbing"].includes(name);
    chains.forEach(({base,joints,thumb},index)=> {
      const step=Math.sin(time*(climbing?7:9)+index*1.8);if(!thumb)base.rotation.y=(index-1.5)*.065*(1-graspAmount);else base.rotation.y=1.02-graspAmount*1.37;
      joints.forEach((joint,j)=> {
        let angle=walking?(thumb?.7:[.48+step*.32,.5-step*.32,-.25][j]):climbing?(thumb?.35:[.1+step*.4,.78-step*.28,.4][j]):thumb?.28:[.18,.28,.14][j];
        const grasp=thumb?[.70,.80][j]:[1.0,1.10,.75][j];joint.rotation.x=-(angle+(grasp-angle)*graspAmount);
      });
    });
  }
  function setPose(name="crawl",time=0) {
    time=time;
    const walking=["crawl","walk","walking"].includes(name),climbing=["climb","climbing"].includes(name),grasping=["grasp","grab","hold","carrying"].includes(name);
    hand.position.set(0,walking?.145+Math.sin(time*12)*.008:climbing?.155:.145,0);hand.rotation.set(climbing?-.55:grasping?-.17:.04,0,walking?Math.sin(time*6)*.04:0);
    poseFingers(name,time,grasping?1:0);group.userData.pose=name;updateEyes();
  }
  function setGrasp(amount=1,time=0){poseFingers("rest",time,Math.max(0,Math.min(1,amount)));group.userData.grasp=amount;updateEyes();}
  // Coach Armie GLB (tv/assets/armie-intro/models/coach-hand.glb, shared with the Armie channel) replaces the
  // procedural clay once it loads; this hand stays as the fallback and keeps owning grip, pose and path.
  // The GLB coach lies with its pointy face on the grip (fingers at -z), body trailing +z, eyes up to the camera.
  let coach=null;const COACH_LENGTH=.8;
  import("/tv/assets/armie-intro/coach-3d.mjs").then(m=>m.loadCoachParts().then(parts=>m.buildCoach(THREE,parts))).then(c=>{
    coach=c;c.group.rotation.set(-Math.PI/2,Math.PI/2,0,"YXZ");c.group.scale.setScalar(COACH_LENGTH);
    c.group.position.set(grip.position.x,grip.position.y+.06,grip.position.z+COACH_LENGTH*.5);
    for(const child of hand.children)if(child!==grip)child.visible=false;
    c.group.traverse(o=>{if(o.isMesh)o.castShadow=true;});hand.add(c.group);group.userData.coachModel=true;
  }).catch(e=>console.warn("3D coach unavailable, keeping clay hand:",e.message));
  const tickCoach=()=>coach?.tick(performance.now(),{pressure:.5+.5*(group.userData.grasp||0)});
  const pose=setPose,grasp=setGrasp;setPose=(n,t)=>{pose(n,t);tickCoach();};setGrasp=(a,t)=>{grasp(a,t);tickCoach();};
  setPose("crawl",0);return {group,grip,setPose,setGrasp,dispose(){skeleton.dispose();workshop.dispose();furMaterial.dispose();sclera.dispose();ink.dispose();}};
}
