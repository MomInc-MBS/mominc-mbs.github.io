export const WIDTH=320,HEIGHT=420,TARGET=8;
export class TubFlight {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.phase='ready';this.y=210;this.velocity=0;this.pipes=[];this.score=0;this.elapsed=0;this.spawnIn=0;this.powder=0;this.lastDose=null;return this;}
 flap(){if(this.phase==='complete'||this.phase==='crashed')return false;if(this.phase==='ready'){this.phase='running';this.spawnIn=.8;}this.velocity=-245;return true;}
 spawn(){this.pipes.push({x:WIDTH+26,gap:122+this.random()*145,passed:false});}
 step(seconds){if(this.phase!=='running')return;let left=Math.min(.1,Math.max(0,seconds));while(left>0&&this.phase==='running'){const dt=Math.min(left,1/120);left-=dt;this.elapsed+=dt;this.velocity+=690*dt;this.y+=this.velocity*dt;this.spawnIn-=dt;if(this.spawnIn<=0){this.spawn();this.spawnIn=1.9;}
   if(this.y<20||this.y>HEIGHT-36){this.phase='crashed';break;}
   for(const pipe of this.pipes){pipe.x-=108*dt;const overlaps=82+13>pipe.x&&82-13<pipe.x+44;if(overlaps&&(this.y-13<pipe.gap-75||this.y+13>pipe.gap+75)){this.phase='crashed';break;}if(!pipe.passed&&pipe.x+44<82-13){pipe.passed=true;this.score++;this.powder=this.score;this.lastDose={x:pipe.x+22,y:pipe.gap-75,at:this.elapsed};if(this.score===TARGET){this.phase='complete';break;}}}
   this.pipes=this.pipes.filter(pipe=>pipe.x>-60);
  }
 }
}
