// Question rotation is independent of flight/score storage, so restarting a run
// does not send the player through the same handful of opening transmissions.
export const DECK_KEY='mom-misinformation-question-deck-v2';
export function createQuestionDeck(ids, storage, seed=[]) {
 const valid=new Set(ids),limit=Math.min(512,valid.size);
 let recent=[],available=true;
 try{if(storage===undefined)storage=globalThis.localStorage;if(!storage)throw Error('No storage');}
 catch{available=false;}
 const clean=values=>Array.isArray(values)?values.filter(id=>typeof id==='string'&&valid.has(id)):[];
 function merge(values){
  const combined=[...recent,...clean(values)],seen=new Set(),latest=[];
  for(let i=combined.length-1;i>=0&&latest.length<limit;i--)if(!seen.has(combined[i])){seen.add(combined[i]);latest.push(combined[i]);}
  recent=latest.reverse();
 }
 function refresh(){if(available)try{
  const raw=storage.getItem(DECK_KEY);
  if(raw){const saved=JSON.parse(raw);if(saved.version===2&&Array.isArray(saved.recent))merge(saved.recent);}
 }catch{available=false;}}
 refresh();
 // Seed only an empty store from an existing version-one saved flight.
 if(!recent.length)merge(seed);
 return {
  recent(){refresh();return [...recent];},
  remember(id){
   if(!valid.has(id))return;
   refresh();merge([id]);
   if(available)try{storage.setItem(DECK_KEY,JSON.stringify({version:2,recent}));}catch{available=false;}
  },
  get available(){return available;}
 };
}
