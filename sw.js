/* Service worker: la app abre al instante desde la caché y se actualiza sola por detrás.
   Las llamadas a la API (script.google.com) nunca se cachean. */
var CACHE = 'enigma-mostrador-v21'; // v21 (16/09/2026): cobros de cambios en los movimientos del stock y aviso a Diego. v20 (16/09/2026): corte GS V 0 para la Nexuspos; Bluetooth que se reconecta solo (escucha y reintenta), una impresora por puesto. v19 (16/09/2026): tickets y vales con la cara del ticket de ventas (80 mm). v18: caché siempre desde la red
var ARCHIVOS = ['./', './index.html', './styles.css', './app.js', './vendor/JsBarcode.code128.min.js', './fonts/PinyonScript.woff2', './fonts/InstrumentSans.woff2', './fonts/BodoniModa.woff2', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function (e) {
  // cache:'reload' saltea la caché HTTP del navegador (GitHub Pages da 10 minutos): si no, podía
  // guardar el index.html viejo con la app.js nueva, y la tablet se trababa al poner el PIN.
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(ARCHIVOS.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* stale-while-revalidate: responde con lo guardado (instantáneo) y actualiza la copia por detrás. */
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (guardado) {
    var red = fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (resp) {
      if (resp && resp.ok) { var copia = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copia); }); }
      return resp;
    }).catch(function () { return guardado; });
    return guardado || red;
  }));
});
