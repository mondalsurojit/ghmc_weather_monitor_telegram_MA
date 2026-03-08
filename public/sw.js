// ─── GHMC Weather Monitor — Service Worker ───────────────────
// CACHE_VERSION is auto-stamped by vite.config.js on every build.
// Manually bump it here only if deploying without `npm run build`.
const CACHE_VERSION = 'v2026-03-08-1772973916040'
const CACHE_NAME = `ghmc-weather-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Hosts that must always be fetched live — never cached
const BYPASS_HOSTS = [
  'telangana.gov.in',
  'allorigins.win',
  'corsproxy.io',
  'api.scraperapi.com',
]

// ── Install: pre-cache shell ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log(`[SW] Installed ${CACHE_NAME}`)
        return self.skipWaiting()
      })
  )
})

// ── Activate: purge old caches ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('ghmc-weather-') && k !== CACHE_NAME)
          .map(k => {
            console.log(`[SW] Purging old cache: ${k}`)
            return caches.delete(k)
          })
      ))
      .then(() => {
        console.log(`[SW] Activated ${CACHE_NAME}`)
        return self.clients.claim()
      })
  )
})

// ── Fetch: network-first for API, cache-first for assets ──────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Always bypass cache for data endpoints
  if (BYPASS_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    return
  }

  // Cache-first for everything else (static assets, fonts, Leaflet)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached

      return fetch(event.request).then(response => {
        if (
          response.ok &&
          event.request.method === 'GET' &&
          !url.pathname.includes('sw.js')
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached || new Response('', { status: 503 }))
    })
  )
})

// ── Message: version check ────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION, cache: CACHE_NAME })
  }
})
