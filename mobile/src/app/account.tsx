import Constants from 'expo-constants'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Switch, Text, TextInput, View } from 'react-native'
import { Card } from '@/components/Card'
import { PageTitle } from '@/components/PageTitle'
import { Screen } from '@/components/Screen'
import { radius, useAppTheme } from '@/constants/design'
import { authenticatedFetch } from '@/lib/api'
import { registerForPushNotifications } from '@/lib/pushNotifications'
import { checkForAppUpdate, getUpdateStatus, reloadWithUpdate } from '@/lib/updates'
import { supabase } from '@/lib/supabase'

type Preferences = {
  push_enabled: boolean
  comments_enabled: boolean
  reactions_enabled: boolean
  manitto_enabled: boolean
  system_enabled: boolean
  quiet_start: string | null
  quiet_end: string | null
}

type Block = { blocked_user_id: string; created_at: string }
type Report = { id: string; reason: string; status: string; created_at: string; resolution_note: string | null }

const preferenceLabels: { key: keyof Pick<Preferences, 'comments_enabled' | 'reactions_enabled' | 'manitto_enabled' | 'system_enabled'>; label: string }[] = [
  { key: 'comments_enabled', label: '댓글과 답글' },
  { key: 'reactions_enabled', label: '공감과 기도' },
  { key: 'manitto_enabled', label: '마니또 소식' },
  { key: 'system_enabled', label: '운영 안내' },
]

const statusLabels: Record<string, string> = { pending: '확인 중', reviewed: '처리 완료', dismissed: '문제 없음' }

function compactTime(value: string | null) {
  return value?.slice(0, 5) ?? ''
}

export default function AccountScreen() {
  const colors = useAppTheme()
  const update = getUpdateStatus()
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/account/settings')
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '계정 설정을 불러오지 못했습니다.')
      setPreferences(result.preferences)
      setBlocks(result.blocks ?? [])
      setReports(result.reports ?? [])
    } catch (error) {
      Alert.alert('불러오지 못했습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial remote data hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function savePreferences(next = preferences) {
    if (!next) return
    setSaving(true)
    try {
      let values = next
      if (next.push_enabled) {
        const registration = await registerForPushNotifications(true)
        if (!registration.ok) {
          values = { ...next, push_enabled: false }
          setPreferences(values)
          Alert.alert('푸시 알림을 켤 수 없습니다', registration.reason)
        }
      }
      const response = await authenticatedFetch('/api/account/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '알림 설정을 저장하지 못했습니다.')
      setPreferences(result.preferences)
      Alert.alert('저장했습니다', '알림 설정이 반영되었습니다.')
    } catch (error) {
      Alert.alert('저장하지 못했습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  async function unblock(blockedUserId: string) {
    const response = await authenticatedFetch('/api/safety/blocks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedUserId }),
    })
    if (response.ok) setBlocks((current) => current.filter((item) => item.blocked_user_id !== blockedUserId))
    else Alert.alert('차단 해제 실패', '잠시 후 다시 시도해주세요.')
  }

  async function checkUpdate() {
    try {
      const result = await checkForAppUpdate()
      if (!result.available) return Alert.alert('앱 업데이트', result.reason)
      Alert.alert('업데이트 준비 완료', '앱을 다시 열어 새 버전을 적용할까요?', [
        { text: '나중에', style: 'cancel' },
        { text: '다시 열기', onPress: reloadWithUpdate },
      ])
    } catch {
      Alert.alert('업데이트 확인 실패', '네트워크 연결을 확인하고 다시 시도해주세요.')
    }
  }

  async function deleteAccount() {
    if (confirmation !== '탈퇴') return
    setDeleting(true)
    try {
      const response = await authenticatedFetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '계정을 삭제하지 못했습니다.')
      await supabase.auth.signOut()
      router.replace('/login')
    } catch (error) {
      Alert.alert('계정을 삭제하지 못했습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ minHeight: 40, justifyContent: 'center' }}><Text style={{ color: colors.brand, fontWeight: '700' }}>‹ 내 정보</Text></Pressable>
      <PageTitle title="계정 관리" description="알림, 차단, 신고 처리와 개인정보를 관리합니다." />
      {loading || !preferences ? <ActivityIndicator color={colors.brand} /> : (
        <>
          <Card>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>앱 업데이트</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 }}>버전 {Constants.expoConfig?.version ?? '-'} · {update.channel}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>런타임 {update.runtimeVersion} · {update.embedded ? '설치 버전' : '업데이트 버전'}</Text>
            <Pressable onPress={checkUpdate} style={{ minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginTop: 14 }}><Text style={{ color: colors.brand, fontWeight: '800' }}>업데이트 확인</Text></Pressable>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>휴대폰 알림</Text><Switch value={preferences.push_enabled} onValueChange={(value) => setPreferences({ ...preferences, push_enabled: value })} trackColor={{ true: colors.brand }} /></View>
            {preferenceLabels.map((item) => <View key={item.key} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.separator }}><Text style={{ color: colors.text, fontSize: 14 }}>{item.label}</Text><Switch value={preferences[item.key]} onValueChange={(value) => setPreferences({ ...preferences, [item.key]: value })} trackColor={{ true: colors.brand }} /></View>)}
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 12 }}>방해 금지 시간 · 24시간 형식</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}><TextInput value={compactTime(preferences.quiet_start)} onChangeText={(value) => setPreferences({ ...preferences, quiet_start: value || null })} placeholder="22:00" placeholderTextColor={colors.textTertiary} style={{ flex: 1, minHeight: 44, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted, color: colors.text, textAlign: 'center' }} /><Text style={{ color: colors.textSecondary }}>~</Text><TextInput value={compactTime(preferences.quiet_end)} onChangeText={(value) => setPreferences({ ...preferences, quiet_end: value || null })} placeholder="08:00" placeholderTextColor={colors.textTertiary} style={{ flex: 1, minHeight: 44, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted, color: colors.text, textAlign: 'center' }} /></View>
            <Pressable disabled={saving} onPress={() => savePreferences()} style={{ minHeight: 48, borderRadius: radius.medium, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 14 }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{saving ? '저장 중...' : '알림 설정 저장'}</Text></Pressable>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>차단한 사용자 · {blocks.length}</Text>
            {blocks.map((item, index) => <View key={item.blocked_user_id} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.separator }}><Text style={{ color: colors.textSecondary, fontSize: 13 }}>차단한 사용자 {blocks.length - index}</Text><Pressable onPress={() => unblock(item.blocked_user_id)}><Text style={{ color: colors.brand, fontSize: 13, fontWeight: '700' }}>차단 해제</Text></Pressable></View>)}
            {!blocks.length ? <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>차단한 사용자가 없습니다.</Text> : null}
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>내 신고 처리 현황</Text>
            {reports.slice(0, 5).map((item) => <View key={item.id} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.separator }}><Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{statusLabels[item.status] ?? item.status}</Text><Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{new Date(item.created_at).toLocaleDateString('ko-KR')}{item.resolution_note ? ` · ${item.resolution_note}` : ''}</Text></View>)}
            {!reports.length ? <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>접수한 신고가 없습니다.</Text> : null}
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>정책과 개인정보</Text>
            {[['community', '커뮤니티 운영정책'], ['privacy', '개인정보처리방침'], ['terms', '이용약관']].map(([type, label]) => <Pressable key={type} onPress={() => router.push({ pathname: '/policy/[type]', params: { type } } as never)} style={{ minHeight: 50, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.separator }}><Text style={{ color: colors.brand, fontSize: 14, fontWeight: '700' }}>{label}  ›</Text></Pressable>)}
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: colors.danger, fontSize: 17, fontWeight: '800' }}>계정 삭제</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 }}>로그인·프로필 정보는 삭제되고, 작성한 글과 댓글은 작성자를 알 수 없는 상태로 남습니다.</Text>
            {showDelete ? <><TextInput value={confirmation} onChangeText={setConfirmation} placeholder="탈퇴 입력" placeholderTextColor={colors.textTertiary} style={{ minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted, color: colors.text, paddingHorizontal: 14, marginTop: 12 }} /><Pressable disabled={deleting || confirmation !== '탈퇴'} onPress={deleteAccount} style={{ minHeight: 48, borderRadius: radius.medium, backgroundColor: confirmation === '탈퇴' ? colors.danger : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}><Text style={{ color: confirmation === '탈퇴' ? '#FFFFFF' : colors.textTertiary, fontWeight: '800' }}>{deleting ? '삭제 중...' : '계정 영구 삭제'}</Text></Pressable></> : <Pressable onPress={() => setShowDelete(true)} style={{ minHeight: 46, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}><Text style={{ color: colors.danger, fontWeight: '800' }}>계정 삭제 시작</Text></Pressable>}
          </Card>
        </>
      )}
    </Screen>
  )
}
