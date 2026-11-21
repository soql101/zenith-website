/*
 * Clean-up service worker. An older site on zenitherps.com installed a service worker at /sw.js
 * that serves stale cached pages to returning visitors. This site has no service worker, so this
 * file replaces the old one, deletes its caches, unregisters itself and reloads open pages.
 */
self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) { clients.forEach(function (c) { c.navigate(c.url); }); })
  );
});
