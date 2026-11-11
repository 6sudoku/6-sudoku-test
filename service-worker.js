/* 6 Sudoku TEST v0.12.8.2: cache isolate e navigazione limitata alla sottocartella TEST. */
const CACHE='6-sudoku-test-v0128-2';
const FILES=['./','./index.html','./manifest.webmanifest','./css/style.css','./js/sudoku.js','./js/languages.js','./js/app.js','./js/supabase-config.js','./js/supabase-profile.js','./js/push.js','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png'];
const SCOPE=new URL(self.registration.scope);
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
 // L'aggiornamento avviene dopo la conferma dell'utente nella PWA.
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('6-sudoku-test-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return}
 if(event.request.mode==='navigate'){
  event.respondWith(caches.match('./index.html').then(cached=>cached||fetch(event.request)));
  return;
 }
 event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(hit=>hit||fetch(event.request)));
});

// Manteniamo invariati i gestori push funzionanti nella versione precedente.
self.addEventListener('push',event=>{
 let payload={};
 try{payload=event.data?.json()||{}}catch(_){payload={title:'6 Sudoku',body:event.data?.text()||''}}
 const title=String(payload.title||'6 Sudoku').slice(0,90);
 const options={body:String(payload.body||'').slice(0,240),icon:'./assets/icon-192.png',badge:'./assets/icon-192.png',tag:String(payload.tag||'6sudoku-test').slice(0,64),data:{url:new URL('./',self.registration.scope).href}};
 event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=new URL('./',self.registration.scope).href;
 event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const found=clients.find(c=>c.url.startsWith(target));if(found){await found.focus();return;}await self.clients.openWindow(target);})());
});
