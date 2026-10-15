import {DurableObject} from 'cloudflare:workers';
import handler from './handler.mjs';
import {consumeBudget} from './budget.mjs';

export class InferenceBudget extends DurableObject {
 constructor(ctx, env) {
  super(ctx, env);
  this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS budget (id INTEGER PRIMARY KEY, day INTEGER, minute INTEGER, dayCount INTEGER, minuteCount INTEGER)');
 }
 take() {
  // One synchronous transaction per admission: no network I/O or awaited work
  // can interleave the read/write. A single aggregate spending counter is the
  // coordination atom; cached and catalog requests do not enter this object.
  const row = this.ctx.storage.sql.exec('SELECT day,minute,dayCount,minuteCount FROM budget WHERE id=1').toArray()[0];
  const result = consumeBudget(row, Date.now(), Number(this.env.GLOBAL_PER_MINUTE), Number(this.env.GLOBAL_PER_DAY));
  if(result.allowed) {
   const c = result.current;
   this.ctx.storage.sql.exec('INSERT OR REPLACE INTO budget (id,day,minute,dayCount,minuteCount) VALUES (1,?,?,?,?)', c.day,c.minute,c.dayCount,c.minuteCount);
  }
  return {allowed:result.allowed,retryAfter:result.retryAfter};
 }
}
export default handler;
