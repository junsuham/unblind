import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { PageTitle } from '@/components/PageTitle'
import { radius, useAppTheme } from '@/constants/design'
import { authenticatedFetch } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'

type Church = { id: string; name: string; address: string; roadAddress: string; placeUrl?: string }
type Occupation = 'student' | 'worker' | 'other'

export default function ProfileSetupScreen() {
  const colors = useAppTheme()
  const { session, profileComplete, ageVerified, refreshProfile, signOut } = useAuth()
  const [occupation, setOccupation] = useState<Occupation | null>(null)
  const [churchQuery, setChurchQuery] = useState('')
  const [churches, setChurches] = useState<Church[]>([])
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  if (!session) return <Redirect href="/login" />
  if (profileComplete) return <Redirect href="/(tabs)" />

  if (!ageVerified) {
    return (
      <Screen>
        <PageTitle eyebrow="연령 확인" title="소셜 계정 확인이 필요합니다" description="직접 입력한 생년월일은 사용하지 않습니다. Google 또는 Kakao 계정이 제공한 정보로만 가입 연령을 확인합니다." />
        <Card style={{ gap: 14 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>다시 로그인해주세요</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21 }}>로그인할 때 생년월일 또는 출생 연도 제공에 동의하면 자동으로 확인됩니다.</Text>
          <Pressable onPress={signOut} style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.medium, backgroundColor: colors.brand }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>소셜 계정으로 다시 확인</Text>
          </Pressable>
        </Card>
      </Screen>
    )
  }

  async function searchChurches() {
    if (churchQuery.trim().length < 2) {
      Alert.alert('교회 검색', '교회 이름이나 지역을 2자 이상 입력해주세요.')
      return
    }

    try {
      setSearching(true)
      const response = await authenticatedFetch(`/api/churches/search?q=${encodeURIComponent(churchQuery.trim())}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setChurches(result.churches ?? [])
    } catch (error) {
      Alert.alert('검색할 수 없습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setSearching(false)
    }
  }

  async function saveProfile() {
    if (!selectedChurch || !occupation) {
      Alert.alert('정보를 확인해주세요', '출석 교회와 현재 상태를 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupation,
          churchPlaceId: selectedChurch.id,
          churchName: selectedChurch.name,
          churchAddress: selectedChurch.roadAddress || selectedChurch.address,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      await refreshProfile()
      router.replace('/(tabs)')
    } catch (error) {
      Alert.alert('가입을 완료할 수 없습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <PageTitle eyebrow="첫 가입 정보" title="프로필을 완성해주세요" description="앱 아이디는 성경 인물과 알파벳 조합으로 자동 생성됩니다." />
      <Card style={{ gap: 18 }}>
        <View>
          <Text style={{ color: colors.text, fontWeight: '800' }}>소셜 계정 연령 확인 완료</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 }}>가입 가능 연령인 20~59세로 확인했습니다. 생년월일은 다른 사용자에게 공개되지 않습니다.</Text>
        </View>

        <View>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>출석하는 교회</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={churchQuery} onChangeText={setChurchQuery} placeholder="교회 이름 또는 지역" placeholderTextColor={colors.textTertiary} style={{ flex: 1, minHeight: 50, borderRadius: radius.small, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, color: colors.text }} />
            <Pressable onPress={searchChurches} style={{ minWidth: 68, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small, backgroundColor: colors.brand }}>
              {searching ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>검색</Text>}
            </Pressable>
          </View>
          <View style={{ gap: 8, marginTop: 10 }}>
            {churches.map((church) => (
              <Pressable key={church.id} onPress={() => setSelectedChurch(church)} style={{ padding: 12, borderRadius: radius.small, borderWidth: 1.5, borderColor: selectedChurch?.id === church.id ? colors.brand : colors.separator, backgroundColor: selectedChurch?.id === church.id ? colors.brandSoft : colors.surface }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{church.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{church.roadAddress || church.address}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>현재 상태</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([['student', '학생'], ['worker', '직장인'], ['other', '기타']] as const).map(([value, label]) => (
              <Pressable key={value} onPress={() => setOccupation(value)} style={{ flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small, backgroundColor: occupation === value ? colors.brand : colors.surfaceMuted }}>
                <Text style={{ color: occupation === value ? '#FFFFFF' : colors.text, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable disabled={loading} onPress={saveProfile} style={{ minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radius.medium, backgroundColor: colors.brand, opacity: loading ? 0.65 : 1 }}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>가입 완료</Text>}
        </Pressable>
      </Card>
    </Screen>
  )
}
