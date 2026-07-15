import type { Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

type Provider = 'google' | 'kakao'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  profileComplete: boolean
  signIn: (provider: Provider) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getRedirectUrl() {
  // Development builds resolve to unblind://auth/callback, while Expo Go
  // resolves to the current exp:// address so a physical iPhone can test OAuth.
  return Linking.createURL('auth/callback')
}

async function exchangeAuthResult(url: string) {
  const parsed = new URL(url)
  const code = parsed.searchParams.get('code')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return
  }

  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''))
  const accessToken = fragment.get('access_token')
  const refreshToken = fragment.get('refresh_token')

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    if (error) throw error
    return
  }

  throw new Error('로그인 결과를 확인하지 못했습니다.')
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  const refreshProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id

    if (!userId) {
      setProfileComplete(false)
      return
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('completed_at')
      .eq('user_id', userId)
      .maybeSingle()

    setProfileComplete(Boolean(data?.completed_at))
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      await refreshProfile()
      if (mounted) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        refreshProfile()
      } else {
        setProfileComplete(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [refreshProfile])

  const signIn = useCallback(async (provider: Provider) => {
    const redirectTo = getRedirectUrl()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    })

    if (error) throw error
    if (!data.url) throw new Error('로그인 주소를 만들지 못했습니다.')

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    if (result.type === 'success') await exchangeAuthResult(result.url)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfileComplete(false)
  }, [])

  const value = useMemo(
    () => ({ session, loading, profileComplete, signIn, signOut, refreshProfile }),
    [session, loading, profileComplete, signIn, signOut, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
