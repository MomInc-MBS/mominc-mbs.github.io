import {beginQuestion,normalize,ANSWER_TIME_MS} from './engine.js';
export const PREVIEW_MS=3000;
export function openTransmission(state,question,now=Date.now()){
 return {...beginQuestion(state,question,now+PREVIEW_MS),previewUntil:now+PREVIEW_MS,namingAutoSubmitted:false,draft:''};
}
export function namingClock(state,now=Date.now()){
 if(Number.isFinite(state.previewUntil)&&now<state.previewUntil)return {phase:'preview',seconds:Math.ceil((state.previewUntil-now)/1000),fraction:1};
 const remaining=Math.max(0,(state.deadline??now)-now);
 return {phase:remaining?'answer':'expired',seconds:Math.ceil(remaining/1000),fraction:Math.min(1,remaining/ANSWER_TIME_MS)};
}
function edits(a,b,max){
 if(Math.abs(a.length-b.length)>max)return max+1;
 let old=Array.from({length:b.length+1},(_,i)=>i),previous=null;
 for(let i=1;i<=a.length;i++){
  const row=[i];
  for(let j=1;j<=b.length;j++){
   row[j]=Math.min(old[j]+1,row[j-1]+1,old[j-1]+(a[i-1]===b[j-1]?0:1));
   if(previous&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],previous[j-2]+1);
  }
  previous=old;old=row;
 }
 return old[b.length];
}
export function suggestCorrection(value,question,subjects){
 const input=normalize(value);if(input.length<5)return null;
 const limit=input.length>=9?2:1,allowed=new Set(question.answers.map(a=>a.id));
 let best=limit+1,found=[];
 for(const subject of subjects){
  if(!allowed.has(subject.id))continue;
  const distance=Math.min(...[subject.name,...subject.aliases].map(a=>edits(input,normalize(a),limit)));
  if(distance<best){best=distance;found=[subject];}else if(distance===best)found.push(subject);
 }
 return best<=limit&&found.length===1?found[0]:null;
}
