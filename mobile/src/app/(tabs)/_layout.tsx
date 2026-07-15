import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useAuth } from '@/providers/AuthProvider'
import { colors } from '@/constants/design'

const icons: Record<string, string> = {
  index: '⌂',
  boards: '☰',
  manitto: '🎁',
  praise: '♫',
  profile: '●',
}

export default function TabLayout() {
  const { session, profileComplete } = useAuth()
  if (!session) return <Redirect href="/login" />
  if (!profileComplete) return <Redirect href="/profile-setup" />

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { height: 82, paddingTop: 8, paddingBottom: 18, borderTopColor: colors.separator, backgroundColor: colors.surface },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{icons[route.name] ?? '•'}</Text>,
      })}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="boards" options={{ title: '게시판' }} />
      <Tabs.Screen name="manitto" options={{ title: '마니또' }} />
      <Tabs.Screen name="praise" options={{ title: '찬양' }} />
      <Tabs.Screen name="profile" options={{ title: '내 정보' }} />
    </Tabs>
  )
}
