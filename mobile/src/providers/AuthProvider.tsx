import type { Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/network'

WebBrowser.maybeCompleteAuthSession()

type Provider = 'google'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  profileComplete: boolean | null
  accountReady: boolean
  ageVerified: boolean
  isAdmin: boolean
  signIn: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const webAppUrl = process.env.EXPO_PUBLIC_WEB_API_URL ?? 'https://unblind-omega.vercel.app'
function getSupportedSession(session: Session | null) {
  return session?.user.app_metadata?.provider === 'google' ? session : null
}

function getRedirectUrl() {
  // Development builds resolve to unblind://auth/callback, while Expo Go
  // resolves to the current exp:// address so a physical iPhone can test OAuth.
  return Linking.createURL('auth/callback')
}

async function exchangeAuthResult(url: string) {
  const parsed = new URL(url)
  const authError =
    parsed.searchParams.get('error_description') ??
    parsed.searchParams.get('error')

  if (authError) throw new Error(authError)

  const code = parsed.searchParams.get('code')

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    if (!data.session) throw new Error('로그인 세션을 확인하지 못했습니다.')
    return data.session
  }

  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''))
  const accessToken = fragment.get('access_token')
  const refreshToken = fragment.get('refresh_token')

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    if (error) throw error
    if (!data.session) throw new Error('로그인 세션을 확인하지 못했습니다.')
    return data.session
  }

  throw new Error('로그인 결과를 확인하지 못했습니다.')
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)
  const [accountReady, setAccountReady] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const loadAccountForToken = useCallback(async (token: string) => {
    setAccountReady(false)
    try {
      const response = await fetch(`${webAppUrl}/api/account`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json().catch(() => null)

      setAgeVerified(Boolean(response.ok && result?.ageVerified))
      setIsAdmin(Boolean(response.ok && result?.isAdmin))
    } catch {
      setIsAdmin(false)
    } finally {
      setAccountReady(true)
    }
  }, [])

  const refreshAccount = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      setAgeVerified(false)
      setIsAdmin(false)
      setAccountReady(false)
      return
    }

    await loadAccountForToken(token)
  }, [loadAccountForToken])

  const loadProfileForUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('completed_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    setProfileComplete(Boolean(data?.completed_at))
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id

    if (!userId) {
      setProfileComplete(false)
      return
    }

    await loadProfileForUser(userId)
  }, [loadProfileForUser])

  useEffect(() => {
    let mounted = true

    withTimeout(supabase.auth.getSession(), 6_000, '로그인 확인 시간이 초과되었습니다.').then(({ data }) => {
      if (!mounted) return
      const supportedSession = getSupportedSession(data.session)
      setSession(supportedSession)
      setLoading(false)

      if (!supportedSession) {
        setProfileComplete(false)
        setAccountReady(false)
        return
      }

      setProfileComplete(null)
      void withTimeout(
        loadProfileForUser(supportedSession.user.id),
        6_000,
        '프로필 확인 시간이 초과되었습니다.',
      ).catch(() => {
        if (mounted) setProfileComplete(false)
      })
      void withTimeout(
        loadAccountForToken(supportedSession.access_token),
        6_000,
        '계정 확인 시간이 초과되었습니다.',
      ).catch(() => undefined)
    }).catch(() => {
      if (mounted) {
        setProfileComplete(false)
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') return
      const supportedSession = getSupportedSession(nextSession)
      setSession(supportedSession)
      if (supportedSession) {
        setProfileComplete(null)
        void loadProfileForUser(supportedSession.user.id).catch(() => setProfileComplete(false))
        void loadAccountForToken(supportedSession.access_token)
      } else {
        setProfileComplete(false)
        setAccountReady(false)
        setAgeVerified(false)
        setIsAdmin(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadAccountForToken, loadProfileForUser])

  const signIn = useCallback(async (provider: Provider) => {
    const appRedirectTo = getRedirectUrl()
    const webCallbackUrl = new URL('/auth/callback', webAppUrl).toString()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: webCallbackUrl,
        skipBrowserRedirect: true,
        scopes:
          'openid email profile https://www.googleapis.com/auth/user.birthday.read',
      },
    })

    if (error) throw error
    if (!data.url) throw new Error('로그인 주소를 만들지 못했습니다.')

    const mobileStartUrl = new URL('/auth/mobile-start', webAppUrl)
    mobileStartUrl.searchParams.set('return_to', appRedirectTo)
    mobileStartUrl.searchParams.set('auth_url', data.url)

    const result = await WebBrowser.openAuthSessionAsync(
      mobileStartUrl.toString(),
      appRedirectTo
    )
    if (result.type === 'success') {
      const nextSession = await exchangeAuthResult(result.url)
      const providerToken = nextSession.provider_token

      if (!providerToken) {
        await supabase.auth.signOut()
        throw new Error('소셜 계정의 연령 확인 권한을 받지 못했습니다. 다시 로그인해주세요.')
      }

      const response = await fetch(`${webAppUrl}/api/profile/verify-age`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${nextSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerToken }),
      })
      const verification = await response.json().catch(() => null)

      if (!response.ok) {
        await supabase.auth.signOut()
        throw new Error(verification?.error ?? '소셜 계정의 연령을 확인하지 못했습니다.')
      }

      setAgeVerified(true)
      await refreshAccount()
    }
  }, [refreshAccount])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfileComplete(false)
    setAccountReady(false)
    setAgeVerified(false)
    setIsAdmin(false)
  }, [])

  const value = useMemo(
    () => ({ session, loading, profileComplete, accountReady, ageVerified, isAdmin, signIn, signOut, refreshProfile, refreshAccount }),
    [session, loading, profileComplete, accountReady, ageVerified, isAdmin, signIn, signOut, refreshProfile, refreshAccount]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
