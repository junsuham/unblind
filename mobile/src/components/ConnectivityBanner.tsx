import { useEffect, useState } from 'react'
import { AppState, Text, View } from 'react-native'
import { useAppTheme } from '@/constants/design'
import { webApiUrl } from '@/lib/api'
import { fetchWithRetry } from '@/lib/network'

export function ConnectivityBanner() {
  const colors = useAppTheme()
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let active = true

    async function check() {
      try {
        const response = await fetchWithRetry(`${webApiUrl}/api/health`, undefined, {
          attempts: 1,
          timeoutMs: 5_000,
        })
        if (active) setOffline(!response.ok)
      } catch {
        if (active) setOffline(true)
      }
    }

    check()
    const interval = setInterval(check, 30_000)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check()
    })

    return () => {
      active = false
      clearInterval(interval)
      subscription.remove()
    }
  }, [])

  if (!offline) return null

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: colors.danger, paddingHorizontal: 18, paddingVertical: 8 }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
        연결이 불안정합니다. 네트워크가 복구되면 자동으로 다시 확인합니다.
      </Text>
    </View>
  )
}

