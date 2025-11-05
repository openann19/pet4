/**
 * Service Worker for PWA
 * Provides offline support, caching, and background sync
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `pet3-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pet3-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Cache strategies
const CACHE_FIRST = 'cache-first';
const NETWORK_FIRST = 'network-first';
const STALE_WHILE_REVALIDATE = 'stale-while-revalidate';

// Route strategies
const ROUTE_STRATEGIES = {
  '/api/': NETWORK_FIRST,
  '/assets/': CACHE_FIRST,
  '/images/': STALE_WHILE_REVALIDATE,
  default: NETWORK_FIRST,
};

/**
 * Install event - cache essential assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('pet3-') && name !== CACHE_NAME && name !== RUNTIME_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - handle network requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Determine caching strategy
  const strategy = getStrategy(url.pathname);

  event.respondWith(
    handleFetch(request, strategy)
  );
});

/**
 * Get caching strategy for URL
 */
function getStrategy(pathname) {
  for (const [route, strategy] of Object.entries(ROUTE_STRATEGIES)) {
    if (route !== 'default' && pathname.startsWith(route)) {
      return strategy;
    }
  }
  return ROUTE_STRATEGIES.default;
}

/**
 * Handle fetch with caching strategy
 */
async function handleFetch(request, strategy) {
  switch (strategy) {
    case CACHE_FIRST:
      return cacheFirst(request);
    case NETWORK_FIRST:
      return networkFirst(request);
    case STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network first strategy
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncPendingActions());
  }
});

/**
 * Sync pending actions when back online
 */
async function syncPendingActions() {
  // Implementation would sync queued actions
  // This is a placeholder for actual implementation
  return Promise.resolve();
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Pet3', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
