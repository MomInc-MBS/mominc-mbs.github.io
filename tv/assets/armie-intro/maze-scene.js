import {courseFor,pathAt,LANES,LENGTH,TURN_AT} from './maze-run.mjs?v=chase-5';
import {routeFor} from './ship-routes.mjs?v=chase-5';

// MOM Inc propaganda for trap boards: never instructions, never arrows.
const SIGNS=[['MOM INC','LOVES YOU'],['REST HERE','MOM IS PROUD'],['NO ONE','LEAVES MOM'],['COME HOME','BABY'],['MOM SEES','EVERYTHING'],['YOU ARE','ALREADY HERS'],['OBEY','MOM INC']];
const R=2.4,CY=1.55,SEG=16,TAU=Math.PI*2; // tube radius, axis height, radial segments

export function createMazeScene(THREE){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#040208');scene.fog=new THREE.Fog('#0c0712',14,48);
  scene.add(new THREE.HemisphereLight('#9d88b8','#140a18',.55));
  const lamp=new THREE.PointLight('#ffd49a',9,12,1.6),ahead=new THREE.PointLight('#ffc77a',14,18,1.6),alarm=new THREE.PointLight('#ff2030',0,16,1.4);
  scene.add(lamp,ahead,alarm);
  const camera=new THREE.PerspectiveCamera(72,1,.06,160);
  const material=(color,metalness=.4,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const hull=new THREE.MeshStandardMaterial({color:'#2a2333',metalness:.78,roughness:.35,side:THREE.BackSide});
  const plate=new THREE.MeshStandardMaterial({color:'#1f1a26',metalness:.75,roughness:.38,side:THREE.DoubleSide});
  const wall=material('#2a2333',.45,.4),inset=material('#1a1620',.7,.4),gold=material('#bb9354',.8,.3),deck=material('#241d2b',.6,.42),black=material('#0b080e',.3,.6),bone=material('#d4a017',.55,.35),gore=material('#4a0a34',.1,.32);
  const glow=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
  const warm=glow('#ffe6b0'),cyan=glow('#79e8ff'),red=glow('#ff593e'),amber=glow('#ffb44a');
  // Animated materials (shared, so batching keeps working): two strobing light banks, emergency strips, lasers, blades.
  const strobeA=glow('#ffe6b0'),strobeB=glow('#ffe6b0'),emergency=glow('#ff1e2e'),laser=glow('#ff4fd8'),blade=glow('#ff3020');blade.side=THREE.DoubleSide;
  const hum=new THREE.MeshBasicMaterial({color:'#ff3fc8',transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const haze=new THREE.MeshBasicMaterial({color:'#ff2a1a',transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
  const hazardTex=canvasTex(256,64,(g,w,h)=>{g.fillStyle='#120c08';g.fillRect(0,0,w,h);g.fillStyle='#d4a017';for(let x=-h;x<w+h;x+=48){g.beginPath();g.moveTo(x,h);g.lineTo(x+24,h);g.lineTo(x+24+h,0);g.lineTo(x+h,0);g.fill();}});
  hazardTex.wrapS=THREE.RepeatWrapping;hazardTex.repeat.set(3,1);const hazard=new THREE.MeshStandardMaterial({map:hazardTex,metalness:.4,roughness:.5});
  const splatTex=canvasTex(256,256,(g)=>{for(let i=0;i<46;i++){const a=Math.random()*TAU,r=Math.random()**2*96,s=6+Math.random()*(34-r/4);g.fillStyle=i%5?'rgba(102,0,68,.92)':'rgba(58,0,38,.95)';g.beginPath();g.ellipse(128+Math.cos(a)*r,128+Math.sin(a)*r,s,s*(.5+Math.random()*.5),a,0,TAU);g.fill();}});
  const splat=new THREE.MeshStandardMaterial({map:splatTex,transparent:true,depthWrite:false,roughness:.18,metalness:.1,polygonOffset:true,polygonOffsetFactor:-2});
  // Space outside the windows: a drifting star shell and a planet, both following the camera so they read as infinitely far.
  const sky=new THREE.Group();scene.add(sky);
  const starGeo=new THREE.BufferGeometry(),starPos=new Float32Array(1600*3);
  for(let i=0;i<1600;i++){const u=Math.random()*2-1,a=Math.random()*TAU,s=Math.sqrt(1-u*u);starPos.set([Math.cos(a)*s*110,u*110,Math.sin(a)*s*110],i*3);}
  starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#e8e2ff',size:1.6,sizeAttenuation:false,fog:false,toneMapped:false}));sky.add(stars);
  const planetTex=canvasTex(256,256,(g)=>{const r=g.createRadialGradient(96,90,8,128,128,128);r.addColorStop(0,'#f6b6ff');r.addColorStop(.45,'#8e5b99');r.addColorStop(.85,'#281433');r.addColorStop(1,'rgba(20,8,30,0)');g.fillStyle=r;g.fillRect(0,0,256,256);g.globalAlpha=.25;g.fillStyle='#d4a017';for(let y=70;y<200;y+=22)g.fillRect(20,y,216,5);});
  const planet=new THREE.Mesh(new THREE.PlaneGeometry(26,26),new THREE.MeshBasicMaterial({map:planetTex,transparent:true,fog:false,depthWrite:false}));
  planet.position.set(-46,-6,-92);planet.lookAt(0,0,0);sky.add(planet);
  // Dust and sparks: 300 motes respawned ahead along the path.
  const DUST=300,dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(DUST*3),dust=[];
  dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
  const motes=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#ffcf8a',size:.022,map:canvasTex(32,32,(g)=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'#fff');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);}),transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));motes.frustumCulled=false;scene.add(motes);
  // Tube pieces: unit-length open cylinders. Window pieces drop two side panels, pit pieces drop the bottom arc.
  const arc=(start,count)=>new THREE.CylinderGeometry(R,R,1,count,1,true,start*TAU/SEG,count*TAU/SEG).rotateX(Math.PI/2);
  const tubeGeo={solid:arc(0,SEG),window:[arc(-3,6),arc(5,6)],pit:arc(2,12)};
  const ribGeo=new THREE.TorusGeometry(R-.04,.07,4,24);
  let group=null,seed=null,cameraLane=LANES[1],yaw=0,rotors=[];
  function box(w,h,d,mat,x,y,z,parent=group){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function label(lines,escape=false,w=2.25,h=.88){
    const c=document.createElement('canvas');c.width=768;c.height=288;const g=c.getContext('2d');
    const color=escape?'#ff7954':'#ff85e5';g.fillStyle=escape?'#24110e':'#230d30';g.fillRect(0,0,c.width,c.height);
    g.strokeStyle=color;g.lineWidth=5;g.shadowColor=color;g.shadowBlur=18;g.strokeRect(10,10,748,268);g.textAlign='center';g.fillStyle=color;
    g.textBaseline='middle';
    lines.forEach((text,i)=>{let size=i===0?80:62;g.font=`bold ${size}px monospace`;while(g.measureText(text).width>708){size--;g.font=`bold ${size}px monospace`;}g.fillText(text,384,144+(i-(lines.length-1)/2)*84);});
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,toneMapped:false}));mesh.userData.sign=lines.join(' / ');return mesh;
  }
  // A bulkhead plate with a round hatch cut where the tube meets a room.
  function bulkhead(w,h,parent,x,z,rotation=0){
    const s=new THREE.Shape();s.moveTo(-w/2,-.3);s.lineTo(w/2,-.3);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.lineTo(-w/2,-.3);
    const hole=new THREE.Path();hole.absarc(0,CY,R-.02,0,TAU,true);s.holes.push(hole);
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(s,16),plate);mesh.position.set(x,0,z);mesh.rotation.y=rotation;parent.add(mesh);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(R-.02,.09,4,32),gold);ring.position.set(x,CY,z);ring.rotation.y=rotation;parent.add(ring);
  }
  // Local along-path placement that also works behind the start line.
  const place=(d)=>d<0?{x:0,z:-d,yaw:0}:pathAt(d,seed);
  function onPath(d,parent=group){const p=place(d),part=new THREE.Group();part.position.set(p.x,0,p.z);part.rotation.y=p.yaw;parent.add(part);return part;}
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
  // Instanced tube: one InstancedMesh per piece geometry, so the whole hull costs a handful of draw calls.
  function instance(geo,mat,matrices){if(!matrices.length)return;const m=new THREE.InstancedMesh(geo,mat,matrices.length);matrices.forEach((x,i)=>m.setMatrixAt(i,x));m.computeBoundingSphere();group.add(m);}
  function build(nextSeed){
    if(group){group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&!Object.values(tubeGeo).flat().includes(o.geometry)&&o.geometry!==ribGeo)o.geometry.dispose();if(o.material?.map&&o.material!==splat&&o.material!==hazard){o.material.map.dispose();o.material.dispose();}});scene.remove(group);}
    seed=nextSeed;group=new THREE.Group();scene.add(group);rotors=[];cameraLane=LANES[1];yaw=0;
    const course=courseFor(seed),sign=seed%2?1:-1,pits=course.filter(e=>e.type==='pit'),bayStart=LENGTH-12,CORNER=3;
    const inPit=d=>pits.some(e=>d>=e.at&&d<e.at+e.length),tube={solid:[],window:[],pit:[],rib:[]};
    const mat=(p,y=CY)=>new THREE.Matrix4().compose(new THREE.Vector3(p.x,y,p.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.yaw),new THREE.Vector3(1,1,1));
    for(let d=-4;d<bayStart;d++){
      if(d+1>TURN_AT-CORNER&&d<TURN_AT+CORNER)continue;
      const p=place(d+.5),m=mat(p),cell=((d%8)+8)%8,win=cell>=2&&cell<=4&&!inPit(d);
      (inPit(d)?tube.pit:win?tube.window:tube.solid).push(m);
      if(d%4===0)tube.rib.push(mat(place(d)));
      const part=onPath(d+.5);
      // Deck strip, lane seams, cyan rails, wall-foot running lights.
      if(!inPit(d)){box(4.2,.25,1.02,deck,0,-.14,0,part);for(const x of [-.625,.625])box(.03,.012,1.02,black,x,.003,0,part);}
      for(const side of [-1,1]){box(.04,.035,1.02,cyan,side*1.72,.03,0,part);if(d%2===0)box(.07,.07,.07,amber,side*1.86,.36,0,part);}
      // Red emergency strips high on both walls, square ceiling lights every 4 units (some strobe).
      for(const side of [-1,1]){const a=side*Math.PI*.3,strip=box(.05,.05,1.02,emergency,Math.sin(a)*(R-.06),CY+Math.cos(a)*(R-.06),0,part);strip.rotation.z=-a;}
      if(d%4===2)box(.9,.04,.9,[warm,strobeA,warm,strobeB][Math.abs(d/4|0)%4],0,CY+R-.12,0,part);
      if(win)for(const side of [-1,1])for(const y of [-.94,.94]){const a=Math.PI/2+y*.42;box(.06,.06,1.02,cyan,side*Math.sin(a)*(R-.03),CY-Math.cos(a)*(R-.03),0,part);}
      if(win&&cell===2)for(const side of [-1,1])for(const z of [.5,-2.5])box(.06,1.9,.08,gold,side*(R-.08),CY,z,part);
    }
    instance(tubeGeo.solid,hull,tube.solid);instance(tubeGeo.pit,hull,tube.pit);instance(ribGeo,gold,tube.rib);
    for(const g of tubeGeo.window)instance(g,hull,tube.window);
    const cap=new THREE.Mesh(new THREE.CircleGeometry(R,SEG),plate);cap.position.set(0,CY,4);group.add(cap);
    // Corner room at the 90 degree turn: two hatches, a sealed end wall and a propaganda board.
    const room=new THREE.Group();room.position.set(0,0,-TURN_AT);group.add(room);const W=CORNER*2;
    box(W,.25,W,deck,0,-.14,0,room);box(W,.2,W,inset,0,4.3,0,room);box(W,4.6,.2,wall,0,2,-CORNER,room);box(.2,4.6,W,wall,-sign*CORNER,2,0,room);
    box(1.2,.04,1.2,strobeA,0,4.18,0,room);for(const x of [-1,1])box(.08,4.3,.08,gold,x*(CORNER-.15),2,-CORNER+.15,room);
    bulkhead(W,4.4,room,0,CORNER);bulkhead(W,4.4,room,sign*CORNER,0,Math.PI/2);
    const turnBoard=label(['ALL HALLS','LEAD TO MOM'],false,2.3,.8);turnBoard.position.set(0,2.4,-CORNER+.12);room.add(turnBoard);
    // Gore on the deck: dark magenta splats, clay chunks, a couple of gold bones.
    const splatGeo=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
    for(let i=0,d=6.3;d<bayStart-2;i++,d+=5.3+(i*7%5)){
      if(inPit(d)||Math.abs(d-TURN_AT)<CORNER+.5)continue;const part=onPath(d),s=.9+(i*13%7)*.18;
      const m=new THREE.Mesh(splatGeo,splat);m.scale.set(s,1,s*1.3);m.rotation.y=i;m.position.set(((i*5%7)-3)*.45,.012,0);part.add(m);
      for(let k=0;k<3;k++){const c=box(.12+k*.05,.08,.1+k*.04,gore,m.position.x+(k-1)*.3,.04,(k-1)*.25,part);c.rotation.y=i+k;}
      if(i%4===1){const b=new THREE.Group();b.position.set(m.position.x*.6,.04,.3);b.rotation.y=i*.7;part.add(b);box(.5,.05,.05,bone,0,0,0,b);for(const x of [-.27,.27])for(const z of [-.03,.03])box(.08,.08,.06,bone,x,0,z,b);}
    }
    // Traps: full-width platform, full-width laser grid, long pit with ledges and a grinder below.
    course.forEach((event,i)=>{
      if(event.type==='turn')return;
      const trap=onPath(event.at);trap.userData.trap=event.type;
      const board=label(SIGNS[(i+seed)%SIGNS.length],event.type==='pit',1.9,.7);board.position.set(0,3.05,-.25);trap.add(board);
      for(const x of [-.6,.6])box(.03,.6,.03,gold,x,3.55,-.25,trap);
      if(event.type==='platform'){
        box(4.6,.6,1.3,inset,0,.3,-.65,trap);box(4.6,.06,1.34,gold,0,.62,-.65,trap);box(4.6,.05,.05,red,0,.66,0,trap);
        const stripes=new THREE.Mesh(new THREE.PlaneGeometry(4.4,.45),hazard);stripes.position.set(0,.3,.005);trap.add(stripes);
      }else if(event.type==='grid'){
        for(const side of [-1,1])box(.18,3.8,.3,gold,side*1.95,1.9,0,trap);box(4.4,.22,.3,gold,0,3.55,0,trap);
        for(let k=0;k<6;k++)box(4.6,.04,.04,laser,0,1.02+k*.42,0,trap);
        const field=new THREE.Mesh(new THREE.PlaneGeometry(4.2,2.4),hum);field.position.set(0,2.08,0);trap.add(field);
      }else{
        const L=event.length,z=-L/2;
        for(const side of [-1,1]){box(1.6,4.2,L,deck,side*1.65,-2.1,z,trap);box(.06,.05,L,gold,side*.87,.02,z,trap);box(.04,.04,L,red,side*.86,-.5,z,trap);}
        box(1.8,4.2,.3,black,0,-2.1,-L-.15,trap);box(1.8,.05,.06,red,0,.01,0,trap);box(1.8,.05,.06,red,0,.01,-L,trap);
        const floor=new THREE.Mesh(new THREE.PlaneGeometry(1.8,L).rotateX(-Math.PI/2),red);floor.position.set(0,-4,z);trap.add(floor);
        const mist=new THREE.Mesh(new THREE.PlaneGeometry(1.7,L).rotateX(-Math.PI/2),haze);mist.position.set(0,-.35,z);trap.add(mist);
        const saw=new THREE.Shape();for(let k=0;k<24;k++){const a=k/24*TAU,r=k%2?.55:.78;saw[k?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}
        const sawGeo=new THREE.ShapeGeometry(saw).rotateY(Math.PI/2);
        for(let k=0;k<5;k++){const m=new THREE.Mesh(sawGeo,blade);m.position.set((k%2?.3:-.3),-1.05,-.7-k*(L-1.4)/4);trap.add(m);rotors.push(m);}
      }
    });
    // Every run opens into a ship junction with three real doorways, all in view at the stop.
    const p=pathAt(bayStart,seed),bay=new THREE.Group();bay.position.set(p.x,0,p.z);bay.rotation.y=p.yaw;group.add(bay);
    const doorZ=-(LENGTH+13-bayStart),roomLength=-doorZ+3;
    bulkhead(10.8,4.55,bay,0,0);
    box(10.8,.25,roomLength,deck,0,-.14,-roomLength/2+1,bay);box(10.8,.2,roomLength,inset,0,4.45,-roomLength/2+1,bay);
    for(const side of [-1,1]){box(.3,4.5,roomLength,wall,side*5.4,2.25,-roomLength/2+1,bay);box(.05,.1,roomLength,emergency,side*5.21,3.7,-roomLength/2+1,bay);}
    for(let z=-3;z>doorZ;z-=5)box(1.4,.06,1.4,strobeB,0,4.31,z,bay);
    for(const x of [-4.7,-1.55,1.55,4.7])box(.6,4.5,.4,inset,x,2.25,doorZ-.65,bay);
    box(10.8,1.5,.4,inset,0,3.75,doorZ-.65,bay);
    const route=routeFor(seed),banner=label(['MOM INC / '+String(seed+1).padStart(2,'0'),'ALL DOORS LEAD HOME'],false,5.5,.65);banner.position.set(0,4,doorZ+.15);bay.add(banner);
    for(let i=0;i<3;i++){
      const x=(i-1)*3.1,escape=i===route.correct;
      box(2.5,.25,12,deck,x,-.14,doorZ-6,bay);box(2.5,.2,12,black,x,3.05,doorZ-6,bay);
      for(const side of [-1,1]){box(.16,3.1,12,wall,x+side*1.25,1.55,doorZ-6,bay);box(.035,.06,12,escape?red:laser,x+side*1.15,.35,doorZ-6,bay);}
      box(2.5,3.1,.2,black,x,1.55,doorZ-12,bay);
      for(const side of [-1,1]){box(.13,3.05,.27,gold,x+side*1.21,1.52,doorZ+.15,bay);box(.035,2.85,.3,escape?red:laser,x+side*1.1,1.42,doorZ+.17,bay);}
      box(2.6,.12,.25,gold,x,2.96,doorZ+.15,bay);
      const board=label(route.doors[i],escape,2.8,.88);board.position.set(x,3.43,doorZ+.2);board.userData.door=i;bay.add(board);
      if(escape)for(let y=.4;y<1.5;y+=.25){const scratch=box(.03,.035,1.6,red,x+1.15,y,doorZ-1,bay);scratch.rotation.x=.08;}
    }
    batchStaticBoxes();
    dust.length=0;for(let i=0;i<DUST;i++)dust.push({d:Math.random()*24-2,x:(Math.random()*2-1)*1.9,y:Math.random()*3.6,s:Math.random()*TAU});
  }
  let strobeTimer=0,strobeState=[1,1];
  return {scene,camera,render(renderer,run,motion=true,options={}){
    if(seed!==run.seed)build(run.seed);
    const pressure=Math.max(0,Math.min(1,+options.pressure||0)),t=run.time||0,now=performance.now()/1000;
    const end=!!options.junction||run.distance>=LENGTH,progress=run.exitProgress||0,p=pathAt(end?LENGTH+progress*17:run.distance,seed),blend=motion?.22:1,center=Math.max(0,Math.min(1,(run.distance-(LENGTH-8))/8));
    const exitLane=((run.exit??1)-1)*3.1*Math.min(1,progress*3);
    cameraLane=end?exitLane:cameraLane+((LANES[run.lane]??0)*(1-center)-cameraLane)*blend;yaw=end?p.yaw:yaw+(p.yaw-yaw)*(motion?.18:1);
    const bob=motion&&!run.paused&&!end&&run.height<.1?Math.sin(run.time*17)*.045:0;
    camera.aspect=renderer.domElement.clientWidth/Math.max(1,renderer.domElement.clientHeight);camera.fov=72+10*(end?1:center);camera.updateProjectionMatrix();
    camera.position.set(p.x+Math.cos(p.yaw)*cameraLane,1.67+(end?0:run.height-(run.duck||0)*1.03)+bob,p.z-Math.sin(p.yaw)*cameraLane);
    camera.rotation.set(0,yaw,end||!motion?0:-cameraLane*.035,'YXZ');
    // Lights ride with the runner: a lamp on the body and a work light a few metres ahead.
    const fwd=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
    lamp.position.copy(camera.position).y=2.9;ahead.position.copy(camera.position).addScaledVector(fwd,7).y=3.3;alarm.position.copy(camera.position).addScaledVector(fwd,3).y=3.2;
    // Flicker: two light banks strobe at random; the work light stutters with them.
    if(motion&&now>strobeTimer){strobeTimer=now+.04+Math.random()*.25;strobeState=[Math.random()<.85?1:.08,Math.random()<.6?1:.05];}
    if(!motion)strobeState=[1,1];
    strobeA.color.setScalar(strobeState[0]);strobeB.color.setScalar(strobeState[1]);ahead.intensity=14*(.55+.45*strobeState[0]);
    // Emergency strips and the red wash grow with chase pressure.
    const pulse=motion?.5+.5*Math.sin(now*(3+7*pressure)):1;
    emergency.color.setRGB(.25+pressure*(.6+.9*pulse),.03,.05+.03*pulse);alarm.intensity=pressure*(4+10*pulse);
    laser.color.setRGB(1,.3+.15*Math.sin(now*40),.85);hum.opacity=.12+.08*Math.sin(now*9);haze.opacity=.22+.1*Math.sin(now*5);
    if(motion)for(const r of rotors)r.rotation.x=now*9+r.position.z;
    // Space: stars follow the camera (so they read as far away) and drift slowly.
    sky.position.copy(camera.position);if(motion)stars.rotation.y=now*.004;
    for(let i=0;i<DUST;i++){const m=dust[i];if(m.d<run.distance-2||m.d>run.distance+26)m.d=run.distance+(m.d<run.distance?22+Math.random()*4:Math.random()*24);
      const q=place(Math.min(m.d,LENGTH)),wob=motion?Math.sin(now*.7+m.s)*.15:0;
      dustPos[i*3]=q.x+Math.cos(q.yaw)*m.x;dustPos[i*3+1]=m.y+wob;dustPos[i*3+2]=q.z-Math.sin(q.yaw)*m.x;if(motion){m.y=(m.y+.0015)%3.6;}}
    dustGeo.attributes.position.needsUpdate=true;
    renderer.render(scene,camera);
  }};
}
