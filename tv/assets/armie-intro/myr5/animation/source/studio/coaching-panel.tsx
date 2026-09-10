'use client';
import {useState} from 'react';
import {COACHES,SITUATIONS,getCoach,type CoachId,type Situation} from './coaching';
export function CoachingPanel({value,onChange}:{value:CoachId;onChange:(id:CoachId)=>void}){
 const [situation,setSituation]=useState<Situation>('start');const coach=getCoach(value);
 return <section className="coach-panel" aria-label="Coaching personality"><div className="panel-kicker">PERSONALITY</div><label htmlFor="coach-style">Coaching style</label><select id="coach-style" value={value} onChange={e=>onChange(e.target.value as CoachId)}>{COACHES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><p className="coach-tone">{coach.tone}</p><label htmlFor="coach-situation">Preview a situation</label><select id="coach-situation" value={situation} onChange={e=>setSituation(e.target.value as Situation)}>{SITUATIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><blockquote aria-live="polite"><small>MYR5 · {coach.name}</small>{coach.lines[situation]}</blockquote><p className="coach-note">Sample dialogue. Saved with this character’s recipe.</p></section>;
}
