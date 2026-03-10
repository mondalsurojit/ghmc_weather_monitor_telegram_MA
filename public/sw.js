// ─── GHMC Weather Monitor — Service Worker ───────────────────

const CACHE_VERSION = 'v2026-03-09-1773093932678'
const CACHE_NAME = `ghmc-weather-${CACHE_VERSION}`

const TILE_CACHE = 'ghmc-tiles'
const TILE_LIMIT = 300

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/ghmc_map.geojson',
  '/stations.json',
]

// Hosts that must always be fetched live — never cached
const BYPASS_HOSTS = [
  'telangana.gov.in',
  'allorigins.win',
  'corsproxy.io',
  'docs.google.com',
]

// Local paths that must always be fetched live — never cached
const BYPASS_PATHS = [
  '/api/weather',
]

// ── Utility: enforce tile cache limit ────────────────────────
async function enforceTileLimit() {
  const cache = await caches.open(TILE_CACHE)
  const keys = await cache.keys()

  if (keys.length > TILE_LIMIT) {
    const deleteCount = keys.length - TILE_LIMIT
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i])
    }
  }
}

// ── Install: pre-cache shell ─────────────────────────────────
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

// ── Activate: purge old app caches (tile cache preserved) ───
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

// ── Fetch ───────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Ignore non-http(s) requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // ── Navigation fallback for SPA ───────────────────────────
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Always bypass — external data hosts
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

  // Always bypass — local API paths
  if (BYPASS_PATHS.some(p => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    return
  }

  // ── Tile-aware caching (limit 300) ─────────────────────────
  if (url.hostname.includes('cartocdn.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached

        return fetch(event.request).then(response => {
          const clone = response.clone()

          caches.open(TILE_CACHE).then(async cache => {
            await cache.put(event.request, clone)
            await enforceTileLimit()
          })

          return response
        })
      })
    )
    return
  }

  // ── Cache-first for static assets ─────────────────────────
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached

      return fetch(event.request).then(response => {

        const contentType = response.headers.get('content-type') || ''

        if (
          response.ok &&
          event.request.method === 'GET' &&
          !url.pathname.includes('sw.js') &&
          event.request.destination !== 'document' &&
          (
            contentType.includes('javascript') ||
            contentType.includes('css') ||
            contentType.includes('image') ||
            contentType.includes('font')
          )
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }

        return response
      }).catch(() => cached || new Response('', { status: 503 }))
    })
  )
})

// ── Message: version check ───────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({
      version: CACHE_VERSION,
      cache: CACHE_NAME
    })
  }
})