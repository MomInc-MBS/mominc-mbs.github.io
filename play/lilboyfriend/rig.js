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
      const start=row*(radial+1);if(row===0)indices.push(start,start+i+1,start+i);else indices.push(start,start+i,start+i+1);
    }
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(position,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(g,mat);
  }
  return {surface,highlight,cuff,sleeve,mesh,own,pad,thread,stitches,softForm,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}

function makeHand(THREE,workshop,felt) {
  const hand=new THREE.Group();hand.name=felt?"sewn-felt-anatomical-glove":"continuous-purple-clay-hand";
  const root=new THREE.Bone();root.name="palm-root";hand.add(root);
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
  const skin=new THREE.SkinnedMesh(geometry,workshop.surface);skin.name="voxel-fused-palm-webbing-and-fingers";skin.castShadow=skin.receiveShadow=true;skin.frustumCulled=false;hand.add(skin);
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
  torso.visible=false;hips.visible=false;
  const legs=[],feet=[];
  for(const sign of [-1,1]) {
    const leg=workshop.softForm([[-.275,.071,.066,0],[-.23,.078,.077,0],[-.03,.079,.080,0],[.17,.09,.088,0],[.275,.075,.065,0]]);leg.position.set(sign*.123,.335,-.055);group.add(leg);leg.visible=false;legs.push(leg);
    workshop.stitches(leg,[[sign*.064,-.25,-.031],[sign*.077,-.06,-.035],[sign*.085,.14,-.039],[sign*.062,.25,-.025]],.005,34);
    const foot=workshop.softForm([[-.057,.053,.104,-.005],[-.045,.093,.153,-.022],[.011,.092,.159,-.029],[.048,.075,.125,-.006],[.057,.047,.067,.013]],workshop.highlight);foot.position.set(sign*.123,.057,-.20);group.add(foot);feet.push(foot);
    workshop.stitches(foot,[[-.08,-.02,-.075],[0,-.018,-.181],[.08,-.02,-.075]],.005,28);
  }
  const left=makeHand(THREE,workshop,true),right=makeHand(THREE,workshop,true),leftHand=left.hand,rightHand=right.hand;
  leftHand.name="traveler-left-probe-hand";rightHand.name="traveler-right-device-hand";
  leftHand.position.set(-.35,1.08,-.45);rightHand.position.set(.36,1.08,-.45);leftHand.rotation.z=-.16;group.add(leftHand,rightHand);
  const grip=new THREE.Group();grip.name="traveler-magnifier-grip";grip.position.set(0,.05,-.05);rightHand.add(grip);
  const upperArms=[],lowerArms=[];
  // Only the dressed distal arm enters the frame. The shoulder stays behind the
  // eye plane; a bounded sleeve prevents a probe reach becoming a giant pole.
  for(let i=0;i<2;i++) {
    const sleeve=workshop.softForm([[-.5,.038,.034,0],[-.43,.054,.048,0],[.2,.062,.051,0],[.5,.057,.048,0]],workshop.sleeve);
    const forearm=workshop.softForm([[-.5,.032,.023,0],[-.30,.036,.027,0],[.35,.040,.031,0],[.5,.042,.033,0]]);
    sleeve.name=i?"right-tailored-felt-sleeve":"left-tailored-felt-sleeve";
    forearm.name=i?"right-felt-forearm":"left-felt-forearm";
    workshop.stitches(sleeve,[[.041,-.46,-.021],[.055,0,-.025],[.054,.45,-.021]],.004,24);
    workshop.stitches(sleeve,[[-.041,-.44,-.021],[0,-.43,-.039],[.041,-.44,-.021]],.004,14);
    group.add(sleeve,forearm);upperArms.push(sleeve);lowerArms.push(forearm);
  }
  let inspection=0,lastTime=null,tiny=false,lastBob=0,viewHeight=1.55;
  function setViewHeight(value=1.55){viewHeight=Math.max(.18,Math.min(2,value));}
  function solveLimbs() {
    for(let i=0;i<2;i++) {
      const hand=i?rightHand:leftHand,sign=i?1:-1,ratio=hand.scale.x;
      const wrist=new THREE.Vector3(0,0,.070*handSculpt.detailScale).multiply(hand.scale).applyQuaternion(hand.quaternion).add(hand.position);
      const shoulder=new THREE.Vector3(sign*.30,viewHeight-.38,.12);
      const backward=shoulder.sub(wrist).normalize();
      // The complete distal form shrinks with the palm, including its length,
      // cuff, seam and forearm. There is no normal-sized cylinder at a tiny wrist.
      const cuff=wrist.clone().addScaledVector(backward,.105*ratio);
      const sleeveEnd=wrist.clone().addScaledVector(backward,.46*ratio);
      aimLimb(THREE,lowerArms[i],wrist,cuff);
      aimLimb(THREE,upperArms[i],cuff,sleeveEnd);
      for(const limb of [upperArms[i],lowerArms[i]]){limb.scale.x=ratio;limb.scale.z=ratio;}
    }
    group.userData.armScale=leftHand.scale.x;
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
    for(let i=0;i<2;i++){legs[i].rotation.x=stride*.12*(i?-1:1);feet[i].position.z=-.20+stride*.03*(i?-1:1);}
    setLeftPose("open",1,time);right.chains.forEach(({base,joints,thumb})=>{if(thumb)base.rotation.y=-.35;joints.forEach((joint,j)=>joint.rotation.x=-(thumb?[.3,.9][j]:[.45,.72,.50][j]));});solveLimbs();leftHand.userData.tiny=tiny;
  }
  function setTinyHand(value){tiny=Boolean(value);leftHand.scale.setScalar(tiny?.23:1);leftHand.userData.tiny=tiny;}
  update(0,false,false);
  return {group,leftHand,rightHand,grip,update,setTinyHand,solveLimbs,setLeftPose,setViewHeight,dispose(){left.skeleton.dispose();right.skeleton.dispose();workshop.dispose();}};
}

export function createClayHand(THREE) {
  const workshop=makeWorkshop(THREE,false),group=new THREE.Group();group.name="independent-sculpted-purple-clay-finger-thief";
  const {hand,chains,skeleton}=makeHand(THREE,workshop,false);group.add(hand);
  // Continuous clay forearm overlaps the fused wrist and follows the same hand
  // transform. Its long tapered end remains beneath the table to the right.
  const forearm=workshop.softForm([[.047,.023,.018,0],[.075,.031,.025,0],[.20,.037,.032,0],[.43,.043,.037,0],[.64,.047,.039,0]]);
  forearm.name="thief-connected-long-clay-forearm";forearm.rotation.x=Math.PI/2;hand.add(forearm);
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
    poseFingers(name,time,grasping?1:0);group.userData.pose=name;
  }
  function setGrasp(amount=1,time=0){poseFingers("rest",time,Math.max(0,Math.min(1,amount)));group.userData.grasp=amount;}
  setPose("crawl",0);return {group,grip,setPose,setGrasp,dispose(){skeleton.dispose();workshop.dispose();}};
}
