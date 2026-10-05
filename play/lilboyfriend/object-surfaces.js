// Original restrained material drawings: physical construction rather than clay noise.
export function objectSurfaces(THREE, own) {
  const cache = new Map();
  let seed = 23017;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  return kind => {
    if (!['paper','wood','thread','felt','cork','stone','match'].includes(kind)) return null;
    if(cache.has(kind)) return cache.get(kind);
    const canvas = document.createElement('canvas'); canvas.width=canvas.height=512;
    const c=canvas.getContext('2d');
    c.fillStyle='#e8e3d9';c.fillRect(0,0,512,512);
    if(kind==='wood') {
      for(let i=0;i<110;i++) {
        c.strokeStyle='rgba(83,65,46,.1)';
        c.lineWidth=.4+random()*1.1;c.beginPath();
        const x=i*4.9;
        for(let y=0;y<=512;y+=8) {const xx=x+Math.sin(y/70+i)*1.4+Math.sin(y/25+i)*.6;y?c.lineTo(xx,y):c.moveTo(xx,y)}
        c.stroke();
      }
      for(let i=0;i<450;i++){c.fillStyle='rgba(85,65,48,.045)';c.fillRect(random()*512,random()*512,.6,4+random()*14)}
    } else if(kind==='thread'||kind==='felt') {
      c.lineWidth=kind==='felt'?.55:1.2;
      for(let i=0;i<512;i+=kind==='felt'?5:9) {
        c.strokeStyle='rgba(69,60,75,.09)';
        c.beginPath();c.moveTo(i,0);c.lineTo(i+100,512);c.stroke();
        c.strokeStyle='rgba(255,255,255,.24)';c.beginPath();c.moveTo(0,i);c.lineTo(512,i+30);c.stroke();
      }
    } else {
      const count=kind==='cork'?3200:kind==='stone'?2200:1800;
      for(let i=0;i<count;i++) {
        const x=random()*512,y=random()*512;
        c.fillStyle=`rgba(67,57,47,${kind==='cork'?.1+random()*.15:.02+random()*.08})`;
        if(kind==='paper'){c.fillRect(x,y,.4+random()*.5,1+random()*3)}
        else {c.beginPath();c.ellipse(x,y,.5+random()*2,.3+random()*1.4,random()*Math.PI,0,Math.PI*2);c.fill()}
      }
      if(kind==='match') for(let i=0;i<160;i++){c.fillStyle='rgba(255,255,255,.3)';c.fillRect(random()*512,random()*512,1.4,1.4)}
    }
    const map=own(new THREE.CanvasTexture(canvas));map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
    const result={map,bumpMap:null};cache.set(kind,result);return result;
  };
}
