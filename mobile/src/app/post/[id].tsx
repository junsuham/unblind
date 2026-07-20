import * as SecureStore from 'expo-secure-store'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { radius, useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'
import { authenticatedFetch } from '@/lib/api'
import { PraiseMentionInput } from '@/components/PraiseMentionInput'
import { PraiseMentionText } from '@/components/PraiseMentionText'
import { Emoji3D } from '@/components/Emoji3D'
import type { ContentMention, PraiseMentionTrack } from '@/lib/praiseMention'
import { UrgentPrayerBadge } from '@/components/UrgentPrayerBadge'
import { getVisiblePostTags, isUrgentPrayerPost } from '@/lib/urgentPrayer'

type Post = { id: string; author_user_id: string | null; board: string; title: string; content: string; mentions: ContentMention[] | null; created_at: string; view_count: number; tags: string[] | null }
type Comment = { id: string; author_user_id: string | null; content: string; mentions: ContentMention[] | null; created_at: string }
type ReactionType = 'pray' | 'empathize'

async function getActorKey() {
  const saved = await SecureStore.getItemAsync('unblind_actor_key')
  if (saved) return saved
  const created = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  await SecureStore.setItemAsync('unblind_actor_key', created)
  return created
}

export default function PostDetailScreen() {
  const colors = useAppTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [counts, setCounts] = useState({ pray: 0, empathize: 0 })
  const [praiseTracks, setPraiseTracks] = useState<PraiseMentionTrack[]>([])
  const [comment, setComment] = useState('')
  const [commentMentions, setCommentMentions] = useState<ContentMention[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    const [{ data: postData }, { data: commentData }, { data: reactions }, { data: trackData }, { data: blockedRows }] = await Promise.all([
      supabase.from('posts').select('id, author_user_id, board, title, content, mentions, created_at, view_count, tags').eq('id', id).eq('status', 'visible').single(),
      supabase.from('comments').select('id, author_user_id, content, mentions, created_at').eq('post_id', id).eq('status', 'visible').order('created_at'),
      supabase.from('reactions').select('type').eq('post_id', id),
      supabase.from('top100_tracks').select('youtube_id, title, artist').eq('is_active', true).order('rank').limit(100),
      supabase.from('user_blocks').select('blocked_user_id'),
    ])
    const blockedIds = new Set((blockedRows ?? []).map((item) => item.blocked_user_id))
    setPost(postData?.author_user_id && blockedIds.has(postData.author_user_id) ? null : postData)
    setComments((commentData ?? []).filter((item) => !item.author_user_id || !blockedIds.has(item.author_user_id)))
    setCounts({ pray: reactions?.filter((item) => item.type === 'pray').length ?? 0, empathize: reactions?.filter((item) => item.type === 'empathize').length ?? 0 })
    setPraiseTracks(trackData ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    // Initial remote data hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function react(type: ReactionType) {
    const actorKey = await getActorKey()
    const { error } = await supabase.from('reactions').upsert({ post_id: id, actor_key: actorKey, type }, { onConflict: 'post_id,actor_key,type', ignoreDuplicates: true })
    if (error) return Alert.alert('반응을 남기지 못했습니다', error.message)
    setCounts((current) => ({ ...current, [type]: current[type] + 1 }))
    authenticatedFetch('/api/push/dispatch', { method: 'POST' }).catch(() => undefined)
  }

  async function addComment() {
    if (comment.trim().length < 2) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('comments').insert({ post_id: id, content: comment.trim(), mentions: commentMentions, status: 'visible', author_user_id: user.id })
    if (error) return Alert.alert('댓글을 등록하지 못했습니다', error.message)
    setComment('')
    setCommentMentions([])
    authenticatedFetch('/api/push/dispatch', { method: 'POST' }).catch(() => undefined)
    load()
  }

  function report(targetType: 'post' | 'comment', targetId: string) {
    async function submit(reason: string) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('reports').insert({
        target_type: targetType,
        target_id: targetId,
        reporter_actor_key: user.id,
        reporter_user_id: user.id,
        reporter_email: user.email ?? null,
        reason,
        status: 'pending',
      })
      Alert.alert(error?.code === '23505' ? '이미 신고했습니다' : error ? '신고하지 못했습니다' : '신고를 접수했습니다', error ? error.message : '운영자가 확인한 뒤 처리 결과를 알려드립니다.')
    }
    Alert.alert('신고 사유', '가장 가까운 사유를 선택해주세요.', [
      { text: '개인정보 노출', onPress: () => submit('personal_info') },
      { text: '공격·비난', onPress: () => submit('attack') },
      { text: '스팸', onPress: () => submit('spam') },
      { text: '취소', style: 'cancel' },
    ])
  }

  function blockUser(blockedUserId: string, leavePage = false) {
    Alert.alert('사용자 차단', '이 사용자의 글과 댓글을 내 화면에서 숨길까요?', [
      { text: '취소', style: 'cancel' },
      { text: '차단', style: 'destructive', onPress: async () => {
        const response = await authenticatedFetch('/api/safety/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockedUserId }),
        })
        if (!response.ok) return Alert.alert('차단하지 못했습니다', '잠시 후 다시 시도해주세요.')
        if (leavePage) router.back()
        else load()
      } },
    ])
  }

  if (loading) return <Screen><ActivityIndicator color={colors.brand} style={{ marginTop: 80 }} /></Screen>
  if (!post) return <Screen><Text style={{ color: colors.text }}>글을 찾을 수 없습니다.</Text></Screen>

  const isUrgent = isUrgentPrayerPost(post.board, post.tags)
  const visibleTags = getVisiblePostTags(post.tags)

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><Pressable onPress={() => router.back()}><Text style={{ color: colors.brand, fontWeight: '700' }}>‹ 돌아가기</Text></Pressable><View style={{ flexDirection: 'row', gap: 14 }}><Pressable onPress={() => report('post', post.id)}><Text style={{ color: colors.textTertiary, fontSize: 12 }}>신고</Text></Pressable>{post.author_user_id ? <Pressable onPress={() => blockUser(post.author_user_id!, true)}><Text style={{ color: colors.danger, fontSize: 12 }}>사용자 차단</Text></Pressable> : null}</View></View>
      <Card>
        {isUrgent ? <View style={{ marginBottom: 12 }}><UrgentPrayerBadge /></View> : null}
        <Text style={{ color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '800' }}>{post.title}</Text>
        <Text style={{ color: colors.brand, fontSize: 14, fontWeight: '700', marginTop: 12 }}>익명</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 7 }}>{new Date(post.created_at).toLocaleDateString('ko-KR')} · 조회 {post.view_count ?? 0}</Text>
        <View style={{ height: 1, backgroundColor: colors.separator, marginVertical: 20 }} />
        <PraiseMentionText content={post.content} mentions={post.mentions} tracks={praiseTracks} style={{ color: colors.text, fontSize: 16, lineHeight: 26 }} />
        {visibleTags.length ? <Text style={{ color: colors.brand, fontSize: 13, marginTop: 20 }}>{visibleTags.map((tag) => `#${tag}`).join('  ')}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 18, marginTop: 24 }}>
          <Pressable onPress={() => react('empathize')}><Text style={{ color: colors.textSecondary, fontSize: 15 }}>♡ {counts.empathize}</Text></Pressable>
          <Pressable accessibilityLabel={`기도 ${counts.pray}`} onPress={() => react('pray')} style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}><Emoji3D name="prayer" size={21} /><Text style={{ color: colors.textSecondary, fontSize: 15 }}>{counts.pray}</Text></Pressable>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>◯ {comments.length}</Text>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <PraiseMentionInput value={comment} onChangeText={setComment} mentions={commentMentions} onMentionsChange={setCommentMentions} maxLength={1000} placeholder="댓글 또는 @ 찬양·위치" placeholderTextColor={colors.textTertiary} containerStyle={{ flex: 1 }} style={{ minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: 15, color: colors.text }} />
        <Pressable onPress={addComment} style={{ minWidth: 64, borderRadius: radius.medium, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>등록</Text></Pressable>
      </View>
      <View style={{ gap: 10, marginTop: 18 }}>
        {comments.map((item) => <Card key={item.id} style={{ padding: 15 }}><View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginBottom: 8 }}><Pressable onPress={() => report('comment', item.id)}><Text style={{ color: colors.textTertiary, fontSize: 11 }}>신고</Text></Pressable>{item.author_user_id ? <Pressable onPress={() => blockUser(item.author_user_id!)}><Text style={{ color: colors.danger, fontSize: 11 }}>차단</Text></Pressable> : null}</View><PraiseMentionText content={item.content} mentions={item.mentions} tracks={praiseTracks} style={{ color: colors.text, fontSize: 14, lineHeight: 21 }} /><Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>{new Date(item.created_at).toLocaleDateString('ko-KR')}</Text></Card>)}
      </View>
    </Screen>
  )
}
