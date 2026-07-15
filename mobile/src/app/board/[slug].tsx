import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen } from '@/components/Screen'
import { PageTitle } from '@/components/PageTitle'
import { boardInfo } from '@/constants/content'
import { colors, radius } from '@/constants/design'
import { supabase } from '@/lib/supabase'

type Post = { id: string; title: string; content: string; created_at: string; view_count: number; comments: { count: number }[]; reactions: { type: 'pray' | 'empathize' }[] }

export default function BoardDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const board = boardInfo[slug as keyof typeof boardInfo]
  const [posts, setPosts] = useState<Post[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!slug) return
    let request = supabase.from('posts').select('id, title, content, created_at, view_count, comments(count), reactions(type)').eq('board', slug).eq('status', 'visible')
    const safeQuery = query.trim().replace(/[,%()]/g, ' ')
    if (safeQuery) request = request.or(`title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
    const { data } = await request.order('created_at', { ascending: false }).limit(50)
    setPosts((data as Post[] | null) ?? [])
    setLoading(false)
  }, [query, slug])

  useEffect(() => {
    // Initial remote data hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (!board) return null

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}><Text style={{ color: colors.brand, fontWeight: '700' }}>‹ 게시판</Text></Pressable>
      <PageTitle title={board.title} description={board.description} />
      <Pressable onPress={() => router.push({ pathname: '/post/new', params: { board: slug } })} style={{ minHeight: 52, borderRadius: radius.medium, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>이 게시판에 글쓰기</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={load} placeholder="제목과 내용 검색" returnKeyType="search" style={{ flex: 1, minHeight: 48, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: 15, color: colors.text }} />
        <Pressable onPress={load} style={{ minWidth: 64, borderRadius: radius.medium, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text, fontWeight: '700' }}>검색</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.brand} style={{ margin: 30 }} /> : (
        <View style={{ borderRadius: radius.large, overflow: 'hidden', backgroundColor: colors.surface }}>
          {posts.map((post, index) => {
            const likes = post.reactions?.filter((item) => item.type === 'empathize').length ?? 0
            const prayers = post.reactions?.filter((item) => item.type === 'pray').length ?? 0
            return (
              <Pressable key={post.id} onPress={() => router.push(`/post/${post.id}`)} style={({ pressed }) => ({ padding: 16, borderBottomWidth: index === posts.length - 1 ? 0 : 1, borderBottomColor: colors.separator, backgroundColor: pressed ? colors.surfaceMuted : colors.surface })}>
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{post.title}</Text>
                <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 }}>{post.content}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 10 }}>◉ {post.view_count ?? 0}  ♡ {likes}  🙏 {prayers}  ◯ {post.comments?.[0]?.count ?? 0}</Text>
              </Pressable>
            )
          })}
          {!posts.length ? <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 34 }}>아직 글이 없습니다.</Text> : null}
        </View>
      )}
    </Screen>
  )
}
