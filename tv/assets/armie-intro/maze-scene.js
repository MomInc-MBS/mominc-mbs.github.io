import {courseFor,pathAt,LANES,LENGTH,TURN_AT} from './maze-run.mjs?v=ship-3';
import {routeFor} from './ship-routes.mjs?v=ship-3';

export function createMazeScene(THREE){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#100918');scene.fog=new THREE.Fog('#21122d',22,70);
  scene.add(new THREE.HemisphereLight('#dfc8ef','#392343',2.4));
  const fill=new THREE.DirectionalLight('#ffe0aa',2.3);fill.position.set(-3,6,4);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(72,1,.06,160);
  const material=(color,metalness=.4,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const purple=material('#674374'),inset=material('#392344'),gold=material('#bb9354',.65,.34),deck=material('#553661',.5,.38),black=material('#151020'),cargo=material('#624777');
  const glow=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
  const warm=glow('#ffe6b0'),pink=glow('#ff69d6'),cyan=glow('#79e8ff'),red=glow('#ff593e');
  let group=null,seed=null,cameraLane=LANES[0],yaw=0,shutters=[],doorPanels=[];
  function box(w,h,d,mat,x,y,z,parent=group){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function label(lines,escape=false,w=2.25,h=.88){
    const c=document.createElement('canvas');c.width=768;c.height=288;const g=c.getContext('2d');
    const color=escape?'#ff7954':'#ff85e5';g.fillStyle=escape?'#24110e':'#230d30';g.fillRect(0,0,c.width,c.height);
    g.strokeStyle=color;g.lineWidth=5;g.shadowColor=color;g.shadowBlur=18;g.strokeRect(10,10,748,268);g.textAlign='center';g.fillStyle=color;
    lines.forEach((text,i)=>{g.font=`bold ${i===0?52:40}px monospace`;g.fillText(text,384,70+i*82,722);});
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,toneMapped:false}));mesh.userData.sign=lines.join(' / ');return mesh;
  }
  function section(length,x,z,rotation=0){
    const part=new THREE.Group();part.position.set(x,0,z);part.rotation.y=rotation;group.add(part);
    box(.25,3.8,length,purple,0,1.9,0,part);box(.035,.04,length,cyan,.14,.28,0,part);box(.035,.05,length,gold,.14,3.35,0,part);
    for(let d=-length/2+1;d<length/2;d+=3){box(.31,3.8,.1,gold,0,1.9,d,part);box(.28,2.2,2.65,inset,0,1.6,d+1.4,part);box(.35,.11,2.65,gold,0,2.9,d+1.4,part);for(let y=.8;y<1.4;y+=.16)box(.3,.035,.62,black,0,y,d+.8,part);}
  }
  function batchStaticBoxes(){
    group.updateMatrixWorld(true);const batches=new Map();
    group.traverse(mesh=>{
      if(mesh.geometry?.type!=='BoxGeometry')return;
      for(let p=mesh;p&&p!==group;p=p.parent)if(p.userData.dynamic)return;
      if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(mesh);
    });
    for(const [mat,meshes] of batches){
      const instances=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,meshes.length);
      meshes.forEach((mesh,i)=>{const {width,height,depth}=mesh.geometry.parameters;instances.setMatrixAt(i,mesh.matrixWorld.clone().multiply(new THREE.Matrix4().makeScale(width,height,depth)));mesh.removeFromParent();mesh.geometry.dispose();});
      instances.computeBoundingSphere();group.add(instances);
    }
  }
  function build(nextSeed){
    if(group){group.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});scene.remove(group);}
    seed=nextSeed;group=new THREE.Group();scene.add(group);shutters=[];doorPanels=[];cameraLane=LANES[0];yaw=0;
    const course=courseFor(seed),sign=seed%2?1:-1,cracks=course.filter(e=>e.type==='crack'),bayStart=LENGTH-12;
    // Sealed purple bulkheads, gold ribs, illuminated deck rails and overhead ship fixtures.
    for(let d=0;d<bayStart;d++){
      const p=pathAt(d,seed),part=new THREE.Group();part.position.set(p.x,0,p.z);part.rotation.y=p.yaw;group.add(part);
      if(!cracks.some(e=>Math.abs(d-e.at)<1.3)){box(4.1,.25,1.02,deck,0,-.14,0,part);for(const lane of LANES)box(1.65,.015,.025,gold,lane,.005,.49,part);}
      box(4.5,.18,1.02,black,0,3.8,0,part);
      if(d%6===0){box(1.55,.04,.8,warm,0,3.68,0,part);for(const side of [-1,1])box(.1,.1,1,gold,side*1.7,3.45,0,part);}
    }
    box(4.4,.25,4.4,deck,0,-.14,-TURN_AT);box(4.4,.18,4.4,black,0,3.8,-TURN_AT);
    for(const side of [-1,1]){const end=side===sign?TURN_AT-2.15:TURN_AT+2.15;section(end+3,side*2.2,-(end-3)/2,side<0?0:Math.PI);}
    section(4.5,0,-TURN_AT-2.2,Math.PI/2);
    for(const side of [-1,1])section(bayStart-TURN_AT-2.2,sign*(bayStart-TURN_AT+2.2)/2,-TURN_AT+side*2.2,Math.PI/2);
    const turn=label([sign>0?'TURN RIGHT →':'← TURN LEFT','MOM INC / TRANSIT'],false,2.3,.72);turn.position.set(0,2.25,-TURN_AT-2.04);group.add(turn);
    for(const event of course){
      if(event.type==='turn')continue;
      const p=pathAt(event.at,seed),hazard=new THREE.Group();hazard.position.set(p.x,0,p.z);hazard.rotation.y=p.yaw;group.add(hazard);hazard.userData.trap=event.type;
      if(event.type==='crack'){
        box(4.05,.1,2.8,black,0,-1.3,0,hazard);
        for(const z of [-1.55,1.55]){box(4.05,.06,.13,red,0,.03,z,hazard);for(let x=-1.9;x<2;x+=.45){const stripe=box(.2,.025,.3,gold,x,.065,z,hazard);stripe.rotation.y=.5;}}
        const board=label(['DECK BREACH','↑ JUMP ↑'],true,1.35,.55);board.position.set(0,.64,-1.65);hazard.add(board);
      }else if(event.type==='rubble'){
        const lane=LANES[event.lane];box(1.48,.88,1.25,cargo,lane,.44,0,hazard);for(const x of [-.58,.58])box(.09,.94,1.3,gold,lane+x,.47,0,hazard);box(1.52,.06,1.3,red,lane,.92,0,hazard);
        const board=label(['MOM INC','CARGO'],false,.92,.37);board.position.set(lane,.46,.64);hazard.add(board);
      }else{
        const lane=LANES[event.lane],shutter=new THREE.Group();shutter.userData.dynamic=true;shutter.position.set(lane,0,0);hazard.add(shutter);shutters.push({mesh:shutter,at:event.at,lane});
        box(1.68,2.4,.35,black,0,2.43,0,shutter);for(let y=1.25;y<3.5;y+=.25)box(1.68,.055,.4,pink,0,y,0,shutter);for(const side of [-1,1])box(.1,3.65,.5,gold,side*.89,1.82,0,shutter);
        const board=label(['ENERGY SHUTTER','↓ SLIDE / DODGE'],true,1.5,.5);board.position.set(0,2.75,.25);shutter.add(board);
      }
    }
    // Every run opens into a ship junction with three real doorways, all in view at the stop.
    const p=pathAt(bayStart,seed),bay=new THREE.Group();bay.position.set(p.x,0,p.z);bay.rotation.y=p.yaw;group.add(bay);
    const doorZ=-(LENGTH+13-bayStart),roomLength=-doorZ+3;
    box(10.8,.25,roomLength,deck,0,-.14,-roomLength/2+1,bay);box(10.8,.2,roomLength,black,0,4.45,-roomLength/2+1,bay);
    for(const side of [-1,1]){box(.3,4.5,roomLength,purple,side*5.4,2.25,-roomLength/2+1,bay);box(.05,.1,roomLength,pink,side*5.21,3.7,-roomLength/2+1,bay);}
    for(let z=-3;z>doorZ;z-=5)box(3,.06,1,warm,0,4.31,z,bay);
    box(10.8,4.5,.4,inset,0,2.25,doorZ-.65,bay);
    const route=routeFor(seed),banner=label(['MOM INC / '+String(seed+1).padStart(2,'0'),'CHOOSE YOUR WAY HOME'],false,5.5,.65);banner.position.set(0,4,doorZ+.15);bay.add(banner);
    for(let i=0;i<3;i++){
      const x=(i-1)*3.1,escape=i===route.correct;box(2.5,2.9,.5,black,x,1.45,doorZ-.15,bay);
      const panel=box(2.2,2.8,.12,escape?purple:inset,x,1.4,doorZ+.12,bay);panel.userData.dynamic=true;doorPanels.push({mesh:panel,x,index:i});
      for(const side of [-1,1]){box(.13,3.05,.27,gold,x+side*1.21,1.52,doorZ+.15,bay);box(.035,2.85,.3,escape?red:pink,x+side*1.1,1.42,doorZ+.17,bay);}
      box(2.6,.12,.25,gold,x,2.96,doorZ+.15,bay);
      const board=label(route.doors[i],escape,2.8,.88);board.position.set(x,3.43,doorZ+.2);board.userData.door=i;bay.add(board);
      const arrow=label([['← LEFT','↑ STRAIGHT','RIGHT →'][i]],escape,2,.45);arrow.position.set(x,2.32,doorZ+.25);bay.add(arrow);
      if(escape)for(let y=.4;y<1.5;y+=.25){const scratch=box(1.6,.035,.03,red,x,y,doorZ+.21,bay);scratch.rotation.z=.08;}
    }
    batchStaticBoxes();
  }
  return {scene,camera,render(renderer,run,motion=true,options={}){
    if(seed!==run.seed)build(run.seed);
    const end=!!options.junction,p=pathAt(end?LENGTH:run.distance,seed),blend=motion?.22:1,center=Math.max(0,Math.min(1,(run.distance-(LENGTH-8))/8));
    cameraLane=end?0:cameraLane+(LANES[run.lane]*(1-center)-cameraLane)*blend;yaw=end?p.yaw:yaw+(p.yaw-yaw)*(motion?.18:1);
    const bob=motion&&!run.paused&&!end&&run.height<.1?Math.sin(run.time*17)*.045:0;
    camera.aspect=renderer.domElement.clientWidth/Math.max(1,renderer.domElement.clientHeight);camera.fov=72+10*(end?1:center);camera.updateProjectionMatrix();
    camera.position.set(p.x+Math.cos(p.yaw)*cameraLane,1.67+(end?0:run.height-(run.duck||0)*1.03)+bob,p.z-Math.sin(p.yaw)*cameraLane);camera.rotation.set(0,yaw,0,'YXZ');
    shutters.forEach(({mesh,at,lane})=>{const approach=Math.max(0,Math.min(1,(run.distance-(at-11))/5));mesh.position.x=lane+(1-approach)*(lane>0?2:-2);});
    doorPanels.forEach(({mesh,x,index})=>mesh.position.x=x+(options.open&&index===routeFor(seed).correct?2.3:0));renderer.render(scene,camera);
  }};
}
