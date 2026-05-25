// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO — Service Worker v3.0
// Strategy: Network-First for app shell (HTML/JS/CSS) so users always
// receive the freshest page; Cache-First for tiles/images; Network-First
// for API data. Offline fallback for complete disconnection scenarios.
// ═══════════════════════════════════════════════════════════════════

// IMPORTANT: bump CACHE_VERSION to purge old caches that may be serving
// a stale (possibly broken) page.tsx to returning mobile users.
const CACHE_VERSION = 'zefyrio-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Critical assets — always available offline
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/offline.html',
];

// API endpoints to cache with network-first strategy
const API_PATTERNS = [
  '/api/aero',
  '/api/notams',
  '/api/adsb',
];

// External APIs to cache responses from
const EXTERNAL_API_PATTERNS = [
  'api.open-meteo.com',
  'services.swpc.noaa.gov',
  'api.rainviewer.com',
  'aviationweather.gov',
];

// ─── INSTALL ─────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge ALL caches whose name doesn't match the current CACHE_VERSION.
      // This is more aggressive than the v2 filter (which only purged buckets
      // whose suffix changed) — guarantees stale page shells from v2 die.
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION + '-'))
          .map((name) => {
            console.log('[SW] Purging old cache:', name);
            return caches.delete(name);
          })
      );
      // Take control of all open clients immediately so the new SW serves
      // their next navigation (no need to close all tabs first).
      await self.clients.claim();
    })()
  );
});

// Allow the page to trigger an immediate activation (used by the registry
// when a waiting worker is detected, to skip the "close all tabs" dance).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── FETCH ───────────────────────────────────────────────────────
// Heuristic: an app-shell request is either an HTML navigation, the root
// document, a Next.js build asset (which is fingerprinted per deploy), or
// an RSC payload. ALL of these must be network-first so users with a
// stale SW receive new code instead of the cached broken bundle.
function isAppShellRequest(request, url) {
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  // RSC payload requests carry this header / query param
  if (request.headers.get('RSC') === '1') return true;
  if (url.searchParams.has('_rsc')) return true;
  if (url.pathname.startsWith('/_next/')) return true;
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.map')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Strategy 0 (NEW): App shell — Network First with cache fallback.
  // Previously this fell through to stale-while-revalidate, which is what
  // pinned mobile users to the old broken page.tsx forever.
  if (url.origin === self.location.origin && isAppShellRequest(request, url)) {
    event.respondWith(networkFirstAppShell(request, STATIC_CACHE));
    return;
  }

  // Strategy 1: Internal API routes — Network First, fall back to cache
  if (API_PATTERNS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, 8000));
    return;
  }

  // Strategy 2: External weather/aviation APIs — Network First with 10s timeout
  if (EXTERNAL_API_PATTERNS.some((p) => url.hostname.includes(p))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, 10000));
    return;
  }

  // Strategy 3: Tile images (map tiles) — Cache First (they rarely change)
  if (url.hostname.includes('tile') || url.hostname.includes('arcgisonline') || url.hostname.includes('cartocdn') || url.hostname.includes('rainviewer')) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Strategy 4: Other same-origin static assets (icons, images, fonts) —
  // safe to stale-while-revalidate since they aren't the app shell.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Default: just fetch
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Condiciones meteorológicas han cambiado.',
      icon: '/globe.svg',
      badge: '/globe.svg',
      vibrate: [200, 100, 200],
      tag: data.tag || 'weather-alert',
      data: {
        url: data.url || '/',
      },
      actions: [
        { action: 'open', title: 'Ver HUD' },
        { action: 'dismiss', title: 'Cerrar' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '⚠️ Alerta Zefyrio', options)
    );
  } catch (err) {
    console.error('[SW] Push parse error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});

// ═══════════════════════════════════════════════════════════════════
// CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Network First (App Shell) — Always try network so users get fresh code.
 * On failure: fall back to cached copy if any, then offline page for nav.
 * NOTE: Next.js fingerprints /_next/ assets per deploy, so the cache fallback
 * for a missing-from-cache asset is OK — the navigation request that fetches
 * the new HTML will reference the new fingerprinted URLs.
 */
async function networkFirstAppShell(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First — Try network, fall back to cache if offline or timeout.
 * Best for API data that changes frequently.
 */
async function networkFirstStrategy(request, cacheName, timeoutMs = 8000) {
  try {
    const networkResponse = await fetchWithTimeout(request, timeoutMs);
    // Clone and cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving stale API cache:', request.url);
      return cached;
    }
    // No cache either — return error JSON for API routes
    return new Response(
      JSON.stringify({ error: 'Offline — sin datos en caché', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Cache First — Check cache, only fetch if missing.
 * Best for map tiles and static images.
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Return transparent 1x1 pixel for failed image requests
    return new Response(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      { headers: { 'Content-Type': 'image/png' } }
    );
  }
}

/**
 * Stale While Revalidate — Return cache immediately, update in background.
 * Best for app shell and static assets.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || offlineFallback(request));

  return cached || fetchPromise;
}

/**
 * Fetch with timeout — prevents hanging on slow networks
 */
function fetchWithTimeout(request, timeoutMs) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Offline fallback — show offline page for navigation requests
 */
async function offlineFallback(request) {
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
  }
  return new Response('Offline', { status: 503 });
}
