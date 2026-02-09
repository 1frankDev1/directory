const CACHE_NAME = 'pastel-v2';
const assets = [
  './',
  './index.html',
  './login.html',
  './signup.html',
  './directorio.html',
  './dashboard.html',
  './admin.html',
  './css/main.css',
  './css/dashboard.css',
  './js/supabase-config.js',
  './js/helpers.js',
  './js/auth-check.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
