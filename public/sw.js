const CACHE_NAME = 'zefyrio-offline-cache-v1';

// Recursos críticos siempre disponibles sin internet
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/globals.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened offline cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Devuelve la copia del caché si existe
      if (response) {
        return response;
      }
      
      // Si no hay caché y no hay internet, falla silenciosamente sin crashear la app.
      return fetch(event.request).catch(() => {
        console.warn('Network offline, returning fallback or undefined data.');
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
           if (cacheAllowlist.indexOf(cacheName) === -1) {
             return caches.delete(cacheName);
           }
        })
      );
    })
  );
  self.clients.claim();
});
