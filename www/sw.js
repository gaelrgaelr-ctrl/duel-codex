/* ============================================================
   sw.js — service worker
   - Guarda la app (HTML, CSS, JS, íconos) para abrirla sin internet.
   - Las consultas a las APIs usan internet primero y, si no hay,
     la última respuesta guardada.
   - Las imágenes de las cartas NO se guardan aquí (siempre de internet).
   Al cambiar cualquier archivo de la app, sube el número de VERSION.
   ============================================================ */

const VERSION = 'v2';
const SHELL_CACHE = 'duel-codex-shell-' + VERSION;
const API_CACHE = 'duel-codex-api-' + VERSION;
const API_MAX = 120;

const SHELL = [
  './', './index.html', './manifest.json', './css/styles.css',
  './js/config.js', './js/art.js', './js/utils.js', './js/storage.js', './js/banlist.js', './js/api.js',
  './js/deck.js', './js/profile.js', './js/pwa.js', './js/auth.js', './js/ui-auth.js',
  './js/ui-hero.js', './js/ui-explore.js', './js/ui-detail.js', './js/ui-deck.js',
  './js/ui-profile.js', './js/ui-tools.js', './js/tool-duel.js', './js/tool-hand.js',
  './js/tool-misc.js', './js/tool-banlist.js', './js/tool-deckio.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = [SHELL_CACHE, API_CACHE];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Mantiene el caché de APIs con un tope de entradas
async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 1) Archivos de la propia app: se sirven del caché y se actualizan en segundo plano
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      const refresh = fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(refresh); return hit; }
      const res = await refresh;
      if (res) return res;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    })());
    return;
  }

  // 2) Datos de las APIs: internet primero, caché como respaldo
  if (url.hostname === 'db.ygoprodeck.com' || url.hostname === 'db.ygoresources.com') {
    e.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) { await cache.put(req, res.clone()); e.waitUntil(trim(cache, API_MAX)); }
        return res;
      } catch (err) {
        const hit = await cache.match(req);
        if (hit) return hit;
        throw err;
      }
    })());
  }
  // 3) Todo lo demás (imágenes de cartas, fuentes): sin intervención
});
