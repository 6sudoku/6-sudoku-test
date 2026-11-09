/* 6 Sudoku TEST v0.12.5: cache esclusiva e Service Worker limitato alla sottocartella. */
const CACHE='6-sudoku-test-v0126-1';
const FILES=['./','./index.html','./manifest.webmanifest','./css/style.css','./js/sudoku.js','./js/languages.js','./js/app.js','./js/supabase-config.js','./js/supabase-profile.js','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
 // Nessuno skipWaiting automatico: si attiva solo dopo conferma.
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('6-sudoku-test-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return}
 if(event.request.mode==='navigate'){
  event.respondWith(caches.match('./index.html').then(cached=>cached||fetch(event.request)));
  return;
 }
 event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(hit=>hit||fetch(event.request)));
});
