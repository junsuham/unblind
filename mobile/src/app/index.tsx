import { Redirect } from 'expo-router'
import { useAuth } from '@/providers/AuthProvider'
import { AppBootstrapScreen } from '@/components/AppBootstrapScreen'

export default function IndexScreen() {
  const { session, loading, profileComplete, accountReady } = useAuth()

  if (loading || (session && profileComplete === null)) return <AppBootstrapScreen />

  if (!session) return <Redirect href="/login" />
  if (!profileComplete && !accountReady) return <AppBootstrapScreen />
  if (!profileComplete) return <Redirect href="/profile-setup" />
  return <Redirect href="/(tabs)" />
}
