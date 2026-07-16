import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { PropsWithChildren, useEffect } from 'react'
import { registerForPushNotifications } from '@/lib/pushNotifications'
import { useAuth } from '@/providers/AuthProvider'

export function AppRuntime({ children }: PropsWithChildren) {
  const { session } = useAuth()

  useEffect(() => {
    if (session) registerForPushNotifications(false).catch(() => undefined)
  }, [session])

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const href = response.notification.request.content.data?.href
      if (typeof href === 'string' && href.startsWith('/')) {
        router.push(href as never)
      }
    })
    return () => subscription.remove()
  }, [])

  return children
}
