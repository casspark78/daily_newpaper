const SHELL_CACHE = 'hans-daily-shell-v1';
const REPORT_CACHE = 'hans-daily-reports-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return cache.addAll(SHELL_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== SHELL_CACHE && key !== REPORT_CACHE; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  const url = new URL(req.url);

  if (url.pathname.indexOf('/reports/') !== -1) {
    // Network-first so today's edition and the date list stay fresh;
    // fall back to cache when offline.
    event.respondWith(
      fetch(req).then(function (res) {
        const clone = res.clone();
        caches.open(REPORT_CACHE).then(function (cache) { cache.put(req, clone); });
        return res;
      }).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  if (SHELL_ASSETS.some(function (a) { return url.pathname.endsWith(a.replace('./', '/')); }) || req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req);
      })
    );
    return;
  }
});
