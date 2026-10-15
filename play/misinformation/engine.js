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
  let unseen=pool.filter(q=>!state.seen.includes(q.id));
  let recycled=false;
  if(!unseen.length) { unseen=pool; recycled=true; }
  return {question:unseen[Math.min(unseen.length-1,Math.floor(random()*unseen.length))],recycled};
}
