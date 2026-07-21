import { Stack } from 'expo-router'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '@/providers/AuthProvider'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { AppRuntime } from '@/components/AppRuntime'
import { NativeLaunchTransition } from '@/components/NativeLaunchTransition'
import { colors } from '@/constants/design'

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: colors.brand }}>
          <AppRuntime>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
          </AppRuntime>
          <NativeLaunchTransition />
        </View>
      </AuthProvider>
    </AppErrorBoundary>
  )
}
