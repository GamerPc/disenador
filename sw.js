/* Service worker del Diseñador: permite instalarlo y abrirlo aunque falle el internet.
   VERSION la pone construir.py; cuando cambia, el navegador baja la versión nueva. */
const VERSION = 'ca857529c6';
const CACHE = 'disenador-' + VERSION;
const BASE = ['./', 'index.html', 'config.js', 'js/app.js', 'js/almacen-local.js', 'js/pwa.js', 'js/nube.js', 'manifest.webmanifest',
  'icons/icono-192.png', 'icons/icono-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];
const LIBRERIAS = ['https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com)\//;
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(BASE);
    await Promise.all(LIBRERIAS.map(u => c.add(u).catch(() => null)));   // si no se pueden, se guardan al usarlas
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('disenador-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'actualizar') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin){
    if (r.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')){
      // la página: primero internet (para ver lo nuevo), si no hay, la guardada
      e.respondWith(fetch(r).then(res => { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); return res; })
        .catch(() => caches.match(r).then(x => x || caches.match('index.html'))));
      return;
    }
    e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => { if (res.ok){ const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); } return res; })));
    return;
  }
  if (CDN.test(r.url)){
    e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => { if (res.ok || res.type === 'opaque'){ const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); } return res; })));
  }
  // lo demás (la nube, Google) va directo a internet
});
