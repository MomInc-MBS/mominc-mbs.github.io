// The constellation's dark lit-rim asteroids, shared by the board's drift layers and the flight game's targets.
const rand=(a,b)=>a+Math.random()*(b-a);
export const asteroid=(r0,r1)=>({r:rand(r0,r1),rot:rand(0,7),vr:rand(-.3,.3),verts:Array.from({length:8},()=>rand(.55,1))});
function poly(ctx,cx,cy,r,rot,verts){
 ctx.beginPath();
 verts.forEach((v,i)=>{const a=rot+i/verts.length*Math.PI*2,x=cx+Math.cos(a)*r*v,y=cy+Math.sin(a)*r*v;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
 ctx.closePath();
}
// Irregular dark polygon with a lit rim (a directional gradient stroke) — cheap stand-in for a lit asteroid.
export function rock(ctx,cx,cy,r,rot,verts,alpha){
 const g=ctx.createLinearGradient(cx-r,cy-r,cx+r*.2,cy+r*.2);
 g.addColorStop(0,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');
 ctx.globalAlpha=alpha;ctx.strokeStyle=g;ctx.lineWidth=1.2;poly(ctx,cx,cy,r,rot,verts);ctx.fillStyle='#0c0818';ctx.fill();ctx.stroke();ctx.globalAlpha=1;
}
