const CACHE_NAME = 'bogan-hustler-v1';
const urlsToCache = [
  '.',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
  './themesong.mp3',
  './siren.mp3',
  './Dust of the Damned.mp3',
  './Grave of the Outcast.mp3',
  './Hustler%27s Last Run.mp3',
  './Junkie%27s Jig.mp3',
  './Phantom Love.mp3',
  './Shadows in the Scrub.mp3',
  './Wraith of the Wastes.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            const responseToCache = response.clone();
            
            if (response.headers.get('content-type')?.includes('audio')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 