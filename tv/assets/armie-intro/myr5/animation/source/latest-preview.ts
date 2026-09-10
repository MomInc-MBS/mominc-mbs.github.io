// Keep at most one assembly in flight; while it runs, retain only the latest edit.
export class LatestPreview<T>{
 private revision=0;private running=false;private pending:{value:T;revision:number}|null=null;private stopped=false;
 constructor(private apply:(value:T)=>Promise<unknown>,private settled:(value:T,error?:unknown)=>void){}
 request(value:T){if(this.stopped)return;this.pending={value,revision:++this.revision};void this.drain();}
 private async drain(){if(this.running||this.stopped)return;this.running=true;
  while(this.pending&&!this.stopped){const job=this.pending;this.pending=null;let error:unknown;try{await this.apply(job.value);}catch(e){error=e;}
   if(!this.stopped&&job.revision===this.revision)this.settled(job.value,error);
   // Yield between assemblies so a rapid drag can replace the pending request.
   if(this.pending)await new Promise<void>(resolve=>setTimeout(resolve,16));
  }this.running=false;
 }
 dispose(){this.stopped=true;this.pending=null;this.revision++;}
}
