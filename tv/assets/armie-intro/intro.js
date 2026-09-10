import {continueScene} from './game-scene.js?v=swipe-2';
import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {bindHand,applyHandPose} from './pose-rig.js';
let handRig=null,lastGrip=-1;
const liveMode=new URLSearchParams(location.search).has('live');const framedLive=liveMode&&!new URLSearchParams(location.search).has('cabinet');const FACE_HEIGHT=liveMode?2.55*innerHeight/innerWidth*(framedLive?(954/1280)/(672/720):1):1.434375;
const regions=['nails','fingertips','middle_sections','knuckles','palm','back_of_hand','wrist'];
const status=document.querySelector('#status'),summary=document.querySelector('#summary'),startButton=document.querySelector('#start'),caption=document.querySelector('#caption'),fade=document.querySelector('#fade');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#09080c');scene.fog=new THREE.FogExp2('#100c15',.037);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.05,80);camera.position.set(0,1.6,2.6);camera.lookAt(0,1.52,0);
scene.add(new THREE.HemisphereLight('#b8b4d6','#251422',.9));const key=new THREE.PointLight('#ffe3b4',20,13);key.position.set(0,3,2);scene.add(key);
function noiseTexture(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#777';g.fillRect(0,0,256,256);let seed=93;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<24000;i++){const v=45+rand()*145;g.fillStyle=`rgba(${v},${v},${v},${.15+rand()*.6})`;g.fillRect(rand()*256,rand()*256,1+rand()*3,1+rand()*3);}for(let i=0;i<22;i++){g.strokeStyle='#3336';g.beginPath();g.ellipse(rand()*256,rand()*256,7+rand()*20,2+rand()*6,rand()*6,0,Math.PI*2);g.stroke();}const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(3,3);return tx;}
const grit=noiseTexture();const mat=(color,roughness=.5,metalness=.15)=>new THREE.MeshStandardMaterial({color,roughness,metalness,bumpMap:grit,bumpScale:.035});
const purple=mat('#443147',.85,.1),gold=mat('#b28c45',.34,.64),clay=mat('#704772',.95,0),floorMat=mat('#49294e',.33,.35),black=mat('#0c0b10',.75,.1);
purple.map=grit;purple.bumpScale=.13;gold.bumpScale=.045;floorMat.bumpScale=.08;
function box(w,h,d,m,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function cyl(r,len,m,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,20),m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
box(40,.15,7,floorMat,0,-.075,2);box(40,.15,7,black,0,3.65,2);box(40,3.7,.15,purple,0,1.75,-1.5);box(40,3.7,.15,purple,0,1.75,5.5);
const practicals=[];
for(let x=-18;x<=18;x+=2.7){for(const z of [-1.37,5.37]){box(.1,3.5,.12,gold,x,1.75,z);box(2.45,.23,.24,gold,x+1.3,3.22,z);const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.032,8,24),gold);ring.position.set(x+.9,1.8,z+(z<0?.09:-.09));scene.add(ring);const bolt=cyl(.035,.13,gold,x+.9,1.8,z);bolt.rotation.x=Math.PI/2;}const fixture=box(1.15,.035,1.2,new THREE.MeshBasicMaterial({color:'#f4e7ce'}),x,3.54,2);const light=new THREE.PointLight('#e5d8b7',5,6);light.position.set(x,3.25,2);scene.add(light);practicals.push(light);}
// Small purple clay pieces echo the rough miniature floor in the supplied reference.
for(let i=0;i<135;i++){const x=Math.sin(i*47.1)*18,z=2+Math.cos(i*29.7)*2.5;if(Math.abs(x)<2&&z<2)continue;const piece=new THREE.Mesh(new THREE.DodecahedronGeometry(.04+(i%7)*.016,0),clay);piece.position.set(x,.04,z);piece.scale.set(1.5,.5,1);piece.rotation.set(i*.7,i*.3,i);scene.add(piece);}
// Gold 1990s computer and the MOM Inc television bezel.
const computer=new THREE.Group();scene.add(computer);box(3,.15,1.8,gold,0,.64,0,computer);for(const x of [-1.3,1.3])box(.14,.6,.14,black,x,.3,0,computer);
box(2.55,FACE_HEIGHT,.85,gold,0,1.68,0,computer);box(1.3,.12,.7,gold,0,.92,.05,computer);box(2.15,.11,.55,gold,0,.8,.72,computer);
for(let row=0;row<4;row++)for(let k=0;k<13;k++)box(.12,.025,.085,black,-.87+k*.145,.867,.53+row*.105,computer);
function labelTexture(text,bg='#b2935b',fg='#24172b'){const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,96);g.fillStyle=fg;g.font='bold 47px monospace';g.textAlign='center';g.fillText(text,256,65);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;}
function plane(w,h,material,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
// The front is the real website cabinet rendered at 1280 × 720, preserving every control and label.
const bezelTex=await new THREE.TextureLoader().loadAsync('./website-bezel.png');bezelTex.colorSpace=THREE.SRGBColorSpace;
const faceMat=new THREE.MeshBasicMaterial({map:bezelTex,toneMapped:false});plane(2.55,FACE_HEIGHT,faceMat,0,1.68,.431,computer);
const screenTex=await new THREE.TextureLoader().loadAsync('./website-screen.png');screenTex.colorSpace=THREE.SRGBColorSpace;
const screenMat=new THREE.MeshBasicMaterial({map:screenTex,toneMapped:false});
const screen=plane(954/1280*2.55,672/720*FACE_HEIGHT,screenMat,(582/1280-.5)*2.55,1.68+(.5-359/720)*FACE_HEIGHT,.432,computer);
const glow=new THREE.PointLight('#a9a1ff',2,4);glow.position.set(0,1.7,1);scene.add(glow);
// USB sits visibly in the right side of the casing, connected until the grasp.
box(.035,.12,.22,black,1.29,1.3,.24,computer);const drive=new THREE.Group();drive.position.set(1.4,1.3,.24);scene.add(drive);box(.28,.1,.16,gold,.05,0,0,drive);box(.11,.075,.11,mat('#c6c5b9',.2,.8),-.14,0,0,drive);plane(.17,.06,new THREE.MeshBasicMaterial({map:labelTexture('MOM','#463421','#ffd995')}),.045,0,.082,drive);
const led=box(.022,.025,.016,new THREE.MeshBasicMaterial({color:'#85ff9d'}),.12,.025,.092,drive);
// Exit on the left; the right end remains shadowed around Armie.
box(.3,3.6,7,black,18,1.8,2);box(.3,3.6,2.15,purple,-17,1.8,-.4);box(.3,3.6,2.15,purple,-17,1.8,4.4);box(.3,.45,3,gold,-17,3.35,2);
const exitMat=new THREE.MeshBasicMaterial({color:'#fff6d6'});const exit=new THREE.Mesh(new THREE.PlaneGeometry(2.8,3.1),exitMat);exit.rotation.y=Math.PI/2;exit.position.set(-17,1.52,2);scene.add(exit);const exitLight=new THREE.PointLight('#ffefd2',22,10);exitLight.position.set(-16,2,2);scene.add(exitLight);
const coachTex=await new THREE.TextureLoader().loadAsync('./coach.png');coachTex.colorSpace=THREE.SRGBColorSpace;const coach=new THREE.Sprite(new THREE.SpriteMaterial({map:coachTex,color:'#5c485f',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));coach.position.set(12,.66,2);coach.scale.set(2.65,1.77,1);scene.add(coach);
const flashMat=new THREE.MeshBasicMaterial({color:'#fff9e2',transparent:true,opacity:0,depthTest:false,depthWrite:false});const flash=new THREE.Mesh(new THREE.PlaneGeometry(2,2),flashMat);flash.position.z=-.1;flash.renderOrder=1000;camera.add(flash);scene.add(camera);
// Assemble all seven original Handborne regions, retaining their actual geometry and textures.
const loader=new GLTFLoader(),hand=new THREE.Group();scene.add(hand);let recipe=null,playing=false,startTime=0,ended=false,ready=false;
function valid(r){return r&&r.version===1&&r.complete===true&&r.source==='handborne'&&regions.every(k=>Number.isInteger(r.sections?.[k])&&r.sections[k]>=0&&r.sections[k]<23);}
async function loadHand(r){if(!valid(r))throw Error('Finish your hand in Handborne first.');recipe=r;const families=new Map();for(const id of new Set(Object.values(r.sections)))families.set(id,await loader.loadAsync((id<20?'./models/':'/handborne/models/')+'family-'+String(id).padStart(2,'0')+'.glb'));const joined=new Set();for(const key of regions){const family=families.get(r.sections[key]).scene;let part=family.getObjectByName(key);if(!part&&(key==='middle_sections'||key==='knuckles')){part=family.getObjectByName('fingers');if(joined.has(r.sections[key]))continue;joined.add(r.sections[key]);}if(!part)throw Error('Missing hand region: '+key);const clone=part.clone(true);clone.userData.region=key;clone.userData.styleId=r.sections[key];hand.add(clone);}const bounds=new THREE.Box3().setFromObject(hand),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());handRig=bindHand(hand);hand.scale.setScalar(.95/Math.max(size.x,size.y,size.z));hand.rotation.set(-.4,0,-.55);hand.visible=false;hand.userData.recipe=r;ready=true;window.armieIntroReady=true;if(liveMode)parent.postMessage({type:'armie-intro-ready'},location.origin);summary.textContent='Your seven chosen hand parts are ready. Pull the drive. Coach must follow.';startButton.hidden=false;renderAt(0);if(new URLSearchParams(location.search).has('autoplay'))play();}
const ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};const mix=(a,b,t)=>a+(b-a)*ease(t);const target=new THREE.Vector3();
function renderAt(t){
 const pull=ease((t-1)/3),startX=framedLive?(582/1280-.5)*2.55:0,startY=1.68+(framedLive?(.5-359/720)*FACE_HEIGHT:0),startH=FACE_HEIGHT*(framedLive?672/720:1);camera.position.set(mix(startX,0,pull),mix(startY,1.75,pull),mix(.434+startH/(2*Math.tan(THREE.MathUtils.degToRad(43/2))),4.4,pull));target.set(mix(startX,0,pull),mix(startY,1.68,pull),.434);
 if(t>=4&&t<8){const turn=ease((t-4)/1.5),returnTurn=ease((t-6.6)/1.4),a=turn*(1-returnTurn);target.set(mix(-.16,13,a),mix(1.71,.65,a),mix(.2,2,a));}
 if(t>=8&&t<14){const approach=ease((t-8)/3.1),retreat=ease((t-11.4)/2.4);camera.position.set(mix(0,.75,approach),mix(1.75,1.45,approach),mix(4.4,2.7,approach)+retreat*.6);target.set(mix(.6,1.38,approach),1.3,.24+retreat*.4);}
 // Curl the actual selected finger geometry before the drive follows the hand.
 const grip=Math.round(ease((t-10.1)/.95)*12)/12;
 if(handRig&&grip!==lastGrip){lastGrip=grip;const bend=(a,b)=>a.map((v,i)=>v+(b[i]-v)*grip);applyHandPose(handRig,{id:'drive-grab',name:'Grab drive',rotation:[0,0,0],opposition:15*grip,fingers:{index:bend([0,0,0,0],[40,62,40,2]),middle:bend([5,5,5,0],[45,52,28,0]),ring:bend([8,8,8,0],[53,60,30,0]),pinky:bend([10,10,10,0],[60,65,32,0]),thumb:bend([0,0,0,0],[-1,10,32,-35])}});}
 hand.visible=t>=8.6&&t<14.6;const reach=ease((t-8.6)/2),withdraw=ease((t-11.1)/2.2);hand.position.set(mix(.65,1.4,reach),mix(.35,1.04,reach)-withdraw*.22,mix(3.2,.54,reach)+withdraw*1.9);hand.rotation.set(-.4+reach*.1,withdraw*.2,-.55+reach*.25);
 drive.position.set(1.4+withdraw*.06,1.3-withdraw*.22,.24+withdraw*1.9);drive.rotation.z=-withdraw*.25;
 const wink=ease((t-11.15)/.23);screen.scale.y=Math.max(.008,1-wink);screenMat.color.setScalar(t>11.42?0:1);glow.intensity=t>11.42?0:2;led.visible=t<11.2;
 if(t>=13.5){const turn=ease((t-13.5)/1.8);camera.position.set(.45,1.55,3.3);target.set(mix(.6,-18,turn),mix(1.35,1.65,turn),mix(.1,2,turn));}
 if(t>=15.3){const run=ease((t-15.3)/5.3);camera.position.set(mix(.45,-17.3,run),1.65+Math.sin(t*19)*.04*Math.sin(run*Math.PI),mix(3.3,2,run)+Math.sin(t*9.5)*.025);target.set(-22,1.65,2);}
 const firstShake=t>=.1&&t<1?Math.sin((t-.1)/.9*Math.PI):t>=3.3&&t<5.2?Math.sin((t-3.3)/1.9*Math.PI):0;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.x+=Math.sin(t*73)*.045*firstShake;camera.position.y+=Math.cos(t*59)*.026*firstShake;}
 camera.lookAt(target);coach.position.x=12-Math.max(0,t-4)*.065;coach.position.y=.66+Math.sin(t*4)*.022;practicals.forEach((l,i)=>l.intensity=5+Math.sin(t*1.7+i)*.18);
 flashMat.opacity=ease((t-19.65)/1.1);fade.style.opacity=String(flashMat.opacity);caption.textContent=t<4?'':t<7?'Coach still here.':t<11?'Take the drive.':t<13.8?'Coach must help.':t<19?'Run for coach.':'';
  renderer.render(scene,camera);window.armieIntroTime=t;
 if(liveMode){camera.updateMatrixWorld();const left=framedLive?(105/1280-.5)*2.55:-1.275,right=framedLive?(1059/1280-.5)*2.55:1.275,top=1.68+(framedLive?.5-23/720:.5)*FACE_HEIGHT,bottom=1.68+(framedLive?.5-695/720:-.5)*FACE_HEIGHT;const corners=[[left,top,.434],[right,top,.434],[right,bottom,.434],[left,bottom,.434]].map(p=>new THREE.Vector3(...p));const visible=t<15&&corners.every(p=>p.clone().applyMatrix4(camera.matrixWorldInverse).z<-.05);const points=corners.map(p=>{p.project(camera);return [(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2];});parent.postMessage({type:'armie-intro-face',time:t,points,visible},location.origin);}
}
function done(){playing=false;ended=true;fade.style.opacity='1';parent.postMessage({type:'armie-intro-complete'},location.origin);if(parent===window){status.style.display='grid';summary.textContent='Intro complete. Your hand stayed with you.';startButton.textContent='Replay intro';startButton.hidden=false;}}
function play(){if(!ready)return;ended=false;playing=true;status.style.display='none';startTime=performance.now();requestAnimationFrame(loop);}
function loop(now){if(!playing)return;const t=(now-startTime)/1000;renderAt(Math.min(t,21));if(t>=21){done();return;}requestAnimationFrame(loop);}
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='armie-intro-play')play();});
startButton.onclick=play;document.querySelector('#skip').onclick=done;
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(!playing&&!window.armieGameSceneState)renderAt(window.armieIntroTime||0);});
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='armie-intro-start')return;loadHand(e.data.profile).then(play).catch(err=>{summary.textContent=err.message;});});
const updateGame=continueScene({THREE,scene,camera,renderer,coach,computer,hand,drive,flashMat,fade,status,caption,practicals});
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='armie-game-state'){playing=false;updateGame(e.data.state);}});
window.armieIntro={renderAt,play,canvas:renderer.domElement,getProfile:()=>recipe};
try{const r=JSON.parse(localStorage.getItem('mbs-hand-profile-v1'));if(valid(r))await loadHand(r);else summary.textContent='Finish your hand in Handborne first.';}catch(e){summary.textContent='Could not load your hand. '+e.message;}
renderAt(0);

