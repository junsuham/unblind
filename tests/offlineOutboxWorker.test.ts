import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

const firstUser = '11111111-1111-4111-8111-111111111111'

type OutboxEntry = { id: string; authorId?: string; url: string; method: string; body: string }

function createWorker(fetcher: (url: string, options: RequestInit) => Promise<Response>) {
  const entries = new Map<string, OutboxEntry>()
  const notifications: unknown[] = []
  const database = {
    objectStoreNames: { contains: () => true },
    close: () => undefined,
    transaction: () => {
      const transaction: {
        oncomplete?: () => void
        onerror?: () => void
        onabort?: () => void
        error?: Error
        objectStore: () => {
          put: (value: OutboxEntry) => object
          delete: (id: string) => object
          getAll: () => object
        }
      } = {
        objectStore: () => {
          const perform = (action: () => unknown) => {
            const request: { result?: unknown; onsuccess?: () => void; onerror?: () => void } = {}
            queueMicrotask(() => {
              request.result = action()
              request.onsuccess?.()
              queueMicrotask(() => transaction.oncomplete?.())
            })
            return request
          }
          return {
            put: (value: OutboxEntry) => perform(() => entries.set(value.id, value)),
            delete: (id: string) => perform(() => entries.delete(id)),
            getAll: () => perform(() => [...entries.values()]),
          }
        },
      }
      return transaction
    },
  }
  const indexedDB = {
    open: () => {
      const request: { result: typeof database; onsuccess?: () => void; onerror?: () => void } = { result: database }
      queueMicrotask(() => request.onsuccess?.())
      return request
    },
  }
  const workerSelf = {
    location: { origin: 'https://unbd.vercel.app' },
    registration: {},
    clients: { matchAll: async () => [{ postMessage: (message: unknown) => notifications.push(message) }] },
    addEventListener: () => undefined,
  }
  const sandbox = {
    self: workerSelf,
    indexedDB,
    fetch: fetcher,
    Request,
    Response,
    URL,
    crypto: { randomUUID: () => '33333333-3333-4333-8333-333333333333' },
    queueMicrotask,
  }
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), sandbox)
  // Global function declarations in the worker remain accessible through its context.
  const functions = sandbox as typeof sandbox & {
    queueMutation?: (request: Request) => Promise<void>
    flushOutbox?: () => Promise<void>
  }
  return { entries, notifications, functions }
}

describe('service worker offline outbox', () => {
  it('refuses to store an unbound post', async () => {
    const worker = createWorker(async () => new Response(null, { status: 200 }))
    await expect(worker.functions.queueMutation!(new Request('https://unbd.vercel.app/api/posts', {
      method: 'POST',
      body: '{}',
    }))).rejects.toThrow('authenticated author')
    expect(worker.entries.size).toBe(0)
  })

  it('replays with the original author binding and discards legacy unbound entries', async () => {
    const headers: Headers[] = []
    const worker = createWorker(async (_url, options) => {
      headers.push(new Headers(options.headers))
      return new Response(null, { status: 403 })
    })
    const request = new Request('https://unbd.vercel.app/api/comments', {
      method: 'POST',
      headers: { 'x-unblind-author-id': firstUser },
      body: JSON.stringify({ clientRequestKey: '44444444-4444-4444-8444-444444444444' }),
    })
    await worker.functions.queueMutation!(request)
    expect([...worker.entries.values()][0].authorId).toBe(firstUser)
    worker.entries.set('legacy', {
      id: 'legacy',
      url: 'https://unbd.vercel.app/api/posts',
      method: 'POST',
      body: '{}',
    })
    await worker.functions.flushOutbox!()
    expect(headers).toHaveLength(1)
    expect(headers[0].get('x-unblind-author-id')).toBe(firstUser)
    expect(worker.entries.size).toBe(0)
  })
})
