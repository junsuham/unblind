import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { useAuth } from '@/providers/AuthProvider'
import { useAppTheme } from '@/constants/design'
import { AppBootstrapScreen } from '@/components/AppBootstrapScreen'
import { Emoji3D, type Emoji3DName } from '@/components/Emoji3D'

const icons: Record<string, SymbolViewProps['name']> = {
  prayer: 'hands.sparkles.fill',
  faith: 'heart.fill',
  daily: 'sun.max.fill',
  manitto: 'gift.fill',
  praise: 'music.note.list',
}

const fallbackIcons: Record<string, Emoji3DName> = {
  prayer: 'prayer',
  faith: 'hearts',
  daily: 'sun',
  manitto: 'gift',
  praise: 'musicDisc',
}

export default function TabLayout() {
  const { session, loading, profileComplete } = useAuth()
  const colors = useAppTheme()

  if (loading || (session && profileComplete === null)) return <AppBootstrapScreen />
  if (!session) return <Redirect href="/login" />
  if (profileComplete !== true) return <Redirect href="/profile-setup" />

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
          height: 60,
          paddingBottom: 5,
          borderTopWidth: 1,
          borderColor: colors.border,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: colors.tabSurface,
          shadowColor: '#000000',
          shadowOpacity: 0.07,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 5,
        },
        tabBarIconStyle: { height: 18 },
        tabBarLabelStyle: { fontSize: 10, lineHeight: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <SymbolView
            name={icons[route.name] ?? 'circle.fill'}
            size={18}
            tintColor={color}
            fallback={fallbackIcons[route.name] ? <Emoji3D name={fallbackIcons[route.name]} size={18} /> : <Text style={{ color, fontSize: 17 }}>•</Text>}
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
