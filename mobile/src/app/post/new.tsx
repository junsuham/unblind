import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen } from '@/components/Screen'
import { PageTitle } from '@/components/PageTitle'
import { boardInfo } from '@/constants/content'
import { radius, useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'
import { PraiseMentionInput } from '@/components/PraiseMentionInput'
import type { ContentMention } from '@/lib/praiseMention'
import { Emoji3D } from '@/components/Emoji3D'

export default function NewPostScreen() {
  const colors = useAppTheme()
  const params = useLocalSearchParams<{ board?: string }>()
  const [board, setBoard] = useState<keyof typeof boardInfo>((params.board as keyof typeof boardInfo) || 'prayer')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mentions, setMentions] = useState<ContentMention[]>([])
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (title.trim().length < 2 || content.trim().length < 5) {
      Alert.alert('글을 확인해주세요', '제목은 2자, 내용은 5자 이상 입력해주세요.')
      return
    }
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')
      const tagList = tags.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean).slice(0, 5)
      const { data, error } = await supabase.from('posts').insert({ board, title: title.trim(), content: content.trim(), tags: tagList, mentions, status: 'visible', author_user_id: user.id }).select('id').single()
      if (error) throw error
      router.replace(`/post/${data.id}`)
    } catch (error) {
      Alert.alert('글을 등록할 수 없습니다', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.')
    } finally { setLoading(false) }
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}><Text style={{ color: colors.brand, fontWeight: '700' }}>‹ 돌아가기</Text></Pressable>
      <PageTitle title="새 글 작성" description="개인을 특정할 수 있는 이름, 연락처, SNS 정보는 적지 마세요." />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {(Object.keys(boardInfo) as (keyof typeof boardInfo)[]).map((key) => <Pressable key={key} onPress={() => setBoard(key)} style={{ flex: 1, minHeight: 48, borderRadius: radius.small, backgroundColor: board === key ? colors.brand : colors.surface, alignItems: 'center', justifyContent: 'center' }}><View style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}><Emoji3D name={boardInfo[key].icon} size={18} /><Text style={{ color: board === key ? '#FFFFFF' : colors.text, fontWeight: '700', fontSize: 12 }}>{boardInfo[key].title}</Text></View></Pressable>)}
      </View>
      <TextInput value={title} onChangeText={setTitle} maxLength={80} placeholder="제목" placeholderTextColor={colors.textTertiary} style={{ minHeight: 52, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.text, fontWeight: '700' }} />
      <PraiseMentionInput value={content} onChangeText={setContent} mentions={mentions} onMentionsChange={setMentions} maxLength={3000} placeholder="내용을 입력해주세요. @를 입력하면 찬양이나 위치를 태그할 수 있어요." placeholderTextColor={colors.textTertiary} multiline textAlignVertical="top" style={{ minHeight: 220, borderRadius: radius.medium, backgroundColor: colors.surface, padding: 16, color: colors.text, marginTop: 12, lineHeight: 22 }} />
      <TextInput value={tags} onChangeText={setTags} placeholder="태그 (선택, 쉼표로 구분)" placeholderTextColor={colors.textTertiary} style={{ minHeight: 50, borderRadius: radius.medium, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.text, marginTop: 12 }} />
      <Pressable disabled={loading} onPress={submit} style={{ minHeight: 54, borderRadius: radius.medium, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 16, opacity: loading ? 0.65 : 1 }}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>등록하기</Text>}
      </Pressable>
    </Screen>
  )
}
