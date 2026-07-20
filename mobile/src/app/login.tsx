import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import unblindWordmark from '../../assets/brand/unblind-wordmark-glass-v2.png'
import { useAuth } from '@/providers/AuthProvider'
import { AppBootstrapScreen } from '@/components/AppBootstrapScreen'
import { radius, useAppTheme } from '@/constants/design'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function LoginScreen() {
  const colors = useAppTheme()
  const { session, loading, signIn } = useAuth()
  const [pending, setPending] = useState<'google' | null>(null)

  if (loading) return <AppBootstrapScreen />
  if (session) return <Redirect href="/" />

  async function handleLogin(provider: 'google') {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: colors.logoSurface, alignItems: 'center', paddingBottom: 10 }}>
          <Image source={unblindWordmark} alt="언블라인드 로고" accessibilityLabel="언블라인드 로고" style={{ width: 270, height: 90, opacity: 0.97, shadowColor: '#4A1000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.14, shadowRadius: 1 }} resizeMode="contain" />
        </View>

        <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
          <Text style={{ color: colors.textOnBrandSecondary, fontSize: 12, fontWeight: '700' }}>청년회 내부 베타</Text>
          <Text style={{ color: colors.textOnBrand, fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 }}>Google 계정으로 시작하기</Text>
          <Text style={{ color: colors.textOnBrandSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 }}>Google 계정의 출생연도 확인과 운영자 승인을 마친 청년회 구성원만 입장할 수 있습니다.</Text>

          <View style={{ gap: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 28, marginTop: 20, padding: 18 }}>
            <Pressable
              disabled={Boolean(pending)}
              onPress={() => handleLogin('google')}
              style={({ pressed }) => ({ minHeight: 56, borderRadius: radius.medium, backgroundColor: pressed ? '#F2F2F2' : '#FFFFFF', borderWidth: 1, borderColor: '#D1D1D6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, opacity: pending ? 0.7 : 1 })}
            >
              {pending === 'google' ? <ActivityIndicator color="#111111" /> : <Text style={{ fontSize: 20, fontWeight: '800', color: '#4285F4' }}>G</Text>}
              <Text style={{ color: '#111111', fontSize: 16, fontWeight: '700' }}>Google로 계속하기</Text>
            </Pressable>

          </View>

          <View style={{ marginTop: 14, borderRadius: 22, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 17 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>익명성 안내</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 7 }}>다른 사용자에게 소셜 계정 정보와 이메일이 공개되지 않습니다. 운영자는 안전한 운영에 필요한 범위에서만 기록을 확인합니다.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
