// Pure pieces of Pyramid Jump (no DOM): coach shape + colour mapping, meal markers and the
// platform generator. Lazy/optional: loaded only from the food pyramid on a photo day (see food/pyramid-scanner.mjs).
import {SHAPES,COLOURS,LEGACY} from './data.mjs';
export const W=360;
export const BEST_KEY='myr5-pyramid-jump-best-v1';

// The user's selected coach body -> its paper silhouette, filled with the body's own colour (colour only, no texture).
export function paperFor(recipe){
 const id=String(recipe?.body||'myr5').replace(/^roster\//,''),shape=SHAPES[id]||SHAPES.myr5;
 const choice=recipe?.materials?.body?.colorId,hex=/^#[0-9a-f]{6}$/i.test(choice)?choice:null;
 const colour=hex||COLOURS[choice]||LEGACY[recipe?.styles?.body]||LEGACY[0];
 return {id:SHAPES[id]?id:'myr5',d:shape.d,eye:shape.e,colour};
}
export function readRecipe(store=localStorage){try{const r=JSON.parse(store.getItem('myr5-recipe-v1'));return r&&typeof r==='object'?r:null;}catch{return null;}}
// Top of the silhouette (min y of the path) so the pocket peek can crop to head + eye.
export const topOf=d=>Math.min(...[...d.matchAll(/[ML](-?\d+),(-?\d+)/g)].map(m=>+m[2]));

// Logged meals, oldest first (the API returns newest first), one paper tag each. Guests / no meals -> [].
export function mealMarkers(items){
 if(!Array.isArray(items))return [];
 return items.filter(m=>m&&m.name&&!Number.isNaN(Date.parse(m.eaten_at)))
  .sort((a,b)=>Date.parse(a.eaten_at)-Date.parse(b.eaten_at))
  .map(m=>{const t=new Date(m.eaten_at);return {name:String(m.name).slice(0,22),date:t.toLocaleDateString(undefined,{month:'short',day:'numeric'}),t:t.getTime(),p:Math.round(m.protein)||0,c:Math.round(m.carbs)||0,f:Math.round(m.fat)||0};});
}
// Meal tags spread over the whole climb, oldest near the start of level 1 and today near the top of level 20.
export const LEVEL_H=1000,LEVEL_COUNT=20,END_Y=LEVEL_H*LEVEL_COUNT;
export const markerHeight=(i,n)=>n<2?600:500+i*((END_Y-1500)/(n-1));

// The 20-place journey (Ian, 15 Oct). sky = [bottom,top] colours; mon = the level's monster look; gate = how you leave it.
export const LEVELS=[
 {name:'The Office',gate:'CLIMB THE BOOKSHELF INTO THE VENT',sky:'#bba16e',mon:'dust'},
 {name:'Ceiling Vents',gate:'PUSH UP THE ROOF HATCH',sky:'#6f7480',mon:'dust'},
 {name:'Propaganda Stairwell',gate:'DOOR MARKED ROOF',sky:'#8a6aa0',mon:'dust'},
 {name:'Rooftop & Billboards',gate:'SPRING OFF THE ANTENNA TIP',sky:'#e0a070',mon:'pigeon'},
 {name:'Sky of Paper Clouds',gate:'GRAB A BALLOON STRING UP TO THE TETHER',sky:'#8fc4ea',mon:'pigeon'},
 {name:'Space Elevator',gate:'THE POD DOCKS AT THE TOP',sky:'#2a3f7a',mon:'alien'},
 {name:'Satellite Junkyard',gate:'SLIP THROUGH A TEAR',sky:'#0e1233',mon:'junk'},
 {name:'MOM Port 18',gate:'BOARD THE EXPRESS LIFT',sky:'#171a44',mon:'alien'},
 {name:'Moon Cafeteria Colony',gate:'THE FREEZER OPENS ONTO A FOLD',sky:'#4a4658',mon:'alien'},
 {name:'The Fold',gate:'FALL UP THROUGH THE CREASE',sky:'#d9c6e8',mon:'crane'},
 {name:'Origami Dimension',gate:'A CRANE CARRIES YOU UP',sky:'#e8a0b4',mon:'crane'},
 {name:'Asteroid Gym Belt',gate:'A RING PORTAL',sky:'#1a1030',mon:'junk'},
 {name:'Wormhole Highway',gate:'EXIT THE RING',sky:'#3a1a6a',mon:'alien'},
 {name:'Flatland',gate:'STEP OFF THE EDGE OF THE PLANE',sky:'#f4f4f4',mon:'tri'},
 {name:'Mirror Office',gate:'THE MIRROR PYRAMID’S TIP',sky:'#5aa89a',mon:'dust'},
 {name:'Quilt Dimension',gate:'PULL A LOOSE THREAD',sky:'#b86a8a',mon:'needle'},
 {name:'Data Cable',gate:'THE CABLE PLUGS INTO A PORT',sky:'#04202a',mon:'glitch'},
 {name:'Nebula Nursery',gate:'A NEWBORN STAR LAUNCHES YOU',sky:'#3a1a50',mon:'alien'},
 {name:'Edge of the Page',gate:'CLIMB OVER THE PAGE EDGE',sky:'#f0e6c8',mon:'junk'},
 {name:'MOM’s Mothership Desk',gate:'LAND ON HER DESK',sky:'#3a2a4e',mon:'alien'},
];
export const levelAt=h=>Math.max(0,Math.min(LEVEL_COUNT-1,Math.floor(h/LEVEL_H))); // 0-based
export function steeringForMotion({steerX,gx}={}){
 const sample=Number.isFinite(steerX)?steerX:gx;
 return Number.isFinite(sample)?Math.max(-1,Math.min(1,sample*2.2)):0;
}

export const mulberry=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export const PLAT_W=64,JUMP=760,GRAVITY=1600,MAX_JUMP=JUMP*JUMP/(2*GRAVITY); // 180 units
export const LEVEL_KEY='myr5-pyramid-jump-level-v1';
export const highestLevel=(store=localStorage)=>{try{const n=JSON.parse(store.getItem(LEVEL_KEY));return Number.isSafeInteger(n)&&n>=1?Math.min(n,LEVEL_COUNT):1;}catch{return 1;}};
export const saveLevel=(n,store=localStorage)=>{try{if(n>highestLevel(store))store.setItem(LEVEL_KEY,String(n));}catch{/* ignore */}};
/** Convert an actual upward transition (zero-based current level) to its 1-based quest milestone. */
export const newlyReachedQuestLevel=(previous,current)=>Number.isSafeInteger(previous)&&Number.isSafeInteger(current)
  &&current>previous&&current>=0&&current<LEVEL_COUNT?current+1:null;
// Rows climb for 20 levels then end in MOM's desk (end = its height). Rows are never further apart than ~150 (< MAX_JUMP) and
// every breaking/blinking row also carries a solid platform, so a safe route always exists. Difficulty ramps per level:
// wider gaps, more moving and breaking platforms, then monsters (from level 2) and black holes (from level 8); `plus` = New Game+.
export class Level{
 constructor(rng=mulberry(7),plus=0){this.rng=rng;this.plus=plus;this.items=[{x:W/2-PLAT_W/2,y:0,type:'static'}];this.top=0;this.end=null;}
 ensure(y){while(this.top<y&&this.end==null)this.row();}
 row(){
  const r=this.rng,h=this.top,L=levelAt(h),d=L/(LEVEL_COUNT-1),pl=Math.min(this.plus,3);
  const gap=(58+62*d+5*pl)*(0.75+0.25*r());
  if(h+gap>=END_Y-40){this.top=this.end=h+Math.min(140,Math.max(70,END_Y-h));this.items.push({x:0,y:this.end,type:'desk',w:W});return;}
  const y=this.top+=gap,x=r()*(W-PLAT_W),roll=r();let type='static';
  const pMove=.1+.25*d+.03*pl,pBreak=L>=2?.1+.2*d+.03*pl:0,pSpring=L===12?.2:.06;
  if(L>=1&&roll<pMove)type='moving';
  else if(roll<pMove+pBreak)type='breaking';
  else if(roll>1-pSpring)type='spring';
  const item={x,y,type};
  if(type==='moving'){item.dx=40+r()*60;item.phase=r()*6.28;}
  if(type==='static'){const k=r();if(L>=3&&k<.05)item.gear='propeller';else if(L>=5&&k>.97)item.gear='jetpack';else if((L===10||L===17)&&k>.4){item.blink=2.2+r();item.phase=r()*6;}}
  this.items.push(item);
  if(type==='breaking'||item.blink)this.items.push({x:(x+W/2)%(W-PLAT_W),y:y+gap*0.15,type:'static'});
  const far=()=>{let fx;do fx=r()*(W-60);while(Math.abs(fx-x)<110);return fx;};
  if(L>=1&&r()<.02+.06*d+.01*pl)this.items.push({x:far(),y:y+gap*0.5,type:'monster',dir:r()<0.5?-1:1});
  else if(L>=7&&r()<(L===16?.08:.02+.04*d))this.items.push({x:far(),y:y+gap*0.5,type:'hole'});
 }
}
