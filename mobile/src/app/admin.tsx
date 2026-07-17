import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView, { type WebViewNavigation } from 'react-native-webview'
import { useAppTheme } from '@/constants/design'
import { shouldExitAdminWebView } from '@/lib/adminNavigation'
import { webApiUrl } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'

export default function AdminScreen() {
  const colors = useAppTheme()
  const { session, loading, isAdmin } = useAuth()
  const [pageError, setPageError] = useState('')

  if (!loading && (!session || !isAdmin)) {
    return <Redirect href="/(tabs)" />
  }

  const adminSessionUrl = new URL('/api/admin/mobile-session', webApiUrl)
  const allowedOrigin = new URL(webApiUrl).origin

  function handleNavigation(request: WebViewNavigation) {
    let requestUrl: URL
    try {
      requestUrl = new URL(request.url)
    } catch {
      return false
    }

    if (requestUrl.origin === allowedOrigin) {
      if (shouldExitAdminWebView(request.url, allowedOrigin)) {
        router.replace('/(tabs)')
        return false
      }

      return true
    }

    Linking.openURL(request.url).catch(() => undefined)
    return false
  }

  if (loading || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      {pageError ? (
        <View style={{ flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>관리자 화면을 불러오지 못했습니다.</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 }}>{pageError}</Text>
          <Pressable
            onPress={() => setPageError('')}
            style={{ marginTop: 20, minHeight: 48, borderRadius: 16, paddingHorizontal: 24, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          source={{
            uri: adminSessionUrl.toString(),
            headers: { Authorization: `Bearer ${session.access_token}` },
          }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={{ position: 'absolute', inset: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.brand} />
            </View>
          )}
          onShouldStartLoadWithRequest={handleNavigation}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 400) {
              setPageError(`서버 응답 코드: ${event.nativeEvent.statusCode}`)
            }
          }}
          onError={(event) => setPageError(event.nativeEvent.description || '네트워크 연결을 확인해주세요.')}
        />
      )}
    </SafeAreaView>
  )
}
