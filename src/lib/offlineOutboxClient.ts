import { supabase } from '@/lib/supabase'
import { OFFLINE_MUTATION_AUTHOR_HEADER } from '@/lib/offlineMutationAuthor'

const OUTBOX_DB = 'unblind-offline-outbox-v1'
const OUTBOX_STORE = 'mutations'

export async function offlineMutationHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    // getSession reads the browser's stored session, including while offline.
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user.id) headers[OFFLINE_MUTATION_AUTHOR_HEADER] = session.user.id
  } catch {
    // An unbound request is rejected by the server and is never queued offline.
  }
  return headers
}

export async function clearOfflineOutbox(): Promise<void> {
  if (typeof indexedDB === 'undefined') return

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(OUTBOX_DB, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(OUTBOX_STORE)) {
        request.result.createObjectStore(OUTBOX_STORE, { keyPath: 'id' })
      }
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(OUTBOX_STORE, 'readwrite')
      transaction.objectStore(OUTBOX_STORE).clear()
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => { database.close(); reject(transaction.error) }
      transaction.onabort = () => { database.close(); reject(transaction.error) }
    }
  })
}

export async function signOutAndClearOfflineOutbox(): Promise<void> {
  // Server-side author checks remain the final guard if storage is unavailable.
  await clearOfflineOutbox().catch(() => undefined)
  await supabase.auth.signOut()
  await clearOfflineOutbox().catch(() => undefined)
}
