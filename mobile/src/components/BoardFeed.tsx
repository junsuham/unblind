import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { PageTitle } from '@/components/PageTitle'
import { Emoji3D } from '@/components/Emoji3D'
import { boardInfo } from '@/constants/content'
import { radius, useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'
import { reportMobileEvent } from '@/lib/telemetry'
import { UrgentPrayerBadge } from '@/components/UrgentPrayerBadge'
import { isUrgentPrayerPost } from '@/lib/urgentPrayer'

type BoardSlug = keyof typeof boardInfo
type Post = {
  id: string
  author_user_id: string | null
  title: string
  content: string
  created_at: string
  view_count: number
  tags: string[] | null
  comments: { count: number }[]
  reactions: { type: 'pray' | 'empathize' }[]
}

type PostCursor = { createdAt: string }

const PAGE_SIZE = 20

export function BoardFeed({ slug, showBack = false }: { slug: BoardSlug; showBack?: boolean }) {
  const colors = useAppTheme()
  const board = boardInfo[slug]
  const [posts, setPosts] = useState<Post[]>([])
  const [draftQuery, setDraftQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<PostCursor | null>(null)
  const [error, setError] = useState('')

  const loadPage = useCallback(async (reset: boolean) => {
    const startedAt = Date.now()
    if (reset) setLoading(true)
    else setLoadingMore(true)
    setError('')

    const pageCursor = reset ? null : cursor
    let request = supabase
      .from('posts')
      .select('id, author_user_id, title, content, created_at, view_count, tags, comments(count), reactions(type)')
      .eq('board', slug)
      .eq('status', 'visible')
    const safeQuery = activeQuery.trim().replace(/[,%()]/g, ' ')
    if (safeQuery) request = request.or(`title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
    if (pageCursor) request = request.lt('created_at', pageCursor.createdAt)

    try {
      const [{ data, error: postsError }, { data: blockedRows, error: blocksError }] = await Promise.all([
        request.order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('user_blocks').select('blocked_user_id'),
      ])

      if (postsError || blocksError) throw postsError ?? blocksError

      const blockedIds = new Set((blockedRows ?? []).map((item) => item.blocked_user_id))
      const nextPosts = ((data as Post[] | null) ?? []).filter(
        (post) => !post.author_user_id || !blockedIds.has(post.author_user_id)
      )

      setPosts((current) => {
        if (reset) return nextPosts
        const existing = new Set(current.map((post) => post.id))
        return [...current, ...nextPosts.filter((post) => !existing.has(post.id))]
      })
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
      const lastPost = data?.at(-1)
      setCursor(lastPost ? { createdAt: lastPost.created_at } : null)
      reportMobileEvent({
        name: 'mobile.board_loaded',
        route: `/board/${slug}`,
        metadata: { durationMs: Date.now() - startedAt, count: nextPosts.length, reset },
      })
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '게시글을 불러오지 못했습니다.'
      setError('게시글을 불러오지 못했습니다. 연결을 확인하고 다시 시도해주세요.')
      reportMobileEvent({ name: 'mobile.board_load_failed', severity: 'warning', message, route: `/board/${slug}` })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeQuery, cursor, slug])

  useEffect(() => {
    // Initial and search-result remote hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(true)
  }, [activeQuery, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  function search() {
    const nextQuery = draftQuery.trim()
    if (nextQuery === activeQuery) loadPage(true)
    else setActiveQuery(nextQuery)
  }

  return (
    <>
      {showBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="게시판 목록으로 돌아가기" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.brand, fontWeight: '700' }}>‹ 게시판</Text>
        </Pressable>
      ) : null}

      <PageTitle title={board.title} icon={board.icon} description={board.description} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${board.title}에 글쓰기`}
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
          accessibilityLabel="게시글 검색어"
          value={draftQuery}
          onChangeText={setDraftQuery}
          onSubmitEditing={search}
          placeholder="제목과 내용 검색"
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          style={{ flex: 1, minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: 15, color: colors.text }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="게시글 검색" onPress={search} style={{ minWidth: 62, borderRadius: radius.medium, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.brand, fontWeight: '700' }}>검색</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator accessibilityLabel="게시글 불러오는 중" color={colors.brand} style={{ margin: 30 }} />
      ) : error ? (
        <View accessibilityLiveRegion="polite" style={{ borderRadius: 18, backgroundColor: colors.surfaceStrong, padding: 24, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => loadPage(true)} style={{ marginTop: 16, minHeight: 44, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 14, backgroundColor: colors.brand }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surfaceStrong }}>
          {posts.map((post, index) => {
            const likes = post.reactions?.filter((item) => item.type === 'empathize').length ?? 0
            const prayers = post.reactions?.filter((item) => item.type === 'pray').length ?? 0
            const comments = post.comments?.[0]?.count ?? 0
            const createdAt = new Date(post.created_at)
            const date = `${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}`
            const isUrgent = isUrgentPrayerPost(slug, post.tags)

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${post.title}, 조회 ${post.view_count ?? 0}, 댓글 ${comments}`}
                key={post.id}
                onPress={() => router.push(`/post/${post.id}`)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  borderBottomWidth: index === posts.length - 1 && !hasMore ? 0 : 1,
                  borderBottomColor: colors.separator,
                  backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong,
                })}
              >
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 7 }}>
                  {isUrgent ? <UrgentPrayerBadge compact /> : null}
                  <Text numberOfLines={1} style={{ color: colors.text, flex: 1, fontSize: 16, fontWeight: '700' }}>{post.title}</Text>
                </View>
                <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 5 }}>{post.content}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
                    <Text style={{ color: colors.textTertiary, fontSize: 12 }}>◉ {post.view_count ?? 0}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 12 }}>♡ {likes}</Text>
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 3 }}>
                      <Emoji3D name="prayer" size={17} />
                      <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{prayers}</Text>
                    </View>
                    <Text style={{ color: colors.textTertiary, fontSize: 12 }}>◯ {comments}</Text>
                  </View>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{date}</Text>
                </View>
              </Pressable>
            )
          })}
          {!posts.length ? <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, textAlign: 'center', padding: 34 }}>{activeQuery ? '검색 결과가 없습니다.' : '아직 글이 없습니다.'}</Text> : null}
          {hasMore ? (
            <Pressable accessibilityRole="button" accessibilityLabel="게시글 더 보기" disabled={loadingMore} onPress={() => loadPage(false)} style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center' }}>
              {loadingMore ? <ActivityIndicator color={colors.brand} /> : <Text style={{ color: colors.brand, fontWeight: '800' }}>더 보기</Text>}
            </Pressable>
          ) : null}
        </View>
      )}
    </>
  )
}
