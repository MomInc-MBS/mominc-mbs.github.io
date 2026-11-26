const SHELL='myr5-coach-shell-fcee35ea5b3e5409b3df';
const FILES=["/apps/coach/","/apps/coach/manifest.webmanifest","/apps/coach/launch-bootstrap.mjs","/apps/coach/launch-runtime.mjs","/apps/coach/app.css","/apps/coach/icons/coach-2d-192.png","/apps/coach/icons/mom-inc-mark-96.webp","/apps/coach/food-worker.mjs","/apps/coach/icons/coach-2d-512.png","/apps/coach/icons/coach-2d-apple.png","/apps/coach/icons/coach-2d-maskable.png","/apps/coach/nutrition-data.mjs","/apps/coach/privacy.html","/apps/coach/training-runtime.mjs"];
const CORE=["/apps/coach/","/apps/coach/manifest.webmanifest","/apps/coach/launch-bootstrap.mjs","/apps/coach/launch-runtime.mjs","/apps/coach/app.css","/apps/coach/icons/coach-2d-192.png","/apps/coach/icons/mom-inc-mark-96.webp"];
// Tier 1 (atomic): what the home screen needs to open. Tier 2 (best effort): everything else, so one slow file never fails the install.
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(async cache=>{await cache.addAll(FILES.filter(f=>CORE.includes(f)));await Promise.allSettled(FILES.filter(f=>!CORE.includes(f)).map(f=>cache.add(f)));})));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('myr5-coach-shell-')&&key!==SHELL)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('message',event=>{
 if(event.data?.type!=='PREPARE_UPDATE')return;
 event.waitUntil((async()=>{
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const approvals=await Promise.all(clients.map(client=>new Promise(resolve=>{
   const channel=new MessageChannel();
   const finish=ok=>{clearTimeout(timer);channel.port1.close();resolve(ok);};
   const timer=setTimeout(()=>finish(false),4000);
   channel.port1.onmessage=message=>finish(message.data?.safe===true);
   try{client.postMessage({type:'UPDATE_SAFETY_CHECK'},[channel.port2]);}catch{finish(false);}
  })));
  const activated=approvals.length>0&&approvals.every(Boolean);
  if(activated)await self.skipWaiting();
  event.ports[0]?.postMessage({activated});
 })());
});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.includes('with-chatgpt')||url.pathname==='/callback'||url.pathname.startsWith('/signin')||url.pathname==='/source.json')return;
 if(request.mode==='navigate'){event.respondWith((async()=>{try{return await fetch(request);}catch{return (await caches.match(request,{ignoreSearch:true}))||(await caches.match('/apps/coach/'));}})());return;}
 if(/\.(mjs|js|css|png|webmanifest)$/.test(url.pathname)){event.respondWith((async()=>{const cached=await caches.match(request,{ignoreSearch:true});if(cached)return cached;const response=await fetch(request);if(response.ok&&!response.redirected){const size=Number(response.headers.get('content-length'));if(size>0&&size<8*1024*1024)await(await caches.open(SHELL)).put(request,response.clone());}return response;})());}
});
self.addEventListener('push',event=>{let data={title:"MOM's: Coach MYR5",body:'You have a reminder.',url:'/apps/coach/'};try{data={...data,...event.data.json()};}catch{}event.waitUntil(self.registration.showNotification(String(data.title).slice(0,80),{body:String(data.body).slice(0,200),icon:'/apps/coach/icons/coach-2d-192.png',badge:'/apps/coach/icons/coach-2d-192.png',tag:data.tag||'myr5-reminder',data:{url:data.url,kind:data.kind},...(data.kind==='app-update'?{actions:[{action:'download',title:'Download update'}]}:{}),renotify:false}));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{let url;try{url=new URL(event.notification.data?.url||'/apps/coach/',self.location.origin);}catch{return;}if(url.origin!==self.location.origin)return;const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of all)if(new URL(client.url).origin===url.origin&&new URL(client.url).pathname.startsWith('/apps/coach/')){if(event.notification.data?.kind==='app-update'&&new URL(client.url).pathname==='/apps/coach/'){await client.focus();client.postMessage({type:'APP_UPDATE_AVAILABLE'});return;}await client.navigate(url.href);return client.focus();}return self.clients.openWindow(url.href);})());});
