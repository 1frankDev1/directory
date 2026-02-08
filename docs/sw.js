const CACHE_NAME = 'pastel-v1';
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
