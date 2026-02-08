const CACHE_NAME = 'pastel-v2';
const ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'css/mosaic.css',
  'js/supabase-config.js',
  'js/helpers.js',
  'js/auth.js',
  'js/dashboard.js',
  'js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
