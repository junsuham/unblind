import { supabase } from '@/lib/supabase'
import { fetchWithRetry } from '@/lib/network'

export const webApiUrl = process.env.EXPO_PUBLIC_WEB_API_URL ?? 'https://unbd.vercel.app'

export async function authenticatedFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const authorBoundMutation = init?.method?.toUpperCase() === 'POST'
    && (path === '/api/posts' || path === '/api/comments')

  return fetchWithRetry(`${webApiUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(authorBoundMutation && data.session?.user.id ? { 'x-unblind-author-id': data.session.user.id } : {}),
    },
  }, { attempts: 2, timeoutMs: 12_000 })
}
