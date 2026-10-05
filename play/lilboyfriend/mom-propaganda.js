// Original print compositions: illustrated uniforms, caretaker poses and the
// canonical MOM face. One texture per poster; no extra scene geometry.
export function createMomPropaganda(THREE, own) {
  const jobs=[];
  const face=typeof Image==='undefined'?{complete:false}:new Image();
  face.onload=()=>jobs.forEach(job=>job());
  face.src=new URL('../../tv/assets/mom-inc-mark.png',import.meta.url).href;
  let edition=0;
  const schemes=[['#eedcc1','#41314c','#a35264'],['#c7d5ca','#203c38','#bb7c48'],['#efd398','#463448','#785079'],['#cad8e4','#25384c','#ba6060']];
  function shape(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function person(c,x,y,s,ink,paper,accent,caretaker=false){
    c.save();c.translate(x,y);c.scale(s,s);
    // A tailored dress/coat, lapels, belt, sleeves and hands read as clothing.
    shape(c,[[-49,34],[-83,93],[-114,132],[-91,146],[-38,99],[-54,224],[61,224],[40,99],[88,138],[114,119],[73,56],[37,34]],ink);
    shape(c,[[-24,38],[0,65],[-16,92],[-39,44]],paper);
    shape(c,[[24,38],[0,65],[16,92],[39,44]],paper);
    shape(c,[[-48,126],[46,126],[49,139],[-49,139]],accent);
    shape(c,[[-34,224],[-16,224],[-20,274],[-41,274]],ink);
    shape(c,[[23,224],[41,224],[48,274],[26,274]],ink);
    circle(c,-99,138,12,paper);circle(c,104,125,12,paper);
    circle(c,0,0,41,paper);
    if(face.complete&&face.naturalWidth){c.save();c.beginPath();c.arc(0,0,38,0,Math.PI*2);c.clip();c.drawImage(face,78,38,335,335,-39,-39,78,78);c.restore();}
    else {shape(c,[[-36,-11],[-26,-38],[25,-37],[39,-8],[21,-17],[-18,-17]],ink);circle(c,-13,0,3,ink);circle(c,13,0,3,ink);c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.arc(0,7,13,.2,2.9);c.stroke();}
    if(caretaker){
      // A swaddled resident is held in a broad protective corporate sleeve.
      c.save();c.translate(-1,105);c.rotate(-.3);shape(c,[[-59,-18],[53,-18],[70,25],[-50,30]],accent);circle(c,42,-14,17,paper);c.restore();
    }
    circle(c,26,91,11,accent);c.fillStyle=paper;c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('M',26,95);
    c.restore();
  }
  return function propaganda(words,aspect=2.4){
    const variant=edition++%6,[paper,ink,accent]=schemes[variant%4];
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=Math.max(380,Math.min(780,Math.round(1200/aspect)));
    const map=own(new THREE.CanvasTexture(canvas));map.colorSpace=THREE.SRGBColorSpace;
    const headline=(Array.isArray(words)?words.join(' '):words).replace(/^MOM FICTIONAL AD:\s*/i,'');
    const paint=()=>{
      const c=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
      c.fillStyle=paper;c.fillRect(0,0,W,H);
      const imageRight=variant%2===0,artX=imageRight?850:265,textX=imageRight?55:530,textW=615;
      if(variant===0||variant===3){
        circle(c,artX,H*.50,H*.60,accent);
        for(let i=0;i<12;i++){c.strokeStyle=paper;c.lineWidth=3;c.beginPath();c.moveTo(artX,H*.52);c.lineTo(artX+Math.cos(i*.524)*H,H*.52+Math.sin(i*.524)*H);c.stroke();}
      }else if(variant===1||variant===4){
        c.fillStyle=accent;c.fillRect(imageRight?720:0,0,480,H);
        for(let i=0;i<7;i++){c.fillStyle=i%2?paper:ink;c.globalAlpha=.10;c.fillRect((imageRight?745:22)+i*61,20,26,H-40);}c.globalAlpha=1;
      }else {
        c.strokeStyle=accent;c.lineWidth=12;for(let i=0;i<4;i++)c.strokeRect(artX-185+i*20,H*.19+i*16,370-i*40,H*.69-i*32);
      }
      if(variant===2||variant===4){person(c,artX-88,H*.30,H/480*.68,ink,paper,accent);person(c,artX+88,H*.39,H/480*.47,ink,paper,accent);}
      else person(c,artX,H*.26,H/480*.95,ink,paper,accent,variant===0||variant===5);
      c.fillStyle=ink;c.textAlign='left';c.textBaseline='top';
      c.font='700 24px sans-serif';c.fillText('MOM / RESIDENTIAL SOLUTIONS',textX,28,textW);
      c.fillStyle=accent;c.fillRect(textX,67,textW,7);
      // Fit the headline to a readable column instead of squeezing long text.
      let size=62,lines=[];
      for(;size>=36;size-=2){c.font=`900 ${size}px sans-serif`;lines=[];let line='';for(const word of headline.split(/\s+/)){if(line&&c.measureText(`${line} ${word}`).width>textW){lines.push(line);line=word;}else line=line?`${line} ${word}`:word;}if(line)lines.push(line);if(lines.length*size*1.12<H-160)break;}
      c.fillStyle=ink;lines.forEach((line,i)=>c.fillText(line,textX,98+i*size*1.12));
      c.fillStyle=ink;c.fillRect(0,H-49,W,49);c.fillStyle=paper;c.font='700 22px sans-serif';
      c.fillText(['CARE THAT KEEPS YOU CLOSE.','EVERY RESIDENT. PROPERLY FITTED.','LESS SPACE. MORE MOM.','YOUR SIZE IS OUR BUSINESS.','DRESS FOR YOUR SMALLER FUTURE.','BELONGING IS A MATTER OF SCALE.'][variant],28,H-36);
      if(face.complete&&face.naturalWidth)c.drawImage(face,W-102,H-101,75,75);
      map.needsUpdate=true;
    };
    jobs.push(paint);paint();return map;
  };
}
