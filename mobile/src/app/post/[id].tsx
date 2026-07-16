import * as SecureStore from 'expo-secure-store'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { radius, useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'
import { PraiseMentionInput } from '@/components/PraiseMentionInput'
import { PraiseMentionText } from '@/components/PraiseMentionText'
import type { ContentMention, PraiseMentionTrack } from '@/lib/praiseMention'

type Post = { id: string; board: string; title: string; content: string; mentions: ContentMention[] | null; created_at: string; view_count: number; tags: string[] | null }
type Comment = { id: string; content: string; mentions: ContentMention[] | null; created_at: string }
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
    const [{ data: postData }, { data: commentData }, { data: reactions }, { data: trackData }] = await Promise.all([
      supabase.from('posts').select('id, board, title, content, mentions, created_at, view_count, tags').eq('id', id).eq('status', 'visible').single(),
      supabase.from('comments').select('id, content, mentions, created_at').eq('post_id', id).eq('status', 'visible').order('created_at'),
      supabase.from('reactions').select('type').eq('post_id', id),
      supabase.from('top100_tracks').select('youtube_id, title, artist').eq('is_active', true).order('rank').limit(100),
    ])
    setPost(postData)
    setComments(commentData ?? [])
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
  }

  async function addComment() {
    if (comment.trim().length < 2) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('comments').insert({ post_id: id, content: comment.trim(), mentions: commentMentions, status: 'visible', author_user_id: user.id })
    if (error) return Alert.alert('댓글을 등록하지 못했습니다', error.message)
    setComment('')
    setCommentMentions([])
    load()
  }

  if (loading) return <Screen><ActivityIndicator color={colors.brand} style={{ marginTop: 80 }} /></Screen>
  if (!post) return <Screen><Text style={{ color: colors.text }}>글을 찾을 수 없습니다.</Text></Screen>

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}><Text style={{ color: colors.brand, fontWeight: '700' }}>‹ 돌아가기</Text></Pressable>
      <Card>
        <Text style={{ color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '800' }}>{post.title}</Text>
        <Text style={{ color: colors.brand, fontSize: 14, fontWeight: '700', marginTop: 12 }}>익명</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 7 }}>{new Date(post.created_at).toLocaleDateString('ko-KR')} · 조회 {post.view_count ?? 0}</Text>
        <View style={{ height: 1, backgroundColor: colors.separator, marginVertical: 20 }} />
        <PraiseMentionText content={post.content} mentions={post.mentions} tracks={praiseTracks} style={{ color: colors.text, fontSize: 16, lineHeight: 26 }} />
        {post.tags?.length ? <Text style={{ color: colors.brand, fontSize: 13, marginTop: 20 }}>{post.tags.map((tag) => `#${tag}`).join('  ')}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 18, marginTop: 24 }}>
          <Pressable onPress={() => react('empathize')}><Text style={{ color: colors.textSecondary, fontSize: 15 }}>♡ {counts.empathize}</Text></Pressable>
          <Pressable onPress={() => react('pray')}><Text style={{ color: colors.textSecondary, fontSize: 15 }}>🙏 {counts.pray}</Text></Pressable>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>◯ {comments.length}</Text>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <PraiseMentionInput value={comment} onChangeText={setComment} mentions={commentMentions} onMentionsChange={setCommentMentions} maxLength={1000} placeholder="댓글 또는 @ 찬양·위치" placeholderTextColor={colors.textTertiary} containerStyle={{ flex: 1 }} style={{ minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: 15, color: colors.text }} />
        <Pressable onPress={addComment} style={{ minWidth: 64, borderRadius: radius.medium, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>등록</Text></Pressable>
      </View>
      <View style={{ gap: 10, marginTop: 18 }}>
        {comments.map((item) => <Card key={item.id} style={{ padding: 15 }}><PraiseMentionText content={item.content} mentions={item.mentions} tracks={praiseTracks} style={{ color: colors.text, fontSize: 14, lineHeight: 21 }} /><Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>{new Date(item.created_at).toLocaleDateString('ko-KR')}</Text></Card>)}
      </View>
    </Screen>
  )
}
