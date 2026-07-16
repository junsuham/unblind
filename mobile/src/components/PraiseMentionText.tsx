import { ReactNode } from 'react'
import { Linking, StyleProp, Text, TextStyle } from 'react-native'
import { router } from 'expo-router'
import { getLocationMapUrl, getPraiseMentionLabel, type ContentMention, type PraiseMentionTrack } from '@/lib/praiseMention'
import { useAppTheme } from '@/constants/design'

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function PraiseMentionText({ content, mentions = [], tracks = [], style }: { content: string; mentions?: ContentMention[] | null; tracks?: PraiseMentionTrack[]; style?: StyleProp<TextStyle> }) {
  const colors = useAppTheme()
  const mentionByLabel = new Map<string, ContentMention>()

  for (const track of tracks) {
    const label = getPraiseMentionLabel(track.title)
    mentionByLabel.set(label, { type: 'praise', label, youtubeId: track.youtube_id, title: track.title, subtitle: track.artist })
  }
  for (const mention of mentions ?? []) mentionByLabel.set(mention.label, mention)

  const labels = Array.from(mentionByLabel.keys()).filter((label) => content.includes(label)).sort((a, b) => b.length - a.length)
  if (!labels.length) return <Text style={style}>{content}</Text>

  const pattern = new RegExp(`(${labels.map(escapePattern).join('|')})`, 'g')
  const parts: ReactNode[] = []

  content.split(pattern).forEach((part, index) => {
    const mention = mentionByLabel.get(part)
    parts.push(mention ? (
      <Text key={`${mention.type}-${mention.label}-${index}`} accessibilityRole="link" onPress={() => mention.type === 'praise' ? router.push({ pathname: '/(tabs)/praise', params: { track: mention.youtubeId } }) : Linking.openURL(getLocationMapUrl(mention.placeId))} style={{ color: colors.brand, fontWeight: '800', textDecorationLine: 'underline' }}>{part}</Text>
    ) : part)
  })

  return <Text style={style}>{parts}</Text>
}
