/* 6 Sudoku TEST v0.12.9.5.6 — aggiornamento sicuro e cache offline. */
const APP_VERSION='0.12.9.5.6';
const CACHE='6-sudoku-test-v0129-5-6';
const FILES=['./','./index.html','./manifest.webmanifest','./css/style.css','./js/sudoku.js','./js/languages.js','./js/app.js','./js/supabase-config.js','./js/supabase-profile.js','./js/push.js','./js/daily-reminder.js','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png'];
const SCOPE=new URL(self.registration.scope);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(FILES);
  // Evita che un vecchio worker attivo impedisca l'aggiornamento dell'app.
  await self.skipWaiting();
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
 if(event.data?.type==='GET_VERSION')event.ports?.[0]?.postMessage({version:APP_VERSION});
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('6-sudoku-test-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 if(url.pathname.endsWith('/version.json')){
  event.respondWith(fetch(event.request,{cache:'no-store'}));return;
 }
 // Il browser cerca la rete prima della cache, in modo da non riproporre all'infinito una vecchia index.html.
 // In assenza di rete resta disponibile la copia offline.
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(event.request,{cache:'no-store'});
   if(response.ok&&response.type==='basic')await cache.put(event.request,response.clone());
   return response;
  }catch(err){
   const cached=await cache.match(event.request,{ignoreSearch:true});
   if(cached)return cached;
   if(event.request.mode==='navigate'){
    const offline=await cache.match('./index.html');if(offline)return offline;
   }
   throw err;
  }
 })());
});

// Manteniamo invariati i gestori push funzionanti nella versione precedente.
self.addEventListener('push',event=>{
 let payload={};
 try{payload=event.data?.json()||{}}catch(_){payload={title:'6 Sudoku',body:event.data?.text()||''}}
 const title=String(payload.title||'6 Sudoku').slice(0,90);
 const options={body:String(payload.body||'').slice(0,240),icon:'./assets/icon-192.png',badge:'./assets/icon-192.png',tag:String(payload.tag||'6sudoku-test').slice(0,64),data:{url:new URL(String(payload.tag||'').startsWith('6sudoku-1vs1-')?'./?vs1=result':'./',self.registration.scope).href}};
 event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=event.notification.data?.url||new URL('./',self.registration.scope).href;
 event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const found=clients.find(c=>c.url.startsWith(self.registration.scope));if(found){
   // iOS PWA: invia il comando anche alla finestra già aperta, senza affidarsi solo alla navigazione.
   if(target.includes('vs1=result'))found.postMessage({type:'VS1_OPEN_RESULT'});
   await found.focus();
   if(target.includes('vs1=result')&&'navigate' in found){try{await found.navigate(target)}catch(_){found.postMessage({type:'VS1_OPEN_RESULT'})}}
   return;
  }await self.clients.openWindow(target);})());
});
