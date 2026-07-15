import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { PageTitle } from '@/components/PageTitle'
import { boardInfo } from '@/constants/content'
import { radius, useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'

type BoardSlug = keyof typeof boardInfo
type Post = {
  id: string
  title: string
  content: string
  created_at: string
  view_count: number
  comments: { count: number }[]
  reactions: { type: 'pray' | 'empathize' }[]
}

export function BoardFeed({ slug, showBack = false }: { slug: BoardSlug; showBack?: boolean }) {
  const colors = useAppTheme()
  const board = boardInfo[slug]
  const [posts, setPosts] = useState<Post[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let request = supabase
      .from('posts')
      .select('id, title, content, created_at, view_count, comments(count), reactions(type)')
      .eq('board', slug)
      .eq('status', 'visible')
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

  return (
    <>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.textOnBrand, fontWeight: '700' }}>‹ 게시판</Text>
        </Pressable>
      ) : null}

      <PageTitle title={board.title} description={board.description} />

      <Pressable
        onPress={() => router.push({ pathname: '/post/new', params: { board: slug } })}
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: radius.medium,
          backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        })}
      >
        <Text style={{ color: colors.brand, fontWeight: '800', fontSize: 16 }}>이 게시판에 글쓰기</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={load}
          placeholder="제목과 내용 검색"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          style={{ flex: 1, minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: 15, color: colors.text }}
        />
        <Pressable onPress={load} style={{ minWidth: 62, borderRadius: radius.medium, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.brand, fontWeight: '700' }}>검색</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ margin: 30 }} />
      ) : (
        <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surfaceStrong }}>
          {posts.map((post, index) => {
            const likes = post.reactions?.filter((item) => item.type === 'empathize').length ?? 0
            const prayers = post.reactions?.filter((item) => item.type === 'pray').length ?? 0
            const comments = post.comments?.[0]?.count ?? 0
            const createdAt = new Date(post.created_at)
            const date = `${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}`

            return (
              <Pressable
                key={post.id}
                onPress={() => router.push(`/post/${post.id}`)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  borderBottomWidth: index === posts.length - 1 ? 0 : 1,
                  borderBottomColor: colors.separator,
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong,
                })}
              >
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{post.title}</Text>
                <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 5 }}>{post.content}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>◉ {post.view_count ?? 0}   ♡ {likes}   🙏 {prayers}   ◯ {comments}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{date}</Text>
                </View>
              </Pressable>
            )
          })}
          {!posts.length ? <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 34 }}>아직 글이 없습니다.</Text> : null}
        </View>
      )}
    </>
  )
}
