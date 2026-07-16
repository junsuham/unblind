import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import { useAppTheme } from '@/constants/design'
import { supabase } from '@/lib/supabase'
import {
  getActivePraiseMention,
  getPraiseMentionLabel,
  type PraiseMentionTrack,
} from '@/lib/praiseMention'

type PraiseMentionInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'style'
> & {
  value: string
  onChangeText: (value: string) => void
  containerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<TextStyle>
}

export function PraiseMentionInput({
  value,
  onChangeText,
  maxLength = 2000,
  containerStyle,
  style,
  ...props
}: PraiseMentionInputProps) {
  const colors = useAppTheme()
  const inputRef = useRef<TextInput>(null)
  const [tracks, setTracks] = useState<PraiseMentionTrack[]>([])
  const [selection, setSelection] = useState({ start: value.length, end: value.length })
  const activeMention = getActivePraiseMention(value, selection.start)

  useEffect(() => {
    supabase
      .from('top100_tracks')
      .select('youtube_id, title, artist')
      .eq('is_active', true)
      .order('rank')
      .limit(100)
      .then(({ data }) => setTracks(data ?? []))
  }, [])

  const suggestions = useMemo(() => {
    if (!activeMention) return []

    return tracks
      .filter((track) => {
        if (!activeMention.query) return true
        return `${track.title} ${track.artist}`
          .toLocaleLowerCase('ko-KR')
          .includes(activeMention.query)
      })
      .slice(0, 5)
  }, [activeMention, tracks])

  function selectTrack(track: PraiseMentionTrack) {
    if (!activeMention) return

    const label = getPraiseMentionLabel(track.title)
    const nextValue =
      value.slice(0, activeMention.start) +
      label +
      value.slice(activeMention.end)

    if (nextValue.length > maxLength) return

    const nextCursor = activeMention.start + label.length
    onChangeText(nextValue)
    setSelection({ start: nextCursor, end: nextCursor })
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setNativeProps({
        selection: { start: nextCursor, end: nextCursor },
      })
    })
  }

  return (
    <View style={[{ position: 'relative', zIndex: 20 }, containerStyle]}>
      <TextInput
        {...props}
        ref={inputRef}
        value={value}
        maxLength={maxLength}
        onChangeText={onChangeText}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
        style={style}
      />

      {activeMention && suggestions.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surfaceStrong,
            borderColor: colors.border,
            borderRadius: 18,
            borderWidth: 1,
            elevation: 12,
            left: 6,
            overflow: 'hidden',
            position: 'absolute',
            right: 6,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 18,
            top: '100%',
          }}
        >
          <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '700', paddingHorizontal: 13, paddingBottom: 7, paddingTop: 11 }}>
            찬양 선택 · 제목 또는 아티스트 검색
          </Text>
          {suggestions.map((track) => (
            <Pressable
              key={track.youtube_id}
              onPress={() => selectTrack(track)}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? colors.surfaceMuted : colors.surfaceStrong,
                flexDirection: 'row',
                gap: 10,
                minHeight: 52,
                paddingHorizontal: 13,
                paddingVertical: 8,
              })}
            >
              <Text style={{ fontSize: 18 }}>💿</Text>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{track.title}</Text>
                <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{track.artist}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}
