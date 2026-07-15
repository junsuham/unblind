import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { colors, radius } from '@/constants/design'
import { bibleVerses, boardInfo } from '@/constants/content'
import { supabase } from '@/lib/supabase'

type PopularPost = { id: string; board: keyof typeof boardInfo; title: string; content: string; view_count: number; comments: { count: number }[] }

const verseIndex = Math.floor(Date.now() / 86_400_000) % bibleVerses.length

export default function HomeScreen() {
  const [posts, setPosts] = useState<PopularPost[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const verse = bibleVerses[verseIndex]

  const load = useCallback(async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase.from('posts').select('id, board, title, content, view_count, comments(count)').eq('status', 'visible').order('view_count', { ascending: false }).limit(5),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).is('read_at', null),
    ])
    setPosts((data as PopularPost[] | null) ?? [])
    setUnread(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Initial remote data hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <Screen>
      <View style={{ backgroundColor: colors.brand, marginHorizontal: -18, marginTop: -18, marginBottom: 18, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#111111', fontSize: 27, fontWeight: '900', letterSpacing: -1 }}>UNBLIND</Text>
        <Pressable onPress={() => router.push('/notifications')} style={{ minWidth: 44, height: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.brand, fontWeight: '800' }}>🔔 {unread || ''}</Text>
        </Pressable>
      </View>

      <Card>
        <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800' }}>오늘의 말씀</Text>
        <Text style={{ color: colors.text, fontSize: 17, lineHeight: 26, fontWeight: '600', marginTop: 12 }}>“{verse.text}”</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 12 }}>{verse.reference}</Text>
      </Card>

      <View style={{ marginTop: 24, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>인기글</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 11 }}>조회수 순</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.brand} style={{ margin: 30 }} /> : (
        <View style={{ borderRadius: radius.large, overflow: 'hidden', backgroundColor: colors.surface }}>
          {posts.map((post, index) => (
            <Pressable key={post.id} onPress={() => router.push(`/post/${post.id}`)} style={({ pressed }) => ({ padding: 16, borderBottomWidth: index === posts.length - 1 ? 0 : 1, borderBottomColor: colors.separator, backgroundColor: pressed ? colors.surfaceMuted : colors.surface })}>
              <Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{post.title}</Text>
              <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 5 }}>{boardInfo[post.board]?.title ?? '게시판'} · {post.content}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 9 }}>조회 {post.view_count ?? 0} · 댓글 {post.comments?.[0]?.count ?? 0}</Text>
            </Pressable>
          ))}
          {!posts.length ? <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 30 }}>아직 인기글이 없습니다.</Text> : null}
        </View>
      )}

      <Card style={{ marginTop: 22 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>오늘의 사용 원칙</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 }}>정답을 주기보다 들어주고, 판단하기보다 기도하며 안전하게 마음을 나눠주세요.</Text>
      </Card>
    </Screen>
  )
}
