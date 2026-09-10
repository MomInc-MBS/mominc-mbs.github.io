export const DAY_MS=86400000;
export const BREATHING_MS=180000;
export const dayAt=now=>Math.floor(now/DAY_MS);
export function loginStreak(days,today){const completed=new Set(days.map(Number));let streak=0;while(completed.has(today-streak))streak++;return streak;}
export function weaponDamage(combat,weapon,now=Date.now()){
 const current=combat?.day===dayAt(now)&&Number.isSafeInteger(combat.loginStreak)&&combat.loginStreak>=1;
 const level=Number.isInteger(weapon?.tier)&&weapon.tier>=0&&weapon.tier<=20?weapon.tier+1:1;
 return 10*(current?combat.loginStreak:1)*level*(current&&combat.breathingCompleted===true?100:1);
}
export class BreathingSession{
 constructor(){this.elapsed=0;this.last=null;this.active=false;}
 sample(now,active){if(this.last!==null&&this.active&&active)this.elapsed=Math.min(BREATHING_MS,this.elapsed+Math.max(0,Math.min(1500,now-this.last)));this.last=now;this.active=active;return this.elapsed;}
 get complete(){return this.elapsed>=BREATHING_MS;}
}
