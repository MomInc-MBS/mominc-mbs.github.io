// Shared, bounded label document for the 2D preview, jar and saved batch.
export const LABEL_VERSION = 1;
export const SHAPES = ['rounded', 'oval', 'ticket', 'badge', 'burst', 'wrap'];
export const PATTERNS = ['gradient', 'solid', 'stripes', 'dots', 'rays'];
export const FONTS = ['bold', 'sport', 'serif', 'mono'];
export const ICONS = ['bolt', 'star', 'heart', 'moon', 'none'];
export const TEMPLATES = {
  electric: {primary:'#ff2e88', secondary:'#ffea00', ink:'#20142a', pattern:'rays', font:'bold', icon:'bolt', shape:'burst'},
  midnight: {primary:'#292345', secondary:'#7a2fc4', ink:'#fff9e6', pattern:'dots', font:'serif', icon:'moon', shape:'oval'},
  fresh: {primary:'#c8ff00', secondary:'#45dfff', ink:'#20142a', pattern:'gradient', font:'sport', icon:'star', shape:'rounded'},
  personal: {primary:'#ffe9de', secondary:'#ff8db6', ink:'#402840', pattern:'stripes', font:'mono', icon:'heart', shape:'ticket'}
};
const choose = (value, list, fallback) => list.includes(value) ? value : fallback;
const color = (value, fallback) => /^#[\da-f]{6}$/i.test(value || '') ? value : fallback;
const number = (value, low, high, fallback) => Number.isFinite(value) ? Math.min(high, Math.max(low, value)) : fallback;
export function defaultLabel() {
  return {version:LABEL_VERSION, template:'electric', ...TEMPLATES.electric, title:'', subtitle:'MADE BY ME', artData:'', artScale:1, artX:0, artY:0, locks:{name:false,colors:false,art:false,shape:false}};
}
export function cleanLabel(input = {}) {
  if(!input||typeof input!=='object')input={};
  const base = defaultLabel();
  return {...base, template:choose(input.template,Object.keys(TEMPLATES),base.template),
    shape:choose(input.shape,SHAPES,base.shape), pattern:choose(input.pattern,PATTERNS,base.pattern),
    font:choose(input.font,FONTS,base.font), icon:choose(input.icon,ICONS,base.icon),
    primary:color(input.primary,base.primary),secondary:color(input.secondary,base.secondary),ink:color(input.ink,base.ink),
    title:typeof input.title==='string'?input.title.slice(0,48):'',subtitle:typeof input.subtitle==='string'?input.subtitle.slice(0,52):base.subtitle,
    artData:typeof input.artData==='string' && input.artData.length<=350000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.artData)?input.artData:'',
    artScale:number(input.artScale,.5,2,1), artX:number(input.artX,-1,1,0),artY:number(input.artY,-1,1,0),
    locks:{name:input.locks?.name===true,colors:input.locks?.colors===true,art:input.locks?.art===true,shape:input.locks?.shape===true}};
}
export function cleanDraft(input, keys, flavors) {
  if (!input || input.version!==1 || !Array.isArray(input.scoops)) return null;
  const counts = new Map();
  const scoops = input.scoops.slice(0,8).filter(key=>{
    if(!keys.includes(key)||(counts.get(key)||0)>=2)return false;
    counts.set(key,(counts.get(key)||0)+1);return true;
  });
  const flavour=flavors.includes(input.flavour)?input.flavour:null;
  const mixTurns=scoops.length===8&&flavour?Math.round(number(input.mixTurns,0,3,0)):0;
  const phase=scoops.length!==8?'fill':!flavour||mixTurns<3?'flavor':choose(input.phase,['fill','flavor','label','done'],'label');
  const words=Array.isArray(input.words)?input.words.slice(0,3).map(v=>typeof v==='string'?v.slice(0,24):''):[];
  return {version:1,scoops,flavour,mixTurns,phase,label:cleanLabel(input.label),words,sealedIdentity:/^[a-f0-9]{16}$/.test(input.sealedIdentity||'')?input.sealedIdentity:null};
}
// Exact visual identity includes image bytes; these bounded strings stay in local storage, not mailto.
export function batchIdentity(scoops, flavour, words, label) {
  const {locks, ...appearance}=cleanLabel(label);
  return JSON.stringify({scoops,flavour,words,appearance});
}
export function batchSignature(scoops, flavour, words, label) {
  const text=batchIdentity(scoops,flavour,words,label);let a=2166136261,b=5381;
  for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b,33)^c;}
  return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
function outline(x, shape, w, h) {
  const l=34,r=w-34,t=24,b=h-24,cx=w/2,cy=h/2;
  x.beginPath();
  if(shape==='oval')x.ellipse(cx,cy,(r-l)/2,(b-t)/2,0,0,Math.PI*2);
  else if(shape==='burst'){
    for(let i=0;i<40;i++){const a=i*Math.PI/20-Math.PI/2,k=i%2?.88:1;const px=cx+Math.cos(a)*(r-l)/2*k,py=cy+Math.sin(a)*(b-t)/2*k;i?x.lineTo(px,py):x.moveTo(px,py);}x.closePath();
  }else if(shape==='badge'){
    x.moveTo(l+65,t);x.lineTo(r-65,t);x.lineTo(r,cy);x.lineTo(r-65,b);x.lineTo(l+65,b);x.lineTo(l,cy);x.closePath();
  }else if(shape==='ticket'){
    x.moveTo(l+20,t);x.lineTo(r-20,t);x.quadraticCurveTo(r,t,r,t+20);x.lineTo(r,cy-25);x.arc(r,cy,25,-Math.PI/2,Math.PI/2,true);x.lineTo(r,b-20);x.quadraticCurveTo(r,b,r-20,b);x.lineTo(l+20,b);x.quadraticCurveTo(l,b,l,b-20);x.lineTo(l,cy+25);x.arc(l,cy,25,Math.PI/2,-Math.PI/2,true);x.lineTo(l,t+20);x.quadraticCurveTo(l,t,l+20,t);x.closePath();
  }else x.roundRect(shape==='wrap'?0:l,t,shape==='wrap'?w:r-l,b-t,shape==='wrap'?0:45);
}
function fittedText(x, text, y, width, size, family) {
  x.font=`900 ${size}px ${family}`;
  while(x.measureText(text).width>width&&size>16){size--;x.font=`900 ${size}px ${family}`;}
  x.fillText(text,472,y,width);
}
export function paintLabel(canvas, label, name, art) {
  const x=canvas.getContext('2d');if(!x)return;
  const w=canvas.width,h=canvas.height;x.clearRect(0,0,w,h);
  x.save();outline(x,label.shape,w,h);x.clip();
  const gradient=x.createLinearGradient(0,0,w,h);gradient.addColorStop(0,label.primary);gradient.addColorStop(1,label.secondary);
  x.fillStyle=label.pattern==='solid'?label.primary:gradient;x.fillRect(0,0,w,h);
  x.fillStyle=label.ink;x.globalAlpha=.13;
  if(label.pattern==='stripes'){for(let i=-h;i<w;i+=65){x.beginPath();x.moveTo(i,0);x.lineTo(i+30,0);x.lineTo(i+h+30,h);x.lineTo(i+h,h);x.fill();}}
  if(label.pattern==='dots'){for(let i=0;i<w;i+=45)for(let j=0;j<h;j+=45){x.beginPath();x.arc(i,j,7,0,Math.PI*2);x.fill();}}
  if(label.pattern==='rays'){for(let i=0;i<24;i++){x.beginPath();x.moveTo(w/2,h/2);const a=i*Math.PI/12;x.lineTo(w/2+Math.cos(a)*w,h/2+Math.sin(a)*w);x.lineTo(w/2+Math.cos(a+.09)*w,h/2+Math.sin(a+.09)*w);x.fill();}}
  x.globalAlpha=1;
  if(art){const size=145,scale=Math.max(size/art.width,size/art.height)*label.artScale,dw=art.width*scale,dh=art.height*scale;const cx=147,cy=218;x.save();x.beginPath();x.roundRect(cx-size/2,cy-size/2,size,size,16);x.clip();x.drawImage(art,cx-dw/2+label.artX*size/2,cy-dh/2+label.artY*size/2,dw,dh);x.restore();}
  else if(label.icon!=='none'){
    x.save();x.translate(140,210);x.fillStyle=label.ink;x.beginPath();
    if(label.icon==='bolt'){x.moveTo(12,-70);x.lineTo(-43,9);x.lineTo(-3,9);x.lineTo(-15,72);x.lineTo(45,-14);x.lineTo(8,-14);x.closePath();}
    if(label.icon==='star'){for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?29:64;i?x.lineTo(Math.cos(a)*r,Math.sin(a)*r):x.moveTo(Math.cos(a)*r,Math.sin(a)*r);}x.closePath();}
    if(label.icon==='heart'){x.moveTo(0,60);x.bezierCurveTo(-105,-8,-48,-88,0,-34);x.bezierCurveTo(48,-88,105,-8,0,60);}
    if(label.icon==='moon'){x.arc(0,0,64,0,Math.PI*2);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(25,-20,54,0,Math.PI*2);}
    x.fill();x.restore();
  }
  const family={bold:'Arial, sans-serif',sport:'Impact, sans-serif',serif:'Georgia, serif',mono:'monospace'}[label.font];
  x.fillStyle=label.ink;x.textAlign='center';x.textBaseline='middle';
  x.font=`700 23px ${family}`;x.fillText('MBS FUEL',450,104);
  fittedText(x,name||'MY FUEL',215,430,55,family);
  x.font=`600 22px ${family}`;x.fillText(label.subtitle||'MADE BY ME',450,294,460);
  x.font='700 14px Arial';x.fillText('FICTIONAL · UNTESTED · NOT FOR SALE',w/2,h-66);
  x.restore();outline(x,label.shape,w,h);x.strokeStyle=label.ink;x.lineWidth=8;x.stroke();
}
