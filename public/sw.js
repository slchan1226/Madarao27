const CACHE_NAME = 'madarao-pwa-2027-v4';
const FONT_CACHE_NAME = 'madarao-fonts-2027-v1';
const WEATHER_CACHE_NAME = 'madarao-weather-2027-v1';
const WEATHER_NETWORK_TIMEOUT_MS = 6500;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './maps/madarao.webp',
  './maps/romance.webp',
  './maps/nozawa.webp'
  /* __VITE_PRECACHE_ASSETS__ */
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: 'reload' }));
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // Ignore transient individual fetch errors during dev/offline install
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== CACHE_NAME &&
              key !== FONT_CACHE_NAME &&
              key !== WEATHER_CACHE_NAME
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

async function handleWeatherRequest(request) {
  const cache = await caches.open(WEATHER_CACHE_NAME);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEATHER_NETWORK_TIMEOUT_MS);

  try {
    const networkResponse = await fetch(request, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (networkResponse && networkResponse.ok) {
      const bodyText = await networkResponse.clone().text();
      const cachedAt = new Date().toISOString();
      const headers = new Headers(networkResponse.headers);
      headers.set('Content-Type', 'application/json; charset=utf-8');
      headers.set('X-SW-Cached-At', cachedAt);

      const responseToCache = new Response(bodyText, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      await cache.put(request, responseToCache);

      const liveHeaders = new Headers(headers);
      liveHeaders.set('X-SW-Cache', 'LIVE');
      return new Response(bodyText, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: liveHeaders,
      });
    }
  } catch {
    clearTimeout(timeoutId);
  }

  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) {
    const bodyText = await cached.text();
    const fallbackHeaders = new Headers(cached.headers);
    fallbackHeaders.set('Content-Type', 'application/json; charset=utf-8');
    fallbackHeaders.set('X-SW-Cache', 'HIT');
    return new Response(bodyText, {
      status: cached.status,
      statusText: cached.statusText,
      headers: fallbackHeaders,
    });
  }

  return new Response(
    JSON.stringify({ error: 'offline_no_cache' }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-SW-Cache': 'MISS',
      },
    }
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // Network-First with timeout & Cache Fallback for Open-Meteo ski resort weather API
  if (url.origin === 'https://api.open-meteo.com') {
    event.respondWith(handleWeatherRequest(request));
    return;
  }

  // Cache-First strategy for Google Fonts stylesheets & font files
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Only intercept same-origin app shell & trail map requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests: Cache-First / Stale-While-Revalidate with offline index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached =
          (await cache.match(request)) ||
          (await cache.match('./index.html')) ||
          (await cache.match('./'));

        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put('./index.html', response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Static assets & WebP trail maps: Cache-First with background Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: false });

      const networkFetch = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
