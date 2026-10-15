export const POINTS = [10, 15, 30, 60, 85, 100];
export const TIERS = ['Office gossip', 'Suspiciously familiar', 'Loose thread', 'Deep file', 'Redacted', 'Motherlode'];
export const STATION = 100000;
export const APPROACH = 95000;
export const KM_PER_POINT = 50;
export const BANDS = ['Company grounds', 'Low orbit', 'The satellite belt', 'Lunar interference', 'The red channel', 'Outer-system files', 'Deep-space static', 'Station approach'];
export function freshRun() {
  return {version:1, score:0, distance:0, hits:0, rounds:0, pristine:true, phase:'ready', question:null, answer:null, deadline:null, remaining:25000, seen:[], history:[], cycle:0};
}
export function bandIndex(distance) { return Math.min(7, Math.floor(distance / 12500)); }
export function normalize(s) { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''); }
export function lookup(answer, question, subjects) {
  const n=normalize(answer);
  return subjects.find(s => question.answers.some(a=>a.id===s.id) && [s.name,...s.aliases].some(a=>normalize(a)===n));
}
export function beginQuestion(state, question, now=Date.now()) {
  if (!['ready','result'].includes(state.phase)) throw new Error('Cannot open a question in this phase.');
  return {...state,phase:'answer',question:question.id,answer:null,deadline:now+25000,remaining:25000,seen:[...state.seen,question.id]};
}
export function acceptAnswer(state, subject, question) {
  if(state.phase!=='answer') throw new Error('Naming is closed.');
  const entry=question.answers.find(a=>a.id===subject.id);
  if(!entry) throw new Error('Answer is outside this prompt.');
  return {...state,phase:'classify',answer:subject.id,pristine:state.pristine&&entry.tier===5,remaining:Math.max(0,state.deadline-Date.now()),deadline:null};
}
export function classify(state, subject, question, choice) {
  if(state.phase!=='classify' || state.answer!==subject.id) throw new Error('No answer to classify.');
  const tier=question.answers.find(a=>a.id===subject.id)?.tier;
  if(!Number.isInteger(tier) || tier<0 || tier>5) throw new Error('Invalid rarity.');
  const correct=subject.classification===choice;
  const earned=correct?POINTS[tier]:0;
  const pristine=state.pristine && tier===5;
  const hits=state.hits+(correct?0:1);
  const raw=state.distance+earned*KM_PER_POINT;
  const distance=Math.min(pristine?STATION:APPROACH,raw);
  const phase=hits>=3?'dead':distance>=STATION&&pristine?'escaped':'result';
  return {...state,score:state.score+earned,distance,hits,pristine,rounds:state.rounds+1,phase,deadline:null,
    history:[...state.history,{subject:subject.id,question:question.id,tier,earned,travelled:distance-state.distance,correct,choice}].slice(-100)};
}
export function skip(state) {
  if(state.phase!=='answer') throw new Error('Cannot skip this phase.');
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
