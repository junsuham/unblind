import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '@/components/Screen'
import { PageTitle } from '@/components/PageTitle'
import { radius, useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'

type Notification = { id: string; title: string; body: string | null; href: string | null; created_at: string; read_at: string | null }

export default function NotificationsScreen() {
  const colors = useAppTheme()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('id, title, body, href, created_at, read_at').order('created_at', { ascending: false }).limit(50)
    setItems(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => {
    // Initial remote data hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
    load()
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <PageTitle title="알림" description="댓글, 공감, 기도와 마니또 소식을 확인하세요." />
        <Pressable onPress={markAllRead}><Text style={{ color: colors.brand, fontSize: 12, fontWeight: '700' }}>모두 읽음</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.brand} /> : <View style={{ gap: 10 }}>{items.map((item) => <Pressable key={item.id} onPress={() => item.href?.startsWith('/post/') && router.push(item.href as `/post/${string}`)} style={{ borderRadius: radius.medium, backgroundColor: item.read_at ? colors.surface : colors.brandSoft, padding: 16 }}><Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{item.title}</Text>{item.body ? <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 }}>{item.body}</Text> : null}<Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>{new Date(item.created_at).toLocaleString('ko-KR')}</Text></Pressable>)}{!items.length ? <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 30 }}>새 알림이 없습니다.</Text> : null}</View>}
    </Screen>
  )
}
