const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Leave headroom for the monster even after all three school pictures are found.
export const schoolCortisol = (pages, danger) => Math.round(12 + clamp(pages, 0, 3) * 18 + clamp(danger, 0, 1) * 34);
export const heartbeatBpm = cortisol => 60 + Math.round(clamp(cortisol, 0, 100) * 1.2);
export function heartbeatPulse(phase) {
  const p = ((phase % 1) + 1) % 1;
  const thump = (center, width) => Math.max(0, 1 - Math.abs(p - center) / width) ** 2;
  return thump(.13, .13) + .58 * thump(.37, .12);
}

export function createPaperHearts(THREE, canvas, {reducedMotion = false} = {}) {
  const holder = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4.15, 4.15, 1.7, -1.7, .1, 20);
  camera.position.set(0,0,8);
  scene.add(new THREE.HemisphereLight(0xfff4d9,0x574d40,2.1));
  const light = new THREE.DirectionalLight(0xffefcf,3.4); light.position.set(-3,4,6); scene.add(light);
  const rim = new THREE.DirectionalLight(0xc2c9e0,1.3); rim.position.set(4,0,1); scene.add(rim);

  // Printed scraps overlap at different angles, with torn edges and visible glue folds.
  const paper = document.createElement('canvas'); paper.width = paper.height = 768;
  const x = paper.getContext('2d'); x.fillStyle = '#cec1a1'; x.fillRect(0,0,768,768);
  const lines = ['THE DAILY MOM','CORTISOL RISES','AFTER SCHOOL','HE IS NEAR','KEEP READING','THE NEWS'];
  for (let i=0;i<18;i++) {
    const px=(i%3)*258-35+(i%2)*28, py=Math.floor(i/3)*145-50;
    x.save();x.translate(px,py);x.rotate((i%5-2)*.075);
    x.fillStyle=['#e4d9bf','#c9bea5','#f1e8cd','#d8c9a9'][i%4];
    x.beginPath();x.moveTo(0,5);x.lineTo(235,0);x.lineTo(240,142);x.lineTo(8,148);x.closePath();x.fill();
    x.strokeStyle='#7a6b5045';x.lineWidth=2;x.stroke();
    x.fillStyle='#27251f';x.font='bold 21px Georgia';x.fillText(lines[i%lines.length],12,27);
    x.fillRect(12,33,213,2);
    x.font='10px Georgia';
    for(let row=0;row<10;row++)for(let col=0;col<2;col++)x.fillText(['The school stays quiet.','All the news from MOM.','A paper heart holds on.','Read between the lines.'][(i+row+col)%4],12+col*108,48+row*9);
    x.strokeStyle='#fff7df90';x.beginPath();x.moveTo(4,5);x.lineTo(228,141);x.stroke();x.restore();
  }
  const texture = new THREE.CanvasTexture(paper);texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const folds = document.createElement('canvas');folds.width=folds.height=256;
  const f=folds.getContext('2d');f.fillStyle='#888';f.fillRect(0,0,256,256);
  for(let i=0;i<36;i++){
    const sx=(i*79)%256,sy=(i*53)%256;
    f.strokeStyle=i%2?'#a3a3a3':'#6c6c6c';f.lineWidth=1+i%3;
    f.beginPath();f.moveTo(sx,sy);f.lineTo(sx+46,sy+31);f.lineTo(sx+78,sy-16);f.stroke();
  }
  const bump = new THREE.CanvasTexture(folds);
  const shape = new THREE.Shape();
  shape.moveTo(0,.54);
  shape.bezierCurveTo(-.54,1.32,-1.38,.78,-.98,.02);
  shape.bezierCurveTo(-.8,-.35,-.24,-.76,0,-1.04);
  shape.bezierCurveTo(.26,-.73,.88,-.3,1.01,.11);
  shape.bezierCurveTo(1.32,.84,.47,1.26,0,.54);
  const geometry = new THREE.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.16,bevelThickness:.26,curveSegments:10});
  geometry.center();
  const positions=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<positions.count;i++){
    const px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i);
    // The same displacement at duplicate vertices keeps the sewn edge watertight.
    const wrinkle=Math.sin(px*14+py*9)*Math.sin(py*17-pz*8)*.016;
    positions.setXYZ(i,px+wrinkle,py+wrinkle*.6,pz+wrinkle);
    uv.setXY(i,.5+px/2.55,.5+py/2.55);
  }
  geometry.computeVertexNormals();
  const hearts = [0,1,2].map(i=>{
    const material=new THREE.MeshStandardMaterial({map:texture,bumpMap:bump,bumpScale:.055,roughness:1,metalness:0,transparent:true});
    const mesh=new THREE.Mesh(geometry,material);mesh.position.x=(i-1)*2.5;
    mesh.rotation.set(-.12,[-.34,.28,-.26][i],[-.10,.07,-.05][i]);mesh.name='newspaper-paper-mache-heart';scene.add(mesh);return mesh;
  });
  let last=0,phase=0,bpm=60,lastPaint=-Infinity,dead=false;
  function resize(){renderer.setSize(holder.clientWidth||156,holder.clientHeight||64,false);}
  resize();holder.dataset.hearts='3d';
  return {
    resize,
    render(now,lives,cortisol){
      if(dead)return;
      const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
      bpm+=(heartbeatBpm(cortisol)-bpm)*Math.min(1,dt*5);phase=(phase+dt*bpm/60)%1;
      if(now-lastPaint<1000/30)return;lastPaint=now;
      const beat=reducedMotion?0:heartbeatPulse(phase),strength=.055+clamp(cortisol,0,100)*.00105;
      hearts.forEach((heart,i)=>{
        const alive=i<lives;
        heart.scale.setScalar(alive?1+beat*strength:.76);
        heart.material.opacity=alive?1:.2;heart.material.color.set(alive?0xffffff:0x756f63);
        heart.rotation.y=[-.34,.28,-.26][i]+(alive&&!reducedMotion?beat*.065:0);
      });
      holder.dataset.bpm=String(Math.round(bpm));renderer.render(scene,camera);
    },
    dispose(){if(dead)return;dead=true;geometry.dispose();texture.dispose();bump.dispose();hearts.forEach(h=>h.material.dispose());renderer.dispose();renderer.forceContextLoss();delete holder.dataset.hearts;}
  };
}
