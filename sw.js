// Service worker de la app Tiffany Cosmetic.
// Siempre intenta traer la version nueva de internet; si no hay conexion,
// muestra la ultima copia guardada. Los precios y productos (Supabase) nunca
// se guardan aqui: siempre llegan frescos.
//
// Al cambiar archivos de la tienda NO hace falta tocar nada aqui.
// Solo sube VERSION si agregas o quitas archivos de la lista PRECARGA.
const VERSION = 'tiffany-v1';

const PRECARGA = [
  './',
  './index.html',
  './app.js',
  './products-data.js',
  './valquin-aromas.js',
  './instalar-app.js',
  './logo.jpg',
  './manifest.json',
  './iconos/icono-192.png',
  './iconos/icono-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECARGA)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Supabase, CDNs y WhatsApp los maneja el navegador directo (siempre frescos).
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copia));
        }
        return resp;
      })
      .catch(() =>
        caches.match(req).then((guardado) => guardado || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
});
