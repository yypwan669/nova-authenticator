const CACHE='nova-auth-shell-v4';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg','./vendor/jsQR.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nova-auth-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const response=await fetch(e.request);
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put('./index.html',response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        return (await caches.open(CACHE)).match('./index.html');
      }
    })());
  }else{
    e.respondWith(caches.open(CACHE).then(cache=>cache.match(e.request)).then(hit=>hit||fetch(e.request)));
  }
});
