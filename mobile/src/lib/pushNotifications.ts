import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { authenticatedFetch } from '@/lib/api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

function getProjectId() {
  return Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? null
}

export async function registerForPushNotifications(requestPermission = false) {
  if (!Device.isDevice) {
    return { ok: false as const, reason: '푸시 알림은 실제 기기에서 확인할 수 있습니다.' }
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '언블라인드 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4B22',
    })
  }

  let permission = await Notifications.getPermissionsAsync()
  if (requestPermission && permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync()
  }
  if (permission.status !== 'granted') {
    return { ok: false as const, reason: '기기 알림 권한이 꺼져 있습니다.' }
  }

  const projectId = getProjectId()
  if (!projectId) {
    return { ok: false as const, reason: 'Expo 프로젝트 연결이 아직 완료되지 않았습니다.' }
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  const response = await authenticatedFetch('/api/push/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName,
    }),
  })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    return { ok: false as const, reason: result?.error ?? '알림 기기를 등록하지 못했습니다.' }
  }
  return { ok: true as const, token }
}
