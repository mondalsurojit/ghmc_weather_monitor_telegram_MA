// ─── GHMC Weather Monitor — Service Worker ───────────────────

const CACHE_VERSION = 'v2026-03-10-1773140461336'
const CACHE_NAME = `ghmc-weather-${CACHE_VERSION}`

const TILE_CACHE = 'ghmc-tiles'
const TILE_LIMIT = 300

const TEMP_DATA_CACHE = 'ghmc-temp-data'
const TEMP_DATA_TTL = 30 * 60 * 1000 // 30 minutes

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/ghmc_map.geojson',
  '/stations.json',
]

// Hosts that must always use network first
const NETWORK_FIRST_HOSTS = [
  'telangana.gov.in',
  'docs.google.com',
]

// Network-first paths
const NETWORK_FIRST_PATHS = [
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

// ── Utility: check cache expiry ──────────────────────────────
async function getValidCachedResponse(request) {

  const cache = await caches.open(TEMP_DATA_CACHE)
  const cached = await cache.match(request)

  if (!cached) return null

  const timestamp = cached.headers.get('sw-cache-time')
  if (!timestamp) return null

  const age = Date.now() - Number(timestamp)

  if (age > TEMP_DATA_TTL) {
    console.warn('[SW] Weather cache stale (>1h), using stale data')
  }

  return cached
}

// ── Install ──────────────────────────────────────────────────
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

// ── Activate ─────────────────────────────────────────────────
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

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // ── SPA navigation fallback ───────────────────────────────
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // ── Network-first logic with temporary cache ──────────────
  if (
    NETWORK_FIRST_HOSTS.some(h => url.hostname.includes(h)) ||
    NETWORK_FIRST_PATHS.some(p => url.pathname.startsWith(p))
  ) {

    event.respondWith(

      fetch(event.request).then(async response => {

        const headers = new Headers(response.headers)
        headers.set('sw-cache-time', Date.now())

        const clone = new Response(await response.clone().blob(), {
          status: response.status,
          statusText: response.statusText,
          headers
        })

        const cache = await caches.open(TEMP_DATA_CACHE)

        // keep only latest entry
        const keys = await cache.keys()
        await Promise.all(keys.map(k => cache.delete(k)))

        await cache.put(event.request, clone.clone())

        return response

      }).catch(async () => {

        const cached = await getValidCachedResponse(event.request)

        if (cached) return cached

        return new Response(JSON.stringify({
          error: 'NETWORK_UNAVAILABLE',
          message: 'Network unavailable and no cached weather data present'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })

      })

    )

    return
  }

  // ── Tile caching ──────────────────────────────────────────
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

  // ── Static asset caching ──────────────────────────────────
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
      })
        .catch(() => cached || new Response('', { status: 503 }))
    })
  )
})

// ── Message ─────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({
      version: CACHE_VERSION,
      cache: CACHE_NAME
    })
  }
})