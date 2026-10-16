// Sakura Crossing / Kenton Wang (MIT), adapted to Armie's existing THREE r180 renderer.
// A single reusable pipeline follows both the intro camera and the maze camera.
import { Pipeline } from './post.js';
export function createSakuraView(renderer) {
  let pipeline=null, width=0, height=0, lost=false, disposed=false, lastScene=null, lastCamera=null;
  const canvas=renderer.domElement;
  function render(scene,camera) {
    if(lost||disposed)return;
    lastScene=scene;lastCamera=camera;
    if(!pipeline) {
      pipeline=new Pipeline(renderer,scene,camera,{pixelBudget:1.6e6});
      pipeline.forceScale=Math.min(devicePixelRatio||1,1.5);
      // Armie's corridors use metres; ink dissolves with the existing haze.
      pipeline.ink.mat.uniforms.uFadeStart.value=16;
      pipeline.ink.mat.uniforms.uFadeEnd.value=42;
    }
    pipeline.scene=scene;pipeline.camera=camera;
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    if(w!==width||h!==height) {width=w;height=h;pipeline.setSize(w,h);}
    pipeline.ink.mat.uniforms.uNear.value=camera.near;
    pipeline.ink.mat.uniforms.uFar.value=camera.far;
    pipeline.render();
  }
  const onLost=()=>{lost=true;};
  const onRestored=()=>{lost=false;width=height=0;if(lastScene)requestAnimationFrame(()=>render(lastScene,lastCamera));};
  canvas.addEventListener('webglcontextlost',onLost);
  canvas.addEventListener('webglcontextrestored',onRestored);
  function dispose(){if(disposed)return;disposed=true;pipeline?.dispose();canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);removeEventListener('pagehide',onHide);}
  const onHide=e=>{if(!e.persisted)dispose();};
  addEventListener('pagehide',onHide);
  return {render,dispose};
}
