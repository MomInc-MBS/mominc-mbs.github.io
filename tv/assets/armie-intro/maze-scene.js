import {courseFor, pathAt, LANES, LENGTH} from './maze-run.mjs?v=swipe-2';

export function createMazeScene(THREE) {
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#8d9996');
  scene.fog=new THREE.Fog('#8d9996',14,52);
  scene.add(new THREE.HemisphereLight('#e5ece2','#2a2836',2.3));
  const sun=new THREE.DirectionalLight('#ffe1a6',3.3);sun.position.set(-9,16,6);scene.add(sun);
  const camera=new THREE.PerspectiveCamera(72,1,.06,90);
  const stone=new THREE.MeshStandardMaterial({color:'#686863',roughness:.98});
  const edge=new THREE.MeshStandardMaterial({color:'#454a44',roughness:1});
  const floor=new THREE.MeshStandardMaterial({color:'#9b9582',roughness:.93});
  const moss=new THREE.MeshStandardMaterial({color:'#505c43',roughness:1});
  const warning=new THREE.MeshStandardMaterial({color:'#d3ad55',roughness:.7,emissive:'#75521a',emissiveIntensity:.2});
  const dark=new THREE.MeshBasicMaterial({color:'#080d10'});
  let group=null, seed=null, movingWall=null, cameraLane=LANES[0], yaw=0;
  function box(w,h,d,mat,x,y,z,parent=group){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function label(text,bg='#27332f') {
    const c=document.createElement('canvas');c.width=512;c.height=160;const g=c.getContext('2d');
    g.fillStyle=bg;g.fillRect(0,0,512,160);g.strokeStyle='#e9d28d';g.lineWidth=9;g.strokeRect(8,8,496,144);
    g.fillStyle='#fff1bc';g.textAlign='center';g.font='bold 56px monospace';g.fillText(text,256,102);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.78),new THREE.MeshBasicMaterial({map}));return mesh;
  }
  function build(nextSeed) {
    if(group){group.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});scene.remove(group);}
    seed=nextSeed;group=new THREE.Group();scene.add(group);movingWall=null;cameraLane=LANES[0];yaw=0;
    const course=courseFor(seed), turnRight=seed%2===1;
    // Floor slabs stop at the fissure; its dark bottom is visibly below the walkway.
    for(let d=-3;d<LENGTH+7;d+=1){
      const p=pathAt(d,seed);if(Math.abs(d-13)<1.3)continue;
      for(const lane of LANES){const slab=box(1.78,.32,1.02,floor,p.x+Math.cos(p.yaw)*lane,-.17,p.z-Math.sin(p.yaw)*lane);slab.rotation.y=p.yaw;}
    }
    box(3.8,.1,2.7,dark,0,-1.6,-13);
    box(3.7,.32,3.7,floor,0,-.17,-28);
    for(const z of [-11.6,-14.4])box(3.6,.045,.12,warning,0,.025,z);
    const wallSegment=(length,x,z,rotation=0)=>{
      const part=new THREE.Group();part.position.set(x,0,z);part.rotation.y=rotation;group.add(part);
      box(.6,8,length,stone,0,4,0,part);
      for(let d=-length/2+.7;d<length/2;d+=2.8){
        box(.8,8.4,.22,edge,0,4.1,d,part);
        for(let y=1.8;y<8;y+=2)box(.64,.07,2.75,edge,0,y,d+.9,part);
        if(Math.sin(d*13+x)>0)box(.67,2.4,.4,moss,0,1.1,d,part);
      }
    };
    // Open the inside corner and close the outside corner with a readable sign.
    for(const side of [-1,1]){
      const inside=side===(turnRight?1:-1), end=inside?25.9:30.2;
      wallSegment(end+5,side*2.15,-(end-5)/2);
    }
    const sign=turnRight?1:-1;
    wallSegment(4.8,0,-30.3,Math.PI/2);
    for(const side of [-1,1])wallSegment(35,sign*19.5,-28+side*2.15,Math.PI/2);
    const corner=label(turnRight?'TURN  →':'←  TURN');corner.position.set(0,2.25,-29.92);group.add(corner);
    const obstacle=course[2], p=pathAt(obstacle.at,seed), hazard=new THREE.Group();hazard.position.set(p.x,0,p.z);hazard.rotation.y=p.yaw;group.add(hazard);
    const lane=LANES[obstacle.lane];
    if(obstacle.type==='rubble'){
      const block=box(1.45,.9,1.3,stone,lane,.45,0,hazard);block.rotation.z=.1;
      box(1.5,.11,.15,warning,lane,.94,.65,hazard);
      for(let i=0;i<4;i++){const rock=box(.35,.23,.4,edge,lane+Math.sin(i*3)*.5,.12,.9+i*.13,hazard);rock.rotation.y=i;}
    }else{
      movingWall=box(1.62,2.7,1,stone,lane,2.45,0,hazard);movingWall.userData.lane=lane;
      for(let y=.12;y<2.7;y+=.6)box(1.66,.12,1.04,warning,0,y-1.35,0,movingWall);
      const slideSign=label('↓ SLIDE ↓');slideSign.scale.setScalar(.5);slideSign.position.set(0,-.65,.53);movingWall.add(slideSign);
      box(3.8,.05,1.15,edge,0,.01,0,hazard);
    }
    const end=pathAt(LENGTH+3,seed), gate=new THREE.Group();gate.position.set(end.x,0,end.z);gate.rotation.y=end.yaw;group.add(gate);
    box(4.25,5,.5,edge,0,2.5,0,gate);box(2.7,3.3,.56,dark,0,1.65,.02,gate);
    const gateLabel=label('M.O.M. / LINK');gateLabel.position.set(0,3.85,.3);gate.add(gateLabel);
  }
  return {scene,camera,render(renderer,run,motion=true){
    if(seed!==run.seed)build(run.seed);
    const p=pathAt(run.distance,seed), blend=motion?.22:1;
    cameraLane+=(LANES[run.lane]-cameraLane)*blend;yaw+=(p.yaw-yaw)*(motion?.18:1);
    const bob=motion&&!run.paused&&run.height<.1?Math.sin(run.time*17)*.045:0;
    camera.aspect=renderer.domElement.clientWidth/Math.max(1,renderer.domElement.clientHeight);camera.updateProjectionMatrix();
    camera.position.set(p.x+Math.cos(p.yaw)*cameraLane,1.67+run.height-(run.duck||0)*1.03+bob,p.z-Math.sin(p.yaw)*cameraLane);
    camera.rotation.set(0,yaw,motion?Math.sin(run.time*8.5)*.005:0,'YXZ');
    if(movingWall){const approach=Math.max(0,Math.min(1,(run.distance-31)/5));movingWall.position.x=movingWall.userData.lane+(1-approach)*(movingWall.userData.lane>0?2:-2);}
    renderer.render(scene,camera);
  }};
}
