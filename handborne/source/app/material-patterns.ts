/** Built-in procedural surface families. These are local math, so previews work offline. */
export type SurfaceSample={height:number;tint:number;glow:number;rough:number};
export type SurfaceProfile={id:number;name:string;roughness:number;metalness:number;relief:number;bump:number;sheen:number;sheenRoughness:number;clearcoat:number;clearcoatRoughness:number};

// Stable ids 32-55 correspond to the Battle Pass catalogue order in materials-registry.ts.
export const BUILTIN_SURFACE_PROFILES:readonly SurfaceProfile[]=[
 {id:32,name:'Plate Steel',roughness:.34,metalness:.82,relief:.024,bump:.012,sheen:0,sheenRoughness:.7,clearcoat:.35,clearcoatRoughness:.24},
 {id:33,name:'Rubber Grip',roughness:.95,metalness:0,relief:.055,bump:.022,sheen:0,sheenRoughness:.9,clearcoat:0,clearcoatRoughness:.5},
 {id:34,name:'Chain Mail',roughness:.41,metalness:.78,relief:.034,bump:.014,sheen:0,sheenRoughness:.7,clearcoat:.3,clearcoatRoughness:.25},
 {id:35,name:'Track Rubber',roughness:.94,metalness:0,relief:.038,bump:.016,sheen:0,sheenRoughness:.9,clearcoat:0,clearcoatRoughness:.5},
 {id:36,name:'Denim',roughness:.86,metalness:0,relief:.012,bump:.011,sheen:.22,sheenRoughness:.96,clearcoat:0,clearcoatRoughness:.5},
 {id:37,name:'Hex Tread',roughness:.82,metalness:.04,relief:.052,bump:.014,sheen:0,sheenRoughness:.9,clearcoat:.08,clearcoatRoughness:.4},
 {id:38,name:'Sweatshirt Fleece',roughness:.99,metalness:0,relief:.05,bump:.032,sheen:.74,sheenRoughness:.98,clearcoat:0,clearcoatRoughness:.5},
 {id:39,name:'Quilted',roughness:.89,metalness:0,relief:.07,bump:.012,sheen:.14,sheenRoughness:.9,clearcoat:0,clearcoatRoughness:.5},
 {id:40,name:'Speckled',roughness:.96,metalness:0,relief:.03,bump:.028,sheen:.34,sheenRoughness:.98,clearcoat:0,clearcoatRoughness:.5},
 {id:41,name:'Hammered Bronze',roughness:.39,metalness:.78,relief:.025,bump:.025,sheen:0,sheenRoughness:.7,clearcoat:.28,clearcoatRoughness:.22},
 {id:42,name:'Fine Stripe',roughness:.91,metalness:0,relief:.042,bump:.012,sheen:.08,sheenRoughness:.92,clearcoat:0,clearcoatRoughness:.5},
 {id:43,name:'Snake Skin',roughness:.68,metalness:.02,relief:.019,bump:.023,sheen:.1,sheenRoughness:.76,clearcoat:.08,clearcoatRoughness:.4},
 {id:44,name:'Holey',roughness:.96,metalness:0,relief:.039,bump:.025,sheen:0,sheenRoughness:.9,clearcoat:0,clearcoatRoughness:.5},
 {id:45,name:'Woven Mat',roughness:.9,metalness:0,relief:.014,bump:.014,sheen:.08,sheenRoughness:.94,clearcoat:0,clearcoatRoughness:.5},
 {id:46,name:'Petal',roughness:.51,metalness:0,relief:.025,bump:.009,sheen:.52,sheenRoughness:.72,clearcoat:.12,clearcoatRoughness:.3},
 {id:47,name:'Graph Paper',roughness:.93,metalness:0,relief:.012,bump:.017,sheen:.16,sheenRoughness:.97,clearcoat:0,clearcoatRoughness:.5},
 {id:48,name:'Bamboo',roughness:.57,metalness:0,relief:.027,bump:.008,sheen:.18,sheenRoughness:.62,clearcoat:.12,clearcoatRoughness:.28},
 {id:49,name:'Dragon Scale',roughness:.31,metalness:.16,relief:.043,bump:.01,sheen:.24,sheenRoughness:.42,clearcoat:.72,clearcoatRoughness:.16},
 {id:50,name:'Cool Graph Paper',roughness:.56,metalness:.23,relief:.021,bump:.008,sheen:0,sheenRoughness:.8,clearcoat:.12,clearcoatRoughness:.3},
 {id:51,name:'Terry Cloth',roughness:.98,metalness:0,relief:.014,bump:.026,sheen:.62,sheenRoughness:.99,clearcoat:0,clearcoatRoughness:.5},
 {id:52,name:'Pebble Path',roughness:.77,metalness:0,relief:.038,bump:.018,sheen:0,sheenRoughness:.8,clearcoat:.08,clearcoatRoughness:.4},
 {id:53,name:'Wiggles',roughness:.99,metalness:0,relief:.016,bump:.016,sheen:0,sheenRoughness:.95,clearcoat:0,clearcoatRoughness:.5},
 {id:54,name:'River Stone',roughness:.72,metalness:.01,relief:.031,bump:.019,sheen:.04,sheenRoughness:.7,clearcoat:.1,clearcoatRoughness:.32},
 {id:55,name:'Moss',roughness:.99,metalness:0,relief:.022,bump:.023,sheen:.38,sheenRoughness:.98,clearcoat:0,clearcoatRoughness:.5},
];
const pixelProfile:SurfaceProfile={id:56,name:'64-bit Skin',roughness:.58,metalness:.12,relief:.018,bump:.01,sheen:0,sheenRoughness:.7,clearcoat:.1,clearcoatRoughness:.4};
// Extra finishes use stable additive IDs; existing reward IDs retain their meaning.
export const SPECIAL_SURFACE_PROFILES:readonly SurfaceProfile[]=[
 {id:57,name:'Opal Jelly',roughness:.06,metalness:0,relief:.004,bump:.001,sheen:0,sheenRoughness:.3,clearcoat:1,clearcoatRoughness:.035},
 {id:58,name:'Bubble Glass',roughness:.035,metalness:0,relief:.006,bump:.002,sheen:0,sheenRoughness:.3,clearcoat:1,clearcoatRoughness:.025},
 {id:59,name:'Prism Crystal',roughness:.045,metalness:0,relief:.052,bump:.008,sheen:0,sheenRoughness:.3,clearcoat:1,clearcoatRoughness:.03},
 {id:60,name:'Holographic Foil',roughness:.18,metalness:.88,relief:.022,bump:.013,sheen:0,sheenRoughness:.3,clearcoat:1,clearcoatRoughness:.045},
 {id:61,name:'Glitter Resin',roughness:.075,metalness:0,relief:.006,bump:.002,sheen:0,sheenRoughness:.3,clearcoat:1,clearcoatRoughness:.025},
 {id:62,name:'Galaxy Geode',roughness:.22,metalness:.25,relief:.065,bump:.014,sheen:0,sheenRoughness:.3,clearcoat:.8,clearcoatRoughness:.06},
 {id:63,name:'Caustic Slime',roughness:0.055,metalness:0,relief:0.035,bump:0.012,sheen:0,sheenRoughness:.6,clearcoat:1,clearcoatRoughness:.07},
 {id:64,name:'Blister Hide',roughness:0.18,metalness:0,relief:0.065,bump:0.023,sheen:0,sheenRoughness:.6,clearcoat:1,clearcoatRoughness:.07},
 {id:65,name:'Rotten Rind',roughness:0.94,metalness:0,relief:0.05,bump:0.025,sheen:0,sheenRoughness:.6,clearcoat:0,clearcoatRoughness:.07},
 {id:66,name:'Parasite Nest',roughness:0.31,metalness:0,relief:0.07,bump:0.027,sheen:0,sheenRoughness:.6,clearcoat:0.6,clearcoatRoughness:.07},
 {id:67,name:'Exposed Sinew',roughness:0.2,metalness:0,relief:0.045,bump:0.017,sheen:0,sheenRoughness:.6,clearcoat:1,clearcoatRoughness:.07},
 {id:68,name:'Abyssal Maw',roughness:0.26,metalness:0,relief:0.065,bump:0.023,sheen:0,sheenRoughness:.6,clearcoat:0.8,clearcoatRoughness:.07},
 {id:69,name:'Circuit Alloy',roughness:0.19,metalness:0.83,relief:0.027,bump:0.01,sheen:0,sheenRoughness:.6,clearcoat:0.6,clearcoatRoughness:.07},
 {id:70,name:'Servo Armor',roughness:0.34,metalness:0.82,relief:0.055,bump:0.013,sheen:0,sheenRoughness:.6,clearcoat:0.4,clearcoatRoughness:.07},
 {id:71,name:'Chrome Rib',roughness:0.09,metalness:0.96,relief:0.05,bump:0.012,sheen:0,sheenRoughness:.6,clearcoat:1,clearcoatRoughness:.07},
 {id:72,name:'Carbon Mech',roughness:0.64,metalness:0.18,relief:0.018,bump:0.013,sheen:0,sheenRoughness:.6,clearcoat:0.25,clearcoatRoughness:.07},
 {id:73,name:'Hazard Panel',roughness:0.46,metalness:0.55,relief:0.032,bump:0.014,sheen:0,sheenRoughness:.6,clearcoat:0.4,clearcoatRoughness:.07},
 {id:74,name:'Reactor Glass',roughness:0.045,metalness:0,relief:0.018,bump:0.004,sheen:0,sheenRoughness:.6,clearcoat:1,clearcoatRoughness:.07},
];
const profiles=new Map([...BUILTIN_SURFACE_PROFILES,pixelProfile,...SPECIAL_SURFACE_PROFILES].map(p=>[p.id,p]));
export const builtinSurfaceProfile=(id:number)=>profiles.get(id);
const fract=(x:number)=>x-Math.floor(x),clamp=(x:number)=>Math.max(0,Math.min(1,x));
const hash=(x:number,y:number)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
const smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const triangle=(x:number)=>1-Math.abs(fract(x)*2-1);
const voronoi=(x:number,y:number)=>{const ix=Math.floor(x),iy=Math.floor(y);let near=9,next=9;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const px=ix+i+.18+.64*hash(ix+i,iy+j),py=iy+j+.18+.64*hash(iy+j,ix+i+19),d=Math.hypot(x-px,y-py);if(d<near){next=near;near=d;}else if(d<next)next=d;}return{near,gap:next-near};};

/** High-contrast structural masks are paired with their actual material height and roughness maps. */
export function sampleBuiltinSurface(id:number,x:number,y:number):SurfaceSample|undefined{
 if(!profiles.has(id))return undefined;
 x=fract(x);y=fract(y); // Geometry relief and RepeatWrapping must sample the same tiled domain.
 const g=Math.sin(x*167.3+Math.sin(y*43)*1.7)*Math.sin(y*151.7+Math.sin(x*37))*0.5+0.5;
 const line=(v:number,n:number,w:number)=>1-smooth(w,w*2,Math.abs(fract(v*n)-.5));
 let h=.5,t=.5,glow=0,rough=.8;
 switch(id){
  case 63:{const c=voronoi(x*7,y*7),sac=1-smooth(.04,.44,c.near),ooze=.5+.5*Math.sin(x*20+Math.sin(y*14)*3);h=.32+sac*.49;t=.13+sac*.67+ooze*.12;rough=.055+sac*.045;break;}
  case 64:{const c=voronoi(x*10,y*9),pustule=1-smooth(.08,.36,c.near),rim=1-smooth(.02,.08,Math.abs(c.near-.33));h=.34+pustule*.56-rim*.08;t=.1+pustule*.8;rough=.13+.24*rim;break;}
  case 65:{const c=voronoi(x*11,y*11),rot=1-smooth(.02,.14,c.gap),mould=hash(Math.floor(x*57),Math.floor(y*57))>.7?1:0;h=.56-rot*.4+mould*.12;t=.12+mould*.49+(1-rot)*.22;rough=.86+mould*.13;break;}
  case 66:{const c=voronoi(x*9,y*9),hole=1-smooth(.1,.22,c.near),lip=1-smooth(.045,.1,Math.abs(c.near-.25));h=.53-hole*.42+lip*.18;t=.47-hole*.45+lip*.42;rough=.22+hole*.52;break;}
  case 67:{const strand=.5+.5*Math.sin(x*95+Math.sin(y*13)*5),cleft=Math.pow(1-strand,8);h=.3+strand*.43-cleft*.15;t=.15+strand*.68;rough=.13+cleft*.35;break;}
  case 68:{const c=voronoi(x*6,y*6),mouth=1-smooth(.06,.26,c.near),rim=1-smooth(.02,.07,Math.abs(c.near-.28)),tooth=hash(Math.floor(x*49),Math.floor(y*49))>.76?rim:0;h=.51-mouth*.47+rim*.26;t=.3-mouth*.28+tooth*.67;rough=.16+mouth*.64;break;}
  case 69:{const wire=Math.max(line(x,12,.028),line(y,12,.025)),junction=1-smooth(.025,.065,Math.hypot(fract(x*6)-.5,fract(y*6)-.5));h=.49+wire*.17+junction*.2;t=.12+wire*.68+junction*.17;glow=wire*.8+junction;rough=.22-wire*.1;break;}
  case 70:{const u=fract(x*4),v=fract(y*5),edge=Math.min(u,1-u,v,1-v),seam=1-smooth(.025,.07,edge),bolt=1-smooth(.028,.07,Math.hypot(u-.14,v-.14));h=.68-seam*.45+bolt*.25;t=.56-seam*.5+bolt*.4;rough=.32+seam*.42;break;}
  case 71:{const rib=triangle(x*13),groove=1-smooth(.07,.18,rib);h=.32+.57*rib;t=.17+.78*rib;rough=.09+groove*.3;break;}
  case 72:{const u=fract(x*18),v=fract(y*18),over=(Math.floor(x*18)+Math.floor(y*18))%2,thread=over?Math.sin(u*Math.PI):Math.sin(v*Math.PI);h=.44+thread*.14;t=.12+thread*.69;rough=.64+.12*(1-thread);break;}
  case 73:{const stripe=fract((x+y)*7)<.5?1:0,u=fract(x*3),v=fract(y*3),edge=Math.min(u,1-u,v,1-v),seam=1-smooth(.025,.07,edge);h=.58-seam*.34;t=.07+stripe*.74-seam*.07;rough=.41+seam*.32;break;}
  case 74:{const cell=voronoi(x*7,y*7),seam=1-smooth(.02,.07,cell.gap),core=1-smooth(.04,.16,cell.near);h=.52-seam*.12;t=.23+seam*.53+core*.23;glow=seam*.7+core;rough=.04+seam*.07;break;}

  case 57:{const cloud=.5+.5*Math.sin(x*12+Math.sin(y*9)*2)*Math.cos(y*11);h=.48+cloud*.07;t=.48+cloud*.4;rough=.045+cloud*.025;break;}
  case 58:{const c=voronoi(x*9,y*9),bubble=1-smooth(.1,.24,c.near);h=.49+bubble*.13;t=.7+bubble*.28;rough=.025+bubble*.035;break;}
  case 59:{const c=voronoi(x*8,y*8),facet=Math.floor(c.near*7)/7,crack=1-smooth(.012,.06,c.gap);h=.35+facet*.65-crack*.12;t=.3+facet*.65;rough=.035+crack*.16;break;}
  case 60:{const fold=Math.sin(x*31+Math.sin(y*23)*2)*Math.cos(y*27),ribs=triangle((x+y*.4)*38);h=.5+fold*.27+ribs*.06;t=.1+.8*(.5+.5*fold);rough=.12+ribs*.13;break;}
  case 61:{const fleck=hash(Math.floor(x*83),Math.floor(y*83))>.91?1:0;h=.49+fleck*.035;t=.58+fleck*.4;rough=.075-fleck*.045;break;}
  case 62:{const c=voronoi(x*6,y*6),seam=1-smooth(.025,.1,c.gap),star=hash(Math.floor(x*93),Math.floor(y*93))>.989?1:0;h=.65-seam*.43;t=.06+seam*.73+star*.2;glow=seam*.55+star*.4;rough=.32-seam*.2;break;}

  case 56:{const ix=Math.floor(x*16),iy=Math.floor(y*16),pixel=Math.floor(hash(ix,iy)*4)/3;h=.35+.3*pixel;t=.1+.8*pixel;rough=.5+.15*(1-pixel);break;}
  case 32:{const u=fract(x*3),v=fract(y*3),edge=Math.min(u,1-u,v,1-v),seam=1-smooth(.025,.065,edge),rivet=Math.hypot(u-.5,v-.5),dot=(1-smooth(.035,.075,rivet))*((Math.floor(x*3)+Math.floor(y*3))%2===0?1:.35);h=.69-.34*seam+.28*dot;t=.69-.49*seam+.18*dot;rough=.3+.45*seam;break;}
  case 33:{const d=Math.abs(fract((x+y)*6)-.5),a=Math.abs(fract((x-y)*6)-.5),ridge=Math.max(1-smooth(.045,.12,d),1-smooth(.045,.12,a)),trough=smooth(.16,.34,Math.min(d,a));h=.25+.64*ridge-.1*trough;t=.09+.82*ridge-.08*trough;rough=.99-.16*ridge;break;}
  case 34:{const u=fract(x*7),v=fract(y*7),cx=Math.floor(x*7)+(Math.floor(y*7)%2)*.5+.5,cy=Math.floor(y*7)+.5,r=Math.hypot((x*7-cx)*.72,y*7-cy),ring=1-smooth(.055,.13,Math.abs(r-.31)),hole=1-smooth(.16,.25,r);h=.42+.39*ring-.15*hole;t=.3+.58*ring;rough=.58-.23*ring;void u;void v;break;}
  case 35:{const chevron=triangle((x+y*.48)*9),ridge=1-smooth(.18,.31,Math.abs(chevron-.5));h=.31+.51*ridge;t=.18+.67*ridge;rough=.97-.11*ridge;break;}
  case 36:{const twill=triangle((x+y)*26),cross=triangle((x-y*.12)*5);h=.46+.09*twill+.025*cross;t=.25+.56*twill;rough=.82+g*.12;break;}
  case 37:{const u=fract(x*8),v=fract(y*8),hex=Math.max(Math.abs(u-.5)*.866+Math.abs(v-.5)*.5,Math.abs(v-.5)),ridge=1-smooth(.31,.43,hex);h=.28+.62*ridge;t=.14+.73*ridge;rough=.9-.17*ridge;break;}
  case 38:{const c=voronoi(x*14,y*13),pile=1-smooth(.1,.54,c.near),valley=smooth(.06,.22,c.gap),fiber=Math.sin(x*83+Math.sin(y*41)*1.7)*Math.sin(y*77+Math.sin(x*37))*0.5+0.5;h=.2+.53*pile-.14*valley+.025*fiber;t=.1+.78*pile-.1*valley+.035*fiber;rough=.99;break;}
  case 39:{const u=fract(x*4),v=fract(y*4),diamond=Math.abs(u-.5)+Math.abs(v-.5),seam=smooth(.39,.48,diamond),pad=1-smooth(.08,.43,diamond);h=.28+.62*pad-.21*seam;t=.14+.72*pad-.1*seam;rough=.93-.08*pad;break;}
  case 40:{const d=voronoi(x*19,y*17),dimple=1-smooth(.06,.24,d.near),nap=smooth(.16,.39,d.near),fiber=Math.sin(x*91+Math.sin(y*48))*Math.sin(y*79+Math.sin(x*43));h=.46+.035*g-.14*dimple+.06*nap+.012*fiber;t=.54+.04*g-.27*dimple+.13*nap+.025*fiber;rough=.97-.025*nap;break;}
  case 41:{const c=voronoi(x*11,y*11),pit=1-smooth(.03,.22,c.near),lip=1-smooth(.04,.2,c.gap);h=.55-.29*pit+.15*lip;t=.45-.31*pit+.18*lip;rough=.47-.16*lip+.28*pit;break;}
  case 42:{const strand=triangle((x*8+y*1.7)*5),twist=triangle((x*8-y*1.7)*2);h=.27+.47*strand+.13*twist;t=.16+.74*strand;rough=.91-.08*strand;break;}
  case 43:{const c=voronoi(x*15,y*15),crease=1-smooth(.025,.11,c.gap),grain=Math.sin(x*81+Math.sin(y*43))*Math.sin(y*75);h=.5-.16*crease+grain*.045;t=.38+.16*grain-.22*crease;rough=.72+.19*crease;break;}
  case 44:{const c=voronoi(x*12,y*12),cell=smooth(.06,.37,c.near),chip=(hash(Math.floor(x*12),Math.floor(y*12))>.74?1:0)*cell;h=.34+.4*cell-.24*chip;t=.19+.62*cell-.18*chip;rough=.97;break;}
  case 45:{const a=line(x+y*.12,12,.34),b=line(y-x*.08,12,.34),over=fract(x*12+y*12)<.5?a:b;h=.36+.27*a+.22*b+.12*over;t=.18+.37*a+.42*b;rough=.92-.12*over;break;}
  case 46:{const u=fract(x*5)-.5,v=fract(y*5)-.5,angle=Math.atan2(v,u),r=Math.hypot(u,v),lobe=(1-smooth(.28,.49,r))*(.65+.35*Math.cos(angle*6)),vein=1-smooth(.012,.035,Math.abs(v-Math.sin(u*6)*.035));h=.33+.31*lobe+.12*vein;t=.19+.48*lobe+.22*vein;rough=.6-.17*lobe;break;}
  case 47:{const vertical=line(x,22,.31),horizontal=line(y,22,.31),crossing=vertical*horizontal;h=.41+.12*vertical+.12*horizontal+.13*crossing;t=.26+.27*vertical+.27*horizontal;rough=.95-.08*crossing;break;}
  case 48:{const rib=triangle(x*8),node=1-smooth(.015,.07,Math.abs(fract(y*2)-.5));h=.27+.53*(1-smooth(.28,.48,rib))+.14*node;t=.17+.67*(1-smooth(.3,.47,rib))+.12*node;rough=.68-.15*node;break;}
  case 49:{const u=fract(x*6+(Math.floor(y*7)%2)*.5),v=fract(y*7),scale=Math.hypot((u-.5)*.86,v-.5),rim=1-smooth(.36,.48,scale),seam=1-smooth(.025,.09,Math.abs(v-.5));h=.28+.46*rim-.08*seam;t=.12+.74*rim-.12*seam;rough=.52-.24*rim;break;}
  case 50:{const u=fract(x*14),v=fract(y*14),bar=Math.min(u,1-u,v,1-v),wire=1-smooth(.035,.105,bar),hole=1-wire;h=.26+.56*wire;t=.08+.76*wire;rough=.58-.2*wire;break;}
  case 51:{const u=fract(x*18),v=fract(y*18),stagger=(Math.floor(y*18)%2)*.5,cx=fract(x*18+stagger)-.5,cy=v-.5,r=Math.hypot(cx,cy),loop=1-smooth(.035,.105,Math.abs(r-.27)),center=1-smooth(.01,.08,r);h=.44+.2*loop+.06*center;t=.34+.28*loop;rough=.99;break;}
  case 52:{const c=voronoi(x*7,y*7),stone=1-smooth(.2,.52,c.near),edge=1-smooth(.035,.1,c.gap);h=.26+.49*stone-.1*edge;t=.1+.76*stone-.14*edge;rough=.87-.2*stone;break;}
  case 53:{const q=y*7+Math.sin(x*17+y*4)*.35+Math.sin(x*6-y*13)*.16,ridge=1-smooth(.16,.34,Math.abs(fract(q)-.5));h=.39+.31*ridge+.025*g;t=.3+.38*ridge;rough=.99;break;}
  case 54:{const c=voronoi(x*4,y*4),stone=1-smooth(.31,.75,c.near),seam=1-smooth(.045,.13,c.gap);h=.31+.43*stone-.16*seam;t=.15+.67*stone-.19*seam;rough=.79-.14*stone+.1*seam;break;}
  case 55:{const c=voronoi(x*31,y*31),tuft=1-smooth(.08,.38,c.near),spore=hash(Math.floor(x*31),Math.floor(y*31))>.84?1:0;h=.37+.2*tuft+.07*spore;t=.2+.61*tuft+.12*spore;rough=.99;break;}
 }
 return{height:h,tint:clamp(t),glow,rough};
}
