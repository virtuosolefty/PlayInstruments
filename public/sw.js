/* Practice Deck's service worker: practice without a connection (ui-ux-pro-max offline-support).
 *
 * Everything you do is already saved on the device; this keeps the app itself there too.
 *   - The page: network first, so a new release arrives at once; the cached copy when offline.
 *   - Built files (assets/, named by their content): cache first, kept for good.
 *   - Songs, pictures, sounds, fonts and models: the cached copy at once, refreshed in the background.
 * Registered by main.jsx in production builds only; the dev server is never cached.
 * Bump VERSION to drop every cache on the next visit. */
const VERSION = 'v1';
const SHELL = `pd-shell-${VERSION}`;
const BUILT = `pd-built-${VERSION}`;
const MEDIA = `pd-media-${VERSION}`;
const KEEP = [SHELL, BUILT, MEDIA];
/** Old built files go once a cache holds more than this many, oldest first. */
const MAX_ENTRIES = 400;

const scope = self.registration.scope;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // One at a time, so a missing file does not stop the rest.
    await Promise.all([scope, `${scope}manifest.webmanifest`, `${scope}favicon.svg`].map(url => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('pd-') && !KEEP.includes(name)) await caches.delete(name);
    await self.clients.claim();
  })());
});

async function trim(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) await cache.delete(key);
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(scope, response.clone());
    return response;
  } catch {
    return (await cache.match(scope)) ?? (await cache.match(request)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(BUILT);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) { await cache.put(request, response.clone()); trim(BUILT); }
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(request);
  const fresh = fetch(request).then(async response => {
    if (response.ok && response.status === 200) { await cache.put(request, response.clone()); trim(MEDIA); }
    return response;
  });
  if (hit) { event.waitUntil(fresh.catch(() => {})); return hit; }
  return fresh;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !request.url.startsWith(scope)) return;
  if (request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }
  if (url.pathname.includes('/assets/')) { event.respondWith(cacheFirst(request)); return; }
  event.respondWith(staleWhileRevalidate(request, event));
});
