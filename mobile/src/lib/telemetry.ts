import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { Platform } from 'react-native'
import { webApiUrl } from '@/lib/api'

type MobileEvent = {
  name: string
  severity?: 'info' | 'warning' | 'error' | 'fatal'
  message?: string
  route?: string
  fingerprint?: string
  metadata?: Record<string, string | number | boolean | null>
}

export function reportMobileEvent(event: MobileEvent) {
  const body = JSON.stringify({
    source: 'mobile',
    release: `${Constants.expoConfig?.version ?? 'unknown'}:${Updates.updateId ?? 'embedded'}`,
    ...event,
    metadata: {
      platform: Platform.OS,
      channel: Updates.channel ?? 'embedded',
      ...(event.metadata ?? {}),
    },
  })

  fetch(`${webApiUrl}/api/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => undefined)
}

