import { ReactNode } from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'
import { router } from 'expo-router'
import {
  getPraiseMentionLabel,
  type PraiseMentionTrack,
} from '@/lib/praiseMention'
import { useAppTheme } from '@/constants/design'

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function PraiseMentionText({
  content,
  tracks,
  style,
}: {
  content: string
  tracks: PraiseMentionTrack[]
  style?: StyleProp<TextStyle>
}) {
  const colors = useAppTheme()
  const labelToTrack = new Map(
    tracks.map((track) => [getPraiseMentionLabel(track.title), track])
  )
  const labels = Array.from(labelToTrack.keys()).sort(
    (left, right) => right.length - left.length
  )
  const parts: ReactNode[] = []

  if (!labels.length) return <Text style={style}>{content}</Text>

  const pattern = new RegExp(`(${labels.map(escapePattern).join('|')})`, 'g')

  content.split(pattern).forEach((part, index) => {
    const track = labelToTrack.get(part)

    parts.push(
      track ? (
        <Text
          key={`${track.youtube_id}-${index}`}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/(tabs)/praise', params: { track: track.youtube_id } })}
          style={{ color: colors.brand, fontWeight: '800', textDecorationLine: 'underline' }}
        >
          {part}
        </Text>
      ) : part
    )
  })

  return <Text style={style}>{parts}</Text>
}
