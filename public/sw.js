const WORKER_VERSION = '68'
const CACHE_NAME = `unblind-static-v${WORKER_VERSION}`
const OUTBOX_DB = 'unblind-offline-outbox-v1'
const OUTBOX_STORE = 'mutations'
const OUTBOX_SYNC_TAG = 'unblind-outbox-sync'
const OFFLINE_MUTATION_AUTHOR_HEADER = 'x-unblind-author-id'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
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
    return
  }

  if (event.data?.type === 'FLUSH_OUTBOX') {
    event.waitUntil(flushOutbox())
  }
})

function openOutbox() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OUTBOX_DB, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
        database.createObjectStore(OUTBOX_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function accessOutbox(mode, value) {
  const database = await openOutbox()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OUTBOX_STORE, mode === 'read' ? 'readonly' : 'readwrite')
    const store = transaction.objectStore(OUTBOX_STORE)
    let result
    const request = mode === 'put'
      ? store.put(value)
      : mode === 'delete'
        ? store.delete(value)
        : store.getAll()
    request.onsuccess = () => { result = request.result }
    transaction.oncomplete = () => { database.close(); resolve(result) }
    transaction.onerror = () => { database.close(); reject(transaction.error) }
    transaction.onabort = () => { database.close(); reject(transaction.error) }
  })
}

async function notifyWindows(message) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windows.forEach((client) => client.postMessage(message))
}

async function queueMutation(request) {
  const authorId = request.headers.get(OFFLINE_MUTATION_AUTHOR_HEADER)
  if (!authorId || !UUID_PATTERN.test(authorId)) {
    throw new Error('An authenticated author is required for offline storage.')
  }
  const body = await request.clone().text()
  let parsedBody = {}
  try { parsedBody = JSON.parse(body) } catch { /* JSON endpoints validate again during replay. */ }
  const requestKey = typeof parsedBody.clientRequestKey === 'string'
    ? parsedBody.clientRequestKey
    : crypto.randomUUID()

  await accessOutbox('put', {
    id: requestKey,
    url: request.url,
    method: request.method,
    authorId,
    body,
    createdAt: Date.now(),
  })

  try {
    if ('sync' in self.registration) await self.registration.sync.register(OUTBOX_SYNC_TAG)
  } catch {
    // iOS currently relies on the online/app-resume fallback below.
  }
  await notifyWindows({ type: 'OUTBOX_QUEUED' })
}

async function flushOutbox() {
  const entries = await accessOutbox('read')
  let completed = 0

  for (const entry of entries) {
    let destination
    try { destination = new URL(entry.url) } catch { /* Discard malformed legacy entries. */ }
    if (
      !UUID_PATTERN.test(entry.authorId ?? '') ||
      !destination ||
      destination.origin !== self.location.origin ||
      entry.method !== 'POST' ||
      !['/api/posts', '/api/comments'].includes(destination.pathname)
    ) {
      await accessOutbox('delete', entry.id)
      await notifyWindows({ type: 'OUTBOX_FAILED' })
      continue
    }

    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          [OFFLINE_MUTATION_AUTHOR_HEADER]: entry.authorId,
        },
        body: entry.body,
      })

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await accessOutbox('delete', entry.id)
        if (response.ok) completed += 1
        else await notifyWindows({ type: 'OUTBOX_FAILED' })
      } else {
        throw new Error(`Retryable HTTP ${response.status}`)
      }
    } catch {
      throw new Error('Outbox synchronization is still waiting for a connection.')
    }
  }

  if (completed > 0) await notifyWindows({ type: 'OUTBOX_SYNCED', count: completed })
}

self.addEventListener('sync', (event) => {
  if (event.tag === OUTBOX_SYNC_TAG) event.waitUntil(flushOutbox())
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
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const queueableMutation = request.method === 'POST'
    && (url.pathname === '/api/posts' || url.pathname === '/api/comments')

  if (queueableMutation) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        try {
          await queueMutation(request)
        } catch {
          return new Response(JSON.stringify({ error: '오프라인 저장을 준비하지 못했습니다. 로그인 상태를 확인한 뒤 다시 시도해주세요.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          })
        }
        return new Response(JSON.stringify({ ok: true, queued: true, offline: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      })
    )
    return
  }

  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')))
    return
  }

  const isVersionedAsset = url.pathname.startsWith('/_next/static/')
    || /^\/avatars\/bible-v\d+\/[a-z]+\.webp$/.test(url.pathname)
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
