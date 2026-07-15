import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

const secureStoreChunkSize = 1800

function chunkCountKey(key: string) {
  return `${key}__chunks`
}

function chunkKey(key: string, index: number) {
  return `${key}__${index}`
}

const secureStorage = {
  async getItem(key: string) {
    const chunkCount = Number(await SecureStore.getItemAsync(chunkCountKey(key)))

    if (!chunkCount) return SecureStore.getItemAsync(key)

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, index))
      )
    )

    return chunks.every((chunk) => chunk !== null) ? chunks.join('') : null
  },
  async setItem(key: string, value: string) {
    const previousChunkCount = Number(
      await SecureStore.getItemAsync(chunkCountKey(key))
    )
    const chunks = Array.from(
      { length: Math.ceil(value.length / secureStoreChunkSize) },
      (_, index) =>
        value.slice(
          index * secureStoreChunkSize,
          (index + 1) * secureStoreChunkSize
        )
    )

    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(chunkKey(key, index), chunk)
      )
    )
    await SecureStore.setItemAsync(chunkCountKey(key), String(chunks.length))
    await SecureStore.deleteItemAsync(key)

    if (previousChunkCount > chunks.length) {
      await Promise.all(
        Array.from(
          { length: previousChunkCount - chunks.length },
          (_, index) => SecureStore.deleteItemAsync(chunkKey(key, chunks.length + index))
        )
      )
    }
  },
  async removeItem(key: string) {
    const chunkCount = Number(await SecureStore.getItemAsync(chunkCountKey(key)))
    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(chunkCountKey(key)),
      ...Array.from({ length: chunkCount || 0 }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, index))
      ),
    ])
  },
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabasePublishableKey || 'missing-publishable-key',
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
)
