import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import unblindLogo from '../../assets/images/unblind-logo.png'
import { useAuth } from '@/providers/AuthProvider'
import { colors, radius } from '@/constants/design'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function LoginScreen() {
  const { session, signIn } = useAuth()
  const [pending, setPending] = useState<'google' | 'kakao' | null>(null)

  if (session) return <Redirect href="/" />

  async function handleLogin(provider: 'google' | 'kakao') {
    if (!isSupabaseConfigured) {
      Alert.alert('환경 설정이 필요합니다', 'mobile/.env.local에 Supabase 공개 키를 입력해주세요.')
      return
    }

    try {
      setPending(provider)
      await signIn(provider)
    } catch (error) {
      Alert.alert('로그인할 수 없습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setPending(null)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.brand }}>
      <View style={{ flex: 1, justifyContent: 'space-between', padding: 24 }}>
        <View style={{ alignItems: 'center', paddingTop: 28 }}>
          <Image source={unblindLogo} alt="언블라인드 로고" accessibilityLabel="언블라인드 로고" style={{ width: 154, height: 154 }} resizeMode="contain" />
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 18 }}>소셜 계정으로 시작하기</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontSize: 15, lineHeight: 22, marginTop: 10 }}>
            승인된 청년회 구성원만 입장할 수 있습니다.{`\n`}다른 사용자에게 이메일은 공개되지 않습니다.
          </Text>
        </View>

        <View style={{ gap: 12, backgroundColor: '#302521', borderRadius: 28, padding: 18 }}>
          <Pressable
            disabled={Boolean(pending)}
            onPress={() => handleLogin('google')}
            style={({ pressed }) => ({ minHeight: 56, borderRadius: radius.medium, backgroundColor: pressed ? '#F2F2F2' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, opacity: pending ? 0.7 : 1 })}
          >
            {pending === 'google' ? <ActivityIndicator color={colors.text} /> : <Text style={{ fontSize: 20, fontWeight: '800', color: '#4285F4' }}>G</Text>}
            <Text style={{ color: '#111111', fontSize: 16, fontWeight: '700' }}>Google로 계속하기</Text>
          </Pressable>

          <Pressable
            disabled={Boolean(pending)}
            onPress={() => handleLogin('kakao')}
            style={({ pressed }) => ({ minHeight: 56, borderRadius: radius.medium, backgroundColor: pressed ? '#F2D900' : colors.kakao, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, opacity: pending ? 0.7 : 1 })}
          >
            {pending === 'kakao' ? <ActivityIndicator color="#111111" /> : <Text style={{ fontSize: 20 }}>●</Text>}
            <Text style={{ color: '#111111', fontSize: 16, fontWeight: '700' }}>Kakao로 계속하기</Text>
          </Pressable>

          <Text style={{ color: 'rgba(255,255,255,0.62)', textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 4 }}>
            2026년도 기준 20세 이상 59세 이하만 가입할 수 있습니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
