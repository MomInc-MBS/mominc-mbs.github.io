// Mini-computer stage for the ADHD app.
// SOURCE (verbatim copies, marked below): D:/myr5-work/coach-run-hud-1029 @ 16618a6109a6aefb48bf3fae1441f436c431d279
//   modules/rooms/reminders-computer.mjs  (Coach Reminders mini-computer; asset pod/rooms/console.glb, 9885132 bytes)
// Reused: MODEL_* constants, prepareCabinet (+ mirrored lower arrow, dimmable endpoints), makeCords, releaseObject. screenProjection/matrix3d dropped: the camera now looks straight at the glass.
// projection maths. NOT imported: Coach sign-in, reminder form, power toggle, key overlays, rotation (D04: alarm time is the only setting).
import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
// WEB PORT: bare imports -> vendored relative paths; model URL relative to this file; context-restore + visibility redraw (the scene is static: no render loop).

// ---- verbatim from reminders-computer.mjs ----
const MODEL_CENTER=new THREE.Vector3(0,.515,.10668);
const MODEL_SIZE=new THREE.Vector3(.527069,.9804382,.481444);

const keyLive={prev:{value:1},next:{value:1}};
function prepareCabinet(root){
 root.traverse(node=>{if(!node.isMesh)return;for(const mat of [].concat(node.material||[])){
  mat.onBeforeCompile=shader=>{
   shader.uniforms.uPrev=keyLive.prev;shader.uniforms.uNext=keyLive.next;
   shader.vertexShader='varying vec3 vCabinetPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCabinetPoint=position;');
   shader.fragmentShader='varying vec3 vCabinetPoint;\nuniform float uPrev;uniform float uNext;\nfloat cabinetLine(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    if(vCabinetPoint.x>.015&&vCabinetPoint.x<.245&&vCabinetPoint.y>.17&&vCabinetPoint.y<.37&&vCabinetPoint.z>.055){
     vec2 p=vCabinetPoint.xy;float d=1.;
     for(int i=0;i<2;i++){float y=.225+float(i)*.05;float m=i==0?1.:0.; // lower arrow (i=0) is mirrored: it bends down and ends pointing right
      float xa=mix(.145,.107,m),xb=mix(.107,.145,m),xh=mix(.119,.133,m);
      d=min(d,cabinetLine(p,vec2(xa,y+.016),vec2(xa,y)));
      d=min(d,cabinetLine(p,vec2(xa,y),vec2(xb,y)));
      d=min(d,cabinetLine(p,vec2(xb,y),vec2(xh,y+.012)));
      d=min(d,cabinetLine(p,vec2(xb,y),vec2(xh,y-.012)));
     }
     float ink=1.-smoothstep(.001,.0025,d);float grain=.0015*sin(p.y*5800.);
     float printMask=step(.075,p.x)*step(p.x,.235)*(step(.205,p.y)*step(p.y,.245)+step(.255,p.y)*step(p.y,.295));
     float live=p.y<.25?uNext:uPrev; // first/last tab: that key's arrow is visibly dimmed
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.012,.009,.015)+grain,printMask);
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.66,.51,.27)*mix(.3,1.,live),ink);
    }`);
  };mat.customProgramCacheKey=()=>'reminders-icon-keycaps-v2';mat.needsUpdate=true;
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


// ---- CRT mount: straight-on camera, plain rects (no matrix3d) ----
// Model-space rects, measured from a straight-on render of console.glb (see tools notes in the lead's report).
export const GLASS = {x0: -.192, x1: .192, y0: .368, y1: .698, z: .115};   // inner edge of the black bezel
export const KEYS = {                                                      // hit rects on the keycap faces
 up:   {x: -.044, y: .270, w: .060, h: .044, z: .065},
 down: {x: -.044, y: .214, w: .060, h: .044, z: .065},
 prev: {x: .150,  y: .256, w: .160, h: .044, z: .065},
 next: {x: .150,  y: .198, w: .160, h: .044, z: .065},
};
const KEY_BOTTOM = .17, MIN_HIT = 44;

/** Pure: camera plan for a stage of W x H px. Returns px-per-model-unit s and the model y at the vertical centre of the view. */
export function framePlan(W, H) {
 const gw = GLASS.x1 - GLASS.x0, need = GLASS.y1 - KEY_BOTTOM + .05;
 let s = W * .985 / gw;                                  // glass spans (nearly) the full stage width
 if (H / s < need) s = H / need;                         // too short: shrink the whole scene, never crop the keys
 const spare = Math.max(0, H / s - need), above = Math.min(spare * .5, .28);   // crop antenna/dish space first
 return {s, yc: GLASS.y1 + .02 + above - H / s / 2};
}

/** Mounts the console. `els` = {crt, up, down, prev, next} (all absolutely positioned in `stage`'s parent). Returns {ok, dispose, setKeys(prevOk,nextOk)}. */
export async function mountComputer(stage, els, onLayout) {
 const canvas = stage.querySelector('canvas');
 let renderer, disposed = false, ro;
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
  const place = (el, x0, y0, x1, y1, minW = 0, minH = 0) => {
   let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = Math.max(x1 - x0, minW), h = Math.max(y1 - y0, minH);
   const W = stage.clientWidth; if (cx + w / 2 > W) { w = Math.max(minW, W - (cx - w / 2)); cx = W - w / 2; }   // a hit area must never widen the page (sideways scroll)
   Object.assign(el.style, {left: (cx - w / 2).toFixed(1) + 'px', top: (cy - h / 2).toFixed(1) + 'px', width: w.toFixed(1) + 'px', height: h.toFixed(1) + 'px'});
  };
  const layout = () => {
   const width = stage.clientWidth, height = stage.clientHeight; if (!width || !height) return;
   renderer.setSize(width, height, false); camera.aspect = width / height;
   const {s, yc} = framePlan(width, height), dist = height / (2 * s * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
   camera.position.set(0, yc, GLASS.z + dist); camera.lookAt(0, yc, 0); camera.zoom = 1; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
   renderer.render(scene, camera);
   const project = (x, y, z) => { const p = new THREE.Vector3(x, y, z).project(camera); return [(p.x + 1) * width / 2, (1 - p.y) * height / 2]; };
   const a = project(GLASS.x0, GLASS.y1, GLASS.z), b = project(GLASS.x1, GLASS.y0, GLASS.z);
   place(els.crt, a[0], a[1], b[0], b[1]);
   for (const k of ['up', 'down', 'prev', 'next']) {
    const r = KEYS[k], p0 = project(r.x - r.w / 2, r.y + r.h / 2, r.z), p1 = project(r.x + r.w / 2, r.y - r.h / 2, r.z);
    place(els[k], p0[0], p0[1], p1[0], p1[1], MIN_HIT, MIN_HIT);
   }
   onLayout?.({width, height, crt: {w: b[0] - a[0], h: b[1] - a[1]}, project});
  };
  ro = new ResizeObserver(layout); ro.observe(stage); layout();
  canvas.addEventListener('webglcontextlost', e => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', layout);
  const onVis = () => { if (!document.hidden) layout(); };   // static scene: redraw once on return in case the GPU dropped the buffer
  document.addEventListener('visibilitychange', onVis);
  return {ok: true,
   setKeys(prevOk, nextOk) { keyLive.prev.value = prevOk ? 1 : 0; keyLive.next.value = nextOk ? 1 : 0; if (!disposed) layout(); },
   dispose() { disposed = true; document.removeEventListener('visibilitychange', onVis); ro.disconnect(); releaseObject(scene); renderer.dispose(); renderer.forceContextLoss(); }};
 } catch (error) {
  console.warn('3D computer unavailable', error);
  return {ok: false, setKeys() {}, dispose() {}};
 }
}
