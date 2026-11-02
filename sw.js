
const CACHE='elder-clock-5';

const FILES=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.png'
];

// 安裝並儲存離線檔案
self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(FILES))
      .then(()=>self.skipWaiting())
  );
});

// 啟用新版快取，刪除舊版
self.addEventListener('activate',event=>{
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys=>Promise.all(
        keys
          .filter(key=>
            key.startsWith('elder-clock-') &&
            key!==CACHE
          )
          .map(key=>caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
});

// 優先取得新版，離線時使用快取
self.addEventListener('fetch',event=>{
  if(
    event.request.method!=='GET' ||
    new URL(event.request.url).origin!==self.location.origin
  )return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          if(response.ok){
            const copy=response.clone();

            event.waitUntil(
              caches.open(CACHE)
                .then(c=>c.put(event.request,copy))
            );
          }

          return response;
        })
        .catch(()=>
          caches.match(event.request)
            .then(r=>r||caches.match('./index.html'))
        )
    );
  }else{
    event.respondWith(
      caches.match(event.request)
        .then(r=>r||fetch(event.request))
    );
  }
});
