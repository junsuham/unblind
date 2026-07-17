import * as Updates from 'expo-updates'
import { Component, ErrorInfo, PropsWithChildren } from 'react'
import { Pressable, Text, View } from 'react-native'
import { reportMobileEvent } from '@/lib/telemetry'

type State = { error: Error | null }

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App runtime error', { message: error.message, componentStack: info.componentStack })
    reportMobileEvent({
      name: 'mobile.error_boundary',
      severity: 'fatal',
      message: error.message,
      fingerprint: error.name,
      metadata: { componentStack: info.componentStack?.slice(0, 200) ?? null },
    })
  }

  private retry = async () => {
    if (Updates.isEnabled) {
      await Updates.reloadAsync()
      return
    }
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#140F0D' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }}>문제가 생겼어요</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22, marginTop: 12 }}>
          일시적인 오류일 수 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="앱 다시 불러오기" onPress={this.retry} style={{ minHeight: 52, borderRadius: 16, backgroundColor: '#FF4B22', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>앱 다시 불러오기</Text>
        </Pressable>
      </View>
    )
  }
}
