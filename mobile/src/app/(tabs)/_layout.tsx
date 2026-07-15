import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { useAuth } from '@/providers/AuthProvider'
import { useAppTheme } from '@/constants/design'

const icons: Record<string, SymbolViewProps['name']> = {
  prayer: 'hands.sparkles.fill',
  faith: 'heart.fill',
  daily: 'sun.max.fill',
  manitto: 'gift.fill',
  praise: 'music.note.list',
}

const fallbackIcons: Record<string, string> = {
  prayer: '♧',
  faith: '♡',
  daily: '☀',
  manitto: '◇',
  praise: '♫',
}

export default function TabLayout() {
  const { session, profileComplete } = useAuth()
  const colors = useAppTheme()
  if (!session) return <Redirect href="/login" />
  if (!profileComplete) return <Redirect href="/profile-setup" />

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textTertiary,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 16,
          height: 70,
          paddingTop: 7,
          paddingBottom: 9,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 35,
          backgroundColor: colors.tabSurface,
          shadowColor: '#000000',
          shadowOpacity: 0.2,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <SymbolView
            name={icons[route.name] ?? 'circle.fill'}
            size={21}
            tintColor={color}
            fallback={<Text style={{ color, fontSize: 20 }}>{fallbackIcons[route.name] ?? '•'}</Text>}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="prayer" options={{ title: '기도' }} />
      <Tabs.Screen name="faith" options={{ title: '신앙' }} />
      <Tabs.Screen name="daily" options={{ title: '일상' }} />
      <Tabs.Screen name="manitto" options={{ title: '마니또' }} />
      <Tabs.Screen name="praise" options={{ title: '찬양' }} />
      <Tabs.Screen name="boards" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  )
}
