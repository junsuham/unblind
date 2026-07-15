import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { PageTitle } from '@/components/PageTitle'
import { colors, radius } from '@/constants/design'
import { authenticatedFetch } from '@/lib/api'

type Manitto = {
  joined: boolean
  isActive: boolean
  participantCount: number
  recipientNickname: string | null
  startsOn: string
  endsOn: string
  receivedMessages: { id: string; body: string; createdAt: string }[]
}

export default function ManittoScreen() {
  const [data, setData] = useState<Manitto | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const response = await authenticatedFetch('/api/manitto')
    const result = await response.json()
    if (response.ok) setData(result)
    setLoading(false)
  }, [])
  useEffect(() => {
    // Initial remote data hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function action(name: 'join' | 'leave' | 'message') {
    const response = await authenticatedFetch('/api/manitto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name, message }) })
    const result = await response.json()
    if (!response.ok) return Alert.alert('처리할 수 없습니다', result.error)
    setMessage('')
    load()
  }

  return (
    <Screen>
      <PageTitle eyebrow="한 주 동안 조용히 응원해요" title="🎁 마니또" description="매주 한 명의 익명 친구를 배정받아 기도와 작은 실천으로 응원합니다." />
      {loading ? <ActivityIndicator color={colors.brand} /> : !data?.joined ? (
        <Card>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>이번 주 마니또에 참여할까요?</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 }}>참여한 구성원끼리 익명으로 연결됩니다.</Text>
          <Pressable onPress={() => action('join')} style={{ minHeight: 50, borderRadius: radius.medium, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 18 }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>참여하기</Text></Pressable>
        </Card>
      ) : (
        <View style={{ gap: 14 }}>
          <Card>
            <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800' }}>내가 응원할 마니또</Text>
            <Text style={{ color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 8 }}>{data.recipientNickname ?? (data.isActive ? '배정 대기 중' : '운영 시작 전')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>참여 {data.participantCount}명 · {data.startsOn} ~ {data.endsOn}</Text>
            {data.recipientNickname ? <><TextInput value={message} onChangeText={setMessage} maxLength={300} placeholder="익명 응원 쪽지" multiline style={{ minHeight: 84, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted, padding: 14, color: colors.text, marginTop: 18 }} /><Pressable onPress={() => action('message')} style={{ minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>익명으로 보내기</Text></Pressable></> : null}
          </Card>
          {data.receivedMessages.length ? <View><Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>받은 응원 쪽지</Text>{data.receivedMessages.map((item) => <Card key={item.id} style={{ marginBottom: 8, padding: 15 }}><Text style={{ color: colors.text, lineHeight: 21 }}>{item.body}</Text></Card>)}</View> : null}
          <Pressable onPress={() => action('leave')} style={{ minHeight: 46, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textTertiary, fontWeight: '700' }}>이번 주 참여 취소</Text></Pressable>
        </View>
      )}
    </Screen>
  )
}
