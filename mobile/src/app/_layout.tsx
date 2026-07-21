import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '@/providers/AuthProvider'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { AppRuntime } from '@/components/AppRuntime'

SplashScreen.setOptions({
  duration: 650,
  fade: true,
})

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppRuntime>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </AppRuntime>
      </AuthProvider>
    </AppErrorBoundary>
  )
}
