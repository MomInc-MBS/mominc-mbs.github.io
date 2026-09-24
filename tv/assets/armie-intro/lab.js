import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {bindHand,applyHandPose} from './pose-rig.js';
const params=new URLSearchParams(location.search),DEBUG=params.has('debug'),SCRUB=params.has('t')?Math.max(0,+params.get('t')||0):null,AUTO_PRESS=params.get('press')==='1';
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#08070d');scene.fog=new THREE.FogExp2('#100d17',.045);const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.05,60);
const gold=new THREE.MeshStandardMaterial({color:'#c6a463',metalness:.65,roughness:.35}),purple=new THREE.MeshStandardMaterial({color:'#322344',metalness:.35,roughness:.35}),black=new THREE.MeshStandardMaterial({color:'#100d17',roughness:.5}),steel=new THREE.MeshStandardMaterial({color:'#c6c5b9',metalness:.8,roughness:.25});
function box(w,h,d,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
function plane(w,h,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);parent.add(m);return m;}
function label(text,bg,fg,w=512,h=96){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.font=`bold ${h*.55|0}px monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
box(12,.15,20,purple,0,-.1,0);box(12,.15,20,black,0,4.3,0);box(.2,4.4,20,purple,-6,2,0);box(.2,4.4,20,purple,6,2,0);box(12,4.4,.2,purple,0,2,-8);
const roomLight=new THREE.HemisphereLight('#d8c1ec','#30233a',0);scene.add(roomLight);const spot=new THREE.PointLight('#d5b7ed',0,18);spot.position.set(0,3.4,-.5);scene.add(spot);
for(let z=-7;z<=8;z+=2){for(const x of [-5.6,5.6]){box(.12,.035,.55,new THREE.MeshBasicMaterial({color:'#6d5682'}),x,.03,z);const l=new THREE.PointLight('#584363',.25,2);l.position.set(x,.15,z);scene.add(l);}}
// The entrance behind the viewer closes in five physical increments.
const doors=[];for(const side of [-1,1]){doors.push(box(2.05,3.8,.18,purple,side*2.15,1.9,8));box(.12,4,.25,gold,side*2.18,2,8);}
box(7,4,.2,black,-5.7,2,8);box(7,4,.2,black,5.7,2,8);
const loadTex=async url=>{const t=await new THREE.TextureLoader().loadAsync(url);t.colorSpace=THREE.SRGBColorSpace;return t;};
const coachTex=await new THREE.TextureLoader().loadAsync('./coach.png');const coach=new THREE.Sprite(new THREE.SpriteMaterial({map:coachTex,transparent:true,blending:THREE.AdditiveBlending,color:'#b79ec7'}));coach.position.set(0,.95,9.3);coach.scale.set(3.6,2.4,1);scene.add(coach);

// ── The machine: a gold/purple console. Big round button under a padlock and a red LOCKED ring; USB-A port on its right side.
const machine=new THREE.Group();machine.position.set(-.15,0,-2);machine.rotation.y=-.6;scene.add(machine);
box(1.1,.1,.75,black,0,.05,0,machine);box(.9,1,.6,purple,0,.6,0,machine);box(1,.1,.7,gold,0,1.15,0,machine);for(const x of [-.45,.45])box(.05,1,.05,gold,x,.6,.3,machine);box(.72,.74,.02,black,0,.6,.305,machine);
const lockedTex=label('LOCKED','#2a0810','#ff4455'),pressTex=label('PRESS','#2a1c08','#ffe08f');const plateMat=new THREE.MeshBasicMaterial({map:lockedTex});plane(.6,.12,plateMat,0,.87,.317,machine);
const buttonMat=new THREE.MeshStandardMaterial({color:'#5a1822',emissive:'#ff2a3c',emissiveIntensity:.12,roughness:.35,metalness:.2});const btn=new THREE.Mesh(new THREE.CylinderGeometry(.15,.16,.08,32),buttonMat);btn.rotation.x=Math.PI/2;btn.position.set(0,.53,.34);machine.add(btn);
const ringMat=new THREE.MeshBasicMaterial({color:'#ff2a3c'});const ring=new THREE.Mesh(new THREE.TorusGeometry(.19,.02,10,40),ringMat);ring.position.set(0,.53,.318);machine.add(ring);
const padlock=new THREE.Group();padlock.position.set(0,.66,.4);machine.add(padlock);box(.13,.1,.04,gold,0,0,0,padlock);const shackle=new THREE.Mesh(new THREE.TorusGeometry(.045,.013,8,16,Math.PI),steel);shackle.position.y=.05;padlock.add(shackle);box(.02,.04,.006,black,0,-.005,.021,padlock);
const PORT=new THREE.Vector3(.45,.62,.05);box(.012,.1,.145,steel,.456,PORT.y,PORT.z,machine);box(.014,.08,.12,black,.459,PORT.y,PORT.z,machine);box(.015,.02,.1,new THREE.MeshBasicMaterial({color:'#e8e2d8'}),.46,PORT.y+.018,PORT.z,machine);
const portLedMat=new THREE.MeshBasicMaterial({color:'#3a0c10'});box(.012,.024,.024,portLedMat,.458,PORT.y+.1,PORT.z+.06,machine);plane(.17,.06,new THREE.MeshBasicMaterial({map:label('USB','#100d17','#ffd98a',256,88)}),.457,PORT.y-.095,PORT.z,machine).rotation.y=Math.PI/2;
// The same procedural drive the intro pulls from the website computer.
const drive=new THREE.Group();drive.visible=false;machine.add(drive);box(.28,.1,.16,gold,.05,0,0,drive);box(.11,.075,.11,steel,-.14,0,0,drive);plane(.17,.06,new THREE.MeshBasicMaterial({map:label('MOM','#463421','#ffd995')}),.045,0,.082,drive);const driveLedMat=new THREE.MeshBasicMaterial({color:'#1d3322'});box(.022,.025,.016,driveLedMat,.12,.025,.092,drive);

// ── The app's rainbow wormhole (release5 modules/portal/portal.mjs TUNNEL_FS), ported to a disc in UV space.
const NEONS=['#ff5f1f','#ffff33','#39ff14','#1f51ff','#b026ff','#ff10f0'],rgb=h=>new THREE.Vector3(...[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255));
const PORTAL_POS=new THREE.Vector3(-.15,2.45,-2.3),RX=.56,RY=.75;
const portalMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:.3},uSpin:{value:0},uSeq:{value:NEONS.map(rgb)}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uT,uSpin;uniform vec3 uSeq[6];varying vec2 vUv;
vec3 seq(float i){return uSeq[int(mod(i,6.))];}
void main(){
 vec2 d=(vUv-.5)*2.;float r=max(length(d),1e-3),z=3.4/r,fz=fwidth(z),aa=1.-smoothstep(.25,.9,fz),a=atan(d.y,d.x)+uSpin+.12*z;
 float v=z-uT+.35*sin(a*3.+z*.5)*aa,i=floor(v),f=v-i;
 vec3 c=mix(seq(i),seq(i+1.),smoothstep(.65,1.,f));
 c*=mix(.85,.55+.45*(.5+.5*sin(a*7.+v*6.2832)),aa);
 c+=max(pow(f,12.),1.-smoothstep(0.,1.5*fz,f))*aa*(c*.8+.35);
 c=mix(c,vec3(1.),smoothstep(7.,40.,z));c+=exp(-r*16.)*1.1;
 float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.3)*.92+.06;
 c+=smoothstep(.84,.96,r)*(1.-smoothstep(.96,1.,r))*.9;
 gl_FragColor=vec4(c,1.-smoothstep(.975,1.,r));
}`});
const portal=new THREE.Mesh(new THREE.CircleGeometry(1,64),portalMat);portal.scale.set(RX,RY,1);portal.position.copy(PORTAL_POS);scene.add(portal);
function haloTexture(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),gr=g.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(.3,'#fff0');gr.addColorStop(.43,'#ffffffb0');gr.addColorStop(.52,'#ffffff30');gr.addColorStop(1,'#fff0');g.fillStyle=gr;g.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);}
const halo=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:haloTexture(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:'#b026ff'}));halo.scale.set(RX*2.3,RY*2.3,1);halo.position.copy(PORTAL_POS).z-=.02;scene.add(halo);
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'#ffffff80');gr.addColorStop(1,'#fff0');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const flash=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:glowTexture(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));flash.position.copy(PORTAL_POS).z+=.05;scene.add(flash);
const portalLight=new THREE.PointLight('#b026ff',0,6);portalLight.position.copy(PORTAL_POS).z+=.6;scene.add(portalLight);

// ── The quilt, stretched inside the app's metal border (portal.css .portal-frame: brushed steel rail, hex bolts, energy seam, nameplate).
const QW=.9,QH=QW*1666/1024,RAIL=.085;
const frame=new THREE.Group();frame.visible=false;frame.position.copy(PORTAL_POS);scene.add(frame);
const quiltTex=await loadTex('./quilt.webp');quiltTex.anisotropy=4;
const quiltGeo=new THREE.PlaneGeometry(QW,QH,18,30),quiltRest=quiltGeo.attributes.position.array.slice();
const quiltMat=new THREE.MeshStandardMaterial({map:quiltTex,emissiveMap:quiltTex,emissive:'#ffffff',emissiveIntensity:.6,roughness:.9});const quilt=new THREE.Mesh(quiltGeo,quiltMat);frame.add(quilt);
function metalTexture(){const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,64,256);[[0,'#9a8498'],[.26,'#6a586c'],[.52,'#55465c'],[.78,'#43364a'],[1,'#7a6478']].forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,64,256);for(let x=0;x<64;x++){g.fillStyle=`rgba(255,255,255,${(Math.sin(x*12.9898)*43758.5453%1+1)%1*.08})`;g.fillRect(x,0,1,256);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const rail=new THREE.MeshStandardMaterial({map:metalTexture(),metalness:.55,roughness:.4,emissive:'#3a2c40',emissiveIntensity:.5});
box(QW+.012,QH+.012,.012,new THREE.MeshBasicMaterial({color:'#17111e'}),0,0,-.06,frame);
for(const s of [-1,1]){box(QW+2*RAIL,RAIL,.05,rail,0,s*(QH+RAIL)/2,.01,frame);box(RAIL,QH,.05,rail,s*(QW+RAIL)/2,0,.01,frame);}
function energyTexture(){const c=document.createElement('canvas');c.width=6;c.height=1;const g=c.getContext('2d');NEONS.forEach((h,i)=>{g.fillStyle=h;g.fillRect(i,0,1,1);});const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.wrapS=THREE.RepeatWrapping;return t;}
const energy=energyTexture(),seamMat=new THREE.MeshBasicMaterial({map:energy});
for(const s of [-1,1])for(const vertical of [false,true]){const len=vertical?QH:QW+RAIL,geo=new THREE.PlaneGeometry(len,.014),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len*9);const seam=new THREE.Mesh(geo,seamMat);if(vertical){seam.rotation.z=Math.PI/2;seam.position.set(s*(QW+RAIL)/2,0,.036);}else seam.position.set(0,s*(QH+RAIL)/2,.036);frame.add(seam);}
for(const x of [-1,1])for(const y of [-1,1]){const px=x*(QW+RAIL)/2,py=y*(QH+RAIL)/2;const washer=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.01,16),black);washer.rotation.x=Math.PI/2;washer.position.set(px,py,.04);frame.add(washer);const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.021,.021,.016,6),steel);bolt.rotation.x=Math.PI/2;bolt.position.set(px,py,.048);frame.add(bolt);}
plane(.3,.052,new THREE.MeshBasicMaterial({map:label('M O M  I N C','#8e7a8a','#281e2c',512,88)}),0,(QH+RAIL)/2,.05,frame);for(const [x,c] of [[-.18,'#39ff14'],[.18,'#b026ff']])box(.014,.014,.01,new THREE.MeshBasicMaterial({color:c}),x,(QH+RAIL)/2,.05,frame);
const heroLight=new THREE.PointLight('#fff1dc',0,5);scene.add(heroLight);const keyLight=new THREE.PointLight('#ffe3b4',0,6);keyLight.position.set(1.3,1.9,-.4);scene.add(keyLight);

// ── The user's own Handborne hand (same loader as intro.js loadHand; the same drive-grab curl).
const regions=['nails','fingertips','middle_sections','knuckles','palm','back_of_hand','wrist'];
const validHand=r=>r&&r.version===1&&r.complete===true&&r.source==='handborne'&&regions.every(k=>Number.isInteger(r.sections?.[k])&&r.sections[k]>=0&&r.sections[k]<23);
const hand=new THREE.Group();hand.visible=false;scene.add(hand);let handRig=null,handScale=1,handState='loading',lastGrip=-1;
async function loadHand(r){if(!validHand(r))throw Error('No finished Handborne hand.');const loader=new GLTFLoader(),families=new Map();for(const id of new Set(Object.values(r.sections)))families.set(id,await loader.loadAsync((id<20?'./models/':'/handborne/models/')+'family-'+String(id).padStart(2,'0')+'.glb'));const joined=new Set();for(const key of regions){const family=families.get(r.sections[key]).scene;let part=family.getObjectByName(key);if(!part&&(key==='middle_sections'||key==='knuckles')){part=family.getObjectByName('fingers');if(joined.has(r.sections[key]))continue;joined.add(r.sections[key]);}if(!part)throw Error('Missing hand region: '+key);hand.add(part.clone(true));}const size=new THREE.Box3().setFromObject(hand).getSize(new THREE.Vector3());handRig=bindHand(hand);handScale=.95/Math.max(size.x,size.y,size.z);}
function grip(g){g=Math.round(THREE.MathUtils.clamp(g,0,1)*12)/12;if(!handRig||g===lastGrip)return;lastGrip=g;const bend=(a,b)=>a.map((v,i)=>v+(b[i]-v)*g);applyHandPose(handRig,{id:'lab-grip',name:'Grip',rotation:[0,0,0],opposition:15*g,fingers:{index:bend([0,0,0,0],[40,62,40,2]),middle:bend([5,5,5,0],[45,52,28,0]),ring:bend([8,8,8,0],[53,60,30,0]),pinky:bend([10,10,10,0],[60,65,32,0]),thumb:bend([0,0,0,0],[-1,10,32,-35])}});}
if(DEBUG){try{if(!validHand(JSON.parse(localStorage.getItem('mbs-hand-profile-v1'))))localStorage.setItem('mbs-hand-profile-v1',JSON.stringify({version:1,complete:true,source:'handborne',sections:Object.fromEntries(regions.map(k=>[k,3]))}));}catch{}}
let storedHand=null;try{storedHand=JSON.parse(localStorage.getItem('mbs-hand-profile-v1'));}catch{}
const handLoading=loadHand(storedHand).then(()=>{handState='ready';},e=>{handState='none';console.warn('Lab hand unavailable:',e.message);});

// ── Timeline (seconds after the door seals). The press waits for the user; everything after it runs from pressAt.
const TURN0=.6,TURN1=1.8,EMERGE0=3,EMERGE1=4.3,FLY1=5.5,CLICK=5.9,READY=6.2,HOVER1=7.2,AUTO_T=7.4;
const COLLAPSE0=.3,COLLAPSE1=1.3,GRAB0=2,GRAB1=2.9,PULL0=3.2,PULL1=4.6,END=5.2;
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};const mix=(a,b,t)=>a+(b-a)*ease(t);const back=v=>{v=Math.max(0,Math.min(1,v));return 1+2.7*Math.pow(v-1,3)+1.7*Math.pow(v-1,2);};
const TUNE=(k,d)=>DEBUG&&params.has(k)?params.get(k).split(',').map(Number):d;
const HAND_REL=new THREE.Vector3(...TUNE('hrel',[0,-.26,-.3])),HAND_ROT=new THREE.Euler(...TUNE('hrot',[-.3,Math.PI,.3])),HOVER=new THREE.Vector3(.9,.95,.45),HOVER_ROT=new THREE.Euler(-.15,Math.PI-.5,.1);
const GRAB=new THREE.Vector3(...TUNE('grab',[.15,-1,.12])),GRAB_ROT=new THREE.Euler(...TUNE('grot',[0,0,.2]));
const PLUGGED=new THREE.Vector3(.545,PORT.y,PORT.z),OUTSIDE=new THREE.Vector3(.685,PORT.y,PORT.z);
scene.updateMatrixWorld(true);const toMachine=v=>machine.worldToLocal(PORTAL_POS.clone().add(v));const INSIDE=toMachine(new THREE.Vector3(0,-.05,-.25)),EMERGED=toMachine(new THREE.Vector3(.2,-.35,.55));
const anchorM=new THREE.Object3D();machine.add(anchorM);const anchorF=new THREE.Object3D();frame.add(anchorF);
const VIEW=new THREE.Vector3(.05,1.6,-2.1),SEAL_POS=new THREE.Vector3(0,1.65,3),camPos=new THREE.Vector3(),target=new THREE.Vector3(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),q1=new THREE.Quaternion(),q2=new THREE.Quaternion();
function roomPose(out){const fit=Math.max(4.6,2.3/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));return out.set(VIEW.x+.3,1.8,VIEW.z+fit);}
function heroPos(out){const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),d=Math.max((QH+2*RAIL)/.86/(2*tan),(QW+2*RAIL)/.86/(2*tan*camera.aspect));return out.copy(PORTAL_POS).sub(camPos).normalize().multiplyScalar(d).add(camPos);}
const caption=document.querySelector('#caption'),pressEl=document.querySelector('#press');
function renderReveal(t,pressAt){
 const q=t-pressAt,pressed=q>=0,idle=RM?0:t;
 // Turn around (cut under reduced motion), lights up on the machine and the wormhole.
 roomPose(camPos);const w=RM?+(t>=(TURN0+TURN1)/2):ease((t-TURN0)/(TURN1-TURN0));const endDx=VIEW.x-camPos.x,endDz=VIEW.z-camPos.z,yawEnd=Math.atan2(endDx,endDz)-(Math.atan2(endDx,endDz)>0?2*Math.PI:0),yaw=yawEnd*w;
 camPos.lerpVectors(SEAL_POS,camPos,w);const D=mix(6,Math.hypot(endDx,endDz),w),dy=(1.5-1.65)*(1-w)+(VIEW.y-camPos.y)*w;target.set(camPos.x+Math.sin(yaw)*D,camPos.y+dy,camPos.z+Math.cos(yaw)*D);
 if(!RM&&pressed&&q<.35){const s=Math.sin(q/.35*Math.PI)*.025;camPos.x+=Math.sin(q*90)*s;camPos.y+=Math.cos(q*70)*s;}
 const light=.4*ease(t/.4)+.6*ease((t-.9)/1.2);roomLight.intensity=light*1.6;spot.intensity=light*16;keyLight.intensity=light*7;
 // Wormhole: slow swirl; after the press it spins up and collapses inward.
 const k=pressed?ease((q-COLLAPSE0)/(COLLAPSE1-COLLAPSE0)):0,shrink=1-k;portal.visible=halo.visible=shrink>.01;portal.scale.set(RX*shrink,RY*shrink,1);halo.scale.set(RX*2.3*shrink,RY*2.3*shrink,1);
 portalMat.uniforms.uSpin.value=idle*.18+(pressed?Math.pow(Math.max(0,q-COLLAPSE0),2)*9:0);portalMat.uniforms.uT.value=.3+idle*.5+(pressed?Math.pow(Math.max(0,q),2)*4:0);
 const hue=NEONS[Math.floor(idle*.6)%6];halo.material.color.set(hue).multiplyScalar(light*(.75+.25*Math.sin(idle*2.2)));portalLight.color.set(hue);portalLight.intensity=light*5*shrink;
 const burst=pressed?Math.sin(Math.PI*THREE.MathUtils.clamp((q-.85)/.45,0,1)):0;flash.visible=burst>0;flash.material.opacity=burst*.9;flash.scale.setScalar(.2+burst*.6);
 // Frame closes in around the collapse; the quilt stretches out to fill it and settles.
 const f=pressed?ease((q-.55)/.55):0;frame.visible=f>0;frame.scale.setScalar(mix(1.35,1,(q-.55)/.55));
 const stretch=pressed?back((q-.95)/.5):0;quilt.visible=stretch>.01;quilt.scale.set(Math.max(.01,stretch),Math.max(.01,stretch),1);
 const pos=quiltGeo.attributes.position,amp=pressed?.045*Math.exp(-3*Math.max(0,q-1.2))*ease((q-.95)/.3):0;
 if(amp>1e-4||pos.array[2]!==0){for(let i=0;i<pos.count;i++){const x=quiltRest[i*3],y=quiltRest[i*3+1],r=Math.hypot(x/QW,y/QH);pos.setZ(i,amp>1e-4?amp*Math.sin(r*14-q*11)*(1-r*.6):0);}pos.needsUpdate=true;quiltGeo.computeVertexNormals();}
 energy.offset.x=-idle*.35;
 // Pull: the frame comes toward the camera and turns to face it (hero shot).
 const pull=pressed?ease((q-PULL0)/(PULL1-PULL0)):0;heroPos(v1);frame.position.lerpVectors(PORTAL_POS,v1,pull);frame.rotation.set(0,Math.sin(pull*Math.PI)*-.25,Math.sin(pull*Math.PI)*.04);if(pull>0){v2.copy(camPos).sub(frame.position);frame.rotation.y+=Math.atan2(v2.x,v2.z)*pull;}
 heroLight.position.copy(frame.position).add(v2.set(.4,.5,1.2));heroLight.intensity=pressed?ease((q-.8)/.6)*6:0;
 target.lerp(frame.position,pull);
 // Lock, LEDs, button.
 const plugged=t>=CLICK;driveLedMat.color.set(plugged?'#85ff9d':'#1d3322');portLedMat.color.set(plugged?'#39ff14':'#3a0c10');plateMat.map=plugged?pressTex:lockedTex;ringMat.color.set(plugged?'#ffd98a':'#ff2a3c');
 const pop=ease((t-CLICK)/.25),drop=ease((t-CLICK-.2)/.55);shackle.position.y=.05+pop*.035;padlock.position.set(0,.66-drop*.55,.4+drop*.12);padlock.rotation.z=drop*.9;padlock.visible=drop<1;
 const glow=plugged&&!pressed?(RM?.9:.7+.6*(.5+.5*Math.sin((t-CLICK)*5))):pressed?Math.max(.2,1.4-q*2):.12;buttonMat.emissive.set(plugged?'#ffb640':'#ff2a3c');buttonMat.color.set(plugged?'#8a5a18':'#5a1822');buttonMat.emissiveIntensity=glow;
 btn.position.z=.34-(pressed?.035*Math.sin(Math.PI*Math.min(1,q/.3))+(q>=.3?.012:0):0);
 // Hand + drive: out of the portal, down to the port, push and click, let go, hover; after the press, grab the frame.
 const holding=t<READY,s=mix(.55,1,(t-EMERGE0)/(EMERGE1-EMERGE0));
 if(t<EMERGE1)v1.lerpVectors(INSIDE,EMERGED,ease((t-EMERGE0)/(EMERGE1-EMERGE0)));else if(t<FLY1)v1.lerpVectors(EMERGED,OUTSIDE,ease((t-EMERGE1)/(FLY1-EMERGE1)));else v1.lerpVectors(OUTSIDE,PLUGGED,Math.min(1,(t-FLY1)/(CLICK-FLY1))**2);
 drive.visible=handState!=='loading'&&t>=EMERGE0;drive.position.copy(v1);drive.scale.setScalar(s);
 anchorM.position.copy(HAND_REL).multiplyScalar(s).add(v1);anchorM.rotation.copy(HAND_ROT);
 if(!holding){const h=ease((t-READY)/(HOVER1-READY));anchorM.position.lerp(HOVER,h);anchorM.position.y+=Math.sin(idle*1.6)*.02*h;anchorM.quaternion.slerp(q1.setFromEuler(HOVER_ROT),h);}
 anchorF.position.copy(GRAB);anchorF.rotation.copy(GRAB_ROT);
 // applyHandPose recentres hand.position, so pose first, then place.
 grip(pressed?ease((q-GRAB1+.3)/.45):holding?1:1-ease((t-READY)/.5));
 hand.visible=handState==='ready'&&t>=EMERGE0;scene.updateMatrixWorld();
 const g=pressed?ease((q-GRAB0)/(GRAB1-GRAB0)):0;anchorM.getWorldPosition(v1);anchorM.getWorldQuaternion(q1);anchorF.getWorldPosition(v2);anchorF.getWorldQuaternion(q2);hand.position.lerpVectors(v1,v2,g);hand.quaternion.slerpQuaternions(q1,q2,g);hand.scale.setScalar(handScale*(pressed?mix(1,1.1,(q-GRAB0)/(GRAB1-GRAB0)):s));
 camera.position.copy(camPos);camera.lookAt(target);
 doors.forEach((d,i)=>d.position.x=(i?1:-1)*(2.15-clicks/5*1.12));
 caption.textContent=t<TURN0?'Door stays shut.':t<EMERGE0?(t>TURN1?'Locked.':''):t<CLICK?'Your hand brought the drive.':!pressed?(t-READY>4?'Press the button.':'Unlocked.'):q<COLLAPSE1?'':q<PULL0?'The portal folds into your quilt.':'Take it with you.';
 renderer.render(scene,camera);
 if(!pressed&&t>=READY&&SCRUB==null){btn.getWorldPosition(v1).project(camera);pressEl.hidden=false;pressEl.style.transform=`translate(${(v1.x+1)/2*innerWidth}px,${(1-v1.y)/2*innerHeight}px) translate(-50%,-50%)`;}else pressEl.hidden=true;
}

// ── Door beat (unchanged), then the reveal clock.
const task=document.querySelector('#door-task'),button=document.querySelector('#close-door'),timer=document.querySelector('#timer');let start=performance.now(),phase='enter',deadline=0,clicks=0,finished=false,clock=0,lastNow=0,pressAt=Infinity;
function report(type){parent.postMessage({type},location.origin);}
function fail(){if(finished)return;finished=true;task.hidden=true;caption.textContent='Coach caught you.';setTimeout(()=>report('armie-lab-failed'),900);}
button.onclick=()=>{if(phase!=='seal'||finished)return;if(performance.now()>=deadline){fail();return;}clicks++;button.textContent='CLOSE · '+clicks+' / 5';if(clicks===5){phase='reveal';report('armie-lab-sealed');lastNow=performance.now();task.hidden=true;caption.textContent='Door stays shut.';}};
button.addEventListener('keydown',e=>{if(e.repeat)e.preventDefault();});
pressEl.onclick=()=>{if(phase==='reveal'&&clock>=READY&&pressAt===Infinity){pressAt=clock;pressEl.hidden=true;}};
function finish(){finished=true;pressEl.hidden=true;try{sessionStorage.setItem('mbs-armie-ending',renderer.domElement.toDataURL('image/jpeg',.82));}catch{}report('armie-lab-complete');if(parent===window)setTimeout(()=>location.assign('/download/'),300);}
function tick(now){const t=(now-start)/1000;const look=new THREE.Vector3(0,1.6,-4);if(phase==='enter'){camera.position.set(0,1.65,mix(9.6,3,t/2.8));const turn=ease((t-2.8)/1.6);look.set(Math.sin(turn*Math.PI)*5,1.5,-4+turn*14);if(t>=4.5){phase='seal';deadline=now+3000;task.hidden=false;button.focus();}}
if(phase==='seal'){camera.position.set(0,1.65,3);look.set(0,1.5,9);const remaining=Math.max(0,deadline-now);timer.textContent=(remaining/1000).toFixed(1);coach.position.z=9.3-(1-remaining/3000)*.9;if(!remaining)fail();}
doors.forEach((d,i)=>d.position.x=(i?1:-1)*(2.15-clicks/5*1.12));
if(phase==='reveal'){const dt=Math.min(.05,(now-lastNow)/1000);lastNow=now;let next=clock+dt*(RM?2:1);if(handState==='loading'&&next>EMERGE0)next=Math.max(clock,EMERGE0);clock=next;if(AUTO_PRESS&&pressAt===Infinity&&clock>=AUTO_T)pressAt=clock;renderReveal(clock,pressAt);if(clock-pressAt>=END&&!finished)finish();}
else{if(finished){coach.position.z=4.2;coach.scale.set(5,4,1);}camera.lookAt(look);renderer.render(scene,camera);}
if(!finished||phase!=='reveal')requestAnimationFrame(tick);}
document.querySelector('#loading').hidden=true;
window.armieLab={get phase(){return phase},get clicks(){return clicks},get clock(){return clock},renderAt:(t,press=AUTO_PRESS?AUTO_T:Infinity)=>{phase='reveal';clicks=5;task.hidden=true;renderReveal(t,press);}};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
if(DEBUG)window.__lab={scene,hand,camera,THREE,machine};
if(SCRUB!=null){await handLoading;window.armieLab.renderAt(SCRUB);document.documentElement.dataset.labFrame='ready';}
else{report('armie-lab-ready');let entryStarted=false;const begin=()=>{if(entryStarted)return;entryStarted=true;start=performance.now();requestAnimationFrame(tick);};addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='armie-lab-start')begin();});if(parent===window)begin();}
