// Only unlisted answers leave the browser. No flight history or score is sent.
export const JUDGE_URL='https://mom-misinformation-judge.mominc-coach.workers.dev/judge';
export const JUDGE_TIMEOUT_MS=18000;
const fields={id:150,name:160,statement:900,explanation:1600,source:600,publisher:180,category:120};
export function cleanJudgment(value,questionId){
 if(!value||value.accepted!==true)return null;
 const raw=value.subject;
 if(!raw||!Number.isInteger(value.tier)||value.tier<0||value.tier>5)return null;
 const subject={};
 for(const [key,max]of Object.entries(fields)){
  if(typeof raw[key]!=='string'||!raw[key].trim()||raw[key].length>max)return null;
  subject[key]=raw[key].trim();
 }
 try{const url=new URL(subject.source);if(url.protocol!=='https:'||url.username||url.password)return null;}catch{return null;}
 if(!['event','claim'].includes(raw.classification))return null;
 subject.classification=raw.classification;
 subject.aliases=Array.isArray(raw.aliases)?raw.aliases.filter(x=>typeof x==='string'&&x.length<=160).slice(0,12):[];
 subject.topics=Array.isArray(raw.topics)?raw.topics.filter(x=>typeof x==='string'&&x.length<=60).slice(0,30):[];
 return {questionId,subject,tier:value.tier};
}
export function cleanSavedJudgments(value,questionIds){
 if(!Array.isArray(value))return [];
 return value.slice(-100).flatMap(entry=>{
  if(!entry||!questionIds.has(entry.questionId))return [];
  const clean=cleanJudgment({accepted:true,subject:entry.subject,tier:entry.tier},entry.questionId);
  return clean?[clean]:[];
 });
}
export function questionWithJudgments(question,verified=[]){
 if(!question)return question;
 const answers=[...question.answers];
 for(const entry of verified){if(entry.questionId===question.id&&!answers.some(a=>a.id===entry.subject.id))answers.push({id:entry.subject.id,tier:entry.tier});}
 return {...question,answers};
}
export async function judgeAnswer(answer,questionId,{signal,fetcher=fetch}={}){
 const controller=new AbortController();
 const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(abort,JUDGE_TIMEOUT_MS);
 try{
  const response=await fetcher(JUDGE_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answer,questionId}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw new Error(response.status===429?'The answer desk is busy. Try a different answer or retry shortly.':'The hosted answer desk is unavailable. Your answer time is preserved.');
  const result=await response.json(),clean=cleanJudgment(result,questionId);
  if(result.accepted&&!clean)throw new Error('The answer desk returned an incomplete evidence card. Try another answer.');
  return {entry:clean,reason:typeof result.reason==='string'?result.reason.slice(0,300):'Could not establish a clear match to this prompt. Try a more specific name.'};
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
