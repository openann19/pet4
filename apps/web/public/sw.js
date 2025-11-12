self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
const QUEUE = 'upload-queue-v1';
self.addEventListener('sync', (e) => {
  if (e.tag === 'upload-sync') e.waitUntil(flushQueue());
});
self.addEventListener('notificationclick', (e) => {
  const action = e.action;
  const notification = e.notification;
  notification.close();
  if (action === 'reply') {
    e.waitUntil(
      self.clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow(
          '/chat?reply=' + encodeURIComponent(notification.data?.mid || '')
        );
      })
    );
  } else {
    e.waitUntil(
      self.clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow('/chat');
      })
    );
  }
});
self.addEventListener('fetch', (e) => {
  const { method, url } = e.request;
  const u = new URL(url);
  // chunked uploads fallback
  if (method === 'PUT' && url.includes('/api/uploads/parts')) {
    e.respondWith(
      (async () => {
        try {
          return await fetch(e.request);
        } catch {
          const body = await e.request.clone().arrayBuffer();
          const entry = {
            url,
            body: Array.from(new Uint8Array(body)),
            headers: [...e.request.headers],
          };
          const db = await caches.open(QUEUE);
          await db.put(
            new Request(url + '&queued=1', { method: 'GET' }),
            new Response(JSON.stringify(entry))
          );
          await self.registration.sync.register('upload-sync');
          return new Response(JSON.stringify({ queued: true }), { status: 202 });
        }
      })()
    );
    return;
  }
  // feed: stale-while-revalidate
  if (u.pathname.startsWith('/api/feed')) {
    e.respondWith(
      (async () => {
        const c = await caches.open('feed-v1');
        const cached = await c.match(e.request);
        const live = fetch(e.request).then((r) => {
          c.put(e.request, r.clone());
          return r;
        });
        return cached || live;
      })()
    );
    return;
  }
  // media cache
  if (/\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(u.pathname)) {
    e.respondWith(
      caches.open('media-v1').then(
        async (c) =>
          (await c.match(e.request)) ||
          (await fetch(e.request).then((r) => {
            c.put(e.request, r.clone());
            return r;
          }))
      )
    );
    return;
  }
});
async function flushQueue() {
  const db = await caches.open(QUEUE);
  const keys = await db.keys();
  for (const k of keys) {
    const url = k.url.replace('&queued=1', '');
    const entry = await (await db.match(k)).json();
    const body = new Uint8Array(entry.body);
    const r = await fetch(url, { method: 'PUT', body, headers: new Headers(entry.headers) }).catch(
      () => null
    );
    if (r && r.ok) await db.delete(k);
  }
}
