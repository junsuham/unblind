import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import unblindLogo from '../../../assets/brand/unblind-monogram-relief-v5.png'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { useAppTheme } from '@/constants/design'
import { bibleVerses, boardInfo } from '@/constants/content'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { Emoji3D } from '@/components/Emoji3D'
import { UrgentPrayerBadge } from '@/components/UrgentPrayerBadge'
import { isUrgentPrayerPost } from '@/lib/urgentPrayer'

type PopularPost = {
  id: string
  author_user_id: string | null
  board: keyof typeof boardInfo
  title: string
  content: string
  view_count: number
  tags: string[] | null
  comments: { count: number }[]
}

const verseIndex = Math.floor(Date.now() / 86_400_000) % bibleVerses.length

export default function HomeScreen() {
  const colors = useAppTheme()
  const { signOut, isAdmin } = useAuth()
  const [posts, setPosts] = useState<PopularPost[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const verse = bibleVerses[verseIndex]

  const load = useCallback(async () => {
    const [{ data }, { count }, { data: blockedRows }] = await Promise.all([
      supabase
        .from('posts')
        .select('id, author_user_id, board, title, content, view_count, tags, comments(count)')
        .eq('status', 'visible')
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null),
      supabase.from('user_blocks').select('blocked_user_id'),
    ])
    const blockedIds = new Set((blockedRows ?? []).map((item) => item.blocked_user_id))
    setPosts(((data as PopularPost[] | null) ?? []).filter((post) => !post.author_user_id || !blockedIds.has(post.author_user_id)).slice(0, 5))
    setUnread(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Initial remote data hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <Screen contentStyle={{ paddingTop: 0 }} showLogo={false}>
      <View
        style={{
          backgroundColor: colors.logoSurface,
          marginHorizontal: -18,
          marginBottom: 24,
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={() => router.replace('/')} accessibilityLabel="언블라인드 홈">
          <Image source={unblindLogo} alt="UNBLIND" accessibilityLabel="UNBLIND" style={{ width: 48, height: 48, tintColor: colors.logoInk }} resizeMode="contain" />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityLabel="알림 확인"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' }}
          >
            <SymbolView
              name="bell.fill"
              size={21}
              tintColor={colors.brand}
              fallback={<Emoji3D name="bell" size={22} />}
            />
            {unread > 0 ? (
              <View style={{ position: 'absolute', right: -1, top: -1, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>{Math.min(unread, 99)}</Text>
              </View>
            ) : null}
          </Pressable>
          {isAdmin ? (
            <Pressable
              accessibilityLabel="관리자 페이지 열기"
              onPress={() => router.push('/admin')}
              style={{ minHeight: 44, borderRadius: 22, backgroundColor: colors.surfaceStrong, justifyContent: 'center', paddingHorizontal: 12 }}
            >
              <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800' }}>관리자</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.push('/profile')} style={{ minHeight: 44, borderRadius: 22, backgroundColor: colors.surfaceStrong, justifyContent: 'center', paddingHorizontal: 13 }}>
            <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '700' }}>내 활동</Text>
          </Pressable>
          <Pressable onPress={signOut} style={{ minHeight: 44, borderRadius: 22, backgroundColor: colors.surfaceStrong, justifyContent: 'center', paddingHorizontal: 13 }}>
            <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '700' }}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <Card style={{ padding: 20 }}>
        <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800', letterSpacing: 0.7 }}>오늘의 말씀</Text>
        <Text style={{ color: colors.text, fontSize: 17, lineHeight: 26, marginTop: 13 }}>“{verse.text}”</Text>
        <View style={{ height: 1, backgroundColor: colors.separator, marginTop: 17, marginBottom: 13 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700' }}>{verse.reference}</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 10 }}>한국어 성경 1910 · Public Domain</Text>
        </View>
      </Card>

      <Text style={{ color: colors.textOnBrandSecondary, fontSize: 13, fontWeight: '700', marginTop: 28, marginBottom: 9, paddingHorizontal: 14 }}>인기글</Text>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ margin: 30 }} />
      ) : (
        <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surfaceStrong }}>
          {posts.map((post, index) => (
            <Pressable
              key={post.id}
              onPress={() => router.push(`/post/${post.id}`)}
              style={({ pressed }) => ({
                minHeight: 70,
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: index === posts.length - 1 ? 0 : 1,
                borderBottomColor: colors.separator,
                backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 7 }}>
                    {isUrgentPrayerPost(post.board, post.tags) ? <UrgentPrayerBadge compact /> : null}
                    <Text numberOfLines={1} style={{ color: colors.text, flex: 1, fontSize: 16, fontWeight: '700' }}>{post.title}</Text>
                  </View>
                  <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{boardInfo[post.board]?.title ?? '게시판'} · {post.content}</Text>
                </View>
                <Text style={{ color: colors.textTertiary, fontSize: 11 }}>조회 {post.view_count ?? 0} · 댓글 {post.comments?.[0]?.count ?? 0}  ›</Text>
              </View>
            </Pressable>
          ))}
          {!posts.length ? <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 34 }}>아직 인기글이 없습니다.</Text> : null}
        </View>
      )}

      <Card style={{ marginTop: 22, marginBottom: 10 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>오늘의 사용 원칙</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 8 }}>정답을 주기보다 들어주고, 판단하기보다 기도하고, 누군가를 특정하기보다 내 마음과 고민을 중심으로 나눠주세요.</Text>
      </Card>
    </Screen>
  )
}
