// Mini-computer stage for the MOM 2048 Alarm app.
// SOURCE (verbatim copies, marked below): D:/myr5-work/coach-run-hud-1029 @ 16618a6109a6aefb48bf3fae1441f436c431d279
//   modules/rooms/reminders-computer.mjs  (Coach Reminders mini-computer; asset pod/rooms/console.glb, 9885132 bytes)
// Reused unchanged: SCREEN/MODEL_* constants, screenProjection, prepareCabinet, makeCords, releaseObject and the camera/screen
// projection maths. NOT imported: Coach sign-in, reminder form, power toggle, key overlays, rotation (D04: alarm time is the only setting).
import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
// WEB PORT: bare imports -> vendored relative paths; model URL relative to this file; context-restore + visibility redraw (the scene is static: no render loop).

// ---- verbatim from reminders-computer.mjs ----
const SCREEN={left:-.185,right:.185,bottom:.39,top:.66,z:.115};
const MODEL_CENTER=new THREE.Vector3(0,.515,.10668);
const MODEL_SIZE=new THREE.Vector3(.527069,.9804382,.481444);
export function screenProjection(points,width=600,height=440){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=points;
 const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3;
 const dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3,det=dx1*dy2-dx2*dy1;
 if(!Number.isFinite(det)||Math.abs(det)<1e-8)throw new Error('Degenerate TV aperture');
 const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
 const a=x1-x0+g*x1,b=x3-x0+h*x3,d=y1-y0+g*y1,e=y3-y0+h*y3;
 return [a/width,d/width,0,g/width,b/height,e/height,0,h/height,0,0,1,0,x0,y0,0,1];
}

function prepareCabinet(root){
 root.traverse(node=>{if(!node.isMesh)return;for(const mat of [].concat(node.material||[])){
  mat.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 vCabinetPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCabinetPoint=position;');
   shader.fragmentShader='varying vec3 vCabinetPoint;\nfloat cabinetLine(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    if(vCabinetPoint.x>.015&&vCabinetPoint.x<.245&&vCabinetPoint.y>.17&&vCabinetPoint.y<.37&&vCabinetPoint.z>.055){
     vec2 p=vCabinetPoint.xy;float d=1.;
     for(int i=0;i<2;i++){float y=.225+float(i)*.05;
      d=min(d,cabinetLine(p,vec2(.145,y+.016),vec2(.145,y)));
      d=min(d,cabinetLine(p,vec2(.145,y),vec2(.107,y)));
      d=min(d,cabinetLine(p,vec2(.107,y),vec2(.119,y+.012)));
      d=min(d,cabinetLine(p,vec2(.107,y),vec2(.119,y-.012)));
     }
     float ink=1.-smoothstep(.001,.0025,d);float grain=.0015*sin(p.y*5800.);
     float printMask=step(.075,p.x)*step(p.x,.235)*(step(.205,p.y)*step(p.y,.245)+step(.255,p.y)*step(p.y,.295));
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.012,.009,.015)+grain,printMask);
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.66,.51,.27),ink);
    }`);
  };mat.customProgramCacheKey=()=>'reminders-icon-keycaps-v1';mat.needsUpdate=true;
 }});
}

function releaseObject(root){
 const geometries=new Set(),materials=new Set(),textures=new Set(),images=new Set();
 root?.traverse?.(node=>{
  if(node.geometry)geometries.add(node.geometry);
  for(const material of [].concat(node.material||[]))if(material){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}
 });
 for(const texture of textures){const image=texture.source?.data??texture.image;if(image&&typeof image.close==='function')images.add(image);texture.dispose();}
 for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();
 for(const image of images)try{image.close();}catch{}
}
function makeCords(scene){
 const colors=[0x52e4ff,0xff45d5,0xffc95c,0x9d78ff,0x52e4ff,0xff45d5,0xffc95c,0x4cc9e8,0xff6eac,0xa38aff,0xf3a765,0x53dfca,0x8cd6ff];
 const paths=[
  [[-.22,1.02,-.28],[-.35,.92,-.32],[-.4,.75,-.34],[-.31,.65,-.32],[-.29,.55,-.31],[-.39,.47,-.34],[-.37,.3,-.32],[-.29,.12,-.31]],
  [[.22,1,-.27],[.34,.9,-.32],[.4,.73,-.34],[.31,.63,-.32],[.29,.52,-.31],[.4,.43,-.34],[.37,.27,-.32],[.3,.08,-.31]],
  [[-.2,.83,-.32],[-.34,.78,-.35],[-.41,.67,-.36],[-.36,.59,-.34],[-.29,.64,-.32],[-.36,.72,-.34],[-.43,.63,-.36],[-.39,.48,-.34],[-.34,.23,-.31]],
  [[.2,.78,-.32],[.34,.73,-.35],[.42,.64,-.36],[.36,.55,-.34],[.29,.6,-.32],[.37,.69,-.34],[.44,.59,-.36],[.4,.42,-.34],[.34,.19,-.31]],
  [[-.3,.98,-.36],[-.43,.88,-.38],[-.42,.79,-.38],[-.32,.84,-.36],[-.26,.77,-.34],[-.42,.69,-.38],[-.44,.56,-.38],[-.33,.5,-.35]],
  [[.3,.96,-.36],[.43,.86,-.38],[.42,.77,-.38],[.32,.82,-.36],[.26,.74,-.34],[.43,.65,-.38],[.45,.51,-.38],[.34,.45,-.35]],
  [[-.48,1.08,-.42],[-.25,1.12,-.43],[0,1.06,-.44],[.24,1.12,-.43],[.48,1.04,-.42],[.4,.94,-.42],[.18,.98,-.43],[-.05,.93,-.43],[-.3,.99,-.42],[-.48,.9,-.42]],
  [[-.49,-.08,-.42],[-.28,-.14,-.43],[-.05,-.07,-.44],[.19,-.14,-.43],[.46,-.05,-.42],[.4,.05,-.42],[.16,-.01,-.43],[-.1,.06,-.43],[-.35,.01,-.42],[-.49,.12,-.42]],
  [[-.5,.74,-.45],[-.42,.98,-.46],[-.26,1.07,-.47],[-.15,.98,-.46],[-.3,.83,-.45],[-.45,.61,-.46],[-.43,.42,-.47],[-.25,.34,-.46],[-.14,.43,-.45],[-.35,.64,-.46],[-.5,.74,-.45]],
  [[.5,.71,-.45],[.42,.95,-.46],[.26,1.04,-.47],[.15,.95,-.46],[.3,.8,-.45],[.45,.58,-.46],[.43,.39,-.47],[.25,.31,-.46],[.14,.4,-.45],[.35,.61,-.46],[.5,.71,-.45]],
  [[-.48,1.03,-.5],[-.34,.94,-.51],[-.18,.82,-.52],[0,.66,-.52],[.18,.49,-.51],[.34,.31,-.51],[.49,.12,-.5]],
  [[.48,1.02,-.5],[.34,.91,-.51],[.18,.78,-.52],[0,.63,-.52],[-.18,.46,-.51],[-.34,.28,-.51],[-.49,.1,-.5]],
  [[-.52,.28,-.48],[-.36,.39,-.49],[-.18,.47,-.5],[0,.53,-.51],[.2,.61,-.5],[.38,.72,-.49],[.52,.86,-.48]]
 ];
 const radii=[.0032,.0038,.0028,.0034,.0026,.003,.0035,.0028,.0042,.003,.0028,.0036,.0034];
 if(paths.length!==colors.length||paths.length!==radii.length||radii.some(radius=>!Number.isFinite(radius)||radius<=0||radius>.01))throw new Error('Invalid Reminders cable layout.');
 for(let i=0;i<paths.length;i++){
  const points=paths[i].map(point=>new THREE.Vector3(...point));
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
  const radius=radii[i];
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,48,radius,5,false),new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:.72,depthWrite:false}));
  mesh.renderOrder=-1;scene.add(mesh);
 }
}

// ---- end verbatim ----

/** Mounts the console model and projects `screen` onto its glass. Returns {dispose, ok}. Falls back to a flat screen if WebGL fails. */
export async function mountComputer(stage, screen, glass, onSize) {
 const canvas = stage.querySelector('canvas');
 let renderer, raf = 0, disposed = false, ro;
 try {
  const bytes = await (await fetch(new URL('./model/console.glb', import.meta.url))).arrayBuffer();
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(url => { if (/^(?:data:|blob:)/i.test(url)) return url; throw new Error('external dependency'); });
  const parsed = (await new GLTFLoader(manager).parseAsync(bytes, '')).scene;
  prepareCabinet(parsed);
  const scene = new THREE.Scene(), model = new THREE.Group();
  model.position.copy(MODEL_CENTER); parsed.position.sub(MODEL_CENTER); model.add(parsed); scene.add(model); makeCords(scene);
  renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setClearColor(0, 0);
  scene.add(new THREE.HemisphereLight(0xe8f8ff, 0x241532, 2.1));
  const key = new THREE.DirectionalLight(0xffedcf, 2.5); key.position.set(-1.5, 2, 2.5); scene.add(key);
  const camera = new THREE.PerspectiveCamera(31, 1, .05, 12);
  const layout = () => {
   const width = stage.clientWidth, height = stage.clientHeight; if (!width || !height) return;
   renderer.setSize(width, height, false); camera.aspect = width / height;
   const vfov = THREE.MathUtils.degToRad(camera.fov), distance = Math.max(MODEL_SIZE.y * .53 / Math.tan(vfov / 2), MODEL_SIZE.x * .53 / Math.tan(vfov / 2) / camera.aspect) * 1.08;
   camera.position.set(0, .515, .10668 + distance); camera.lookAt(MODEL_CENTER); camera.zoom = 1.5; camera.updateProjectionMatrix();
   renderer.render(scene, camera);
   const project = (x, y, z) => { const p = new THREE.Vector3(x, y, z).project(camera); return [(p.x + 1) * width / 2, (1 - p.y) * height / 2]; };
   const pts = [[SCREEN.left, SCREEN.top], [SCREEN.right, SCREEN.top], [SCREEN.right, SCREEN.bottom], [SCREEN.left, SCREEN.bottom]].map(([x, y]) => project(x, y, SCREEN.z));
   const lw = Math.max(160, Math.round(Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / 8) * 8);
   const lh = Math.max(120, Math.round(Math.hypot(pts[3][0] - pts[0][0], pts[3][1] - pts[0][1]) / 8) * 8);
   const m = screenProjection(pts.map(([x, y]) => [x - pts[0][0], y - pts[0][1]]), lw, lh);
   Object.assign(screen.style, {left: pts[0][0] + 'px', top: pts[0][1] + 'px', width: lw + 'px', height: lh + 'px', transformOrigin: '0 0', transform: `matrix3d(${m.join(',')})`});
   glass.style.cssText = screen.style.cssText;
   onSize(lw, lh);
  };
  ro = new ResizeObserver(layout); ro.observe(stage); layout();
  canvas.addEventListener('webglcontextlost', e => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', layout);
  const onVis = () => { if (!document.hidden) layout(); }; // nothing animates while hidden; redraw once on return in case the GPU dropped the buffer
  document.addEventListener('visibilitychange', onVis);
  return {ok: true, dispose() { disposed = true; document.removeEventListener('visibilitychange', onVis); ro.disconnect(); cancelAnimationFrame(raf); releaseObject(scene); renderer.dispose(); renderer.forceContextLoss(); }};
 } catch (error) {
  console.warn('3D computer unavailable', error);
  return {ok: false, dispose() {}};
 }
}
