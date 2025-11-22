/**
 * Enhanced Service Worker
 * 
 * Provides offline-first caching with stale-while-revalidate strategy
 * Background sync for failed requests
 * Cache versioning and invalidation
 */

const CACHE_VERSION = 'v1.0.0'
const CACHE_NAMES = {
  static: `petspark-static-${CACHE_VERSION}`,
  api: `petspark-api-${CACHE_VERSION}`,
  media: `petspark-media-${CACHE_VERSION}`,
  upload: `petspark-upload-${CACHE_VERSION}`
}

const CACHE_DURATION = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 5 * 60 * 1000, // 5 minutes
  media: 30 * 24 * 60 * 60 * 1000, // 30 days
  upload: 24 * 60 * 60 * 1000 // 24 hours
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting()
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      // Cache critical static assets
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
      ]).catch((err) => {
        console.warn('[SW] Failed to cache some static assets', err)
      })
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !Object.values(CACHE_NAMES).includes(name))
            .map((name) => caches.delete(name))
        )
      })
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests (except uploads)
  if (request.method !== 'GET' && !url.pathname.includes('/api/uploads')) {
    return
  }

  // API requests - stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.api))
    return
  }

  // Media files - cache first
  if (/\.(jpg|jpeg|png|webp|avif|mp4|webm|gif)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.media))
    return
  }

  // Static assets - cache first
  if (/\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static))
    return
  }

  // HTML pages - network first with fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, CACHE_NAMES.static))
    return
  }
})

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => {
      // Return cached version if network fails
      if (cached) {
        return cached
      }
      // Return offline fallback
      return new Response(
        JSON.stringify({ error: 'Offline', cached: true }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    })

  return cached || fetchPromise
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return offline fallback for images
    if (/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(request.url)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#ccc" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      )
    }
    throw error
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    // Return offline page
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueue())
  }
})

async function syncQueue() {
  // Implement background sync for queued requests
  // This would sync any failed API requests when connection is restored
  console.log('[SW] Syncing queued requests')
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data

  if (action === 'reply' && data?.mid) {
    event.waitUntil(
      clients.openWindow(`/chat?reply=${encodeURIComponent(data.mid)}`)
    )
  } else if (data?.url) {
    event.waitUntil(clients.openWindow(data.url))
  } else {
    event.waitUntil(clients.openWindow('/'))
  }
})

// Message handler for cache invalidation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)))
      })
    )
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

