import { useEffect, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { PageTitle } from '@/components/PageTitle'
import { colors, radius } from '@/constants/design'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

type Profile = { nickname: string; church_name: string; occupation: string }

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  useEffect(() => { if (session) supabase.from('user_profiles').select('nickname, church_name, occupation').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setProfile(data)) }, [session])
  const occupation = profile?.occupation === 'student' ? '학생' : profile?.occupation === 'worker' ? '직장인' : '기타'
  return (
    <Screen>
      <PageTitle eyebrow="나만 볼 수 있는 정보" title="내 정보" description="다른 사용자에게 교회와 이메일은 공개되지 않습니다." />
      <Card>
        <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800' }}>앱 아이디</Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8 }}>{profile?.nickname ?? '불러오는 중'}</Text>
        <View style={{ height: 1, backgroundColor: colors.separator, marginVertical: 18 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>출석 교회</Text>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 4 }}>{profile?.church_name ?? '-'}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 16 }}>현재 상태</Text>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 4 }}>{occupation}</Text>
      </Card>
      <Pressable onPress={() => Alert.alert('로그아웃', '로그아웃할까요?', [{ text: '취소', style: 'cancel' }, { text: '로그아웃', style: 'destructive', onPress: signOut }])} style={{ minHeight: 52, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginTop: 18 }}><Text style={{ color: colors.danger, fontWeight: '800' }}>로그아웃</Text></Pressable>
    </Screen>
  )
}
