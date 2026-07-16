import { Redirect, router } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView, { type WebViewNavigation } from 'react-native-webview'
import { useAppTheme } from '@/constants/design'
import { webApiUrl } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'

export default function AdminScreen() {
  const colors = useAppTheme()
  const { session, loading, isAdmin } = useAuth()
  const webViewRef = useRef<WebView>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [pageError, setPageError] = useState('')

  if (!loading && (!session || !isAdmin)) {
    return <Redirect href="/(tabs)" />
  }

  const adminSessionUrl = new URL('/api/admin/mobile-session', webApiUrl)
  const allowedOrigin = new URL(webApiUrl).origin

  function closeAdmin() {
    if (canGoBack) {
      webViewRef.current?.goBack()
      return
    }

    router.back()
  }

  function handleNavigation(request: WebViewNavigation) {
    if (request.url.startsWith(allowedOrigin)) return true

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
      <View
        style={{
          minHeight: 54,
          paddingHorizontal: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.separator,
          backgroundColor: colors.surfaceStrong,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canGoBack ? '관리자 이전 화면' : '관리자 화면 닫기'}
          onPress={closeAdmin}
          style={{ minWidth: 64, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.brand, fontSize: 15, fontWeight: '700' }}>{canGoBack ? '‹ 이전' : '닫기'}</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>관리자 센터</Text>
        <View style={{ width: 64 }} />
      </View>

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
          ref={webViewRef}
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
          onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
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
