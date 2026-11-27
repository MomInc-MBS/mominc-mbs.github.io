export const WIDTH=320,HEIGHT=420,TARGET=8,TUB_X=82,POWDER_G=1400,MOUTH=-17;
export class TubFlight {
 constructor(random=Math.random,{target=TARGET,ramp=false}={}){this.random=random;this.target=target;this.ramp=ramp;this.reset();}
 // Endless ramp: +12% speed every 10 pipes, capped at 2.2x. Spawn spacing scales with it so gaps stay fair.
 speed(){return this.ramp?Math.min(2.2,1+.12*Math.floor(this.score/10)):1;}
 // Hallucination stage: one step per five pipes passed. Cosmetic only, never read by the physics.
 get stage(){return Math.floor(this.score/5);}
 reset(){this.phase='ready';this.y=210;this.velocity=0;this.pipes=[];this.score=0;this.elapsed=0;this.spawnIn=0;this.powder=0;this.scoops=[];this.pipeId=0;this.flaps=0;this.released=0;this.events=[];return this;}
 ev(e){if(this.events.length>=64)this.events.shift();this.events.push(e);}
 flap(){if(this.phase==='complete'||this.phase==='crashed')return false;if(this.phase==='ready'){this.phase='running';this.spawnIn=.8;}this.velocity=-245;this.flaps++;return true;}
 spawn(){this.pipes.push({x:WIDTH+26,gap:122+this.random()*145,passed:false,id:this.pipeId++,released:false});}
 // One scoop per pipe, dropped from the nozzle at the exact moment its centre crosses the tub's x. It never moves sideways.
 // Gravity > tub gravity and vy0 >= the tub's fall speed (flaps only lower it), so it always closes on the open mouth.
 release(pipe,rem){this.released++;this.scoops.push({id:pipe.id,x:TUB_X,y:pipe.gap-75,vy:Math.max(0,this.velocity),rem});pipe.released=true;this.ev({type:'release',id:pipe.id,x:TUB_X,y:pipe.gap-75});}
 fall(dt){const keep=[];for(const s of this.scoops){const d=s.rem??dt;s.rem=undefined;s.vy+=POWDER_G*d;s.y+=s.vy*d;if(s.y>=this.y+MOUTH){this.powder++;this.ev({type:'catch',id:s.id,x:s.x,y:this.y+MOUTH});}else keep.push(s);}this.scoops=keep;}
 step(seconds){if(this.phase!=='running')return;let left=Math.min(.1,Math.max(0,seconds));while(left>0&&this.phase==='running'){const dt=Math.min(left,1/120),k=this.speed();left-=dt;this.elapsed+=dt;this.velocity+=690*dt;this.y+=this.velocity*dt;this.spawnIn-=dt;if(this.spawnIn<=0){this.spawn();this.spawnIn=1.9/k;}
   if(this.y<20||this.y>HEIGHT-36){this.phase='crashed';break;}
   for(const pipe of this.pipes){const x0=pipe.x;pipe.x-=108*k*dt;if(!pipe.released&&x0+22>TUB_X&&pipe.x+22<=TUB_X)this.release(pipe,(1-(x0+22-TUB_X)/(x0-pipe.x))*dt);const overlaps=82+13>pipe.x&&82-13<pipe.x+44;if(overlaps&&(this.y-13<pipe.gap-75||this.y+13>pipe.gap+75)){this.phase='crashed';break;}if(!pipe.passed&&pipe.x+44<82-13){pipe.passed=true;this.score++;this.ev({type:'pass'});if(this.score===this.target){this.phase='complete';break;}}}
   this.pipes=this.pipes.filter(pipe=>pipe.x>-60);
   if(this.phase==='running')this.fall(dt); // a crash on this step wins over a catch
  }
 }
}
