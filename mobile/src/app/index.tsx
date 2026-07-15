import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/providers/AuthProvider'
import { colors } from '@/constants/design'

export default function IndexScreen() {
  const { session, loading, profileComplete } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (!session) return <Redirect href="/login" />
  if (!profileComplete) return <Redirect href="/profile-setup" />
  return <Redirect href="/(tabs)" />
}
