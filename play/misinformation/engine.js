export const POINTS = [10, 15, 30, 60, 85, 100];
export const TIERS = ['Office gossip', 'Suspiciously familiar', 'Loose thread', 'Deep file', 'Redacted', 'Motherlode'];
export const STATION = 100000;
// Retained as a legacy route marker, no longer a practice-flight cap.
export const APPROACH = 95000;
// Legacy score-to-distance scale for old history; current travel is tier based.
export const KM_PER_POINT = 50;
export const ANSWER_TIME_MS = 35000;
export const PROGRESSION_VERSION = 2;
export const TRAVEL_BY_TIER = Object.freeze([5000,5500,6000,6500,7000,7500]);
export const LEVEL_DISTANCE = 5000;
const LEVEL_NAMES = [
  'Office','Ceiling Vents','Propaganda Stairwell','Rooftop and Billboards',
  'Sky of Paper Clouds','Space Elevator','Satellite Junkyard','MOM Port 18',
  'Moon Cafeteria Colony','The Fold','Origami','Asteroid Gym Belt',
  'Wormhole Highway','Flatland','Mirror Office','Quilt Dimension',
  'Data Cable','Nebula Nursery','Edge of the Page',"MOM's Mothership Desk"
];
const LEVEL_EFFECTS = {6:'paper-tears',9:'fold',10:'origami',12:'wormhole',13:'flatland',14:'mirror',15:'quilt',16:'data-cable',17:'nursery',18:'drawing-hand',19:'mothership'};
export const LEVELS = Object.freeze(LEVEL_NAMES.map((name,index)=>Object.freeze({
  id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),number:index+1,name,
  startDistance:index*LEVEL_DISTANCE,endDistance:(index+1)*LEVEL_DISTANCE,
  effect:LEVEL_EFFECTS[index]??'none'
})));
export const BANDS = ['Company grounds', 'Low orbit', 'The satellite belt', 'Lunar interference', 'The red channel', 'Outer-system files', 'Deep-space static', 'Station approach'];
export function freshRun() {
  return {version:1, progressionVersion:PROGRESSION_VERSION, score:0, distance:0, hits:0, rounds:0, pristine:true, phase:'ready', question:null, answer:null, deadline:null, remaining:ANSWER_TIME_MS, seen:[], history:[], cycle:0};
}
export function levelIndex(distance) { return Math.min(LEVELS.length-1,Math.floor(Math.max(0,Number.isFinite(distance)?distance:0)/LEVEL_DISTANCE)); }
export function travelForTier(tier) {
  if(!Number.isInteger(tier)||tier<0||tier>=TRAVEL_BY_TIER.length) throw new Error('Invalid rarity.');
  return TRAVEL_BY_TIER[tier];
}
export function migrateRun(state, now=Date.now()) {
  if(state.progressionVersion===PROGRESSION_VERSION)return state;
  const migrated={...state,progressionVersion:PROGRESSION_VERSION};
  // Preserve earned route position, hull, phase and score. Grant the requested
  // extra ten seconds once to a saved active 25-second naming deadline.
  if(state.phase==='answer'&&Number.isFinite(state.deadline)){
    migrated.deadline=Math.min(state.deadline+10000,now+ANSWER_TIME_MS);
    migrated.remaining=Math.max(0,migrated.deadline-now);
  }else{
    migrated.remaining=Math.min(ANSWER_TIME_MS,Math.max(0,(Number.isFinite(state.remaining)?state.remaining:25000)+10000));
  }
  return migrated;
}
export function bandIndex(distance) { return Math.min(7, Math.floor(distance / 12500)); }
export function normalize(s) { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''); }
// Catalog arrays are immutable during a run; imported hosted answers use a new array.
const answerIndexes=new WeakMap();
export function lookup(answer, question, subjects) {
  let index=answerIndexes.get(subjects);
  if(!index){
    index=new Map();
    for(const subject of subjects)for(const alias of [subject.name,...subject.aliases]){
      const key=normalize(alias);if(!index.has(key))index.set(key,[]);
      if(!index.get(key).includes(subject))index.get(key).push(subject);
    }
    answerIndexes.set(subjects,index);
  }
  return (index.get(normalize(answer))||[]).find(s=>question.answers.some(a=>a.id===s.id));
}
export function beginQuestion(state, question, now=Date.now()) {
  if (!['ready','result'].includes(state.phase)) throw new Error('Cannot open a question in this phase.');
  return {...migrateRun(state,now),phase:'answer',question:question.id,answer:null,deadline:now+ANSWER_TIME_MS,remaining:ANSWER_TIME_MS,seen:[...state.seen,question.id]};
}
export function acceptAnswer(state, subject, question) {
  if(state.phase!=='answer') throw new Error('Naming is closed.');
  state=migrateRun(state);
  const entry=question.answers.find(a=>a.id===subject.id);
  if(!entry) throw new Error('Answer is outside this prompt.');
  return {...state,phase:'classify',answer:subject.id,pristine:state.pristine&&entry.tier===5,remaining:Math.max(0,state.deadline-Date.now()),deadline:null};
}
export function classify(state, subject, question, choice) {
  if(state.phase!=='classify' || state.answer!==subject.id) throw new Error('No answer to classify.');
  state=migrateRun(state);
  const tier=question.answers.find(a=>a.id===subject.id)?.tier;
  if(!Number.isInteger(tier) || tier<0 || tier>5) throw new Error('Invalid rarity.');
  const correct=subject.classification===choice;
  const earned=correct?POINTS[tier]:0;
  const pristine=state.pristine && tier===5;
  const hits=state.hits+(correct?0:1);
  const distance=Math.min(STATION,state.distance+(correct?travelForTier(tier):0));
  const phase=hits>=3?'dead':distance>=STATION?'escaped':'result';
  return {...state,score:state.score+earned,distance,hits,pristine,rounds:state.rounds+1,phase,deadline:null,
    history:[...state.history,{subject:subject.id,question:question.id,tier,earned,travelled:distance-state.distance,correct,choice}].slice(-100)};
}
export function skip(state) {
  if(state.phase!=='answer') throw new Error('Cannot skip this phase.');
  state=migrateRun(state);
  return {...state,pristine:false,rounds:state.rounds+1,phase:'result',deadline:null,answer:null,
    history:[...state.history,{question:state.question,earned:0,correct:null,skipped:true}].slice(-100)};
}
export function selectQuestion(state, questions, random=Math.random) {
  const pool=questions.filter(q=>q.band<=bandIndex(state.distance));
  if(!pool.length) throw new Error('No unlocked questions available.');
  const deepest=Math.max(...pool.map(q=>q.band));
  const current=pool.filter(q=>q.band===deepest);
  const previous=pool.filter(q=>q.band===deepest-1);
  const focus=[...current,...previous];
  const seen=new Set(state.seen);
  // Browser-wide recent IDs can be supplied ephemerally by the app. Old saves
  // need only their existing history; neither format is mutated here.
  const recentIds=Array.isArray(state.recentQuestions)?state.recentQuestions:state.history.map(h=>h.question);
  const recent=new Set(recentIds.slice(-16));
  const byId=new Map(questions.map(q=>[q.id,q]));
  const family=q=>q.family??q.id;
  const answerPool=q=>q.poolId??q.id;
  const seenPools=new Set([...seen].map(id=>byId.get(id)).filter(Boolean).map(answerPool));
  const recentPoolIds=recentIds.map(id=>byId.get(id)).filter(Boolean).map(answerPool);
  const recentPools=new Set(recentIds.slice(-8).map(id=>byId.get(id)).filter(Boolean).map(answerPool));
  const recentFamilies=new Set(recentIds.slice(-2).map(id=>byId.get(id)).filter(Boolean).map(family));
  const varied=options=>{const alternative=options.filter(q=>!recentFamilies.has(family(q)));return alternative.length?alternative:options;};
  const pick=(options,recycled)=>({question:options[Math.min(options.length-1,Math.floor(random()*options.length))],recycled});
  const bands=[...new Set(pool.map(q=>q.band))].sort((a,b)=>b-a);
  const groups=bands.map(band=>pool.filter(q=>q.band===band));
  // Equivalent answer sets are one semantic pool, even when wording differs.
  // Within a cooldown pass, new pools precede cosmetic variants, retaining
  // depth priority among equivalent choices. Relax cooldowns only when needed
  // to consume remaining unlocked content in a finite catalog.
  const cooldowns=[q=>!recent.has(q.id)&&!recentPools.has(answerPool(q)),q=>!recent.has(q.id),()=>true];
  for(const allowed of cooldowns) {
    for(const requireNewPool of [true,false]) {
      for(const group of groups) {
        const unseen=group.filter(q=>!seen.has(q.id)&&allowed(q)&&(!requireNewPool||!seenPools.has(answerPool(q))));
        if(unseen.length) return pick(varied(unseen),false);
      }
    }
  }
  let replay=focus.filter(q=>!recent.has(q.id)&&!recentPools.has(answerPool(q)));
  if(!replay.length) {
    // Once every semantic pool is recent, prefer the least recent pool before
    // its least recent wording, rather than alternating cosmetic variants.
    const exactSafe=focus.filter(q=>!recent.has(q.id));
    replay=exactSafe.length?exactSafe:focus;
    const oldestPool=Math.min(...replay.map(q=>recentPoolIds.lastIndexOf(answerPool(q))));
    replay=replay.filter(q=>recentPoolIds.lastIndexOf(answerPool(q))===oldestPool);
    if(!exactSafe.length){
      const oldest=Math.min(...replay.map(q=>recentIds.lastIndexOf(q.id)));
      replay=replay.filter(q=>recentIds.lastIndexOf(q.id)===oldest);
    }
  }
  return pick(varied(replay),true);
}
