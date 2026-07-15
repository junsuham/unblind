import { supabase } from '@/lib/supabase'

export const webApiUrl = process.env.EXPO_PUBLIC_WEB_API_URL ?? 'https://unblind-omega.vercel.app'

export async function authenticatedFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  return fetch(`${webApiUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
