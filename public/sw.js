const WORKER_VERSION = '58'
const CACHE_NAME = `unblind-static-v${WORKER_VERSION}`
const PRECACHE_URLS = [
  '/offline.html',
  '/brand/unblind-monogram-relief-v5.png',
  '/brand/unblind-wordmark-relief-v5.png',
  '/brand/unblind-slogan-relief-v5.png',
  '/icons/icon-192-v6.png',
  '/icons/icon-512-v6.png',
  '/icons/apple-touch-icon-v6.png',
  '/icons/emoji-3d/bell.png',
  '/icons/emoji-3d/chat.png',
  '/icons/emoji-3d/check.png',
  '/icons/emoji-3d/church.png',
  '/icons/emoji-3d/disc.png',
  '/icons/emoji-3d/dove.png',
  '/icons/emoji-3d/gift.png',
  '/icons/emoji-3d/headphones.png',
  '/icons/emoji-3d/hearts.png',
  '/icons/emoji-3d/hourglass.png',
  '/icons/emoji-3d/location.png',
  '/icons/emoji-3d/music-disc.png',
  '/icons/emoji-3d/person.png',
  '/icons/emoji-3d/prayer.png',
  '/icons/emoji-3d/prohibited.png',
  '/icons/emoji-3d/sun.png',
  '/icons/emoji-3d/siren.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (names) => {
      const oldCaches = names.filter((name) => name.startsWith('unblind-static-') && name !== CACHE_NAME)
      await Promise.all(oldCaches.map((name) => caches.delete(name)))
      await self.clients.claim()
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: WORKER_VERSION })
    return
  }

  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting())
  }
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { body: event.data?.text() ?? '' }
  }

  const href = typeof payload.href === 'string' && payload.href.startsWith('/') && !payload.href.startsWith('//')
    ? payload.href
    : '/notifications'

  event.waitUntil(self.registration.showNotification(
    typeof payload.title === 'string' && payload.title ? payload.title : '언블라인드',
    {
      body: typeof payload.body === 'string' ? payload.body : '',
      icon: '/icons/icon-192-v6.png',
      badge: '/icons/icon-192-v6.png',
      tag: typeof payload.notificationId === 'string' ? `unblind-${payload.notificationId}` : 'unblind-notification',
      data: { href },
    },
  ))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const href = typeof event.notification.data?.href === 'string' ? event.notification.data.href : '/notifications'
  const destination = new URL(href, self.location.origin).href

  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
    for (const client of clients) {
      if ('focus' in client) {
        if ('navigate' in client) await client.navigate(destination)
        return client.focus()
      }
    }
    return self.clients.openWindow(destination)
  }))
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')))
    return
  }

  const isVersionedAsset = url.pathname.startsWith('/_next/static/')
  const isPwaAsset = PRECACHE_URLS.includes(url.pathname)
  if (!isVersionedAsset && !isPwaAsset) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
