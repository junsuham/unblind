import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

const secureStoreChunkSize = 1800

const secureStorage = {
  async getItem(key: string) {
    const chunkCount = Number(await SecureStore.getItemAsync(`${key}:chunks`))

    if (!chunkCount) return SecureStore.getItemAsync(key)

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(`${key}:${index}`)
      )
    )

    return chunks.every((chunk) => chunk !== null) ? chunks.join('') : null
  },
  async setItem(key: string, value: string) {
    const previousChunkCount = Number(
      await SecureStore.getItemAsync(`${key}:chunks`)
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
        SecureStore.setItemAsync(`${key}:${index}`, chunk)
      )
    )
    await SecureStore.setItemAsync(`${key}:chunks`, String(chunks.length))
    await SecureStore.deleteItemAsync(key)

    if (previousChunkCount > chunks.length) {
      await Promise.all(
        Array.from(
          { length: previousChunkCount - chunks.length },
          (_, index) => SecureStore.deleteItemAsync(`${key}:${chunks.length + index}`)
        )
      )
    }
  },
  async removeItem(key: string) {
    const chunkCount = Number(await SecureStore.getItemAsync(`${key}:chunks`))
    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(`${key}:chunks`),
      ...Array.from({ length: chunkCount || 0 }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}:${index}`)
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
