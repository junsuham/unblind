import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleProp, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native'
import { useAppTheme } from '@/constants/design'
import { authenticatedFetch } from '@/lib/api'
import {
  LOCATION_MENTION_PREFIX,
  PRAISE_MENTION_PREFIX,
  getActiveMention,
  getLocationMentionLabel,
  getPraiseMentionLabel,
  keepPresentMentions,
  type ContentMention,
} from '@/lib/praiseMention'

type YouTubeResult = { youtubeId: string; title: string; channelTitle: string }
type LocationResult = { id: string; name: string; address: string }

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> & {
  value: string
  onChangeText: (value: string) => void
  mentions: ContentMention[]
  onMentionsChange: (mentions: ContentMention[]) => void
  containerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<TextStyle>
}

export function PraiseMentionInput({ value, onChangeText, mentions, onMentionsChange, maxLength = 2000, containerStyle, style, ...props }: Props) {
  const colors = useAppTheme()
  const inputRef = useRef<TextInput>(null)
  const [selection, setSelection] = useState({ start: value.length, end: value.length })
  const [searchState, setSearchState] = useState<{ kind: 'praise' | 'location'; query: string; videos: YouTubeResult[]; locations: LocationResult[]; message: string } | null>(null)
  const activeMention = getActiveMention(value, selection.start)
  const activeKind = activeMention?.kind
  const activeQuery = activeMention?.query ?? ''

  useEffect(() => {
    if (activeKind !== 'praise' && activeKind !== 'location') return
    if (activeQuery.length < 2) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const path = activeKind === 'praise' ? '/api/youtube/search' : '/api/locations/search'
        const response = await authenticatedFetch(`${path}?q=${encodeURIComponent(activeQuery)}`)
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.error ?? '검색에 실패했습니다.')
        if (cancelled) return

        if (activeKind === 'praise') {
          setSearchState({ kind: activeKind, query: activeQuery, videos: result?.videos ?? [], locations: [], message: result?.videos?.length ? '' : '검색된 찬양이 없습니다.' })
        } else {
          setSearchState({ kind: activeKind, query: activeQuery, videos: [], locations: result?.locations ?? [], message: result?.locations?.length ? '' : '검색된 지역이 없습니다.' })
        }
      } catch (error) {
        if (!cancelled) setSearchState({ kind: activeKind, query: activeQuery, videos: [], locations: [], message: error instanceof Error ? error.message : '검색에 실패했습니다.' })
      }
    }, 450)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [activeKind, activeQuery])

  const currentSearch =
    (activeKind === 'praise' || activeKind === 'location') &&
    searchState?.kind === activeKind &&
    searchState.query === activeQuery
      ? searchState
      : null

  function focusAt(cursor: number) {
    setSelection({ start: cursor, end: cursor })
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setNativeProps({ selection: { start: cursor, end: cursor } })
    })
  }

  function changeValue(nextValue: string) {
    onChangeText(nextValue)
    onMentionsChange(keepPresentMentions(nextValue, mentions))
  }

  function selectCategory(kind: 'praise' | 'location') {
    if (!activeMention) return
    const prefix = kind === 'praise' ? PRAISE_MENTION_PREFIX : LOCATION_MENTION_PREFIX
    const nextValue = value.slice(0, activeMention.start) + prefix + value.slice(activeMention.end)
    if (nextValue.length > maxLength) return
    changeValue(nextValue)
    focusAt(activeMention.start + prefix.length)
  }

  function insertMention(label: string, mention: ContentMention) {
    if (!activeMention) return
    const trailingSpace = value.slice(activeMention.end).startsWith(' ') ? '' : ' '
    const nextValue = value.slice(0, activeMention.start) + label + trailingSpace + value.slice(activeMention.end)
    if (nextValue.length > maxLength) return
    onChangeText(nextValue)
    onMentionsChange(keepPresentMentions(nextValue, [...mentions, mention]))
    focusAt(activeMention.start + label.length + trailingSpace.length)
  }

  return (
    <View style={[{ position: 'relative', zIndex: 20 }, containerStyle]}>
      <TextInput
        {...props}
        ref={inputRef}
        value={value}
        maxLength={maxLength}
        onChangeText={changeValue}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
        style={style}
      />

      {activeMention ? (
        <View style={{ backgroundColor: colors.surfaceStrong, borderColor: colors.border, borderRadius: 18, borderWidth: 1, elevation: 12, left: 6, maxHeight: 300, overflow: 'hidden', position: 'absolute', right: 6, shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 18, top: '100%' }}>
          {activeMention.kind === 'category' ? (
            <>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '700', paddingHorizontal: 13, paddingBottom: 6, paddingTop: 11 }}>태그 종류를 선택하세요</Text>
              <Pressable onPress={() => selectCategory('praise')} style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong, minHeight: 54, paddingHorizontal: 13, justifyContent: 'center' })}><Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>💿 찬양</Text><Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>YouTube 전체에서 검색</Text></Pressable>
              <Pressable onPress={() => selectCategory('location')} style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong, minHeight: 54, paddingHorizontal: 13, justifyContent: 'center' })}><Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>🏞️ 위치</Text><Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>지역·장소 이름 검색</Text></Pressable>
            </>
          ) : (
            <>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '700', paddingHorizontal: 13, paddingBottom: 7, paddingTop: 11 }}>{activeMention.kind === 'praise' ? '찬양 이름을 2자 이상 입력하세요' : '지역·장소 이름을 2자 이상 입력하세요'}</Text>
              {currentSearch?.message ? <Text style={{ color: colors.textSecondary, fontSize: 12, padding: 13 }}>{currentSearch.message}</Text> : null}
              {(currentSearch?.videos ?? []).map((video) => <Pressable key={video.youtubeId} onPress={() => { const label = getPraiseMentionLabel(video.title); insertMention(label, { type: 'praise', label, youtubeId: video.youtubeId, title: video.title, subtitle: video.channelTitle }) }} style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong, minHeight: 54, paddingHorizontal: 13, paddingVertical: 8, justifyContent: 'center' })}><Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>💿 {video.title}</Text><Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{video.channelTitle}</Text></Pressable>)}
              {(currentSearch?.locations ?? []).map((location) => <Pressable key={location.id} onPress={() => { const label = getLocationMentionLabel(location.name); insertMention(label, { type: 'location', label, placeId: location.id, name: location.name, address: location.address }) }} style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong, minHeight: 54, paddingHorizontal: 13, paddingVertical: 8, justifyContent: 'center' })}><Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>🏞️ {location.name}</Text><Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{location.address}</Text></Pressable>)}
            </>
          )}
        </View>
      ) : null}
    </View>
  )
}
