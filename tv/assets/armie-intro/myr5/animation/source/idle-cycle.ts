export const IDLE_INTERVAL=8000;
// Pausing a tour never skips animations or interrupts a live coaching response.
export class IdleCycle<T extends string> {
 index=0;due=0;
 constructor(public gestures:readonly T[]){}
 next(now:number,eligible:boolean):T|null{
  if(!eligible){this.due=now+IDLE_INTERVAL;return null;}
  if(!this.due){this.due=now+IDLE_INTERVAL;return null;}
  if(now<this.due||!this.gestures.length)return null;
  const id=this.gestures[this.index++%this.gestures.length];this.due=now+IDLE_INTERVAL;return id;
 }
}
