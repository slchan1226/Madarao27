const CACHE_NAME = 'madarao-pwa-2027-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (e) => {
       e.waitUntil(caches.open('madarao-v2').then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png'])));
       self.skipWaiting();
     });
     self.addEventListener('fetch', (e) => {
       if (e.request.method !== 'GET') return;
       e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
     });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetched = fetch(event.request)
          .then((res) => {
            if (res && (res.status === 200 || res.type === 'opaque')) {
              cache.put(event.request, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    )
  );
});